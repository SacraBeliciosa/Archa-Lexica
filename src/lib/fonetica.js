// ==========================================================================
//  Motor fonético: ortografía -> fonemas -> reglas -> sílabas -> acento -> AFI
//  Todo se configura desde el bloque "fonologia" del JSON de cada idioma.
//  Sin dependencias: lo usan tanto la app como scripts/validar.mjs.
// ==========================================================================

const MODIFICADORES = /[ʰ-˿̀-ͯ᷀-᷿]/ // ː ʰ ʲ ̃ ...

/** Conjunto de vocales del idioma (y cualquier fonema que empiece por una). */
function esVocal(f, fon) {
  if (fon.vocales.includes(f)) return true
  return fon.vocales.some(v => v.length === 1 && f.startsWith(v))
}

/** Expande un token de clase: "V", "C", una clave de "clases" o "[a,e,i]". */
function miembrosDe(token, fon) {
  if (token.tipo === 'conjunto') return token.valores
  if (token.tipo === 'clase') {
    if (token.valor === 'V') return fon.vocales
    if (token.valor === 'C') return fon.consonantes
    return fon.clases?.[token.valor] ?? []
  }
  return [token.valor]
}

/** "V_[i,e]" -> { izq: [tokens], der: [tokens] } */
export function parsearContexto(ctx = '_', fon) {
  const [izq = '', der = ''] = ctx.split('_')
  return { izq: tokenizarPatron(izq, fon), der: tokenizarPatron(der, fon) }
}

export function tokenizarPatron(p, fon) {
  const out = []
  let i = 0
  while (i < p.length) {
    const c = p[i]
    if (c === ' ') { i++; continue }
    if (c === '#') { out.push({ tipo: 'limite' }); i++; continue }
    if (c === '[') {
      const fin = p.indexOf(']', i)
      const valores = p.slice(i + 1, fin < 0 ? undefined : fin).split(',').map(s => s.trim()).filter(Boolean)
      out.push({ tipo: 'conjunto', valores }); i = fin < 0 ? p.length : fin + 1; continue
    }
    if (c === 'V' || c === 'C' || (fon?.clases && c in fon.clases)) {
      out.push({ tipo: 'clase', valor: c }); i++; continue
    }
    // Literal: un carácter más sus modificadores (ː, ʰ...). También dígrafos AFI (tʃ, dʒ) si existen.
    const inventario = [...(fon?.consonantes ?? []), ...(fon?.vocales ?? [])].sort((a, b) => b.length - a.length)
    const largo = inventario.find(f => f.length > 1 && p.startsWith(f, i))
    if (largo) { out.push({ tipo: 'fonema', valor: largo }); i += largo.length; continue }
    let j = i + 1
    while (j < p.length && MODIFICADORES.test(p[j])) j++
    out.push({ tipo: 'fonema', valor: p.slice(i, j) }); i = j
  }
  return out
}

function encaja(token, fonema, fon) {
  if (token.tipo === 'limite') return fonema === undefined
  if (fonema === undefined) return false
  if (token.tipo === 'clase' && token.valor === 'V') return esVocal(fonema, fon)
  if (token.tipo === 'clase' && token.valor === 'C') return !esVocal(fonema, fon)
  return miembrosDe(token, fon).includes(fonema)
}

function contextoCumple({ izq, der }, fs, i, largo, fon) {
  for (let k = 0; k < izq.length; k++) {
    const pos = i - izq.length + k
    const f = pos < 0 ? undefined : fs[pos]
    if (izq[k].tipo === 'limite' ? pos >= 0 : !encaja(izq[k], f, fon)) return false
  }
  for (let k = 0; k < der.length; k++) {
    const pos = i + largo + k
    const f = pos >= fs.length ? undefined : fs[pos]
    if (der[k].tipo === 'limite' ? pos < fs.length : !encaja(der[k], f, fon)) return false
  }
  return true
}

/** Ortografía -> lista de fonemas subyacentes. */
export function aFonemas(palabra, fon) {
  const s = String(palabra).normalize('NFC').toLowerCase()
  const tabla = [...(fon.ortografia ?? [])].sort((a, b) => b.grafia.length - a.grafia.length)
  const conocidos = new Set([...fon.consonantes, ...fon.vocales])
  const fonemas = []
  const avisos = []
  let i = 0
  while (i < s.length) {
    const r = tabla.find(t => s.startsWith(t.grafia.toLowerCase(), i))
    if (r) {
      if (r.ipa) fonemas.push(r.ipa)
      i += r.grafia.length
      continue
    }
    const c = s[i]
    if (/\p{L}/u.test(c)) {
      fonemas.push(c)
      if (!conocidos.has(c)) avisos.push(`La letra «${c}» no está en la ortografía ni en el inventario.`)
    }
    i++
  }
  return { fonemas, avisos }
}

/** Aplica las reglas en orden. Devuelve fonemas resultantes y la traza de cambios. */
export function aplicarReglas(fonemas, fon) {
  let fs = [...fonemas]
  const traza = []
  for (const regla of fon.reglas ?? []) {
    const ctx = parsearContexto(regla.contexto ?? '_', fon)
    const deTok = tokenizarPatron(regla.de, fon)
    const aTok = regla.a === '' ? [] : tokenizarPatron(regla.a, fon)
    const origen = deTok[0]
    if (!origen) continue
    const deLista = miembrosDe(origen, fon)
    const aLista = aTok[0] ? miembrosDe(aTok[0], fon) : []
    const nuevo = []
    let cambio = false
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i]
      const pos = deLista.indexOf(f)
      if (pos >= 0 && contextoCumple(ctx, fs, i, 1, fon)) {
        // Si "a" es conjunto paralelo a "de", se usa la misma posición: [b,d,g] -> [p,t,k]
        const destino = aLista.length === 0 ? null : aLista.length === deLista.length ? aLista[pos] : aLista[0]
        if (destino !== f) cambio = true
        if (destino !== null) nuevo.push(destino)
      } else {
        nuevo.push(f)
      }
    }
    if (cambio) traza.push({ regla, antes: fs.join(''), despues: nuevo.join('') })
    fs = nuevo
  }
  return { fonemas: fs, traza }
}

/** Divide en sílabas: máximo ataque permitido (1 consonante, o grupo de ataquesPermitidos). */
export function silabear(fonemas, fon) {
  const nucleos = []
  fonemas.forEach((f, i) => { if (esVocal(f, fon)) nucleos.push(i) })
  if (nucleos.length === 0) return [fonemas]
  const permitidos = new Set(fon.silaba?.ataquesPermitidos ?? [])
  const cortes = [0]
  for (let n = 1; n < nucleos.length; n++) {
    const a = nucleos[n - 1], b = nucleos[n]
    const medio = b - a - 1
    let corte
    if (medio <= 1) corte = a + 1 // 0 consonantes: hiato; 1: pasa al ataque de la siguiente
    else {
      const dos = fonemas[b - 2] + fonemas[b - 1]
      corte = permitidos.has(dos) ? b - 2 : b - 1
    }
    cortes.push(corte)
  }
  const silabas = []
  for (let k = 0; k < cortes.length; k++) {
    silabas.push(fonemas.slice(cortes[k], cortes[k + 1] ?? fonemas.length))
  }
  return silabas
}

/** Índice de la sílaba tónica según la regla del idioma. */
export function silabaTonica(n, acento = 'penultima') {
  if (n <= 1 || acento === 'ninguno') return -1
  switch (acento) {
    case 'primera': return 0
    case 'ultima': return n - 1
    case 'antepenultima': return Math.max(0, n - 3)
    case 'penultima':
    default: return n - 2
  }
}

/**
 * Transcribe una palabra o frase al AFI.
 * @returns {{ ipa:string, palabras:Array, avisos:string[], traza:Array }}
 */
export function transcribir(texto, idioma) {
  const fon = idioma.fonologia
  const palabras = String(texto).split(/[\s\-–—]+/).map(p => p.replace(/[.,;:!?¡¿"«»()]/g, '')).filter(Boolean)
  const res = palabras.map(p => {
    const { fonemas, avisos } = aFonemas(p, fon)
    const { fonemas: superficie, traza } = aplicarReglas(fonemas, fon)
    const silabas = silabear(superficie, fon)
    const t = silabaTonica(silabas.length, fon.acento)
    const ipa = silabas.map((s, i) => (i === t ? 'ˈ' : '') + s.join('')).join('.')
      .replace(/\.ˈ/g, 'ˈ')
    return { palabra: p, subyacente: fonemas.join(''), ipa, silabas: silabas.map(s => s.join('')), tonica: t, avisos, traza }
  })
  return {
    ipa: '/' + res.map(r => r.ipa).join(' ') + '/',
    palabras: res,
    avisos: res.flatMap(r => r.avisos),
    traza: res.flatMap(r => r.traza)
  }
}

/** Fonemas -> ortografía (inversa de la tabla). Lo usa el generador. */
export function aOrtografia(fonemas, fon) {
  const inversa = new Map()
  for (const { grafia, ipa } of fon.ortografia ?? []) if (!inversa.has(ipa)) inversa.set(ipa, grafia)
  return fonemas.map(f => inversa.get(f) ?? f).join('')
}
