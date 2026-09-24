import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { authenticateToken } from './middleware/auth.js';
import authRoutes, { seedAdminUser } from './routes/auth.js';
import overviewRoutes from './routes/overview.js';
import dupRoutes from './routes/dup.js';
import rteRoutes from './routes/rte.js';
import auditRoutes from './routes/audit.js';
import explorerRoutes from './routes/explorer.js';
import chatRoutes from './routes/chat.js';
import packagesRoutes from './routes/packages.js';
import environmentsRoutes from './routes/environments.js';
import aiGatewayRoutes from './routes/aiGateway.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(authenticateToken);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/environments', environmentsRoutes);
app.use('/api/admin/gateway', aiGatewayRoutes);
app.use('/api', overviewRoutes);
app.use('/api/dup', dupRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/rte', rteRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/chat', chatRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await connectDB();
    await seedAdminUser();
    
    // Asynchronously initialize and index RAG Knowledge Base from MongoDB
    import('./services/ragService.js').then(({ buildAndIndexRag }) => {
      buildAndIndexRag().catch(err => console.error('RAG initial indexing error:', err));
    }).catch(console.error);

    app.listen(PORT, () => {
      console.log(`🚀 ACDC Insurance API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
