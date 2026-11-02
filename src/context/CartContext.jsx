import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'dismarco-cart-v1';
const maxFor = (i) => (i.stock == null ? Infinity : i.stock);

// Cada línea del carrito es producto + opción: "12" o "12::Manzana"
const keyOf = (id, variant) => (variant ? `${id}::${variant}` : String(id));

function reducer(items, a) {
  switch (a.type) {
    case 'add': {
      const { product: p, variant = null, qty = 1 } = a;
      const key = keyOf(p.id, variant);
      if (items.some((i) => i.key === key)) {
        return items.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, maxFor(i)) } : i));
      }
      return [
        ...items,
        { key, id: p.id, variant, name: p.name, price: p.price, imageUrl: p.imageUrl, stock: p.stock, qty: Math.min(qty, maxFor(p)) },
      ];
    }
    case 'setQty': {
      const key = String(a.key);
      return a.qty <= 0
        ? items.filter((i) => i.key !== key)
        : items.map((i) => (i.key === key ? { ...i, qty: Math.min(a.qty, maxFor(i)) } : i));
    }
    case 'remove': return items.filter((i) => i.key !== String(a.key));
    case 'clear': return [];
    default: return items;
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(saved)) return [];
    // Migra carritos guardados antes de existir las opciones
    return saved.map((i) => ({ variant: null, ...i, key: i.key ?? String(i.id) }));
  } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [], load);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* sin storage */ }
  }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((n, i) => n + i.price * i.qty, 0),
    // cantidad total de un producto, sumando todas sus opciones
    qtyOf: (id) => items.filter((i) => i.id === id).reduce((n, i) => n + i.qty, 0),
    add: (product, variant = null, qty = 1) => dispatch({ type: 'add', product, variant, qty }),
    // setQty y remove reciben la key de la línea (item.key). Para productos sin opción, key === String(id)
    setQty: (key, qty) => dispatch({ type: 'setQty', key, qty }),
    remove: (key) => dispatch({ type: 'remove', key }),
    clear: () => dispatch({ type: 'clear' }),
    isOpen,
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
  }), [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}