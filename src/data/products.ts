// Stub data for products
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  expirationDate: string | null;
  isCombo: boolean;
  comboItems?: { productId: number; quantity: number }[];
}

export const categories = [
  "Yerba Mate",
  "Termos",
  "Guampas",
  "Hielo",
  "Bebidas",
  "Lácteos",
  "Snacks",
  "Accesorios",
  "Combos",
];

export const products: Product[] = [
  {
    id: 1,
    name: "Yerba Mate Pajarito 1kg",
    sku: "YRB-PAJ-1000",
    category: "Yerba Mate",
    costPrice: 35000,
    salePrice: 48000,
    stock: 45,
    minStock: 20,
    expirationDate: "2026-08-15",
    isCombo: false,
  },
  {
    id: 2,
    name: "Yerba Mate Pajarito 500g",
    sku: "YRB-PAJ-500",
    category: "Yerba Mate",
    costPrice: 18000,
    salePrice: 26000,
    stock: 5,
    minStock: 15,
    expirationDate: "2026-07-20",
    isCombo: false,
  },
  {
    id: 3,
    name: "Yerba Kurupí 1kg",
    sku: "YRB-KUR-1000",
    category: "Yerba Mate",
    costPrice: 32000,
    salePrice: 45000,
    stock: 38,
    minStock: 15,
    expirationDate: "2026-09-10",
    isCombo: false,
  },
  {
    id: 4,
    name: "Yerba Kurupí 500g",
    sku: "YRB-KUR-500",
    category: "Yerba Mate",
    costPrice: 17000,
    salePrice: 24000,
    stock: 22,
    minStock: 10,
    expirationDate: "2026-08-25",
    isCombo: false,
  },
  {
    id: 5,
    name: "Termo Stanley 1L Verde",
    sku: "TRM-STN-1000V",
    category: "Termos",
    costPrice: 180000,
    salePrice: 250000,
    stock: 8,
    minStock: 5,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 6,
    name: "Termo Stanley 1L Negro",
    sku: "TRM-STN-1000N",
    category: "Termos",
    costPrice: 180000,
    salePrice: 250000,
    stock: 6,
    minStock: 5,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 7,
    name: "Termo Lumilagro 1L",
    sku: "TRM-LUM-1000",
    category: "Termos",
    costPrice: 45000,
    salePrice: 68000,
    stock: 2,
    minStock: 5,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 8,
    name: "Guampa Cuero Tradicional",
    sku: "GMP-CUR-001",
    category: "Guampas",
    costPrice: 25000,
    salePrice: 42000,
    stock: 1,
    minStock: 3,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 9,
    name: "Guampa Artesanal Decorada",
    sku: "GMP-ART-001",
    category: "Guampas",
    costPrice: 35000,
    salePrice: 58000,
    stock: 4,
    minStock: 3,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 10,
    name: "Hielo Premium 5kg",
    sku: "HIE-PRE-5000",
    category: "Hielo",
    costPrice: 8000,
    salePrice: 15000,
    stock: 3,
    minStock: 10,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 11,
    name: "Hielo Picado 3kg",
    sku: "HIE-PIC-3000",
    category: "Hielo",
    costPrice: 5000,
    salePrice: 10000,
    stock: 12,
    minStock: 8,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 12,
    name: "Coca Cola 2L",
    sku: "BEB-COC-2000",
    category: "Bebidas",
    costPrice: 8000,
    salePrice: 12000,
    stock: 48,
    minStock: 20,
    expirationDate: "2026-06-30",
    isCombo: false,
  },
  {
    id: 13,
    name: "Sprite 2L",
    sku: "BEB-SPR-2000",
    category: "Bebidas",
    costPrice: 8000,
    salePrice: 12000,
    stock: 35,
    minStock: 15,
    expirationDate: "2026-06-28",
    isCombo: false,
  },
  {
    id: 14,
    name: "Agua Mineral 1.5L",
    sku: "BEB-AGU-1500",
    category: "Bebidas",
    costPrice: 3000,
    salePrice: 5500,
    stock: 60,
    minStock: 25,
    expirationDate: "2027-01-15",
    isCombo: false,
  },
  {
    id: 15,
    name: "Jugo Ades Naranja 1L",
    sku: "BEB-ADE-1000N",
    category: "Bebidas",
    costPrice: 6000,
    salePrice: 9500,
    stock: 12,
    minStock: 10,
    expirationDate: "2026-03-12",
    isCombo: false,
  },
  {
    id: 16,
    name: "Leche La Serenísima 1L",
    sku: "LAC-SER-1000",
    category: "Lácteos",
    costPrice: 4500,
    salePrice: 7000,
    stock: 24,
    minStock: 15,
    expirationDate: "2026-03-15",
    isCombo: false,
  },
  {
    id: 17,
    name: "Yogurt La Serenísima 190g",
    sku: "LAC-YOG-190",
    category: "Lácteos",
    costPrice: 3000,
    salePrice: 5000,
    stock: 8,
    minStock: 12,
    expirationDate: "2026-03-13",
    isCombo: false,
  },
  {
    id: 18,
    name: "Bombilla Acero Inox",
    sku: "ACC-BOM-001",
    category: "Accesorios",
    costPrice: 8000,
    salePrice: 15000,
    stock: 25,
    minStock: 10,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 19,
    name: "Bombilla Alpaca Premium",
    sku: "ACC-BOM-002",
    category: "Accesorios",
    costPrice: 25000,
    salePrice: 42000,
    stock: 10,
    minStock: 5,
    expirationDate: null,
    isCombo: false,
  },
  {
    id: 20,
    name: "Kit Tereré Completo",
    sku: "CMB-TER-001",
    category: "Combos",
    costPrice: 248000,
    salePrice: 350000,
    stock: 5,
    minStock: 3,
    expirationDate: null,
    isCombo: true,
    comboItems: [
      { productId: 5, quantity: 1 }, // Termo Stanley
      { productId: 3, quantity: 1 }, // Yerba Kurupí 1kg
      { productId: 10, quantity: 2 }, // Hielo Premium x2
      { productId: 9, quantity: 1 }, // Guampa Artesanal
      { productId: 18, quantity: 1 }, // Bombilla
    ],
  },
  {
    id: 21,
    name: "Kit Mate Básico",
    sku: "CMB-MAT-001",
    category: "Combos",
    costPrice: 78000,
    salePrice: 110000,
    stock: 8,
    minStock: 5,
    expirationDate: null,
    isCombo: true,
    comboItems: [
      { productId: 7, quantity: 1 }, // Termo Lumilagro
      { productId: 1, quantity: 1 }, // Yerba Pajarito 1kg
      { productId: 18, quantity: 1 }, // Bombilla
    ],
  },
];

// Helper functions
export function formatCurrency(amount: number): string {
  return `₲ ${amount.toLocaleString('es-PY')}`;
}

export function getStockStatus(stock: number, minStock: number): 'critical' | 'low' | 'normal' {
  if (stock <= minStock * 0.3) return 'critical';
  if (stock <= minStock) return 'low';
  return 'normal';
}

export function getDaysUntilExpiration(expirationDate: string | null): number | null {
  if (!expirationDate) return null;
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
