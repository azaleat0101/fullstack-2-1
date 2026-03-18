import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

function AdminPage({ role, setIsAuth }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState('user');

  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role]);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      setError('Ошибка загрузки пользователей');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    setIsAuth(false);
    navigate('/login');
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditRole(user.role || 'user');
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditFirstName('');
    setEditLastName('');
    setEditRole('user');
  };

  const saveEdit = async (id) => {
    try {
      await apiClient.put(`/api/users/${id}`, {
        first_name: editFirstName,
        last_name: editLastName,
        role: editRole,
      });
      cancelEdit();
      fetchUsers();
    } catch (err) {
      setError('Ошибка обновления пользователя');
    }
  };

  const blockUser = async (id) => {
    try {
      await apiClient.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError('Ошибка блокировки пользователя');
    }
  };

  if (role !== 'admin') {
    return (
      <div className="container">
        <h1>Нет доступа</h1>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>Админка</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/products')}>К товарам</button>
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </div>

      <div className="main">
        <h2 style={{ marginBottom: '20px' }}>Пользователи</h2>
        {error && <p className="error">{error}</p>}

        <div className="users-grid">
          {users.map((user) => (
            <div className="user-card" key={user.id}>
              {editingUserId === user.id ? (
                <>
                  <input
                    placeholder="Имя"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                  <input
                    placeholder="Фамилия"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                    <option value="user">user</option>
                    <option value="seller">seller</option>
                    <option value="admin">admin</option>
                  </select>

                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Статус:</strong> {user.blocked ? 'Заблокирован' : 'Активен'}</p>

                  <div className="actions">
                    <button onClick={() => saveEdit(user.id)}>Сохранить</button>
                    <button className="secondary" onClick={cancelEdit}>Отмена</button>
                  </div>
                </>
              ) : (
                <>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Имя:</strong> {user.first_name}</p>
                  <p><strong>Фамилия:</strong> {user.last_name}</p>
                  <p><strong>Роль:</strong> {user.role}</p>
                  <p><strong>Статус:</strong> {user.blocked ? 'Заблокирован' : 'Активен'}</p>

                  <div className="actions">
                    <button onClick={() => startEdit(user)}>Изменить</button>
                    {!user.blocked && (
                      <button className="danger" onClick={() => blockUser(user.id)}>
                        Заблокировать
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminPage;
