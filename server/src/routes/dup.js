import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDupDb, getRteDb } from '../db.js';
import { requireEditPermission } from '../middleware/auth.js';

const router = Router();

// GET /api/dup/products
router.get('/products', async (req, res) => {
  try {
    const db = getDupDb();
    const { country, branch } = req.query;
    const filter = {};
    if (country) filter.countryCode = country;
    if (branch) filter.branchCode = Number(branch);

    const products = await db.collection('PRODUCTS').find(filter).toArray();
    res.json(products);
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

export default router;
