<script setup>
import { computed } from 'vue'
import { IDIOMAS, MAPA_IDIOMAS } from '../lib/idiomas.js'
import { CATEGORIAS } from '../lib/categorias.js'
import { leerPatrones } from '../lib/generador.js'

const idioma = defineModel('idioma', { type: String })
const emit = defineEmits(['ver-diccionario', 'forja'])

const actual = computed(() => MAPA_IDIOMAS[idioma.value] ?? IDIOMAS[0])
const fon = computed(() => actual.value.fonologia)
const ACENTOS = { primera: 'Primera sílaba', penultima: 'Penúltima sílaba', ultima: 'Última sílaba', antepenultima: 'Antepenúltima sílaba', ninguno: 'Sin acento fijo' }

const porCategoria = computed(() => {
  const c = {}
  for (const e of actual.value.entradas) c[e.categoria] = (c[e.categoria] ?? 0) + 1
  const max = Math.max(1, ...Object.values(c))
  return CATEGORIAS.filter(k => c[k.clave]).map(k => ({ ...k, n: c[k.clave], pct: (c[k.clave] / max) * 100 }))
})
const patrones = computed(() => {
  const ps = leerPatrones(fon.value.silaba?.patrones)
  const total = ps.reduce((s, p) => s + p.peso, 0) || 1
  return ps.map(p => ({ ...p, pct: Math.round((p.peso / total) * 100) }))
})
const clases = computed(() => Object.entries(fon.value.clases ?? {}))
const ortografiaCompleta = computed(() => {
  // Muestra también las letras que se escriben igual que su sonido
  const explicitas = new Map((fon.value.ortografia ?? []).map(o => [o.ipa, o.grafia]))
  return [...fon.value.consonantes, ...fon.value.vocales].map(ipa => ({ ipa, grafia: explicitas.get(ipa) ?? ipa, igual: !explicitas.has(ipa) }))
})
</script>

<template>
  <div class="lenguas">
    <nav class="indice">
      <button v-for="i in IDIOMAS" :key="i.id" class="item" :class="{ activo: i.id === actual.id }" @click="idioma = i.id">
        <span class="punto" :style="{ background: i.color }" />
        <span class="nom">{{ i.nombre }}</span>
        <span class="n suave">{{ i.entradas.length }}</span>
      </button>
    </nav>

    <article class="hoja">
      <header class="cab" :style="{ '--acento': actual.color }">
        <p class="familia versalitas">{{ actual.familia }}<template v-if="actual.estado"> · {{ actual.estado }}</template></p>
        <h2>{{ actual.nombre }} <span v-if="actual.endonimo" class="endo">«{{ actual.endonimo }}»</span></h2>
        <p v-if="actual.hablantes" class="suave">{{ actual.hablantes }}</p>
        <p class="desc">{{ actual.descripcion }}</p>
        <div class="acciones">
          <button class="boton" @click="emit('ver-diccionario', actual.id)">Ver sus {{ actual.entradas.length }} palabras</button>
          <button class="boton secundario" @click="emit('forja', { idioma: actual.id })">Forjar palabras</button>
        </div>
      </header>

      <div class="rejilla">
        <section class="tarjeta panel">
          <h3>Sonidos</h3>
          <span class="etiqueta-campo">Consonantes</span>
          <div class="fonemas afi"><span v-for="c in fon.consonantes" :key="c">{{ c }}</span></div>
          <span class="etiqueta-campo">Vocales</span>
          <div class="fonemas afi"><span v-for="v in fon.vocales" :key="v">{{ v }}</span></div>
          <template v-if="clases.length">
            <span class="etiqueta-campo">Clases</span>
            <table class="tabla"><tr v-for="[k, v] in clases" :key="k"><th class="mono">{{ k }}</th><td class="afi">{{ v.join(' ') }}</td></tr></table>
          </template>
        </section>

        <section class="tarjeta panel">
          <h3>Escritura</h3>
          <p v-if="actual.escritura" class="nota">{{ actual.escritura }}</p>
          <div class="orto">
            <div v-for="o in ortografiaCompleta" :key="o.ipa" class="par" :class="{ igual: o.igual }">
              <b>{{ o.grafia }}</b><span class="afi">/{{ o.ipa }}/</span>
            </div>
          </div>
          <template v-if="actual.alfabeto.length">
            <span class="etiqueta-campo">Orden alfabético</span>
            <p class="alfabeto">{{ actual.alfabeto.join(' · ') }}</p>
          </template>
        </section>

        <section class="tarjeta panel">
          <h3>Sílaba y acento</h3>
          <span class="etiqueta-campo">Patrones</span>
          <div v-for="p in patrones" :key="p.patron" class="barra">
            <span class="mono">{{ p.patron }}</span>
            <div class="pista"><div :style="{ width: p.pct + '%' }" /></div>
            <span class="suave">{{ p.pct }}%</span>
          </div>
          <template v-if="fon.silaba.ataquesPermitidos?.length">
            <span class="etiqueta-campo">Grupos iniciales</span>
            <p class="afi">{{ fon.silaba.ataquesPermitidos.join(', ') }}</p>
          </template>
          <template v-if="fon.silaba.prohibidos?.length">
            <span class="etiqueta-campo">Prohibido</span>
            <p class="afi">{{ fon.silaba.prohibidos.join(', ') }}</p>
          </template>
          <span class="etiqueta-campo">Acento</span>
          <p>{{ ACENTOS[fon.acento] ?? fon.acento }}</p>
          <p v-if="fon.notas" class="nota">{{ fon.notas }}</p>
        </section>

        <section v-if="fon.reglas.length" class="tarjeta panel">
          <h3>Cambios de sonido</h3>
          <ol class="reglas">
            <li v-for="(r, i) in fon.reglas" :key="i">
              <span class="afi formula">{{ r.de }} → {{ r.a || '∅' }} <span class="suave">/ {{ r.contexto || '_' }}</span></span>
              <span v-if="r.nota" class="nota">{{ r.nota }}</span>
            </li>
          </ol>
        </section>

        <section class="tarjeta panel">
          <h3>Gramática</h3>
          <p v-if="actual.gramatica.tipologia"><b>{{ actual.gramatica.tipologia }}</b></p>
          <ul v-if="actual.gramatica.notas.length" class="notas"><li v-for="(n, i) in actual.gramatica.notas" :key="i">{{ n }}</li></ul>
          <template v-if="actual.gramatica.afijos.length">
            <span class="etiqueta-campo">Afijos</span>
            <table class="tabla">
              <tr><th>Forma</th><th>Significado</th><th>Aplica a</th></tr>
              <tr v-for="a in actual.gramatica.afijos" :key="a.forma">
                <td><b>{{ a.forma }}</b></td><td>{{ a.significado }}</td><td class="suave">{{ (a.aplicaA ?? []).join(', ') }}</td>
              </tr>
            </table>
          </template>
        </section>

        <section class="tarjeta panel">
          <h3>Léxico</h3>
          <div v-for="c in porCategoria" :key="c.clave" class="barra">
            <span>{{ c.etiqueta }}</span>
            <div class="pista"><div :style="{ width: c.pct + '%' }" /></div>
            <span class="suave">{{ c.n }}</span>
          </div>
        </section>
      </div>
    </article>
  </div>
</template>

<style scoped>
.lenguas { display: grid; grid-template-columns: 220px 1fr; gap: 1.5rem; align-items: start; }
.indice { position: sticky; top: 5.5rem; display: flex; flex-direction: column; gap: .15rem; }
.item { display: flex; align-items: center; gap: .55rem; padding: .5rem .7rem; border: 0; background: none; border-radius: var(--radio); cursor: pointer; text-align: left; font-size: 1rem; }
.item:hover { background: var(--hueso-claro); }
.item.activo { background: var(--onice); color: var(--hueso); }
.item .nom { flex: 1; }
.item .n { font-family: var(--sans); font-size: .75rem; }

.cab { padding: .25rem 0 1.25rem 1rem; border-left: 4px solid var(--acento); margin-bottom: 1.25rem; }
.familia { font-family: var(--sans); font-size: .75rem; color: var(--tinta-suave); margin: 0; }
.cab h2 { font-size: 2.3rem; color: var(--onice); }
.endo { font-weight: 400; font-style: italic; font-size: 1.3rem; color: var(--granate); }
.cab p { margin: .3rem 0; }
.desc { max-width: 70ch; line-height: 1.6; }
.acciones { display: flex; gap: .5rem; margin-top: .8rem; flex-wrap: wrap; }

.rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.panel { padding: 1rem 1.1rem; }
.panel h3 { font-size: 1.15rem; color: var(--granate); margin-bottom: .7rem; padding-bottom: .35rem; border-bottom: 1px solid var(--dorado); font-variant: small-caps; letter-spacing: .04em; }
.panel p { margin: 0 0 .7rem; }
.fonemas { display: flex; flex-wrap: wrap; gap: .3rem; margin-bottom: .9rem; }
.fonemas span { min-width: 2rem; text-align: center; padding: .2rem .4rem; background: var(--hueso); border: 1px solid var(--hueso-oscuro); border-radius: 4px; font-size: 1.05rem; }
.orto { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: .3rem; margin-bottom: .9rem; }
.par { display: flex; justify-content: space-between; gap: .3rem; padding: .2rem .45rem; border-radius: 4px; background: var(--hueso); font-size: .9rem; }
.par.igual { opacity: .55; }
.par b { font-family: var(--serif); }
.alfabeto { font-size: .95rem; letter-spacing: .02em; }
.nota { font-size: .88rem; color: var(--tinta-suave); font-style: italic; }
.barra { display: grid; grid-template-columns: 7rem 1fr 2.5rem; align-items: center; gap: .5rem; margin-bottom: .35rem; font-size: .9rem; }
.barra .suave { font-family: var(--sans); font-size: .78rem; text-align: right; }
.pista { height: .45rem; background: var(--hueso-oscuro); border-radius: 99px; overflow: hidden; }
.pista div { height: 100%; background: var(--granate); border-radius: 99px; }
.reglas { margin: 0; padding-left: 1.2rem; }
.reglas li { margin-bottom: .55rem; }
.formula { display: block; font-size: 1.05rem; }
.notas { margin: 0 0 .8rem; padding-left: 1.1rem; font-size: .93rem; }

@media (max-width: 760px) {
  .lenguas { grid-template-columns: 1fr; }
  .indice { position: static; flex-direction: row; overflow-x: auto; }
  .item { flex: none; }
  .cab h2 { font-size: 1.8rem; }
}
</style>
