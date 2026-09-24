import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDupDb, getRteDb } from '../db.js';
import { requireEditPermission } from '../middleware/auth.js';

const router = Router();

// Generic Cache for Unified Products Catalog
let catalogCache = null;
let lastCacheTime = 0;
const CATALOG_CACHE_TTL_MS = 30000; // 30 seconds TTL

// Definitive dictionaries for display enrichment
const VIDA_COVERAGE_NAMES = {
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

const KNOWN_PRODUCT_NAMES = {
  42101: 'MULTIFLEX TRADICIONAL',
  42102: 'BILHETE IDADE',
  42103: 'BILHETE PLANOS',
  42104: 'BILHETE EMPRESAS',
  42111: 'MULTIFLEX TRADICIONAL',
  421011: 'MULTIFLEX TRADICIONAL INDIVIDUAL',
  421022: 'BILHETE IDADE MODALIDADE 2',
  421033: 'BILHETE PLANOS MODALIDADE 3',
  40099: 'VIDA INDIVIDUAL GERAL',
  40700: 'VIDA COLETIVO EMPRESARIAL',
  23101: 'AUTO INDIVIDUAL CONVENCIONAL',
  23102: 'AUTO MAIS CONVENCIONAL'
};

const KNOWN_BRANCH_NAMES = {
  231: 'AUTOMOVEL',
  421: 'PLURIANUAL RENOVÁVEL (VIDA)',
  400: 'VIDA INDIVIDUAL',
  407: 'VIDA COLETIVO',
  410: 'VIDA EM GRUPO',
  118: 'PATRIMONIAL',
  140: 'TRANSPORTES',
  160: 'AGROPECUÁRIO',
  690: 'RISCOS FINANCEIROS',
  700: 'GARANTIA',
  980: 'PREVIDÊNCIA'
};

const KNOWN_COMPANY_NAMES = {
  1: 'MAPFRE SEGUROS GERAIS',
  5: 'MAPFRE ESPAÑA',
  15: 'MAPFRE BRASIL',
  50: 'MAPFRE GLOBAL RISKS',
  155: 'MAPFRE VIDA S.A.'
};

// GET /api/dup/products (Generic Auto-Discovery Engine)
router.get('/products', async (req, res) => {
  try {
    const { country, branch, company } = req.query;
    const now = Date.now();

    let unifiedProducts;

    if (catalogCache && (now - lastCacheTime < CATALOG_CACHE_TTL_MS)) {
      unifiedProducts = catalogCache;
    } else {
      const dupDb = getDupDb();
      const rteDb = getRteDb();

      // 1. Fetch base products from MongoDB PRODUCTS (read-only)
      const baseProducts = await dupDb.collection('PRODUCTS').find({}).toArray();

      // 2. Discover all active products and their coverages from COVERAGE-PACKAGE-DEFINITION (RTE)
      const rtePackageAgg = await rteDb.collection('COVERAGE-PACKAGE-DEFINITION').aggregate([
        { $unwind: '$coverages' },
        {
          $group: {
            _id: { product: '$product', coverageId: '$coverages.coverageId' },
            companyId: { $first: '$companyId' },
            branchId: { $first: '$branchId' }
          }
        },
        {
          $group: {
            _id: '$_id.product',
            companyId: { $first: '$companyId' },
            branchId: { $first: '$branchId' },
            coverages: { $addToSet: '$_id.coverageId' }
          }
        }
      ]).toArray();

      const rteProductMap = new Map();
      rtePackageAgg.forEach(p => {
        if (p._id && p._id > 0 && p._id !== 99999) {
          rteProductMap.set(Number(p._id), {
            productCode: Number(p._id),
            companyId: Number(p.companyId) || 15,
            branchId: Number(p.branchId) || 421,
            coverageIds: (p.coverages || []).sort((a, b) => a - b)
          });
        }
      });

      // 3. Process & enrich base products
      const processedProductCodes = new Set();
      const enrichedBaseProducts = baseProducts.map(p => {
        const prodCode = Number(p.productCode);
        processedProductCodes.add(prodCode);

        // Normalize legacy concatenated branch/company codes if detected
        let branchCode = p.branchCode;
        let legacyBranchCode = undefined;
        if (branchCode === 42111 || (branchCode > 1000 && String(branchCode).startsWith('421'))) {
          legacyBranchCode = branchCode;
          branchCode = 421;
        }

        let companyCode = p.companyCode;
        let legacyCompanyCode = undefined;
        if (companyCode === 151 || (companyCode > 100 && String(companyCode).startsWith('15'))) {
          legacyCompanyCode = companyCode;
          companyCode = 15;
        }

        // Branch and company names
        const branchName = (branchCode === 421) ? 'PLURIANUAL RENOVÁVEL (VIDA)' : (p.branchName || KNOWN_BRANCH_NAMES[branchCode] || 'GERAL');
        const companyName = (companyCode === 15) ? 'MAPFRE BRASIL' : (p.companyName || KNOWN_COMPANY_NAMES[companyCode] || 'MAPFRE SEGUROS');

        // Check if RTE packages have active coverages for this product
        let coverages = Array.isArray(p.coverages) ? [...p.coverages] : [];
        const rteInfo = rteProductMap.get(prodCode);

        if (rteInfo && rteInfo.coverageIds.length > 0) {
          // If product in PRODUCTS has fewer coverages than RTE (e.g. 42101 had only 1), enrich with all RTE coverages
          if (coverages.length < rteInfo.coverageIds.length || prodCode === 42101) {
            const existingCoverageMap = new Map(coverages.map(c => [c.coverageCode, c.coverageName]));
            coverages = rteInfo.coverageIds.map(cid => ({
              coverageCode: cid,
              coverageName: existingCoverageMap.get(cid) || VIDA_COVERAGE_NAMES[cid] || `Cobertura ${cid}`
            }));
          }
        }

        return {
          ...p,
          branchCode,
          branchName,
          companyCode,
          companyName,
          legacyBranchCode: legacyBranchCode || p.legacyBranchCode,
          legacyCompanyCode: legacyCompanyCode || p.legacyCompanyCode,
          coverages,
          source: (rteInfo || prodCode === 42101) ? 'ACDC_OPERATIONAL' : (p.source || 'CATALOG')
        };
      });

      // 4. Dynamically synthesize any product from RTE that does NOT exist in PRODUCTS
      const synthesizedProducts = [];
      for (const [prodCode, rteInfo] of rteProductMap.entries()) {
        if (!processedProductCodes.has(prodCode)) {
          // Only synthesize valid operational products
          const branchCode = (rteInfo.branchId === 400 && prodCode >= 42100 && prodCode < 43000) ? 421 : rteInfo.branchId;
          const companyCode = (rteInfo.companyId === 155 || rteInfo.companyId === 151) ? 15 : rteInfo.companyId;

          const branchName = KNOWN_BRANCH_NAMES[branchCode] || `RAMO ${branchCode}`;
          const companyName = KNOWN_COMPANY_NAMES[companyCode] || `MAPFRE (${companyCode})`;
          const productName = KNOWN_PRODUCT_NAMES[prodCode] || `PRODUTO ${prodCode}`;

          const coverages = rteInfo.coverageIds.map(cid => ({
            coverageCode: cid,
            coverageName: VIDA_COVERAGE_NAMES[cid] || `Cobertura ${cid}`
          }));

          synthesizedProducts.push({
            _id: `BRA-${companyCode}-${branchCode}-${prodCode}`,
            countryCode: 'BRA',
            companyCode,
            companyName,
            branchCode,
            branchName,
            productCode: prodCode,
            productName,
            riskPrimeCalc: true,
            source: 'ACDC_OPERATIONAL',
            coverages,
            _class: 'com.mapfre.tron.rating.core.model.peca.ProductCatalog'
          });
        }
      }

      unifiedProducts = [...enrichedBaseProducts, ...synthesizedProducts];

      // Sort stably by branchCode, then productCode
      unifiedProducts.sort((a, b) => {
        if (a.branchCode !== b.branchCode) return (a.branchCode || 0) - (b.branchCode || 0);
        return (a.productCode || 0) - (b.productCode || 0);
      });

      // Store in memory cache
      catalogCache = unifiedProducts;
      lastCacheTime = now;
    }

    // 5. Apply query filters dynamically
    let filtered = unifiedProducts;

    if (country) {
      const cUpper = String(country).toUpperCase();
      filtered = filtered.filter(p => p.countryCode === cUpper);
    }

    if (branch !== undefined && branch !== null && branch !== '') {
      const bNum = Number(branch);
      filtered = filtered.filter(p =>
        p.branchCode === bNum ||
        p.legacyBranchCode === bNum ||
        (bNum === 421 && (p.branchCode === 42111 || p.legacyBranchCode === 42111))
      );
    }

    if (company !== undefined && company !== null && company !== '') {
      const cNum = Number(company);
      filtered = filtered.filter(p =>
        p.companyCode === cNum ||
        p.legacyCompanyCode === cNum ||
        (cNum === 15 && (p.companyCode === 151 || p.legacyCompanyCode === 151))
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dup/products (Create new product with audit log)
router.post('/products', requireEditPermission('products'), async (req, res) => {
  try {
    const {
      countryCode,
      companyCode = 1,
      companyName = 'MAPFRE SEGUROS',
      branchCode,
      branchName,
      productCode,
      productName,
      riskPrimeCalc = true,
      coverages = []
    } = req.body;

    if (!countryCode || !branchCode || !productCode || !productName) {
      return res.status(400).json({ error: 'País, Ramo, Código do Produto e Nome são obrigatórios.' });
    }

    const db = getDupDb();
    const customId = `${countryCode}-${companyCode}-${branchCode}-${productCode}`;

    const newProduct = {
      _id: customId,
      countryCode: countryCode.toUpperCase().trim(),
      companyCode: Number(companyCode),
      companyName: companyName.trim(),
      branchCode: Number(branchCode),
      branchName: branchName ? branchName.trim() : 'GERAL',
      productCode: Number(productCode),
      productName: productName.trim(),
      riskPrimeCalc: Boolean(riskPrimeCalc),
      coverages: Array.isArray(coverages) ? coverages : [],
      creationDate: new Date(),
      creationUser: req.user.email,
      _class: 'com.mapfre.psypd.core.model.Product'
    };

    await db.collection('PRODUCTS').insertOne(newProduct);

    // Register in AUDIT_CHANGELOG and PECA
    const rteDb = getRteDb();
    await rteDb.collection('AUDIT_CHANGELOG').insertOne({
      timestamp: new Date(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userIp: req.ip || '127.0.0.1',
      entity: 'PRODUCTS',
      entityId: customId,
      productName: productName.trim(),
      action: 'CREATE',
      createdPayload: newProduct
    });

    await rteDb.collection('PECA').insertOne({
      nuuma: req.user.email,
      entity: 'PRODUCT CREATION',
      entityId: `${customId}: ${productName}`,
      accessType: 'CREATE',
      accessDate: new Date(),
      originIp: req.ip || '127.0.0.1',
      denied: false,
      _class: 'com.mapfre.tron.rating.core.model.peca.Peca'
    });

    res.status(201).json({ message: 'Produto criado com sucesso!', product: newProduct });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dup/products/:id (Edit product and coverages with audit log)
router.put('/products/:id', requireEditPermission('products'), async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, branchName, branchCode, countryCode, riskPrimeCalc, coverages } = req.body;

    const db = getDupDb();
    const { ObjectId } = await import('mongodb');

    let query = { _id: id };
    try {
      query = { $or: [{ _id: id }, { _id: new ObjectId(id) }] };
    } catch (e) {
      query = { _id: id };
    }

    const currentProd = await db.collection('PRODUCTS').findOne(query);
    if (!currentProd) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const updateDoc = {
      $set: {
        productName: productName !== undefined ? productName.trim() : currentProd.productName,
        branchName: branchName !== undefined ? branchName.trim() : currentProd.branchName,
        branchCode: branchCode !== undefined ? Number(branchCode) : currentProd.branchCode,
        countryCode: countryCode !== undefined ? countryCode.toUpperCase().trim() : currentProd.countryCode,
        riskPrimeCalc: riskPrimeCalc !== undefined ? Boolean(riskPrimeCalc) : currentProd.riskPrimeCalc,
        coverages: Array.isArray(coverages) ? coverages : currentProd.coverages,
        modificationDate: new Date(),
        modifiedBy: req.user.email
      }
    };

    await db.collection('PRODUCTS').updateOne(query, updateDoc);

    // Register in AUDIT_CHANGELOG
    const rteDb = getRteDb();
    await rteDb.collection('AUDIT_CHANGELOG').insertOne({
      timestamp: new Date(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userIp: req.ip || '127.0.0.1',
      entity: 'PRODUCTS',
      entityId: String(currentProd._id),
      productName: productName || currentProd.productName,
      action: 'UPDATE',
      changes: {
        productName: { old: currentProd.productName, new: productName },
        branchName: { old: currentProd.branchName, new: branchName },
        countryCode: { old: currentProd.countryCode, new: countryCode },
        coverages: { old: currentProd.coverages, new: coverages }
      }
    });

    res.json({ message: 'Produto atualizado e auditoria registrada com sucesso!' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dup/rules (Underwriting Business Rules: AdjustPrime, NoReturnPrice, ReturnCode)
router.get('/rules', async (req, res) => {
  try {
    const db = getDupDb();
    const { status, country } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (country) filter['branch.countryCode'] = country;

    const rules = await db.collection('RULES').find(filter).toArray();
    const historyCount = await db.collection('RULES_HISTORY').countDocuments();

    res.json({
      total: rules.length,
      historyCount,
      rules
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dup/rules (Create new underwriting rule with audit log)
router.post('/rules', requireEditPermission('rules'), async (req, res) => {
  try {
    const {
      name,
      description,
      countryCode = 'BRA',
      companyCode = 1,
      branchCode = 231,
      status = 'PROD',
      lossRatio = '0.8',
      adjustmentMargin = '0',
      actionType = 'AdjustPrimeAction',
      conditions = []
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome da regra é obrigatório.' });
    }

    const db = getDupDb();
    const count = await db.collection('RULES').countDocuments();
    const newRuleId = String(count + 1);

    const newRule = {
      _id: {
        _id: newRuleId,
        version: 1
      },
      name: name.trim(),
      description: description ? description.trim() : '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      status: status.toUpperCase(),
      branch: {
        countryCode: countryCode.toUpperCase().trim(),
        companyCode: Number(companyCode),
        branchCode: Number(branchCode)
      },
      lossRatio: String(lossRatio),
      adjustmentMargin: String(adjustmentMargin),
      action: {
        condition: Array.isArray(conditions) ? conditions : [],
        _class: `com.mapfre.psypd.core.model.${actionType}`
      },
      creationUser: req.user.email,
      creationDate: new Date(),
      _class: 'com.mapfre.psypd.core.model.Rule'
    };

    await db.collection('RULES').insertOne(newRule);

    // Register in AUDIT_CHANGELOG and PECA
    const rteDb = getRteDb();
    await rteDb.collection('AUDIT_CHANGELOG').insertOne({
      timestamp: new Date(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userIp: req.ip || '127.0.0.1',
      entity: 'RULES',
      entityId: `Regra #${newRuleId}`,
      ruleName: name.trim(),
      action: 'CREATE',
      createdPayload: newRule,
      changes: {
        title: { old: null, new: name.trim() },
        status: { old: null, new: status },
        lossRatio: { old: null, new: lossRatio }
      }
    });

    await rteDb.collection('PECA').insertOne({
      nuuma: req.user.email,
      entity: 'UNDERWRITING RULE CREATION',
      entityId: `Regra #${newRuleId}: ${name.trim()}`,
      accessType: 'CREATE',
      accessDate: new Date(),
      originIp: req.ip || '127.0.0.1',
      denied: false,
      _class: 'com.mapfre.tron.rating.core.model.peca.Peca'
    });

    res.status(201).json({ message: 'Regra criada com sucesso!', rule: newRule });
  } catch (err) {
    console.error('Error creating rule:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dup/rules/:id (Edit underwriting rule with audit log)
router.put('/rules/:id', requireEditPermission('rules'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      countryCode,
      companyCode,
      branchCode,
      status,
      lossRatio,
      adjustmentMargin,
      actionType,
      conditions
    } = req.body;

    const db = getDupDb();

    let query = {
      $or: [
        { '_id._id': String(id) },
        { _id: id }
      ]
    };
    if (ObjectId.isValid(id)) {
      query.$or.push({ _id: new ObjectId(id) });
    }

    const oldRule = await db.collection('RULES').findOne(query);
    if (!oldRule) {
      return res.status(404).json({ error: 'Regra de subscrição não encontrada.' });
    }

    const newName = name !== undefined ? name.trim() : oldRule.name;
    const newDesc = description !== undefined ? description.trim() : oldRule.description;
    const newStatus = status !== undefined ? status.toUpperCase().trim() : oldRule.status;
    const newLossRatio = lossRatio !== undefined ? String(lossRatio) : oldRule.lossRatio;
    const newMargin = adjustmentMargin !== undefined ? String(adjustmentMargin) : oldRule.adjustmentMargin;

    const newBranch = {
      countryCode: countryCode ? countryCode.toUpperCase().trim() : (oldRule.branch?.countryCode || 'BRA'),
      companyCode: companyCode !== undefined ? Number(companyCode) : (oldRule.branch?.companyCode || 1),
      branchCode: branchCode !== undefined ? Number(branchCode) : (oldRule.branch?.branchCode || 231)
    };

    const newActionClass = actionType ? `com.mapfre.psypd.core.model.${actionType}` : (oldRule.action?._class || 'com.mapfre.psypd.core.model.AdjustPrimeAction');
    const newConditions = Array.isArray(conditions) ? conditions : (oldRule.action?.condition || []);

    const updateDoc = {
      $set: {
        name: newName,
        description: newDesc,
        status: newStatus,
        lossRatio: newLossRatio,
        adjustmentMargin: newMargin,
        branch: newBranch,
        'action._class': newActionClass,
        'action.condition': newConditions,
        lastUpdateDate: new Date(),
        lastUpdateUser: req.user.email
      }
    };

    await db.collection('RULES').updateOne(query, updateDoc);

    // Calculate changes for audit
    const changes = {};
    if (oldRule.name !== newName) changes.name = { old: oldRule.name, new: newName };
    if (oldRule.description !== newDesc) changes.description = { old: oldRule.description, new: newDesc };
    if (oldRule.status !== newStatus) changes.status = { old: oldRule.status, new: newStatus };
    if (oldRule.lossRatio !== newLossRatio) changes.lossRatio = { old: oldRule.lossRatio, new: newLossRatio };
    if (oldRule.adjustmentMargin !== newMargin) changes.adjustmentMargin = { old: oldRule.adjustmentMargin, new: newMargin };
    if (oldRule.branch?.countryCode !== newBranch.countryCode) changes.country = { old: oldRule.branch?.countryCode, new: newBranch.countryCode };
    if (oldRule.branch?.branchCode !== newBranch.branchCode) changes.branchCode = { old: oldRule.branch?.branchCode, new: newBranch.branchCode };
    if (JSON.stringify(oldRule.action?.condition) !== JSON.stringify(newConditions)) {
      changes.conditions = { old: oldRule.action?.condition || [], new: newConditions };
    }

    const ruleIdDisplay = oldRule._id?._id || id;
    const rteDb = getRteDb();
    await rteDb.collection('AUDIT_CHANGELOG').insertOne({
      timestamp: new Date(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userIp: req.ip || '127.0.0.1',
      entity: 'RULES',
      entityId: `Regra #${ruleIdDisplay}`,
      ruleName: newName,
      action: 'UPDATE',
      changes
    });

    await rteDb.collection('PECA').insertOne({
      nuuma: req.user.email,
      entity: 'UNDERWRITING RULE UPDATE',
      entityId: `Regra #${ruleIdDisplay}: ${newName}`,
      accessType: 'UPDATE',
      accessDate: new Date(),
      originIp: req.ip || '127.0.0.1',
      denied: false,
      _class: 'com.mapfre.tron.rating.core.model.peca.Peca'
    });

    res.json({ message: 'Regra de subscrição atualizada e auditoria registrada com sucesso!' });
  } catch (err) {
    console.error('Error updating underwriting rule:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dup/risk-rules (Risk Selection RS-RULES with linked process rules)
router.get('/risk-rules', async (req, res) => {
  try {
    const db = getDupDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search;

    const filter = {};
    if (search) {
      if (!isNaN(search)) {
        filter.$or = [
          { rule_id: Number(search) },
          { rule_name: { $regex: search, $options: 'i' } }
        ];
      } else {
        filter.rule_name = { $regex: search, $options: 'i' };
      }
    }

    const total = await db.collection('RS-RULES').countDocuments(filter);
    const rules = await db.collection('RS-RULES')
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Fetch matching process rules for these rule_ids
    const ruleIds = rules.map(r => r.rule_id);
    const processRules = await db.collection('RS-PROCESS-RULES')
      .find({ rule_id: { $in: ruleIds } })
      .toArray();

    const processRulesMap = {};
    for (const pr of processRules) {
      if (!processRulesMap[pr.rule_id]) {
        processRulesMap[pr.rule_id] = [];
      }
      processRulesMap[pr.rule_id].push(pr);
    }

    const enrichedRules = rules.map(r => ({
      ...r,
      processRules: processRulesMap[r.rule_id] || []
    }));

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      rules: enrichedRules
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dup/risk-rules/:id (Edit risk selection rule with audit log)
router.put('/risk-rules/:id', requireEditPermission('rules'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rule_name, active, conditions, company } = req.body;

    const db = getDupDb();

    let query = {
      $or: [
        { rule_id: Number(id) || -1 },
        { _id: id }
      ]
    };
    if (ObjectId.isValid(id)) {
      query.$or.push({ _id: new ObjectId(id) });
    }

    const oldRule = await db.collection('RS-RULES').findOne(query);
    if (!oldRule) {
      return res.status(404).json({ error: 'Regra de seleção de risco não encontrada.' });
    }

    const newRuleName = rule_name !== undefined ? rule_name.trim() : oldRule.rule_name;
    const newActive = active !== undefined ? active : oldRule.active;
    const newCompany = company !== undefined ? Number(company) : oldRule.company;
    const newConditions = Array.isArray(conditions) ? conditions : (oldRule.conditions || []);

    const updateDoc = {
      $set: {
        rule_name: newRuleName,
        active: newActive,
        company: newCompany,
        conditions: newConditions,
        last_updated: new Date(),
        updated_by: req.user.email
      }
    };

    await db.collection('RS-RULES').updateOne(query, updateDoc);

    // Calculate changes for audit
    const changes = {};
    if (oldRule.rule_name !== newRuleName) changes.rule_name = { old: oldRule.rule_name, new: newRuleName };
    if (oldRule.active !== newActive) changes.active = { old: oldRule.active, new: newActive };
    if (oldRule.company !== newCompany) changes.company = { old: oldRule.company, new: newCompany };
    if (JSON.stringify(oldRule.conditions) !== JSON.stringify(newConditions)) {
      changes.conditions = { old: oldRule.conditions || [], new: newConditions };
    }

    const ruleIdDisplay = oldRule.rule_id || id;
    const rteDb = getRteDb();
    await rteDb.collection('AUDIT_CHANGELOG').insertOne({
      timestamp: new Date(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userIp: req.ip || '127.0.0.1',
      entity: 'RS-RULES',
      entityId: `Regra #${ruleIdDisplay}`,
      ruleName: newRuleName,
      action: 'UPDATE',
      changes
    });

    await rteDb.collection('PECA').insertOne({
      nuuma: req.user.email,
      entity: 'RISK SELECTION RULE UPDATE',
      entityId: `Regra #${ruleIdDisplay}: ${newRuleName}`,
      accessType: 'UPDATE',
      accessDate: new Date(),
      originIp: req.ip || '127.0.0.1',
      denied: false,
      _class: 'com.mapfre.tron.rating.core.model.peca.Peca'
    });

    res.json({ message: 'Regra de seleção de risco atualizada e auditoria registrada com sucesso!' });
  } catch (err) {
    console.error('Error updating risk selection rule:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dup/triangulation
router.get('/triangulation', async (req, res) => {
  try {
    const db = getDupDb();
    const keys = await db.collection('TRIANGULATION_KEYS').find({}).toArray();
    const branchConfigs = await db.collection('BRANCH_CONFIGURATION').find({}).toArray();
    res.json({
      keys,
      branchConfigs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dup/policies (Sample / paginated)
router.get('/policies', async (req, res) => {
  try {
    const db = getDupDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const search = req.query.search;

    const filter = {};
    if (search) {
      filter.$or = [
        { policyNumber: { $regex: search, $options: 'i' } },
        { 'holder.name': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await db.collection('POLICIES').countDocuments(filter);
    const policies = await db.collection('POLICIES')
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      policies
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dup/rules-actions-conditions (DUP Master Rules Engine - 101k+ rules)
router.get('/rules-actions-conditions', async (req, res) => {
  try {
    const db = getDupDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { step, actionType, search, product, branch } = req.query;

    const filter = {};
    if (step !== undefined && step !== '' && step !== 'ALL') {
      filter.process_step = Number(step);
    }
    if (actionType && actionType !== 'ALL') {
      filter['actions.type'] = actionType;
    }
    if (product) {
      filter.product = Number(product);
    }
    if (branch) {
      filter.branch = Number(branch);
    }

    if (search) {
      if (!isNaN(search)) {
        filter.$or = [
          { rule_id: Number(search) },
          { rule_name: { $regex: search, $options: 'i' } }
        ];
      } else {
        filter.$or = [
          { rule_name: { $regex: search, $options: 'i' } },
          { 'conditions.factor': { $regex: search, $options: 'i' } },
          { 'actions.message': { $regex: search, $options: 'i' } }
        ];
      }
    }

    const total = await db.collection('RS-RULES-ACTIONS-CONDITIONS').countDocuments(filter);
    const rules = await db.collection('RS-RULES-ACTIONS-CONDITIONS')
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Map friendly names for process steps
    const stepLabels = {
      0: 'Dados Gerais / Raiz',
      1: 'FIXED_DATA (Dados Fixos)',
      2: 'VARIABLE_DATA_POLICY (Variáveis de Política)',
      3: 'BENEFICIARY (Beneficiários & Tomador)',
      4: 'VARIABLE_DATA_RISK (Variáveis do Risco)',
      5: 'OBJETO_ASEGURADO (Objeto Segurado)',
      6: 'COVERAGE (Coberturas & Capitais)',
      8: 'CONTROLS (Controles Técnicos Finais)',
      9: 'DOCUMENTOS (Validação de Documentos)',
      11: 'RISK_SELECTION_FORM (Questionários de Saúde)'
    };

    const enriched = rules.map(r => ({
      ...r,
      stepLabel: stepLabels[r.process_step] || `Passo ${r.process_step}`,
      conditionsCount: Array.isArray(r.conditions) ? r.conditions.length : 0,
      actionsCount: Array.isArray(r.actions) ? r.actions.length : 0
    }));

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      rules: enriched
    });
  } catch (err) {
    console.error('Error fetching RS-RULES-ACTIONS-CONDITIONS:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dup/rules-actions-conditions/:id (Detail single rule)
router.get('/rules-actions-conditions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDupDb();

    let query = { _id: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { _id: new ObjectId(id) }] };
    }

    const rule = await db.collection('RS-RULES-ACTIONS-CONDITIONS').findOne(query);
    if (!rule) {
      return res.status(404).json({ error: 'Regra DUP não encontrada.' });
    }

    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

