import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

const GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://127.0.0.1:8766';

// GET /api/admin/gateway/status - Status completo do AI Gateway e Token Okta
router.get('/status', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    let healthData = null;
    let authData = null;
    let modelsData = [];
    let isOnline = false;

    try {
      // 1. Inspecionar /health
      const healthRes = await fetch(`${GATEWAY_URL}/health`, { signal: controller.signal });
      if (healthRes.ok) {
        healthData = await healthRes.json();
        isOnline = true;
      }
    } catch (err) {
      clearTimeout(timeout);
      return res.json({
        online: false,
        host: GATEWAY_URL,
        error: `Local AI Gateway inacessível em ${GATEWAY_URL}. Verifique se o container 'acdc-ai-gateway' ou 'python3 gateway/local_ai_gateway.py' está rodando.`,
        health: null,
        auth: null,
        models: []
      });
    }

    // 2. Inspecionar /auth/status
    try {
      const authRes = await fetch(`${GATEWAY_URL}/auth/status`, { signal: controller.signal });
      if (authRes.ok) {
        authData = await authRes.json();
      }
    } catch (err) {
      console.warn('Erro ao obter auth status do gateway:', err.message);
    }

    // 3. Inspecionar modelos disponíveis
    try {
      const modelsRes = await fetch(`${GATEWAY_URL}/codex/v1/models`, { signal: controller.signal });
      if (modelsRes.ok) {
        const json = await modelsRes.json();
        modelsData = json.data || [];
      }
    } catch (err) {
      console.warn('Erro ao obter modelos do gateway:', err.message);
    }

    clearTimeout(timeout);

    res.json({
      online: isOnline,
      host: GATEWAY_URL,
      health: healthData,
      auth: authData,
      models: modelsData,
      activeModel: 'gpt-5.6-terra-high',
      error: null
    });
  } catch (err) {
    console.error('Erro na rota /status do gateway:', err);
    res.status(500).json({
      online: false,
      host: GATEWAY_URL,
      error: err.message
    });
  }
});

// POST /api/admin/gateway/test-llm - Testar inferência atuarial rápida via AXET
router.post('/test-llm', async (req, res) => {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const testPayload = {
      model: 'gpt-5.6-terra-high',
      messages: [
        {
          role: 'system',
          content: 'Você é o motor de auditoria atuarial da plataforma ACDC MAPFRE.'
        },
        {
          role: 'user',
          content: 'Confirme em uma única linha concisa: status da conexão, modelo ativo e prontidão para tarifação RTE.'
        }
      ],
      max_tokens: 60
    };

    const upstreamRes = await fetch(`${GATEWAY_URL}/codex/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text().catch(() => '');
      return res.status(upstreamRes.status).json({
        ok: false,
        latencyMs,
        error: `Falha no AXET Gateway (${upstreamRes.status}): ${errorText.substring(0, 300)}`
      });
    }

    const data = await upstreamRes.json();
    const reply = data.choices?.[0]?.message?.content || 'Resposta recebida com sucesso.';

    res.json({
      ok: true,
      latencyMs,
      model: 'gpt-5.6-terra-high',
      reply,
      usage: data.usage || null
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error('Erro ao testar LLM:', err);
    res.status(500).json({
      ok: false,
      latencyMs,
      error: err.name === 'AbortError' ? 'Tempo limite esgotado (timeout de 12s) aguardando o AXET.' : err.message
    });
  }
});

export default router;
