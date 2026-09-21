import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calculator, Search, FileCode2, BookOpen, Percent, Edit3, Bot, 
  CheckCircle2, AlertTriangle, XCircle, Save, X, Sparkles, 
  GripVertical, Copy, Check, Info, Layers, Plus, CornerDownLeft, Database,
  Code, Sliders
} from 'lucide-react';

export default function RatingEngineTab() {
  const { token, user, canEditScreen, setShowLoginModal } = useAuth();
  const [subTab, setSubTab] = useState('formulas');
  
  // Formulas state
  const [formulas, setFormulas] = useState([]);
  const [loadingFormulas, setLoadingFormulas] = useState(false);
  const [formulaSearch, setFormulaSearch] = useState('');

  // Concepts state
  const [conceptsData, setConceptsData] = useState(null);
  const [loadingConcepts, setLoadingConcepts] = useState(false);

  // Technical basis state
  const [techBasisData, setTechBasisData] = useState(null);
  const [loadingTechBasis, setLoadingTechBasis] = useState(false);

  // Dictionary state (Variables, Constants, Functions catalog)
  const [dictionary, setDictionary] = useState({ constants: [], variables: [], functions: [], operators: [] });
  const [loadingDictionary, setLoadingDictionary] = useState(false);
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [dictSearch, setDictSearch] = useState('');
  const [dictCategory, setDictCategory] = useState('all');
  const [dictCopiedId, setDictCopiedId] = useState(null);

  // Edit Formula Modal & Drag-and-Drop Builder State
  const [editingFormula, setEditingFormula] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editExpression, setEditExpression] = useState('');
  const [selectedAiModel, setSelectedAiModel] = useState('gpt-5.6-terra-high');
  const [aiValidation, setAiValidation] = useState(null);
  const [validatingAi, setValidatingAi] = useState(false);
  const [savingFormula, setSavingFormula] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Builder toolbox inside Edit Modal
  const [builderSearch, setBuilderSearch] = useState('');
  const [builderCategory, setBuilderCategory] = useState('all');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const textareaRef = useRef(null);

  // Visual Mathematical Segments Builder State (Operators are purely text, Functions are container objects)
  const [formulaSegments, setFormulaSegments] = useState([]);
  const [editorViewMode, setEditorViewMode] = useState('visual'); // 'visual' | 'code'
  const [draggedSegmentIdx, setDraggedSegmentIdx] = useState(null);
  const [dragOverSegmentIdx, setDragOverSegmentIdx] = useState(null);
  const [dragOverFunctionId, setDragOverFunctionId] = useState(null);
  const [copiedFormulaExpr, setCopiedFormulaExpr] = useState(false);

  const canEdit = canEditScreen('rating');

  const fetchFormulas = () => {
    setLoadingFormulas(true);
    fetch('/api/rte/formulas')
      .then(res => res.json())
      .then(data => {
        setFormulas(data || []);
        setLoadingFormulas(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingFormulas(false);
      });
  };

  const fetchDictionary = () => {
    setLoadingDictionary(true);
    fetch('/api/rte/dictionary')
      .then(res => res.json())
      .then(data => {
        setDictionary(data);
        setLoadingDictionary(false);
      })
      .catch(err => {
        console.error('Error loading dictionary:', err);
        setLoadingDictionary(false);
      });
  };

  useEffect(() => {
    fetchDictionary();
  }, []);

  // Parse raw formula string into pure mathematical text segments & container objects
  const parseFormulaSegments = (str) => {
    if (!str) return [];

    const regex = /(MMATH\.f_cte\s*\(\s*'([^']+)'\s*\)|MATH\.f_cte\s*\(\s*'([^']+)'\s*\)|TO_NUMBER\s*\(\s*(\[[^\]]+\]|[^)]*)\s*\)|MMATH\.[a-zA-Z_0-9]+\s*\([^)]*\)|MATH\.[a-zA-Z_0-9]+\s*\([^)]*\)|\[[A-Za-z0-9_]+\])/g;

    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = str.substring(lastIndex, match.index);
        if (textBefore) {
          segments.push({
            id: 'seg_' + Math.random().toString(36).substr(2, 7),
            kind: 'text',
            value: textBefore
          });
        }
      }

      const fullMatch = match[0];
      const constArg = match[2] || match[3];
      const toNumberArg = match[4];

      if (fullMatch.startsWith('[') && fullMatch.endsWith(']')) {
        segments.push({
          id: 'seg_' + Math.random().toString(36).substr(2, 7),
          kind: 'object',
          objType: 'variable',
          name: fullMatch,
          raw: fullMatch
        });
      } else if (constArg !== undefined) {
        const foundConst = dictionary.constants?.find(c => c.name === constArg);
        segments.push({
          id: 'seg_' + Math.random().toString(36).substr(2, 7),
          kind: 'object',
          objType: 'function',
          funcName: 'MMATH.f_cte',
          innerItem: {
            type: 'constant',
            name: constArg,
            value: foundConst?.value || null,
            raw: constArg
          }
        });
      } else if (fullMatch.startsWith('TO_NUMBER')) {
        const cleanArg = (toNumberArg || '').trim();
        segments.push({
          id: 'seg_' + Math.random().toString(36).substr(2, 7),
          kind: 'object',
          objType: 'function',
          funcName: 'TO_NUMBER',
          innerItem: cleanArg ? {
            type: cleanArg.startsWith('[') ? 'variable' : 'custom',
            name: cleanArg,
            raw: cleanArg
          } : null
        });
      } else if (fullMatch.startsWith('MMATH.') || fullMatch.startsWith('MATH.')) {
        const fNameMatch = fullMatch.match(/^([A-Z_a-z0-9.]+)\s*\((.*)\)$/);
        const funcName = fNameMatch ? fNameMatch[1] : fullMatch;
        const innerArg = fNameMatch ? fNameMatch[2].trim() : '';
        segments.push({
          id: 'seg_' + Math.random().toString(36).substr(2, 7),
          kind: 'object',
          objType: 'function',
          funcName,
          innerItem: innerArg ? { type: 'custom', name: innerArg, raw: innerArg } : null
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      const textAfter = str.substring(lastIndex);
      if (textAfter) {
        segments.push({
          id: 'seg_' + Math.random().toString(36).substr(2, 7),
          kind: 'text',
          value: textAfter
        });
      }
    }

    return segments;
  };

  // Convert array of segments back to raw formula expression
  const serializeSegments = (segments) => {
    if (!segments || segments.length === 0) return '';
    return segments.map(s => {
      if (s.kind === 'text') return s.value;
      if (s.kind === 'object') {
        if (s.objType === 'variable') {
          return s.name.startsWith('[') && s.name.endsWith(']') ? s.name : `[${s.name}]`;
        }
        if (s.objType === 'constant') {
          return `MMATH.f_cte('${s.name}')`;
        }
        if (s.objType === 'function') {
          const fn = s.funcName || 'MMATH.f_cte';
          const inner = s.innerItem;
          if (fn === 'MMATH.f_cte' || fn === 'MATH.f_cte') {
            const cName = inner?.name ? inner.name.replace(/^'|'$/g, '').replace(/[\[\]]/g, '') : '';
            return `${fn}('${cName}')`;
          }
          if (fn === 'TO_NUMBER') {
            return `TO_NUMBER(${inner?.name || ''})`;
          }
          return `${fn}(${inner?.name || ''})`;
        }
      }
      return '';
    }).join('');
  };

  // Update inline text for a text segment
  const updateTextSegment = (segId, newVal) => {
    const updated = formulaSegments.map(s => s.id === segId ? { ...s, value: newVal } : s);
    setFormulaSegments(updated);
    setEditExpression(serializeSegments(updated));
    setAiValidation(null);
  };

  // Remove a segment
  const removeSegment = (segId) => {
    const updated = formulaSegments.filter(s => s.id !== segId);
    setFormulaSegments(updated);
    setEditExpression(serializeSegments(updated));
    setAiValidation(null);
  };

  // Clear inner child item of a function container
  const clearFunctionInnerItem = (segId) => {
    const updated = formulaSegments.map(s => {
      if (s.id === segId) {
        return { ...s, innerItem: null };
      }
      return s;
    });
    setFormulaSegments(updated);
    setEditExpression(serializeSegments(updated));
    setAiValidation(null);
  };

  // Add a segment (or fill an empty function slot) from a toolbox click
  const addSegmentFromItem = (item) => {
    let updated = [...formulaSegments];
    const newId = 'seg_' + Math.random().toString(36).substr(2, 7);

    // If an operator was selected, it is strictly textual
    if (item.type === 'operator') {
      const opText = item.insertText;
      if (updated.length > 0 && updated[updated.length - 1].kind === 'text') {
        updated[updated.length - 1].value += opText;
      } else {
        updated.push({ id: newId, kind: 'text', value: opText });
      }
      setFormulaSegments(updated);
      setEditExpression(serializeSegments(updated));
      setAiValidation(null);
      return;
    }

    // Check if there is an empty function container waiting for an inner item!
    const emptyFuncIdx = updated.findIndex(s => s.kind === 'object' && s.objType === 'function' && !s.innerItem);
    if (emptyFuncIdx !== -1 && (item.type === 'constant' || item.type === 'variable')) {
      const cleanName = item.type === 'constant'
        ? item.name.replace(/^MMATH\.f_cte\('?|MATH\.f_cte\('?|'\)$/g, '')
        : item.name;
      updated[emptyFuncIdx] = {
        ...updated[emptyFuncIdx],
        innerItem: {
          type: item.type,
          name: cleanName,
          value: item.value || null,
          raw: cleanName
        }
      };
      setFormulaSegments(updated);
      setEditExpression(serializeSegments(updated));
      setAiValidation(null);
      return;
    }

    if (item.type === 'variable') {
      if (updated.length > 0 && updated[updated.length - 1].kind === 'object') {
        updated.push({ id: 'seg_' + Math.random().toString(36).substr(2, 7), kind: 'text', value: ' * ' });
      }
      const varName = item.name.startsWith('[') ? item.name : `[${item.name}]`;
      updated.push({
        id: newId,
        kind: 'object',
        objType: 'variable',
        name: varName,
        raw: varName
      });
    } else if (item.type === 'constant') {
      if (updated.length > 0 && updated[updated.length - 1].kind === 'object') {
        updated.push({ id: 'seg_' + Math.random().toString(36).substr(2, 7), kind: 'text', value: ' * ' });
      }
      const constName = item.name.replace(/^MMATH\.f_cte\('?|MATH\.f_cte\('?|'\)$/g, '');
      updated.push({
        id: newId,
        kind: 'object',
        objType: 'function',
        funcName: 'MMATH.f_cte',
        innerItem: {
          type: 'constant',
          name: constName,
          value: item.value || null,
          raw: constName
        }
      });
    } else if (item.type === 'function') {
      if (updated.length > 0 && updated[updated.length - 1].kind === 'object') {
        updated.push({ id: 'seg_' + Math.random().toString(36).substr(2, 7), kind: 'text', value: ' + ' });
      }
      updated.push({
        id: newId,
        kind: 'object',
        objType: 'function',
        funcName: item.name || 'MMATH.f_cte',
        innerItem: null
      });
    } else {
      updated.push({ id: newId, kind: 'text', value: item.insertText || item.name });
    }

    setFormulaSegments(updated);
    setEditExpression(serializeSegments(updated));
    setAiValidation(null);
  };

  // Drag start for a variable chip inside the canvas
  const handleVarDragStart = (e, segId, varName, segIdx) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/internal-var-id', segId);
    e.dataTransfer.setData('text/internal-segment-idx', String(segIdx));
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'variable', name: varName }));
    e.dataTransfer.setData('text/plain', varName);
    e.dataTransfer.effectAllowed = 'copyMove';
    setDraggedSegmentIdx(segIdx);
  };

  // Drag start for whole segment reordering
  const handleSegmentDragStart = (e, index) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/internal-segment-idx', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSegmentIdx(index);
  };

  const handleSegmentDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSegmentIdx(index);
  };

  const handleSegmentDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSegmentIdx(null);
    setDraggedSegmentIdx(null);
    setIsDraggingOver(false);

    const internalIdxStr = e.dataTransfer.getData('text/internal-segment-idx');
    if (internalIdxStr !== '' && internalIdxStr !== null) {
      const sourceIndex = parseInt(internalIdxStr, 10);
      if (sourceIndex === targetIndex) return;

      const updated = [...formulaSegments];
      const [moved] = updated.splice(sourceIndex, 1);
      const insertAt = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
      updated.splice(insertAt, 0, moved);

      setFormulaSegments(updated);
      setEditExpression(serializeSegments(updated));
      setAiValidation(null);
      return;
    }
  };

  // Drop directly onto a Function Container Object
  const handleFunctionDragOver = (e, funcSegId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverFunctionId(funcSegId);
  };

  const handleFunctionDragLeave = (funcSegId) => {
    if (dragOverFunctionId === funcSegId) {
      setDragOverFunctionId(null);
    }
  };

  const handleFunctionDrop = (e, funcSegId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFunctionId(null);
    setIsDraggingOver(false);
    setDraggedSegmentIdx(null);
    setDragOverSegmentIdx(null);

    // 1. If an internal variable from the canvas was dragged into this function
    const internalVarId = e.dataTransfer.getData('text/internal-var-id');
    if (internalVarId) {
      const sourceVar = formulaSegments.find(s => s.id === internalVarId);
      if (sourceVar && sourceVar.objType === 'variable') {
        const updated = formulaSegments
          .filter(s => s.id !== internalVarId)
          .map(s => {
            if (s.id === funcSegId) {
              return {
                ...s,
                innerItem: {
                  type: 'variable',
                  name: sourceVar.name,
                  raw: sourceVar.name
                }
              };
            }
            return s;
          });
        setFormulaSegments(updated);
        setEditExpression(serializeSegments(updated));
        setAiValidation(null);
        return;
      }
    }

    // 2. If dragged from right toolbox
    const itemDataStr = e.dataTransfer.getData('application/json');
    if (itemDataStr) {
      try {
        const item = JSON.parse(itemDataStr);
        let targetType = item.type === 'variable' ? 'variable' : 'constant';
        let targetName = item.name;

        if (targetType === 'constant' && item.name) {
          targetName = item.name.replace(/^MMATH\.f_cte\('?|MATH\.f_cte\('?|'\)$/g, '');
        }

        const updated = formulaSegments.map(s => {
          if (s.id === funcSegId) {
            return {
              ...s,
              innerItem: {
                type: targetType,
                name: targetName,
                value: item.value || null,
                raw: targetName
              }
            };
          }
          return s;
        });

        setFormulaSegments(updated);
        setEditExpression(serializeSegments(updated));
        setAiValidation(null);
        return;
      } catch (err) {}
    }

    // 3. Fallback text
    const plainText = e.dataTransfer.getData('text/plain');
    if (plainText) {
      const isVar = plainText.startsWith('[') && plainText.endsWith(']');
      const updated = formulaSegments.map(s => {
        if (s.id === funcSegId) {
          return {
            ...s,
            innerItem: {
              type: isVar ? 'variable' : 'constant',
              name: plainText,
              raw: plainText
            }
          };
        }
        return s;
      });
      setFormulaSegments(updated);
      setEditExpression(serializeSegments(updated));
      setAiValidation(null);
    }
  };

  // External Drag Start from Toolbox
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.insertText || item.name);
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  // Drop on the main canvas dropzone
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setDragOverSegmentIdx(null);
    setDraggedSegmentIdx(null);
    setDragOverFunctionId(null);

    const internalIdxStr = e.dataTransfer.getData('text/internal-segment-idx');
    if (internalIdxStr !== '' && internalIdxStr !== null) {
      const sourceIndex = parseInt(internalIdxStr, 10);
      const updated = [...formulaSegments];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.push(moved);
      setFormulaSegments(updated);
      setEditExpression(serializeSegments(updated));
      setAiValidation(null);
      return;
    }

    const itemDataStr = e.dataTransfer.getData('application/json');
    if (itemDataStr) {
      try {
        const item = JSON.parse(itemDataStr);
        addSegmentFromItem(item);
        return;
      } catch (err) {}
    }

    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const found = allCatalogItems.find(it => it.insertText === text || it.name === text);
      if (found) {
        addSegmentFromItem(found);
      } else {
        addSegmentFromItem({ insertText: text, name: text, type: 'custom' });
      }
    }
  };

  const insertAtCursor = (text) => {
    const found = allCatalogItems.find(it => it.insertText === text || it.name === text);
    if (found) {
      addSegmentFromItem(found);
    } else {
      addSegmentFromItem({ insertText: text, name: text, type: 'custom' });
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setDictCopiedId(id);
    setTimeout(() => setDictCopiedId(null), 1800);
  };

  useEffect(() => {
    if (subTab === 'formulas') {
      fetchFormulas();
    } else if (subTab === 'concepts' && !conceptsData) {
      setLoadingConcepts(true);
      fetch('/api/rte/concepts')
        .then(res => res.json())
        .then(data => {
          setConceptsData(data);
          setLoadingConcepts(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingConcepts(false);
        });
    } else if (subTab === 'technical-basis' && !techBasisData) {
      setLoadingTechBasis(true);
      fetch('/api/rte/technical-basis')
        .then(res => res.json())
        .then(data => {
          setTechBasisData(data);
          setLoadingTechBasis(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingTechBasis(false);
        });
    }
  }, [subTab]);

  const handleOpenEdit = (f) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setEditingFormula(f);
    setEditTitle(f.fomNam || '');
    const expr = f.details?.[0]?.fomValVal || '';
    setEditExpression(expr);
    setFormulaSegments(parseFormulaSegments(expr));
    setEditorViewMode('visual');
    setAiValidation(null);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
    setBuilderSearch('');
    setBuilderCategory('all');
    setCopiedFormulaExpr(false);
  };

  const handleValidateWithAi = async () => {
    if (!editExpression.trim()) return;
    setValidatingAi(true);
    setAiValidation(null);
    setSaveErrorMsg('');

    try {
      const res = await fetch('/api/rte/validate-formula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formulaExpression: editExpression,
          model: selectedAiModel
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na validação por IA.');
      setAiValidation(data);
    } catch (err) {
      setSaveErrorMsg(err.message);
    } finally {
      setValidatingAi(false);
    }
  };

  const handleSaveFormula = async () => {
    if (!editingFormula) return;
    setSavingFormula(true);
    setSaveErrorMsg('');
    setSaveSuccessMsg('');

    try {
      // 1. Sempre executa a validação por IA / motor sintático antes de salvar
      setValidatingAi(true);
      const valRes = await fetch('/api/rte/validate-formula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formulaExpression: editExpression,
          model: selectedAiModel
        })
      });
      const valData = await valRes.json();
      setAiValidation(valData);
      setValidatingAi(false);

      // 2. Se a validação rejeitar, BLOQUEIA o salvamento e exibe o motivo
      if (!valRes.ok || !valData.valid || valData.status === 'REJECTED') {
        const reason = valData.message || 'A fórmula possui inconsistências sintáticas ou matemáticas.';
        setSaveErrorMsg(`Salvamento Bloqueado: A fórmula foi REJEITADA na validação de integridade. ${reason}`);
        setSavingFormula(false);
        return;
      }

      // 3. Se aprovada (ou com warning), prossegue com o salvamento
      const formulaId = editingFormula._id?.$oid || editingFormula._id;
      const res = await fetch(`/api/rte/formulas/${formulaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          expression: editExpression,
          aiValidation: valData
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar fórmula.');

      setSaveSuccessMsg('Fórmula validada e salva com sucesso com registro na trilha de auditoria PECA!');
      fetchFormulas();
      setTimeout(() => {
        setEditingFormula(null);
      }, 1400);
    } catch (err) {
      setSaveErrorMsg(err.message);
    } finally {
      setSavingFormula(false);
      setValidatingAi(false);
    }
  };

  // Combine all items for the builder & dictionary
  const allCatalogItems = [
    ...(dictionary.constants || []),
    ...(dictionary.variables || []),
    ...(dictionary.functions || []),
    ...(dictionary.operators || [])
  ];

  // Filtered items for Edit Builder Toolbox
  const filteredBuilderItems = allCatalogItems.filter(item => {
    const matchesCategory =
      builderCategory === 'all' ||
      (builderCategory === 'constants' && item.type === 'constant') ||
      (builderCategory === 'variables' && item.type === 'variable') ||
      (builderCategory === 'functions' && item.type === 'function') ||
      (builderCategory === 'operators' && item.type === 'operator');

    const term = builderSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      item.name.toLowerCase().includes(term) ||
      item.insertText.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.value && String(item.value).toLowerCase().includes(term));

    return matchesCategory && matchesSearch;
  });

  // Filtered items for Full Dictionary Modal
  const filteredDictItems = allCatalogItems.filter(item => {
    const matchesCategory =
      dictCategory === 'all' ||
      (dictCategory === 'constants' && item.type === 'constant') ||
      (dictCategory === 'variables' && item.type === 'variable') ||
      (dictCategory === 'functions' && item.type === 'function') ||
      (dictCategory === 'operators' && item.type === 'operator');

    const term = dictSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      item.name.toLowerCase().includes(term) ||
      item.insertText.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.value && String(item.value).toLowerCase().includes(term));

    return matchesCategory && matchesSearch;
  });

  const filteredFormulas = formulas.filter(f => {
    const term = formulaSearch.toLowerCase();
    return !formulaSearch ||
      (f.fomVal && f.fomVal.toLowerCase().includes(term)) ||
      (f.fomNam && f.fomNam.toLowerCase().includes(term)) ||
      (f.details && f.details.some(d => d.fomValVal && d.fomValVal.toLowerCase().includes(term)));
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Calculator className="stat-icon cyan" style={{ width: '32px', height: '32px', padding: '6px' }} />
            Motor de Tarifação (RTE - Tronador)
          </h2>
          <p className="section-subtitle">
            Definições atuariais, fórmulas matemáticas de cálculo de prêmios, bases técnicas e validação lógica por IA
          </p>
        </div>

        {/* Sub-tab Pills & Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`pagination-btn ${subTab === 'formulas' ? 'active' : ''}`}
            style={subTab === 'formulas' ? { background: 'rgba(6, 182, 212, 0.25)', borderColor: 'var(--accent-cyan)' } : {}}
            onClick={() => setSubTab('formulas')}
          >
            <FileCode2 size={14} /> Fórmulas ({formulas.length > 0 ? formulas.length : '203'})
          </button>
          <button
            className={`pagination-btn ${subTab === 'concepts' ? 'active' : ''}`}
            style={subTab === 'concepts' ? { background: 'rgba(6, 182, 212, 0.25)', borderColor: 'var(--accent-cyan)' } : {}}
            onClick={() => setSubTab('concepts')}
          >
            <Percent size={14} /> Conceitos Econômicos
          </button>
          <button
            className={`pagination-btn ${subTab === 'technical-basis' ? 'active' : ''}`}
            style={subTab === 'technical-basis' ? { background: 'rgba(6, 182, 212, 0.25)', borderColor: 'var(--accent-cyan)' } : {}}
            onClick={() => setSubTab('technical-basis')}
          >
            <BookOpen size={14} /> Bases Técnicas
          </button>

          <button
            className="pagination-btn"
            style={{
              background: 'rgba(0, 102, 255, 0.15)',
              borderColor: 'var(--primary)',
              color: '#60a5fa',
              marginLeft: '0.25rem'
            }}
            onClick={() => {
              setDictSearch('');
              setDictCategory('all');
              setShowDictionaryModal(true);
            }}
          >
            <BookOpen size={14} /> Dicionário Atuarial & Funções ({allCatalogItems.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: FORMULAS */}
      {subTab === 'formulas' && (
        <div>
          <div className="filter-bar card" style={{ padding: '0.85rem 1.25rem' }}>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Buscar por código de fórmula, nome ou variáveis matemáticas (ex: GASTOS_DIRECTOS, KM_VEHICULO)..."
                value={formulaSearch}
                onChange={(e) => setFormulaSearch(e.target.value)}
              />
            </div>
            <span className="badge badge-cyan">{filteredFormulas.length} Fórmulas</span>
          </div>

          {loadingFormulas ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Carregando fórmulas atuariais...</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '1.25rem' }}>
              {filteredFormulas.map((f, idx) => (
                <div key={idx} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span className="badge badge-cyan">{f.cnyVal || 'GLOBAL'}</span>
                        <span className="badge badge-gray">Cia #{f.cmpVal}</span>
                        <span className="badge badge-purple">{f.fomVal}</span>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600 }}>
                        {f.fomNam}
                      </h4>
                    </div>

                    <button
                      className="pagination-btn"
                      onClick={() => handleOpenEdit(f)}
                      style={{
                        background: canEdit ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: canEdit ? 'var(--primary)' : 'var(--border)',
                        color: canEdit ? '#93c5fd' : 'var(--text-muted)',
                        padding: '0.35rem 0.75rem'
                      }}
                      title={canEdit ? 'Editar Título e Expressão com Validação IA' : 'Apenas leitura (Requer login com permissão de edição)'}
                    >
                      <Edit3 size={14} /> {canEdit ? 'Editar' : 'Ver Detalhes'}
                    </button>
                  </div>

                  {/* Mathematical Expression Box */}
                  <div style={{ margin: '0.75rem 0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                      Expressão de Cálculo:
                    </div>
                    {f.details && f.details.length > 0 ? (
                      f.details.map((d, didx) => (
                        <div key={didx} className="formula-box">
                          {d.fomValVal}
                        </div>
                      ))
                    ) : (
                      <div className="formula-box" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Fórmula sem expressão detalhada
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Origem: {f.brgKeyFomVal || 'N/A'}</span>
                    <span>Mod: {f.molVal || 'EM'} • Ins: {f.insVal || 'TRN'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ECONOMIC CONCEPTS */}
      {subTab === 'concepts' && (
        <div>
          {loadingConcepts ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Carregando conceitos econômicos...</span>
            </div>
          ) : conceptsData && (
            <div>
              <div className="card" style={{ padding: '0' }}>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Conceito Econômico</th>
                        <th>País</th>
                        <th>Tipo</th>
                        <th>Calcula Juros?</th>
                        <th>Parcelamento / Cuotas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conceptsData.economic.map((ec, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            #{ec.code}
                          </td>
                          <td style={{ fontWeight: 600 }}>{ec.name}</td>
                          <td><span className="badge badge-emerald">{ec.country}</span></td>
                          <td><span className="badge badge-purple">Tipo {ec.type}</span></td>
                          <td>
                            <span className={`badge ${ec.calculatesInterest ? 'badge-amber' : 'badge-gray'}`}>
                              {ec.calculatesInterest ? 'Sim' : 'Não'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${ec.distributedCuotes ? 'badge-blue' : 'badge-gray'}`}>
                              {ec.distributedCuotes ? 'Distribuído' : 'Único'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: TECHNICAL BASIS */}
      {subTab === 'technical-basis' && (
        <div>
          {loadingTechBasis ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Carregando bases técnicas...</span>
            </div>
          ) : techBasisData && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                {techBasisData.basis.map((tb, idx) => (
                  <div key={idx} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="badge badge-purple">Código #{tb.codBt}</span>
                      <span className="badge badge-emerald">{tb.lngVal || 'ES'}</span>
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {tb.namBt}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div>Companhia: <strong>#{tb.cmpVal}</strong></div>
                      <div>Ramo LOB: <strong>#{tb.lobVal}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT FORMULA MODAL WITH DRAG & DROP TOOLBOX */}
      {editingFormula && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setEditingFormula(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '1280px',
              background: '#0c1220',
              border: '1px solid var(--border-card)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 102, 255, 0.25)',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="stat-icon cyan" style={{ width: '36px', height: '36px' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
                    Editar Cálculo Atuarial
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Código da Fórmula: <strong>{editingFormula.fomVal}</strong> • Cia #{editingFormula.cmpVal} • País: {editingFormula.cnyVal || 'GLOBAL'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="pagination-btn"
                  style={{ background: 'rgba(0, 102, 255, 0.15)', borderColor: 'var(--primary)', color: '#60a5fa', fontSize: '0.78rem' }}
                  onClick={() => setShowDictionaryModal(true)}
                >
                  <BookOpen size={14} /> Ver Dicionário Completo
                </button>
                <button
                  onClick={() => setEditingFormula(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Success message */}
            {saveSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Error message */}
            {saveErrorMsg && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={16} />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            {/* Two-Column Grid: Left (Editor), Right (Draggable Objects & Search) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.35fr) minmax(350px, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
              
              {/* LEFT COLUMN: FORMULA DETAILS & DROPZONE */}
              <div>
                {/* Title field */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Título / Nome da Fórmula:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Nome descritivo da fórmula..."
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                {/* Expression field with Visual Object Canvas & Code Mode Toggle */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Expressão Matemática de Cálculo:
                      </label>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 102, 255, 0.15)', color: '#60a5fa', fontWeight: 600 }}>
                        {formulaSegments.filter(s => s.kind === 'object').length} {formulaSegments.filter(s => s.kind === 'object').length === 1 ? 'objeto' : 'objetos'}
                      </span>
                    </div>

                    {/* View Mode Switcher */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#0c1220', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                      <button
                        type="button"
                        onClick={() => setEditorViewMode('visual')}
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: editorViewMode === 'visual' ? '#0066FF' : 'transparent',
                          color: editorViewMode === 'visual' ? '#FFFFFF' : 'var(--text-muted)'
                        }}
                      >
                        🧩 Construtor Visual de Objetos
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorViewMode('code')}
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: editorViewMode === 'code' ? '#0066FF' : 'transparent',
                          color: editorViewMode === 'code' ? '#FFFFFF' : 'var(--text-muted)'
                        }}
                      >
                        📝 Modo Texto Livre
                      </button>
                    </div>
                  </div>

                  {/* VISUAL MODE: Interactive Objects Canvas with Drag-and-Drop */}
                  {editorViewMode === 'visual' ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        position: 'relative',
                        minHeight: '140px',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        borderRadius: 'var(--radius-sm)',
                        border: isDraggingOver ? '2px dashed #0066FF' : '1px solid var(--border-card)',
                        background: isDraggingOver ? 'rgba(0, 102, 255, 0.08)' : '#070b14',
                        padding: '0.75rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignContent: 'flex-start',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isDraggingOver ? '0 0 20px rgba(0, 102, 255, 0.4)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {formulaSegments.length === 0 ? (
                        <div style={{ width: '100%', textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          <Layers size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block', color: 'var(--primary)' }} />
                          <span>Arraste variáveis ou funções da coluna à direita. Operadores são puramente textuais e funções recebem variáveis ou constantes em seu interior!</span>
                        </div>
                      ) : (
                        formulaSegments.map((seg, idx) => {
                          // 1. PURE TEXT OPERATOR SEGMENT: No chip, no grip, strictly math text with inline edit
                          if (seg.kind === 'text') {
                            return (
                              <span
                                key={seg.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  margin: '0 1px'
                                }}
                              >
                                <input
                                  type="text"
                                  value={seg.value}
                                  onChange={(e) => updateTextSegment(seg.id, e.target.value)}
                                  title="Operador matemático textual (editável diretamente)"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px dashed rgba(255, 255, 255, 0.35)',
                                    color: '#f1f5f9',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    width: `${Math.max(seg.value.length * 15 + 28, 42)}px`,
                                    padding: '2px 6px',
                                    textAlign: 'center',
                                    outline: 'none',
                                    boxSizing: 'content-box',
                                    letterSpacing: '0.8px',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderBottom = '1px solid var(--accent-cyan)';
                                    e.target.style.color = '#38bdf8';
                                    e.target.style.background = 'rgba(6, 182, 212, 0.08)';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderBottom = '1px dashed rgba(255, 255, 255, 0.25)';
                                    e.target.style.color = '#f1f5f9';
                                    e.target.style.background = 'transparent';
                                  }}
                                />
                              </span>
                            );
                          }

                          // 2. VARIABLE OBJECT CHIP (Purple)
                          if (seg.kind === 'object' && seg.objType === 'variable') {
                            const isBeingDragged = draggedSegmentIdx === idx;
                            const isTargetedOver = dragOverSegmentIdx === idx;

                            return (
                              <div
                                key={seg.id}
                                draggable={true}
                                onDragStart={(e) => handleVarDragStart(e, seg.id, seg.name, idx)}
                                onDragOver={(e) => handleSegmentDragOver(e, idx)}
                                onDrop={(e) => handleSegmentDrop(e, idx)}
                                title={`Objeto Variável: ${seg.name} (Arraste para reordenar ou para dentro de uma Função)`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '0.28rem 0.6rem',
                                  background: 'rgba(192, 132, 252, 0.14)',
                                  border: `1px solid ${isTargetedOver ? '#0066FF' : 'rgba(192, 132, 252, 0.45)'}`,
                                  borderRadius: '6px',
                                  color: '#c084fc',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  cursor: 'grab',
                                  opacity: isBeingDragged ? 0.35 : 1,
                                  transform: isTargetedOver ? 'scale(1.05)' : 'scale(1)',
                                  boxShadow: isTargetedOver ? '0 0 12px rgba(0, 102, 255, 0.6)' : '0 2px 4px rgba(0,0,0,0.2)',
                                  transition: 'all 0.12s ease',
                                  userSelect: 'none'
                                }}
                              >
                                <GripVertical size={11} style={{ opacity: 0.6, cursor: 'grab', flexShrink: 0 }} />
                                <span style={{
                                  fontSize: '0.62rem',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  background: 'rgba(0,0,0,0.3)',
                                  color: '#c084fc',
                                  letterSpacing: '0.3px',
                                  textTransform: 'uppercase'
                                }}>
                                  VAR
                                </span>
                                <span>{seg.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSegment(seg.id);
                                  }}
                                  title="Remover variável"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#c084fc',
                                    opacity: 0.7,
                                    cursor: 'pointer',
                                    padding: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginLeft: '2px'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = '#c084fc'; }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          }

                          // 3. FUNCTION CONTAINER OBJECT (Emerald): Receives variables or constants inside it!
                          if (seg.kind === 'object' && seg.objType === 'function') {
                            const isFuncDropTarget = dragOverFunctionId === seg.id;
                            const isBeingDragged = draggedSegmentIdx === idx;
                            const isTargetedOver = dragOverSegmentIdx === idx;

                            return (
                              <div
                                key={seg.id}
                                draggable={true}
                                onDragStart={(e) => handleSegmentDragStart(e, idx)}
                                onDragOver={(e) => handleFunctionDragOver(e, seg.id)}
                                onDragLeave={() => handleFunctionDragLeave(seg.id)}
                                onDrop={(e) => handleFunctionDrop(e, seg.id)}
                                title={`Objeto Função: ${seg.funcName} (Arraste uma variável ou constante para dentro)`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '0.3rem 0.65rem',
                                  background: isFuncDropTarget ? 'rgba(52, 211, 153, 0.25)' : 'rgba(52, 211, 153, 0.12)',
                                  border: `1.5px ${isFuncDropTarget ? 'dashed #34d399' : 'solid rgba(52, 211, 153, 0.45)'}`,
                                  borderRadius: '8px',
                                  boxShadow: isFuncDropTarget ? '0 0 20px rgba(52, 211, 153, 0.6)' : isTargetedOver ? '0 0 12px rgba(0, 102, 255, 0.5)' : '0 2px 4px rgba(0,0,0,0.2)',
                                  transform: isFuncDropTarget ? 'scale(1.03)' : isTargetedOver ? 'scale(1.05)' : 'scale(1)',
                                  opacity: isBeingDragged ? 0.35 : 1,
                                  transition: 'all 0.15s ease',
                                  userSelect: 'none'
                                }}
                              >
                                <GripVertical size={11} style={{ opacity: 0.6, cursor: 'grab', flexShrink: 0, color: '#34d399' }} />
                                
                                <span style={{
                                  fontSize: '0.62rem',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  background: 'rgba(52, 211, 153, 0.25)',
                                  color: '#34d399',
                                  fontWeight: 700,
                                  letterSpacing: '0.3px',
                                  textTransform: 'uppercase'
                                }}>
                                  FN
                                </span>

                                <span style={{
                                  color: '#34d399',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.84rem',
                                  fontWeight: 600
                                }}>
                                  {seg.funcName}
                                </span>

                                <span style={{ color: '#6ee7b7', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700 }}>(</span>

                                {/* Inner Slot: Holds Constant or Variable */}
                                {seg.innerItem && seg.innerItem.name ? (
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '0.18rem 0.5rem',
                                      borderRadius: '5px',
                                      background: seg.innerItem.type === 'constant' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(192, 132, 252, 0.2)',
                                      border: `1px solid ${seg.innerItem.type === 'constant' ? 'rgba(96, 165, 250, 0.55)' : 'rgba(192, 132, 252, 0.55)'}`,
                                      color: seg.innerItem.type === 'constant' ? '#93c5fd' : '#e9d5ff',
                                      fontSize: '0.78rem',
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: 600
                                    }}
                                  >
                                    <span style={{
                                      fontSize: '0.58rem',
                                      padding: '0 3px',
                                      borderRadius: '2px',
                                      background: 'rgba(0,0,0,0.35)',
                                      color: seg.innerItem.type === 'constant' ? '#60a5fa' : '#c084fc'
                                    }}>
                                      {seg.innerItem.type === 'constant' ? 'CTE' : 'VAR'}
                                    </span>
                                    <span>{seg.innerItem.name}</span>
                                    {seg.innerItem.value && (
                                      <span style={{ fontSize: '0.65rem', color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '0 3px', borderRadius: '2px' }}>
                                        = {seg.innerItem.value}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearFunctionInnerItem(seg.id);
                                      }}
                                      title="Desencaixar este item do interior da função"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                        padding: '0 2px',
                                        opacity: 0.75,
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: '5px',
                                      border: isFuncDropTarget ? '1.5px dashed #34d399' : '1px dashed rgba(52, 211, 153, 0.55)',
                                      background: isFuncDropTarget ? 'rgba(52, 211, 153, 0.25)' : 'rgba(52, 211, 153, 0.08)',
                                      color: isFuncDropTarget ? '#a7f3d0' : '#6ee7b7',
                                      fontSize: '0.74rem',
                                      fontFamily: 'var(--font-mono)'
                                    }}
                                  >
                                    <span>{isFuncDropTarget ? '⚡ Solte agora para encaixar!' : '📥 Solte constante/variável aqui'}</span>
                                  </div>
                                )}

                                <span style={{ color: '#6ee7b7', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700 }}>)</span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSegment(seg.id);
                                  }}
                                  title="Remover função inteira"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#34d399',
                                    opacity: 0.7,
                                    cursor: 'pointer',
                                    padding: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginLeft: '2px'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = '#34d399'; }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          }

                          return null;
                        })
                      )}
                    </div>
                  ) : (
                    /* CODE MODE: Standard Textarea Fallback */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-sm)',
                        border: isDraggingOver ? '2px dashed #0066FF' : '1px solid var(--border-card)',
                        background: isDraggingOver ? 'rgba(0, 102, 255, 0.08)' : '#070b14'
                      }}
                    >
                      <textarea
                        ref={textareaRef}
                        className="input-field"
                        rows="4"
                        value={editExpression}
                        onChange={(e) => {
                          setEditExpression(e.target.value);
                          setFormulaSegments(parseFormulaSegments(e.target.value));
                          setAiValidation(null);
                        }}
                        placeholder="Ex: (([BASE_CALCULO]/(1 - MMATH.f_cte('PCT_MGS_160')) ) / (1 - MMATH.f_cte('PCT_GI_160'))) * MMATH.f_cte('PCT_RE_160')"
                        style={{
                          width: '100%',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.92rem',
                          color: '#93c5fd',
                          background: 'transparent',
                          border: 'none',
                          padding: '0.75rem 1rem',
                          resize: 'vertical',
                          lineHeight: 1.6
                        }}
                      />
                    </div>
                  )}

                  {/* Real-time Mathematical Formula Preview Bar */}
                  <div
                    style={{
                      marginTop: '0.45rem',
                      padding: '0.45rem 0.75rem',
                      background: '#090D17',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      fontSize: '0.76rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        Expressão Gerada:
                      </span>
                      <code style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {editExpression || '(nenhum objeto inserido)'}
                      </code>
                    </div>
                    {editExpression && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editExpression);
                          setCopiedFormulaExpr(true);
                          setTimeout(() => setCopiedFormulaExpr(false), 1600);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedFormulaExpr ? '#10B981' : '#60A5FA',
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {copiedFormulaExpr ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedFormulaExpr ? 'Copiada!' : 'Copiar'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Operators Toolbar (Strictly Textual) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Operadores Rápidos Textuais (Clique para inserir na fórmula):
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { label: '+', insert: ' + ' },
                      { label: '-', insert: ' - ' },
                      { label: '*', insert: ' * ' },
                      { label: '/', insert: ' / ' },
                      { label: '(', insert: '(' },
                      { label: ')', insert: ')' },
                      { label: '1 -', insert: '1 - ' },
                      { label: '0.', insert: '0.' },
                      { label: 'Limpar Tudo', insert: '__CLEAR__', isSpecial: true }
                    ].map((op, oidx) => (
                      <button
                        key={oidx}
                        type="button"
                        className="pagination-btn"
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          background: op.isSpecial ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                          borderColor: op.isSpecial ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-card)',
                          color: op.isSpecial ? '#fda4af' : '#e2e8f0'
                        }}
                        onClick={() => {
                          if (op.insert === '__CLEAR__') {
                            setEditExpression('');
                            setFormulaSegments([]);
                            setAiValidation(null);
                          } else {
                            addSegmentFromItem({ name: op.label, insertText: op.insert, type: 'operator' });
                          }
                        }}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Gateway Validation */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Bot size={17} color="var(--accent-purple)" />
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
                        Validação por IA (Gateway Local)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modelo:</span>
                      <select
                        className="select-field"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                        value={selectedAiModel}
                        onChange={(e) => setSelectedAiModel(e.target.value)}
                      >
                        <option value="gpt-5.6-terra-high">gpt-5.6-terra-high (Mais Avançado)</option>
                        <option value="gpt-5.6-terra">gpt-5.6-terra</option>
                        <option value="gpt-4o">gpt-4o</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Analisa a integridade sintática, operadores e lógica atuarial do cálculo.
                    </p>
                    <button
                      type="button"
                      onClick={handleValidateWithAi}
                      disabled={validatingAi || !editExpression.trim()}
                      className="pagination-btn"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3))',
                        borderColor: 'var(--accent-purple)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      {validatingAi ? (
                        <>
                          <span className="spinner" style={{ width: '13px', height: '13px' }}></span>
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} color="var(--accent-cyan)" /> Validar com IA
                        </>
                      )}
                    </button>
                  </div>

                  {aiValidation && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        background: aiValidation.status === 'APPROVED'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : aiValidation.status === 'WARNING'
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(244, 63, 94, 0.1)',
                        border: `1px solid ${
                          aiValidation.status === 'APPROVED'
                            ? 'var(--accent-emerald)'
                            : aiValidation.status === 'WARNING'
                            ? 'var(--accent-amber)'
                            : 'var(--accent-rose)'
                        }`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            className={`badge ${
                              aiValidation.status === 'APPROVED'
                                ? 'badge-emerald'
                                : aiValidation.status === 'WARNING'
                                ? 'badge-amber'
                                : 'badge-rose'
                            }`}
                          >
                            {aiValidation.status === 'APPROVED' && <CheckCircle2 size={12} />}
                            {aiValidation.status === 'WARNING' && <AlertTriangle size={12} />}
                            {aiValidation.status === 'REJECTED' && <XCircle size={12} />}
                            {aiValidation.status === 'APPROVED' ? 'Aprovado' : aiValidation.status === 'WARNING' ? 'Atenção' : 'Rejeitado'}
                          </span>
                          {aiValidation.parens && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: aiValidation.parens.balanced ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)',
                                border: `1px solid ${aiValidation.parens.balanced ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                                color: aiValidation.parens.balanced ? '#34d399' : '#fda4af',
                                fontWeight: 600,
                                fontFamily: 'var(--font-mono)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={`Contagem total de parênteses: ${aiValidation.parens.open} abertos e ${aiValidation.parens.close} fechados`}
                            >
                              {aiValidation.parens.balanced ? '✓' : '✗'} Parênteses: {aiValidation.parens.open} '(' | {aiValidation.parens.close} ')'
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {aiValidation.modelUsed || selectedAiModel}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
                        {aiValidation.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setEditingFormula(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={savingFormula || validatingAi || !editTitle.trim() || !editExpression.trim()}
                    onClick={handleSaveFormula}
                    className="pagination-btn btn-primary"
                  >
                    {savingFormula || validatingAi ? (
                      <>
                        <span className="spinner" style={{ width: '13px', height: '13px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}></span>
                        {validatingAi ? 'Validando Integridade...' : 'Salvando com Auditoria...'}
                      </>
                    ) : (
                      'Salvar Fórmula com Auditoria'
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: DRAGGABLE & SEARCHABLE OBJECTS TOOLBOX */}
              <div
                style={{
                  background: '#070b14',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '660px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={16} color="var(--primary)" />
                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>Objetos de Cálculo</strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {filteredBuilderItems.length} disponíveis
                  </span>
                </div>

                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <strong>Arraste</strong> para a fórmula ou <strong>clique</strong> para inserir na posição do cursor.
                </p>

                {/* Search Bar */}
                <div className="search-input-wrapper" style={{ marginBottom: '0.6rem' }}>
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem 0.45rem 2rem' }}
                    placeholder="Filtrar constante, variável ou função..."
                    value={builderSearch}
                    onChange={(e) => setBuilderSearch(e.target.value)}
                  />
                  {builderSearch && (
                    <button
                      type="button"
                      onClick={() => setBuilderSearch('')}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'constants', label: `Constantes (${dictionary.constants?.length || 0})` },
                    { id: 'variables', label: `Variáveis (${dictionary.variables?.length || 0})` },
                    { id: 'functions', label: `Funções Contêiner (${dictionary.functions?.length || 0})` },
                    { id: 'operators', label: 'Operadores (Textuais)' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className="pagination-btn"
                      style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem',
                        whiteSpace: 'nowrap',
                        background: builderCategory === tab.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: builderCategory === tab.id ? 'var(--primary)' : 'var(--border-card)',
                        color: builderCategory === tab.id ? '#fff' : 'var(--text-secondary)'
                      }}
                      onClick={() => setBuilderCategory(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Scrollable list of items */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    paddingRight: '0.25rem'
                  }}
                >
                  {filteredBuilderItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Nenhum objeto encontrado para "{builderSearch}".
                    </div>
                  ) : (
                    filteredBuilderItems.map((item) => {
                      const isOp = item.type === 'operator';
                      const isFunc = item.type === 'function';
                      const isConst = item.type === 'constant';
                      const isVar = item.type === 'variable';

                      return (
                        <div
                          key={item.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onClick={() => addSegmentFromItem(item)}
                          title={
                            isOp
                              ? 'Operador textual: clique ou arraste para inserir texto na fórmula'
                              : isFunc
                              ? 'Objeto Função: clique para inserir contêiner ou arraste variáveis/constantes para dentro'
                              : isConst
                              ? 'Constante: clique para inserir ou arraste para dentro de uma Função'
                              : 'Variável: clique para inserir ou arraste para a fórmula/função'
                          }
                          style={{
                            background: '#0c1220',
                            border: '1px solid var(--border-card)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.55rem 0.75rem',
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.6rem',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = isFunc ? '#34d399' : isVar ? '#c084fc' : isConst ? '#60a5fa' : 'var(--primary)';
                            e.currentTarget.style.background = '#101828';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-card)';
                            e.currentTarget.style.background = '#0c1220';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                            <GripVertical size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: isConst ? '#60a5fa' : isVar ? '#c084fc' : isFunc ? '#34d399' : '#e2e8f0'
                                  }}
                                >
                                  {item.name}
                                </span>
                                {item.value && (
                                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                                    = {item.value}
                                  </span>
                                )}
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.35rem',
                                    background: isOp
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : isFunc
                                      ? 'rgba(52, 211, 153, 0.15)'
                                      : isConst
                                      ? 'rgba(96, 165, 250, 0.15)'
                                      : 'rgba(192, 132, 252, 0.15)',
                                    color: isOp
                                      ? '#cbd5e1'
                                      : isFunc
                                      ? '#34d399'
                                      : isConst
                                      ? '#60a5fa'
                                      : '#c084fc',
                                    border: 'none'
                                  }}
                                >
                                  {isOp ? 'Texto' : isFunc ? 'Função Contêiner' : item.category}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                                {isFunc ? 'Recebe variável ou constante no slot interno' : item.description}
                              </p>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: isOp ? '#94a3b8' : isFunc ? '#34d399' : 'var(--accent-cyan)',
                              background: isOp ? 'rgba(255, 255, 255, 0.05)' : isFunc ? 'rgba(52, 211, 153, 0.12)' : 'rgba(6, 182, 212, 0.1)',
                              border: `1px solid ${isOp ? 'rgba(255, 255, 255, 0.15)' : isFunc ? 'rgba(52, 211, 153, 0.3)' : 'rgba(6, 182, 212, 0.25)'}`,
                              padding: '0.2rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              flexShrink: 0,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isOp ? '+ Inserir Texto' : isFunc ? '+ Inserir FN' : '+ Inserir'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom link to dictionary modal */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem', marginTop: '0.6rem', textAlign: 'center' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => setShowDictionaryModal(true)}
                  >
                    <BookOpen size={13} /> Abrir Dicionário & Catálogo com Todos os Detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DICIONÁRIO COMPLETO DE VARIÁVEIS, CONSTANTES E FUNÇÕES */}
      {showDictionaryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowDictionaryModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '960px',
              background: '#0c1220',
              border: '1px solid var(--border-card)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 102, 255, 0.25)',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="stat-icon blue" style={{ width: '38px', height: '38px' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#fff' }}>
                    Dicionário & Catálogo Atuarial de Fórmulas
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Guia de referência das variáveis dinâmicas, constantes cadastradas e funções do motor Tronador (RTE)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDictionaryModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-input-wrapper" style={{ flex: 1, minWidth: '260px' }}>
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Pesquisar por nome, valor no banco, significado ou categoria..."
                  value={dictSearch}
                  onChange={(e) => setDictSearch(e.target.value)}
                />
                {dictSearch && (
                  <button
                    type="button"
                    onClick={() => setDictSearch('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `Todos (${allCatalogItems.length})` },
                  { id: 'constants', label: `Constantes (${dictionary.constants?.length || 0})` },
                  { id: 'variables', label: `Variáveis (${dictionary.variables?.length || 0})` },
                  { id: 'functions', label: `Funções (${dictionary.functions?.length || 0})` }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`pagination-btn ${dictCategory === cat.id ? 'active' : ''}`}
                    style={dictCategory === cat.id ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff' } : {}}
                    onClick={() => setDictCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '0.85rem' }}>
              {filteredDictItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: '#070b14',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.6rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span
                          className={`badge ${
                            item.type === 'constant' ? 'badge-blue' : item.type === 'variable' ? 'badge-purple' : 'badge-emerald'
                          }`}
                        >
                          {item.type === 'constant' ? 'Constante' : item.type === 'variable' ? 'Variável' : 'Função'}
                        </span>
                        <span className="badge badge-gray">{item.category}</span>
                        {item.value && (
                          <span className="badge badge-emerald">
                            Valor no Banco: {item.value}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="pagination-btn"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={() => handleCopyText(item.id, item.insertText)}
                        title="Copiar texto para colar na fórmula"
                      >
                        {dictCopiedId === item.id ? (
                          <>
                            <Check size={12} color="var(--accent-emerald)" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copiar
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '0.35rem' }}>
                      {item.name}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      {item.description}
                    </p>

                    {item.syntax && (
                      <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        Sintaxe: <code>{item.syntax}</code>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Origem: {item.source}</span>
                    <code style={{ color: '#93c5fd', fontSize: '0.72rem' }}>{item.insertText}</code>
                  </div>
                </div>
              ))}
            </div>

            {filteredDictItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                Nenhum item encontrado para "{dictSearch}".
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setShowDictionaryModal(false)}
              >
                Fechar Dicionário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
