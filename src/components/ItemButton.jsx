export default function ItemButton({ item, onClick }) {
  const image = item.imageUrl
    ? <img className="item-image" src={item.imageUrl} alt={item.name} />
    : <span className="item-emoji">{item.emoji || '🛒'}</span>

  return (
    <button className="item-btn" onClick={() => onClick(item)}>
      {image}
      <span className="item-name">{item.name}</span>
      <span className="item-price-tag">₱{Number(item.price).toFixed(2)}</span>
    </button>
  )
}
// Find the button that contains the specific item name
const buttons = document.querySelectorAll('.item-btn');
buttons.forEach(btn => {
  const nameSpan = btn.querySelector('.item-name');
  if (nameSpan && nameSpan.textContent.trim() === 'Cold Red Horse Jumbo (single)') {
    btn.classList.add('skyblueme');
    console.log('Class added to the specific item!');
  }
});