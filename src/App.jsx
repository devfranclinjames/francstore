import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import ItemButton from './components/ItemButton.jsx'
import AddItemModal from './components/AddItemModal.jsx'
import ManageItemsModal from './components/ManageItemsModal.jsx'
import Cart from './components/Cart.jsx'
import Receipt from './components/Receipt.jsx'
import { STORE_NAME } from './config.js'
import {
  fetchItems,
  addItemApi,
  updateItemApi,
  deleteItemApi,
  getNextTransactionNoApi,
  logTransactionApi,
} from './api.js'

function todayLabel() {
  return new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function printImage(dataUrl, transactionNo) {
  const win = window.open('', '_blank', 'width=420,height=700')
  if (!win) {
    alert('Please allow pop-ups for this site so the receipt can be printed.')
    return
  }
  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Receipt ${transactionNo}</title>
        <style>
          @page { margin: 0; }
          html, body { margin: 0; padding: 0; background: #fff; }
          body { display: flex; justify-content: center; padding: 16px 0; }
          img { width: 320px; max-width: 100%; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="Receipt" />
      </body>
    </html>
  `)
  win.document.close()
  const img = win.document.querySelector('img')
  img.onload = () => {
    win.focus()
    win.print()
  }
}

export default function App() {
  const [items, setItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [cart, setCart] = useState([])
  const [customerNo, setCustomerNo] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)

  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState(null)
  const [receiptData, setReceiptData] = useState(null)

  const receiptRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchItems()
      .then((data) => { if (!cancelled) setItems(data) })
      .catch((err) => { if (!cancelled) setLoadError(err.message) })
      .finally(() => { if (!cancelled) setLoadingItems(false) })
    return () => { cancelled = true }
  }, [])

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((line) => line.id === item.id)
      if (existing) {
        return prev.map((line) =>
          line.id === item.id ? { ...line, qty: line.qty + 1 } : line
        )
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function increaseQty(id) {
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)))
  }

  function decreaseQty(id) {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0)
    )
  }

  function removeLine(id) {
    setCart((prev) => prev.filter((l) => l.id !== id))
  }

  async function handleAddItem({ name, price, emoji }) {
    const newItem = await addItemApi({ name, price, emoji })
    setItems((prev) => [...prev, newItem])
  }

  async function handleUpdateItem({ id, name, price, emoji }) {
    const updated = await updateItemApi({ id, name, price, emoji })
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
    setCart((prev) =>
      prev.map((line) => (line.id === updated.id ? { ...line, ...updated, qty: line.qty } : line))
    )
  }

  async function handleDeleteItem(id) {
    await deleteItemApi({ id })
    setItems((prev) => prev.filter((it) => it.id !== id))
    setCart((prev) => prev.filter((line) => line.id !== id))
  }

  const total = cart.reduce((sum, l) => sum + l.price * l.qty, 0)

  async function handlePrint() {
    if (cart.length === 0) return
    setPrintError(null)
    setPrinting(true)
    try {
      const trx = await getNextTransactionNoApi()
      setReceiptData({
        transactionNo: trx.transactionNo,
        date: trx.date || todayLabel(),
        customerNo,
        items: cart,
        total,
      })
    } catch (err) {
      setPrintError(err.message || 'Could not start the receipt.')
      setPrinting(false)
    }
  }

  // Once receiptData is set, the hidden Receipt renders, then we capture it.
  useEffect(() => {
    if (!receiptData) return
    let cancelled = false

    async function run() {
      try {
        await new Promise((r) => setTimeout(r, 60)) // let the DOM paint
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
        })
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        if (cancelled) return

        printImage(dataUrl, receiptData.transactionNo)

        logTransactionApi({
          transactionNo: receiptData.transactionNo,
          date: receiptData.date,
          customerNo: receiptData.customerNo,
          items: receiptData.items.map((l) => ({ name: l.name, price: l.price, qty: l.qty })),
          total: receiptData.total,
        }).catch(() => {})

        setCart([])
        setCustomerNo('')
      } catch (err) {
        if (!cancelled) setPrintError('Could not generate the receipt image.')
      } finally {
        if (!cancelled) {
          setPrinting(false)
          setReceiptData(null)
        }
      }
    }

    run()
    return () => { cancelled = true }
  }, [receiptData])

  return (
    <div className="app-shell">
      <main className="panel-items">
        <header className="items-header">
          <div>
            <span className="store-eyebrow">Point of Sale</span>
            <h1>{STORE_NAME}</h1>
          </div>
          <div className="header-actions">
            <span className="today-date">{todayLabel()}</span>
            <button
              className="icon-btn header-icon-btn"
              title="Edit items"
              onClick={() => setShowManageModal(true)}
            >
              ✏️
            </button>
            <button
              className="icon-btn header-icon-btn"
              title="Delete items"
              onClick={() => setShowManageModal(true)}
            >
              🗑️
            </button>
          </div>
        </header>

        {loadError && (
          <p className="form-error">
            Could not load items from your Google Sheet: {loadError}. Check that
            APPS_SCRIPT_URL is set correctly in src/config.js.
          </p>
        )}

        {loadingItems ? (
          <p className="loading-text">Loading items…</p>
        ) : (
          <div className="item-grid">
            {items.map((item) => (
              <ItemButton key={item.id} item={item} onClick={addToCart} />
            ))}
            <button className="item-btn add-item-btn" onClick={() => setShowAddModal(true)}>
              <span className="add-plus">+</span>
              <span className="item-name">Add item</span>
            </button>
          </div>
        )}
      </main>

      <Cart
        cart={cart}
        onIncrease={increaseQty}
        onDecrease={decreaseQty}
        onRemove={removeLine}
        customerNo={customerNo}
        setCustomerNo={setCustomerNo}
        total={total}
        onPrint={handlePrint}
        printing={printing}
        error={printError}
      />

      {showAddModal && (
        <AddItemModal onClose={() => setShowAddModal(false)} onSave={handleAddItem} />
      )}

      {showManageModal && (
        <ManageItemsModal
          items={items}
          onClose={() => setShowManageModal(false)}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      )}

      <Receipt data={receiptData} ref={receiptRef} />
    </div>
  )
}
