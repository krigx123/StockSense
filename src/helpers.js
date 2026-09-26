export const fmt = (n) => new Intl.NumberFormat('en-US').format(n);

export const dateLabel = (v) => {
  const d = new Date(v + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const ago = (v) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 60000));
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} days ago`;
};

export const initials = (v) => v.split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

export const total = (p) => Object.values(p.locations).reduce((a, b) => a + b, 0);
export const allStock = (products) => products.reduce((n, p) => n + total(p), 0);
export const lowProducts = (products) => products.filter((p) => total(p) > 0 && total(p) <= p.reorder);
export const outProducts = (products) => products.filter((p) => total(p) === 0);
export const lowCount = (products) => lowProducts(products).length + outProducts(products).length;

export const stockTone = (p) => {
  const n = total(p);
  return n === 0 ? 'out' : n <= p.reorder ? 'low' : 'healthy';
};
export const stockStatus = (p) => {
  const n = total(p);
  return n === 0 ? 'Out of stock' : n <= p.reorder ? 'Low stock' : 'In stock';
};
export const kindClass = (s) => s.toLowerCase().replaceAll(' ', '-');
export const opClass = (t) => t.toLowerCase();

export const baseOpType = (t) => t.replace(' in', '').replace(' out', '');

export function exportCSV(filename, headers, rows) {
  const quote = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(quote).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const emptyFilters = () => ({
  query: '', category: 'All categories', warehouse: 'All locations', status: 'All statuses', type: 'All types',
});
