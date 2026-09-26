export const nowISO = () => new Date().toISOString();

export function seed() {
  const at = nowISO();
  const products = [
    { id: 'p1', name: 'Oak dining chair', sku: 'FRN-001', category: 'Furniture', unit: 'pcs', reorder: 20, locations: { 'Main Warehouse': 48, 'Production Floor': 12 } },
    { id: 'p2', name: 'Steel tube 25mm', sku: 'MAT-014', category: 'Raw materials', unit: 'm', reorder: 50, locations: { 'Main Warehouse': 160, 'Production Floor': 35 } },
    { id: 'p3', name: 'Walnut tabletop', sku: 'FRN-023', category: 'Furniture', unit: 'pcs', reorder: 12, locations: { 'Main Warehouse': 9, 'Production Floor': 4 } },
    { id: 'p4', name: 'Wood screws 40mm', sku: 'HAR-008', category: 'Hardware', unit: 'pcs', reorder: 100, locations: { 'Main Warehouse': 72, 'Production Floor': 0 } },
    { id: 'p5', name: 'Linen seat cushion', sku: 'ACC-017', category: 'Accessories', unit: 'pcs', reorder: 18, locations: { 'Main Warehouse': 24, 'Production Floor': 6 } },
    { id: 'p6', name: 'Brass cabinet handle', sku: 'HAR-031', category: 'Hardware', unit: 'pcs', reorder: 35, locations: { 'Main Warehouse': 0, 'Production Floor': 12 } },
    { id: 'p7', name: 'Beechwood plank', sku: 'MAT-006', category: 'Raw materials', unit: 'pcs', reorder: 30, locations: { 'Main Warehouse': 84, 'Production Floor': 16 } },
    { id: 'p8', name: 'Table leg set', sku: 'FRN-042', category: 'Furniture', unit: 'sets', reorder: 10, locations: { 'Main Warehouse': 15, 'Production Floor': 3 } },
  ];
  const ops = [
    { id: 'o1', type: 'Receipt', reference: 'WH/IN/0248', partner: 'Northside Timber Co.', date: '2026-09-26', status: 'Ready', lines: [{ productId: 'p7', quantity: 40, location: 'Main Warehouse' }] },
    { id: 'o2', type: 'Delivery', reference: 'WH/OUT/0182', partner: 'Studio Form & Co.', date: '2026-09-26', status: 'Waiting', lines: [{ productId: 'p1', quantity: 8, location: 'Main Warehouse' }] },
    { id: 'o3', type: 'Transfer', reference: 'WH/MOVE/0096', partner: 'Main Warehouse → Production Floor', date: '2026-09-27', status: 'Ready', lines: [{ productId: 'p2', quantity: 20, from: 'Main Warehouse', to: 'Production Floor' }] },
    { id: 'o4', type: 'Delivery', reference: 'WH/OUT/0181', partner: 'Haven Interiors', date: '2026-09-25', status: 'Done', lines: [{ productId: 'p5', quantity: 6, location: 'Main Warehouse' }] },
    { id: 'o5', type: 'Receipt', reference: 'WH/IN/0247', partner: 'Ironwood Supply', date: '2026-09-25', status: 'Waiting', lines: [{ productId: 'p4', quantity: 200, location: 'Main Warehouse' }] },
    { id: 'o6', type: 'Adjustment', reference: 'WH/ADJ/0031', partner: 'Production Floor', date: '2026-09-24', status: 'Done', lines: [{ productId: 'p3', quantity: -1, location: 'Production Floor' }] },
    { id: 'o7', type: 'Transfer', reference: 'WH/MOVE/0095', partner: 'Production Floor → Main Warehouse', date: '2026-09-24', status: 'Done', lines: [{ productId: 'p1', quantity: 10, from: 'Production Floor', to: 'Main Warehouse' }] },
  ];
  const ledger = [
    { id: 'l1', type: 'Receipt', productId: 'p7', quantity: 40, location: 'Main Warehouse', reference: 'WH/IN/0248', time: at, actor: 'Jamie Davis', note: 'Supplier delivery' },
    { id: 'l2', type: 'Delivery', productId: 'p5', quantity: -6, location: 'Main Warehouse', reference: 'WH/OUT/0181', time: at, actor: 'Jamie Davis', note: 'Customer shipment' },
    { id: 'l3', type: 'Adjustment', productId: 'p3', quantity: -1, location: 'Production Floor', reference: 'WH/ADJ/0031', time: at, actor: 'Jamie Davis', note: 'Damaged during handling' },
    { id: 'l4', type: 'Transfer in', productId: 'p1', quantity: 10, location: 'Main Warehouse', reference: 'WH/MOVE/0095', time: at, actor: 'Jamie Davis', note: 'From Production Floor' },
    { id: 'l5', type: 'Transfer out', productId: 'p1', quantity: -10, location: 'Production Floor', reference: 'WH/MOVE/0095', time: at, actor: 'Jamie Davis', note: 'To Main Warehouse' },
    { id: 'l6', type: 'Receipt', productId: 'p2', quantity: 60, location: 'Main Warehouse', reference: 'WH/IN/0246', time: at, actor: 'Jamie Davis', note: 'Supplier delivery' },
  ];
  return { products, ops, ledger, warehouses: ['Main Warehouse', 'Production Floor'], seq: 250 };
}
