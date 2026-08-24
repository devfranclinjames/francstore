# Franc Store POS

A simple point-of-sale web app: tap item buttons to build a cart, then print a
Philippine-style JPG receipt. Item data and transaction logs live in a Google
Sheet, read and written through a Google Apps Script web app.

## 1. Set up the Google Sheet + Apps Script backend

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank sheet.
   Name it something like "Franc Store POS Data".
2. In the sheet, go to **Extensions > Apps Script**.
3. Delete the placeholder `Code.gs` content and paste in the contents of
   `apps-script/Code.gs` from this project.
4. In the function dropdown (top toolbar), select `setupSheets` and click **Run**.
   - The first run will prompt you to authorize the script — click through
     "Advanced" > "Go to project (unsafe)" since it's your own script.
   - This creates 4 tabs: `Items`, `Images`, `Counter`, `Transactions`, and
     seeds 10 sample sari-sari store items.
5. Click **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize again if asked.
6. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

### Editing items and images later
- **Items** tab: edit `name` / `price` directly any time, changes show up on
  next app refresh.
- **Images** tab: each item points to an `imageKey`. Paste an image URL into
  the `imageUrl` column for that key and the app will show the real photo
  instead of the emoji placeholder — no code changes needed.
- **Transactions** tab: a log of every printed receipt (transaction no, date,
  time, customer no, items as JSON, total) — handy for end-of-day totals.

## 2. Configure the React app

1. Open `src/config.js`.
2. Paste your Web app URL into `APPS_SCRIPT_URL`.

## 3. Run it

```bash
npm install
npm run dev
```

Open the printed local URL in your browser. To build a production version:

```bash
npm run build
npm run preview
```

## How it works

- **Left panel** — grid of square item buttons pulled from the `Items` /
  `Images` sheets. Tap one to add it to the cart. Tap **+ Add item** to create
  a brand new button — pick a name, price, and a placeholder emoji, and it's
  saved straight back to the sheet.
- **Right panel** (~26% width) — the live cart: adjust quantity, remove
  lines, optionally note a customer number, and see the running total.
- **✏️ / 🗑️ buttons beside the date** — open the "Edit & delete items" panel:
  a list of every item with a pencil to edit its name/price/icon in place and
  a trash icon to remove it from the grid entirely (both write straight back
  to the `Items`/`Images` sheets, and removing an item also clears it out of
  the current cart if it was in there).
- **Print Receipt** — asks the Apps Script backend for the next transaction
  number (auto-increments daily, resets each morning), renders a hidden
  receipt template (store name, transaction no., date, itemized list, total,
  a blank signature line, and the "Daghang salamat sa pag palit, sunod
  napod!" sign-off), captures it as a JPG with `html2canvas`, and opens a
  print dialog with just that image. The sale is also logged to the
  `Transactions` sheet, and the cart clears for the next customer.

## Notes / things you can extend later

- Popup blockers can prevent the print window from opening — allow popups
  for the site the first time you print.
- The receipt image downloads/prints at 320px width (~80mm thermal-printer
  proportions) — adjust `.receipt { width: ... }` in `src/App.css` if your
  printer paper is a different size.
