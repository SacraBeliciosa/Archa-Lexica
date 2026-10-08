# Archa Lexica

Diccionario y códice de las lenguas de tu mundo. Web app en **Vue 3 + Vite**.

## Arranque rápido

Requiere Node.js 20 o superior.

1. `npm install` (solo la primera vez).
2. `npm run dev` → se abre en `http://localhost:5180`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run validar` | Revisa los JSON de idiomas |
| `npm run nuevo-idioma -- nombre` | Crea idioma + guía desde las plantillas |
| `npm run build` | Valida y compila a `dist/` |
| `npm run preview` | Sirve la compilación de `dist/` |

## Qué incluye (v0.1)

- **Diccionario**: búsqueda en ambos sentidos (lengua ↔ español), coincidencia
  «contiene / empieza por / exacta», filtros por lengua, tipo de palabra (verbos,
  sustantivos, adjetivos… y frases hechas) y tema; orden alfabético **propio de
  cada lengua** (dígrafos incluidos), por traducción, categoría o idioma.
- **Ficha de entrada**: pronunciación AFI calculada, sílabas, formas, ejemplos,
  etimología y enlaces entre palabras (también entre lenguas).
- **Lenguas**: ficha de cada idioma con inventario de sonidos, ortografía, sílabas,
  reglas de sonido, gramática, afijos y estadísticas del léxico.

Toda la información vive en `src/data/idiomas/*.json`. Lee **`docs/GUIA.md`** para
el formato, la notación de reglas y el flujo de trabajo con las plantillas.

## Hoja de ruta sugerida

- PWA instalable y con uso sin conexión, desplegada en Cloudflare.
- Reglas diacrónicas: derivar el léxico de una lengua hija desde una protolengua.
- Conjugación/declinación automática a partir de paradigmas.
- Exportar el diccionario a PDF / imprimir.
