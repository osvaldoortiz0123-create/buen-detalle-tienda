// Pruebas del catálogo desde hoja de cálculo.  Ejecutar:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

globalThis.window = globalThis;
require(path.join(__dirname, '..', 'js', 'productos.js'));
const H = require(path.join(__dirname, '..', 'js', 'hoja.js'));

const ejemplos = Object.fromEntries(globalThis.PRODUCTOS.map((p) => [p.id, p]));
const ctx = { categorias: globalThis.CATEGORIAS, tematicas: globalThis.TEMATICAS, colores: globalThis.COLORES, ejemplos };
const ctxSinEjemplos = { ...ctx, ejemplos: {} };
const ENC = H.COLUMNAS.map((c) => c[1]);

// Crea un CSV con los encabezados de la plantilla y las filas dadas como objetos.
function hoja(filas) {
  return H.aCSV([ENC, ...filas.map((f) => H.COLUMNAS.map((c) => f[c[1]] ?? ''))]);
}
const leer = (csv, c = ctxSinEjemplos) => H.productosDesdeFilas(H.leerCSV(csv), c);

test('CSV con comillas, comas, saltos de línea y BOM', () => {
  const filas = H.leerCSV('﻿a,b,c\r\n"uno, dos","con ""comillas""","línea 1\nlínea 2"\n,,\nfin');
  assert.deepEqual(filas[0], ['a', 'b', 'c']);
  assert.deepEqual(filas[1], ['uno, dos', 'con "comillas"', 'línea 1\nlínea 2']);
  assert.deepEqual(filas[3], ['fin']);
  assert.deepEqual(H.leerCSV(H.aCSV(filas)), filas);
});

test('números con signo de pesos, miles y coma decimal', () => {
  assert.equal(H.numero('$1,250.50'), 1250.5);
  assert.equal(H.numero('22'), 22);
  assert.equal(H.numero('22,5'), 22.5);
  assert.equal(H.numero(' 85 MXN '), 85);
  assert.equal(H.numero(''), null);
  assert.ok(Number.isNaN(H.numero('veinte')));
});

test('rangos de opciones y su compresión', () => {
  assert.deepEqual(H.expandir('0-9'), '0123456789'.split(''));
  assert.equal(H.expandir('A-Z').length, 27);
  assert.ok(H.expandir('A-Z').includes('Ñ'));
  assert.deepEqual(H.expandir('Chico, Mediano,Grande'), ['Chico', 'Mediano', 'Grande']);
  assert.equal(H.comprimir('0123456789'.split('')), '0-9');
  assert.equal(H.comprimir('ABCDEFGHIJKLMNÑOPQRSTUVWXYZ&'.split('')), 'A-Z, &');
  assert.equal(H.comprimir(['1', '2', '5']), '1, 2, 5');
});

test('enlaces de fotos de Google Drive, Dropbox y carpeta img', () => {
  assert.equal(H.enlaceFoto('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing'), 'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOp&sz=w1000');
  assert.equal(H.enlaceFoto('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp'), 'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOp&sz=w1000');
  assert.equal(H.enlaceFoto('https://www.dropbox.com/s/abc/foto.jpg?dl=0'), 'https://www.dropbox.com/s/abc/foto.jpg?raw=1');
  assert.equal(H.enlaceFoto('estrella.jpg'), 'img/estrella.jpg');
  assert.equal(H.enlaceFoto('https://ejemplo.com/a.png'), 'https://ejemplo.com/a.png');
});

test('enlaces de la hoja se convierten a CSV', () => {
  assert.equal(H.enlaceCSV('https://docs.google.com/spreadsheets/d/e/2PACX-abc/pubhtml?gid=0&single=true'),
    'https://docs.google.com/spreadsheets/d/e/2PACX-abc/pub?gid=0&single=true&output=csv');
  assert.equal(H.enlaceCSV('https://docs.google.com/spreadsheets/d/e/2PACX-abc/pub?gid=0&single=true&output=csv'),
    'https://docs.google.com/spreadsheets/d/e/2PACX-abc/pub?gid=0&single=true&output=csv');
  assert.equal(H.enlaceCSV('https://docs.google.com/spreadsheets/d/1XyZ_abc/edit#gid=0'),
    'https://docs.google.com/spreadsheets/d/1XyZ_abc/export?format=csv&gid=0');
  assert.equal(H.enlaceCSV('https://docs.google.com/spreadsheets/d/1XyZ_abc/edit?usp=sharing'),
    'https://docs.google.com/spreadsheets/d/1XyZ_abc/export?format=csv');
  assert.equal(H.enlaceCSV(''), '');
});

test('una fila completa se convierte en producto', () => {
  const r = leer(hoja([{
    'Nombre': 'Globo foil "Feliz Día Mamá" 18"', 'Categoría': 'foil', 'Temáticas': 'Día de las Madres, cumpleaños',
    'Precio': '$26', 'Precio mayoreo': '20', 'Mayoreo desde': '10', 'Peso (g)': '13', 'Descripción': 'Para mamá.',
    'Características': 'Medida: 18 in; Material: Foil', 'Colores': 'Rosa, Turquesa #1fb5ad', 'Otra opción': 'Tamaño',
    'Valores de la opción': 'Chico, Grande', 'Foto': 'mama.jpg', 'Fotos por opción': 'Rosa = https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view',
    'Destacado': 'Sí', 'Nuevo': 'x', 'Estado': 'Agotado', 'Palabras para buscar': 'mamá madre 10 de mayo'
  }]));
  assert.deepEqual(r.problemas, []);
  const p = r.productos[0];
  assert.equal(p.id, 'globo-foil-feliz-dia-mama-18');
  assert.equal(p.categoria, 'globos-foil');
  assert.equal(p.precio, 26);
  assert.deepEqual(p.mayoreo, { min: 10, precio: 20 });
  assert.equal(p.peso, 13);
  assert.equal(p.estado, 'agotado');
  assert.equal(p.destacado, true);
  assert.equal(p.nuevo, true);
  assert.deepEqual(p.detalles, [['Medida', '18 in'], ['Material', 'Foil']]);
  assert.equal(p.imagen, 'img/mama.jpg');
  assert.deepEqual(p.variantes.map((g) => g.nombre), ['Tamaño', 'Color']);
  assert.deepEqual(p.variantes[1].opciones.map((o) => o.color), ['#ff7eb6', '#1fb5ad']);
  assert.match(p.variantes[1].opciones[0].imagen, /thumbnail\?id=1AbCdEfGhIjKlMnOp/);
  // Temática nueva creada y existente reconocida sin acento.
  assert.equal(r.tematicasNuevas.length, 1);
  assert.equal(r.tematicasNuevas[0].nombre, 'Día de las Madres');
  assert.deepEqual(p.tematicas, ['dia-de-las-madres', 'cumpleanos']);
  // Ilustración adivinada por el nombre, con el texto entre comillas.
  assert.equal(p.dibujo.tipo, 'redondo');
  assert.equal(p.dibujo.texto, 'Feliz Día|Mamá');
});

test('filas con errores se omiten y explican el problema', () => {
  const r = leer(hoja([
    { 'Nombre': 'Sin precio', 'Categoría': 'Papelería' },
    { 'Nombre': 'Categoría rara', 'Categoría': 'Juguetes', 'Precio': '10' },
    { 'Categoría': 'Papelería', 'Precio': '10' },
    { 'Nombre': 'Bien', 'Categoría': 'Papelería', 'Precio': '10', 'Peso (g)': '20', 'Descripción': 'ok' }
  ]));
  assert.deepEqual(r.productos.map((p) => p.nombre), ['Bien']);
  const errores = r.problemas.filter((x) => x.tipo === 'error');
  assert.equal(errores.length, 3);
  assert.match(errores[0].mensaje, /Falta el precio/);
  assert.equal(errores[0].fila, 2);
  assert.match(errores[1].mensaje, /"Juguetes" no existe/);
  assert.match(errores[2].mensaje, /Falta el nombre/);
});

test('avisos: mayoreo incorrecto, sin peso, color sin código, código repetido, estado raro', () => {
  const r = leer(hoja([
    { 'Código': 'moño-a', 'Nombre': 'Moño A', 'Categoría': 'Envolturas', 'Precio': '10', 'Precio mayoreo': '12', 'Mayoreo desde': '6', 'Descripción': 'x', 'Peso (g)': '5' },
    { 'Código': 'moño-a', 'Nombre': 'Moño B', 'Categoría': 'Envolturas', 'Precio': '10', 'Colores': 'Azul marino', 'Estado': 'quizá', 'Descripción': 'x' }
  ]));
  assert.equal(r.productos.length, 2);
  assert.equal(r.productos[0].mayoreo, undefined);
  assert.equal(r.productos[0].id, 'mono-a');
  assert.equal(r.productos[1].id, 'mono-a-2');
  assert.equal(r.productos[1].peso, 100);
  assert.equal(r.productos[1].estado, 'visible');
  const msgs = r.problemas.map((x) => x.mensaje).join('\n');
  assert.match(msgs, /mayoreo .* no es menor/);
  assert.match(msgs, /ya lo usa la fila 2/);
  assert.match(msgs, /Sin peso/);
  assert.match(msgs, /Azul marino/);
  assert.match(msgs, /estado "quizá"/);
  assert.ok(r.problemas.every((x) => x.tipo === 'aviso'));
});

test('encabezados con otros nombres y columnas en otro orden', () => {
  const csv = 'Precio,Producto,Categoria,Peso,Disponible\n15,Listón rojo,envolturas,40,oculto\n';
  const r = leer(csv);
  assert.equal(r.productos[0].nombre, 'Listón rojo');
  assert.equal(r.productos[0].estado, 'oculto');
  assert.equal(r.productos[0].dibujo.tipo, 'liston');
});

test('sin encabezados reconocibles', () => {
  const r = leer('a,b\n1,2\n');
  assert.equal(r.productos.length, 0);
  assert.match(r.problemas[0].mensaje, /encabezados/);
});

test('plantilla de ejemplo: ida y vuelta conserva todos los productos', () => {
  const filas = H.filasDesdeProductos(globalThis.PRODUCTOS, ctx);
  const r = H.productosDesdeFilas(H.leerCSV(H.aCSV(filas)), ctx);
  assert.deepEqual(r.problemas.filter((x) => x.tipo === 'error'), []);
  assert.equal(r.tematicasNuevas.length, 0);
  assert.equal(r.productos.length, globalThis.PRODUCTOS.length);
  r.productos.forEach((p, i) => {
    const o = globalThis.PRODUCTOS[i];
    for (const k of ['id', 'nombre', 'categoria', 'precio', 'unidad', 'peso', 'descripcion']) assert.equal(p[k], o[k], `${o.id}.${k}`);
    assert.deepEqual(p.tematicas, o.tematicas, `${o.id}.tematicas`);
    assert.deepEqual(p.mayoreo, o.mayoreo, `${o.id}.mayoreo`);
    assert.deepEqual(p.detalles, o.detalles, `${o.id}.detalles`);
    assert.equal(!!p.destacado, !!o.destacado, `${o.id}.destacado`);
    assert.equal(!!p.nuevo, !!o.nuevo, `${o.id}.nuevo`);
    assert.deepEqual(p.dibujo, o.dibujo, `${o.id}.dibujo`);
    assert.equal((p.variantes || []).length, (o.variantes || []).length, `${o.id}.variantes`);
    (o.variantes || []).forEach((g, gi) => {
      const pg = p.variantes[gi];
      assert.deepEqual(pg.opciones.map((x) => x.nombre), g.opciones.map((x) => x.nombre), `${o.id} opciones`);
      g.opciones.forEach((x, xi) => {
        if (x.color) assert.equal(pg.opciones[xi].color, x.color, `${o.id} ${x.nombre} color`);
        if (x.dibujo) assert.deepEqual(pg.opciones[xi].dibujo, x.dibujo, `${o.id} ${x.nombre} dibujo`);
      });
    });
  });
});

test('cada producto de ejemplo tiene una ilustración aunque no se reconozca su código', () => {
  const filas = H.filasDesdeProductos(globalThis.PRODUCTOS, ctx);
  const r = H.productosDesdeFilas(H.leerCSV(H.aCSV(filas)), ctxSinEjemplos);
  assert.equal(r.productos.length, globalThis.PRODUCTOS.length);
  const tipos = new Set(r.productos.map((p) => p.dibujo.tipo));
  assert.ok(tipos.size >= 20, `solo ${tipos.size} tipos de ilustración`);
  // Spot checks de la adivinanza por nombre.
  const por = Object.fromEntries(r.productos.map((p) => [p.id, p.dibujo]));
  assert.equal(por['globo-foil-pino-navidad-18'].tipo, 'pino');
  assert.equal(por['globo-foil-feliz-navidad-18'].decoracion, 'copos');
  assert.equal(por['globo-latex-260-50'].forma, 'largo');
  assert.equal(por['globo-latex-12-cromado-25'].estilo, 'cromo');
  assert.equal(por['bolsa-celofan-15x25-100'].tipo, 'bolsaCelofan');
  assert.equal(por['papel-kraft-rollo-10m'].patron, 'fibras');
  assert.equal(por['mono-estrella-bolsa-50'].forma, 'estrella');
});
