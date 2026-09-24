import React, { useState, useEffect } from 'react';
import { Package, Search, ChevronLeft, ChevronRight, Layers, Eye, X, CheckCircle2, AlertCircle, Info, ShieldCheck, Filter, ArrowRight } from 'lucide-react';

// Friendly labels and icons for package underwriting rules
const RULE_FIELD_DEFINITIONS = {
  COD_MODALIDAD: { label: 'Modalidade do Produto', icon: '📦', format: (v) => `Mod. ${v}` },
  TIP_RELAC: { label: 'Relação com o Segurado', icon: '👤', format: (v) => v === '10' ? '10 — Titular' : `Tipo ${v}` },
  NIVEL_CLIENTE: { label: 'Segmentação do Cliente', icon: '⭐', format: (v) => Array.isArray(v) ? v.join(' ou ') : String(v) },
  EDAD_ACTUARIAL_INI: {
    label: 'Faixa Etária Atuarial',
    icon: '🎂',
    format: (v) => {
      if (typeof v === 'object' && v !== null) {
        const parts = [];
        if (v.mne !== undefined) parts.push(`Idade mínima: ${v.mne} anos`);
        if (v.mxm !== undefined) parts.push(`Idade máxima: ${v.mxm} anos`);
        return parts.join(' • ') || JSON.stringify(v);
      }
      return `${v} anos`;
    }
  },
  COD_OPC_DEDUCIBLE: { label: 'Opção de Franquia', icon: '🛡️', format: (v) => `Opção ${v}` },
  TIP_ANIOS_DURACION_M: { label: 'Duração da Vigência', icon: '📅', format: (v) => `${v} ano(s)` },
  NUM_SIMULACION: { label: 'Simulação Específica', icon: '🔢', format: (v) => `Simulação #${v}` },
  COD_PRODUCTO: { label: 'Código do Produto', icon: '🏷️', format: (v) => `Produto ${v}` },
  TIP_NIVEL_COB: { label: 'Nível de Cobertura', icon: '📊', format: (v) => `Nível ${v}` },
  TIP_COMBUSTIBLE: { label: 'Combustível', icon: '⛽', format: (v) => String(v) }
};

export default function CoveragePackagesTab() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [productQuery, setProductQuery] = useState('');
  const [search, setSearch] = useState('');

  // Selected package for modal view
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchPackages = (p = 1, b = 'ALL', prod = '', s = '') => {
    setLoading(true);
    let url = `/api/packages?page=${p}&limit=12`;
    if (b !== 'ALL') url += `&branch=${b}`;
    if (prod && prod.trim()) url += `&product=${encodeURIComponent(prod.trim())}`;
    if (s && s.trim()) url += `&search=${encodeURIComponent(s.trim())}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setPackages(data.packages || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        if (data.branches && branches.length === 0) setBranches(data.branches);
        if (data.products && products.length === 0) setProducts(data.products);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading coverage packages:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPackages(page, selectedBranch, productQuery, search);
  }, [page, selectedBranch]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchPackages(1, selectedBranch, productQuery, search);
  };

  const handleResetFilters = () => {
    setSelectedBranch('ALL');
    setProductQuery('');
    setSearch('');
    setPage(1);
    fetchPackages(1, 'ALL', '', '');
  };

  const openDetails = (pkg) => {
    setLoadingDetails(true);
    setSelectedPackage(pkg);
    fetch(`/api/packages/${pkg._id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && !data.error) {
          setSelectedPackage(data);
        }
        setLoadingDetails(false);
      })
      .catch(err => {
        console.error('Error loading package details:', err);
        setLoadingDetails(false);
      });
  };

  return (
    <div className="tab-content-container">
      {/* Section Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Package className="stat-icon purple" style={{ width: '36px', height: '36px', padding: '6px' }} />
            Pacotes de Coberturas (MÓDULOS)
          </h2>
          <p className="section-subtitle">
            Definição de ofertas comerciais, regras de elegibilidade e estruturas de capitais da coleção <code>COVERAGE-PACKAGE-DEFINITION</code>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-purple" style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}>
            {total.toLocaleString('pt-BR')} Pacotes Ativos
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="card filter-bar" style={{ padding: '0.9rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
          {/* Branch Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ramo:</span>
            <select
              className="select-field"
              style={{ minWidth: '130px' }}
              value={selectedBranch}
              onChange={(e) => { setSelectedBranch(e.target.value); setPage(1); }}
            >
              <option value="ALL">Todos os Ramos ({branches.length})</option>
              {branches.map(b => (
                <option key={b} value={b}>Ramo {b}</option>
              ))}
            </select>
          </div>

          {/* Product Search Field */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Produto:</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Buscar produto (ex: 42101)..."
                style={{ width: '190px', padding: '0.45rem 1.8rem 0.45rem 0.65rem', fontSize: '0.84rem' }}
                value={productQuery}
                list="product-options"
                onChange={(e) => setProductQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
              {productQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setProductQuery('');
                    setPage(1);
                    fetchPackages(1, selectedBranch, '', search);
                  }}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title="Limpar filtro de produto"
                >
                  <X size={13} />
                </button>
              )}
              <datalist id="product-options">
                {products.map(p => (
                  <option key={p} value={p}>Produto {p}</option>
                ))}
              </datalist>
            </div>
          </div>

          {/* General Search Input */}
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '220px' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por canal, código de preferência ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  fetchPackages(1, selectedBranch, productQuery, '');
                }}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title="Limpar pesquisa"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button type="submit" className="pagination-btn btn-primary">
            Filtrar
          </button>
          
          {(search || selectedBranch !== 'ALL' || productQuery) && (
            <button type="button" className="pagination-btn btn-ghost" onClick={handleResetFilters}>
              Limpar Filtros
            </button>
          )}
        </form>
      </div>

      {/* Packages Table Container */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Carregando pacotes de cobertura...</span>
          </div>
        ) : packages.length === 0 ? (
          <div className="loading-state" style={{ padding: '4rem 1rem' }}>
            <Package size={42} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.5rem' }}>Nenhum pacote de coberturas encontrado</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tente ajustar ou limpar os filtros de ramo e produto.</p>
            <button className="pagination-btn" style={{ marginTop: '0.75rem' }} onClick={handleResetFilters}>
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Preferência / Nome do Pacote</th>
                  <th>Produto</th>
                  <th>Ramo</th>
                  <th>Canal</th>
                  <th>Regras de Elegibilidade</th>
                  <th>Coberturas</th>
                  <th>Vigência</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg._id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {pkg.preferenceName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                            Pref #{pkg.preferenceId}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            ID: {pkg._id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        Prod {pkg.product}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        Ramo {pkg.branchId}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {pkg.channel1 || 'Geral (Todos)'}
                      </span>
                    </td>
                    <td>
                      {pkg.rulesCount > 0 ? (
                        <span className="badge badge-amber">
                          <ShieldCheck size={12} /> {pkg.rulesCount} {pkg.rulesCount === 1 ? 'regra' : 'regras'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sem restrições</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-emerald">
                        <Layers size={12} /> {pkg.coveragesCount} coberturas
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {pkg.validityDate ? new Date(pkg.validityDate).toLocaleDateString('pt-BR') : 'Indeterminado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="pagination-btn"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--primary)' }}
                        onClick={() => openDetails(pkg)}
                      >
                        <Eye size={13} /> Inspecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="pagination" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', margin: '0' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Página <strong style={{ color: 'var(--text-main)' }}>{page}</strong> de <strong style={{ color: 'var(--text-main)' }}>{totalPages}</strong> ({total.toLocaleString('pt-BR')} pacotes cadastrados)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <button
                type="button"
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Próxima <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Package Details Modal */}
      {selectedPackage && (
        <div className="modal-overlay" onClick={() => setSelectedPackage(null)}>
          <div 
            className="modal-content card" 
            style={{ maxWidth: '960px', maxHeight: '88vh', overflowY: 'auto', padding: '1.75rem' }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <Package className="stat-icon purple" style={{ width: '30px', height: '30px', padding: '5px' }} />
                  <span className="badge badge-purple" style={{ fontSize: '0.78rem' }}>
                    Preferência #{selectedPackage.preferenceId}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '0.78rem' }}>
                    Produto {selectedPackage.product}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.78rem' }}>
                    Ramo {selectedPackage.branchId}
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.78rem' }}>
                    {Array.isArray(selectedPackage.coverages) ? selectedPackage.coverages.length : 0} Coberturas
                  </span>
                </div>
                <h3 style={{ margin: '0.25rem 0 0.4rem 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {selectedPackage.preferenceName}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Companhia: {selectedPackage.companyId} • Operador/Origem: {selectedPackage.userVal || 'TRON'} • Canal: {selectedPackage.channel1 || 'Geral (Todos)'} • ID: {selectedPackage._id}
                </span>
              </div>
              <button 
                type="button"
                className="icon-btn" 
                onClick={() => setSelectedPackage(null)}
                style={{ padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="loading-state" style={{ padding: '3rem' }}>
                <div className="spinner"></div>
                <span>Carregando dados detalhados do pacote...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* Rules Section */}
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <ShieldCheck size={18} style={{ color: '#d97706' }} /> 
                    Regras de Elegibilidade & Condições ({Array.isArray(selectedPackage.rules) ? selectedPackage.rules.length : 0})
                  </h4>
                  {Array.isArray(selectedPackage.rules) && selectedPackage.rules.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                      {selectedPackage.rules.map((ruleObj, rIdx) => (
                        <div key={rIdx} className="card" style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                              Regra de Subscrição #{rIdx + 1}
                            </span>
                            <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                              Ativa
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Object.entries(ruleObj || {}).map(([key, val]) => {
                              const def = RULE_FIELD_DEFINITIONS[key] || { label: key, icon: '⚙️' };
                              const formattedVal = def.format ? def.format(val) : (typeof val === 'object' ? JSON.stringify(val) : String(val));
                              return (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    <span style={{ fontSize: '0.9rem' }}>{def.icon}</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{def.label}:</span>
                                  </div>
                                  <span className="badge badge-purple" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                                    {formattedVal}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <CheckCircle2 size={18} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Este pacote não possui restrições condicionais cadastradas. Está <strong>100% elegível</strong> para todas as cotações e emissões correspondentes a este ramo e produto.
                      </p>
                    </div>
                  )}
                </div>

                {/* Coverages Table */}
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <Layers size={18} style={{ color: 'var(--primary)' }} /> 
                    Matriz de Coberturas do Pacote ({Array.isArray(selectedPackage.coverages) ? selectedPackage.coverages.length : 0})
                  </h4>
                  <div className="data-table-container">
                    <table className="data-table" style={{ fontSize: '0.84rem' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '36%' }}>Nome Comercial da Cobertura</th>
                          <th>Obrigatoriedade</th>
                          <th>Capital Padrão</th>
                          <th>Limites (Mín / Máx)</th>
                          <th>Opções / Percentuais</th>
                          <th>Cenários</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(selectedPackage.coverages) && selectedPackage.coverages.map((c, cIdx) => {
                          const cid = c.coverageId || c.data?.coverageId;
                          const isMandatory = c.data?.mandatory === true;
                          const defAmount = c.data?.defaultAmount?.value;
                          const minAmount = c.data?.minAmount;
                          const maxAmount = c.data?.maxAmount;
                          const validPcts = c.data?.validPcts;
                          const validAmounts = c.data?.validAmounts;

                          return (
                            <tr key={cIdx}>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                                    {c.coverageName || `Cobertura ${cid}`}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '1px 5px', fontFamily: 'var(--font-mono)' }}>
                                      Cód #{cid}
                                    </span>
                                    {c.data?.selected && (
                                      <span className="badge badge-blue" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                                        Pré-selecionada
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                {isMandatory ? (
                                  <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={12} /> Obrigatória
                                  </span>
                                ) : (
                                  <span className="badge badge-neutral">
                                    Opcional
                                  </span>
                                )}
                              </td>
                              <td>
                                {defAmount !== null && defAmount !== undefined ? (
                                  <strong style={{ color: 'var(--primary)', fontSize: '0.88rem' }}>
                                    R$ {Number(defAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    Definido na Cotação
                                  </span>
                                )}
                              </td>
                              <td>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  {minAmount !== null && minAmount !== undefined ? `R$ ${Number(minAmount).toLocaleString('pt-BR')}` : 'R$ 0'} até{' '}
                                  {maxAmount !== null && maxAmount !== undefined ? `R$ ${Number(maxAmount).toLocaleString('pt-BR')}` : 'Ilimitado'}
                                </span>
                              </td>
                              <td>
                                {Array.isArray(validPcts) && validPcts.length > 0 ? (
                                  <span className="badge badge-blue">
                                    {validPcts.join('%, ')}%
                                  </span>
                                ) : Array.isArray(validAmounts) && validAmounts.length > 0 ? (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                    {validAmounts.map(v => `R$ ${Number(v).toLocaleString('pt-BR')}`).join(', ')}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                                )}
                              </td>
                              <td>
                                {Array.isArray(c.scenarios) && c.scenarios.length > 0 ? (
                                  <span className="badge badge-purple" title="Possui regras condicionais de cenário">
                                    {c.scenarios.length} {c.scenarios.length === 1 ? 'cenário' : 'cenários'}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Raw JSON View Option */}
                <div>
                  <details style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }}>
                      Ver documento bruto MongoDB (JSON técnico)
                    </summary>
                    <pre className="json-viewer" style={{ marginTop: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                      {JSON.stringify(selectedPackage, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setSelectedPackage(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
