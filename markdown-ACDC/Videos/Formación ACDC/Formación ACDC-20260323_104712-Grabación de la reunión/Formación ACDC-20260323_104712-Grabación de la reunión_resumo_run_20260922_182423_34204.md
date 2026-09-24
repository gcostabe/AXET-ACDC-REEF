# Relatório de Análise Avançada de Transcrição

**Arquivo de origem:** `Formación ACDC-20260323_104712-Grabación de la reunión.mp4`
**Data de processamento:** 22/09/2026 18:35:58
**Modelo de transcrição:** whisper.cpp Metal (small) — idioma: es
**Modelo de interpretação IA:** axet-code (gpt-5.6-terra)
**Prompt utilizado:** análise sênior avançada (documentação funcional, arquitetura, negócio, riscos, Q&A, anti-alucinação)

---

# Análise estruturada — Ativo Digital, Oficina de Produto e Arquitetura de Cotação/Emissão

> **Nota de fidelidade:** a transcrição apresenta ruído de reconhecimento de voz, mistura de espanhol e português e siglas inconsistentes. Este documento preserva os termos quando não há segurança para corrigi-los. Em particular, aparecem referências a **“ativo digital”**, **“ACDC”**, **“RTE”**, **“DUB/DUPE”**, **“Polizón”**, **“taller”** e **“oficina de produto”**; algumas podem representar nomes internos, siglas ou termos reconhecidos incorretamente.

## 1. Síntese executiva

A reunião apresentou uma plataforma denominada, ao longo da transcrição, de **ativo digital**, concebida para centralizar e governar capacidades de produto de seguros: configuração de produtos, coberturas, ofertas comerciais, seleção de riscos, regras de negócio, tarifação, fórmulas, módulos, planos de pagamento e controles técnicos.

O ponto central não é apenas substituir um componente tecnológico. A direção apresentada é transferir parte relevante da configuração de produto — antes mais dependente de desenvolvimento de TI, tabelas estáticas ou múltiplas modalidades — para um ambiente governado, parametrizável e acessível às áreas de negócio ou técnica de produto. A chamada **oficina/taller de produto** seria a principal porta de entrada para essa administração.

A solução é formada por microsserviços internos, coordenados por um **orquestrador** que deverá se tornar a única exposição externa da plataforma. Esse orquestrador define quais validações, regras, módulos e cálculos precisam ser executados conforme o processo solicitado, evitando o acesso direto dos consumidores a cada microsserviço interno.

A arquitetura foi descrita como originalmente construída em Azure, com front-end em Angular, microsserviços em Java, base documental MongoDB e containers. A iniciativa busca reduzir dependência de fornecedor ou cloud específica, tendo sido mencionada uma disponibilização também em AWS. Ainda assim, a reunião reconhece que há pontos em evolução: segurança, testes de carga, disaster recovery, integração à plataforma corporativa de engenharia, cobertura de determinados dados de terceiros, migração e a maturidade da configuração funcional.

---

## 2. Contexto e antecedentes

A conversa situa o ativo digital como uma evolução de soluções e componentes construídos em momentos distintos para necessidades específicas de cotação, tarifação, seleção de riscos e produtos de Vida.

Segundo a apresentação, alguns elementos históricos foram:

- Um produto inicial identificado na transcrição como **PSIPD**, posteriormente chamado de **DUPE** e, aparentemente, renomeado por uma associação indesejada do termo em inglês.
- Um componente posterior, referido como **RTE**, originalmente voltado à funcionalidade de core de tarifação e cotações.
- Evoluções realizadas para produtos de Vida, especialmente em **Uruguai**, **Panamá**, **Espanha** e com expectativa de uso no **Brasil**.
- Incorporação progressiva de capacidades de:
  - módulos e agrupamentos de coberturas;
  - seleção de riscos;
  - planos de pagamento;
  - regras configuráveis;
  - fórmulas;
  - ofertas comerciais;
  - orquestração centralizada.

A reunião sugere que a plataforma não surgiu como um produto único, desenhado integralmente desde o início. Ela foi consolidada a partir de microsserviços e capacidades que nasceram em projetos diferentes e agora são reunidos sob a visão de ativo digital.

---

## 3. Problemas identificados

### 3.1 Dependência excessiva de TI para alterações de produto

Foi relatado que, em um modelo anterior, necessidades comerciais levavam à criação de múltiplas estruturas estáticas, aparentemente chamadas de modalidades ou agrupamentos. Isso tornava a operação menos flexível e aumentava a dependência da área de TI.

O ativo digital é apresentado como uma forma de deslocar parte dessa responsabilidade para a parametrização de negócio ou de produto. A intenção é que alterações como combinação de coberturas, capitais, obrigatoriedades e elegibilidade possam ser configuradas sem exigir uma mudança estrutural de software para cada variação.

### 3.2 Multiplicação de modalidades para representar ofertas

A reunião discutiu a diferença entre:

- **modalidade**: estrutura ou linha de produto;
- **oferta comercial**: combinação de coberturas, valores, capitais e condições oferecida a determinado público dentro de uma modalidade.

O problema citado é que se poderia criar diversas modalidades para representar diferenças que, em muitos casos, podem ser tratadas como ofertas comerciais configuráveis. Isso tende a aumentar a complexidade do produto e impactar processos posteriores, como sinistros, pagamentos e demais integrações.

A conclusão apresentada não foi que modalidades deixam de existir. A orientação foi que a definição depende do produto: algumas diferenças são adequadamente tratadas como oferta; outras podem demandar modalidades distintas devido às consequências operacionais e funcionais.

### 3.3 Acúmulo de cotações no transacional

Foi destacado que registrar automaticamente todas as cotações no sistema transacional pode gerar volume excessivo, principalmente quando a taxa de conversão é baixa.

O exemplo mais expressivo foi o Brasil, onde foram mencionadas milhões de cotações e uma elevada geração de volume, inclusive associada a automatismos, robôs ou rastreadores. A consequência relatada foi pressão sobre a base e sobre o sistema transacional.

A direção proposta é manter a cotação no ativo digital e materializá-la em orçamento apenas quando o fluxo de contratação exigir esse passo. Assim, a cotação poderia existir de forma independente do transacional.

### 3.4 Crescimento indefinido da base documental

A plataforma utiliza MongoDB, segundo a transcrição. Foram citados como fontes de crescimento:

- cotações;
- auditoria de entrada e saída;
- rastreabilidade de cálculos;
- registros de chamadas e execuções;
- informações históricas do processo.

Foi mencionada uma funcionalidade do MongoDB reconhecida na transcrição como **“Kylo”**, possivelmente um termo reconhecido de forma imprecisa. A finalidade descrita é a historificação automática de grandes coleções, mantendo dados disponíveis para consulta sem permitir que a base operacional cresça indefinidamente.

### 3.5 Dados insuficientes de terceiros no objeto transacional

Uma preocupação recorrente foi a disponibilidade de dados de terceiro para validações de seleção de risco. A plataforma parece trabalhar principalmente com um objeto chamado **“Polizón”**, possivelmente uma estrutura de apólice/payload de negócio.

Os participantes observaram que nem todos os dados necessários para avaliação chegam nesse objeto. Foram citados exemplos de:

- ocupação;
- tempo de residência no país;
- condição PEP;
- data de inclusão como PEP;
- informações completas de tomador, pagador, segurado ou demais intervenientes.

Foi discutido que algumas informações podem existir em uma API de terceiros separada, citada como algo semelhante a **“get-insured-party”**, mas não há confirmação suficiente sobre o nome exato ou a integração definitiva.

### 3.6 Risco de divergência entre regras do ativo e regras do produto transacional

A reunião reconheceu que, enquanto a centralização não estiver completa, regras poderão coexistir no ativo digital e no sistema transacional. Isso cria risco de:

- preços divergentes;
- condições de oferta inconsistentes;
- validações distintas;
- comportamento diferente entre cotação, orçamento, emissão e demais processos.

A direção desejada é concentrar progressivamente a lógica de produto no ativo digital, mantendo o produto transacional como autoridade final quando existir uma condição obrigatória ainda não coberta pelo ativo.

---

## 4. Solução apresentada

A solução é uma plataforma de capacidades de produto e decisão, não apenas um cotizador. Ela foi apresentada como um conjunto integrado de componentes que recebem dados de negócio, aplicam regras e devolvem resultados relacionados a elegibilidade, risco, coberturas, valores, condições e planos.

A proposta é que a plataforma possa:

1. receber uma solicitação de cotação, orçamento, emissão ou validação;
2. identificar o tipo de processo e o fluxo aplicável;
3. validar atributos de entrada;
4. aplicar controles técnicos;
5. avaliar seleção de riscos;
6. determinar ofertas comerciais possíveis;
7. aplicar módulos e coberturas;
8. executar tarifação e fórmulas;
9. realizar eventuais recálculos;
10. devolver a resposta ao canal ou sistema consumidor;
11. registrar auditoria, tempos e chamadas internas.

A solução é apresentada como configurável em diferentes níveis. Há configurações mais simples, feitas por dados e regras; fórmulas intermediárias, potencialmente configuráveis; e fórmulas ou capacidades complexas que continuam demandando implementação técnica em Java.

---

## 5. Arquitetura lógica consolidada

> **Representação analítica:** o desenho abaixo consolida informações distribuídas na reunião. Não foi apresentado como diagrama literal único.

```text
Canais e consumidores
- Cotizador dinâmico
- Front-ends de canais
- Processos batch
- Processos de orçamento/emissão
- Outros sistemas consumidores
            ↓
Camada de entrada e segurança
- Balanceador
- Autenticação/IDP corporativo
- Orquestrador do ativo digital
            ↓
Orquestração de processo
- Fluxos batch
- Fluxos online
- Validações por etapa
- Definição de chamadas internas
            ↓
Microsserviços internos
- Seleção de riscos / DUB
- RTE / tarifação
- Módulos e coberturas
- Fórmulas
- Planos de pagamento
- Ofertas comerciais
            ↓
Dados e capacidades transversais
- MongoDB
- Cache de regras
- Auditoria de requisições/respostas
- Gestão de segredos
- Observabilidade e alertas
            ↓
Integrações e sistemas externos
- Sistemas transacionais
- APIs de terceiros
- Plataforma de eventos, quando aplicável
- Plataforma documental
- Assinatura digital
```

### 5.1 Orquestrador como ponto único de entrada

A arquitetura desejada é que os microsserviços internos não sejam consumidos diretamente por canais ou aplicações externas. O orquestrador deve:

- centralizar o acesso;
- aplicar segurança;
- determinar o fluxo adequado;
- chamar somente os módulos necessários;
- ordenar chamadas internas;
- controlar validações prévias à tarifação;
- reduzir acoplamento entre consumidores e microsserviços;
- concentrar auditoria e rastreabilidade.

A reunião esclareceu que “entrada única” não significa que todos os módulos serão obrigatoriamente executados em todos os casos. Se uma capacidade não se aplica — por exemplo, seleção de riscos sem regras configuradas — o fluxo pode não produzir ação relevante nesse módulo ou pode desviar diretamente para o componente necessário.

### 5.2 Comunicação interna e latência

Foi relatado que o orquestrador pode realizar múltiplas chamadas internas para completar um processo. Isso foi considerado crítico para desempenho, especialmente em cotação.

A intenção é que essas chamadas ocorram internamente, reduzindo o caminho externo por balanceadores e outros pontos de integração. Foram considerados outros protocolos além de HTTP, mas a transcrição indica que ainda não foi identificada necessidade concreta de mudança.

### 5.3 Sem fila intermediária no fluxo síncrono

Foi perguntado se haveria fila ou mensageria intermediária para absorver picos de requisição. A resposta foi que, no fluxo apresentado, não existe fila intermediária.

A estratégia citada é escalar containers conforme limites e percentuais configurados na infraestrutura gerenciada. A necessidade será confirmada por testes de estresse com produto real.

---

## 6. Oficina de produto como mecanismo de governança

A oficina de produto, chamada repetidamente de **taller**, foi apresentada como a principal interface de parametrização e governo do ativo digital.

Ela concentra ou tende a concentrar:

- especificações gerais de produto;
- ramos;
- contratos e subcontratos;
- atributos ou dados variáveis;
- coberturas e respectivas características;
- regras de seleção de risco;
- ofertas comerciais;
- permissões;
- administração por perfil;
- ações permitidas, como criar, alterar, excluir e exportar;
- definições comuns em nível de companhia.

A mensagem central foi que o produto precisa existir e estar definido antes de suas regras e ofertas serem operacionalizadas no ativo digital. A oficina não substitui a definição de produto; ela atua como o ambiente que governa sua configuração.

### 6.1 Controle de alterações retroativas

Foi explicitamente mencionado que regras de negócio com vigência anterior podem impactar o negócio. Por isso, alterações retroativas devem passar por controles adicionais, descritos como um **“double check”**, em articulação com um time identificado na transcrição como **FFT**.

Não foi possível determinar, pela transcrição, a composição desse time nem o processo completo de aprovação. O que ficou claro é que nem todos os usuários poderão realizar alterações retroativas.

### 6.2 Permissões e segregação de funções

A oficina possui controles de autorização por papel. Foram citadas permissões para:

- criar;
- alterar;
- excluir;
- exportar;
- operar partes específicas de um componente.

Essa capacidade é relevante porque o objetivo é ampliar a autonomia de negócio ou áreas técnicas de produto sem permitir mudanças irrestritas em regras que possam afetar operação, preço ou contratação.

---

## 7. Modalidades, ofertas comerciais e produto

### 7.1 Conceito de oferta comercial

No contexto apresentado, uma oferta comercial equivale, em determinados países, ao que pode ser chamado de plano. Ela representa uma combinação de:

- coberturas;
- capitais ou somas seguradas;
- obrigatoriedades;
- condições de elegibilidade;
- público ou segmentação;
- regras aplicáveis.

Foi dado o exemplo de planos A, B e C para diferentes perfis, como diretivos, administrativos ou trabalhadores de planta.

### 7.2 Segmentação por atributos

A plataforma permite associar uma oferta a atributos de entrada. Se o dado recebido identifica, por exemplo, que a pessoa pertence a determinado grupo, uma regra pode determinar qual oferta será disponibilizada.

A mudança de paradigma apresentada é:

```text
Segmentos representados por múltiplas estruturas estáticas
↓
Maior dependência de TI e maior número de modalidades
↓
Dificuldade para alterar condições comerciais
↓
Configuração de atributos, regras e ofertas no ativo digital
↓
Maior flexibilidade de negócio
```

### 7.3 Oferta dentro de modalidade

A reunião esclareceu que uma modalidade pode conter múltiplas ofertas comerciais. Isso permite variar cobertura e capital sem necessariamente criar uma nova modalidade.

Exemplos mencionados:

- Uma modalidade individual de Vida com três ofertas, diferenciadas pelo capital de cobertura por morte: USD 12 mil, USD 20 mil e USD 30 mil.
- Uma modalidade de caminhões com diferentes ofertas para perfis ou necessidades comerciais distintas.
- Produtos com uma única modalidade e múltiplas ofertas em Uruguai e Panamá.

### 7.4 Limite da flexibilidade

Os participantes também ressaltaram que a escolha entre modalidade e oferta não é apenas uma questão de interface comercial. Pode haver impacto posterior em sinistros, pagamentos e outras estratégias de produto.

Portanto, o ativo digital oferece flexibilidade, mas a estrutura final deve continuar obedecendo ao desenho do produto. Em termos resumidos: **o produto é a referência final; a plataforma amplia a capacidade de configurá-lo.**

---

## 8. Componentes funcionais mencionados

### 8.1 Seleção de riscos

A seleção de riscos foi apresentada como uma capacidade separada do produto histórico DUB/DUPE, embora originada no mesmo contexto.

Ela avalia regras para determinar se determinada condição deve gerar, entre outros resultados:

- aceitação;
- rejeição;
- revisão;
- exigência de documentação;
- questionário;
- exclusão;
- aviso;
- alteração de tarifa;
- reprocessamento, ainda em incorporação segundo a transcrição.

A seleção de riscos usa uma biblioteca leve de regras, identificada como **EasyRules**. A reunião destacou que não se trata de um motor de regras completo, mas de uma biblioteca usada para avaliar a aplicação de regras conforme a configuração.

### 8.2 RTE e tarifação

O RTE é descrito como a capacidade de cálculo e tarifação. Inicialmente, teria suportado cotações e funcionalidades de tarifação; posteriormente foi enriquecido com:

- novos tipos de fórmulas;
- bases técnicas;
- conceitos de subscrição;
- controles técnicos;
- capacidade de calcular valores relacionados à cobertura e risco.

A reunião também descreve uma lógica de **dupla passagem**: após um cálculo inicial, determinados controles técnicos podem exigir recálculo. Nessa situação, o processo retorna à tarifação para produzir o resultado ajustado.

### 8.3 Módulos e coberturas

O componente de módulos nasceu em contexto de Vida. Ele trata agrupamentos de coberturas, dados variáveis associados e comportamento dessas coberturas.

Foi associado à necessidade de produtos multirriscos, como exemplos de composição familiar — pai, mãe e filho — em que certas coberturas ou percentuais dependem de outra pessoa segurada.

A transcrição afirma que essa capacidade já existe, mas ainda não estaria certificada para determinados contextos, sendo mencionada como relevante para Brasil e possivelmente para países da América Central.

### 8.4 Planos de pagamento

Há referência a um microsserviço de planos de pagamento, evoluído para incorporar parametrização de planos que já existia em capacidades anteriores.

No fluxo geral, esse módulo tende a ser chamado ao final, devolvendo uma lista de opções de pagamento aplicáveis às ofertas comerciais.

### 8.5 Fórmulas

O ativo digital possui uma capacidade de fórmulas em evolução, com dois grupos principais.

#### Fórmulas configuráveis

São fórmulas de menor complexidade, que podem usar parâmetros, valores de entrada e operações matemáticas. Foi citada a biblioteca **MXParser** — transcrita como “MX Parse” — como solução para permitir a definição e execução de fórmulas matemáticas.

Foram atribuídas a ela capacidades como:

- definição de fórmulas matemáticas;
- composição de fórmulas;
- rastreabilidade de execução;
- desempenho significativamente melhor em testes relatados;
- potencial de configuração sem programação Java em alguns cenários.

#### Fórmulas técnicas em Java

Fórmulas muito complexas continuam sendo implementadas em Java. O motivo relatado é que podem depender de:

- múltiplos dados de entrada;
- bases técnicas;
- históricos;
- lógica extensa;
- composição de funções menores;
- regras consolidadas há muitos anos.

Foi citado o caso de fórmulas de Espanha originalmente em Cobol e posteriormente levadas para Java. Essas fórmulas fariam parte de um catálogo central e poderiam ser reutilizadas, mas não necessariamente alteradas livremente por cada país.

### 8.6 Validador de fórmulas

Foi mencionada uma ferramenta em desenvolvimento, identificada como **validador de fórmulas**, ainda em versão básica. A intenção é que um atuário possa informar parâmetros, executar uma fórmula e visualizar sua rastreabilidade.

A transcrição não permite afirmar que essa ferramenta já esteja pronta ou disponível para todos os países.

---

## 9. Modelo de regras

### 9.1 Estrutura básica

A lógica de regras foi explicada em duas partes:

1. **Condição**: determina se uma regra se aplica.
2. **Ação**: determina o que ocorre quando a condição é satisfeita.

As condições podem usar fatores derivados da estrutura de entrada, constantes e outros parâmetros registrados na plataforma.

### 9.2 Fatores derivados do “Polizón”

O orquestrador transforma campos do objeto de entrada — referido como Polizón — em fatores que podem ser utilizados por regras.

Esses fatores podem servir para:

- comparações;
- validações;
- cálculos;
- parâmetros de fórmulas;
- decisões de elegibilidade;
- seleção de oferta;
- controles técnicos.

A capacidade depende de os dados necessários estarem presentes e estruturados no objeto recebido.

### 9.3 Evolução das condições

Foram descritos ao menos dois níveis de condição:

| Nível | Característica |
|---|---|
| Condições atômicas | Comparações como maior, menor, igual, pertencente a lista ou existência de valor |
| Condições estruturadas | Combinações mais complexas de atributos e operadores |

Para condições complexas, foi mencionada uma biblioteca chamada **Janino**, usada para transformar código Java armazenado em MongoDB em objetos executáveis em runtime.

### 9.4 Segurança na execução dinâmica

A reunião reconheceu explicitamente o risco de permitir código configurável armazenado em banco. O risco seria a introdução de código malicioso ou indevido, com tentativas de acessar sistema operacional, bibliotecas não autorizadas ou operações destrutivas.

Como resposta, a arquitetura descrita inclui:

- lista restrita de métodos disponibilizados;
- lista restrita de bibliotecas Java;
- contexto limitado de execução;
- bloqueio de bibliotecas fora da lista permitida;
- tratamento de determinados padrões como inválidos sem tentativa de execução.

> **Leitura analítica:** a solução busca conciliar configurabilidade avançada com controles de execução. Mesmo assim, a reunião não detalha testes de segurança, processo formal de revisão de regras ou modelo completo de aprovação para código complexo.

### 9.5 Cache de regras

Para evitar consultas repetidas ao MongoDB e não avaliar regras irrelevantes em cada etapa, foi implementado uso de cache.

O objetivo é manter em memória:

- regras frequentes;
- regras aplicáveis ao produto e à etapa em execução;
- configurações frequentemente consultadas.

A primeira execução de uma regra dinâmica pode sofrer custo de compilação/serialização; execuções seguintes podem reutilizar a versão mantida em cache. Caso o serviço seja reiniciado, a regra pode precisar ser reconstruída novamente.

---

## 10. Fluxos operacionais: batch e online

A reunião distinguiu dois grupos principais de serviços:

| Grupo | Finalidade descrita |
|---|---|
| Batch | Processos mais completos ou processamentos em lote |
| Online | Operações pontuais e interativas, acionadas conforme etapa da jornada |

### 10.1 Fluxo batch

O fluxo batch foi descrito, em alto nível, como uma sequência que pode envolver:

1. controles técnicos sobre dados fixos;
2. dados variáveis;
3. validações prévias;
4. beneficiários;
5. nível de risco;
6. módulos;
7. avaliação de ofertas comerciais;
8. controles técnicos de tarifa;
9. tarifação;
10. possível dupla passagem;
11. controles de finalização;
12. cláusulas;
13. planos de pagamento.

Quando uma oferta já é indicada no processo batch, a plataforma verifica se ela é aplicável à operação e ao produto informado. Já em cenários online, a plataforma pode disponibilizar as ofertas comerciais possíveis para escolha.

### 10.2 Fluxo online

No fluxo online, o front-end pode realizar chamadas em momentos específicos da jornada. Foram citados exemplos como:

- validar atributos de informação geral;
- validar dados variáveis após alteração;
- realizar controles técnicos ao finalizar uma etapa;
- executar validações específicas sem submeter toda a operação.

A plataforma pode agrupar internamente várias etapas em uma única chamada do front-end, evitando que a aplicação cliente precise fazer múltiplas chamadas sequenciais.

### 10.3 Ordem de execução

Foi reforçado que a tarifação não deve ser chamada diretamente sem validações anteriores. Antes de calcular preço, devem ser verificadas condições como:

- limites;
- coberturas obrigatórias;
- requisitos econômicos;
- controles técnicos aplicáveis.

Essa ordem é definida pelo fluxo orquestrado e não deve ficar livremente exposta ao consumidor externo.

---

## 11. Integração com cotação, orçamento e emissão

### 11.1 Cotação independente do transacional

Uma das direções mais importantes da reunião é separar cotação do sistema transacional. A cotação pode ser criada, consultada e mantida no ativo digital sem precisar gerar imediatamente orçamento ou registro no core transacional.

Quando a contratação avançar, a cotação poderá ser utilizada para materializar um orçamento, que então seguirá o fluxo normal de contratação e emissão.

### 11.2 Recuperação de cotações

Foi mencionado que as cotações deverão permanecer como objetos recuperáveis. Isso permitiria analisar, por exemplo:

- diferentes preços calculados;
- mudanças de veículo ou risco;
- versões de uma cotação;
- taxa de conversão;
- seleção de uma cotação específica para continuidade.

A transcrição não define o período de retenção, os critérios de expurgo nem os mecanismos exatos de pesquisa.

### 11.3 Diferença entre cotação e orçamento

A conversa indicou que há diferenças de prática entre países e produtos:

- alguns começam por cotação rápida;
- outros trabalham diretamente com orçamento;
- alguns produtos podem converter orçamento em apólice sem uma etapa de cotação independente.

Portanto, a plataforma deve centralizar as capacidades, mas o fluxo final continua dependente do produto e da realidade local.

### 11.4 Cotização a partir de Neutron

Foi perguntado se seria possível cotar a partir de algo transcrito como **Neutron**. A resposta foi que, na proposta atual, a cotação ocorreria a partir de outro ponto, aparentemente o orçamento, mas que esse tema ainda precisava ser detalhado.

Não é possível concluir que a capacidade esteja disponível ou descartada definitivamente.

---

## 12. Observabilidade, auditoria e tratamento de falhas

### 12.1 Auditoria de chamadas

O orquestrador registra, de forma síncrona no MongoDB, informações relacionadas a:

- requisição;
- resposta;
- chamadas intermediárias;
- tempos;
- resultado de cada etapa;
- erros de execução.

Foi dito que isso permitirá apoiar configuração de produto e desenvolvimento, especialmente em fluxos que envolvem dezenas de chamadas internas.

### 12.2 Configuração de auditoria

A auditoria seria configurável. A reunião citou possibilidades como registrar:

- somente requisições e respostas principais;
- todas as chamadas;
- apenas chamadas com erro.

Essa flexibilidade é relevante devido ao impacto potencial de volumetria.

### 12.3 Alertas e indisponibilidade

A infraestrutura gerenciada — AWS ECS/Fargate ou Azure, conforme o ambiente — seria responsável por gerar alertas de serviços indisponíveis ou operações com falhas recorrentes.

Para falhas de operações, a plataforma tende a retornar erro, mencionado como **HTTP 422**, quando uma etapa não pode ser recuperada.

### 12.4 Circuit breaker

Foi mencionado um mecanismo de **circuit breaker** para situações como indisponibilidade do MongoDB ou falhas repetidas. A descrição sugere tentativas posteriores e contenção de falhas, mas não detalha:

- política de retry;
- tempos de espera;
- tratamento de idempotência;
- comportamento para operações parcialmente concluídas.

### 12.5 Intervenção humana

Foi considerada a possibilidade de alertas e de um modelo de intervenção humana, referido como **“man in the loop”**, para tratar casos excepcionais. A transcrição não confirma que esse processo já esteja implantado.

---

## 13. Arquitetura de infraestrutura e multicloud

### 13.1 Arquitetura original em Azure

A arquitetura inicial foi descrita com:

- front-end em Angular;
- microsserviços em Java;
- MongoDB como base documental;
- containers;
- Azure Kubernetes Service;
- Azure Container Registry;
- Key Vault;
- Azure AD/Entra ID, embora o termo tenha sido reconhecido com ruído;
- serviços de analytics do Azure;
- Azure Files para troca de arquivos, em um caso anterior.

### 13.2 Motivação de portabilidade

A premissa declarada foi minimizar o **vendor lock-in**. A estratégia foi empacotar componentes em containers e evitar dependência excessiva de serviços específicos de uma cloud.

A evidência apresentada é a disponibilização da mesma aplicação também em AWS.

### 13.3 Equivalências mencionadas em AWS

| Necessidade | Azure citado | AWS citado |
|---|---|---|
| Orquestração/execução de containers | Kubernetes / AKS | ECS Fargate |
| Segredos | Key Vault | Secrets Manager |
| Observabilidade | Azure Analytics | CloudWatch |
| Armazenamento de arquivos | Azure Files | S3 |
| Registro de containers | ACR | Não detalhado com segurança |

### 13.4 Identidade

Foi perguntado se a mudança para AWS alteraria a segurança de autenticação. A resposta foi que a identidade continuaria baseada em Azure, independentemente do local de execução da aplicação.

Também foi mencionado que os microsserviços legados possuíam segurança mais permissiva — basicamente validação de token — e que uma evolução de segurança estava planejada para a semana seguinte à reunião. A sigla da solução de autorização mencionada não ficou clara na transcrição.

### 13.5 Evolução planejada no Azure

Embora Kubernetes tenha sido usado inicialmente, foi mencionada a intenção de evoluir para um serviço gerenciado de containers em Azure, reconhecido na transcrição como **ACAR**. O termo pode corresponder a um serviço Azure específico, mas não é seguro corrigir a nomenclatura sem evidência adicional.

A motivação relatada é reduzir esforço operacional de atualizar e administrar Kubernetes.

---

## 14. Ciclo de vida do produto e ambientes

### 14.1 Linha única de software core

O software do ativo digital teria uma única linha principal de desenvolvimento, chamada de **Core**. Essa linha é responsável por evoluções de código e pela disponibilização de versões para diferentes instâncias e países.

A configuração de produto, por outro lado, pode ter ciclo próprio e não necessariamente acompanhar toda alteração de software.

### 14.2 Ambientes citados

Foram mencionados, em diferentes momentos:

- desenvolvimento;
- recepção;
- integração;
- pré-produção;
- produção;
- desenvolvimento de migração;
- pré-produção de migração.

Para Brasil, foram mencionados como principais:

| Ambiente | Situação descrita |
|---|---|
| Recepção | Previsto |
| Desenvolvimento | Previsto |
| Integração | Previsto |
| Pré-produção | Previsto |
| Produção | Previsto |
| Desenvolvimento de migração | Não necessário inicialmente; pode ser ativado depois |
| Pré-produção de migração | Não necessário inicialmente; pode ser ativado depois |

### 14.3 Atualização de versões

O objetivo declarado é manter as instâncias o mais próximas possível da versão atual do Core. Contudo, foi reconhecido que isso ainda não ocorre de forma uniforme:

- algumas instâncias estariam mais atualizadas;
- Uruguai teria defasagem maior;
- Centroamérica estaria mais próxima da versão recente.

### 14.4 Regra específica por país

A reunião distinguiu:

- **software e capacidades core**, governados na linha central;
- **dados e configuração de produto**, governados por país;
- **fórmulas específicas**, que podem existir no catálogo Core e ser usadas conforme necessidade local.

Foi afirmado que não deve haver uma linha de software independente por ambiente ou país. Uma necessidade específica deve ser desenvolvida no Core e então disponibilizada para as instâncias aplicáveis.

---

## 15. Outros produtos e ambientes compartilhados

### 15.1 Oficina de produto

Foram previstas três instâncias:

| Instância | Cobertura descrita |
|---|---|
| Integração | Recepção, desenvolvimento e integração/preparação, conforme interpretação da fala |
| Pré-produção | Ambiente de pré-produção |
| Produção | Produção |

A transcrição contém trechos ambíguos sobre a cobertura exata de cada instância. A intenção geral é reduzir o número de instalações sem impedir a separação necessária de produção.

### 15.2 Plataforma documental

A plataforma documental inclui componentes reconhecidos como **FIS** e **Papitín**, além de uma evolução para disponibilizar algo chamado **Hasper/Hasper Record**.

Foram mencionadas apenas duas instâncias:

- não produtiva, atendendo até pré-produção;
- produtiva.

Foi reportado um problema anterior ao compartilhar documento entre integração e pré-produção: uma cotação poderia recuperar PDF associado a outro número ou ambiente. A solução anterior teria envolvido ajuste de ciclo/numeração, mas a transcrição não detalha a solução definitiva para a nova arquitetura.

### 15.3 Plataforma de eventos

Foram mencionados três contextos:

- integração;
- pré-produção;
- produção.

A criação de ambientes adicionais teria custo, pois envolveria tópicos e partições. A orientação seria criar sob demanda quando houver necessidade real.

### 15.4 Cotizador dinâmico

Por padrão, seriam mantidas instâncias ou referências para integração, pré-produção e produção. A necessidade de uma instância própria de desenvolvimento deveria ser determinada conforme a configuração do cotizador.

Houve debate sobre a necessidade de separar desenvolvimento e integração para permitir depuração sem depender de uma versão estável compartilhada.

### 15.5 Assinatura digital

Foi citado um componente denominado algo semelhante a **Saint-for-all**, alinhado ao modelo de ambientes da gestão documental: um não produtivo e um produtivo. O nome não está suficientemente claro na transcrição.

---

## 16. Cotizador dinâmico

O cotizador dinâmico foi caracterizado como um gerador configurável de portais ou jornadas de cotação.

Segundo a explicação:

- os fluxos não precisam ser programados integralmente de forma fixa;
- a configuração define quantas etapas existem;
- cada etapa recebe os campos necessários;
- a informação transita em uma estrutura denominada “borrador”;
- esse borrador percorre estados e integrações até chegar à cotação final.

A intenção é que a oficina de produto também governe comportamentos do cotizador. Os canais externos tenderiam a “pintar” ou apresentar a experiência definida, ainda que evoluções específicas possam exigir desenvolvimento.

### Limitação reconhecida

A reunião não concluiu completamente como diferentes versões de produto e diferentes ambientes do cotizador serão sincronizados quando existirem mudanças em campos ou integrações de canal.

---

## 17. Migração

A discussão sobre migração indicou três cenários:

| Cenário | Descrição |
|---|---|
| Automática Big Bang | Migração em massa, citada como utilizada de “Tron web” para “RIF” |
| Automática com batch | Emissão de apólices por lote quando a qualidade dos dados permite |
| Semiautomática | Extração e transformação até determinado ponto; usuário completa dados manualmente |

Foi feita distinção importante:

- se a migração for apenas transformação e carga de dados, pode não passar pelo ativo digital;
- se a migração acionar processo de emissão de apólice, deverá envolver o ativo digital.

Para Brasil, os ambientes específicos de migração não seriam necessários na fase inicial, mas poderão ser ativados quando a etapa de migração começar.

---

## 18. Desempenho e escalabilidade

### 18.1 Indicadores citados

| Indicador | Valor mencionado | Contexto |
|---|---:|---|
| Emissão em teste massivo | 1.000 apólices | Teste citado durante a reunião |
| Taxa observada | 1,2 segundos por apólice | Emissão de 1.000 apólices |
| Objetivo | Menos de 2 segundos | Processo de cálculo e validação, não necessariamente todo o fluxo de emissão |
| Volume no Brasil | 6 milhões | Cotações ou registros associados ao cenário anterior; contexto exato não totalmente claro |
| Geração de cotações | 300 mil por dia | Exemplo de rastreadores/automatismos citado para explicar broker de eventos |

> Os números foram declarados oralmente durante a reunião e não foram apresentados como métricas auditadas.

### 18.2 Objetivo de desempenho

O objetivo não é necessariamente que toda emissão de apólice ocorra abaixo de dois segundos, porque a emissão completa depende de integrações e recuperação de muitos dados.

A meta mencionada é manter abaixo de dois segundos o processo de cálculo e validação associado ao ativo digital.

### 18.3 Próximos testes

Foi indicado que serão realizados testes de desempenho com produto real de Espanha. Esses testes devem avaliar:

- tempo de resposta;
- comportamento sob carga;
- escalabilidade de containers;
- possíveis ineficiências de integrações remotas;
- necessidade de ajustar parâmetros de infraestrutura;
- impacto de seleção de riscos e demais chamadas internas.

---

## 19. Continuidade, disaster recovery e disponibilidade

Foi discutida a definição de **DDR/DR**, isto é, recuperação de desastre, para Brasil e Espanha.

As opções avaliadas incluem:

- manter nó(s) de MongoDB em zona de recuperação;
- usar sincronização quase em tempo real entre primário e DR;
- reduzir perda potencial de dados ao atraso de replicação;
- publicar software também na zona de DR;
- manter infraestrutura de contingência desligada, mas pronta para ativação;
- ativar serviços, nós de banco e redirecionamento de DNS em caso de desastre.

Foi mencionado o uso de **Route 53** para alteração de DNS, o que reforça o cenário AWS nesse trecho.

### Ponto importante

A decisão de ativar DR não seria uniforme para todos os produtos. Ela deve considerar qual serviço falhou e quais produtos dependem dele. Por exemplo, um problema de Oracle pode afetar determinados sistemas, enquanto o ativo digital baseado em MongoDB poderia não estar diretamente afetado.

A reunião não definiu:

- RTO;
- RPO;
- topologia definitiva;
- região ou zonas;
- modelo de failover;
- responsabilidade operacional;
- critérios formais de ativação.

---

## 20. Operação, suporte e manutenção

A operação da infraestrutura e dos produtos deve ser conduzida pelo time de infraestrutura. Problemas devem ser canalizados por esse time, exceto falhas atribuíveis diretamente ao desenvolvimento do produto.

O fluxo de suporte esperado é:

```text
Incidente ou problema
↓
Equipe de infraestrutura / linha de manutenção
↓
Triagem
↓
Encaminhamento ao time de construção/desenvolvimento, se necessário
```

A reunião também indicou que o componente, inicialmente sustentado pelo time de projeto, será transferido para a operação de emissão/manutenção por se tornar uma peça permanente do ecossistema.

---

## 21. Plataforma de engenharia e governança de entrega

Foi mencionada a necessidade de integrar o ativo digital à plataforma corporativa de engenharia. A plataforma ainda não estaria completamente integrada ao fluxo atual de governança e liberação.

A intenção é que a plataforma de engenharia governe:

- liberação de versões;
- linha base do ativo digital;
- controle de evolutivos;
- integração com ferramentas corporativas;
- processo de entrega do projeto para a operação.

A reunião não detalha pipeline de CI/CD, ferramentas, critérios de aprovação, estratégia de rollback ou política de release.

---

## 22. Casos concretos citados

### 22.1 Brasil

**Contexto**

Brasil aparece como um dos principais destinos da plataforma e como cenário que exige atenção para escala, produtos multirriscos, volumetria de cotações e regras específicas.

**Elementos citados**

- Produtos com estruturas familiares e dependência entre coberturas.
- Alto volume de cotações.
- Possível uso de automações ou robôs que intensificam esse volume.
- Necessidade de evitar sobrecarregar o transacional.
- Necessidade de fórmulas específicas, possivelmente complexas.
- Ambientes definidos para recepção, desenvolvimento, integração, pré-produção e produção.
- DR a ser definido.
- Necessidade de avaliar dados de terceiros e estrutura de entrada.

**Limitações e pendências**

- Certificação da capacidade multirriscos não foi confirmada.
- Ambientes de migração não são necessários inicialmente.
- Regras específicas ainda precisam ser levantadas e configuradas.
- Modelo final para dados de terceiros e algumas validações permanece em discussão.

### 22.2 Espanha

**Contexto**

Espanha foi usada como referência de fórmulas complexas, produtos em produção e testes futuros de performance.

**Elementos citados**

- Fórmulas históricas originalmente em Cobol, migradas para Java.
- Regras e cálculos complexos, em alguns casos com décadas de existência.
- Produto real de Espanha será usado para testes de desempenho.
- Existência de instância própria de produto.
- Uso de catálogo Core para fórmulas.

**Limitações**

Não foi detalhado quais fórmulas podem ser reutilizadas em outros países nem como se dará seu ciclo de alteração.

### 22.3 Uruguai

**Contexto**

Uruguai foi mencionado como caso de Vida e como exemplo de uso de uma única modalidade com múltiplas ofertas.

**Elementos citados**

- Produto de Vida utilizado na evolução de módulos e seleção de riscos.
- Três ofertas comerciais dentro de uma modalidade, em um dos exemplos.
- Instância com versão mais defasada em relação ao objetivo de alinhamento com Core.

### 22.4 Panamá

**Contexto**

Panamá aparece como implantação existente e caso de regras relacionadas a terceiros, como PEP.

**Elementos citados**

- Duas ofertas comerciais em uma modalidade, conforme exemplo.
- Regra de PEP citada como exemplo de informação necessária para validação.
- Questionamentos sobre dados que não chegam no objeto principal de entrada.

### 22.5 Centroamérica

Centroamérica foi mencionada como região possivelmente relacionada a produtos multirriscos e como área cujas instâncias estariam relativamente mais próximas das versões atuais.

Não houve detalhamento suficiente de países, produtos ou arquitetura específica.

---

## 23. Perguntas e respostas relevantes

### 23.1 Oferta comercial é equivalente a plano?

**Pergunta**  
Foi perguntado se uma oferta comercial, em Centroamérica, corresponde ao conceito de plano.

**Resposta**  
A resposta indicou que sim: planos A, B e C podem ser representados como ofertas comerciais com diferentes coberturas, capitais e segmentações.

**O que esclarece**  
A oferta comercial é uma construção de produto capaz de representar variações comerciais sem exigir necessariamente uma nova modalidade.

---

### 23.2 Alterar coberturas dentro da mesma modalidade cria nova modalidade?

**Pergunta**  
Foi questionado se uma alteração de cobertura dentro da mesma modalidade não tornaria o produto uma nova modalidade.

**Resposta**  
Foi esclarecido que não necessariamente. Uma modalidade pode suportar diferentes ofertas com conjuntos distintos de cobertura e capital. A decisão depende do desenho de produto e das consequências em processos posteriores.

**O que esclarece**  
Modalidade e oferta têm papéis diferentes. A plataforma não elimina a decisão de modelagem de produto.

---

### 23.3 As cotações continuarão no transacional?

**Pergunta**  
Os participantes questionaram onde a cotação ficará e como ela seguirá para orçamento ou contratação.

**Resposta**  
A cotação deve permanecer no ativo digital. Quando o processo de contratação avançar, uma ação ou integração materializará essa cotação em orçamento no transacional.

**O que esclarece**  
A arquitetura busca independência entre geração de cotação e persistência transacional.

---

### 23.4 Haverá cotação a partir de Neutron?

**Pergunta**  
Foi perguntado se um sistema referido como Neutron poderá realizar cotações.

**Resposta**  
A proposta naquele momento indicava cotação a partir de outro fluxo, mas o assunto ainda precisava ser detalhado.

**O que esclarece**  
Não há decisão final registrada sobre esse ponto.

---

### 23.5 Por que não há fila intermediária?

**Pergunta**  
Foi questionado como o sistema absorveria múltiplas requisições simultâneas sem fila ou mensageria intermediária.

**Resposta**  
A resposta indicou que o ambiente de containers deverá escalar conforme limites de uso. A necessidade será validada em testes de estresse.

**O que esclarece**  
A solução privilegia escalabilidade horizontal da infraestrutura para o fluxo síncrono, sem evidência de fila no caminho principal.

---

### 23.6 O Kafka ou broker de eventos é usado para quê?

**Pergunta**  
Foi perguntado o motivo da presença de Kafka ou plataforma de eventos em uma arquitetura anterior.

**Resposta**  
A explicação foi que ele recebia cotações de forma assíncrona para posterior transporte ao transacional, especialmente em cenários de grande volumetria.

**O que esclarece**  
O broker não foi descrito como parte obrigatória da orquestração síncrona atual; ele atendia a necessidade de desacoplamento de carga e persistência anterior.

---

### 23.7 Fórmulas configuráveis substituem fórmulas Java?

**Pergunta**  
Foi questionado se MXParser permitiria evitar alterações em Java para qualquer cálculo.

**Resposta**  
A resposta foi que fórmulas simples ou de composição podem ser configuradas, mas fórmulas complexas, especialmente as que exigem bases técnicas, preparação de dados ou lógica extensa, continuam demandando Java.

**O que esclarece**  
A plataforma adota um modelo híbrido: configuração quando viável, implementação técnica quando necessária.

---

### 23.8 O que acontece quando uma regra dinâmica é usada pela primeira vez?

**Pergunta**  
Foi perguntado quando o código armazenado em MongoDB é transformado em classe Java e o que ocorre após reinicialização do serviço.

**Resposta**  
A regra é construída/serializada na primeira execução e pode ser mantida em cache. Após reinicialização, pode ser reconstruída.

**O que esclarece**  
Existe custo inicial de compilação/serialização, mitigado por cache.

---

### 23.9 Como validar dados de terceiros que não estão no objeto principal?

**Pergunta**  
Foi questionado como tratar informações necessárias para seleção de riscos, mas que não chegam no Polizón.

**Resposta**  
A resposta foi que o ativo só consegue avaliar o que recebe na estrutura de entrada. Para dados fora dessa estrutura, pode ser necessária outra API de terceiros ou evolução da entrada.

**O que esclarece**  
A cobertura funcional da plataforma depende da qualidade e completude do contrato de dados das integrações.

---

## 24. Limitações reconhecidas

1. A capacidade multirriscos foi mencionada como existente, mas não certificada em determinados cenários.
2. A solução para cotação a partir de Neutron não está definida.
3. Nem todos os dados de terceiros necessários para regras chegam atualmente na estrutura principal.
4. A plataforma não cobre todas as capacidades possíveis de emissão; foi citada cobertura de “oitenta e tantos por cento”, mas sem percentual exato consolidado.
5. Comissões e resseguro não estão explicitamente cobertos no fluxo atual apresentado.
6. Algumas fórmulas precisam continuar em Java devido à complexidade.
7. O validador de fórmulas ainda é descrito como básico e em evolução.
8. O desenho final de DR para Brasil e Espanha ainda será definido.
9. A integração à plataforma corporativa de engenharia ainda está pendente.
10. A segurança dos microsserviços legados foi descrita como permissiva e em processo de reforço.
11. A estratégia definitiva de ambientes para cotizador dinâmico ainda estava sendo debatida.
12. Há problemas históricos de compartilhamento de plataforma documental entre integração e pré-produção.
13. Os mecanismos de recuperação de erro e intervenção humana foram discutidos, mas não apresentados como concluídos.

---

## 25. Riscos e desafios

### 25.1 Riscos explicitamente mencionados

- Alterações retroativas em regras podem afetar o negócio.
- Alto volume de cotações pode pressionar banco e transacional.
- Dados incompletos de terceiros impedem certas validações.
- Regras duplicadas entre ativo e transacional podem gerar divergências.
- Código dinâmico em MongoDB pode introduzir risco de segurança.
- Compartilhamento de ambiente documental pode retornar documento de cotação incorreto.
- Dependência de chamadas internas pode afetar desempenho.
- Falhas de serviços internos precisam ser detectadas e rastreadas.
- A ausência de fila intermediária precisa ser validada sob carga.
- O gerenciamento de Kubernetes pode aumentar esforço operacional.

### 25.2 Desafios derivados do contexto

> **Análise, não afirmação literal dos participantes.**

- A centralização gradual pode exigir longa coexistência entre regras novas e legadas.
- A autonomia de negócio dependerá de interfaces funcionais que escondam a complexidade técnica das regras.
- A estratégia multicloud reduz dependência de fornecedor, mas pode aumentar esforço de padronização operacional.
- O sucesso da solução depende tanto da arquitetura quanto da qualidade dos contratos de dados vindos dos sistemas de terceiros e canais.
- O catálogo de fórmulas e regras precisa equilibrar reutilização corporativa com necessidades locais legítimas.

---

## 26. Transformações estruturais identificadas

### 26.1 De sistema transacional como centro de cotação para ativo digital como centro de decisão

A cotação deixa de ser necessariamente um registro imediato no transacional. O ativo digital passa a ser o local onde a cotação é calculada, mantida e auditada antes de se converter em orçamento ou emissão.

### 26.2 De customização por desenvolvimento para configuração governada

A oficina de produto, as ofertas comerciais, as regras e as fórmulas configuráveis apontam para uma transição de alterações dependentes de TI para mudanças governadas por produto e negócio.

Essa transição não é total: fórmulas e regras de maior complexidade continuam dependentes de desenvolvimento técnico.

### 26.3 De microsserviços expostos para acesso orquestrado

A arquitetura pretende reduzir exposição direta dos componentes internos e concentrar segurança, ordem de chamadas e regras de fluxo no orquestrador.

### 26.4 De produto local para capacidade reutilizável

O Core central, os catálogos de fórmula e a distribuição de versões entre países sugerem uma direção de reutilização. Países podem configurar produtos próprios sobre uma base comum em vez de manter software totalmente independente.

### 26.5 De retenção operacional irrestrita para historificação controlada

A discussão sobre MongoDB e arquivamento indica preocupação explícita com crescimento de base e custo operacional, preservando consultabilidade histórica sem manter todos os dados na camada operacional.

---

## 27. Roadmap e direcionamentos citados

| Tema | Direcionamento mencionado |
|---|---|
| Oficina de produto | Deve ser implementada e operacional para Brasil; recomendação de iniciar com ela |
| Segurança | Reforço planejado para a semana seguinte à reunião |
| Testes de performance | Uso de produto real de Espanha para testes de carga |
| Escalabilidade | Validar criação de containers sob carga |
| DR | Definir modelo final para Brasil e Espanha |
| Plataforma de engenharia | Integrar ativo digital à governança corporativa de liberação |
| Azure | Evoluir de Kubernetes para serviço gerenciado de containers, conforme disponibilidade |
| Fórmulas | Evoluir validador e ampliar uso de configuração quando viável |
| IA | Há intenção de usar agente/IA para traduzir regras de linguagem humana para formato técnico |
| Migração | Ativar ambientes específicos quando a fase de migração exigir |
| Documentação | Manter documentação atualizada dos projetos e repositórios por país |

---

## 28. O que a reunião não permite concluir

A transcrição não fornece detalhe suficiente para afirmar com segurança:

- o nome oficial e a expansão das siglas ACDC, RTE, DUB, PSIPD, FFT e demais termos internos;
- o modelo completo de IAM e autorização;
- os algoritmos de criptografia utilizados;
- a estratégia de gerenciamento de chaves;
- o desenho de rede, firewall, sub-redes ou conectividade entre clouds;
- a política de retenção de auditorias, cotações e históricos;
- o SLA, SLO, RTO e RPO da plataforma;
- o modelo definitivo de DR;
- o mecanismo completo de CI/CD;
- a ferramenta corporativa exata de engenharia e gestão de releases;
- a política de rollback;
- o processo completo de aprovação de regras complexas;
- o modelo de segregação de funções na oficina de produto;
- o banco de dados ou fontes das bases técnicas;
- a estratégia final para dados de terceiros não presentes no Polizón;
- os contratos de API definitivos;
- os critérios de criação de novos tópicos, partições ou ambientes de eventos;
- a confirmação de que todas as capacidades mencionadas já estão produtivas;
- a capacidade final de IA/agent para geração de regras;
- a abrangência exata do “oitenta e tantos por cento” de cobertura funcional citado.

---

## 29. Conclusões

A reunião apresentou o ativo digital como uma plataforma estratégica para concentrar lógica de produto, cotação, risco, tarifação e configuração comercial em um modelo mais modular, governado e reutilizável entre países.

A oficina de produto é o elemento-chave para transferir configuração de produto para um espaço controlado, com permissões, regras de vigência e maior participação do negócio. O orquestrador é o elemento-chave da arquitetura, pois centraliza segurança, fluxo, validações e integração entre os microsserviços internos.

O desenho aponta para uma plataforma multicloud, baseada em containers e MongoDB, com foco em reduzir dependência de fornecedor, controlar volumetria, desacoplar cotação do transacional e permitir evolução progressiva.

A maturidade, porém, ainda é heterogênea. Há capacidades em produção, capacidades em evolução e decisões abertas sobre segurança, desempenho, dados de terceiros, ambientes, documentação, DR, migração e operação. A implantação no Brasil aparece como um marco importante para validar a amplitude do modelo e completar lacunas identificadas durante a própria discussão.
