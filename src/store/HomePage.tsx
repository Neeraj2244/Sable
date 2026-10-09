import { useState, type ComponentType, type CSSProperties } from "react";
import { Icon } from "../components/Icon";
import { CocoaScrollCue } from "../components/CocoaScrollCue";
import { Attribution, Eyebrow, Lines, PillLink, Stars, TextLink } from "../components/ui";
import { assetUrl, formatMoney, pad2, safeColor, safeLink, titleCase } from "../content";
import { SiteLayout } from "./Layout";
import { productsUrl } from "./routes";
import { ProductCard } from "./ProductCard";
import { useStore } from "./StoreContext";

// Page order. Add, remove or reorder sections here.
const sections: ComponentType[] = [Hero, Highlight, Craft, Menu, Feature, Benefits, Stories, Delivery, Faq, OrderApps, Closing];

export function HomePage() {
  return <SiteLayout>{sections.map((Section, i) => <Section key={i} />)}</SiteLayout>;
}

const stagger = (index: number, step: number): CSSProperties => ({ transitionDelay: `${index * step}ms` });
const entrance = (delay: number): CSSProperties => ({ animationDelay: `${delay}ms` });

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
      <a className="hero-scroll" href="#love" aria-label={`Scroll to learn about ${titleCase(brand.name)}`}><CocoaScrollCue /></a>
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

/** Home shows the first few products; the full range lives on the Products page. */
const HOME_PRODUCT_LIMIT = 4;

function Menu() {
  const { menu } = useStore().content;
  const hasMore = menu.products.length > HOME_PRODUCT_LIMIT;
  return (
    <section className="menu-section" id="menu" aria-labelledby="menu-title">
      <div className="container">
        <div className="menu-heading" data-reveal>
          <div><Eyebrow>{menu.eyebrow}</Eyebrow><h2 className="section-title" id="menu-title"><Lines text={menu.title} /></h2></div>
          <p>{menu.intro}</p>
        </div>
        <div className="product-grid">
          {menu.products.slice(0, HOME_PRODUCT_LIMIT).map((product, i) => <ProductCard product={product} reveal style={stagger(i, 90)} key={product.id} />)}
        </div>
        <div className="menu-more" data-reveal>
          <PillLink tone="dark" icon="arrow-right" href={productsUrl()}>{menu.viewMore}</PillLink>
          {hasMore && <span>{menu.products.length} treats in total</span>}
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
      {/* The delivery fee itself is shown only at checkout; this section shows the free-delivery offer when there is one. */}
      <div className={`container delivery-layout${hasFree ? "" : " is-single"}`}>
        <div className="delivery-copy" data-reveal>
          <Eyebrow>{delivery.eyebrow}</Eyebrow>
          <h2 className="section-title" id="delivery-title"><Lines text={delivery.title} /></h2>
          <p>{delivery.body}</p>
          {hasFree && <div className="free-delivery-note"><span className="free-delivery-icon"><Icon name="truck" size={20} /></span><span><strong>{delivery.freeTitle}</strong><small>Complimentary delivery when your order reaches {formatMoney(delivery.freeOver)}.</small></span></div>}
          {!hasFree && delivery.note && <p className="delivery-note"><Icon name="snow" size={16} /> {delivery.note}</p>}
        </div>
        {hasFree && (
          <div className="delivery-table" data-reveal role="group" aria-label="Free delivery">
            <div className="delivery-table-head"><span>Delivery</span><span>Price</span></div>
            <div className="delivery-row"><span><Icon name="truck" size={16} />Orders of {formatMoney(delivery.freeOver)} or more</span><strong>Free</strong></div>
            {delivery.note && <p>{delivery.note}</p>}
          </div>
        )}
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

export function OrderApps() {
  const { brand, apps } = useStore().content;
  if (!apps.platforms.length) return null;
  return (
    <section className="apps-section section-pad" id="order-apps" aria-labelledby="apps-title">
      <div className="container apps-layout">
        <div className="apps-copy" data-reveal>
          <Eyebrow>{apps.eyebrow}</Eyebrow>
          <h2 className="section-title" id="apps-title"><Lines text={apps.title} /></h2>
          <p>{apps.body}</p>
        </div>
        <div className="apps-cards">
          {apps.platforms.map((platform, i) => {
            const href = safeLink(platform.url);
            const body = (
              <>
                <span className="app-card-top">
                  {platform.logo
                    ? <img className="app-logo" src={assetUrl(platform.logo)} alt="" width={58} height={58} loading="lazy" decoding="async" />
                    : <span className="app-mark" aria-hidden="true">{platform.name.charAt(0)}</span>}
                  <span className="app-card-name"><strong>{platform.name}</strong><small>{platform.tagline}</small></span>
                </span>
                <span className="app-card-cta">
                  {href ? <>Order on {platform.name}</> : <>Search “{titleCase(brand.name)}” on {platform.name}</>}
                  {href && <span className="app-card-arrow"><Icon name="arrow-up-right" size={16} /></span>}
                </span>
              </>
            );
            const style = { "--brand": safeColor(platform.color), ...stagger(i, 100) } as CSSProperties;
            return href
              ? <a className="app-card" href={href} target="_blank" rel="noopener noreferrer" data-reveal style={style} key={i} aria-label={`Order ${titleCase(brand.name)} on ${platform.name} (opens in a new tab)`}>{body}</a>
              : <div className="app-card" data-reveal style={style} key={i}>{body}</div>;
          })}
          {apps.note && <p className="apps-note" data-reveal><Icon name="spark" size={15} /> {apps.note}</p>}
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
