# CURRENT TASK

Task ID: TASK-20260924-0515-INSTALLERS-WINDOWS-MAC-ONE-CLICK

Created: 2026-09-24 05:15:00 -03:00

Last Updated: 2026-09-24 05:15:00 -03:00

Status: COMPLETED_AND_VERIFIED

Resume Authorization: NO

---

## User Request

preciso que tambem disponibilize um processo de instalação em maquinas local windowns e mac seguindo o padrao abaixo que usamos para outro app

🚀 Instalação e Execução Local Rápida
🪟 No Windows (Instalador One-Click via WSL2)
O Windows 10/11 roda o pipeline com aceleração total de hardware via WSL2 sem exigir comandos manuais de Linux:
Clone o repositório ou baixe o ZIP:
git clone https://github.com/gcostabe/ACDC.git
cd ACDC
Dê duplo clique no arquivo instalar_windows.bat.
Ele detecta e habilita o WSL2 automaticamente;
Instala Python e Node.js 20 em segundo plano;
Cria um atalho Iniciar Cockpit NTT DATA.bat na sua Área de Trabalho (Desktop).
Uso diário: Dê duplo clique no atalho da Área de Trabalho. Ele inicia o pipeline e abre o navegador automaticamente em http://localhost:5173/.

🍏 No macOS (Instalador One-Click)
Clone o repositório:
git clone https://github.com/gcostabe/ACDC.git
cd ACDC
Execute o script de configuração inicial:
./setup_mac.sh
Valida Python e Node.js via Homebrew;
Configura dependências e tokens;
Cria o atalho clicável Iniciar Cockpit NTT DATA.command na sua Mesa (Desktop).
Uso diário: Dê duplo clique no atalho da Mesa ou execute ./iniciar_mac.command.

---

## Objective

1. **Criar Instalador e Launcher para Windows**:
   - `instalar_windows.bat`: script batch com codificação UTF-8, detecção de WSL2 / Windows nativo, checagem e instalação das dependências (Node.js 20, Python 3, Docker/MongoDB), execução de `npm install` no backend e frontend, configuração dos tokens e criação do atalho `Iniciar Cockpit NTT DATA.bat` na Área de Trabalho (`%USERPROFILE%\Desktop`).
   - `iniciar_windows.bat`: script de uso diário que sobe o MongoDB (Docker ou nativo), o Local AI Gateway (8766), o servidor Node.js (4000) e o frontend Vite (5173), abrindo automaticamente o navegador em `http://localhost:5173/`.

2. **Criar Instalador e Launcher para macOS**:
   - `setup_mac.sh`: script bash com permissão de execução que valida/instala Homebrew, Node.js e Python 3, executa `npm install` no server e client, sincroniza token Okta se disponível e cria o atalho clicável `Iniciar Cockpit NTT DATA.command` na Mesa (`~/Desktop`).
   - `iniciar_mac.command`: launcher clicável do macOS que sobe os serviços, aguarda prontidão das portas e abre automaticamente o navegador em `http://localhost:5173/` com encerramento gracioso via trap.

3. **Atualizar / Criar Documentação Oficial (`README.md`)**:
   - Documentar os fluxos de instalação one-click no padrão corporativo NTT DATA / MAPFRE exatamente como solicitado.

---

## Execution Cursor

Phase: VERIFICATION_COMPLETE
Current Step: Validação do setup_mac.sh concluída com sucesso (criação do atalho na Mesa ~/Desktop e sincronização Okta ativa). Documentação oficial atualizada no README.md.
Last Safe Checkpoint: CHECKPOINT-027 (AFTER_ACTION)

---

## Planned Actions

- [x] Publicar `implementation_plan.md` e solicitar aprovação.
- [x] Implementar `setup_mac.sh` e `iniciar_mac.command` com permissão de execução (`chmod +x`).
- [x] Implementar `instalar_windows.bat` e `iniciar_windows.bat`.
- [x] Criar / atualizar `README.md` com a seção "🚀 Instalação e Execução Local Rápida".
- [x] Validar a execução dos scripts macOS no ambiente local.
