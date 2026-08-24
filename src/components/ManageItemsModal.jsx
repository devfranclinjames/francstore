import { useState } from 'react'
import { EMOJI_CHOICES } from './AddItemModal.jsx'

export default function ManageItemsModal({ items, onClose, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', emoji: '' })
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  function startEdit(item) {
    setEditingId(item.id)
    setForm({ name: item.name, price: item.price, emoji: item.emoji || '🛒' })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(item) {
    const priceNum = parseFloat(form.price)
    if (!form.name.trim()) { setError('Item name is required.'); return }
    if (isNaN(priceNum) || priceNum < 0) { setError('Enter a valid price.'); return }

    setBusyId(item.id)
    setError(null)
    try {
      await onUpdate({ id: item.id, name: form.name.trim(), price: priceNum, emoji: form.emoji })
      setEditingId(null)
    } catch (err) {
      setError(err.message || 'Could not save changes.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.name}" from the item grid?`)) return
    setBusyId(item.id)
    setError(null)
    try {
      await onDelete(item.id)
    } catch (err) {
      setError(err.message || 'Could not delete item.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Edit &amp; delete items</h2>

        {error && <p className="form-error">{error}</p>}

        <div className="manage-list">
          {items.length === 0 && <p className="cart-empty">No items yet.</p>}

          {items.map((item) => (
            <div className="manage-row" key={item.id}>
              {editingId === item.id ? (
                <>
                  <div className="manage-emoji-picker">
                    {EMOJI_CHOICES.slice(0, 12).map((em) => (
                      <button
                        type="button"
                        key={em}
                        className={`emoji-choice small ${form.emoji === em ? 'selected' : ''}`}
                        onClick={() => setForm((f) => ({ ...f, emoji: em }))}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <input
                    className="manage-input manage-input-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    className="manage-input manage-input-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                  <div className="manage-actions">
                    <button className="btn-secondary btn-small" onClick={cancelEdit} disabled={busyId === item.id}>
                      Cancel
                    </button>
                    <button className="btn-primary btn-small" onClick={() => saveEdit(item)} disabled={busyId === item.id}>
                      {busyId === item.id ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="manage-emoji">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.emoji}
                  </span>
                  <span className="manage-name">{item.name}</span>
                  <span className="manage-price">₱{Number(item.price).toFixed(2)}</span>
                  <div className="manage-actions">
                    <button className="icon-btn" title="Edit item" onClick={() => startEdit(item)}>
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      title="Delete item"
                      onClick={() => handleDelete(item)}
                      disabled={busyId === item.id}
                    >
                      {busyId === item.id ? '…' : '🗑️'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
