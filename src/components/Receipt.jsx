import { forwardRef } from 'react'
import { STORE_NAME, GREETING } from '../config.js'

const Receipt = forwardRef(function Receipt({ data }, ref) {
  if (!data) return null
  const { transactionNo, date, customerNo, items, total } = data

  return (
    <div className="receipt-offscreen">
      <div className="receipt" ref={ref}>
        <div className="receipt-store-name">{STORE_NAME}</div>
        <div className="receipt-subtitle">Official Sales Receipt</div>

        <div className="receipt-dashed" />

        <div className="receipt-meta">
          <div>
            <span>Transaction No.</span>
            <span>{String(transactionNo).padStart(4, '0')}</span>
          </div>
          <div>
            <span>Date</span>
            <span>{date}</span>
          </div>
          <div>
            <span>Customer No.</span>
            <span>{customerNo?.trim() ? customerNo : 'Walk-in'}</span>
          </div>
        </div>

        <div className="receipt-dashed" />

        <div className="receipt-items">
          <div className="receipt-items-head">
            <span>Item</span>
            <span>Amount</span>
          </div>
          {items.map((line) => (
            <div className="receipt-item-row" key={line.id}>
              <span className="receipt-item-name">
                {line.name}
                <span className="receipt-item-qty"> × {line.qty} @ ₱{Number(line.price).toFixed(2)}</span>
              </span>
              <span className="receipt-item-amount">₱{(line.price * line.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="receipt-dashed" />

        <div className="receipt-total-row">
          <span>TOTAL</span>
          <span>₱{total.toFixed(2)}</span>
        </div>

        <div className="receipt-dashed" />

        <div className="receipt-signature">
          <span className="receipt-signature-label">Customer Signature</span>
          <div className="receipt-signature-line" />
        </div>

        <div className="receipt-dashed" />

        <div className="receipt-greeting">{GREETING}</div>
      </div>
    </div>
  )
})

export default Receipt
