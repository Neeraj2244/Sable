import type { CSSProperties } from "react";
import { ClampedText } from "../components/ClampedText";
import { Icon } from "../components/Icon";
import { assetUrl, formatMoney } from "../content";
import type { Product } from "../content/types";
import { useStore } from "./StoreContext";

/** One menu item. Used by the home page grid and the Products page rows. */
export function ProductCard({ product, reveal = false, style }: { product: Product; reveal?: boolean; style?: CSSProperties }) {
  const { cart, addToBag } = useStore();
  const qty = cart.qtyOf(product.id);
  return (
    <article className="product-card" data-reveal={reveal || undefined} style={style}>
      <div className="product-image-wrap">
        <img src={assetUrl(product.image)} alt={product.imageAlt} loading="lazy" decoding="async" style={product.imagePosition ? { objectPosition: product.imagePosition } : undefined} />
        {product.label && <span className="product-ribbon">{product.label}</span>}
        {qty > 0 && <span className="product-in-bag"><Icon name="check" size={13} /> In your bag · {qty}</span>}
      </div>
      <div className="product-body">
        <div className="product-title-row"><h3>{product.name}</h3><span className="product-price">{formatMoney(product.price)}</span></div>
        <ClampedText className="product-description" text={product.description} />
        <div className="product-footer">
          <span className="product-size">{product.size}</span>
          <button className="add-button" type="button" onClick={() => addToBag(product.id)} aria-label={`Add ${product.name}, ${formatMoney(product.price)}, to your bag`}>
            <span>{qty ? "Add another" : "Add to bag"}</span><Icon name={qty ? "plus" : "arrow-up-right"} size={qty ? 15 : 16} />
          </button>
        </div>
      </div>
    </article>
  );
}
