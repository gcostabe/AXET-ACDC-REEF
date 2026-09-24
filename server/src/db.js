import { MongoClient } from 'mongodb';
import {
  getActiveEnvironment,
  getEnvironmentById,
  setActiveEnvironmentId,
  updateEnvironmentStatus,
  maskMongoUri
} from './services/environmentService.js';

let client = null;
let activeConfig = null;
let isConnected = false;
let connectionStatus = 'DISCONNECTED';
let connectionError = null;

export async function connectDB() {
  activeConfig = getActiveEnvironment(false);
  const targetUri = activeConfig?.uri || process.env.MONGO_URI || 'mongodb://localhost:27017';

  try {
    if (client) {
      await client.close().catch(() => {});
    }

    client = new MongoClient(targetUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });

    await client.connect();
    isConnected = true;
    connectionStatus = 'CONNECTED';
    connectionError = null;

    updateEnvironmentStatus(activeConfig.id, 'OK', { latencyMs: 5 });
    console.log(`✅ Conectado ao MongoDB [${activeConfig.name}] em ${maskMongoUri(targetUri)}`);
    return client;
  } catch (err) {
    console.error(`❌ Falha ao conectar ao ambiente [${activeConfig.name}]:`, err.message);
    updateEnvironmentStatus(activeConfig.id, 'ERROR', { error: err.message });

    // Fallback para Local se o ambiente com falha for remoto
    if (activeConfig.id !== 'env-local') {
      console.warn('⚠️ Tentando fallback automático para o MongoDB Local (Docker)...');
      try {
        const localConfig = getEnvironmentById('env-local');
        const fallbackUri = localConfig?.uri || 'mongodb://localhost:27017';

        client = new MongoClient(fallbackUri, {
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000
        });

        await client.connect();
        activeConfig = localConfig;
        isConnected = true;
        connectionStatus = 'CONNECTED_FALLBACK';
        connectionError = `Falha na conexão primária. Usando fallback Local: ${err.message}`;
        console.log(`✅ Fallback bem-sucedido: Conectado ao MongoDB Local em ${fallbackUri}`);
        return client;
      } catch (fallbackErr) {
        console.error('❌ Falha também na conexão com o MongoDB Local:', fallbackErr.message);
      }
    }

    isConnected = false;
    connectionStatus = 'ERROR';
    connectionError = err.message;
    throw err;
  }
}

export function getClient() {
  return client;
}

export function getDupDb() {
  if (!client) {
    throw new Error('Banco de dados MongoDB não conectado.');
  }
  const dbName = activeConfig?.dupDb || 'acdc_dup_br-int';
  return client.db(dbName);
}

export function getRteDb() {
  if (!client) {
    throw new Error('Banco de dados MongoDB não conectado.');
  }
  const dbName = activeConfig?.rteDb || 'acdc_rte_br-int';
  return client.db(dbName);
}

export async function testConnection(config) {
  const uri = config.uri;
  if (!uri) {
    return { ok: false, error: 'URI de conexão não fornecida.' };
  }

  const testClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 4000,
    connectTimeoutMS: 4000
  });

  const startTime = Date.now();
  try {
    await testClient.connect();
    const pingRes = await testClient.db('admin').command({ ping: 1 });
    const latencyMs = Date.now() - startTime;

    // Inspecionar bancos disponíveis se tiver permissão
    let databases = [];
    try {
      const adminDb = testClient.db('admin').admin();
      const dbList = await adminDb.listDatabases();
      databases = dbList.databases.map(d => d.name);
    } catch {
      // Alguns usuários com escopo restrito podem não ter permissão para listDatabases
      databases = [];
    }

    const dupDbName = config.dupDb || 'acdc_dup_br-int';
    const rteDbName = config.rteDb || 'acdc_rte_br-int';

    const hasDupDb = databases.length > 0 ? databases.includes(dupDbName) : null;
    const hasRteDb = databases.length > 0 ? databases.includes(rteDbName) : null;

    await testClient.close().catch(() => {});

    return {
      ok: true,
      latencyMs,
      ping: pingRes,
      databases,
      hasDupDb,
      hasRteDb,
      message: `Conexão bem-sucedida! Latência: ${latencyMs}ms.`
    };
  } catch (err) {
    await testClient.close().catch(() => {});
    return {
      ok: false,
      error: err.message,
      message: `Falha na conexão: ${err.message}`
    };
  }
}

export async function switchEnvironment(envId) {
  const targetEnv = getEnvironmentById(envId);
  if (!targetEnv) {
    throw new Error(`Ambiente com ID "${envId}" não encontrado.`);
  }

  // 1. Testa conectividade antes de fechar a atual
  const testRes = await testConnection(targetEnv);
  if (!testRes.ok) {
    updateEnvironmentStatus(envId, 'ERROR', { error: testRes.error });
    throw new Error(`Não foi possível ativar o ambiente "${targetEnv.name}": ${testRes.error}`);
  }

  // 2. Salva como ambiente ativo
  setActiveEnvironmentId(envId);
  activeConfig = targetEnv;

  // 3. Reconecta o client global
  if (client) {
    await client.close().catch(() => {});
  }

  client = new MongoClient(targetEnv.uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });

  await client.connect();
  isConnected = true;
  connectionStatus = 'CONNECTED';
  connectionError = null;

  updateEnvironmentStatus(envId, 'OK', { latencyMs: testRes.latencyMs });
  console.log(`🔄 Ambiente alternado com sucesso para [${targetEnv.name}] (${maskMongoUri(targetEnv.uri)})`);

  // 4. Garante existência do usuário administrador padrão no novo banco
  try {
    const { seedAdminUser } = await import('./routes/auth.js');
    await seedAdminUser();
  } catch (seedErr) {
    console.warn('Aviso ao inicializar admin no novo ambiente:', seedErr.message);
  }

  // 5. Atualiza índice vetorial RAG em background
  import('./services/ragService.js').then(({ buildAndIndexRag }) => {
    buildAndIndexRag().catch(ragErr => console.warn('RAG reindexing notice:', ragErr.message));
  }).catch(() => {});

  return {
    ok: true,
    activeEnvironment: getActiveEnvironment(true),
    latencyMs: testRes.latencyMs
  };
}

export function getConnectionStatus() {
  return {
    isConnected,
    status: connectionStatus,
    activeEnvironment: getActiveEnvironment(true),
    error: connectionError
  };
}

export { client };
