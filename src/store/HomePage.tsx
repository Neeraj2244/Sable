import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { Icon } from "../components/Icon";
import { Attribution, Brand, Eyebrow, Lines, PillLink, Stars, TextLink } from "../components/ui";
import { assetUrl, formatMoney, pad2, titleCase } from "../content";
import { useHash } from "../hooks/useHash";
import { useStore } from "./StoreContext";

// Page order. Add, remove or reorder sections here.
const sections: ComponentType[] = [Hero, Highlight, Craft, Menu, Feature, Benefits, Stories, Delivery, Faq, Closing];

export function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">{sections.map((Section, i) => <Section key={i} />)}</main>
      <Footer />
    </>
  );
}

const stagger = (index: number, step: number): CSSProperties => ({ transitionDelay: `${index * step}ms` });
const entrance = (delay: number): CSSProperties => ({ animationDelay: `${delay}ms` });

function useNavLinks() {
  const { nav } = useStore().content;
  return [
    { href: "#menu", label: nav.menu },
    { href: "#craft", label: nav.craft },
    { href: "#stories", label: nav.stories },
    { href: "#delivery", label: nav.delivery },
  ];
}

function Header() {
  const { content, cart, openBag } = useStore();
  const links = useNavLinks();
  const hash = useHash();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [hash]);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="container nav-shell">
        <Brand name={content.brand.name} />
        <nav className="desktop-nav" aria-label="Main navigation">{links.map((l) => <a href={l.href} key={l.href}>{l.label}</a>)}</nav>
        <div className="nav-actions">
          <button className="bag-button" type="button" onClick={openBag} aria-label={`Open your bag${cart.count ? `, ${cart.count} ${cart.count === 1 ? "item" : "items"}` : ""}`}>
            <span className="bag-label">Your bag</span><Icon name="bag" size={19} /><span className="bag-count" aria-live="polite">{cart.count}</span>
          </button>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>
      <nav id="mobile-navigation" className={`mobile-nav${menuOpen ? " is-open" : ""}`} aria-label="Mobile navigation" aria-hidden={!menuOpen}>
        {links.map((l) => <a href={l.href} key={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>)}
      </nav>
    </header>
  );
}

function Hero() {
  const { brand, hero } = useStore().content;
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <img className="hero-photo" src={assetUrl(hero.image)} alt={hero.imageAlt} fetchPriority="high" />
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-content">
        <Eyebrow className="hero-eyebrow hero-entrance" style={entrance(70)}>{hero.eyebrow}</Eyebrow>
        <h1 id="hero-title" className="hero-title">
          <span className="hero-brand-word hero-entrance" style={entrance(170)}>{brand.name}<span>.</span></span>
          <span className="hero-headline hero-entrance" style={entrance(270)}><Lines text={hero.headline} /></span>
        </h1>
        <p className="hero-copy hero-entrance" style={entrance(370)}>{hero.copy}</p>
        <div className="hero-actions hero-entrance" style={entrance(470)}>
          <PillLink tone="cream" href="#menu">{hero.primaryCta}</PillLink>
          <a className="hero-text-link" href="#craft">{hero.secondaryCta} <Icon name="arrow-right" size={16} /></a>
        </div>
      </div>
      <div className="hero-caption"><span>{hero.captionLeft}</span><span>{hero.captionRight}</span></div>
      <a className="hero-scroll" href="#love" aria-label={`Scroll to learn about ${titleCase(brand.name)}`}><span></span></a>
    </section>
  );
}

function Highlight() {
  const { brand, highlight } = useStore().content;
  return (
    <section className="love-strip" id="love" aria-label={`What makes ${titleCase(brand.name)} special`}>
      <div className="container love-inner">
        <div className="love-mark" data-reveal><Stars size={13} /><span>{highlight.label}</span></div>
        <blockquote data-reveal>“{highlight.quote}”</blockquote>
        <Attribution initials={highlight.initials} name={highlight.name} detail={highlight.detail} reveal />
      </div>
    </section>
  );
}

function Craft() {
  const { craft } = useStore().content;
  return (
    <section className="craft-section section-pad" id="craft" aria-labelledby="craft-title">
      <div className="container">
        <div className="section-header" data-reveal>
          <Eyebrow>{craft.eyebrow}</Eyebrow>
          <h2 className="section-title" id="craft-title"><Lines text={craft.title} /></h2>
          <p className="section-intro">{craft.intro}</p>
        </div>
        <div className="craft-grid">
          {craft.steps.map((step, i) => (
            <article className="craft-step" data-reveal style={stagger(i, 100)} key={i}>
              <div className="craft-topline"><span>{pad2(i + 1)}</span><Icon name={step.icon} size={24} /></div>
              <h3>{step.title}</h3><p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Menu() {
  const { content: { menu }, cart, addToBag } = useStore();
  return (
    <section className="menu-section" id="menu" aria-labelledby="menu-title">
      <div className="container">
        <div className="menu-heading" data-reveal>
          <div><Eyebrow>{menu.eyebrow}</Eyebrow><h2 className="section-title" id="menu-title"><Lines text={menu.title} /></h2></div>
          <p>{menu.intro}</p>
        </div>
        <div className="product-grid">
          {menu.products.map((product, i) => {
            const qty = cart.qtyOf(product.id);
            return (
              <article className="product-card" data-reveal style={stagger(i, 90)} key={product.id}>
                <div className="product-image-wrap">
                  <img src={assetUrl(product.image)} alt={product.imageAlt} loading="lazy" style={product.imagePosition ? { objectPosition: product.imagePosition } : undefined} />
                  {product.label && <span className="product-ribbon">{product.label}</span>}
                  {qty > 0 && <span className="product-in-bag"><Icon name="check" size={13} /> In your bag · {qty}</span>}
                </div>
                <div className="product-body">
                  <div className="product-title-row"><h3>{product.name}</h3><span className="product-price">{formatMoney(product.price)}</span></div>
                  <p className="product-description">{product.description}</p>
                  <div className="product-footer">
                    <span className="product-size">{product.size}</span>
                    <button className="add-button" type="button" onClick={() => addToBag(product.id)} aria-label={`Add ${product.name}, ${formatMoney(product.price)}, to your bag`}>
                      <span>{qty ? "Add another" : "Add to bag"}</span><Icon name={qty ? "plus" : "arrow-up-right"} size={qty ? 15 : 16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="menu-footnote" data-reveal><Icon name="snow" size={15} /> {menu.footnote} <a href="#delivery">{menu.footnoteLink} <Icon name="arrow-right" size={14} /></a></p>
      </div>
    </section>
  );
}

function Feature() {
  const { feature } = useStore().content;
  return (
    <section className="feature-section" aria-labelledby="feature-title">
      <div className="feature-image" data-reveal><img src={assetUrl(feature.image)} alt={feature.imageAlt} loading="lazy" /><span className="feature-image-note">{feature.imageNote}</span></div>
      <div className="feature-content" data-reveal>
        <Eyebrow>{feature.eyebrow}</Eyebrow>
        <h2 id="feature-title"><Lines text={feature.title} /></h2>
        <p>{feature.body}</p>
        <ul className="feature-points">{feature.points.map((point, i) => <li key={i}><Icon name="check" size={17} /> {point}</li>)}</ul>
        <TextLink href="#menu">{feature.linkLabel}</TextLink>
      </div>
    </section>
  );
}

function Benefits() {
  const { benefits } = useStore().content;
  return (
    <section className="benefits-section section-pad" aria-labelledby="benefits-title">
      <div className="container benefits-layout">
        <div className="benefits-intro" data-reveal>
          <Eyebrow>{benefits.eyebrow}</Eyebrow>
          <h2 className="section-title" id="benefits-title"><Lines text={benefits.title} always /></h2>
          <p>{benefits.body}</p>
          <TextLink href="#delivery">{benefits.linkLabel}</TextLink>
        </div>
        <div className="benefit-list">
          {benefits.items.map((item, i) => (
            <article className="benefit-line" data-reveal style={stagger(i, 100)} key={i}>
              <span className="benefit-icon"><Icon name={item.icon} size={19} /></span>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
              <span className="benefit-index">{pad2(i + 1)}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stories() {
  const { stories } = useStore().content;
  const { testimonials } = stories;
  const [active, setActive] = useState(0);
  if (!testimonials.length) return null;
  const story = testimonials[active % testimonials.length];
  const step = (by: number) => setActive((i) => (i + by + testimonials.length) % testimonials.length);

  return (
    <section className="story-section" id="stories" aria-labelledby="stories-title">
      <div className="container">
        <div className="story-heading" data-reveal>
          <div><Eyebrow>{stories.eyebrow}</Eyebrow><h2 className="section-title" id="stories-title"><Lines text={stories.title} /></h2></div>
          <p>{stories.intro}</p>
        </div>
        <div className="story-panel" data-reveal aria-live="polite" aria-atomic="true">
          <div className="story-side"><Stars size={14} /><span>{stories.label}</span><div className="story-quote-mark">&ldquo;</div></div>
          <div className="story-main">
            <p className="story-quote" key={active}>&ldquo;{story.quote}&rdquo;</p>
            <div className="story-bottom">
              <Attribution initials={story.initials} name={story.name} detail={story.detail} large />
              {testimonials.length > 1 && (
                <div className="story-controls">
                  <button type="button" aria-label="Previous customer story" onClick={() => step(-1)}><Icon name="arrow-left" size={18} /></button>
                  <span>{pad2((active % testimonials.length) + 1)}<span className="story-total"> / {pad2(testimonials.length)}</span></span>
                  <button type="button" aria-label="Next customer story" onClick={() => step(1)}><Icon name="arrow-right" size={18} /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Delivery() {
  const { delivery } = useStore().content;
  const hasFree = delivery.freeOver > 0;
  return (
    <section className="delivery-section section-pad" id="delivery" aria-labelledby="delivery-title">
      <div className="container delivery-layout">
        <div className="delivery-copy" data-reveal>
          <Eyebrow>{delivery.eyebrow}</Eyebrow>
          <h2 className="section-title" id="delivery-title"><Lines text={delivery.title} /></h2>
          <p>{delivery.body}</p>
          {hasFree && <div className="free-delivery-note"><span className="free-delivery-icon"><Icon name="truck" size={20} /></span><span><strong>{delivery.freeTitle}</strong><small>Complimentary delivery when your order reaches {formatMoney(delivery.freeOver)}.</small></span></div>}
        </div>
        <div className="delivery-table" data-reveal aria-label="Delivery price">
          <div className="delivery-table-head"><span>Delivery</span><span>Price</span></div>
          <div className="delivery-row"><span><Icon name="snow" size={16} />Flat chilled delivery, every order</span><strong>{formatMoney(delivery.fee)}</strong></div>
          {hasFree && <div className="delivery-row"><span><Icon name="truck" size={16} />Orders of {formatMoney(delivery.freeOver)} or more</span><strong>Free</strong></div>}
          {delivery.note && <p>{delivery.note}</p>}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const { brand, faq } = useStore().content;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="faq-section section-pad" id="faq" aria-labelledby="faq-title">
      <div className="container faq-layout">
        <div className="faq-intro" data-reveal>
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <h2 className="section-title" id="faq-title"><Lines text={faq.title} /></h2>
          <p>{faq.intro}</p>
          <TextLink href={`mailto:${brand.contactEmail}`} icon="arrow-up-right">{faq.linkLabel}</TextLink>
        </div>
        <div className="faq-list">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className={`faq-item${isOpen ? " is-open" : ""}`} data-reveal style={stagger(i, 60)} key={i}>
                <h3><button className="faq-question" type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)}><span>{item.question}</span><span className="faq-toggle"><Icon name="chevron-down" size={17} /></span></button></h3>
                <div className="faq-answer" id={`faq-${i}`} hidden={!isOpen}><p>{item.answer}</p></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Closing() {
  const { closing } = useStore().content;
  return (
    <section className="last-call" aria-labelledby="last-call-title">
      <div className="last-call-glow" aria-hidden="true" />
      <div className="last-call-content" data-reveal>
        <Eyebrow>{closing.eyebrow}</Eyebrow>
        <h2 id="last-call-title"><Lines text={closing.title} /></h2>
        <p>{closing.body}</p>
        <PillLink tone="cream" href="#menu">{closing.cta}</PillLink>
      </div>
    </section>
  );
}

function Footer() {
  const { brand, footer, nav } = useStore().content;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand-column"><Brand name={brand.name} /><p><Lines text={footer.tagline} always /></p></div>
          <div className="footer-links"><h2>{footer.tableHeading}</h2><a href="#menu">{nav.menu}</a><a href="#craft">{nav.craft}</a><a href="#stories">{nav.stories}</a></div>
          <div className="footer-links"><h2>{footer.detailsHeading}</h2><a href="#delivery">Delivery &amp; pricing</a><a href="#faq">Questions</a><a href={`mailto:${brand.contactEmail}`}>Get in touch</a></div>
          <div className="footer-contact"><h2>{footer.contactHeading}</h2><span>{footer.contactText}</span></div>
        </div>
        <div className="footer-bottom"><span>&copy; {new Date().getFullYear()} {titleCase(brand.name)} Tiramisu</span><span>{footer.bottomText}</span><a href="#faq">Ingredients &amp; allergens</a></div>
      </div>
    </footer>
  );
}
