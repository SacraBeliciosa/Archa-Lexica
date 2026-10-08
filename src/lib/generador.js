// ==========================================================================
//  Forja de palabras: generación por fonotaxis y derivación por afijos.
//  Lee "fonologia.silaba" y "gramatica.afijos" del JSON del idioma.
// ==========================================================================
import { tokenizarPatron, aOrtografia, aFonemas, transcribir } from './fonetica.js'
import { normalizar } from './texto.js'

/** "CVC:3" -> { patron:"CVC", peso:3 } ; también admite { patron, peso } */
export function leerPatrones(lista = []) {
  return lista.map(p => {
    if (typeof p === 'object') return { patron: p.patron, peso: Number(p.peso ?? 1) }
    const [patron, peso] = String(p).split(':')
    return { patron: patron.trim(), peso: Number(peso ?? 1) || 1 }
  }).filter(p => p.patron)
}

/** Elige con pesos. Los fonemas listados antes son algo más frecuentes (curva suave). */
function elegirPonderado(items, pesoDe, azar) {
  const total = items.reduce((s, it, i) => s + pesoDe(it, i), 0)
  let r = azar() * total
  for (let i = 0; i < items.length; i++) {
    r -= pesoDe(items[i], i)
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}
const pesoPorOrden = (_, i) => 1 / Math.sqrt(i + 1)

function inventarioDe(token, fon) {
  if (token.tipo === 'clase') {
    if (token.valor === 'V') return fon.vocales
    if (token.valor === 'C') return fon.consonantes
    return fon.clases?.[token.valor] ?? []
  }
  if (token.tipo === 'conjunto') return token.valores
  return [token.valor]
}

/** Comprueba secuencias prohibidas. "#" marca inicio/fin de palabra: "ʔ#". */
export function violaProhibidos(fonemas, fon) {
  const s = '#' + fonemas.join('') + '#'
  return (fon.silaba?.prohibidos ?? []).find(p => s.includes(p)) ?? null
}

/** PRNG con semilla (mulberry32) para poder repetir resultados. */
export function crearAzar(semilla) {
  if (semilla === undefined || semilla === '') return Math.random
  let h = 1779033703 ^ String(semilla).length
  for (const c of String(semilla)) h = Math.imul(h ^ c.charCodeAt(0), 3432918353), h = (h << 13) | (h >>> 19)
  let a = h >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Genera palabras nuevas que respetan la fonotaxis del idioma.
 * @param {object} idioma
 * @param {{cantidad?:number, minSilabas?:number, maxSilabas?:number, semilla?:string, empiezaPor?:string, terminaEn?:string}} op
 */
export function generarPalabras(idioma, op = {}) {
  const { cantidad = 12, minSilabas = 1, maxSilabas = 3, semilla, empiezaPor = '', terminaEn = '' } = op
  const fon = idioma.fonologia
  const azar = crearAzar(semilla)
  const patrones = leerPatrones(fon.silaba?.patrones)
  if (!patrones.length || !fon.vocales.length) return []
  const existentes = new Set(idioma.entradas.map(e => normalizar(e.lema)))
  const preFon = empiezaPor ? aFonemas(empiezaPor, fon).fonemas : []
  const postFon = terminaEn ? aFonemas(terminaEn, fon).fonemas : []
  const vistos = new Set()
  const out = []
  let intentos = 0
  while (out.length < cantidad && intentos < cantidad * 200) {
    intentos++
    const n = minSilabas + Math.floor(azar() * (maxSilabas - minSilabas + 1))
    let fonemas = []
    for (let s = 0; s < n; s++) {
      const { patron } = elegirPonderado(patrones, p => p.peso, azar)
      for (const tok of tokenizarPatron(patron, fon)) {
        const inv = inventarioDe(tok, fon)
        if (inv.length) fonemas.push(elegirPonderado(inv, pesoPorOrden, azar))
      }
    }
    fonemas = [...preFon, ...fonemas, ...postFon]
    if (violaProhibidos(fonemas, fon)) continue
    const lema = aOrtografia(fonemas, fon)
    const clave = normalizar(lema)
    if (vistos.has(clave)) continue
    vistos.add(clave)
    out.push({ lema, ipa: transcribir(lema, idioma).ipa, existe: existentes.has(clave) })
  }
  return out
}

/**
 * Aplica un afijo a un lema.
 * Campos del afijo: forma ("-iel" sufijo / "um-" prefijo), elision (quita la vocal
 * final de la raíz si el sufijo empieza por vocal), quitar (terminación a eliminar antes).
 */
export function derivar(lema, afijo, idioma) {
  const fon = idioma.fonologia
  const forma = afijo.forma.replace(/^-|-$/g, '')
  const esPrefijo = afijo.tipo === 'prefijo' || /-$/.test(afijo.forma)
  let raiz = lema
  if (afijo.quitar && raiz.endsWith(afijo.quitar)) raiz = raiz.slice(0, -afijo.quitar.length)
  let resultado
  if (esPrefijo) {
    resultado = forma + raiz
  } else {
    if (afijo.elision) {
      const finRaiz = aFonemas(raiz, fon).fonemas.at(-1)
      const iniAfijo = aFonemas(forma, fon).fonemas[0]
      const vocal = f => fon.vocales.includes(f)
      if (finRaiz && iniAfijo && vocal(finRaiz) && vocal(iniAfijo)) raiz = raiz.slice(0, -1)
    }
    resultado = raiz + forma
  }
  return { lema: resultado, ipa: transcribir(resultado, idioma).ipa }
}

/** Plantilla de entrada lista para pegar en el JSON del idioma. */
export function entradaBorrador(idioma, lema, categoria = 'sustantivo', extra = {}) {
  const prefijo = idioma.prefijoId ?? String(idioma.entradas[0]?.id ?? idioma.id.slice(0, 2)).split('-')[0]
  const nums = idioma.entradas.map(e => Number(String(e.id).split('-').pop()) || 0)
  const siguiente = String(Math.max(0, ...nums) + 1).padStart(4, '0')
  return {
    id: `${prefijo}-${siguiente}`,
    lema,
    categoria,
    traduccion: [''],
    definicion: '',
    ...extra
  }
}
