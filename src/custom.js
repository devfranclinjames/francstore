// Find all elements with class "item-name"
const allItems = document.querySelectorAll('.item-name');

// Find the one that contains "Cold" in its text
let targetItem = null;
allItems.forEach(item => {
  if (item.textContent.trim().includes('Cold')) {
    targetItem = item;
  }
});

if (targetItem) {
  // Get the parent with class "item-btn"
  const parentBtn = targetItem.closest('.item-btn');
  
  if (parentBtn) {
    // Add class "skyblueme" to the parent
    parentBtn.classList.add('skyblueme');
    console.log('Class "skyblueme" added successfully!');
  }
}