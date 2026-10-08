// Carga todos los idiomas de src/data/idiomas/*.json.
// Los archivos que empiezan por "_" se ignoran (borradores, plantillas).
// Para añadir un idioma basta con soltar un JSON nuevo en esa carpeta.

const modulos = import.meta.glob('../data/idiomas/*.json', { eager: true, import: 'default' })

export const IDIOMAS = Object.entries(modulos)
  .filter(([ruta]) => !ruta.split('/').pop().startsWith('_'))
  .map(([, datos]) => prepararIdioma(datos))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

export const MAPA_IDIOMAS = Object.fromEntries(IDIOMAS.map(i => [i.id, i]))

/** Todas las entradas de todos los idiomas, cada una con referencia a su idioma. */
export const TODAS_LAS_ENTRADAS = IDIOMAS.flatMap(idioma =>
  idioma.entradas.map(e => ({ ...e, idioma: idioma.id }))
)

export const ENTRADA_POR_ID = Object.fromEntries(TODAS_LAS_ENTRADAS.map(e => [e.id, e]))

function prepararIdioma(d) {
  return {
    descripcion: '',
    alfabeto: [],
    color: '#6b0f1a',
    ...d,
    fonologia: {
      consonantes: [], vocales: [], clases: {}, ortografia: [], reglas: [],
      acento: 'penultima', notas: '',
      ...(d.fonologia ?? {}),
      silaba: { patrones: ['CV', 'CVC'], ataquesPermitidos: [], prohibidos: [], ...(d.fonologia?.silaba ?? {}) }
    },
    gramatica: { tipologia: '', notas: [], afijos: [], ...(d.gramatica ?? {}) },
    entradas: (d.entradas ?? []).filter(e => e.lema).map(e => ({
      traduccion: [], ejemplos: [], relacionadas: [], etiquetas: [], formas: {}, ...e,
      traduccion: [].concat(e.traduccion ?? [])
    }))
  }
}
