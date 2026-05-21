import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import styles from './Register.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error || err.response?.data?.message || '';

      if (status === 409 || message.toLowerCase().includes('existe') || message.toLowerCase().includes('registrado')) {
        setError('Este email ya está registrado.');
      } else if (message.toLowerCase().includes('contraseña') || message.toLowerCase().includes('password')) {
        setError('La contraseña debe tener mínimo 8 caracteres.');
      } else {
        setError(message || 'Error al registrarse');
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
          Empieza<br />a llevar<br /><span>el control.</span>
        </h1>
        <p className={styles.desc}>
          Crea tu cuenta gratis y empieza a registrar todas tus boletas, rifas y sorteos en un solo lugar.
        </p>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Crear cuenta</h2>
          <p className={styles.cardSub}>Completa los datos para registrarte</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Nombre</label>
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
                maxLength={80}
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className={styles.footer}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}