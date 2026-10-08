// Crea un idioma nuevo a partir de la plantilla.
// Uso: npm run nuevo-idioma -- nombre-del-idioma
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nombre = (process.argv[2] ?? '').trim()
if (!nombre) {
  console.log('\nUso: npm run nuevo-idioma -- <id>\nEjemplo: npm run nuevo-idioma -- valyrio\n')
  process.exit(1)
}
const id = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const destinoJson = path.join(raiz, 'src', 'data', 'idiomas', `${id}.json`)
const destinoGuia = path.join(raiz, 'docs', 'idiomas', `${id}.md`)
if (fs.existsSync(destinoJson)) { console.log(`\nYa existe ${destinoJson}\n`); process.exit(1) }

const plantilla = JSON.parse(fs.readFileSync(path.join(raiz, 'docs', 'plantillas', 'idioma.plantilla.json'), 'utf8'))
plantilla.id = id
plantilla.nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1)
plantilla.prefijoId = id.slice(0, 2)
plantilla.entradas = plantilla.entradas.map((e, i) => ({ ...e, id: `${plantilla.prefijoId}-${String(i + 1).padStart(4, '0')}` }))
fs.writeFileSync(destinoJson, JSON.stringify(plantilla, null, 2) + '\n', 'utf8')

const guia = fs.readFileSync(path.join(raiz, 'docs', 'plantillas', 'guia-idioma.plantilla.md'), 'utf8')
  .replaceAll('{{NOMBRE}}', plantilla.nombre).replaceAll('{{ID}}', id)
fs.mkdirSync(path.dirname(destinoGuia), { recursive: true })
fs.writeFileSync(destinoGuia, guia, 'utf8')

console.log(`\n✔ Creado:\n  ${path.relative(raiz, destinoJson)}   (datos que lee la app)\n  ${path.relative(raiz, destinoGuia)}   (guía de diseño, para ti)\n`)
console.log('Rellena primero la guía, después traslada fonología y reglas al JSON.\n')
