<script setup>
import { ref, computed, watch } from 'vue'
import { IDIOMAS, MAPA_IDIOMAS } from '../lib/idiomas.js'
import { CATEGORIAS } from '../lib/categorias.js'
import { transcribir } from '../lib/fonetica.js'
import { generarPalabras, derivar, entradaBorrador } from '../lib/generador.js'
import { copiar } from '../lib/util.js'

const idioma = defineModel('idioma', { type: String })
const props = defineProps({ textoInicial: { type: String, default: '' } })
const actual = computed(() => MAPA_IDIOMAS[idioma.value] ?? IDIOMAS[0])
const tieneFonologia = computed(() => actual.value.fonologia.vocales.length > 0)

/* --- Pronunciador --- */
const texto = ref(props.textoInicial || actual.value.entradas[0]?.lema || '')
watch(() => props.textoInicial, t => { if (t) texto.value = t })
const analisis = computed(() => texto.value.trim() && tieneFonologia.value ? transcribir(texto.value, actual.value) : null)

/* --- Generador --- */
const op = ref({ cantidad: 16, minSilabas: 1, maxSilabas: 3, semilla: '', empiezaPor: '', terminaEn: '' })
const generadas = ref([])
function generar() { generadas.value = generarPalabras(actual.value, op.value) }
watch(idioma, () => { generadas.value = []; derivada.value = null; afijoSel.value = 0 })

/* --- Derivador --- */
const raiz = ref('')
const afijoSel = ref(0)
const afijos = computed(() => actual.value.gramatica.afijos)
const derivada = ref(null)
function derivarAhora() {
  const a = afijos.value[afijoSel.value]
  if (!a || !raiz.value.trim()) return
  derivada.value = { ...derivar(raiz.value.trim(), a, actual.value), afijo: a }
}
const raicesSugeridas = computed(() => {
  const a = afijos.value[afijoSel.value]
  return actual.value.entradas.filter(e => e.categoria !== 'locucion' && (!a?.aplicaA?.length || a.aplicaA.includes(e.categoria))).slice(0, 40)
})

/* --- Borradores --- */
const categoriaBorrador = ref('sustantivo')
function copiarBorrador(lema, extra = {}) {
  const e = entradaBorrador(actual.value, lema, categoriaBorrador.value, extra)
  copiar(JSON.stringify(e, null, 2) + ',', 'Borrador copiado: pégalo en "entradas"')
}
function copiarDerivada() {
  const d = derivada.value
  const r = actual.value.entradas.find(e => e.lema === raiz.value.trim())
  const categoria = d.afijo.resultado && d.afijo.resultado !== 'mismo' ? d.afijo.resultado : (r?.categoria ?? categoriaBorrador.value)
  const e = entradaBorrador(actual.value, d.lema, categoria, {
    etimologia: `De ${raiz.value.trim()} + ${d.afijo.forma} (${d.afijo.significado ?? ''}).`.replace(' ()', ''),
    relacionadas: r ? [r.id] : []
  })
  copiar(JSON.stringify(e, null, 2) + ',', 'Borrador copiado: pégalo en "entradas"')
}
</script>

<template>
  <div class="forja">
    <header class="cab">
      <div>
        <h2>La Forja</h2>
        <p class="suave">Pronuncia, genera y deriva palabras según las reglas de cada lengua.</p>
      </div>
      <label class="selector">
        <span class="etiqueta-campo">Lengua</span>
        <select v-model="idioma" class="campo">
          <option v-for="i in IDIOMAS" :key="i.id" :value="i.id">{{ i.nombre }}</option>
        </select>
      </label>
    </header>

    <p v-if="!tieneFonologia" class="aviso">
      {{ actual.nombre }} aún no tiene vocales definidas en <code class="mono">fonologia.vocales</code>: la Forja necesita la fonología para funcionar.
    </p>

    <div v-else class="paneles">
      <!-- PRONUNCIADOR -->
      <section class="tarjeta panel">
        <h3>Pronunciador</h3>
        <input v-model="texto" class="campo grande" placeholder="Escribe una palabra o frase…" />
        <template v-if="analisis">
          <p class="ipa afi">{{ analisis.ipa }}</p>
          <table class="tabla">
            <tr><th>Palabra</th><th>Subyacente</th><th>Sílabas</th></tr>
            <tr v-for="(p, i) in analisis.palabras" :key="i">
              <td><b>{{ p.palabra }}</b></td>
              <td class="afi">/{{ p.subyacente }}/</td>
              <td class="afi">
                <span v-for="(s, k) in p.silabas" :key="k" class="sil" :class="{ tonica: k === p.tonica }">{{ s }}</span>
              </td>
            </tr>
          </table>
          <template v-if="analisis.traza.length">
            <span class="etiqueta-campo">Reglas aplicadas</span>
            <ol class="traza">
              <li v-for="(t, i) in analisis.traza" :key="i">
                <span class="afi">{{ t.antes }} → {{ t.despues }}</span>
                <span class="suave"> {{ t.regla.nota || `${t.regla.de} → ${t.regla.a} / ${t.regla.contexto}` }}</span>
              </li>
            </ol>
          </template>
          <p v-for="(a, i) in analisis.avisos" :key="'a' + i" class="aviso">{{ a }}</p>
        </template>
      </section>

      <!-- GENERADOR -->
      <section class="tarjeta panel">
        <h3>Generador</h3>
        <div class="opciones">
          <label><span class="etiqueta-campo">Cantidad</span><input v-model.number="op.cantidad" type="number" min="1" max="100" class="campo" /></label>
          <label><span class="etiqueta-campo">Sílabas mín.</span><input v-model.number="op.minSilabas" type="number" min="1" max="6" class="campo" /></label>
          <label><span class="etiqueta-campo">Sílabas máx.</span><input v-model.number="op.maxSilabas" type="number" :min="op.minSilabas" max="6" class="campo" /></label>
          <label><span class="etiqueta-campo">Empieza por</span><input v-model="op.empiezaPor" class="campo" placeholder="(opcional)" /></label>
          <label><span class="etiqueta-campo">Termina en</span><input v-model="op.terminaEn" class="campo" placeholder="(opcional)" /></label>
          <label><span class="etiqueta-campo">Semilla</span><input v-model="op.semilla" class="campo" placeholder="aleatoria" /></label>
        </div>
        <div class="fila-acciones">
          <button class="boton" @click="generar">Generar</button>
          <label class="cat-borrador">
            <span class="suave">Copiar como</span>
            <select v-model="categoriaBorrador" class="campo compacto">
              <option v-for="c in CATEGORIAS" :key="c.clave" :value="c.clave">{{ c.etiqueta.toLowerCase() }}</option>
            </select>
          </label>
        </div>
        <ul v-if="generadas.length" class="generadas">
          <li v-for="g in generadas" :key="g.lema" :class="{ existe: g.existe }">
            <button class="palabra" title="Analizar en el pronunciador" @click="texto = g.lema">{{ g.lema }}</button>
            <span class="afi suave">{{ g.ipa }}</span>
            <span v-if="g.existe" class="ya">ya existe</span>
            <button v-else class="copiar" title="Copiar borrador JSON" @click="copiarBorrador(g.lema)">＋</button>
          </li>
        </ul>
        <p v-else class="suave nota">Las palabras siguen los patrones de sílaba, grupos permitidos y prohibiciones de {{ actual.nombre }}.</p>
      </section>

      <!-- DERIVADOR -->
      <section class="tarjeta panel">
        <h3>Derivador</h3>
        <p v-if="!afijos.length" class="suave nota">{{ actual.nombre }} no tiene afijos en <code class="mono">gramatica.afijos</code>.</p>
        <template v-else>
          <div class="opciones dos">
            <label>
              <span class="etiqueta-campo">Raíz</span>
              <input v-model="raiz" class="campo" list="raices" placeholder="Palabra base" @keyup.enter="derivarAhora" />
              <datalist id="raices"><option v-for="e in raicesSugeridas" :key="e.id" :value="e.lema">{{ e.traduccion[0] }}</option></datalist>
            </label>
            <label>
              <span class="etiqueta-campo">Afijo</span>
              <select v-model.number="afijoSel" class="campo">
                <option v-for="(a, i) in afijos" :key="i" :value="i">{{ a.forma }} — {{ a.significado }}</option>
              </select>
            </label>
          </div>
          <button class="boton" @click="derivarAhora">Derivar</button>
          <div v-if="derivada" class="resultado">
            <p class="suave">{{ raiz }} + {{ derivada.afijo.forma }}</p>
            <p class="nueva">{{ derivada.lema }}</p>
            <p class="afi">{{ derivada.ipa }}</p>
            <button class="boton secundario pequeno" @click="copiarDerivada">Copiar borrador JSON</button>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cab { display: flex; justify-content: space-between; align-items: end; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.cab h2 { font-size: 2rem; color: var(--onice); }
.cab p { margin: .2rem 0 0; }
.selector { min-width: 220px; }
.paneles { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1rem; align-items: start; }
.panel { padding: 1rem 1.15rem 1.15rem; }
.panel h3 { font-size: 1.2rem; color: var(--granate); margin-bottom: .8rem; padding-bottom: .35rem; border-bottom: 1px solid var(--dorado); font-variant: small-caps; letter-spacing: .04em; }
.campo.grande { font-family: var(--serif); font-size: 1.15rem; }
.campo.compacto { width: auto; padding: .3rem .5rem; font-size: .85rem; }
.ipa { font-size: 1.6rem; color: var(--granate); margin: .7rem 0; word-break: break-word; }
.sil { padding: 0 .15rem; }
.sil + .sil::before { content: '·'; color: var(--tinta-suave); margin-right: .15rem; }
.sil.tonica { font-weight: 700; color: var(--carmesi); }
.traza { margin: 0 0 .6rem; padding-left: 1.2rem; font-size: .9rem; }
.aviso { margin-top: .5rem; }
.opciones { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; margin-bottom: .8rem; }
.opciones.dos { grid-template-columns: 1fr 1fr; }
.opciones .campo { padding: .4rem .55rem; }
.fila-acciones { display: flex; justify-content: space-between; align-items: center; gap: .5rem; flex-wrap: wrap; }
.cat-borrador { display: flex; align-items: center; gap: .4rem; font-family: var(--sans); font-size: .8rem; }
.generadas { list-style: none; padding: 0; margin: .9rem 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .2rem .8rem; }
.generadas li { display: flex; align-items: baseline; gap: .5rem; padding: .25rem 0; border-bottom: 1px dotted var(--hueso-oscuro); }
.palabra { border: 0; background: none; padding: 0; cursor: pointer; font-size: 1.05rem; font-weight: 600; font-family: var(--serif); }
.palabra:hover { color: var(--granate); text-decoration: underline; }
.generadas .afi { font-size: .85rem; flex: 1; }
.existe .palabra { text-decoration: line-through; opacity: .6; }
.ya { font-family: var(--sans); font-size: .7rem; color: var(--carmesi); }
.copiar { border: 1px solid var(--linea); background: var(--hueso); border-radius: 4px; cursor: pointer; width: 1.6rem; height: 1.6rem; color: var(--granate); }
.copiar:hover { background: var(--granate); color: var(--hueso-claro); }
.nota { font-size: .88rem; font-style: italic; margin: .8rem 0 0; }
.resultado { margin-top: 1rem; padding: .9rem 1rem; background: var(--hueso); border-radius: var(--radio); border-left: 3px solid var(--dorado); }
.resultado p { margin: 0 0 .25rem; }
.nueva { font-size: 1.8rem; font-weight: 600; color: var(--onice); }
@media (max-width: 560px) {
  .opciones { grid-template-columns: 1fr 1fr; }
  .paneles { grid-template-columns: 1fr; }
}
</style>
