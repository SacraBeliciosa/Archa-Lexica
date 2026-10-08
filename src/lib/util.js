import { ref } from 'vue'
import { transcribir } from './fonetica.js'
import { MAPA_IDIOMAS } from './idiomas.js'

/** Pronunciación de una entrada: la forzada en el JSON o la calculada. */
export function pronunciacionDe(entrada) {
  if (entrada.pronunciacion) return `/${entrada.pronunciacion.replace(/^\/|\/$/g, '')}/`
  const idioma = MAPA_IDIOMAS[entrada.idioma]
  if (!idioma?.fonologia?.vocales?.length) return ''
  return transcribir(entrada.lema, idioma).ipa
}

/** Aviso breve en pantalla. */
export const mensaje = ref('')
let temporizador
export function avisar(texto) {
  mensaje.value = texto
  clearTimeout(temporizador)
  temporizador = setTimeout(() => (mensaje.value = ''), 2200)
}

export async function copiar(texto, confirmacion = 'Copiado al portapapeles') {
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    const t = document.createElement('textarea')
    t.value = texto; document.body.appendChild(t); t.select()
    document.execCommand('copy'); t.remove()
  }
  avisar(confirmacion)
}

/** localStorage tolerante a fallos (modo privado, etc.). */
export const guardado = {
  leer(clave, defecto) {
    try { const v = localStorage.getItem('lexica.' + clave); return v === null ? defecto : JSON.parse(v) } catch { return defecto }
  },
  escribir(clave, valor) {
    try { localStorage.setItem('lexica.' + clave, JSON.stringify(valor)) } catch { /* sin almacenamiento */ }
  }
}
