# ACDC — Cockpit de Precificação & Regras Atuariais
### NTT DATA • MAPFRE Insurance Technology

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![AXET](https://img.shields.io/badge/AXET%20AI-GPT--5.6--Terra--High-0066FF)](https://www.nttdata.com/)

Plataforma corporativa unificada para engenharia de tarifação atuarial (**RTE — Rating Engine Tronador**), governança de regras de subscrição e aceitação de risco (**DUP — Dynamic Underwriting Platform**), exploração estruturada de dados, pacotes de cobertura e assistência inteligente com RAG/LLM integrado via **AXET / Okta SSO**.

---

## 📑 Sumário

1. [Visão Geral da Solução](#-visão-geral-da-solução)
2. [Módulos Principais](#-módulos-principais)
3. [Instalação e Execução Local Rápida (One-Click)](#-instalação-e-execução-local-rápida)
   - [No Windows (WSL2 / Nativo)](#-no-windows-instalador-one-click-via-wsl2--nativo)
   - [No macOS](#-no-macos-instalador-one-click)
4. [Arquitetura da Solução & Portas](#-arquitetura-da-solução--portas)
5. [Local AI Gateway & Conexão AXET (LLM)](#-local-ai-gateway--conexão-axet-llm)
6. [Gestão de Ambientes MongoDB na Aplicação](#-gestão-de-ambientes-mongodb-na-aplicação)
7. [Controle de Acesso e Usuários Padrão](#-controle-de-acesso-e-usuários-padrão)
8. [Estrutura do Repositório](#-estrutura-do-repositório)
9. [Sincronização com Repositórios Remotos (Dual Push)](#-sincronização-com-repositórios-remotos-dual-push)

---

## 🌟 Visão Geral da Solução

O **ACDC (Arquitetura e Configuração de Dados e Cálculos)** resolve a complexidade atuarial e de subscrição de apólices de seguro MAPFRE, centralizando a gestão de duas bases canônicas:
* **DUP (`acdc_dup_br-int`)**: Plataforma dinâmica de subscrição que armazena catálogos de produtos, coberturas, pacotes comerciais e regras de validação/rejeição/auditoria de riscos.
* **RTE (`acdc_rte_br-int`)**: Motor de tarifação atuarial que contém fórmulas de prêmio, árvores de cálculo hierárquicas, fatores, taxas e variáveis atuariais.

A solução provê um **editor visual de fórmulas** com validação sintática determinística assistida por IA, trilha de auditoria **PECA** com diff visual de alterações, e o **ACDC Copilot**, um assistente conversacional atuarial baseado em RAG híbrido.

---

## 🧩 Módulos Principais

| Módulo | Descrição |
| :--- | :--- |
| 📊 **Visão Geral** | Painel executivo com métricas consolidadas, contagem de produtos/regras/cálculos e badges de conectividade do banco e do Gateway de IA. |
| 📦 **Catálogo de Produtos** | Visualização hierárquica de produtos por ramo e modalidade, detalhando coberturas técnicas e planos de tarifação. |
| 🛡️ **Pacotes de Coberturas** | Gestão de pacotes comerciais com pesquisa dinâmica, enriquecimento de nomes comerciais e regras de elegibilidade humanizadas. |
| ⚙️ **Seleção de Risco (DUP)** | Visualização em cards clicáveis e tabela com filtros por produto/ramo, passos de validação, ações (Rechazo, Tarifa, Auditoria) e modal de inspeção. |
| 🧮 **Motor de Tarifação (RTE)** | Editor visual avançado de fórmulas atuariais com árvore de nós, toolbox de objetos (Constantes, Variáveis, Funções Contêiner, Operadores) e validação de consistência. |
| 🔍 **Explorador de Dados** | Interface para consulta direta às coleções do MongoDB com busca por texto, paginação e visualizador formatado de JSON. |
| 📋 **Auditoria & Segurança (PECA)** | Rastreabilidade completa de alterações com autor, data/hora e modal de comparação lado a lado (diff visual). |
| 💬 **ACDC Copilot (Chatbot RAG)** | Assistente atuarial flutuante com busca vetorial + léxica na base de conhecimento e raciocínio avançado via AXET LLM. |
| 🔐 **Área Administrativa** | Gestão centralizada de usuários (RBAC), gerenciamento de ambientes MongoDB e governança do Local AI Gateway. |

---

## 🚀 Instalação e Execução Local Rápida

### 🪟 No Windows (Instalador One-Click via WSL2 / Nativo)
O Windows 10/11 roda todo o pipeline com aceleração total sem exigir comandos manuais complexos:

1. **Clone o repositório ou baixe o ZIP:**
   ```cmd
   git clone https://github.com/gcostabe/ACDC.git
   cd ACDC
   ```
2. **Dê duplo clique no arquivo `instalar_windows.bat`**:
   * Detecta subsistema WSL2 e ambiente Windows automaticamente;
   * Valida e instala Node.js 20, Python 3 e dependências em segundo plano via `winget`/`npm`;
   * Configura os templates de credenciais do Gateway de IA;
   * Cria o atalho **`Iniciar Cockpit NTT DATA.bat`** na sua **Área de Trabalho (Desktop)**.
3. **Uso diário:** Dê duplo clique no atalho da **Área de Trabalho** (ou execute `iniciar_windows.bat`). Ele inicializa o banco de dados, o Gateway de IA, o backend e o frontend, abrindo o navegador automaticamente em **`http://localhost:5173/`**.

---

### 🍏 No macOS (Instalador One-Click)
No macOS, a configuração inicial e os atalhos de mesa são configurados com um único comando:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/gcostabe/ACDC.git
   cd ACDC
   ```
2. **Execute o script de configuração inicial:**
   ```bash
   ./setup_mac.sh
   ```
   * Valida Python 3 e Node.js via Homebrew;
   * Concede permissões de execução e instala dependências npm;
   * Sincroniza credenciais ativas do AXET CLI / Okta automaticamente;
   * Cria o atalho clicável **`Iniciar Cockpit NTT DATA.command`** na sua **Mesa (Desktop)**.
3. **Uso diário:** Dê duplo clique no atalho da **Mesa** ou execute `./iniciar_mac.command`. Ele inicia os serviços e abre o navegador automaticamente em **`http://localhost:5173/`**.

---

## 🏗️ Arquitetura da Solução & Portas

```mermaid
flowchart LR
    subgraph Client["Cliente Web"]
        UI["Vite + React 19\nPorta 5173"]
    end

    subgraph Backend["Servidor de Aplicação"]
        API["Node.js + Express\nPorta 4000"]
        ENV["Environment Service\n(Reconexão Dinâmica)"]
        RAG["RAG Engine Híbrido"]
    end

    subgraph Storage["Persistência"]
        MNG[("MongoDB 7.0\nPorta 27017\nacdc_dup / acdc_rte")]
    end

    subgraph AI["Inteligência Artificial"]
        GW["Local AI Gateway\nPorta 8766 (Python 3.11)"]
        AXET["AXET Infrastructure\nOkta OIDC / GPT-5.6"]
    end

    UI -->|"REST API / JSON"| API
    API --> ENV --> MNG
    API --> RAG
    API -->|"Proxy / Chat / Embeddings"| GW
    GW -->|"Bearer Token (Okta)"| AXET
```

| Componente | Porta | Tecnologia | Papel no Sistema |
| :--- | :---: | :--- | :--- |
| **Frontend Web** | `5173` | React 19, Vite 8, Lucide Icons | Cockpit executivo, editores de regras e catálogo. |
| **Backend API** | `4000` | Node.js (ESM), Express | API REST, persistência, alternância de ambientes e RAG. |
| **Local AI Gateway** | `8766` | Python 3.11 nativo, AXET/Okta | Forwarding seguro de inferências e embeddings. |
| **MongoDB Local** | `27017` | MongoDB 7.0 (Docker) | Coleções DUP, RTE, Produtos, Pacotes e Regras Atuariais. |

---

## 🤖 Local AI Gateway & Conexão AXET (LLM)

A solução conta com o **Local AI Gateway embarcado** no repositório (`gateway/`), permitindo comunicação direta com modelos de inteligência artificial de última geração (`gpt-5.6-terra-high`, `gpt-4o`, `text-embedding-3-small`) através da infraestrutura corporativa AXET.

* **Sincronização com 1 Clique**: Se você utiliza o AXET CLI na máquina, basta rodar `./scripts/sync_okta.sh` (ou clicar em **Sincronizar** no painel administrativo). O token Okta é extraído e renovado automaticamente.
* **Segurança de Credenciais**: Arquivos de tokens (`tokens.json` e `user_identity.json`) são protegidos pelo `.gitignore`, prevenindo qualquer commit acidental de credenciais corporativas.
* **Painel de Governança**: Acesse **Administração > Gateway de IA & Okta (LLM)** para checar a saúde do serviço, validade restante do token e executar testes de inferência em tempo real com medição de latência.

---

## ⚙️ Gestão de Ambientes MongoDB na Aplicação

O ACDC permite cadastrar e alternar servidores de banco de dados diretamente pela interface visual, **sem necessidade de editar arquivos `.env` manuais**:

1. Acesse o Cockpit como Administrador.
2. Acesse **Administração > Ambientes & Conexões MongoDB**.
3. Clique em **+ Novo Ambiente** ou edite o **Servidor Remoto**:
   * Informe a URI do MongoDB corporativo (ex: `mongodb://user:password@servidor:27017/?authSource=admin`).
   * Clique em **Testar Conexão com este Banco** para validar conectividade e latência antes de salvar.
   * Clique em **Salvar e Ativar Agora**.
4. O backend reconecta os pools de dados dinamicamente em runtime sem derrubar o servidor Node.js.
5. **Fallback Automático**: Se o servidor remoto configurado ficar inalcançável na inicialização, o sistema faz fallback seguro para a base local Docker (`mongodb://localhost:27017`), mantendo a aplicação 100% operacional.

---

## 👥 Controle de Acesso e Usuários Padrão

A plataforma adota controle de acesso baseado em papéis (**RBAC**):

| Papel | Permissões |
| :--- | :--- |
| **ADMIN** | Acesso irrestrito a todas as telas, aprovação de novos usuários, gestão de conexões MongoDB e governança do Gateway de IA. |
| **ESCRITA** | Consulta completa, edição de fórmulas atuariais, alteração de regras de risco e pacotes de cobertura. |
| **LEITURA** | Consulta ao catálogo, motor de tarifação, visualização de regras, explorador de dados e uso do chatbot Copilot. |


---

## 📁 Estrutura do Repositório

```text
ACDC/
├── client/                      # Frontend SPA (React 19 + Vite 8)
│   ├── src/
│   │   ├── components/          # Abas e componentes do Cockpit
│   │   │   ├── AdminTab.jsx     # Aba unificada de Administração
│   │   │   ├── AiGatewayManagementTab.jsx # Governança do Gateway de IA
│   │   │   ├── EnvironmentsManagementTab.jsx # Gestão de Ambientes MongoDB
│   │   │   ├── RatingEngineTab.jsx # Editor de Cálculos Atuariais
│   │   │   ├── RiskRulesTab.jsx # Regras de Subscrição DUP
│   │   │   ├── CoveragePackagesTab.jsx # Pacotes de Coberturas
│   │   │   └── ChatBotWidget.jsx # Copilot RAG Flutuante
│   │   └── App.jsx              # Shell principal com design NTT DATA
├── server/                      # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── routes/              # Endpoints REST (auth, dup, rte, gateway, envs)
│   │   ├── services/            # Serviços de RAG, ambientes e ferramentas de IA
│   │   └── db.js                # Conexão dinâmica e reconexão MongoDB
│   └── data/                    # Persistência de ambientes (environments.json)
├── gateway/                     # Local AI Gateway Embarcado (Python 3.11)
│   ├── local_ai_gateway.py      # Servidor HTTP proxy reverso (:8766)
│   ├── config_loader.py         # Leitor de configurações toml/json
│   ├── sync_okta_identity.py    # Extrator e sincronizador de tokens AXET/Okta
│   ├── tokens.example.json      # Modelo de tokens para novos usuários
│   └── Dockerfile               # Containerização do gateway
├── scripts/                     # Scripts operacionais (start_gateway, sync_okta)
├── docker-compose.yml           # Orquestração do MongoDB 7.0 e AI Gateway
├── setup_mac.sh                 # Instalador One-Click macOS
├── iniciar_mac.command          # Launcher executável macOS
├── instalar_windows.bat         # Instalador One-Click Windows
├── iniciar_windows.bat          # Launcher executável Windows
└── README.md                    # Documentação oficial da plataforma
```

---

## 🔄 Sincronização com Repositórios Remotos (Dual Push)

Este repositório está configurado para envio simultâneo (**Dual Push**) para os dois repositórios oficiais:
* **Repositório Principal:** `https://github.com/gberbert/ACDC.git`
* **Repositório AXET REEF:** `https://github.com/gcostabe/AXET-ACDC-REEF.git`

Ao rodar:
```bash
git push origin main
```
O Git atualiza ambos os repositórios remotos simultaneamente em uma única operação.
