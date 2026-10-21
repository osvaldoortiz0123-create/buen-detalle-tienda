/* =====================================================================
   CATÁLOGO DESDE UNA HOJA DE CÁLCULO (Google Sheets publicada como CSV)
   Convierte cada fila de la hoja "Productos" en un producto de la tienda
   y anota los problemas que encuentre para la página de revisión.
   ===================================================================== */
(function (global) {
  'use strict';

  // Columnas de la hoja, en el orden de la plantilla.
  var COLUMNAS = [
    ['codigo', 'Código'], ['nombre', 'Nombre'], ['categoria', 'Categoría'], ['tematicas', 'Temáticas'],
    ['precio', 'Precio'], ['precioMayoreo', 'Precio mayoreo'], ['mayoreoDesde', 'Mayoreo desde'],
    ['unidad', 'Se vende por'], ['peso', 'Peso (g)'], ['descripcion', 'Descripción'],
    ['detalles', 'Características'], ['colores', 'Colores'], ['opcionNombre', 'Otra opción'],
    ['opcionValores', 'Valores de la opción'], ['foto', 'Foto'], ['fotosPorOpcion', 'Fotos por opción'],
    ['destacado', 'Destacado'], ['nuevo', 'Nuevo'], ['estado', 'Estado'], ['etiquetas', 'Palabras para buscar']
  ];

  // Otros nombres de columna que también se aceptan.
  var SINONIMOS = {
    'id': 'codigo', 'clave': 'codigo', 'sku': 'codigo', 'producto': 'nombre', 'tematica': 'tematicas',
    'ocasiones': 'tematicas', 'precio menudeo': 'precio', 'unidad': 'unidad', 'peso': 'peso', 'peso g': 'peso',
    'peso gramos': 'peso', 'peso en gramos': 'peso', 'detalles': 'detalles', 'color': 'colores', 'opcion': 'opcionNombre',
    'valores': 'opcionValores', 'opciones': 'opcionValores', 'imagen': 'foto', 'fotos': 'foto',
    'fotos por color': 'fotosPorOpcion', 'disponible': 'estado', 'etiquetas': 'etiquetas', 'palabras clave': 'etiquetas'
  };

  var ALFABETO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  var COLOR_DESCONOCIDO = '#b9b0bb';
  var COLORES_TEMA_NUEVO = ['#d1495b', '#00798c', '#edae49', '#66a182', '#8d6a9f', '#2e4057', '#f28f3b', '#5c80bc'];
  var COLOR_POR_CATEGORIA = { 'globos-foil': '#d4a72c', 'globos-latex': '#e9407a', 'papeleria': '#e5177e', 'envolturas': '#c2185b' };

  /* ---------- texto ---------- */
  function normalizar(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9&#]+/g, ' ').trim();
  }

  function slug(s) {
    return normalizar(String(s).replace(/#/g, ' ')).replace(/&/g, 'y').replace(/ +/g, '-');
  }

  function limpio(v) {
    return String(v == null ? '' : v).trim();
  }

  // Divide "a, b, c" (o una por renglón) en una lista sin vacíos.
  function lista(v, separador) {
    return limpio(v).split(separador || /[,\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* ---------- CSV ---------- */
  function leerCSV(texto) {
    var filas = [], fila = [], campo = '', comillas = false;
    texto = String(texto).replace(/^﻿/, '');
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (comillas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; } else comillas = false;
        } else campo += c;
      } else if (c === '"') {
        comillas = true;
      } else if (c === ',') {
        fila.push(campo); campo = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && texto[i + 1] === '\n') i++;
        fila.push(campo); filas.push(fila); fila = []; campo = '';
      } else {
        campo += c;
      }
    }
    if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
    return filas;
  }

  function aCSV(filas) {
    return filas.map(function (fila) {
      return fila.map(function (v) {
        var s = String(v == null ? '' : v);
        return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');
  }

  /* ---------- valores ---------- */
  // "$1,250.50" -> 1250.5 · vacío -> null · texto -> NaN
  function numero(v) {
    var s = limpio(v).replace(/\$|\s|mxn|pesos/gi, '');
    if (!s) return null;
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }

  function siNo(v) {
    return /^(si|s|x|true|verdadero|1|yes)$/.test(normalizar(v));
  }

  function estado(v) {
    var n = normalizar(v);
    if (!n || /^(visible|disponible|si|activo|true|verdadero)$/.test(n)) return 'visible';
    if (/agotad|sin existencia|sin stock/.test(n)) return 'agotado';
    if (/^(oculto|no|inactivo|false|falso|pausado)$/.test(n)) return 'oculto';
    return null;
  }

  // "0-9" -> 0…9 · "A-Z" -> A…Z (con Ñ) · "Chico, Grande" -> tal cual
  function expandir(valores) {
    var salida = [];
    lista(valores).forEach(function (t) {
      var num = t.match(/^(\d+)\s*-\s*(\d+)$/);
      var letra = t.match(/^([a-zñ])\s*-\s*([a-zñ])$/i);
      if (num && +num[2] >= +num[1] && +num[2] - +num[1] <= 100) {
        for (var n = +num[1]; n <= +num[2]; n++) salida.push(String(n));
      } else if (letra && ALFABETO.indexOf(letra[1].toUpperCase()) <= ALFABETO.indexOf(letra[2].toUpperCase())) {
        var a = ALFABETO.indexOf(letra[1].toUpperCase()), b = ALFABETO.indexOf(letra[2].toUpperCase());
        for (var k = a; k <= b; k++) salida.push(ALFABETO[k]);
      } else {
        salida.push(t);
      }
    });
    return salida;
  }

  // Inverso de expandir: 0,1,…,9 -> "0-9"
  function comprimir(valores) {
    var partes = [], i = 0;
    var siguiente = function (a, b) {
      if (/^\d+$/.test(a) && /^\d+$/.test(b)) return +b === +a + 1 && String(+b) === b;
      var x = ALFABETO.indexOf(a), y = ALFABETO.indexOf(b);
      return a.length === 1 && b.length === 1 && x !== -1 && y === x + 1;
    };
    while (i < valores.length) {
      var j = i;
      while (j + 1 < valores.length && siguiente(valores[j], valores[j + 1])) j++;
      if (j - i >= 2) partes.push(valores[i] + '-' + valores[j]);
      else for (var k = i; k <= j; k++) partes.push(valores[k]);
      i = j + 1;
    }
    return partes.join(', ');
  }

  // Convierte enlaces para compartir de Google Drive y Dropbox en enlaces de imagen.
  function enlaceFoto(v) {
    var s = limpio(v);
    if (!s) return '';
    var drive = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?id=)([\w-]{10,})/);
    if (drive) return 'https://drive.google.com/thumbnail?id=' + drive[1] + '&sz=w1000';
    if (/dropbox\.com/.test(s)) return s.replace(/([?&])dl=0/, '$1raw=1');
    if (!/^(https?:)?\/\//.test(s) && !/^(img\/|\/|data:)/.test(s)) return 'img/' + s;
    return s;
  }

  // Enlace de la hoja -> enlace que regresa CSV.
  // Acepta el enlace de "Compartir" (la hoja debe estar compartida como "Cualquier persona
  // con el enlace") o el de "Publicar en la Web".
  function enlaceCSV(url) {
    var s = limpio(url);
    var edicion = s.match(/docs\.google\.com\/spreadsheets\/d\/(?!e\/)([\w-]+)/);
    if (edicion && !/output=csv|format=csv|tqx=out:csv/.test(s)) {
      var gid = s.match(/[#&?]gid=(\d+)/);
      return 'https://docs.google.com/spreadsheets/d/' + edicion[1] + '/export?format=csv' + (gid ? '&gid=' + gid[1] : '');
    }
    if (/docs\.google\.com\/spreadsheets\/d\/e\//.test(s) && !/output=csv/.test(s)) {
      s = s.replace(/#.*$/, '').replace(/\/pubhtml/, '/pub').replace(/[?&]output=[a-z]+/, '');
      return s + (s.indexOf('?') === -1 ? '?' : '&') + 'output=csv';
    }
    return s;
  }

  /* ---------- colores ---------- */
  function indiceColores(colores) {
    var mapa = {};
    Object.keys(colores || {}).forEach(function (k) {
      var c = { nombre: colores[k][0], color: colores[k][1] };
      mapa[normalizar(k)] = c;
      mapa[normalizar(c.nombre)] = c;
    });
    return mapa;
  }

  // "Dorado" -> {nombre:'Dorado', color:'#d4a72c'} · "Turquesa #1fb5ad" -> con ese código
  function leerColor(texto, indice) {
    var m = texto.match(/^(.*?)\s*(#[0-9a-f]{6}|#[0-9a-f]{3})$/i);
    if (m) return { nombre: m[1].trim() || m[2], color: m[2].toLowerCase(), conocido: true };
    var c = indice[normalizar(texto)];
    if (c) return { nombre: texto, color: c.color, conocido: true };
    return { nombre: texto, color: COLOR_DESCONOCIDO, conocido: false };
  }

  /* ---------- coincidencias ---------- */
  // Busca por id o nombre; acepta nombres parciales si solo coinciden con uno.
  function coincidir(valor, elementos) {
    var n = normalizar(valor);
    if (!n) return null;
    var exacto = elementos.filter(function (e) { return normalizar(e.id) === n || normalizar(e.nombre) === n; });
    if (exacto.length) return exacto[0];
    var parcial = elementos.filter(function (e) {
      var nombre = normalizar(e.nombre);
      return n.split(' ').every(function (w) { return nombre.indexOf(w) !== -1; });
    });
    return parcial.length === 1 ? parcial[0] : null;
  }

  /* ---------- ilustración cuando no hay foto ---------- */
  function etiquetaDeUnidad(unidad) {
    var m = normalizar(unidad).match(/(\d+)\s*(piezas|pzas|pliegos|hojas|bolsas|invitaciones)/);
    return m ? m[1] + ' ' + (m[2] === 'piezas' ? 'pzas' : m[2]) : undefined;
  }

  function textoEntreComillas(nombre) {
    var m = String(nombre).match(/["“«]([^"”»]*[a-záéíóúñ][^"”»]*)["”»]/i);
    if (!m) return undefined;
    var t = m[1].trim();
    var palabras = t.split(' ');
    if (t.length > 10 && palabras.length > 1) {
      var mitad = Math.ceil(palabras.length / 2);
      return palabras.slice(0, mitad).join(' ') + '|' + palabras.slice(mitad).join(' ');
    }
    return t;
  }

  function adivinarDibujo(nombre, categoria, unidad) {
    var n = normalizar(nombre);
    var tiene = function (re) { return re.test(n); };
    var etiqueta = etiquetaDeUnidad(unidad);
    var d;
    if (categoria === 'globos-foil') {
      if (tiene(/burbuja|bubble/)) d = { tipo: 'burbuja', color: '#8fc9f2' };
      else if (tiene(/pino|arbol/)) d = { tipo: 'pino', color: '#1b7f4b' };
      else if (tiene(/esfera/)) d = { tipo: 'esfera', color: '#d7263d' };
      else if (tiene(/bouquet|ramo|kit|set/)) d = { tipo: 'bouquet', etiqueta: etiqueta };
      else if (tiene(/numero/)) d = { tipo: 'numero', texto: '1' };
      else if (tiene(/letra/)) d = { tipo: 'numero', texto: 'A' };
      else if (tiene(/estrella/)) d = { tipo: etiqueta || tiene(/paquete/) ? 'estrellasMini' : 'estrella', etiqueta: etiqueta };
      else if (tiene(/corazon/)) d = { tipo: 'corazon', texto: textoEntreComillas(nombre), tinta: '#ffffff' };
      else if (tiene(/navidad|navide/)) d = { tipo: 'redondo', texto: textoEntreComillas(nombre), decoracion: 'copos', color: '#d7263d' };
      else d = { tipo: 'redondo', texto: textoEntreComillas(nombre), decoracion: 'confeti', colores: ['#ffffff', '#ffd23f', '#7ee0f0'] };
    } else if (categoria === 'globos-latex') {
      if (tiene(/inflador|bomba/)) d = { tipo: 'inflador', color: '#2f6fdf' };
      else if (tiene(/cinta|tira/)) d = { tipo: 'cintaArco', color: '#8ccbe8' };
      else if (tiene(/arco|guirnalda/)) d = { tipo: 'latex', forma: 'arco', colores: ['#ff7eb6', '#ffc8dd', '#d4a72c', '#f1edf1'] };
      else {
        d = { tipo: 'latex', etiqueta: etiqueta };
        if (tiene(/\b260\b|figuras|largo/)) d.forma = 'largo';
        else if (tiene(/corazon/)) d.forma = 'corazon';
        else if (tiene(/\b5\b|mini/)) d.forma = 'mini';
        else if (tiene(/\b36\b|gigante|jumbo/)) d.forma = 'gigante';
        if (tiene(/confeti/)) d.estilo = 'confeti';
        else if (tiene(/croma|cromo/)) d.estilo = 'cromo';
        else if (tiene(/metalic|perlad/)) d.estilo = 'perlado';
      }
    } else if (categoria === 'papeleria') {
      if (tiene(/crepe/)) d = { tipo: 'crepe' };
      else if (tiene(/cartulina/)) d = { tipo: 'cartulina' };
      else if (tiene(/picado/)) d = { tipo: 'papelPicado' };
      else if (tiene(/banderin|guirnalda/)) d = { tipo: 'banderin', texto: 'FELIZ', colores: ['#ff5d8f', '#ffd23f', '#3ec1d3', '#7bd389', '#9b5de5'] };
      else if (tiene(/invitacion/)) d = { tipo: 'invitacion', texto: 'Te|invito' };
      else if (tiene(/foami|fomi|goma eva/)) d = { tipo: 'foami', estilo: tiene(/diamant|brillantina|escarchad|glitter/) ? 'diamantado' : undefined, etiqueta: etiqueta };
      else if (tiene(/metalic|lustre/)) d = { tipo: 'papelMetalico' };
      else if (tiene(/topper/)) d = { tipo: 'topper' };
      else d = { tipo: 'papelChina', etiqueta: etiqueta };
    } else {
      if (tiene(/kraft|estraza/)) d = { tipo: 'rollo', color: '#c49a6c', patron: 'fibras', colores: ['#8a6a45'] };
      else if (tiene(/celofan/) && tiene(/bolsa/)) d = { tipo: 'bolsaCelofan', color: '#e5177e', etiqueta: etiqueta };
      else if (tiene(/celofan/)) d = { tipo: 'celofan', color: '#a8d8f0' };
      else if (tiene(/mono/)) d = { tipo: 'mono', forma: tiene(/estrella/) ? 'estrella' : undefined, etiqueta: etiqueta };
      else if (tiene(/rizar|rafia/)) d = { tipo: 'liston', estilo: 'rizado' };
      else if (tiene(/liston|cinta/)) d = { tipo: 'liston' };
      else if (tiene(/caja/)) d = { tipo: 'cajas' };
      else if (tiene(/viruta|relleno/)) d = { tipo: 'viruta' };
      else if (tiene(/seda|tissue/)) d = { tipo: 'papelChina', etiqueta: etiqueta };
      else if (tiene(/bolsa/)) d = { tipo: 'bolsa' };
      else if (tiene(/pliego/)) d = { tipo: 'pliegos', etiqueta: etiqueta };
      else d = { tipo: 'rollo' };
    }
    Object.keys(d).forEach(function (k) { if (d[k] === undefined) delete d[k]; });
    if (!d.color && !d.colores) d.color = COLOR_POR_CATEGORIA[categoria];
    return d;
  }

  // Patrón del papel según el nombre del diseño ("Navidad", "Baby"…).
  function dibujoDeDiseno(nombre) {
    var n = normalizar(nombre);
    if (/navidad|navide/.test(n)) return { patron: 'navidad', colores: ['#1b7f4b', '#ffffff'], color: '#c8102e' };
    if (/amor|corazon|valentin/.test(n)) return { patron: 'corazones', colores: ['#e63946', '#ff7eb6'], color: '#ffc8dd' };
    if (/baby|bebe/.test(n)) return { patron: 'lunares', colores: ['#ffffff', '#ffc8dd'], color: '#bde0fe' };
    if (/elegante|dorado|negro/.test(n)) return { patron: 'rayas', colores: ['#d4a72c'], color: '#2b2b2e' };
    if (/infantil|nino|estrella/.test(n)) return { patron: 'estrellas', colores: ['#ffd23f', '#ffffff'], color: '#21a6b8' };
    if (/cumple/.test(n)) return { patron: 'confeti', colores: ['#ffd23f', '#ffffff', '#3ec1d3', '#7b2cbf'], color: '#ff5d8f' };
    return null;
  }

  /* ---------- hoja -> productos ---------- */

  /* filas: resultado de leerCSV.
     ctx: { categorias, tematicas, colores, ejemplos }  (ejemplos: productos de productos.js por id;
          si una fila usa el mismo código se conserva su ilustración)
     Regresa { productos, tematicas, tematicasNuevas, problemas, filasLeidas }.
     Cada problema: { fila, nombre, tipo: 'error' | 'aviso', mensaje }.  Con 'error' la fila no se publica. */
  function productosDesdeFilas(filas, ctx) {
    var problemas = [];
    var productos = [];
    var tematicas = (ctx.tematicas || []).slice();
    var tematicasNuevas = [];
    var colores = indiceColores(ctx.colores);
    var ejemplos = ctx.ejemplos || {};
    var usados = {};

    // Encabezados: la primera fila (de las 5 primeras) que tenga "Nombre" y "Precio".
    var claves = {};
    COLUMNAS.forEach(function (c) { claves[normalizar(c[1])] = c[0]; claves[normalizar(c[0])] = c[0]; });
    Object.keys(SINONIMOS).forEach(function (k) { claves[k] = SINONIMOS[k]; });
    var filaEncabezado = -1, mapa = {};
    for (var h = 0; h < Math.min(filas.length, 5); h++) {
      var m = {};
      filas[h].forEach(function (titulo, i) {
        var clave = claves[normalizar(titulo)];
        if (clave && m[clave] === undefined) m[clave] = i;
      });
      if (m.nombre !== undefined && m.precio !== undefined) { filaEncabezado = h; mapa = m; break; }
    }
    if (filaEncabezado === -1) {
      problemas.push({ fila: 1, nombre: '', tipo: 'error', mensaje: 'No se encontraron los encabezados. La primera fila debe tener al menos las columnas "Nombre" y "Precio".' });
      return { productos: [], tematicas: tematicas, tematicasNuevas: [], problemas: problemas, filasLeidas: 0 };
    }

    var filasLeidas = 0;
    for (var r = filaEncabezado + 1; r < filas.length; r++) {
      var crudo = filas[r];
      if (!crudo.some(function (v) { return limpio(v); })) continue;
      filasLeidas++;
      var v = function (clave) { return mapa[clave] === undefined ? '' : limpio(crudo[mapa[clave]]); };
      var numFila = r + 1;
      var nombre = v('nombre');
      var anotar = function (tipo, mensaje) { problemas.push({ fila: numFila, nombre: nombre, tipo: tipo, mensaje: mensaje }); };

      if (!nombre) { anotar('error', 'Falta el nombre del producto.'); continue; }

      var categoria = coincidir(v('categoria'), ctx.categorias);
      if (!categoria) {
        anotar('error', (v('categoria') ? 'La categoría "' + v('categoria') + '" no existe.' : 'Falta la categoría.') +
          ' Usa una de estas: ' + ctx.categorias.map(function (c) { return c.nombre; }).join(', ') + '.');
        continue;
      }

      var precio = numero(v('precio'));
      if (!(precio > 0)) {
        anotar('error', v('precio') ? 'El precio "' + v('precio') + '" no es un número válido.' : 'Falta el precio.');
        continue;
      }

      var est = estado(v('estado'));
      if (!est) { anotar('aviso', 'El estado "' + v('estado') + '" no se reconoce; se publicó como Visible. Usa Visible, Agotado u Oculto.'); est = 'visible'; }

      var id = slug(v('codigo') || nombre);
      if (!id) { anotar('error', 'No se pudo crear un código para este producto.'); continue; }
      if (usados[id]) {
        var n = 2;
        while (usados[id + '-' + n]) n++;
        anotar('aviso', 'El código "' + id + '" ya lo usa la fila ' + usados[id] + '; a este producto se le asignó "' + id + '-' + n + '".');
        id = id + '-' + n;
      }
      usados[id] = numFila;

      var p = {
        id: id,
        nombre: nombre,
        categoria: categoria.id,
        tematicas: [],
        precio: precio,
        unidad: v('unidad') || 'pieza',
        descripcion: v('descripcion'),
        estado: est,
        destacado: siNo(v('destacado')),
        nuevo: siNo(v('nuevo')),
        fila: numFila
      };

      // Mayoreo
      var pm = numero(v('precioMayoreo')), md = numero(v('mayoreoDesde'));
      if (pm !== null || md !== null) {
        if (!(pm > 0) || !(md >= 2)) anotar('aviso', 'Para el mayoreo llena "Precio mayoreo" y "Mayoreo desde" (2 o más piezas). No se aplicó.');
        else if (pm >= precio) anotar('aviso', 'El precio de mayoreo ($' + pm + ') no es menor que el precio normal ($' + precio + '). No se aplicó.');
        else p.mayoreo = { min: Math.round(md), precio: pm };
      }

      // Peso
      var peso = numero(v('peso'));
      if (peso > 0) p.peso = peso;
      else {
        p.peso = 100;
        anotar('aviso', v('peso') ? 'El peso "' + v('peso') + '" no es válido; se usaron 100 g para el envío.' : 'Sin peso: se usaron 100 g para calcular el envío.');
      }

      // Temáticas (las que no existen se crean)
      lista(v('tematicas')).forEach(function (t) {
        var tema = coincidir(t, tematicas);
        if (!tema) {
          tema = { id: slug(t), nombre: t, color: COLORES_TEMA_NUEVO[tematicasNuevas.length % COLORES_TEMA_NUEVO.length] };
          tematicas.push(tema);
          tematicasNuevas.push(tema);
        }
        if (p.tematicas.indexOf(tema.id) === -1) p.tematicas.push(tema.id);
      });

      // Características: "Medida: 18 in; Material: Foil"
      var detalles = lista(v('detalles'), /[;\n]/).map(function (d) {
        var i = d.indexOf(':');
        return i > 0 ? [d.slice(0, i).trim(), d.slice(i + 1).trim()] : ['Detalle', d];
      });
      if (detalles.length) p.detalles = detalles;

      // Variantes: primero "Otra opción" (número, letra, diseño…), después los colores.
      var variantes = [];
      var valores = expandir(v('opcionValores'));
      if (valores.length) {
        var grupoNombre = v('opcionNombre') || 'Opción';
        var esTexto = /^(numero|letra|edad|inicial)$/.test(normalizar(grupoNombre));
        variantes.push({
          nombre: grupoNombre,
          opciones: valores.map(function (x) {
            var leido = /#[0-9a-f]{3,6}$/i.test(x) ? leerColor(x, colores) : null;
            var o = { nombre: leido ? leido.nombre : x };
            if (leido) o.color = leido.color;
            if (esTexto) o.dibujo = { texto: o.nombre };
            return o;
          })
        });
      } else if (v('opcionNombre')) {
        anotar('aviso', 'La opción "' + v('opcionNombre') + '" no tiene valores en "Valores de la opción". No se mostró.');
      }
      var cols = lista(v('colores'));
      if (cols.length) {
        var desconocidos = [];
        variantes.push({
          nombre: 'Color', tipo: 'color',
          opciones: cols.map(function (x) {
            var c = leerColor(x, colores);
            if (!c.conocido) desconocidos.push(x);
            return { nombre: c.nombre, color: c.color };
          })
        });
        if (desconocidos.length) {
          anotar('aviso', 'Color' + (desconocidos.length > 1 ? 'es' : '') + ' sin código: ' + desconocidos.join(', ') +
            '. Se muestran en gris; escribe el código junto al nombre, por ejemplo "Turquesa #1fb5ad".');
        }
      }
      if (variantes.length) p.variantes = variantes;

      // Fotos
      var foto = enlaceFoto(v('foto'));
      if (foto) p.imagen = foto;
      lista(v('fotosPorOpcion'), /[;\n]/).forEach(function (par) {
        var i = par.indexOf('=');
        if (i < 1) { anotar('aviso', 'En "Fotos por opción" usa el formato "Dorado = enlace". No se entendió: ' + par); return; }
        var cual = normalizar(par.slice(0, i)), enlace = enlaceFoto(par.slice(i + 1));
        var opcion = null;
        variantes.forEach(function (g) { g.opciones.forEach(function (o) { if (normalizar(o.nombre) === cual) opcion = o; }); });
        if (opcion) opcion.imagen = enlace;
        else anotar('aviso', 'En "Fotos por opción", "' + par.slice(0, i).trim() + '" no es una de las opciones del producto.');
      });

      // Ilustración: la del producto de ejemplo con el mismo código, o una según el nombre.
      var ejemplo = ejemplos[id];
      if (ejemplo) {
        p.dibujo = JSON.parse(JSON.stringify(ejemplo.dibujo));
        variantes.forEach(function (g) {
          var ge = (ejemplo.variantes || []).find(function (x) { return x.nombre === g.nombre || (g.tipo === 'color' && x.tipo === 'color'); });
          if (!ge) return;
          g.opciones.forEach(function (o) {
            var oe = ge.opciones.find(function (x) { return x.nombre === o.nombre; });
            if (oe && oe.dibujo) o.dibujo = JSON.parse(JSON.stringify(oe.dibujo));
            if (oe && oe.color && !o.color) o.color = oe.color;
          });
        });
      } else {
        p.dibujo = adivinarDibujo(nombre, categoria.id, p.unidad);
        if (/^(rollo|bolsa|pliegos)$/.test(p.dibujo.tipo)) {
          variantes.forEach(function (g) {
            if (g.tipo === 'color') return;
            g.opciones.forEach(function (o) {
              var dd = dibujoDeDiseno(o.nombre);
              if (dd && !o.color) { o.color = dd.color; delete dd.color; o.dibujo = Object.assign(o.dibujo || {}, dd); }
            });
          });
        }
      }

      if (v('etiquetas')) p.etiquetas = v('etiquetas');
      if (!p.descripcion) anotar('aviso', 'Sin descripción.');
      if (!p.imagen && !variantes.some(function (g) { return g.opciones.some(function (o) { return o.imagen; }); })) p.sinFoto = true;
      productos.push(p);
    }

    return { productos: productos, tematicas: tematicas, tematicasNuevas: tematicasNuevas, problemas: problemas, filasLeidas: filasLeidas };
  }

  /* ---------- productos -> filas (para crear la plantilla) ---------- */
  function filasDesdeProductos(productos, ctx) {
    var colores = indiceColores(ctx.colores);
    var catNombre = {}, temaNombre = {};
    ctx.categorias.forEach(function (c) { catNombre[c.id] = c.nombre; });
    ctx.tematicas.forEach(function (t) { temaNombre[t.id] = t.nombre; });

    var filas = [COLUMNAS.map(function (c) { return c[1]; })];
    productos.forEach(function (p) {
      var grupoColor = (p.variantes || []).find(function (g) { return g.tipo === 'color'; });
      var otro = (p.variantes || []).find(function (g) { return g.tipo !== 'color'; });
      var fotos = [];
      (p.variantes || []).forEach(function (g) { g.opciones.forEach(function (o) { if (o.imagen) fotos.push(o.nombre + ' = ' + o.imagen); }); });
      var celdas = {
        codigo: p.id,
        nombre: p.nombre,
        categoria: catNombre[p.categoria],
        tematicas: p.tematicas.map(function (t) { return temaNombre[t] || t; }).join(', '),
        precio: p.precio,
        precioMayoreo: p.mayoreo ? p.mayoreo.precio : '',
        mayoreoDesde: p.mayoreo ? p.mayoreo.min : '',
        unidad: p.unidad,
        peso: p.peso,
        descripcion: p.descripcion,
        detalles: (p.detalles || []).map(function (d) { return d[0] + ': ' + d[1]; }).join('; '),
        colores: grupoColor ? grupoColor.opciones.map(function (o) {
          var c = colores[normalizar(o.nombre)];
          return c && c.color === o.color ? o.nombre : o.nombre + ' ' + o.color;
        }).join(', ') : '',
        opcionNombre: otro ? otro.nombre : '',
        opcionValores: otro ? comprimir(otro.opciones.map(function (o) { return o.nombre; })) : '',
        foto: p.imagen || '',
        fotosPorOpcion: fotos.join('; '),
        destacado: p.destacado ? 'Sí' : 'No',
        nuevo: p.nuevo ? 'Sí' : 'No',
        estado: p.estado === 'agotado' ? 'Agotado' : p.estado === 'oculto' ? 'Oculto' : 'Visible',
        etiquetas: p.etiquetas || ''
      };
      filas.push(COLUMNAS.map(function (c) { return celdas[c[0]]; }));
    });
    return filas;
  }

  var Hoja = {
    COLUMNAS: COLUMNAS,
    leerCSV: leerCSV,
    aCSV: aCSV,
    numero: numero,
    expandir: expandir,
    comprimir: comprimir,
    enlaceFoto: enlaceFoto,
    enlaceCSV: enlaceCSV,
    adivinarDibujo: adivinarDibujo,
    productosDesdeFilas: productosDesdeFilas,
    filasDesdeProductos: filasDesdeProductos
  };

  global.Hoja = Hoja;
  if (typeof module !== 'undefined' && module.exports) module.exports = Hoja;
})(typeof window !== 'undefined' ? window : globalThis);
