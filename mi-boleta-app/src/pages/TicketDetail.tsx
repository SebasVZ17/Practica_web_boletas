import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './TicketDetail.module.css';

interface Ticket {
  id: string;
  title: string;
  gameType: string;
  gameDate: string;
  status: string;
  amount?: number;
  place?: string;
  gameNumber?: string;
  notes?: string;
  createdAt: string;
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.data);
    } catch (err) {
      console.error(err);
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getCountdown = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days === 0 && hours === 0) return 'Hoy es el sorteo';
  if (days === 0) return `Hoy en ${hours}h`;
  if (days === 1) return 'Mañana';
  if (days <= 7) return `En ${days} días`;
  return null;
};

  const statusColor = () => {
    if (ticket?.status === 'Ganado') return styles.statusGanado;
    if (ticket?.status === 'Perdido') return styles.statusPerdido;
    return styles.statusPendiente;
  };

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandName}>mi boleta<span className={styles.brandDot}>.</span></span>
        </div>
        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navItem}>Dashboard</Link>
          <Link to="/tickets" className={`${styles.navItem} ${styles.navActive}`}>Mis boletas</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <p className={styles.userName}>{user?.name}</p>
          <p className={styles.userEmail}>{user?.email}</p>
          <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.backRow}>
          <Link to="/tickets" className={styles.backBtn}>← Volver a mis boletas</Link>
        </div>

        {loading ? (
          <p className={styles.empty}>Cargando...</p>
        ) : !ticket ? (
          <p className={styles.empty}>Boleta no encontrada.</p>
        ) : (
          <>
            <div className={styles.header}>
              <div>
                <h1 className={styles.title}>{ticket.title}</h1>
                <p className={styles.subtitle}>{ticket.gameType} · {formatDate(ticket.gameDate)}</p>
              </div>
              <span className={`${styles.status} ${statusColor()}`}>{ticket.status}</span>
              {ticket.status === 'Pendiente' && getCountdown(ticket.gameDate) && (
              <span className={styles.countdown}>{getCountdown(ticket.gameDate)}</span>
              )}
            </div>

            <div className={styles.grid}>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Número jugado</span>
                <span className={styles.cardValue}>{ticket.gameNumber || '—'}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Valor apostado</span>
                <span className={styles.cardValue}>
                  {ticket.amount ? `$${Number(ticket.amount).toLocaleString('es-CO')}` : '—'}
                </span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Lugar de compra</span>
                <span className={styles.cardValue}>{ticket.place || '—'}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Registrada el</span>
                <span className={styles.cardValue}>{formatDate(ticket.createdAt)}</span>
              </div>
            </div>

            {ticket.notes && (
              <div className={styles.notesCard}>
                <span className={styles.cardLabel}>Notas</span>
                <p className={styles.notesText}>{ticket.notes}</p>
              </div>
            )}

            <div className={styles.footerActions}>
              <Link to="/tickets" className={styles.editBtn}>Editar boleta</Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}