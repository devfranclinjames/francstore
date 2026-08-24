/**
 * Franc Store POS — Apps Script backend
 * ---------------------------------------------------------------
 * Setup:
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script, delete the placeholder code, paste this file.
 * 3. Run `setupSheets` once (Run menu) to create the tabs + seed sample items.
 *    The first run will ask you to authorize the script — that's expected.
 * 4. Deploy > New deployment > Type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the Web app URL and paste it into src/config.js as APPS_SCRIPT_URL.
 * ---------------------------------------------------------------
 * Sheets created:
 *   Items           | id | name | price | imageKey | category |
 *   Images          | imageKey | emoji | imageUrl |   (fill in imageUrl later
 *                                                        to replace the emoji
 *                                                        placeholder with a real photo)
 *   Counter         | date | lastNumber |             (daily transaction counter, resets each day)
 *   CustomerCounter | lastNumber |                    (customer number, never resets)
 *   Transactions    | transactionNo | date | time | customerNo | itemsJson | total |
 */

var TIMEZONE = Session.getScriptTimeZone() || 'Asia/Manila';

var DEFAULT_ITEMS = [
  // [name, price, emoji, category]
  ['Rice (1kg)', 65, '🍚', 'bulk'],
  ['Sugar (1kg)', 70, '🍬', 'bulk'],
  ['Eggs (tray)', 210, '🥚', 'bulk'],
  ['Cooking Oil', 95, '🧴', 'bulk'],
  ['Canned Goods (case)', 480, '🥫', 'bulk'],
  ['Pandesal', 15, '🍞', 'single'],
  ['Softdrinks', 35, '🥤', 'single'],
  ['Coffee', 12, '☕', 'single'],
  ['Instant Noodles', 15, '🍜', 'single'],
  ['Biscuits', 25, '🍪', 'single'],
]

// ---------------------------------------------------------------
// Web app entry points
// ---------------------------------------------------------------

function doGet(e) {
  ensureSheets()
  var action = e.parameter.action

  if (action === 'getItems') {
    return jsonResponse({ success: true, items: getItemsData() })
  }

  return jsonResponse({ success: false, error: 'Unknown action: ' + action })
}

function doPost(e) {
  ensureSheets()
  var body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return jsonResponse({ success: false, error: 'Invalid request body' })
  }

  switch (body.action) {
    case 'addItem':
      return jsonResponse(addItem(body))
    case 'updateItem':
      return jsonResponse(updateItem(body))
    case 'deleteItem':
      return jsonResponse(deleteItem(body))
    case 'reorderItems':
      return jsonResponse(reorderItems(body))
    case 'getNextTransactionNo':
      return jsonResponse(getNextTransactionNo())
    case 'getNextCustomerNo':
      return jsonResponse(getNextCustomerNo())
    case 'logTransaction':
      return jsonResponse(logTransaction(body))
    default:
      return jsonResponse({ success: false, error: 'Unknown action: ' + body.action })
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}

// ---------------------------------------------------------------
// Sheet setup
// ---------------------------------------------------------------

function setupSheets() {
  ensureSheets()
}

function ensureSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()

  var itemsSheet = createSheetIfMissing(ss, 'Items', ['id', 'name', 'price', 'imageKey', 'category'])
  var imagesSheet = createSheetIfMissing(ss, 'Images', ['imageKey', 'emoji', 'imageUrl'])
  createSheetIfMissing(ss, 'Counter', ['date', 'lastNumber'])
  var customerSheet = createSheetIfMissing(ss, 'CustomerCounter', ['lastNumber'])
  createSheetIfMissing(ss, 'Transactions', [
    'transactionNo', 'date', 'time', 'customerNo', 'itemsJson', 'total',
  ])

  // Seed sample items only the very first time (Items sheet has just the header row)
  if (itemsSheet.getLastRow() === 1) {
    DEFAULT_ITEMS.forEach(function (row, i) {
      var id = i + 1
      var imageKey = 'img_seed_' + id
      imagesSheet.appendRow([imageKey, row[2], ''])
      itemsSheet.appendRow([id, row[0], row[1], imageKey, row[3]])
    })
  }

  if (customerSheet.getLastRow() === 1) {
    customerSheet.appendRow([0])
  }
}

function createSheetIfMissing(ss, name, headers) {
  var sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    sheet.appendRow(headers)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

// ---------------------------------------------------------------
// Items
// ---------------------------------------------------------------

function getItemsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var itemsSheet = ss.getSheetByName('Items')
  var imagesSheet = ss.getSheetByName('Images')

  var imageRows = imagesSheet.getDataRange().getValues()
  var imageMap = {}
  for (var i = 1; i < imageRows.length; i++) {
    var row = imageRows[i]
    if (!row[0]) continue
    imageMap[row[0]] = { emoji: row[1], imageUrl: row[2] }
  }

  var itemRows = itemsSheet.getDataRange().getValues()
  var items = []
  for (var j = 1; j < itemRows.length; j++) {
    var r = itemRows[j]
    if (!r[0]) continue
    var img = imageMap[r[3]] || { emoji: '🛒', imageUrl: '' }
    items.push({
      id: r[0],
      name: r[1],
      price: r[2],
      imageKey: r[3],
      category: r[4] || 'single',
      emoji: img.emoji,
      imageUrl: img.imageUrl,
    })
  }
  return items
}

function addItem(body) {
  var name = (body.name || '').toString().trim()
  var price = parseFloat(body.price)
  var emoji = body.emoji || '🛒'
  var category = body.category === 'bulk' ? 'bulk' : 'single'

  if (!name) return { success: false, error: 'Item name is required' }
  if (isNaN(price) || price < 0) return { success: false, error: 'Invalid price' }

  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var itemsSheet = ss.getSheetByName('Items')
  var imagesSheet = ss.getSheetByName('Images')

  var lastRow = itemsSheet.getLastRow()
  var newId = 1
  if (lastRow > 1) {
    var ids = itemsSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(Number)
    newId = ids.length ? Math.max.apply(null, ids) + 1 : 1
  }

  var imageKey = 'img_' + new Date().getTime()
  imagesSheet.appendRow([imageKey, emoji, ''])
  itemsSheet.appendRow([newId, name, price, imageKey, category])

  return {
    success: true,
    item: {
      id: newId,
      name: name,
      price: price,
      imageKey: imageKey,
      category: category,
      emoji: emoji,
      imageUrl: '',
    },
  }
}

function updateItem(body) {
  var id = body.id
  var name = (body.name || '').toString().trim()
  var price = parseFloat(body.price)
  var emoji = body.emoji

  if (!id) return { success: false, error: 'Missing item id' }
  if (!name) return { success: false, error: 'Item name is required' }
  if (isNaN(price) || price < 0) return { success: false, error: 'Invalid price' }

  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var itemsSheet = ss.getSheetByName('Items')
  var imagesSheet = ss.getSheetByName('Images')

  var data = itemsSheet.getDataRange().getValues()
  var rowIndex = -1
  var imageKey = null
  var category = 'single'
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      rowIndex = i + 1
      imageKey = data[i][3]
      category = data[i][4] || 'single'
      break
    }
  }
  if (rowIndex === -1) return { success: false, error: 'Item not found' }

  itemsSheet.getRange(rowIndex, 2, 1, 2).setValues([[name, price]])

  var imageUrl = ''
  var imgData = imagesSheet.getDataRange().getValues()
  for (var j = 1; j < imgData.length; j++) {
    if (imgData[j][0] === imageKey) {
      if (emoji) {
        imagesSheet.getRange(j + 1, 2).setValue(emoji)
      } else {
        emoji = imgData[j][1]
      }
      imageUrl = imgData[j][2]
      break
    }
  }

  return {
    success: true,
    item: {
      id: id,
      name: name,
      price: price,
      imageKey: imageKey,
      category: category,
      emoji: emoji || '🛒',
      imageUrl: imageUrl || '',
    },
  }
}

function deleteItem(body) {
  var id = body.id
  if (!id) return { success: false, error: 'Missing item id' }

  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var itemsSheet = ss.getSheetByName('Items')
  var data = itemsSheet.getDataRange().getValues()

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      itemsSheet.deleteRow(i + 1)
      return { success: true }
    }
  }
  return { success: false, error: 'Item not found' }
}

/**
 * Reorders items within one category (bulk|single), leaving every item in
 * the other category exactly where it was, and physically rewrites the
 * Items sheet rows so the sheet reflects the same order shown in the app.
 */
function reorderItems(body) {
  var category = body.category === 'bulk' ? 'bulk' : 'single'
  var orderedIds = body.orderedIds || []
  if (!orderedIds.length) return { success: false, error: 'No order given' }

  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var itemsSheet = ss.getSheetByName('Items')
  var data = itemsSheet.getDataRange().getValues()
  var headers = data[0]
  var rows = data.slice(1)

  var targetRows = {}
  rows.forEach(function (r) {
    var cat = r[4] || 'single'
    if (cat === category) targetRows[r[0]] = r
  })

  var newTargetSequence = orderedIds
    .map(function (id) { return targetRows[id] })
    .filter(Boolean)

  var pointer = 0
  var newRows = rows.map(function (r) {
    var cat = r[4] || 'single'
    if (cat === category) {
      var replacement = newTargetSequence[pointer]
      pointer += 1
      return replacement || r
    }
    return r
  })

  if (newRows.length) {
    itemsSheet.getRange(2, 1, newRows.length, headers.length).setValues(newRows)
  }

  return { success: true }
}

// ---------------------------------------------------------------
// Daily transaction counter
// ---------------------------------------------------------------

function getNextTransactionNo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName('Counter')
  var today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd')

  var data = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === today) {
      var next = data[i][1] + 1
      sheet.getRange(i + 1, 2).setValue(next)
      return { success: true, transactionNo: next, date: formatDisplayDate() }
    }
  }

  sheet.appendRow([today, 1])
  return { success: true, transactionNo: 1, date: formatDisplayDate() }
}

function formatDisplayDate() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'MMM d, yyyy')
}

// ---------------------------------------------------------------
// Customer counter (never resets — increments forever)
// ---------------------------------------------------------------

function getNextCustomerNo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName('CustomerCounter')
  var last = sheet.getRange(2, 1).getValue()
  if (!last) last = 0
  var next = last + 1
  sheet.getRange(2, 1).setValue(next)
  return { success: true, customerNo: next }
}

// ---------------------------------------------------------------
// Transaction log
// ---------------------------------------------------------------

function logTransaction(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName('Transactions')

  var now = new Date()
  sheet.appendRow([
    body.transactionNo || '',
    body.date || Utilities.formatDate(now, TIMEZONE, 'MMM d, yyyy'),
    Utilities.formatDate(now, TIMEZONE, 'HH:mm:ss'),
    body.customerNo || 'Walk-in',
    JSON.stringify(body.items || []),
    body.total || 0,
  ])

  return { success: true }
}
