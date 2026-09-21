import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Building, AlertCircle, CheckCircle2, X, Sparkles, LogIn, UserPlus } from 'lucide-react';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [justification, setJustification] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!showLoginModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register (Solicitar Acesso)
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, department, justification })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao registrar solicitação.');

        setSuccessMsg(data.message || 'Solicitação enviada com sucesso! Aguarde a aprovação do Administrador.');
        setIsRegister(false);
        setPassword('');
      } else {
        // Login
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no login.');

        login(data.token, data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.2)',
          position: 'relative'
        }}
      >
        <button
          onClick={() => setShowLoginModal(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            className="logo-icon-wrapper"
            style={{ margin: '0 auto 0.75rem', width: '56px', height: '56px', background: 'transparent', boxShadow: 'none' }}
          >
            <img src="/logo.png" alt="NTT DATA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700 }}>
            {isRegister ? 'Solicitar Acesso' : 'Entrar no ACDC'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isRegister
              ? 'Preencha seus dados para análise e liberação pelo Administrador'
              : 'Faça login para editar fórmulas, acessar auditoria e exportar dados'}
          </p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              color: 'var(--accent-emerald)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {isRegister && (
            <>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Nome Completo
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: Carlos Atuário"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Departamento / Área
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: Atuária Automóvel"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              E-mail Corporativo
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="input-field"
                placeholder="seu.email@mapfre.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Justificativa de Acesso
              </label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="Motivo da solicitação de acesso..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                style={{ resize: 'none', padding: '0.65rem 1rem' }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pagination-btn"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem',
              justifyContent: 'center',
              fontWeight: 600,
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
            ) : isRegister ? (
              <>
                <UserPlus size={16} /> Enviar Solicitação de Acesso
              </>
            ) : (
              <>
                <LogIn size={16} /> Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {isRegister ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Já possui conta aprovada?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Fazer Login
              </button>
            </p>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Não tem acesso?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
              >
                Solicitar Cadastro
              </button>
            </p>
          )}
        </div>

        {/* Tip for Admin quick test */}
        {!isRegister && (
          <div style={{ marginTop: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Admin padrão: <strong style={{ color: '#93c5fd' }}>admin@acdc.mapfre</strong> / senha: <strong style={{ color: '#93c5fd' }}>admin123</strong>
          </div>
        )}
      </div>
    </div>
  );
}
