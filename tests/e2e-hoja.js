// Prueba en navegador del catálogo desde Google Sheets (la hoja se simula).
// Ejecutar:  npm install  &&  npm run test:hoja
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { servidor, opcionesNavegador, RAIZ } = require('./servidor');

globalThis.window = globalThis;
require(path.join(RAIZ, 'js', 'productos.js'));
const H = require(path.join(RAIZ, 'js', 'hoja.js'));

const URL_HOJA = 'https://docs.google.com/spreadsheets/d/e/2PACX-prueba/pub?gid=0&single=true&output=csv';
const URL_EDITAR = 'https://docs.google.com/spreadsheets/d/1prueba/edit';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

// Hoja de prueba: la plantilla de ejemplo con algunos cambios.
function hojaDePrueba({ precioEstrella = 30 } = {}) {
  const ctx = { categorias: CATEGORIAS, tematicas: TEMATICAS, colores: COLORES };
  const filas = H.filasDesdeProductos(PRODUCTOS, ctx);
  const col = Object.fromEntries(filas[0].map((t, i) => [t, i]));
  const fila = (id) => filas.find((f) => f[col['Código']] === id);
  fila('globo-foil-estrella-18')[col['Precio']] = precioEstrella;
  fila('globo-foil-corazon-18')[col['Estado']] = 'Agotado';
  fila('globo-foil-pino-navidad-18')[col['Estado']] = 'Oculto';
  const nueva = filas[0].map(() => '');
  Object.assign(nueva, {
    [col['Nombre']]: 'Globo foil "Feliz Día Mamá" 18"', [col['Categoría']]: 'Globos de foil',
    [col['Temáticas']]: 'Día de las Madres', [col['Precio']]: '26', [col['Peso (g)']]: '13',
    [col['Descripción']]: 'Para mamá.', [col['Colores']]: 'Rosa, Rojo',
    [col['Foto']]: 'https://drive.google.com/file/d/1FotoDePruebaMama/view?usp=sharing', [col['Nuevo']]: 'Sí'
  });
  const mala = filas[0].map(() => '');
  Object.assign(mala, { [col['Nombre']]: 'Producto sin precio', [col['Categoría']]: 'Papelería' });
  filas.push(nueva, mala);
  return H.aCSV(filas);
}

const pasos = [];
async function paso(nombre, fn) {
  try {
    await fn();
    pasos.push(`  ✔ ${nombre}`);
  } catch (e) {
    pasos.push(`  ✘ ${nombre}\n      ${e.message.split('\n').join('\n      ')}`);
    process.exitCode = 1;
  }
}

(async () => {
  const srv = await servidor();
  const BASE = `http://127.0.0.1:${srv.address().port}/index.html`;
  const browser = await chromium.launch(opcionesNavegador());
  const errores = [];
  const config = fs.readFileSync(path.join(RAIZ, 'js', 'config.js'), 'utf8')
    .replace(/hojaProductos: '[^']*'/, `hojaProductos: '${URL_HOJA}'`)
    .replace(/hojaEditar: '[^']*'/, `hojaEditar: '${URL_EDITAR}'`);
  assert.ok(config.includes(URL_HOJA), 'no se pudo poner el enlace de prueba en config.js');

  let csvActual = hojaDePrueba();
  let hojaCaida = false;
  let lecturas = 0;

  async function nuevoContexto() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-MX' });
    await ctx.route('**/js/config.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: config }));
    await ctx.route(/docs\.google\.com\/spreadsheets/, (r) => {
      lecturas++;
      if (hojaCaida) return r.abort('internetdisconnected');
      return r.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: csvActual });
    });
    await ctx.route(/drive\.google\.com\/thumbnail/, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
    await ctx.route(/^https:\/\/(wa\.me|www\.instagram\.com|www\.tiktok\.com)\//, (r) => r.fulfill({ status: 200, body: 'ok' }));
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|internetdisconnected|Failed to load resource/.test(m.text())) errores.push(m.text()); });
    return { ctx, page };
  }

  const { ctx, page } = await nuevoContexto();
  const ir = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(150); };

  // Un carrito guardado de antes: el corazón se va a agotar.
  await page.goto(BASE + '#/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('bd-carrito', JSON.stringify([
    { id: 'globo-foil-corazon-18', opciones: { Color: 'Rojo' }, cantidad: 3 },
    { id: 'globo-foil-estrella-18', opciones: { Color: 'Dorado' }, cantidad: 2 }
  ])));
  await page.reload();
  await page.waitForSelector('.tarjeta:not(.tarjeta-fantasma)');

  await paso('la tienda toma los productos y precios de la hoja', async () => {
    assert.equal(await page.evaluate(() => window.BuenDetalle.fuente.tipo), 'hoja');
    await ir('#/producto/globo-foil-estrella-18');
    assert.match(await page.textContent('.precio-grande'), /\$30/);
  });

  await paso('una temática nueva escrita en la hoja crea su propia página', async () => {
    await ir('#/tematicas');
    assert.ok(await page.locator('.tematica-nombre', { hasText: 'Día de las Madres' }).count() === 1);
    await ir('#/tematica/dia-de-las-madres');
    const nombres = await page.$$eval('.tarjeta-nombre', (els) => els.map((e) => e.textContent));
    assert.deepEqual(nombres, ['Globo foil "Feliz Día Mamá" 18"']);
  });

  await paso('la foto de Google Drive se muestra como imagen', async () => {
    const src = await page.getAttribute('.tarjeta-img img', 'src');
    assert.equal(src, 'https://drive.google.com/thumbnail?id=1FotoDePruebaMama&sz=w1000');
  });

  await paso('un producto agotado se ve pero no se puede comprar', async () => {
    await ir('#/producto/globo-foil-corazon-18');
    assert.equal(await page.locator('#pp-agregar').count(), 0);
    assert.match(await page.textContent('.aviso-agotado'), /Agotado/);
    assert.match(await page.textContent('#pp-preguntar'), /vuelve a llegar/);
    await ir('#/categoria/globos-foil');
    const ultimas = await page.$$eval('.tarjeta', (els) => els.map((e) => e.classList.contains('tarjeta-agotada')));
    assert.equal(ultimas[ultimas.length - 1], true, 'los agotados van al final');
    assert.equal(ultimas.filter(Boolean).length, 1);
  });

  await paso('un producto oculto no aparece en la tienda ni en el buscador', async () => {
    await ir('#/producto/globo-foil-pino-navidad-18');
    assert.match(await page.textContent('h1'), /No encontramos/);
    await page.fill('#buscar', 'pino');
    await page.press('#buscar', 'Enter');
    await page.waitForTimeout(150);
    const nombres = await page.$$eval('.tarjeta-nombre', (els) => els.map((e) => e.textContent));
    assert.ok(!nombres.some((n) => /pino/i.test(n)), nombres.join(' | '));
  });

  await paso('el carrito guardado pierde lo agotado y avisa', async () => {
    await ir('#/carrito');
    const lineas = await page.$$eval('.linea-nombre', (els) => els.map((e) => e.textContent));
    assert.deepEqual(lineas, ['Globo foil estrella 18"']);
    assert.match(await page.textContent('.linea-unit'), /\$30\.00/);
  });

  await paso('la página de revisión resume la hoja y señala la fila con error', async () => {
    await ir('#/revisar');
    assert.match(await page.textContent('.estado-fuente'), /Conectada a tu hoja/);
    assert.equal(await page.getAttribute('.estado-acciones a', 'href'), URL_EDITAR);
    const cifras = Object.fromEntries(await page.$$eval('.rev-cifras div', (els) => els.map((e) => [e.querySelector('dt').textContent, e.querySelector('dd').textContent])));
    assert.equal(cifras['Filas con error'], '1');
    assert.equal(cifras['Agotados'], '1');
    assert.equal(cifras['Ocultos'], '1');
    assert.equal(cifras['En la tienda'], String(PRODUCTOS.length));
    assert.match(await page.textContent('.tabla-rev'), /Falta el precio/);
    assert.match(await page.textContent('main'), /Temáticas nuevas/);
  });

  await paso('al cambiar la hoja, "Volver a leer la hoja" actualiza la tienda', async () => {
    csvActual = hojaDePrueba({ precioEstrella: 35 });
    await page.click('#rev-releer');
    await page.waitForFunction(() => !document.getElementById('rev-releer') || !document.getElementById('rev-releer').disabled);
    await ir('#/producto/globo-foil-estrella-18');
    assert.match(await page.textContent('.precio-grande'), /\$35/);
  });

  await paso('revisar un archivo CSV no cambia la tienda', async () => {
    await ir('#/revisar');
    const csv = 'Nombre,Categoría,Precio,Peso (g)\nGlobo prueba,Globos de foil,12,10\nOtro,Juguetes,5,1\n';
    await page.setInputFiles('#rev-archivo', { name: 'prueba.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await page.waitForSelector('#rev-salir');
    assert.match(await page.textContent('.estado-fuente'), /prueba\.csv/);
    assert.match(await page.textContent('.tabla-rev'), /"Juguetes" no existe/);
    await page.click('#rev-salir');
    assert.match(await page.textContent('.estado-fuente'), /Conectada a tu hoja/);
    await ir('#/buscar/globo prueba');
    assert.match(await page.textContent('.vacio h2'), /No encontramos/);
  });

  await paso('sin conexión a la hoja se usa la copia guardada', async () => {
    hojaCaida = true;
    await ir('#/producto/globo-foil-estrella-18');
    await page.reload();
    await page.waitForSelector('.precio-grande');
    assert.match(await page.textContent('.precio-grande'), /\$35/);
    await page.waitForFunction(() => window.BuenDetalle.fuente.error);
    await ir('#/revisar');
    assert.match(await page.textContent('.estado-fuente'), /copia guardada/);
  });

  await paso('sin hoja y sin copia, se avisa en lugar de mostrar productos de ejemplo', async () => {
    const { ctx: ctx2, page: p2 } = await nuevoContexto();
    await p2.goto(BASE + '#/');
    await p2.waitForSelector('#reintentar');
    assert.match(await p2.textContent('h1'), /No pudimos cargar los productos/);
    assert.equal(await p2.locator('.tarjeta:not(.tarjeta-fantasma)').count(), 0);
    // Cuando la hoja vuelve, "Volver a intentar" carga la tienda.
    hojaCaida = false;
    await p2.click('#reintentar');
    await p2.waitForSelector('.categoria');
    assert.ok(await p2.locator('.tarjeta').count() > 10);
    await ctx2.close();
  });

  await paso('la página de revisión no desborda en celular', async () => {
    await ir('#/revisar');
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(w <= 390, `mide ${w}px`);
  });

  await paso('sin errores de JavaScript en la consola', async () => {
    assert.deepEqual(errores, []);
    assert.ok(lecturas >= 3);
  });

  await ctx.close();
  await browser.close();
  srv.close();
  console.log(pasos.join('\n'));
  console.log(process.exitCode ? '\nHay pruebas con fallas.' : `\nTodo bien: ${pasos.length} pruebas.`);
})();
