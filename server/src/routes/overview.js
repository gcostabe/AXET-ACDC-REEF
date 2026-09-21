import { Router } from 'express';
import { getDupDb, getRteDb } from '../db.js';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const dupDb = getDupDb();
    const rteDb = getRteDb();

    const dupColls = await dupDb.listCollections().toArray();
    const rteColls = await rteDb.listCollections().toArray();

    const dupStats = await Promise.all(
      dupColls.map(async (c) => ({
        name: c.name,
        count: await dupDb.collection(c.name).estimatedDocumentCount().catch(() => 0)
      }))
    );

    const rteStats = await Promise.all(
      rteColls.map(async (c) => ({
        name: c.name,
        count: await rteDb.collection(c.name).estimatedDocumentCount().catch(() => 0)
      }))
    );

    const dupTotalDocs = dupStats.reduce((acc, curr) => acc + curr.count, 0);
    const rteTotalDocs = rteStats.reduce((acc, curr) => acc + curr.count, 0);

    // Quick insights
    const countries = await dupDb.collection('COUNTRY_CONFIGURATION').find({}).toArray();
    const productsCount = await dupDb.collection('PRODUCTS').countDocuments();
    const rulesCount = await dupDb.collection('RULES').countDocuments();
    const rsRulesCount = await dupDb.collection('RS-RULES').countDocuments();
    const formulasCount = await rteDb.collection('FORMULA-DEFINITION').countDocuments();
    const companiesCount = await rteDb.collection('COMPANIES').countDocuments();
    const pecaLogsCount = await rteDb.collection('PECA').countDocuments();

    res.json({
      environment: 'br-int (Brasil Integração)',
      system: 'ACDC - Advanced Calculation & Decision Core',
      summary: {
        totalDatabases: 2,
        totalCollections: dupStats.length + rteStats.length,
        totalDocuments: dupTotalDocs + rteTotalDocs,
        dup: {
          name: 'acdc_dup_br-int',
          description: 'Dynamic Underwriting & Pricing (Subscrição & Risco)',
          collectionsCount: dupStats.length,
          documentsCount: dupTotalDocs,
          collections: dupStats.sort((a, b) => b.count - a.count)
        },
        rte: {
          name: 'acdc_rte_br-int',
          description: 'Rating Engine (Motor de Tarifação Tronador)',
          collectionsCount: rteStats.length,
          documentsCount: rteTotalDocs,
          collections: rteStats.sort((a, b) => b.count - a.count)
        }
      },
      keyMetrics: {
        products: productsCount,
        businessRules: rulesCount,
        riskSelectionRules: rsRulesCount,
        ratingFormulas: formulasCount,
        companies: companiesCount,
        auditLogs: pecaLogsCount,
        countries: countries.map(c => c._id)
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
