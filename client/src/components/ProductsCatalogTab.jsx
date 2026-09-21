import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Layers, Globe, Building2, Check, AlertCircle, PlusCircle, Edit3, X, Trash2, Plus, Save } from 'lucide-react';

export default function ProductsCatalogTab() {
  const { token, user, canEditScreen, setShowLoginModal } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchCode, setEditBranchCode] = useState(0);
  const [editRiskCalc, setEditRiskCalc] = useState(true);
  const [editCoverages, setEditCoverages] = useState([]);

  // New Coverage inputs in Edit modal
  const [newCovName, setNewCovName] = useState('');
  const [newCovCode, setNewCovCode] = useState('');

  // Create Product Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCountry, setNewProdCountry] = useState('BRA');
  const [newProdBranchCode, setNewProdBranchCode] = useState('231');
  const [newProdBranchName, setNewProdBranchName] = useState('AUTOMOVEL');
  const [newProdCompanyName, setNewProdCompanyName] = useState('MAPFRE SEGUROS GERAIS');
  const [newProdRiskCalc, setNewProdRiskCalc] = useState(true);
  const [newProdCoverages, setNewProdCoverages] = useState([
    { coverageCode: 204, coverageName: 'RCF - Danos Materiais' },
    { coverageCode: 119, coverageName: 'APO - Morte' }
  ]);

  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState('');

  const canEdit = canEditScreen('products');

  const fetchProducts = () => {
    setLoading(true);
    fetch('/api/dup/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const countries = ['ALL', ...new Set(products.map(p => p.countryCode).filter(Boolean))];

  // Open Edit Modal
  const handleOpenEdit = (p) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setEditingProduct(p);
    setEditName(p.productName || '');
    setEditCountry(p.countryCode || 'BRA');
    setEditBranchName(p.branchName || '');
    setEditBranchCode(p.branchCode || 0);
    setEditRiskCalc(p.riskPrimeCalc ?? true);
    setEditCoverages(Array.isArray(p.coverages) ? [...p.coverages] : []);
    setNewCovName('');
    setNewCovCode('');
    setProductError('');
  };

  // Add coverage in edit modal
  const handleAddCoverageToEdit = () => {
    if (!newCovName.trim()) return;
    const code = Number(newCovCode) || (editCoverages.length + 1) * 100;
    setEditCoverages([...editCoverages, { coverageCode: code, coverageName: newCovName.trim() }]);
    setNewCovName('');
    setNewCovCode('');
  };

  // Remove coverage in edit modal
  const handleRemoveCoverageFromEdit = (idx) => {
    setEditCoverages(editCoverages.filter((_, i) => i !== idx));
  };

  // Save edited product
  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    setProductError('');

    try {
      const res = await fetch(`/api/dup/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productName: editName,
          branchName: editBranchName,
          branchCode: editBranchCode,
          countryCode: editCountry,
          riskPrimeCalc: editRiskCalc,
          coverages: editCoverages
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar produto.');

      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      setProductError(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // Create new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCode) {
      setProductError('Nome e código do produto são obrigatórios.');
      return;
    }

    setSavingProduct(true);
    setProductError('');

    try {
      const res = await fetch('/api/dup/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          countryCode: newProdCountry,
          companyCode: 1,
          companyName: newProdCompanyName,
          branchCode: newProdBranchCode,
          branchName: newProdBranchName,
          productCode: newProdCode,
          productName: newProdName,
          riskPrimeCalc: newProdRiskCalc,
          coverages: newProdCoverages
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar produto.');

      setShowCreateModal(false);
      setNewProdName('');
      setNewProdCode('');
      fetchProducts();
    } catch (err) {
      setProductError(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCountry = selectedCountry === 'ALL' || p.countryCode === selectedCountry;
    const term = search.toLowerCase();
    const matchesSearch = !search ||
      (p.productName && p.productName.toLowerCase().includes(term)) ||
      (p.companyName && p.companyName.toLowerCase().includes(term)) ||
      (p.branchName && p.branchName.toLowerCase().includes(term)) ||
      String(p.productCode).includes(term);
    return matchesCountry && matchesSearch;
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Layers className="stat-icon blue" style={{ width: '32px', height: '32px', padding: '6px' }} />
            Catálogo de Produtos & Coberturas
          </h2>
          <p className="section-subtitle">
            Estrutura hierárquica de apólices, ramos de seguro e gestão de coberturas no módulo DUP
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-blue">{filteredProducts.length} Produtos Exibidos</span>
          {canEdit ? (
            <button
              className="pagination-btn btn-primary"
              onClick={() => {
                setProductError('');
                setShowCreateModal(true);
              }}
            >
              <PlusCircle size={15} /> + Novo Produto
            </button>
          ) : (
            <button
              className="pagination-btn"
              onClick={() => setShowLoginModal(true)}
              title="Faça login com permissão para cadastrar produtos"
            >
              <PlusCircle size={15} /> + Novo Produto
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar card" style={{ padding: '0.85rem 1.25rem' }}>
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por produto, ramo (ex: AUTOMOVEIS, VIDA), empresa ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={16} color="var(--text-muted)" />
          <select
            className="select-field"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            {countries.map(c => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'Todos os Países' : `País: ${c}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Carregando catálogo de produtos...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum produto encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((prod) => (
            <div key={prod._id} className="product-card">
              <div className="product-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="badge badge-emerald">{prod.countryCode}</span>
                    <span className="product-code">Ramo #{prod.branchCode} • Prod #{prod.productCode}</span>
                  </div>
                  <h3 className="product-title">{prod.productName || 'Produto sem nome'}</h3>
                </div>

                <button
                  className="pagination-btn"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                  onClick={() => handleOpenEdit(prod)}
                  title={canEdit ? 'Editar Produto e Coberturas' : 'Visualizar / Editar Produto'}
                >
                  <Edit3 size={12} /> {canEdit ? 'Editar' : 'Detalhes'}
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={13} />
                  <span>{prod.companyName}</span>
                </div>
                <div style={{ marginTop: '0.2rem' }}>
                  Ramo: <strong style={{ color: 'var(--text-secondary)' }}>{prod.branchName}</strong>
                </div>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Coberturas ({prod.coverages ? prod.coverages.length : 0})
                  </span>
                  {prod.riskPrimeCalc && (
                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                      <Check size={10} /> Risco Ativo
                    </span>
                  )}
                </div>
                <div className="coverages-list">
                  {prod.coverages && prod.coverages.length > 0 ? (
                    prod.coverages.map((cov, idx) => (
                      <span key={idx} className="badge badge-gray" title={`Código: ${cov.coverageCode}`}>
                        {cov.coverageName}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Sem coberturas associadas
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: EDITAR PRODUTO E COBERTURAS */}
      {editingProduct && (
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
          onClick={() => setEditingProduct(null)}
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
                <Edit3 size={18} color="var(--primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
                  Editar Produto & Coberturas
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {productError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {productError}
              </div>
            )}

            <form onSubmit={handleSaveEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Nome do Produto:
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>País</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value.toUpperCase())}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nome do Ramo</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editBranchName}
                    onChange={(e) => setEditBranchName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Código do Ramo</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editBranchCode}
                    onChange={(e) => setEditBranchCode(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editRiskCalc}
                    onChange={(e) => setEditRiskCalc(e.target.checked)}
                  />
                  <span>Cálculo de Prêmio de Risco Ativo (riskPrimeCalc)</span>
                </label>
              </div>

              {/* Coverages Manager */}
              <div style={{ background: '#070b14', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'block', marginBottom: '0.5rem' }}>
                  Gerenciar Coberturas ({editCoverages.length})
                </span>

                {/* Current Coverages Badges with Delete button */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  {editCoverages.map((cov, idx) => (
                    <span
                      key={idx}
                      className="badge badge-gray"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.65rem' }}
                    >
                      <span>{cov.coverageName} (#{cov.coverageCode})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoverageFromEdit(idx)}
                        style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Excluir cobertura"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add New Coverage Row */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ flex: 3, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="Nome da Nova Cobertura (ex: Danos Morais)"
                    value={newCovName}
                    onChange={(e) => setNewCovName(e.target.value)}
                  />
                  <input
                    type="number"
                    className="input-field"
                    style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8rem', minWidth: '80px' }}
                    placeholder="Cód."
                    value={newCovCode}
                    onChange={(e) => setNewCovCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="pagination-btn"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    onClick={handleAddCoverageToEdit}
                  >
                    <Plus size={14} /> Incluir
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="pagination-btn btn-primary"
                >
                  {savingProduct ? 'Salvando...' : 'Salvar Alterações com Auditoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO PRODUTO */}
      {showCreateModal && (
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
          onClick={() => setShowCreateModal(false)}
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
                <PlusCircle size={18} color="var(--primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
                  Cadastrar Novo Produto de Seguro
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {productError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {productError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Nome do Produto:
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: SEGURO AUTO ELETRICOS"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Código Produto:
                  </label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    placeholder="Ex: 23150"
                    value={newProdCode}
                    onChange={(e) => setNewProdCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>País</label>
                  <select
                    className="select-field"
                    value={newProdCountry}
                    onChange={(e) => setNewProdCountry(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="BRA">Brasil (BRA)</option>
                    <option value="ESP">Espanha (ESP)</option>
                    <option value="MEX">México (MEX)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Ramo (Nome)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: AUTOMOVEL"
                    value={newProdBranchName}
                    onChange={(e) => setNewProdBranchName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Ramo (Código)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Ex: 231"
                    value={newProdBranchCode}
                    onChange={(e) => setNewProdBranchCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Companhia Seguradora:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newProdCompanyName}
                  onChange={(e) => setNewProdCompanyName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="pagination-btn btn-primary"
                >
                  {savingProduct ? 'Cadastrando...' : 'Criar Produto com Auditoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
