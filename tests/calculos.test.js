// Pruebas de precios de mayoreo y cálculo de envío.  Ejecutar:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

globalThis.window = globalThis;
require(path.join(__dirname, '..', 'js', 'config.js'));
require(path.join(__dirname, '..', 'js', 'cartas.js'));
require(path.join(__dirname, '..', 'js', 'hoja.js'));
require(path.join(__dirname, '..', 'js', 'productos.js'));
const C = require(path.join(__dirname, '..', 'js', 'calculos.js'));

const E = globalThis.ENVIO;
const P = Object.fromEntries(globalThis.PRODUCTOS.map((p) => [p.id, p]));
const destino = (nombre) => {
  const d = E.destinos.find((x) => x[1] === nombre);
  assert.ok(d, `destino ${nombre}`);
  return { lat: d[2], lng: d[3] };
};

test('catálogo: ids únicos, categorías y temáticas válidas, datos completos', () => {
  const ids = new Set();
  const cats = new Set(globalThis.CATEGORIAS.map((c) => c.id));
  const temas = new Set(globalThis.TEMATICAS.map((t) => t.id));
  for (const p of globalThis.PRODUCTOS) {
    assert.ok(!ids.has(p.id), `id repetido ${p.id}`);
    ids.add(p.id);
    assert.ok(cats.has(p.categoria), `categoría inválida en ${p.id}`);
    p.tematicas.forEach((t) => assert.ok(temas.has(t), `temática ${t} inválida en ${p.id}`));
    assert.ok(p.precio > 0 && p.peso > 0, `precio/peso en ${p.id}`);
    assert.ok(p.descripcion && p.unidad && p.dibujo, `datos en ${p.id}`);
    if (p.mayoreo) assert.ok(p.mayoreo.precio < p.precio && p.mayoreo.min > 1, `mayoreo en ${p.id}`);
  }
  for (const c of cats) assert.ok(globalThis.PRODUCTOS.some((p) => p.categoria === c), `categoría vacía ${c}`);
});

test('distancia Tijuana → Ensenada ≈ 82 km en línea recta', () => {
  const km = C.distanciaKm(E.origen, destino('Ensenada'));
  assert.ok(km > 75 && km < 90, String(km));
});

test('zonas por distancia', () => {
  assert.equal(C.zonaPorDistancia(3, E.zonas).id, 'L1');
  assert.equal(C.zonaPorDistancia(7, E.zonas).id, 'L1');
  assert.equal(C.zonaPorDistancia(8, E.zonas).id, 'L2');
  assert.equal(C.zonaPorDistancia(100, E.zonas).id, 'R1');
  assert.equal(C.zonaPorDistancia(99999, E.zonas).id, 'N3');
});

test('destinos caen en la zona esperada', () => {
  const zona = (n) => C.zonaPorDistancia(C.distanciaCarreteraKm(E.origen, destino(n), E.factorCarretera), E.zonas).id;
  assert.equal(zona('Tijuana · Centro'), 'L1');
  assert.equal(zona('Playas de Rosarito'), 'L3');
  assert.equal(zona('Ensenada'), 'R1');
  assert.equal(zona('Mexicali'), 'R2');
  assert.equal(zona('Hermosillo'), 'N1');
  assert.equal(zona('Guadalajara'), 'N2');
  assert.equal(zona('Mérida'), 'N3');
});

test('mayoreo suma todas las variantes del mismo producto', () => {
  const estrella = P['globo-foil-estrella-18']; // $22, mayoreo 10+ a $17
  const r1 = C.resumenCarrito([
    { producto: estrella, cantidad: 6, opciones: { Color: 'Dorado' } },
    { producto: estrella, cantidad: 3, opciones: { Color: 'Plateado' } }
  ]);
  assert.equal(r1.subtotal, 9 * 22);
  assert.equal(r1.lineas[0].faltanParaMayoreo, 1);

  const r2 = C.resumenCarrito([
    { producto: estrella, cantidad: 6, opciones: { Color: 'Dorado' } },
    { producto: estrella, cantidad: 4, opciones: { Color: 'Plateado' } }
  ]);
  assert.equal(r2.subtotal, 10 * 17);
  assert.equal(r2.ahorro, 10 * 5);
  assert.ok(r2.lineas.every((l) => l.esMayoreo));
  assert.equal(r2.pesoGramos, 10 * 12);
});

test('envío: tarifa base cubre el primer kilo', () => {
  const r = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Ensenada'), pesoGramos: 500, subtotal: 300 }, E);
  // 500 g + 200 g de empaque = 0.7 kg -> 1 kg
  assert.equal(r.zona.id, 'R1');
  assert.equal(r.pesoKg, 1);
  assert.equal(r.kgAdicionales, 0);
  assert.equal(r.costo, 160);
});

test('envío: kilos adicionales se redondean hacia arriba', () => {
  const r = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Ensenada'), pesoGramos: 2300, subtotal: 300 }, E);
  // 2.3 kg + 0.2 kg = 2.5 kg -> 3 kg -> base 160 + 2 × 18
  assert.equal(r.pesoKg, 3);
  assert.equal(r.costo, 160 + 2 * 18);
});

test('envío: más lejos y más pesado cuesta más', () => {
  const cerca = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Tijuana · Centro'), pesoGramos: 1500, subtotal: 100 }, E);
  const lejos = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Cancún'), pesoGramos: 1500, subtotal: 100 }, E);
  const pesado = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Cancún'), pesoGramos: 6500, subtotal: 100 }, E);
  assert.ok(cerca.costo < lejos.costo);
  assert.ok(lejos.costo < pesado.costo);
});

test('envío gratis solo en zonas locales y desde el monto mínimo', () => {
  const local = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Tijuana · Zona Río'), pesoGramos: 1000, subtotal: 1500 }, E);
  assert.equal(local.gratis, true);
  assert.equal(local.costo, 0);
  const localPoco = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Tijuana · Zona Río'), pesoGramos: 1000, subtotal: 1499 }, E);
  assert.equal(localPoco.gratis, false);
  const foraneo = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Ensenada'), pesoGramos: 1000, subtotal: 5000 }, E);
  assert.equal(foraneo.gratis, false);
  assert.ok(foraneo.costo > 0);
});

test('pedidos muy pesados se cotizan aparte', () => {
  const r = C.calcularEnvio({ metodo: 'domicilio', destino: destino('Mexicali'), pesoGramos: 31000, subtotal: 100 }, E);
  assert.equal(r.cotizar, true);
  assert.equal(r.costo, 0);
  assert.equal(r.listo, false);
});

test('recoger en tienda no cuesta y sin destino no se calcula', () => {
  assert.equal(C.calcularEnvio({ metodo: 'recoger', pesoGramos: 5000, subtotal: 10 }, E).costo, 0);
  const sin = C.calcularEnvio({ metodo: 'domicilio', destino: null, pesoGramos: 5000, subtotal: 10 }, E);
  assert.equal(sin.listo, false);
  assert.equal(sin.costo, 0);
});
