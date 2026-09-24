import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '../../data/environments.json');

const DEFAULT_LOCAL = {
  id: 'env-local',
  name: 'Local (Docker)',
  type: 'local',
  uri: 'mongodb://localhost:27017',
  dupDb: 'acdc_dup_br-int',
  rteDb: 'acdc_rte_br-int',
  isDefault: true,
  description: 'MongoDB Community Server 7.0 rodando localmente via Docker na porta 27017.',
  createdAt: new Date().toISOString(),
  lastTestedAt: null,
  lastStatus: 'OK'
};

function ensureConfigFile() {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    const initialData = {
      activeEnvironmentId: 'env-local',
      environments: [DEFAULT_LOCAL]
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.environments || !Array.isArray(parsed.environments)) {
      throw new Error('Formato inválido de environments.json');
    }
    return parsed;
  } catch (err) {
    console.error('Erro ao ler environments.json, redefinindo para padrão:', err);
    const initialData = {
      activeEnvironmentId: 'env-local',
      environments: [DEFAULT_LOCAL]
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveConfig(data) {
  ensureConfigFile();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function maskMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return uri;
  try {
    // Regex for masking credentials in mongodb:// or mongodb+srv://
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, '$1******$3');
  } catch {
    return uri;
  }
}

export function getAllEnvironments(maskSecrets = true) {
  const config = ensureConfigFile();
  const envs = config.environments.map(env => {
    if (maskSecrets) {
      return {
        ...env,
        maskedUri: maskMongoUri(env.uri)
      };
    }
    return env;
  });

  return {
    activeEnvironmentId: config.activeEnvironmentId,
    environments: envs
  };
}

export function getEnvironmentById(id) {
  const config = ensureConfigFile();
  return config.environments.find(e => e.id === id) || null;
}

export function getActiveEnvironment(maskSecrets = false) {
  const config = ensureConfigFile();
  let active = config.environments.find(e => e.id === config.activeEnvironmentId);
  if (!active) {
    active = config.environments.find(e => e.id === 'env-local') || DEFAULT_LOCAL;
  }

  if (maskSecrets) {
    return {
      ...active,
      maskedUri: maskMongoUri(active.uri)
    };
  }
  return active;
}

export function setActiveEnvironmentId(id) {
  const config = ensureConfigFile();
  const exists = config.environments.some(e => e.id === id);
  if (!exists) {
    throw new Error(`Ambiente com ID "${id}" não encontrado.`);
  }
  config.activeEnvironmentId = id;
  saveConfig(config);
  return getActiveEnvironment();
}

export function createEnvironment(envData) {
  const config = ensureConfigFile();

  if (!envData.name || !envData.uri) {
    throw new Error('Nome do ambiente e URI de conexão MongoDB são obrigatórios.');
  }

  const id = `env-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newEnv = {
    id,
    name: envData.name.trim(),
    type: envData.type || 'remote', // 'local' | 'remote' | 'cloud'
    uri: envData.uri.trim(),
    dupDb: (envData.dupDb || 'acdc_dup_br-int').trim(),
    rteDb: (envData.rteDb || 'acdc_rte_br-int').trim(),
    isDefault: false,
    description: envData.description ? envData.description.trim() : '',
    createdAt: new Date().toISOString(),
    lastTestedAt: null,
    lastStatus: 'PENDING'
  };

  config.environments.push(newEnv);
  saveConfig(config);

  return newEnv;
}

export function updateEnvironment(id, envData) {
  const config = ensureConfigFile();
  const index = config.environments.findIndex(e => e.id === id);
  if (index === -1) {
    throw new Error(`Ambiente "${id}" não encontrado.`);
  }

  const existing = config.environments[index];

  // Preserve uri if empty or masked string is sent back
  let finalUri = existing.uri;
  if (envData.uri && !envData.uri.includes('******')) {
    finalUri = envData.uri.trim();
  }

  config.environments[index] = {
    ...existing,
    name: envData.name ? envData.name.trim() : existing.name,
    type: envData.type || existing.type,
    uri: finalUri,
    dupDb: envData.dupDb ? envData.dupDb.trim() : existing.dupDb,
    rteDb: envData.rteDb ? envData.rteDb.trim() : existing.rteDb,
    description: envData.description !== undefined ? envData.description.trim() : existing.description,
    updatedAt: new Date().toISOString()
  };

  saveConfig(config);
  return config.environments[index];
}

export function deleteEnvironment(id) {
  const config = ensureConfigFile();
  const target = config.environments.find(e => e.id === id);
  if (!target) {
    throw new Error(`Ambiente "${id}" não encontrado.`);
  }

  if (target.isDefault || target.id === 'env-local') {
    throw new Error('O ambiente padrão Local (Docker) não pode ser excluído.');
  }

  if (config.activeEnvironmentId === id) {
    throw new Error('Não é possível excluir o ambiente que está atualmente ativo. Ative outro ambiente primeiro.');
  }

  config.environments = config.environments.filter(e => e.id !== id);
  saveConfig(config);
  return { success: true };
}

export function updateEnvironmentStatus(id, status, testResult = {}) {
  const config = ensureConfigFile();
  const env = config.environments.find(e => e.id === id);
  if (env) {
    env.lastTestedAt = new Date().toISOString();
    env.lastStatus = status; // 'OK' | 'ERROR'
    if (testResult.latencyMs !== undefined) {
      env.latencyMs = testResult.latencyMs;
    }
    if (testResult.error) {
      env.lastError = testResult.error;
    } else {
      delete env.lastError;
    }
    saveConfig(config);
  }
}
