import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDupDb } from '../db.js';
import { JWT_SECRET, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Helper to get users collection
function getUsersCollection() {
  return getDupDb().collection('ACDC_USERS');
}

// Seed default admin if not existing
export async function seedAdminUser() {
  try {
    const col = getUsersCollection();
    const admin = await col.findOne({ email: 'admin@acdc.mapfre' });
    if (!admin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await col.insertOne({
        name: 'Administrador do Sistema',
        email: 'admin@acdc.mapfre',
        passwordHash,
        role: 'ADMIN',
        status: 'APPROVED',
        department: 'Tecnologia & Atuária',
        permissions: {
          allowedTabs: ['overview', 'products', 'packages', 'rules', 'rating', 'audit', 'explorer', 'users'],
          canEdit: { rating: true, rules: true, products: true, explorer: true }
        },
        createdAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 'SYSTEM_BOOTSTRAP'
      });
      console.log('Seeded default admin: admin@acdc.mapfre / admin123');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
}

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
