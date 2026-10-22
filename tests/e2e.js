// Prueba de punta a punta en un navegador real (Chromium vía Playwright).
// Ejecutar:  npm install  &&  npm run test:e2e
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { servidor, opcionesNavegador, RAIZ } = require('./servidor');

// Esta prueba usa siempre los productos de ejemplo, aunque config.js apunte a una hoja.
const CONFIG_SIN_HOJA = fs.readFileSync(path.join(RAIZ, 'js', 'config.js'), 'utf8').replace(/hojaProductos: '[^']*'/, "hojaProductos: ''");
const sinHoja = (ctx) => ctx.route('**/js/config.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: CONFIG_SIN_HOJA }));

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

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-MX' });
  await sinHoja(ctx);
  // Las ventanas de WhatsApp/Instagram no se cargan: solo se revisa a dónde apuntan.
  await ctx.route(/^https:\/\/(wa\.me|www\.instagram\.com|www\.tiktok\.com)\//, (r) => r.fulfill({ status: 200, body: 'ok' }));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errores.push(m.text()); });

  const ir = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(120); };
  const cuenta = async () => Number((await page.textContent('.cuenta-resultados')).match(/\d+/)[0]);

  await page.goto(BASE, { waitUntil: 'load' });

  await paso('portada: categorías, temáticas, productos y redes', async () => {
    assert.equal(await page.locator('.categoria').count(), 4);
    assert.ok(await page.locator('.tarjeta').count() >= 12);
    assert.ok(await page.locator('.chip').count() >= 10);
    assert.ok(await page.locator('a[href="https://www.instagram.com/buendetalledistribuidora/"]').count() >= 1);
    assert.ok(await page.locator('a[href="https://www.tiktok.com/@bddfiestasymas"]').count() >= 1);
    const logos = await page.$$eval('.logo img', (imgs) => imgs.map((i) => ({ ok: i.complete && i.naturalWidth > 0, alt: i.alt })));
    assert.equal(logos.length, 2, 'logo en cabecera y pie');
    assert.ok(logos.every((l) => l.ok && l.alt === 'Buen Detalle Distribuidora'), JSON.stringify(logos));
    const wa = await page.getAttribute('#wa-flotante', 'href');
    assert.match(wa, /^https:\/\/wa\.me\/526641291909\?text=/);
  });

  await paso('"Ver catálogo" baja a la sección de categorías', async () => {
    await page.click('text=Ver catálogo');
    await page.waitForTimeout(700);
    const top = await page.evaluate(() => document.getElementById('categorias').getBoundingClientRect().top);
    assert.ok(top < 300, `categorías quedó en y=${top}`);
  });

  await paso('categoría: globos de foil y filtro por temática', async () => {
    await page.click('.navegacion a[href="#/categoria/globos-foil"]');
    await page.waitForTimeout(150);
    assert.equal(await cuenta(), 17);
    await page.click('#boton-filtros');
    await page.click('[data-filtro="tematica"][data-valor="amor"]');
    const n = await cuenta();
    assert.ok(n > 0 && n < 17, `con filtro: ${n}`);
    await page.selectOption('#ordenar', 'precio-desc');
    const precios = await page.$$eval('.tarjeta-precio', (els) => els.map((e) => Number(e.textContent.replace(/[^\d.]/g, ''))));
    assert.deepEqual(precios, [...precios].sort((a, b) => b - a));
  });

  await paso('temática Navidad reúne productos de varias categorías', async () => {
    await ir('#/tematica/navidad');
    const cats = await page.$$eval('[data-filtro="categoria"]:not([data-valor=""])', (els) => els.length);
    assert.ok(cats >= 3, `categorías: ${cats}`);
  });

  await paso('buscador: sugerencias, resultados, acentos y plurales', async () => {
    await page.fill('#buscar', 'corazones');
    await page.waitForSelector('#sugerencias:not([hidden]) .sugerencia');
    await page.press('#buscar', 'Enter');
    await page.waitForTimeout(150);
    const nombres = await page.$$eval('.tarjeta-nombre', (els) => els.map((e) => e.textContent));
    assert.ok(nombres.some((n) => /corazón 18/.test(n)), nombres.join(' | '));
    assert.ok(nombres.some((n) => /látex corazón/.test(n)), nombres.join(' | '));

    await page.fill('#buscar', 'pinos navideños');
    await page.press('#buscar', 'Enter');
    await page.waitForTimeout(150);
    const navidad = await page.$$eval('.tarjeta-nombre', (els) => els.map((e) => e.textContent));
    assert.ok(navidad.some((n) => /pino de Navidad/.test(n)), navidad.join(' | '));

    await page.fill('#buscar', 'globo rojo');
    await page.press('#buscar', 'Enter');
    await page.waitForTimeout(150);
    assert.ok(await cuenta() >= 5);

    await page.fill('#buscar', 'xyzqwe');
    await page.press('#buscar', 'Enter');
    await page.waitForTimeout(150);
    assert.match(await page.textContent('.vacio h2'), /No encontramos/);
  });

  await paso('producto: variantes cambian dibujo y precio de mayoreo', async () => {
    await ir('#/producto/globo-foil-numero-34');
    const antes = await page.innerHTML('#pp-img');
    await page.click('button[data-op="Plateado"]');
    await page.click('button.var-chip[data-op="5"]');
    const despues = await page.innerHTML('#pp-img');
    assert.notEqual(antes, despues);
    assert.match(despues, />5</);
    assert.match(await page.textContent('[data-actual="1"]'), /Plateado/);

    await page.fill('#pp-cantidad', '4');
    await page.dispatchEvent('#pp-cantidad', 'change');
    assert.match(await page.textContent('.precio-subtotal'), /4 × \$48\.00 = \$192\.00/);
    await page.click('#pp-agregar');
    await page.waitForSelector('#aviso:not([hidden])');
    assert.equal(await page.textContent('[data-contador]'), '4');

    // Otra variante del mismo producto: al sumar 6 piezas se activa el mayoreo.
    await page.click('button.var-chip[data-op="3"]');
    await page.click('button[data-op="Dorado"]');
    await page.click('[data-paso="1"]');
    assert.match(await page.textContent('.mayoreo-linea'), /Precio de mayoreo aplicado/);
    await page.click('#pp-agregar');
    assert.equal(await page.textContent('[data-contador]'), '6');
  });

  await paso('carrito: mayoreo sumando variantes y totales', async () => {
    await page.click('.cabecera-carrito');
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.linea').count(), 2);
    const unitarios = await page.$$eval('.linea-unit', (els) => els.map((e) => e.textContent));
    assert.ok(unitarios.every((t) => /\$40\.00/.test(t) && /Mayoreo/.test(t)), unitarios.join(' | '));
    assert.match(await page.textContent('#totales'), /\$240\.00/);
    assert.match(await page.textContent('#totales'), /Ahorro por mayoreo/);
  });

  await paso('envío: cambia con la distancia y con el peso', async () => {
    const leerEnvio = async () => {
      const t = await page.$$eval('.totales div', (els) => {
        const fila = els.find((e) => e.querySelector('dt').textContent === 'Envío');
        return fila.querySelector('dd').textContent;
      });
      return Number(t.replace(/[^\d.]/g, ''));
    };
    await page.selectOption('#e-estado', 'Baja California');
    await page.selectOption('#e-destino', 'Ensenada');
    assert.match(await page.textContent('#envio-detalle'), /Regional cercano/);
    const ensenada = await leerEnvio();
    const esperado = await page.evaluate(() => {
      const d = ENVIO.destinos.find((x) => x[1] === 'Ensenada');
      const r = window.BuenDetalle.resumenActual();
      return Calculos.calcularEnvio({ metodo: 'domicilio', destino: { lat: d[2], lng: d[3] }, pesoGramos: r.pesoGramos, subtotal: r.subtotal }, ENVIO).costo;
    });
    assert.equal(ensenada, esperado);

    await page.selectOption('#e-estado', 'Quintana Roo');
    await page.selectOption('#e-destino', 'Cancún');
    const cancun = await leerEnvio();
    assert.ok(cancun > ensenada, `Cancún ${cancun} vs Ensenada ${ensenada}`);

    // Más peso: subir la cantidad de una línea a 60 piezas (2.4 kg más).
    await page.fill('input[data-linea="0"]', '60');
    await page.dispatchEvent('input[data-linea="0"]', 'change');
    await page.waitForTimeout(100);
    const pesado = await leerEnvio();
    assert.ok(pesado > cancun, `pesado ${pesado} vs ${cancun}`);
    await page.fill('input[data-linea="0"]', '4');
    await page.dispatchEvent('input[data-linea="0"]', 'change');

    await page.check('input[name="metodo"][value="recoger"]', { force: true });
    assert.match(await page.textContent('#totales'), /Gratis/);
    assert.ok(await page.isHidden('#campo-direccion'));
    await page.check('input[name="metodo"][value="domicilio"]', { force: true });
  });

  await paso('pedido: valida datos y abre WhatsApp con el pedido completo', async () => {
    await page.click('#enviar-wa');
    assert.ok(await page.isVisible('#e-nombre'), 'debe pedir el nombre');
    assert.ok(await page.isVisible('#e-direccion'), 'debe pedir la dirección');

    await page.fill('#c-nombre', 'María López');
    await page.fill('#c-direccion', 'Av. Revolución 123, Zona Centro, 22000');
    await page.fill('#c-notas', 'Entregar en la tarde');
    const [ventana] = await Promise.all([page.waitForEvent('popup'), page.click('#enviar-wa')]);
    const url = ventana.url();
    await ventana.close();
    assert.match(url, /^https:\/\/wa\.me\/526641291909\?text=/);
    const texto = decodeURIComponent(url.split('text=')[1]);
    for (const parte of ['Globo foil número 34"', 'Número: 5', 'Color: Plateado', 'Número: 3', '(mayoreo)', 'Cancún, Quintana Roo', 'María López', 'Av. Revolución 123', 'Entregar en la tarde', '*Total:', 'Pedido BD-']) {
      assert.ok(texto.includes(parte), `falta "${parte}" en:\n${texto}`);
    }
    assert.ok(await page.isVisible('#confirmacion'));
  });

  await paso('el carrito y los datos se conservan al recargar', async () => {
    await page.reload();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.linea').count(), 2);
    assert.equal(await page.inputValue('#c-nombre'), 'María López');
    assert.equal(await page.inputValue('#e-destino'), 'Cancún');
  });

  await paso('vaciar carrito pide confirmación dentro de la página', async () => {
    await page.click('#vaciar-btn');
    await page.click('#vaciar-si');
    await page.waitForTimeout(100);
    assert.match(await page.textContent('.vacio-carrito h1'), /vacío/);
    assert.ok(await page.isHidden('[data-contador]'));
  });

  await paso('ninguna vista desborda a lo ancho en celular (390 px) ni en 320 px', async () => {
    const rutas = ['#/', '#/categoria/papeleria', '#/tematica/bodas', '#/tematicas', '#/buscar/globo', '#/producto/globo-foil-letra-16', '#/producto/kit-arco-organico', '#/carrito', '#/envios', '#/no-existe'];
    await page.evaluate(() => localStorage.setItem('bd-carrito', JSON.stringify([{ id: 'papel-kraft-rollo-10m', opciones: {}, cantidad: 3 }])));
    for (const ancho of [390, 320]) {
      await page.setViewportSize({ width: ancho, height: 800 });
      for (const r of rutas) {
        await ir(r);
        const w = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(w <= ancho, `${r} mide ${w}px a ${ancho}px`);
      }
    }
  });

  await paso('Sempertex: hay que elegir tono; precio y mayoreo por tamaño', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => localStorage.removeItem('bd-carrito'));
    await page.reload();
    await page.waitForSelector('.navegacion a');
    const enlace = page.locator('.navegacion a', { hasText: 'Globos Sempertex' });
    assert.equal(await enlace.count(), 1);
    await enlace.click();
    await page.waitForSelector('.tono');
    assert.equal(await page.locator('.tono').count(), 85);
    // Sin tono no se agrega.
    await page.click('#pp-agregar');
    assert.ok(await page.isVisible('#pp-tonos-aviso'));
    assert.ok(await page.isHidden('[data-contador]'));
    // 12": 4 dorados reflex + 2 rojos = 6 bolsas -> mayoreo de 12".
    await page.click('button.tamano[data-op="12\\""]');
    await page.click('.tonos-filtro button[data-familia="Reflex"]');
    assert.ok(await page.isHidden('.tonos-familia[data-familia="Fashion"]'));
    await page.click('button.tono[data-op="970 Dorado"]');
    assert.match(await page.textContent('#pp-nota-img'), /970 Dorado · Reflex · 12"/);
    assert.match(await page.textContent('#barra-tono'), /970 Dorado/);
    await page.fill('#pp-cantidad', '4');
    await page.dispatchEvent('#pp-cantidad', 'change');
    await page.click('#barra-agregar');
    await page.click('.tonos-filtro button[data-familia=""]');
    await page.click('button.tono[data-op="015 Rojo"]');
    await page.click('[data-paso="1"]');
    assert.match(await page.textContent('.mayoreo-linea'), /Precio de mayoreo aplicado/);
    await page.click('#pp-agregar');
    // 5" es otro precio y no suma al mayoreo de 12".
    await page.click('button.tamano[data-op="5\\""]');
    assert.match(await page.textContent('.precio-grande'), /\$135/);
    assert.match(await page.textContent('#pp-tonos [data-actual]'), /015 Rojo/);
    await page.click('#pp-agregar');
    assert.equal(await page.textContent('[data-contador]'), '7');

    await page.click('.cabecera-carrito');
    await page.waitForSelector('.linea');
    const lineas = await page.$$eval('.linea', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ')));
    assert.equal(lineas.length, 3);
    assert.ok(/Tamaño: 12" · Color: 970 Dorado/.test(lineas[0]) && /\$155\.00 c\/u/.test(lineas[0]), lineas[0]);
    assert.ok(/Tamaño: 12" · Color: 015 Rojo/.test(lineas[1]) && /\$155\.00 c\/u/.test(lineas[1]), lineas[1]);
    assert.ok(/Tamaño: 5" · Color: 015 Rojo/.test(lineas[2]) && /\$135\.00 c\/u/.test(lineas[2]), lineas[2]);
    assert.equal(await page.getAttribute('.linea-nombre', 'href'), '#/producto/globo-sempertex-redondo');
    const texto = await page.evaluate(() => window.BuenDetalle.mensajePedido('PRUEBA'));
    assert.match(texto, /Globo Sempertex redondo \(Tamaño: 12" · Color: 970 Dorado\)\n   4 × \$155\.00 = \$620\.00 \(mayoreo\)/);
    // El buscador encuentra la carta por familia o código.
    for (const q of ['reflex', '970', 'sempertex']) {
      await ir(`#/buscar/${q}`);
      const nombres = await page.$$eval('.tarjeta-nombre', (els) => els.map((e) => e.textContent));
      assert.ok(nombres.includes('Globo Sempertex redondo'), `${q}: ${nombres.join(' | ')}`);
    }
    await page.evaluate(() => localStorage.removeItem('bd-carrito'));
  });

  await paso('escritorio y modo oscuro cargan sin errores', async () => {
    const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 900 }, colorScheme: 'dark' });
    await sinHoja(ctx2);
    const p2 = await ctx2.newPage();
    p2.on('pageerror', (e) => errores.push(`oscuro: ${e.message}`));
    await p2.goto(BASE + '#/producto/bouquet-foil-cumpleanos');
    await p2.waitForTimeout(200);
    const fondo = await p2.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(fondo, 'rgb(21, 14, 23)');
    assert.ok(await p2.isVisible('.filtros') === false);
    await ctx2.close();
  });

  await paso('sin errores de JavaScript en la consola', async () => {
    assert.deepEqual(errores, []);
  });

  await browser.close();
  srv.close();
  console.log(pasos.join('\n'));
  console.log(process.exitCode ? '\nHay pruebas con fallas.' : `\nTodo bien: ${pasos.length} pruebas.`);
})();
