import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Mail, Lock, User, Building, ArrowRight, 
  LogIn, UserPlus, AlertCircle, CheckCircle2, Sun, Moon 
} from 'lucide-react';
import OktaSsoModal from './OktaSsoModal';

export default function LoginPage({ oktaAuth, onRefreshOkta }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showOktaModal, setShowOktaModal] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [justification, setJustification] = useState('');

  const [loading, setLoading] = useState(false);
  const [oktaLoading, setOktaLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Primary Action: Okta SSO (OneNTT)
  const handleOktaLogin = async () => {
    setError('');
    setOktaLoading(true);
    try {
      const res = await fetch('/api/auth/okta-login', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        // If not authenticated yet on gateway, open Okta SSO modal
        setShowOktaModal(true);
        throw new Error(data.error || 'Autenticação necessária via Okta SSO.');
      }
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setOktaLoading(false);
    }
  };

  // Local Submit (Login or Register)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, department, justification })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao registrar solicitação de acesso.');

        setSuccessMsg(data.message || 'Solicitação enviada com sucesso! Aguarde aprovação do Administrador.');
        setIsRegister(false);
        setPassword('');
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no login. Verifique suas credenciais.');

        login(data.token, data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Background Ambient Glows */}
      <div className="login-bg-glow glow-1"></div>
      <div className="login-bg-glow glow-2"></div>

      <div className="login-card-wrapper">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-box">
            <img src="/logo.png" alt="NTT DATA" className="login-logo-img" />
          </div>
          <h1 className="login-title">
            ACDC Explorer
            <span className="login-title-badge">MAPFRE • REEF</span>
          </h1>
          <p className="login-subtitle">
            Activo Digital de Cálculo • Data Update Process (DUP) & Rating Engine (RTE)
          </p>
        </div>

        {/* Card Container */}
        <div className="login-card">
          {/* Okta SSO Primary Button */}
          <div className="okta-primary-box">
            <button
              type="button"
              onClick={handleOktaLogin}
              disabled={oktaLoading}
              className="okta-sso-btn"
            >
              <ShieldCheck className="okta-btn-icon" />
              <span>
                {oktaLoading ? 'Conectando ao Okta SSO...' : 'Entrar com SSO Okta (OneNTT)'}
              </span>
            </button>
            <p className="okta-btn-hint">
              Autenticação corporativa • Integração com aXet AI & Cockpit ACDC
            </p>
          </div>

          {/* Divider */}
          <div className="login-divider">
            <div className="divider-line"></div>
            <span className="divider-text">ou credenciais locais</span>
            <div className="divider-line"></div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="login-alert error">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="login-alert success">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <div className="input-wrapper">
                    <User size={15} className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Atuário"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="login-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Departamento / Área</label>
                  <div className="input-wrapper">
                    <Building size={15} className="input-icon" />
                    <input
                      type="text"
                      placeholder="Ex: Atuária / Tarifação"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="login-input"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Corporativo</label>
              <div className="input-wrapper">
                <Mail size={15} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@mapfre.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="input-wrapper">
                <Lock size={15} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
              </div>
            </div>

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Justificativa de Acesso</label>
                <textarea
                  rows="2"
                  placeholder="Motivo da solicitação de acesso à plataforma ACDC..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="login-input textarea"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="local-submit-btn"
            >
              {loading ? (
                <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></span>
              ) : isRegister ? (
                <>
                  <span>Enviar Solicitação de Acesso</span>
                  <UserPlus size={16} />
                </>
              ) : (
                <>
                  <span>Entrar com Senha Local</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="login-footer-links">
            {isRegister ? (
              <p className="footer-link-text">
                Já possui conta cadastrada?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="footer-link-btn"
                >
                  Fazer Login
                </button>
              </p>
            ) : (
              <p className="footer-link-text">
                Não possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className="footer-link-btn"
                >
                  Solicitar cadastro
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Brand Footer */}
        <p className="login-bottom-copyright">
          Ambiente corporativo seguro • ACDC Explorer • MAPFRE Seguros
        </p>
      </div>

      {/* Okta SSO Device Modal if user needs device activation */}
      <OktaSsoModal
        isOpen={showOktaModal}
        onClose={() => setShowOktaModal(false)}
        authData={oktaAuth}
        currentUser={null}
        onOktaLogin={handleOktaLogin}
        onRefresh={onRefreshOkta}
      />
    </div>
  );
}
