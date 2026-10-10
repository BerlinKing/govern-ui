// Concrete assets, not invented navigation/action/status glyphs.
export function iconCatalog(items = []) {
  if (!Array.isArray(items)) throw new Error('iconCatalog must be an array');
  const groups = new Map();
  for (const item of items) {
    if (['brand-mark', 'illustration', 'logo'].includes(item.kind)) continue;
    if (!item.id || !item.name || !item.source) throw new Error('Icon requires id, name and source');
    // Source identity, not display name or equal colors, controls grouping.
    const key = `${item.source}:${item.importedName || item.id}`;
    const sizes = item.sizes || [];
    if (!Array.isArray(sizes) || sizes.some(s => typeof s !== 'string' || !/^\d+(?:\.\d+)?(?:px|rem|em)$/.test(s))) throw new Error(`Invalid icon sizes: ${item.name}`);
    const preview = typeof item.preview === 'string' && /^data:image\/(?:svg\+xml|png|webp);base64,[A-Za-z0-9+/=]+$/.test(item.preview) ? item.preview : null;
    const row = groups.get(key) || {id:item.id,name:item.name,source:item.source,preview,sizes:[],stroke:item.strokeWidth == null ? '' : String(item.strokeWidth),evidence:[],kind:'ui-icon'};
    row.sizes = [...new Set([...row.sizes,...sizes])];
    row.evidence.push(...(item.sizeEvidence?.length ? item.sizeEvidence : item.evidence || item.references || []));
    groups.set(key,row);
  }
  return [...groups.values()];
}
