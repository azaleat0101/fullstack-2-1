import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('accessToken'));
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage setIsAuth={setIsAuth} setRole={setRole} />}
        />

        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/products"
          element={
            isAuth ? (
              <ProductsPage setIsAuth={setIsAuth} role={role} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/admin"
          element={
            isAuth && role === 'admin' ? (
              <AdminPage role={role} setIsAuth={setIsAuth} />
            ) : (
              <Navigate to="/products" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
