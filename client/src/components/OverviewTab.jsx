import React from 'react';
import { Database, ShieldCheck, Calculator, Layers, Globe2, Package, Sliders } from 'lucide-react';

export default function OverviewTab({ stats, onSelectTab }) {
  if (!stats) return null;

  const { summary, keyMetrics, environment } = stats;

  return (
    <div className="overview-container">
      {/* Top Banner with NTT DATA Light Theme Gradient */}
      <div 
        className="card" 
        style={{ 
          marginBottom: '2rem', 
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 60%, #faf5ff 100%)', 
          borderColor: '#bfdbfe',
          boxShadow: '0 4px 14px -3px rgba(0, 102, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">Ambiente {environment}</span>
            <span className="badge badge-emerald">
              {stats.activeEnvironment?.name ? `MongoDB: ${stats.activeEnvironment.name} (${stats.activeEnvironment.type === 'local' ? 'Docker' : 'Remoto'})` : 'MongoDB 7.0 Ativo'}
            </span>
            <span className="badge badge-purple">Activo Digital de Cálculo</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Plataforma ACDC • MAPFRE Seguros
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', width: '100%', maxWidth: '100%', margin: 0, lineHeight: '1.6' }}>
            Ecossistema corporativo integrando o <strong>Data Update Process (DUP)</strong> — seleção e aceitação de riscos em 11 passos de workflow — e o <strong>Rating Engine (RTE)</strong> — motor atuarial de tarifação, pacotes de cobertura e conceitos de desglose. Mais de 1,4 milhão de registros estruturados para consulta atuarial e auditoria.
          </p>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', paddingTop: '0.35rem' }}>
            <button className="pagination-btn" onClick={() => onSelectTab('packages')}>
              <Package size={15} style={{ color: '#7c3aed' }} /> Ver Pacotes ({keyMetrics.coveragePackages || 759})
            </button>
            <button className="pagination-btn" onClick={() => onSelectTab('rules')}>
              <ShieldCheck size={15} style={{ color: '#0066ff' }} /> Regras DUP (101k)
            </button>
            <button className="pagination-btn btn-primary" onClick={() => onSelectTab('rating')}>
              <Calculator size={15} /> Tarifação RTE
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('explorer')}>
          <div className="stat-icon blue">
            <Database size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{summary.totalDocuments.toLocaleString('pt-BR')}</span>
            <span className="stat-label">Total de Documentos no Banco</span>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('rules')}>
          <div className="stat-icon purple">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{(keyMetrics.riskActionsConditions || 101250).toLocaleString('pt-BR')}</span>
            <span className="stat-label">Regras DUP (Ações & Condições)</span>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('packages')}>
          <div className="stat-icon emerald">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{keyMetrics.coveragePackages || 759}</span>
            <span className="stat-label">Pacotes & Módulos de Cobertura</span>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('rating')}>
          <div className="stat-icon cyan">
            <Sliders size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{(keyMetrics.breakdownConcepts || 1270).toLocaleString('pt-BR')}</span>
            <span className="stat-label">Conceitos de Desglose RTE</span>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('rating')}>
          <div className="stat-icon amber">
            <Calculator size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{keyMetrics.ratingFormulas || 203}</span>
            <span className="stat-label">Fórmulas de Cálculo Atuarial</span>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('products')}>
          <div className="stat-icon rose">
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{keyMetrics.products || 131}</span>
            <span className="stat-label">Produtos de Seguro</span>
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
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>Módulo DUP (Data Update Process)</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{summary.dup.name}</span>
              </div>
            </div>
            <span className="badge badge-blue">{summary.dup.collectionsCount} Coleções</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Workflow de seleção e aceitação de risco (Risk Selection) executado em 11 etapas sequenciais, 101.250 regras de ações e condições (`RS-RULES-ACTIONS-CONDITIONS`), inspeção de sinistros e histórico de apólices Tronador.
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
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>Módulo RTE (Rating Engine)</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{summary.rte.name}</span>
              </div>
            </div>
            <span className="badge badge-blue">{summary.rte.collectionsCount} Coleções</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Motor atuarial de tarifação Tronador, definição de pacotes e módulos de coberturas (`COVERAGE-PACKAGE-DEFINITION`), 1.270 conceitos de cálculo (`BREAKDOWN-CONCEPTS`), 203 fórmulas matemáticas, bases técnicas e fatores de fixação.
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
