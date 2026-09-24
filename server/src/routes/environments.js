import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  getAllEnvironments,
  getEnvironmentById,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  getActiveEnvironment
} from '../services/environmentService.js';
import {
  testConnection,
  switchEnvironment,
  getConnectionStatus
} from '../db.js';

const router = Router();

// Todos os endpoints são restritos a ADMIN
router.use(requireAdmin);

// GET /api/admin/environments - Listar todos os ambientes e status
router.get('/', (req, res) => {
  try {
    const data = getAllEnvironments(true);
    const connStatus = getConnectionStatus();
    res.json({
      ...data,
      connectionStatus: connStatus
    });
  } catch (err) {
    console.error('Erro ao listar ambientes:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/environments/status - Status da conexão ativa
router.get('/status', (req, res) => {
  try {
    const connStatus = getConnectionStatus();
    res.json(connStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/environments - Criar novo ambiente
router.post('/', (req, res) => {
  try {
    const { name, type, uri, dupDb, rteDb, description } = req.body;
    if (!name || !uri) {
      return res.status(400).json({ error: 'Nome do ambiente e URI de conexão MongoDB são obrigatórios.' });
    }

    const created = createEnvironment({ name, type, uri, dupDb, rteDb, description });
    res.status(201).json(created);
  } catch (err) {
    console.error('Erro ao cadastrar ambiente:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/admin/environments/:id - Atualizar ambiente
router.put('/:id', (req, res) => {
  try {
    const { name, type, uri, dupDb, rteDb, description } = req.body;
    const updated = updateEnvironment(req.params.id, { name, type, uri, dupDb, rteDb, description });
    res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar ambiente:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/environments/:id - Excluir ambiente
router.delete('/:id', (req, res) => {
  try {
    const result = deleteEnvironment(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao excluir ambiente:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/environments/test - Testar conexão com um MongoDB
router.post('/test', async (req, res) => {
  try {
    let { uri, dupDb, rteDb, id } = req.body;

    // Se passou id mas uri estiver vazia ou mascarada, recupera a URI real salva
    if (id && (!uri || uri.includes('******'))) {
      const saved = getEnvironmentById(id);
      if (saved) {
        uri = saved.uri;
        dupDb = dupDb || saved.dupDb;
        rteDb = rteDb || saved.rteDb;
      }
    }

    if (!uri) {
      return res.status(400).json({ ok: false, error: 'URI de conexão não informada.' });
    }

    const result = await testConnection({ uri, dupDb, rteDb });
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/admin/environments/:id/activate - Ativar ambiente em runtime
router.post('/:id/activate', async (req, res) => {
  try {
    const result = await switchEnvironment(req.params.id);
    res.json(result);
  } catch (err) {
    console.error(`Erro ao ativar ambiente ${req.params.id}:`, err);
    res.status(400).json({ ok: false, error: err.message });
  }
});

export default router;
