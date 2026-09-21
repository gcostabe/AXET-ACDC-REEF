import React from 'react';
import { Database, ShieldCheck, Calculator, Layers, Globe2 } from 'lucide-react';

export default function OverviewTab({ stats, onSelectTab }) {
  if (!stats) return null;

  const { summary, keyMetrics, environment } = stats;

  return (
    <div className="overview-container">
      {/* Top Banner with NTT DATA Gradient */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.18), rgba(0, 163, 255, 0.08))', borderColor: 'rgba(0, 102, 255, 0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-blue">Ambiente {environment}</span>
              <span className="badge badge-emerald">MongoDB 7.0 Ativo</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
              Plataforma ACDC • MAPFRE Seguros
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '750px', marginTop: '0.4rem' }}>
              Ecossistema integrado de <strong>Subscrição Dinâmica (DUP)</strong> e <strong>Motor de Tarifação (RTE)</strong> com 51 coleções e mais de 1,4 milhão de registros estruturados para consulta e auditoria.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="pagination-btn" onClick={() => onSelectTab('products')}>
              <Layers size={15} /> Ver Produtos
            </button>
            <button className="pagination-btn btn-primary" onClick={() => onSelectTab('rating')}>
              <Calculator size={15} /> Fórmulas RTE
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon blue">
            <Database size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary.totalDocuments.toLocaleString('pt-BR')}</span>
            <span className="stat-label">Total de Documentos no Banco</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon purple">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{keyMetrics.riskSelectionRules.toLocaleString('pt-BR')}</span>
            <span className="stat-label">Regras de Seleção de Risco (RS)</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon cyan">
            <Calculator size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{keyMetrics.ratingFormulas}</span>
            <span className="stat-label">Fórmulas de Cálculo Atuarial</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon emerald">
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{keyMetrics.products}</span>
            <span className="stat-label">Produtos de Seguro Cadastrados</span>
          </div>
        </div>
      </div>

      {/* Databases Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* DUP Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>Módulo DUP</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{summary.dup.name}</span>
              </div>
            </div>
            <span className="badge badge-blue">{summary.dup.collectionsCount} Coleções</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Subscrição dinâmica, seleção de risco (Risk Selection), regras de corte/desvio, controle antifraude e tabelas de carga batch legadas do Tronador.
          </p>
          <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coleção</th>
                  <th style={{ textAlign: 'right' }}>Registros</th>
                </tr>
              </thead>
              <tbody>
                {summary.dup.collections.map((c) => (
                  <tr key={c.name}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{c.count.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RTE Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="stat-icon cyan" style={{ width: '40px', height: '40px' }}>
                <Calculator size={20} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>Módulo RTE</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{summary.rte.name}</span>
              </div>
            </div>
            <span className="badge badge-blue">{summary.rte.collectionsCount} Coleções</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Motor de Tarifação (Tronador Rating Engine), definição de fórmulas atuariais, constantes financeiras, conceitos de bonificação, bases técnicas e fatores de fixação.
          </p>
          <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coleção</th>
                  <th style={{ textAlign: 'right' }}>Registros</th>
                </tr>
              </thead>
              <tbody>
                {summary.rte.collections.map((c) => (
                  <tr key={c.name}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{c.count.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
