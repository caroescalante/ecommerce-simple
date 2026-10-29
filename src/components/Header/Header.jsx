import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import categories from '../../data/categories';
import logo from '../../assets/logo.png';
import './Header.css';

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);

const promos = [
  'Promociones Exclusivas',
  'Envíos a todo el país',
  'Los mejores precios',
  'Atención mayorista personalizada',
  '+54 9 11 2771-0951',
];

export default function Header() {
  const { count: cartCount, openCart } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef(null);
  const location = useLocation();

  // Cierra el menú lateral al cambiar de ruta y centra la categoría activa
  useEffect(() => {
    setMenuOpen(false);
    const active = listRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [location.pathname]);

  // Esc para cerrar + bloqueo de scroll del body con el menú abierto
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const scrollNav = (dir) =>
    listRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/buscar?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <div className="topbar" aria-label="Información destacada">
        <div className="topbar__inner">
          {promos.map((p) => (
            <span key={p}>{p}</span>
          ))}
          {/* Duplicado para el loop del ticker en celular */}
          {promos.map((p) => (
            <span key={`dup-${p}`} className="topbar__dup" aria-hidden="true">{p}</span>
          ))}
        </div>
      </div>

      <header className="header">
        <div className="header__bar">
          <button
            className="icon-btn header__menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="drawer"
          >
            <Icon><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
          </button>

          <Link to="/" className="logo" aria-label="Dismarco, ir al inicio">
            <img src={logo} alt="" width="44" height="44" />
            <span>Dis<em>marco</em></span>
          </Link>

          <form className="search" role="search" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="search-input">Buscar producto</label>
            <input
              id="search-input"
              type="search"
              placeholder="Buscar producto"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" aria-label="Buscar">
              <Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
            </button>
          </form>

          <div className="header__actions">
            <Link to="/admin" className="account">
              <Icon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Icon>
              Mi cuenta
            </Link>
            <button className="icon-btn" onClick={openCart} aria-label={`Carrito, ${cartCount} productos`}>
              <Icon>
                <path d="M3 4h2l2.4 11h10.2L20 7H6.2" />
                <circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" />
              </Icon>
              <span className="badge">{cartCount}</span>
            </button>
          </div>
        </div>

        <nav className="catnav" aria-label="Categorías">
          <div className="catnav__inner">
            <button className="catnav__arrow catnav__arrow--l" onClick={() => scrollNav(-1)} aria-label="Anterior">
              <Icon><path d="m15 18-6-6 6-6" /></Icon>
            </button>
            <ul ref={listRef}>
              {categories.map((c) => (
                <li key={c.slug}>
                  <NavLink to={`/categoria/${c.slug}`}>{c.name}</NavLink>
                </li>
              ))}
            </ul>
            <button className="catnav__arrow catnav__arrow--r" onClick={() => scrollNav(1)} aria-label="Siguiente">
              <Icon><path d="m9 18 6-6-6-6" /></Icon>
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`scrim ${menuOpen ? 'is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        id="drawer"
        className={`drawer ${menuOpen ? 'is-open' : ''}`}
        aria-label="Menú"
        aria-hidden={!menuOpen}
      >
        <div className="drawer__head">
          <strong>Categorías</strong>
          <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
            <Icon><path d="M6 6l12 12M18 6 6 18" /></Icon>
          </button>
        </div>
        <ul>
          {categories.map((c) => (
            <li key={c.slug}>
              <NavLink to={`/categoria/${c.slug}`} tabIndex={menuOpen ? 0 : -1}>
                {c.name}
                <Icon><path d="m9 18 6-6-6-6" /></Icon>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="drawer__foot">
          <Link className="btn" to="/cuenta">Mi cuenta</Link>
          <Link className="btn btn--accent" to="/pedido-rapido">Pedido rápido</Link>
        </div>
      </aside>
    </>
  );
}
