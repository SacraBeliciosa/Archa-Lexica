// Utilidades de texto: normalización para búsquedas y ordenación por alfabeto propio.

/** Minúsculas y sin diacríticos: "Aelthârin" -> "aeltharin" */
export function normalizar(s = '') {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Divide una palabra en "letras" según el alfabeto del idioma (dígrafos incluidos). */
export function letras(palabra, alfabeto) {
  const s = String(palabra).normalize('NFC').toLowerCase()
  if (!alfabeto?.length) return [...s]
  const orden = [...alfabeto].sort((a, b) => b.length - a.length)
  const out = []
  let i = 0
  while (i < s.length) {
    const l = orden.find(g => s.startsWith(g, i))
    if (l) { out.push(l); i += l.length } else { out.push(s[i]); i++ }
  }
  return out
}

/**
 * Crea un comparador que respeta el orden alfabético del idioma.
 * Si el idioma define "alfabeto": ["a","â","b","ch",...], "ch" va tras "c".
 * Letras desconocidas van al final y se ordenan por código.
 */
export function comparadorAlfabeto(alfabeto) {
  if (!alfabeto?.length) {
    return (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })
  }
  const idx = new Map(alfabeto.map((l, i) => [l, i]))
  const peso = l => (idx.has(l) ? idx.get(l) : 1000 + (l.codePointAt(0) ?? 0))
  return (a, b) => {
    const la = letras(a, alfabeto).filter(l => l.trim() && !/[.,;:!?¡¿'"«»-]/.test(l) || idx.has(l))
    const lb = letras(b, alfabeto).filter(l => l.trim() && !/[.,;:!?¡¿'"«»-]/.test(l) || idx.has(l))
    for (let i = 0; i < Math.min(la.length, lb.length); i++) {
      const d = peso(la[i]) - peso(lb[i])
      if (d) return d
    }
    return la.length - lb.length
  }
}

/** Primera letra (según alfabeto) para agrupar en el índice. */
export function inicial(palabra, alfabeto) {
  const ls = letras(palabra, alfabeto).filter(l => /\p{L}/u.test(l))
  return (ls[0] ?? '#').toUpperCase()
}
