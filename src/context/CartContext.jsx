import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'dismarco-cart-v1';
const maxFor = (i) => (i.stock == null ? Infinity : i.stock);

function reducer(items, a) {
  switch (a.type) {
    case 'add': {
      const p = a.product;
      if (items.some((i) => i.id === p.id)) {
        return items.map((i) => (i.id === p.id ? { ...i, qty: Math.min(i.qty + 1, maxFor(i)) } : i));
      }
      return [...items, { id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, stock: p.stock, qty: 1 }];
    }
    case 'setQty':
      return a.qty <= 0
        ? items.filter((i) => i.id !== a.id)
        : items.map((i) => (i.id === a.id ? { ...i, qty: Math.min(a.qty, maxFor(i)) } : i));
    case 'remove': return items.filter((i) => i.id !== a.id);
    case 'clear': return [];
    default: return items;
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(saved) ? saved : [];
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
    qtyOf: (id) => items.find((i) => i.id === id)?.qty ?? 0,
    add: (product) => dispatch({ type: 'add', product }),
    setQty: (id, qty) => dispatch({ type: 'setQty', id, qty }),
    remove: (id) => dispatch({ type: 'remove', id }),
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
