# Archa Lexica — guía de uso

## Cómo está organizado

```
archa-lexica/
├─ scripts/
│  ├─ validar.mjs        Revisa los JSON de idiomas
│  └─ nuevo-idioma.mjs   Crea un idioma nuevo desde la plantilla
├─ docs/
│  ├─ GUIA.md            Este documento
│  ├─ idioma.schema.json Esquema para autocompletar en VS Code
│  ├─ plantillas/        Plantilla JSON + plantilla de guía de diseño
│  └─ idiomas/           Tus guías de diseño, una por idioma (las crea nuevo-idioma)
└─ src/
   ├─ data/idiomas/      ← AQUÍ VIVEN LOS IDIOMAS (un .json por idioma)
   ├─ lib/               Motor: fonética, búsqueda
   └─ components/        Pantallas de la app (Vue)
```

## Flujo para crear un idioma

1. En la terminal: `npm run nuevo-idioma -- nombre`.
2. Rellena `docs/idiomas/nombre.md`: es la guía de diseño, en lenguaje humano.
3. Traslada las decisiones a `src/data/idiomas/nombre.json` (cada sección de la
   guía indica el campo). VS Code autocompleta gracias al esquema.
4. Añade palabras en `entradas`. Guarda: la app se recarga sola.
5. `npm run validar` para comprobar que todo cuadra.

Los archivos que empiezan por `_` (p. ej. `_borrador.json`) se ignoran.

## Categorías de palabra

`sustantivo, verbo, adjetivo, adverbio, pronombre, determinante, numeral,
preposicion, conjuncion, interjeccion, particula, afijo, locucion`

Las frases hechas, refranes y expresiones van como `locucion`, y con
`subcategoria` («frase hecha», «refrán», «saludo», «juramento»…) las distingues.
Para añadir categorías nuevas edita `src/lib/categorias.js`.

## Notación de las reglas de sonido

Cada regla es: **`de` → `a` / `contexto`**. Se aplican en el orden en que aparecen.

| Símbolo en `contexto` | Significa |
|---|---|
| `_` | dónde está el sonido que cambia (obligatorio) |
| `#` | inicio o final de palabra |
| `V` / `C` | cualquier vocal / consonante |
| `N`, `L`… | una clase definida en `fonologia.clases` |
| `[i,e]` | cualquiera de esos sonidos |

Ejemplos:

```json
{ "de": "t", "a": "d", "contexto": "V_V" }                    // t entre vocales → d
{ "de": "[b,d,g]", "a": "[p,t,k]", "contexto": "_#" }         // sonoras finales → sordas (en paralelo)
{ "de": "k", "a": "tʃ", "contexto": "_[i,e]" }                // palatalización
{ "de": "h", "a": "", "contexto": "#_" }                      // h inicial muda (a vacío = se elimina)
```

Si una palabra es irregular, pon su transcripción en `"pronunciacion"` y la app
usará esa en lugar de calcularla.

