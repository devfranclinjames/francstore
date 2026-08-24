import { useRef, useState } from 'react'
import ItemButton from './ItemButton.jsx'

export default function ItemSection({ title, items, onItemClick, onAddClick, onReorder }) {
  const dragId = useRef(null)
  const [overId, setOverId] = useState(null)

  function handleDragStart(e, id) {
    dragId.current = id
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, id) {
    e.preventDefault()
    if (overId !== id) setOverId(id)
  }

  function handleDragEnd() {
    dragId.current = null
    setOverId(null)
  }

  function handleDrop(e, targetId) {
    e.preventDefault()
    const sourceId = dragId.current
    dragId.current = null
    setOverId(null)
    if (sourceId == null || sourceId === targetId) return

    const ids = items.map((i) => i.id)
    const from = ids.indexOf(sourceId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1) return

    const reordered = [...ids]
    reordered.splice(from, 1)
    reordered.splice(to, 0, sourceId)
    onReorder(reordered)
  }

  return (
    <section className="item-section">
      <div className="section-heading-row">
        <h2 className="section-heading">{title}</h2>
        <span className="section-count">{items.length}</span>
      </div>

      <div className="item-grid">
        {items.map((item) => (
          <div
            key={item.id}
            className={`item-drag-wrap ${overId === item.id ? 'drag-over' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
          >
            <ItemButton item={item} onClick={onItemClick} />
          </div>
        ))}

        <button className="item-btn add-item-btn" onClick={onAddClick}>
          <span className="add-plus">+</span>
          <span className="item-name">Add item</span>
        </button>
      </div>

      {items.length === 0 && (
        <p className="section-empty">No items here yet — use + Add item, or search cleared this out.</p>
      )}
    </section>
  )
}
