import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import useProducts from '../hooks/useProducts';
import ProductCard, { ProductImage } from '../components/ProductCard/ProductCard';
import { formatPrice } from '../utils/format';
import { buildOrderMessage } from '../utils/whatsapp';
import { FREE_LOCALITIES } from '../data/delivery';
import store from '../data/store';
import './Checkout.css';

const AddressPicker = lazy(() => import('../components/AddressPicker/AddressPicker'));
const Icon = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

const STEPS = ['Pedido', 'Entrega', 'Pago'];

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <em role="alert">{error}</em>}
    </label>
  );
}

export default function Checkout() {
  const { items, count, total, setQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const promos = useProducts({ category: 'promociones' });

  const [step, setStep] = useState(0); // 0 = pedido, 1 = entrega, 2 = pago
  const [method, setMethod] = useState(''); // 'domicilio' | 'retiro'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(null);
  const [locality, setLocality] = useState(''); // una de FREE_LOCALITIES o 'otra'
  const [reference, setReference] = useState('');
  const [payment, setPayment] = useState('');
  const [touched, setTouched] = useState({});
  const [methodErr, setMethodErr] = useState(false);
  const [paymentErr, setPaymentErr] = useState(false);
  const [waUrl, setWaUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const headingRef = useRef(null);
  const firstRender = useRef(true);

  // Al cambiar de paso: volver arriba y mover el foco al título (accesibilidad)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const domicilio = method === 'domicilio';

  const errors = {
    name: name.trim().length < 2 ? 'Ingresá tu nombre' : '',
    phone: Boolean(method) && !/^\d{8,15}$/.test(phone.replace(/\D/g, '')) ? 'Ingresá un teléfono válido, con característica' : '',
    address: domicilio && !(address?.lat && address.text.trim().length >= 3) ? 'Elegí tu dirección en el mapa o buscala' : '',
  };
  const deliveryValid = Boolean(method) && !errors.name && !errors.phone && !errors.address;
  const freeShipping = domicilio && Boolean(locality) && locality !== 'otra';

  const onAddress = (a) => {
    // Si solo cambió el texto (mismo punto), se respeta la localidad que el usuario ya eligió
    const samePoint = address && a.lat === address.lat && a.lng === address.lng;
    setAddress(a);
    if (!samePoint) setLocality(a.localityGuess || 'otra');
  };

  const go = (n) => setStep(n);

  const scrollToError = () =>
    setTimeout(() => {
      document.querySelector('[aria-invalid="true"], .field-err')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);

  const continueFromDelivery = () => {
    setTouched({ name: true, phone: true, address: true });
    setMethodErr(!method);
    if (deliveryValid) go(2);
    else scrollToError();
  };

  const send = () => {
    if (!payment) { setPaymentErr(true); scrollToError(); return; }
    const text = buildOrderMessage({
      storeName: store.name, items, subtotal: total, method, pickup: store.pickup,
      name, phone, address, locality, freeShipping, reference, payment, transfer: store.transfer,
    });
    const url = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
    setWaUrl(url);
  };

  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText(store.transfer.alias);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* sin permiso para copiar: el alias queda visible para copiarlo a mano */ }
  };

  const onNext = () => (step === 0 ? go(1) : step === 1 ? continueFromDelivery() : send());

  if (waUrl) {
    return (
      <main className="page checkout">
        <div className="sent">
          <Icon><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16.5 9.5" /></Icon>
          <h2>¡Casi listo!</h2>
          <p>Abrimos WhatsApp con tu pedido. Enviá el mensaje para confirmarlo.</p>
          <a className="btn btn--accent" href={waUrl} target="_blank" rel="noopener noreferrer">Abrir WhatsApp otra vez</a>
          <button className="btn" onClick={() => { clear(); navigate('/'); }}>Volver a la tienda</button>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="page checkout">
        <div className="sent">
          <h2>Tu pedido está vacío</h2>
          <p>Agregá productos para continuar con la compra.</p>
          <Link className="btn btn--accent" to="/">Ver productos</Link>
        </div>
      </main>
    );
  }

  const suggestions = promos.products.filter((p) => p.stock !== 0).slice(0, 8);
  const shippingNote = domicilio && address && !freeShipping;

  return (
    <main className="page checkout">
      <h2>Finalizar pedido</h2>

      <ol className="stepper" aria-label="Progreso del pedido">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
            <button type="button" disabled={i > step} onClick={() => go(i)}>
              <span className="stepper__n">
                {i < step ? <Icon><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon> : i + 1}
              </span>
              <span className="stepper__l">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* ===== Paso 1: pedido + promociones ===== */}
      {step === 0 && (
        <>
          <section className="step" aria-labelledby="s1">
            <h3 id="s1" ref={headingRef} tabIndex={-1}>Tu pedido</h3>
            <ul className="cart__list ck-list">
              {items.map((i) => (
                <li key={i.id} className="citem">
                  <ProductImage product={i} className="citem__img" />
                  <div>
                    <p className="citem__name">{i.name}</p>
                    <p className="citem__price">{formatPrice(i.price * i.qty)}</p>
                    <div className="citem__row">
                      <div className="qty" role="group" aria-label={`Cantidad de ${i.name}`}>
                        <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Quitar uno"><Icon><path d="M5 12h14" /></Icon></button>
                        <output>{i.qty}</output>
                        <button onClick={() => setQty(i.id, i.qty + 1)} disabled={i.stock != null && i.qty >= i.stock} aria-label="Agregar uno más"><Icon><path d="M12 5v14M5 12h14" /></Icon></button>
                      </div>
                      <button className="citem__remove" onClick={() => remove(i.id)}>Quitar</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="ck-sub"><span>Subtotal</span><strong>{formatPrice(total)}</strong></p>
          </section>

          {suggestions.length > 0 && (
            <section className="step" aria-labelledby="s2">
              <h3 id="s2">Sumá estas promociones</h3>
              <ul className="suggest">
                {suggestions.map((p) => <ProductCard key={p.id} product={p} />)}
              </ul>
            </section>
          )}
        </>
      )}

      {/* ===== Paso 2: entrega ===== */}
      {step === 1 && (
        <section className="step" aria-labelledby="s3">
          <h3 id="s3" ref={headingRef} tabIndex={-1}>Forma de entrega</h3>
          <fieldset className="opts">
            <legend className="sr-only">Forma de entrega</legend>
            <label className={`opt ${domicilio ? 'is-on' : ''}`}>
              <input type="radio" name="delivery" checked={domicilio} onChange={() => { setMethod('domicilio'); setMethodErr(false); }} />
              <span><strong>A domicilio</strong><small>Te lo llevamos a tu casa</small></span>
            </label>
            <label className={`opt ${method === 'retiro' ? 'is-on' : ''}`}>
              <input type="radio" name="delivery" checked={method === 'retiro'} onChange={() => { setMethod('retiro'); setMethodErr(false); }} />
              <span><strong>Retiro por el local</strong><small>Pasás a buscarlo</small></span>
            </label>
          </fieldset>
          {methodErr && <em className="field-err" role="alert">Elegí cómo querés recibir tu pedido</em>}

          {method === 'retiro' && (
            <>
              <div className="notice pickup">
                <p><Icon><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>{store.pickup.address}</p>
                <p><Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>{store.pickup.hours}</p>
              </div>
              <Field label="Nombre" error={touched.name && errors.name}>
                <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch('name')} autoComplete="name" aria-invalid={Boolean(touched.name && errors.name)} />
              </Field>
              <Field label="Número de teléfono" error={touched.phone && errors.phone}>
                <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => touch('phone')} autoComplete="tel" placeholder="11 1234 5678" aria-invalid={Boolean(touched.phone && errors.phone)} />
              </Field>
            </>
          )}

          {domicilio && (
            <>
              <Field label="Nombre" error={touched.name && errors.name}>
                <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch('name')} autoComplete="name" aria-invalid={Boolean(touched.name && errors.name)} />
              </Field>
              <Field label="Número de teléfono" error={touched.phone && errors.phone}>
                <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => touch('phone')} autoComplete="tel" placeholder="11 1234 5678" aria-invalid={Boolean(touched.phone && errors.phone)} />
              </Field>

              <div className="step__block">
                <Suspense fallback={<div className="map map--loading">Cargando mapa…</div>}>
                  <AddressPicker value={address} onChange={onAddress} />
                </Suspense>
                {touched.address && errors.address && <em className="field-err" role="alert">{errors.address}</em>}
              </div>

              {address && (
                <>
                  <Field label="Localidad">
                    <select value={locality} onChange={(e) => setLocality(e.target.value)}>
                      {FREE_LOCALITIES.map((l) => <option key={l} value={l}>{l}</option>)}
                      <option value="otra">Otra localidad</option>
                    </select>
                  </Field>
                  {freeShipping ? (
                    <p className="notice notice--ok" role="status">¡Envío sin cargo a {locality}!</p>
                  ) : (
                    <p className="notice" role="status">Tu zona no tiene envío sin cargo. El costo del envío se te cotiza al finalizar la compra.</p>
                  )}
                  <Field label="Piso, depto o referencias (opcional)">
                    <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej: timbre 2B, portón negro" />
                  </Field>
                </>
              )}
            </>
          )}
        </section>
      )}

      {/* ===== Paso 3: pago ===== */}
      {step === 2 && (
        <section className="step" aria-labelledby="s4">
          <h3 id="s4" ref={headingRef} tabIndex={-1}>Forma de pago</h3>
          <Field label="¿Cómo vas a pagar?" error={paymentErr && !payment && 'Elegí una forma de pago'}>
            <select value={payment} onChange={(e) => { setPayment(e.target.value); setPaymentErr(false); }} aria-invalid={Boolean(paymentErr && !payment)}>
              <option value="">Elegí una opción</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </Field>
          {payment === 'Transferencia' && (
            <div className="transfer">
              <h4>Datos para transferir</h4>
              <dl>
                <div>
                  <dt>Alias</dt>
                  <dd>
                    <strong>{store.transfer.alias}</strong>
                    <button type="button" className="transfer__copy" onClick={copyAlias} aria-live="polite">
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </dd>
                </div>
                <div><dt>Banco o billetera</dt><dd>{store.transfer.bank}</dd></div>
                <div><dt>Titular</dt><dd>{store.transfer.holder}</dd></div>
              </dl>
              <p>Cuando confirmes el pedido por WhatsApp, enviá también el comprobante de la transferencia.</p>
            </div>
          )}

          <div className="recap">
            <h4>Resumen</h4>
            <dl>
              <div><dt>Productos</dt><dd>{count} · {formatPrice(total)}</dd></div>
              <div>
                <dt>Entrega</dt>
                <dd>{domicilio ? `A domicilio · ${address.text}` : `Retiro por el local · ${store.pickup.address}`}</dd>
              </div>
              <div>
                <dt>Envío</dt>
                <dd>{domicilio ? (freeShipping ? 'Sin cargo' : 'A cotizar al finalizar la compra') : 'No aplica'}</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      <div className="checkout__bar">
        <div className="checkout__total">
          <small>{step > 0 && shippingNote ? 'Total + envío a cotizar' : 'Total'}</small>
          <strong>{formatPrice(total)}</strong>
        </div>
        <div className="checkout__actions">
          {step > 0 && (
            <button className="btn checkout__back" onClick={() => go(step - 1)} aria-label="Volver al paso anterior">
              <Icon><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>
            </button>
          )}
          <button className="btn btn--accent" onClick={onNext}>
            {step < 2 ? 'Continuar' : 'Enviar por WhatsApp'}
          </button>
        </div>
      </div>
    </main>
  );
}