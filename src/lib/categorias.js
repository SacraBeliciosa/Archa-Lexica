// Categorías gramaticales admitidas. La clave es lo que se escribe en el JSON
// ("categoria"); "etiqueta" es lo que se ve en la app. Puedes añadir más:
// el validador y los filtros las recogen automáticamente.
export const CATEGORIAS = [
  { clave: 'sustantivo',   etiqueta: 'Sustantivo',   abrev: 's.' },
  { clave: 'verbo',        etiqueta: 'Verbo',        abrev: 'v.' },
  { clave: 'adjetivo',     etiqueta: 'Adjetivo',     abrev: 'adj.' },
  { clave: 'adverbio',     etiqueta: 'Adverbio',     abrev: 'adv.' },
  { clave: 'pronombre',    etiqueta: 'Pronombre',    abrev: 'pron.' },
  { clave: 'determinante', etiqueta: 'Determinante', abrev: 'det.' },
  { clave: 'numeral',      etiqueta: 'Numeral',      abrev: 'num.' },
  { clave: 'preposicion',  etiqueta: 'Adposición',   abrev: 'prep.' },
  { clave: 'conjuncion',   etiqueta: 'Conjunción',   abrev: 'conj.' },
  { clave: 'interjeccion', etiqueta: 'Interjección', abrev: 'interj.' },
  { clave: 'particula',    etiqueta: 'Partícula',    abrev: 'part.' },
  { clave: 'afijo',        etiqueta: 'Afijo',        abrev: 'af.' },
  { clave: 'locucion',     etiqueta: 'Frase hecha',  abrev: 'loc.' }
]

export const MAPA_CATEGORIAS = Object.fromEntries(CATEGORIAS.map(c => [c.clave, c]))

export function etiquetaCategoria(clave) {
  return MAPA_CATEGORIAS[clave]?.etiqueta ?? clave
}
export function abrevCategoria(clave) {
  return MAPA_CATEGORIAS[clave]?.abrev ?? clave
}
