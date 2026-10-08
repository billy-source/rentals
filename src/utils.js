export const kes = (n) => 'KES ' + Number(n || 0).toLocaleString()
export const fmtDate = (d) =>
  new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
export const daysBetween = (a, b) =>
  a && b ? Math.round((new Date(b) - new Date(a)) / 864e5) : 0