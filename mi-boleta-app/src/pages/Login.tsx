import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error || err.response?.data?.message || '';

      if (status === 401 || message.toLowerCase().includes('contraseña') || message.toLowerCase().includes('password')) {
        setError('Contraseña incorrecta.');
      } else if (status === 404 || message.toLowerCase().includes('no encontrado')) {
        setError('No existe una cuenta con ese email.');
      } else {
        setError(message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandName}>
            mi boleta<span className={styles.brandDot}>.</span>
          </span>
        </div>
        <h1 className={styles.headline}>
          Nunca<br />pierdas<br /><span>tu suerte.</span>
        </h1>
        <p className={styles.desc}>
          Registra tus boletas, rifas y sorteos en un solo lugar. Nunca más te preguntes si ganaste.
        </p>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Bienvenido</h2>
          <p className={styles.cardSub}>Ingresa tus datos para continuar</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              className={styles.button}
              type="button"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </div>

          <p className={styles.footer}>
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}