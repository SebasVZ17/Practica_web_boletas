import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Dashboard.module.css';

interface Ticket {
  id: string;
  title: string;
  gameType: string;
  gameDate: string;
  status: string;
  amount?: number;
  place?: string;
  gameNumber?: string;
}

interface Stats {
  total: number;
  pendientes: number;
  ganados: number;
  perdidos: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pendientes: 0, ganados: 0, perdidos: 0 });
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<Ticket[]>([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const getUpcomingTickets = (tickets: Ticket[]) => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return tickets.filter(t => {
      const date = new Date(t.gameDate);
      return t.status === 'Pendiente' && date >= now && date <= threeDaysFromNow;
    });
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets?pageSize=5');
      const data: Ticket[] = res.data.data;
      const total = res.data.meta.total;

      const statsRes = await api.get('/tickets?pageSize=1000');
      const allTickets: Ticket[] = statsRes.data.data;

      setTickets(data);
      setUpcoming(getUpcomingTickets(allTickets));
      setStats({
        total,
        pendientes: allTickets.filter(t => t.status === 'Pendiente').length,
        ganados: allTickets.filter(t => t.status === 'Ganado').length,
        perdidos: allTickets.filter(t => t.status === 'Perdido').length,
      });
    } catch (err) {
      console.error(err);
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
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const statusColor = (status: string) => {
    if (status === 'Ganado') return styles.statusGanado;
    if (status === 'Perdido') return styles.statusPerdido;
    return styles.statusPendiente;
  };

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandName}>mi boleta<span className={styles.brandDot}>.</span></span>
        </div>
        <nav className={styles.nav}>
          <span className={`${styles.navItem} ${styles.navActive}`}>Dashboard</span>
          <Link to="/tickets" className={styles.navItem}>Mis boletas</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={styles.navItem}>Panel admin</Link>
          )}
        </nav>
        <div className={styles.sidebarFooter}>
          <p className={styles.userName}>{user?.name}</p>
          <p className={styles.userEmail}>{user?.email}</p>
          <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Bienvenido, {user?.name?.split(' ')[0]}</h1>
            <p className={styles.subtitle}>Aquí tienes un resumen de tus boletas</p>
          </div>
          <Link to="/tickets" className={styles.newBtn}>+ Nueva boleta</Link>
        </div>

        {upcoming.length > 0 && (
          <div className={styles.notification}>
            <span className={styles.notificationIcon}></span>
            <div>
              <p className={styles.notificationTitle}>Sorteos próximos</p>
              <p className={styles.notificationText}>
                {upcoming.map(t => `${t.title} (${formatDate(t.gameDate)})`).join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total registradas</span>
            <span className={styles.statValue}>{String(stats.total)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pendientes</span>
            <span className={`${styles.statValue} ${styles.colorPendiente}`}>{String(stats.pendientes)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Ganadas</span>
            <span className={`${styles.statValue} ${styles.colorGanado}`}>{String(stats.ganados)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Perdidas</span>
            <span className={`${styles.statValue} ${styles.colorPerdido}`}>{String(stats.perdidos)}</span>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Últimas boletas</h2>
            <Link to="/tickets" className={styles.seeAll}>Ver todas</Link>
          </div>

          {loading ? (
            <p className={styles.empty}>Cargando...</p>
          ) : tickets.length === 0 ? (
            <p className={styles.empty}>No tienes boletas registradas aún.</p>
          ) : (
            <div className={styles.ticketList}>
              {tickets.map(ticket => (
                <div key={ticket.id} className={styles.ticketCard}>
                  <div className={styles.ticketInfo}>
                    <span className={styles.ticketTitle}>{ticket.title}</span>
                    <span className={styles.ticketMeta}>{ticket.gameType} · {formatDate(ticket.gameDate)}</span>
                  </div>
                  <span className={`${styles.status} ${statusColor(ticket.status)}`}>{ticket.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}