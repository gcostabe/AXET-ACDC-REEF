import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Search, ChevronLeft, ChevronRight, AlertTriangle, Fingerprint, Lock, PlusCircle, X, Save, Plus, Trash2, Edit3, Check } from 'lucide-react';

export default function RiskRulesTab() {
  const { token, user, canEditScreen, setShowLoginModal } = useAuth();
  const [subTab, setSubTab] = useState('business-rules'); // default to business rules or 'rs-rules'
  
  // RS-Rules state
  const [rsRules, setRsRules] = useState([]);
  const [rsTotal, setRsTotal] = useState(0);
  const [rsPage, setRsPage] = useState(1);
  const [rsTotalPages, setRsTotalPages] = useState(1);
  const [rsSearch, setRsSearch] = useState('');
  const [loadingRs, setLoadingRs] = useState(false);

  // Business Rules state
  const [businessRules, setBusinessRules] = useState([]);
  const [loadingBusiness, setLoadingBusiness] = useState(false);

  // Triangulation state
  const [triangulationData, setTriangulationData] = useState(null);
  const [loadingTriangulation, setLoadingTriangulation] = useState(false);

  // New Rule Modal State (Business Rule)
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [ruleCountry, setRuleCountry] = useState('BRA');
  const [ruleBranch, setRuleBranch] = useState(231);
  const [ruleStatus, setRuleStatus] = useState('PROD');
  const [ruleLossRatio, setRuleLossRatio] = useState('0.80');
  const [ruleMargin, setRuleMargin] = useState('0.05');
  const [ruleActionType, setRuleActionType] = useState('AdjustPrimeAction');
  
  // Conditions list for new rule
  const [conditions, setConditions] = useState([
    { parameter: { parameter: 'COD_COLOR', type: 'VARIABLE' }, value: '312', relationalOperator: 'EQ', logicalOperator: 'AND' }
  ]);

  const [savingRule, setSavingRule] = useState(false);
  const [ruleError, setRuleError] = useState('');

  // Edit Business Rule State
  const [editingBusinessRule, setEditingBusinessRule] = useState(null);
  const [editRuleName, setEditRuleName] = useState('');
  const [editRuleDesc, setEditRuleDesc] = useState('');
  const [editRuleCountry, setEditRuleCountry] = useState('BRA');
  const [editRuleBranch, setEditRuleBranch] = useState(231);
  const [editRuleStatus, setEditRuleStatus] = useState('PROD');
  const [editRuleLossRatio, setEditRuleLossRatio] = useState('0.80');
  const [editRuleMargin, setEditRuleMargin] = useState('0');
  const [editRuleActionType, setEditRuleActionType] = useState('AdjustPrimeAction');
  const [editRuleConditions, setEditRuleConditions] = useState([]);
  const [savingBusinessRule, setSavingBusinessRule] = useState(false);
  const [editBusinessRuleError, setEditBusinessRuleError] = useState('');

  // Edit RS-Rule State
  const [editingRsRule, setEditingRsRule] = useState(null);
  const [editRsName, setEditRsName] = useState('');
  const [editRsCompany, setEditRsCompany] = useState(21);
  const [editRsActive, setEditRsActive] = useState('Y');
  const [editRsConditions, setEditRsConditions] = useState([]);
  const [savingRsRule, setSavingRsRule] = useState(false);
  const [editRsError, setEditRsError] = useState('');

  const canEdit = canEditScreen('rules');

  const fetchBusinessRules = () => {
    setLoadingBusiness(true);
    fetch('/api/dup/rules')
      .then(res => res.json())
      .then(data => {
        setBusinessRules(data.rules || []);
        setLoadingBusiness(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingBusiness(false);
      });
  };

  const fetchRsRules = (page = 1, search = '') => {
    setLoadingRs(true);
    fetch(`/api/dup/risk-rules?page=${page}&limit=15&search=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        setRsRules(data.rules || []);
        setRsTotal(data.total || 0);
        setRsPage(data.page || 1);
        setRsTotalPages(data.totalPages || 1);
        setLoadingRs(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingRs(false);
      });
  };

  useEffect(() => {
    if (subTab === 'business-rules') {
      fetchBusinessRules();
    } else if (subTab === 'rs-rules') {
      fetchRsRules(rsPage, rsSearch);
    } else if (subTab === 'triangulation' && !triangulationData) {
      setLoadingTriangulation(true);
      fetch('/api/dup/triangulation')
        .then(res => res.json())
        .then(data => {
          setTriangulationData(data);
          setLoadingTriangulation(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingTriangulation(false);
        });
    }
  }, [subTab, rsPage]);

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { parameter: { parameter: 'COD_MARCA', type: 'VARIABLE' }, value: '1', relationalOperator: 'EQ', logicalOperator: 'AND' }
    ]);
  };

  const handleRemoveCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index, field, val) => {
    const updated = [...conditions];
    if (field === 'paramName') {
      updated[index].parameter.parameter = val;
    } else if (field === 'operator') {
      updated[index].relationalOperator = val;
    } else if (field === 'value') {
      updated[index].value = val;
    }
    setConditions(updated);
  };

  const handleCreateRuleSubmit = async (e) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      setRuleError('O nome da regra é obrigatório.');
      return;
    }

    setSavingRule(true);
    setRuleError('');

    try {
      const res = await fetch('/api/dup/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: ruleName,
          description: ruleDesc,
          countryCode: ruleCountry,
          branchCode: ruleBranch,
          status: ruleStatus,
          lossRatio: ruleLossRatio,
          adjustmentMargin: ruleMargin,
          actionType: ruleActionType,
          conditions
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar regra.');

      setShowNewRuleModal(false);
      setRuleName('');
      setRuleDesc('');
      fetchBusinessRules();
    } catch (err) {
      setRuleError(err.message);
    } finally {
      setSavingRule(false);
    }
  };

  // Business Rule Edit Handlers
  const handleOpenEditBusinessRule = (br) => {
    setEditingBusinessRule(br);
    setEditRuleName(br.name || '');
    setEditRuleDesc(br.description || '');
    setEditRuleCountry(br.branch?.countryCode || 'BRA');
    setEditRuleBranch(br.branch?.branchCode || 231);
    setEditRuleStatus(br.status || 'PROD');
    setEditRuleLossRatio(br.lossRatio || '0.80');
    setEditRuleMargin(br.adjustmentMargin || '0');
    const actType = br.action?._class ? br.action._class.split('.').pop() : 'AdjustPrimeAction';
    setEditRuleActionType(actType);
    
    let conds = [];
    if (br.action?.condition && Array.isArray(br.action.condition) && br.action.condition.length > 0) {
      conds = JSON.parse(JSON.stringify(br.action.condition));
    } else {
      conds = [{ parameter: { parameter: 'COD_COLOR', type: 'VARIABLE' }, value: '312', relationalOperator: 'EQ', logicalOperator: 'AND' }];
    }
    setEditRuleConditions(conds);
    setEditBusinessRuleError('');
  };

  const handleAddEditCondition = () => {
    setEditRuleConditions([
      ...editRuleConditions,
      { parameter: { parameter: 'COD_MARCA', type: 'VARIABLE' }, value: '1', relationalOperator: 'EQ', logicalOperator: 'AND' }
    ]);
  };

  const handleRemoveEditCondition = (index) => {
    setEditRuleConditions(editRuleConditions.filter((_, i) => i !== index));
  };

  const handleEditConditionChange = (index, field, val) => {
    const updated = [...editRuleConditions];
    if (field === 'paramName') {
      if (!updated[index].parameter) updated[index].parameter = { type: 'VARIABLE' };
      updated[index].parameter.parameter = val;
    } else if (field === 'operator') {
      updated[index].relationalOperator = val;
    } else if (field === 'value') {
      updated[index].value = val;
    }
    setEditRuleConditions(updated);
  };

  const handleUpdateBusinessRuleSubmit = async (e) => {
    e.preventDefault();
    if (!editRuleName.trim()) {
      setEditBusinessRuleError('O nome da regra é obrigatório.');
      return;
    }

    setSavingBusinessRule(true);
    setEditBusinessRuleError('');

    const ruleId = editingBusinessRule._id?._id || editingBusinessRule._id;

    try {
      const res = await fetch(`/api/dup/rules/${encodeURIComponent(ruleId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editRuleName,
          description: editRuleDesc,
          countryCode: editRuleCountry,
          branchCode: editRuleBranch,
          status: editRuleStatus,
          lossRatio: editRuleLossRatio,
          adjustmentMargin: editRuleMargin,
          actionType: editRuleActionType,
          conditions: editRuleConditions
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar regra.');

      setEditingBusinessRule(null);
      fetchBusinessRules();
    } catch (err) {
      setEditBusinessRuleError(err.message);
    } finally {
      setSavingBusinessRule(false);
    }
  };

  // RS-Rule Edit Handlers
  const handleOpenEditRsRule = (rule) => {
    setEditingRsRule(rule);
    setEditRsName(rule.rule_name || '');
    setEditRsCompany(rule.company || 21);
    setEditRsActive(rule.active || 'Y');
    
    let conds = [];
    if (rule.conditions && Array.isArray(rule.conditions) && rule.conditions.length > 0) {
      conds = JSON.parse(JSON.stringify(rule.conditions));
    } else {
      conds = [{ factor: 'variableData.FACTOR', operator: 'EQ', value: '1' }];
    }
    setEditRsConditions(conds);
    setEditRsError('');
  };

  const handleAddRsCondition = () => {
    setEditRsConditions([
      ...editRsConditions,
      { factor: 'variableData.FACTOR', operator: 'EQ', value: '' }
    ]);
  };

  const handleRemoveRsCondition = (index) => {
    setEditRsConditions(editRsConditions.filter((_, i) => i !== index));
  };

  const handleEditRsConditionChange = (index, field, val) => {
    const updated = [...editRsConditions];
    updated[index][field] = val;
    setEditRsConditions(updated);
  };

  const handleUpdateRsRuleSubmit = async (e) => {
    e.preventDefault();
    if (!editRsName.trim()) {
      setEditRsError('O nome da regra é obrigatório.');
      return;
    }

    setSavingRsRule(true);
    setEditRsError('');

    const ruleId = editingRsRule.rule_id || editingRsRule._id;

    try {
      const res = await fetch(`/api/dup/risk-rules/${encodeURIComponent(ruleId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rule_name: editRsName,
          company: editRsCompany,
          active: editRsActive,
          conditions: editRsConditions
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar regra de seleção.');

      setEditingRsRule(null);
      fetchRsRules(rsPage, rsSearch);
    } catch (err) {
      setEditRsError(err.message);
    } finally {
      setSavingRsRule(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <ShieldCheck className="stat-icon blue" style={{ width: '32px', height: '32px', padding: '6px' }} />
            Seleção de Risco & Regras de Subscrição
          </h2>
          <p className="section-subtitle">
            Motor de regras para aceitação de apólices, alçadas de subscrição, margem de risco e prevenção de fraude
          </p>
        </div>

        {/* Action Buttons & Sub-tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`pagination-btn ${subTab === 'business-rules' ? 'active' : ''}`}
              onClick={() => setSubTab('business-rules')}
            >
              Regras de Negócio & Desconto ({businessRules.length})
            </button>
            <button
              className={`pagination-btn ${subTab === 'rs-rules' ? 'active' : ''}`}
              onClick={() => setSubTab('rs-rules')}
            >
              Regras de Seleção ({rsTotal > 0 ? rsTotal.toLocaleString() : '50k+'})
            </button>
            <button
              className={`pagination-btn ${subTab === 'triangulation' ? 'active' : ''}`}
              onClick={() => setSubTab('triangulation')}
            >
              <Fingerprint size={14} /> Triangulação
            </button>
          </div>

          {canEdit ? (
            <button
              className="pagination-btn btn-primary"
              onClick={() => {
                setRuleError('');
                setShowNewRuleModal(true);
              }}
            >
              <PlusCircle size={15} /> + Nova Regra
            </button>
          ) : (
            <button
              className="pagination-btn"
              onClick={() => setShowLoginModal(true)}
              title="Faça login com permissão para criar regras"
            >
              <PlusCircle size={15} /> + Nova Regra
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: BUSINESS RULES */}
      {subTab === 'business-rules' && (
        <div>
          {loadingBusiness ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Carregando regras de subscrição...</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
              {businessRules.map((br, idx) => (
                <div key={idx} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span className="badge badge-blue">{br.branch?.countryCode || 'GLOBAL'}</span>
                        <span className="badge badge-gray">Ramo #{br.branch?.branchCode}</span>
                        <span className={`badge ${br.status === 'PROD' ? 'badge-emerald' : 'badge-amber'}`}>
                          {br.status}
                        </span>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {br.name}
                      </h4>
                    </div>

                    {canEdit ? (
                      <button
                        className="pagination-btn"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={() => handleOpenEditBusinessRule(br)}
                        title="Editar regra de subscrição"
                      >
                        <Edit3 size={13} /> Editar
                      </button>
                    ) : (
                      <button
                        className="pagination-btn"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', opacity: 0.6 }}
                        onClick={() => setShowLoginModal(true)}
                        title="Faça login com permissão para editar"
                      >
                        <Edit3 size={13} /> Editar
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {br.description || 'Sem descrição cadastrada'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#080d18', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Loss Ratio Alvo</span>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>{br.lossRatio || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Margem de Ajuste</span>
                      <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>{br.adjustmentMargin || '0'}</strong>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ação: </span>
                    <code style={{ color: '#60a5fa' }}>
                      {br.action?._class?.split('.').pop() || 'Ação Padrão'}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: RS-RULES */}
      {subTab === 'rs-rules' && (
        <div>
          <form
            onSubmit={(e) => { e.preventDefault(); setRsPage(1); fetchRsRules(1, rsSearch); }}
            className="filter-bar card"
            style={{ padding: '0.85rem 1.25rem' }}
          >
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Buscar por ID da regra ou nome..."
                value={rsSearch}
                onChange={(e) => setRsSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="pagination-btn btn-primary">
              Pesquisar
            </button>
          </form>

          {loadingRs ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Consultando regras de risco...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rsRules.map((rule) => (
                <div key={rule.rule_id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-purple">Regra #{rule.rule_id}</span>
                        <span className="badge badge-gray">Cia #{rule.company}</span>
                        <span className={`badge ${rule.active === 'Y' ? 'badge-emerald' : 'badge-rose'}`}>
                          {rule.active === 'Y' ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600 }}>
                        {rule.rule_name}
                      </h4>
                    </div>

                    {canEdit ? (
                      <button
                        className="pagination-btn"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={() => handleOpenEditRsRule(rule)}
                        title="Editar regra de seleção de risco"
                      >
                        <Edit3 size={13} /> Editar
                      </button>
                    ) : (
                      <button
                        className="pagination-btn"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', opacity: 0.6 }}
                        onClick={() => setShowLoginModal(true)}
                        title="Faça login com permissão para editar"
                      >
                        <Edit3 size={13} /> Editar
                      </button>
                    )}
                  </div>

                  {/* Conditions Section */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Condições de Avaliação ({rule.conditions ? rule.conditions.length : 0})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {rule.conditions && rule.conditions.map((cond, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#070b14',
                            border: '1px solid var(--border-card)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.4rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.82rem',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          <span style={{ color: '#60a5fa' }}>{cond.factor}</span>
                          <span className="badge badge-blue">{cond.operator}</span>
                          <span style={{ color: '#00e599', fontWeight: 600 }}>
                            {typeof cond.value === 'object' ? JSON.stringify(cond.value) : String(cond.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="pagination">
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Página {rsPage} de {rsTotalPages} ({rsTotal.toLocaleString()} regras encontradas)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="pagination-btn"
                    disabled={rsPage <= 1}
                    onClick={() => setRsPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={rsPage >= rsTotalPages}
                    onClick={() => setRsPage(p => p + 1)}
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: TRIANGULATION KEYS */}
      {subTab === 'triangulation' && (
        <div>
          {loadingTriangulation ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Carregando parâmetros de triangulação...</span>
            </div>
          ) : triangulationData && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} color="var(--accent-cyan)" />
                Parâmetros de Triangulação & Antifraude por Filial
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                {triangulationData.branchConfigs.map((cfg, idx) => (
                  <div key={idx} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="badge badge-emerald">{cfg._id}</span>
                      <span className={`badge ${cfg.triangulationKeyConfiguration?.enabled ? 'badge-blue' : 'badge-gray'}`}>
                        {cfg.triangulationKeyConfiguration?.enabled ? 'Triangulação Ativa' : 'Desativada'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                      <div>Detector de Mesmo Risco: <strong>{cfg.triangulationKeyConfiguration?.sameRiskEnabled ? 'Sim' : 'Não'}</strong></div>
                      <div>Validade Mesmo Risco: <strong>{cfg.triangulationKeyConfiguration?.sameRiskValidityDays || 0} dias</strong></div>
                      <div>Prevenção Multi-Transação: <strong>{cfg.triangulationKeyConfiguration?.multipleTransactionEnabled ? 'Sim' : 'Não'}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NOVA REGRA (MANTER AUDITORIA) */}
      {showNewRuleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowNewRuleModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '640px',
              background: '#0c1220',
              border: '1px solid var(--border-card)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 102, 255, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} color="var(--primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
                  Cadastrar Nova Regra de Subscrição
                </h3>
              </div>
              <button
                onClick={() => setShowNewRuleModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {ruleError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {ruleError}
              </div>
            )}

            <form onSubmit={handleCreateRuleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Nome da Regra:
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ex: Regra de Bonificação Frotas SP"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Descrição / Objetivo de Negócio:
                </label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder="Objetivo da regra atuarial..."
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  style={{ resize: 'none', padding: '0.65rem 1rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>País</label>
                  <select
                    className="select-field"
                    value={ruleCountry}
                    onChange={(e) => setRuleCountry(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="BRA">Brasil (BRA)</option>
                    <option value="ESP">Espanha (ESP)</option>
                    <option value="MEX">México (MEX)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Ramo (Código)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={ruleBranch}
                    onChange={(e) => setRuleBranch(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Status</label>
                  <select
                    className="select-field"
                    value={ruleStatus}
                    onChange={(e) => setRuleStatus(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="PROD">PROD (Produção)</option>
                    <option value="TEST">TEST (Homologação)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Loss Ratio Alvo</label>
                  <input
                    type="text"
                    className="input-field"
                    value={ruleLossRatio}
                    onChange={(e) => setRuleLossRatio(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Margem Ajuste</label>
                  <input
                    type="text"
                    className="input-field"
                    value={ruleMargin}
                    onChange={(e) => setRuleMargin(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Tipo de Ação:
                </label>
                <select
                  className="select-field"
                  value={ruleActionType}
                  onChange={(e) => setRuleActionType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="AdjustPrimeAction">Ajustar Prêmio (AdjustPrimeAction)</option>
                  <option value="NoReturnPriceAction">Não Retornar Preço / Bloquear (NoReturnPriceAction)</option>
                  <option value="ReturnCodeAction">Retornar Código de Desvio (ReturnCodeAction)</option>
                </select>
              </div>

              {/* Conditions Builder */}
              <div style={{ background: '#070b14', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    Condições da Regra ({conditions.length})
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={handleAddCondition}
                  >
                    <Plus size={12} /> Adicionar Condição
                  </button>
                </div>

                {conditions.map((cond, cidx) => (
                  <div key={cidx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ flex: 2, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      placeholder="Parâmetro (ex: COD_COLOR)"
                      value={cond.parameter?.parameter || ''}
                      onChange={(e) => handleConditionChange(cidx, 'paramName', e.target.value)}
                    />
                    <select
                      className="select-field"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', minWidth: '70px' }}
                      value={cond.relationalOperator}
                      onChange={(e) => handleConditionChange(cidx, 'operator', e.target.value)}
                    >
                      <option value="EQ">EQ (=)</option>
                      <option value="LT">LT (&lt;)</option>
                      <option value="GT">GT (&gt;)</option>
                      <option value="IN">IN (Na Lista)</option>
                      <option value="NE">NE (!=)</option>
                    </select>
                    <input
                      type="text"
                      className="input-field"
                      style={{ flex: 2, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      placeholder="Valor (ex: 312)"
                      value={cond.value}
                      onChange={(e) => handleConditionChange(cidx, 'value', e.target.value)}
                    />
                    {conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(cidx)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '0.3rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setShowNewRuleModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRule}
                  className="pagination-btn btn-primary"
                >
                  {savingRule ? 'Criando e Auditando...' : 'Salvar Regra com Auditoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR REGRA DE NEGÓCIO & SUBSCRIÇÃO */}
      {editingBusinessRule && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setEditingBusinessRule(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '640px',
              background: '#0c1220',
              border: '1px solid var(--border-card)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 102, 255, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="var(--primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
                  Editar Regra #{editingBusinessRule._id?._id || editingBusinessRule._id}
                </h3>
              </div>
              <button
                onClick={() => setEditingBusinessRule(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {editBusinessRuleError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {editBusinessRuleError}
              </div>
            )}

            <form onSubmit={handleUpdateBusinessRuleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Nome da Regra:
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editRuleName}
                  onChange={(e) => setEditRuleName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Descrição / Objetivo de Negócio:
                </label>
                <textarea
                  className="input-field"
                  rows="2"
                  value={editRuleDesc}
                  onChange={(e) => setEditRuleDesc(e.target.value)}
                  style={{ resize: 'none', padding: '0.65rem 1rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>País</label>
                  <select
                    className="select-field"
                    value={editRuleCountry}
                    onChange={(e) => setEditRuleCountry(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="BRA">Brasil (BRA)</option>
                    <option value="ESP">Espanha (ESP)</option>
                    <option value="MEX">México (MEX)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Ramo (Código)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editRuleBranch}
                    onChange={(e) => setEditRuleBranch(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Status</label>
                  <select
                    className="select-field"
                    value={editRuleStatus}
                    onChange={(e) => setEditRuleStatus(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="PROD">PROD (Produção)</option>
                    <option value="TEST">TEST (Homologação)</option>
                    <option value="INACTIVE">INACTIVE (Inativo)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Loss Ratio Alvo</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editRuleLossRatio}
                    onChange={(e) => setEditRuleLossRatio(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Margem Ajuste</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editRuleMargin}
                    onChange={(e) => setEditRuleMargin(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Tipo de Ação:
                </label>
                <select
                  className="select-field"
                  value={editRuleActionType}
                  onChange={(e) => setEditRuleActionType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="AdjustPrimeAction">Ajustar Prêmio (AdjustPrimeAction)</option>
                  <option value="NoReturnPriceAction">Não Retornar Preço / Bloquear (NoReturnPriceAction)</option>
                  <option value="ReturnCodeAction">Retornar Código de Desvio (ReturnCodeAction)</option>
                </select>
              </div>

              {/* Conditions Builder */}
              <div style={{ background: '#070b14', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    Condições da Regra ({editRuleConditions.length})
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={handleAddEditCondition}
                  >
                    <Plus size={12} /> Adicionar Condição
                  </button>
                </div>

                {editRuleConditions.map((cond, cidx) => (
                  <div key={cidx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ flex: 2, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      placeholder="Parâmetro (ex: COD_COLOR)"
                      value={cond.parameter?.parameter || ''}
                      onChange={(e) => handleEditConditionChange(cidx, 'paramName', e.target.value)}
                    />
                    <select
                      className="select-field"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', minWidth: '70px' }}
                      value={cond.relationalOperator || 'EQ'}
                      onChange={(e) => handleEditConditionChange(cidx, 'operator', e.target.value)}
                    >
                      <option value="EQ">EQ (=)</option>
                      <option value="LT">LT (&lt;)</option>
                      <option value="GT">GT (&gt;)</option>
                      <option value="IN">IN (Na Lista)</option>
                      <option value="NE">NE (!=)</option>
                    </select>
                    <input
                      type="text"
                      className="input-field"
                      style={{ flex: 2, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      placeholder="Valor (ex: 312)"
                      value={cond.value}
                      onChange={(e) => handleEditConditionChange(cidx, 'value', e.target.value)}
                    />
                    {editRuleConditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEditCondition(cidx)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '0.3rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setEditingBusinessRule(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBusinessRule}
                  className="pagination-btn btn-primary"
                >
                  {savingBusinessRule ? 'Salvando e Auditando...' : 'Salvar Alterações com Auditoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR REGRA DE SELEÇÃO (RS-RULES) */}
      {editingRsRule && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setEditingRsRule(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '640px',
              background: '#0c1220',
              border: '1px solid var(--border-card)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 102, 255, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="var(--accent-purple)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
                  Editar Regra de Seleção #{editingRsRule.rule_id}
                </h3>
              </div>
              <button
                onClick={() => setEditingRsRule(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {editRsError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {editRsError}
              </div>
            )}

            <form onSubmit={handleUpdateRsRuleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Nome da Regra:
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editRsName}
                  onChange={(e) => setEditRsName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Companhia</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editRsCompany}
                    onChange={(e) => setEditRsCompany(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Status de Ativação</label>
                  <select
                    className="select-field"
                    value={editRsActive}
                    onChange={(e) => setEditRsActive(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Y">Ativa (Y)</option>
                    <option value="N">Inativa (N)</option>
                  </select>
                </div>
              </div>

              {/* Conditions Builder */}
              <div style={{ background: '#070b14', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                    Condições de Avaliação ({editRsConditions.length})
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={handleAddRsCondition}
                  >
                    <Plus size={12} /> Adicionar Condição
                  </button>
                </div>

                {editRsConditions.map((cond, cidx) => (
                  <div key={cidx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ flex: 2, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      placeholder="Fator (ex: variableData.FACTOR)"
                      value={cond.factor || ''}
                      onChange={(e) => handleEditRsConditionChange(cidx, 'factor', e.target.value)}
                    />
                    <select
                      className="select-field"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', minWidth: '70px' }}
                      value={cond.operator || 'EQ'}
                      onChange={(e) => handleEditRsConditionChange(cidx, 'operator', e.target.value)}
                    >
                      <option value="EQ">EQ (=)</option>
                      <option value="LT">LT (&lt;)</option>
                      <option value="GT">GT (&gt;)</option>
                      <option value="IN">IN (Na Lista)</option>
                      <option value="NE">NE (!=)</option>
                    </select>
                    <input
                      type="text"
                      className="input-field"
                      style={{ flex: 2, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      placeholder="Valor"
                      value={typeof cond.value === 'object' ? JSON.stringify(cond.value) : cond.value}
                      onChange={(e) => handleEditRsConditionChange(cidx, 'value', e.target.value)}
                    />
                    {editRsConditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRsCondition(cidx)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '0.3rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setEditingRsRule(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRsRule}
                  className="pagination-btn btn-primary"
                >
                  {savingRsRule ? 'Salvando e Auditando...' : 'Salvar Alterações com Auditoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
