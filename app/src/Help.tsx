/**
 * Help & tour (design/handoff-2 §Help & first-run tour): 250px TOC |
 * reader (max-width 660px) | 340px tour rail. Content comes from
 * docs/USER_GUIDE.md (bundled via `?raw`), split into sections at every
 * h1/h2 heading. CLI code blocks render as the info-accented card.
 *
 * The tour rail explains the first-run tour and replays it; the tour
 * itself (FirstRunOverlay) anchors beside the real nav rail.
 */
import { useEffect, useMemo, useState } from "react";
import guideSource from "../../docs/USER_GUIDE_DE.md?raw";
import {
  parseMarkdown,
  splitSections,
  type Block,
  type InlineSpan,
} from "./lib/markdown";
import { TOUR_STEPS } from "./lib/tour";

interface HelpProps {
  onClose: () => void;
  /** Close Help and restart the first-run tour beside the rail. */
  onReplayTour?: () => void;
}

/**
 * Mono sub-line under each section title: surface · shortcut · CLI
 * equivalent — only where one actually applies (no invented hints).
 */
const SECTION_META: Record<string, string> = {
  "Kibitz – Deutsche Bedienungsanleitung": "ALLE FUNKTIONEN · ESC SCHLIESST DIE HILFE",
  "Oberfläche und Navigation": "NAVIGATION · STATUSANZEIGE",
  "Partieansicht": "SCHACHBRETT · PFEILTASTEN · F DREHEN · E ERKLÄREN",
  "Partiedatenbank": "PARTIEN · FILTER · SUCHEN",
  "Training": "ERÖFFNUNGEN · TAKTIK · ENDSPIELE",
  "Daten importieren und abgleichen": "PGN · SCID · TWIC · KONTEN",
  "Einstellungen": "DARSTELLUNG · ENGINE · DATEN",
};

function Spans({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((s, i) =>
        s.code ? (
          <code key={i}>{s.text}</code>
        ) : s.bold ? (
          <strong key={i}>{s.text}</strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "heading": {
      const Tag = (["h1", "h2", "h3", "h4"] as const)[block.level - 1];
      return (
        <Tag>
          <Spans spans={block.spans} />
        </Tag>
      );
    }
    case "para":
      return (
        <p>
          <Spans spans={block.spans} />
        </p>
      );
    case "code":
      // The info-accented CLI card (inset 2px 0 0 var(--info)).
      return (
        <div className="help-cli">
          <pre>{block.text}</pre>
        </div>
      );
    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i}>
          <Spans spans={item} />
        </li>
      ));
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "figure":
      return (
        <figure className="help-figure">
          <img src={block.src} alt={block.alt} loading="lazy" />
          <figcaption>{block.alt}</figcaption>
        </figure>
      );
    case "rule":
      return <hr />;
  }
}

/** In-app user guide + tour rail, over the shell (Escape closes). */
export default function Help({ onClose, onReplayTour }: HelpProps) {
  const sections = useMemo(() => splitSections(parseMarkdown(guideSource)), []);
  const [active, setActive] = useState(0);
  const section = sections[active];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="help-screen">
      <header className="header-bar help-topbar">
        <div className="header-title-block">
          <div className="header-title-row">
            <span className="header-title">Hilfe</span>
          </div>
          <div className="header-meta">
            Deutsche Bedienungsanleitung · Funktionen und Tastatur
          </div>
        </div>
        <div className="header-actions">
          {onReplayTour && (
            <button className="btn-secondary" onClick={onReplayTour}>
              Einführung erneut anzeigen
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </header>
      <div className="help-cols">
        {/* ---- TOC (250px) ---- */}
        <nav className="help-toc">
          <div className="col-label">BEDIENUNGSANLEITUNG</div>
          {sections.map((s, i) => (
            <button
              key={s.title + i}
              className={`help-toc-item${i === active ? " active" : ""}`}
              onClick={() => setActive(i)}
            >
              {s.title}
            </button>
          ))}
        </nav>

        {/* ---- reader ---- */}
        <div className="help-reader">
          {section && (
            <article className="help-article">
              <h2 className="help-title">{section.title}</h2>
              {SECTION_META[section.title] && (
                <div className="help-subline">
                  {SECTION_META[section.title]}
                </div>
              )}
              {section.blocks.map((b, i) => (
                <BlockView key={i} block={b} />
              ))}
            </article>
          )}
        </div>

        {/* ---- tour rail (340px) ---- */}
        <aside className="help-tour-rail">
          <div className="tour-card">
            <div className="tour-card-head">
              <span className="tour-tag">EINFÜHRUNG</span>
              <span className="flex-spacer" />
              <span className="tour-count">{TOUR_STEPS.length} Schritte</span>
            </div>
            <p className="tour-body">
              In sechs Schritten lernst du <b>Partien</b>, <b>Analyse</b>, <b>Training</b>,
              <b>Datenverwaltung</b> sowie Einstellungen und Hilfe kennen.
            </p>
            {onReplayTour && (
              <div className="tour-actions">
                <button className="btn-primary" onClick={onReplayTour}>
                  Einführung wiederholen
                </button>
              </div>
            )}
          </div>
          <p className="tour-rail-note">
            Die Einführung erscheint neben der Navigation und verdeckt keine Bedienelemente.
            Du kannst sie hier jederzeit erneut starten.
          </p>
        </aside>
      </div>
    </div>
  );
}
