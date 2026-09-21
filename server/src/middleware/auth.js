import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'acdc_mapfre_secret_key_2026';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Autenticação necessária. Faça login para continuar.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Sessão inválida ou expirada.' });
    }
    req.user = user;
    next();
  });
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso restrito. Somente administradores podem acessar esta funcionalidade.' });
    }
    next();
  });
}

export function requireEditPermission(screen) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (req.user.role === 'ADMIN') {
        return next();
      }
      if (req.user.permissions?.canEdit && req.user.permissions.canEdit[screen]) {
        return next();
      }
      return res.status(403).json({ error: `Você tem permissão apenas de leitura na tela de ${screen}.` });
    });
  };
}
