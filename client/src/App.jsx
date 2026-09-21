import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LayoutDashboard, Layers, ShieldCheck, Calculator, History, Database, Sparkles, RefreshCw, UserCheck, Users, LogIn, LogOut, Lock } from 'lucide-react';
import OverviewTab from './components/OverviewTab';
import ProductsCatalogTab from './components/ProductsCatalogTab';
import RiskRulesTab from './components/RiskRulesTab';
import RatingEngineTab from './components/RatingEngineTab';
import AuditTab from './components/AuditTab';
import DataExplorerTab from './components/DataExplorerTab';
import UsersManagementTab from './components/UsersManagementTab';
import LoginModal from './components/LoginModal';
import ChatBotWidget from './components/ChatBotWidget';

function MainApp() {
  const { user, logout, canAccessTab, setShowLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

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

  useEffect(() => {
    fetchStats();
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
              Dynamic Underwriting (DUP) & Rating Engine (RTE)
            </span>
          </div>
        </div>

        {/* User Auth Section in Header */}
        <div className="header-status">
          <div className="status-pill">
            <span className="pulse-dot"></span>
            MongoDB 7.0 Ativo
          </div>

          <button
            className="pagination-btn"
            style={{ padding: '0.4rem 0.75rem' }}
            onClick={fetchStats}
            title="Recarregar estatísticas"
          >
            <RefreshCw size={14} className={loadingStats ? 'spinner' : ''} />
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{user.email}</span>
              </div>
              <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.72rem' }}>
                {user.role}
              </span>
              <button
                className="pagination-btn"
                onClick={logout}
                title="Sair da Conta"
                style={{ padding: '0.3rem 0.5rem', background: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)' }}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              className="pagination-btn"
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                border: 'none',
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

        {/* Gestão de Usuários: Somente ADMIN */}
        {user?.role === 'ADMIN' && (
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Gestão de Usuários
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
            {activeTab === 'rules' && <RiskRulesTab />}
            {activeTab === 'rating' && <RatingEngineTab />}
            {activeTab === 'audit' && <AuditTab />}
            {activeTab === 'explorer' && <DataExplorerTab />}
            {activeTab === 'users' && <UsersManagementTab />}
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
