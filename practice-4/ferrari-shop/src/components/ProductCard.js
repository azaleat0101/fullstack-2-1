import React from 'react';

export default function ProductCard({ product, onEdit, onDelete }) {
  const formattedPrice = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="productCard">
      <div className="productCard__imageContainer">
        <img 
          src={product.image || '/images/placeholder.jpg'} 
          alt={product.name}
          className="productCard__image"
        />
      </div>
      <div className="productCard__content">
        <div className="productCard__header">
          <span className="productCard__id">#{product.id}</span>
          <span className="productCard__category">{product.category}</span>
        </div>
        <h3 className="productCard__name">{product.name}</h3>
        <p className="productCard__description">{product.description}</p>
        <div className="productCard__details">
          <span className="productCard__price">{formattedPrice}</span>
          <span className="productCard__stock">В наличии: {product.stock} шт.</span>
          {product.rating > 0 && (
            <span className="productCard__rating">
              ★ {product.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="productCard__actions">
          <button className="btn" onClick={() => onEdit(product)}>
            Редактировать
          </button>
          <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}