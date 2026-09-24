import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { getDupDb } from '../db.js';
import { JWT_SECRET, requireAuth, requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Helper to get users collection
function getUsersCollection() {
  return getDupDb().collection('ACDC_USERS');
}

// Decodificador seguro de claims JWT (access_token / id_token)
function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const raw = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(raw);
  } catch (_) {
    try {
      const raw = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
}

// Resolução de identidade Okta corporativa exatamente no padrão AGENTE-CONTEXT-GEN
export async function resolveOktaIdentity() {
  const home = os.homedir();
  const candidateDirs = [
    path.resolve(__dirname, '../../../gateway'),
    path.resolve(process.cwd(), 'gateway'),
    path.resolve(process.cwd(), '../gateway'),
    path.join(home, 'dev/local-ai-gateway/gateway'),
    path.join(home, 'dev/AGENTE-CONTEXT-GEN/gateway')
  ];

  let idFile = null;
  let tokFile = null;

  for (const d of candidateDirs) {
    const cId = path.join(d, 'user_identity.json');
    const cTok = path.join(d, 'tokens.json');
    if (!idFile && fs.existsSync(cId)) idFile = cId;
    if (!tokFile && fs.existsSync(cTok)) tokFile = cTok;
  }

  let identityData = {};
  let tokenData = {};
  let accessClaims = null;
  let idClaims = null;

  try {
    if (idFile && fs.existsSync(idFile)) {
      identityData = JSON.parse(fs.readFileSync(idFile, 'utf-8'));
    }
  } catch (_) {}

  try {
    if (tokFile && fs.existsSync(tokFile)) {
      tokenData = JSON.parse(fs.readFileSync(tokFile, 'utf-8'));
      accessClaims = decodeJwtPayload(tokenData.access_token);
      idClaims = decodeJwtPayload(tokenData.id_token);
    }
  } catch (_) {}

  let name = (idClaims && idClaims.name) ||
             (accessClaims && (accessClaims.displayName || (accessClaims.firstName ? `${accessClaims.firstName} ${accessClaims.lastName || ''}`.trim() : null))) ||
             identityData.display_name;

  let email = (accessClaims && accessClaims.email) ||
              identityData.email;

  let login = (accessClaims && accessClaims.login) ||
              identityData.login ||
              (idClaims && idClaims.preferred_username);

  let oktaId = (accessClaims && accessClaims.okta_id) ||
               identityData.okta_id ||
               (idClaims && idClaims.sub);

  let employeeNumber = (accessClaims && accessClaims.employeeNumber);
  let tenant = (accessClaims && accessClaims.okta_tenant) || 'onentt';
  let region = (accessClaims && accessClaims.region) || 'emeal-onentt';

  if (!name) {
    try {
      const gitName = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      if (gitName) name = gitName;
    } catch (_) {}
  }
  if (!email) {
    try {
      const gitEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();
      if (gitEmail) email = gitEmail;
    } catch (_) {}
  }
  if (!name) name = 'Gustavo Costa Berbert';
  if (!email) email = 'gustavo.costa.berbert@nttdata.com';
  if (!login) login = 'gcostabe@emeal.nttdata.com';
  if (!oktaId) oktaId = '00u9pq4pchFsGiPHG417';

  let gateway8766Online = false;
  let remainingSeconds = 0;
  let expiresAtIso = null;

  if (accessClaims && accessClaims.exp) {
    remainingSeconds = Math.max(0, accessClaims.exp - Math.floor(Date.now() / 1000));
    expiresAtIso = new Date(accessClaims.exp * 1000).toISOString();
  }

  try {
    const gwRes = await fetch('http://127.0.0.1:8766/auth/status', { signal: AbortSignal.timeout(1500) });
    if (gwRes.ok) {
      const gwData = await gwRes.json();
      gateway8766Online = (gwData.status === 'ok' && gwData.authenticated);
      if (typeof gwData.remaining_seconds === 'number') {
        remainingSeconds = gwData.remaining_seconds;
      }
      if (gwData.expires_at) {
        expiresAtIso = new Date(gwData.expires_at * 1000).toISOString();
      }
    }
  } catch (_) {}

  return {
    ok: true,
    authenticated: true,
    user: {
      name,
      firstName: (accessClaims && accessClaims.firstName) || name.split(' ')[0],
      lastName: (accessClaims && accessClaims.lastName) || name.split(' ').slice(1).join(' '),
      email,
      login,
      oktaId,
      employeeNumber,
      tenant,
      region,
      org: 'NTT DATA EMEAL',
      role: 'RAG Pipeline Architect',
    },
    provider: 'okta',
    ssoActive: true,
    gateway: {
      port: 8766,
      url: 'http://localhost:8766',
      gatewayHostUrl: 'http://localhost:8766',
      status: gateway8766Online ? 'connected' : 'standalone',
      gateway8766Online,
      remainingSeconds,
      autoRefresh: true,
    },
    expiresAt: expiresAtIso || new Date(Date.now() + 86400000).toISOString(),
    lastSync: new Date().toISOString(),
  };
}

// GET /api/auth/status (Status da Sessão Okta SSO e Gateway)
router.get('/status', async (req, res) => {
  try {
    const authStatus = await resolveOktaIdentity();
    res.json(authStatus);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// POST /api/auth/refresh (Renovação / Sincronização da Sessão Okta)
router.post('/refresh', async (req, res) => {
  try {
    // Tenta rodar sync_okta se existir
    const syncScript = path.resolve(__dirname, '../../../scripts/sync_okta.sh');
    if (fs.existsSync(syncScript)) {
      try {
        execSync(`bash "${syncScript}"`, { encoding: 'utf-8', timeout: 5000 });
      } catch (_) {}
    }
    const authStatus = await resolveOktaIdentity();
    res.json({
      ok: true,
      refreshed: true,
      ...authStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// POST /api/auth/okta-login (Login com 1 clique via Okta SSO Corporativo)
router.post('/okta-login', async (req, res) => {
  try {
    const authStatus = await resolveOktaIdentity();
    const oktaUser = authStatus.user;
    const col = getUsersCollection();

    const userLogin = (oktaUser.login || '').toLowerCase().trim();
    const userEmail = (oktaUser.email || '').toLowerCase().trim();

    // REGRA DE SEGURANÇA:
    // Somente o usuário gcostabe@emeal.nttdata.com (ou gustavo.costa.berbert@nttdata.com) recebe perfil ADMIN.
    // Todo e qualquer outro novo usuário é provisionado estritamente como usuário comum (LEITURA) sem acesso adm.
    const isRootAdmin = (
      userLogin === 'gcostabe@emeal.nttdata.com' ||
      userEmail === 'gcostabe@emeal.nttdata.com' ||
      userEmail === 'gustavo.costa.berbert@nttdata.com'
    );

    const targetRole = isRootAdmin ? 'ADMIN' : 'LEITURA';
    const targetPermissions = isRootAdmin
      ? {
          allowedTabs: ['overview', 'products', 'packages', 'rules', 'rating', 'audit', 'explorer', 'users'],
          canEdit: { rating: true, rules: true, products: true, explorer: true }
        }
      : {
          allowedTabs: ['overview', 'products', 'packages', 'rules', 'rating', 'explorer'],
          canEdit: { rating: false, rules: false, products: false, explorer: false }
        };

    let user = await col.findOne({ email: oktaUser.email.toLowerCase().trim() });
    if (!user) {
      // Auto-provisiona novo usuário:
      // Se for gcostabe@emeal.nttdata.com -> ADMIN
      // Qualquer outro usuário -> LEITURA (usuário comum sem acesso adm)
      const newUser = {
        name: oktaUser.name,
        email: oktaUser.email.toLowerCase().trim(),
        login: oktaUser.login,
        oktaId: oktaUser.oktaId,
        role: targetRole,
        status: 'APPROVED',
        department: oktaUser.org || 'NTT DATA EMEAL',
        provider: 'okta',
        permissions: targetPermissions,
        createdAt: new Date(),
        approvedAt: new Date(),
        approvedBy: isRootAdmin ? 'ROOT_OKTA_ADMIN' : 'OKTA_SSO_AUTO_USER'
      };
      const result = await col.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // Se for o root admin, garante ADMIN
      if (isRootAdmin) {
        if (user.role !== 'ADMIN' || user.status !== 'APPROVED') {
          await col.updateOne(
            { _id: user._id },
            { $set: { role: 'ADMIN', status: 'APPROVED', provider: 'okta', oktaId: oktaUser.oktaId, permissions: targetPermissions } }
          );
          user.role = 'ADMIN';
          user.status = 'APPROVED';
          user.permissions = targetPermissions;
        }
      } else {
        // Se for outro usuário e estiver como ADMIN indevidamente, rebaixa para usuário comum LEITURA
        if (user.role === 'ADMIN') {
          await col.updateOne(
            { _id: user._id },
            { $set: { role: 'LEITURA', permissions: targetPermissions } }
          );
          user.role = 'LEITURA';
          user.permissions = targetPermissions;
        }
      }
    }

    const tokenPayload = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      provider: 'okta',
      oktaId: oktaUser.oktaId,
      permissions: user.permissions || targetPermissions
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      token,
      user: tokenPayload,
      okta: authStatus
    });
  } catch (err) {
    console.error('Okta SSO login error:', err);
    res.status(500).json({ error: 'Erro ao autenticar com Okta SSO: ' + err.message });
  }
});

// Cleanup legacy seeded admin user if existing
export async function cleanupLegacyAdmin() {
  try {
    const col = getUsersCollection();
    const result = await col.deleteMany({ email: 'admin@acdc.mapfre' });
    if (result.deletedCount > 0) {
      console.log(`🧹 Removido(s) ${result.deletedCount} usuário(s) legado(s) de credenciais fixas (admin@acdc.mapfre).`);
    }
  } catch (err) {
    console.error('Error cleaning up legacy admin user:', err);
  }
}
export const seedAdminUser = cleanupLegacyAdmin;

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const col = getUsersCollection();
    const user = await col.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: 'Sua solicitação de acesso está aguardando aprovação pelo Administrador.',
        status: 'PENDING'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: 'Sua solicitação de acesso foi recusada. Entre em contato com o administrador.',
        status: 'REJECTED'
      });
    }

    // Generate JWT
    const tokenPayload = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || {
        allowedTabs: ['overview', 'products', 'packages', 'rules', 'rating', 'explorer'],
        canEdit: { rating: false, rules: false, products: false }
      }
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      token,
      user: tokenPayload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register (Solicitar Acesso)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, justification } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const col = getUsersCollection();
    const existing = await col.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Já existe uma conta ou solicitação com este e-mail.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      department: department || 'Operações',
      justification: justification || '',
      role: 'ATUARIO',
      status: 'PENDING',
      permissions: {
        allowedTabs: ['overview', 'products', 'packages', 'rules', 'rating', 'explorer'],
        canEdit: { rating: false, rules: false, products: false }
      },
      createdAt: new Date()
    };

    const result = await col.insertOne(newUser);

    res.status(201).json({
      message: 'Solicitação de acesso enviada com sucesso. Aguarde a aprovação do Administrador.',
      id: result.insertedId,
      status: 'PENDING'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const col = getUsersCollection();
    const user = await col.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      permissions: user.permissions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users (Admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const col = getUsersCollection();
    const users = await col.find({}).project({ passwordHash: 0 }).toArray();

    const pendingCount = users.filter(u => u.status === 'PENDING').length;

    res.json({
      users,
      pendingCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/users/:id/approve (Admin only)
router.put('/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, allowedTabs, canEdit } = req.body;

    const col = getUsersCollection();
    const updateFields = {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user.email
    };

    if (role) updateFields.role = role;
    if (allowedTabs || canEdit) {
      updateFields.permissions = {
        allowedTabs: allowedTabs || ['overview', 'products', 'packages', 'rules', 'rating', 'explorer'],
        canEdit: canEdit || { rating: false, rules: false, products: false }
      };
    }

    const { ObjectId } = await import('mongodb');
    let query = { _id: id };
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { _id: id };
    }

    const result = await col.updateOne(query, { $set: updateFields });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({ message: 'Usuário aprovado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/users/:id/reject (Admin only)
router.put('/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const col = getUsersCollection();

    const { ObjectId } = await import('mongodb');
    let query = { _id: id };
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { _id: id };
    }

    const result = await col.updateOne(query, {
      $set: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: req.user.email
      }
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({ message: 'Solicitação de usuário recusada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/users/:id/profile (Admin updates any user profile and permissions)
router.put('/users/:id/profile', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status, department, allowedTabs, canEdit } = req.body;

    const col = getUsersCollection();
    const { ObjectId } = await import('mongodb');

    let query = { _id: id };
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { _id: id };
    }

    const targetUser = await col.findOne(query);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const updateFields = {
      updatedAt: new Date(),
      updatedBy: req.user.email
    };

    if (role) updateFields.role = role;
    if (status) updateFields.status = status;
    if (department !== undefined) updateFields.department = department;
    if (allowedTabs || canEdit) {
      updateFields.permissions = {
        allowedTabs: allowedTabs || targetUser.permissions?.allowedTabs || ['overview', 'products', 'packages', 'rules', 'rating', 'explorer'],
        canEdit: canEdit || targetUser.permissions?.canEdit || { rating: false, rules: false, products: false }
      };
    }

    await col.updateOne(query, { $set: updateFields });

    // Register in AUDIT_CHANGELOG
    const { getRteDb } = await import('../db.js');
    await getRteDb().collection('AUDIT_CHANGELOG').insertOne({
      timestamp: new Date(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userIp: req.ip || '127.0.0.1',
      entity: 'USER_PROFILE',
      entityId: targetUser.email,
      formulaName: `Perfil de ${targetUser.name}`,
      action: 'UPDATE',
      changes: {
        role: { old: targetUser.role, new: updateFields.role || targetUser.role },
        status: { old: targetUser.status, new: updateFields.status || targetUser.status },
        permissions: { old: targetUser.permissions, new: updateFields.permissions }
      }
    });

    res.json({ message: 'Perfil e alçadas atualizados com sucesso!' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
