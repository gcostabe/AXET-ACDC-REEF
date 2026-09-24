import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Search, ChevronLeft, ChevronRight, AlertTriangle, Fingerprint, Lock, PlusCircle, X, Save, Plus, Trash2, Edit3, Check, Eye, Layers, Info, LayoutGrid, List, ArrowRight, Filter } from 'lucide-react';

export default function RiskRulesTab() {
  const { token, user, canEditScreen, setShowLoginModal } = useAuth();
  const [subTab, setSubTab] = useState('actions-conditions'); // default to DUP master rules

  // DUP Master Rules (RS-RULES-ACTIONS-CONDITIONS - 101k+ rules)
  const [dupRules, setDupRules] = useState([]);
  const [dupTotal, setDupTotal] = useState(0);
  const [dupPage, setDupPage] = useState(1);
  const [dupTotalPages, setDupTotalPages] = useState(1);
  const [dupStep, setDupStep] = useState('ALL');
  const [dupActionType, setDupActionType] = useState('ALL');
  const [dupSearch, setDupSearch] = useState('');
  const [loadingDup, setLoadingDup] = useState(false);
  const [selectedDupRule, setSelectedDupRule] = useState(null);
  const [dupViewMode, setDupViewMode] = useState('cards'); // 'cards' | 'table'

  // RS-Rules state (Metadata)
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

  const fetchDupRules = (p = 1, step = 'ALL', actionType = 'ALL', search = '') => {
    setLoadingDup(true);
    let url = `/api/dup/rules-actions-conditions?page=${p}&limit=12`;
    if (step !== 'ALL') url += `&step=${step}`;
    if (actionType !== 'ALL') url += `&actionType=${encodeURIComponent(actionType)}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setDupRules(data.rules || []);
        setDupTotal(data.total || 0);
        setDupPage(data.page || 1);
        setDupTotalPages(data.totalPages || 1);
        setLoadingDup(false);
      })
      .catch(err => {
        console.error('Error fetching DUP rules:', err);
        setLoadingDup(false);
      });
  };

  useEffect(() => {
    if (subTab === 'actions-conditions') {
      fetchDupRules(dupPage, dupStep, dupActionType, dupSearch);
    } else if (subTab === 'business-rules') {
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
  }, [subTab, dupPage, dupStep, dupActionType, rsPage]);

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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`pagination-btn ${subTab === 'actions-conditions' ? 'active' : ''}`}
              onClick={() => setSubTab('actions-conditions')}
            >
              <ShieldCheck size={14} /> Regras DUP: Ações & Condições ({dupTotal > 0 ? dupTotal.toLocaleString() : '101k+'})
            </button>
            <button
              className={`pagination-btn ${subTab === 'rs-rules' ? 'active' : ''}`}
              onClick={() => setSubTab('rs-rules')}
            >
              Process Rules & Metadados ({rsTotal > 0 ? rsTotal.toLocaleString() : '50k+'})
            </button>
            <button
              className={`pagination-btn ${subTab === 'business-rules' ? 'active' : ''}`}
              onClick={() => setSubTab('business-rules')}
            >
              Regras Legadas ({businessRules.length})
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

      {/* SUBTAB 0: DUP MASTER RULES (RS-RULES-ACTIONS-CONDITIONS) */}
      {subTab === 'actions-conditions' && (
        <div>
          {/* Filters Bar (Standardized with search-input-wrapper) */}
          <div className="card filter-bar" style={{ padding: '0.9rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
              {/* Process Step Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Passo:</span>
                <select
                  className="select-field"
                  style={{ minWidth: '190px' }}
                  value={dupStep}
                  onChange={(e) => { setDupStep(e.target.value); setDupPage(1); }}
                >
                  <option value="ALL">Todos os Passos (1-11)</option>
                  <option value="1">Passo 1: FIXED_DATA (Dados Fixos)</option>
                  <option value="2">Passo 2: VARIABLE_DATA_POLICY (Variáveis Política)</option>
                  <option value="3">Passo 3: BENEFICIARY (Beneficiários)</option>
                  <option value="4">Passo 4: VARIABLE_DATA_RISK (Variáveis Risco)</option>
                  <option value="5">Passo 5: OBJETO_ASEGURADO (Objeto Segurado)</option>
                  <option value="6">Passo 6: COVERAGE (Coberturas & Capitais)</option>
                  <option value="8">Passo 8: CONTROLS (Controles Finais)</option>
                  <option value="9">Passo 9: DOCUMENTOS (Validação Documentos)</option>
                </select>
              </div>

              {/* Action Type Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ação:</span>
                <select
                  className="select-field"
                  style={{ minWidth: '150px' }}
                  value={dupActionType}
                  onChange={(e) => { setDupActionType(e.target.value); setDupPage(1); }}
                >
                  <option value="ALL">Todas as Ações</option>
                  <option value="Asignacion">Asignacion (Atribuição)</option>
                  <option value="Auditoria">Auditoria (Alerta)</option>
                  <option value="Cuestionario">Cuestionario</option>
                  <option value="Documentacion">Documentacion</option>
                  <option value="Prima minima">Prima minima</option>
                  <option value="Rechazo">Rechazo (Bloqueio)</option>
                  <option value="Tarifa">Tarifa (Extraprêmio)</option>
                </select>
              </div>

              {/* Search text in standard .search-input-wrapper */}
              <div className="search-input-wrapper" style={{ flex: 1, minWidth: '240px' }}>
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por ID, nome da regra ou fator (ex: insured.age)..."
                  value={dupSearch}
                  onChange={(e) => setDupSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setDupPage(1);
                      fetchDupRules(1, dupStep, dupActionType, dupSearch);
                    }
                  }}
                />
                {dupSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setDupSearch('');
                      setDupPage(1);
                      fetchDupRules(1, dupStep, dupActionType, '');
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

              <button
                type="button"
                className="pagination-btn btn-primary"
                onClick={() => { setDupPage(1); fetchDupRules(1, dupStep, dupActionType, dupSearch); }}
              >
                Filtrar
              </button>
              
              {(dupSearch || dupStep !== 'ALL' || dupActionType !== 'ALL') && (
                <button
                  type="button"
                  className="pagination-btn btn-ghost"
                  onClick={() => {
                    setDupStep('ALL');
                    setDupActionType('ALL');
                    setDupSearch('');
                    setDupPage(1);
                    fetchDupRules(1, 'ALL', 'ALL', '');
                  }}
                >
                  Limpar Filtros
                </button>
              )}

              {/* View Switcher: Cards vs Table */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setDupViewMode('cards')}
                  className={`pagination-btn ${dupViewMode === 'cards' ? 'active' : ''}`}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.76rem',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '6px'
                  }}
                  title="Visualização moderna em Cards Clicáveis"
                >
                  <LayoutGrid size={13} /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setDupViewMode('table')}
                  className={`pagination-btn ${dupViewMode === 'table' ? 'active' : ''}`}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.76rem',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '6px'
                  }}
                  title="Visualização tabular compacta"
                >
                  <List size={13} /> Tabela
                </button>
              </div>
            </div>
          </div>

          {/* DUP Rules Content Container */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {loadingDup ? (
              <div className="loading-state" style={{ padding: '4rem 1rem' }}>
                <div className="spinner"></div>
                <span>Carregando regras DUP do banco de subscrição...</span>
              </div>
            ) : dupRules.length === 0 ? (
              <div className="empty-state" style={{ padding: '4rem 1rem' }}>
                <ShieldCheck size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <p>Nenhuma regra DUP encontrada com os filtros selecionados.</p>
              </div>
            ) : dupViewMode === 'cards' ? (
              /* MODERN CLICKABLE CARDS VIEW (Clean, unpolluted, readable) */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
                {dupRules.map((rule) => {
                  const isRechazo = Array.isArray(rule.actions) && rule.actions.some(a => a.type === 'Rechazo');
                  const isTarifa = Array.isArray(rule.actions) && rule.actions.some(a => a.type === 'Tarifa');
                  const actionMsg = Array.isArray(rule.actions) && rule.actions.find(a => a.message)?.message;

                  return (
                    <div
                      key={rule._id}
                      className="card"
                      onClick={() => setSelectedDupRule(rule)}
                      style={{
                        cursor: 'pointer',
                        padding: '1.15rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.18s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 102, 255, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Card Content Top */}
                      <div>
                        {/* Header Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', padding: '2px 6px' }}>
                              ID #{rule.rule_id}
                            </span>
                            <span className={`badge ${rule.process_step === 4 ? 'badge-blue' : rule.process_step === 6 ? 'badge-purple' : rule.process_step === 8 ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                              {rule.stepLabel || `Passo ${rule.process_step}`}
                            </span>
                            {Array.isArray(rule.actions) && rule.actions.map((act, aIdx) => (
                              <span
                                key={aIdx}
                                className={`badge ${act.type === 'Rechazo' ? 'badge-rose' : act.type === 'Tarifa' ? 'badge-purple' : act.type === 'Asignacion' ? 'badge-blue' : 'badge-amber'}`}
                                style={{ fontSize: '0.7rem' }}
                              >
                                {act.type}
                              </span>
                            ))}
                          </div>

                          <span className={`badge ${rule.active === 'Y' ? 'badge-emerald' : 'badge-gray'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                            {rule.active === 'Y' ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>

                        {/* Rule Name Title */}
                        <h4 style={{
                          fontSize: '0.94rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          margin: '0 0 0.55rem 0',
                          lineHeight: 1.4,
                          letterSpacing: '-0.2px'
                        }}>
                          {rule.rule_name || `Regra #${rule.rule_id}`}
                        </h4>

                        {/* Scope Tags (Product, Branch, Coverage) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                            Prod {rule.product}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                            Ramo {rule.branch}
                          </span>
                          {rule.coverage && (
                            <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                              Cob #{rule.coverage}
                            </span>
                          )}
                          {rule.process_field && (
                            <span className="badge badge-cyan" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                              {rule.process_field}
                            </span>
                          )}
                        </div>

                        {/* Conditions Summary */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                          <span className="badge badge-amber" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Filter size={11} /> {rule.conditionsCount || (Array.isArray(rule.conditions) ? rule.conditions.length : 0)} condições avaliadas
                          </span>

                          {/* Quick Factor Pills */}
                          {Array.isArray(rule.conditions) && rule.conditions.slice(0, 2).map((c, cIdx) => (
                            <span key={cIdx} style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                              {c.factor ? c.factor.split('.').slice(-1)[0] : 'cond'}
                            </span>
                          ))}
                        </div>

                        {/* Message Preview if available */}
                        {actionMsg && (
                          <p style={{
                            fontSize: '0.76rem',
                            color: 'var(--text-secondary)',
                            margin: '0 0 0.5rem 0',
                            fontStyle: 'italic',
                            lineHeight: 1.35,
                            background: 'var(--bg-card)',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            borderLeft: isRechazo ? '3px solid #f43f5e' : isTarifa ? '3px solid #a855f7' : '3px solid #3b82f6'
                          }}>
                            "{actionMsg.length > 85 ? actionMsg.slice(0, 85) + '...' : actionMsg}"
                          </p>
                        )}
                      </div>

                      {/* Card Footer / Affordance */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '0.65rem',
                        marginTop: '0.5rem',
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)'
                      }}>
                        <span>Criado por: <strong style={{ color: 'var(--text-secondary)' }}>{rule.created_by || 'MAPFRE'}</strong></span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Ver detalhes da regra <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABULAR COMPACT VIEW */
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID & Nome da Regra</th>
                      <th>Passo do Processo (Step)</th>
                      <th>Produto / Ramo</th>
                      <th>Ações Geradas</th>
                      <th>Condições Avaliadas</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dupRules.map((rule) => (
                      <tr key={rule._id} className="table-row-hover" onClick={() => setSelectedDupRule(rule)} style={{ cursor: 'pointer' }}>
                        <td style={{ maxWidth: '320px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                              {rule.rule_name || `Regra #${rule.rule_id}`}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                              ID: {rule.rule_id}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${rule.process_step === 4 ? 'badge-blue' : rule.process_step === 6 ? 'badge-purple' : rule.process_step === 8 ? 'badge-amber' : 'badge-gray'}`} style={{ fontSize: '0.75rem' }}>
                            {rule.stepLabel}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            Prod {rule.product} | Ramo {rule.branch}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {Array.isArray(rule.actions) && rule.actions.map((act, aIdx) => (
                              <span
                                key={aIdx}
                                className={`badge ${act.type === 'Rechazo' ? 'badge-rose' : act.type === 'Tarifa' ? 'badge-purple' : act.type === 'Asignacion' ? 'badge-blue' : 'badge-amber'}`}
                                style={{ fontSize: '0.72rem' }}
                                title={act.message || act.type}
                              >
                                {act.type}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                            {rule.conditionsCount} {rule.conditionsCount === 1 ? 'condição' : 'condições'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${rule.active === 'Y' ? 'badge-emerald' : 'badge-gray'}`} style={{ fontSize: '0.72rem' }}>
                            {rule.active === 'Y' ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="pagination-btn"
                            style={{ padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedDupRule(rule); }}
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

            {/* Pagination */}
            {!loadingDup && dupTotalPages > 1 && (
              <div className="pagination-bar" style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Página {dupPage} de {dupTotalPages} ({dupTotal.toLocaleString()} regras DUP)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="pagination-btn"
                    disabled={dupPage <= 1}
                    onClick={() => setDupPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={dupPage >= dupTotalPages}
                    onClick={() => setDupPage(p => Math.min(dupTotalPages, p + 1))}
                  >
                    Próxima <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DUP Rule Inspection Modal */}
          {selectedDupRule && (
            <div className="modal-overlay" onClick={() => setSelectedDupRule(null)}>
              <div className="modal-content card" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <ShieldCheck className="stat-icon blue" style={{ width: '28px', height: '28px', padding: '5px' }} />
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                        {selectedDupRule.rule_name || `Regra DUP #${selectedDupRule.rule_id}`}
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ID da Regra: {selectedDupRule.rule_id} | {selectedDupRule.stepLabel} | Produto: {selectedDupRule.product} | Ramo: {selectedDupRule.branch}
                    </span>
                  </div>
                  <button className="icon-btn" onClick={() => setSelectedDupRule(null)}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Actions Section */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Layers size={16} /> Ações Disparadas ({Array.isArray(selectedDupRule.actions) ? selectedDupRule.actions.length : 0})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {Array.isArray(selectedDupRule.actions) && selectedDupRule.actions.map((act, aIdx) => (
                        <div key={aIdx} className="card" style={{ background: 'var(--bg-surface)', padding: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span className={`badge ${act.type === 'Rechazo' ? 'badge-rose' : act.type === 'Tarifa' ? 'badge-purple' : 'badge-blue'}`}>
                              {act.type}
                            </span>
                            {act.jumpLevel && (
                              <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                                Salto de Nível: {act.jumpLevel}
                              </span>
                            )}
                            {act.value && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Valor: {act.value}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            {act.message || 'Sem mensagem cadastrada.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conditions Section */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={16} /> Condições de Avaliação ({Array.isArray(selectedDupRule.conditions) ? selectedDupRule.conditions.length : 0})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {Array.isArray(selectedDupRule.conditions) && selectedDupRule.conditions.map((cond, cIdx) => (
                        <div key={cIdx} className="card" style={{ background: 'var(--bg-surface)', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code style={{ color: 'var(--primary)', fontSize: '0.82rem', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                              {cond.factor || cond.processField || 'Campo'}
                            </code>
                            <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                              {cond.operator || 'EQ'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {cond.value2 !== undefined ? (
                              <span>Entre {cond.value1} e {cond.value2}</span>
                            ) : (
                              <span>{cond.value1 !== undefined ? String(cond.value1) : String(cond.value || '')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
        <div className="modal-overlay" onClick={() => setShowNewRuleModal(false)}>
          <div
            className="modal-content card"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} color="var(--primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-main)' }}>
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
        <div className="modal-overlay" onClick={() => setEditingBusinessRule(null)}>
          <div
            className="modal-content card"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="var(--primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-main)' }}>
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
          className="modal-overlay"
          onClick={() => setEditingRsRule(null)}
        >
          <div
            className="modal-content card"
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="var(--accent-purple)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-main)' }}>
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
