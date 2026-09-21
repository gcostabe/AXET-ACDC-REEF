# HISTÓRICO DE VERSÕES E RELEASES — PLATAFORMA ACDC

## Versão 2.4 (Atual — 2026-09-20)
- **Validação Sintática Determinística & Bloqueio ao Salvar**:
  - Implementação de analisador determinístico no backend para cálculo de balanceamento de parênteses e delimitadores.
  - Bloqueio imediato no salvamento de fórmulas inválidas ou rejeitadas pela IA (HTTP 400).
- **Padrão Visual NTT DATA**:
  - Adoção da paleta oficial NTT DATA (#0066FF) e substituição de ícones pelo emblema oficial em loop circular.
- **Arquitetura de Memória Persistente do Agente**:
  - Implantação de `AGENTS.md`, `.agent/current_task.md`, `.agent/execution_journal.md`, `.agent/state.md`, `.agent/decisions.md` e `.agent/recovery.md`.

## Versão 2.3 (2026-09-20)
- **Chatbot Copilot Flutuante com RAG**:
  - Assistente conversacional atuarial flutuante com busca vetorial híbrida no MongoDB (coleções `RULES`, `FORMULA-DEFINITION`, `CONSTANT-DEFINITION`, `PECA`).
- **Construtor Visual Drag-and-Drop de Fórmulas**:
  - Editor com chips de objetos visuais reais (`VAR`, `CTE`, `FN`) e operadores aritméticos textuais.

## Versão 2.2 (2026-09-20)
- **Auditoria PECA com Diff Visual**:
  - Tabela organizada com modal de comparativo antes/depois (diff visual) para rastreabilidade de alterações.
- **Gestão de Usuários & Perfis**:
  - Painel administrativo para liberação de acesso e configuração de permissões por tela e alçada de edição.

## Versão 2.1 (2026-09-10)
- Estruturação inicial dos serviços DUP e RTE para o mercado MAPFRE BR-INT.
