# Tienda en línea · Buen Detalle Distribuidora

Tienda tipo catálogo para globos de foil, globos de látex, papelería y envolturas.
El cliente arma su carrito, el envío se calcula por **peso** y **distancia** desde Tijuana,
y el pedido se envía por **WhatsApp al 664 129 1909**.

Es un sitio estático (HTML, CSS y JavaScript, sin servidor ni base de datos), así que
se puede publicar gratis en Netlify, GitHub Pages, Vercel o Cloudflare Pages.

## Qué incluye

- **Productos editables desde Google Sheets, sin tocar código**: precios, mayoreo, pesos,
  colores, fotos, existencias (agotado/oculto) y temáticas nuevas. Incluye una página de
  revisión que avisa qué filas tienen errores.
- Portada con categorías, temáticas, productos de temporada (cambian solos según el mes),
  lo más pedido y novedades.
- Catálogo por **categoría** y por **temática**, con filtros (categoría, temática, precio,
  mayoreo) y orden por precio o nombre.
- **Buscador** con sugerencias al escribir. Entiende palabras sin acento y en plural
  ("corazones", "liston satinado", "pinos navideños").
- **Página de producto** con imagen, precio, descripción, ficha técnica, variantes
  (color, número, letra, diseño, paleta) y productos relacionados.
- **Precio de mayoreo automático**: se activa al llegar al mínimo, sumando todas las
  variantes del mismo producto (por ejemplo, 6 estrellas doradas + 4 plateadas = 10).
- **Carrito** que se guarda en el navegador del cliente, con cálculo de envío:
  - distancia aproximada por carretera desde la tienda hasta la ciudad o zona elegida
    (incluye zonas de Tijuana, todo Baja California y las principales ciudades de México);
  - zona de envío según la distancia;
  - peso del pedido + empaque, redondeado al kilo;
  - costo = tarifa base de la zona (incluye 1 kg) + kilos adicionales;
  - opción de recoger en tienda sin costo y envío gratis local desde cierto monto.
- **Botón "Enviar pedido por WhatsApp"** que abre el chat con el pedido completo:
  folio, productos, variantes, cantidades, precios, envío, total, nombre, dirección,
  fecha deseada, forma de pago y notas.
- Enlaces a Instagram **@buendetalledistribuidora** y TikTok **@bddfiestasymas**.
- Diseño adaptado a celular, con modo oscuro automático.

## Archivos

```
index.html            página principal
css/estilos.css       diseño
js/config.js          datos del negocio, redes, formas de pago y TARIFAS DE ENVÍO
js/cartas.js          carta de colores Sempertex (códigos, nombres y tonos)
js/productos.js       categorías, temáticas, colores y productos de EJEMPLO
js/hoja.js            lee la hoja de Google Sheets y la convierte en productos
plantilla-productos.xlsx  plantilla de la hoja de productos (con los ejemplos)
js/calculos.js        mayoreo, peso y costo de envío
js/dibujos.js         ilustraciones de ejemplo mientras no hay fotos
js/app.js             funcionamiento de la tienda
img/                  logo (logo.webp y logo.png), logos de marcas (marcas/), ícono del osito (favicon.png,
                      icono-180.png) y fotos de productos si no usas Google Drive
tests/                pruebas automáticas
```

## Editar productos sin tocar código (Google Sheets)

Los productos viven en una hoja de Google Sheets. Lo que cambies ahí aparece en la tienda
en cuanto un cliente la abre o la recarga.

### Conectar la hoja (solo una vez)

1. Sube `plantilla-productos.xlsx` a tu Google Drive, ábrelo y elige
   **Archivo → Guardar como Hojas de cálculo de Google**.
2. En la hoja de Google presiona **Compartir** → Acceso general:
   **Cualquier persona con el enlace** (permiso Lector) → **Copiar enlace**.
3. Pega ese enlace en `js/config.js`, en `hojaProductos: ''` (entre las comillas), y vuelve
   a subir la tienda. Es el único cambio de código, y solo se hace una vez.
4. Abre `tudominio/#/revisar` para confirmar que quedó conectada.

> Cualquiera con el enlace puede ver la hoja: no pongas costos ni datos privados en ella.
> También funciona el enlace de *Archivo → Compartir → Publicar en la Web* en formato CSV,
> pero con ese Google tarda hasta 5 minutos en mostrar los cambios.

### Cómo se llena

Una fila = un producto. La pestaña **Instrucciones** de la plantilla explica cada columna;
lo esencial:

| Columna | Qué poner |
|---|---|
| Nombre, Categoría, Precio | Obligatorias. Sin ellas la fila no se publica. |
| Temáticas | Separadas por comas. Si escribes una nueva ("Día de las Madres"), se crea sola. |
| Precio mayoreo / Mayoreo desde | Precio por unidad y cantidad mínima (suma todos los colores). |
| Peso (g) | Gramos por unidad; se usa para el envío. |
| Colores | "Dorado, Rosa pastel". Para otro color: "Turquesa #1fb5ad". |
| Otra opción / Valores | Por ejemplo "Número" con "0-9", "Letra" con "A-Z", "Diseño" con "Navidad, Baby". |
| Foto | Enlace de Google Drive (foto compartida con cualquiera con el enlace). Vacío = ilustración. |
| Estado | **Visible**, **Agotado** (se ve pero no se compra) u **Oculto** (no aparece). |
| Presentación | Para varios tamaños: una fila por tamaño con el **mismo nombre** (y el mismo código) y aquí `5"`, `12"`, `18"`. Cada fila lleva su precio, mayoreo, peso y "Se vende por". |
| Colores agotados | Colores o códigos sin existencia (`015, 390`). En un producto con tamaños, solo afecta a esa fila. |

### Carta de colores Sempertex

En "Colores" se puede escribir **Carta Sempertex** (85 tonos), una familia como
**Sempertex Reflex** o códigos sueltos (`015, 041, 970`). Los tonos, sus códigos, familias
(Fashion, Pastel Mate, Neón, Pastel Dusk, Satín, Silk, Metálico y Reflex) y el color con el que
se ven en pantalla están en `js/cartas.js`; la pestaña "Carta Sempertex" de la plantilla los
lista. En la tienda el cliente ve la carta en globitos de color, filtra por familia, elige el
tono y el tamaño, y ve una vista previa del globo comparado con los otros tamaños.

Los productos con "Sempertex" en el nombre o con tonos de la carta llevan el logo de la marca
(`img/marcas/sempertex.webp`) en su tarjeta y su página, y aparecen en la sección
**Globos Sempertex** (`tudominio/#/marca/sempertex`, enlazada en el menú y en la portada).
Dos bolsas del mismo tamaño con distinta cantidad van en filas separadas del mismo producto,
por ejemplo `18" (15 pz)` y `18" (25 pz)`, como en el globo Sempertex Reflex.

No cambies el **Código** de un producto ya publicado: lo usan los carritos y los enlaces
que hayas compartido. No cambies los encabezados ni el orden de las pestañas
(**Productos** debe ser la primera).

### Página de revisión

`tudominio/#/revisar` (no aparece en el menú) muestra si la hoja está conectada, cuántos
productos hay visibles, agotados, ocultos y sin foto, y una lista de las filas con problemas
con el número de fila y qué corregir. También permite revisar un archivo CSV antes de
pasarlo a la hoja.

Si la hoja no responde, la tienda usa la última copia que guardó el navegador del cliente.
Si nunca la pudo leer, muestra un aviso con el botón de WhatsApp en lugar de productos de
ejemplo.

## Editar productos en el código (opcional)

Si no se configura una hoja (`hojaProductos` vacío), la tienda usa los productos de
`js/productos.js`. Cada producto es un bloque como este:

```js
{
  id: 'globo-foil-estrella-18',          // único, sin espacios ni acentos
  nombre: 'Globo foil estrella 18"',
  categoria: 'globos-foil',              // globos-foil, globos-latex, papeleria o envolturas
  tematicas: ['cumpleanos', 'navidad'],  // ver la lista TEMATICAS al inicio del archivo
  precio: 22,                            // menudeo, en pesos
  mayoreo: { min: 10, precio: 17 },      // opcional
  unidad: 'pieza',
  peso: 12,                              // gramos por unidad (para el envío)
  descripcion: '...',
  detalles: [['Medida', '18 in (45 cm)'], ['Material', 'Foil metalizado']],
  variantes: [colores(['dorado', 'plateado', 'rosa'])],
  imagen: 'img/globo-estrella.jpg',      // foto real (opcional)
  dibujo: { tipo: 'estrella' },          // ilustración si no hay foto
  destacado: true,                       // aparece en "Lo más pedido"
  nuevo: true                            // etiqueta "Nuevo"
}
```

### Fotos en la carpeta img

1. Guarda la foto en la carpeta `img/` (de preferencia cuadrada, 800 × 800 px, JPG o WebP).
2. En el producto agrega `imagen: 'img/nombre-de-la-foto.jpg'`.
3. Si quieres una foto distinta por color, agrégala en la opción:
   `{ nombre: 'Dorado', color: '#d4a72c', imagen: 'img/estrella-dorada.jpg' }`.

Mientras un producto no tenga foto se muestra un dibujo con la leyenda "Imagen ilustrativa".

## Cómo cambiar tarifas de envío

En `js/config.js`, sección `ENVIO`:

- `origen`: ubicación exacta de la tienda o bodega (latitud y longitud; se obtienen en
  Google Maps con clic derecho sobre el lugar).
- `zonas`: distancia máxima, tarifa base (incluye el primer kilo), costo por kilo adicional
  y tiempo estimado de cada zona.
- `empaqueGramos`: peso de caja y relleno que se suma a cada pedido.
- `pesoMaximoKg`: arriba de este peso el envío se cotiza por WhatsApp.
- `envioGratis`: monto mínimo y zonas con envío gratis (o `null` para quitarlo).
- `destinos`: ciudades y zonas que el cliente puede elegir.

## Ver la tienda en tu computadora

Abre `index.html` con doble clic, o para una prueba más fiel:

```
npx serve .
```

y entra a la dirección que aparece (por ejemplo http://localhost:3000).

## Dónde está publicada y cómo se actualiza

La tienda está publicada con GitHub Pages en
**https://osvaldoortiz0123-create.github.io/buen-detalle-tienda/**
desde la rama `main` de este repositorio.

- **Productos, precios, fotos y existencias:** se cambian en la hoja de Google. No hay que
  volver a publicar nada.
- **Diseño, textos o funciones:** cualquier cambio que se suba a la rama `main` se publica
  solo en uno o dos minutos. Puedes pedirlo a Claude Code abriendo una sesión con este
  repositorio, o editar un archivo directamente en github.com (botón del lápiz → *Commit changes*).

### Dominio propio (cuando lo tengas)

1. Compra el dominio en un registrador (por ejemplo, para .mx: Akky, Neubox o GoDaddy).
2. En el DNS del dominio agrega un registro **CNAME** de `www` (o del subdominio que elijas,
   como `tienda`) hacia `osvaldoortiz0123-create.github.io`.
3. En GitHub: *Settings → Pages → Custom domain*, escribe el dominio, guarda y activa
   *Enforce HTTPS* cuando aparezca disponible.

## Pruebas automáticas

```
npm install
npm test           # cálculos de mayoreo, envío y lectura de la hoja
npm run test:e2e   # recorre la tienda en un navegador, con y sin hoja de Google
```
