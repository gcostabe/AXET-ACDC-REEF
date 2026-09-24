import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  Bot,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Terminal,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  Copy,
  Check
} from 'lucide-react';

export default function AiGatewayManagementTab() {
  const { token } = useAuth();
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingLlm, setTestingLlm] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  const fetchGatewayStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gateway/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGatewayStatus(data);
    } catch (err) {
      console.error('Erro ao buscar status do gateway:', err);
      setGatewayStatus({
        online: false,
        host: 'http://127.0.0.1:8766',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayStatus();
  }, []);

  const handleTestLlm = async () => {
    setTestingLlm(true);
    setLlmTestResult(null);

    try {
      const res = await fetch('/api/admin/gateway/test-llm', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLlmTestResult(data);
    } catch (err) {
      setLlmTestResult({
        ok: false,
        error: `Erro ao testar comunicação: ${err.message}`
      });
    } finally {
      setTestingLlm(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const remainingMinutes = gatewayStatus?.auth?.remaining_seconds
    ? Math.floor(gatewayStatus.auth.remaining_seconds / 60)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Spotlight Card - Gateway Health & Okta Token */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(7, 10, 18, 0.4) 100%)',
          border: '1px solid var(--primary-glow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span
                className={`badge ${gatewayStatus?.online ? 'badge-emerald' : 'badge-rose'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.65rem' }}
              >
                <span className={`pulse-dot ${gatewayStatus?.online ? '' : 'error'}`} style={{ margin: 0 }}></span>
                {gatewayStatus?.online ? 'LOCAL AI GATEWAY OPERACIONAL' : 'LOCAL AI GATEWAY OFFLINE'}
              </span>
              <span className="badge badge-blue">Porta :8766 (AXET Bedrock/OpenAI)</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Gateway Corporativo de Inteligência Artificial
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Módulo embarcado na solução ACDC responsável por autenticação OIDC via Okta, proxy reverso e orquestração de LLMs com o NTT DATA AXET.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              className="pagination-btn"
              onClick={fetchGatewayStatus}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
              title="Atualizar status"
            >
              <RefreshCw size={14} className={loading ? 'spinner' : ''} />
              Atualizar
            </button>
            <button
              className="pagination-btn btn-primary"
              onClick={handleTestLlm}
              disabled={testingLlm || !gatewayStatus?.online}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <Zap size={14} className={testingLlm ? 'spinner' : ''} />
              {testingLlm ? 'Executando Teste de Inferência...' : 'Testar Inferência LLM'}
            </button>
          </div>
        </div>

        {/* Status Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)'
          }}
        >
          {/* Autenticação Okta */}
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Autenticação Okta SSO
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              {gatewayStatus?.auth?.authenticated ? (
                <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                  🟢 Token Ativo
                </span>
              ) : (
                <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>
                  🔴 Não Autenticado
                </span>
              )}
              {gatewayStatus?.auth?.email && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {gatewayStatus.auth.email}
                </span>
              )}
            </div>
          </div>

          {/* Validade do Token */}
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tempo Restante do Token
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <Clock size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {remainingMinutes > 0 ? `${remainingMinutes} minutos (${gatewayStatus.auth.remaining_seconds}s)` : 'Expirado / Pendente'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', background: 'rgba(5, 150, 105, 0.1)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                Auto-renovação
              </span>
            </div>
          </div>

          {/* Projeto AXET */}
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Projeto AXET Ativo
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
              <code style={{ fontSize: '0.75rem', background: 'var(--bg-surface)', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
                {gatewayStatus?.health?.active_codex_project_id || 'f8de6928-9f95-43f1-a1bd-410971ec1221'}
              </code>
            </div>
          </div>

          {/* Modelo Padrão */}
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Modelo de Raciocínio Padrão
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                gpt-5.6-terra-high
              </span>
            </div>
          </div>
        </div>

        {/* LLM Inference Test Result Box */}
        {llmTestResult && (
          <div
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: llmTestResult.ok ? 'rgba(5, 150, 105, 0.08)' : 'rgba(225, 29, 72, 0.08)',
              border: `1px solid ${llmTestResult.ok ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              marginTop: '0.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.84rem', color: llmTestResult.ok ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {llmTestResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{llmTestResult.ok ? `Inferência Bem-sucedida (${llmTestResult.latencyMs}ms)` : 'Falha na Inferência'}</span>
              </div>
              {llmTestResult.ok && (
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  Modelo: {llmTestResult.model}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              {llmTestResult.reply || llmTestResult.error}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Models Available & Installation Guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {/* Left Column: Supported Models */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Modelos de IA & Endpoints Disponíveis
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* gpt-5.6-terra-high */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>
                  gpt-5.6-terra-high
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                  Ativo no Copilot & RTE
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Modelo de alta capacidade lógica e raciocínio matemático. Utilizado na validação determinística de fórmulas atuariais e no chat RAG.
              </p>
            </div>

            {/* gpt-5.6-luna-high */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  gpt-5.6-luna-high
                </span>
                <span className="badge" style={{ fontSize: '0.68rem', background: 'var(--bg-card)' }}>
                  Disponível
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Otimizado para respostas em baixa latência e resumos atuariais compactos.
              </p>
            </div>

            {/* text-embedding-3-small */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-purple)' }}>
                  text-embedding-3-small
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                  Embeddings RAG
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Vetores de 1536 dimensões via <code>/codex/v1/embeddings</code>, alimentando a busca híbrida vetorial no MongoDB.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Setup & Self-Contained Instructions */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Instalação da Solução para Novos Usuários
            </h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            O gateway está 100% incorporado ao repositório ACDC em <code>gateway/</code>. Qualquer desenvolvedor pode subir o ambiente através das opções abaixo:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Opção 1: Docker Compose */}
            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  Opção 1: Via Docker (MongoDB + Gateway Juntos)
                </strong>
                <button
                  className="pagination-btn"
                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                  onClick={() => copyToClipboard('docker-compose up -d', 'docker')}
                >
                  {copiedText === 'docker' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                </button>
              </div>
              <code style={{ fontSize: '0.78rem', display: 'block', background: 'var(--bg-card)', padding: '0.35rem 0.55rem', borderRadius: 'var(--radius-sm)' }}>
                docker-compose up -d
              </code>
            </div>

            {/* Opção 2: Python / Scripts Locais */}
            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  Opção 2: Via Scripts Nativos
                </strong>
                <button
                  className="pagination-btn"
                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                  onClick={() => copyToClipboard('./scripts/start_gateway.sh', 'script')}
                >
                  {copiedText === 'script' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                </button>
              </div>
              <code style={{ fontSize: '0.78rem', display: 'block', background: 'var(--bg-card)', padding: '0.35rem 0.55rem', borderRadius: 'var(--radius-sm)' }}>
                ./scripts/start_gateway.sh
              </code>
            </div>

            {/* Sincronização do Token Okta */}
            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Como o Novo Usuário Configura o Token Okta:
              </strong>
              <ol style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', paddingLeft: '1.15rem', margin: 0, lineHeight: 1.5 }}>
                <li>Se tiver o AXET CLI logado no Mac/Linux, o gateway sincroniza automaticamente.</li>
                <li>Caso contrário, basta copiar <code>gateway/tokens.example.json</code> para <code>gateway/tokens.json</code> e inserir seu <code>refresh_token</code> do Okta.</li>
                <li>Executar <code>./scripts/sync_okta.sh</code> para validar a identidade e obter o novo access token.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
