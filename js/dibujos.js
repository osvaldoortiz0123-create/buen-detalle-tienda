/* =====================================================================
   DIBUJOS DE PRODUCTO (SVG)
   Mientras no haya fotos reales, cada producto se ilustra con un dibujo
   generado a partir de su tipo y color. Cuando un producto tiene
   "imagen" en productos.js, la tienda muestra la foto en lugar del dibujo.
   ===================================================================== */
(function (global) {
  'use strict';

  var contador = 0;
  var TINTA = '#3b2142';
  var HILO = '#a3949f';
  var CARTON = '#e6d6bf';
  var FUENTE = "'Baloo 2', 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif";

  /* ---------- color ---------- */
  function hexARgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbAHex(rgb) {
    return '#' + rgb.map(function (v) {
      var s = Math.round(Math.max(0, Math.min(255, v))).toString(16);
      return s.length === 1 ? '0' + s : s;
    }).join('');
  }
  function mezclar(a, b, t) {
    var x = hexARgb(a), y = hexARgb(b);
    return rgbAHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
  }
  function aclarar(c, t) { return mezclar(c, '#ffffff', t); }
  function oscurecer(c, t) { return mezclar(c, '#000000', t); }
  function luminancia(c) {
    var rgb = hexARgb(c).map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function tintaSobre(c) { return luminancia(c) > 0.42 ? TINTA : '#ffffff'; }

  // Números pseudoaleatorios repetibles (el mismo dibujo siempre sale igual).
  function aleatorio(semilla) {
    var a = semilla >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- piezas comunes ---------- */
  function Lienzo() {
    this.defs = [];
  }
  Lienzo.prototype.id = function (prefijo) {
    contador += 1;
    return 'bd' + prefijo + contador;
  };
  Lienzo.prototype.metal = function (c) {
    var id = this.id('m');
    this.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      parada(0, aclarar(c, 0.55)) + parada(0.3, aclarar(c, 0.12)) + parada(0.55, oscurecer(c, 0.2)) +
      parada(0.78, aclarar(c, 0.22)) + parada(1, oscurecer(c, 0.3)) + '</linearGradient>');
    return 'url(#' + id + ')';
  };
  Lienzo.prototype.cromo = function (c) {
    var id = this.id('c');
    this.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="0.4" y2="1">' +
      parada(0, aclarar(c, 0.75)) + parada(0.25, c) + parada(0.45, oscurecer(c, 0.45)) +
      parada(0.62, aclarar(c, 0.55)) + parada(1, oscurecer(c, 0.35)) + '</linearGradient>');
    return 'url(#' + id + ')';
  };
  Lienzo.prototype.mate = function (c, brillo) {
    var id = this.id('r');
    this.defs.push('<radialGradient id="' + id + '" cx="0.36" cy="0.3" r="0.78">' +
      parada(0, aclarar(c, brillo || 0.32)) + parada(0.55, c) + parada(1, oscurecer(c, 0.22)) + '</radialGradient>');
    return 'url(#' + id + ')';
  };
  Lienzo.prototype.cilindro = function (c) {
    var id = this.id('y');
    this.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      parada(0, oscurecer(c, 0.12)) + parada(0.3, aclarar(c, 0.25)) + parada(0.7, c) +
      parada(1, oscurecer(c, 0.25)) + '</linearGradient>');
    return 'url(#' + id + ')';
  };
  Lienzo.prototype.cilindroVertical = function (c) {
    var id = this.id('v');
    this.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      parada(0, oscurecer(c, 0.2)) + parada(0.35, aclarar(c, 0.3)) + parada(0.7, c) +
      parada(1, oscurecer(c, 0.28)) + '</linearGradient>');
    return 'url(#' + id + ')';
  };
  Lienzo.prototype.patron = function (tipo, fondo, colores) {
    var id = this.id('p');
    var c = colores && colores.length ? colores : [aclarar(fondo, 0.6)];
    var motivo = '';
    var t = 22;
    switch (tipo) {
      case 'rayas':
        motivo = '<path d="M-4 4 L4 -4 M0 22 L22 0 M18 26 L26 18" stroke="' + c[0] + '" stroke-width="5"/>';
        break;
      case 'corazones':
        motivo = corazonPequeno(6, 7, 4, c[0]) + corazonPequeno(17, 17, 3.4, c[1 % c.length]);
        break;
      case 'estrellas':
        motivo = '<polygon points="' + puntosEstrella(6, 7, 5, 2.2, 5) + '" fill="' + c[0] + '"/>' +
          '<polygon points="' + puntosEstrella(17, 17, 3.5, 1.5, 5) + '" fill="' + c[1 % c.length] + '"/>';
        break;
      case 'navidad':
        motivo = '<polygon points="6,2 11,12 1,12" fill="' + c[0] + '"/><rect x="5" y="12" width="2" height="3" fill="#7a4a2a"/>' +
          '<circle cx="17" cy="17" r="2.4" fill="' + c[1 % c.length] + '"/>';
        break;
      case 'lunares':
        motivo = '<circle cx="5.5" cy="5.5" r="3" fill="' + c[0] + '"/><circle cx="16.5" cy="16.5" r="3" fill="' + c[1 % c.length] + '"/>';
        break;
      case 'fibras':
        t = 30;
        motivo = '<path d="M2 6 q8 -2 14 1 M12 20 q7 2 15 -1 M4 26 q5 -1 9 1" stroke="' + c[0] + '" stroke-width="0.9" fill="none" opacity="0.6"/>';
        break;
      default: // confeti
        motivo = '<circle cx="5" cy="5" r="2.2" fill="' + c[0] + '"/>' +
          '<rect x="13" y="3" width="5" height="2.6" rx="1" transform="rotate(30 15 4)" fill="' + c[1 % c.length] + '"/>' +
          '<circle cx="16" cy="16" r="2" fill="' + c[2 % c.length] + '"/>' +
          '<rect x="3" y="15" width="5" height="2.6" rx="1" transform="rotate(-25 5 16)" fill="' + c[3 % c.length] + '"/>';
    }
    this.defs.push('<pattern id="' + id + '" width="' + t + '" height="' + t + '" patternUnits="userSpaceOnUse">' +
      '<rect width="' + t + '" height="' + t + '" fill="' + fondo + '"/>' + motivo + '</pattern>');
    return 'url(#' + id + ')';
  };
  Lienzo.prototype.mascara = function (agujeros) {
    var id = this.id('k');
    this.defs.push('<mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">' +
      '<rect width="200" height="200" fill="#fff"/>' + agujeros + '</mask>');
    return 'url(#' + id + ')';
  };

  function parada(o, c) { return '<stop offset="' + o + '" stop-color="' + c + '"/>'; }

  function puntosEstrella(cx, cy, R, r, n) {
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / n;
      var rad = i % 2 === 0 ? R : r;
      pts.push((cx + rad * Math.cos(ang)).toFixed(1) + ',' + (cy + rad * Math.sin(ang)).toFixed(1));
    }
    return pts.join(' ');
  }

  function corazonPequeno(cx, cy, s, color) {
    return '<path d="M' + cx + ' ' + (cy + s) + ' C' + (cx - 2 * s) + ' ' + (cy - 0.2 * s) + ' ' +
      (cx - s) + ' ' + (cy - 1.6 * s) + ' ' + cx + ' ' + (cy - 0.6 * s) + ' C' + (cx + s) + ' ' +
      (cy - 1.6 * s) + ' ' + (cx + 2 * s) + ' ' + (cy - 0.2 * s) + ' ' + cx + ' ' + (cy + s) + 'Z" fill="' + color + '"/>';
  }

  function hilo(x1, y1, x2, y2) {
    var dy = y2 - y1;
    return '<path d="M' + x1 + ' ' + y1 + ' C' + (x1 + 7) + ' ' + (y1 + dy * 0.35) + ' ' + (x2 - 7) + ' ' +
      (y1 + dy * 0.65) + ' ' + x2 + ' ' + y2 + '" stroke="' + HILO + '" stroke-width="1.4" fill="none"/>';
  }

  function brillo(cx, cy, rx, ry, ang, opacidad) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity="' +
      (opacidad || 0.5) + '" transform="rotate(' + (ang || -30) + ' ' + cx + ' ' + cy + ')"/>';
  }

  function halo(c) {
    return '<circle cx="100" cy="100" r="82" fill="' + c + '" opacity="0.13"/>';
  }

  function texto(x, y, contenido, tam, color, extra) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="' + FUENTE +
      '" font-weight="800" font-size="' + tam + '" fill="' + color + '"' + (extra || '') + '>' +
      escapar(contenido) + '</text>';
  }

  function escapar(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function etiqueta(t) {
    if (!t) return '';
    var w = Math.max(48, t.length * 7.4 + 18);
    return '<g><rect x="' + (192 - w) + '" y="160" width="' + w + '" height="26" rx="13" fill="#fff" stroke="#e5d7e0"/>' +
      texto(192 - w / 2, 178, t, 13, TINTA) + '</g>';
  }

  // Tamaño de letra para que un texto quepa en un ancho dado.
  function ajustar(t, ancho, maximo) {
    return Math.min(maximo, Math.floor(ancho / (Math.max(t.length, 1) * 0.55)));
  }

  /* ---------- formas de globo foil (sin hilo, en caja de 200) ---------- */
  function formaEstrella(l, c) {
    var g = l.metal(c);
    return '<polygon points="' + puntosEstrella(100, 92, 62, 30, 5) + '" fill="' + g + '" stroke="' + g +
      '" stroke-width="12" stroke-linejoin="round"/>' +
      '<polygon points="' + puntosEstrella(100, 94, 48, 23, 5) + '" fill="none" stroke="' + aclarar(c, 0.5) +
      '" stroke-width="1.5" stroke-linejoin="round" opacity="0.55"/>' + brillo(82, 68, 9, 17, -35, 0.55);
  }

  var RUTA_CORAZON = 'M100 160 C52 128 30 100 36 72 C42 46 78 40 100 64 C122 40 158 46 164 72 C170 100 148 128 100 160 Z';

  function formaCorazon(l, c) {
    return '<path d="' + RUTA_CORAZON + '" fill="' + l.metal(c) + '"/>' +
      '<path d="' + RUTA_CORAZON + '" fill="none" stroke="' + aclarar(c, 0.5) + '" stroke-width="1.5" opacity="0.5" transform="translate(100 100) scale(0.86) translate(-100 -100)"/>' +
      brillo(66, 72, 9, 16, -40, 0.55);
  }

  function formaRedonda(l, c, d) {
    var s = '<circle cx="100" cy="90" r="64" fill="' + l.metal(c) + '"/>' +
      '<circle cx="100" cy="90" r="57" fill="none" stroke="' + aclarar(c, 0.45) + '" stroke-width="1.5" opacity="0.6"/>' +
      '<path d="M94 154 L100 162 L106 154 Z" fill="' + oscurecer(c, 0.2) + '"/>';
    s += decoracion(l, c, d);
    return s + brillo(70, 58, 8, 15, -40, 0.45);
  }

  function decoracion(l, c, d) {
    var tinta = d.tinta || tintaSobre(c);
    var s = '';
    var colores = d.colores || ['#ffd23f', '#ff5d8f', '#3ec1d3', '#7bd389'];
    var lineas = d.texto ? String(d.texto).split('|') : [];

    switch (d.decoracion) {
      case 'confeti':
        for (var i = 0; i < 14; i++) {
          var a = i / 14 * Math.PI * 2;
          var x = 100 + Math.cos(a) * 47, y = 90 + Math.sin(a) * 47;
          s += i % 2
            ? '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="' + colores[i % colores.length] + '"/>'
            : '<rect x="' + (x - 3).toFixed(1) + '" y="' + (y - 1.5).toFixed(1) + '" width="7" height="3" rx="1" fill="' +
              colores[i % colores.length] + '" transform="rotate(' + (i * 40) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
        }
        break;
      case 'corazones':
        s += corazonPequeno(66, 60, 5, tinta) + corazonPequeno(136, 118, 5, tinta) + corazonPequeno(140, 62, 3.5, tinta);
        break;
      case 'estrellas':
        s += '<polygon points="' + puntosEstrella(64, 62, 7, 3, 5) + '" fill="' + tinta + '"/>' +
          '<polygon points="' + puntosEstrella(138, 120, 6, 2.6, 5) + '" fill="' + tinta + '"/>' +
          '<polygon points="' + puntosEstrella(140, 60, 4, 1.8, 5) + '" fill="' + tinta + '"/>';
        break;
      case 'birrete':
        s += '<polygon points="100,40 130,52 100,64 70,52" fill="' + tinta + '"/>' +
          '<path d="M84 58 L84 68 Q100 76 116 68 L116 58 L100 64 Z" fill="' + tinta + '"/>' +
          '<path d="M128 53 L128 68" stroke="#e8b923" stroke-width="2"/><circle cx="128" cy="70" r="3" fill="#e8b923"/>';
        lineas = lineas.map(function (t) { return t; });
        return s + textoCentrado(lineas, tinta, 98, 104);
      case 'copos':
        [[62, 58, 7], [140, 60, 5], [136, 122, 6.5], [64, 122, 4.5]].forEach(function (k) {
          var brazos = '';
          for (var a = 0; a < 3; a++) {
            var ang = a * Math.PI / 3, dx = Math.cos(ang) * k[2], dy = Math.sin(ang) * k[2];
            brazos += 'M' + (k[0] - dx).toFixed(1) + ' ' + (k[1] - dy).toFixed(1) + ' L' + (k[0] + dx).toFixed(1) + ' ' + (k[1] + dy).toFixed(1) + ' ';
          }
          s += '<path d="' + brazos + '" stroke="' + tinta + '" stroke-width="1.6" stroke-linecap="round"/>';
        });
        break;
      case 'tricolor':
        var id = l.id('t');
        l.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
          parada(0.33, '#0b7a3b') + parada(0.33, '#f7f5f0') + parada(0.67, '#f7f5f0') + parada(0.67, '#c8102e') + '</linearGradient>');
        s += '<circle cx="100" cy="90" r="57" fill="url(#' + id + ')"/>';
        return s + textoCentrado(lineas, TINTA, 90, 90, ' stroke="#f7f5f0" stroke-width="4" paint-order="stroke"');
      case 'corona':
        s += '<path d="M78 58 L84 40 L92 52 L100 36 L108 52 L116 40 L122 58 Z" fill="#f2c94c" stroke="' + oscurecer('#f2c94c', 0.25) + '" stroke-width="1.2"/>';
        return s + textoCentrado(lineas, tinta, 100, 100);
    }
    return s + textoCentrado(lineas, tinta, 90, 90);
  }

  function textoCentrado(lineas, color, centroY, _y, extra) {
    if (!lineas.length) return '';
    var tam = Math.min.apply(null, lineas.map(function (t) { return ajustar(t, 98, 30); }));
    var alto = tam * 0.95;
    var inicio = centroY - (lineas.length - 1) * alto / 2 + tam * 0.34;
    return lineas.map(function (t, i) {
      return texto(100, (inicio + i * alto).toFixed(1), t, tam, color, extra);
    }).join('');
  }

  /* ---------- globo de látex (centrado en 0,0) ---------- */
  var RUTA_LATEX = 'M0 -40 C22 -40 34 -22 34 -4 C34 18 16 36 0 40 C-16 36 -34 18 -34 -4 C-34 -22 -22 -40 0 -40 Z';

  function globoLatex(l, x, y, s, c, estilo) {
    var relleno, extra = '', b = 0.38;
    var claro = estilo === 'confeti' || estilo === 'transparente';
    if (estilo === 'cromo') { relleno = l.cromo(c); b = 0.7; }
    else if (estilo === 'perlado') { relleno = l.mate(c, 0.55); b = 0.55; }
    else if (estilo === 'neon') { relleno = l.mate(c, 0.18); b = 0.3; }
    else if (claro) { relleno = 'rgba(255,255,255,0.28)'; b = 0.6; }
    else { relleno = l.mate(c); }

    if (estilo === 'confeti') {
      var r = aleatorio(Math.round(x * 7 + y * 13));
      var cols = [c, aclarar(c, 0.35), oscurecer(c, 0.15)];
      for (var i = 0; i < 9; i++) {
        var ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * 24;
        extra += '<circle cx="' + (Math.cos(ang) * rad).toFixed(1) + '" cy="' + (Math.sin(ang) * rad * 1.15 + 2).toFixed(1) +
          '" r="' + (1.8 + r() * 1.8).toFixed(1) + '" fill="' + cols[i % 3] + '"/>';
      }
    }
    var borde = claro ? ' stroke="#bdb0ba" stroke-width="1.4"' : '';
    var nudo = claro ? '#bdb0ba' : oscurecer(c, 0.15);
    // El neón brilla: un halo del mismo color alrededor del globo.
    var resplandor = estilo === 'neon' ? '<path d="' + RUTA_LATEX + '" fill="' + c + '" opacity="0.22" transform="scale(1.12)"/>' : '';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + resplandor +
      '<path d="' + RUTA_LATEX + '" fill="' + relleno + '"' + borde + '/>' + extra +
      '<path d="M-4 46 L0 39 L4 46 Z" fill="' + nudo + '"/>' +
      brillo(-14, -20, 6, 11, -25, b) + '</g>';
  }

  function corazonLatex(l, x, y, s, c) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ') translate(-100 -100)">' +
      '<path d="' + RUTA_CORAZON + '" fill="' + l.mate(c) + '"/>' + brillo(66, 72, 8, 15, -40, 0.4) +
      '<path d="M96 166 L100 159 L104 166 Z" fill="' + oscurecer(c, 0.15) + '"/></g>';
  }

  /* ---------- dibujos por tipo ---------- */
  var tipos = {};

  tipos.estrella = function (l, d) {
    return halo(d.color) + formaEstrella(l, d.color) + hilo(100, 128, 100, 196);
  };

  tipos.estrellasMini = function (l, d) {
    var s = halo(d.color);
    [[62, 70, 0.5], [138, 66, 0.46], [100, 112, 0.56]].forEach(function (p) {
      s += hilo(p[0], p[1] + 34 * p[2] * 2, 100, 196);
    });
    [[62, 70, 0.5], [138, 66, 0.46], [100, 112, 0.56]].forEach(function (p) {
      s += '<g transform="translate(' + p[0] + ' ' + p[1] + ') scale(' + p[2] + ') translate(-100 -92)">' + formaEstrella(l, d.color) + '</g>';
    });
    return s + etiqueta(d.etiqueta);
  };

  tipos.corazon = function (l, d) {
    return halo(d.color) + formaCorazon(l, d.color) + hilo(100, 160, 100, 196) +
      (d.texto ? textoCentrado(String(d.texto).split('|'), d.tinta || tintaSobre(d.color), 98, 98) : '');
  };

  tipos.redondo = function (l, d) {
    return halo(d.color) + formaRedonda(l, d.color, d) + hilo(100, 162, 100, 196);
  };

  tipos.numero = function (l, d) {
    var g = l.metal(d.color);
    var t = String(d.texto || '1');
    return halo(d.color) +
      texto(100, 166, t, t.length > 1 ? 120 : 190, g, ' stroke="' + oscurecer(d.color, 0.25) +
        '" stroke-width="3" stroke-linejoin="round" paint-order="stroke"') +
      texto(97, 160, t, t.length > 1 ? 120 : 190, 'none', ' stroke="' + aclarar(d.color, 0.7) +
        '" stroke-width="1.6" opacity="0.6"') +
      hilo(100, 170, 104, 198);
  };

  tipos.burbuja = function (l, d) {
    var c = d.color;
    var r = aleatorio(42), s = '';
    var cols = d.colores || ['#ff5d8f', '#ffd23f', '#3ec1d3'];
    for (var i = 0; i < 12; i++) {
      var a = r() * Math.PI * 2, rad = Math.sqrt(r()) * 44;
      s += '<circle cx="' + (100 + Math.cos(a) * rad).toFixed(1) + '" cy="' + (92 + Math.sin(a) * rad).toFixed(1) +
        '" r="' + (2 + r() * 2.5).toFixed(1) + '" fill="' + cols[i % cols.length] + '" opacity="0.85"/>';
    }
    return halo(c) +
      '<circle cx="100" cy="92" r="66" fill="' + aclarar(c, 0.6) + '" opacity="0.35" stroke="' + oscurecer(c, 0.05) + '" stroke-width="2"/>' + s +
      '<path d="M54 74 A50 50 0 0 1 92 40" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.85"/>' +
      '<circle cx="58" cy="92" r="4" fill="#fff" opacity="0.85"/>' +
      '<path d="M95 162 L100 156 L105 162 Z" fill="' + oscurecer(c, 0.1) + '"/>' + hilo(100, 162, 100, 196);
  };

  tipos.pino = function (l, d) {
    var c = d.color;
    var g = l.metal(c);
    var oro = l.metal('#d9a836');
    var niveles = [[100, 86, 54, 146], [100, 58, 42, 112], [100, 34, 30, 80]]; // punta x, punta y, medio ancho, base y
    var s = halo(c) + hilo(100, 160, 100, 196) +
      '<rect x="90" y="144" width="20" height="16" rx="3" fill="#7a4a2a"/>';
    niveles.forEach(function (n) {
      var puntos = n[0] + ',' + n[1] + ' ' + (n[0] - n[2]) + ',' + n[3] + ' ' + (n[0] + n[2]) + ',' + n[3];
      s += '<polygon points="' + puntos + '" fill="' + g + '" stroke="' + g + '" stroke-width="10" stroke-linejoin="round"/>';
    });
    s += '<path d="M66 104 Q100 118 128 98 M58 136 Q100 150 144 128" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.7"/>';
    [[84, 74, '#d7263d'], [116, 90, '#f2c94c'], [78, 118, '#f2c94c'], [110, 112, '#d7263d'], [126, 136, '#ffffff'], [70, 140, '#2f6fdf'], [98, 134, '#d7263d']].forEach(function (b) {
      s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="5" fill="' + b[2] + '"/><circle cx="' + (b[0] - 1.5) + '" cy="' + (b[1] - 1.5) + '" r="1.5" fill="#fff" opacity="0.8"/>';
    });
    return s + '<polygon points="' + puntosEstrella(100, 30, 14, 6, 5) + '" fill="' + oro + '" stroke="' + oro + '" stroke-width="2" stroke-linejoin="round"/>' +
      brillo(86, 62, 4, 10, -30, 0.45);
  };

  tipos.esfera = function (l, d) {
    var c = d.color;
    var oro = l.metal('#d9a836');
    return halo(c) +
      '<circle cx="100" cy="36" r="7" fill="none" stroke="#c9a03a" stroke-width="2.5"/>' +
      '<circle cx="100" cy="108" r="56" fill="' + l.metal(c) + '"/>' +
      '<rect x="86" y="42" width="28" height="16" rx="3" fill="' + oro + '"/>' +
      '<path d="M90 44 V56 M96 44 V56 M104 44 V56 M110 44 V56" stroke="' + oscurecer('#d9a836', 0.25) + '" stroke-width="1"/>' +
      '<path d="M46 108 L58 98 L70 108 L82 98 L94 108 L106 98 L118 108 L130 98 L142 108 L154 98" stroke="#fff" stroke-width="3" fill="none" opacity="0.85"/>' +
      '<path d="M48 122 Q100 138 152 122" stroke="#fff" stroke-width="2" fill="none" opacity="0.6"/>' +
      brillo(78, 84, 8, 16, -35, 0.5);
  };

  tipos.bouquet = function (l, d) {
    var cols = d.colores || ['#e0b33a', '#ff4f8b', '#2f80ed', '#9b51e0', '#27ae60'];
    var s = halo(cols[1]);
    var piezas = [
      ['redondo', 100, 66, 0.52],
      ['estrella', 58, 92, 0.42],
      ['corazon', 142, 92, 0.42],
      ['estrella', 70, 44, 0.32],
      ['corazon', 132, 42, 0.32]
    ];
    piezas.forEach(function (p) {
      s += hilo(p[1], p[2] + 34, 100, 194);
    });
    piezas.forEach(function (p, i) {
      var c = cols[i % cols.length];
      var forma = p[0] === 'estrella' ? formaEstrella(l, c) :
        p[0] === 'corazon' ? formaCorazon(l, c) :
          formaRedonda(l, c, { decoracion: 'confeti', texto: d.texto || 'Feliz|Cumple', colores: ['#ffffff', '#ffd23f'] });
      s += '<g transform="translate(' + p[1] + ' ' + p[2] + ') scale(' + p[3] + ') translate(-100 -92)">' + forma + '</g>';
    });
    return s + etiqueta(d.etiqueta);
  };

  tipos.latex = function (l, d) {
    var c = d.color;
    var est = d.estilo || 'mate';
    var forma = d.forma || 'redondo';
    var cols = d.colores;
    var s = halo(c || (cols && cols[0]) || '#ff5d8f');
    var g = [];

    if (forma === 'largo') {
      var lc = cols || [c, aclarar(c, 0.2), oscurecer(c, 0.15)];
      var rutas = ['M32 160 C62 70 118 40 172 62', 'M28 120 C70 90 120 112 176 96', 'M40 186 C80 130 130 150 170 134'];
      return s + rutas.map(function (ruta, i) {
        var col = lc[i % lc.length];
        return '<path d="' + ruta + '" stroke="' + oscurecer(col, 0.12) + '" stroke-width="17" stroke-linecap="round" fill="none"/>' +
          '<path d="' + ruta + '" stroke="' + col + '" stroke-width="14" stroke-linecap="round" fill="none"/>' +
          '<path d="' + ruta + '" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.45" transform="translate(-1 -4)"/>';
      }).join('') + etiqueta(d.etiqueta);
    }

    if (forma === 'arco') {
      var n = 13, r = aleatorio(7);
      for (var i = 0; i < n; i++) {
        var t = i / (n - 1);
        var x = 26 + 148 * t + (r() - 0.5) * 8;
        var y = 160 - Math.sin(Math.PI * t) * 112 + (r() - 0.5) * 10;
        g.push([x, y, 0.36 + r() * 0.3, cols[i % cols.length]]);
      }
      g.sort(function (a, b) { return a[2] - b[2]; });
      return s + g.map(function (p) {
        return globoLatex(l, p[0].toFixed(1), p[1].toFixed(1), p[2].toFixed(2), p[3], est);
      }).join('') + etiqueta(d.etiqueta);
    }

    if (forma === 'gigante') {
      return s + hilo(100, 178, 100, 198) + globoLatex(l, 100, 92, 2.1, c, est) + etiqueta(d.etiqueta);
    }

    if (forma === 'mini') {
      g = [[62, 70], [100, 58], [138, 70], [80, 102], [120, 102], [58, 132], [100, 134], [142, 132]];
      return s + g.map(function (p, i) {
        var col = cols ? cols[i % cols.length] : (i % 2 ? aclarar(c, 0.12) : c);
        return globoLatex(l, p[0], p[1], 0.52, col, est);
      }).join('') + etiqueta(d.etiqueta);
    }

    if (forma === 'corazon') {
      g = [[64, 92, 0.42], [136, 92, 0.42], [100, 70, 0.5]];
      return s + g.map(function (p) { return hilo(p[0], p[1] + 32, 100, 196); }).join('') +
        g.map(function (p, i) { return corazonLatex(l, p[0], p[1], p[2], cols ? cols[i % cols.length] : c); }).join('') +
        etiqueta(d.etiqueta);
    }

    // Racimo de tres globos redondos.
    g = [[64, 82, 0.9], [136, 80, 0.9], [100, 62, 1.0]];
    var hilos = g.map(function (p) { return hilo(p[0], p[1] + 46 * p[2], 100, 196); }).join('');
    var globos = g.map(function (p, i) {
      var col = cols ? cols[i % cols.length] : (i === 2 ? c : aclarar(c, i ? 0 : 0.1));
      return globoLatex(l, p[0], p[1], p[2], col, est);
    }).join('');
    var impreso = d.texto ? texto(100, 66, d.texto, 11, tintaSobre(cols ? cols[2 % cols.length] : c)) : '';
    return s + hilos + globos + impreso + etiqueta(d.etiqueta);
  };

  // Globo en el tono elegido. Con d.tamanos ([5, 12, 18]) compara los tamaños a escala
  // y resalta d.tamano; los textos usan currentColor para leerse en modo claro y oscuro.
  tipos.tono = function (l, d) {
    var c = d.color || '#e9407a';
    var estilo = d.estilo || 'mate';
    var medidas = d.tamanos;
    if (!medidas || !medidas.length) {
      return halo(c) + hilo(100, 178, 100, 198) + globoLatex(l, 100, 92, 2.1, c, estilo);
    }
    var mayor = Math.max.apply(null, medidas);
    var altoMayor = 100, base = 160, hueco = 10;
    var escalas = medidas.map(function (m) { return (altoMayor * m / mayor) / 80; });
    var anchos = escalas.map(function (e) { return 68 * e; });
    var x = 100 - (anchos.reduce(function (a, b) { return a + b; }, 0) + hueco * (medidas.length - 1)) / 2;
    var s = '<path d="M14 ' + (base + 1) + ' H186" stroke="currentColor" stroke-width="1" opacity="0.25"/>';
    medidas.forEach(function (m, i) {
      var e = escalas[i], cx = x + anchos[i] / 2, cy = base - 46 * e;
      var elegido = !d.tamano || d.tamano === m;
      s += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + (base + 1) + '" rx="' + (anchos[i] * 0.32).toFixed(1) + '" ry="2" fill="currentColor" opacity="0.15"/>';
      if (elegido) {
        s += globoLatex(l, cx.toFixed(1), cy.toFixed(1), e.toFixed(3), c, estilo);
      } else {
        s += '<g transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') scale(' + e.toFixed(3) + ')">' +
          '<path d="' + RUTA_LATEX + '" fill="' + c + '" fill-opacity="0.12" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/></g>';
      }
      s += '<text x="' + cx.toFixed(1) + '" y="' + (base + 17) + '" text-anchor="middle" font-family="' + FUENTE + '" font-weight="800" font-size="13" fill="currentColor" opacity="' + (elegido ? 1 : 0.6) + '">' + m + '"</text>' +
        '<text x="' + cx.toFixed(1) + '" y="' + (base + 29) + '" text-anchor="middle" font-family="' + FUENTE + '" font-size="9.5" fill="currentColor" opacity="' + (elegido ? 0.85 : 0.5) + '">' + Math.round(m * 2.54) + ' cm</text>';
      x += anchos[i] + hueco;
    });
    return s;
  };

  // Racimo de globos de muchos tonos: la portada de un producto con carta de colores.
  tipos.cartaColores = function (l, d) {
    var cols = d.colores && d.colores.length ? d.colores : ['#e9407a'];
    var lugares = [[40, 56], [80, 50], [120, 50], [160, 56], [24, 98], [64, 92], [104, 92], [144, 92], [180, 100], [50, 136], [100, 132], [150, 136]];
    return halo(cols[0]) + lugares.map(function (p, i) {
      return globoLatex(l, p[0], p[1], 0.62, cols[i % cols.length], 'mate');
    }).join('') + etiqueta(d.etiqueta);
  };

  tipos.inflador = function (l, d) {
    var c = d.color;
    return halo(c) +
      '<rect x="96" y="36" width="8" height="18" fill="#a7a1aa"/>' +
      '<rect x="56" y="26" width="88" height="15" rx="7.5" fill="#3d3540"/>' +
      '<rect x="78" y="52" width="44" height="112" rx="10" fill="' + l.cilindroVertical(c) + '"/>' +
      '<rect x="78" y="92" width="44" height="22" fill="#fff" opacity="0.85"/>' +
      texto(100, 108, 'AIR', 14, TINTA) +
      '<path d="M122 148 C142 148 150 160 160 174" stroke="#3d3540" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<path d="M158 170 L170 186 L174 178 Z" fill="#3d3540"/>' +
      '<rect x="62" y="162" width="76" height="14" rx="7" fill="#3d3540"/>';
  };

  tipos.cintaArco = function (l, d) {
    var c = d.color;
    var agujeros = '';
    for (var x = 104; x < 186; x += 13) agujeros += '<circle cx="' + x + '" cy="160" r="3.2" fill="#000"/>';
    for (var a = 0; a < 12; a++) {
      var ang = a / 12 * Math.PI * 2;
      agujeros += '<circle cx="' + (92 + Math.cos(ang) * 46).toFixed(1) + '" cy="' + (92 + Math.sin(ang) * 46).toFixed(1) + '" r="3.2" fill="#000"/>';
    }
    var m = l.mascara(agujeros);
    return halo(c) + '<g mask="' + m + '">' +
      '<circle cx="92" cy="92" r="46" fill="none" stroke="' + c + '" stroke-width="20"/>' +
      '<circle cx="92" cy="92" r="35" fill="none" stroke="' + oscurecer(c, 0.12) + '" stroke-width="2"/>' +
      '<path d="M92 138 L186 150 L186 170 L92 158 Z" fill="' + aclarar(c, 0.1) + '"/></g>';
  };

  tipos.papelChina = function (l, d) {
    var cols = d.colores || [oscurecer(d.color, 0.08), aclarar(d.color, 0.12), d.color];
    var s = halo(cols[2] || d.color);
    [[-8, 0], [5, 10], [-2, 22]].forEach(function (p, i) {
      var col = cols[i % cols.length];
      s += '<g transform="rotate(' + p[0] + ' 100 110) translate(0 ' + p[1] + ')">' +
        '<rect x="38" y="52" width="124" height="86" rx="3" fill="' + col + '"/>' +
        '<path d="M38 95 H162" stroke="#fff" stroke-width="1.6" opacity="0.45"/>' +
        '<path d="M100 52 V138" stroke="' + oscurecer(col, 0.15) + '" stroke-width="1" opacity="0.5"/>' +
        '<path d="M52 66 l14 8 M120 112 l16 6 M70 120 l10 -6 M132 64 l-12 9" stroke="#fff" stroke-width="1.2" opacity="0.4"/></g>';
    });
    return s + etiqueta(d.etiqueta);
  };

  tipos.crepe = function (l, d) {
    var c = d.color;
    var lineas = '';
    for (var x = 44; x < 150; x += 5) {
      lineas += '<path d="M' + x + ' 80 q2 22 0 44" stroke="' + oscurecer(c, 0.18) + '" stroke-width="1" fill="none" opacity="0.5"/>';
    }
    return halo(c) +
      '<path d="M54 124 C50 146 62 160 40 182 L74 186 C86 166 76 146 86 124 Z" fill="' + aclarar(c, 0.08) + '"/>' +
      '<rect x="40" y="78" width="110" height="48" fill="' + l.cilindro(c) + '"/>' + lineas +
      '<ellipse cx="40" cy="102" rx="10" ry="24" fill="' + oscurecer(c, 0.12) + '"/>' +
      '<ellipse cx="150" cy="102" rx="12" ry="24" fill="' + aclarar(c, 0.15) + '"/>' +
      '<ellipse cx="150" cy="102" rx="7" ry="15" fill="none" stroke="' + oscurecer(c, 0.2) + '" stroke-width="1.2"/>' +
      '<ellipse cx="150" cy="102" rx="3" ry="7" fill="' + CARTON + '"/>';
  };

  tipos.cartulina = function (l, d) {
    var c = d.color;
    return halo(c) +
      '<rect x="44" y="40" width="116" height="130" rx="3" fill="' + oscurecer(c, 0.18) + '" transform="rotate(6 100 105)"/>' +
      '<g transform="rotate(-5 100 105)"><path d="M40 38 H160 V140 L130 172 H40 Z" fill="' + c + '"/>' +
      '<path d="M160 140 L130 172 L136 146 Z" fill="' + aclarar(c, 0.45) + '"/>' +
      '<path d="M40 38 H160" stroke="#fff" stroke-width="2" opacity="0.35"/></g>' + etiqueta(d.etiqueta);
  };

  tipos.papelPicado = function (l, d) {
    var cols = d.colores || ['#e4007c', '#ff8c00', '#00a6a6', '#7b2cbf'];
    var s = halo(cols[0]) + '<path d="M6 44 Q100 62 194 44" stroke="#8d7f8c" stroke-width="1.6" fill="none"/>';
    [16, 60, 104, 148].forEach(function (x, i) {
      var y = 46 + Math.sin((x + 18) / 200 * Math.PI) * 8;
      var cx = x + 18, agujeros = '';
      agujeros += '<circle cx="' + cx + '" cy="' + (y + 32) + '" r="5" fill="#000"/>';
      [0, 90, 180, 270].forEach(function (a) {
        agujeros += '<ellipse cx="' + cx + '" cy="' + (y + 21) + '" rx="3" ry="6" fill="#000" transform="rotate(' + a + ' ' + cx + ' ' + (y + 32) + ')"/>';
      });
      for (var k = 0; k < 4; k++) agujeros += '<circle cx="' + (x + 6 + k * 8) + '" cy="' + (y + 8) + '" r="2" fill="#000"/>';
      for (var k2 = 0; k2 < 3; k2++) agujeros += '<rect x="' + (x + 8 + k2 * 9) + '" y="' + (y + 50) + '" width="4" height="4" fill="#000" transform="rotate(45 ' + (x + 10 + k2 * 9) + ' ' + (y + 52) + ')"/>';
      var m = l.mascara(agujeros);
      var puntos = [x + ',' + y, (x + 36) + ',' + y, (x + 36) + ',' + (y + 64)];
      for (var f = 5; f >= 0; f--) puntos.push((x + f * 6 + 3) + ',' + (y + 70), (x + f * 6) + ',' + (y + 64));
      s += '<polygon mask="' + m + '" points="' + puntos.join(' ') + '" fill="' + cols[i % cols.length] + '"/>';
    });
    return s + etiqueta(d.etiqueta);
  };

  tipos.banderin = function (l, d) {
    var cols = d.colores || ['#e0b33a'];
    var letras = String(d.texto || 'FELIZ').split('');
    var s = halo(cols[0]) + '<path d="M6 50 Q100 72 194 50" stroke="#8d7f8c" stroke-width="1.6" fill="none"/>';
    var ancho = 188 / letras.length;
    letras.forEach(function (letra, i) {
      var x = 6 + i * ancho, cx = x + ancho / 2;
      var y = 50 + Math.sin(cx / 200 * Math.PI) * 11;
      var col = cols[i % cols.length];
      var relleno = d.estilo === 'metal' ? l.metal(col) : col;
      s += '<polygon points="' + (x + 2).toFixed(1) + ',' + y.toFixed(1) + ' ' + (x + ancho - 2).toFixed(1) + ',' + y.toFixed(1) + ' ' +
        cx.toFixed(1) + ',' + (y + ancho * 1.5).toFixed(1) + '" fill="' + relleno + '"/>' +
        texto(cx.toFixed(1), (y + ancho * 0.62).toFixed(1), letra, Math.round(ancho * 0.52), tintaSobre(col));
    });
    return s + etiqueta(d.etiqueta);
  };

  tipos.invitacion = function (l, d) {
    var c = d.color;
    var lineas = String(d.texto || 'Te invito').split('|');
    return halo(c) +
      '<rect x="34" y="92" width="132" height="84" rx="4" fill="' + aclarar(c, 0.62) + '" stroke="' + aclarar(c, 0.3) + '"/>' +
      '<g transform="rotate(-7 100 90)"><rect x="56" y="30" width="88" height="114" rx="4" fill="#fffdfb" stroke="#eadde6"/>' +
      '<rect x="56" y="30" width="88" height="16" rx="4" fill="' + c + '"/>' +
      lineas.map(function (t, i) { return texto(100, 78 + i * 20, t, ajustar(t, 74, 19), oscurecer(c, 0.25)); }).join('') +
      '<path d="M72 122 H128 M78 130 H122" stroke="#d8cbd3" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="66" cy="58" r="2.5" fill="' + c + '"/><circle cx="134" cy="112" r="2.5" fill="' + c + '"/></g>' +
      '<path d="M34 92 L100 140 L166 92" fill="none" stroke="' + aclarar(c, 0.3) + '" stroke-width="1.5"/>' +
      '<path d="M34 176 L84 128 M166 176 L116 128" stroke="' + aclarar(c, 0.3) + '" stroke-width="1.5"/>' +
      etiqueta(d.etiqueta);
  };

  tipos.foami = function (l, d) {
    var c = d.color;
    var s = halo(c);
    [[30, 72, -6], [24, 62, 3], [20, 50, -2]].forEach(function (p, i) {
      var col = i === 2 ? c : oscurecer(c, 0.06 * (2 - i));
      s += '<g transform="rotate(' + p[2] + ' 100 110)"><rect x="' + p[0] + '" y="' + (p[1] + 6) + '" width="' + (200 - 2 * p[0]) + '" height="96" rx="5" fill="' + oscurecer(col, 0.25) + '"/>' +
        '<rect x="' + p[0] + '" y="' + p[1] + '" width="' + (200 - 2 * p[0]) + '" height="96" rx="5" fill="' + (d.estilo === 'diamantado' && i === 2 ? l.metal(col) : col) + '"/></g>';
    });
    if (d.estilo === 'diamantado') {
      var r = aleatorio(11);
      for (var k = 0; k < 70; k++) {
        s += '<circle cx="' + (26 + r() * 148).toFixed(1) + '" cy="' + (54 + r() * 88).toFixed(1) + '" r="' + (0.8 + r() * 1.4).toFixed(1) +
          '" fill="' + (k % 2 ? '#fff' : oscurecer(c, 0.3)) + '" opacity="0.8" transform="rotate(-2 100 110)"/>';
      }
    }
    return s + etiqueta(d.etiqueta);
  };

  tipos.papelMetalico = function (l, d) {
    var c = d.color;
    return halo(c) +
      '<rect x="46" y="44" width="116" height="128" rx="2" fill="' + oscurecer(c, 0.3) + '" transform="rotate(7 100 108)"/>' +
      '<g transform="rotate(-4 100 108)"><rect x="40" y="38" width="120" height="130" rx="2" fill="' + l.metal(c) + '"/>' +
      '<path d="M60 38 L40 70 M110 38 L40 140 M150 38 L58 168 M160 92 L114 168" stroke="#fff" stroke-width="6" opacity="0.18"/></g>';
  };

  tipos.topper = function (l, d) {
    var c = d.color;
    var lineas = String(d.texto || 'Feliz|Cumple').split('|');
    var g = l.metal(c);
    return halo(c) +
      '<path d="M76 120 L70 194 M124 120 L130 194" stroke="#c9b38a" stroke-width="3.5" stroke-linecap="round"/>' +
      lineas.map(function (t, i) {
        return texto(100, 82 + i * 42, t, ajustar(t, 170, 50), g, ' stroke="' + oscurecer(c, 0.3) + '" stroke-width="2" paint-order="stroke"');
      }).join('') +
      '<polygon points="' + puntosEstrella(38, 46, 9, 4, 5) + '" fill="' + g + '"/>' +
      '<polygon points="' + puntosEstrella(164, 40, 7, 3, 5) + '" fill="' + g + '"/>';
  };

  tipos.rollo = function (l, d) {
    var c = d.color;
    var p = d.patron === 'liso' ? c : l.patron(d.patron || 'confeti', c, d.colores);
    var sombra = l.id('s');
    l.defs.push('<linearGradient id="' + sombra + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#000" stop-opacity="0.12"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.18"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity="0.22"/></linearGradient>');
    return halo(c) +
      '<path d="M44 104 L156 104 L148 180 L30 172 Z" fill="' + p + '"/>' +
      '<path d="M44 104 L156 104 L148 180 L30 172 Z" fill="#000" opacity="0.06"/>' +
      '<rect x="30" y="48" width="140" height="58" fill="' + p + '"/>' +
      '<rect x="30" y="48" width="140" height="58" fill="url(#' + sombra + ')"/>' +
      '<ellipse cx="170" cy="77" rx="10" ry="29" fill="' + aclarar(c, 0.25) + '"/>' +
      '<ellipse cx="170" cy="77" rx="5" ry="11" fill="' + CARTON + '" stroke="' + oscurecer(CARTON, 0.2) + '"/>' +
      etiqueta(d.etiqueta);
  };

  tipos.pliegos = function (l, d) {
    var c = d.color;
    var p = l.patron(d.patron || 'confeti', c, d.colores);
    var s = halo(c);
    [[-9, 6], [4, -2], [-2, -10]].forEach(function (q, i) {
      s += '<g transform="rotate(' + q[0] + ' 100 110) translate(0 ' + q[1] + ')"><rect x="40" y="52" width="120" height="112" rx="2" fill="' + p + '"/>' +
        (i < 2 ? '<rect x="40" y="52" width="120" height="112" fill="#000" opacity="' + (0.12 - i * 0.05) + '"/>' : '') +
        '<path d="M100 52 V164" stroke="#fff" stroke-width="1.5" opacity="0.35"/></g>';
    });
    return s + etiqueta(d.etiqueta);
  };

  tipos.mono = function (l, d) {
    var c = d.color;
    var g = l.mate(c, 0.4), g2 = l.mate(oscurecer(c, 0.12), 0.3);
    var s = halo(c);
    var n = d.forma === 'estrella' ? 8 : 10;
    for (var i = 0; i < n; i++) {
      s += '<ellipse cx="100" cy="64" rx="' + (d.forma === 'estrella' ? 10 : 14) + '" ry="34" fill="' + g2 + '" transform="rotate(' + (i * 360 / n) + ' 100 98)"/>';
    }
    for (var j = 0; j < n - 2; j++) {
      s += '<ellipse cx="100" cy="76" rx="' + (d.forma === 'estrella' ? 8 : 11) + '" ry="24" fill="' + g + '" transform="rotate(' + (j * 360 / (n - 2) + 20) + ' 100 98)"/>';
    }
    return s + '<circle cx="100" cy="98" r="13" fill="' + g + '"/>' + brillo(95, 92, 4, 6, -30, 0.5) + etiqueta(d.etiqueta);
  };

  tipos.liston = function (l, d) {
    var c = d.color;
    var anillos = '';
    for (var r = 50; r > 30; r -= 4) anillos += '<circle cx="90" cy="90" r="' + r + '" fill="none" stroke="' + oscurecer(c, 0.2) + '" stroke-width="0.8" opacity="0.45"/>';
    var cola = d.estilo === 'rizado'
      ? '<path d="M130 116 c22 0 24 18 8 20 c-16 2 -12 20 6 20 c18 0 20 16 4 20" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round"/>'
      : '<path d="M128 118 C150 130 150 160 176 178" stroke="' + oscurecer(c, 0.1) + '" stroke-width="17" fill="none"/>' +
        '<path d="M128 118 C150 130 150 160 176 178" stroke="' + c + '" stroke-width="14" fill="none"/>' +
        '<path d="M168 186 L180 168 L186 182 Z" fill="' + oscurecer(c, 0.12) + '"/>';
    return halo(c) + cola +
      '<circle cx="90" cy="90" r="62" fill="' + CARTON + '" stroke="' + oscurecer(CARTON, 0.15) + '"/>' +
      '<circle cx="90" cy="90" r="54" fill="' + l.mate(c, 0.35) + '"/>' + anillos +
      '<circle cx="90" cy="90" r="24" fill="' + aclarar(CARTON, 0.3) + '"/>' +
      '<circle cx="90" cy="90" r="9" fill="' + oscurecer(CARTON, 0.35) + '"/>' + etiqueta(d.etiqueta);
  };

  tipos.bolsa = function (l, d) {
    var c = d.color;
    var p = d.patron === 'liso' ? c : l.patron(d.patron || 'lunares', c, d.colores);
    var papel = d.colores ? aclarar(d.colores[0], 0.4) : aclarar(c, 0.6);
    return halo(c) +
      '<path d="M62 76 C62 34 88 34 88 76 M112 76 C112 34 138 34 138 76" stroke="' + oscurecer(c, 0.45) + '" stroke-width="3.5" fill="none"/>' +
      '<polygon points="78,74 92,40 106,74" fill="' + papel + '"/><polygon points="94,74 110,30 126,74" fill="' + aclarar(papel, 0.4) + '"/>' +
      '<rect x="50" y="72" width="100" height="106" fill="' + p + '"/>' +
      '<polygon points="150,72 164,80 164,172 150,178" fill="' + oscurecer(c, 0.22) + '"/>' +
      '<rect x="50" y="72" width="100" height="10" fill="#000" opacity="0.08"/>' +
      '<circle cx="62" cy="80" r="2.4" fill="' + oscurecer(c, 0.45) + '"/><circle cx="88" cy="80" r="2.4" fill="' + oscurecer(c, 0.45) + '"/>' +
      '<circle cx="112" cy="80" r="2.4" fill="' + oscurecer(c, 0.45) + '"/><circle cx="138" cy="80" r="2.4" fill="' + oscurecer(c, 0.45) + '"/>' +
      etiqueta(d.etiqueta);
  };

  tipos.bolsaCelofan = function (l, d) {
    var c = d.color;
    var dulces = ['#ff5d8f', '#ffd23f', '#3ec1d3', '#7bd389', '#9b5de5', '#ff8c42'];
    var s = halo(c);
    var r = aleatorio(5);
    for (var i = 0; i < 12; i++) {
      s += '<circle cx="' + (76 + r() * 48).toFixed(1) + '" cy="' + (118 + r() * 52).toFixed(1) + '" r="7" fill="' + dulces[i % dulces.length] + '"/>';
    }
    return s +
      '<path d="M68 66 L132 66 L136 176 L64 176 Z" fill="#fff" opacity="0.32" stroke="#bfb3bc" stroke-width="1.5"/>' +
      '<path d="M78 76 L74 166" stroke="#fff" stroke-width="5" opacity="0.6" stroke-linecap="round"/>' +
      '<path d="M86 66 L80 40 L120 40 L114 66 Z" fill="#fff" opacity="0.32" stroke="#bfb3bc" stroke-width="1.5"/>' +
      '<path d="M100 64 C84 50 76 62 90 66 M100 64 C116 50 124 62 110 66" stroke="' + c + '" stroke-width="4" fill="none"/>' +
      '<rect x="86" y="62" width="28" height="6" rx="3" fill="' + c + '"/>' + etiqueta(d.etiqueta);
  };

  tipos.celofan = function (l, d) {
    var c = d.color;
    return halo(c) +
      '<path d="M44 104 L156 104 L150 182 L32 172 Z" fill="' + aclarar(c, 0.4) + '" opacity="0.55" stroke="' + oscurecer(c, 0.1) + '" stroke-width="1"/>' +
      '<path d="M60 116 L52 166 M120 114 L112 172" stroke="#fff" stroke-width="6" opacity="0.6" stroke-linecap="round"/>' +
      '<rect x="30" y="48" width="140" height="58" fill="' + l.cilindro(aclarar(c, 0.15)) + '" opacity="0.85"/>' +
      '<path d="M40 60 H160 M40 92 H160" stroke="#fff" stroke-width="4" opacity="0.55"/>' +
      '<ellipse cx="170" cy="77" rx="10" ry="29" fill="' + aclarar(c, 0.5) + '"/>' +
      '<ellipse cx="170" cy="77" rx="5" ry="11" fill="' + CARTON + '" stroke="' + oscurecer(CARTON, 0.2) + '"/>' + etiqueta(d.etiqueta);
  };

  tipos.cajas = function (l, d) {
    var c = d.color;
    var colorCinta = d.colorListon || (luminancia(c) > 0.5 ? '#c2185b' : '#f2c94c');
    var cajas = [[34, 120, 132, 56], [54, 76, 92, 42], [70, 42, 60, 30]];
    var s = halo(c);
    cajas.forEach(function (k) {
      var x = k[0], y = k[1], w = k[2], h = k[3];
      var tapa = Math.max(8, h * 0.28);
      s += '<rect x="' + (x + 4) + '" y="' + (y + tapa) + '" width="' + (w - 8) + '" height="' + (h - tapa) + '" fill="' + oscurecer(c, 0.08) + '"/>' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + tapa + '" rx="2" fill="' + aclarar(c, 0.08) + '"/>' +
        '<rect x="' + (x + 4) + '" y="' + (y + tapa) + '" width="' + (w - 8) + '" height="4" fill="#000" opacity="0.12"/>' +
        '<rect x="' + (x + w / 2 - 4) + '" y="' + y + '" width="8" height="' + h + '" fill="' + colorCinta + '"/>';
    });
    return s + '<path d="M100 42 C86 26 76 38 92 42 M100 42 C114 26 124 38 108 42" stroke="' + colorCinta + '" stroke-width="5" fill="none"/>' +
      etiqueta(d.etiqueta);
  };

  tipos.viruta = function (l, d) {
    var c = d.color;
    var r = aleatorio(3), s = halo(c);
    s += '<ellipse cx="100" cy="128" rx="78" ry="44" fill="' + oscurecer(c, 0.25) + '" opacity="0.35"/>';
    for (var i = 0; i < 60; i++) {
      var ang = r() * Math.PI * 2, rad = Math.sqrt(r());
      var x = 100 + Math.cos(ang) * rad * 68, y = 124 + Math.sin(ang) * rad * 36;
      var col = i % 3 === 0 ? aclarar(c, 0.2) : i % 3 === 1 ? c : oscurecer(c, 0.15);
      s += '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' q8 -' + (4 + r() * 6).toFixed(1) + ' 14 0 t14 0" stroke="' + col +
        '" stroke-width="3" fill="none" stroke-linecap="round" transform="rotate(' + Math.round(r() * 180) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
    }
    return s + etiqueta(d.etiqueta);
  };

  /* ---------- API pública ---------- */

  function svg(d, etiquetaAccesible) {
    var l = new Lienzo();
    var dibujar = tipos[d.tipo] || tipos.cajas;
    var cuerpo = dibujar(l, d);
    return '<svg class="dibujo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      escapar(etiquetaAccesible || '') + '"><defs>' + l.defs.join('') + '</defs>' + cuerpo + '</svg>';
  }

  // Ilustración de portada: un racimo de globos.
  function portada() {
    var l = new Lienzo();
    var s = '';
    var piezas = [
      ['latex', 64, 120, 1.25, '#e9407a'],
      ['latex', 246, 112, 1.15, '#f6c445'],
      ['estrella', 104, 66, 0.62, '#d4a72c'],
      ['corazon', 214, 60, 0.6, '#ff5c93'],
      ['latex', 160, 74, 1.35, '#7e57c2'],
      ['numero', 162, 150, 0.62, '#c9cfd8']
    ];
    piezas.forEach(function (p) {
      s += hilo(p[1], p[2] + 40, 160, 236);
    });
    piezas.forEach(function (p) {
      if (p[0] === 'latex') s += globoLatex(l, p[1], p[2], p[3], p[4], p[4] === '#f6c445' ? 'perlado' : 'mate');
      else if (p[0] === 'estrella') s += '<g transform="translate(' + p[1] + ' ' + p[2] + ') scale(' + p[3] + ') translate(-100 -92)">' + formaEstrella(l, p[4]) + '</g>';
      else if (p[0] === 'corazon') s += '<g transform="translate(' + p[1] + ' ' + p[2] + ') scale(' + p[3] + ') translate(-100 -100)">' + formaCorazon(l, p[4]) + '</g>';
      else s += '<g transform="translate(' + p[1] + ' ' + p[2] + ') scale(' + p[3] + ') translate(-100 -110)">' +
        texto(100, 166, '1', 190, l.metal(p[4]), ' stroke="' + oscurecer(p[4], 0.25) + '" stroke-width="3" paint-order="stroke"') + '</g>';
    });
    return '<svg class="portada-dibujo" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' +
      l.defs.join('') + '</defs>' + s + '</svg>';
  }

  global.Dibujos = { svg: svg, portada: portada, tintaSobre: tintaSobre, aclarar: aclarar, oscurecer: oscurecer };
})(typeof window !== 'undefined' ? window : globalThis);
