/* =====================================================================
   CARTAS DE COLORES DE MARCA
   Tonos tomados de la carta de colores de la tienda (fotos del muestrario).
   En la hoja de productos, columna "Colores", se pueden usar así:
     Carta Sempertex          todos los tonos
     Sempertex Reflex         solo una familia (Fashion, Pastel Mate, Neón,
                              Pastel Dusk, Satín, Silk, Metálico, Reflex)
     015, 041, 390            tonos sueltos por su código
   Cada tono: [código, nombre, nombre en inglés, color en pantalla].
   El color en pantalla es aproximado; el tono real es el del muestrario.
   ===================================================================== */
window.CARTAS = {
  sempertex: {
    nombre: 'Sempertex',
    logo: 'img/marcas/sempertex.webp', logoAncho: 554, logoAlto: 180,
    familias: [
      {
        id: 'fashion', nombre: 'Fashion', acabado: 'mate',
        descripcion: 'Colores sólidos y opacos.',
        tonos: [
        ['005', 'Blanco', 'White', '#f5f3ee'],
        ['009', 'Rosado', 'Pink', '#df97b5'],
        ['010', 'Palo de Rosa', 'Rosewood', '#b57981'],
        ['012', 'Fucsia', 'Fuchsia', '#dd3f84'],
        ['014', 'Frambuesa', 'Raspberry', '#c42a52'],
        ['015', 'Rojo', 'Red', '#d9252f'],
        ['016', 'Rojo Imperial', 'Imperial Red', '#8a2d38'],
        ['018', 'Merlot', 'Merlot', '#5a2a35'],
        ['020', 'Amarillo', 'Yellow', '#f5d914'],
        ['021', 'Amarillo Miel', 'Honey Yellow', '#e4a83a'],
        ['023', 'Mostaza', 'Mustard', '#d19b40'],
        ['027', 'Eucalipto', 'Eucalyptus', '#83976a'],
        ['029', 'Verde Trébol', 'Shamrock Green', '#1c9849'],
        ['030', 'Verde', 'Green', '#31ae76'],
        ['031', 'Verde Lima', 'Lime Green', '#7ac345'],
        ['032', 'Verde Bosque', 'Forest Green', '#1f6548'],
        ['035', 'Turquesa Profundo', 'Deep Teal', '#234c5e'],
        ['037', 'Aguamarina', 'Aquamarine', '#53a6a5'],
        ['038', 'Azul Caribe', 'Caribbean Blue', '#34a1b3'],
        ['040', 'Azul', 'Blue', '#1e9fea'],
        ['041', 'Azul Rey', 'Royal Blue', '#213da5'],
        ['044', 'Azul Naval', 'Navy Blue', '#1e2545'],
        ['050', 'Lila', 'Lilac', '#a181c8'],
        ['051', 'Violeta', 'Violet', '#453d9f'],
        ['056', 'Orquídea Morada', 'Purple Orchid', '#85357c'],
        ['059', 'Coral Tropical', 'Tropical Coral', '#d96a77'],
        ['060', 'Durazno', 'Peach Blush', '#e7a785'],
        ['061', 'Naranja', 'Orange', '#db5f42'],
        ['062', 'Naranja Cobrizo', 'Sunset Orange', '#b35545'],
        ['071', 'Arena', 'White Sand', '#c9b391'],
        ['073', 'Latte', 'Latte', '#ae834c'],
        ['074', 'Café', 'Coffee', '#6e4b3f'],
        ['076', 'Chocolate', 'Chocolate', '#4a3530'],
        ['080', 'Negro', 'Black', '#1c1d24'],
        ['081', 'Gris', 'Grey', '#98989f'],
        ['390', 'Transparente', 'Clear', '#dfe8ee']
        ]
      },
      {
        id: 'pastel-mate', nombre: 'Pastel Mate', acabado: 'mate',
        descripcion: 'Tonos pastel suaves, sin brillo.',
        tonos: [
        ['609', 'Rosado', 'Pink', '#e6ccd1'],
        ['620', 'Amarillo', 'Yellow', '#ebe99c'],
        ['630', 'Verde', 'Green', '#acd5c3'],
        ['640', 'Azul', 'Blue', '#7bb9e6'],
        ['650', 'Lila', 'Lilac', '#cab9da'],
        ['660', 'Durazno Malibú', 'Malibu Peach', '#dbb18c'],
        ['663', 'Melón', 'Melon', '#cba89c']
        ]
      },
      {
        id: 'neon', nombre: 'Neón', acabado: 'neon',
        descripcion: 'Colores fluorescentes muy intensos.',
        tonos: [
        ['212', 'Fucsia', 'Fuchsia', '#ec2a7f'],
        ['220', 'Amarillo', 'Yellow', '#e2ec1a'],
        ['230', 'Verde', 'Green', '#48c22a'],
        ['240', 'Azul', 'Blue', '#2563d4'],
        ['261', 'Naranja', 'Orange', '#ff5a2a']
        ]
      },
      {
        id: 'pastel-dusk', nombre: 'Pastel Dusk', acabado: 'mate',
        descripcion: 'Pastel con un toque grisáceo, estilo vintage.',
        tonos: [
        ['107', 'Crema', 'Cream', '#bdb1a1'],
        ['110', 'Rosa', 'Rose', '#bca4a2'],
        ['126', 'Té Verde', 'Green Tea', '#8fc29d'],
        ['140', 'Azul', 'Blue', '#627d92'],
        ['150', 'Lavanda', 'Lavender', '#8a7193']
        ]
      },
      {
        id: 'satin', nombre: 'Satín', acabado: 'perlado',
        descripcion: 'Brillo perlado suave.',
        tonos: [
        ['405', 'Blanco', 'White', '#f2f0ea'],
        ['406', 'Perla', 'Pearl', '#ebe5d8'],
        ['409', 'Rosado', 'Pink', '#dc7eae'],
        ['430', 'Verde', 'Green', '#9ebb85'],
        ['440', 'Azul', 'Blue', '#98c3d3'],
        ['450', 'Lila', 'Lilac', '#ab86c4'],
        ['481', 'Plata', 'Silver', '#b8babf']
        ]
      },
      {
        id: 'silk', nombre: 'Silk', acabado: 'perlado',
        descripcion: 'Acabado nacarado, como seda.',
        tonos: [
        ['806', 'Blanco Nácar', 'Oyster White', '#ece8de'],
        ['809', 'Rosa Primaveral', 'Pink Blossom', '#a88d99'],
        ['826', 'Verde Menta', 'Cool Mint', '#76a09c'],
        ['839', 'Azul Ártico', 'Arctic Blue', '#6c86a4'],
        ['850', 'Amatista', 'Light Amethyst', '#8c80ae'],
        ['870', 'Dorado', 'Gold Dust', '#b39a72'],
        ['873', 'Perla Crema', 'Cream Pearl', '#dcd5c1']
        ]
      },
      {
        id: 'metalico', nombre: 'Metálico', acabado: 'perlado',
        descripcion: 'Brillo metálico.',
        tonos: [
        ['512', 'Fucsia', 'Fuchsia', '#cf3868'],
        ['515', 'Rojo', 'Red', '#c62f2c'],
        ['530', 'Verde', 'Green', '#1f8a44'],
        ['540', 'Azul', 'Blue', '#1f4fbf'],
        ['568', 'Dorado Rosa', 'Rose Gold', '#e1917e'],
        ['570', 'Dorado', 'Gold', '#cf994e'],
        ['580', 'Negro', 'Black', '#24262a']
        ]
      },
      {
        id: 'reflex', nombre: 'Reflex', acabado: 'cromo',
        descripcion: 'Efecto espejo, tipo cromo.',
        tonos: [
        ['909', 'Rosado', 'Pink', '#a8778a'],
        ['912', 'Fucsia', 'Fuchsia', '#93307a'],
        ['915', 'Cristal Rojo', 'Crystal Red', '#a8302d'],
        ['931', 'Verde Lima', 'Lime Green', '#84a23a'],
        ['932', 'Verde Aurora', 'Aurora Green', '#1e8466'],
        ['940', 'Azul', 'Blue', '#2d6d9b'],
        ['951', 'Violeta', 'Violet', '#6745b3'],
        ['968', 'Dorado Rosa', 'Rose Gold', '#b0644f'],
        ['970', 'Dorado', 'Gold', '#a3843c'],
        ['971', 'Champaña', 'Champagne', '#b5a38c'],
        ['981', 'Plata', 'Silver', '#b2b4b2']
        ]
      }
    ]
  }
};
