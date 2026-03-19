import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

function ProductsPage({ setIsAuth, role }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/api/products');
      setProducts(response.data);
    } catch (err) {
      setError('Ошибка загрузки товаров');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/products', {
        title,
        category,
        description,
        price: Number(price),
        imageUrl: imageUrl || null,
      });
      setTitle('');
      setCategory('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError('Ошибка добавления товара');
    }
  };

  const openEditModal = (product) => {
    setEditProduct(product);
    setEditTitle(product.title);
    setEditCategory(product.category);
    setEditDescription(product.description);
    setEditPrice(product.price);
    setEditImageUrl(product.imageUrl || '');
    setEditModalOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/api/products/${editProduct.id}`, {
        title: editTitle,
        category: editCategory,
        description: editDescription,
        price: Number(editPrice),
        imageUrl: editImageUrl || null,
      });
      setEditModalOpen(false);
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      setError('Ошибка редактирования');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      setError('Ошибка удаления');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    setIsAuth(false);
    navigate('/login');
  };

  return (
    <>
      <div className="header">
        <h1>Магазин</h1>

        <div className="header-actions">
          <span className="role-badge">{role}</span>

          {role === 'admin' && (
            <button onClick={() => navigate('/admin')}>Пользователи</button>
          )}

          <button onClick={handleLogout}>Выйти</button>
        </div>
      </div>

      <div className="main">
        {error && <p className="error">{error}</p>}

        {(role === 'seller' || role === 'admin') && (
          <button onClick={() => setAddModalOpen(true)}>+ Добавить товар</button>
        )}

        <div className="products-grid" style={{ marginTop: '24px' }}>
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="product-image"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    marginBottom: '8px',
                  }}
                />
              )}

              <span className="category">{product.category}</span>
              <h3>{product.title}</h3>
              <p className="description">{product.description}</p>
              <span className="price">{product.price} ₽</span>

              <div className="actions">
                {(role === 'seller' || role === 'admin') && (
                  <button onClick={() => openEditModal(product)}>Изменить</button>
                )}

                {role === 'admin' && (
                  <button
                    className="danger"
                    onClick={() => handleDelete(product.id)}
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {addModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Добавить товар</h2>
            <form onSubmit={handleAdd}>
              <input
                placeholder="Название"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                placeholder="Категория"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <input
                placeholder="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <input
                placeholder="Цена"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <input
                placeholder="URL изображения (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Превью"
                  style={{ maxWidth: '200px', marginTop: '8px' }}
                />
              )}

              <div className="actions">
                <button type="submit">Добавить</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setAddModalOpen(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Редактировать товар</h2>
            <form onSubmit={handleEdit}>
              <input
                placeholder="Название"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
              <input
                placeholder="Категория"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                required
              />
              <input
                placeholder="Описание"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
              />
              <input
                placeholder="Цена"
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                required
              />
              <input
                placeholder="URL изображения (https://...)"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
              />

              {editImageUrl && (
                <img
                  src={editImageUrl}
                  alt="Превью"
                  style={{ maxWidth: '200px', marginTop: '8px' }}
                />
              )}

              <div className="actions">
                <button type="submit">Сохранить</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setEditModalOpen(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductsPage;
