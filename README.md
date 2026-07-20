# Fichas AR — proyecto base

App de realidad aumentada que reconoce fichas físicas y muestra el resultado
de su combinación (Aire+Agua → Nube, Agua+Tierra → Lodo, etc.) en 3D.

Hecha con **MindAR** (tracking de imágenes) + **A-Frame** (motor 3D/AR).
No requiere instalar nada para correr — todo se carga desde CDN en el navegador.

## Qué te falta agregar (lo único pendiente)

1. **`assets/targets/targets.mind`** — generado a partir de fotos de tus 4 fichas.
   Instrucciones detalladas en `assets/targets/LEEME.txt`.

2. **Tus modelos `.glb`** dentro de `models/` — exportados de Blender.
   Instrucciones en `models/LEEME.txt`.

Con esos dos archivos, la app ya funciona tal cual está.

## Cómo probarlo en tu celular

Necesitas Node.js instalado (https://nodejs.org, versión LTS).

Desde la carpeta del proyecto, en una terminal:

```bash
npx serve .
```

Esto te da una URL tipo `http://localhost:3000`. Para probarlo desde tu
celular en la misma red WiFi, usa la IP de tu computadora en vez de
"localhost" (ej: `http://192.168.1.5:3000`) — la terminal de `serve`
usualmente ya te muestra esa dirección.

**Importante:** la cámara del navegador solo funciona en `localhost` o en
HTTPS. Si quieres probarlo desde afuera de tu red local antes de publicarlo,
usa **ngrok**:

```bash
npx ngrok http 3000
```

Eso te da un link HTTPS público temporal que puedes abrir desde cualquier
celular.

## Cómo publicarlo (gratis)

Cuando ya funcione bien, sube la carpeta completa a cualquiera de estos
(los tres son gratis y dan HTTPS automático):

- **Netlify** — arrastra la carpeta en https://app.netlify.com/drop
- **Vercel** — `npx vercel` desde la carpeta del proyecto
- **GitHub Pages** — sube el repo a GitHub y activa Pages en Settings

Obtienes un link público (ej. `tu-juego.netlify.app`) que cualquiera abre
desde el navegador del celular, sin instalar nada.

## Estructura del proyecto

```
ar-fichas-app/
├── index.html              ← escena AR, define las 4 fichas base
├── combinations.json       ← tabla de qué + qué = qué resultado
├── js/
│   └── app.js               ← lógica: detecta fichas, busca combo, muestra modelo
├── models/                  ← tus archivos .glb van aquí
└── assets/
    ├── targets/              ← targets.mind va aquí
    └── card-photos/          ← guarda aquí las fotos originales de las fichas
```

## Cómo agregar más fichas o combinaciones

1. Fotografía la nueva ficha y agrégala al final del lote al recompilar
   `targets.mind` (el orden = su `targetIndex`).
2. En `index.html`, copia un bloque `<a-entity id="target-N" ...>` nuevo
   con el índice correspondiente.
3. En `app.js`, sube el rango del for loop (`for (let i = 0; i <= 3; i++)`)
   para incluir el nuevo índice.
4. En `combinations.json`, agrega el nombre de la ficha en `"cards"` y sus
   combinaciones en `"combinations"`.

## Notas de diseño

- El modelo 3D del resultado aparece anclado sobre la ficha de menor índice
  de las dos que combinaste (no en un punto medio calculado, para simplicidad).
- Se necesita ver **ambas** fichas al mismo tiempo en cámara para que se
  detecte la combinación — pruébalo con las dos fichas juntas sobre una mesa.
- Ajusta el tamaño del modelo cambiando el `scale` del `result-anchor-N`
  correspondiente en `index.html` o en la animación dentro de `app.js`.
