import { useState } from 'react'

export const EMOJI_CHOICES = [
  '🍚', '🍞', '🥤', '☕', '🍬', '🥚', '🧴', '🍜',
  '🥫', '🍪', '🧻', '🚬', '🍫', '🧃', '📦', '🥛',
  '🧂', '🍯', '🧼', '🩹', '🍺', '🧊', '🍿', '🛢️',
]

export default function AddItemModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Give the item a name.'); return }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) { setError('Enter a valid price.'); return }

    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), price: priceNum, emoji })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save the item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-box" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Add new item</h2>

        <label className="field">
          <span>Item name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bottled Water" autoFocus />
        </label>

        <label className="field">
          <span>Price (₱)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </label>

        <div className="field">
          <span>Icon</span>
          <div className="emoji-grid">
            {EMOJI_CHOICES.map((em) => (
              <button
                type="button"
                key={em}
                className={`emoji-choice ${emoji === em ? 'selected' : ''}`}
                onClick={() => setEmoji(em)}
              >
                {em}
              </button>
            ))}
          </div>
          <p className="hint">
            This is just a placeholder icon — you can swap in a real product photo later by
            editing the "Images" tab of your Google Sheet.
          </p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add item'}
          </button>
        </div>
      </form>
    </div>
  )
}
