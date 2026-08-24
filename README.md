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
   - This creates 5 tabs: `Items`, `Images`, `Counter`, `CustomerCounter`,
     `Transactions`, and seeds 10 sample sari-sari store items (5 bulk, 5 single).
5. Click **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize again if asked.
6. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

**Already deployed an earlier version?** Paste the updated `Code.gs` over
your existing Apps Script project, then **Deploy > Manage deployments >
Edit (pencil) > New version > Deploy**. Your existing sheet and web app URL
keep working — the new `category` column and `CustomerCounter` tab get added
automatically the next time the script runs.

### Editing items and images later
- **Items** tab: edit `name` / `price` / `category` (`bulk` or `single`)
  directly any time, changes show up on next app refresh. Row order in this
  tab mirrors the order shown in the app within each category — dragging
  items in the app rewrites these rows to match.
- **Images** tab: each item points to an `imageKey`. Paste an image URL into
  the `imageUrl` column for that key and the app will show the real photo
  instead of the emoji placeholder — no code changes needed.
- **CustomerCounter** tab: a single ever-increasing number, handed out to
  each transaction when you hit Print. It never resets — edit the number in
  the sheet directly if you ever need to reset or bump it manually.
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

- **Left panel** — items are split into two sections, **Bulk Orders** and
  **Single Orders**, each pulled from the `Items` / `Images` sheets. Tap a
  square to add it to the cart. Each section has its own **+ Add item**
  button — pick a name, price, and a placeholder emoji, and it's saved
  straight back to the sheet under that category.
- **Drag to reorder** — press and drag any item square within its own
  section to reorder it. The new order is saved back to the `Items` sheet
  automatically, so the sheet's row order always matches what's on screen.
  Items reorder within their own section only (Bulk among Bulk, Single among
  Single).
- **Search bar** (beside the ✏️ button) — filters both sections by item name
  as you type.
- **✏️ Edit items** — opens a panel listing every item; tap the pencil on a
  row to edit its name, price, or icon in place, or the trash icon to remove
  it from the grid entirely (writes straight back to the sheets; removing an
  item also clears it out of the current cart if it was in there).
- **Right panel** (~26% width) — the live cart: adjust quantity, remove
  lines, and see the running total. There's no manual customer-number field
  — a customer number is assigned automatically from the `CustomerCounter`
  sheet each time you print.
- **Print Receipt** — asks the Apps Script backend for the next transaction
  number (auto-increments daily, resets each morning) and the next customer
  number (auto-increments forever), renders a hidden receipt template (store
  name, transaction no., customer no., date, itemized list, total, a blank
  signature line, and the "Daghang salamat sa pag palit, sunod napod!"
  sign-off), captures it as a JPG with `html2canvas`, and opens a print
  dialog with just that image. The sale is also logged to the `Transactions`
  sheet, and the cart clears for the next customer.

## Notes / things you can extend later

- Drag-to-reorder uses the browser's native HTML5 drag-and-drop, which works
  reliably with a mouse/trackpad. Touch-drag support varies by mobile
  browser — worth testing directly if you'll run this mainly on a tablet.
- Popup blockers can prevent the print window from opening — allow popups
  for the site the first time you print.
- The receipt image downloads/prints at 320px width (~80mm thermal-printer
  proportions) — adjust `.receipt { width: ... }` in `src/App.css` if your
  printer paper is a different size.
