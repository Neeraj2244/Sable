import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Icon } from "../components/Icon";
import { Brand, Eyebrow, PillLink, QuantityControl } from "../components/ui";
import { assetUrl, formatMoney, titleCase } from "../content";
import { useStore } from "./StoreContext";

type FieldConfig = { name: string; label: string; type?: string; autoComplete?: string; placeholder?: string; half?: boolean; optional?: boolean; multiline?: boolean };

// Add, remove or reorder checkout fields here; state and rendering follow.
const addressFields: FieldConfig[] = [
  { name: "email", label: "Email address", type: "email", autoComplete: "email", placeholder: "you@example.com" },
  { name: "name", label: "Full name", autoComplete: "name", placeholder: "Your name" },
  { name: "address", label: "Street address", autoComplete: "street-address", placeholder: "House number and street" },
  { name: "apartment", label: "Apartment, suite, etc.", autoComplete: "address-line2", placeholder: "Floor, apartment, or unit", optional: true },
  { name: "city", label: "City", autoComplete: "address-level2", placeholder: "Your city", half: true },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code", placeholder: "Postal code", half: true },
  { name: "country", label: "Country or region", autoComplete: "country-name", placeholder: "Country" },
  { name: "note", label: "A note for our kitchen", placeholder: "A little birthday note? Tell us here.", optional: true, multiline: true },
];

const paymentMethods = [
  { value: "card", title: "Credit or debit card", detail: "Visa, Mastercard, American Express", icon: <Icon name="credit-card" size={19} /> },
  { value: "paypal", title: "PayPal", detail: "Pay with your PayPal account", icon: "P", className: "paypal-mark" },
];

function TransactionLayout({ status, footer, className = "", children }: { status: ReactNode; footer: ReactNode; className?: string; children: ReactNode }) {
  const { brand } = useStore().content;
  return (
    <div className={`transaction-shell ${className}`}>
      <header className="transaction-header"><div className="container transaction-header-inner"><Brand name={brand.name} /><span className="secure-label">{status}</span></div></header>
      {children}
      <footer className="transaction-footer"><div className="container"><span>&copy; {new Date().getFullYear()} {titleCase(brand.name)} Tiramisu</span>{footer}</div></footer>
    </div>
  );
}

export function CheckoutPage({ onSubmit }: { onSubmit: (email: string) => void }) {
  const { content, cart, returnToBag } = useStore();
  const [form, setForm] = useState<Record<string, string>>(() => ({ country: content.checkout.defaultCountry }));
  const [method, setMethod] = useState(paymentMethods[0].value);
  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [event.target.name]: event.target.value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (cart.count) onSubmit(form.email ?? "");
  };

  return (
    <TransactionLayout
      status={<><Icon name="lock" size={15} /><span>Secure checkout</span></>}
      footer={<><span><Icon name="lock" size={13} /> A secure, considered checkout</span><a href={`mailto:${content.brand.contactEmail}`}>Need a hand?</a></>}
    >
      <main className="transaction-main" id="main-content">
        <div className="container">
          <nav className="checkout-breadcrumb" aria-label="Checkout steps"><button type="button" onClick={returnToBag}><Icon name="arrow-left" size={15} /> Your bag</button><span aria-hidden="true">/</span><span aria-current="step">Delivery &amp; payment</span></nav>
          {cart.count === 0 ? (
            <div className="checkout-empty" data-reveal>
              <span className="empty-bag-icon"><Icon name="bag" size={25} /></span>
              <Eyebrow dot={false}>A little pause</Eyebrow>
              <h1>Your bag is waiting for something lovely.</h1>
              <p>Choose your tiramisu and we will bring you right back here.</p>
              <PillLink tone="dark" icon="arrow-right" href="#menu">Back to the menu</PillLink>
            </div>
          ) : (
            <>
              <div className="checkout-heading" data-reveal><Eyebrow>{content.checkout.eyebrow}</Eyebrow><h1>{content.checkout.title}</h1><p>{content.checkout.intro}</p></div>
              <form className="checkout-layout" onSubmit={submit}>
                <div className="checkout-form-column">
                  <section className="checkout-form-section" aria-labelledby="address-title">
                    <StepHeading step="01" id="address-title" title="Where should we send the good stuff?" text="Chilled, carefully packed, right to your door." />
                    <div className="checkout-fields">
                      {addressFields.map(({ name, label, half, optional, multiline, ...input }) => (
                        <label className={half ? undefined : "field-full"} key={name}>
                          {label}{optional && <span className="field-optional">Optional</span>}
                          {multiline
                            ? <textarea name={name} rows={3} value={form[name] ?? ""} onChange={onChange} placeholder={input.placeholder} />
                            : <input name={name} type={input.type ?? "text"} autoComplete={input.autoComplete} placeholder={input.placeholder} value={form[name] ?? ""} onChange={onChange} required={!optional} />}
                        </label>
                      ))}
                    </div>
                  </section>
                  <section className="checkout-form-section payment-method-section" aria-labelledby="method-title">
                    <StepHeading step="02" id="method-title" title="How would you like to pay?" text="Choose a secure payment method to continue." />
                    <div className="payment-methods">
                      {paymentMethods.map((pm) => (
                        <label className={`payment-choice${method === pm.value ? " selected" : ""}`} key={pm.value}>
                          <input type="radio" name="paymentMethod" value={pm.value} checked={method === pm.value} onChange={() => setMethod(pm.value)} />
                          <span className={`payment-choice-icon ${pm.className ?? ""}`}>{pm.icon}</span>
                          <span className="payment-choice-copy"><strong>{pm.title}</strong><small>{pm.detail}</small></span>
                          <span className="radio-indicator" />
                        </label>
                      ))}
                    </div>
                    <p className="secure-payment-note"><Icon name="shield" size={16} /> Your payment details are handled by our secure payment partner.</p>
                    <p className="demo-disclosure">Checkout preview: payment processing is not connected yet. No payment details are collected or charged.</p>
                  </section>
                  <button className="button button-dark pay-button" type="submit"><span>Continue to secure payment</span><span className="pay-button-price">{formatMoney(cart.total)}</span><span className="button-icon"><Icon name="arrow-right" size={17} /></span></button>
                  <p className="terms-note">By continuing, you agree to our order and delivery terms. All product prices include taxes where applicable.</p>
                </div>
                <OrderSummary country={form.country ?? ""} />
              </form>
            </>
          )}
        </div>
      </main>
    </TransactionLayout>
  );
}

function StepHeading({ step, id, title, text }: { step: string; id: string; title: string; text: string }) {
  return <div className="checkout-section-heading"><span>{step}</span><div><h2 id={id}>{title}</h2><p>{text}</p></div></div>;
}

function OrderSummary({ country }: { country: string }) {
  const { cart, returnToBag } = useStore();
  return (
    <aside className="order-summary" aria-labelledby="summary-title">
      <div className="summary-header"><h2 id="summary-title">Your little box of joy</h2><button type="button" onClick={returnToBag}>Edit bag</button></div>
      <div className="summary-items">
        {cart.lines.map(({ product, qty }) => (
          <article className="summary-item" key={product.id}>
            <div className="summary-product-image"><img src={assetUrl(product.image)} alt="" /><span>{qty}</span></div>
            <div className="summary-product-info"><strong>{product.name}</strong><span>{product.size}</span><QuantityControl className="summary-quantity" size={12} name={product.name} qty={qty} onChange={(amount) => cart.change(product.id, amount)} /></div>
            <strong className="summary-product-price">{formatMoney(product.price * qty)}</strong>
          </article>
        ))}
      </div>
      <div className="summary-lines">
        <div><span>Subtotal</span><strong>{formatMoney(cart.subtotal)}</strong></div>
        <div><span>Chilled delivery {country && <span className="summary-destination">to {country}</span>}</span><strong>{cart.free ? <span className="free-shipping">Complimentary</span> : formatMoney(cart.shipping)}</strong></div>
        {cart.free && <p className="free-shipping-note"><Icon name="check" size={14} /> Your order ships free. A little thank-you from us.</p>}
        <div className="summary-total"><span>Total</span><strong>{formatMoney(cart.total)}</strong></div>
        <p className="included-note">Taxes included where applicable. Local duties may apply.</p>
      </div>
      <div className="summary-assurance"><Icon name="snow" size={17} /><span>Insulated packaging keeps every layer cool on its journey.</span></div>
    </aside>
  );
}

export function SuccessPage({ email, orderNumber }: { email: string; orderNumber: string }) {
  const { brand, success } = useStore().content;
  return (
    <TransactionLayout className="success-shell" status={<><Icon name="check" size={16} /> Order received</>} footer={<a href={`mailto:${brand.contactEmail}`}>Questions? We&apos;re right here.</a>}>
      <main className="success-main" id="main-content">
        <div className="success-glow" aria-hidden="true" />
        <div className="success-content" data-reveal>
          <span className="success-mark"><Icon name="check" size={29} /></span>
          <Eyebrow>{success.eyebrow}</Eyebrow>
          <h1>{success.title}</h1>
          <p className="success-lede">Your order is on its way to becoming something lovely.{email && <> We&apos;ll send the details to <strong>{email}</strong>.</>}</p>
          {orderNumber && <div className="order-number"><span>Your order preview</span><strong>{orderNumber}</strong></div>}
          <p className="success-demo-note">This is a storefront preview. No payment has been processed.</p>
          <PillLink tone="dark" icon="arrow-right" href="#menu">Back to the table</PillLink>
          <div className="success-flourish" aria-hidden="true">{success.flourish}</div>
        </div>
      </main>
    </TransactionLayout>
  );
}
