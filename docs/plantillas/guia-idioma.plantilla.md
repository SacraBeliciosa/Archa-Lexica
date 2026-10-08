# {{NOMBRE}} — guía de diseño

> Documento de trabajo. Aquí decides **cómo es** el idioma; después trasladas
> las decisiones a `src/data/idiomas/{{ID}}.json`, que es lo que lee la app.
> Cada sección indica a qué campo del JSON corresponde.

---

## 1. Identidad  → `nombre`, `endonimo`, `familia`, `hablantes`, `descripcion`

| Campo | Valor |
|---|---|
| Nombre en español | {{NOMBRE}} |
| Nombre propio (endónimo) | |
| Familia / origen | |
| Quién lo habla y dónde | |
| Estado (viva, muerta, litúrgica, criolla…) | |
| Lenguas vecinas o de las que toma préstamos | |

**Sensación que debe transmitir** (suave, áspero, solemne, rápido…):

**Idiomas reales que sirven de referencia sonora** (opcional):

---

## 2. Sonidos  → `fonologia.consonantes`, `fonologia.vocales`

Escribe los sonidos en AFI. Si dudas, usa la letra española más parecida y
anota el matiz. Marca con ✓ los que existen.

### Consonantes

|            | Labial | Dental/Alveolar | Postalveolar | Velar | Uvular | Glotal |
|------------|--------|-----------------|--------------|-------|--------|--------|
| Oclusivas  | p b    | t d             |              | k g   | q      | ʔ      |
| Nasales    | m      | n               |              | ŋ     |        |        |
| Fricativas | f v    | s z θ ð         | ʃ ʒ          | x ɣ   | χ      | h      |
| Africadas  |        | ts dz           | tʃ dʒ        |       |        |        |
| Vibrantes  |        | ɾ r             |              |       |        |        |
| Laterales  |        | l ɬ             |              |       |        |        |
| Aproximantes | w    |                 | j            |       |        |        |

### Vocales

| | Anterior | Central | Posterior |
|---|---|---|---|
| Cerrada | i y | | u |
| Media | e ø | ə | o |
| Abierta | | a | |

¿Hay vocales largas (aː)? ¿Nasales (ã)? ¿Diptongos?

### Grupos de sonidos (clases)  → `fonologia.clases`

Agrupa sonidos que se comportan igual, con una letra MAYÚSCULA (que no sea C ni V):

| Letra | Sonidos | Para qué |
|---|---|---|
| N | m n | nasales |
| L | l ɾ | líquidas, segundas en grupos tipo «tr» |

---

## 3. Escritura  → `fonologia.ortografia`, `alfabeto`, `escritura`

¿Cómo se escribe cada sonido con letras latinas? Solo hace falta anotar los que
**no** se escriben igual que su símbolo AFI.

| Se escribe | Suena (AFI) | Ejemplo |
|---|---|---|
| th | θ | |
| r | ɾ | |

**Orden alfabético** (para ordenar el diccionario; los dígrafos cuentan como una letra):

a, b, c, ch, d, …

**Sistema de escritura nativo** (runas, silabario, ideogramas…):

---

## 4. Sílabas  → `fonologia.silaba`

**Formas de sílaba permitidas** y lo frecuentes que son (C = consonante, V = vocal,
o cualquier clase definida arriba):

| Patrón | Frecuencia (1–5) |
|---|---|
| CV | 5 |
| CVC | 2 |
| V | 1 |

**Grupos permitidos al inicio de sílaba** (pr, tr, kl…):

**Combinaciones prohibidas** (usa `#` para inicio/fin de palabra: `ŋ#` = no puede acabar en ŋ):

---

## 5. Acento  → `fonologia.acento`

- [ ] Primera sílaba (`primera`)
- [ ] Penúltima (`penultima`)
- [ ] Última (`ultima`)
- [ ] Antepenúltima (`antepenultima`)
- [ ] Sin acento marcado (`ninguno`)

---

## 6. Cambios de sonido  → `fonologia.reglas`

Reglas que hacen que una palabra no suene exactamente como se escribe.
Notación: **sonido → resultado / contexto**, donde `_` es la posición del sonido.

| De | A | Contexto | Explicación |
|---|---|---|---|
| t | d | V_V | Entre vocales se suaviza |
| [b,d,g] | [p,t,k] | _# | Se ensordecen al final |
| n | m | _[p,b] | Asimilación |

---

## 7. Gramática  → `gramatica.tipologia`, `gramatica.notas`

- Orden de palabras (SVO, SOV, VSO…):
- ¿Género? ¿Cuántos?
- ¿Número? (singular/plural/dual…) ¿Cómo se marca?
- ¿Casos? ¿Preposiciones o posposiciones?
- Tiempos y modos verbales:
- Cómo se forman las preguntas y la negación:

---

## 8. Formación de palabras  → `gramatica.afijos`

| Afijo | Tipo | Significado | Se aplica a | Resultado | Notas |
|---|---|---|---|---|---|
| -in | sufijo | plural | sustantivo | sustantivo | |
| um- | prefijo | negación | adjetivo | adjetivo | |

¿Se pierde la vocal final al unir (elisión)? ¿Hay que quitar alguna terminación antes?

---

## 9. Vocabulario semilla  → `entradas`

Las primeras 20–50 palabras que necesitas sí o sí: pronombres, números del 1 al 10,
verbos básicos (ser, ir, hacer, ver, decir), familia, elementos, colores y algún
saludo o frase hecha característica de la cultura.

| Palabra | Categoría | Traducción | Notas / etimología |
|---|---|---|---|
| | | | |

---

## 10. Cultura y registro

Tabúes, palabras sagradas, formas de cortesía, insultos, préstamos de otras lenguas,
dialectos… Todo lo que dé vida al idioma más allá de las reglas.
