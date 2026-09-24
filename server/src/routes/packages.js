import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getRteDb, getDupDb } from '../db.js';
import { VIDA_COVERAGE_NAMES } from '../services/copilotTools.js';

const router = Router();

// Branch-aware coverage name resolver
async function resolveCoverageNames(coverages, branchId) {
  const branchMap = new Map();
  try {
    const dupDb = getDupDb();
    const prodCoverages = await dupDb.collection('PRODUCT_COVERAGES').find({
      'branch.branchCode': branchId
    }).toArray();
    for (const doc of prodCoverages) {
      if (Array.isArray(doc.coverages)) {
        for (const c of doc.coverages) {
          if (c.coverageCode && c.coverageName) {
            branchMap.set(Number(c.coverageCode), c.coverageName);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not load PRODUCT_COVERAGES:', err.message);
  }

  return (coverages || []).map(c => {
    const cid = c.coverageId || c.data?.coverageId;
    let name = null;
    if (branchId === 421) {
      name = VIDA_COVERAGE_NAMES[cid] || branchMap.get(Number(cid));
    } else {
      name = branchMap.get(Number(cid)) || VIDA_COVERAGE_NAMES[cid];
    }
    if (!name) name = `Cobertura ${cid}`;

    return {
      ...c,
      coverageId: cid,
      coverageName: name,
      data: c.data || {}
    };
  });
}

// GET /api/packages - Paginated list of coverage packages (MÓDULOS)
router.get('/', async (req, res) => {
  try {
    const db = getRteDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const { branch, product, company, search } = req.query;

    const filter = {};
    if (branch && branch !== 'ALL') filter.branchId = Number(branch);
    if (company && company !== 'ALL') filter.companyId = Number(company);

    if (product && product.trim() && product !== 'ALL') {
      const cleanProd = product.trim();
      if (!isNaN(cleanProd)) {
        const num = Number(cleanProd);
        // Match exact or prefix matching against distinct products
        const distinctProds = await db.collection('COVERAGE-PACKAGE-DEFINITION').distinct('product');
        const matches = distinctProds.filter(p => p === num || String(p).startsWith(cleanProd));
        if (matches.length === 1) {
          filter.product = matches[0];
        } else if (matches.length > 1) {
          filter.product = { $in: matches };
        } else {
          filter.product = num;
        }
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      if (!isNaN(s)) {
        filter.$or = [
          { product: Number(s) },
          { branchId: Number(s) },
          { preferenceId: Number(s) }
        ];
      } else {
        filter.$or = [
          { channel1: { $regex: s, $options: 'i' } },
          { userVal: { $regex: s, $options: 'i' } }
        ];
      }
    }

    const total = await db.collection('COVERAGE-PACKAGE-DEFINITION').countDocuments(filter);
    const packages = await db.collection('COVERAGE-PACKAGE-DEFINITION')
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Enrich with package names from COVERAGE-PACKAGE-NAME
    const preferenceIds = [...new Set(packages.map(p => p.preferenceId).filter(Boolean))];
    const names = await db.collection('COVERAGE-PACKAGE-NAME')
      .find({ preferenceNameId: { $in: preferenceIds } })
      .toArray();

    const nameMap = {};
    for (const n of names) {
      nameMap[n.preferenceNameId] = n.preferenceName;
    }

    const enriched = packages.map(pkg => ({
      ...pkg,
      preferenceName: nameMap[pkg.preferenceId] || `Pacote #${pkg.preferenceId}`,
      coveragesCount: Array.isArray(pkg.coverages) ? pkg.coverages.length : 0,
      rulesCount: Array.isArray(pkg.rules) ? pkg.rules.length : 0
    }));

    // Fetch distinct branchIds and products for filters
    const branches = await db.collection('COVERAGE-PACKAGE-DEFINITION').distinct('branchId');
    const products = await db.collection('COVERAGE-PACKAGE-DEFINITION').distinct('product');

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      branches: branches.sort((a, b) => a - b),
      products: products.sort((a, b) => a - b),
      packages: enriched
    });
  } catch (err) {
    console.error('Error fetching coverage packages:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/packages/:id - Detailed coverage package with rules, coverages & scenarios
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getRteDb();

    // Support both ObjectId and string _id
    let query = { _id: id };
    if (ObjectId.isValid(id)) {
      query = {
        $or: [
          { _id: new ObjectId(id) },
          { _id: id }
        ]
      };
    }

    const pkg = await db.collection('COVERAGE-PACKAGE-DEFINITION').findOne(query);
    if (!pkg) {
      return res.status(404).json({ error: 'Pacote de coberturas não encontrado.' });
    }

    let preferenceName = `Pacote #${pkg.preferenceId}`;
    if (pkg.preferenceId) {
      const nameDoc = await db.collection('COVERAGE-PACKAGE-NAME').findOne({ preferenceNameId: pkg.preferenceId });
      if (nameDoc?.preferenceName) {
        preferenceName = nameDoc.preferenceName;
      }
    }

    // Resolve coverage names with branch awareness
    const enrichedCoverages = await resolveCoverageNames(pkg.coverages || [], pkg.branchId);

    res.json({
      ...pkg,
      preferenceName,
      coverages: enrichedCoverages
    });
  } catch (err) {
    console.error('Error fetching package details:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
