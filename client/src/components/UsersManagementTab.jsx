import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, UserX, Clock, ShieldAlert, CheckCircle2, Shield, Settings, Lock, Edit2 } from 'lucide-react';

export default function UsersManagementTab() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Edit / Approve modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('ATUARIO');
  const [selectedStatus, setSelectedStatus] = useState('APPROVED');
  const [selectedTabs, setSelectedTabs] = useState(['overview', 'products', 'rules', 'rating', 'explorer']);
  const [canEditRating, setCanEditRating] = useState(false);
  const [canEditRules, setCanEditRules] = useState(false);
  const [canEditProducts, setCanEditProducts] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const availableTabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'products', label: 'Catálogo de Produtos' },
    { id: 'packages', label: 'Pacotes & Módulos' },
    { id: 'rules', label: 'Seleção de Risco & Regras' },
    { id: 'rating', label: 'Motor de Tarifação (RTE)' },
    { id: 'audit', label: 'Auditoria & PECA (Admin)' },
    { id: 'explorer', label: 'Explorador Universal MongoDB' }
  ];

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/auth/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setPendingCount(data.pendingCount || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEditModal = (u) => {
    setSelectedUser(u);
    setSelectedRole(u.role || 'ATUARIO');
    setSelectedStatus(u.status || 'APPROVED');
    setSelectedTabs(u.permissions?.allowedTabs || ['overview', 'products', 'packages', 'rules', 'rating', 'explorer']);
    setCanEditRating(u.permissions?.canEdit?.rating || false);
    setCanEditRules(u.permissions?.canEdit?.rules || false);
    setCanEditProducts(u.permissions?.canEdit?.products || false);
  };

  const handleSaveUserProfile = async () => {
    if (!selectedUser) return;
    setSavingUser(true);

    try {
      const endpoint = selectedUser.status === 'PENDING'
        ? `/api/auth/users/${selectedUser._id}/approve`
        : `/api/auth/users/${selectedUser._id}/profile`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role: selectedRole,
          status: selectedStatus,
          allowedTabs: selectedRole === 'ADMIN' ? availableTabs.map(t => t.id) : selectedTabs,
          canEdit: {
            rating: selectedRole === 'ADMIN' ? true : canEditRating,
            rules: selectedRole === 'ADMIN' ? true : canEditRules,
            products: selectedRole === 'ADMIN' ? true : canEditProducts,
            explorer: selectedRole === 'ADMIN' ? true : false
          }
        })
      });

      if (res.ok) {
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('Deseja realmente recusar esta solicitação de acesso?')) return;
    try {
      const res = await fetch(`/api/auth/users/${userId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTabSelection = (tabId) => {
    if (selectedTabs.includes(tabId)) {
      setSelectedTabs(selectedTabs.filter(t => t !== tabId));
    } else {
      setSelectedTabs([...selectedTabs, tabId]);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <ShieldAlert size={48} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>Acesso Restrito ao Administrador</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Somente o perfil Administrador pode alterar perfis de usuários e gerenciar alçadas de segurança.
        </p>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const activeUsers = users.filter(u => u.status !== 'PENDING');

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Users className="stat-icon blue" style={{ width: '32px', height: '32px', padding: '6px' }} />
            Gestão de Usuários & Alçadas de Acesso (RBAC)
          </h2>
          <p className="section-subtitle">
            Aprovação de solicitações de login, edição de perfis de usuários ativos e controle granular de permissões por tela
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="badge badge-amber" style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}>
            <Clock size={14} /> {pendingCount} Solicitação(ões) Pendente(s)
          </span>
        )}
      </div>

      {/* Pending Requests Section */}
      {pendingUsers.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--accent-amber)" />
              Solicitações de Acesso Aguardando Aprovação ({pendingUsers.length})
            </h3>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome do Solicitante</th>
                  <th>E-mail Corporativo</th>
                  <th>Departamento</th>
                  <th>Justificativa</th>
                  <th>Data do Pedido</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{u.email}</td>
                    <td><span className="badge badge-gray">{u.department || 'Geral'}</span></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '250px' }}>
                      {u.justification || 'Não informada'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="pagination-btn btn-primary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleOpenEditModal(u)}
                        >
                          <UserCheck size={14} /> Aprovar & Configurar
                        </button>
                        <button
                          className="pagination-btn"
                          style={{ background: 'rgba(244, 63, 94, 0.15)', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleReject(u._id)}
                        >
                          <UserX size={14} /> Recusar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Users / Active Users Management Table */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <UserCheck size={18} color="var(--accent-emerald)" />
          Usuários do Sistema ({activeUsers.length})
        </h3>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil (Role)</th>
                <th>Status</th>
                <th>Telas Permitidas</th>
                <th>Permissões de Edição</th>
                <th style={{ textAlign: 'right' }}>Gerenciar</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'APPROVED' ? 'badge-emerald' : u.status === 'REJECTED' ? 'badge-rose' : 'badge-amber'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {u.role === 'ADMIN' ? (
                        <span className="badge badge-emerald">Acesso Total</span>
                      ) : (
                        u.permissions?.allowedTabs?.map(t => (
                          <span key={t} className="badge badge-gray">{t}</span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    {u.role === 'ADMIN' ? (
                      <span className="badge badge-emerald">Edição Total</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {u.permissions?.canEdit?.rating && <span className="badge badge-amber">Fórmulas</span>}
                        {u.permissions?.canEdit?.rules && <span className="badge badge-blue">Regras</span>}
                        {u.permissions?.canEdit?.products && <span className="badge badge-emerald">Produtos</span>}
                        {!u.permissions?.canEdit?.rating && !u.permissions?.canEdit?.rules && !u.permissions?.canEdit?.products && (
                          <span className="badge badge-gray">Apenas Leitura</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="pagination-btn"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => handleOpenEditModal(u)}
                    >
                      <Edit2 size={13} /> Alterar Perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Editing User Profile & Alçadas */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div
            className="modal-content card"
            style={{ maxWidth: '560px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Alterar Perfil & Permissões
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Usuário: <strong style={{ color: 'var(--text-main)' }}>{selectedUser.name}</strong> ({selectedUser.email})
            </p>

            {/* Profile Selection & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Perfil Funcional (Role)
                </label>
                <select
                  className="select-field"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="ATUARIO">Atuário (Tarifação e Fórmulas)</option>
                  <option value="SUBSCRIBER">Subscritor (Risco & Regras)</option>
                  <option value="VIEWER">Visualizador (Somente Leitura)</option>
                  <option value="ADMIN">Administrador (Controle Total)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Status da Conta
                </label>
                <select
                  className="select-field"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="APPROVED">Aprovado (Ativo)</option>
                  <option value="PENDING">Pendente de Aprovação</option>
                  <option value="REJECTED">Recusado / Bloqueado</option>
                </select>
              </div>
            </div>

            {/* Granular Screen Access */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Telas que o usuário pode visualizar:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {availableTabs.map(t => (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#070b14',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-card)',
                      fontSize: '0.82rem',
                      cursor: selectedRole === 'ADMIN' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRole === 'ADMIN' || selectedTabs.includes(t.id)}
                      disabled={selectedRole === 'ADMIN'}
                      onChange={() => toggleTabSelection(t.id)}
                    />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Edit Permissions Toggle */}
            <div style={{ background: '#070b14', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'block', marginBottom: '0.5rem' }}>
                Alçadas de Edição e Criação de Dados:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: selectedRole === 'ADMIN' ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedRole === 'ADMIN' || canEditRating}
                    disabled={selectedRole === 'ADMIN'}
                    onChange={(e) => setCanEditRating(e.target.checked)}
                  />
                  <span>Pode editar Fórmulas e Expressões no Motor de Tarifação (RTE)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: selectedRole === 'ADMIN' ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedRole === 'ADMIN' || canEditRules}
                    disabled={selectedRole === 'ADMIN'}
                    onChange={(e) => setCanEditRules(e.target.checked)}
                  />
                  <span>Pode criar e editar Regras de Subscrição (DUP)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: selectedRole === 'ADMIN' ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedRole === 'ADMIN' || canEditProducts}
                    disabled={selectedRole === 'ADMIN'}
                    onChange={(e) => setCanEditProducts(e.target.checked)}
                  />
                  <span>Pode criar e editar Produtos e Coberturas (DUP)</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="pagination-btn"
                onClick={() => setSelectedUser(null)}
              >
                Cancelar
              </button>
              <button
                className="pagination-btn btn-primary"
                disabled={savingUser}
                onClick={handleSaveUserProfile}
              >
                {savingUser ? 'Salvando...' : 'Salvar Alterações de Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
