/* =====================================================================
   CÁLCULOS: precios de mayoreo, peso del pedido y costo de envío.
   Funciones puras (sin tocar la página) para poder probarlas aparte.
   ===================================================================== */
(function (global) {
  'use strict';

  var RADIO_TIERRA_KM = 6371;

  function aRadianes(grados) {
    return grados * Math.PI / 180;
  }

  // Distancia en línea recta entre dos puntos {lat, lng} (fórmula de haversine).
  function distanciaKm(a, b) {
    var dLat = aRadianes(b.lat - a.lat);
    var dLng = aRadianes(b.lng - a.lng);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
  }

  // Distancia aproximada por carretera, redondeada al kilómetro.
  function distanciaCarreteraKm(origen, destino, factor) {
    return Math.max(1, Math.round(distanciaKm(origen, destino) * (factor || 1)));
  }

  function zonaPorDistancia(km, zonas) {
    for (var i = 0; i < zonas.length; i++) {
      if (km <= zonas[i].hastaKm) return zonas[i];
    }
    return zonas[zonas.length - 1];
  }

  function precioUnitario(producto, cantidadTotalProducto) {
    if (producto.mayoreo && cantidadTotalProducto >= producto.mayoreo.min) {
      return producto.mayoreo.precio;
    }
    return producto.precio;
  }

  function redondear2(n) {
    return Math.round(n * 100) / 100;
  }

  /* Recibe [{producto, cantidad, opciones}] y regresa totales.
     El precio de mayoreo se activa sumando todas las variantes
     (colores, números, etc.) del mismo producto. */
  function resumenCarrito(lineas) {
    var porProducto = {};
    lineas.forEach(function (l) {
      porProducto[l.producto.id] = (porProducto[l.producto.id] || 0) + l.cantidad;
    });

    var subtotal = 0, ahorro = 0, pesoGramos = 0, piezas = 0;
    var detalle = lineas.map(function (l) {
      var cantidadProducto = porProducto[l.producto.id];
      var unitario = precioUnitario(l.producto, cantidadProducto);
      var total = redondear2(unitario * l.cantidad);
      subtotal += total;
      ahorro += (l.producto.precio - unitario) * l.cantidad;
      pesoGramos += (l.producto.peso || 0) * l.cantidad;
      piezas += l.cantidad;
      return {
        producto: l.producto,
        opciones: l.opciones || {},
        cantidad: l.cantidad,
        precioUnitario: unitario,
        esMayoreo: unitario < l.producto.precio,
        faltanParaMayoreo: l.producto.mayoreo && cantidadProducto < l.producto.mayoreo.min
          ? l.producto.mayoreo.min - cantidadProducto : 0,
        total: total
      };
    });

    return {
      lineas: detalle,
      subtotal: redondear2(subtotal),
      ahorro: redondear2(ahorro),
      pesoGramos: pesoGramos,
      piezas: piezas
    };
  }

  /* Calcula el envío.
     opciones: { metodo: 'recoger' | 'domicilio', destino: {lat, lng}, pesoGramos, subtotal }
     config:   objeto ENVIO de config.js */
  function calcularEnvio(opciones, config) {
    if (opciones.metodo === 'recoger') {
      return { metodo: 'recoger', costo: 0, listo: true };
    }
    if (!opciones.destino) {
      return { metodo: 'domicilio', costo: 0, listo: false };
    }

    var km = distanciaCarreteraKm(config.origen, opciones.destino, config.factorCarretera);
    var zona = zonaPorDistancia(km, config.zonas);
    var pesoTotalGramos = (opciones.pesoGramos || 0) + (config.empaqueGramos || 0);
    var pesoKg = Math.max(1, Math.ceil(pesoTotalGramos / 1000));
    var kgAdicionales = pesoKg - 1;
    var costoKg = kgAdicionales * zona.kgAdicional;
    var costo = zona.base + costoKg;

    var gratis = !!(config.envioGratis &&
      config.envioGratis.zonas.indexOf(zona.id) !== -1 &&
      opciones.subtotal >= config.envioGratis.desde);
    var cotizar = pesoTotalGramos / 1000 > config.pesoMaximoKg;

    return {
      metodo: 'domicilio',
      listo: !cotizar,
      km: km,
      zona: zona,
      pesoTotalGramos: pesoTotalGramos,
      pesoKg: pesoKg,
      kgAdicionales: kgAdicionales,
      costoBase: zona.base,
      costoKg: costoKg,
      costoCalculado: costo,
      gratis: gratis,
      cotizar: cotizar,
      costo: cotizar || gratis ? 0 : costo
    };
  }

  var Calculos = {
    distanciaKm: distanciaKm,
    distanciaCarreteraKm: distanciaCarreteraKm,
    zonaPorDistancia: zonaPorDistancia,
    precioUnitario: precioUnitario,
    resumenCarrito: resumenCarrito,
    calcularEnvio: calcularEnvio
  };

  global.Calculos = Calculos;
  if (typeof module !== 'undefined' && module.exports) module.exports = Calculos;
})(typeof window !== 'undefined' ? window : globalThis);
