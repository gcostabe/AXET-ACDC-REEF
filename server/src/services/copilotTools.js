import { getDupDb, getRteDb } from '../db.js';

// Whitelist of allowed databases and collections for read-only inspection
export const ALLOWED_COLLECTIONS = {
  'acdc_dup_br-int': [
    'RS-RULES-ACTIONS-CONDITIONS',
    'RS-RULES',
    'RULES',
    'PRODUCTS',
    'PRODUCT_COVERAGES',
    'TRIANGULATION_KEYS',
    'POLICIES',
    'RS-PROCESS-RULES',
    'KNOWLEDGE_BASE_RAG'
  ],
  'acdc_rte_br-int': [
    'FORMULA-DEFINITION',
    'CONSTANT-DEFINITION',
    'BREAKDOWN-CONCEPTS',
    'PECA',
    'COVERAGE-PACKAGE-DEFINITION',
    'ECONOMIC-CONCEPTS',
    'COMPANIES',
    'BRANCHES'
  ]
};

// Forbidden pipeline stages in MongoDB aggregation that could alter data or compromise security
const FORBIDDEN_AGGREGATE_STAGES = [
  '$out',
  '$merge',
  '$writeConcern',
  '$collStats',
  '$currentOp',
  '$listLocalSessions',
  '$planCacheStats'
];

export const VIDA_COVERAGE_NAMES = {
  4001: 'Morte Acidental',
  4003: 'Morte Básica (Qualquer Causa)',
  4005: 'Invalidez Permanente Total/Parcial por Acidente (IPA)',
  4006: 'Invalidez Funcional Permanente Total por Doença (IFPD)',
  4007: 'Despesas Médicas, Hospitalares e Odontológicas (DMHO)',
  4008: 'Diária por Incapacidade Temporária (DIT)',
  4014: 'Assistência Funeral Individual',
  4015: 'Assistência Funeral Familiar',
  4016: 'Cesta Básica',
  4017: 'Morte Acidental Especial',
  4018: 'Morte Acidental em Transporte Coletivo',
  4019: 'Adiantamento por Doença Terminal',
  4020: 'Rescisão Trabalhista',
  4021: 'Indenização Especial por Morte Acidental',
  4022: 'Auxílio Funeral Pais',
  4025: 'Despesas com Deslocamento',
  4026: 'Diária de Internação Hospitalar (DIH)',
  4027: 'Diária de Internação Hospitalar em UTI',
  4029: 'Doenças Graves',
  4030: 'Segunda Opinião Médica Internacional',
  4031: 'Telemedicina e Orientação Saúde',
  4032: 'Assistência Residencial',
  4033: 'Assistência Nutricional',
  4034: 'Assistência Pet',
  4035: 'Auxílio Medicamento',
  4050: 'Fratura Óssea',
  4052: 'Invalidez Laborativa Permanente Total por Doença (ILPD)',
  4053: 'Morte do Cônjuge',
  4054: 'Morte dos Filhos',
  4055: 'Invalidez Permanente do Cônjuge',
  4056: 'Invalidez Permanente dos Filhos',
  4057: 'Assistência Funeral Cônjuge e Filhos',
  4060: 'Assistência Psicológica',
  4061: 'Despesas Odontológicas',
  4062: 'Despesas Farmacêuticas',
  4063: 'Cirurgias Especiais',
  4070: 'Sorteio Mensal de Capitalização',
  4071: 'Assistência a Vítima de Crime'
};

function coerceNumericFilters(filter) {
  if (!filter || typeof filter !== 'object') return filter;
  const numFields = [
    'product', 'productCode', 'product_code', 'COD_PRODUCTO',
    'branch', 'branchId', 'branchCode', 'cod_ramo',
    'company', 'companyId', 'companyCode', 'cod_cia',
    'coverage', 'coverageId', 'coverageCode', 'cod_cob'
  ];

  const coerced = Array.isArray(filter) ? [] : {};
  for (const [key, val] of Object.entries(filter)) {
    if (numFields.includes(key)) {
      if (typeof val === 'string' && /^\d+$/.test(val.trim())) {
        coerced[key] = { $in: [Number(val.trim()), val.trim()] };
      } else if (typeof val === 'number') {
        coerced[key] = { $in: [val, String(val)] };
      } else {
        coerced[key] = val;
      }
    } else if (val && typeof val === 'object') {
      coerced[key] = coerceNumericFilters(val);
    } else {
      coerced[key] = val;
    }
  }
  return coerced;
}


/**
 * Sanitizes and validates read-only operations
 */
function sanitizeRequest(dbName, collectionName, operation, pipelineOrQuery) {
  // 1. Validate database
  const allowedCols = ALLOWED_COLLECTIONS[dbName];
  if (!allowedCols) {
    throw new Error(`Acesso negado: banco "${dbName}" não está autorizado para consulta.`);
  }

  // 2. Validate collection
  if (!allowedCols.includes(collectionName)) {
    throw new Error(`Acesso negado: coleção "${collectionName}" não está na lista de coleções autorizadas para consulta.`);
  }

  // 3. Validate operation
  const allowedOps = ['countDocuments', 'find', 'aggregate'];
  if (!allowedOps.includes(operation)) {
    throw new Error(`Operação inválida "${operation}". Somente operações de consulta (countDocuments, find, aggregate) são permitidas.`);
  }

  // 4. Sanitize aggregation stages
  if (operation === 'aggregate') {
    if (!Array.isArray(pipelineOrQuery)) {
      throw new Error('Pipeline de agregação deve ser um array de estágios.');
    }
    for (const stage of pipelineOrQuery) {
      if (typeof stage !== 'object' || stage === null) continue;
      const stageKeys = Object.keys(stage);
      for (const key of stageKeys) {
        if (FORBIDDEN_AGGREGATE_STAGES.includes(key)) {
          throw new Error(`Estágio proibido "${key}" detectado na agregação. Operação de escrita/mutação bloqueada pela sanitização.`);
        }
      }
    }
  }
}

/**
 * Tool schemas provided to the AI Gateway (OpenAI-compatible)
 */
export const COPILOT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'inspect_rules_by_story',
      description: 'Consulta a coleção RS-RULES-ACTIONS-CONDITIONS para diagnosticar regras associadas a uma história de negócio/Jira (ex: "13218"). Retorna contagem total de regras, distribuição do campo process_field e amostra de registros.',
      parameters: {
        type: 'object',
        properties: {
          storyCode: {
            type: 'string',
            description: 'Código numérico ou identificador da história contido no rule_name (ex: "13218" ou "IRV-13218")'
          }
        },
        required: ['storyCode']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'aggregate_rule_coverages',
      description: 'Agrupa as condições das regras da história por código de cobertura presente na tag factor (ex: coverages.40XX.capital) e calcula as contagens exatas por cobertura e valores atuais de process_field.',
      parameters: {
        type: 'object',
        properties: {
          storyCode: {
            type: 'string',
            description: 'Código da história a ser agregada por cobertura (ex: "13218")'
          }
        },
        required: ['storyCode']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'inspect_coverage_packages',
      description: 'Consulta a coleção COVERAGE-PACKAGE-DEFINITION (no banco acdc_rte_br-int) para buscar os pacotes e coberturas de um produto (ex: 42101, 42102, 42103, 23101), ramo ou companhia. Retorna a contagem de pacotes, a lista consolidada de todas as coberturas ativas, se são obrigatórias/opcionais e amostras.',
      parameters: {
        type: 'object',
        properties: {
          product: {
            type: 'number',
            description: 'Código numérico do produto / modalidade (ex: 42101, 42102, 42103)'
          },
          branchId: {
            type: 'number',
            description: 'Código numérico do ramo (ex: 421, 400, 231)'
          },
          companyId: {
            type: 'number',
            description: 'Código numérico da companhia (ex: 15)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_mongodb_readonly',
      description: 'Executa consultas somente-leitura (find, countDocuments ou aggregate) nas coleções autorizadas do ACDC. Estritamente consultivo e sanitizado.',
      parameters: {
        type: 'object',
        properties: {
          database: {
            type: 'string',
            enum: ['acdc_dup_br-int', 'acdc_rte_br-int'],
            description: 'Nome do banco de dados (acdc_dup_br-int para DUP ou acdc_rte_br-int para RTE)'
          },
          collection: {
            type: 'string',
            description: 'Nome da coleção autorizada (ex: RS-RULES-ACTIONS-CONDITIONS, FORMULA-DEFINITION, CONSTANT-DEFINITION, PRODUCTS)'
          },
          operation: {
            type: 'string',
            enum: ['countDocuments', 'find', 'aggregate'],
            description: 'Operação de consulta a ser executada'
          },
          query: {
            type: 'object',
            description: 'Filtro de busca (para find/countDocuments) ou objeto com opções'
          },
          pipeline: {
            type: 'array',
            items: { type: 'object' },
            description: 'Estágios de agregação (para operation="aggregate")'
          },
          limit: {
            type: 'number',
            description: 'Limite máximo de documentos retornados (máximo 50)'
          }
        },
        required: ['database', 'collection', 'operation']
      }
    }
  }
];

/**
 * Dispatches a tool call safely and returns formatted results
 */
export async function dispatchToolCall(toolName, args = {}) {
  const startTime = Date.now();
  console.log(`🔧 [Copilot Tool Exec] Invocando "${toolName}" com argumentos:`, JSON.stringify(args));

  try {
    switch (toolName) {
      case 'inspect_rules_by_story': {
        const { storyCode } = args;
        if (!storyCode) throw new Error('Parâmetro storyCode é obrigatório.');

        const db = getDupDb();
        const collection = db.collection('RS-RULES-ACTIONS-CONDITIONS');
        const filter = { rule_name: { $regex: String(storyCode).trim() } };

        // 1. Total count
        const total = await collection.countDocuments(filter);

        // 2. Distribution of process_field
        const processFieldDistribution = await collection.aggregate([
          { $match: filter },
          { $group: { _id: '$process_field', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).toArray();

        // 3. Samples (up to 3)
        const samples = await collection.find(filter)
          .project({
            rule_id: 1,
            rule_name: 1,
            process_field: 1,
            coverage: 1,
            conditions: 1,
            actions: 1,
            active: 1
          })
          .limit(3)
          .toArray();

        return {
          tool: toolName,
          status: 'SUCCESS',
          executionTimeMs: Date.now() - startTime,
          storyCode,
          totalMatchingRules: total,
          processFieldDistribution: processFieldDistribution.map(d => ({
            process_field: d._id || 'null/undefined',
            count: d.count
          })),
          sampleRules: samples
        };
      }

      case 'aggregate_rule_coverages': {
        const { storyCode } = args;
        if (!storyCode) throw new Error('Parâmetro storyCode é obrigatório.');

        const db = getDupDb();
        const collection = db.collection('RS-RULES-ACTIONS-CONDITIONS');
        const filter = { rule_name: { $regex: String(storyCode).trim() } };

        // Aggregation to extract factor with coverage pattern (coverages.40XX.capital)
        const breakdown = await collection.aggregate([
          { $match: filter },
          { $unwind: '$conditions' },
          { $match: { 'conditions.factor': { $regex: 'coverages\\.(40\\d+)' } } },
          {
            $group: {
              _id: '$conditions.factor',
              count: { $sum: 1 },
              currentProcessField: { $first: '$process_field' },
              sampleRuleName: { $first: '$rule_name' }
            }
          },
          { $sort: { _id: 1 } }
        ]).toArray();

        const totalRules = await collection.countDocuments(filter);

        return {
          tool: toolName,
          status: 'SUCCESS',
          executionTimeMs: Date.now() - startTime,
          storyCode,
          totalRulesFound: totalRules,
          uniqueCoveragesCount: breakdown.length,
          breakdown: breakdown.map(b => {
            const match = String(b._id).match(/coverages\.(40\d+)/);
            const covNum = match ? match[1] : b._id;
            return {
              factorTag: b._id,
              coverageNumber: covNum,
              suggestedProcessField: `VALIDACION_${covNum}`,
              currentProcessField: b.currentProcessField,
              rulesCount: b.count,
              sampleRule: b.sampleRuleName
            };
          })
        };
      }

      case 'inspect_coverage_packages': {
        const { product, branchId, companyId } = args;
        const db = getRteDb();
        const collection = db.collection('COVERAGE-PACKAGE-DEFINITION');

        const filter = {};
        if (product !== undefined && product !== null) {
          const numProd = Number(product);
          filter.product = !isNaN(numProd) ? { $in: [numProd, String(product)] } : product;
        }
        if (branchId !== undefined && branchId !== null) {
          const numBranch = Number(branchId);
          filter.branchId = !isNaN(numBranch) ? { $in: [numBranch, String(branchId)] } : branchId;
        }
        if (companyId !== undefined && companyId !== null) {
          const numCia = Number(companyId);
          filter.companyId = !isNaN(numCia) ? { $in: [numCia, String(companyId)] } : companyId;
        }

        const totalPackages = await collection.countDocuments(filter);
        const packages = await collection.find(filter).limit(50).toArray();

        // Consolidate unique coverages
        const covMap = {};
        packages.forEach(pkg => {
          (pkg.coverages || []).forEach(cov => {
            const cid = cov.coverageId;
            if (!covMap[cid]) {
              covMap[cid] = {
                coverageId: cid,
                coverageName: VIDA_COVERAGE_NAMES[cid] || `Cobertura ${cid}`,
                packagesCount: 0,
                mandatoryCount: 0,
                optionalCount: 0,
                maxAmount: 0
              };
            }
            covMap[cid].packagesCount++;
            if (cov.data?.mandatory) covMap[cid].mandatoryCount++;
            else covMap[cid].optionalCount++;
            if (cov.data?.maxAmount && cov.data.maxAmount > covMap[cid].maxAmount) {
              covMap[cid].maxAmount = cov.data.maxAmount;
            }
          });
        });

        const coveragesList = Object.values(covMap).sort((a, b) => a.coverageId - b.coverageId);

        return {
          tool: toolName,
          status: 'SUCCESS',
          executionTimeMs: Date.now() - startTime,
          queryFilter: filter,
          totalPackagesFound: totalPackages,
          uniqueCoveragesCount: coveragesList.length,
          coverages: coveragesList,
          samplePackages: packages.slice(0, 3).map(p => ({
            _id: p._id,
            product: p.product,
            branchId: p.branchId,
            companyId: p.companyId,
            preferenceId: p.preferenceId,
            coveragesCount: (p.coverages || []).length
          }))
        };
      }

      case 'query_mongodb_readonly': {
        const { database, collection, operation, query = {}, pipeline = [], limit = 20 } = args;
        const boundedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 50);

        // Auto-coerce string numbers in numeric fields for robust querying
        const safeQuery = coerceNumericFilters(query);

        // Sanitize strictly
        sanitizeRequest(database, collection, operation, operation === 'aggregate' ? pipeline : safeQuery);

        const db = database === 'acdc_rte_br-int' ? getRteDb() : getDupDb();
        const col = db.collection(collection);

        let data;
        if (operation === 'countDocuments') {
          const count = await col.countDocuments(safeQuery);
          data = { count };
        } else if (operation === 'find') {
          data = await col.find(safeQuery).limit(boundedLimit).toArray();
        } else if (operation === 'aggregate') {
          // Append a max limit stage if not present
          const safePipeline = [...pipeline];
          const hasLimitStage = safePipeline.some(s => s.$limit !== undefined);
          if (!hasLimitStage) {
            safePipeline.push({ $limit: boundedLimit });
          }
          data = await col.aggregate(safePipeline).toArray();
        }

        return {
          tool: toolName,
          status: 'SUCCESS',
          executionTimeMs: Date.now() - startTime,
          database,
          collection,
          operation,
          resultCount: Array.isArray(data) ? data.length : 1,
          data
        };
      }

      default:
        throw new Error(`Ferramenta desconhecida: "${toolName}".`);
    }
  } catch (err) {
    console.error(`❌ [Copilot Tool Error] Falha na ferramenta "${toolName}":`, err.message);
    return {
      tool: toolName,
      status: 'ERROR',
      executionTimeMs: Date.now() - startTime,
      errorMessage: err.message
    };
  }
}
