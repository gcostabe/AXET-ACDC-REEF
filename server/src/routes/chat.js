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

import { COPILOT_TOOLS, dispatchToolCall } from '../services/copilotTools.js';

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
DOCUMENTOS E DADOS REAIS RECUPERADOS DO RAG (MANUAIS & BANCO):
${retrievedContext.map((c, idx) => `
[FONTE ${idx + 1} - ${c.category} | Origem: ${c.sourceCollection} | Ref: ${c.title}]
${c.content}
`).join('\n---\n')}
`;
    }

    const systemPrompt = `Você é o "ACDC Copilot", o assistente virtual atuarial e de engenharia especialista na plataforma ACDC (Activo Digital de Cálculo) da MAPFRE & TRON, desenvolvido pela NTT DATA.
Sua missão é auxiliar subscritores, atuários, administradores e desenvolvedores a entenderem a arquitetura da solução, suas regras de negócio, pacotes de cobertura, fórmulas de cálculo, produtos e dados de configuração armazenados no MongoDB.

Conhecimento Oficial da Plataforma ACDC:
1. **ACDC (Activo Digital de Cálculo)**: Iniciativa de modernização para independizar o processo de análise técnica, regras de negócio e cálculo atuarial de apólices do sistema transacional legado (TRON / PL/SQL). Suporta orquestração batch (endpoint POST /acdc/orchestrator/policies/execute) e APIs online granulares.
2. **DUP (Data Update Process)**: Motor de subscrição e seleção de riscos. Opera em três modos (PREVIOUS, VALIDATION e TECHNICAL_CONTROL) sobre fatos canônicos. Avalia regras na coleção RS-RULES-ACTIONS-CONDITIONS com condições estruturadas V1 e expressões Janino V2.
3. **MÓDULOS (Coverage Packages)**: Serviço de montagem de ofertas comerciais e pacotes de coberturas na coleção COVERAGE-PACKAGE-DEFINITION (banco acdc_rte_br-int). O identificador do produto é o campo numérico "product" (ex: 42101, 42102, 42103, 23101), o ramo é "branchId" (numérico, ex: 421, 400, 231) e a companhia é "companyId" (numérico, ex: 15). O array de coberturas é "coverages" com elementos contendo "coverageId" (numérico, ex: 4003).
4. **RTE (Rating Engine / Core Engine)**: Motor matemático e atuarial de tarifação (FORMULA-DEFINITION, CONSTANT-DEFINITION, BREAKDOWN-CONCEPTS).

FERRAMENTAS CONSULTIVAS AO VIVO (READ-ONLY TOOLS):
Você dispõe de ferramentas de consulta em tempo real ao MongoDB:
- \`inspect_coverage_packages\`: Consulta a coleção COVERAGE-PACKAGE-DEFINITION (no banco acdc_rte_br-int) para buscar pacotes de coberturas por produto (ex: 42101, 42102, 42103), ramo ou companhia. Retorna contagem de pacotes, lista consolidada de todas as coberturas ativas, obrigatoriedades e capitais máximos.
- \`inspect_rules_by_story\`: Diagnostica regras na coleção RS-RULES-ACTIONS-CONDITIONS por código de história contido no rule_name (ex: "13218").
- \`aggregate_rule_coverages\`: Agrupa condições de regras por cobertura (ex: coverages.40XX.capital) calculando contagens exatas.
- \`query_mongodb_readonly\`: Executa consultas estritamente de leitura (find, countDocuments, aggregate) nas coleções autorizadas.

POLÍTICA ESTRITA DE SEGURANÇA E SOMENTE-LEITURA:
- Você é um assistente ESTRITAMENTE CONSULTIVO (Read-Only). Você NÃO possui ferramentas para alterar, atualizar, deletar ou inserir dados no banco de dados.
- Quando o usuário solicitar uma alteração ou atualização no banco (ex: "atualize o process_field para VALIDACION_<cobertura> para a história 13218"):
  1. Use suas ferramentas consultivas para consultar o banco em tempo real e levantar TODOS os números exatos e coberturas.
  2. Apresente uma tabela rica com o diagnóstico completo (quantas regras foram encontradas, quantas coberturas existem, contagens por cobertura).
  3. Apresente um exemplo de "Antes" e "Depois" da alteração sugerida.
  4. Deixe claro que, por segurança de auditoria, seu perfil é de consulta e gere o script/código pronto para que o desenvolvedor ou DBA execute com segurança.

${contextBlock ? contextBlock : 'Nota: Utilize seu conhecimento geral sobre seguros, cálculos atuariais TRON e a arquitetura do ACDC caso a busca RAG não encontre documentos específicos.'}

Diretrizes de Resposta:
- Seja prestativo, altamente técnico, claro e direto em Português.
- Quando citar constantes ou fórmulas do banco, mencione seus códigos exatos.
- Formate a resposta em Markdown rico com tabelas para contagens e comparações.`;

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

    const toolsUsed = [];

    // First call to AI Gateway with tools
    let aiRes = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        tools: COPILOT_TOOLS,
        tool_choice: 'auto',
        max_tokens: 1500
      })
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI Gateway error in chat (Turn 1):', errText);
      throw new Error(`AI Gateway retornou status ${aiRes.status}: ${errText}`);
    }

    let aiData = await aiRes.json();
    let choice = aiData.choices?.[0];
    let assistantMessage = choice?.message;

    let iterations = 0;
    const maxIterations = 2;

    while (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < maxIterations) {
      iterations++;
      console.log(`🤖 Modelo solicitou ${assistantMessage.tool_calls.length} ferramenta(s) (Iteração ${iterations}).`);
      
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const fnName = toolCall.function?.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(toolCall.function?.arguments || '{}');
        } catch (e) {
          console.warn('Erro ao parsear argumentos da tool:', toolCall.function?.arguments);
        }

        const toolResult = await dispatchToolCall(fnName, fnArgs);
        toolsUsed.push({
          tool: fnName,
          args: fnArgs,
          status: toolResult.status,
          executionTimeMs: toolResult.executionTimeMs
        });

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: fnName,
          content: JSON.stringify(toolResult)
        });
      }

      // Next call: on last iteration omit tools so the LLM is forced to generate the final text answer
      const isFinal = iterations >= maxIterations;
      const followUpPayload = {
        model,
        messages,
        max_tokens: 2500
      };
      if (!isFinal) {
        followUpPayload.tools = COPILOT_TOOLS;
        followUpPayload.tool_choice = 'auto';
      }

      aiRes = await fetch(AI_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpPayload)
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error(`AI Gateway error in chat (Turn ${iterations + 1} after tools):`, errText);
        throw new Error(`AI Gateway retornou status ${aiRes.status} no fechamento da tool: ${errText}`);
      }

      aiData = await aiRes.json();
      choice = aiData.choices?.[0];
      assistantMessage = choice?.message;
    }

    const answer = assistantMessage?.content || 'Não foi possível gerar uma resposta no momento.';

    res.json({
      answer,
      modelUsed: model,
      sources,
      toolsUsed,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar mensagem no assistente virtual.' });
  }
});

export default router;
