// Static-site data layer: answers api() calls from the JSON files exported by scripts/build_static.py.
// /grid/<i> exists only at the default 41x41 grid over [-2, 2]; other grids need the local Python server.
const files = new Map();
async function file(rel) {
  if (!files.has(rel)) files.set(rel, fetch('api/' + rel + '.json').then(r => { if (!r.ok) throw new Error(`${r.status} ${rel}`); return r.json(); }));
  return files.get(rel);
}

export async function staticApi(path) {
  const [p, qs] = path.split('?');
  const clean = p.replace(/^\/+/, '');
  if (clean.startsWith('grid/') && qs) throw new Error('Python grids other than the exported 41×41 one need the local app (Python server).');
  return file(clean);
}
