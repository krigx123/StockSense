// Small inline icon components (ported 1:1 from the vanilla prototype's SVG strings)
export const Icon = {
  plus: () => <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg>,
  search: () => <svg viewBox="0 0 20 20"><circle cx="8.8" cy="8.8" r="5.8"/><path d="m13 13 4 4"/></svg>,
  filter: () => <svg viewBox="0 0 20 20"><path d="M3 5h14M5.5 10h9M8 15h4"/></svg>,
  arrow: () => <svg viewBox="0 0 20 20"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>,
  dots: () => <svg viewBox="0 0 20 20"><circle cx="4" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="16" cy="10" r="1"/></svg>,
  box: () => <svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>,
  down: () => <svg viewBox="0 0 20 20"><path d="M10 3v13m-5-5 5 5 5-5"/></svg>,
  up: () => <svg viewBox="0 0 20 20"><path d="M10 17V4m-5 5 5-5 5 5"/></svg>,
  move: () => <svg viewBox="0 0 24 24"><path d="M7 7h13m-4-4 4 4-4 4M17 17H4m4 4-4-4 4-4"/></svg>,
  receipt: () => <svg viewBox="0 0 24 24"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>,
  delivery: () => <svg viewBox="0 0 24 24"><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z"/><circle cx="7.5" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>,
  adjust: () => <svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/></svg>,
};

export function OpIcon({ type }) {
  const map = { Receipt: Icon.receipt, Delivery: Icon.delivery, Transfer: Icon.move };
  const C = map[type] || Icon.adjust;
  return <C />;
}
