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
import LoginPage from './components/LoginPage';

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

  const [oktaLoggingIn, setOktaLoggingIn] = useState(false);

  const handleOktaLogin = async () => {
    setOktaLoggingIn(true);
    try {
      const res = await fetch('/api/auth/okta-login', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao autenticar com Okta SSO.');
      login(data.token, data.user);
      setShowOktaModal(false);
    } catch (err) {
      console.error('Error logging in via Okta:', err);
    } finally {
      setOktaLoggingIn(false);
    }
  };

  if (!user) {
    return (
      <LoginPage
        oktaAuth={oktaAuth}
        onRefreshOkta={handleRefreshOkta}
      />
    );
  }

  return (
    <div className="app-container">
      <LoginModal />
      <OktaSsoModal
        isOpen={showOktaModal}
        onClose={() => setShowOktaModal(false)}
        authData={oktaAuth}
        currentUser={user}
        onOktaLogin={handleOktaLogin}
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
          {/* Status Pills do MongoDB e Okta SSO Gateway exibidos exclusivamente quando logado */}
          {user && (
            <>
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

              {/* Status Pill do Okta SSO & Gateway (:8766) - Idêntico ao RAG-LOCAL-REEF */}
              <div
                className="status-pill okta-gateway-pill"
                onClick={() => setShowOktaModal(true)}
                title={
                  oktaAuth?.authenticated
                    ? `Okta SSO Conectado • ${Math.round((oktaAuth.gateway?.remainingSeconds || 0) / 60)} min restantes • Ver detalhes da sessão corporativa`
                    : 'Okta SSO • Clique para detalhes e conexão'
                }
                style={{
                  cursor: 'pointer',
                  background: oktaAuth?.authenticated ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: oktaAuth?.authenticated ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  color: oktaAuth?.authenticated ? '#059669' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span
                  className="pulse-dot"
                  style={{
                    background: oktaAuth?.authenticated ? '#10b981' : '#ef4444',
                    boxShadow: oktaAuth?.authenticated ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
                  }}
                ></span>
                <span>Okta SSO :8766</span>
              </div>
            </>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {oktaAuth?.authenticated ? (
                <button
                  className="pagination-btn"
                  onClick={handleOktaLogin}
                  disabled={oktaLoggingIn}
                  title="Conectar com sua sessão corporativa OneNTT Okta ativa"
                  style={{
                    background: 'linear-gradient(135deg, #0072BC, #0284c7)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    padding: '0.45rem 0.9rem',
                    boxShadow: '0 2px 8px rgba(0, 114, 188, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.8rem'
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>{oktaLoggingIn ? 'Autenticando...' : 'Entrar com Okta SSO'}</span>
                </button>
              ) : null}
              <button
                className="pagination-btn btn-primary"
                onClick={() => setShowLoginModal(true)}
                style={{
                  fontWeight: 600,
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem'
                }}
              >
                <LogIn size={14} />
                <span>{oktaAuth?.authenticated ? 'Outro Acesso' : 'Entrar / Solicitar Acesso'}</span>
              </button>
            </div>
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
