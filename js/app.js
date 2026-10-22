/* =====================================================================
   TIENDA: rutas, catálogo, buscador, producto, carrito y pedido.
   ===================================================================== */
(function () {
  'use strict';

  const T = window.TIENDA;
  const E = window.ENVIO;
  const CATS = window.CATEGORIAS;
  const { resumenCarrito, calcularEnvio } = window.Calculos;
  const catPorId = Object.fromEntries(CATS.map((c) => [c.id, c]));

  // El catálogo se llena al arrancar: desde la hoja de Google o con los productos de ejemplo.
  let TODOS = []; // incluye los ocultos (para la página de revisión)
  let PRODS = []; // los que ve el cliente
  let TEMAS = window.TEMATICAS;
  let porId = {};
  let temaPorId = {};
  let fuente = { tipo: 'cargando' };

  const vista = document.getElementById('vista');

  /* ------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------ */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmt2 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
  const fmt0 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const dinero = (n) => fmt2.format(n);
  const precio = (n) => (Number.isInteger(n) ? fmt0 : fmt2).format(n);

  function pesoTexto(g) {
    if (g < 1000) return `${Math.round(g)}\u00a0g`;
    return `${(g / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 })}\u00a0kg`;
  }

  const normalizar = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ&]+/g, ' ').trim();

  const almacen = {
    leer(clave, porDefecto) {
      try {
        const v = localStorage.getItem(clave);
        return v ? JSON.parse(v) : porDefecto;
      } catch (e) {
        return porDefecto;
      }
    },
    guardar(clave, valor) {
      try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento disponible */ }
    }
  };

  const enIframe = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();

  const waEnlace = (texto) => `https://wa.me/${T.whatsapp}?text=${encodeURIComponent(texto)}`;

  /* ------------------------------------------------------------------
     Íconos
     ------------------------------------------------------------------ */
  const I = {
    buscar: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m20 20-4.2-4.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    carrito: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 4h2.2l2.5 11.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.5L21 8H6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20.4" r="1.5" fill="currentColor"/><circle cx="17" cy="20.4" r="1.5" fill="currentColor"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.3 21.7l4.8-1.3A9.8 9.8 0 1 0 12 2.2Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M8.7 7.3c.2-.4.4-.4.7-.4h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.3 0 .5.6 1 1.4 1.8 2.4 2.4.2.1.4.1.5 0l.7-.7c.2-.2.4-.2.6-.1l1.9.9c.3.1.4.3.4.5 0 .9-.6 1.9-1.6 2.1-1 .2-2.5 0-4.4-1.5-1.9-1.4-3-3-3.3-4.3-.3-1.2 0-2.3.6-3.1Z" fill="currentColor"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.3 2.8c.4 2.2 1.8 3.7 4.1 4v3.2a7.6 7.6 0 0 1-4.1-1.3v6.5a5.9 5.9 0 1 1-5.9-5.9l.9.1v3.3a2.7 2.7 0 1 0 1.9 2.5V2.8h3.1Z" fill="currentColor"/></svg>',
    camion: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="1.9" fill="var(--surface)" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="17.5" r="1.9" fill="var(--surface)" stroke="currentColor" stroke-width="1.8"/></svg>',
    etiqueta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12.2V4.5A1.5 1.5 0 0 1 4.5 3h7.7l8.6 8.6a1.5 1.5 0 0 1 0 2.1l-7.1 7.1a1.5 1.5 0 0 1-2.1 0Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.6" fill="currentColor"/></svg>',
    mas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    menos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    basura: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    filtro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    tienda: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5 5 4h14l1.5 5.5M4.5 10v10h15V10M3.5 9.5a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.8 0 2.8 2.8 0 0 0 5.6 0M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    copiar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    flecha: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* ------------------------------------------------------------------
     Producto: variantes, dibujo y tarjetas
     ------------------------------------------------------------------ */
  const grupoTamano = (p) => (p.variantes || []).find((g) => g.tipo === 'tamano');

  // Una carta de muchos tonos (Sempertex) se elige a propósito: no hay tono preseleccionado.
  const esCarta = (g) => g.tipo === 'color' && (g.opciones.length > 20 || g.opciones.some((o) => o.familia));
  const requiereEleccion = esCarta;

  function seleccionInicial(p) {
    const sel = {};
    (p.variantes || []).forEach((g) => {
      if (requiereEleccion(g)) return;
      sel[g.nombre] = (g.opciones.find((o) => !o.agotado) || g.opciones[0]).nombre;
    });
    return sel;
  }

  function opcionElegida(grupo, sel) {
    const o = grupo.opciones.find((x) => x.nombre === sel[grupo.nombre]);
    if (o) return o;
    return requiereEleccion(grupo) ? null : grupo.opciones[0];
  }

  // El producto con el precio, mayoreo, peso y presentación del tamaño elegido.
  // Su id incluye el tamaño para que el mayoreo se cuente por tamaño.
  function productoEfectivo(p, sel) {
    const g = grupoTamano(p);
    const t = g && opcionElegida(g, sel || {});
    if (!t) return p;
    return Object.assign({}, p, {
      id: `${p.id}|${t.nombre}`,
      idBase: p.id,
      precio: t.precio ?? p.precio,
      mayoreo: t.precio != null ? t.mayoreo : p.mayoreo,
      peso: t.peso ?? p.peso,
      unidad: t.unidad || p.unidad
    });
  }

  // Un color puede estar agotado en general o solo en el tamaño elegido.
  function colorDisponible(p, o, sel) {
    if (o.agotado) return false;
    const g = grupoTamano(p);
    const t = g && opcionElegida(g, sel || {});
    return !(t && t.sinColores && t.sinColores.includes(o.nombre));
  }

  function descripcionFamilia(nombre) {
    for (const carta of Object.values(window.CARTAS || {})) {
      const f = carta.familias.find((x) => x.nombre === nombre);
      if (f) return f.descripcion;
    }
    return '';
  }

  function dibujoDe(p, sel) {
    const d = Object.assign({ color: '#e5177e' }, p.dibujo);
    (p.variantes || []).forEach((g) => {
      const o = opcionElegida(g, sel || {});
      if (!o) return;
      if (o.color) d.color = o.color;
      if (o.dibujo) Object.assign(d, o.dibujo);
    });
    return d;
  }

  function imagenDe(p, sel) {
    let foto = p.imagen;
    (p.variantes || []).forEach((g) => {
      const o = opcionElegida(g, sel || {});
      if (o && o.imagen) foto = o.imagen;
    });
    if (foto) return `<img src="${esc(foto)}" alt="${esc(p.nombre)}" loading="lazy">`;
    return window.Dibujos.svg(dibujoDe(p, sel), p.nombre);
  }

  function textoOpciones(opciones) {
    return Object.entries(opciones || {}).map(([k, v]) => `${k}: ${v}`).join(' · ');
  }

  function resumenVariantes(p) {
    if (!p.variantes || !p.variantes.length) return '';
    return p.variantes.map((g) => {
      const n = g.opciones.length;
      const nombre = g.nombre.toLowerCase();
      if (g.tipo === 'tamano') return `${n} ${n === 1 ? 'tamaño' : 'tamaños'}`;
      if (esCarta(g)) return `${n} tonos`;
      if (nombre === 'color') return `${n} colores`;
      if (nombre === 'número') return '0 al 9';
      if (nombre === 'letra') return 'A a la Z';
      if (nombre === 'diseño') return `${n} diseños`;
      if (nombre === 'paleta') return `${n} paletas`;
      return `${n} opciones`;
    }).join(' · ');
  }

  function tarjeta(p) {
    const tam = grupoTamano(p);
    const precios = tam ? tam.opciones.map((o) => o.precio ?? p.precio) : [p.precio];
    const desde = new Set(precios).size > 1;
    let may = '';
    if (tam && tam.opciones.some((o) => o.mayoreo)) may = '<p class="tarjeta-mayoreo">Precio de mayoreo en cada tamaño</p>';
    else if (p.mayoreo) may = `<p class="tarjeta-mayoreo">${precio(p.mayoreo.precio)} c/u desde ${p.mayoreo.min} ${unidadesPlural(p.unidad)}</p>`;
    const vars = resumenVariantes(p);
    const agotado = p.estado === 'agotado';
    const insignia = agotado ? '<span class="insignia insignia-agotado">Agotado</span>' : p.nuevo ? '<span class="insignia">Nuevo</span>' : '';
    return `<a class="tarjeta${agotado ? ' tarjeta-agotada' : ''}" href="#/producto/${p.id}">
      <div class="tarjeta-img">${imagenDe(p)}${insignia}</div>
      <div class="tarjeta-info">
        ${marcaDe(p) ? `<p class="tarjeta-marca">${logoMarca(marcaDe(p), 'marca-logo-tarjeta')}</p>` : ''}
        <h3 class="tarjeta-nombre">${esc(p.nombre)}</h3>
        <p class="tarjeta-precio">${desde ? '<span class="tarjeta-desde">Desde</span> ' : ''}${precio(Math.min(...precios))}</p>
        <p class="tarjeta-unidad">${tam ? esc(tam.opciones.map((o) => o.nombre).join(' · ')) : `por ${esc(p.unidad)}`}</p>
        ${may}
        ${vars ? `<p class="tarjeta-vars">${esc(vars)}</p>` : ''}
      </div>
    </a>`;
  }

  // "bolsa con 50 piezas" -> "bolsas", "pieza" -> "pzas"
  function unidadesPlural(u) {
    const primera = u.split(' ')[0];
    return primera === 'pieza' ? 'pzas' : `${primera}s`;
  }

  const rejilla = (lista) => `<div class="rejilla">${lista.map(tarjeta).join('')}</div>`;

  /* ------------------------------------------------------------------
     Carrito (estado)
     ------------------------------------------------------------------ */
  const claveLinea = (id, opciones) => id + '::' + Object.keys(opciones || {}).sort().map((k) => `${k}=${opciones[k]}`).join('&');

  let carrito = almacen.leer('bd-carrito', []).filter((l) => l && l.id && l.cantidad > 0);
  let envio = Object.assign({ metodo: 'domicilio', estado: 'Baja California', destino: '' }, almacen.leer('bd-envio', {}));
  let cliente = Object.assign({ nombre: '', telefono: '', direccion: '', fecha: '', pago: T.formasPago[0], notas: '' }, almacen.leer('bd-cliente', {}));
  if (!T.formasPago.includes(cliente.pago)) cliente.pago = T.formasPago[0];

  function guardarCarrito() {
    almacen.guardar('bd-carrito', carrito);
    pintarContador();
  }

  function agregarAlCarrito(id, opciones, cantidad) {
    const clave = claveLinea(id, opciones);
    const linea = carrito.find((l) => claveLinea(l.id, l.opciones) === clave);
    if (linea) linea.cantidad = Math.min(999, linea.cantidad + cantidad);
    else carrito.push({ id, opciones: Object.assign({}, opciones), cantidad });
    guardarCarrito();
  }

  // Quita del carrito lo que ya no existe o se agotó (por ejemplo, tras cambiar la hoja).
  function limpiarCarrito() {
    if (fuente.tipo === 'error' || fuente.tipo === 'cargando') return;
    const antes = carrito.length;
    carrito = carrito.filter(lineaDisponible);
    const quitados = antes - carrito.length;
    guardarCarrito();
    if (quitados) aviso(`Quitamos ${quitados} ${quitados === 1 ? 'producto' : 'productos'} de tu carrito porque ya no ${quitados === 1 ? 'está disponible' : 'están disponibles'}.`);
  }

  // Piezas del mismo producto (y del mismo tamaño) que ya están en el carrito.
  function piezasEnCarrito(p, sel) {
    const id = productoEfectivo(p, sel).id;
    return carrito.filter((l) => porId[l.id] && productoEfectivo(porId[l.id], l.opciones).id === id)
      .reduce((s, l) => s + l.cantidad, 0);
  }

  function resumenActual() {
    return resumenCarrito(carrito.filter((l) => porId[l.id]).map((l) => ({ producto: productoEfectivo(porId[l.id], l.opciones), cantidad: l.cantidad, opciones: l.opciones })));
  }

  // ¿Se puede seguir vendiendo esta línea? (producto, tamaño y tono disponibles)
  function lineaDisponible(l) {
    const p = porId[l.id];
    if (!p || p.estado === 'agotado') return false;
    return (p.variantes || []).every((g) => {
      const elegido = l.opciones && l.opciones[g.nombre];
      if (!elegido) return !requiereEleccion(g);
      const o = g.opciones.find((x) => x.nombre === elegido);
      if (!o) return true; // la opción cambió de nombre en la hoja: se respeta lo que pidió el cliente
      return g.tipo === 'color' ? colorDisponible(p, o, l.opciones) : !o.agotado;
    });
  }

  function destinoElegido() {
    const fila = E.destinos.find((d) => d[0] === envio.estado && d[1] === envio.destino);
    return fila ? { estado: fila[0], nombre: fila[1], lat: fila[2], lng: fila[3] } : null;
  }

  function envioActual(resumen) {
    return calcularEnvio({
      metodo: envio.metodo,
      destino: destinoElegido(),
      pesoGramos: resumen.pesoGramos,
      subtotal: resumen.subtotal
    }, E);
  }

  function pintarContador() {
    const n = carrito.reduce((s, l) => s + l.cantidad, 0);
    document.querySelectorAll('[data-contador]').forEach((el) => {
      el.textContent = n > 99 ? '99+' : String(n);
      el.hidden = n === 0;
    });
    const enlace = document.querySelector('.cabecera-carrito');
    if (enlace) enlace.setAttribute('aria-label', n ? `Carrito, ${n} artículos` : 'Carrito vacío');
  }

  /* ------------------------------------------------------------------
     Buscador
     ------------------------------------------------------------------ */
  const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'con', 'y', 'en', 'un', 'una', 'por', 'a']);

  let indice = {};

  function construirIndice() {
    indice = Object.fromEntries(PRODS.map((p) => {
      const variantes = [...new Set((p.variantes || []).flatMap((g) => g.opciones.flatMap((o) => [o.nombre, o.familia, o.ingles, o.carta])).filter(Boolean))].join(' ');
      const temas = p.tematicas.map((t) => temaPorId[t] ? temaPorId[t].nombre : '').join(' ');
      return [p.id, {
        nombre: normalizar(p.nombre),
        etiquetas: normalizar(p.etiquetas || ''),
        grupo: normalizar(`${catPorId[p.categoria].nombre} ${temas} ${variantes}`),
        desc: normalizar(`${p.descripcion} ${p.unidad}`)
      }];
    }));
  }

  function raiz(t) {
    if (t.length > 4 && t.endsWith('es')) return t.slice(0, -2);
    if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1);
    return t;
  }

  function buscar(q) {
    let tokens = normalizar(q).split(' ').filter(Boolean);
    const utiles = tokens.filter((t) => !VACIAS.has(t));
    if (utiles.length) tokens = utiles;
    if (!tokens.length) return [];

    const resultados = [];
    PRODS.forEach((p, orden) => {
      const c = indice[p.id];
      let puntos = 0;
      for (const t of tokens) {
        const formas = t === raiz(t) ? [t] : [t, raiz(t)];
        let mejor = 0;
        for (const f of formas) {
          if (c.nombre.includes(f)) mejor = Math.max(mejor, 5);
          else if (c.etiquetas.includes(f)) mejor = Math.max(mejor, 3);
          else if (c.grupo.includes(f)) mejor = Math.max(mejor, 2);
          else if (c.desc.includes(f)) mejor = Math.max(mejor, 1);
        }
        if (!mejor) return;
        puntos += mejor;
      }
      resultados.push({ p, puntos, orden });
    });
    return resultados.sort((a, b) => b.puntos - a.puntos || a.orden - b.orden).map((r) => r.p);
  }

  function gruposCoincidentes(q) {
    const n = normalizar(q);
    if (n.length < 3) return [];
    return [
      ...CATS.filter((c) => normalizar(c.nombre).includes(n)).map((c) => ({ href: `#/categoria/${c.id}`, nombre: c.nombre, tipo: 'Categoría' })),
      ...marcasConProductos().filter((m) => normalizar(`globos ${m.nombre}`).includes(n)).map((m) => ({ href: `#/marca/${m.id}`, nombre: `Globos ${m.nombre}`, tipo: 'Marca' })),
      ...temasConProductos().filter((t) => normalizar(t.nombre).includes(n)).map((t) => ({ href: `#/tematica/${t.id}`, nombre: t.nombre, tipo: 'Temática' }))
    ].slice(0, 3);
  }

  /* ------------------------------------------------------------------
     Cabecera y pie
     ------------------------------------------------------------------ */
  function logo() {
    return `<picture class="logo-img"><source srcset="img/logo.webp" type="image/webp"><img src="img/logo.png" alt="${esc(T.nombre)}" width="720" height="146"></picture>`;
  }

  function pintarCabecera() {
    document.getElementById('cabecera').innerHTML = `
      <div class="cabecera-barra">
        <div class="contenedor cabecera-fila">
          <a class="logo" href="#/" aria-label="${esc(T.nombre)}, inicio">${logo()}</a>
          <form class="buscador" id="buscador" role="search" autocomplete="off">
            <label class="oculto" for="buscar">Buscar productos</label>
            <input id="buscar" name="q" type="search" placeholder="Buscar globos, papel, moños…" enterkeyhint="search"
              aria-autocomplete="list" aria-controls="sugerencias" aria-expanded="false">
            <button type="submit" class="buscador-boton" aria-label="Buscar">${I.buscar}</button>
            <div class="sugerencias" id="sugerencias" role="listbox" hidden></div>
          </form>
          <a class="cabecera-carrito" href="#/carrito" aria-label="Carrito">${I.carrito}<span class="contador" data-contador hidden>0</span><span class="cabecera-carrito-txt">Carrito</span></a>
        </div>
      </div>
      <nav class="navegacion" aria-label="Categorías">
        <div class="contenedor navegacion-fila" id="navegacion-fila"></div>
      </nav>`;
    pintarNavegacion();
    activarBuscador();
    pintarContador();
  }

  function pintarPie() {
    const anio = new Date().getFullYear();
    document.getElementById('pie').innerHTML = `
      <div class="contenedor pie-rejilla">
        <div class="pie-marca">
          <a class="logo logo-pie" href="#/">${logo()}</a>
          <p>${esc(T.lema)}. Venta de mayoreo y menudeo desde ${esc(T.ciudad)}.</p>
        </div>
        <div>
          <h2 class="pie-titulo">Catálogo</h2>
          <ul class="pie-lista">
            ${CATS.map((c) => `<li><a href="#/categoria/${c.id}">${esc(c.nombre)}</a></li>`).join('')}
            <li><a href="#/tematicas">Temáticas</a></li>
          </ul>
        </div>
        <div>
          <h2 class="pie-titulo">Ayuda</h2>
          <ul class="pie-lista">
            <li><a href="#/envios">Envíos y cómo comprar</a></li>
            <li><a href="#/carrito">Mi carrito</a></li>
          </ul>
        </div>
        <div>
          <h2 class="pie-titulo">Contacto</h2>
          <ul class="pie-lista pie-redes">
            <li><a href="${waEnlace('¡Hola, Buen Detalle! Tengo una pregunta.')}" target="_blank" rel="noopener">${I.whatsapp}<span>WhatsApp <span class="sel">${esc(T.whatsappVisible)}</span></span></a></li>
            <li><a href="${T.instagram.url}" target="_blank" rel="noopener">${I.instagram}<span>@${esc(T.instagram.usuario)}</span></a></li>
            <li><a href="${T.tiktok.url}" target="_blank" rel="noopener">${I.tiktok}<span>@${esc(T.tiktok.usuario)}</span></a></li>
          </ul>
        </div>
      </div>
      <div class="contenedor pie-legal">
        <p>© ${anio} ${esc(T.nombre)}. Precios en pesos mexicanos (MXN), sujetos a cambio sin previo aviso.</p>
      </div>`;

    const flotante = document.getElementById('wa-flotante');
    flotante.href = waEnlace('¡Hola, Buen Detalle! Tengo una pregunta.');
    flotante.innerHTML = `${I.whatsapp}<span class="oculto">Escríbenos por WhatsApp</span>`;
  }

  /* ---------- Marcas con carta de colores (Sempertex): logo, sección y portada ---------- */
  const MARCAS = Object.entries(window.CARTAS || {}).map(([id, c]) => ({ id, nombre: c.nombre, logo: c.logo, ancho: c.logoAncho, alto: c.logoAlto }));

  // Un producto es de la marca si usa su carta de colores o la nombra.
  function marcaDe(p) {
    return MARCAS.find((m) => (p.variantes || []).some((g) => g.opciones.some((o) => o.carta === m.nombre)) ||
      normalizar(p.nombre).split(' ').includes(normalizar(m.nombre))) || null;
  }
  const productosDeMarca = (m) => PRODS.filter((p) => marcaDe(p) === m);
  const marcasConProductos = () => MARCAS.filter((m) => productosDeMarca(m).length);

  function logoMarca(m, clase) {
    if (!m.logo) return esc(m.nombre);
    return `<img class="marca-logo ${clase}" src="${esc(m.logo)}" alt="${esc(m.nombre)}" width="${m.ancho}" height="${m.alto}">`;
  }

  function pintarNavegacion() {
    const fila = document.getElementById('navegacion-fila');
    if (!fila) return;
    fila.innerHTML = `
      ${CATS.map((c) => `<a href="#/categoria/${c.id}" data-nav="categoria/${c.id}">${esc(c.nombre)}</a>`).join('')}
      ${marcasConProductos().map((m) => `<a class="nav-marca" href="#/marca/${m.id}" data-nav="marca/${m.id}">Globos ${logoMarca(m, 'marca-logo-nav')}</a>`).join('')}
      <a href="#/tematicas" data-nav="tematicas">Temáticas</a>
      <a href="#/envios" data-nav="envios">Envíos y cómo comprar</a>`;
  }

  function activarBuscador() {
    const form = document.getElementById('buscador');
    const input = document.getElementById('buscar');
    const caja = document.getElementById('sugerencias');
    let activa = -1;

    const cerrar = () => {
      caja.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      activa = -1;
    };

    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (q.length < 2) return cerrar();
      const prods = buscar(q).slice(0, 6);
      const grupos = gruposCoincidentes(q);
      if (!prods.length && !grupos.length) {
        caja.innerHTML = `<p class="sugerencia-vacia">Sin coincidencias para “${esc(q)}”</p>`;
      } else {
        caja.innerHTML = grupos.map((g) => `<a role="option" class="sugerencia sugerencia-grupo" href="${g.href}"><span class="sugerencia-tipo">${g.tipo}</span>${esc(g.nombre)}</a>`).join('') +
          prods.map((p) => `<a role="option" class="sugerencia" href="#/producto/${p.id}"><span class="sugerencia-img">${imagenDe(p)}</span><span class="sugerencia-nombre">${esc(p.nombre)}</span><span class="sugerencia-precio">${precio(p.precio)}</span></a>`).join('');
      }
      caja.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      activa = -1;
    });

    input.addEventListener('keydown', (ev) => {
      const opciones = [...caja.querySelectorAll('.sugerencia')];
      if (ev.key === 'Escape') return cerrar();
      if (!opciones.length || caja.hidden) return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        activa = (activa + (ev.key === 'ArrowDown' ? 1 : -1) + opciones.length) % opciones.length;
        opciones.forEach((o, i) => o.classList.toggle('activa', i === activa));
      } else if (ev.key === 'Enter' && activa >= 0) {
        ev.preventDefault();
        location.hash = opciones[activa].getAttribute('href');
        cerrar();
        input.blur();
      }
    });

    caja.addEventListener('click', () => { cerrar(); input.blur(); });
    document.addEventListener('click', (ev) => { if (!form.contains(ev.target)) cerrar(); });

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const q = input.value.trim();
      cerrar();
      input.blur();
      if (q) location.hash = `#/buscar/${encodeURIComponent(q)}`;
    });
  }

  /* ------------------------------------------------------------------
     Vistas
     ------------------------------------------------------------------ */
  const disponibles = (lista) => lista.filter((p) => p.estado !== 'agotado');

  function productosDeTema(id) {
    return PRODS.filter((p) => p.tematicas.includes(id));
  }

  function temasConProductos() {
    return TEMAS.filter((t) => productosDeTema(t.id).length);
  }

  // Temática del mes; si no tiene productos disponibles, cumpleaños o la que tenga más.
  function temporadaActual() {
    const mes = new Date().getMonth() + 1;
    const conProductos = TEMAS.filter((t) => disponibles(productosDeTema(t.id)).length);
    return conProductos.find((t) => t.temporada && t.temporada.includes(mes)) ||
      conProductos.find((t) => t.id === 'cumpleanos') ||
      conProductos.sort((a, b) => productosDeTema(b.id).length - productosDeTema(a.id).length)[0] || null;
  }

  function vistaInicio() {
    const temp = temporadaActual();
    const deTemporada = temp ? disponibles(productosDeTema(temp.id)).slice(0, 8) : [];
    const destacados = disponibles(PRODS.filter((p) => p.destacado)).slice(0, 12);
    const nuevos = disponibles(PRODS.filter((p) => p.nuevo && !p.destacado)).slice(0, 8);

    vista.innerHTML = `
      <section class="portada">
        <div class="contenedor portada-fila">
          <div class="portada-texto">
            <p class="sobretitulo">Distribuidora en Tijuana · Mayoreo y menudeo</p>
            <h1>Todo para decorar tu fiesta, en un solo pedido</h1>
            <p class="portada-lead">Globos de foil y de látex, papelería y envolturas. Arma tu carrito, calcula el envío y mándanos tu pedido por WhatsApp.</p>
            <div class="portada-acciones">
              <a class="boton boton-primario" href="#categorias">Ver catálogo</a>
              ${temp ? `<a class="boton boton-secundario" href="#/tematica/${temp.id}">Temporada: ${esc(temp.nombre)}</a>` : ''}
            </div>
          </div>
          <div class="portada-arte">${window.Dibujos.portada()}</div>
        </div>
      </section>

      <section class="ventajas" aria-label="Cómo funciona la tienda">
        <div class="contenedor ventajas-fila">
          <div class="ventaja">${I.etiqueta}<div><strong>Precio de mayoreo automático</strong><span>Al llegar a la cantidad mínima, el carrito cambia al precio de mayoreo.</span></div></div>
          <div class="ventaja">${I.camion}<div><strong>Envío por peso y distancia</strong><span>Se calcula al momento para Tijuana, todo Baja California y el resto de México.</span></div></div>
          <div class="ventaja">${I.whatsapp}<div><strong>Pedido por WhatsApp</strong><span>Te confirmamos existencias y forma de pago por chat.</span></div></div>
        </div>
      </section>

      <section class="seccion contenedor" id="categorias">
        <div class="seccion-cabeza"><h2>Categorías</h2></div>
        <div class="categorias">
          ${CATS.map((c) => `<a class="categoria" href="#/categoria/${c.id}">
              <span class="categoria-img">${window.Dibujos.svg(Object.assign({ color: '#e5177e' }, c.dibujo), c.nombre)}</span>
              <span class="categoria-txt"><strong>${esc(c.nombre)}</strong><span>${esc(c.descripcion)}</span>
              <span class="categoria-cuenta">${PRODS.filter((p) => p.categoria === c.id).length} productos ${I.flecha}</span></span>
            </a>`).join('')}
        </div>
      </section>

      ${marcasConProductos().map(bandaMarca).join('')}

      <section class="seccion contenedor">
        <div class="seccion-cabeza"><h2>Compra por temática</h2><a class="ver-todo" href="#/tematicas">Ver todas</a></div>
        <div class="chips">${temasConProductos().map(chipTema).join('')}</div>
      </section>

      ${deTemporada.length ? `<section class="seccion contenedor">
        <div class="seccion-cabeza"><h2>De temporada: ${esc(temp.nombre)}</h2><a class="ver-todo" href="#/tematica/${temp.id}">Ver todo</a></div>
        ${rejilla(deTemporada)}
      </section>` : ''}

      ${destacados.length ? `<section class="seccion contenedor">
        <div class="seccion-cabeza"><h2>Lo más pedido</h2></div>
        ${rejilla(destacados)}
      </section>` : ''}

      ${nuevos.length ? `<section class="seccion contenedor">
        <div class="seccion-cabeza"><h2>Novedades</h2></div>
        ${rejilla(nuevos)}
      </section>` : ''}

      <section class="seccion contenedor">
        <div class="aviso-redes">
          <div>
            <h2>Síguenos para ver decoraciones e ideas</h2>
            <p>Publicamos novedades, montajes de arcos y promociones en nuestras redes.</p>
          </div>
          <div class="aviso-redes-botones">
            <a class="boton boton-red" href="${T.instagram.url}" target="_blank" rel="noopener">${I.instagram}@${esc(T.instagram.usuario)}</a>
            <a class="boton boton-red" href="${T.tiktok.url}" target="_blank" rel="noopener">${I.tiktok}@${esc(T.tiktok.usuario)}</a>
          </div>
        </div>
      </section>`;
    return T.nombre;
  }

  // Tonos (sin repetir) y medidas de todos los productos de una marca.
  function cartaDeMarca(m) {
    const tonos = [], vistos = new Set(), medidas = new Set();
    disponibles(productosDeMarca(m)).forEach((p) => (p.variantes || []).forEach((g) => {
      if (g.tipo === 'tamano') g.opciones.forEach((o) => { if (o.dibujo && o.dibujo.tamano) medidas.add(o.dibujo.tamano); });
      if (esCarta(g)) g.opciones.forEach((o) => { if (!vistos.has(o.nombre)) { vistos.add(o.nombre); tonos.push(o); } });
    }));
    return { tonos, medidas: [...medidas].sort((a, b) => a - b).map((n) => `${n}"`), familias: [...new Set(tonos.map((o) => o.familia).filter(Boolean))] };
  }

  const enLista = (lista) => lista.join(', ').replace(/, ([^,]*)$/, ' y $1');

  // Banda de portada de una marca con carta de colores.
  function bandaMarca(m) {
    const { tonos, medidas, familias } = cartaDeMarca(m);
    if (!tonos.length) return '';
    const paso = Math.max(1, tonos.length / 28);
    const muestra = Array.from({ length: Math.min(28, tonos.length) }, (_, i) => tonos[Math.floor(i * paso)]);
    return `<section class="seccion contenedor">
      <a class="banda-carta" href="#/marca/${m.id}">
        <div class="banda-carta-texto">
          ${logoMarca(m, 'marca-logo-banda')}
          <h2><span class="oculto">Globos ${esc(m.nombre)}: </span>${tonos.length} tonos${medidas.length ? ` en ${esc(enLista(medidas))}` : ''}</h2>
          <p>Elige el tono exacto y el tamaño.${familias.length ? ` Familias ${esc(enLista(familias))}.` : ''}</p>
          <span class="boton boton-primario">Ver la carta de colores</span>
        </div>
        <div class="banda-carta-tonos" aria-hidden="true">${muestra.map((o) => `<span class="tono-globo acabado-${esc(o.acabado || 'mate')}" style="--c:${o.color}"></span>`).join('')}</div>
      </a>
    </section>`;
  }

  function vistaMarca(id) {
    const m = MARCAS.find((x) => x.id === id);
    if (!m || !productosDeMarca(m).length) return vistaNoEncontrada();
    const { tonos, medidas } = cartaDeMarca(m);
    return vistaListado({
      titulo: `Globos ${m.nombre}`, logo: m,
      sub: `Carta de ${tonos.length} tonos${medidas.length ? ` en ${enLista(medidas)}` : ''}. Entra a un producto para elegir el tono y el tamaño.`,
      fijo: { categoria: 'marca', tematica: 'marca' },
      base: productosDeMarca(m),
      migas: [['Inicio', '#/'], [`Globos ${m.nombre}`]]
    });
  }

  function chipTema(t) {
    const n = productosDeTema(t.id).length;
    return `<a class="chip" href="#/tematica/${t.id}" style="--chip:${t.color}"><span class="chip-punto"></span>${esc(t.nombre)}<span class="chip-cuenta">${n}</span></a>`;
  }

  function vistaTematicas() {
    vista.innerHTML = `
      <div class="contenedor pagina">
        ${migas([['Inicio', '#/'], ['Temáticas']])}
        <h1 class="pagina-titulo">Compra por temática</h1>
        <p class="pagina-sub">Encuentra todo lo que necesitas para cada tipo de celebración.</p>
        <div class="tematicas">
          ${temasConProductos().map((t) => {
            const lista = productosDeTema(t.id);
            const muestra = lista.slice(0, 3);
            return `<a class="tematica" href="#/tematica/${t.id}" style="--chip:${t.color}">
              <span class="tematica-muestras">${muestra.map((p) => `<span>${imagenDe(p)}</span>`).join('')}</span>
              <span class="tematica-nombre">${esc(t.nombre)}</span>
              <span class="tematica-cuenta">${lista.length} productos</span>
            </a>`;
          }).join('')}
        </div>
      </div>`;
    return 'Temáticas';
  }

  function migas(items) {
    return `<nav class="migas" aria-label="Ruta"><ol>${items.map(([txt, href], i) =>
      `<li>${href && i < items.length - 1 ? `<a href="${href}">${esc(txt)}</a>` : `<span aria-current="page">${esc(txt)}</span>`}</li>`).join('')}</ol></nav>`;
  }

  /* ---------------- Listados con filtros ---------------- */
  const RANGOS = [
    { id: 'hasta30', nombre: 'Hasta $30', ok: (p) => p.precio <= 30 },
    { id: '30a100', nombre: '$30 a $100', ok: (p) => p.precio > 30 && p.precio <= 100 },
    { id: 'mas100', nombre: 'Más de $100', ok: (p) => p.precio > 100 }
  ];

  let filtros = {};
  let filtrosAbiertos = false;

  function vistaListado(ctx) {
    const aplicados = (lista, excepto) => lista.filter((p) =>
      (excepto === 'categoria' || !filtros.categoria || p.categoria === filtros.categoria) &&
      (excepto === 'tematica' || !filtros.tematica || p.tematicas.includes(filtros.tematica)) &&
      (excepto === 'precio' || !filtros.precio || RANGOS.find((r) => r.id === filtros.precio).ok(p)) &&
      (excepto === 'mayoreo' || !filtros.mayoreo || !!p.mayoreo));

    let lista = aplicados(ctx.base);
    if (!ctx.busqueda && (!filtros.orden || filtros.orden === 'relevancia')) lista = [...lista].sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
    if (filtros.orden === 'precio-asc') lista = [...lista].sort((a, b) => a.precio - b.precio);
    else if (filtros.orden === 'precio-desc') lista = [...lista].sort((a, b) => b.precio - a.precio);
    else if (filtros.orden === 'nombre') lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    lista = [...disponibles(lista), ...lista.filter((p) => p.estado === 'agotado')];

    const opcionesFiltro = (titulo, clave, opciones) => {
      const filas = opciones.filter((o) => o.n > 0 || filtros[clave] === o.id);
      if (!filas.length) return '';
      return `<fieldset class="filtro-grupo"><legend>${titulo}</legend>
        <button type="button" class="filtro-op${!filtros[clave] ? ' activo' : ''}" data-filtro="${clave}" data-valor="">Todas</button>
        ${filas.map((o) => `<button type="button" class="filtro-op${filtros[clave] === o.id ? ' activo' : ''}" data-filtro="${clave}" data-valor="${o.id}" aria-pressed="${filtros[clave] === o.id}">${esc(o.nombre)}<span>${o.n}</span></button>`).join('')}
      </fieldset>`;
    };

    const baseCat = aplicados(ctx.base, 'categoria');
    const baseTema = aplicados(ctx.base, 'tematica');
    const basePrecio = aplicados(ctx.base, 'precio');
    const activos = ['categoria', 'tematica', 'precio', 'mayoreo'].filter((k) => !ctx.fijo[k] && filtros[k]).length;

    vista.innerHTML = `
      <div class="contenedor pagina">
        ${migas(ctx.migas)}
        <div class="listado-cabeza">
          <div>
            ${ctx.logo ? logoMarca(ctx.logo, 'marca-logo-titulo') : ''}
            <h1 class="pagina-titulo">${esc(ctx.titulo)}</h1>
            ${ctx.sub ? `<p class="pagina-sub">${esc(ctx.sub)}</p>` : ''}
          </div>
        </div>
        <div class="listado">
          <aside class="filtros${filtrosAbiertos ? ' abierto' : ''}" id="filtros" aria-label="Filtros">
            ${ctx.fijo.categoria ? '' : opcionesFiltro('Categoría', 'categoria', CATS.map((c) => ({ id: c.id, nombre: c.nombre, n: baseCat.filter((p) => p.categoria === c.id).length })))}
            ${ctx.fijo.tematica ? '' : opcionesFiltro('Temática', 'tematica', TEMAS.map((t) => ({ id: t.id, nombre: t.nombre, n: baseTema.filter((p) => p.tematicas.includes(t.id)).length })))}
            ${opcionesFiltro('Precio', 'precio', RANGOS.map((r) => ({ id: r.id, nombre: r.nombre, n: basePrecio.filter(r.ok).length })))}
            <fieldset class="filtro-grupo"><legend>Mayoreo</legend>
              <label class="filtro-check"><input type="checkbox" id="filtro-mayoreo" ${filtros.mayoreo ? 'checked' : ''}> Con precio de mayoreo</label>
            </fieldset>
          </aside>
          <section class="listado-resultados">
            <div class="barra-resultados">
              <p class="cuenta-resultados" aria-live="polite">${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}</p>
              <div class="barra-controles">
                <button type="button" class="boton-filtros" id="boton-filtros" aria-expanded="${filtrosAbiertos}" aria-controls="filtros">${I.filtro}Filtrar${activos ? ` (${activos})` : ''}</button>
                <label class="ordenar"><span class="oculto">Ordenar por</span>
                  <select id="ordenar">
                    <option value="relevancia"${!filtros.orden || filtros.orden === 'relevancia' ? ' selected' : ''}>${ctx.busqueda ? 'Más relevantes' : 'Recomendados'}</option>
                    <option value="precio-asc"${filtros.orden === 'precio-asc' ? ' selected' : ''}>Menor precio</option>
                    <option value="precio-desc"${filtros.orden === 'precio-desc' ? ' selected' : ''}>Mayor precio</option>
                    <option value="nombre"${filtros.orden === 'nombre' ? ' selected' : ''}>Nombre (A-Z)</option>
                  </select>
                </label>
              </div>
            </div>
            ${lista.length ? rejilla(lista) : vacioListado(ctx)}
          </section>
        </div>
      </div>`;

    vista.querySelectorAll('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
      filtros[b.dataset.filtro] = b.dataset.valor || null;
      vistaListado(ctx);
      const mismo = vista.querySelector(`[data-filtro="${b.dataset.filtro}"][data-valor="${b.dataset.valor}"]`);
      if (mismo) mismo.focus();
    }));
    const may = document.getElementById('filtro-mayoreo');
    may.addEventListener('change', () => { filtros.mayoreo = may.checked; vistaListado(ctx); document.getElementById('filtro-mayoreo').focus(); });
    document.getElementById('ordenar').addEventListener('change', (ev) => { filtros.orden = ev.target.value; vistaListado(ctx); document.getElementById('ordenar').focus(); });
    document.getElementById('boton-filtros').addEventListener('click', () => {
      filtrosAbiertos = !filtrosAbiertos;
      vistaListado(ctx);
      document.getElementById('boton-filtros').focus();
    });
    return ctx.titulo;
  }

  function vacioListado(ctx) {
    const sugeridos = disponibles(PRODS.filter((p) => p.destacado)).slice(0, 4);
    return `<div class="vacio">
      <h2>${ctx.busqueda ? `No encontramos “${esc(ctx.busqueda)}”` : 'No hay productos con estos filtros'}</h2>
      <p>${ctx.busqueda ? 'Revisa la ortografía o prueba con una palabra más general, como “globo”, “papel” o “moño”. Si no lo ves, pregúntanos por WhatsApp: tenemos más productos en tienda.' : 'Quita algún filtro para ver más resultados.'}</p>
      <div class="vacio-acciones">
        <a class="boton boton-whatsapp" href="${waEnlace(`¡Hola! ¿Tienen ${ctx.busqueda || 'este producto'}?`)}" target="_blank" rel="noopener">${I.whatsapp}Preguntar por WhatsApp</a>
      </div>
      <h3 class="vacio-sub">Lo más pedido</h3>
      ${rejilla(sugeridos)}
    </div>`;
  }

  function vistaCategoria(id) {
    const c = catPorId[id];
    if (!c) return vistaNoEncontrada();
    return vistaListado({
      titulo: c.nombre, sub: c.descripcion, fijo: { categoria: id },
      base: PRODS.filter((p) => p.categoria === id),
      migas: [['Inicio', '#/'], [c.nombre]]
    });
  }

  function vistaTematica(id) {
    const t = temaPorId[id];
    if (!t) return vistaNoEncontrada();
    return vistaListado({
      titulo: t.nombre, sub: `Globos, papelería y envolturas para ${t.nombre.toLowerCase()}.`, fijo: { tematica: id },
      base: productosDeTema(id),
      migas: [['Inicio', '#/'], ['Temáticas', '#/tematicas'], [t.nombre]]
    });
  }

  function vistaBusqueda(q) {
    const input = document.getElementById('buscar');
    if (input) input.value = q;
    return vistaListado({
      titulo: `Resultados para “${q}”`, fijo: {}, busqueda: q,
      base: buscar(q),
      migas: [['Inicio', '#/'], ['Búsqueda']]
    });
  }

  /* ---------------- Producto ---------------- */
  function vistaProducto(id) {
    const p = porId[id];
    if (!p) return vistaNoEncontrada();
    const c = catPorId[p.categoria];
    const sel = seleccionInicial(p);
    let cantidad = 1;

    const agotado = p.estado === 'agotado';
    const tam = grupoTamano(p);
    const conTonos = (p.variantes || []).some(requiereEleccion);
    const relacionados = disponibles(PRODS)
      .filter((x) => x.id !== p.id && (x.categoria === p.categoria || x.tematicas.some((t) => p.tematicas.includes(t))))
      .map((x) => ({ x, n: x.tematicas.filter((t) => p.tematicas.includes(t)).length + (x.categoria === p.categoria ? 1 : 0) }))
      .sort((a, b) => b.n - a.n).slice(0, 6).map((r) => r.x);
    const efectivo = () => productoEfectivo(p, sel);
    const marca = marcaDe(p);
    const cm = (o) => (o.dibujo && o.dibujo.tamano ? `${Math.round(o.dibujo.tamano * 2.54)} cm` : '');
    // '18" (15 pz)' -> medida grande 18" y "15 pz" junto a los centímetros.
    const medidaDe = (o) => {
      const n = o.dibujo && o.dibujo.tamano;
      if (!n) return { medida: o.nombre, extra: '' };
      const extra = o.nombre.replace(/^\s*[\d.]+\s*("|”|''|in\b|pulgadas?)?\s*/i, '').replace(/^\((.*)\)$/, '$1').trim();
      return { medida: `${n}"`, extra };
    };

    const tamanosHtml = (g, gi) => `<div class="var-grupo">
      <p class="var-titulo" id="var-t-${gi}">${esc(g.nombre)}: <strong data-actual="${gi}">${esc(sel[g.nombre] || '')}</strong></p>
      <div class="tamanos" role="group" aria-labelledby="var-t-${gi}">${g.opciones.map((o) => `
        <button type="button" class="tamano" data-grupo="${gi}" data-op="${esc(o.nombre)}" aria-pressed="false"${o.agotado ? ' disabled' : ''}>
          <span class="tamano-medida">${esc(medidaDe(o).medida)}</span>
          ${cm(o) || medidaDe(o).extra ? `<span class="tamano-cm">${esc([cm(o), medidaDe(o).extra].filter(Boolean).join(' · '))}</span>` : ''}
          <span class="tamano-precio">${o.agotado ? 'Agotado' : precio(o.precio ?? p.precio)}</span>
          <span class="tamano-unidad">${esc(o.unidad || p.unidad)}</span>
        </button>`).join('')}
      </div>
    </div>`;

    const tonoBoton = (o, gi) => {
      const nombre = o.codigo ? o.nombre.slice(o.codigo.length).trim() : o.nombre;
      return `<button type="button" class="tono" data-grupo="${gi}" data-op="${esc(o.nombre)}" aria-pressed="false" title="${esc(o.nombre)}${o.ingles ? ` (${esc(o.ingles)})` : ''}" style="--c:${o.color}">
        <span class="tono-globo acabado-${esc(o.acabado || 'mate')}" aria-hidden="true"></span>
        ${o.codigo ? `<span class="tono-cod">${esc(o.codigo)}</span>` : ''}
        <span class="tono-nom">${esc(nombre)}</span>
      </button>`;
    };

    const tonosHtml = (g, gi) => {
      const familias = [];
      g.opciones.forEach((o) => {
        const nombre = o.familia || 'Colores';
        let f = familias.find((x) => x.nombre === nombre);
        if (!f) familias.push(f = { nombre, opciones: [] });
        f.opciones.push(o);
      });
      const varias = familias.length > 1;
      return `<div class="var-grupo tonos" id="pp-tonos" data-tonos="${gi}">
        <p class="var-titulo" id="var-t-${gi}">Tono: <strong data-actual="${gi}">elige uno de la carta</strong></p>
        <p class="tonos-aviso" id="pp-tonos-aviso" role="alert" hidden></p>
        ${varias ? `<div class="tonos-filtro" role="group" aria-label="Familias de color">
          <button type="button" class="filtro-op activo" data-familia="" aria-pressed="true">Todos <span>${g.opciones.length}</span></button>
          ${familias.map((f) => `<button type="button" class="filtro-op" data-familia="${esc(f.nombre)}" aria-pressed="false">${esc(f.nombre)} <span>${f.opciones.length}</span></button>`).join('')}
        </div>` : ''}
        ${familias.map((f) => `<section class="tonos-familia" data-familia="${esc(f.nombre)}">
          ${varias ? `<h3>${esc(f.nombre)}${descripcionFamilia(f.nombre) ? ` <small>${esc(descripcionFamilia(f.nombre))}</small>` : ''}</h3>` : ''}
          <div class="tonos-rejilla" role="group" aria-label="${esc(f.nombre)}">${f.opciones.map((o) => tonoBoton(o, gi)).join('')}</div>
        </section>`).join('')}
        <p class="tonos-nota">Los tonos en pantalla son aproximados. Si necesitas el tono exacto, pídenos una foto por WhatsApp.</p>
      </div>`;
    };

    const grupoHtml = (g, gi) => {
      if (g.tipo === 'tamano') return tamanosHtml(g, gi);
      if (requiereEleccion(g)) return tonosHtml(g, gi);
      const actual = sel[g.nombre];
      let controles;
      if (g.opciones.length > 14) {
        controles = `<select id="var-${gi}" data-grupo="${gi}" class="var-select">${g.opciones.map((o) => `<option${o.nombre === actual ? ' selected' : ''}${o.agotado ? ' disabled' : ''}>${esc(o.nombre)}</option>`).join('')}</select>`;
      } else {
        controles = `<div class="var-opciones${g.tipo === 'color' ? ' var-colores' : ''}" role="group" aria-labelledby="var-t-${gi}">${g.opciones.map((o) => {
          if (g.tipo === 'color') {
            return `<button type="button" class="var-color" data-grupo="${gi}" data-op="${esc(o.nombre)}" aria-pressed="false" title="${esc(o.nombre)}" style="--muestra:${o.color}"><span class="oculto">${esc(o.nombre)}</span></button>`;
          }
          return `<button type="button" class="var-chip" data-grupo="${gi}" data-op="${esc(o.nombre)}" aria-pressed="false"${o.agotado ? ' disabled' : ''}>${esc(o.nombre)}</button>`;
        }).join('')}</div>`;
      }
      return `<div class="var-grupo"><p class="var-titulo" id="var-t-${gi}">${esc(g.nombre)}: <strong data-actual="${gi}">${esc(actual || '')}</strong></p>${controles}</div>`;
    };

    const fichaVenta = tam
      ? `<div><dt>Presentaciones</dt><dd>${tam.opciones.map((o) => `${esc(o.nombre)}${cm(o) ? ` (${cm(o)})` : ''}: ${esc(o.unidad || p.unidad)}, ${pesoTexto(o.peso ?? p.peso)}`).join('<br>')}</dd></div>`
      : `<div><dt>Se vende por</dt><dd>${esc(p.unidad)}</dd></div><div><dt>Peso para envío</dt><dd>${pesoTexto(p.peso)}</dd></div>`;

    vista.innerHTML = `
      <div class="contenedor pagina${conTonos && !agotado ? ' pagina-con-barra' : ''}">
        ${migas([['Inicio', '#/'], marca ? [`Globos ${marca.nombre}`, `#/marca/${marca.id}`] : [c.nombre, `#/categoria/${c.id}`], [p.nombre]])}
        <article class="producto">
          <div class="producto-galeria">
            <div class="producto-img" id="pp-img">${imagenDe(p, sel)}</div>
            <p class="producto-nota-img" id="pp-nota-img">${p.imagen ? '' : 'Imagen ilustrativa'}</p>
          </div>
          <div class="producto-info">
            <p class="producto-cat"><a href="#/categoria/${c.id}">${esc(c.nombre)}</a>${agotado ? '<span class="insignia insignia-linea insignia-agotado">Agotado</span>' : p.nuevo ? '<span class="insignia insignia-linea">Nuevo</span>' : ''}</p>
            ${marca ? `<a class="producto-marca" href="#/marca/${marca.id}">${logoMarca(marca, 'marca-logo-producto')}</a>` : ''}
            <h1 class="producto-nombre">${esc(p.nombre)}</h1>
            <div id="pp-precio"></div>
            ${agotado ? `<p class="aviso-agotado"><strong>Agotado por ahora.</strong> Pregúntanos por WhatsApp cuándo vuelve a llegar o si tenemos algo parecido.</p>` : ''}
            ${(p.variantes || []).map(grupoHtml).join('')}
            ${agotado ? '' : `<div class="cantidad-fila">
              <span class="var-titulo" id="cant-t">Cantidad</span>
              <div class="cantidad" role="group" aria-labelledby="cant-t">
                <button type="button" data-paso="-1" aria-label="Quitar uno">${I.menos}</button>
                <input id="pp-cantidad" type="number" inputmode="numeric" min="1" max="999" value="1" aria-label="Cantidad">
                <button type="button" data-paso="1" aria-label="Agregar uno">${I.mas}</button>
              </div>
              <span class="cantidad-unidad" id="pp-unidad"></span>
            </div>
            <div class="producto-acciones">
              <button type="button" class="boton boton-primario boton-grande" id="pp-agregar">${I.carrito}Agregar al carrito</button>
              <button type="button" class="boton boton-secundario boton-grande" id="pp-comprar">Comprar ahora</button>
            </div>`}
            <a class="enlace-wa" id="pp-preguntar" target="_blank" rel="noopener" href="#">${I.whatsapp}${agotado ? 'Preguntar cuándo vuelve a llegar' : 'Preguntar por este producto'}</a>
            <div class="producto-envio">${I.camion}<p><strong>Envío calculado por peso y distancia.</strong> <span id="pp-peso"></span> El costo final lo ves en el carrito al elegir tu ciudad.</p></div>
          </div>
        </article>

        <section class="producto-detalle">
          <div class="producto-desc">
            ${p.descripcion ? `<h2>Descripción</h2>
            <p>${esc(p.descripcion)}</p>` : ''}
            ${p.tematicas.length ? `<h3>Ideal para</h3><div class="chips chips-chicos">${p.tematicas.map((t) => chipTema(temaPorId[t])).join('')}</div>` : ''}
          </div>
          <div class="producto-ficha">
            <h2>Características</h2>
            <dl class="ficha">
              ${(p.detalles || []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${k === 'Marca' && marca && normalizar(v) === normalizar(marca.nombre) ? logoMarca(marca, 'marca-logo-ficha') : esc(v)}</dd></div>`).join('')}
              ${fichaVenta}
            </dl>
          </div>
        </section>

        ${relacionados.length ? `<section class="seccion"><div class="seccion-cabeza"><h2>También te puede interesar</h2></div>${rejilla(relacionados)}</section>` : ''}
      </div>
      ${conTonos && !agotado ? `<div class="barra-compra" id="barra-compra">
        <span class="tono-globo" id="barra-globo" aria-hidden="true"></span>
        <span class="barra-compra-texto"><strong id="barra-tono">Elige un tono</strong><span id="barra-detalle"></span></span>
        <button type="button" class="boton boton-primario" id="barra-agregar">${I.carrito}Agregar</button>
      </div>` : ''}`;

    const pintarPrecio = () => {
      const e = efectivo();
      const enCarrito = piezasEnCarrito(p, sel);
      const total = cantidad + enCarrito;
      const aplica = e.mayoreo && total >= e.mayoreo.min;
      const unitario = aplica ? e.mayoreo.precio : e.precio;
      let mayoreo = '';
      if (e.mayoreo && !agotado) {
        const faltan = e.mayoreo.min - total;
        mayoreo = `<p class="mayoreo-linea${aplica ? ' activo' : ''}">${I.etiqueta}<span>${aplica
          ? `<strong>Precio de mayoreo aplicado:</strong> ${precio(e.mayoreo.precio)} c/u`
          : `<strong>Mayoreo:</strong> ${precio(e.mayoreo.precio)} c/u desde ${e.mayoreo.min} ${unidadesPlural(e.unidad)}. Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan}.`}
          <small>${tam ? `Cuentan todos los tonos de ${sel[tam.nombre]}` : 'Cuentan todas las variantes de este producto'}${enCarrito ? `, incluidas las ${enCarrito} que ya tienes en el carrito` : ''}.</small></span></p>`;
      }
      document.getElementById('pp-precio').innerHTML = `
        <p class="precio-grande">${precio(e.precio)} <span>por ${esc(e.unidad)}</span></p>
        ${mayoreo}
        ${agotado ? '' : `<p class="precio-subtotal">${cantidad} × ${dinero(unitario)} = <strong>${dinero(unitario * cantidad)}</strong></p>`}`;
      const unidad = document.getElementById('pp-unidad');
      if (unidad) unidad.textContent = e.unidad;
      document.getElementById('pp-peso').textContent = `Pesa ${pesoTexto(e.peso)} por ${e.unidad}.`;
      const detalle = document.getElementById('barra-detalle');
      if (detalle) detalle.textContent = `${tam ? `${sel[tam.nombre]} · ` : ''}${cantidad} × ${dinero(unitario)}`;
    };

    const avisoTonos = (texto) => {
      const el = document.getElementById('pp-tonos-aviso');
      if (!el) return;
      el.textContent = texto || '';
      el.hidden = !texto;
      document.getElementById('pp-tonos').classList.toggle('tonos-falta', !!texto);
    };

    const actualizar = () => {
      // Un tono que no hay en el tamaño elegido deja de estar seleccionado.
      (p.variantes || []).forEach((g) => {
        if (g.tipo !== 'color' || !sel[g.nombre]) return;
        const o = g.opciones.find((x) => x.nombre === sel[g.nombre]);
        if (o && !colorDisponible(p, o, sel)) {
          avisoTonos(`El tono ${o.nombre} no está disponible en ${tam ? sel[tam.nombre] : 'este momento'}. Elige otro.`);
          delete sel[g.nombre];
        }
      });

      document.getElementById('pp-img').innerHTML = imagenDe(p, sel);
      (p.variantes || []).forEach((g, gi) => {
        const et = vista.querySelector(`[data-actual="${gi}"]`);
        if (et) et.textContent = sel[g.nombre] || (requiereEleccion(g) ? 'elige uno de la carta' : '');
        vista.querySelectorAll(`button[data-grupo="${gi}"]`).forEach((b) => {
          const on = b.dataset.op === sel[g.nombre];
          b.classList.toggle('activo', on);
          b.setAttribute('aria-pressed', String(on));
          if (g.tipo === 'color') {
            const o = g.opciones.find((x) => x.nombre === b.dataset.op);
            const libre = colorDisponible(p, o, sel);
            b.disabled = !libre;
            b.title = `${o.nombre}${o.ingles ? ` (${o.ingles})` : ''}${libre ? '' : o.agotado ? ' · agotado' : ` · no disponible en ${sel[tam.nombre]}`}`;
          }
        });
      });

      const tono = (p.variantes || []).filter((g) => g.tipo === 'color').map((g) => opcionElegida(g, sel)).find(Boolean);
      const nota = document.getElementById('pp-nota-img');
      if (!p.imagen) {
        nota.textContent = tono
          ? `Vista aproximada: ${tono.nombre}${tono.familia ? ` · ${tono.familia}` : ''}${tam ? ` · ${sel[tam.nombre]}` : ''}`
          : 'Imagen ilustrativa';
      }
      const globo = document.getElementById('barra-globo');
      if (globo) {
        globo.style.setProperty('--c', tono ? tono.color : 'transparent');
        globo.className = `tono-globo acabado-${tono ? tono.acabado || 'mate' : 'vacio'}`;
        document.getElementById('barra-tono').textContent = tono ? tono.nombre : 'Elige un tono';
      }

      const opc = textoOpciones(sel);
      const detalle = (agotado ? `¡Hola! ¿Cuándo vuelve a llegar ${p.nombre}${opc ? ` (${opc})` : ''}?` : `¡Hola! Me interesa: ${p.nombre}${opc ? ` (${opc})` : ''}.`) + (!enIframe && /^https?:/.test(location.protocol) ? ` ${location.href}` : '');
      document.getElementById('pp-preguntar').href = waEnlace(detalle);
      pintarPrecio();
    };

    vista.querySelectorAll('button[data-grupo]').forEach((b) => b.addEventListener('click', () => {
      const g = p.variantes[+b.dataset.grupo];
      sel[g.nombre] = b.dataset.op;
      if (g.tipo === 'color') avisoTonos('');
      actualizar();
    }));
    vista.querySelectorAll('select[data-grupo]').forEach((s) => s.addEventListener('change', () => {
      sel[p.variantes[+s.dataset.grupo].nombre] = s.value;
      actualizar();
    }));

    // Filtro por familia de la carta de colores.
    vista.querySelectorAll('[data-familia]').forEach((b) => {
      if (b.tagName !== 'BUTTON') return;
      b.addEventListener('click', () => {
        const familia = b.dataset.familia;
        vista.querySelectorAll('.tonos-filtro button').forEach((x) => {
          const on = x === b;
          x.classList.toggle('activo', on);
          x.setAttribute('aria-pressed', String(on));
        });
        vista.querySelectorAll('.tonos-familia').forEach((sec) => { sec.hidden = !!familia && sec.dataset.familia !== familia; });
      });
    });

    const inputCant = document.getElementById('pp-cantidad');
    if (agotado) {
      actualizar();
      return p.nombre;
    }
    const fijarCantidad = (n) => {
      cantidad = Math.max(1, Math.min(999, Math.floor(n) || 1));
      inputCant.value = cantidad;
      pintarPrecio();
    };
    vista.querySelectorAll('[data-paso]').forEach((b) => b.addEventListener('click', () => fijarCantidad(cantidad + +b.dataset.paso)));
    inputCant.addEventListener('change', () => fijarCantidad(+inputCant.value));
    inputCant.addEventListener('input', () => {
      const n = Math.floor(+inputCant.value);
      if (n >= 1 && n <= 999) { cantidad = n; pintarPrecio(); }
    });

    // Antes de agregar, el cliente debe haber elegido el tono de la carta.
    const listoParaAgregar = () => {
      const falta = (p.variantes || []).find((g) => requiereEleccion(g) && !sel[g.nombre]);
      if (!falta) return true;
      avisoTonos('Elige un tono de la carta para agregarlo al carrito.');
      const bloque = document.getElementById('pp-tonos');
      bloque.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'start' });
      return false;
    };
    const agregar = () => {
      if (!listoParaAgregar()) return;
      agregarAlCarrito(p.id, sel, cantidad);
      const opc = textoOpciones(sel);
      aviso(`Agregaste ${cantidad} × ${p.nombre}${opc ? ` (${opc})` : ''}`);
      fijarCantidad(1);
    };
    document.getElementById('pp-agregar').addEventListener('click', agregar);
    const barra = document.getElementById('barra-agregar');
    if (barra) barra.addEventListener('click', agregar);
    document.getElementById('pp-comprar').addEventListener('click', () => {
      if (!listoParaAgregar()) return;
      agregarAlCarrito(p.id, sel, cantidad);
      location.hash = '#/carrito';
    });

    actualizar();
    return p.nombre;
  }

  /* ---------------- Carrito ---------------- */
  function vistaCarrito() {
    if (!carrito.some((l) => porId[l.id])) {
      vista.innerHTML = `
        <div class="contenedor pagina">
          ${migas([['Inicio', '#/'], ['Carrito']])}
          <div class="vacio vacio-carrito">
            <span class="vacio-icono">${I.carrito}</span>
            <h1>Tu carrito está vacío</h1>
            <p>Agrega productos desde el catálogo. Aquí verás el total con envío y podrás mandar tu pedido por WhatsApp.</p>
            <div class="vacio-acciones"><a class="boton boton-primario" href="#/">Ir al catálogo</a></div>
            <h2 class="vacio-sub">Lo más pedido</h2>
            ${rejilla(disponibles(PRODS.filter((p) => p.destacado)).slice(0, 4))}
          </div>
        </div>`;
      return 'Carrito';
    }

    const estados = [...new Set(E.destinos.map((d) => d[0]))];

    vista.innerHTML = `
      <div class="contenedor pagina">
        ${migas([['Inicio', '#/'], ['Carrito']])}
        <h1 class="pagina-titulo">Tu carrito</h1>
        <div class="carrito">
          <section class="carrito-col" aria-label="Productos">
            <div class="panel" id="carrito-lineas"></div>
            <div class="vaciar" id="vaciar">
              <button type="button" class="boton-texto" id="vaciar-btn">${I.basura}Vaciar carrito</button>
            </div>

            <form class="panel" id="datos" novalidate>
              <h2 class="panel-titulo">Tus datos</h2>
              <div class="campos">
                <div class="campo"><label for="c-nombre">Nombre completo *</label><input id="c-nombre" name="nombre" autocomplete="name" value="${esc(cliente.nombre)}" required><p class="error" id="e-nombre" hidden>Escribe tu nombre para saber a quién entregamos.</p></div>
                <div class="campo"><label for="c-telefono">Teléfono</label><input id="c-telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel" value="${esc(cliente.telefono)}" placeholder="Opcional, si es otro número"></div>
                <div class="campo campo-ancho" id="campo-direccion"><label for="c-direccion">Dirección de entrega *</label><textarea id="c-direccion" name="direccion" rows="2" autocomplete="street-address" placeholder="Calle, número, colonia y código postal">${esc(cliente.direccion)}</textarea><p class="error" id="e-direccion" hidden>Escribe la dirección completa para el envío.</p></div>
                <div class="campo"><label for="c-fecha">¿Para cuándo lo necesitas?</label><input id="c-fecha" name="fecha" type="date" value="${esc(cliente.fecha)}" min="${new Date().toISOString().slice(0, 10)}"></div>
                <div class="campo"><label for="c-pago">Forma de pago</label><select id="c-pago" name="pago">${T.formasPago.map((f) => `<option${f === cliente.pago ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select></div>
                <div class="campo campo-ancho"><label for="c-notas">Notas para tu pedido</label><textarea id="c-notas" name="notas" rows="2" placeholder="Por ejemplo: inflados con helio, horario de entrega, referencias del domicilio">${esc(cliente.notas)}</textarea></div>
              </div>
            </form>
          </section>

          <aside class="carrito-col carrito-lateral" aria-label="Resumen del pedido">
            <div class="panel panel-entrega">
              <h2 class="panel-titulo">Entrega</h2>
              <div class="metodos" role="radiogroup" aria-label="Forma de entrega">
                <label class="metodo"><input type="radio" name="metodo" value="domicilio" ${envio.metodo === 'domicilio' ? 'checked' : ''}><span>${I.camion}<span><strong>Envío a domicilio</strong><small>Costo según peso y distancia</small></span></span></label>
                <label class="metodo"><input type="radio" name="metodo" value="recoger" ${envio.metodo === 'recoger' ? 'checked' : ''}><span>${I.tienda}<span><strong>Recoger en tienda</strong><small>${esc(T.ciudad)} · sin costo</small></span></span></label>
              </div>
              <div class="destino" id="destino">
                <div class="campo"><label for="e-estado">Estado</label><select id="e-estado">${estados.map((s) => `<option${s === envio.estado ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
                <div class="campo"><label for="e-destino">Ciudad o zona</label><select id="e-destino"></select><p class="error" id="e-destino-error" hidden>Elige tu ciudad o zona para calcular el envío.</p></div>
              </div>
              <div id="envio-detalle"></div>
            </div>

            <div class="panel panel-total">
              <div id="totales"></div>
              <a class="boton boton-whatsapp boton-grande" id="enviar-wa" href="#" target="_blank" rel="noopener">${I.whatsapp}Enviar pedido por WhatsApp</a>
              <p class="nota-wa">Se abre WhatsApp con tu pedido listo para enviar al <span class="sel">${esc(T.whatsappVisible)}</span>. Ahí te confirmamos existencias, costo final y forma de pago.</p>
              <div id="confirmacion" hidden></div>
            </div>
          </aside>
        </div>
      </div>`;

    const selEstado = document.getElementById('e-estado');
    const selDestino = document.getElementById('e-destino');

    const llenarDestinos = () => {
      const opciones = E.destinos.filter((d) => d[0] === envio.estado);
      if (!opciones.some((d) => d[1] === envio.destino)) envio.destino = '';
      selDestino.innerHTML = `<option value="">Elige una opción</option>` +
        opciones.map((d) => `<option${d[1] === envio.destino ? ' selected' : ''}>${esc(d[1])}</option>`).join('');
    };

    const pintarMetodo = () => {
      const domicilio = envio.metodo === 'domicilio';
      document.getElementById('destino').hidden = !domicilio;
      document.getElementById('campo-direccion').hidden = !domicilio;
    };

    selEstado.addEventListener('change', () => {
      envio.estado = selEstado.value;
      envio.destino = '';
      llenarDestinos();
      almacen.guardar('bd-envio', envio);
      pintarResumen();
    });
    selDestino.addEventListener('change', () => {
      envio.destino = selDestino.value;
      document.getElementById('e-destino-error').hidden = true;
      almacen.guardar('bd-envio', envio);
      pintarResumen();
    });
    vista.querySelectorAll('input[name="metodo"]').forEach((r) => r.addEventListener('change', () => {
      envio.metodo = r.value;
      almacen.guardar('bd-envio', envio);
      pintarMetodo();
      pintarResumen();
    }));

    const form = document.getElementById('datos');
    form.addEventListener('input', (ev) => {
      if (!ev.target.name) return;
      cliente[ev.target.name] = ev.target.value;
      almacen.guardar('bd-cliente', cliente);
      const err = document.getElementById(`e-${ev.target.name}`);
      if (err && ev.target.value.trim()) err.hidden = true;
      actualizarEnlaceWa();
    });
    form.addEventListener('submit', (ev) => ev.preventDefault());

    // Vaciar con confirmación dentro de la página.
    const zonaVaciar = document.getElementById('vaciar');
    zonaVaciar.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.id === 'vaciar-btn') {
        zonaVaciar.innerHTML = `<span>¿Quitar todos los productos?</span><button type="button" class="boton-texto boton-peligro" id="vaciar-si">Sí, vaciar</button><button type="button" class="boton-texto" id="vaciar-no">Cancelar</button>`;
      } else if (b.id === 'vaciar-si') {
        carrito = [];
        guardarCarrito();
        vistaCarrito();
      } else if (b.id === 'vaciar-no') {
        zonaVaciar.innerHTML = `<button type="button" class="boton-texto" id="vaciar-btn">${I.basura}Vaciar carrito</button>`;
      }
    });

    document.getElementById('enviar-wa').addEventListener('click', (ev) => {
      if (!validarPedido()) {
        ev.preventDefault();
        return;
      }
      const folio = generarFolio();
      const texto = mensajePedido(folio);
      ev.currentTarget.href = waEnlace(texto);
      mostrarConfirmacion(folio, texto);
    });

    llenarDestinos();
    pintarMetodo();
    pintarLineas();
    pintarResumen();
    return 'Carrito';
  }

  function pintarLineas() {
    const cont = document.getElementById('carrito-lineas');
    if (!cont) return;
    const r = resumenActual();
    cont.innerHTML = `<h2 class="panel-titulo">Productos <span class="panel-cuenta">${r.piezas} ${r.piezas === 1 ? 'artículo' : 'artículos'}</span></h2>
      <ul class="lineas">${r.lineas.map((l, i) => {
        const p = l.producto;
        const opc = textoOpciones(l.opciones);
        const idProducto = p.idBase || p.id;
        return `<li class="linea">
          <a class="linea-img" href="#/producto/${idProducto}" tabindex="-1" aria-hidden="true">${imagenDe(p, l.opciones)}</a>
          <div class="linea-info">
            <a class="linea-nombre" href="#/producto/${idProducto}">${esc(p.nombre)}</a>
            ${opc ? `<p class="linea-opc">${esc(opc)}</p>` : ''}
            <p class="linea-unit">${dinero(l.precioUnitario)} c/u${l.esMayoreo ? ' <span class="pastilla">Mayoreo</span>' : ''}</p>
            ${l.faltanParaMayoreo ? `<p class="linea-pista">Agrega ${l.faltanParaMayoreo} más para precio de mayoreo de ${precio(p.mayoreo.precio)} c/u</p>` : ''}
          </div>
          <div class="linea-controles">
            <div class="cantidad cantidad-chica" role="group" aria-label="Cantidad de ${esc(p.nombre)}">
              <button type="button" data-linea="${i}" data-paso="-1" aria-label="Quitar uno">${I.menos}</button>
              <input type="number" inputmode="numeric" min="1" max="999" value="${l.cantidad}" data-linea="${i}" aria-label="Cantidad">
              <button type="button" data-linea="${i}" data-paso="1" aria-label="Agregar uno">${I.mas}</button>
            </div>
            <p class="linea-total">${dinero(l.total)}</p>
            <button type="button" class="boton-texto linea-quitar" data-quitar="${i}">${I.basura}<span>Quitar</span></button>
          </div>
        </li>`;
      }).join('')}</ul>`;

    const cambiar = (i, n) => {
      if (n <= 0) carrito.splice(i, 1);
      else carrito[i].cantidad = Math.min(999, n);
      guardarCarrito();
      if (!carrito.length) return vistaCarrito();
      pintarLineas();
      pintarResumen();
    };
    cont.querySelectorAll('button[data-paso]').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.linea;
      cambiar(i, carrito[i].cantidad + +b.dataset.paso);
    }));
    cont.querySelectorAll('input[data-linea]').forEach((inp) => inp.addEventListener('change', () => {
      cambiar(+inp.dataset.linea, Math.floor(+inp.value) || 1);
    }));
    cont.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => cambiar(+b.dataset.quitar, 0)));
  }

  function pintarResumen() {
    const det = document.getElementById('envio-detalle');
    const tot = document.getElementById('totales');
    if (!det || !tot) return;
    const r = resumenActual();
    const env = envioActual(r);
    const pesoConEmpaque = r.pesoGramos + E.empaqueGramos;

    let detalle = '';
    if (env.metodo === 'recoger') {
      detalle = `<p class="envio-nota">Te avisamos por WhatsApp cuando tu pedido esté listo para recoger.</p>`;
    } else if (!env.km) {
      detalle = `<p class="envio-nota">Elige tu ciudad o zona para calcular el envío. Peso estimado del pedido: <strong>${pesoTexto(pesoConEmpaque)}</strong>.</p>`;
    } else {
      const d = destinoElegido();
      detalle = `<div class="envio-calculo">
        <p class="envio-destino"><strong>${esc(d.nombre)}</strong>, ${esc(d.estado)}</p>
        <dl class="envio-tabla">
          <div><dt>Distancia aprox.</dt><dd>${env.km.toLocaleString('es-MX')} km</dd></div>
          <div><dt>Zona</dt><dd>${esc(env.zona.nombre)}</dd></div>
          <div><dt>Peso con empaque</dt><dd>${pesoTexto(env.pesoTotalGramos)} → se cobra ${env.pesoKg} kg</dd></div>
          <div><dt>Tarifa base (1 kg)</dt><dd>${dinero(env.costoBase)}</dd></div>
          ${env.kgAdicionales ? `<div><dt>${env.kgAdicionales} kg adicional${env.kgAdicionales > 1 ? 'es' : ''} × ${dinero(env.zona.kgAdicional)}</dt><dd>${dinero(env.costoKg)}</dd></div>` : ''}
          <div><dt>Tiempo estimado</dt><dd>${esc(env.zona.tiempo)}</dd></div>
        </dl>
        ${env.cotizar ? `<p class="envio-alerta">Tu pedido pesa más de ${E.pesoMaximoKg} kg. El envío se cotiza por WhatsApp.</p>` : ''}
        ${env.gratis ? `<p class="envio-gratis">¡Tu envío es gratis! Aplica en ${esc(env.zona.nombre.toLowerCase())} con compras desde ${precio(E.envioGratis.desde)}.</p>` : ''}
        ${!env.gratis && E.envioGratis && E.envioGratis.zonas.includes(env.zona.id) ? `<p class="envio-pista">Te faltan ${dinero(E.envioGratis.desde - r.subtotal)} para envío gratis en tu zona.</p>` : ''}
      </div>`;
    }
    det.innerHTML = detalle;

    let filaEnvio;
    if (env.metodo === 'recoger') filaEnvio = `<dd>Gratis</dd>`;
    else if (!env.km) filaEnvio = `<dd class="atenuado">Elige destino</dd>`;
    else if (env.cotizar) filaEnvio = `<dd>Por cotizar</dd>`;
    else if (env.gratis) filaEnvio = `<dd><s>${dinero(env.costoCalculado)}</s> Gratis</dd>`;
    else filaEnvio = `<dd>${dinero(env.costo)}</dd>`;

    tot.innerHTML = `<dl class="totales">
        <div><dt>Productos (${r.piezas})</dt><dd>${dinero(r.subtotal)}</dd></div>
        ${r.ahorro > 0 ? `<div class="ahorro"><dt>Ahorro por mayoreo</dt><dd>−${dinero(r.ahorro)}</dd></div>` : ''}
        <div><dt>Envío</dt>${filaEnvio}</div>
        <div class="total"><dt>Total</dt><dd>${dinero(r.subtotal + env.costo)}</dd></div>
      </dl>
      ${env.cotizar ? '<p class="nota-total">El total no incluye el envío, que se cotiza aparte.</p>' : ''}`;
    actualizarEnlaceWa();
  }

  function validarPedido() {
    let ok = true;
    const mostrar = (id, falla) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !falla;
      if (falla) ok = false;
    };
    mostrar('e-nombre', cliente.nombre.trim().length < 2);
    const domicilio = envio.metodo === 'domicilio';
    mostrar('e-destino-error', domicilio && !destinoElegido());
    mostrar('e-direccion', domicilio && cliente.direccion.trim().length < 6);
    if (!ok) {
      const primero = vista.querySelector('.error:not([hidden])');
      const campo = primero && primero.parentElement.querySelector('input, select, textarea');
      if (campo) {
        campo.focus();
        campo.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
    return ok;
  }

  function generarFolio() {
    const d = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    return `BD-${String(d.getFullYear()).slice(2)}${dos(d.getMonth() + 1)}${dos(d.getDate())}-${dos(d.getHours())}${dos(d.getMinutes())}${Math.floor(Math.random() * 10)}`;
  }

  function fechaLegible(iso) {
    if (!iso) return '';
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function mensajePedido(folio) {
    const r = resumenActual();
    const env = envioActual(r);
    const lineas = r.lineas.map((l, i) => {
      const opc = textoOpciones(l.opciones);
      return `${i + 1}. ${l.producto.nombre}${opc ? ` (${opc})` : ''}\n   ${l.cantidad} × ${dinero(l.precioUnitario)} = ${dinero(l.total)}${l.esMayoreo ? ' (mayoreo)' : ''}`;
    });

    let envioTxt;
    if (env.metodo === 'recoger') envioTxt = 'Recoger en tienda (sin costo)';
    else if (!env.km) envioTxt = 'Falta elegir ciudad o zona';
    else {
      const d = destinoElegido();
      const donde = `${d.nombre}, ${d.estado} · aprox. ${env.km} km · zona ${env.zona.nombre} · ${env.pesoKg} kg`;
      if (env.cotizar) envioTxt = `Por cotizar (${donde})`;
      else if (env.gratis) envioTxt = `GRATIS (${donde})`;
      else envioTxt = `${dinero(env.costo)} (${donde})`;
    }

    const partes = [
      `¡Hola, ${T.nombreCorto}! Quiero hacer este pedido:`,
      '',
      `*Pedido ${folio}*`,
      '',
      ...lineas,
      '',
      `Productos: ${dinero(r.subtotal)}`,
      r.ahorro > 0 ? `Ahorro por mayoreo: ${dinero(r.ahorro)}` : null,
      `Envío: ${envioTxt}`,
      `*Total: ${dinero(r.subtotal + env.costo)}*${env.cotizar ? ' + envío por cotizar' : ''}`,
      '',
      `*Entrega:* ${env.metodo === 'recoger' ? 'Recoger en tienda' : 'Envío a domicilio'}`,
      `*Nombre:* ${cliente.nombre.trim()}`,
      cliente.telefono.trim() ? `*Teléfono:* ${cliente.telefono.trim()}` : null,
      env.metodo === 'domicilio' ? `*Dirección:* ${cliente.direccion.trim()}` : null,
      cliente.fecha ? `*Fecha deseada:* ${fechaLegible(cliente.fecha)}` : null,
      `*Forma de pago:* ${cliente.pago}`,
      cliente.notas.trim() ? `*Notas:* ${cliente.notas.trim()}` : null,
      '',
      `Peso estimado: ${pesoTexto(r.pesoGramos + E.empaqueGramos)}`
    ];
    return partes.filter((x) => x !== null).join('\n');
  }

  function actualizarEnlaceWa() {
    const a = document.getElementById('enviar-wa');
    if (a && carrito.length) a.href = waEnlace(mensajePedido('(folio al enviar)'));
  }

  function mostrarConfirmacion(folio, texto) {
    const caja = document.getElementById('confirmacion');
    caja.hidden = false;
    caja.innerHTML = `<div class="confirmacion">
      <p><strong>Pedido ${esc(folio)} preparado.</strong> Revisa que WhatsApp se haya abierto con el mensaje y presiona enviar. Si no se abrió, copia el pedido y mándalo al <span class="sel">${esc(T.whatsappVisible)}</span>.</p>
      <button type="button" class="boton boton-secundario" id="copiar-pedido">${I.copiar}Copiar pedido</button>
      <textarea class="pedido-texto" id="pedido-texto" rows="6" readonly aria-label="Texto del pedido">${esc(texto)}</textarea>
    </div>`;
    document.getElementById('copiar-pedido').addEventListener('click', (ev) => {
      const area = document.getElementById('pedido-texto');
      const boton = ev.currentTarget;
      const listo = () => { boton.innerHTML = `${I.copiar}Copiado`; };
      const respaldo = () => { area.focus(); area.select(); boton.innerHTML = `${I.copiar}Texto seleccionado: cópialo`; };
      try {
        navigator.clipboard.writeText(texto).then(listo, respaldo);
      } catch (e) {
        respaldo();
      }
    });
  }

  /* ---------------- Envíos y cómo comprar ---------------- */
  function vistaEnvios() {
    const ejemplo = calcularEnvio({ metodo: 'domicilio', destino: { lat: 31.867, lng: -116.596 }, pesoGramos: 2300, subtotal: 600 }, E);
    const rangoKm = (z, i) => {
      const desde = i === 0 ? 0 : E.zonas[i - 1].hastaKm;
      return z.hastaKm === Infinity ? `Más de ${desde.toLocaleString('es-MX')} km` : `${desde.toLocaleString('es-MX')} a ${z.hastaKm.toLocaleString('es-MX')} km`;
    };
    vista.innerHTML = `
      <div class="contenedor pagina pagina-texto">
        ${migas([['Inicio', '#/'], ['Envíos y cómo comprar']])}
        <h1 class="pagina-titulo">Envíos y cómo comprar</h1>

        <section class="bloque">
          <h2>Cómo hacer tu pedido</h2>
          <ol class="pasos">
            <li><strong>Elige tus productos.</strong> Selecciona color, número o diseño y la cantidad. El precio de mayoreo se aplica solo al llegar al mínimo.</li>
            <li><strong>Calcula el envío.</strong> En el carrito elige tu estado y ciudad o zona; el costo se calcula con el peso del pedido y la distancia desde nuestra tienda en Tijuana. También puedes recoger sin costo.</li>
            <li><strong>Envía tu pedido por WhatsApp.</strong> El botón abre un chat con el ${esc(T.whatsappVisible)} y tu pedido ya escrito.</li>
            <li><strong>Confirmamos y pagas.</strong> Te confirmamos existencias y el total, y acordamos la forma de pago y la entrega.</li>
          </ol>
        </section>

        <section class="bloque">
          <h2>Tarifas de envío</h2>
          <p>Costo de envío = tarifa base de la zona (incluye el primer kilo) + kilos adicionales × precio por kilo de la zona. Al peso de tus productos se suman ${E.empaqueGramos} g de empaque y se redondea al kilo completo.</p>
          <div class="tabla-desplazable">
            <table class="tabla">
              <thead><tr><th scope="col">Zona</th><th scope="col">Distancia por carretera</th><th scope="col">Base (1 kg)</th><th scope="col">Kg adicional</th><th scope="col">Tiempo estimado</th></tr></thead>
              <tbody>${E.zonas.map((z, i) => `<tr><th scope="row">${esc(z.nombre)}</th><td>${rangoKm(z, i)}</td><td>${dinero(z.base)}</td><td>${dinero(z.kgAdicional)}</td><td>${esc(z.tiempo)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p class="ejemplo"><strong>Ejemplo:</strong> un pedido de 2.3 kg a Ensenada (aprox. ${ejemplo.km} km, zona ${esc(ejemplo.zona.nombre)}) pesa ${pesoTexto(ejemplo.pesoTotalGramos)} con empaque y se cobra como ${ejemplo.pesoKg} kg: ${dinero(ejemplo.costoBase)} + ${ejemplo.kgAdicionales} × ${dinero(ejemplo.zona.kgAdicional)} = <strong>${dinero(ejemplo.costoCalculado)}</strong>.</p>
          ${E.envioGratis ? `<p><strong>Envío gratis</strong> en zonas ${E.envioGratis.zonas.map((id) => esc(E.zonas.find((z) => z.id === id).nombre.toLowerCase())).join(' y ')} con compras desde ${precio(E.envioGratis.desde)}.</p>` : ''}
          <p>Pedidos de más de ${E.pesoMaximoKg} kg se cotizan por WhatsApp. Los globos se envían desinflados; si los quieres inflados con helio, pídelo en las notas y lo cotizamos.</p>
        </section>

        <section class="bloque bloque-contacto">
          <h2>¿Dudas?</h2>
          <p>Escríbenos y te ayudamos a armar tu pedido.</p>
          <div class="aviso-redes-botones">
            <a class="boton boton-whatsapp" href="${waEnlace('¡Hola, Buen Detalle! Tengo una duda sobre un pedido.')}" target="_blank" rel="noopener">${I.whatsapp}WhatsApp ${esc(T.whatsappVisible)}</a>
            <a class="boton boton-red" href="${T.instagram.url}" target="_blank" rel="noopener">${I.instagram}Instagram</a>
            <a class="boton boton-red" href="${T.tiktok.url}" target="_blank" rel="noopener">${I.tiktok}TikTok</a>
          </div>
        </section>
      </div>`;
    return 'Envíos y cómo comprar';
  }

  function vistaNoEncontrada() {
    vista.innerHTML = `<div class="contenedor pagina"><div class="vacio">
      <h1>No encontramos esta página</h1>
      <p>Puede que el producto ya no esté disponible. Busca en el catálogo o escríbenos.</p>
      <div class="vacio-acciones"><a class="boton boton-primario" href="#/">Ir al inicio</a></div>
    </div></div>`;
    return 'Página no encontrada';
  }

  /* ------------------------------------------------------------------
     Aviso (toast)
     ------------------------------------------------------------------ */
  let temporizadorAviso;
  function aviso(texto) {
    const el = document.getElementById('aviso');
    el.innerHTML = `<span>${esc(texto)}</span><a href="#/carrito">Ver carrito</a>`;
    el.hidden = false;
    el.classList.remove('saliendo');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => {
      el.classList.add('saliendo');
      setTimeout(() => { el.hidden = true; }, 250);
    }, 3200);
  }

  /* ------------------------------------------------------------------
     Catálogo: hoja de Google o productos de ejemplo
     ------------------------------------------------------------------ */
  const URL_HOJA = window.Hoja.enlaceCSV(T.hojaProductos || '');
  const HOJA_PUBLICADA = /\/spreadsheets\/d\/e\//.test(T.hojaProductos || '');
  const URL_EDITAR = T.hojaEditar || (/docs\.google\.com\/spreadsheets\/d\//.test(T.hojaProductos || '') && !HOJA_PUBLICADA ? T.hojaProductos : '');
  const ctxHoja = {
    categorias: CATS,
    tematicas: window.TEMATICAS,
    colores: window.COLORES,
    cartas: window.CARTAS,
    ejemplos: Object.fromEntries(window.PRODUCTOS.map((p) => [p.id, p]))
  };
  let arrancado = false;

  function usarCatalogo(productos, tematicas) {
    TODOS = productos;
    PRODS = productos.filter((p) => p.estado !== 'oculto');
    TEMAS = tematicas;
    porId = Object.fromEntries(PRODS.map((p) => [p.id, p]));
    temaPorId = Object.fromEntries(TEMAS.map((t) => [t.id, t]));
    construirIndice();
    pintarNavegacion();
  }

  const leerHoja = (csv) => window.Hoja.productosDesdeFilas(window.Hoja.leerCSV(csv), ctxHoja);

  function aplicarHoja(csv, tipo, fecha) {
    const r = leerHoja(csv);
    usarCatalogo(r.productos, r.tematicas);
    fuente = {
      tipo: r.productos.length ? tipo : 'error',
      fecha,
      problemas: r.problemas,
      tematicasNuevas: r.tematicasNuevas,
      error: r.productos.length ? null : 'La hoja no tiene ningún producto válido. Revisa la lista de problemas.'
    };
  }

  async function descargarHoja() {
    const control = new AbortController();
    const espera = setTimeout(() => control.abort(), 12000);
    try {
      const r = await fetch(URL_HOJA, { cache: 'no-store', signal: control.signal });
      if (!r.ok) throw new Error(`La hoja respondió con el error ${r.status}. Revisa que siga publicada en la web.`);
      const texto = await r.text();
      if (/^\s*</.test(texto)) {
        throw new Error('El enlace no regresa la hoja en formato CSV. En Google Sheets usa Archivo → Compartir → Publicar en la Web y elige "Valores separados por comas (.csv)".');
      }
      return texto;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('La hoja tardó demasiado en responder.');
      if (e instanceof TypeError) throw new Error('No se pudo conectar con la hoja. Revisa la conexión a internet y que la hoja esté publicada en la web.');
      throw e;
    } finally {
      clearTimeout(espera);
    }
  }

  // Lee la hoja. Si cambió respecto a la copia guardada, vuelve a pintar la vista actual.
  async function actualizarHoja() {
    const copia = almacen.leer('bd-catalogo', null);
    const anterior = copia && copia.url === URL_HOJA ? copia.csv : null;
    let cambio = false;
    try {
      const csv = await descargarHoja();
      almacen.guardar('bd-catalogo', { url: URL_HOJA, csv, fecha: Date.now() });
      if (csv !== anterior || fuente.tipo === 'cargando') {
        aplicarHoja(csv, 'hoja', Date.now());
        cambio = true;
      } else if (fuente.tipo === 'copia') {
        fuente = Object.assign({}, fuente, { tipo: 'hoja', fecha: Date.now(), error: null });
      }
    } catch (e) {
      if (anterior && PRODS.length) {
        fuente = Object.assign({}, fuente, { tipo: 'copia', error: e.message });
      } else {
        usarCatalogo([], window.TEMATICAS);
        fuente = { tipo: 'error', error: e.message };
        cambio = true;
      }
    }
    if (arrancado && (cambio || document.body.dataset.ruta === 'revisar')) {
      if (cambio) limpiarCarrito();
      enrutar();
    }
  }

  async function cargarCatalogo() {
    if (!URL_HOJA) {
      usarCatalogo(window.PRODUCTOS, window.TEMATICAS);
      fuente = { tipo: 'ejemplo' };
      return;
    }
    // Con una copia guardada la tienda abre al instante y la hoja se lee en segundo plano.
    const copia = almacen.leer('bd-catalogo', null);
    if (copia && copia.url === URL_HOJA && copia.csv) {
      aplicarHoja(copia.csv, 'copia', copia.fecha);
      if (fuente.tipo !== 'error') {
        actualizarHoja();
        return;
      }
    }
    await actualizarHoja();
  }

  function vistaCargando() {
    const fantasma = '<div class="tarjeta tarjeta-fantasma" aria-hidden="true"><div class="tarjeta-img"></div><div class="tarjeta-info"><span></span><span></span></div></div>';
    vista.innerHTML = `<div class="contenedor pagina" aria-busy="true">
      <p class="cargando-texto">Cargando productos…</p>
      <div class="rejilla">${fantasma.repeat(8)}</div>
    </div>`;
  }

  function vistaSinCatalogo() {
    vista.innerHTML = `<div class="contenedor pagina"><div class="vacio">
      <h1>No pudimos cargar los productos</h1>
      <p>Vuelve a intentarlo en unos minutos. Mientras tanto, puedes hacer tu pedido por WhatsApp.</p>
      <div class="vacio-acciones">
        <button type="button" class="boton boton-primario" id="reintentar">Volver a intentar</button>
        <a class="boton boton-whatsapp" href="${waEnlace('¡Hola, Buen Detalle! Quiero hacer un pedido.')}" target="_blank" rel="noopener">${I.whatsapp}Pedir por WhatsApp</a>
      </div>
    </div></div>`;
    document.getElementById('reintentar').addEventListener('click', () => {
      vistaCargando();
      actualizarHoja();
    });
    return 'Catálogo no disponible';
  }

  /* ---------------- Revisión del catálogo (para el negocio) ---------------- */
  let revisionArchivo = null; // { nombre, resultado } al revisar un CSV sin publicarlo

  function vistaRevisar() {
    const prueba = revisionArchivo;
    const productos = prueba ? prueba.resultado.productos : TODOS;
    const problemas = prueba ? prueba.resultado.problemas : (fuente.problemas || []);
    const nuevas = prueba ? prueba.resultado.tematicasNuevas : (fuente.tematicasNuevas || []);
    const errores = problemas.filter((x) => x.tipo === 'error');
    const avisos = problemas.filter((x) => x.tipo === 'aviso');
    const cuantos = (f) => productos.filter(f).length;
    const sinFoto = (p) => !p.imagen && !(p.variantes || []).some((g) => g.opciones.some((o) => o.imagen));
    const fecha = (t) => (t ? new Date(t).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '');
    const temas = Object.fromEntries((prueba ? prueba.resultado.tematicas : TEMAS).map((t) => [t.id, t.nombre]));

    let estado, tono;
    if (prueba) {
      tono = 'info';
      estado = `<p><strong>Revisando el archivo “${esc(prueba.nombre)}”.</strong> La tienda no cambió; esto solo muestra cómo quedaría.</p>`;
    } else if (fuente.tipo === 'ejemplo') {
      tono = 'info';
      estado = `<p><strong>La tienda muestra los productos de ejemplo.</strong> Para usar tu hoja de Google, compártela como "Cualquier persona con el enlace" y pega el enlace en <code>hojaProductos</code> dentro de <code>js/config.js</code>. Los pasos están en la pestaña "Instrucciones" de la plantilla.</p>`;
    } else if (fuente.tipo === 'hoja') {
      tono = 'ok';
      estado = `<p><strong>Conectada a tu hoja de Google.</strong> ${HOJA_PUBLICADA ? 'Google tarda hasta 5 minutos en mostrar los cambios de una hoja publicada.' : 'Los cambios aparecen en cuanto alguien abre o recarga la tienda.'} <span class="estado-fecha">Última lectura: ${fecha(fuente.fecha)}</span></p>`;
    } else if (fuente.tipo === 'copia') {
      tono = fuente.error ? 'alerta' : 'info';
      estado = `<p><strong>Se muestra la copia guardada de la hoja.</strong> ${fuente.error ? `No se pudo leer la hoja: ${esc(fuente.error)}` : 'Leyendo la hoja…'} <span class="estado-fecha">Copia del ${fecha(fuente.fecha)}</span></p>`;
    } else {
      tono = 'error';
      estado = `<p><strong>No se pudo usar la hoja.</strong> ${esc(fuente.error || '')}</p>`;
    }

    const tablaProblemas = (lista) => `<div class="tabla-desplazable"><table class="tabla tabla-rev">
      <thead><tr><th scope="col">Fila</th><th scope="col">Producto</th><th scope="col">Qué pasa</th></tr></thead>
      <tbody>${lista.map((x) => `<tr><td>${x.fila}</td><td>${esc(x.nombre || '—')}</td><td>${esc(x.mensaje)}</td></tr>`).join('')}</tbody>
    </table></div>`;

    const etiquetaEstado = { visible: 'Visible', agotado: 'Agotado', oculto: 'Oculto' };

    vista.innerHTML = `
      <div class="contenedor pagina pagina-texto">
        ${migas([['Inicio', '#/'], ['Revisión del catálogo']])}
        <h1 class="pagina-titulo">Revisión del catálogo</h1>
        <p class="pagina-sub">Página para el negocio: revisa que la hoja de productos esté bien. No aparece en el menú de la tienda.</p>

        <div class="estado-fuente estado-${tono}">
          ${estado}
          <div class="estado-acciones">
            ${prueba ? '<button type="button" class="boton boton-secundario" id="rev-salir">Volver a la tienda actual</button>' : ''}
            ${!prueba && URL_EDITAR ? `<a class="boton boton-primario" href="${esc(URL_EDITAR)}" target="_blank" rel="noopener">Abrir la hoja</a>` : ''}
            ${!prueba && URL_HOJA ? '<button type="button" class="boton boton-secundario" id="rev-releer">Volver a leer la hoja</button>' : ''}
            <label class="boton boton-red rev-archivo">Revisar un archivo CSV<input type="file" id="rev-archivo" accept=".csv,text/csv"></label>
          </div>
        </div>

        <dl class="rev-cifras">
          <div><dt>En la tienda</dt><dd>${cuantos((p) => p.estado !== 'oculto')}</dd></div>
          <div><dt>Agotados</dt><dd>${cuantos((p) => p.estado === 'agotado')}</dd></div>
          <div><dt>Ocultos</dt><dd>${cuantos((p) => p.estado === 'oculto')}</dd></div>
          <div><dt>Sin foto</dt><dd>${cuantos(sinFoto)}</dd></div>
          <div class="${errores.length ? 'cifra-error' : ''}"><dt>Filas con error</dt><dd>${errores.length}</dd></div>
          <div class="${avisos.length ? 'cifra-aviso' : ''}"><dt>Avisos</dt><dd>${avisos.length}</dd></div>
        </dl>

        ${errores.length ? `<section class="bloque"><h2>Por corregir</h2><p>Estas filas no aparecen en la tienda hasta que las corrijas.</p>${tablaProblemas(errores)}</section>` : ''}
        ${avisos.length ? `<section class="bloque"><h2>Avisos</h2><p>Estos productos sí aparecen, pero revisa lo que se indica.</p>${tablaProblemas(avisos)}</section>` : ''}
        ${!problemas.length && productos.length ? '<p class="rev-todo-bien">Todo en orden: ninguna fila tiene problemas.</p>' : ''}
        ${nuevas.length ? `<section class="bloque"><h2>Temáticas nuevas</h2><p>Se crearon a partir de la columna "Temáticas" de la hoja.</p><div class="chips">${nuevas.map((t) => `<span class="chip" style="--chip:${t.color}"><span class="chip-punto"></span>${esc(t.nombre)}</span>`).join('')}</div></section>` : ''}

        ${productos.length ? `<section class="bloque bloque-ancho">
          <h2>Productos (${productos.length})</h2>
          <div class="tabla-desplazable"><table class="tabla tabla-rev tabla-productos">
            <thead><tr><th scope="col">Fila</th><th scope="col">Producto</th><th scope="col">Categoría</th><th scope="col">Precio</th><th scope="col">Mayoreo</th><th scope="col">Peso</th><th scope="col">Estado</th><th scope="col">Foto</th></tr></thead>
            <tbody>${productos.map((p) => `<tr>
              <td>${p.fila || '—'}</td>
              <td><span class="rev-producto"><span class="rev-img">${imagenDe(p)}</span>${!prueba && p.estado !== 'oculto' ? `<a href="#/producto/${p.id}">${esc(p.nombre)}</a>` : esc(p.nombre)}</span>
                <small>${esc(p.tematicas.map((t) => temas[t] || t).join(', '))}</small></td>
              <td>${esc(catPorId[p.categoria].nombre)}</td>
              <td>${dinero(p.precio)}</td>
              <td>${p.mayoreo ? `${dinero(p.mayoreo.precio)} desde ${p.mayoreo.min}` : '—'}</td>
              <td>${pesoTexto(p.peso)}</td>
              <td><span class="pastilla-estado estado-${p.estado || 'visible'}">${etiquetaEstado[p.estado || 'visible']}</span></td>
              <td>${sinFoto(p) ? 'Ilustración' : 'Sí'}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </section>` : ''}
      </div>`;

    const releer = document.getElementById('rev-releer');
    if (releer) releer.addEventListener('click', async () => {
      releer.disabled = true;
      releer.textContent = 'Leyendo…';
      await actualizarHoja();
      enrutar();
    });
    const salir = document.getElementById('rev-salir');
    if (salir) salir.addEventListener('click', () => { revisionArchivo = null; vistaRevisar(); });
    document.getElementById('rev-archivo').addEventListener('change', (ev) => {
      const archivo = ev.target.files[0];
      if (!archivo) return;
      const lector = new FileReader();
      lector.onload = () => {
        revisionArchivo = { nombre: archivo.name, resultado: leerHoja(lector.result) };
        vistaRevisar();
        window.scrollTo(0, 0);
      };
      lector.readAsText(archivo, 'utf-8');
    });
    return 'Revisión del catálogo';
  }

  /* ------------------------------------------------------------------
     Rutas
     ------------------------------------------------------------------ */
  let rutaAnterior = null;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function irAAncla(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'start' });
    return !!el;
  }

  function enrutar() {
    const crudo = location.hash || '#/';
    // Un enlace del tipo #categorias abre la portada y baja a esa sección.
    const ancla = crudo.startsWith('#/') ? null : crudo.slice(1);
    const hash = ancla ? '#/' : crudo;
    const [seccion, ...resto] = hash.slice(2).split('/');
    const param = decodeURIComponent(resto.join('/'));

    if (seccion !== 'buscar') {
      const input = document.getElementById('buscar');
      if (input) input.value = '';
    }
    if (crudo !== rutaAnterior) {
      filtros = {};
      filtrosAbiertos = false;
      revisionArchivo = null;
      if (rutaAnterior !== null) document.getElementById('aviso').hidden = true;
    }

    let titulo;
    if (!PRODS.length && fuente.tipo === 'error' && !['revisar', 'envios'].includes(seccion)) titulo = vistaSinCatalogo();
    else switch (seccion) {
      case '': titulo = vistaInicio(); break;
      case 'categoria': titulo = vistaCategoria(param); break;
      case 'tematica': titulo = vistaTematica(param); break;
      case 'tematicas': titulo = vistaTematicas(); break;
      case 'marca': titulo = vistaMarca(param); break;
      case 'buscar': titulo = vistaBusqueda(param); break;
      case 'producto': titulo = vistaProducto(param); break;
      case 'carrito': titulo = vistaCarrito(); break;
      case 'envios': titulo = vistaEnvios(); break;
      case 'revisar': titulo = vistaRevisar(); break;
      default: titulo = vistaNoEncontrada();
    }

    document.title = titulo === T.nombre ? `${T.nombre} · ${T.lema}` : `${titulo} · ${T.nombreCorto}`;
    document.body.dataset.ruta = seccion || 'inicio';
    document.querySelectorAll('[data-nav]').forEach((a) => {
      const activo = hash.slice(2).startsWith(a.dataset.nav);
      a.classList.toggle('activo', activo);
      if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (crudo !== rutaAnterior) window.scrollTo(0, 0);
    rutaAnterior = crudo;
    if (ancla) irAAncla(ancla);
  }

  // Enlaces a secciones de la misma página (#categorias) no cambian de vista.
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '#' || href.startsWith('#/')) return;
    if (irAAncla(href.slice(1))) ev.preventDefault();
  });

  async function iniciar() {
    pintarCabecera();
    pintarPie();
    window.addEventListener('hashchange', () => { if (arrancado) enrutar(); });
    window.addEventListener('storage', (ev) => {
      if (ev.key === 'bd-carrito') {
        carrito = almacen.leer('bd-carrito', []).filter((l) => porId[l.id] && l.cantidad > 0);
        pintarContador();
      }
    });
    vistaCargando();
    await cargarCatalogo();
    arrancado = true;
    limpiarCarrito();
    enrutar();
  }

  // Para pruebas automáticas.
  window.BuenDetalle = { buscar, mensajePedido, resumenActual, get fuente() { return fuente; } };

  iniciar();
})();
