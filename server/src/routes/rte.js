import { Router } from 'express';
import { getRteDb } from '../db.js';
import { requireAdmin, requireEditPermission, authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/rte/formulas
router.get('/formulas', async (req, res) => {
  try {
    const db = getRteDb();
    const { search, company } = req.query;
    const filter = {};
    if (company) filter.cmpVal = Number(company);
    if (search) {
      filter.$or = [
        { fomVal: { $regex: search, $options: 'i' } },
        { fomNam: { $regex: search, $options: 'i' } },
        { 'details.fomValVal': { $regex: search, $options: 'i' } }
      ];
    }

    const formulas = await db.collection('FORMULA-DEFINITION').find(filter).toArray();
    res.json(formulas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rte/dictionary (Catalog of variables, constants and functions)
router.get('/dictionary', async (req, res) => {
  try {
    const db = getRteDb();

    // 1. Fetch all constants from CONSTANT-DEFINITION
    const constDocs = await db.collection('CONSTANT-DEFINITION').find({}).toArray();
    const constantsMap = {};

    const constDescriptions = {
      'PCT_MGS_160': { desc: 'Margem de Gastos de Subscrição / Solvência aplicada ao ramo/desglose 160', category: 'Margem & Solvência' },
      'PCT_GI_160': { desc: 'Percentual de Gastos Indiretos e Despesas Administrativas para o ramo 160', category: 'Despesas & Custos' },
      'PCT_CO_160': { desc: 'Percentual de Comissão de Operação e Comercialização para o ramo 160', category: 'Comissão' },
      'PCT_RE_160': { desc: 'Percentual de Cessão de Resseguro Contratual para o ramo 160', category: 'Resseguro' },
      'PCT_CC_160': { desc: 'Percentual de Custo de Capital da Operação para o ramo 160', category: 'Custos Financeiros' },
      'PCT_GA_160': { desc: 'Percentual de Gastos de Aquisição para o ramo 160', category: 'Aquisição' },
      'PCT_GD_160': { desc: 'Percentual de Gastos Diretos de Emissão para o ramo 160', category: 'Despesas & Custos' },
      'PCT_IPS_160': { desc: 'Percentual do Imposto sobre Prêmios de Seguros (IPS)', category: 'Tributos' },
      'PCT_FRONTING_FEE': { desc: 'Taxa percentual de Fronting Fee cobrada pela emissão da apólice', category: 'Taxas Administrativas' },
      'PCT_MAX_COMIS_AGENTE': { desc: 'Percentual máximo permitido de comissão a ser pago ao corretor/agente', category: 'Comissão' },
      'EDAD_MAXIMA_ASEGURADO': { desc: 'Idade máxima estipulada para aceitação do segurado na apólice', category: 'Regras de Aceitação' },
      'PCT_BENEFICIO_MAS_COMISION': { desc: 'Percentual somado de margem de lucro (benefício) e comissão', category: 'Margem Comercial' },
      'PCT_GA_150': { desc: 'Percentual de Gastos de Aquisição para o ramo 150', category: 'Aquisição' },
      'PCT_RE_150': { desc: 'Percentual de Cessão de Resseguro para o ramo 150', category: 'Resseguro' },
      'PCT_TASA_CC_110': { desc: 'Taxa de Custo de Capital para o ramo 110', category: 'Custos Financeiros' },
      'PCT_TASA_CO_110': { desc: 'Taxa de Comissão de Operação para o ramo 110', category: 'Comissão' },
      'PCT_TASA_GA_110': { desc: 'Taxa de Gastos de Aquisição para o ramo 110', category: 'Aquisição' },
      'PCT_TASA_GI_110': { desc: 'Taxa de Gastos Indiretos para o ramo 110', category: 'Despesas & Custos' },
      'PCT_TASA_RE_110': { desc: 'Taxa de Resseguro para o ramo 110', category: 'Resseguro' },
      'PCT_TASA_RE_150': { desc: 'Taxa de Resseguro para o ramo 150', category: 'Resseguro' },
      'PCT_COMISION': { desc: 'Percentual geral de comissão de corretagem', category: 'Comissão' },
      'PCT_GASTOS': { desc: 'Percentual geral de despesas operacionais', category: 'Despesas & Custos' },
      'PCT_PRIMA': { desc: 'Fator percentual aplicado sobre o prêmio base', category: 'Prêmio' },
      'COMISION FIJA AGENTE': { desc: 'Valor fixo monetário de comissão por apólice', category: 'Comissão' }
    };

    constDocs.forEach(doc => {
      doc.definicionesConstantes?.forEach(c => {
        if (c.vrbNam && !constantsMap[c.vrbNam]) {
          const info = constDescriptions[c.vrbNam] || { desc: `Constante atuarial configurada no RTE (${c.vrbNam})`, category: 'Constante Geral' };
          constantsMap[c.vrbNam] = {
            id: `const_${c.vrbNam}`,
            name: c.vrbNam,
            insertText: `MMATH.f_cte('${c.vrbNam}')`,
            type: 'constant',
            category: info.category,
            value: c.vrbNamVal,
            description: info.desc,
            country: doc.cnyVal,
            company: doc.cmpVal,
            source: 'acdc_rte_br-int.CONSTANT-DEFINITION'
          };
        }
      });
    });

    const constantsList = Object.values(constantsMap).sort((a, b) => a.name.localeCompare(b.name));

    // 2. Variables definition
    const variableDefinitions = {
      'BASE_CALCULO': { desc: 'Base monetária apurada do cálculo tarifário (Prêmio de Risco / Prêmio Puro acumulado nas etapas anteriores)', category: 'Acumulador de Prêmio' },
      'KM_VEHICULO': { desc: 'Quilometragem média anual informada do veículo segurado', category: 'Fator Veicular' },
      'EDAD_VEHICULO': { desc: 'Idade do veículo (diferença entre o ano corrente e o ano modelo/fabricação)', category: 'Fator Veicular' },
      'PORCENTAJE_GD': { desc: 'Percentual de Gastos Diretos do risco', category: 'Fator Atuarial' },
      'VAL_FRANQUICIA': { desc: 'Valor monetário estipulado da Franquia contratada para a cobertura', category: 'Parâmetro de Cobertura' },
      'TIP_NIVEL_COB': { desc: 'Nível ou modalidade da cobertura contratada (Básica, Completa, VIP)', category: 'Parâmetro de Cobertura' },
      'COMISION': { desc: 'Valor apurado ou percentual de comissão de intermediação', category: 'Comissão' },
      'COSTE_TOTAL': { desc: 'Custo total agregado estimado da operação de seguro', category: 'Sinistralidade & Custo' },
      'COSTE_SINIESTROS': { desc: 'Custo médio estatístico estimado de sinistros da carteira', category: 'Sinistralidade & Custo' },
      'SUMA_ASEG': { desc: 'Importância Segurada / Limite Máximo de Garantia (LMG) da cobertura', category: 'Garantia / Capital' },
      'EDAD': { desc: 'Idade do segurado ou condutor principal', category: 'Perfil do Segurado' },
      'CUOTA': { desc: 'Valor da parcela ou fração de pagamento da apólice', category: 'Plano de Pagamento' },
      'NUM_SINI_VEH_LIG_3100': { desc: 'Frequência de sinistros para veículos leves na região', category: 'Frequência Estatística' },
      'NUM_SINI_VEH_PES_3100': { desc: 'Frequência de sinistros para veículos pesados na região', category: 'Frequência Estatística' },
      'FEE_VEH_LIG_3100': { desc: 'Taxa administrativa (Fee) para veículos leves', category: 'Taxa / Fee' },
      'FEE_VEH_PES_3100': { desc: 'Taxa administrativa (Fee) para veículos pesados', category: 'Taxa / Fee' },
      'FEE_PER_3105': { desc: 'Taxa periódica de manutenção para o produto 3105', category: 'Taxa / Fee' },
      'NUM_VIAJEROS': { desc: 'Quantidade total de passageiros ou vidas na apólice', category: 'Vidas / Passageiros' },
      'NUM_VIAJEROS_MAX65': { desc: 'Quantidade de passageiros com idade até 65 anos', category: 'Faixa Etária' },
      'NUM_VIAJEROS_MAX75': { desc: 'Quantidade de passageiros com idade até 75 anos', category: 'Faixa Etária' },
      'NUM_VIAJEROS_MAX85': { desc: 'Quantidade de passageiros com idade até 85 anos', category: 'Faixa Etária' },
      'DVCOMISION_AGENCIA': { desc: 'Desvio ou ajuste de comissão para o canal de agências', category: 'Ajuste de Canal' },
      'DVCOMISION_VENDEDOR': { desc: 'Desvio ou ajuste de comissão do vendedor/corretor', category: 'Ajuste de Canal' },
      'PCT_PROMOCION': { desc: 'Percentual de desconto comercial promocional concedido', category: 'Desconto Comercial' },
      'PROBA': { desc: 'Probabilidade estatística atuarial estimada para o evento', category: 'Probabilidade Atuarial' },
      '412': { desc: 'Conceito econômico de recargo/desconto técnico #412', category: 'Conceito Econômico' },
      '413': { desc: 'Conceito econômico de recargo/desconto técnico #413', category: 'Conceito Econômico' }
    };

    // Extract all distinct variables from FORMULA-DEFINITION
    const formulas = await db.collection('FORMULA-DEFINITION').find({}).toArray();
    const variablesSet = new Set();
    formulas.forEach(f => {
      f.details?.forEach(d => {
        if (d.fomValVal) {
          const matches = d.fomValVal.match(/\[([A-Z0-9_]+)\]/gi);
          if (matches) matches.forEach(m => variablesSet.add(m.replace(/[\[\]]/g, '')));
        }
      });
    });

    const variablesList = Array.from(variablesSet).map(varName => {
      const info = variableDefinitions[varName] || { desc: `Variável atuarial de entrada ou fator de cálculo [${varName}]`, category: 'Variável de Cálculo' };
      return {
        id: `var_${varName}`,
        name: `[${varName}]`,
        insertText: `[${varName}]`,
        type: 'variable',
        category: info.category,
        description: info.desc,
        source: 'acdc_rte_br-int.FORMULA-DEFINITION / QUOTE-FACTORS'
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // 3. Functions
    const functionsList = [
      {
        id: 'fn_mmath_f_cte',
        name: 'MMATH.f_cte',
        insertText: "MMATH.f_cte('PCT_MGS_160')",
        type: 'function',
        category: 'Busca de Constante',
        syntax: "MMATH.f_cte('NOME_CONSTANTE')",
        description: 'Busca dinâmica do valor de uma constante atuarial cadastrada em CONSTANT-DEFINITION correspondente ao país, companhia e ramo atuais.',
        example: "MMATH.f_cte('PCT_GI_160')",
        source: 'Tronador Math Engine (MMATH)'
      },
      {
        id: 'fn_math_f_cte',
        name: 'MATH.f_cte',
        insertText: "MATH.f_cte('PCT_CO_160')",
        type: 'function',
        category: 'Busca de Constante',
        syntax: "MATH.f_cte('NOME_CONSTANTE')",
        description: 'Variante padrão da função de busca de constantes matemáticas/atuariais.',
        example: "MATH.f_cte('PCT_CO_160')",
        source: 'Tronador Math Engine (MATH)'
      },
      {
        id: 'fn_mmath_round',
        name: 'MMATH.round',
        insertText: 'MMATH.round(valor, 2)',
        type: 'function',
        category: 'Arredondamento',
        syntax: 'MMATH.round(expressao, casasDecimais)',
        description: 'Arredonda o cálculo para a quantidade de casas decimais especificada (padrão 2 casas para prêmio).',
        example: 'MMATH.round([BASE_CALCULO] * 1.05, 2)',
        source: 'Tronador Math Engine (MMATH)'
      },
      {
        id: 'fn_mmath_min',
        name: 'MMATH.min',
        insertText: 'MMATH.min(val1, val2)',
        type: 'function',
        category: 'Comparação',
        syntax: 'MMATH.min(valorA, valorB)',
        description: 'Retorna o menor valor entre dois termos (usado para impor limites máximos / tetos de prêmio ou de comissão).',
        example: 'MMATH.min([COMISION], 1500)',
        source: 'Tronador Math Engine (MMATH)'
      },
      {
        id: 'fn_mmath_max',
        name: 'MMATH.max',
        insertText: 'MMATH.max(val1, val2)',
        type: 'function',
        category: 'Comparação',
        syntax: 'MMATH.max(valorA, valorB)',
        description: 'Retorna o maior valor entre dois termos (usado para assegurar prêmio mínimo ou piso tarifário).',
        example: 'MMATH.max([BASE_CALCULO], 50.0)',
        source: 'Tronador Math Engine (MMATH)'
      },
      {
        id: 'fn_mmath_nvl',
        name: 'MMATH.nvl',
        insertText: 'MMATH.nvl(valor, 0)',
        type: 'function',
        category: 'Tratamento de Nulos',
        syntax: 'MMATH.nvl(campo, valorPadrao)',
        description: 'Substitui valores nulos, vazios ou indefinidos por um valor numérico padrão de segurança (fallback).',
        example: 'MMATH.nvl([PCT_PROMOCION], 0)',
        source: 'Tronador Math Engine (MMATH)'
      },
      {
        id: 'fn_to_number',
        name: 'TO_NUMBER',
        insertText: 'TO_NUMBER([CAMPO])',
        type: 'function',
        category: 'Conversão de Tipo',
        syntax: 'TO_NUMBER(variavel_ou_fator)',
        description: 'Converte uma variável alfanumérica ou percentual da apólice para valor numérico decimal para cálculo.',
        example: 'TO_NUMBER([DVPORCENTAJE_GD])',
        source: 'Tronador Engine Core'
      }
    ];

    // 4. Operators
    const operatorsList = [
      { id: 'op_add', name: '+ (Soma)', insertText: ' + ', type: 'operator', category: 'Operador Aritmético', description: 'Operação de adição entre valores' },
      { id: 'op_sub', name: '- (Subtração)', insertText: ' - ', type: 'operator', category: 'Operador Aritmético', description: 'Operação de subtração entre valores' },
      { id: 'op_mul', name: '* (Multiplicação)', insertText: ' * ', type: 'operator', category: 'Operador Aritmético', description: 'Multiplicação de bases e taxas' },
      { id: 'op_div', name: '/ (Divisão)', insertText: ' / ', type: 'operator', category: 'Operador Aritmético', description: 'Divisão de fatores ou taxas' },
      { id: 'op_paren', name: '( ... ) (Parênteses)', insertText: '( )', type: 'operator', category: 'Precedência', description: 'Agrupamento e ordem de precedência das operações' },
      { id: 'op_one_minus', name: '(1 - ...) (Fator Complementar)', insertText: '(1 - )', type: 'operator', category: 'Precedência', description: 'Expressão de dedução complementar comumente usada para margens e despesas' }
    ];

    res.json({
      constants: constantsList,
      variables: variablesList,
      functions: functionsList,
      operators: operatorsList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deterministic mathematical syntax and parenthesis analysis for formulas
function checkFormulaSyntax(expr) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let inQuotes = false;
  let totalOpenParens = 0;
  let totalCloseParens = 0;
  let totalOpenBrackets = 0;
  let totalCloseBrackets = 0;
  const openParenIndices = [];
  const errors = [];

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "'") {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;

    if (ch === '(') {
      parenDepth++;
      totalOpenParens++;
      openParenIndices.push(i);
    } else if (ch === ')') {
      parenDepth--;
      totalCloseParens++;
      if (openParenIndices.length > 0) {
        openParenIndices.pop();
      } else {
        const snippet = expr.substring(Math.max(0, i - 15), Math.min(expr.length, i + 15));
        errors.push(`Parêntese de fechamento ')' a mais detectado no trecho "...${snippet}..." sem parêntese de abertura correspondente`);
        parenDepth = 0;
      }
    } else if (ch === '[') {
      bracketDepth++;
      totalOpenBrackets++;
    } else if (ch === ']') {
      bracketDepth--;
      totalCloseBrackets++;
      if (bracketDepth < 0) {
        const snippet = expr.substring(Math.max(0, i - 15), Math.min(expr.length, i + 15));
        errors.push(`Colchete de fechamento ']' a mais detectado no trecho "...${snippet}..." sem colchete de abertura correspondente`);
        bracketDepth = 0;
      }
    }
  }

  if (inQuotes) {
    errors.push("Aspas simples não foram fechadas corretamente na fórmula.");
  }
  if (totalOpenParens > totalCloseParens) {
    const diff = totalOpenParens - totalCloseParens;
    errors.push(`Há ${diff} parêntese(s) de abertura '(' a mais sem fechamento correspondente (Total: ${totalOpenParens} abertos contra ${totalCloseParens} fechados). Faltam fechar ${diff} parêntese(s) ')'`);
  } else if (totalCloseParens > totalOpenParens) {
    const diff = totalCloseParens - totalOpenParens;
    errors.push(`Há ${diff} parêntese(s) de fechamento ')' a mais sem abertura correspondente (Total: ${totalOpenParens} abertos contra ${totalCloseParens} fechados).`);
  }
  if (bracketDepth > 0) {
    errors.push(`Faltam ${bracketDepth} colchete(s) de fechamento ']' para equilibrar as variáveis.`);
  }

  const invalidOps = /([+\-*/])\s*([+*/])/g;
  let m;
  while ((m = invalidOps.exec(expr)) !== null) {
    errors.push(`Operadores matemáticos seguidos sem operando: "${m[0]}"`);
  }
  if (/[+\-*/]\s*$/.test(expr.trim())) {
    errors.push(`A fórmula termina com operador pendente no final: "${expr.trim().slice(-1)}"`);
  }

  const variables = Array.from(expr.matchAll(/\[([A-Za-z0-9_]+)\]/g)).map(match => match[1]);

  return {
    valid: errors.length === 0,
    errors,
    totalOpenParens,
    totalCloseParens,
    totalOpenBrackets,
    totalCloseBrackets,
    variables: [...new Set(variables)]
  };
}

// POST /api/rte/validate-formula (AI validation via local AI Gateway)
router.post('/validate-formula', async (req, res) => {
  try {
    const { formulaExpression, model = 'gpt-5.6-terra-high' } = req.body;

    if (!formulaExpression || !formulaExpression.trim()) {
      return res.status(400).json({ error: 'Expressão de cálculo é obrigatória.' });
    }

    // 1. Run deterministic mathematical syntax & parenthesis analysis
    const syntaxAnalysis = checkFormulaSyntax(formulaExpression);

    // If deterministic syntax check fails (e.g. mismatched parens, unclosed brackets/quotes),
    // the formula IS mathematically invalid. Return immediate exact error matching the status!
    if (!syntaxAnalysis.valid) {
      const errorMsg = syntaxAnalysis.errors.join('. ');
      return res.json({
        modelUsed: 'motor-sintatico-deterministico',
        valid: false,
        status: 'REJECTED',
        parens: {
          open: syntaxAnalysis.totalOpenParens,
          close: syntaxAnalysis.totalCloseParens,
          balanced: false
        },
        message: `Fórmula sintaticamente inválida: ${errorMsg}. Corrija a pontuação para equilibrar a fórmula.`,
        variables: syntaxAnalysis.variables
      });
    }

    const systemPrompt = `Você é um validador atuarial especialista no Motor de Tarifação Tronador (RTE) da MAPFRE Seguros.
Sua função é validar com rigor matemático a integridade sintática e a lógica das fórmulas atuariais do motor.

DIRETRIZES DE IDIOMA E FORMATAÇÃO (CRÍTICO):
1. Responda ESTRITAMENTE em Português do Brasil (pt-BR) formal, limpo e profissional.
2. É ESTRITAMENTE PROIBIDO gerar palavras em alfabeto armênio, cirílico, grego ou caracteres estranhos (como tokens corrompidos "կիրառ"). Toda a resposta deve ser redigida em português 100% natural.
3. Seja conciso e direto ao ponto (2 a 3 frases).

DIRETRIZES DA LINGUAGEM TRONADOR RTE (PADRÃO OFICIAL DA EMPRESA):
1. FUNÇÕES OFICIAIS DO MOTOR (100% VÁLIDAS E SUPORTADAS):
   - MMATH.f_cte('NOME_CONSTANTE') e MATH.f_cte('NOME_CONSTANTE'):
     Busca oficial de constantes atuariais cadastradas no RTE (taxas de resseguro, despesas, margens, solvência). O uso de aspas simples com o nome da constante é a sintaxe oficial e totalmente válida. NUNCA diga que essa função ou as aspas são inválidas ou não previstas.
   - TO_NUMBER([VARIAVEL]) ou TO_NUMBER(expressao):
     Função oficial de conversão de dados da apólice para número decimal. 100% VÁLIDA.
   - MMATH.round(expressao, decimais), MMATH.min(a, b), MMATH.max(a, b), MMATH.nvl(campo, padrao):
     Funções matemáticas e atuariais oficiais do Tronador.
2. VARIÁVEIS ATUARIAIS:
   - Delimitadas por colchetes: [BASE_CALCULO], [KM_VEHICULO], [DVPORCENTAJE_GD], [COMISION], etc.
3. MODELOS ATUARIAIS INTERNOS DE CARREGAMENTO DE PRÊMIO:
   - Fórmulas estruturadas como [BASE_CALCULO] / (1 - (soma_de_taxas)) representam a fórmula clássica atuarial de Carregamento de Prêmio / Despesas Diretas (onde o denominador representa a retenção líquida pós-taxas).
   - Trata-se de um modelo interno de parametrização da empresa onde as taxas são frações decimais controladas. NÃO REJEITE a fórmula alegando 'risco de divisão por zero' ou dizendo que 'não faz sentido', pois essa estrutura é o padrão oficial de cálculo.
4. RIGOR ABSOLUTO EM PARÊNTESES E COLCHETES:
   - Faça uma contagem rigorosa de cada parêntese aberto '(' e fechado ')'.
   - Se houver qualquer parêntese a mais ou faltando, a fórmula é SINTATICAMENTE INVÁLIDA e DEVE ser REJEITADA com status 'REJECTED'.

SCHEMA OBRIGATÓRIO DE RESPOSTA (ESTRITAMENTE JSON):
{
  "valid": boolean,
  "status": "APPROVED" | "WARNING" | "REJECTED",
  "message": "Explicação técnica clara e direta em português do Brasil sem termos estrangeiros.",
  "variables": ["LISTA", "DE", "VARIAVEIS"]
}`;

    const userPrompt = `Valide a seguinte fórmula de cálculo do Tronador RTE:
"${formulaExpression}"

Análise matemática preliminar: A fórmula contém ${syntaxAnalysis.totalOpenParens} parênteses '(' e ${syntaxAnalysis.totalCloseParens} parênteses ')'. Todos os delimitadores estão balanceados.
`;

    const gatewayUrl = 'http://127.0.0.1:8766/codex/v1/chat/completions';

    const aiRes = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1200
      })
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI Gateway response error:', errText);
      throw new Error(`AI Gateway retornou status ${aiRes.status}: ${errText}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from content (extract from ```json if wrapped)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
    }

    let validationResult;
    try {
      validationResult = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.warn('Could not parse AI output as JSON, returning raw text:', content);
      validationResult = {
        valid: syntaxAnalysis.valid,
        status: syntaxAnalysis.valid ? 'WARNING' : 'REJECTED',
        message: content || 'Fórmula analisada com sucesso.',
        variables: syntaxAnalysis.variables
      };
    }

    // Sanitize any potential Armenian, Cyrillic or non-Latin token bleed from local LLM
    if (validationResult.message) {
      validationResult.message = validationResult.message
        .replace(/[\u0530-\u058F\uFB13-\uFB17]+[a-zA-Záéíóúãõâêîôûç]?/g, 'utiliza')
        .replace(/[\u0400-\u04FF]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (!validationResult.variables || validationResult.variables.length === 0) {
      validationResult.variables = syntaxAnalysis.variables;
    }

    res.json({
      modelUsed: model,
      parens: {
        open: syntaxAnalysis.totalOpenParens,
        close: syntaxAnalysis.totalCloseParens,
        balanced: syntaxAnalysis.totalOpenParens === syntaxAnalysis.totalCloseParens
      },
      ...validationResult
    });
  } catch (err) {
    console.error('Error validating formula with AI Gateway:', err.message);
    const syntaxAnalysis = checkFormulaSyntax(req.body.formulaExpression || '');
    res.json({
      modelUsed: 'local-contingency-engine',
      valid: syntaxAnalysis.valid,
      status: syntaxAnalysis.valid ? 'WARNING' : 'REJECTED',
      parens: {
        open: syntaxAnalysis.totalOpenParens,
        close: syntaxAnalysis.totalCloseParens,
        balanced: syntaxAnalysis.totalOpenParens === syntaxAnalysis.totalCloseParens
      },
      message: syntaxAnalysis.valid 
        ? `Validação local (Gateway offline: ${err.message}). Sintaxe e balanceamento de parênteses (${syntaxAnalysis.totalOpenParens} abertos e ${syntaxAnalysis.totalCloseParens} fechados) aprovados.`
        : `Erro sintático detectado: ${syntaxAnalysis.errors.join(' ')}`,
      variables: syntaxAnalysis.variables
    });
  }
});

// PUT /api/rte/formulas/:id (Edit formula title and expression with audit log)
router.put('/formulas/:id', requireEditPermission('rating'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, expression, aiValidation } = req.body;

    if (!title || !expression) {
      return res.status(400).json({ error: 'Título e expressão de cálculo são obrigatórios.' });
    }

    const db = getRteDb();
    const { ObjectId } = await import('mongodb');

    let query = { _id: id };
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { _id: id };
    }

    const currentFormula = await db.collection('FORMULA-DEFINITION').findOne(query);
    if (!currentFormula) {
      return res.status(404).json({ error: 'Fórmula não encontrada.' });
    }

    // Enforce syntax verification on backend before saving
    const syntaxAnalysis = checkFormulaSyntax(expression.trim());
    if (!syntaxAnalysis.valid) {
      return res.status(400).json({
        error: `Salvamento bloqueado: A fórmula é sintaticamente inválida (${syntaxAnalysis.errors.join('. ')}).`
      });
    }

    if (aiValidation && (aiValidation.valid === false || aiValidation.status === 'REJECTED')) {
      return res.status(400).json({
        error: `Salvamento bloqueado: A fórmula foi rejeitada na validação de integridade (${aiValidation.message || 'Erros sintáticos pendentes'}).`
      });
    }

    const oldTitle = currentFormula.fomNam;
    const oldExpression = currentFormula.details?.[0]?.fomValVal || '';

    // Update formula in FORMULA-DEFINITION
    const updateDoc = {
      $set: {
        fomNam: title.trim(),
        'details.0.fomValVal': expression.trim(),
        modificationDate: new Date(),
        modifiedBy: req.user.email
      }
    };

    await db.collection('FORMULA-DEFINITION').updateOne(query, updateDoc);

    // Save Audit Changelog entry with Diff
    const changelogEntry = {
      timestamp: new Date(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userIp: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      entity: 'FORMULA-DEFINITION',
      entityId: currentFormula.fomVal || id,
      formulaName: title.trim(),
      action: 'UPDATE',
      changes: {
        title: { old: oldTitle, new: title.trim() },
        expression: { old: oldExpression, new: expression.trim() }
      },
      aiValidation: aiValidation || null
    };

    await db.collection('AUDIT_CHANGELOG').insertOne(changelogEntry);

    // Also write a PECA audit log for compliance
    await db.collection('PECA').insertOne({
      nuuma: req.user.email,
      entity: 'FORMULA DEFINITION',
      entityId: `${currentFormula.fomVal}: ${title.trim()}`,
      accessType: 'UPDATE',
      accessDate: new Date(),
      originIp: req.ip || '127.0.0.1',
      denied: false,
      _class: 'com.mapfre.tron.rating.core.model.peca.Peca'
    });

    res.json({
      message: 'Fórmula atualizada e auditoria registrada com sucesso!',
      changelog: changelogEntry
    });
  } catch (err) {
    console.error('Error updating formula:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rte/concepts
router.get('/concepts', async (req, res) => {
  try {
    const db = getRteDb();
    const economic = await db.collection('ECONOMIC-CONCEPTS').find({}).toArray();
    const breakdown = await db.collection('BREAKDOWN-CONCEPTS').find({}).limit(100).toArray();
    res.json({
      economic,
      breakdownSample: breakdown,
      totalBreakdownCount: await db.collection('BREAKDOWN-CONCEPTS').countDocuments()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rte/technical-basis
router.get('/technical-basis', async (req, res) => {
  try {
    const db = getRteDb();
    const basis = await db.collection('TECHNICAL-BASIS').find({}).toArray();
    const tables = await db.collection('TECHNICAL-BASIS-TABLES').find({}).toArray();
    res.json({
      basis,
      tables
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rte/peca (Audit logs - Restricted to ADMIN only)
router.get('/peca', requireAdmin, async (req, res) => {
  try {
    const db = getRteDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const search = req.query.search;

    const filter = {};
    if (search) {
      filter.$or = [
        { nuuma: { $regex: search, $options: 'i' } },
        { entityId: { $regex: search, $options: 'i' } },
        { originIp: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await db.collection('PECA').countDocuments(filter);
    const logs = await db.collection('PECA')
      .find(filter)
      .sort({ accessDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rte/jobs
router.get('/jobs', async (req, res) => {
  try {
    const db = getRteDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const total = await db.collection('JOB-EXECUTIONS').countDocuments();
    const jobs = await db.collection('JOB-EXECUTIONS')
      .find({})
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      jobs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rte/companies
router.get('/companies', async (req, res) => {
  try {
    const db = getRteDb();
    const companies = await db.collection('COMPANIES').find({}).toArray();
    const branches = await db.collection('BRANCHES').find({}).toArray();
    res.json({
      companies,
      branches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
