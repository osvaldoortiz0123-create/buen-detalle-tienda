/* =====================================================================
   CATÁLOGO
   Productos de EJEMPLO. Sustitúyelos por los reales.

   Cada producto lleva:
     id          identificador único, sin espacios (se usa en el enlace)
     nombre      nombre visible
     categoria   id de una categoría de CATEGORIAS
     tematicas   lista de ids de TEMATICAS (puede ir vacía)
     precio      precio de menudeo en pesos
     mayoreo     { min: piezas, precio: pesos }  (opcional)
     unidad      qué se vende ("pieza", "bolsa con 50 piezas"...)
     peso        gramos por unidad vendida (para calcular el envío)
     descripcion texto de la página del producto
     detalles    pares [etiqueta, valor] para la ficha técnica
     variantes   grupos de opciones (color, número, diseño...)
     imagen      ruta a una foto real, p. ej. "img/estrella-dorada.jpg" (opcional;
                 si no hay foto se muestra el dibujo de "dibujo")
     destacado   true para mostrarlo en "Lo más pedido"
     nuevo       true para la etiqueta "Nuevo"
   ===================================================================== */

window.CATEGORIAS = [
  {
    id: 'globos-foil', nombre: 'Globos de foil',
    descripcion: 'Estrellas, corazones, números, letras y figuras metálicas para helio o aire.',
    dibujo: { tipo: 'estrella', color: '#d4a72c' }
  },
  {
    id: 'globos-latex', nombre: 'Globos de látex',
    descripcion: 'Bolsas de globos en todos los colores y tamaños, kits de arco y accesorios.',
    dibujo: { tipo: 'latex', colores: ['#e9407a', '#f6c445', '#7e57c2'] }
  },
  {
    id: 'papeleria', nombre: 'Papelería',
    descripcion: 'Papel china, crepé, cartulina, papel picado, banderines e invitaciones.',
    dibujo: { tipo: 'papelPicado', colores: ['#e4007c', '#ff8c00', '#00a6a6', '#7b2cbf'] }
  },
  {
    id: 'envolturas', nombre: 'Envolturas',
    descripcion: 'Papel para regalo, bolsas, moños, listones, celofán y cajas.',
    dibujo: { tipo: 'bolsa', color: '#c2185b', patron: 'lunares', colores: ['#ffd23f', '#ffffff'] }
  }
];

// "temporada": meses (1 = enero) en que la temática se destaca en la portada.
window.TEMATICAS = [
  { id: 'cumpleanos', nombre: 'Cumpleaños', color: '#ff5d8f' },
  { id: 'infantil', nombre: 'Fiestas infantiles', color: '#21a6b8' },
  { id: 'baby-shower', nombre: 'Baby shower', color: '#6aaed6' },
  { id: 'revelacion', nombre: 'Revelación de género', color: '#e889b5' },
  { id: 'xv-anos', nombre: 'XV años', color: '#a35bdc' },
  { id: 'bodas', nombre: 'Bodas y aniversarios', color: '#c19a2e' },
  { id: 'amor', nombre: 'Amor y amistad', color: '#e63946', temporada: [1, 2] },
  { id: 'graduacion', nombre: 'Graduación', color: '#2f5d73', temporada: [5, 6, 7] },
  { id: 'fiestas-patrias', nombre: 'Fiestas patrias', color: '#0b7a3b', temporada: [8, 9] },
  { id: 'navidad', nombre: 'Navidad', color: '#1b7f4b', temporada: [10, 11, 12] }
];

// Colores con nombre para las variantes. En la hoja de productos se escriben
// por su nombre ("Dorado, Rosa pastel"); para otro color agrega su código: "Turquesa #1fb5ad".
window.COLORES = {
  dorado: ['Dorado', '#d4a72c'], plateado: ['Plateado', '#b8bfc9'], oroRosa: ['Oro rosa', '#e8a598'],
  rosa: ['Rosa', '#ff7eb6'], fucsia: ['Fucsia', '#e5177e'], rojo: ['Rojo', '#d7263d'],
  azul: ['Azul', '#2f6fdf'], azulRey: ['Azul rey', '#1f3fbf'], azulCielo: ['Azul cielo', '#7cc6fe'],
  morado: ['Morado', '#7b2cbf'], lila: ['Lila', '#b892ff'], verde: ['Verde', '#1f9d55'],
  verdeLimon: ['Verde limón', '#9bd33a'], verdeBandera: ['Verde bandera', '#0b7a3b'],
  amarillo: ['Amarillo', '#ffd23f'], naranja: ['Naranja', '#ff8c42'], negro: ['Negro', '#2b2b2e'],
  blanco: ['Blanco', '#f1edf1'], cafe: ['Café', '#7a4a2a'], kraft: ['Kraft', '#c49a6c'], vino: ['Vino', '#8c1c3a'],
  rosaPastel: ['Rosa pastel', '#ffc8dd'], lilaPastel: ['Lila pastel', '#d9c5ff'], azulPastel: ['Azul pastel', '#bde0fe'],
  menta: ['Menta', '#9ee6c9'], amarilloPastel: ['Amarillo pastel', '#fff3b0'], durazno: ['Durazno', '#ffc5a8'],
  turquesa: ['Turquesa', '#1fb5ad'], gris: ['Gris', '#9aa0a8'], beige: ['Beige', '#e6d3b3'],
  champagne: ['Champagne', '#e9d8a6'], transparente: ['Transparente', '#a8d8f0'], surtido: ['Surtido', '#ff5d8f']
};

(function () {
  'use strict';

  var C = window.COLORES;

  // Crea un grupo de variantes de color a partir de los nombres de la tabla C.
  function colores(nombres, titulo) {
    return {
      nombre: titulo || 'Color',
      tipo: 'color',
      opciones: nombres.map(function (n) { return { nombre: C[n][0], color: C[n][1] }; })
    };
  }

  function digitos() {
    return { nombre: 'Número', opciones: '0123456789'.split('').map(function (d) { return { nombre: d, dibujo: { texto: d } }; }) };
  }

  function letras() {
    return {
      nombre: 'Letra',
      opciones: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ&'.split('').map(function (d) { return { nombre: d, dibujo: { texto: d } }; })
    };
  }

  var DISENOS_REGALO = {
    nombre: 'Diseño',
    opciones: [
      { nombre: 'Cumpleaños', color: '#ff5d8f', dibujo: { patron: 'confeti', colores: ['#ffd23f', '#ffffff', '#3ec1d3', '#7b2cbf'] } },
      { nombre: 'Infantil', color: '#21a6b8', dibujo: { patron: 'estrellas', colores: ['#ffd23f', '#ffffff'] } },
      { nombre: 'Baby', color: '#bde0fe', dibujo: { patron: 'lunares', colores: ['#ffffff', '#ffc8dd'] } },
      { nombre: 'Elegante negro y dorado', color: '#2b2b2e', dibujo: { patron: 'rayas', colores: ['#d4a72c'] } },
      { nombre: 'Navidad', color: '#c8102e', dibujo: { patron: 'navidad', colores: ['#1b7f4b', '#ffffff'] } },
      { nombre: 'Amor', color: '#ffc8dd', dibujo: { patron: 'corazones', colores: ['#e63946', '#ff7eb6'] } }
    ]
  };

  var FOIL = [
    ['Medida', '18 in (45 cm)'], ['Material', 'Foil metalizado'],
    ['Inflado', 'Helio o aire, válvula autosellante'], ['Duración con helio', '5 a 7 días aprox.']
  ];

  window.PRODUCTOS = [
    /* ---------------- GLOBOS DE FOIL ---------------- */
    {
      id: 'globo-foil-estrella-18', nombre: 'Globo foil estrella 18"', categoria: 'globos-foil',
      tematicas: ['cumpleanos', 'infantil', 'graduacion', 'navidad', 'baby-shower'],
      precio: 22, mayoreo: { min: 10, precio: 17 }, unidad: 'pieza', peso: 12,
      descripcion: 'Estrella metálica de 18 pulgadas. Se infla con helio o con aire y se sella sola gracias a su válvula. Va muy bien en bouquets, centros de mesa y para cubrir techos.',
      detalles: FOIL,
      variantes: [colores(['dorado', 'plateado', 'oroRosa', 'rosa', 'azul', 'rojo', 'morado', 'negro'])],
      dibujo: { tipo: 'estrella' }, etiquetas: 'estrella estrellas metalico helio', destacado: true
    },
    {
      id: 'globo-foil-corazon-18', nombre: 'Globo foil corazón 18"', categoria: 'globos-foil',
      tematicas: ['amor', 'bodas', 'xv-anos', 'baby-shower', 'cumpleanos'],
      precio: 22, mayoreo: { min: 10, precio: 17 }, unidad: 'pieza', peso: 12,
      descripcion: 'Corazón metálico de 18 pulgadas, el favorito para San Valentín, pedidas de mano y arreglos con peluche. Flota con helio o se pega a la pared inflado con aire.',
      detalles: FOIL,
      variantes: [colores(['rojo', 'rosa', 'oroRosa', 'dorado', 'plateado', 'fucsia', 'morado', 'blanco'])],
      dibujo: { tipo: 'corazon' }, etiquetas: 'corazon corazones amor san valentin metalico helio', destacado: true
    },
    {
      id: 'globo-foil-numero-34', nombre: 'Globo foil número 34"', categoria: 'globos-foil',
      tematicas: ['cumpleanos', 'xv-anos', 'bodas', 'graduacion', 'infantil'],
      precio: 48, mayoreo: { min: 6, precio: 40 }, unidad: 'pieza', peso: 40,
      descripcion: 'Número gigante de 34 pulgadas (86 cm de alto) para marcar la edad del festejado o los años de aniversario. Con helio flota; con aire se cuelga o se monta en base.',
      detalles: [['Medida', '34 in (86 cm de alto)'], ['Material', 'Foil metalizado'], ['Inflado', 'Helio (aprox. 0.6 m³) o aire'], ['Duración con helio', '7 a 10 días aprox.']],
      variantes: [digitos(), colores(['dorado', 'plateado', 'oroRosa', 'rosa', 'azul', 'negro'])],
      dibujo: { tipo: 'numero', texto: '0' }, etiquetas: 'numero numeros edad gigante cumpleaños aniversario', destacado: true
    },
    {
      id: 'globo-foil-numero-16', nombre: 'Globo foil número 16" mini', categoria: 'globos-foil',
      tematicas: ['cumpleanos', 'infantil', 'xv-anos'],
      precio: 14, mayoreo: { min: 12, precio: 10 }, unidad: 'pieza', peso: 8,
      descripcion: 'Número chico de 16 pulgadas (40 cm). Se infla con aire usando popote o inflador. Ideal para varitas, toppers y centros de mesa.',
      detalles: [['Medida', '16 in (40 cm de alto)'], ['Material', 'Foil metalizado'], ['Inflado', 'Solo aire']],
      variantes: [digitos(), colores(['dorado', 'plateado', 'oroRosa', 'rosa', 'azul'])],
      dibujo: { tipo: 'numero', texto: '0' }, etiquetas: 'numero numeros mini varita centro de mesa'
    },
    {
      id: 'globo-foil-letra-16', nombre: 'Globo foil letra 16"', categoria: 'globos-foil',
      tematicas: ['cumpleanos', 'baby-shower', 'bodas', 'xv-anos'],
      precio: 14, mayoreo: { min: 12, precio: 10 }, unidad: 'pieza', peso: 8,
      descripcion: 'Letras metálicas de 16 pulgadas para formar nombres y frases como "FELIZ CUMPLE", "LOVE" o "BABY". Se inflan con aire y se pegan a la pared con cinta.',
      detalles: [['Medida', '16 in (40 cm de alto)'], ['Material', 'Foil metalizado'], ['Inflado', 'Solo aire']],
      variantes: [letras(), colores(['dorado', 'plateado', 'oroRosa'])],
      dibujo: { tipo: 'numero', texto: 'A' }, etiquetas: 'letra letras nombre frase abecedario'
    },
    {
      id: 'globo-foil-feliz-cumpleanos-18', nombre: 'Globo foil "Feliz Cumpleaños" 18"', categoria: 'globos-foil',
      tematicas: ['cumpleanos', 'infantil'],
      precio: 25, mayoreo: { min: 10, precio: 19 }, unidad: 'pieza', peso: 13,
      descripcion: 'Globo redondo con la leyenda "Feliz Cumpleaños" impresa por ambos lados. Para regalar con helio o para completar un bouquet.',
      detalles: FOIL,
      variantes: [colores(['fucsia', 'azul', 'dorado', 'morado', 'verde'])],
      dibujo: { tipo: 'redondo', texto: 'Feliz|Cumpleaños', decoracion: 'confeti', colores: ['#ffffff', '#ffd23f', '#7ee0f0'] },
      etiquetas: 'feliz cumpleaños cumple redondo impreso', destacado: true
    },
    {
      id: 'globo-burbuja-24', nombre: 'Globo burbuja transparente 24"', categoria: 'globos-foil',
      tematicas: ['bodas', 'xv-anos', 'baby-shower', 'cumpleanos', 'revelacion'],
      precio: 38, mayoreo: { min: 10, precio: 30 }, unidad: 'pieza', peso: 22,
      descripcion: 'Globo tipo bubble, cristalino y muy resistente. Se rellena con globitos de 5", confeti o plumas, y con helio dura más de una semana.',
      detalles: [['Medida', '24 in (60 cm)'], ['Material', 'Plástico elástico tipo bubble'], ['Inflado', 'Helio o aire con inflador'], ['Duración con helio', '1 a 2 semanas aprox.']],
      dibujo: { tipo: 'burbuja', color: '#8fc9f2' }, etiquetas: 'burbuja bubble transparente cristal relleno', nuevo: true
    },
    {
      id: 'globo-foil-baby-18', nombre: 'Globo foil "It\'s a Boy / It\'s a Girl" 18"', categoria: 'globos-foil',
      tematicas: ['baby-shower', 'revelacion'],
      precio: 25, mayoreo: { min: 10, precio: 19 }, unidad: 'pieza', peso: 13,
      descripcion: 'Globo redondo para baby shower y revelación de género. Elige la versión niño o niña.',
      detalles: FOIL,
      variantes: [{
        nombre: 'Diseño',
        opciones: [
          { nombre: 'It\'s a Boy', color: '#6aaed6', dibujo: { texto: 'It\'s a|Boy' } },
          { nombre: 'It\'s a Girl', color: '#f28ab8', dibujo: { texto: 'It\'s a|Girl' } }
        ]
      }],
      dibujo: { tipo: 'redondo', decoracion: 'estrellas', tinta: '#ffffff' }, etiquetas: 'bebe baby boy girl niño niña revelacion'
    },
    {
      id: 'globo-foil-te-amo-18', nombre: 'Globo foil corazón "Te amo" 18"', categoria: 'globos-foil',
      tematicas: ['amor', 'bodas'],
      precio: 25, mayoreo: { min: 10, precio: 19 }, unidad: 'pieza', peso: 13,
      descripcion: 'Corazón metálico con la frase "Te amo". El detalle clásico para acompañar flores, chocolates o un peluche.',
      detalles: FOIL,
      variantes: [colores(['rojo', 'rosa', 'fucsia'])],
      dibujo: { tipo: 'corazon', texto: 'Te|amo', tinta: '#ffffff' }, etiquetas: 'te amo corazon amor san valentin novia novio'
    },
    {
      id: 'globo-foil-graduacion-18', nombre: 'Globo foil "Felicidades Graduado" 18"', categoria: 'globos-foil',
      tematicas: ['graduacion'],
      precio: 25, mayoreo: { min: 10, precio: 19 }, unidad: 'pieza', peso: 13,
      descripcion: 'Globo negro con birrete y letras doradas para graduaciones de kínder, primaria, secundaria, prepa y universidad.',
      detalles: FOIL,
      dibujo: { tipo: 'redondo', color: '#2b2b2e', decoracion: 'birrete', texto: 'Felicidades|Graduado', tinta: '#e8b923' },
      etiquetas: 'graduacion graduado birrete egresado felicidades'
    },
    {
      id: 'globo-foil-feliz-navidad-18', nombre: 'Globo foil "Feliz Navidad" 18"', categoria: 'globos-foil',
      tematicas: ['navidad'],
      precio: 25, mayoreo: { min: 10, precio: 19 }, unidad: 'pieza', peso: 13,
      descripcion: 'Globo redondo con la leyenda "Feliz Navidad" y copos de nieve. Para posadas, intercambios y arreglos navideños.',
      detalles: FOIL,
      variantes: [colores(['rojo', 'verde', 'dorado'])],
      dibujo: { tipo: 'redondo', decoracion: 'copos', texto: 'Feliz|Navidad' },
      etiquetas: 'feliz navidad navideño posada intercambio copos', nuevo: true
    },
    {
      id: 'globo-foil-pino-navidad-18', nombre: 'Globo foil pino de Navidad 18"', categoria: 'globos-foil',
      tematicas: ['navidad', 'infantil'],
      precio: 28, mayoreo: { min: 10, precio: 22 }, unidad: 'pieza', peso: 14,
      descripcion: 'Arbolito navideño metálico con estrella y esferas. Se infla con helio o aire y luce en entradas, mesas de postres y posadas.',
      detalles: FOIL,
      dibujo: { tipo: 'pino', color: '#1b7f4b' }, etiquetas: 'pino arbol arbolito navidad navideño posada', destacado: true, nuevo: true
    },
    {
      id: 'globo-foil-esfera-navidad-18', nombre: 'Globo foil esfera navideña 18"', categoria: 'globos-foil',
      tematicas: ['navidad'],
      precio: 25, mayoreo: { min: 10, precio: 19 }, unidad: 'pieza', peso: 13,
      descripcion: 'Esfera navideña metálica para posadas, decoración de oficinas y aparadores.',
      detalles: FOIL,
      variantes: [colores(['rojo', 'verde', 'dorado', 'azul'])],
      dibujo: { tipo: 'esfera' }, etiquetas: 'esfera navidad navideño posada'
    },
    {
      id: 'bouquet-foil-cumpleanos', nombre: 'Bouquet de globos foil cumpleaños (5 pzas)', categoria: 'globos-foil',
      tematicas: ['cumpleanos', 'infantil'],
      precio: 95, mayoreo: { min: 5, precio: 85 }, unidad: 'juego de 5 globos', peso: 60,
      descripcion: 'Juego de 5 globos metálicos combinados: un redondo "Feliz Cumple", dos estrellas y dos corazones. Listo para inflar y armar.',
      detalles: [['Incluye', '1 redondo 18", 2 estrellas y 2 corazones'], ['Material', 'Foil metalizado'], ['Inflado', 'Helio o aire']],
      variantes: [{
        nombre: 'Paleta',
        opciones: [
          { nombre: 'Clásico', dibujo: { colores: ['#e0b33a', '#ff4f8b', '#2f80ed', '#9b51e0', '#27ae60'] } },
          { nombre: 'Rosa y dorado', dibujo: { colores: ['#d4a72c', '#ff7eb6', '#e8a598', '#d4a72c', '#ff7eb6'] } },
          { nombre: 'Azul y plata', dibujo: { colores: ['#2f6fdf', '#b8bfc9', '#7cc6fe', '#b8bfc9', '#1f3fbf'] } }
        ]
      }],
      dibujo: { tipo: 'bouquet', etiqueta: '5 pzas' }, etiquetas: 'bouquet ramo kit juego set cumpleaños', destacado: true
    },
    {
      id: 'globo-foil-mis-xv-18', nombre: 'Globo foil "Mis XV" 18"', categoria: 'globos-foil',
      tematicas: ['xv-anos'],
      precio: 28, mayoreo: { min: 10, precio: 22 }, unidad: 'pieza', peso: 13,
      descripcion: 'Globo redondo con corona y la leyenda "Mis XV" para la fiesta de quince años.',
      detalles: FOIL,
      variantes: [colores(['fucsia', 'lila', 'oroRosa', 'azulRey', 'dorado'])],
      dibujo: { tipo: 'redondo', decoracion: 'corona', texto: 'Mis XV' }, etiquetas: 'xv quince años quinceañera corona'
    },
    {
      id: 'globo-foil-viva-mexico-18', nombre: 'Globo foil "¡Viva México!" 18"', categoria: 'globos-foil',
      tematicas: ['fiestas-patrias'],
      precio: 25, mayoreo: { min: 10, precio: 19 }, unidad: 'pieza', peso: 13,
      descripcion: 'Globo tricolor para la noche mexicana y las fiestas de septiembre.',
      detalles: FOIL,
      dibujo: { tipo: 'redondo', color: '#0b7a3b', decoracion: 'tricolor', texto: '¡Viva|México!' },
      etiquetas: 'mexico fiestas patrias septiembre independencia tricolor noche mexicana'
    },
    {
      id: 'globo-foil-estrella-9-paquete', nombre: 'Globos foil estrella 9", paquete 10 pzas', categoria: 'globos-foil',
      tematicas: ['cumpleanos', 'infantil', 'navidad', 'graduacion'],
      precio: 45, mayoreo: { min: 5, precio: 38 }, unidad: 'paquete con 10 piezas', peso: 40,
      descripcion: 'Estrellitas de 9 pulgadas para varitas, centros de mesa y arreglos. Se inflan con aire.',
      detalles: [['Medida', '9 in (23 cm)'], ['Contenido', '10 piezas del mismo color'], ['Inflado', 'Solo aire']],
      variantes: [colores(['dorado', 'plateado', 'oroRosa', 'rojo', 'azul'])],
      dibujo: { tipo: 'estrellasMini', etiqueta: '10 pzas' }, etiquetas: 'estrella estrellitas mini varita centro de mesa'
    },

    /* ---------------- GLOBOS DE LÁTEX ---------------- */
    {
      id: 'globo-latex-12-estandar-50', nombre: 'Globo de látex 12" estándar, bolsa 50 pzas', categoria: 'globos-latex',
      tematicas: ['cumpleanos', 'infantil', 'baby-shower', 'revelacion', 'fiestas-patrias', 'graduacion'],
      precio: 85, mayoreo: { min: 6, precio: 72 }, unidad: 'bolsa con 50 piezas', peso: 160,
      descripcion: 'Globo redondo de 12 pulgadas en color sólido, de látex natural. Es el más usado para arcos, columnas y decoración con aire o helio. Cada bolsa trae 50 piezas del mismo color.',
      detalles: [['Medida', '12 in (30 cm) inflado'], ['Contenido', '50 piezas'], ['Material', 'Látex natural biodegradable'], ['Duración con helio', '8 a 12 horas (más con sellador)']],
      variantes: [colores(['rojo', 'rosa', 'fucsia', 'lila', 'morado', 'azulRey', 'azulCielo', 'verdeLimon', 'amarillo', 'naranja', 'blanco', 'negro'])],
      dibujo: { tipo: 'latex', etiqueta: '50 pzas' }, etiquetas: 'latex r12 12 pulgadas bolsa colores arco columna', destacado: true
    },
    {
      id: 'globo-latex-12-pastel-50', nombre: 'Globo de látex 12" pastel, bolsa 50 pzas', categoria: 'globos-latex',
      tematicas: ['baby-shower', 'revelacion', 'xv-anos', 'bodas', 'infantil'],
      precio: 95, mayoreo: { min: 6, precio: 80 }, unidad: 'bolsa con 50 piezas', peso: 160,
      descripcion: 'Tonos pastel tipo macaron para decoraciones suaves: baby shower, bautizos y mesas de postres.',
      detalles: [['Medida', '12 in (30 cm) inflado'], ['Contenido', '50 piezas'], ['Acabado', 'Pastel mate']],
      variantes: [colores(['rosaPastel', 'lilaPastel', 'azulPastel', 'menta', 'amarilloPastel', 'durazno'])],
      dibujo: { tipo: 'latex', etiqueta: '50 pzas' }, etiquetas: 'latex pastel macaron baby bautizo', nuevo: true
    },
    {
      id: 'globo-latex-12-metalico-50', nombre: 'Globo de látex 12" metálico perlado, bolsa 50 pzas', categoria: 'globos-latex',
      tematicas: ['bodas', 'xv-anos', 'graduacion', 'navidad', 'cumpleanos'],
      precio: 110, mayoreo: { min: 6, precio: 95 }, unidad: 'bolsa con 50 piezas', peso: 165,
      descripcion: 'Acabado perlado con brillo suave. Combina muy bien con globos foil y decoraciones elegantes.',
      detalles: [['Medida', '12 in (30 cm) inflado'], ['Contenido', '50 piezas'], ['Acabado', 'Metálico perlado']],
      variantes: [colores(['dorado', 'plateado', 'oroRosa', 'azul', 'rojo', 'rosa', 'morado', 'verde'])],
      dibujo: { tipo: 'latex', estilo: 'perlado', etiqueta: '50 pzas' }, etiquetas: 'latex metalico perlado brillo', destacado: true
    },
    {
      id: 'globo-latex-12-cromado-25', nombre: 'Globo de látex cromado 12", bolsa 25 pzas', categoria: 'globos-latex',
      tematicas: ['bodas', 'xv-anos', 'graduacion', 'navidad'],
      precio: 120, mayoreo: { min: 6, precio: 105 }, unidad: 'bolsa con 25 piezas', peso: 85,
      descripcion: 'Efecto espejo, parecido al foil pero en látex. Para decoraciones de lujo y arcos de evento.',
      detalles: [['Medida', '12 in (30 cm) inflado'], ['Contenido', '25 piezas'], ['Acabado', 'Cromado tipo espejo']],
      variantes: [{
        nombre: 'Color', tipo: 'color',
        opciones: [
          { nombre: 'Oro cromo', color: '#c9a227' }, { nombre: 'Plata cromo', color: '#a9b1bb' },
          { nombre: 'Oro rosa cromo', color: '#d9897a' }, { nombre: 'Champagne cromo', color: '#d8c08f' },
          { nombre: 'Azul cromo', color: '#3767c9' }
        ]
      }],
      dibujo: { tipo: 'latex', estilo: 'cromo', etiqueta: '25 pzas' }, etiquetas: 'latex cromado cromo espejo lujo'
    },
    {
      id: 'globo-latex-5-mini-100', nombre: 'Globo de látex 5" mini, bolsa 100 pzas', categoria: 'globos-latex',
      tematicas: ['baby-shower', 'cumpleanos', 'bodas'],
      precio: 70, mayoreo: { min: 6, precio: 60 }, unidad: 'bolsa con 100 piezas', peso: 110,
      descripcion: 'Globito de 5 pulgadas para dar textura a arcos orgánicos, rellenar burbujas y decorar mesas.',
      detalles: [['Medida', '5 in (13 cm) inflado'], ['Contenido', '100 piezas'], ['Material', 'Látex natural']],
      variantes: [colores(['rosa', 'rojo', 'azulRey', 'verdeLimon', 'lila', 'amarillo', 'blanco', 'negro'])],
      dibujo: { tipo: 'latex', forma: 'mini', etiqueta: '100 pzas' }, etiquetas: 'latex mini 5 pulgadas chico arco organico relleno'
    },
    {
      id: 'globo-latex-18-10', nombre: 'Globo de látex 18", bolsa 10 pzas', categoria: 'globos-latex',
      tematicas: ['cumpleanos', 'baby-shower', 'bodas'],
      precio: 75, mayoreo: { min: 6, precio: 64 }, unidad: 'bolsa con 10 piezas', peso: 120,
      descripcion: 'Globo grande de 18 pulgadas para dar volumen en arcos y columnas.',
      detalles: [['Medida', '18 in (45 cm) inflado'], ['Contenido', '10 piezas'], ['Material', 'Látex natural']],
      variantes: [colores(['azulCielo', 'rosa', 'rojo', 'amarillo', 'blanco', 'negro'])],
      dibujo: { tipo: 'latex', etiqueta: '10 pzas' }, etiquetas: 'latex 18 pulgadas grande arco columna'
    },
    {
      id: 'globo-latex-260-50', nombre: 'Globo de látex 260 para figuras, bolsa 50 pzas', categoria: 'globos-latex',
      tematicas: ['infantil', 'cumpleanos'],
      precio: 90, mayoreo: { min: 6, precio: 78 }, unidad: 'bolsa con 50 piezas', peso: 150,
      descripcion: 'Globo largo para hacer perritos, espadas, flores y figuras. Se infla con inflador manual.',
      detalles: [['Medida', '5 × 150 cm inflado (260Q)'], ['Contenido', '50 piezas'], ['Inflado', 'Con inflador manual']],
      variantes: [{
        nombre: 'Color', tipo: 'color',
        opciones: [
          { nombre: 'Surtido', color: '#ff5d8f', dibujo: { colores: ['#ff5d8f', '#ffd23f', '#3ec1d3'] } },
          { nombre: 'Blanco', color: '#f1edf1' }, { nombre: 'Rojo', color: '#d7263d' }, { nombre: 'Azul', color: '#2f6fdf' },
          { nombre: 'Verde', color: '#1f9d55' }, { nombre: 'Amarillo', color: '#ffd23f' }, { nombre: 'Negro', color: '#2b2b2e' }
        ]
      }],
      dibujo: { tipo: 'latex', forma: 'largo', etiqueta: '50 pzas' }, etiquetas: 'latex 260 largo figuras perrito payaso globoflexia'
    },
    {
      id: 'globo-latex-confeti-12-10', nombre: 'Globo transparente con confeti 12", bolsa 10 pzas', categoria: 'globos-latex',
      tematicas: ['cumpleanos', 'bodas', 'xv-anos', 'baby-shower'],
      precio: 65, mayoreo: { min: 6, precio: 55 }, unidad: 'bolsa con 10 piezas', peso: 70,
      descripcion: 'Globo transparente que ya trae confeti metálico dentro. Al inflarlo y frotarlo, el confeti se pega a las paredes.',
      detalles: [['Medida', '12 in (30 cm) inflado'], ['Contenido', '10 globos con confeti incluido']],
      variantes: [colores(['dorado', 'plateado', 'oroRosa', 'rosa', 'azul'], 'Confeti')],
      dibujo: { tipo: 'latex', estilo: 'confeti', etiqueta: '10 pzas' }, etiquetas: 'latex confeti transparente brillos', nuevo: true
    },
    {
      id: 'globo-latex-corazon-12-50', nombre: 'Globo de látex corazón 12", bolsa 50 pzas', categoria: 'globos-latex',
      tematicas: ['amor', 'bodas', 'xv-anos'],
      precio: 95, mayoreo: { min: 6, precio: 82 }, unidad: 'bolsa con 50 piezas', peso: 170,
      descripcion: 'Globos de látex en forma de corazón para San Valentín, bodas y declaraciones.',
      detalles: [['Medida', '12 in (30 cm) inflado'], ['Contenido', '50 piezas']],
      variantes: [colores(['rojo', 'rosa', 'fucsia', 'blanco'])],
      dibujo: { tipo: 'latex', forma: 'corazon', etiqueta: '50 pzas' }, etiquetas: 'latex corazon corazones amor san valentin'
    },
    {
      id: 'globo-latex-feliz-cumple-12-50', nombre: 'Globo de látex impreso "Feliz Cumple", bolsa 50 pzas', categoria: 'globos-latex',
      tematicas: ['cumpleanos', 'infantil'],
      precio: 110, mayoreo: { min: 6, precio: 95 }, unidad: 'bolsa con 50 piezas', peso: 165,
      descripcion: 'Globos de 12 pulgadas en colores surtidos con "Feliz Cumpleaños" impreso alrededor.',
      detalles: [['Medida', '12 in (30 cm) inflado'], ['Contenido', '50 piezas en colores surtidos'], ['Impresión', 'A una tinta, todo alrededor']],
      dibujo: { tipo: 'latex', colores: ['#ff5d8f', '#3ec1d3', '#7b2cbf'], texto: 'Feliz Cumple', etiqueta: '50 pzas' },
      etiquetas: 'latex impreso feliz cumpleaños cumple surtido'
    },
    {
      id: 'globo-latex-36-gigante', nombre: 'Globo de látex gigante 36"', categoria: 'globos-latex',
      tematicas: ['cumpleanos', 'baby-shower', 'revelacion', 'bodas'],
      precio: 35, mayoreo: { min: 10, precio: 29 }, unidad: 'pieza', peso: 30,
      descripcion: 'Globo de 3 pies (90 cm) para fotos, revelaciones de género y como pieza central de una decoración.',
      detalles: [['Medida', '36 in (90 cm) inflado'], ['Material', 'Látex natural grueso']],
      variantes: [colores(['rosa', 'rojo', 'azulCielo', 'dorado', 'blanco', 'negro'])],
      dibujo: { tipo: 'latex', forma: 'gigante' }, etiquetas: 'latex gigante 36 jumbo grande revelacion'
    },
    {
      id: 'kit-arco-organico', nombre: 'Kit arco orgánico de globos (100 pzas)', categoria: 'globos-latex',
      tematicas: ['baby-shower', 'cumpleanos', 'bodas', 'xv-anos', 'revelacion'],
      precio: 260, mayoreo: { min: 3, precio: 235 }, unidad: 'kit', peso: 420,
      descripcion: 'Todo para armar un arco orgánico de 2.5 a 3 metros: 100 globos en tres tamaños, cinta para arco y puntos de pegamento.',
      detalles: [['Incluye', '100 globos (5", 10" y 12"), 5 m de cinta y 1 rollo de puntos de pegamento'], ['Largo aproximado', '2.5 a 3 m']],
      variantes: [{
        nombre: 'Paleta',
        opciones: [
          { nombre: 'Rosa y dorado', dibujo: { colores: ['#ff7eb6', '#ffc8dd', '#d4a72c', '#f1edf1'] } },
          { nombre: 'Azul y plata', dibujo: { colores: ['#1f3fbf', '#7cc6fe', '#b8bfc9', '#f1edf1'] } },
          { nombre: 'Pastel arcoíris', dibujo: { colores: ['#ffc8dd', '#bde0fe', '#fff3b0', '#9ee6c9', '#d9c5ff'] } },
          { nombre: 'Salvia y blanco', dibujo: { colores: ['#a3b18a', '#dad7cd', '#f1edf1', '#e9d8a6'] } },
          { nombre: 'Negro y dorado', dibujo: { colores: ['#2b2b2e', '#d4a72c', '#f1edf1'] } }
        ]
      }],
      dibujo: { tipo: 'latex', forma: 'arco' }, etiquetas: 'kit arco organico guirnalda decoracion set', destacado: true, nuevo: true
    },
    {
      id: 'inflador-manual-doble-accion', nombre: 'Inflador manual de doble acción', categoria: 'globos-latex',
      tematicas: [],
      precio: 85, mayoreo: { min: 6, precio: 72 }, unidad: 'pieza', peso: 320,
      descripcion: 'Infla al subir y al bajar, así terminas el doble de rápido. Sirve para látex, globos 260 y foil con aire.',
      detalles: [['Largo', '30 cm'], ['Uso', 'Látex, 260 y foil chico'], ['Incluye', 'Boquilla para globo 260']],
      variantes: [colores(['azul', 'rosa', 'morado'])],
      dibujo: { tipo: 'inflador' }, etiquetas: 'inflador bomba accesorio herramienta'
    },
    {
      id: 'cinta-para-arco-5m', nombre: 'Cinta para arco de globos, 5 m', categoria: 'globos-latex',
      tematicas: [],
      precio: 25, mayoreo: { min: 12, precio: 19 }, unidad: 'rollo de 5 m', peso: 35,
      descripcion: 'Tira de plástico con orificios para insertar los nudos de los globos y armar arcos y guirnaldas sin pegamento.',
      detalles: [['Largo', '5 m'], ['Material', 'PVC transparente']],
      dibujo: { tipo: 'cintaArco', color: '#8ccbe8' }, etiquetas: 'cinta arco tira accesorio guirnalda'
    },

    /* ---------------- PAPELERÍA ---------------- */
    {
      id: 'papel-china-50-pliegos', nombre: 'Papel china, paquete 50 pliegos', categoria: 'papeleria',
      tematicas: ['fiestas-patrias', 'navidad', 'cumpleanos', 'infantil'],
      precio: 65, mayoreo: { min: 5, precio: 55 }, unidad: 'paquete con 50 pliegos', peso: 330,
      descripcion: 'Papel de china para piñatas, papel picado, flores, borlas y manualidades. Paquete de 50 pliegos de un solo color.',
      detalles: [['Medida del pliego', '50 × 75 cm'], ['Contenido', '50 pliegos']],
      variantes: [colores(['rosa', 'fucsia', 'rojo', 'naranja', 'amarillo', 'verdeBandera', 'verdeLimon', 'azulCielo', 'azulRey', 'morado', 'blanco', 'negro'])],
      dibujo: { tipo: 'papelChina', etiqueta: '50 pliegos' }, etiquetas: 'papel china piñata manualidades pliegos', destacado: true
    },
    {
      id: 'papel-crepe-pliego', nombre: 'Papel crepé, pliego 50 × 200 cm', categoria: 'papeleria',
      tematicas: ['infantil', 'fiestas-patrias', 'navidad'],
      precio: 9, mayoreo: { min: 20, precio: 7 }, unidad: 'pliego', peso: 35,
      descripcion: 'Papel crepé elástico para flores, disfraces, cortinas y forrar mesas.',
      detalles: [['Medida', '50 × 200 cm'], ['Textura', 'Corrugado elástico']],
      variantes: [colores(['rojo', 'rosa', 'amarillo', 'verde', 'azul', 'morado', 'naranja', 'blanco', 'negro'])],
      dibujo: { tipo: 'crepe' }, etiquetas: 'papel crepe crepé flores disfraz manualidades'
    },
    {
      id: 'cartulina-pliego', nombre: 'Cartulina, pliego 50 × 65 cm', categoria: 'papeleria',
      tematicas: [],
      precio: 8, mayoreo: { min: 25, precio: 6 }, unidad: 'pliego', peso: 65,
      descripcion: 'Cartulina de colores para letreros, carteles, tareas y manualidades.',
      detalles: [['Medida', '50 × 65 cm'], ['Gramaje', '180 g/m² aprox.']],
      variantes: [colores(['amarillo', 'rosa', 'rojo', 'verde', 'azulCielo', 'azulRey', 'naranja', 'morado', 'blanco', 'negro'])],
      dibujo: { tipo: 'cartulina' }, etiquetas: 'cartulina carteles letrero escolar'
    },
    {
      id: 'papel-picado-plastico-5m', nombre: 'Papel picado de plástico, tira 5 m', categoria: 'papeleria',
      tematicas: ['navidad', 'fiestas-patrias', 'bodas', 'xv-anos', 'cumpleanos'],
      precio: 45, mayoreo: { min: 10, precio: 38 }, unidad: 'tira de 5 m', peso: 80,
      descripcion: 'Papel picado de plástico resistente al aire y la lluvia, para posadas, patios y salones. Tira de 5 metros con 10 pliegos.',
      detalles: [['Largo', '5 m con 10 pliegos'], ['Material', 'Plástico, se puede reusar']],
      variantes: [{
        nombre: 'Diseño',
        opciones: [
          { nombre: 'Multicolor', dibujo: { colores: ['#e4007c', '#ff8c00', '#00a6a6', '#7b2cbf'] } },
          { nombre: 'Navidad', dibujo: { colores: ['#c8102e', '#1b7f4b', '#d4a72c', '#e9e4ea'] } },
          { nombre: 'Tricolor', dibujo: { colores: ['#0b7a3b', '#e9e4ea', '#c8102e', '#0b7a3b'] } },
          { nombre: 'Blanco y dorado', dibujo: { colores: ['#e9e4ea', '#d4a72c', '#e9e4ea', '#d4a72c'] } }
        ]
      }],
      dibujo: { tipo: 'papelPicado' }, etiquetas: 'papel picado plastico posada navidad fiestas patrias', destacado: true
    },
    {
      id: 'banderin-feliz-cumpleanos', nombre: 'Banderín "Feliz Cumpleaños", 2.5 m', categoria: 'papeleria',
      tematicas: ['cumpleanos', 'infantil'],
      precio: 40, mayoreo: { min: 10, precio: 32 }, unidad: 'pieza', peso: 60,
      descripcion: 'Guirnalda de banderines con la frase "Feliz Cumpleaños", ya armada con cordón.',
      detalles: [['Largo', '2.5 m'], ['Material', 'Cartulina gruesa']],
      variantes: [{
        nombre: 'Color',
        opciones: [
          { nombre: 'Dorado', dibujo: { colores: ['#d4a72c'], estilo: 'metal' } },
          { nombre: 'Multicolor', dibujo: { colores: ['#ff5d8f', '#ffd23f', '#3ec1d3', '#7bd389', '#9b5de5'] } },
          { nombre: 'Rosa', dibujo: { colores: ['#ff7eb6', '#ffc8dd'] } },
          { nombre: 'Azul', dibujo: { colores: ['#2f6fdf', '#7cc6fe'] } }
        ]
      }],
      dibujo: { tipo: 'banderin', texto: 'FELIZ' }, etiquetas: 'banderin guirnalda letrero feliz cumpleaños'
    },
    {
      id: 'invitaciones-paquete-10', nombre: 'Invitaciones con sobre, paquete 10', categoria: 'papeleria',
      tematicas: ['cumpleanos', 'infantil', 'baby-shower', 'xv-anos', 'bodas'],
      precio: 45, mayoreo: { min: 10, precio: 38 }, unidad: 'paquete con 10 invitaciones', peso: 120,
      descripcion: 'Invitaciones impresas para llenar a mano, con sobre. Elige el diseño de tu evento.',
      detalles: [['Medida', '10 × 15 cm'], ['Contenido', '10 invitaciones y 10 sobres']],
      variantes: [{
        nombre: 'Diseño',
        opciones: [
          { nombre: 'Cumpleaños infantil', color: '#21a6b8', dibujo: { texto: 'Mi|cumple' } },
          { nombre: 'Baby shower', color: '#6aaed6', dibujo: { texto: 'Baby|shower' } },
          { nombre: 'XV años', color: '#a35bdc', dibujo: { texto: 'Mis|XV años' } },
          { nombre: 'Boda', color: '#c19a2e', dibujo: { texto: 'Nuestra|boda' } }
        ]
      }],
      dibujo: { tipo: 'invitacion' }, etiquetas: 'invitaciones invitacion sobre tarjetas'
    },
    {
      id: 'foami-carta-10', nombre: 'Foami tamaño carta, paquete 10 hojas', categoria: 'papeleria',
      tematicas: ['infantil'],
      precio: 35, mayoreo: { min: 10, precio: 29 }, unidad: 'paquete con 10 hojas', peso: 110,
      descripcion: 'Hojas de foami de 2 mm para manualidades, letreros y decoración escolar.',
      detalles: [['Medida', 'Carta (21.5 × 28 cm)'], ['Grosor', '2 mm'], ['Contenido', '10 hojas']],
      variantes: [colores(['rojo', 'rosa', 'amarillo', 'verde', 'azul', 'morado', 'naranja', 'blanco', 'negro', 'cafe'])],
      dibujo: { tipo: 'foami', etiqueta: '10 hojas' }, etiquetas: 'foami fomi goma eva manualidades escolar'
    },
    {
      id: 'foami-diamantado-carta-5', nombre: 'Foami diamantado carta, paquete 5 hojas', categoria: 'papeleria',
      tematicas: ['xv-anos', 'navidad', 'infantil'],
      precio: 40, mayoreo: { min: 10, precio: 33 }, unidad: 'paquete con 5 hojas', peso: 90,
      descripcion: 'Foami con brillantina que no se cae. Para coronas, letreros y adornos con brillo.',
      detalles: [['Medida', 'Carta (21.5 × 28 cm)'], ['Contenido', '5 hojas']],
      variantes: [colores(['dorado', 'plateado', 'rosa', 'rojo', 'azul', 'morado', 'verde'])],
      dibujo: { tipo: 'foami', estilo: 'diamantado', etiqueta: '5 hojas' }, etiquetas: 'foami diamantado brillantina glitter escarchado'
    },
    {
      id: 'papel-metalico-pliego', nombre: 'Papel metálico, pliego 50 × 70 cm', categoria: 'papeleria',
      tematicas: ['navidad', 'graduacion'],
      precio: 12, mayoreo: { min: 20, precio: 9 }, unidad: 'pliego', peso: 30,
      descripcion: 'Papel con acabado espejo para forrar cajas, hacer moños y decorar fondos.',
      detalles: [['Medida', '50 × 70 cm'], ['Acabado', 'Metálico brillante']],
      variantes: [colores(['dorado', 'plateado', 'rojo', 'verde', 'azul', 'rosa'])],
      dibujo: { tipo: 'papelMetalico' }, etiquetas: 'papel metalico espejo lustre brillante'
    },
    {
      id: 'topper-feliz-cumple', nombre: 'Topper para pastel "Feliz Cumple"', categoria: 'papeleria',
      tematicas: ['cumpleanos'],
      precio: 25, mayoreo: { min: 12, precio: 19 }, unidad: 'pieza', peso: 15,
      descripcion: 'Adorno para pastel de cartulina metálica, con palitos para insertar.',
      detalles: [['Medida', '15 × 12 cm'], ['Material', 'Cartulina metálica']],
      variantes: [colores(['dorado', 'plateado', 'oroRosa', 'negro'])],
      dibujo: { tipo: 'topper' }, etiquetas: 'topper pastel adorno cake'
    },

    /* ---------------- ENVOLTURAS ---------------- */
    {
      id: 'papel-envolver-rollo-5m', nombre: 'Papel para envolver, rollo 70 cm × 5 m', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'infantil', 'baby-shower', 'navidad', 'amor', 'bodas'],
      precio: 45, mayoreo: { min: 10, precio: 38 }, unidad: 'rollo', peso: 260,
      descripcion: 'Papel para regalo en rollo con tubo de cartón. Alcanza para envolver de 8 a 10 regalos medianos.',
      detalles: [['Medida', '70 cm × 5 m'], ['Papel', 'Couché 60 g/m²']],
      variantes: [DISENOS_REGALO],
      dibujo: { tipo: 'rollo' }, etiquetas: 'papel envolver regalo rollo envoltura', destacado: true
    },
    {
      id: 'papel-envolver-pliegos-25', nombre: 'Papel para envolver, paquete 25 pliegos', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'infantil', 'baby-shower', 'navidad', 'amor', 'bodas'],
      precio: 120, mayoreo: { min: 4, precio: 105 }, unidad: 'paquete con 25 pliegos', peso: 950,
      descripcion: 'Pliegos para regalo del mismo diseño, ideales para tiendas y mesas de regalos.',
      detalles: [['Medida del pliego', '70 × 100 cm'], ['Contenido', '25 pliegos']],
      variantes: [DISENOS_REGALO],
      dibujo: { tipo: 'pliegos', etiqueta: '25 pliegos' }, etiquetas: 'papel envolver regalo pliegos mayoreo'
    },
    {
      id: 'papel-kraft-rollo-10m', nombre: 'Papel kraft, rollo 90 cm × 10 m', categoria: 'envolturas',
      tematicas: ['bodas', 'navidad'],
      precio: 95, mayoreo: { min: 5, precio: 82 }, unidad: 'rollo', peso: 1100,
      descripcion: 'Papel kraft natural para envolturas rústicas, manteles de mesa de postres y empaques.',
      detalles: [['Medida', '90 cm × 10 m'], ['Gramaje', '80 g/m²']],
      dibujo: { tipo: 'rollo', color: '#c49a6c', patron: 'fibras', colores: ['#8a6a45'] }, etiquetas: 'papel kraft estraza rustico empaque'
    },
    {
      id: 'mono-grande-bolsa-10', nombre: 'Moño grande para regalo, bolsa 10 pzas', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'navidad', 'bodas', 'amor'],
      precio: 55, mayoreo: { min: 6, precio: 46 }, unidad: 'bolsa con 10 piezas', peso: 70,
      descripcion: 'Moños de listón satinado ya armados, con adhesivo en la base.',
      detalles: [['Diámetro', '12 cm'], ['Contenido', '10 moños del mismo color']],
      variantes: [colores(['rojo', 'rosa', 'dorado', 'plateado', 'azul', 'morado', 'blanco', 'verde'])],
      dibujo: { tipo: 'mono', etiqueta: '10 pzas' }, etiquetas: 'moño moños regalo listón adhesivo'
    },
    {
      id: 'mono-estrella-bolsa-50', nombre: 'Moño estrella chico, bolsa 50 pzas', categoria: 'envolturas',
      tematicas: ['navidad', 'cumpleanos'],
      precio: 45, mayoreo: { min: 6, precio: 38 }, unidad: 'bolsa con 50 piezas', peso: 120,
      descripcion: 'Moño estrella metálico de 6 cm con adhesivo, para regalos pequeños y bolsas.',
      detalles: [['Diámetro', '6 cm'], ['Contenido', '50 moños']],
      variantes: [colores(['dorado', 'plateado', 'rojo', 'verde', 'azul', 'rosa'])],
      dibujo: { tipo: 'mono', forma: 'estrella', etiqueta: '50 pzas' }, etiquetas: 'moño estrella chico regalo metalico'
    },
    {
      id: 'liston-satinado-1in-20m', nombre: 'Listón satinado 1", rollo 20 m', categoria: 'envolturas',
      tematicas: ['bodas', 'xv-anos', 'navidad', 'amor'],
      precio: 28, mayoreo: { min: 12, precio: 22 }, unidad: 'rollo de 20 m', peso: 75,
      descripcion: 'Listón satinado de doble cara para moños, recuerdos, arreglos florales y envolturas.',
      detalles: [['Ancho', '1 in (2.5 cm)'], ['Largo', '20 m']],
      variantes: [colores(['rojo', 'rosa', 'fucsia', 'dorado', 'plateado', 'azulRey', 'azulCielo', 'verde', 'blanco', 'negro', 'morado', 'vino'])],
      dibujo: { tipo: 'liston' }, etiquetas: 'liston satinado moño cinta recuerdos'
    },
    {
      id: 'liston-rizar-100m', nombre: 'Listón para rizar, rollo 100 m', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'navidad'],
      precio: 35, mayoreo: { min: 12, precio: 28 }, unidad: 'rollo de 100 m', peso: 90,
      descripcion: 'Listón de rafia que se riza con tijera. Sirve para amarrar globos y decorar regalos.',
      detalles: [['Ancho', '3/16 in (5 mm)'], ['Largo', '100 m']],
      variantes: [colores(['rojo', 'rosa', 'dorado', 'plateado', 'azul', 'verde', 'morado', 'blanco'])],
      dibujo: { tipo: 'liston', estilo: 'rizado' }, etiquetas: 'liston rizar rafia globos amarrar'
    },
    {
      id: 'bolsa-regalo-mediana', nombre: 'Bolsa de regalo mediana 26 × 32 cm', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'infantil', 'baby-shower', 'navidad', 'amor', 'bodas'],
      precio: 18, mayoreo: { min: 12, precio: 14 }, unidad: 'pieza', peso: 75,
      descripcion: 'Bolsa de papel con asas de cordón y refuerzo en la base.',
      detalles: [['Medida', '26 × 32 × 12 cm'], ['Asas', 'Cordón']],
      variantes: [DISENOS_REGALO],
      dibujo: { tipo: 'bolsa' }, etiquetas: 'bolsa regalo mediana asas', destacado: true
    },
    {
      id: 'bolsa-regalo-grande', nombre: 'Bolsa de regalo grande 33 × 45 cm', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'infantil', 'baby-shower', 'navidad', 'amor', 'bodas'],
      precio: 26, mayoreo: { min: 12, precio: 21 }, unidad: 'pieza', peso: 120,
      descripcion: 'Bolsa grande para peluches, ropa y regalos voluminosos.',
      detalles: [['Medida', '33 × 45 × 15 cm'], ['Asas', 'Cordón']],
      variantes: [DISENOS_REGALO],
      dibujo: { tipo: 'bolsa' }, etiquetas: 'bolsa regalo grande asas peluche'
    },
    {
      id: 'bolsa-celofan-15x25-100', nombre: 'Bolsa de celofán 15 × 25 cm, paquete 100', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'infantil', 'navidad'],
      precio: 40, mayoreo: { min: 5, precio: 34 }, unidad: 'paquete con 100 bolsas', peso: 210,
      descripcion: 'Bolsitas transparentes para dulceros, aguinaldos de posada, galletas y recuerdos.',
      detalles: [['Medida', '15 × 25 cm'], ['Contenido', '100 bolsas']],
      dibujo: { tipo: 'bolsaCelofan', color: '#e5177e', etiqueta: '100 pzas' }, etiquetas: 'bolsa celofan dulcero dulces aguinaldo posada galletas recuerdos'
    },
    {
      id: 'celofan-rollo-1x20m', nombre: 'Papel celofán, rollo 1 × 20 m', categoria: 'envolturas',
      tematicas: ['navidad', 'amor'],
      precio: 85, mayoreo: { min: 5, precio: 74 }, unidad: 'rollo', peso: 600,
      descripcion: 'Celofán para envolver canastas, arcones, arreglos y ramos.',
      detalles: [['Medida', '1 × 20 m'], ['Calibre', 'Grueso, no se rompe al doblar']],
      variantes: [{
        nombre: 'Color', tipo: 'color',
        opciones: [
          { nombre: 'Transparente', color: '#a8d8f0' }, { nombre: 'Rojo', color: '#e63946' },
          { nombre: 'Rosa', color: '#ff7eb6' }, { nombre: 'Azul', color: '#2f6fdf' }, { nombre: 'Verde', color: '#1f9d55' }
        ]
      }],
      dibujo: { tipo: 'celofan' }, etiquetas: 'celofan rollo canasta arcon arreglo transparente'
    },
    {
      id: 'caja-regalo-set-3', nombre: 'Cajas de regalo con tapa, set de 3', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'navidad', 'amor', 'bodas'],
      precio: 85, mayoreo: { min: 6, precio: 72 }, unidad: 'set de 3 cajas', peso: 650,
      descripcion: 'Tres cajas rígidas con tapa que se guardan una dentro de otra. Incluyen listón decorativo.',
      detalles: [['Medidas', '25 × 25, 20 × 20 y 15 × 15 cm'], ['Material', 'Cartón rígido forrado']],
      variantes: [colores(['rojo', 'kraft', 'blanco', 'rosa', 'negro', 'azulRey'])],
      dibujo: { tipo: 'cajas' }, etiquetas: 'caja cajas regalo tapa set'
    },
    {
      id: 'papel-seda-24-hojas', nombre: 'Papel seda para regalo, paquete 24 hojas', categoria: 'envolturas',
      tematicas: ['cumpleanos', 'baby-shower', 'bodas'],
      precio: 35, mayoreo: { min: 10, precio: 29 }, unidad: 'paquete con 24 hojas', peso: 130,
      descripcion: 'Papel seda delgado para acomodar dentro de bolsas y cajas de regalo.',
      detalles: [['Medida', '50 × 70 cm'], ['Contenido', '24 hojas']],
      variantes: [colores(['rosaPastel', 'rosa', 'rojo', 'dorado', 'azulCielo', 'lila', 'blanco', 'negro'])],
      dibujo: { tipo: 'papelChina', etiqueta: '24 hojas' }, etiquetas: 'papel seda tissue relleno bolsa regalo'
    },
    {
      id: 'relleno-viruta-papel-100g', nombre: 'Relleno de viruta de papel, 100 g', categoria: 'envolturas',
      tematicas: ['navidad', 'amor', 'bodas'],
      precio: 30, mayoreo: { min: 10, precio: 25 }, unidad: 'bolsa de 100 g', peso: 110,
      descripcion: 'Papel triturado para canastas, cajas de regalo y arcones navideños.',
      detalles: [['Contenido', '100 g'], ['Material', 'Papel reciclado']],
      variantes: [colores(['kraft', 'blanco', 'rosa', 'rojo', 'dorado', 'negro', 'verde', 'azul'])],
      dibujo: { tipo: 'viruta' }, etiquetas: 'viruta relleno papel triturado canasta arcon'
    }
  ];
})();
