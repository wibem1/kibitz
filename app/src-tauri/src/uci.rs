//! UCI subprocess manager (Phase 0 spike).
//!
//! Spawns a UCI engine (Stockfish) as a child process, speaks the UCI line
//! protocol over stdin/stdout via tokio, and parses `info` / `bestmove`
//! output into typed structs. This module is deliberately self-contained:
//! it is the seed of the engine job-queue manager described in
//! docs/ARCHITECTURE.md and must stay free of Tauri types.
//!
//! Product principle (CLAUDE.md #6): nothing in this module starts an engine
//! on its own; callers (UI commands, later the job queue) decide when to run.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use std::{
    collections::HashMap,
    hash::{BuildHasher, Hasher},
    time::{SystemTime, UNIX_EPOCH},
};

use cozy_chess::{Board, Move, Piece};
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader, Lines};
use tokio::process::{Child, ChildStdin, ChildStdout, Command};
use tokio::sync::Mutex;

/// Default node budget for an analysis run (`go nodes N`).
pub const DEFAULT_NODES: u64 = 2_000_000;

/// Relative path (from the repo root) of the bundled dev engine binary.
const REPO_ENGINE_RELPATH: &str = "tools/stockfish/stockfish-macos-m1-apple-silicon";

/// One parsed UCI `info` line. Field names are serialized in camelCase to
/// match the TypeScript `EngineInfo` interface (app/src/lib/engineView.ts).
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UciInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub depth: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seldepth: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub multipv: Option<u32>,
    /// Centipawn score, side-to-move POV (UCI convention).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub score_cp: Option<i32>,
    /// Mate in N (negative: getting mated), side-to-move POV.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub score_mate: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nodes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nps: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_ms: Option<u64>,
    /// Principal variation as UCI move strings.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pv: Option<Vec<String>>,
    /// Maia-2 probability for the first move in this PV, when supplied by the engine.
    #[serde(skip)]
    pub move_probability: Option<f64>,
}

impl UciInfo {
    /// True if this line carries an evaluation worth showing (filters out
    /// `currmove` progress lines and `info string` chatter).
    pub fn has_score(&self) -> bool {
        self.score_cp.is_some() || self.score_mate.is_some()
    }
}

/// Parsed `bestmove` line.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BestMove {
    pub bestmove: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ponder: Option<String>,
}

/// Position to analyze, mapping onto the UCI `position` command.
#[derive(Debug, Clone)]
pub enum UciPosition {
    Startpos,
    Fen(String),
}

impl UciPosition {
    fn to_command(&self) -> String {
        match self {
            UciPosition::Startpos => "position startpos".to_owned(),
            UciPosition::Fen(fen) => format!("position fen {fen}"),
        }
    }
}

/// Parse a single UCI `info` line. Returns `None` for non-info lines.
///
/// Recognized tokens: depth, seldepth, multipv, score cp|mate (ignoring
/// lowerbound/upperbound qualifiers), nodes, nps, time, pv (rest of line).
pub fn parse_info_line(line: &str) -> Option<UciInfo> {
    let mut tokens = line.split_whitespace();
    if tokens.next()? != "info" {
        return None;
    }
    let mut info = UciInfo::default();
    let mut saw_field = false;
    while let Some(tok) = tokens.next() {
        match tok {
            "depth" => info.depth = tokens.next().and_then(|v| v.parse().ok()),
            "seldepth" => info.seldepth = tokens.next().and_then(|v| v.parse().ok()),
            "multipv" => info.multipv = tokens.next().and_then(|v| v.parse().ok()),
            "score" => match tokens.next() {
                Some("cp") => info.score_cp = tokens.next().and_then(|v| v.parse().ok()),
                Some("mate") => info.score_mate = tokens.next().and_then(|v| v.parse().ok()),
                _ => {}
            },
            "nodes" => info.nodes = tokens.next().and_then(|v| v.parse().ok()),
            "nps" => info.nps = tokens.next().and_then(|v| v.parse().ok()),
            "time" => info.time_ms = tokens.next().and_then(|v| v.parse().ok()),
            "pv" => {
                let mut pv = Vec::new();
                while let Some(value) = tokens.next() {
                    if value == "string" {
                        info.move_probability = parse_move_probability(&mut tokens);
                        break;
                    }
                    pv.push(value.to_owned());
                }
                info.pv = Some(pv);
                saw_field = true;
                break;
            }
            "string" => {
                info.move_probability = parse_move_probability(&mut tokens);
                saw_field |= info.move_probability.is_some();
                break;
            }
            _ => continue,
        }
        saw_field = true;
    }
    if saw_field {
        Some(info)
    } else {
        None
    }
}

fn parse_move_probability(tokens: &mut std::str::SplitWhitespace<'_>) -> Option<f64> {
    while let Some(token) = tokens.next() {
        if token == "move_prob" {
            return tokens.next().and_then(|value| value.parse().ok());
        }
    }
    None
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaiaPriorMove {
    pub from: String,
    pub to: String,
}

#[derive(Debug, Clone)]
struct MaiaCandidate {
    uci: String,
    probability: f64,
    mv: Move,
}

pub fn select_maia_move(
    fen: &str,
    infos: &[UciInfo],
    plies: usize,
    recent_own_moves: &[MaiaPriorMove],
) -> Result<String, String> {
    let board: Board = fen
        .parse()
        .map_err(|_| "Maia-Zugauswahl: ungültige FEN".to_owned())?;
    let mut by_uci: HashMap<String, MaiaCandidate> = HashMap::new();
    for info in infos {
        let Some(probability) = info.move_probability else {
            continue;
        };
        if !probability.is_finite() || probability <= 0.0 {
            continue;
        }
        let Some(uci) = info.pv.as_ref().and_then(|pv| pv.first()) else {
            continue;
        };
        let Ok(mv) = uci.parse::<Move>() else {
            continue;
        };
        if !board.is_legal(mv) {
            continue;
        }
        by_uci.insert(
            uci.clone(),
            MaiaCandidate {
                uci: uci.clone(),
                probability,
                mv,
            },
        );
    }
    let mut ranked: Vec<MaiaCandidate> = by_uci.into_values().collect();
    ranked.sort_by(|left, right| right.probability.total_cmp(&left.probability));
    if ranked.is_empty() {
        return Err(
            "Maia 2 hat keine gültigen Zugkandidaten mit Modellwahrscheinlichkeit geliefert."
                .to_owned(),
        );
    }
    let in_check = !board.checkers().is_empty();
    let eligible: Vec<MaiaCandidate> = if in_check {
        ranked.clone()
    } else {
        ranked
            .iter()
            .filter(|candidate| {
                let from = candidate.mv.from.to_string();
                let to = candidate.mv.to.to_string();
                let reverses_piece = recent_own_moves
                    .iter()
                    .rev()
                    .find(|previous| previous.to == from)
                    .is_some_and(|previous| previous.from == to);
                !reverses_piece || has_tactical_reason(&board, candidate.mv)
            })
            .cloned()
            .collect()
    };
    let alternatives = if eligible
        .first()
        .is_some_and(|first| first.probability >= 0.015)
    {
        &eligible
    } else {
        &ranked
    };
    let early = plies < 30;
    let probability_floor = if early { 0.18 } else { 0.08 };
    let limit = if early { 4 } else { 8 };
    let best = alternatives[0].probability;
    let shortlist: Vec<&MaiaCandidate> = alternatives
        .iter()
        .filter(|candidate| candidate.probability >= best * probability_floor)
        .take(limit)
        .collect();
    let total: f64 = shortlist
        .iter()
        .map(|candidate| candidate.probability)
        .sum();
    let mut roll = random_unit_sample() * total;
    for candidate in &shortlist {
        if roll < candidate.probability {
            return Ok(candidate.uci.clone());
        }
        roll -= candidate.probability;
    }
    Ok(shortlist
        .last()
        .expect("non-empty Maia shortlist")
        .uci
        .clone())
}

fn has_tactical_reason(board: &Board, mv: Move) -> bool {
    let opponent = !board.side_to_move();
    let capture = board.colors(opponent).contains(mv.to)
        || (board.piece_on(mv.from) == Some(Piece::Pawn)
            && board.en_passant() == Some(mv.to.file())
            && mv.from.file() != mv.to.file());
    let mut after = board.clone();
    after.play(mv);
    capture || !after.checkers().is_empty() || square_attacked_by_opponent(board, mv.from)
}

fn square_attacked_by_opponent(board: &Board, square: cozy_chess::Square) -> bool {
    let Some(opponent_board) = board.null_move() else {
        return false;
    };
    let mut legal_moves = Vec::new();
    opponent_board.generate_moves(|moves| {
        legal_moves.extend(moves);
        false
    });
    legal_moves.iter().any(|mv| mv.to == square)
}

fn random_unit_sample() -> f64 {
    let state = std::collections::hash_map::RandomState::new();
    let mut hasher = state.build_hasher();
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    hasher.write(&nanos.to_le_bytes());
    (hasher.finish() as f64 / (u64::MAX as f64 + 1.0)).clamp(0.0, 1.0 - f64::EPSILON)
}

/// Parse a UCI `id name <name>` handshake line. Returns `None` for
/// anything else (including a bare "id name" with no value).
pub fn parse_id_name(line: &str) -> Option<&str> {
    line.trim()
        .strip_prefix("id name")
        .map(str::trim)
        .filter(|s| !s.is_empty())
}

/// Engine identity from a `uci` handshake (Settings' engine manager).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineIdentity {
    /// The binary actually spoken to (after resolution).
    pub path: String,
    /// The engine's `id name` line ("Stockfish 17.1"); None when the
    /// binary completed the handshake without sending one.
    pub name: Option<String>,
}

fn engine_command(path: &Path) -> Command {
    let mut command = Command::new(path);
    #[cfg(windows)]
    command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    command
}

/// Spawn `path`, run the `uci` → `uciok` handshake capturing the `id name`
/// line, then quit. This validates a user-picked binary WITHOUT starting
/// any search — an explicit Settings action, not a background engine run.
pub async fn identify(path: &Path) -> Result<EngineIdentity, String> {
    let mut child = engine_command(path)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("Failed to spawn engine {}: {e}", path.display()))?;
    let mut stdin = child
        .stdin
        .take()
        .ok_or_else(|| "Engine stdin unavailable".to_owned())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Engine stdout unavailable".to_owned())?;
    // A process that exits before accepting "uci" (broken pipe) has
    // already answered the question — platform timing decides whether
    // that surfaces here or as closed stdout below, so both paths must
    // carry the same verdict.
    stdin
        .write_all(b"uci\n")
        .await
        .map_err(|e| format!("Engine rejected the handshake ({e}) — not a UCI engine?"))?;
    stdin
        .flush()
        .await
        .map_err(|e| format!("Engine rejected the handshake ({e}) — not a UCI engine?"))?;

    let mut lines = BufReader::new(stdout).lines();
    let handshake = async {
        let mut name: Option<String> = None;
        while let Some(line) = lines
            .next_line()
            .await
            .map_err(|e| format!("Engine read error: {e}"))?
        {
            if let Some(n) = parse_id_name(&line) {
                name = Some(n.to_owned());
            }
            if line.trim() == "uciok" {
                return Ok(name);
            }
        }
        Err("Engine closed stdout before 'uciok' — not a UCI engine?".to_owned())
    };
    let name = tokio::time::timeout(Duration::from_secs(10), handshake)
        .await
        .map_err(|_| "Timed out waiting for 'uciok' — not a UCI engine?".to_owned())??;
    let _ = stdin.write_all(b"quit\n").await;
    let _ = stdin.flush().await;
    Ok(EngineIdentity {
        path: path.display().to_string(),
        name,
    })
}

/// Parse a `bestmove <move> [ponder <move>]` line. Returns `None` otherwise.
pub fn parse_bestmove_line(line: &str) -> Option<BestMove> {
    let mut tokens = line.split_whitespace();
    if tokens.next()? != "bestmove" {
        return None;
    }
    let bestmove = tokens.next()?.to_owned();
    let ponder = match (tokens.next(), tokens.next()) {
        (Some("ponder"), Some(m)) => Some(m.to_owned()),
        _ => None,
    };
    Some(BestMove { bestmove, ponder })
}

/// Resolve which engine binary to use. Priority (first hit wins):
///
/// 1. Explicit user-set path (persisted in the UI). If set but missing,
///    this is a hard error — an explicit choice is never silently ignored.
/// 2. `KIBITZ_STOCKFISH` environment variable (skipped if stale/missing).
/// 3. Repo-local Apple Silicon dev binary, only on macOS ARM64.
///    It must not be auto-selected on Intel macOS, Linux or Windows.
/// 4. `stockfish` on `PATH` (including Intel macOS).
///
/// The repository's bundled development binary targets Apple Silicon.
/// Using it as the default on Intel Macs or other operating systems
/// would produce an unusable engine even though the file exists.
fn use_repo_apple_silicon_binary() -> bool {
    cfg!(all(target_os = "macos", target_arch = "aarch64"))
}

pub fn resolve_engine_path(user_path: Option<&str>) -> Result<PathBuf, String> {
    if let Some(p) = user_path.map(str::trim).filter(|p| !p.is_empty()) {
        let path = PathBuf::from(p);
        return if path.is_file() {
            Ok(path)
        } else {
            Err(format!("Configured engine path does not exist: {p}"))
        };
    }
    if let Some(p) = std::env::var_os("KIBITZ_STOCKFISH") {
        let path = PathBuf::from(p);
        if path.is_file() {
            return Ok(path);
        }
    }
    let mut roots: Vec<PathBuf> = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        roots.push(cwd);
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            roots.push(dir.to_path_buf());
        }
    }
    if use_repo_apple_silicon_binary() {
        for root in &roots {
            for dir in root.ancestors() {
                let candidate = dir.join(REPO_ENGINE_RELPATH);
                if candidate.is_file() {
                    return Ok(candidate);
                }
            }
        }
    }
    if let Some(paths) = std::env::var_os("PATH") {
        // Windows binaries carry .exe; check both spellings everywhere so
        // a PATH-installed engine resolves on every platform.
        for dir in std::env::split_paths(&paths) {
            for name in ["stockfish", "stockfish.exe"] {
                let candidate = dir.join(name);
                if candidate.is_file() {
                    return Ok(candidate);
                }
            }
        }
    }
    // macOS GUI applications started from Finder often inherit a minimal PATH
    // without Homebrew/MacPorts directories. Probe the standard installed
    // locations directly, rather than requiring a Terminal launch.
    #[cfg(target_os = "macos")]
    for candidate in [
        "/usr/local/bin/stockfish",    // Homebrew on Intel Macs
        "/opt/homebrew/bin/stockfish", // Homebrew on Apple Silicon
        "/opt/local/bin/stockfish",    // MacPorts
        "/usr/local/opt/stockfish/bin/stockfish",
        "/opt/homebrew/opt/stockfish/bin/stockfish",
    ] {
        let path = PathBuf::from(candidate);
        if path.is_file() {
            return Ok(path);
        }
    }
    Err(
        "No Stockfish binary found. Set an engine path in the UI, set KIBITZ_STOCKFISH, \
         or install stockfish on PATH."
            .to_owned(),
    )
}

/// Cloneable handle that can interrupt a running search out-of-band
/// (writes `stop` to the engine's stdin without waiting for the search lock).
#[derive(Clone)]
pub struct StopHandle {
    stdin: Arc<Mutex<ChildStdin>>,
}

impl StopHandle {
    /// Ask the engine to end the current search; it will reply `bestmove`.
    pub async fn stop(&self) -> Result<(), String> {
        let mut stdin = self.stdin.lock().await;
        stdin
            .write_all(b"stop\n")
            .await
            .map_err(|e| format!("Failed to send stop: {e}"))?;
        stdin
            .flush()
            .await
            .map_err(|e| format!("Failed to flush stop: {e}"))
    }
}

/// A running UCI engine process after a successful `uci`/`isready` handshake.
pub struct Engine {
    path: PathBuf,
    _child: Child,
    stdin: Arc<Mutex<ChildStdin>>,
    lines: Lines<BufReader<ChildStdout>>,
}

impl Engine {
    /// Spawn `path`, perform the `uci` → `uciok` and `isready` → `readyok`
    /// handshake (10s timeout), and return a ready engine.
    pub async fn spawn(path: &Path) -> Result<Self, String> {
        let mut child = engine_command(path)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| format!("Failed to spawn engine {}: {e}", path.display()))?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "Engine stdin unavailable".to_owned())?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Engine stdout unavailable".to_owned())?;
        let mut engine = Engine {
            path: path.to_path_buf(),
            _child: child,
            stdin: Arc::new(Mutex::new(stdin)),
            lines: BufReader::new(stdout).lines(),
        };
        engine.send("uci").await?;
        engine.wait_for("uciok", Duration::from_secs(10)).await?;
        engine.send("isready").await?;
        engine.wait_for("readyok", Duration::from_secs(10)).await?;
        Ok(engine)
    }

    /// Configure Stockfish's built-in Elo limiter before a local game move.
    /// Analysis and other UCI clients remain unaffected.
    pub async fn set_stockfish_elo(&mut self, elo: u32) -> Result<(), String> {
        if !(1320..=3190).contains(&elo) {
            return Err("Ungültige Stockfish-Spielstärke".to_owned());
        }
        self.send("setoption name UCI_LimitStrength value true")
            .await?;
        self.send(&format!("setoption name UCI_Elo value {elo}"))
            .await?;
        self.send("isready").await?;
        self.wait_for("readyok", Duration::from_secs(10)).await
    }

    /// The binary path this engine was spawned from.
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Handle for interrupting a search from another task.
    pub fn stop_handle(&self) -> StopHandle {
        StopHandle {
            stdin: Arc::clone(&self.stdin),
        }
    }

    /// Write one UCI command line to the engine.
    pub async fn send(&self, cmd: &str) -> Result<(), String> {
        let mut stdin = self.stdin.lock().await;
        stdin
            .write_all(format!("{cmd}\n").as_bytes())
            .await
            .map_err(|e| format!("Failed to send '{cmd}': {e}"))?;
        stdin
            .flush()
            .await
            .map_err(|e| format!("Failed to flush '{cmd}': {e}"))
    }

    /// Read stdout lines until one equals `expected` (or timeout).
    async fn wait_for(&mut self, expected: &str, timeout: Duration) -> Result<(), String> {
        let fut = async {
            while let Some(line) = self
                .lines
                .next_line()
                .await
                .map_err(|e| format!("Engine read error: {e}"))?
            {
                if line.trim() == expected {
                    return Ok(());
                }
            }
            Err(format!("Engine closed stdout before '{expected}'"))
        };
        tokio::time::timeout(timeout, fut)
            .await
            .map_err(|_| format!("Timed out waiting for '{expected}'"))?
    }

    /// Run a search on `position`, invoking `on_info` for every parsed
    /// `info` line, until the engine reports `bestmove`. `nodes: Some(n)`
    /// runs `go nodes n`; `None` runs `go infinite` — which ends ONLY via
    /// [`Engine::stop_handle`] (live analysis, a deliberate user action).
    ///
    /// Either way the search can be interrupted early; the engine then
    /// emits `bestmove` promptly and this returns normally.
    pub async fn analyze(
        &mut self,
        position: &UciPosition,
        nodes: Option<u64>,
        mut on_info: impl FnMut(UciInfo),
    ) -> Result<BestMove, String> {
        self.send(&position.to_command()).await?;
        match nodes {
            Some(n) => self.send(&format!("go nodes {n}")).await?,
            None => self.send("go infinite").await?,
        }
        while let Some(line) = self
            .lines
            .next_line()
            .await
            .map_err(|e| format!("Engine read error: {e}"))?
        {
            if let Some(best) = parse_bestmove_line(&line) {
                return Ok(best);
            }
            if let Some(info) = parse_info_line(&line) {
                on_info(info);
            }
        }
        Err("Engine closed stdout during search".to_owned())
    }

    /// Politely shut the engine down (`quit`); the process is also killed on
    /// drop as a backstop (`kill_on_drop`).
    pub async fn quit(self) {
        let _ = self.send("quit").await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_full_info_line() {
        let line = "info depth 20 seldepth 28 multipv 1 score cp 34 nodes 1234567 \
                    nps 2500000 hashfull 120 tbhits 0 time 494 pv e2e4 e7e5 g1f3";
        let info = parse_info_line(line).expect("should parse");
        assert_eq!(info.depth, Some(20));
        assert_eq!(info.seldepth, Some(28));
        assert_eq!(info.multipv, Some(1));
        assert_eq!(info.score_cp, Some(34));
        assert_eq!(info.score_mate, None);
        assert_eq!(info.nodes, Some(1_234_567));
        assert_eq!(info.nps, Some(2_500_000));
        assert_eq!(info.time_ms, Some(494));
        assert_eq!(
            info.pv.as_deref(),
            Some(&["e2e4".to_owned(), "e7e5".to_owned(), "g1f3".to_owned()][..])
        );
        assert!(info.has_score());
    }

    #[test]
    fn parses_maia_probability_after_principal_variation() {
        let info = parse_info_line("info depth 8 multipv 2 score cp 41 nodes 8 pv d1e2 d8e7 string move_prob 0.1305 winprob 0.5590").unwrap();
        assert_eq!(info.multipv, Some(2));
        assert_eq!(info.move_probability, Some(0.1305));
        assert_eq!(
            info.pv.as_deref(),
            Some(&["d1e2".to_owned(), "d8e7".to_owned()][..])
        );
    }

    fn maia_candidate(uci: &str, probability: f64) -> UciInfo {
        UciInfo {
            pv: Some(vec![uci.to_owned()]),
            move_probability: Some(probability),
            ..UciInfo::default()
        }
    }

    #[test]
    fn maia_opening_filter_rejects_very_rare_candidate() {
        let fen = "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1";
        let candidates = [
            maia_candidate("g8f6", 0.461576),
            maia_candidate("b8c6", 0.124565),
            maia_candidate("d7d5", 0.092104),
            maia_candidate("b8a6", 0.012652),
        ];
        for _ in 0..30 {
            assert_ne!(select_maia_move(fen, &candidates, 1, &[]).unwrap(), "b8a6");
        }
    }

    #[test]
    fn maia_policy_avoids_unmotivated_piece_reversal() {
        let fen = "r1bqkbnr/pppppppp/2n5/8/3P4/4P3/PPP2PPP/RNBQKBNR b KQkq - 0 2";
        let candidates = [
            maia_candidate("c6b8", 0.87),
            maia_candidate("g8f6", 0.053),
            maia_candidate("d7d5", 0.032),
            maia_candidate("e7e6", 0.007),
        ];
        let history = [MaiaPriorMove {
            from: "b8".into(),
            to: "c6".into(),
        }];
        for _ in 0..30 {
            assert_ne!(
                select_maia_move(fen, &candidates, 4, &history).unwrap(),
                "c6b8"
            );
        }
    }

    #[test]
    fn maia_policy_keeps_tactically_motivated_reversal() {
        let fen = "r1bqkbnr/pppppppp/2n5/1B6/3P4/4P3/PPP2PPP/RN1QKBNR b KQkq - 0 2";
        let candidates = [maia_candidate("c6b8", 0.90), maia_candidate("g8f6", 0.10)];
        let history = [MaiaPriorMove {
            from: "b8".into(),
            to: "c6".into(),
        }];
        assert_eq!(
            select_maia_move(fen, &candidates, 4, &history).unwrap(),
            "c6b8"
        );
    }

    #[test]
    fn parses_mate_score_with_bound() {
        let info = parse_info_line("info depth 12 score mate -3 lowerbound nodes 999 pv h7h8q")
            .expect("should parse");
        assert_eq!(info.score_mate, Some(-3));
        assert_eq!(info.score_cp, None);
        assert!(info.has_score());
    }

    #[test]
    fn currmove_lines_have_no_score() {
        let info =
            parse_info_line("info depth 15 currmove e2e4 currmovenumber 1").expect("should parse");
        assert!(!info.has_score());
        assert_eq!(info.depth, Some(15));
    }

    #[test]
    fn skips_info_string_and_non_info_lines() {
        assert_eq!(
            parse_info_line("info string NNUE evaluation using nn.nnue"),
            None
        );
        assert_eq!(parse_info_line("id name Stockfish 18"), None);
        assert_eq!(parse_info_line("readyok"), None);
        assert_eq!(parse_info_line(""), None);
    }

    #[test]
    fn parses_bestmove_lines() {
        assert_eq!(
            parse_bestmove_line("bestmove e2e4 ponder e7e5"),
            Some(BestMove {
                bestmove: "e2e4".to_owned(),
                ponder: Some("e7e5".to_owned())
            })
        );
        assert_eq!(
            parse_bestmove_line("bestmove g1f3"),
            Some(BestMove {
                bestmove: "g1f3".to_owned(),
                ponder: None
            })
        );
        assert_eq!(parse_bestmove_line("info depth 1"), None);
    }

    #[test]
    fn position_command_forms() {
        assert_eq!(UciPosition::Startpos.to_command(), "position startpos");
        assert_eq!(
            UciPosition::Fen("8/8/8/8/8/8/8/K1k5 w - - 0 1".into()).to_command(),
            "position fen 8/8/8/8/8/8/8/K1k5 w - - 0 1"
        );
    }

    #[test]
    fn apple_silicon_dev_binary_is_never_selected_on_intel_mac() {
        #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
        assert!(!use_repo_apple_silicon_binary());
        #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
        assert!(use_repo_apple_silicon_binary());
        #[cfg(not(target_os = "macos"))]
        assert!(!use_repo_apple_silicon_binary());
    }

    #[test]
    fn explicit_user_path_must_exist() {
        let err = resolve_engine_path(Some("/definitely/not/a/real/engine")).unwrap_err();
        assert!(err.contains("does not exist"));
    }

    #[test]
    fn parses_id_name_lines_and_rejects_the_rest() {
        assert_eq!(
            parse_id_name("id name Stockfish 17.1"),
            Some("Stockfish 17.1")
        );
        assert_eq!(parse_id_name("  id name Lc0 v0.31  "), Some("Lc0 v0.31"));
        assert_eq!(parse_id_name("id name"), None, "bare tag carries no name");
        assert_eq!(parse_id_name("id author T. Romstad et al."), None);
        assert_eq!(parse_id_name("uciok"), None);
        assert_eq!(parse_id_name(""), None);
    }

    /// `identify` against a fake shell "engine": the handshake captures
    /// `id name` and completes without ever starting a search. The script
    /// fixture is Unix-specific; Windows engine handshakes need a native UCI
    /// test binary and remain part of real-machine acceptance.
    #[cfg(unix)]
    #[tokio::test]
    async fn identify_reads_the_handshake_of_a_scripted_engine() {
        let dir = tempfile::tempdir().unwrap();
        let script = dir.path().join("fake-engine.sh");
        std::fs::write(
            &script,
            "#!/bin/sh\nread _\necho 'id name FakeFish 1.0'\necho 'id author nobody'\necho uciok\nread _\n",
        )
        .unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();
        }
        let id = identify(&script).await.unwrap();
        assert_eq!(id.name.as_deref(), Some("FakeFish 1.0"));
        assert!(id.path.ends_with("fake-engine.sh"));
    }

    /// Exercises the same spawn/handshake/position/go/bestmove UCI path used
    /// by offline play, without requiring a platform-specific Stockfish binary.
    #[cfg(unix)]
    #[tokio::test]
    async fn scripted_engine_returns_a_bounded_bestmove() {
        use std::os::unix::fs::PermissionsExt;

        let dir = tempfile::tempdir().unwrap();
        let script = dir.path().join("uci-test-engine.sh");
        std::fs::write(
            &script,
            r#"#!/bin/sh
while IFS= read -r line; do
  case "$line" in
    uci) printf 'id name TestFish\nuciok\n' ;;
    isready) printf 'readyok\n' ;;
    "position fen "*) position_seen=1 ;;
    "go nodes 1234")
      if [ "$position_seen" = 1 ]; then
        printf 'info depth 1 score cp 12 pv e7e5\nbestmove e7e5\n'
      else
        printf 'bestmove (none)\n'
      fi
      ;;
    quit) exit 0 ;;
  esac
done
"#,
        )
        .unwrap();
        std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();

        let mut engine = Engine::spawn(&script).await.unwrap();
        assert!(engine.set_stockfish_elo(1000).await.is_err());
        engine.set_stockfish_elo(1500).await.unwrap();
        let fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
        let mut infos = Vec::new();
        let result = tokio::time::timeout(
            Duration::from_secs(3),
            engine.analyze(&UciPosition::Fen(fen.to_owned()), Some(1234), |info| {
                infos.push(info);
            }),
        )
        .await
        .expect("UCI response timed out")
        .expect("UCI search failed");
        assert_eq!(result.bestmove, "e7e5");
        assert_eq!(infos.len(), 1);
        assert_eq!(infos[0].score_cp, Some(12));
        engine.quit().await;
    }

    /// A binary that is not a UCI engine fails the handshake with an
    /// honest message instead of hanging (bounded by the timeout; `true`
    /// exits immediately, so this returns fast).
    #[tokio::test]
    async fn identify_rejects_a_non_engine_binary() {
        let non_engine = if cfg!(windows) {
            Path::new(r"C:\Windows\System32\where.exe")
        } else {
            Path::new("/usr/bin/true")
        };
        let err = identify(non_engine).await.unwrap_err();
        assert!(err.contains("not a UCI engine"), "{err}");
    }
}
