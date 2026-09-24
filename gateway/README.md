# Local AI Gateway Corporativo (AXET / Okta SSO)

Este módulo implementa o **API Gateway Local** na porta `:8766`, responsável por intermediar de forma transparente todas as requisições de Inteligência Artificial da esteira multimodal e do Cockpit com os serviços corporativos da NTT DATA (AXET LLM Enabler e Okta OIDC).

---

## 🎯 Funcionalidades

1. **Proxy Reverso Multi-Provedor (:8766):**
   * Endpoint compatível Anthropic (`/v1/messages`): Converte chamadas para o formato AWS Bedrock streaming aceito pelo AXET (Claude 3.7 / Sonnet 5).
   * Endpoint compatível OpenAI (`/v1/chat/completions` e `/v1/completions`): Encaminha chamadas para os modelos Codex/GPT do AXET.
2. **Autenticação Automática via Okta SSO:**
   * Utiliza o `refresh_token` corporativo armazenado em `gateway/tokens.json` para renovar automaticamente o `access_token` antes de expirar.
   * Suporte a extração automática de tokens da sessão do AXET CLI (`~/.local/share/axet-code/auth.enc`).
3. **Resolução Dinâmica do `project-id` do AXET:**
   * O gateway consulta `/api/core/v1/users/{okta_id}` no AXET Core para validar projetos autorizados.
   * Rotação automática de quotas: se o `project_id` primário atingir limites (HTTP 429), realiza fallback automático para os projetos secundários configurados.

---

## 📂 Estrutura de Arquivos

* `local_ai_gateway.py`: Servidor HTTP do gateway (porta 8766).
* `config_loader.py`: Carregador de configurações TOML (`local-ai-gateway.toml`).
* `local-ai-gateway.toml`: Configurações de rotas, timeouts e IDs de projeto.
* `sync_okta_identity.py`: CLI de sincronização manual de token Okta e perfil AXET.
* `initialize_proxy.py`: Inicializador do proxy com teste de saúde.
* `tokens.example.json`: Modelo de formato de tokens para novos ambientes.
* `user_identity.json`: Perfil e claims do usuário sincronizado.

---

## 🚀 Como Executar

### 1. Iniciar o Gateway Local:
```bash
python3 gateway/local_ai_gateway.py
```
Ou via npm:
```bash
npm run gateway:start
```

### 2. Sincronizar Token Okta:
```bash
python3 gateway/sync_okta_identity.py
```
Ou via npm:
```bash
npm run gateway:sync
```

### 3. Verificar Status:
```bash
curl http://127.0.0.1:8766/auth/status
```
