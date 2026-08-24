// Find all items and add class to parent if text contains "cold"
document.querySelectorAll('.item-name').forEach(item => {
  if (item.textContent.toLowerCase().includes('cold')) {
    item.closest('.item-btn')?.classList.add('skyblueme');
  }
});