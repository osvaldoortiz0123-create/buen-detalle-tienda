/* =====================================================================
   CONFIGURACIÓN DE LA TIENDA
   Aquí se editan los datos del negocio, las redes sociales y las
   tarifas de envío. No hace falta tocar ningún otro archivo para esto.
   ===================================================================== */

window.TIENDA = {
  nombre: 'Buen Detalle Distribuidora',
  nombreCorto: 'Buen Detalle',
  lema: 'Globos, papelería y envolturas para cada fiesta',
  ciudad: 'Tijuana, Baja California',

  // WhatsApp: código de país (52) + 10 dígitos, sin espacios ni signos.
  whatsapp: '526641291909',
  whatsappVisible: '664 129 1909',

  // HOJA DE PRODUCTOS (Google Sheets). Pega aquí el enlace de la hoja: en Google Sheets,
  // botón "Compartir" → Acceso general: "Cualquier persona con el enlace" → "Copiar enlace".
  // Si se deja vacío, la tienda muestra los productos de ejemplo de js/productos.js.
  hojaProductos: 'https://docs.google.com/spreadsheets/d/1pAmkzDhx2gPbmvwHhVng3T_jMQ6Dd2_vavjCMIgFWNU/edit?usp=sharing',

  // Solo si en hojaProductos usaste un enlace de "Publicar en la Web": pega aquí el enlace
  // normal para editar la hoja. Se usa en la página de revisión (tutienda.com/#/revisar).
  hojaEditar: '',

  instagram: { usuario: 'buendetalledistribuidora', url: 'https://www.instagram.com/buendetalledistribuidora/' },
  tiktok: { usuario: 'bddfiestasymas', url: 'https://www.tiktok.com/@bddfiestasymas' },

  // Formas de pago que el cliente puede elegir al hacer su pedido.
  formasPago: [
    'Transferencia bancaria',
    'Depósito en tienda de conveniencia',
    'Efectivo (al recoger o en entrega local)',
    'Tarjeta (al recoger en tienda)'
  ]
};

/* ---------------------------------------------------------------------
   ENVÍOS
   Costo = tarifa base de la zona (incluye el primer kilo)
         + kilos adicionales × precio por kilo adicional de la zona.
   El peso se redondea hacia arriba al kilo completo y se le suma
   el peso del empaque. La zona se elige por la distancia aproximada
   por carretera entre la tienda (origen) y el destino.
   --------------------------------------------------------------------- */
window.ENVIO = {
  // Punto desde donde salen los pedidos (ubicación de la tienda o bodega).
  origen: { nombre: 'Tijuana, B.C.', lat: 32.5149, lng: -117.0382 },

  // La distancia en línea recta se multiplica por este factor
  // para aproximar la distancia real por carretera.
  factorCarretera: 1.3,

  // Peso de la caja y el relleno que se suma a cada pedido (gramos).
  empaqueGramos: 200,

  // Pedidos más pesados que esto se cotizan directamente por WhatsApp.
  pesoMaximoKg: 30,

  zonas: [
    { id: 'L1', nombre: 'Local cercano',      hastaKm: 7,        base: 50,  kgAdicional: 8,  tiempo: 'Mismo día o día siguiente' },
    { id: 'L2', nombre: 'Local',              hastaKm: 15,       base: 75,  kgAdicional: 8,  tiempo: 'Mismo día o día siguiente' },
    { id: 'L3', nombre: 'Local extendido',    hastaKm: 35,       base: 110, kgAdicional: 10, tiempo: '1 día hábil' },
    { id: 'R1', nombre: 'Regional cercano',   hastaKm: 150,      base: 160, kgAdicional: 18, tiempo: '1 a 2 días hábiles' },
    { id: 'R2', nombre: 'Regional',           hastaKm: 450,      base: 210, kgAdicional: 28, tiempo: '2 a 3 días hábiles' },
    { id: 'N1', nombre: 'Noroeste',           hastaKm: 1400,     base: 250, kgAdicional: 38, tiempo: '2 a 4 días hábiles' },
    { id: 'N2', nombre: 'Nacional',           hastaKm: 2700,     base: 280, kgAdicional: 45, tiempo: '3 a 5 días hábiles' },
    { id: 'N3', nombre: 'Nacional extendido', hastaKm: Infinity, base: 320, kgAdicional: 55, tiempo: '4 a 7 días hábiles' }
  ],

  // Envío gratis a partir de cierto subtotal, solo en las zonas indicadas.
  // Para desactivarlo, cambia la línea a:  envioGratis: null,
  envioGratis: { desde: 1500, zonas: ['L1', 'L2'] },

  // Destinos disponibles: [estado, ciudad o zona, latitud, longitud]
  destinos: [
    ['Baja California', 'Tijuana · Centro', 32.5340, -117.0380],
    ['Baja California', 'Tijuana · Zona Río', 32.5270, -117.0200],
    ['Baja California', 'Tijuana · Hipódromo / Agua Caliente', 32.5100, -117.0050],
    ['Baja California', 'Tijuana · Playas de Tijuana', 32.5230, -117.1200],
    ['Baja California', 'Tijuana · La Mesa', 32.5070, -116.9810],
    ['Baja California', 'Tijuana · Otay', 32.5380, -116.9650],
    ['Baja California', 'Tijuana · Santa Fe / Villa del Sol', 32.4550, -117.0550],
    ['Baja California', 'Tijuana · Cerro Colorado', 32.4900, -116.9200],
    ['Baja California', 'Tijuana · La Presa', 32.4700, -116.9300],
    ['Baja California', 'Tijuana · El Florido / Blvd. 2000', 32.4950, -116.8500],
    ['Baja California', 'Tijuana · Natura / Terrazas del Valle', 32.4400, -116.8900],
    ['Baja California', 'Playas de Rosarito', 32.3600, -117.0570],
    ['Baja California', 'Tecate', 32.5720, -116.6250],
    ['Baja California', 'Ensenada', 31.8670, -116.5960],
    ['Baja California', 'Mexicali', 32.6245, -115.4523],
    ['Baja California', 'San Felipe', 31.0250, -114.8410],
    ['Baja California', 'San Quintín', 30.5600, -115.9400],
    ['Baja California Sur', 'La Paz', 24.1426, -110.3128],
    ['Baja California Sur', 'Los Cabos', 23.0600, -109.6970],
    ['Sonora', 'San Luis Río Colorado', 32.4560, -114.7720],
    ['Sonora', 'Puerto Peñasco', 31.3170, -113.5370],
    ['Sonora', 'Nogales', 31.3086, -110.9420],
    ['Sonora', 'Hermosillo', 29.0729, -110.9559],
    ['Sonora', 'Guaymas', 27.9180, -110.8990],
    ['Sonora', 'Ciudad Obregón', 27.4828, -109.9304],
    ['Sinaloa', 'Los Mochis', 25.7900, -108.9860],
    ['Sinaloa', 'Culiacán', 24.8091, -107.3940],
    ['Sinaloa', 'Mazatlán', 23.2494, -106.4111],
    ['Chihuahua', 'Ciudad Juárez', 31.6904, -106.4245],
    ['Chihuahua', 'Chihuahua', 28.6353, -106.0889],
    ['Durango', 'Durango', 24.0277, -104.6532],
    ['Coahuila', 'Torreón', 25.5428, -103.4068],
    ['Coahuila', 'Saltillo', 25.4232, -101.0053],
    ['Nuevo León', 'Monterrey', 25.6866, -100.3161],
    ['Tamaulipas', 'Reynosa', 26.0508, -98.2979],
    ['Tamaulipas', 'Ciudad Victoria', 23.7369, -99.1411],
    ['Tamaulipas', 'Tampico', 22.2331, -97.8611],
    ['Nayarit', 'Tepic', 21.5042, -104.8946],
    ['Jalisco', 'Puerto Vallarta', 20.6534, -105.2253],
    ['Jalisco', 'Guadalajara', 20.6597, -103.3496],
    ['Zacatecas', 'Zacatecas', 22.7709, -102.5833],
    ['Aguascalientes', 'Aguascalientes', 21.8853, -102.2916],
    ['San Luis Potosí', 'San Luis Potosí', 22.1565, -100.9855],
    ['Guanajuato', 'León', 21.1250, -101.6860],
    ['Guanajuato', 'Guanajuato', 21.0190, -101.2574],
    ['Querétaro', 'Querétaro', 20.5888, -100.3899],
    ['Colima', 'Colima', 19.2433, -103.7250],
    ['Michoacán', 'Morelia', 19.7060, -101.1950],
    ['Hidalgo', 'Pachuca', 20.1011, -98.7591],
    ['Estado de México', 'Toluca', 19.2826, -99.6557],
    ['Ciudad de México', 'Ciudad de México', 19.4326, -99.1332],
    ['Morelos', 'Cuernavaca', 18.9242, -99.2216],
    ['Tlaxcala', 'Tlaxcala', 19.3139, -98.2404],
    ['Puebla', 'Puebla', 19.0414, -98.2063],
    ['Veracruz', 'Xalapa', 19.5438, -96.9102],
    ['Veracruz', 'Veracruz', 19.1738, -96.1342],
    ['Guerrero', 'Chilpancingo', 17.5515, -99.5006],
    ['Guerrero', 'Acapulco', 16.8531, -99.8237],
    ['Oaxaca', 'Oaxaca', 17.0732, -96.7266],
    ['Chiapas', 'Tuxtla Gutiérrez', 16.7516, -93.1029],
    ['Tabasco', 'Villahermosa', 17.9892, -92.9475],
    ['Campeche', 'Campeche', 19.8301, -90.5349],
    ['Yucatán', 'Mérida', 20.9674, -89.5926],
    ['Quintana Roo', 'Cancún', 21.1619, -86.8515],
    ['Quintana Roo', 'Chetumal', 18.5001, -88.2961]
  ]
};
