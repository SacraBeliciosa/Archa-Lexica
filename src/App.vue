<script setup>
import { ref } from 'vue'
import { IDIOMAS, TODAS_LAS_ENTRADAS } from './lib/idiomas.js'
import { mensaje, guardado } from './lib/util.js'
import VistaDiccionario from './components/VistaDiccionario.vue'
import VistaLenguas from './components/VistaLenguas.vue'

const PESTANAS = [
  { id: 'diccionario', nombre: 'Diccionario' },
  { id: 'lenguas', nombre: 'Lenguas' }
]
const vistaGuardada = guardado.leer('vista', 'diccionario')
const vista = ref(PESTANAS.some(p => p.id === vistaGuardada) ? vistaGuardada : 'diccionario')
const idiomaLenguas = ref(IDIOMAS[0]?.id ?? '')
const soloIdioma = ref('')

function ir(v) { vista.value = v; guardado.escribir('vista', v) }
function verIdioma(id) { idiomaLenguas.value = id; ir('lenguas') }
function verEnDiccionario(id) { soloIdioma.value = id; ir('diccionario') }
</script>

<template>
  <header class="cabecera">
    <div class="marca">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
        <path d="M18 50 L32 12 L46 50 M23 37 H41" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="32" cy="12" r="4" fill="var(--carmesi)" />
      </svg>
      <div>
        <h1 class="versalitas">Archa Lexica</h1>
        <span class="sub">{{ IDIOMAS.length }} lenguas · {{ TODAS_LAS_ENTRADAS.length }} entradas</span>
      </div>
    </div>
    <nav class="pestanas">
      <button v-for="p in PESTANAS" :key="p.id" :class="{ activa: vista === p.id }" @click="ir(p.id)">
        {{ p.nombre }}
      </button>
    </nav>
  </header>

  <main class="contenido">
    <div v-if="!IDIOMAS.length" class="vacio tarjeta">
      <h2>Aún no hay idiomas</h2>
      <p>Crea uno con <code class="mono">npm run nuevo-idioma -- nombre</code> en la terminal, o copia
        <code class="mono">docs/plantillas/idioma.plantilla.json</code> en <code class="mono">src/data/idiomas/</code>.</p>
    </div>
    <template v-else>
      <VistaDiccionario v-show="vista === 'diccionario'" :solo-idioma="soloIdioma"
        @ir-idioma="verIdioma" @limpiar-solo="soloIdioma = ''" />
      <VistaLenguas v-if="vista === 'lenguas'" v-model:idioma="idiomaLenguas"
        @ver-diccionario="verEnDiccionario" />
    </template>
  </main>

  <transition name="fundido"><div v-if="mensaje" class="toast">{{ mensaje }}</div></transition>
</template>

<style scoped>
.cabecera {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  padding: .7rem clamp(1rem, 3vw, 2rem);
  background: var(--onice); color: var(--dorado);
  border-bottom: 2px solid var(--granate);
}
.marca { display: flex; align-items: center; gap: .7rem; }
.marca h1 { font-size: 1.35rem; line-height: 1.1; color: var(--dorado-claro); }
.sub { font-family: var(--sans); font-size: .72rem; color: #a59580; letter-spacing: .04em; }
.pestanas { display: flex; gap: .25rem; }
.pestanas button {
  background: none; border: 0; cursor: pointer; padding: .45rem .9rem;
  color: #c9b99a; font-family: var(--serif); font-size: 1rem; letter-spacing: .04em;
  border-bottom: 2px solid transparent;
}
.pestanas button:hover { color: var(--dorado-claro); }
.pestanas button.activa { color: var(--hueso); border-bottom-color: var(--dorado); }
.contenido { flex: 1; width: 100%; max-width: 1400px; margin: 0 auto; padding: 1.25rem clamp(1rem, 3vw, 2rem) 3rem; }
.vacio { padding: 2rem; text-align: center; max-width: 560px; margin: 3rem auto; }
.vacio p { font-family: var(--sans); font-size: .92rem; }
.fundido-enter-active, .fundido-leave-active { transition: opacity .2s; }
.fundido-enter-from, .fundido-leave-to { opacity: 0; }
@media (max-width: 560px) {
  .cabecera { padding: .6rem 1rem; }
  .pestanas { width: 100%; justify-content: space-between; }
  .pestanas button { flex: 1; padding: .4rem .3rem; }
}
</style>
