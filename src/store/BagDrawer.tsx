import { Icon } from "../components/Icon";
import { Eyebrow, PillButton, QuantityControl } from "../components/ui";
import { MAX_QTY } from "../hooks/useCart";
import { assetUrl, formatMoney } from "../content";
import { useDialog } from "../hooks/useDialog";
import { useStore } from "./StoreContext";

export function BagDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, content, goTo } = useStore();
  const ref = useDialog<HTMLElement>(open, onClose);
  if (!open) return null;

  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="bag-drawer" ref={ref} role="dialog" aria-modal="true" aria-labelledby="bag-title">
        <div className="drawer-header">
          <div><Eyebrow dot={false}>A very good decision</Eyebrow><h2 id="bag-title">Your bag <span>({cart.count})</span></h2></div>
          <button className="icon-button drawer-close" type="button" aria-label="Close bag" onClick={onClose}><Icon name="close" size={19} /></button>
        </div>
        {cart.count === 0 ? (
          <div className="empty-bag">
            <span className="empty-bag-icon"><Icon name="bag" size={24} /></span>
            <h3>Nothing sweet in here yet.</h3>
            <p>Pick a favourite and we will take it from here.</p>
            <PillButton tone="dark" onClick={() => { onClose(); goTo("products"); }}>Explore the menu</PillButton>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {cart.lines.map(({ product, qty }) => (
                <article className="drawer-item" key={product.id}>
                  <img src={assetUrl(product.image)} alt="" />
                  <div className="drawer-item-info">
                    <h3>{product.name}</h3><span>{product.size}</span><strong>{formatMoney(product.price)}</strong>
                    <QuantityControl name={product.name} qty={qty} max={MAX_QTY} onChange={(amount) => cart.change(product.id, amount)} />
                  </div>
                  <button className="remove-item" type="button" aria-label={`Remove ${product.name} from your bag`} onClick={() => cart.remove(product.id)}><Icon name="close" size={15} /></button>
                </article>
              ))}
            </div>
            <div className="drawer-footer">
              <div className="drawer-subtotal"><span>Subtotal</span><strong>{formatMoney(cart.subtotal)}</strong></div>
              <p><Icon name="snow" size={15} /> {cart.free ? "Your order ships free." : `Flat ${formatMoney(content.delivery.fee)} chilled delivery, added at checkout.`}</p>
              <PillButton tone="dark" className="drawer-checkout" onClick={() => goTo("payment")}>Continue to checkout</PillButton>
              <button className="continue-shopping" type="button" onClick={onClose}>Keep browsing</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
