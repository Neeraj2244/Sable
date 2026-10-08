import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion, useResize } from "../hooks/useResize";
import { Icon } from "../components/Icon";
import { Eyebrow, Lines } from "../components/ui";
import type { Category, Product } from "../content/types";
import { OrderApps } from "./HomePage";
import { SiteLayout } from "./Layout";
import { ProductCard } from "./ProductCard";
import { useStore } from "./StoreContext";

type Row = Category & { products: Product[] };

const OTHER: Category = { id: "other", name: "More from our kitchen", description: "" };

/** Groups products by category, keeping category order; unknown categories collect in "Other". */
function useRows(categories: Category[], products: Product[]): Row[] {
  return useMemo(() => {
    const known = new Set(categories.map((c) => c.id));
    const rows: Row[] = categories.map((category) => ({ ...category, products: products.filter((p) => p.category === category.id) }));
    const orphans = products.filter((p) => !known.has(p.category));
    return orphans.length ? [...rows, { ...OTHER, products: orphans }] : rows;
  }, [categories, products]);
}

export function ProductsPage() {
  const { menu, shop } = useStore().content;
  const rows = useRows(menu.categories, menu.products);
  const jumpTo = (id: string) => document.getElementById(`category-${id}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

  return (
    <SiteLayout>
      <section className="shop-hero" aria-labelledby="shop-title">
        <div className="shop-hero-ring" aria-hidden="true" />
        <div className="container shop-hero-inner" data-reveal>
          <Eyebrow>{shop.eyebrow}</Eyebrow>
          <h1 className="section-title shop-title" id="shop-title"><Lines text={shop.title} /></h1>
          <p className="shop-intro">{shop.intro}</p>
          {rows.length > 1 && (
            <ul className="shop-chips" aria-label="Jump to a category">
              {rows.map((row) => (
                <li key={row.id}>
                  <button type="button" className="shop-chip" onClick={() => jumpTo(row.id)}>{row.name}<span>{row.products.length}</span></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="shop-rows">
        {rows.map((row) => <ProductRow row={row} comingSoon={shop.comingSoon} key={row.id} />)}
      </div>

      <OrderApps />
    </SiteLayout>
  );
}

function ProductRow({ row, comingSoon }: { row: Row; comingSoon: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const titleId = `category-${row.id}-title`;

  // Whether there is more to scroll in each direction, to enable/disable the arrows.
  const updateEdges = () => {
    const el = track.current;
    if (el) setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useResize(track, updateEdges, [row.products.length]);
  useEffect(() => {
    const el = track.current;
    el?.addEventListener("scroll", updateEdges, { passive: true });
    return () => el?.removeEventListener("scroll", updateEdges);
  }, []);

  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.85, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  const scrollable = !(edge.start && edge.end);

  return (
    <section className="shop-row" id={`category-${row.id}`} aria-labelledby={titleId}>
      <div className="container shop-row-head" data-reveal>
        <div>
          <h2 id={titleId}>{row.name} <span className="shop-count">{row.products.length} {row.products.length === 1 ? "item" : "items"}</span></h2>
          {row.description && <p>{row.description}</p>}
        </div>
        {scrollable && (
          <div className="shop-arrows">
            <button type="button" aria-label={`Scroll ${row.name} left`} onClick={() => scroll(-1)} disabled={edge.start}><Icon name="arrow-left" size={18} /></button>
            <button type="button" aria-label={`Scroll ${row.name} right`} onClick={() => scroll(1)} disabled={edge.end}><Icon name="arrow-right" size={18} /></button>
          </div>
        )}
      </div>

      {row.products.length ? (
        <div className={`shop-track-wrap${edge.end ? "" : " has-more"}`} data-reveal>
          <div className="shop-track" ref={track} role="region" aria-label={`${row.name}: scroll sideways for more`} tabIndex={0}>
            {row.products.map((product) => <div className="shop-slide" key={product.id}><ProductCard product={product} /></div>)}
          </div>
        </div>
      ) : (
        <div className="container" data-reveal>
          <div className="shop-empty"><span className="shop-empty-icon"><Icon name="spark" size={22} /></span><p>{comingSoon}</p></div>
        </div>
      )}
    </section>
  );
}
