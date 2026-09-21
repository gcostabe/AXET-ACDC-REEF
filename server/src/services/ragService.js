import { getDupDb, getRteDb } from '../db.js';
import { updateRagStatus } from '../routes/chat.js';

const AI_GATEWAY_EMBEDDINGS_URL = process.env.AI_GATEWAY_EMBEDDINGS_URL || 'http://127.0.0.1:8766/codex/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';

// In-memory cache of indexed documents with embeddings for ultra-fast cosine similarity
let memoryKnowledgeStore = [];
let isIndexingInProgress = false;

/**
 * Calculates dot product of two normalized vectors (cosine similarity)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

/**
 * Generates embeddings via Local AI Gateway
 */
async function generateEmbeddings(texts) {
  if (!texts || texts.length === 0) return [];

  // Sanitize texts
  const cleanTexts = texts.map(t => (t || '').trim().replace(/\n+/g, ' ').slice(0, 4000));

  const response = await fetch(AI_GATEWAY_EMBEDDINGS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleanTexts
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI Gateway Embeddings error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.data.map(item => item.embedding);
}

/**
 * Extracts raw knowledge items from MongoDB collections
 */
async function extractRawKnowledgeFromMongo() {
  const dupDb = getDupDb();
  const rteDb = getRteDb();
  const rawDocs = [];

  console.log('🔄 Extraindo conhecimento das coleções do MongoDB...');

  // 1. FORMULA-DEFINITION (RTE)
  try {
    const formulas = await rteDb.collection('FORMULA-DEFINITION').find({}).limit(300).toArray();
    const seenFormulas = new Set();

    for (const f of formulas) {
      const code = f.fomVal || f.codFormula || f._id?.toString() || 'Fórmula';
      const desc = f.fomNam || f.desFormula || f.descripcion || 'Fórmula Atuarial';
      const expr = f.details?.[0]?.fomValVal || f.expressao || f.formulaExpressao || '';
      const concept = f.codConceptoDesglose || f.glbNamRel || '';
      const branchKey = f.brgKeyFomVal || '';
      const country = f.cnyVal || 'BR';

      // Deduplicate identical formula definitions
      const dedupeKey = `${code}_${expr}`;
      if (seenFormulas.has(dedupeKey)) continue;
      seenFormulas.add(dedupeKey);

      const content = `Fórmula Atuarial: ${code}
Nome / Título: ${desc}
Expressão Matemática de Cálculo: ${expr}
Ramo / Escopo: ${branchKey} | País: ${country}
Conceito Relacionado: ${concept}
Operação Atuarial: ${f.indOperacion || 'Padrão'}
Coleção MongoDB: FORMULA-DEFINITION (Banco acdc_rte_br-int)`;

      rawDocs.push({
        id: `formula_${code}_${rawDocs.length}`,
        title: `Fórmula Atuarial: ${code} - ${desc}`,
        category: 'Motor de Tarifação (RTE) - Fórmulas',
        sourceCollection: 'FORMULA-DEFINITION',
        tags: [code, desc, 'fórmula', 'cálculo', 'rte', 'expressão', concept, branchKey].map(String).filter(Boolean),
        content
      });
    }
  } catch (err) {
    console.warn('Erro ao extrair FORMULA-DEFINITION:', err.message);
  }

  // 2. CONSTANT-DEFINITION (RTE)
  try {
    const constDocs = await rteDb.collection('CONSTANT-DEFINITION').find({}).limit(50).toArray();
    const seenConstants = new Map();

    for (const doc of constDocs) {
      const defs = doc.definicionesConstantes || [];
      for (const c of defs) {
        if (!c.vrbNam) continue;
        const name = c.vrbNam;
        const val = c.vrbNamVal;
        const desc = c.desConstante || c.descripcion || `Constante atuarial ${name} configurada no valor de ${val}`;
        const country = c.cnyVal || doc.cnyVal || 'BR';
        const branch = c.lobVal || doc.lobVal || '160';

        // Deduplicate or enrich
        if (seenConstants.has(name)) {
          const existing = seenConstants.get(name);
          if (!existing.branches.includes(branch)) existing.branches.push(branch);
          continue;
        }

        seenConstants.set(name, {
          name,
          val,
          desc,
          country,
          branches: [branch]
        });
      }
    }

    for (const [name, info] of seenConstants.entries()) {
      const content = `Constante Atuarial: ${info.name}
Valor Numérico no Banco: ${info.val}
Descrição Atuarial: ${info.desc}
País: ${info.country} | Ramos / LOB: ${info.branches.join(', ')}
Uso no Tronador: Invocada via MMATH.f_cte('${info.name}') ou MATH.f_cte('${info.name}')
Coleção MongoDB: CONSTANT-DEFINITION (Banco acdc_rte_br-int)`;

      rawDocs.push({
        id: `const_${info.name}`,
        title: `Constante Atuarial: ${info.name} (Valor: ${info.val})`,
        category: 'Motor de Tarifação (RTE) - Constantes',
        sourceCollection: 'CONSTANT-DEFINITION',
        tags: [info.name, 'constante', 'f_cte', info.desc, String(info.val)].map(String).filter(Boolean),
        content
      });
    }
  } catch (err) {
    console.warn('Erro ao extrair CONSTANT-DEFINITION:', err.message);
  }

  // 3. RULES (DUP - Subscrição e Desconto)
  try {
    const rules = await dupDb.collection('RULES').find({}).limit(100).toArray();
    for (const r of rules) {
      const name = r.ruleName || r.name || r._id?.toString();
      const desc = r.description || 'Regra de subscrição e desconto';
      const lr = r.lossRatioTarget ? `${r.lossRatioTarget}%` : 'N/A';
      const margin = r.marginAdjustment ? `${r.marginAdjustment}%` : 'N/A';
      const action = r.actionType || 'Ajuste de Margem';
      const conds = r.conditions ? JSON.stringify(r.conditions, null, 2) : 'Condições dinâmicas';

      const content = `Regra de Subscrição e Desconto: ${name}
Descrição: ${desc}
País: ${r.country || 'BR'} | Ramo: ${r.branch || '160 - Automóvel'} | Status: ${r.status || 'PROD'}
Loss Ratio Alvo: ${lr} | Margem de Ajuste: ${margin}
Tipo de Ação: ${action}
Condições Atuariais de Aplicação:
${conds}
Coleção MongoDB: RULES (Banco acdc_dup_br-int)`;

      rawDocs.push({
        id: `rule_${name}`,
        title: `Regra de Subscrição: ${name}`,
        category: 'Seleção de Risco (DUP) - Regras de Subscrição',
        sourceCollection: 'RULES',
        tags: [name, desc, 'regra', 'subscrição', 'desconto', 'loss ratio', 'margem', r.country, r.branch].filter(Boolean),
        content
      });
    }
  } catch (err) {
    console.warn('Erro ao extrair RULES:', err.message);
  }

  // 4. RS-RULES (DUP - Seleção de Risco)
  try {
    const rsRules = await dupDb.collection('RS-RULES').find({}).limit(60).toArray();
    for (const rs of rsRules) {
      const name = rs.ruleName || rs.nomRegla || rs._id?.toString();
      const active = rs.active || rs.indActivo || 'Y';
      const conds = rs.conditions ? JSON.stringify(rs.conditions) : '';

      const content = `Regra de Avaliação de Risco (RS-RULE): ${name}
Companhia: ${rs.companyId || rs.codCia || '1'} | Status Ativa: ${active}
Critérios de Análise: ${conds || 'Avaliação de restrições de perfil, histórico e veículo'}
Coleção MongoDB: RS-RULES (Banco acdc_dup_br-int)`;

      rawDocs.push({
        id: `rs_rule_${name}`,
        title: `Regra de Avaliação de Risco: ${name}`,
        category: 'Seleção de Risco (DUP) - Seleção de Risco',
        sourceCollection: 'RS-RULES',
        tags: [name, 'rs-rules', 'risco', 'avaliação'].filter(Boolean),
        content
      });
    }
  } catch (err) {
    console.warn('Erro ao extrair RS-RULES:', err.message);
  }

  // 5. PRODUCTS & PRODUCT_COVERAGES (DUP)
  try {
    const products = await dupDb.collection('PRODUCTS').find({}).limit(150).toArray();
    for (const p of products) {
      const code = p.productId || p.codProducto || p._id?.toString();
      const name = p.name || p.nomProducto || 'Produto MAPFRE';
      const branch = p.branchName || (p.branchId ? `Ramo ${p.branchId}` : 'Geral');
      const country = p.country || 'BR';
      const coverages = p.coverages ? p.coverages.map(c => c.name || c.code || c).join(', ') : 'Coberturas padrão';

      const content = `Produto de Seguro: ${name} (Código: ${code})
Ramo: ${branch} | País: ${country}
Cálculo de Risco Ativo: ${p.riskPrimeCalc ? 'Sim' : 'Não'}
Coberturas Incluídas: ${coverages}
Coleção MongoDB: PRODUCTS (Banco acdc_dup_br-int)`;

      rawDocs.push({
        id: `product_${code}`,
        title: `Produto: ${name}`,
        category: 'Catálogo de Produtos & Coberturas',
        sourceCollection: 'PRODUCTS',
        tags: [name, code, branch, country, 'produto', 'cobertura'].filter(Boolean),
        content
      });
    }
  } catch (err) {
    console.warn('Erro ao extrair PRODUCTS:', err.message);
  }

  // 6. TRIANGULATION_KEYS (DUP - Antifraude)
  try {
    const triKeys = await dupDb.collection('TRIANGULATION_KEYS').find({}).limit(50).toArray();
    for (const tk of triKeys) {
      const keyName = tk.keyName || tk.codClave || tk._id?.toString();
      const fields = tk.fields ? tk.fields.join(' + ') : 'Campos de validação';
      const desc = tk.description || `Chave de triangulação antifraude com base em ${fields}`;

      const content = `Chave de Triangulação Antifraude: ${keyName}
Descrição: ${desc}
Campos de Composição: ${fields}
Objetivo: Detectar cotações simultâneas duplicadas, cruzamento de dados de corretores e inconsistências na contratação.
Coleção MongoDB: TRIANGULATION_KEYS (Banco acdc_dup_br-int)`;

      rawDocs.push({
        id: `tri_${keyName}`,
        title: `Chave Antifraude: ${keyName}`,
        category: 'Triangulação Antifraude',
        sourceCollection: 'TRIANGULATION_KEYS',
        tags: [keyName, 'triangulação', 'antifraude', 'duplicidade'].filter(Boolean),
        content
      });
    }
  } catch (err) {
    console.warn('Erro ao extrair TRIANGULATION_KEYS:', err.message);
  }

  // 7. BREAKDOWN-CONCEPTS & ECONOMIC-CONCEPTS (RTE)
  try {
    const concepts = await rteDb.collection('BREAKDOWN-CONCEPTS').find({}).limit(100).toArray();
    for (const bc of concepts) {
      const code = bc.codConceptoDesglose || bc.codConcepto || bc._id?.toString();
      const desc = bc.desConceptoDesglose || bc.desConcepto || 'Conceito econômico';
      const type = bc.tipConcepto || 'Atuarial';

      const content = `Conceito Econômico de Decomposição (Breakdown): ${code}
Descrição: ${desc}
Tipo de Conceito: ${type}
Função no Motor: Utilizado no desglose do prêmio comercial (prêmio líquido, comissões, despesas de gestão, tributos e resseguro).
Coleção MongoDB: BREAKDOWN-CONCEPTS (Banco acdc_rte_br-int)`;

      rawDocs.push({
        id: `concept_${code}`,
        title: `Conceito Econômico: ${code}`,
        category: 'Motor de Tarifação (RTE) - Conceitos Econômicos',
        sourceCollection: 'BREAKDOWN-CONCEPTS',
        tags: [code, desc, 'conceito', 'desglose', 'breakdown', 'prêmio'].filter(Boolean),
        content
      });
    }
  } catch (err) {
    console.warn('Erro ao extrair BREAKDOWN-CONCEPTS:', err.message);
  }

  // 8. PECA & AUDIT_CHANGELOG (Auditoria e Trilha de Segurança)
  rawDocs.push({
    id: 'arch_peca_audit',
    title: 'Trilha de Segurança e Auditoria (PECA & AUDIT_CHANGELOG)',
    category: 'Auditoria & Trilha de Segurança (PECA)',
    sourceCollection: 'PECA / AUDIT_CHANGELOG',
    tags: ['auditoria', 'peca', 'audit_changelog', 'trilha', 'segurança', 'diff', 'ia'],
    content: `Trilha de Segurança e Auditoria (PECA):
A tela de Auditoria & Trilha de Segurança (PECA) registra com precisão atuarial qualquer modificação executada na plataforma ACDC Insurance.
Campos Registrados:
- Data e Hora do evento (timestamp ISO).
- Usuário responsável (e-mail, nome e papel).
- Entidade e Código afetado (ex: fórmula PRIMA_CEDIDA_RE_160, regra de subscrição, produto ou alteração de perfil de usuário).
- Tipo de Ação: CREATE (inclusão de novo item) ou UPDATE (modificação de item existente).
- Diff de Valores: Valor Antigo (tachado) vs Valor Novo (destacado em verde).
- Validação por IA: Relatório de análise lógica de sintaxe emitido pelo Gateway de IA local.
- Endereço IP e identificadores de sessão.
Visualização: Disponível em tabela com ordenação e busca rápida, com modal detalhado ao clicar em qualquer registro.`
  });

  // 9. FUNÇÕES ATUARIAIS E SINTAXE DO MOTOR (Tronador MMATH / MATH)
  rawDocs.push({
    id: 'arch_actuarial_functions',
    title: 'Funções Atuariais Matemáticas e Sintaxe Tronador',
    category: 'Motor de Tarifação (RTE) - Funções',
    sourceCollection: 'FORMULA-DEFINITION / Engine Manual',
    tags: ['mmath.f_cte', 'math.f_cte', 'mmath.round', 'mmath.min', 'mmath.max', 'mmath.nvl', 'funções', 'sintaxe'],
    content: `Funções Atuariais Nativas do Tronador:
1. MMATH.f_cte('NOME_CONSTANTE') ou MATH.f_cte('NOME_CONSTANTE'):
   Busca dinâmica do valor de uma constante atuarial cadastrada em CONSTANT-DEFINITION correspondente ao país, companhia e ramo atuais.
2. MMATH.round(expressao, casasDecimais):
   Arredonda o cálculo para a quantidade especificada de casas decimais (padrão 2 casas para valores monetários).
3. MMATH.min(termoA, termoB):
   Retorna o menor valor entre dois termos (usado para aplicar limites máximos ou tetos de prêmio/comissão).
4. MMATH.max(termoA, termoB):
   Retorna o maior valor entre dois termos (usado para assegurar prêmio mínimo ou piso tarifário).
5. MMATH.nvl(campo, valorPadrao):
   Substitui valores nulos, vazios ou indefinidos por um valor numérico de segurança (fallback).
6. Delimitação de Variáveis:
   Variáveis atuariais e financeiras são sempre delimitadas por colchetes, como [BASE_CALCULO], [KM_VEHICULO], [EDAD_VEHICULO], [BONUS_MALUS].`
  });

  // 10. GESTÃO DE USUÁRIOS E PERFIS DE ACESSO
  rawDocs.push({
    id: 'arch_user_roles',
    title: 'Perfis de Usuário e Controle de Acesso (RBAC)',
    category: 'Gestão de Usuários & Permissões',
    sourceCollection: 'ACDC_USERS',
    tags: ['usuário', 'login', 'admin', 'atuario', 'subscriber', 'viewer', 'permissões', 'rbac'],
    content: `Perfis de Acesso e Governança de Usuários:
- ADMIN (Administrador do Sistema): Acesso total a todas as telas, aprovação de novos cadastros de usuários, edição de perfis, permissão de edição de fórmulas, regras e produtos, e visualização da trilha PECA.
- ATUARIO (Atuário): Acesso ao Motor de Tarifação (RTE), Fórmulas, Dicionário Atuarial, Decomposição Econômica e Catálogo de Produtos.
- SUBSCRIBER (Subscritor): Acesso à Seleção de Risco (DUP), Regras de Subscrição, Margens de Desconto e Triangulação Antifraude.
- VIEWER (Visualizador): Acesso em modo somente leitura (read-only) às telas liberadas.`
  });

  console.log(`✅ Total de documentos de conhecimento bruto sintetizados: ${rawDocs.length}`);
  return rawDocs;
}

/**
 * Builds the full RAG index with embeddings and saves to MongoDB and memory
 */
export async function buildAndIndexRag(force = false) {
  if (isIndexingInProgress) {
    console.log('⚠️ Processo de indexação RAG já está em andamento...');
    return;
  }

  const dupDb = getDupDb();

  // If not forcing a re-index, check if MongoDB already has indexed documents
  if (!force) {
    try {
      const existingDocs = await dupDb.collection('KNOWLEDGE_BASE_RAG').find({}).toArray();
      if (existingDocs && existingDocs.length > 0) {
        memoryKnowledgeStore = existingDocs;
        updateRagStatus({
          ready: true,
          documentCount: existingDocs.length,
          lastIndexedAt: new Date().toISOString(),
          isIndexing: false
        });
        console.log(`⚡ Base de conhecimento RAG carregada instantaneamente do MongoDB (${existingDocs.length} documentos indexados).`);
        return;
      }
    } catch (err) {
      console.warn('Verificação de KNOWLEDGE_BASE_RAG existente falhou:', err.message);
    }
  }

  isIndexingInProgress = true;
  updateRagStatus({ isIndexing: true });

  try {
    const rawDocs = await extractRawKnowledgeFromMongo();
    if (rawDocs.length === 0) {
      console.warn('Nenhum documento encontrado para indexação RAG.');
      isIndexingInProgress = false;
      updateRagStatus({ isIndexing: false });
      return;
    }

    console.log(`🧠 Gerando embeddings para ${rawDocs.length} documentos via AI Gateway (${EMBEDDING_MODEL})...`);

    // Batch generate embeddings with concurrency of 3
    const batchSize = 20;
    const batches = [];
    for (let i = 0; i < rawDocs.length; i += batchSize) {
      batches.push(rawDocs.slice(i, i + batchSize));
    }

    const indexedDocs = [];
    const concurrency = 3;

    for (let i = 0; i < batches.length; i += concurrency) {
      const currentBatches = batches.slice(i, i + concurrency);
      await Promise.all(currentBatches.map(async (chunk) => {
        const textsToEmbed = chunk.map(d => `${d.title} - ${d.category} | ${d.content}`);
        try {
          const embeddings = await generateEmbeddings(textsToEmbed);
          for (let j = 0; j < chunk.length; j++) {
            indexedDocs.push({
              ...chunk[j],
              embedding: embeddings[j] || []
            });
          }
        } catch (embErr) {
          console.error('Erro no lote de embeddings:', embErr.message);
          for (const item of chunk) {
            indexedDocs.push({ ...item, embedding: [] });
          }
        }
      }));
      console.log(`📊 Progresso RAG: ${indexedDocs.length}/${rawDocs.length} documentos indexados...`);
    }

    // Save to memory cache
    memoryKnowledgeStore = indexedDocs;

    // Persist to MongoDB collection KNOWLEDGE_BASE_RAG in acdc_dup_br-int
    const dupDb = getDupDb();
    try {
      const ragCol = dupDb.collection('KNOWLEDGE_BASE_RAG');
      await ragCol.deleteMany({});
      if (indexedDocs.length > 0) {
        await ragCol.insertMany(indexedDocs);
      }
      console.log(`💾 Base RAG persistida com sucesso no MongoDB (${indexedDocs.length} documentos).`);
    } catch (dbErr) {
      console.warn('Não foi possível persistir KNOWLEDGE_BASE_RAG no Mongo:', dbErr.message);
    }

    updateRagStatus({
      ready: true,
      documentCount: indexedDocs.length,
      lastIndexedAt: new Date().toISOString(),
      isIndexing: false
    });

    console.log(`🎉 Indexação RAG concluída com sucesso! ${indexedDocs.length} documentos ativos.`);
  } catch (err) {
    console.error('Erro geral durante buildAndIndexRag:', err);
    updateRagStatus({ isIndexing: false });
  } finally {
    isIndexingInProgress = false;
  }
}

/**
 * Searches the RAG knowledge base using hybrid vector + keyword matching
 */
export async function searchRagKnowledge(query, topK = 6) {
  if (!query || !query.trim()) return [];

  // If memory store is empty, attempt to load from MongoDB
  if (memoryKnowledgeStore.length === 0) {
    try {
      const dupDb = getDupDb();
      const docs = await dupDb.collection('KNOWLEDGE_BASE_RAG').find({}).toArray();
      if (docs && docs.length > 0) {
        memoryKnowledgeStore = docs;
        updateRagStatus({
          ready: true,
          documentCount: docs.length,
          lastIndexedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Não foi possível carregar KNOWLEDGE_BASE_RAG do Mongo:', err.message);
    }
  }

  // If still empty, return empty
  if (memoryKnowledgeStore.length === 0) {
    return [];
  }

  // 1. Generate query embedding
  let queryEmbedding = null;
  try {
    const embResult = await generateEmbeddings([query]);
    if (embResult && embResult[0]) {
      queryEmbedding = embResult[0];
    }
  } catch (err) {
    console.warn('Erro ao gerar embedding para query (usando busca textual pura):', err.message);
  }

  // 2. Normalize search tokens for lexical matching
  const searchTokens = query
    .toLowerCase()
    .replace(/[^\w\s_]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  // 3. Score each document
  const scoredDocs = memoryKnowledgeStore.map(doc => {
    let vectorScore = 0;
    if (queryEmbedding && doc.embedding && doc.embedding.length > 0) {
      vectorScore = cosineSimilarity(queryEmbedding, doc.embedding);
    }

    // Lexical match score
    let keywordScore = 0;
    const safeTags = (doc.tags || []).map(t => String(t || ''));
    const docText = `${doc.title || ''} ${doc.category || ''} ${safeTags.join(' ')} ${doc.content || ''}`.toLowerCase();

    // Check exact matches on specific codes (e.g. PCT_MGS_160, PRIMA_CEDIDA, RULES, PECA)
    for (const token of searchTokens) {
      if (docText.includes(token)) {
        keywordScore += 0.2;
      }
      // Exact code match bonus
      if ((doc.title || '').toLowerCase().includes(token)) {
        keywordScore += 0.4;
      }
      if (safeTags.some(t => t.toLowerCase() === token)) {
        keywordScore += 0.5;
      }
    }

    // Combined score: 65% vector similarity + 35% keyword relevance
    const finalScore = (vectorScore * 0.65) + (Math.min(keywordScore, 1.0) * 0.35);

    return {
      ...doc,
      score: finalScore
    };
  });

  // 4. Sort by score descending and take topK
  scoredDocs.sort((a, b) => b.score - a.score);

  return scoredDocs.slice(0, topK);
}
