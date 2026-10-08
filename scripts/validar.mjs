// Revisa todos los idiomas de src/data/idiomas/*.json y avisa de problemas.
// Uso: npm run validar      (se ejecuta también antes de cada build)
// Errores (✖) detienen el build; avisos (⚠) solo informan.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORIAS } from '../src/lib/categorias.js'
import { aFonemas, tokenizarPatron } from '../src/lib/fonetica.js'
import { leerPatrones } from '../src/lib/generador.js'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const carpeta = path.join(raiz, 'src', 'data', 'idiomas')
const claves = new Set(CATEGORIAS.map(c => c.clave))
const ACENTOS = ['primera', 'ultima', 'penultima', 'antepenultima', 'ninguno']

let errores = 0, avisos = 0
const err = (f, m) => { errores++; console.log(`  ✖ ${f}: ${m}`) }
const av = (f, m) => { avisos++; console.log(`  ⚠ ${f}: ${m}`) }

const archivos = fs.readdirSync(carpeta).filter(f => f.endsWith('.json') && !f.startsWith('_'))
const idsGlobales = new Map()
const idsIdioma = new Set()

console.log(`\nArcha Lexica · validando ${archivos.length} idioma(s)\n`)

for (const archivo of archivos) {
  let d
  try { d = JSON.parse(fs.readFileSync(path.join(carpeta, archivo), 'utf8')) }
  catch (e) { err(archivo, `JSON inválido — ${e.message}`); continue }

  console.log(`▸ ${d.nombre ?? archivo}`)
  for (const campo of ['id', 'nombre', 'entradas']) if (!d[campo]) err(archivo, `falta el campo "${campo}"`)
  if (d.id && idsIdioma.has(d.id)) err(archivo, `id de idioma repetido "${d.id}"`)
  idsIdioma.add(d.id)
  if (d.id && archivo !== `${d.id}.json`) av(archivo, `el archivo debería llamarse ${d.id}.json`)

  const fon = { consonantes: [], vocales: [], clases: {}, ortografia: [], reglas: [], silaba: {}, ...(d.fonologia ?? {}) }
  if (!fon.vocales.length) av(archivo, 'fonologia.vocales está vacío: no habrá pronunciación ni generador')
  if (fon.acento && !ACENTOS.includes(fon.acento)) err(archivo, `acento "${fon.acento}" no válido (${ACENTOS.join(', ')})`)

  const inventario = new Set([...fon.consonantes, ...fon.vocales])
  for (const o of fon.ortografia) {
    if (!o.grafia) err(archivo, 'una fila de ortografia no tiene "grafia"')
    if (o.ipa && !inventario.has(o.ipa)) av(archivo, `ortografía «${o.grafia}» → /${o.ipa}/ no está en consonantes ni vocales`)
  }
  for (const r of fon.reglas) {
    if (r.de === undefined || r.a === undefined) err(archivo, `regla incompleta: ${JSON.stringify(r)}`)
    if (r.contexto && !r.contexto.includes('_')) err(archivo, `contexto "${r.contexto}" sin "_" (posición del sonido)`)
  }
  for (const { patron } of leerPatrones(fon.silaba?.patrones)) {
    for (const t of tokenizarPatron(patron, fon)) {
      if (t.tipo === 'clase' && !['C', 'V'].includes(t.valor) && !fon.clases?.[t.valor]) err(archivo, `patrón "${patron}" usa la clase "${t.valor}" sin definir`)
    }
  }

  const idsLocales = new Set()
  for (const e of d.entradas ?? []) {
    const ref = `${archivo} [${e.id ?? e.lema}]`
    if (!e.id) err(ref, 'entrada sin "id"')
    else if (idsGlobales.has(e.id)) err(ref, `id repetido (también en ${idsGlobales.get(e.id)})`)
    else idsGlobales.set(e.id, archivo)
    if (e.id) idsLocales.add(e.id)
    if (!e.lema) { av(ref, 'entrada sin "lema" (borrador: la app la oculta)'); continue }
    if (!e.categoria) err(ref, 'entrada sin "categoria"')
    else if (!claves.has(e.categoria)) err(ref, `categoría "${e.categoria}" desconocida (${[...claves].join(', ')})`)
    if (!e.traduccion || (Array.isArray(e.traduccion) && !e.traduccion.filter(Boolean).length)) av(ref, 'sin traducción')
    if (e.lema && fon.vocales.length && !e.pronunciacion) {
      for (const p of String(e.lema).split(/\s+/)) {
        const { avisos: a } = aFonemas(p.replace(/[.,;:!?¡¿"«»()]/g, ''), fon)
        a.forEach(m => av(ref, m))
      }
    }
  }
  d._ids = idsLocales
}

// Referencias cruzadas (después de leer todo)
for (const archivo of archivos) {
  let d
  try { d = JSON.parse(fs.readFileSync(path.join(carpeta, archivo), 'utf8')) } catch { continue }
  for (const e of d.entradas ?? []) {
    for (const r of e.relacionadas ?? []) if (!idsGlobales.has(r)) av(`${archivo} [${e.id}]`, `relacionada "${r}" no existe`)
  }
}

console.log(`\n${errores ? '✖' : '✔'} ${errores} error(es), ${avisos} aviso(s)\n`)
process.exit(errores ? 1 : 0)
