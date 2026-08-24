import { APPS_SCRIPT_URL } from './config.js'

// NOTE on CORS: Google Apps Script web apps don't respond well to
// "preflighted" requests (e.g. POST with Content-Type: application/json).
// Sending the body as text/plain avoids the preflight, and Code.gs parses
// it as JSON on the server side.

async function post(body) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

async function get(params) {
  const url = new URL(APPS_SCRIPT_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

export async function fetchItems() {
  const data = await get({ action: 'getItems' })
  if (!data.success) throw new Error(data.error || 'Could not load items')
  return data.items
}

export async function addItemApi({ name, price, emoji }) {
  const data = await post({ action: 'addItem', name, price, emoji })
  if (!data.success) throw new Error(data.error || 'Could not add item')
  return data.item
}

export async function updateItemApi({ id, name, price, emoji }) {
  const data = await post({ action: 'updateItem', id, name, price, emoji })
  if (!data.success) throw new Error(data.error || 'Could not update item')
  return data.item
}

export async function deleteItemApi({ id }) {
  const data = await post({ action: 'deleteItem', id })
  if (!data.success) throw new Error(data.error || 'Could not delete item')
  return data
}

export async function getNextTransactionNoApi() {
  const data = await post({ action: 'getNextTransactionNo' })
  if (!data.success) throw new Error(data.error || 'Could not get transaction number')
  return data
}

export async function logTransactionApi(payload) {
  const data = await post({ action: 'logTransaction', ...payload })
  if (!data.success) throw new Error(data.error || 'Could not save transaction')
  return data
}
