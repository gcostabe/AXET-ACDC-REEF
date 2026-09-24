# Relatório de Análise Avançada de Transcrição

**Arquivo de origem:** `Formación ACDC-20260323_091446-Grabación de la reunión.mp4`
**Data de processamento:** 22/09/2026 16:56:05
**Modelo de transcrição:** whisper.cpp Metal (small) — idioma: es
**Modelo de interpretação IA:** axet-code (gpt-5.6-terra)
**Prompt utilizado:** análise sênior avançada (documentação funcional, arquitetura, negócio, riscos, Q&A, anti-alucinação)

---

# Análise estruturada — Formação sobre o Ativo Digital de Cálculo integrado ao RIF

> **Nota de fidelidade:** esta análise foi produzida exclusivamente a partir da transcrição fornecida. O áudio aparenta conter reconhecimento automático de voz, com trechos incompletos, nomes possivelmente deformados e alternância entre espanhol e português. Onde a interpretação não é segura, a incerteza está explicitada. Não há timestamps disponíveis; por isso, a rastreabilidade é feita por temas e por formulações presentes na fala.

## 1. Síntese executiva

A reunião inaugura uma semana de formação e trabalho prático sobre um novo **ativo digital de cálculo**, apresentado como um componente integrado ao ecossistema do **RIF** — ou “RIV” em alguns trechos da transcrição, provavelmente por variação ou erro de reconhecimento. O ativo vem sendo desenhado há aproximadamente “um ano e alguns meses” e nasce como evolução de experiências anteriores com parametrização de produtos, regras de negócio e cálculo técnico.

O problema central discutido é a dificuldade de manter, evoluir e escalar produtos de seguros quando regras, validações, cálculos e integrações dependem excessivamente do sistema transacional, de programação em banco de dados e de mecanismos legados. Esse modelo se torna particularmente crítico em contextos de grande volume, como Brasil e Espanha, onde se exige resposta rápida para geração de ofertas comerciais.

A solução apresentada separa a capacidade de avaliação comercial e cálculo técnico do sistema transacional. O ativo digital recebe uma entrada padronizada — denominada na transcrição como **“polizón”**, termo que aparenta designar uma estrutura de dados de apólice/cotação —, aplica seleção de risco, módulos comerciais, tarifação/cálculo e outras regras, e devolve uma oferta comercial enriquecida ao sistema ou canal que o chamou.

A iniciativa é também uma transformação operacional e organizacional: busca deslocar uma parcela relevante das regras de negócio de código para configuração governada, com o **Taller de Productos** como ponto central de gestão. A meta declarada é chegar a aproximadamente **90% das regras de negócio configuráveis**, mantendo uma parcela de desenvolvimento para casos que não possam ser abstraídos como configuração.

A formação tem foco imediato na implementação para o Brasil, com participação de profissionais de Brasil, Colômbia, Espanha, Centroamérica, NTT DATA, Indra e equipes associadas a vida, emissão, arquitetura, integrações e manutenção. A expectativa para a semana era montar, até sexta-feira, um esqueleto integrado do produto brasileiro usando as capacidades do ativo digital.

---

## 2. Contexto e antecedentes

### 2.1 Origem da iniciativa

O ativo digital foi contextualizado como resultado de uma evolução iniciada em experiências anteriores de implementação e convergência. Um dos problemas históricos mencionados ocorreu em produtos de automóvel, nos quais havia uma quantidade muito elevada de parametrizações e regras a administrar.

A fala sugere a seguinte evolução:

```text
Grande volume de regras e parametrizações em produtos
↓
Dificuldade de manter lógica dispersa e programada
↓
Criação de conceitos como “pacotes” e flexibilidade de configuração
↓
Ampliação da necessidade com produtos de vida
↓
Formulação da proposta do ativo digital
↓
Implementação progressiva, inicialmente em vida
↓
Expansão planejada para Espanha, Brasil e outros cenários
```

Os termos “pacotes” e uma expressão transcrita como “recusaflexibilidade” aparecem como conceitos originados em trabalhos anteriores. A transcrição não permite determinar com segurança o nome técnico correto do segundo termo.

### 2.2 Motivação de negócio

O objetivo declarado do ativo digital é permitir que a organização entregue uma **oferta comercial completa** ao cliente sem precisar executar todo o processo no transacional.

Essa oferta pode incluir, conforme o conteúdo apresentado:

- garantias;
- capitais;
- prêmios;
- formulários necessários;
- controles técnicos;
- validações;
- regras de negócio;
- atributos calculados;
- condições comerciais;
- possivelmente planos de pagamento.

O foco não é apenas calcular preço. O componente pretende participar de uma avaliação comercial mais ampla, considerando seleção de risco, obrigatoriedade de informações, condições técnicas, configuração de coberturas e cálculo.

### 2.3 Motivação técnica

A separação do cálculo em relação ao transacional foi associada a:

- necessidade de maior desempenho;
- maior escalabilidade;
- menor dependência de mecanismos legados;
- redução da programação de regras diretamente em banco;
- capacidade de atender grande volumetria;
- possibilidade de integrar diferentes canais;
- melhoria de rastreabilidade;
- maior facilidade de manutenção e evolução.

A reunião menciona especificamente que a implementação anterior baseada em **PLE** — sigla ou nome não esclarecido na transcrição — encontrava limites de desempenho. Foram realizadas comparações de rendimento entre uma implementação em PLE e uma em Java, e foi relatado que a diferença de consumo/desempenho era relevante.

Não é possível concluir, apenas pela transcrição:

- o que exatamente significa “PLE”;
- qual banco de dados transacional é utilizado;
- quais métricas formais foram adotadas nos testes;
- quais foram os valores medidos;
- quais ferramentas de observabilidade sustentam essa comparação.

---

## 3. Participantes, equipes e contexto de colaboração

A reunião começou com apresentações para alinhar as pessoas envolvidas na formação e na futura implementação. A fala reforça que o ativo digital não foi construído por uma única pessoa ou equipe, mas pela união de diferentes áreas de tecnologia e negócio.

### 3.1 Equipes e localidades mencionadas

Foram citadas pessoas ou grupos associados a:

| Área, país ou organização | Papel relatado ou inferido do contexto |
|---|---|
| Brasil | Liderança e implementação do produto; configuração do produto; atuação funcional e técnica |
| Colômbia | Apoio em emissão, produtos, integrações e desenvolvimento |
| Espanha | Experiência inicial com ativo digital e produtos de vida |
| Centroamérica | Implantação, gestão e discussão sobre uso em produtos locais |
| Uruguai | Produtos de vida já mencionados como referência de experiência |
| Panamá | Implementações e evolutivos de produtos de vida |
| Honduras | Produtos existentes usados como exemplo de legado e convivência tecnológica |
| Chile e Peru | Citados como possíveis frentes futuras; sem detalhes confirmados |
| NTT DATA | Apoio em “individuais” e migração de programas; descrição parcial e afetada por ruído |
| Indra | Participação de profissionais ligados ao contexto da iniciativa |
| Equipe de vida | Evolutivos, produtos, implementação e formulação |
| Arquitetura | Desenho técnico e princípios arquiteturais |
| Emissão | Integração do ativo com operações de emissão online e batch |
| Manutenção Core | Participação em formações e manutenção do core |
| Backend e microserviços | Desenvolvimento de serviços e componentes de backend |
| Taller de Productos | Governança e configuração de produtos e regras |
| CDC | Componente ou contexto de integração mencionado diversas vezes; significado não explicitado |

### 3.2 Papéis individuais citados

Vários nomes aparecem na transcrição, incluindo Freddy, Manuel, Miguel, Alberto, David, Vinicius, Alejandro Salmón, Óscar, Marjorie, Jordanes, Javier, Ronald Rojas, Sonia, Lesslie e outros. Entretanto, por limitações de qualidade do texto, não é seguro atribuir a todos responsabilidades precisas.

Alguns papéis que aparecem com maior clareza:

- **Vinicius**: profissional do hub do Brasil, especialista em sistemas, trabalhando na configuração do produto e na implementação brasileira com equipes de Espanha e Colômbia.
- **Manuel**: apresentado como líder técnico em um contexto transcrito como “RILA”; também associado à resolução de problemas de código e integração.
- **Miguel**: desenvolvimento e implementação de APIs com CDC.
- **Óscar**: equipe de prestações do RIF, com foco em backend, serviços e microserviços.
- **Alberto**: associado à explicação da arquitetura e do desenho do entorno.
- **Freddy**: conduz grande parte da apresentação conceitual, de objetivos e evolução do ativo digital.
- **David**: envolvido no desenvolvimento do ativo/CDC desde o início e apontado como referência, junto de Manuel, para problemas relacionados ao ativo.
- **Lesslie**: formulou pergunta relevante sobre a coexistência entre o novo Taller de Productos e o configurador anterior do Tron Web.

---

## 4. Problemas identificados

## 4.1 Dependência excessiva de código para regras de negócio

Foi relatado que, no modelo anterior, a criação e configuração de produtos exigiam trabalho no configurador ou gerador de produtos, mas também programação adicional para aplicar:

- regras de negócio;
- atributos;
- validações;
- controles técnicos;
- condições de formulários;
- cálculos;
- comportamentos específicos de dados.

A consequência é que mudanças aparentemente simples de regra podem exigir desenvolvimento técnico. O exemplo usado foi um produto de automóvel no qual, caso o veículo durma na rua, seria necessário pedir a quantidade de dias nessa condição. A intenção do novo modelo é que isso seja configurado como regra, e não programado.

## 4.2 Limites de desempenho e volumetria

A reunião destaca Brasil e Espanha como contextos de alto volume transacional. Para o Brasil, foi afirmado o objetivo de gerar **três ofertas comerciais em três segundos**. A formulação é ambígua, mas a intenção aparente é atender uma exigência agressiva de tempo de resposta para composição de ofertas.

Também foi mencionado que o Brasil realiza cerca de **seis milhões de cotações**, com taxa de conversão em torno de **1%**. Essas cotações permaneciam em estruturas do sistema transacional e exigiam expurgos para remoção de dados de baixa conversão.

O ativo digital busca tratar a cotação rápida fora do transacional, preservando as informações para posterior exploração e evitando que esse grande volume sobrecarregue estruturas destinadas a outros processos.

## 4.3 Acoplamento entre processo online, banco de dados e serviços

Foi estabelecida uma premissa explícita: deixar de integrar serviços a partir do banco de dados.

A direção apresentada é:

```text
Modelo anterior ou legado
Banco de dados / procedimentos
↓
Chamadas ou integrações acopladas ao processamento de base

Direção pretendida
Canal / RIF / API
↓
Camada de integração e APIs
↓
Ativo digital e serviços
↓
Persistência e componentes necessários
```

A fala afirma que a evolução da integração online não deve ocorrer a partir da base de dados, mas por uma camada intermediária ou por APIs. A expressão “capa de neutral” aparece na transcrição, mas não é possível confirmar o nome técnico correto da camada.

## 4.4 Dificuldade para gerir alterações de tabelas e parâmetros técnicos

Foi explicado que, antes da evolução das bases técnicas, a inclusão de uma nova variável — por exemplo, gasto, interesse técnico ou outro elemento de cálculo — poderia exigir alteração estrutural de tabelas, como adicionar uma coluna.

A nova abordagem pretende representar esse tipo de elemento como um novo registro de configuração, reduzindo a necessidade de mudanças físicas em tabelas para cada evolução de regra ou cálculo.

## 4.5 Falta de centralização e rastreabilidade das regras

A reunião reconhece que a concentração de regras no novo ativo aumenta a necessidade de governança e rastreabilidade. Foi mencionado o interesse em saber:

- por onde um cálculo passou;
- quais parâmetros recebeu;
- o que entrou;
- o que saiu;
- onde ocorreu um erro;
- como identificar o ponto de falha.

A expressão “rote e cálculo” foi citada como referência brasileira para essa necessidade de rastrear a execução; o termo exato não é seguro.

---

## 5. Solução apresentada: o Ativo Digital de Cálculo

O ativo digital é apresentado como um componente dedicado à análise técnica, aplicação de regras e cálculo comercial. Ele se integra a diferentes fontes de informação e devolve uma oferta processada para que o chamador dê continuidade ao fluxo adequado.

### 5.1 Objetivo funcional

O objetivo pode ser representado assim:

```text
Entrada comercial e dados de risco
↓
Avaliação de regras e seleção de risco
↓
Definição de módulos e coberturas aplicáveis
↓
Cálculos técnicos e tarifação
↓
Oferta comercial enriquecida
↓
Continuidade no canal, RIF, API ou processo de emissão
```

O componente não é descrito como substituto absoluto de todos os processos de emissão. Seu papel central é calcular e avaliar o que é necessário para compor a oferta. Depois disso, o sistema chamador pode:

- mostrar uma cotação;
- continuar uma proposta;
- encaminhar uma emissão;
- complementar informações;
- realizar processos que permanecem fora do ativo, como comissão e resseguro.

### 5.2 Entrada padronizada: “polizón”

A transcrição afirma que o ativo possui uma entrada obrigatoriamente padronizada, chamada de **“polizón”**.

Pelo contexto, o “polizón” parece ser uma estrutura de dados que contém as informações necessárias para uma cotação, proposta ou operação relacionada à apólice. O ativo controla os dados que podem ou devem existir nessa estrutura.

Entretanto, a reunião não especifica:

- o formato técnico dessa estrutura;
- se é JSON, XML, objeto interno ou outro padrão;
- seu contrato de versionamento;
- campos obrigatórios;
- modelo de validação;
- esquema de autenticação nas chamadas.

Assim, “polizón” deve ser preservado como nome registrado na transcrição, sem assumir um significado técnico mais específico.

### 5.3 Consumidores possíveis

O ativo foi apresentado como capaz de ser chamado por diferentes origens:

- RIF;
- frontal;
- API;
- serviço atual;
- autosserviço;
- front-end de provedores;
- outros consumidores que necessitem gerar oferta comercial.

A mensagem principal é que o ativo não deve estar restrito a um único canal, desde que os consumidores respeitem sua entrada padronizada e seu modelo de integração.

---

## 6. Arquitetura e funcionamento lógico

> **Representação analítica:** o diagrama abaixo consolida a explicação verbal da reunião. Não foi apresentado literalmente nesse formato.

```text
Canais e consumidores
(RIF, frontais, APIs, autosserviço, outros sistemas)
                    ↓
Entrada padronizada (“polizón”)
                    ↓
Ativo Digital de Cálculo
 ├── Seleção de risco
 ├── Módulos comerciais
 ├── RTD / componente de cálculo e tarifação
 ├── Contêiner e mecanismos de entrada
 ├── Regras, validações e atributos
 ├── Fórmulas e bases técnicas
 └── Consulta a formulários, cúmulos e documentos quando aplicável
                    ↓
Saída enriquecida no formato esperado
(“polizón” com cálculos, controles, regras e atributos)
                    ↓
RIF / API / frontal / processo de emissão / cotizador
                    ↓
Processos posteriores fora do ativo
(emissão, comissões, resseguro e outros não detalhados)
```

## 6.1 Separação em relação ao transacional

Um dos princípios mais enfatizados foi a independência em relação ao transacional. O ativo é descrito como uma peça separada, mas integrada ao RIF.

A razão apontada é evitar que processamento de alta volumetria, cálculos e regras comerciais dependam diretamente do fluxo transacional, favorecendo:

- desempenho;
- escalabilidade;
- independência;
- evolução tecnológica;
- controle de regras;
- reutilização por múltiplos consumidores.

Ao mesmo tempo, não há indicação de que todos os dados de produto deixem de existir no transacional. A reunião explica que determinadas definições, como novas coberturas, precisam chegar ao transacional para que este consiga operar processos posteriores.

## 6.2 Banco de dados e coleções

Foi dito que o componente foi desenhado com “uma base de dados Monroe” e “coleções”. É provável que a transcrição esteja se referindo a **MongoDB**, mas isso não foi confirmado de modo suficientemente claro.

A formulação correta, preservando a evidência disponível, é:

> A reunião menciona uma base de dados registrada na transcrição como “Monroe”, organizada em coleções. Pelo contexto, pode haver referência a uma tecnologia de banco orientado a documentos, mas a tecnologia não pode ser confirmada com segurança apenas pelo texto.

## 6.3 Operação online e batch

O ativo foi descrito como integrado tanto a processos **online** quanto a processos **batch**, especialmente no contexto de emissão.

A reunião não detalha:

- como esses dois modos são orquestrados;
- quais casos são exclusivamente online;
- quais casos exigem processamento batch;
- se há mensageria ou processamento assíncrono;
- como são tratados reprocessamentos e falhas.

---

## 7. Componentes e capacidades do ativo digital

A apresentação afirma que o ativo está dividido, em linhas gerais, em quatro áreas:

1. seleção de risco;
2. módulos;
3. RTD;
4. contêiner e entrada.

A transcrição não expande de forma completa o quarto item. Portanto, a explicação abaixo se limita ao que foi apresentado.

## 7.1 Seleção de risco

A seleção de risco é o primeiro processamento realizado após a entrada de dados.

### Capacidades citadas

A seleção de risco pode:

- aplicar controles técnicos;
- validar dados;
- determinar se formulários devem ser solicitados;
- verificar se é necessária documentação adicional;
- consultar ou utilizar cúmulos, quando aplicável;
- aplicar recargos ou descontos;
- lançar mensagens informativas;
- tratar exceções relacionadas a renovação ou recursos, conforme expressão da transcrição;
- avaliar dados fixos e dados variáveis;
- controlar obrigatoriedade e condições de coleta de dados.

### Formulários

A reunião esclareceu uma distinção importante:

- o ativo digital **não cria necessariamente o formulário**;
- o formulário já deve existir e estar definido no produto;
- o ativo decide, conforme regras e dados recebidos, **se aquele formulário deve ou não ser solicitado**.

Exemplos mencionados:

- formulário de saúde;
- formulário laboratorial;
- solicitação antes ou depois de determinadas coberturas.

A transcrição registra a existência de outro componente chamado **módulo de suscrição** ou “subscrição”, que complementaria essa capacidade. Não ficou claro se esse módulo é parte interna do RIF, do ativo ou de outro domínio integrado.

## 7.2 Módulos comerciais

A camada de módulos organiza a oferta comercial a partir da modalidade do produto e de suas coberturas.

O exemplo apresentado foi um produto com vinte coberturas. A configuração de módulos permite que diferentes perfis recebam composições diferentes:

| Perfil ilustrativo | Exemplo de configuração |
|---|---|
| Cliente platino | 15 coberturas, com características e capitais específicos |
| Cliente gold | Configuração intermediária, não detalhada |
| Cliente bronze | 6 coberturas, com limites e condições próprias |

A parametrização pode ser feita, segundo a fala, por:

- ramo;
- grupo de apólices;
- agente;
- estrutura comercial;
- necessidade de negócio.

A intenção é que negócio possa configurar como quer oferecer coberturas e circunferências/combinações comerciais, sem depender de desenvolvimento para cada alteração.

### Limitação ou detalhe relevante

Mesmo quando a oferta comercial apresenta apenas parte das coberturas, o sistema pode continuar tratando internamente todas as coberturas da modalidade. Foi dado o exemplo de um produto com cinco coberturas: ainda que um módulo destaque apenas três, o modelo interno pode operar considerando as cinco.

Isso foi apresentado como ponto de evolução e como detalhe a aprofundar durante a semana.

## 7.3 RTD e tarifação

O componente transcrito como **RTD** — em alguns trechos “RTB” — é apresentado como a área mais técnica do ativo, responsável pelo fluxo de cálculo comercial.

As suas responsabilidades incluem:

- cálculo de coberturas;
- aplicação de conceitos econômicos;
- processamento de conceitos relacionados a blocos ou agrupamentos, com termo pouco claro na transcrição;
- uso de fórmulas;
- uso de bases técnicas;
- suporte a cálculos multivariáveis;
- integração com elementos relacionados a subscrição para produtos de vida.

### Fórmulas

Foi dito que as fórmulas podem estar implementadas em Java e que há possibilidade de avaliar integrações com outras linguagens, embora isso ainda não tenha sido feito ou consolidado.

A reunião também menciona componentes em Python que chamam uma camada de APIs e se conectam ao ativo digital. Não foi especificado:

- quais componentes usam Python;
- em quais casos;
- como a integração é feita;
- se Python participa diretamente do motor de cálculo.

### Tarifação multivariável

A tarifação multivariável foi apresentada como uma capacidade importante, já utilizada na região em produtos existentes. O modelo parece combinar uma taxa inicial com fatores de risco aplicados por atuária.

Entretanto, foi reconhecido que essa capacidade ainda **não foi certificada em um produto real**. Houve testes com um produto de automóvel no Brasil, mas não houve fechamento/certificação com produto efetivamente implantado.

Essa é uma das limitações mais relevantes explicitamente reconhecidas.

## 7.4 Bases técnicas

As bases técnicas foram destacadas como evolução relevante para produtos de vida.

Antes, incluir um novo elemento de cálculo podia demandar alteração de tabelas. A nova estrutura procura tornar esses elementos mais configuráveis e transparentes.

As bases técnicas podem suportar informações como:

- mortalidade;
- juros;
- gastos;
- interesse técnico;
- outros elementos usados em cálculos de cobertura e tarifação.

A reunião afirma que, a partir de experiências em produtos de Uruguai e Panamá, identificou-se a oportunidade de padronizar melhor essas bases e permitir sua extensão.

---

## 8. Modelo de integração

## 8.1 Integração por APIs

As APIs foram apresentadas como elemento central para explorar o potencial do ativo digital e evitar integrações diretas a partir do banco de dados.

A reunião cita:

- integração de APIs com processos batch de emissão;
- integração online;
- APIs que podem chamar o ativo;
- uso de APIs para devolver resultados ao consumidor;
- participação de equipes técnicas no desenvolvimento dessas integrações.

A arquitetura detalhada das APIs não foi apresentada. Não há informações suficientes sobre:

- endpoints;
- protocolos;
- autenticação;
- autorização;
- versionamento;
- contratos;
- tratamento de erros;
- timeout;
- idempotência;
- observabilidade distribuída.

## 8.2 Dois modos de execução

Foi dito que o ativo possui “um endpoint ou um passo a passo”.

Isso parece significar que ele pode ser utilizado de duas formas:

1. **Execução completa por endpoint**, recebendo dados e devolvendo resultado consolidado.
2. **Execução guiada por etapas**, permitindo que o consumidor avance progressivamente por seleção, módulos, cálculo ou demais fases.

A reunião prometeu detalhar essa capacidade nas sessões posteriores, mas a transcrição termina antes dessa explicação.

## 8.3 Integrações complementares

Além de RIF e APIs, foram mencionadas integrações com:

- formulários;
- cúmulos;
- documentação;
- planos de pagamento;
- processos de emissão online;
- processos batch;
- possível módulo de subscrição;
- Taller de Productos;
- componentes associados a fórmulas;
- CDC, cujo significado não foi esclarecido.

---

## 9. Cotação rápida e gestão de volume

A cotação rápida é apresentada como um dos processos que ficarão integralmente no ativo digital.

### 9.1 Diretriz declarada

```text
Cotação rápida
↓
Ativo digital
↓
Persistência da informação de cotação
↓
Exploração posterior, continuidade ou conversão em processo comercial
```

A intenção é que a cotação rápida não siga para outra base transacional antes de ser necessária, evitando o armazenamento massivo de cotações de baixa conversão em estruturas que posteriormente exigem expurgo.

### 9.2 Contexto do Brasil

Foram citados:

| Indicador declarado | Valor | Contexto |
|---|---:|---|
| Cotações no Brasil | aproximadamente 6 milhões | Volume citado para justificar a separação da cotação rápida |
| Taxa de conversão | aproximadamente 1% | Conversão das cotações mencionadas |
| Meta de desempenho | 3 ofertas comerciais em 3 segundos | Formulação literal aproximada; interpretação operacional não está totalmente clara |

Esses números foram mencionados na reunião e não foram auditados ou comprovados documentalmente na transcrição.

### 9.3 Implicação analítica

> **Leitura analítica:** a separação da cotação rápida indica uma tentativa de reduzir a pressão operacional do funil comercial sobre o transacional, preservando a capacidade de analisar, reutilizar e continuar cotações sem transformar todo evento de simulação em carga persistente no core operacional.

---

## 10. Modelo de configuração e governança de produto

## 10.1 Meta de configuração de regras

A meta apresentada é transformar a maior parte das regras de negócio em configuração:

| Tipo de regra ou comportamento | Direção pretendida |
|---|---|
| Regras de negócio usuais | Preferencialmente configuráveis |
| Meta declarada | Cerca de 90% em configuração |
| Casos complexos ou não abstraíveis | Cerca de 10% pode permanecer como função/desenvolvimento |
| Definição e gestão | Governada pelo Taller de Productos |
| Execução | Aplicada pelo ativo digital quando aplicável |

A reunião não afirma que toda regra será configurável. Pelo contrário, reconhece que há casos que continuam exigindo desenvolvimento, especialmente quando envolvem outras partes do processo RIF.

## 10.2 Taller de Productos como fonte de gestão

O **Taller de Productos** é apresentado como evolução do configurador ou gerador de produtos anteriormente associado ao Tron Web.

Suas funções mencionadas incluem:

- definição da estrutura do produto;
- ramo;
- coberturas;
- dados variáveis;
- atributos;
- regras;
- parametrizações;
- fórmulas;
- integração com componentes;
- controle de publicação ou envio para ambientes de operação.

A visão pretendida é que o Taller seja a fonte de gestão e governança da definição de produto, enquanto componentes operacionais recebam apenas aquilo que precisam para funcionar.

## 10.3 Publicação e ambientes

Foi descrito um modelo em que a definição de produto pode ser preparada no Taller e depois direcionada a ambientes como:

- desenvolvimento;
- integração;
- exploração/operação, conforme termo usado na transcrição.

A transcrição sugere ações de publicação por botão, mas não detalha:

- workflow de aprovação;
- papéis autorizados;
- versionamento;
- rollback;
- promoção entre ambientes;
- trilha de auditoria;
- segregação de funções.

## 10.4 O que vai e o que não vai para a base transacional

A reunião diferencia dois tipos de informação:

| Tipo de informação | Direção descrita |
|---|---|
| Nova cobertura ou estrutura necessária ao transacional | Deve ser levada ao transacional |
| Regras internas do ativo digital | Podem permanecer no ativo, sem virar procedimento na base |
| Configuração de condição, atributo ou validação | Deve ser gerida no Taller e aplicada pelo ativo |
| Dados necessários à existência operacional do produto | Podem ser publicados para o ambiente operacional |

O exemplo do veículo que dorme na rua ilustra essa separação. A regra de pedir dias de permanência na rua seria configurada e avaliada pelo ativo digital, sem necessidade de criar uma regra procedural equivalente no banco transacional.

---

## 11. Convivência com o modelo legado

Uma pergunta de Lesslie tratou diretamente da relação entre o novo Taller de Productos e o configurador existente no Tron Web.

### Pergunta

O novo componente substituirá completamente o Taller de Productos existente no Tron Web ou ambos coexistirão?

### Resposta

A resposta foi que o novo componente é a evolução do Taller anterior. O configurador antigo tende a ser substituído, mas ambos devem coexistir durante um período.

### O que isso esclarece

A transformação não será uma substituição imediata de todo o legado. Produtos existentes, em operação ou ainda não certificados no novo modelo, podem continuar operando com o modelo anterior.

### Diretriz para novos produtos

A reunião indicou que, para iniciativas novas, especialmente ligadas a CDC e aos novos fluxos, a orientação é começar pelo novo modelo. Já produtos existentes em países como Honduras, Uruguai e Panamá não seriam necessariamente migrados de imediato.

A frase recorrente pode ser sintetizada assim:

```text
O que já funciona e está em produção
→ permanece no modelo atual, salvo necessidade ou plano específico de evolução.

O que é novo
→ deve ser avaliado para implementação pelo novo Taller e pelo ativo digital.
```

### Limite reconhecido

Não foi apresentado um plano detalhado de migração para produtos existentes, nem critérios completos para decidir quais produtos legados serão convertidos, em que ordem e em que prazo.

---

## 12. Produtos de vida, risco, poupança e subscrição

A reunião dedica parte relevante à discussão sobre produtos de vida.

## 12.1 Escopo inicial em vida

O ativo digital começou com produtos de vida e com Espanha. O Brasil foi indicado como próximo foco relevante.

A fala sugere que os evolutivos em vida surgiram inicialmente de necessidades da Espanha e que algumas dessas capacidades também são aplicáveis ao produto brasileiro mencionado como “Bem Viver” ou expressão semelhante. O nome do produto não é totalmente seguro devido à transcrição.

## 12.2 Distinção entre risco e poupança

Foi explicado que cálculos de componentes de risco tendem a operar com lógicas mais semelhantes — por exemplo, relação entre capital, prêmio e fatores associados —, enquanto componentes de poupança mudam substancialmente a lógica de cálculo.

A reunião cita a existência de um produto com poupança e de funcionalidades relacionadas a “subscrições”. Entretanto, há dúvidas e interrupções no trecho, e não é possível reconstruir com precisão:

- o desenho completo do produto de poupança;
- as regras de subscrição;
- a relação exata entre subscrição, formulários e coberturas;
- quais funcionalidades já estão disponíveis ou em desenvolvimento.

## 12.3 Produtos declarativos e outros ramos

Uma pergunta relevante levantou que, em muitos produtos de vida da América Central, não seria possível usar exclusivamente o “tratamento de vida” porque também há manejo declarativo e cenários de transporte.

A resposta foi que, embora os evolutivos mencionados tenham vindo do contexto de vida, o ativo pode ser usado com outros tratamentos e processos. O foco em vida decorre da prioridade do Brasil e da estratégia do projeto, e não de uma restrição absoluta da solução.

> **Leitura analítica:** o ativo aparenta ser concebido como capacidade transversal de oferta, regra e cálculo, ainda que sua primeira maturidade funcional esteja concentrada em produtos de vida.

---

## 13. Casos concretos mencionados

## 13.1 Espanha

### Contexto

A Espanha é citada como um dos primeiros países a utilizar o ativo digital em produtos de vida.

### Papel no aprendizado

A experiência espanhola é apresentada como fonte de evoluções, especialmente em componentes associados a vida e subscrição.

### Limitações de informação

Não foram detalhados:

- produtos específicos;
- data de implantação;
- volume;
- resultados de negócio;
- arquitetura local;
- status de produção.

## 13.2 Brasil

### Contexto

O Brasil é o foco imediato da formação e da implementação prática da semana. Já existem histórias e entregas liberadas para implementação no RIF e no contexto de CDC.

### Objetivo da semana

Até sexta-feira, a expectativa era que o ambiente de desenvolvimento do Brasil tivesse um esqueleto do produto integrado ao ativo digital, contendo linhas gerais da implementação, ainda que não todas as funcionalidades finais.

### Capacidades relevantes

- alta volumetria;
- necessidade de resposta rápida;
- integração com RIF;
- uso do ativo para ofertas comerciais;
- potencial uso da cotação rápida no ativo;
- aplicação de evoluções provenientes do contexto de vida.

## 13.3 Uruguai e Panamá

Esses países são citados principalmente como referências de experiência com produtos de vida e como fonte de aprendizado para a evolução e padronização das bases técnicas.

A reunião informa que produtos existentes nesses países “estão como estão” e não seriam necessariamente alterados. A orientação recai sobre novos produtos ou novas peças que venham a utilizar as capacidades evoluídas.

## 13.4 Honduras

Honduras aparece como exemplo de produtos existentes, operando com estrutura anterior. A fala indica que não haveria intenção de reescrever tudo imediatamente.

Também foi discutida a existência de tabelas específicas de país ou de configurações locais, potencialmente gerenciadas fora da definição central de produto — por exemplo, por algo chamado “GDC”. O termo aparece sem explicação suficiente.

## 13.5 Chile e Peru

Foram citados como possíveis frentes futuras para o ano, mas sem confirmação de escopo, cronograma, produtos ou responsáveis.

---

## 14. Roadmap e direcionamentos

## 14.1 Direcionamentos explicitamente citados

| Direcionamento | Situação relatada |
|---|---|
| Formação transversal sobre o ativo digital | Em realização durante a semana da reunião |
| Certificação do ativo para RILA/RIF | Em andamento, conforme trecho transcrito |
| Implementação no Brasil | Prioridade imediata |
| Uso em Espanha | Já iniciado ou em uso no contexto de vida |
| Evolução de produtos de vida | Em andamento |
| Uso de novas bases técnicas | Em evolução e padronização |
| Tarifação multivariável | Desenvolvida, mas ainda sem certificação em produto real |
| Integração do Taller com o ativo | Em construção |
| Integração automatizada de regras do Taller ao ativo | Em construção |
| Incorporação de IA para gestão de regras | Aprovada ou em fase inicial, conforme fala |
| Expansão potencial a Chile e Peru | Mencionada como possibilidade, sem detalhamento |

## 14.2 Inteligência artificial

Foi afirmado que houve aprovação para iniciar trabalhos de incorporação de uma “agente” ou agente de IA ao ativo digital, com o objetivo de ajudar na gestão do grande volume de regras.

A justificativa apresentada é que um modelo mais estruturado e configurável facilita contextualização, gestão e, potencialmente, automação futura.

Não é possível concluir:

- qual tecnologia de IA será usada;
- quais funções concretas ela executará;
- se terá autonomia para modificar regras;
- como será governada;
- quais controles de segurança e validação existirão;
- prazo de implementação.

---

## 15. Perguntas e respostas relevantes

## 15.1 Quem gera os formulários?

### Pergunta

Os formulários serão gerados pelo módulo de subscrição?

### Resposta

O formulário já existe e deve estar definido na estrutura do produto. O ativo digital avalia, com base em regras e dados recebidos, se o formulário deve ser solicitado.

### O que isso esclarece

O ativo não é apresentado como editor ou gerador de formulários. Ele atua como motor decisório para determinar a necessidade de coletar informações adicionais.

---

## 15.2 O ativo pode ser usado com qualquer tratamento de produto?

### Pergunta

Dado que há produtos de vida com componentes declarativos e de transporte, seria possível usar o ativo sem depender de um tratamento exclusivamente de vida?

### Resposta

A resposta indica que sim. O foco atual é vida porque as evoluções surgiram desse contexto e porque Brasil é prioritário, mas o ativo pode servir a outros tratamentos.

### O que isso esclarece

A solução não foi apresentada como exclusiva de produtos de vida, embora sua maturidade inicial esteja ligada a esse domínio.

---

## 15.3 Como regras configuradas chegam ao destino?

### Pergunta

Ao configurar uma regra no Taller, a atualização para CDC/ativo é automática? Como origem e destino entendem a regra?

### Resposta

A gestão é realizada pelo Taller de Productos. Quando a regra é própria do ativo, o Taller deverá levar essa informação ao ativo. Porém, a automação desse fluxo ainda está em construção.

### O que isso esclarece

A arquitetura-alvo prevê publicação automatizada ou integrada entre Taller e ativo, mas o processo ainda não está completo.

---

## 15.4 O novo Taller substitui o configurador do Tron Web?

### Pergunta

O novo Taller substitui totalmente o Taller de Productos existente no Tron Web, ou ambos coexistirão?

### Resposta

Trata-se da evolução do modelo anterior. Os dois coexistirão por um período, porque existem produtos já operacionais e legados que não serão migrados imediatamente.

### O que isso esclarece

A estratégia é incremental e compatível com a continuidade operacional de produtos existentes.

---

## 15.5 Como tratar tabelas específicas de país?

### Pergunta

Tabelas próprias de países, como as da América Central, podem ser gerenciadas no novo modelo?

### Resposta

A resposta diferencia tabelas que fazem parte da definição do produto daquelas que são gerenciadas em outros fluxos, como o componente mencionado como GDC. Se uma tabela for necessária dentro do novo fluxo, o Taller precisará evoluir para suportá-la.

### O que isso esclarece

Nem toda configuração local é automaticamente absorvida pelo modelo de produto. Há necessidade de avaliar caso a caso se a informação pertence à definição de produto ou a um fluxo complementar.

---

## 16. Limitações reconhecidas

A reunião foi clara em reconhecer diversos pontos ainda incompletos ou dependentes de evolução.

| Limitação ou pendência | Situação relatada |
|---|---|
| Tarifação multivariável em produto real | Desenvolvida/testada, mas ainda não certificada |
| Integração automatizada Taller → ativo | Em construção |
| Detalhes de integração de regras | Ainda sendo trabalhados |
| Módulo de subscrição | Mencionado como complemento, possivelmente fora do escopo da semana |
| Migração de produtos legados | Sem plano detalhado apresentado |
| Produtos existentes de Uruguai, Panamá e Honduras | Não serão necessariamente alterados |
| Tabelas locais de país | Podem exigir evolução específica |
| Comissões | Permanecem fora da oferta tratada pelo ativo |
| Resseguro | Permanece fora da oferta tratada pelo ativo |
| Segurança, IAM, DR e SLA | Não detalhados |
| Arquitetura de nuvem | Apenas citada genericamente; sem tecnologia ou desenho |
| Modelo de publicação e rollback | Não detalhado |
| Governança de IA | Não detalhada |

---

## 17. Riscos e desafios

## 17.1 Riscos explicitamente mencionados

A transcrição não apresenta uma matriz formal de riscos, mas permite identificar riscos diretamente tratados nas falas:

- risco de desempenho em cenários de alta volumetria;
- risco de manter regras excessivamente dependentes de código;
- risco de acoplamento de serviços ao banco de dados;
- risco de falta de rastreabilidade de cálculos e decisões;
- risco de implantar novas capacidades sem certificação completa em produto real;
- risco de coexistência prolongada entre modelo legado e novo modelo;
- risco de incluir integrações externas no meio do fluxo e romper o princípio de independência do ativo.

## 17.2 Desafios derivados do contexto

> **Análise derivada, não declaração literal dos participantes:**

1. **Governança de regras em escala:** migrar regras para configuração reduz dependência de código, mas aumenta a necessidade de controle de versões, validações, testes, permissões e auditoria.

2. **Migração progressiva:** a coexistência entre Tron Web, o novo Taller, produtos em operação e novas implementações exige critérios claros para evitar divergências entre modelos.

3. **Heterogeneidade regional:** países possuem produtos, tabelas, tratamentos e necessidades locais diferentes. A arquitetura precisa equilibrar padronização e adaptação regional.

4. **Certificação funcional:** a existência de capacidades desenvolvidas, porém não certificadas em produto real, implica necessidade de validação operacional antes de expansão ampla.

5. **Dependência de dados de entrada:** como a entrada padronizada é central ao ativo, a qualidade, completude e consistência dos dados fornecidos por canais e APIs se tornam determinantes para o resultado do cálculo.

---

## 18. Transformações estruturais identificadas

## 18.1 Do transacional para uma capacidade de cálculo desacoplada

A transformação mais evidente é a retirada gradual de parte da lógica comercial e técnica do fluxo transacional para um ativo especializado.

```text
Antes
Transacional concentra produto, regras, cálculos e processamento

Direção apresentada
Transacional continua operando processos necessários
+
Ativo digital concentra avaliação comercial, regras e cálculo
```

## 18.2 De desenvolvimento de regra para configuração governada

A organização pretende trocar parte relevante da lógica programada por regras configuráveis no Taller de Productos.

Isso busca reduzir o tempo entre uma necessidade comercial e sua implementação técnica, sem eliminar totalmente o desenvolvimento.

## 18.3 De produto isolado para capacidade reutilizável

O ativo foi apresentado como utilizável por RIF, APIs, frontais, autosserviço e outros consumidores. Isso sugere uma mudança de uma lógica centrada em um único sistema para uma capacidade compartilhada de oferta e cálculo.

## 18.4 De dados de cotação descartáveis para informação potencialmente explorável

Ao manter cotação rápida no ativo digital, a iniciativa busca evitar expurgos massivos no transacional e preservar dados de simulação para exploração posterior.

## 18.5 De modelo regional disperso para aprendizado compartilhado

A formação reúne pessoas de diferentes países e equipes para disseminar o conhecimento acumulado em Espanha, Colômbia, Brasil, Uruguai, Panamá e outros contextos. A intenção declarada é replicar a capacidade onde ela for útil.

---

## 19. O que a reunião não permite concluir

Apesar do nível de detalhe funcional e conceitual, a transcrição não fornece informação suficiente para determinar com segurança:

- o significado exato de RID, RIF, RIV, RTD, RTB, CDC, GDC e PLE;
- a tecnologia exata do banco referido como “Monroe”;
- o provedor de nuvem, o modelo de hospedagem ou a topologia de infraestrutura;
- o modelo de autenticação, autorização e gestão de identidades;
- requisitos de segurança, criptografia, LGPD ou privacidade;
- mecanismos de auditoria;
- desenho de alta disponibilidade, recuperação de desastre ou continuidade;
- protocolos de API, contratos, versionamento, rate limiting e gestão de erros;
- uso de mensageria, filas ou eventos;
- modelo de CI/CD;
- política de testes, homologação e certificação;
- responsáveis formais por cada produto ou país;
- cronograma oficial para Brasil, Chile, Peru ou demais países;
- critérios para migração de produtos legados;
- regras de pagamento, comissão e resseguro;
- detalhes técnicos da futura capacidade de IA;
- modelo de custos, FinOps ou chargeback;
- métricas formais de desempenho além dos números verbalmente citados.

---

## 20. Conclusões principais

1. O ativo digital de cálculo é uma iniciativa estratégica para separar avaliação comercial, regras e cálculos do sistema transacional, mantendo integração com o RIF e demais consumidores.

2. O objetivo é construir ofertas comerciais completas, incluindo avaliação de risco, módulos de coberturas, cálculo e validações, sem depender integralmente do transacional.

3. O Brasil é prioridade imediata, com expectativa de construir um esqueleto de integração durante a semana de formação.

4. Espanha e produtos de vida aparecem como fontes importantes de experiência e evolução funcional, enquanto Uruguai e Panamá contribuíram para aprendizados sobre bases técnicas.

5. A arquitetura busca integração por APIs, redução de chamadas originadas no banco de dados, execução online e batch, maior desempenho e escalabilidade.

6. A configuração de regras pelo Taller de Productos é elemento central da solução. A meta declarada é que cerca de 90% das regras de negócio sejam configuráveis.

7. O modelo não elimina totalmente desenvolvimento nem transacional. Alguns processos, dados e estruturas continuarão no core; comissões e resseguro, por exemplo, permanecem fora do escopo direto da oferta produzida pelo ativo.

8. A cotação rápida é tratada como caso prioritário para execução e persistência no ativo, especialmente em função da volumetria brasileira e da baixa conversão das cotações.

9. A solução ainda está em evolução: há capacidades não certificadas, integrações em construção, coexistência com legado e ausência de detalhes sobre vários aspectos operacionais e técnicos.

10. A reunião representa mais do que uma formação técnica. Ela sinaliza uma transição gradual para um modelo de produto mais configurável, reutilizável, integrado e orientado a capacidades compartilhadas entre países e canais.
