import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Tickets.module.css';


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
}

const GAME_TYPES = ['Lotería', 'Rifa', 'Sorteo', 'Boleta', 'Juego ocasional'];
const STATUSES = ['Pendiente', 'Ganado', 'Perdido'];
const PAGE_SIZE = 10;

const emptyForm = {
  title: '',
  gameType: 'Lotería',
  gameDate: '',
  status: 'Pendiente',
  gameNumber: '',
  amount: '',
  place: '',
  notes: '',
};

export default function Tickets() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterType, search, page]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('gameType', filterType);
      if (search) params.append('q', search);
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));
      const res = await api.get(`/tickets?${params.toString()}`);
      setTickets(res.data.data);
      const total = res.data.meta.total;
      setTotalPages(Math.ceil(total / PAGE_SIZE));
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (ticket: Ticket) => {
    setEditingId(ticket.id);
    setForm({
      title: ticket.title,
      gameType: ticket.gameType,
      gameDate: ticket.gameDate.slice(0, 16),
      status: ticket.status,
      gameNumber: ticket.gameNumber || '',
      amount: ticket.amount ? String(ticket.amount) : '',
      place: ticket.place || '',
      notes: ticket.notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: form.amount ? Number(form.amount) : undefined,
        gameNumber: form.gameNumber || undefined,
        place: form.place || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await api.put(`/tickets/${editingId}`, payload);
      } else {
        await api.post('/tickets', payload);
      }
      setShowModal(false);
      fetchTickets();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta boleta?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      fetchTickets();
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
        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navItem}>Dashboard</Link>
          <span className={`${styles.navItem} ${styles.navActive}`}>Mis boletas</span>
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
            <h1 className={styles.title}>Mis boletas</h1>
            <p className={styles.subtitle}>Gestiona todas tus boletas y sorteos</p>
          </div>
          <button className={styles.newBtn} onClick={openCreate}>+ Nueva boleta</button>
        </div>

        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o número..."
            value={search}
            onChange={e => handleFilterChange(setSearch, e.target.value)}
          />
          <select className={styles.select} value={filterStatus} onChange={e => handleFilterChange(setFilterStatus, e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={styles.select} value={filterType} onChange={e => handleFilterChange(setFilterType, e.target.value)}>
            <option value="">Todos los tipos</option>
            {GAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
                  <Link to={`/tickets/${ticket.id}`} className={styles.ticketTitle}>{ticket.title}</Link>
                  <span className={styles.ticketMeta}>
                    {ticket.gameType}
                    {ticket.gameNumber && ` · #${ticket.gameNumber}`}
                    {` · ${formatDate(ticket.gameDate)}`}
                    {ticket.place && ` · ${ticket.place}`}
                  </span>
                  {ticket.notes && <span className={styles.ticketNotes}>{ticket.notes}</span>}
                </div>
                <div className={styles.ticketRight}>
                  <span className={`${styles.status} ${statusColor(ticket.status)}`}>{ticket.status}</span>
                  {ticket.amount && (
                    <span className={styles.amount}>${Number(ticket.amount).toLocaleString('es-CO')}</span>
                  )}
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => openEdit(ticket)}>Editar</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(ticket.id)}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              ← Anterior
            </button>
            <span className={styles.pageInfo}>Página {page} de {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              Siguiente →
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar boleta' : 'Nueva boleta'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Nombre del sorteo *</label>
                <input
                  type="text"
                  placeholder="Ej: Lotería de Medellín"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Tipo de juego *</label>
                  <select value={form.gameType} onChange={e => setForm({ ...form, gameType: e.target.value })}>
                    {GAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Estado *</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Fecha del sorteo *</label>
                  <input
                    type="datetime-local"
                    value={form.gameDate}
                    onChange={e => setForm({ ...form, gameDate: e.target.value })}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className={styles.field}>
                  <label>Número jugado</label>
                  <input
                    type="text"
                    placeholder="Ej: 1234"
                    value={form.gameNumber}
                    onChange={e => setForm({ ...form, gameNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Valor apostado</label>
                  <input
                    type="number"
                    placeholder="Ej: 5000"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Lugar de compra</label>
                  <input
                    type="text"
                    placeholder="Ej: Tienda La Esquina"
                    value={form.place}
                    onChange={e => setForm({ ...form, place: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Notas adicionales</label>
                <textarea
                  placeholder="Ej: Premio a ganar, observaciones..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear boleta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}