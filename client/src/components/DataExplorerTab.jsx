import React, { useState, useEffect } from 'react';
import { Database, Search, ChevronLeft, ChevronRight, Copy, Check, Eye, EyeOff, Filter, X } from 'lucide-react';

export default function DataExplorerTab() {
  const [collectionsList, setCollectionsList] = useState({ dup: [], rte: [] });
  const [selectedDb, setSelectedDb] = useState('dup');
  const [selectedColl, setSelectedColl] = useState('PRODUCTS');
  
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('ALL');

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Load collections
  useEffect(() => {
    fetch('/api/explorer/collections')
      .then(res => res.json())
      .then(data => {
        setCollectionsList(data);
      })
      .catch(console.error);
  }, []);

  // Fetch fields whenever collection changes
  useEffect(() => {
    if (!selectedColl) return;
    fetch(`/api/explorer/fields/${selectedDb}/${selectedColl}`)
      .then(res => res.json())
      .then(data => {
        setFields(data.fields || []);
        setSelectedField('ALL');
      })
      .catch(console.error);
  }, [selectedDb, selectedColl]);

  // Fetch documents
  const fetchDocs = (db, coll, p = 1, s = '', f = 'ALL') => {
    if (!coll) return;
    setLoading(true);
    const url = `/api/explorer/data/${db}/${coll}?page=${p}&limit=12&search=${encodeURIComponent(s)}&field=${encodeURIComponent(f)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setDocuments(data.documents || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocs(selectedDb, selectedColl, page, search, selectedField);
  }, [selectedDb, selectedColl, page, selectedField]);

  const handleCollectionChange = (e) => {
    const [db, coll] = e.target.value.split(':');
    setSelectedDb(db);
    setSelectedColl(coll);
    setPage(1);
    setSearch('');
    setSelectedField('ALL');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocs(selectedDb, selectedColl, 1, search, selectedField);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    fetchDocs(selectedDb, selectedColl, 1, '', selectedField);
  };

  const copyToClipboard = (doc, id) => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Database className="stat-icon blue" style={{ width: '32px', height: '32px', padding: '6px' }} />
            Explorador Universal MongoDB
          </h2>
          <p className="section-subtitle">
            Navegue por todas as 51 coleções das bases DUP e RTE com busca inteligente, filtro por campos e inspeção BSON/JSON
          </p>
        </div>
        <span className="badge badge-blue">Total de Registros: {total.toLocaleString()}</span>
      </div>

      {/* Selector & Dynamic Search Bar */}
      <div className="filter-bar card" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', width: '100%' }}>
          {/* Collection Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Coleção:</span>
            <select
              className="select-field"
              value={`${selectedDb}:${selectedColl}`}
              onChange={handleCollectionChange}
              style={{ width: '100%', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
            >
              <optgroup label="Base DUP (acdc_dup_br-int)">
                {collectionsList.dup.map(c => (
                  <option key={`dup:${c.collection}`} value={`dup:${c.collection}`}>
                    DUP • {c.collection} ({c.count.toLocaleString()})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Base RTE (acdc_rte_br-int)">
                {collectionsList.rte.map(c => (
                  <option key={`rte:${c.collection}`} value={`rte:${c.collection}`}>
                    RTE • {c.collection} ({c.count.toLocaleString()})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Dynamic Field Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="select-field"
              value={selectedField}
              onChange={(e) => {
                setSelectedField(e.target.value);
                setPage(1);
              }}
              style={{ width: '100%', fontSize: '0.82rem' }}
            >
              <option value="ALL">🔍 Buscar em Todos os Campos</option>
              {fields.map(f => (
                <option key={f.key} value={f.key}>
                  Campo: {f.key} ({f.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-field"
              placeholder={
                selectedField !== 'ALL'
                  ? `Filtrar apenas no campo "${selectedField}"...`
                  : `Pesquisar em qualquer campo de ${selectedColl}...`
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="pagination-btn"
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0 1.25rem', fontWeight: 600 }}
          >
            Buscar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Consultando documentos em {selectedColl}...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum documento encontrado na coleção com os critérios informados.</p>
          {search && (
            <button
              className="pagination-btn"
              onClick={handleClearSearch}
              style={{ margin: '1rem auto 0' }}
            >
              Limpar Busca
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {documents.map((doc, idx) => {
            const docId = typeof doc._id === 'object' ? JSON.stringify(doc._id) : String(doc._id);
            const isExpanded = expandedId === idx;

            return (
              <div key={idx} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-gray">Doc #{idx + 1 + (page - 1) * 12}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#60a5fa' }}>
                      _id: {docId}
                    </span>
                    {doc._class && (
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {doc._class.split('.').pop()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="pagination-btn"
                      style={{ padding: '0.3rem 0.65rem' }}
                      onClick={() => copyToClipboard(doc, idx)}
                    >
                      {copiedId === idx ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                      {copiedId === idx ? 'Copiado!' : 'Copiar JSON'}
                    </button>
                    <button
                      className="pagination-btn"
                      style={{ padding: '0.3rem 0.65rem' }}
                      onClick={() => setExpandedId(isExpanded ? null : idx)}
                    >
                      {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                      {isExpanded ? 'Ocultar' : 'Ver JSON'}
                    </button>
                  </div>
                </div>

                {/* Preview summary chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.5rem 0' }}>
                  {Object.entries(doc)
                    .filter(([k]) => k !== '_id' && k !== '_class' && typeof doc[k] !== 'object')
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <span key={k} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                        <strong style={{ color: 'var(--text-main)' }}>{String(v)}</strong>
                      </span>
                    ))}
                </div>

                {/* Expanded Raw JSON View */}
                {isExpanded && (
                  <div style={{ marginTop: '1rem' }}>
                    <pre className="json-viewer">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          <div className="pagination">
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Página {page} de {totalPages} ({total.toLocaleString()} documentos)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
