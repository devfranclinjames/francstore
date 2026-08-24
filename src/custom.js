// Find the item-name that contains "Cold" and add class to its item-btn parent
const item = Array.from(document.querySelectorAll('.item-name'))
  .find(el => el.textContent.includes('Cold'));

if (item) {
  item.closest('.item-btn')?.classList.add('skyblueme');
}