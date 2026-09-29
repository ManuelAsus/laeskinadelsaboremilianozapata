import { db } from '../../js/firebase-config.js';
import { collection, doc, setDoc, getDocs, deleteDoc, query } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function createSectionImageDataUrl(sectionTitle, bgColor) {
    const sanitizedTitle = sectionTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="400" height="280">
  <rect width="100%" height="100%" rx="28" ry="28" fill="${bgColor}" />
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.35)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.1)" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <text x="50%" y="42%" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="700">${sanitizedTitle}</text>
    <text x="50%" y="62%" text-anchor="middle" fill="#f2f2f2" font-family="Arial, sans-serif" font-size="18">La Eskina del Sabor</text>
</svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Colores por sección para generar imágenes de producto
const SECTION_COLORS = {
    'Hamburguesas': '#634115',
    'Baguettes': '#934b14',
    'Bebidas': '#41450d',
    'Pizzas': '#232418',
    'Especialidades': '#838470'
};

function createProductImageDataUrl(productName, bgColor) {
    const sanitized = productName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="400" height="280">
  <rect width="100%" height="100%" rx="28" ry="28" fill="${bgColor}" />
  <text x="50%" y="54%" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="700">${sanitized}</text>
</svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

const PIZZA_SIZE_VARIANTS = ['Personal', 'Chica', 'Mediana', 'Grande', 'Familiar', 'Jumbo'];

const PIZZA_PRICE_GROUPS = {
    clasica: [100, 125, 185, 230, 280, 330],
    combinadas: [110, 135, 200, 250, 300, 370],
    carne: [125, 145, 220, 270, 330, 420]
};

function getPizzaPriceGroup(productName) {
    const lower = productName.toLowerCase();
    if (/\b(más hawaiana|mas hawaiana|mexicana|delizzia pepper|especialidad de carnes|ranchera|alambre|pastor|argentina|asada especial)\b/.test(lower)) {
        return 'carne';
    }
    if (/\b(italiana|veneciana)\b/.test(lower)) {
        return 'combinadas';
    }
    if (/\b(hawaiana|peperoni|cuatro quesos|vegetariana)\b/.test(lower)) {
        return 'clasica';
    }
    return 'clasica';
}

function getPizzaBaseName(productName) {
    return productName
        .replace(/^pizza\s+/i, '')
        .replace(/\s+(mini|personal|chica|mediana|grande|familiar|jumbo)$/i, '')
        .trim();
}

function getPizzaSizeIndex(productName) {
    const lower = productName.toLowerCase();
    if (/\b(mini|personal)\b/.test(lower)) return 0;
    if (/\bchica\b/.test(lower)) return 1;
    if (/\bmediana\b/.test(lower)) return 2;
    if (/\bgrande\b/.test(lower)) return 3;
    if (/\bfamiliar\b/.test(lower)) return 4;
    if (/\bjumbo\b/.test(lower)) return 5;
    return -1;
}

const SECTION_IMAGES = {
    'Hamburguesas': createSectionImageDataUrl('Hamburguesas', '#634115'),
    'Baguettes': createSectionImageDataUrl('Baguettes', '#934b14'),
    'Bebidas': createSectionImageDataUrl('Bebidas', '#41450d'),
    'Pizzas': createSectionImageDataUrl('Pizzas', '#232418'),
    'Especialidades': createSectionImageDataUrl('Especialidades', '#838470'),
};

function getImageBySection(section) {
    return SECTION_IMAGES[section] || createSectionImageDataUrl('La Eskina del Sabor', '#934b14');
}

const MENU_PRODUCTS = [
    // HAMBURGUESAS
    { seccion: 'Hamburguesas', nombre: 'Hamburguesa Clásica Artesanal', categoria: 'comidas', precio: 110, ingredientes: 'Carne de res, lechuga, tomate, jamón, queso amarillo, tocino, cebolla, pepinillos.', stock: 40 },
    { seccion: 'Hamburguesas', nombre: 'Hamburguesa Mexicana', categoria: 'comidas', precio: 125, ingredientes: 'Carne de res, chorizo, salchicha para asar, cebolla, queso de hebra, picante, lechuga.', stock: 40 },
    { seccion: 'Hamburguesas', nombre: 'Hamburguesa Milanesa de Pollo Empanizada', categoria: 'comidas', precio: 125, ingredientes: 'Milanesa de pollo, lechuga, tomate, aguacate, mix de quesos, pepinillos.', stock: 40 },
    { seccion: 'Hamburguesas', nombre: 'Hamburguesa Texana', categoria: 'comidas', precio: 125, ingredientes: 'Carne de res, tocino, aros de cebolla, lechuga, tomate, salsa barbecue, mix de quesos.', stock: 40 },
    { seccion: 'Hamburguesas', nombre: 'Hamburguesa Hawaiana', categoria: 'comidas', precio: 125, ingredientes: 'Carne de res, lechuga, tomate, piña, cebolla, pepinillos, tocino, queso de hebra, jamón y mozzarella.', stock: 40 },
    
    // BAGUETTES
    { seccion: 'Baguettes', nombre: 'Baguette Napolitana', categoria: 'comidas', precio: 125, ingredientes: 'Milanesa de pollo empanizado, mozzarella, queso de hebra, salsa tomate, perejil, espinaca, champiñones y pesto de albahaca. Guarnición: papas a la francesa.', stock: 35 },
    { seccion: 'Baguettes', nombre: 'Baguette Milanesa de Pollo', categoria: 'comidas', precio: 120, ingredientes: 'Milanesa a la plancha o empanizada, jamón, lechuga, tomate, aguacate, cebolla caramelizada, pepino y queso panela. Guarnición: papas a la francesa.', stock: 35 },
    { seccion: 'Baguettes', nombre: 'Baguette Mexicano', categoria: 'comidas', precio: 125, ingredientes: 'Milanesa de res, jamón, queso de hebra, chorizo, cebolla, cilantro, guacamole y limón. Guarnición: papas a la francesa.', stock: 35 },
    { seccion: 'Baguettes', nombre: 'Baguette Pastor', categoria: 'comidas', precio: 120, ingredientes: 'Carne al pastor, cebolla caramelizada, queso de hebra, piña, guacamole y limón. Guarnición: papas a la francesa.', stock: 35 },
    { seccion: 'Baguettes', nombre: 'Baguette Vegetariano', categoria: 'comidas', precio: 110, ingredientes: 'Queso panela, lechuga, manzana, fresa, espinaca, arándanos, pepino. Guarnición: papas a la francesa.', stock: 35 },
    { seccion: 'Baguettes', nombre: 'Baguette Queso y Peperoni', categoria: 'comidas', precio: 115, ingredientes: 'Queso panela, de hebra, mozzarella y peperoni. Guarnición: papas a la francesa.', stock: 35 },
    
    // BEBIDAS NATURALES
    { seccion: 'Bebidas', nombre: 'Agua de Fresa con Limón', categoria: 'bebidas', precio: 35, ingredientes: 'Bebida natural refrescante.', stock: 60 },
    { seccion: 'Bebidas', nombre: 'Agua de Jamaica', categoria: 'bebidas', precio: 35, ingredientes: 'Bebida natural de jamaica.', stock: 60 },
    { seccion: 'Bebidas', nombre: 'Agua de Horchata', categoria: 'bebidas', precio: 35, ingredientes: 'Bebida natural de horchata.', stock: 60 },
    
    // BEBIDAS EMBOTELLADAS
    { seccion: 'Bebidas', nombre: 'Cocacola 600ml', categoria: 'bebidas', precio: 28, ingredientes: 'Cocacola embotellada 600ml.', stock: 80 },
    { seccion: 'Bebidas', nombre: 'Manzana Mundt 600ml', categoria: 'bebidas', precio: 28, ingredientes: 'Manzana Mundt embotellada 600ml.', stock: 80 },
    { seccion: 'Bebidas', nombre: 'Fanta Naranja', categoria: 'bebidas', precio: 28, ingredientes: 'Fanta naranja embotellada.', stock: 80 },
    { seccion: 'Bebidas', nombre: 'Agua Mineral', categoria: 'bebidas', precio: 28, ingredientes: 'Agua mineral embotellada.', stock: 80 },
    { seccion: 'Bebidas', nombre: 'Coca Cola 3L', categoria: 'bebidas', precio: 65, ingredientes: 'Coca Cola de 3 litros.', stock: 40 },
    { seccion: 'Bebidas', nombre: 'Pepsi 3L', categoria: 'bebidas', precio: 65, ingredientes: 'Pepsi de 3 litros.', stock: 40 },
    
    // BEBIDAS CALIENTES
    { seccion: 'Bebidas', nombre: 'Capuccino', categoria: 'bebidas', precio: 35, ingredientes: 'Café capuccino caliente.', stock: 50 },
    { seccion: 'Bebidas', nombre: 'Chocolate', categoria: 'bebidas', precio: 40, ingredientes: 'Chocolate caliente.', stock: 50 },
    
    // PIZZAS - HAWAIANA
    { seccion: 'Pizzas', nombre: 'Pizza Hawaiana Mini', categoria: 'comidas', precio: 95, ingredientes: 'Jamón, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Hawaiana Chica', categoria: 'comidas', precio: 115, ingredientes: 'Jamón, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Hawaiana Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Jamón, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Hawaiana Grande', categoria: 'comidas', precio: 235, ingredientes: 'Jamón, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Hawaiana Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Jamón, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Hawaiana Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Jamón, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Hawaiana Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Hawaiana Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Hawaiana Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Hawaiana Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Hawaiana Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Hawaiana Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Hawaiana Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Hawaiana Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Hawaiana Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Hawaiana Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Hawaiana Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Hawaiana Jumbo.', stock: 30 },
    
    // PIZZAS - PEPERONI
    { seccion: 'Pizzas', nombre: 'Pizza Peperoni Mini', categoria: 'comidas', precio: 95, ingredientes: 'Peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Peperoni Chica', categoria: 'comidas', precio: 115, ingredientes: 'Peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Peperoni Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Peperoni Grande', categoria: 'comidas', precio: 235, ingredientes: 'Peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Peperoni Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Peperoni Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Peperoni Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Peperoni Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Peperoni Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Peperoni Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Peperoni Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Peperoni Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Peperoni Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Peperoni Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Peperoni Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Peperoni Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Peperoni Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Peperoni Jumbo.', stock: 30 },
    
    // PIZZAS - VENECIANA
    { seccion: 'Pizzas', nombre: 'Pizza Veneciana Mini', categoria: 'comidas', precio: 95, ingredientes: 'Jamón, salchicha, jalapeños, cebolla, peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Veneciana Chica', categoria: 'comidas', precio: 115, ingredientes: 'Jamón, salchicha, jalapeños, cebolla, peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Veneciana Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Jamón, salchicha, jalapeños, cebolla, peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Veneciana Grande', categoria: 'comidas', precio: 235, ingredientes: 'Jamón, salchicha, jalapeños, cebolla, peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Veneciana Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Jamón, salchicha, jalapeños, cebolla, peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Veneciana Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Jamón, salchicha, jalapeños, cebolla, peperoni y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Veneciana Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Veneciana Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Veneciana Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Veneciana Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Veneciana Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Veneciana Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Veneciana Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Veneciana Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Veneciana Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Veneciana Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Veneciana Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Veneciana Jumbo.', stock: 30 },
    
    // PIZZAS - ITALIANA
    { seccion: 'Pizzas', nombre: 'Pizza Italiana Mini', categoria: 'comidas', precio: 95, ingredientes: 'Peperoni, champiñones, pimiento verde, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Italiana Chica', categoria: 'comidas', precio: 115, ingredientes: 'Peperoni, champiñones, pimiento verde, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Italiana Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Peperoni, champiñones, pimiento verde, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Italiana Grande', categoria: 'comidas', precio: 235, ingredientes: 'Peperoni, champiñones, pimiento verde, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Italiana Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Peperoni, champiñones, pimiento verde, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Italiana Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Peperoni, champiñones, pimiento verde, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Italiana Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Italiana Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Italiana Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Italiana Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Italiana Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Italiana Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Italiana Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Italiana Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Italiana Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Italiana Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Italiana Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Italiana Jumbo.', stock: 30 },
    
    // PIZZAS - VEGETARIANA
    { seccion: 'Pizzas', nombre: 'Pizza Vegetariana Mini', categoria: 'comidas', precio: 95, ingredientes: 'Champiñones, pimiento verde, elote, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Vegetariana Chica', categoria: 'comidas', precio: 115, ingredientes: 'Champiñones, pimiento verde, elote, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Vegetariana Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Champiñones, pimiento verde, elote, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Vegetariana Grande', categoria: 'comidas', precio: 235, ingredientes: 'Champiñones, pimiento verde, elote, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Vegetariana Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Champiñones, pimiento verde, elote, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Vegetariana Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Champiñones, pimiento verde, elote, cebolla, aceitunas negras y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Vegetariana Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Vegetariana Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Vegetariana Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Vegetariana Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Vegetariana Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Vegetariana Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Vegetariana Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Vegetariana Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Vegetariana Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Vegetariana Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Vegetariana Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Vegetariana Jumbo.', stock: 30 },
    
    // PIZZAS - RANCHERA
    { seccion: 'Pizzas', nombre: 'Pizza Ranchera Mini', categoria: 'comidas', precio: 95, ingredientes: 'Chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Ranchera Chica', categoria: 'comidas', precio: 115, ingredientes: 'Chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Ranchera Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Ranchera Grande', categoria: 'comidas', precio: 235, ingredientes: 'Chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Ranchera Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Ranchera Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Ranchera Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Ranchera Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Ranchera Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Ranchera Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Ranchera Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Ranchera Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Ranchera Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Ranchera Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Ranchera Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Ranchera Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Ranchera Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Ranchera Jumbo.', stock: 30 },
    
    // PIZZAS - CUATRO QUESOS
    { seccion: 'Pizzas', nombre: 'Pizza Cuatro Quesos Mini', categoria: 'comidas', precio: 95, ingredientes: 'Queso manchego, mozzarella, filadelfia y parmesano.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Cuatro Quesos Chica', categoria: 'comidas', precio: 115, ingredientes: 'Queso manchego, mozzarella, filadelfia y parmesano.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Cuatro Quesos Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Queso manchego, mozzarella, filadelfia y parmesano.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Cuatro Quesos Grande', categoria: 'comidas', precio: 235, ingredientes: 'Queso manchego, mozzarella, filadelfia y parmesano.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Cuatro Quesos Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Queso manchego, mozzarella, filadelfia y parmesano.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Cuatro Quesos Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Queso manchego, mozzarella, filadelfia y parmesano.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Cuatro Quesos Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Cuatro Quesos Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Cuatro Quesos Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Cuatro Quesos Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Cuatro Quesos Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Cuatro Quesos Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Cuatro Quesos Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Cuatro Quesos Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Cuatro Quesos Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Cuatro Quesos Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Cuatro Quesos Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Cuatro Quesos Jumbo.', stock: 30 },
    
    // PIZZAS - DELIZZIA PEPPER
    { seccion: 'Pizzas', nombre: 'Pizza Delizzia Pepper Mini', categoria: 'comidas', precio: 95, ingredientes: 'Salchicha italiana, cebolla morada, pimiento morrón, chorizo español, jalapeños y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Delizzia Pepper Chica', categoria: 'comidas', precio: 115, ingredientes: 'Salchicha italiana, cebolla morada, pimiento morrón, chorizo español, jalapeños y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Delizzia Pepper Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Salchicha italiana, cebolla morada, pimiento morrón, chorizo español, jalapeños y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Delizzia Pepper Grande', categoria: 'comidas', precio: 235, ingredientes: 'Salchicha italiana, cebolla morada, pimiento morrón, chorizo español, jalapeños y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Delizzia Pepper Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Salchicha italiana, cebolla morada, pimiento morrón, chorizo español, jalapeños y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Delizzia Pepper Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Salchicha italiana, cebolla morada, pimiento morrón, chorizo español, jalapeños y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Delizzia Pepper Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Delizzia Pepper Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Delizzia Pepper Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Delizzia Pepper Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Delizzia Pepper Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Delizzia Pepper Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Delizzia Pepper Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Delizzia Pepper Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Delizzia Pepper Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Delizzia Pepper Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Delizzia Pepper Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Delizzia Pepper Jumbo.', stock: 30 },
    
    // PIZZAS - MEXICANA
    { seccion: 'Pizzas', nombre: 'Pizza Mexicana Mini', categoria: 'comidas', precio: 95, ingredientes: 'Carne asada, chorizo, elote, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Mexicana Chica', categoria: 'comidas', precio: 115, ingredientes: 'Carne asada, chorizo, elote, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Mexicana Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Carne asada, chorizo, elote, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Mexicana Grande', categoria: 'comidas', precio: 235, ingredientes: 'Carne asada, chorizo, elote, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Mexicana Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Carne asada, chorizo, elote, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Mexicana Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Carne asada, chorizo, elote, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Mexicana Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Mexicana Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Mexicana Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Mexicana Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Mexicana Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Mexicana Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Mexicana Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Mexicana Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Mexicana Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Mexicana Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Mexicana Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Mexicana Jumbo.', stock: 30 },
    
    // PIZZAS - MÁS HAWAIANA
    { seccion: 'Pizzas', nombre: 'Pizza Más Hawaiana Mini', categoria: 'comidas', precio: 95, ingredientes: 'Carne asada, jamón, piña, tocino, cebolla, jalapeño y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Más Hawaiana Chica', categoria: 'comidas', precio: 115, ingredientes: 'Carne asada, jamón, piña, tocino, cebolla, jalapeño y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Más Hawaiana Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Carne asada, jamón, piña, tocino, cebolla, jalapeño y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Más Hawaiana Grande', categoria: 'comidas', precio: 235, ingredientes: 'Carne asada, jamón, piña, tocino, cebolla, jalapeño y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Más Hawaiana Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Carne asada, jamón, piña, tocino, cebolla, jalapeño y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Más Hawaiana Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Carne asada, jamón, piña, tocino, cebolla, jalapeño y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Más Hawaiana Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Más Hawaiana Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Más Hawaiana Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Más Hawaiana Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Más Hawaiana Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Más Hawaiana Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Más Hawaiana Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Más Hawaiana Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Más Hawaiana Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Más Hawaiana Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Más Hawaiana Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Más Hawaiana Jumbo.', stock: 30 },
    
    // PIZZAS - ESPECIALIDAD DE CARNES
    { seccion: 'Pizzas', nombre: 'Pizza Especialidad de Carnes Mini', categoria: 'comidas', precio: 95, ingredientes: 'Carne asada de res y cerdo, chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Especialidad de Carnes Chica', categoria: 'comidas', precio: 115, ingredientes: 'Carne asada de res y cerdo, chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Especialidad de Carnes Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Carne asada de res y cerdo, chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Especialidad de Carnes Grande', categoria: 'comidas', precio: 235, ingredientes: 'Carne asada de res y cerdo, chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Especialidad de Carnes Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Carne asada de res y cerdo, chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Especialidad de Carnes Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Carne asada de res y cerdo, chorizo, tocino, jalapeños, cebolla y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Especialidad de Carnes Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Especialidad de Carnes Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Especialidad de Carnes Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Especialidad de Carnes Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Especialidad de Carnes Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Especialidad de Carnes Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Especialidad de Carnes Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Especialidad de Carnes Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Especialidad de Carnes Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Especialidad de Carnes Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Especialidad de Carnes Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Especialidad de Carnes Jumbo.', stock: 30 },
    
    // PIZZAS - ALAMBRE
    { seccion: 'Pizzas', nombre: 'Pizza Alambre Mini', categoria: 'comidas', precio: 95, ingredientes: 'Carne asada, chorizo argentino, tocino, cebolla, pimiento morrón y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Alambre Chica', categoria: 'comidas', precio: 115, ingredientes: 'Carne asada, chorizo argentino, tocino, cebolla, pimiento morrón y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Alambre Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Carne asada, chorizo argentino, tocino, cebolla, pimiento morrón y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Alambre Grande', categoria: 'comidas', precio: 235, ingredientes: 'Carne asada, chorizo argentino, tocino, cebolla, pimiento morrón y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Alambre Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Carne asada, chorizo argentino, tocino, cebolla, pimiento morrón y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Alambre Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Carne asada, chorizo argentino, tocino, cebolla, pimiento morrón y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Alambre Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Alambre Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Alambre Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Alambre Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Alambre Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Alambre Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Alambre Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Alambre Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Alambre Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Alambre Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Alambre Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Alambre Jumbo.', stock: 30 },
    
    // PIZZAS - PASTOR
    { seccion: 'Pizzas', nombre: 'Pizza Pastor Mini', categoria: 'comidas', precio: 95, ingredientes: 'Carne al pastor, piña, queso, cebolla y cilantro.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Pastor Chica', categoria: 'comidas', precio: 115, ingredientes: 'Carne al pastor, piña, queso, cebolla y cilantro.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Pastor Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Carne al pastor, piña, queso, cebolla y cilantro.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Pastor Grande', categoria: 'comidas', precio: 235, ingredientes: 'Carne al pastor, piña, queso, cebolla y cilantro.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Pastor Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Carne al pastor, piña, queso, cebolla y cilantro.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Pastor Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Carne al pastor, piña, queso, cebolla y cilantro.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Pastor Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Pastor Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Pastor Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Pastor Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Pastor Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Pastor Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Pastor Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Pastor Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Pastor Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Pastor Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Pastor Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Pastor Jumbo.', stock: 30 },
    
    // PIZZAS - ARGENTINA
    { seccion: 'Pizzas', nombre: 'Pizza Argentina Mini', categoria: 'comidas', precio: 95, ingredientes: 'Salchicha para asar, chistorra, chorizo argentino, champiñones, tocino, pimiento morrón, cebolla, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Argentina Chica', categoria: 'comidas', precio: 115, ingredientes: 'Salchicha para asar, chistorra, chorizo argentino, champiñones, tocino, pimiento morrón, cebolla, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Argentina Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Salchicha para asar, chistorra, chorizo argentino, champiñones, tocino, pimiento morrón, cebolla, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Argentina Grande', categoria: 'comidas', precio: 235, ingredientes: 'Salchicha para asar, chistorra, chorizo argentino, champiñones, tocino, pimiento morrón, cebolla, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Argentina Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Salchicha para asar, chistorra, chorizo argentino, champiñones, tocino, pimiento morrón, cebolla, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Argentina Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Salchicha para asar, chistorra, chorizo argentino, champiñones, tocino, pimiento morrón, cebolla, piña y queso.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Argentina Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Argentina Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Argentina Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Argentina Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Argentina Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Argentina Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Argentina Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Argentina Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Argentina Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Argentina Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Argentina Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Argentina Jumbo.', stock: 30 },
    
    // PIZZAS - ASADA ESPECIAL
    { seccion: 'Pizzas', nombre: 'Pizza Asada Especial Mini', categoria: 'comidas', precio: 95, ingredientes: 'Carne asada de res, cilantro, cebolla y piña.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Asada Especial Chica', categoria: 'comidas', precio: 115, ingredientes: 'Carne asada de res, cilantro, cebolla y piña.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Asada Especial Mediana', categoria: 'comidas', precio: 180, ingredientes: 'Carne asada de res, cilantro, cebolla y piña.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Asada Especial Grande', categoria: 'comidas', precio: 235, ingredientes: 'Carne asada de res, cilantro, cebolla y piña.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Asada Especial Familiar', categoria: 'comidas', precio: 275, ingredientes: 'Carne asada de res, cilantro, cebolla y piña.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Pizza Asada Especial Jumbo', categoria: 'comidas', precio: 310, ingredientes: 'Carne asada de res, cilantro, cebolla y piña.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Asada Especial Mini', categoria: 'comidas', precio: 25, ingredientes: 'Orilla o dedos de Pizza Asada Especial Mini.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Asada Especial Chica', categoria: 'comidas', precio: 30, ingredientes: 'Orilla o dedos de Pizza Asada Especial Chica.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Asada Especial Mediana', categoria: 'comidas', precio: 35, ingredientes: 'Orilla o dedos de Pizza Asada Especial Mediana.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Asada Especial Grande', categoria: 'comidas', precio: 40, ingredientes: 'Orilla o dedos de Pizza Asada Especial Grande.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Asada Especial Familiar', categoria: 'comidas', precio: 45, ingredientes: 'Orilla o dedos de Pizza Asada Especial Familiar.', stock: 30 },
    { seccion: 'Pizzas', nombre: 'Dedos Pizza Asada Especial Jumbo', categoria: 'comidas', precio: 50, ingredientes: 'Orilla o dedos de Pizza Asada Especial Jumbo.', stock: 30 },
    
    // OTRAS ESPECIALIDADES
    { seccion: 'Especialidades', nombre: 'Pan de Ajo', categoria: 'comidas', precio: 110, ingredientes: 'Pan de ajo artesanal.', stock: 40 },
    { seccion: 'Especialidades', nombre: 'Rollitos de Pastor', categoria: 'comidas', precio: 130, ingredientes: 'Rollitos rellenos de carne al pastor.', stock: 30 },
    { seccion: 'Especialidades', nombre: 'Rollitos de Asada', categoria: 'comidas', precio: 130, ingredientes: 'Rollitos rellenos de carne asada.', stock: 30 },
    { seccion: 'Especialidades', nombre: 'Rollitos de Jamón y Queso', categoria: 'comidas', precio: 130, ingredientes: 'Rollitos rellenos de jamón y queso.', stock: 30 },
    { seccion: 'Especialidades', nombre: 'Pizza Rectangular 32 Rebanadas', categoria: 'comidas', precio: 430, ingredientes: 'Pizza rectangular de 32 rebanadas para compartir.', stock: 15 },
];

async function deleteAllProductos() {
    const productosCollection = collection(db, 'productos');
    const q = query(productosCollection);
    const querySnapshot = await getDocs(q);
    let eliminados = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
        try {
            await deleteDoc(doc(productosCollection, docSnapshot.id));
            eliminados += 1;
            console.log(`✅ Producto eliminado: ${docSnapshot.id}`);
        } catch (error) {
            console.error(`❌ Error eliminando ${docSnapshot.id}:`, error);
        }
    }
    return eliminados;
}

async function bulkUploadProductos() {
    try {
        // Primero, eliminar todos los productos existentes
        console.log('Eliminando productos existentes...');
        const eliminados = await deleteAllProductos();
        console.log(`${eliminados} productos eliminados.`);
        
        // Luego, preparar y cargar los nuevos productos (incluye variantes de tamaño para pizzas)
        const productosCollection = collection(db, 'productos');
        let cargados = 0;

        const itemsToUpload = [];

        for (const item of MENU_PRODUCTS) {
            const itemCopy = { ...item };
            if (itemCopy.seccion === 'Pizzas' && !/^Dedos Pizza/i.test(itemCopy.nombre)) {
                itemCopy.nombre = itemCopy.nombre
                    .replace(/\bmini\b/gi, 'Personal')
                    .replace(/\s+/g, ' ')
                    .trim();

                const baseName = getPizzaBaseName(itemCopy.nombre);
                const group = getPizzaPriceGroup(baseName);
                const sizeIndex = getPizzaSizeIndex(itemCopy.nombre);
                if (sizeIndex >= 0) {
                    itemCopy.precio = PIZZA_PRICE_GROUPS[group]?.[sizeIndex] ?? itemCopy.precio;
                }
            }
            itemsToUpload.push(itemCopy);
        }

        for (const item of itemsToUpload) {
            try {
                const id = slugify(item.nombre);
                const imagen = createProductImageDataUrl(item.nombre, SECTION_COLORS[item.seccion] || '#934b14');
                const data = {
                    nombre: item.nombre,
                    categoria: item.categoria,
                    precio: item.precio,
                    ingredientes: item.ingredientes,
                    stock: item.stock,
                    seccion: item.seccion,
                    imagen,
                    creado: new Date()
                };
                await setDoc(doc(productosCollection, id), data);
                cargados += 1;
                console.log(`✅ Producto creado: ${item.nombre}`);
            } catch (error) {
                console.error(`❌ Error guardando ${item.nombre}:`, error);
            }
        }

        alert(`Carga finalizada: ${eliminados} eliminados y ${cargados} productos creados.`);
    } catch (error) {
        console.error('Error en carga masiva:', error);
        alert('Error: ' + error.message);
    }
}

window.bulkUploadProductos = bulkUploadProductos;
window.bulkUploadProductosFromMenu = bulkUploadProductos;
