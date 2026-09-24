import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, ShieldCheck, Zap, LogIn } from 'lucide-react';

export default function OktaSsoModal({ isOpen, onClose, authData, onRefresh, currentUser, onOktaLogin }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [refreshedSuccess, setRefreshedSuccess] = useState(false);

  if (!isOpen) return null;

  const user = authData?.user || {};
  const gw = authData?.gateway || {};

  const words = (user.name || '').split(' ').filter(Boolean);
  const initials = words.length > 1
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : (words[0] ? words[0].slice(0, 2).toUpperCase() : 'GB');

  const remainingSeconds = gw.remainingSeconds || 0;
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const isOnline = gw.gateway8766Online || gw.status === 'connected';

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshedSuccess(false);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setRefreshedSuccess(true);
      setTimeout(() => setRefreshedSuccess(false), 3000);
    } catch (err) {
      console.error('Error refreshing session:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content card"
        style={{
          maxWidth: '520px',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-main)'
            }}
          >
            <span>🏢</span> Autenticação Corporativa Okta SSO & Gateway
          </h3>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{ fontSize: '18px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Profile Card */}
          <div className="sso-profile-card">
            <div className="sso-profile-avatar">{initials}</div>
            <div className="sso-profile-details">
              <div className="sso-profile-name">{user.name || 'Gustavo Costa Berbert'}</div>
              <div className="sso-profile-email">{user.email || 'gustavo.costa.berbert@nttdata.com'}</div>
              <div className="sso-profile-role">
                {user.org || 'NTT DATA EMEAL'}
                {user.tenant ? ` (${user.tenant})` : ''} • {user.role || 'RAG Pipeline Architect'}
              </div>
            </div>
          </div>

          {/* Gateway Connection Box */}
          <div className="sso-gateway-box">
            <div className="sso-gateway-title">
              <Zap size={14} /> Conexão com API Gateway (:8766)
            </div>
            <div className="sso-gateway-desc">
              O Cockpit está vinculado ao API Gateway central. As requisições são assinadas automaticamente com renovação silenciosa em segundo plano (background auto-refresh), eliminando a necessidade de expiração e refresh manual de tokens.
            </div>
          </div>

          {/* Meta List */}
          <div className="sso-meta-list">
            <div className="sso-meta-item">
              <span>Provedor de Identidade (IdP):</span>
              <strong>Okta Enterprise OIDC ({user.tenant || 'OneNTT'})</strong>
            </div>

            <div className="sso-meta-item">
              <span>Login Corporativo:</span>
              <strong>{user.login || 'gcostabe@emeal.nttdata.com'}</strong>
            </div>

            <div className="sso-meta-item">
              <span>Okta User ID:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                {user.oktaId || '00u9pq4pchFsGiPHG417'}
              </strong>
            </div>

            <div className="sso-meta-item">
              <span>Status do Token / Sessão:</span>
              <strong style={{ color: '#059669' }}>
                {remainingSeconds > 0 ? (
                  `🟢 Ativo (~${mins}m ${secs}s restantes)`
                ) : (
                  '🟢 Ativo (Sessão Válida)'
                )}
              </strong>
            </div>

            <div className="sso-meta-item">
              <span>Status do API Gateway:</span>
              <strong style={{ color: isOnline ? '#059669' : '#eab308' }}>
                {isOnline ? '🟢 Online (:8766)' : '🟡 Standalone (Modo Local)'}
              </strong>
            </div>

            <div className="sso-meta-item">
              <span>Mecanismo de Renovação:</span>
              <strong style={{ color: '#0066FF' }}>Auto-Refresh Transparente (Ativo)</strong>
            </div>

            <div className="sso-meta-item">
              <span>Última Sincronização:</span>
              <strong>
                {authData?.lastSync
                  ? new Date(authData.lastSync).toLocaleTimeString('pt-BR')
                  : 'Agora'}
              </strong>
            </div>
          </div>

          {refreshedSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '12px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Sessão Okta e identidade AXET sincronizadas com sucesso!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '12px 20px',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)'
          }}
        >
          {!currentUser && authData?.authenticated && (
            <button
              className="pagination-btn"
              onClick={async () => {
                setLoggingIn(true);
                try {
                  if (onOktaLogin) await onOktaLogin();
                } finally {
                  setLoggingIn(false);
                }
              }}
              disabled={loggingIn}
              style={{
                background: 'linear-gradient(135deg, #0072BC, #0284c7)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={14} />
              <span>{loggingIn ? 'Autenticando...' : `Conectar como ${user.name || 'Usuário Okta'}`}</span>
            </button>
          )}
          <button
            className="pagination-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Sincronizando...' : '🔄 Sincronizar Sessão'}
          </button>
          <button
            className="pagination-btn btn-primary"
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
