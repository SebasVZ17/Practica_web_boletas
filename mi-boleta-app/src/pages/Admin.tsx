import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Admin.module.css';

interface Ticket {
  id: string;
  title: string;
  gameType: string;
  gameDate: string;
  status: string;
  amount?: number;
  place?: string;
  gameNumber?: string;
  owner?: { id: string; name: string; email: string };
}

const STATUSES = ['Pendiente', 'Ganado', 'Perdido'];
const PAGE_SIZE = 10;

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    fetchAllTickets();
  }, [filterStatus, search, page]);

  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (search) params.append('q', search);
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));
      const res = await api.get(`/admin/tickets?${params.toString()}`);
      setTickets(res.data.data);
      const totalCount = res.data.meta.total;
      setTotalPages(Math.ceil(totalCount / PAGE_SIZE));
      setTotal(totalCount);
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

  const handleFilterChange = (setter: any, value: string) => {
    setter(value);
    setPage(1);
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('¿Eliminar esta boleta?')) return;
    try {
      await api.delete(`/admin/tickets/${id}`);
      fetchAllTickets();
    } catch (err) {
      console.error(err);
    }
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
        <div className={styles.adminBadge}>Admin</div>
        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navItem}>Dashboard</Link>
          <Link to="/tickets" className={styles.navItem}>Mis boletas</Link>
          <span className={`${styles.navItem} ${styles.navActive}`}>Panel admin</span>
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
            <h1 className={styles.title}>Panel de administración</h1>
            <p className={styles.subtitle}>Gestiona todas las boletas de los usuarios</p>
          </div>
        </div>

        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o usuario..."
            value={search}
            onChange={e => handleFilterChange(setSearch, e.target.value)}
          />
          <select className={styles.select} value={filterStatus} onChange={e => handleFilterChange(setFilterStatus, e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <p className={styles.empty}>Cargando...</p>
        ) : tickets.length === 0 ? (
          <p className={styles.empty}>No hay boletas que mostrar.</p>
        ) : (
          <div className={styles.ticketList}>
            {tickets.map(ticket => (
              <div key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketLeft}>
                  <span className={styles.ticketTitle}>{ticket.title}</span>
                  <span className={styles.ticketMeta}>
                    {ticket.gameType} · {formatDate(ticket.gameDate)}
                    {ticket.owner && ` · ${ticket.owner.name}`}
                  </span>
                </div>
                <div className={styles.ticketRight}>
                  <span className={`${styles.status} ${statusColor(ticket.status)}`}>{ticket.status}</span>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteTicket(ticket.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              ← Anterior
            </button>
            <span className={styles.pageInfo}>Página {page} de {totalPages} · {total} boletas en total</span>
            <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
              Siguiente →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}