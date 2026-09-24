import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Search, ChevronLeft, ChevronRight, UserCheck, ShieldAlert, GitCommit, FileText, CheckCircle2, AlertTriangle, XCircle, Eye, X, Globe, Calendar } from 'lucide-react';

export default function AuditTab() {
  const { token, user, setShowLoginModal } = useAuth();
  const [subTab, setSubTab] = useState('changelog'); // 'changelog' | 'peca'

  // Changelog (Diffs) state
  const [changelogs, setChangelogs] = useState([]);
  const [loadingChange, setLoadingChange] = useState(false);
  const [changePage, setChangePage] = useState(1);
  const [changeTotalPages, setChangeTotalPages] = useState(1);
  const [changeTotal, setChangeTotal] = useState(0);
  const [changeSearch, setChangeSearch] = useState('');

  // Selected Log for Detailed Modal Diff
  const [selectedLog, setSelectedLog] = useState(null);

  // PECA logs state
  const [pecaLogs, setPecaLogs] = useState([]);
  const [loadingPeca, setLoadingPeca] = useState(false);
  const [pecaPage, setPecaPage] = useState(1);
  const [pecaTotalPages, setPecaTotalPages] = useState(1);
  const [pecaTotal, setPecaTotal] = useState(0);
  const [pecaSearch, setPecaSearch] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      return new Date(val).toLocaleString('pt-BR');
    } catch {
      return String(val);
    }
  };

  const fetchChangelogs = (p = 1, s = '') => {
    if (!isAdmin) return;
    setLoadingChange(true);
    fetch(`/api/audit/changelog?page=${p}&limit=15&search=${encodeURIComponent(s)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setChangelogs(data.logs || []);
        setChangePage(data.page || 1);
        setChangeTotalPages(data.totalPages || 1);
        setChangeTotal(data.total || 0);
        setLoadingChange(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingChange(false);
      });
  };

  const fetchPecaLogs = (p = 1, s = '') => {
    if (!isAdmin) return;
    setLoadingPeca(true);
    fetch(`/api/rte/peca?page=${p}&limit=15&search=${encodeURIComponent(s)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPecaLogs(data.logs || []);
        setPecaPage(data.page || 1);
        setPecaTotalPages(data.totalPages || 1);
        setPecaTotal(data.total || 0);
        setLoadingPeca(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingPeca(false);
      });
  };

  useEffect(() => {
    if (isAdmin) {
      if (subTab === 'changelog') {
        fetchChangelogs(changePage, changeSearch);
      } else {
        fetchPecaLogs(pecaPage, pecaSearch);
      }
    }
  }, [subTab, changePage, pecaPage, isAdmin]);

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <ShieldAlert size={48} color="var(--accent-amber)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>Autenticação Necessária</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          A tela de Auditoria & Trilha de Segurança é restrita. Faça login com uma conta de Administrador.
        </p>
        <button
          className="pagination-btn btn-primary"
          style={{ margin: '0 auto' }}
          onClick={() => setShowLoginModal(true)}
        >
          Fazer Login como Administrador
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <ShieldAlert size={48} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>Acesso Restrito: Somente Administradores</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Seu perfil ({user.role}) não tem permissão para visualizar a Trilha de Auditoria e Segurança.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <History className="stat-icon blue" style={{ width: '32px', height: '32px', padding: '6px' }} />
            Auditoria & Trilha de Segurança (PECA & Diff)
          </h2>
          <p className="section-subtitle">
            Registro detalhado de alterações com histórico de valores (antigo vs novo), autoria e eventos de conformidade
          </p>
        </div>

        {/* Sub-tab pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`pagination-btn ${subTab === 'changelog' ? 'active' : ''}`}
            onClick={() => setSubTab('changelog')}
          >
            <GitCommit size={15} /> Trilha de Modificações ({changeTotal})
          </button>
          <button
            className={`pagination-btn ${subTab === 'peca' ? 'active' : ''}`}
            onClick={() => setSubTab('peca')}
          >
            <FileText size={15} /> Logs de Sistema PECA ({pecaTotal.toLocaleString()})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CHANGELOG TABLE LIST */}
      {subTab === 'changelog' && (
        <div>
          <form
            onSubmit={(e) => { e.preventDefault(); setChangePage(1); fetchChangelogs(1, changeSearch); }}
            className="filter-bar card"
            style={{ padding: '0.85rem 1.25rem' }}
          >
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Buscar por usuário, código da entidade, título ou ação..."
                value={changeSearch}
                onChange={(e) => setChangeSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="pagination-btn btn-primary">
              Pesquisar
            </button>
          </form>

          {loadingChange ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Carregando lista de alterações...</span>
            </div>
          ) : changelogs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <GitCommit size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhuma alteração registrada até o momento.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Edições e criações em Fórmulas, Produtos ou Regras serão listadas aqui com comparativo de valores.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data e Hora</th>
                      <th>Usuário Responsável</th>
                      <th>Entidade / Código</th>
                      <th>Título / Descrição</th>
                      <th>Ação</th>
                      <th>Validação IA</th>
                      <th style={{ textAlign: 'right' }}>Detalhamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changelogs.map((log, idx) => {
                      const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : 'N/A';
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedLog(log)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Calendar size={13} color="var(--text-muted)" />
                              <span>{dateStr}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <UserCheck size={14} color="var(--accent-cyan)" />
                              <span>{log.userName}</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {log.userEmail}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-purple">{log.entity}: {log.entityId}</span>
                          </td>
                          <td style={{ fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.formulaName || log.productName || log.ruleName || log.entityId}
                          </td>
                          <td>
                            <span className={`badge ${log.action === 'CREATE' ? 'badge-emerald' : 'badge-blue'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            {log.aiValidation ? (
                              <span
                                className={`badge ${
                                  log.aiValidation.status === 'APPROVED'
                                    ? 'badge-emerald'
                                    : log.aiValidation.status === 'WARNING'
                                    ? 'badge-amber'
                                    : 'badge-rose'
                                }`}
                              >
                                {log.aiValidation.status}
                              </span>
                            ) : (
                              <span className="badge badge-gray">N/A</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="pagination-btn"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                            >
                              <Eye size={13} /> Ver Diff
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination" style={{ padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Página {changePage} de {changeTotalPages} ({changeTotal} alterações registradas)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="pagination-btn"
                    disabled={changePage <= 1}
                    onClick={() => setChangePage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={changePage >= changeTotalPages}
                    onClick={() => setChangePage(p => p + 1)}
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: SYSTEM PECA LOGS */}
      {subTab === 'peca' && (
        <div>
          <form
            onSubmit={(e) => { e.preventDefault(); setPecaPage(1); fetchPecaLogs(1, pecaSearch); }}
            className="filter-bar card"
            style={{ padding: '0.85rem 1.25rem' }}
          >
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Buscar por e-mail do usuário, rotina atuarial ou IP..."
                value={pecaSearch}
                onChange={(e) => setPecaSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="pagination-btn btn-primary">
              Pesquisar
            </button>
          </form>

          {loadingPeca ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Carregando logs PECA...</span>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Usuário / Identificador</th>
                      <th>Tipo de Acesso</th>
                      <th>Entidade Auditada</th>
                      <th>IP de Origem</th>
                      <th>Data do Evento</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pecaLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserCheck size={14} color="var(--accent-cyan)" />
                            <span>{log.nuuma || 'Sistema Interno'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-blue">{log.accessType || 'EXECUTE'}</span>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{log.entity}: </span>
                            <strong style={{ color: 'var(--accent-amber)' }}>{log.entityId}</strong>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {log.originIp || '127.0.0.1'}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {log.accessDate ? new Date(log.accessDate).toLocaleString('pt-BR') : 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${log.denied ? 'badge-rose' : 'badge-emerald'}`}>
                            {log.denied ? 'Acesso Negado' : 'Autorizado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination" style={{ padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Página {pecaPage} de {pecaTotalPages} ({pecaTotal.toLocaleString()} eventos no banco)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="pagination-btn"
                    disabled={pecaPage <= 1}
                    onClick={() => setPecaPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={pecaPage >= pecaTotalPages}
                    onClick={() => setPecaPage(p => p + 1)}
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAILED MODAL DIFF WHEN ROW IS CLICKED */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div
            className="modal-content card"
            style={{
              maxWidth: '780px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-purple">{selectedLog.entity}: {selectedLog.entityId}</span>
                  <span className={`badge ${selectedLog.action === 'CREATE' ? 'badge-emerald' : 'badge-blue'}`}>
                    {selectedLog.action}
                  </span>
                  {selectedLog.aiValidation && (
                    <span className={`badge ${selectedLog.aiValidation.status === 'APPROVED' ? 'badge-emerald' : selectedLog.aiValidation.status === 'WARNING' ? 'badge-amber' : 'badge-rose'}`}>
                      Validação IA: {selectedLog.aiValidation.status}
                    </span>
                  )}
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  {selectedLog.formulaName || selectedLog.productName || selectedLog.ruleName || selectedLog.entityId}
                </h3>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setSelectedLog(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Metadata strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Usuário / Agente:</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{selectedLog.user || 'Sistema'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Data & Hora:</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{formatDate(selectedLog.timestamp)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Justificativa:</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{selectedLog.justification || 'Alteração técnica'}</span>
                </div>
              </div>

              {/* Title / Name Change */}
              {selectedLog.changes?.title && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Título / Descrição:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#be123c', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Valor Antigo:</span>
                      <span style={{ color: '#be123c', textDecoration: 'line-through', fontSize: '0.88rem' }}>
                        {selectedLog.changes.title.old || '(Vazio)'}
                      </span>
                    </div>
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#047857', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Valor Novo:</span>
                      <span style={{ color: '#047857', fontWeight: 600, fontSize: '0.88rem' }}>
                        {selectedLog.changes.title.new}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expression Change */}
              {selectedLog.changes?.expression && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Expressão Matemática de Cálculo:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#be123c', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Expressão Anterior:</span>
                      <code style={{ fontFamily: 'var(--font-mono)', color: '#be123c', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                        {selectedLog.changes.expression.old || '(Vazio)'}
                      </code>
                    </div>
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#047857', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Nova Expressão:</span>
                      <code style={{ fontFamily: 'var(--font-mono)', color: '#047857', fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                        {selectedLog.changes.expression.new}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic generic changes (for Products, Rules, etc.) */}
              {selectedLog.changes && Object.entries(selectedLog.changes).filter(([k]) => k !== 'title' && k !== 'expression').map(([k, val]) => (
                <div key={k}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Campo: {k}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#be123c', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Anterior:</span>
                      <pre style={{ color: '#be123c', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                        {typeof val?.old === 'object' ? JSON.stringify(val.old, null, 2) : String(val?.old ?? 'N/A')}
                      </pre>
                    </div>
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#047857', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Novo:</span>
                      <pre style={{ color: '#047857', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                        {typeof val?.new === 'object' ? JSON.stringify(val.new, null, 2) : String(val?.new ?? 'N/A')}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}

              {/* If full created payload */}
              {selectedLog.createdPayload && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Dados do Registro Criado:
                  </div>
                  <pre className="json-viewer">
                    {JSON.stringify(selectedLog.createdPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* AI Validation explanation */}
            {selectedLog.aiValidation && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Parecer do Modelo IA ({selectedLog.aiValidation.modelUsed}):
                </span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedLog.aiValidation.message}
                </p>
                {selectedLog.aiValidation.variables && selectedLog.aiValidation.variables.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {selectedLog.aiValidation.variables.map((v, i) => (
                      <span key={i} className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)' }}>
                        [{v}]
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="pagination-btn"
                onClick={() => setSelectedLog(null)}
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
