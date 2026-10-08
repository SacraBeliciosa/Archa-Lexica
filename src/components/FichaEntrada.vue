<script setup>
import { computed } from 'vue'
import { MAPA_IDIOMAS, ENTRADA_POR_ID } from '../lib/idiomas.js'
import { etiquetaCategoria } from '../lib/categorias.js'
import { transcribir } from '../lib/fonetica.js'
import { pronunciacionDe, copiar } from '../lib/util.js'

const props = defineProps({ entrada: { type: Object, required: true } })
const emit = defineEmits(['cerrar', 'navegar', 'ir-idioma', 'forja'])

const idioma = computed(() => MAPA_IDIOMAS[props.entrada.idioma])
const ipa = computed(() => pronunciacionDe(props.entrada))
const silabas = computed(() => {
  if (props.entrada.pronunciacion || !idioma.value.fonologia.vocales.length) return ''
  return transcribir(props.entrada.lema, idioma.value).palabras.map(p => p.silabas.join('·')).join(' ')
})
const relacionadas = computed(() => (props.entrada.relacionadas ?? []).map(id => ENTRADA_POR_ID[id] ?? { id, lema: id, roto: true }))
const formas = computed(() => Object.entries(props.entrada.formas ?? {}))

function copiarJson() {
  const { idioma: _, ...limpia } = props.entrada
  copiar(JSON.stringify(limpia, null, 2), 'Entrada copiada en JSON')
}
</script>

<template>
  <article class="ficha tarjeta">
    <header>
      <div class="arriba">
        <button class="idioma" @click="emit('ir-idioma', idioma.id)">
          <span class="punto" :style="{ background: idioma.color }" /> {{ idioma.nombre }}
        </button>
        <button class="cerrar" aria-label="Cerrar" @click="emit('cerrar')">×</button>
      </div>
      <h2 :class="{ frase: entrada.categoria === 'locucion' }">{{ entrada.lema }}</h2>
      <p class="pron">
        <span v-if="ipa" class="afi">{{ ipa }}</span>
        <span v-if="silabas" class="suave silabas">{{ silabas }}</span>
      </p>
      <p class="gram">
        {{ etiquetaCategoria(entrada.categoria) }}<template v-if="entrada.subcategoria"> · {{ entrada.subcategoria }}</template><template v-if="entrada.genero"> · {{ entrada.genero }}</template>
      </p>
    </header>

    <hr class="ornamento" />

    <section>
      <p class="traduccion">{{ entrada.traduccion.join(' · ') }}</p>
      <p v-if="entrada.definicion" class="definicion">{{ entrada.definicion }}</p>
    </section>

    <section v-if="formas.length">
      <span class="etiqueta-campo">Formas</span>
      <table class="tabla">
        <tr v-for="[k, v] in formas" :key="k"><th>{{ k }}</th><td>{{ v }}</td></tr>
      </table>
    </section>

    <section v-if="entrada.ejemplos?.length">
      <span class="etiqueta-campo">Ejemplos</span>
      <blockquote v-for="(ej, i) in entrada.ejemplos" :key="i">
        <p class="ej">{{ ej.texto }}</p>
        <p class="ej-trad">{{ ej.traduccion }}</p>
      </blockquote>
    </section>

    <section v-if="entrada.etimologia">
      <span class="etiqueta-campo">Etimología</span>
      <p>{{ entrada.etimologia }}</p>
    </section>

    <section v-if="relacionadas.length">
      <span class="etiqueta-campo">Véase también</span>
      <div class="chips">
        <button v-for="r in relacionadas" :key="r.id" class="chip" :disabled="r.roto" :title="r.roto ? 'No existe' : r.traduccion?.join(', ')" @click="emit('navegar', r.id)">
          <span v-if="!r.roto" class="punto" :style="{ background: MAPA_IDIOMAS[r.idioma].color }" />
          {{ r.lema }}<template v-if="r.roto"> ⚠</template>
        </button>
      </div>
    </section>

    <section v-if="entrada.notas">
      <span class="etiqueta-campo">Notas</span>
      <p class="notas">{{ entrada.notas }}</p>
    </section>

    <footer>
      <div class="chips">
        <span v-for="t in entrada.etiquetas" :key="t" class="chip estatica">#{{ t }}</span>
      </div>
      <div class="acciones">
        <button class="boton secundario pequeno" @click="emit('forja', { idioma: idioma.id, texto: entrada.lema })">Abrir en la Forja</button>
        <button class="boton secundario pequeno" @click="copiarJson">Copiar JSON</button>
        <span class="mono suave">{{ entrada.id }}</span>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.ficha { padding: 1.1rem 1.25rem 1rem; }
.arriba { display: flex; justify-content: space-between; align-items: center; }
.idioma { display: inline-flex; align-items: center; gap: .4rem; border: 0; background: none; cursor: pointer; font-family: var(--sans); font-size: .78rem; text-transform: uppercase; letter-spacing: .08em; color: var(--tinta-suave); padding: 0; }
.idioma:hover { color: var(--granate); }
.cerrar { border: 0; background: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: var(--tinta-suave); }
h2 { font-size: 2rem; line-height: 1.15; margin-top: .35rem; color: var(--onice); word-break: break-word; }
h2.frase { font-size: 1.5rem; font-style: italic; }
.pron { margin: .3rem 0 0; display: flex; gap: .75rem; flex-wrap: wrap; align-items: baseline; }
.pron .afi { font-size: 1.05rem; color: var(--granate); }
.silabas { font-family: var(--sans); font-size: .8rem; }
.gram { margin: .2rem 0 0; font-style: italic; color: var(--carmesi); }
section { margin-bottom: 1rem; }
section p { margin: 0 0 .3rem; }
.traduccion { font-size: 1.2rem; font-weight: 600; }
.definicion { line-height: 1.55; }
blockquote { margin: 0 0 .55rem; padding-left: .8rem; border-left: 2px solid var(--dorado); }
.ej { font-style: italic; margin: 0; }
.ej-trad { color: var(--tinta-suave); font-size: .92rem; margin: 0; }
.notas { font-size: .92rem; color: var(--tinta-suave); }
.chips { display: flex; flex-wrap: wrap; gap: .35rem; }
.chip:disabled { opacity: .55; cursor: not-allowed; }
.chip.estatica { cursor: default; background: transparent; }
footer { border-top: 1px solid var(--hueso-oscuro); padding-top: .75rem; display: flex; flex-direction: column; gap: .6rem; }
.acciones { display: flex; gap: .4rem; align-items: center; flex-wrap: wrap; }
.acciones .mono { margin-left: auto; }
.tabla th { width: 35%; }
</style>
