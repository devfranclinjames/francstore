export default function ItemButton({ item, onClick }) {
  // If you want to target the first element that contains "Cold"
document.querySelector('.item-name:contains("Cold")')?.closest('.item-btn')?.classList.add('skyblueme');
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
