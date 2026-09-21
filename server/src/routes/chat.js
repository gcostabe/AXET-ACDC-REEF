import express from 'express';

const router = express.Router();

const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://127.0.0.1:8766/codex/v1/chat/completions';

// In-memory or fallback status while RAG service is loading
let ragStatus = {
  ready: false,
  documentCount: 0,
  lastIndexedAt: null,
  isIndexing: false
};

// Update status helper
export function updateRagStatus(newStatus) {
  ragStatus = { ...ragStatus, ...newStatus };
}

export function getRagStatus() {
  return ragStatus;
}

// GET /api/chat/rag-status
router.get('/rag-status', (req, res) => {
  res.json(ragStatus);
});

// POST /api/chat/reindex
router.post('/reindex', async (req, res) => {
  try {
    const { buildAndIndexRag } = await import('../services/ragService.js');
    // Run in background and respond
    buildAndIndexRag(true).catch(err => console.error('Error in reindex:', err));
    res.json({ message: 'Processo de reindexação RAG iniciado com sucesso.', status: 'IN_PROGRESS' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { 
      message, 
      conversationHistory = [], 
      model = 'gpt-5.6-terra-high' 
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem do usuário é obrigatória.' });
    }

    // Call RAG retrieval if available
    let retrievedContext = [];
    let sources = [];

    try {
      const { searchRagKnowledge } = await import('../services/ragService.js');
      if (typeof searchRagKnowledge === 'function') {
        const ragResults = await searchRagKnowledge(message, 6);
        if (ragResults && ragResults.length > 0) {
          retrievedContext = ragResults;
          sources = ragResults.map(item => ({
            id: item.id,
            title: item.title,
            category: item.category,
            sourceCollection: item.sourceCollection,
            score: item.score
          }));
        }
      }
    } catch (ragErr) {
      console.warn('RAG service not fully ready yet or searching failed:', ragErr.message);
    }

    // Construct system prompt
    let contextBlock = '';
    if (retrievedContext.length > 0) {
      contextBlock = `
DOCUMENTOS E DADOS REAIS RECUPERADOS DO BANCO DE DADOS MONGODB (RAG):
${retrievedContext.map((c, idx) => `
[FONTE ${idx + 1} - ${c.category} | Coleção: ${c.sourceCollection} | Ref: ${c.title}]
${c.content}
`).join('\n---\n')}
`;
    }

    const systemPrompt = `Você é o "ACDC Copilot", o assistente virtual atuarial especialista na plataforma ACDC Insurance (MAPFRE & Tronador), desenvolvido pela NTT DATA.
Sua missão é auxiliar subscritores, atuários, administradores e analistas de risco a entenderem o sistema, suas regras, fórmulas de cálculo, produtos, parâmetros e dados armazenados no MongoDB.

Conhecimento Base da Plataforma:
1. **DUP (Decisor Único de Produtos)**: Módulo de subscrição e seleção de risco. Gerencia regras de aceitação de risco (coleções RULES, RS-RULES), catálogo de produtos de seguros (Auto, Vida, Residencial), coberturas e chaves de triangulação antifraude.
2. **RTE (Rating Engine - Tronador)**: Motor matemático e atuarial de tarifação. Executa fórmulas de prêmio (coleção FORMULA-DEFINITION), busca constantes de cálculo (coleção CONSTANT-DEFINITION), calcula comissões, resseguro e impostos.
3. **PECA (Painel de Auditoria & Trilha de Segurança)**: Rastreia todas as alterações efetuadas em fórmulas, produtos e regras, gravando valor anterior, valor novo, IP, usuário e validação por IA.
4. **Perfil e Acesso**: Sistema com papéis de Administrador (ADMIN), Atuário (ATUARIO), Subscritor (SUBSCRIBER) e Visualizador (VIEWER).

${contextBlock ? contextBlock : 'Nota: Utilize seu conhecimento geral sobre seguros, cálculos atuariais Tronador e a arquitetura descrita caso a busca RAG não encontre documentos específicos.'}

Diretrizes de Resposta:
- Seja prestativo, altamente técnico, claro e direto em Português.
- Quando citar constantes ou fórmulas do banco, mencione seus códigos exatos (ex: MMATH.f_cte('PCT_MGS_160') = 0.1, [BASE_CALCULO], PRIMA_CEDIDA_RE_160).
- Se houver fontes recuperadas no contexto acima, baseie-se estritamente nelas e cite os nomes das coleções e títulos das regras/fórmulas.
- Use formatação markdown rica: tópicos, tabelas, código ou fórmulas destacadas quando apropriado.`;

    // Build messages payload for AI Gateway
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Append conversation history (limited to last 8 messages for context efficiency)
    const recentHistory = conversationHistory.slice(-8);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call local AI Gateway
    const aiRes = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1500
      })
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI Gateway error in chat:', errText);
      throw new Error(`AI Gateway retornou status ${aiRes.status}: ${errText}`);
    }

    const aiData = await aiRes.json();
    const answer = aiData.choices?.[0]?.message?.content || 'Não foi possível gerar uma resposta no momento.';

    res.json({
      answer,
      modelUsed: model,
      sources,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar mensagem no assistente virtual.' });
  }
});

export default router;
