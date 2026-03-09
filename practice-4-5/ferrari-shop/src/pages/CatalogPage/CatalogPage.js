import React, { useState, useEffect } from 'react';
import './CatalogPage.scss';
import ProductsList from '../../components/ProductsList';
import ProductModal from '../../components/ProductModal';
import { api } from '../../api';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;

    try {
      await api.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить товар');
    }
  };

  const handleSubmit = async (productData) => {
    try {
      if (modalMode === 'create') {
        const newProduct = await api.createProduct(productData);
        setProducts([...products, newProduct]);
      } else {
        const updatedProduct = await api.updateProduct(productData.id, productData);
        setProducts(products.map(p => p.id === productData.id ? updatedProduct : p));
      }
      closeModal();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить товар');
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">
            <span className="brand__ferrari">SCUDERIA FERRARI</span>
          </div>
          <div className="header__right">NON OFFICIAL STORE</div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">
              КАТАЛОГ ТОВАРОВ
            </h1>
            <button className="btn btn--primary" onClick={openCreate}>
              + ДОБАВИТЬ ТОВАР
            </button>
          </div>

          {loading ? (
            <div className="empty">ЗАГРУЗКА...</div>
          ) : (
            <ProductsList
              products={products}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <span>© 2026 TUKHVATULLINA AZALEA</span>
        </div>
      </footer>

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}