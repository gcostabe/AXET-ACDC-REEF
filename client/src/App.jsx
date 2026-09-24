import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  LayoutDashboard, Layers, ShieldCheck, Calculator, History, Database, 
  Sparkles, RefreshCw, UserCheck, Users, LogIn, LogOut, Lock, Package,
  Sun, Moon, Settings, Server
} from 'lucide-react';
import OverviewTab from './components/OverviewTab';
import ProductsCatalogTab from './components/ProductsCatalogTab';
import CoveragePackagesTab from './components/CoveragePackagesTab';
import RiskRulesTab from './components/RiskRulesTab';
import RatingEngineTab from './components/RatingEngineTab';
import AuditTab from './components/AuditTab';
import DataExplorerTab from './components/DataExplorerTab';
import AdminTab from './components/AdminTab';
import LoginModal from './components/LoginModal';
import ChatBotWidget from './components/ChatBotWidget';
import OktaSsoModal from './components/OktaSsoModal';

function MainApp() {
  const { user, login, logout, canAccessTab, setShowLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminSubTab, setAdminSubTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('acdc_theme') || 'light');
  const [oktaAuth, setOktaAuth] = useState(null);
  const [showOktaModal, setShowOktaModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('acdc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const fetchStats = () => {
    setLoadingStats(true);
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoadingStats(false);
      })
      .catch(err => {
        console.error('Error loading stats:', err);
        setLoadingStats(false);
      });
  };

  const fetchOktaStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setOktaAuth(data);
      }
    } catch (err) {
      console.error('Error loading Okta status:', err);
    }
  };

  const handleRefreshOkta = async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setOktaAuth(data);
      }
    } catch (err) {
      console.error('Error refreshing Okta session:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOktaStatus();
  }, []);

  // If user is admin, check pending requests
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('acdc_auth_token')}` }
      })
        .then(res => res.json())
        .then(data => {
          setPendingUsersCount(data.pendingCount || 0);
        })
        .catch(console.error);
    }
  }, [user]);

  // Adjust active tab if user doesn't have access to current tab
  useEffect(() => {
    if (!canAccessTab(activeTab)) {
      setActiveTab('overview');
    }
  }, [user]);

  return (
    <div className="app-container">
      <LoginModal />
      <OktaSsoModal
        isOpen={showOktaModal}
        onClose={() => setShowOktaModal(false)}
        authData={oktaAuth}
        onRefresh={handleRefreshOkta}
      />

      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-icon-wrapper" style={{ background: 'transparent', boxShadow: 'none', width: '38px', height: '38px' }}>
            <img src="/logo.png" alt="NTT DATA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div className="brand-title">
              ACDC Explorer
              <span className="brand-badge">MAPFRE • BR-INT</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Activo Digital de Cálculo • Data Update Process (DUP) & Rating Engine (RTE)
            </span>
          </div>
        </div>

        {/* User Auth & Theme Section in Header */}
        <div className="header-status">
          <div 
            className="status-pill"
            style={{ 
              cursor: user?.role === 'ADMIN' ? 'pointer' : 'default',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              if (user?.role === 'ADMIN') {
                setAdminSubTab('environments');
                setActiveTab('admin');
              }
            }}
            title={user?.role === 'ADMIN' ? 'Clique para gerenciar ambientes e conexões MongoDB' : 'Status do MongoDB'}
          >
            <span className={`pulse-dot ${stats?.connectionStatus === 'ERROR' ? 'error' : ''}`}></span>
            {stats?.activeEnvironment?.name ? (
              <span>
                {stats.activeEnvironment.name}{' '}
                <span style={{ opacity: 0.8, fontSize: '0.72rem', fontWeight: 600 }}>
                  ({stats.activeEnvironment.type === 'local' ? 'Docker' : 'Remoto'})
                </span>
              </span>
            ) : (
              'MongoDB 7.0 Ativo'
            )}
          </div>

          {/* Indicador de Sessão Okta SSO & Gateway */}
          {oktaAuth?.user && (
            <div
              className="header-auth-badge"
              id="header-auth-badge"
              onClick={() => setShowOktaModal(true)}
              title="Sessão Okta SSO (NTT DATA) via API Gateway :8766. Clique para ver detalhes."
            >
              <div className="auth-user-avatar" id="header-auth-avatar">
                {(() => {
                  const words = (oktaAuth.user.name || '').split(' ').filter(Boolean);
                  return words.length > 1
                    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
                    : (words[0] ? words[0].slice(0, 2).toUpperCase() : 'GB');
                })()}
              </div>
              <div className="auth-user-info">
                <span className="auth-user-name" id="header-auth-name">
                  {oktaAuth.user.firstName ? `${oktaAuth.user.firstName} B.` : (oktaAuth.user.name || 'Gustavo B.')}
                </span>
                <span className="auth-sso-status">
                  <span
                    className="auth-sso-dot"
                    style={{
                      background: oktaAuth.gateway?.gateway8766Online || oktaAuth.gateway?.status === 'connected' ? '#10b981' : '#eab308'
                    }}
                  ></span>
                  Okta SSO :8766
                </span>
              </div>
            </div>
          )}

          <button
            className="pagination-btn"
            style={{ padding: '0.4rem 0.65rem' }}
            onClick={toggleTheme}
            title={theme === 'light' ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro'}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            className="pagination-btn"
            style={{ padding: '0.4rem 0.75rem' }}
            onClick={fetchStats}
            title="Recarregar estatísticas"
          >
            <RefreshCw size={14} className={loadingStats ? 'spinner' : ''} />
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>{user.email}</span>
              </div>
              <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.72rem' }}>
                {user.role}
              </span>
              <button
                className="pagination-btn"
                onClick={logout}
                title="Sair da Conta"
                style={{ padding: '0.3rem 0.5rem', background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              className="pagination-btn btn-primary"
              onClick={() => setShowLoginModal(true)}
              style={{
                fontWeight: 600,
                padding: '0.45rem 1rem'
              }}
            >
              <LogIn size={15} /> Entrar / Solicitar Acesso
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        {canAccessTab('overview') && (
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={16} /> Visão Geral
          </button>
        )}

        {canAccessTab('products') && (
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Layers size={16} /> Catálogo de Produtos
          </button>
        )}

        {canAccessTab('packages') && (
          <button
            className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            <Package size={16} /> Pacotes & Módulos
          </button>
        )}

        {canAccessTab('rules') && (
          <button
            className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <ShieldCheck size={16} /> Seleção de Risco & Regras
          </button>
        )}

        {canAccessTab('rating') && (
          <button
            className={`tab-btn ${activeTab === 'rating' ? 'active' : ''}`}
            onClick={() => setActiveTab('rating')}
          >
            <Calculator size={16} /> Motor de Tarifação (RTE)
          </button>
        )}

        {/* Auditoria PECA: Somente ADMIN */}
        {user?.role === 'ADMIN' && (
          <button
            className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <History size={16} /> Auditoria & Diff (PECA)
          </button>
        )}

        {canAccessTab('explorer') && (
          <button
            className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            <Database size={16} /> Explorador MongoDB
          </button>
        )}

        {/* Área Administrativa: Somente ADMIN */}
        {user?.role === 'ADMIN' && (
          <button
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setAdminSubTab('users');
              setActiveTab('admin');
            }}
          >
            <Settings size={16} /> Administração
            {pendingUsersCount > 0 && (
              <span
                style={{
                  background: 'var(--accent-amber)',
                  color: '#000',
                  borderRadius: '9999px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  marginLeft: '0.25rem'
                }}
              >
                {pendingUsersCount}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Main Content View */}
      <main className="main-content">
        {loadingStats && !stats ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Conectando à base de dados ACDC...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab stats={stats} onSelectTab={setActiveTab} />}
            {activeTab === 'products' && <ProductsCatalogTab />}
            {activeTab === 'packages' && <CoveragePackagesTab />}
            {activeTab === 'rules' && <RiskRulesTab />}
            {activeTab === 'rating' && <RatingEngineTab />}
            {activeTab === 'audit' && <AuditTab />}
            {activeTab === 'explorer' && <DataExplorerTab />}
            {activeTab === 'admin' && (
              <AdminTab
                defaultSubTab={adminSubTab}
                pendingUsersCount={pendingUsersCount}
                onEnvironmentChanged={() => {
                  fetchStats();
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Global Floating AI Copilot Widget */}
      <ChatBotWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
