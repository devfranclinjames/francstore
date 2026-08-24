export default function Cart({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
  customerNo,
  setCustomerNo,
  total,
  onPrint,
  printing,
  error,
}) {
  return (
    <aside className="cart-panel">
      <div className="cart-header">
        <span className="cart-eyebrow">Order</span>
        <h2>Current Cart</h2>
      </div>

      <div className="cart-list">
        {cart.length === 0 && (
          <p className="cart-empty">Tap an item on the left to add it here.</p>
        )}
        {cart.map((line) => (
          <div className="cart-line" key={line.id}>
            <span className="cart-line-emoji">
              {line.imageUrl ? <img src={line.imageUrl} alt="" /> : line.emoji}
            </span>
            <div className="cart-line-info">
              <span className="cart-line-name">{line.name}</span>
              <span className="cart-line-unit">₱{Number(line.price).toFixed(2)} each</span>
            </div>
            <div className="cart-qty">
              <button onClick={() => onDecrease(line.id)} aria-label="Decrease quantity">−</button>
              <span>{line.qty}</span>
              <button onClick={() => onIncrease(line.id)} aria-label="Increase quantity">+</button>
            </div>
            <span className="cart-line-total">₱{(line.price * line.qty).toFixed(2)}</span>
            <button className="cart-line-remove" onClick={() => onRemove(line.id)} aria-label="Remove item">
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <label className="field field-compact">
          <span>Customer No. (optional)</span>
          <input
            value={customerNo}
            onChange={(e) => setCustomerNo(e.target.value)}
            placeholder="e.g. Walk-in"
          />
        </label>

        <div className="cart-total-row">
          <span>Total</span>
          <span className="cart-total-amount">₱{total.toFixed(2)}</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="btn-print" onClick={onPrint} disabled={printing || cart.length === 0}>
          {printing ? 'Preparing receipt…' : '🖨️ Print Receipt'}
        </button>
      </div>
    </aside>
  )
}
