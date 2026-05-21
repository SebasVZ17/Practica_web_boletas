import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Página no encontrada</h2>
        <p className={styles.desc}>La página que buscas no existe o fue movida.</p>
        <Link to="/dashboard" className={styles.btn}>Volver al inicio</Link>
      </div>
    </div>
  );
}