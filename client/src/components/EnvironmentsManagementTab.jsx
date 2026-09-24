import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Server,
  Database,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Activity,
  Layers,
  ShieldCheck,
  Info
} from 'lucide-react';

export default function EnvironmentsManagementTab({ onEnvironmentChanged }) {
  const { token } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [activeEnvId, setActiveEnvId] = useState('');
  const [activeEnv, setActiveEnv] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null); // null if creating
  const [formData, setFormData] = useState({
    name: '',
    type: 'remote',
    uri: '',
    dupDb: 'acdc_dup_br-int',
    rteDb: 'acdc_rte_br-int',
    description: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok, latencyMs, message, error }
  const [copiedId, setCopiedId] = useState(null);

  const fetchEnvironments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/environments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Falha ao carregar ambientes.');
      const data = await res.json();
      setEnvironments(data.environments || []);
      setActiveEnvId(data.activeEnvironmentId || '');
      setConnectionStatus(data.connectionStatus || null);

      const active = (data.environments || []).find(e => e.id === data.activeEnvironmentId);
      setActiveEnv(active || null);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const handleCopyUri = (id, uri) => {
    navigator.clipboard.writeText(uri);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingEnv(null);
    setFormData({
      name: '',
      type: 'remote',
      uri: '',
      dupDb: 'acdc_dup_br-int',
      rteDb: 'acdc_rte_br-int',
      description: ''
    });
    setTestResult(null);
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (env) => {
    setEditingEnv(env);
    setFormData({
      name: env.name,
      type: env.type,
      uri: env.maskedUri || env.uri,
      dupDb: env.dupDb || 'acdc_dup_br-int',
      rteDb: env.rteDb || 'acdc_rte_br-int',
      description: env.description || ''
    });
    setTestResult(null);
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleTestConnectionInModal = async () => {
    if (!formData.uri) {
      setTestResult({ ok: false, message: 'Informe a URI de conexão antes de testar.' });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/environments/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingEnv?.id,
          uri: formData.uri,
          dupDb: formData.dupDb,
          rteDb: formData.rteDb
        })
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ ok: false, message: `Erro ao testar: ${err.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestSpecificEnvironment = async (env) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/environments/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: env.id,
          dupDb: env.dupDb,
          rteDb: env.rteDb
        })
      });

      const data = await res.json();
      if (data.ok) {
        setMessage({
          type: 'success',
          text: `Teste no ambiente "${env.name}" bem-sucedido! Latência: ${data.latencyMs}ms.`
        });
      } else {
        setMessage({
          type: 'error',
          text: `Teste no ambiente "${env.name}" falhou: ${data.error || data.message}`
        });
      }
      fetchEnvironments();
    } catch (err) {
      setMessage({ type: 'error', text: `Erro no teste: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEnvironment = async (activateImmediately = false) => {
    if (!formData.name.trim() || !formData.uri.trim()) {
      setMessage({ type: 'error', text: 'Preencha o nome do ambiente e a URI de conexão.' });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      let envId = editingEnv?.id;

      if (editingEnv) {
        // Update
        const res = await fetch(`/api/admin/environments/${editingEnv.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao atualizar ambiente.');
        }
      } else {
        // Create
        const res = await fetch('/api/admin/environments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao criar ambiente.');
        }
        const created = await res.json();
        envId = created.id;
      }

      if (activateImmediately && envId) {
        const actRes = await fetch(`/api/admin/environments/${envId}/activate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!actRes.ok) {
          const actData = await actRes.json();
          throw new Error(`Salvo, porém falha ao ativar: ${actData.error || 'Não conectou'}`);
        }
        setMessage({ type: 'success', text: `Ambiente "${formData.name}" salvo e ativado com sucesso!` });
        if (onEnvironmentChanged) onEnvironmentChanged();
      } else {
        setMessage({ type: 'success', text: `Ambiente "${formData.name}" salvo com sucesso!` });
      }

      setModalOpen(false);
      fetchEnvironments();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateEnvironment = async (env) => {
    if (env.id === activeEnvId) return;

    const confirmMsg = `Deseja alternar a conexão ativa do MongoDB para o ambiente "${env.name}"?\n\nA aplicação passará a operar imediatamente sobre esta base de dados.`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/environments/${env.id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao ativar ambiente.');
      }

      setMessage({
        type: 'success',
        text: `Ambiente "${env.name}" ativado com sucesso! Latência da conexão: ${data.latencyMs}ms.`
      });

      await fetchEnvironments();
      if (onEnvironmentChanged) onEnvironmentChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEnvironment = async (env) => {
    if (env.isDefault || env.id === 'env-local') {
      alert('O ambiente Local (Docker) é o padrão de segurança e não pode ser removido.');
      return;
    }

    if (env.id === activeEnvId) {
      alert('Não é possível excluir o ambiente que está ativo no momento. Ative outro ambiente antes.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o ambiente "${env.name}"?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/environments/${env.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao excluir ambiente.');
      }

      setMessage({ type: 'success', text: `Ambiente "${env.name}" removido com sucesso.` });
      fetchEnvironments();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Alert Messages */}
      {message && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: message.type === 'success' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(225, 29, 72, 0.12)',
            border: `1px solid ${message.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
            color: message.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            fontSize: '0.88rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontSize: '1rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Active Environment Spotlight Card */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(7, 10, 18, 0.4) 100%)',
          border: '1px solid var(--primary-glow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.65rem' }}>
                <span className="pulse-dot" style={{ margin: 0 }}></span>
                AMBIENTE ATIVO EM PRODUÇÃO
              </span>
              <span className="badge badge-blue">
                {activeEnv?.type === 'local' ? 'Local Docker' : activeEnv?.type === 'cloud' ? 'MongoDB Atlas' : 'Servidor Remoto'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {activeEnv?.name || 'Local (Docker)'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {activeEnv?.description || 'Instância primária do MongoDB para subscrição DUP e tarifação RTE Tronador.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              className="pagination-btn"
              onClick={() => activeEnv && handleTestSpecificEnvironment(activeEnv)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}
              title="Testar ping e integridade dos bancos agora"
            >
              <Activity size={15} className={actionLoading ? 'spinner' : ''} />
              Testar Conexão Ativa
            </button>
            <button
              className="pagination-btn btn-primary"
              onClick={handleOpenCreateModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <Plus size={15} />
              Novo Ambiente
            </button>
          </div>
        </div>

        {/* Active Environment Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connection String (URI)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <code style={{ fontSize: '0.8rem', background: 'var(--bg-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
                {activeEnv?.maskedUri || activeEnv?.uri || 'mongodb://localhost:27017'}
              </code>
              <button
                className="pagination-btn"
                style={{ padding: '0.2rem 0.4rem' }}
                onClick={() => handleCopyUri('active', activeEnv?.maskedUri || activeEnv?.uri)}
                title="Copiar URI"
              >
                {copiedId === 'active' ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bancos de Dados Vinculados
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                DUP: {activeEnv?.dupDb || 'acdc_dup_br-int'}
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                RTE: {activeEnv?.rteDb || 'acdc_rte_br-int'}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status da Conectividade
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                🟢 {connectionStatus?.status === 'CONNECTED' ? 'Operacional (OK)' : connectionStatus?.status || 'Conectado'}
              </span>
              {activeEnv?.latencyMs !== undefined && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Latência: <strong>{activeEnv.latencyMs}ms</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Environments List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} color="var(--primary)" />
            Ambientes Cadastrados ({environments.length})
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gerencie instâncias locais e servidores remotos do MongoDB. Clique em "Ativar" para alternar o banco em tempo real.
          </p>
        </div>

        <button
          className="pagination-btn"
          onClick={fetchEnvironments}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.8rem' }}
          title="Recarregar lista"
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          Atualizar
        </button>
      </div>

      {/* Environments Grid */}
      {loading ? (
        <div className="loading-state" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <span>Carregando configurações de ambientes...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {environments.map((env) => {
            const isActive = env.id === activeEnvId;

            return (
              <div
                key={env.id}
                className="glass-card"
                style={{
                  padding: '1.35rem',
                  borderRadius: 'var(--radius-lg)',
                  background: isActive ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-card)',
                  boxShadow: isActive ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Card Top */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-md)',
                          background: isActive ? 'rgba(0, 102, 255, 0.15)' : 'var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? 'var(--primary)' : 'var(--text-muted)'
                        }}
                      >
                        <Database size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                          {env.name}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {env.type === 'local' ? 'MongoDB Local (Docker)' : env.type === 'cloud' ? 'MongoDB Atlas / Nuvem' : 'Servidor Remoto (VM / On-Premise)'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      {isActive ? (
                        <span className="badge badge-emerald" style={{ fontWeight: 700, fontSize: '0.72rem' }}>
                          🟢 EM USO
                        </span>
                      ) : (
                        <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                          INATIVO
                        </span>
                      )}
                      {env.isDefault && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Padrão</span>
                      )}
                    </div>
                  </div>

                  {env.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: '1.4' }}>
                      {env.description}
                    </p>
                  )}

                  {/* URI & Database Pills */}
                  <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-surface)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem'
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {env.maskedUri || env.uri}
                      </span>
                      <button
                        onClick={() => handleCopyUri(env.id, env.maskedUri || env.uri)}
                        className="pagination-btn"
                        style={{ padding: '0.15rem 0.35rem', background: 'transparent', border: 'none' }}
                        title="Copiar URI"
                      >
                        {copiedId === env.id ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        DUP: {env.dupDb || 'acdc_dup_br-int'}
                      </span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        RTE: {env.rteDb || 'acdc_rte_br-int'}
                      </span>
                      {env.latencyMs !== undefined && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                          ⚡ {env.latencyMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Bottom */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="pagination-btn"
                      onClick={() => handleTestSpecificEnvironment(env)}
                      disabled={actionLoading}
                      title="Testar conexão com este banco"
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                    >
                      <Activity size={13} />
                      Testar
                    </button>
                    <button
                      className="pagination-btn"
                      onClick={() => handleOpenEditModal(env)}
                      title="Editar configurações"
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                    >
                      <Edit2 size={13} />
                      Editar
                    </button>
                    {!env.isDefault && env.id !== 'env-local' && (
                      <button
                        className="pagination-btn"
                        onClick={() => handleDeleteEnvironment(env)}
                        disabled={actionLoading || isActive}
                        title={isActive ? 'Não é possível excluir o ambiente ativo' : 'Excluir ambiente'}
                        style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem', color: isActive ? 'var(--text-muted)' : 'var(--accent-rose)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {!isActive ? (
                    <button
                      className="pagination-btn btn-primary"
                      onClick={() => handleActivateEnvironment(env)}
                      disabled={actionLoading}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Play size={12} />
                      Ativar Conexão
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                      Conectado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Ambiente */}
      {modalOpen && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '580px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Server size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  {editingEnv ? 'Editar Ambiente MongoDB' : 'Cadastrar Novo Ambiente MongoDB'}
                </h3>
              </div>
              <button
                className="modal-close"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {/* Nome do Ambiente */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Nome do Ambiente *
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%' }}
                  placeholder="Ex: Servidor Homologação MAPFRE, Mongo Atlas SP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Tipo do Ambiente */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Tipo de Infraestrutura
                </label>
                <select
                  className="search-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="remote">Servidor Remoto (VM / On-Premise corporativo)</option>
                  <option value="cloud">Nuvem Gerenciada (MongoDB Atlas / AWS / GCP)</option>
                  <option value="local">Local (Docker / localhost)</option>
                </select>
              </div>

              {/* Connection String (URI) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Connection String / URI do MongoDB *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showPassword ? 'Ocultar' : 'Exibir'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="search-input"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                  placeholder="mongodb://usuario:senha@host:27017/?authSource=admin"
                  value={formData.uri}
                  onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                  Exemplos: <code>mongodb://usuario:senha@10.200.12.5:27017</code> ou <code>mongodb+srv://cluster.acdc.mongodb.net</code>
                </span>
              </div>

              {/* Nomes dos Bancos DUP e RTE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                    Banco DUP (Regras/Risco)
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ width: '100%' }}
                    placeholder="acdc_dup_br-int"
                    value={formData.dupDb}
                    onChange={(e) => setFormData({ ...formData, dupDb: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                    Banco RTE (Motor/Fórmulas)
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ width: '100%' }}
                    placeholder="acdc_rte_br-int"
                    value={formData.rteDb}
                    onChange={(e) => setFormData({ ...formData, rteDb: e.target.value })}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Observações / Descrição Operacional
                </label>
                <textarea
                  className="search-input"
                  style={{ width: '100%', height: '65px', resize: 'vertical' }}
                  placeholder="Informações adicionais, responsável ou instruções de acesso via VPN..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Test Button Inside Modal */}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={handleTestConnectionInModal}
                  disabled={testingConnection || !formData.uri}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    background: 'var(--bg-surface)'
                  }}
                >
                  <Activity size={15} className={testingConnection ? 'spinner' : ''} />
                  {testingConnection ? 'Validando conectividade com o MongoDB...' : 'Testar Conexão com este Banco'}
                </button>
              </div>

              {/* Test Result Message Box */}
              {testResult && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: testResult.ok ? 'rgba(5, 150, 105, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                    border: `1px solid ${testResult.ok ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
                    color: testResult.ok ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    {testResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <span>{testResult.ok ? 'Conexão Estabelecida com Sucesso!' : 'Falha na Validação de Conexão'}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem' }}>
                    {testResult.message || testResult.error}
                  </span>
                  {testResult.databases && testResult.databases.length > 0 && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Bancos detectados no servidor: <strong>{testResult.databases.join(', ')}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setModalOpen(false)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => handleSaveEnvironment(false)}
                disabled={actionLoading}
                style={{ fontWeight: 600 }}
              >
                Salvar Apenas
              </button>
              <button
                type="button"
                className="pagination-btn btn-primary"
                onClick={() => handleSaveEnvironment(true)}
                disabled={actionLoading}
                style={{ fontWeight: 600 }}
              >
                {actionLoading ? 'Processando...' : 'Salvar e Ativar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
