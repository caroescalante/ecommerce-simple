// DATOS DE EJEMPLO. Se usan solo mientras no exista VITE_API_URL.
// La forma de cada producto es la misma que devolverá la API (ver docs/BACKEND.md).
const raw = {
  promociones: [
    ['2x1 Cerveza lata 473 ml', 3800], ['Pack x6 gaseosa 2.25 L', 11900], ['Fernet 750 ml + Coca 2.25 L', 18500, 30],
    ['Vodka 700 ml + Energizante x2', 14900, 0],
  ],
  combos: [
    ['Combo Previa: vodka + 2 energizantes + hielo', 19800], ['Combo Cerveza: pack x12 latas + hielo', 21500],
    ['Combo Fernet: fernet 750 ml + 2 gaseosas + hielo', 24900], ['Combo Aperitivo: aperitivo + soda + hielo', 16700],
  ],
  agua: [['Agua sin gas 2 L', 1500], ['Agua con gas 2 L', 1600], ['Agua sin gas 500 ml', 900], ['Pack agua sin gas 6 x 2 L', 8200], ['Bidón agua 6.5 L', 3100]],
  'agua-saborizada': [['Agua saborizada pomelo 1.5 L', 1900], ['Agua saborizada manzana 1.5 L', 1900], ['Agua saborizada naranja 500 ml', 1100], ['Agua saborizada limonada 1.5 L', 2000]],
  vodka: [['Vodka 700 ml', 8900], ['Vodka saborizado durazno 700 ml', 9400], ['Vodka premium 750 ml', 15800], ['Vodka 1 L', 12100]],
  aperitivos: [['Aperitivo amargo 750 ml', 7800], ['Aperitivo bitter 1 L', 9900], ['Fernet 750 ml', 11200], ['Gancia 950 ml', 6500], ['Campari 750 ml', 13400]],
  cerveza: [['Cerveza rubia lata 473 ml', 1900], ['Cerveza rubia botella 1 L', 3200], ['Cerveza negra lata 473 ml', 2100], ['Pack x12 latas 473 ml', 21000], ['Cerveza IPA lata 473 ml', 2500]],
  gaseosas: [['Gaseosa cola 2.25 L', 3300], ['Gaseosa lima limón 2.25 L', 3200], ['Gaseosa naranja 2.25 L', 3200], ['Gaseosa cola lata 354 ml', 1300], ['Gaseosa cola zero 1.5 L', 2700]],
  energizantes: [['Energizante lata 473 ml', 2600], ['Energizante sin azúcar 473 ml', 2700], ['Energizante pack x4', 9800], ['Bebida isotónica 500 ml', 1700]],
  golosinas: [['Alfajor triple', 1300], ['Chocolate con leche 100 g', 2200], ['Caramelos masticables x1', 800], ['Chicles menta x12', 1000], ['Papas fritas 120 g', 2400], ['Maní salado 150 g', 1800]],
  cigarrillos: [['Cigarrillos box x20', 3600], ['Cigarrillos suaves x20', 3500], ['Cigarrillos mentolados x20', 3700], ['Papel de armar', 1100]],
  hielo: [['Bolsa de hielo 2 kg', 1800], ['Bolsa de hielo 5 kg', 3900], ['Hielo en cubos 10 kg', 6800]],
};

let id = 0;
const products = Object.entries(raw).flatMap(([categorySlug, list]) =>
  list.map(([name, price, stock = 50]) => ({
    id: ++id, name, description: '', price, imageUrl: null, categorySlug, stock, isActive: true,
  })),
);

export default products;
