import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [rating, setRating] = useState('');
  const [image, setImage] = useState(''); // новое поле

  useEffect(() => {
    if (open && initialProduct) {
      setName(initialProduct.name || '');
      setCategory(initialProduct.category || '');
      setDescription(initialProduct.description || '');
      setPrice(String(initialProduct.price || ''));
      setStock(String(initialProduct.stock || ''));
      setRating(String(initialProduct.rating || ''));
      setImage(initialProduct.image || ''); // добавляем
    } else if (open) {
      setName('');
      setCategory('');
      setDescription('');
      setPrice('');
      setStock('');
      setRating('');
      setImage('');
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !category.trim() || !description.trim() || !price || !stock) {
      alert('Заполните все обязательные поля');
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: Number(price),
      stock: Number(stock),
      rating: rating ? Number(rating) : 0,
      image: image.trim() || '/images/placeholder.jpg' // добавляем
    });
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            {mode === 'edit' ? 'Редактировать товар' : 'Новый товар'}
          </h2>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            placeholder="Название товара *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="input"
          />
          <input
            type="text"
            placeholder="Категория *"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="input"
          />
          <textarea
            placeholder="Описание *"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            className="input"
            rows="3"
          />
          <div className="formRow">
            <input
              type="number"
              placeholder="Цена *"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
              min="0"
              className="input"
            />
            <input
              type="number"
              placeholder="Количество *"
              value={stock}
              onChange={e => setStock(e.target.value)}
              required
              min="0"
              className="input"
            />
          </div>
          <input
            type="text"
            placeholder="URL изображения"
            value={image}
            onChange={e => setImage(e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="Рейтинг (0-5)"
            value={rating}
            onChange={e => setRating(e.target.value)}
            min="0"
            max="5"
            step="0.1"
            className="input"
          />
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}