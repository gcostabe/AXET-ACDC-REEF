# CURRENT TASK

Task ID: TASK-20260924-0650-DEDICATED-LOGIN-PAGE-FOR-UNAUTHENTICATED-USERS

Created: 2026-09-24 06:50:00 -03:00

Last Updated: 2026-09-24 06:50:00 -03:00

Status: COMPLETED_AND_VERIFIED

Resume Authorization: NO

---

## User Request

ao inves de apresentar a tela principal para o usuario deslogado apresente uma tela simliar a esta, mas com os padroes deste app

---

## Objective

1. **Tela de Autenticação Dedicada para Usuários Deslogados (`LoginPage.jsx`)**:
   - Para qualquer usuário não autenticado (`!user`), em vez de exibir a tela principal com dashboard, abas e cabeçalho, apresentar uma tela de login dedicada e elegante inspirada no padrão do `RAG-LOCAL-REEF`, adaptada com a identidade e padrões do `ACDC Explorer • MAPFRE Seguros`.
   - Card centralizado sobre fundo corporativo escuro (`#080d1a`) com ambient glows.
   - Logo NTT DATA e títulos corporativos da plataforma ACDC.
   - Botão de destaque primário: **"Entrar com SSO Okta (OneNTT)"** com 1 clique (e abertura do modal de ativação quando aplicável).
   - Divisor "ou credenciais locais".
   - Formulário com ícones para E-mail Corporativo e Senha local.
   - Alternância fluida para **"Solicitar cadastro"** (Nome, Departamento, Email, Senha, Justificativa de Acesso) e botão de envio de solicitação.
   - Dica administrativa padrão: `admin@acdc.mapfre / admin123`.
2. **Transição Transparente**:
   - Assim que o usuário se autentica (via Okta SSO ou credencial local), o Cockpit principal é renderizado com todas as abas e recursos habilitados de acordo com seu perfil.
   - Ao clicar em "Sair da Conta", o usuário retorna imediatamente para esta tela de login.
3. **Política de Testes**:
   - Não executar testes automatizados no navegador. Entregar diretamente ao usuário para teste.

---

## Execution Cursor

Phase: VERIFICATION_COMPLETE
Current Step: Componente criado, estilos injetados, condicional configurado, build testado e repositórios Git sincronizados.
Last Safe Checkpoint: CHECKPOINT-035 (AFTER_ACTION)

---

## Planned Actions

- [x] Criar componente dedicado `client/src/components/LoginPage.jsx`.
- [x] Injetar estilos de ponta em `client/src/index.css` (`.login-page-container`, `.login-card`, `.okta-sso-btn`, etc.).
- [x] Atualizar `client/src/App.jsx` para renderizar `LoginPage` quando `!user`.
- [x] Validar build de produção (`npm run build --prefix client`).
- [x] Sincronizar commits nos repositórios remotos.
- [x] Reportar ao usuário para teste manual.
