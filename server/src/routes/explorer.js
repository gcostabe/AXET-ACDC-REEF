import { Router } from 'express';
import { getDupDb, getRteDb } from '../db.js';

const router = Router();

// Helper to extract flattened field keys from sample documents
function extractDocumentFields(sampleDocs) {
  const keysMap = new Map();

  for (const doc of sampleDocs) {
    for (const [k, v] of Object.entries(doc)) {
      if (k === '_class') continue;
      if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        // Flatten 1 level of nested object
        for (const [subK, subV] of Object.entries(v)) {
          if (subK.startsWith('$')) continue;
          const fullKey = `${k}.${subK}`;
          const type = Array.isArray(subV) ? 'array' : typeof subV;
          if (!keysMap.has(fullKey)) {
            keysMap.set(fullKey, type);
          }
        }
      } else {
        const type = Array.isArray(v) ? 'array' : typeof v;
        if (!keysMap.has(k)) {
          keysMap.set(k, type);
        }
      }
    }
  }

  return keysMap;
}

// GET /api/explorer/collections
router.get('/collections', async (req, res) => {
  try {
    const dupDb = getDupDb();
    const rteDb = getRteDb();

    const dupColls = await dupDb.listCollections().toArray();
    const rteColls = await rteDb.listCollections().toArray();

    const dupList = await Promise.all(
      dupColls.map(async (c) => ({
        db: 'dup',
        dbName: 'acdc_dup_br-int',
        collection: c.name,
        count: await dupDb.collection(c.name).estimatedDocumentCount().catch(() => 0)
      }))
    );

    const rteList = await Promise.all(
      rteColls.map(async (c) => ({
        db: 'rte',
        dbName: 'acdc_rte_br-int',
        collection: c.name,
        count: await rteDb.collection(c.name).estimatedDocumentCount().catch(() => 0)
      }))
    );

    res.json({
      dup: dupList.sort((a, b) => a.collection.localeCompare(b.collection)),
      rte: rteList.sort((a, b) => a.collection.localeCompare(b.collection))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/explorer/fields/:dbType/:collName (Inspect schema/field keys of collection)
router.get('/fields/:dbType/:collName', async (req, res) => {
  try {
    const { dbType, collName } = req.params;
    const db = dbType === 'rte' ? getRteDb() : getDupDb();
    const collection = db.collection(collName);

    const sample = await collection.find({}).limit(10).toArray();
    const keysMap = extractDocumentFields(sample);

    const fields = Array.from(keysMap.entries()).map(([key, type]) => ({ key, type }));
    res.json({ fields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/explorer/data/:dbType/:collName (Universal Dynamic Search & Pagination)
router.get('/data/:dbType/:collName', async (req, res) => {
  try {
    const { dbType, collName } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const search = req.query.search ? req.query.search.trim() : '';
    const field = req.query.field ? req.query.field.trim() : '';

    const db = dbType === 'rte' ? getRteDb() : getDupDb();
    const collection = db.collection(collName);

    let filter = {};

    if (search) {
      const isNum = !isNaN(search) && search !== '';
      const numVal = isNum ? Number(search) : null;

      if (field && field !== 'ALL') {
        // Specific field search
        if (field === '_id') {
          const { ObjectId } = await import('mongodb');
          let idQuery = { _id: search };
          try {
            idQuery = { $or: [{ _id: search }, { _id: new ObjectId(search) }] };
          } catch (e) {
            idQuery = { _id: search };
          }
          filter = idQuery;
        } else if (isNum) {
          filter = {
            $or: [
              { [field]: numVal },
              { [field]: { $regex: search, $options: 'i' } }
            ]
          };
        } else {
          filter = { [field]: { $regex: search, $options: 'i' } };
        }
      } else {
        // Dynamic search across all fields of sample documents
        const sampleDocs = await collection.find({}).limit(5).toArray();
        const keysMap = extractDocumentFields(sampleDocs);
        const orConditions = [];

        // Always check _id
        orConditions.push({ _id: search });
        try {
          const { ObjectId } = await import('mongodb');
          orConditions.push({ _id: new ObjectId(search) });
        } catch (e) {}

        for (const [key, type] of keysMap.entries()) {
          if (type === 'string') {
            orConditions.push({ [key]: { $regex: search, $options: 'i' } });
          } else if (isNum && (type === 'number' || type === 'string')) {
            orConditions.push({ [key]: numVal });
          }
        }

        if (orConditions.length > 0) {
          filter = { $or: orConditions };
        }
      }
    }

    const total = await collection.countDocuments(filter).catch(async () => {
      return await collection.estimatedDocumentCount().catch(() => 0);
    });

    const docs = await collection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      dbType,
      collName,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      documents: docs
    });
  } catch (err) {
    console.error('Explorer query error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
