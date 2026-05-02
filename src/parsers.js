export function parsePct(s) {
  if (!s || !s.trim()) return null;
  const n = parseFloat(
    s.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')
  );
  return isNaN(n) ? null : n / 100;
}

export function parseLL(s) {
  if (!s || !s.trim()) return null;
  let raw = s.trim();
  let mult = 1;
  if (/B$/i.test(raw))      { mult = 1e9; raw = raw.slice(0, -1); }
  else if (/M$/i.test(raw)) { mult = 1e6; raw = raw.slice(0, -1); }
  else if (/K$/i.test(raw)) { mult = 1e3; raw = raw.slice(0, -1); }
  const n = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? null : n * mult;
}
