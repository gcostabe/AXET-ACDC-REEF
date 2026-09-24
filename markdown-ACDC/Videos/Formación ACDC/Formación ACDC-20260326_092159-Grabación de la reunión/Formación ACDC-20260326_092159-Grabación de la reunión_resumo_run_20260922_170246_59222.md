# Relatório de Análise Avançada de Transcrição

**Arquivo de origem:** `Formación ACDC-20260326_092159-Grabación de la reunión.mp4`
**Data de processamento:** 22/09/2026 17:11:48
**Modelo de transcrição:** whisper.cpp Metal (small) — idioma: es
**Modelo de interpretação IA:** axet-code (gpt-5.6-terra)
**Prompt utilizado:** análise sênior avançada (documentação funcional, arquitetura, negócio, riscos, Q&A, anti-alucinação)

---

# Análise estruturada — sessão de configuração de produto Vida, regras, cálculo e diagnóstico técnico

> **Nota de fidelidade:** a transcrição apresenta forte ruído de reconhecimento automático de voz, com trechos repetidos, termos incompletos e nomes possivelmente deformados. Este documento preserva a distinção entre fatos explicitamente discutidos, explicações organizadas a partir deles e leituras analíticas sinalizadas como tal. Termos como **RT**, **LRT**, **ativo digital**, **prévio**, **WS**, **CSS/Fargate**, **Daena**, **PEL**, **EPC**, **Nautilus** e alguns nomes de pessoas foram mantidos como registrados quando não havia evidência suficiente para normalizá-los.

## 1. Síntese executiva

A sessão discutiu a preparação de um produto de **Vida para Brasil**, com foco na parametrização de coberturas, atributos de risco, regras de negócio e cálculos de prêmio e capital segurado. O trabalho toma como referência funcionalidades já utilizadas em outros contextos, especialmente Espanha e Panamá, mas ainda exige análise, estruturação e governança antes da implementação definitiva.

O principal direcionamento foi separar o trabalho em linhas paralelas: estruturar o produto e seus fluxos; analisar e parametrizar regras de atributos; configurar módulos e coberturas; e tratar os cálculos de forma independente, sobretudo os relacionados a coberturas com componente de poupança. A reunião também evidenciou a necessidade de evitar sobreposição entre regras, manter rastreabilidade com as histórias e consolidar fórmulas em um catálogo governado.

Além da discussão funcional, houve uma demonstração de diagnóstico técnico em ambiente de desenvolvimento. O grupo investigou erros ligados a datas de validade, validação de atributos de cobertura e ausência de campos obrigatórios. Foram utilizados serviços em ambiente AWS, tarefas em Fargate e logs no CloudWatch para localizar o ponto de falha. Como encaminhamento, foi sugerido ajustar o comportamento do serviço para não validar atributos quando uma cobertura não possuir atributos aplicáveis.

---

## 2. Contexto e antecedentes

O grupo está preparando capacidades para um projeto de Vida, aparentemente direcionado ao Brasil. A conversa começa mencionando pendências que estariam sendo revisadas pelo time ou componente chamado **Nautilus**, mas a natureza exata dessas pendências não fica clara.

Enquanto essas questões não são resolvidas, a orientação foi avançar na preparação do processo de cálculo dentro de um ambiente ou componente identificado como **RT**. A implementação deveria reutilizar parte de um trabalho anterior relacionado a coberturas de poupança e morte com componente de poupança, seguindo uma abordagem já realizada para Espanha.

A reunião indica que o produto ainda está em fase de construção e parametrização. Foram mencionados:

- produto de Vida;
- coberturas com e sem componente de poupança;
- atributos de risco e de cobertura;
- regras de elegibilidade, validação e apresentação;
- cálculo de prêmio e de capital;
- catálogo de fórmulas;
- integração com “ativo digital”;
- módulos que determinam quais coberturas são apresentadas;
- fluxos de emissão, sinistros e pagamentos;
- observabilidade por logs e auditoria.

---

## 3. Problemas identificados

### 3.1. Grande volume de regras a analisar

Foi mencionada uma base de aproximadamente **seis mil regras**. Essas regras precisam ser avaliadas para determinar:

- quais se aplicam a atributos;
- quais são validações prévias;
- quais devem ser agrupadas;
- quais podem coexistir;
- quais entram em conflito ou se sobrepõem;
- quais devem ser implementadas como configuração simples;
- quais exigem condição complexa ou código.

O risco apontado é iniciar a parametrização sem uma visão consolidada das regras. Isso poderia fazer com que uma regra fosse interpretada de uma forma em um ponto e de outra forma posteriormente, criando inconsistências.

### 3.2. Risco de sobreposição e perda de rastreabilidade

A reunião reforça que regras e configurações precisam ser rastreadas contra as respectivas histórias. A preocupação surgiu de experiências anteriores em que regras foram implementadas e, depois, descobriu-se que se sobrepunham a outras regras presentes inclusive na mesma planilha de definição.

A consequência relatada é retrabalho: revisar configurações, desfazer conflitos e refazer a análise. Como o processo ainda será manual enquanto determinadas ferramentas ou oficinas de produto não chegam, foi considerado necessário criar controles antes de inserir regras no sistema.

### 3.3. Fórmulas complexas dispersas ou sem governança clara

Para produtos de Vida, especialmente os que possuem componente de poupança, foi dito que a formulação pode ser extensa e composta por várias fórmulas encadeadas. Uma fórmula pode chamar outra, formando um conjunto que, ao final, participa do cálculo da prima/prêmio.

O problema não é apenas técnico: é também de gestão de ativos. A reunião reconheceu que ainda é necessário definir:

- onde as fórmulas serão criadas;
- como serão classificadas;
- quais serão globais;
- quais serão específicas de país;
- quem poderá modificá-las;
- como assegurar que alterações não afetem outros países ou produtos.

### 3.4. Dados históricos e datas de validade inconsistentes

Durante a demonstração, surgiu um erro relacionado a datas de validade. Foi explicado que um registro de apólice ou produto tinha data de validade em **1899**, o que fazia com que determinadas buscas de módulos não retornassem resultado, pois a lógica comparava a data de criação ou vigência do módulo com a data de validade do objeto associado.

Foram discutidas alternativas temporárias:

- alterar a data de validade do módulo para um ano muito anterior;
- ajustar a data de validade do produto para uma data mais recente, como 2000;
- alterar a preferência utilizada na consulta;
- revisar diretamente a tabela onde a validade do produto ou ramo estaria armazenada.

A discussão sugere que a data de 1899 está associada a migração ou dados legados, mas a origem exata não foi confirmada.

### 3.5. Validação indevida de atributos em coberturas sem atributos

Foi identificado um erro do tipo **“Not All Required Fields”**, associado à ausência de atributos de cobertura. O fluxo estava chamando um componente de validação de atributos mesmo para uma cobertura que não tinha atributos configurados.

A lógica esperada, segundo a discussão, seria:

- se a cobertura possui atributos, validar os atributos;
- se não possui atributos, não invocar a validação ou retornar uma resposta vazia sem erro.

Foi tratado como um “ponto de melhoria” e houve indicação de que seria possível implementar uma alteração simples no código para ignorar a validação quando o objeto de atributos não vier preenchido.

---

## 4. Solução e direcionamento apresentados

A solução discutida não é um único componente, mas um modelo de configuração e execução de produto composto por:

1. **Estruturação funcional do produto**  
   Definição de coberturas, capitais, atributos, fluxos e comportamento operacional antes de detalhar todas as regras de negócio.

2. **Parametrização de atributos e regras**  
   Uso de atributos para capturar dados e aplicar regras de elegibilidade, validação, apresentação, obrigatoriedade, bloqueio e comportamento de campos.

3. **Configuração de módulos e coberturas**  
   Módulos parecem definir quais coberturas serão apresentadas ou disponibilizadas para determinado contexto, canal ou combinação de negócio.

4. **Cálculo desacoplado como linha de trabalho própria**  
   Os cálculos — particularmente os de Vida e poupança — devem ser estruturados e tratados de forma independente da montagem básica do produto.

5. **Catálogo de fórmulas governado**  
   Fórmulas simples e complexas devem ser registradas em um catálogo, em vez de permanecerem apenas como lógica pontual de uma regra ou de uma base de dados de produto.

6. **Integração com o ativo digital**  
   O “ativo digital” recebe ou utiliza informações do produto, atributos, módulos, coberturas e resultados de cálculo. A transcrição não permite determinar se ele é um front-end, uma camada de canais, uma plataforma de contratação ou outro tipo de sistema.

7. **Observabilidade técnica baseada em logs e auditoria**  
   Para diagnosticar problemas, a equipe consulta tarefas de serviços, logs no CloudWatch e registros de auditoria.

---

## 5. Arquitetura ou funcionamento reconstruído

A representação abaixo é uma **consolidação analítica** a partir das explicações dadas; não corresponde necessariamente a um diagrama exibido na reunião.

```text
Canal / Ativo digital
        ↓
Entrada de dados da apólice, pessoa, risco e coberturas
        ↓
Módulos e configuração de produto
        ↓
Seleção/apresentação das coberturas aplicáveis
        ↓
Atributos de risco e de cobertura
        ↓
Regras de validação, obrigatoriedade, bloqueio e comportamento
        ↓
Serviços de pré-validação / “previos”
        ↓
Cálculo de capital e prêmio
        ↓
Catálogo de fórmulas no RT/LRT
        ↓
Resultado para produto, apólice e jornada digital
        ↓
Logs, auditoria e diagnóstico técnico
```

### 5.1. Fluxo funcional citado

O fluxo discutido parece seguir esta lógica:

1. O produto possui um conjunto potencial de coberturas.
2. A configuração de módulos determina quais coberturas são efetivamente apresentadas em determinado contexto.
3. A pessoa ou canal informa dados e atributos.
4. Os atributos podem disparar regras de validação, obrigatoriedade ou comportamento de tela.
5. As coberturas podem possuir dados variáveis.
6. Quando solicitado o cálculo, o sistema recebe as informações disponíveis naquele momento.
7. Fórmulas ou lógicas de cálculo definem capitais e prêmios.
8. O resultado retorna ao fluxo de contratação ou operação.

### 5.2. Tipos de regras ou condições mencionados

Foram citados, ainda que com nomenclatura parcialmente degradada pela transcrição:

- condições simples;
- condições intermediárias ou compostas;
- condições complexas;
- regras com código;
- validações prévias;
- regras de atributos;
- regras associadas à apresentação de dados;
- bloqueio de campos;
- campos obrigatórios;
- regras de pacotes ou comportamento semelhante.

A transcrição sugere que nem toda regra deve ser implementada da mesma forma. Regras complexas podem exigir código e fórmulas catalogadas; regras mais simples podem ser configuradas diretamente no mecanismo de atributos.

---

## 6. Componentes mencionados

### 6.1. RT / LRT

**Finalidade aparente:** ambiente, motor ou domínio no qual são organizadas configurações e fórmulas de cálculo.

**Uso mencionado:**

- preparar o processo de cálculo;
- manter fórmulas em catálogo;
- apoiar cálculo de Vida;
- armazenar lógica reutilizável;
- possibilitar uso de fórmulas por produto ou país.

**Limitação de interpretação:** a transcrição alterna entre “RT” e “LRT”, sem esclarecer se são o mesmo componente, versões diferentes ou siglas distintas.

### 6.2. Catálogo de fórmulas

**Finalidade:** registrar fórmulas que compõem cálculos de prêmio, capital ou outras operações de negócio.

Foi enfatizado que fórmulas, sobretudo as codificadas ou mais complexas, não deveriam permanecer exclusivamente no banco de dados do produto ou em uma regra isolada. A intenção é que fiquem no catálogo de formulação do RT/LRT.

**Possíveis classificações citadas:**

- fórmulas de Espanha;
- fórmulas de um país específico;
- fórmulas reutilizáveis por todos;
- fórmulas possivelmente associadas a “TRN”, sigla não esclarecida.

### 6.3. Ativo digital

**Finalidade aparente:** camada que recebe ou apresenta informações do produto, inclusive coberturas, capitais, atributos e resultados de cálculo.

Foi dito que fórmulas e cálculos podem receber a informação que chega ao ativo digital. Também se mencionou que, após o cálculo, o valor de capital poderia ser colocado na cobertura para retorno ao ativo digital.

**Incerteza:** não foi possível determinar se o ativo digital é um portal, um front-end, uma camada de orquestração ou uma solução mais ampla.

### 6.4. Módulos

Os módulos parecem ser elementos de configuração que determinam ou filtram coberturas disponíveis. Foram utilizados na demonstração para recuperar uma cobertura associada a um produto.

A discussão indica que:

- um produto pode ter muitas coberturas;
- nem todas precisam ser apresentadas em todos os contextos;
- o módulo permite apresentar apenas as coberturas associadas;
- isso dá flexibilidade para configurar ofertas por negócio, canal ou jornada.

### 6.5. Coberturas

Foram discutidas coberturas de Vida, incluindo:

- coberturas com componente de poupança;
- coberturas de risco;
- cobertura identificada como **40-03**;
- uma possível referência a “40-20”;
- coberturas com atributos;
- coberturas sem atributos;
- cobertura de hospitalização, cujo capital poderia depender de quantidade de dias e valor diário.

A numeração foi preservada conforme a transcrição, sem confirmação de sua nomenclatura oficial.

### 6.6. Atributos

Os atributos são tratados como dados parametrizáveis associados a risco, pessoa ou cobertura. Podem participar de:

- validações;
- condições;
- preenchimento de valor e descrição;
- cálculo;
- controle de obrigatoriedade;
- bloqueio de campos;
- definição de capitais;
- seleção ou comportamento de coberturas.

Foi dado como exemplo o atributo de **ocupação**, com uma condição que, ao ser satisfeita, atribui valor e descrição.

### 6.7. “Previos” / componente de pré-validação

A transcrição menciona repetidamente “previo” ou “previos”, aparentemente como um componente ou etapa de validação anterior ao processamento principal.

No incidente demonstrado, esse componente foi chamado para validar atributos de cobertura. O problema ocorreu porque uma cobertura sem atributos disparou a validação e recebeu erro de campos obrigatórios ausentes.

Não é possível afirmar se “previo” é o nome oficial de um microserviço, uma etapa de processo ou apenas uma designação informal.

### 6.8. WS

WS foi tratado como um ambiente, domínio ou agrupamento de serviços. Durante o diagnóstico, a equipe orientou:

- entrar na conta correspondente;
- identificar serviços;
- localizar tarefas em execução;
- abrir logs vinculados;
- consultar CloudWatch.

A expressão “conta de WS” foi usada, mas sua relação com AWS não foi detalhada.

### 6.9. AWS Fargate, CloudWatch e possível X-Ray

Foi dito que os microsserviços são implantados em serviços de **Fargate**. A observabilidade passa por:

- identificação da tarefa em execução;
- abertura de logs vinculados;
- consulta ao CloudWatch;
- ajuste do nível de trace;
- possível uso de níveis de debug;
- referência a X-Ray em uma pergunta, sem confirmação de uso efetivo.

A fala sugere que existe registro de request e response em determinados níveis de trace. Porém, não foi confirmado que todas as chamadas estejam instrumentadas com X-Ray.

### 6.10. Daena

Foi afirmado que, em produção, os logs estariam dentro de “Daena” e que aquilo que aparece no CloudWatch seria levado para lá. O nome pode estar incorreto por erro de transcrição. Não foi possível identificar com segurança a ferramenta.

### 6.11. PEL e Panamá

Foi mencionado que já existe um catálogo de fórmulas em um componente chamado **PEL**, associado a contextos como Uruguai e Panamá. Também foi sugerido verificar se a formulação definida para o novo caso encaixa no dicionário de fórmulas já existente em Panamá.

A discussão não confirmou se o catálogo será compartilhado, migrado, reutilizado integralmente ou apenas usado como referência.

---

## 7. Modelo de integração

### 7.1. Integração funcional

O modelo discutido sugere que o ativo digital envia informações de entrada para processamento. Essas informações incluem dados de apólice, atributos e cobertura. O sistema então aplica regras, recupera módulos e executa cálculos.

Em termos funcionais:

```text
Dados da pessoa / apólice / cobertura
        ↓
Ativo digital
        ↓
Serviços de regras e validação
        ↓
Configuração de módulos e atributos
        ↓
Cálculo de capital ou prêmio
        ↓
Retorno do resultado à cobertura/jornada
```

### 7.2. Integração de cálculo

Para cálculo, foi descrito que o sistema recebe o estado atual da apólice e utiliza essa informação como entrada para fórmulas.

O raciocínio apresentado foi:

- se um valor já chega calculado, ele pode ser usado como referência;
- se o valor depende da combinação de variáveis, o cálculo deve ser feito na camada de cálculo da cobertura;
- o resultado calculado deve ser atribuído ao capital da cobertura;
- não se deve tentar reproduzir toda lógica diretamente em um ponto inadequado da parametrização.

### 7.3. Integração técnica e diagnóstico

A interação técnica apresentada ocorre por serviços implantados em Fargate, com logs visualizados no CloudWatch. A equipe procura a tarefa ativa do serviço, acessa seus registros e analisa a sequência de chamadas, erros e respostas.

A transcrição indica que também existe auditoria em outra camada, mencionada como auditoria de “ACDC”, com possível acesso por banco de dados. A relação entre a auditoria e os logs não foi detalhada.

---

## 8. Modelo operacional

### 8.1. Construção incremental do produto

A orientação foi começar com cenários simples e evoluir gradualmente:

1. configurar casos mais básicos;
2. trabalhar inicialmente com um único risco;
3. entregar partes incrementais;
4. avançar depois para casos com múltiplos participantes, como pai, mãe e filhos;
5. incorporar regras e cálculos progressivamente.

Essa abordagem busca permitir entregas parciais sem esperar que todo o universo de regras esteja concluído.

### 8.2. Estrutura antes de regras detalhadas

Foi defendido que a primeira fase de um projeto como esse seja estrutural. Antes de mergulhar em todas as regras de negócio, seria necessário definir:

- composição do produto;
- intervenientes;
- fluxos;
- propriedades;
- emissão;
- sinistros;
- pagamentos;
- suplementos;
- movimentos gerados pelo sistema.

A intenção é ter o produto funcional em sua estrutura antes de ampliar a complexidade de regras de emissão, sinistro e demais processos.

### 8.3. Linha de trabalho independente para cálculo

O cálculo foi descrito como uma linha de trabalho própria. Enquanto a equipe estrutura produto, módulos e jornadas, outra frente deve organizar fórmulas e cálculo.

A justificativa é a complexidade do domínio de Vida, que pode exigir muitas fórmulas, dependências e validações.

### 8.4. Uso de logs para incidentes

O processo demonstrado para investigação de erro foi:

1. identificar o ambiente;
2. localizar o serviço;
3. localizar a tarefa em execução;
4. acessar os logs;
5. reproduzir o erro;
6. observar a pilha de erro;
7. correlacionar horário, request, response e componente chamado;
8. confirmar se o erro ocorre na validação esperada ou em uma chamada indevida;
9. ajustar produto, configuração ou código conforme a causa.

---

## 9. Governança

### 9.1. Governança de fórmulas

A necessidade de um modelo de governança foi explicitamente reconhecida. As principais perguntas ainda abertas são:

- uma fórmula global pode ser alterada por qualquer país?
- fórmulas de um país devem ser isoladas?
- quem aprova uma mudança?
- como identificar fórmulas reutilizáveis?
- como evitar impacto em produtos existentes?
- como organizar versões e alterações?

A preocupação surgiu porque catálogos existentes, como o citado para Uruguai e Panamá, podem ser acessíveis ou alteráveis, gerando risco de mudanças sem controle.

### 9.2. Fórmulas como ativos estáveis

Foi destacado que fórmulas de Vida podem permanecer válidas por muitos anos. Foi mencionado que certas fórmulas estariam funcionando há **33 anos**, com um pequeno ajuste em **2014**, e que teriam suportado diferentes legislações.

Esse exemplo foi usado para defender que, quando uma fórmula é bem estruturada, validada e testada, ela pode se tornar um ativo duradouro. Não há detalhes sobre quais fórmulas são essas, em qual país foram usadas ou quais testes foram realizados.

### 9.3. Controle de regras e histórias

A governança também envolve rastrear regras contra histórias e evitar implantações isoladas. A equipe deve levantar previamente o que será configurado, antes de inserir regras no ambiente, para reduzir o risco de sobreposição.

---

## 10. Modelo de produto

A reunião revela um modelo fortemente orientado à configuração de produto. Os elementos principais são:

- produto;
- ramo;
- coberturas;
- módulos;
- atributos;
- regras;
- cálculos;
- capitais;
- prêmios;
- fluxos operacionais;
- canais;
- jornadas digitais.

Uma leitura possível é que a organização busca evitar que toda variação de negócio exija desenvolvimento exclusivo. Em vez disso, a intenção é concentrar variações de produto em configuração, catálogo, regras e fórmulas, reservando código para casos realmente complexos.

Essa leitura é inferencial, mas é sustentada pela ênfase recorrente em parametrização, catálogo de fórmulas, módulos, atributos e reutilização.

---

## 11. Casos concretos e exemplos apresentados

### 11.1. Produto de Vida para Brasil

**Contexto:** preparação de um novo projeto de Vida.

**Elementos mencionados:**

- cobertura de morte com componente de poupança;
- necessidade de cálculo;
- fórmulas complexas;
- integração com ativo digital;
- utilização de capacidades existentes;
- possível implantação ou versão para Brasil.

**Próximos passos citados:**

- estruturar fórmulas;
- definir onde serão criadas;
- estabelecer catálogo e governança;
- preparar o “cascarón”, entendido como uma estrutura inicial;
- completar exemplos e fluxos.

### 11.2. Referência a Espanha

Espanha foi mencionada como referência de implementação de funcionalidades, fórmulas e segurança.

Foi dito que parte do trabalho poderia ser repetida ou usada como modelo para o novo produto. Também houve uma solicitação para que pessoas tratassem posteriormente de um tema de segurança relacionado a Espanha.

A transcrição não permite afirmar quais componentes de Espanha já estão disponíveis nem qual seria a estratégia de segurança mencionada.

### 11.3. Referência a Panamá

Panamá apareceu como fonte de fórmulas ou dicionário já existente. A equipe sugeriu avaliar se a formulação nova se encaixa no que já existe nesse catálogo.

A ideia não foi apresentada como reutilização garantida: seria necessário comparar as fórmulas e, se aplicável, transformar ou adaptar as fórmulas menores que compõem uma fórmula maior.

### 11.4. Referência a Uruguai

Uruguai foi citado juntamente com Panamá no contexto de catálogo de fórmulas existente em PEL. A conversa serviu como exemplo do problema de permissões e alteração de fórmulas compartilhadas.

### 11.5. Cobertura 40-03

A cobertura identificada como 40-03 foi usada durante a investigação do erro. Ela aparentemente não tinha atributos de cobertura configurados, mas o sistema tentava validar atributos obrigatórios.

A correção discutida foi dupla:

- adicionar temporariamente um atributo à cobertura para avançar no teste;
- ajustar o código ou serviço para não falhar quando não houver atributos.

### 11.6. Cobertura de hospitalização

Foi dado um exemplo de cobertura de hospitalização em que o capital dependeria de dois dados variáveis:

- quantidade de dias;
- valor diário.

O cálculo seria, conceitualmente, a multiplicação entre essas variáveis. O resultado deveria alimentar o capital da cobertura após a chamada de cálculo.

### 11.7. Exemplo de seguro auto

Foi usado um exemplo comparativo de produto de automóvel. Nesse caso, o capital poderia depender do valor do veículo, que já seria calculado previamente com base em identificação de marca, modelo e outras características.

O objetivo do exemplo foi diferenciar dois cenários:

- valor já calculado anteriormente, apenas referenciado no capital;
- valor que precisa ser efetivamente calculado na cobertura a partir de variáveis.

---

## 12. Roadmap e encaminhamentos citados

A reunião não apresentou um roadmap formal com datas, marcos ou responsáveis claramente definidos. Ainda assim, os direcionamentos observados foram:

| Tema | Encaminhamento mencionado | Grau de definição |
|---|---|---|
| Regras de atributos | Levantar, analisar, agrupar e rastrear regras antes da parametrização | Direção clara, sem plano detalhado |
| Fórmulas | Estruturar fórmulas, criar catálogo e avaliar reutilização de fórmulas existentes | Em preparação |
| Governança | Definir quem pode criar ou alterar fórmulas globais e locais | Pendente |
| Produto Vida Brasil | Preparar estrutura inicial e completar cálculo | Em andamento |
| Data de validade | Corrigir ou ajustar validade de produto/módulo para destravar testes | Ação imediata discutida |
| Atributos ausentes | Ajustar o serviço para não validar cobertura sem atributos | Ponto de melhoria aceito |
| Segurança Espanha | Conversar posteriormente sobre estratégia de abordagem | Pendente |
| Observabilidade | Garantir acesso às contas/ambientes e aos logs | Necessidade identificada |

---

## 13. Números e indicadores citados

> Os valores abaixo foram mencionados oralmente durante a reunião e não foram auditados nem contextualizados externamente.

| Indicador | Valor mencionado | Contexto |
|---|---:|---|
| Regras a analisar | Aproximadamente 6.000 | Regras de negócio e atributos |
| Tempo de funcionamento de fórmulas | 33 anos | Exemplo de fórmulas de Vida consideradas estáveis |
| Ajuste citado nas fórmulas | 2014 | Pequeno ajuste em fórmulas antigas |
| Processos no Brasil | “20.000 processos mais” | Trecho pouco claro; não permite interpretação precisa |
| Data problemática | 1899 | Data de validade associada a produto/apólice em teste |
| Data sugerida para ajuste | 2000 | Possível ajuste de validade para testes |
| Alternativa de data histórica | 1800 ou 1000 | Sugestões de data para módulo/configuração; caráter provisório |
| Cobertura de teste | 40-03 | Cobertura sem atributos, segundo a discussão |
| Exemplo de número de coberturas | 30 ou 35 | Produto poderia conter muitas coberturas, mas mostrar apenas as configuradas no módulo |
| Exemplo de dias | 105 | Exemplo ilustrativo para cálculo de capital; não confirmado como regra real |

---

## 14. Perguntas e respostas relevantes

### 14.1. Onde fórmulas complexas devem ser armazenadas?

**Pergunta:** fórmulas escritas com código ficariam apenas dentro da regra no momento da configuração?

**Resposta:** a orientação foi que o código e as fórmulas devem ir para o catálogo de fórmulas do LRT/RT, e não ficar apenas gravados localmente em uma regra ou base de dados de produto.

**O que isso esclarece:** fórmulas complexas devem ser tratadas como ativos reutilizáveis e governados, não como customizações isoladas.

---

### 14.2. Fórmulas podem ser compartilhadas entre países?

**Pergunta:** uma fórmula poderia ser classificada como de Espanha, de outro país ou global, sendo utilizada por todos?

**Resposta:** foi reconhecido que isso é possível como necessidade de desenho, mas ainda precisa de um modelo de governança para definir permissões e responsabilidade sobre mudanças.

**O que isso esclarece:** a reutilização internacional está sendo considerada, mas não existe, na reunião, uma política consolidada de ownership ou versionamento.

---

### 14.3. Como resolver o problema da data negativa ou histórica?

**Pergunta:** por que um módulo não era recuperado e o que deveria ser alterado?

**Resposta:** foi explicado que a data de criação ou validade do módulo precisava ser compatível com a data de validade da apólice/produto. Como o registro tinha data de 1899, a busca não encontrava o módulo. Foram propostas alterações de validade para viabilizar o teste.

**O que isso esclarece:** a disponibilidade de módulos depende de regras temporais de vigência. Dados de migração ou datas históricas podem impedir a execução de fluxos atuais.

---

### 14.4. Por que uma cobertura sem atributos falha na validação de atributos?

**Pergunta:** se uma cobertura não possui atributos, por que o sistema chama a validação e retorna erro de campos obrigatórios?

**Resposta:** os participantes concordaram que não deveria haver validação nesse cenário. Foi sugerido alterar o serviço para retornar vazio ou não executar a validação quando não houver objeto de atributos.

**O que isso esclarece:** existe uma lacuna de robustez no fluxo atual: ele presume a presença de atributos mesmo quando a configuração de cobertura não os possui.

---

### 14.5. Onde deve ocorrer o cálculo de capital quando há variáveis?

**Pergunta:** se o capital depende, por exemplo, de quantidade de dias e valor diário, o cálculo deve ser feito diretamente na configuração da cobertura?

**Resposta:** a orientação foi que, quando há uma operação a executar, o cálculo deve ser tratado na camada de cálculo. O ativo digital envia os dados; o processo calcula; o resultado é colocado no capital da cobertura.

**O que isso esclarece:** a configuração de cobertura pode referenciar valores já calculados, mas não deve necessariamente concentrar lógicas complexas de cálculo.

---

### 14.6. O sistema utiliza X-Ray para rastrear chamadas?

**Pergunta:** as chamadas dos serviços estariam em X-Ray ou seriam vistas apenas em outra ferramenta?

**Resposta:** não houve resposta conclusiva. Foi sugerido que há rastreamento em logs e que determinados níveis de trace podem ser ativados, mas o uso efetivo de X-Ray não foi confirmado.

**O que isso esclarece:** a arquitetura de observabilidade ainda não ficou completamente documentada na sessão.

---

## 15. Limitações reconhecidas

- A reunião não definiu claramente a arquitetura completa de RT/LRT, ativo digital, PEL ou ACDC.
- Não foi apresentado um modelo final de governança para fórmulas globais e por país.
- A origem da data de 1899 não foi confirmada, embora tenha sido associada de forma especulativa a migração.
- Não foi confirmado se todas as fórmulas existentes de Panamá são reutilizáveis para o novo produto.
- Não foi confirmada a utilização de X-Ray.
- Não foram apresentados detalhes de banco de dados, APIs, contratos, mensageria ou modelo de eventos.
- Não foram detalhados responsáveis formais pelas linhas de trabalho.
- Não foi apresentado um plano de testes completo para fórmulas, regras, módulos e integrações.
- Não foi esclarecido se o ajuste para cobertura sem atributos seria uma alteração de código definitiva ou apenas uma medida de curto prazo.
- A transcrição não permite determinar com segurança o significado de várias siglas e ferramentas mencionadas.

---

## 16. Riscos e desafios

### 16.1. Riscos explicitamente mencionados

- Sobreposição de regras quando a análise não é feita previamente.
- Perda de rastreabilidade entre regras implementadas e histórias de origem.
- Alteração indevida de fórmulas compartilhadas entre países.
- Falhas de fluxo provocadas por datas de validade inconsistentes.
- Erro ao validar atributos inexistentes em uma cobertura.
- Dificuldade de evolução quando a formulação complexa não está corretamente estruturada.
- Dependência de trabalho manual enquanto ferramentas ou oficinas de produto não estão disponíveis.

### 16.2. Desafios derivados do contexto

> Esta seção apresenta análise, não afirmações literais dos participantes.

- **Escalabilidade da parametrização:** analisar milhares de regras e transformá-las em configuração consistente exigirá critérios claros de classificação, priorização e validação.
- **Gestão de reutilização internacional:** compartilhar fórmulas entre países pode reduzir retrabalho, mas amplia a necessidade de isolamento, versionamento, aprovação e testes de regressão.
- **Separação entre configuração e código:** será importante definir de forma objetiva quando uma regra deve ser configurável e quando precisa ser implementada como fórmula codificada.
- **Qualidade de dados de migração:** datas históricas ou inválidas podem afetar regras de vigência, buscas de módulos e comportamento funcional em vários fluxos.
- **Observabilidade acessível:** para reduzir dependência de especialistas, equipes de produto e suporte precisam ter acesso controlado a logs, auditoria e correlação de falhas.

---

## 17. Relações de causa e efeito reconstruídas

### 17.1. Regras em grande volume

```text
Grande quantidade de regras
        ↓
Risco de interpretações divergentes e sobreposição
        ↓
Necessidade de análise, agrupamento e rastreabilidade
        ↓
Parametrização mais controlada no sistema
```

### 17.2. Fórmulas de Vida complexas

```text
Cálculos compostos por fórmulas encadeadas
        ↓
Dificuldade de manter lógica apenas em regras locais
        ↓
Necessidade de catálogo de fórmulas
        ↓
Governança de reutilização, alteração e uso por país
```

### 17.3. Datas históricas no produto

```text
Data de validade histórica/incompatível
        ↓
Módulo não é encontrado pela lógica de vigência
        ↓
Fluxo não recupera cobertura esperada
        ↓
Necessidade de corrigir dado/configuração e revisar migração
```

### 17.4. Cobertura sem atributos

```text
Cobertura sem atributos configurados
        ↓
Fluxo chama validação de atributos mesmo assim
        ↓
Erro de campos obrigatórios
        ↓
Necessidade de condicionar a chamada ou retornar vazio
```

---

## 18. Transformações estruturais observadas

### 18.1. De implementação isolada para catálogo governado

A discussão aponta para uma transformação de fórmulas tratadas localmente para fórmulas administradas como ativos compartilháveis. Isso é especialmente relevante para regras de Vida, que podem durar anos e servir a múltiplos produtos ou países.

### 18.2. De produto fixo para produto configurável

A combinação de módulos, coberturas, atributos, regras e fórmulas sugere uma direção de produto altamente configurável. Um mesmo produto pode conter muitas coberturas, mas apresentar apenas as pertinentes para uma jornada, canal ou configuração específica.

### 18.3. De diagnóstico reativo para observabilidade por serviços

A demonstração de Fargate, CloudWatch, níveis de trace e auditoria evidencia uma operação baseada em serviços observáveis. O grupo não apenas corrigiu uma configuração; também mostrou como rastrear a causa de um erro no ambiente.

### 18.4. De entrega integral para evolução incremental

A recomendação de iniciar com riscos e cenários simples, e só depois avançar para combinações familiares e regras mais complexas, indica uma estratégia de entrega incremental.

---

## 19. O que a reunião não permite concluir

A transcrição não fornece elementos suficientes para determinar:

- a tecnologia exata do RT/LRT;
- se RT e LRT são o mesmo sistema;
- o significado oficial de PEL, ACDC, EPC, WS, TRN e Daena;
- a arquitetura de dados;
- os bancos de dados utilizados;
- se há mensageria, eventos ou processamento assíncrono;
- os contratos de API entre ativo digital, serviços e core;
- a plataforma de IAM e autorização;
- os critérios de segregação entre países;
- a estratégia de versionamento de fórmulas;
- o processo de aprovação de mudanças;
- SLAs, SLOs ou tempos de resposta;
- a estratégia de disaster recovery;
- a cobertura de testes automatizados;
- o modelo de CI/CD;
- o modelo de segurança citado para Espanha;
- o cronograma real para Brasil;
- a composição das equipes e responsáveis formais;
- o significado preciso do termo “marca de subscrição”;
- a diferença técnica entre cobertura de risco e cobertura com componente de poupança no modelo implementado.

---

## 20. Conclusões

A reunião apresentou um momento de transição entre descoberta, estruturação e execução. O objetivo imediato é viabilizar um produto de Vida para Brasil, aproveitando referências e capacidades existentes, mas sem replicar configurações de forma indiscriminada.

A prioridade funcional é estruturar o produto, suas coberturas, módulos, atributos e fluxos. Em paralelo, o cálculo deve ser tratado como uma frente específica, com fórmulas catalogadas, reutilizáveis e submetidas a governança. Antes de parametrizar em escala, a equipe precisa analisar as regras disponíveis, identificar conflitos e manter vínculo com as histórias de origem.

No plano técnico, a sessão revelou problemas concretos de dados de vigência e validação de atributos, além de uma forma prática de investigação por logs em serviços executados em Fargate e observados via CloudWatch. A correção esperada para coberturas sem atributos é tornar o fluxo tolerante à ausência do objeto de atributos, evitando validações que não têm propósito funcional.

A principal mensagem é que a evolução não depende apenas de configurar telas ou coberturas. Ela requer disciplina sobre regras, fórmulas, dados, governança, rastreabilidade, observabilidade e separação adequada entre parametrização e código.
