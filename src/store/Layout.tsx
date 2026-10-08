import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Icon } from "../components/Icon";
import { Brand, Copyright, Lines } from "../components/ui";
import { useHash } from "../hooks/useHash";
import { useStore } from "./StoreContext";

/** Shared chrome for every storefront page that shows the main navigation. */
export function SiteLayout({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  // Move focus without touching the URL: a "#main-content" hash would be read as a page change.
  const skip = (event: MouseEvent) => {
    event.preventDefault();
    main.current?.focus();
  };
  return (
    <>
      <a className="skip-link" href="#main-content" onClick={skip}>Skip to content</a>
      <Header />
      <main id="main-content" ref={main} tabIndex={-1}>{children}</main>
      <Footer />
    </>
  );
}

function Header() {
  const { content: { brand, nav }, cart, openBag } = useStore();
  const hash = useHash();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [hash]);

  const links: [string, string][] = [["#products", nav.products], ["#craft", nav.craft], ["#stories", nav.stories], ["#delivery", nav.delivery]];
  const linkItems = (onClick?: () => void) => links.map(([href, label]) => (
    <a href={href} key={href} aria-current={hash === "products" && href === "#products" ? "page" : undefined} onClick={onClick}>{label}</a>
  ));

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Brand name={brand.name} />
        <nav className="desktop-nav" aria-label="Main navigation">{linkItems()}</nav>
        <div className="nav-actions">
          <button className="bag-button" type="button" onClick={openBag} aria-label={`Open your bag${cart.count ? `, ${cart.count} ${cart.count === 1 ? "item" : "items"}` : ""}`}>
            <span className="bag-label">Your bag</span><Icon name="bag" size={19} /><span className="bag-count">{cart.count}</span>
          </button>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>
      <nav id="mobile-navigation" className={`mobile-nav${menuOpen ? " is-open" : ""}`} aria-label="Mobile navigation">{linkItems(() => setMenuOpen(false))}</nav>
    </header>
  );
}

function Footer() {
  const { brand, footer, nav } = useStore().content;
  const columns: { heading: string; links: [string, string][] }[] = [
    { heading: footer.tableHeading, links: [["#products", nav.products], ["#menu", nav.menu], ["#craft", nav.craft], ["#stories", nav.stories]] },
    { heading: footer.detailsHeading, links: [["#delivery", "Delivery & pricing"], ["#faq", "Questions"], [`mailto:${brand.contactEmail}`, "Get in touch"]] },
  ];
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand-column"><Brand name={brand.name} /><p><Lines text={footer.tagline} always /></p></div>
          {columns.map((column) => (
            <div className="footer-links" key={column.heading}>
              <h2>{column.heading}</h2>
              {column.links.map(([href, label]) => <a href={href} key={href}>{label}</a>)}
            </div>
          ))}
          <div className="footer-contact"><h2>{footer.contactHeading}</h2><span>{footer.contactText}</span></div>
        </div>
        <div className="footer-bottom"><Copyright name={brand.name} /><span>{footer.bottomText}</span><a href="#faq">Ingredients &amp; allergens</a></div>
      </div>
    </footer>
  );
}
