<script setup>
import { ref, computed, watch } from 'vue'
import { IDIOMAS, MAPA_IDIOMAS, TODAS_LAS_ENTRADAS, ENTRADA_POR_ID } from '../lib/idiomas.js'
import { CATEGORIAS, abrevCategoria } from '../lib/categorias.js'
import { normalizar, comparadorAlfabeto, inicial } from '../lib/texto.js'
import { guardado } from '../lib/util.js'
import FichaEntrada from './FichaEntrada.vue'

const props = defineProps({ soloIdioma: { type: String, default: '' } })
const emit = defineEmits(['ir-idioma', 'forja', 'limpiar-solo'])

const ORDENES = [
  { id: 'lema', nombre: 'Palabra (A–Z)' },
  { id: 'lema-desc', nombre: 'Palabra (Z–A)' },
  { id: 'traduccion', nombre: 'Traducción (A–Z)' },
  { id: 'categoria', nombre: 'Categoría' },
  { id: 'idioma', nombre: 'Idioma' }
]

const q = ref('')
const campo = ref(guardado.leer('campo', 'todo'))
const modo = ref(guardado.leer('modo', 'contiene'))
const idiomasSel = ref(guardado.leer('idiomas', IDIOMAS.map(i => i.id)).filter(id => MAPA_IDIOMAS[id]))
if (!idiomasSel.value.length) idiomasSel.value = IDIOMAS.map(i => i.id)
const categoriasSel = ref(guardado.leer('categorias', []))
const etiqueta = ref('')
const orden = ref(guardado.leer('orden', 'lema'))
const seleccionada = ref(null)
const filtrosAbiertos = ref(false)

watch([campo, modo, idiomasSel, categoriasSel, orden], () => {
  guardado.escribir('campo', campo.value); guardado.escribir('modo', modo.value)
  guardado.escribir('idiomas', idiomasSel.value); guardado.escribir('categorias', categoriasSel.value)
  guardado.escribir('orden', orden.value)
}, { deep: true })

watch(() => props.soloIdioma, id => {
  if (id) { idiomasSel.value = [id]; seleccionada.value = null; emit('limpiar-solo') }
}, { immediate: true })

const comparadores = Object.fromEntries(IDIOMAS.map(i => [i.id, comparadorAlfabeto(i.alfabeto)]))
const cmpLema = (a, b) => a.idioma === b.idioma
  ? comparadores[a.idioma](a.lema, b.lema)
  : normalizar(a.lema).localeCompare(normalizar(b.lema), 'es')

const todasEtiquetas = computed(() => [...new Set(TODAS_LAS_ENTRADAS.flatMap(e => e.etiquetas))].sort((a, b) => a.localeCompare(b, 'es')))

function coincideTexto(e) {
  const t = normalizar(q.value)
  if (!t) return true
  const test = s => modo.value === 'empieza' ? normalizar(s).startsWith(t) : modo.value === 'exacta' ? normalizar(s) === t : normalizar(s).includes(t)
  const enLema = () => test(e.lema) || Object.values(e.formas ?? {}).some(test)
  const enEsp = () => e.traduccion.some(test) || (modo.value === 'contiene' && test(e.definicion ?? ''))
  if (campo.value === 'lema') return enLema()
  if (campo.value === 'traduccion') return enEsp()
  return enLema() || enEsp()
}

// Filtrado sin categoría (para contar cuántas hay de cada una)
const baseFiltrada = computed(() => TODAS_LAS_ENTRADAS.filter(e =>
  idiomasSel.value.includes(e.idioma) &&
  (!etiqueta.value || e.etiquetas.includes(etiqueta.value)) &&
  coincideTexto(e)
))
const conteo = computed(() => {
  const c = {}
  for (const e of baseFiltrada.value) c[e.categoria] = (c[e.categoria] ?? 0) + 1
  return c
})
const resultados = computed(() => {
  const lista = baseFiltrada.value.filter(e => !categoriasSel.value.length || categoriasSel.value.includes(e.categoria))
  const ords = {
    'lema': cmpLema,
    'lema-desc': (a, b) => cmpLema(b, a),
    'traduccion': (a, b) => normalizar(a.traduccion[0] ?? '').localeCompare(normalizar(b.traduccion[0] ?? ''), 'es'),
    'categoria': (a, b) => CATEGORIAS.findIndex(c => c.clave === a.categoria) - CATEGORIAS.findIndex(c => c.clave === b.categoria) || cmpLema(a, b),
    'idioma': (a, b) => MAPA_IDIOMAS[a.idioma].nombre.localeCompare(MAPA_IDIOMAS[b.idioma].nombre, 'es') || cmpLema(a, b)
  }
  return [...lista].sort(ords[orden.value])
})

// Agrupación (índice de letras o encabezados de categoría/idioma)
const grupos = computed(() => {
  const g = []
  const clave = e => {
    if (orden.value === 'categoria') return CATEGORIAS.find(c => c.clave === e.categoria)?.etiqueta ?? e.categoria
    if (orden.value === 'idioma') return MAPA_IDIOMAS[e.idioma].nombre
    if (orden.value === 'traduccion') return inicial(e.traduccion[0] ?? '#')
    return inicial(e.lema, MAPA_IDIOMAS[e.idioma].alfabeto)
  }
  for (const e of resultados.value) {
    const k = clave(e)
    if (g.at(-1)?.titulo !== k) g.push({ titulo: k, entradas: [] })
    g.at(-1).entradas.push(e)
  }
  return g
})

const entradaActual = computed(() => seleccionada.value && ENTRADA_POR_ID[seleccionada.value])

// En la plantilla los ref llegan ya desenvueltos: "lista" es el array reactivo.
function alternar(lista, valor) {
  const i = lista.indexOf(valor)
  i >= 0 ? lista.splice(i, 1) : lista.push(valor)
}
function soloEste(id) { idiomasSel.value = [id] }
function todos() { idiomasSel.value = IDIOMAS.map(i => i.id) }
function limpiar() { q.value = ''; categoriasSel.value = []; etiqueta.value = ''; todos() }

const hayFiltros = computed(() => q.value || categoriasSel.value.length || etiqueta.value || idiomasSel.value.length !== IDIOMAS.length)
</script>

<template>
  <div class="diccionario">
    <!-- BUSCADOR -->
    <section class="buscador">
      <div class="fila-busqueda">
        <input v-model="q" class="campo grande" type="search" placeholder="Buscar en las lenguas o en español…" autofocus />
        <button class="boton secundario solo-movil" @click="filtrosAbiertos = !filtrosAbiertos">
          Filtros{{ hayFiltros ? ' •' : '' }}
        </button>
      </div>
      <div class="opciones-busqueda">
        <div class="segmentado">
          <button :class="{ on: campo === 'todo' }" @click="campo = 'todo'">Todo</button>
          <button :class="{ on: campo === 'lema' }" @click="campo = 'lema'">Lengua → español</button>
          <button :class="{ on: campo === 'traduccion' }" @click="campo = 'traduccion'">Español → lengua</button>
        </div>
        <select v-model="modo" class="campo compacto" aria-label="Tipo de coincidencia">
          <option value="contiene">Contiene</option>
          <option value="empieza">Empieza por</option>
          <option value="exacta">Exacta</option>
        </select>
        <select v-model="orden" class="campo compacto" aria-label="Orden">
          <option v-for="o in ORDENES" :key="o.id" :value="o.id">{{ o.nombre }}</option>
        </select>
      </div>
    </section>

    <div class="cuerpo" :class="{ 'con-ficha': entradaActual }">
      <!-- FILTROS -->
      <aside class="filtros" :class="{ abiertos: filtrosAbiertos }">
        <div class="bloque">
          <span class="etiqueta-campo">Lenguas</span>
          <label v-for="i in IDIOMAS" :key="i.id" class="casilla">
            <input type="checkbox" :checked="idiomasSel.includes(i.id)" @change="alternar(idiomasSel, i.id)" />
            <span class="punto" :style="{ background: i.color }" />
            <span class="nom">{{ i.nombre }}</span>
            <button class="solo" title="Solo esta" @click.prevent="soloEste(i.id)">solo</button>
          </label>
          <button v-if="idiomasSel.length !== IDIOMAS.length" class="enlace" @click="todos">Todas</button>
        </div>

        <div class="bloque">
          <span class="etiqueta-campo">Tipo de palabra</span>
          <div class="chips">
            <button v-for="c in CATEGORIAS.filter(c => conteo[c.clave] || categoriasSel.includes(c.clave))" :key="c.clave"
              class="chip" :class="{ activo: categoriasSel.includes(c.clave) }" @click="alternar(categoriasSel, c.clave)">
              {{ c.etiqueta }} <span class="n">{{ conteo[c.clave] ?? 0 }}</span>
            </button>
          </div>
        </div>

        <div v-if="todasEtiquetas.length" class="bloque">
          <span class="etiqueta-campo">Tema</span>
          <select v-model="etiqueta" class="campo compacto">
            <option value="">Todos los temas</option>
            <option v-for="t in todasEtiquetas" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <button v-if="hayFiltros" class="boton secundario pequeno" @click="limpiar">Quitar filtros</button>
      </aside>

      <!-- LISTA -->
      <section class="lista">
        <p class="resumen suave">{{ resultados.length }} {{ resultados.length === 1 ? 'entrada' : 'entradas' }}</p>
        <p v-if="!resultados.length" class="nada">Ninguna palabra coincide. Prueba a cambiar el sentido de la búsqueda o quitar filtros.</p>
        <div v-for="g in grupos" :key="g.titulo" class="grupo">
          <h3 class="titulo-grupo">{{ g.titulo }}</h3>
          <button v-for="e in g.entradas" :key="e.id" class="fila" :class="{ sel: seleccionada === e.id }" @click="seleccionada = e.id">
            <span class="punto" :style="{ background: MAPA_IDIOMAS[e.idioma].color }" :title="MAPA_IDIOMAS[e.idioma].nombre" />
            <span class="lema" :class="{ frase: e.categoria === 'locucion' }">{{ e.lema }}</span>
            <span class="cat">{{ abrevCategoria(e.categoria) }}</span>
            <span class="trad">{{ e.traduccion.join(', ') }}</span>
          </button>
        </div>
      </section>

      <!-- FICHA -->
      <aside v-if="entradaActual" class="ficha-lateral">
        <FichaEntrada :entrada="entradaActual" @cerrar="seleccionada = null" @navegar="id => (seleccionada = id)"
          @ir-idioma="id => emit('ir-idioma', id)" @forja="p => emit('forja', p)" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.buscador { margin-bottom: 1.1rem; }
.fila-busqueda { display: flex; gap: .5rem; }
.campo.grande { font-family: var(--serif); font-size: 1.15rem; padding: .7rem 1rem; }
.opciones-busqueda { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .6rem; align-items: center; }
.campo.compacto { width: auto; padding: .35rem .6rem; font-size: .85rem; }
.segmentado { display: inline-flex; border: 1px solid var(--linea); border-radius: var(--radio); overflow: hidden; }
.segmentado button { border: 0; background: var(--hueso-claro); padding: .35rem .75rem; cursor: pointer; font-family: var(--sans); font-size: .82rem; }
.segmentado button + button { border-left: 1px solid var(--linea); }
.segmentado button.on { background: var(--granate); color: var(--hueso-claro); }

.cuerpo { display: grid; grid-template-columns: 230px 1fr; gap: 1.5rem; align-items: start; }
.cuerpo.con-ficha { grid-template-columns: 230px minmax(0, 1fr) minmax(320px, 420px); }

.filtros { position: sticky; top: 5.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
.casilla { display: flex; align-items: center; gap: .5rem; padding: .2rem 0; cursor: pointer; font-family: var(--sans); font-size: .9rem; }
.casilla .nom { flex: 1; }
.casilla .solo { visibility: hidden; border: 0; background: none; color: var(--granate); font-size: .72rem; cursor: pointer; font-family: var(--sans); }
.casilla:hover .solo { visibility: visible; }
.enlace { border: 0; background: none; color: var(--granate); cursor: pointer; font-family: var(--sans); font-size: .8rem; padding: .2rem 0; text-decoration: underline; }
.chips { display: flex; flex-wrap: wrap; gap: .35rem; }

.resumen { font-family: var(--sans); font-size: .8rem; margin: 0 0 .5rem; }
.nada { font-style: italic; color: var(--tinta-suave); }
.grupo { margin-bottom: 1rem; }
.titulo-grupo {
  font-size: 1.05rem; color: var(--granate); padding: .2rem 0; margin-bottom: .2rem;
  border-bottom: 1px solid var(--dorado); font-variant: small-caps; letter-spacing: .05em;
}
.fila {
  display: grid; grid-template-columns: auto auto auto 1fr; align-items: baseline; gap: .55rem;
  width: 100%; text-align: left; padding: .45rem .55rem; cursor: pointer;
  background: none; border: 0; border-radius: var(--radio);
}
.fila:hover { background: var(--hueso-claro); }
.fila.sel { background: var(--onice); color: var(--hueso); }
.fila.sel .cat { color: var(--dorado-claro); }
.fila.sel .trad { color: #cfc3ad; }
.fila .punto { align-self: center; }
.lema { font-weight: 600; font-size: 1.05rem; }
.lema.frase { font-style: italic; font-weight: 500; }
.cat { font-style: italic; color: var(--carmesi); font-size: .85rem; }
.trad { color: var(--tinta-suave); font-size: .95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ficha-lateral { position: sticky; top: 5.5rem; max-height: calc(100vh - 6.5rem); overflow: auto; }
.solo-movil { display: none; }

@media (max-width: 1100px) {
  .cuerpo.con-ficha { grid-template-columns: 210px minmax(0, 1fr); }
  .ficha-lateral { position: fixed; inset: auto 0 0 0; top: auto; max-height: 78vh; z-index: 30; padding: 0 .5rem .5rem; }
}
@media (max-width: 760px) {
  .cuerpo, .cuerpo.con-ficha { grid-template-columns: 1fr; }
  .solo-movil { display: inline-flex; }
  .filtros { display: none; position: static; }
  .filtros.abiertos { display: flex; padding: 1rem; background: var(--hueso-claro); border: 1px solid var(--linea); border-radius: var(--radio); }
  .fila { grid-template-columns: auto 1fr auto; }
  .fila .trad { grid-column: 2 / -1; white-space: normal; }
  .segmentado button { padding: .35rem .5rem; font-size: .78rem; }
}
</style>
