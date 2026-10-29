import { useRef } from 'react';
import store from '../../data/store';
import logo from '../../assets/logo.png';
import useOpenStatus, { DAY_NAMES } from './useOpenStatus';
import './StoreHero.css';

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);

function StatusBadge({ isOpen, className = '', ...rest }) {
  return (
    <span className={`status ${isOpen ? 'status--open' : 'status--closed'} ${className}`} {...rest}>
      <i aria-hidden="true" />
      {isOpen ? 'Abierto' : 'Cerrado'}
    </span>
  );
}

export default function StoreHero() {
  const status = useOpenStatus(store);
  const dialogRef = useRef(null);
  const { schedule } = store;

  // Lunes a domingo, en ese orden
  const week = [1, 2, 3, 4, 5, 6, 0];

  const closeOnBackdrop = (e) => {
    if (e.target === dialogRef.current) dialogRef.current.close();
  };

  return (
    <section className="hero" aria-label="Portada de la tienda">
      <div className="hero__banner">
        {store.banner ? (
          <img src={store.banner} alt="" />
        ) : (
          <div className="hero__art" aria-hidden="true">
            <span>{store.tagline}</span>
          </div>
        )}
        <StatusBadge isOpen={status.isOpen} className="status--float" aria-hidden="true" />
      </div>

      <div className="hero__body">
        <img className="hero__logo" src={logo} alt={`Logo de ${store.name}`} width="140" height="140" />

        <div className="hero__info">
          <h1 className="hero__name">{store.name}</h1>
          <StatusBadge isOpen={status.isOpen} className="status--inline" />
          <p className="hero__detail">
            <span className="sr-only">{status.isOpen ? 'Abierto. ' : 'Cerrado. '}</span>
            {status.detail}
          </p>
        </div>

        <div className="hero__actions">
          <a
            className="hero__wa"
            href={`https://wa.me/${store.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribinos por WhatsApp"
          >
            <Icon>
              <path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6L3 21z" />
              <path d="M9 8.5c0 3 2.5 5.5 5.5 5.5l1-1.2-1.8-1-.8.6a3.4 3.4 0 0 1-1.6-1.6l.6-.8-1-1.8L9 8.5z" />
            </Icon>
          </a>
          <button className="hero__info-btn" onClick={() => dialogRef.current.showModal()}>
            <Icon><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></Icon>
            Información
          </button>
        </div>
      </div>

      <dialog ref={dialogRef} className="modal" onClick={closeOnBackdrop} aria-labelledby="info-title">
        <div className="modal__head">
          <h2 id="info-title">{store.name}</h2>
          <button className="icon-btn" onClick={() => dialogRef.current.close()} aria-label="Cerrar">
            <Icon><path d="M6 6l12 12M18 6 6 18" /></Icon>
          </button>
        </div>
        <p className="modal__sub">{store.tagline}</p>
        <StatusBadge isOpen={status.isOpen} />
        <span className="modal__detail">{status.detail}</span>

        <h3>Horarios</h3>
        <ul className="hours">
          {week.map((d) => {
            const shifts = schedule[d];
            return (
              <li key={d} className={d === status.today ? 'is-today' : ''}>
                <span>{DAY_NAMES[d]}</span>
                <span>{shifts.length ? shifts.map(([o, c]) => `${o} a ${c}`).join(' y ') + ' hs' : 'Cerrado'}</span>
              </li>
            );
          })}
        </ul>
        <p className="hours__note">Los turnos que terminan a las 02:00 llegan hasta la madrugada del día siguiente.</p>

        <h3>Contacto</h3>
        <a className="modal__link" href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer">
          WhatsApp {store.phoneLabel}
        </a>
      </dialog>
    </section>
  );
}
