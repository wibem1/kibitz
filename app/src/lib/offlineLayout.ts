/** Offline-play board dimensions. The normal GameView uses its own resize logic.
 * Keep the opponent panel visible beside the board on desktop, and never
 * make the board smaller than the shared Chessground minimum.
 */
export function offlineBoardSize(windowWidth: number, windowHeight: number): number {
  const widthReserve = windowWidth >= 1140 ? 204 + 340 + 70 : 204 + 52;
  const available = Math.min(windowWidth - widthReserve, windowHeight - 195);
  return Math.max(496, Math.min(720, Math.floor(available / 8) * 8));
}
