# Relatório de Análise Avançada de Transcrição

**Arquivo de origem:** `Formación ACDC-20260323_142755-Grabación de la reunión.mp4`
**Data de processamento:** 22/09/2026 17:04:32
**Modelo de transcrição:** whisper.cpp Metal (small) — idioma: es
**Modelo de interpretação IA:** axet-code (gpt-5.6-terra)
**Prompt utilizado:** análise sênior avançada (documentação funcional, arquitetura, negócio, riscos, Q&A, anti-alucinação)

---

# Análise Estruturada — Treinamento sobre Ativo Digital, Regras, Tarificação e Integração de Emissão

> **Nota de fidelidade:** a transcrição parece resultar de reconhecimento automático de voz e contém trechos fragmentados, termos possivelmente deformados e alternância entre espanhol, português e nomenclaturas internas. Esta análise preserva apenas informações sustentadas pelo conteúdo. Quando um nome, sigla ou detalhe não pôde ser confirmado, a incerteza é indicada.

## 1. Síntese executiva

A reunião foi um treinamento técnico-funcional sobre uma iniciativa denominada, na transcrição, **Ativo Digital**. A iniciativa busca concentrar regras de negócio, validações, seleção de riscos, configuração de coberturas, módulos, cálculos tarifários e parte da orquestração do processo de emissão em uma camada separada do sistema transacional legado.

A principal direção apresentada é reduzir a dependência de regras mantidas diretamente na base Oracle e em mecanismos antigos — citados como **PL**, programas associados a atributos variáveis, processos batch e componentes como “Tron/Neutron”, “DUB”, “RTE” e “Easy Rules”. A intenção é que o Ativo Digital seja capaz de avaliar regras e calcular resultados de forma mais independente, inclusive para cenários de cotação e simulação que não necessariamente gravam dados no transacional.

A solução foi apresentada como uma composição de capacidades especializadas:

- **Seleção de riscos:** regras sobre atributos, validações, controles técnicos, formulários, documentação e efeitos de comportamento de campos.
- **Módulos:** definição e validação de conjuntos de coberturas, capitais, obrigatoriedades, dependências e limites.
- **RTE:** componente de tarifação e cálculo, incluindo coberturas de risco e, em certos casos, coberturas de poupança/subscrição.
- **Orquestrador do Ativo Digital:** componente que decide como reagir às regras disparadas, como rejeitar uma operação, alterar atributos, solicitar documentos ou chamar cálculos.
- **Taller de Productos / Oficina de Produtos:** ambiente pretendido para gestão configurável de produtos, regras, coberturas, fórmulas e bases técnicas.
- **APIs e integração com SAPIs/BAS:** preservação, em parte, dos serviços já existentes de emissão, incluindo uma camada anterior que prepara a entrada para o Ativo Digital e uma camada posterior que persiste o resultado no transacional.

A reunião também teve forte caráter de alinhamento e treinamento. Participantes manifestaram dificuldade inicial para localizar cada capacidade no fluxo de emissão, mas, ao final, alguns indicaram que passaram a ter uma visão mais clara da arquitetura e de onde configurar cada tipo de regra.

---

## 2. Contexto e antecedentes

### 2.1. Cenário anterior percebido

A conversa sugere um cenário em que parte relevante das regras de negócio e dos processos de emissão ainda está distribuída entre:

- configurações de produto;
- base de dados Oracle;
- programas ou regras históricas associadas a atributos variáveis;
- controles técnicos já existentes;
- processos batch;
- componentes legados, aparentemente relacionados a “Tron”, “Neutron”, “DUB” e “Easy Rules”.

A transcrição não detalha integralmente a arquitetura anterior, mas deixa claro que ela envolve múltiplos pontos de execução e que isso dificulta a centralização das regras.

### 2.2. Motivação da mudança

A motivação central apresentada é tornar a camada de regras e cálculo menos dependente do transacional e da base Oracle. Um participante afirma, em essência, que:

> se Oracle cair, ainda deveria ser possível continuar precificando e calculando.

Essa fala indica que a separação não é apenas uma questão de organização de código: ela busca maior autonomia operacional do componente de cálculo e regras.

Também foram citados outros motivos:

- evitar duplicidade ou conflito entre regras mantidas em locais diferentes;
- permitir simulações completas sem persistência;
- facilitar configuração e evolução de produtos;
- ampliar a reutilização de capacidades entre países;
- tornar regras específicas de negócio parametrizáveis;
- diminuir a necessidade de desenvolvimento para mudanças configuráveis;
- permitir que áreas de negócio assumam parte maior da parametrização, sob governança.

### 2.3. Programa de transformação

A reunião apresenta o Ativo Digital como uma evolução mais ampla que a simples substituição de um componente técnico. A transformação envolve:

- regras de negócio;
- gestão de produtos;
- integração de APIs;
- cálculo tarifário;
- simulação;
- documentação;
- formulários;
- seleção de riscos;
- operação de emissão;
- governança sobre alterações críticas.

---

## 3. Problemas identificados

## 3.1. Regras distribuídas e risco de incoerência

Um dos problemas mais claros é a coexistência de regras em diferentes camadas. O risco descrito é que uma regra seja aplicada no Ativo Digital e outra regra contraditória permaneça no produto ou no transacional.

Exemplo conceitual citado na reunião:

- no Ativo Digital, uma regra pode determinar um comportamento para um atributo, como uma cor;
- no produto ou na base pode existir outro controle técnico que rejeite aquele mesmo valor;
- o resultado é uma operação que passa pela camada nova, mas falha posteriormente por uma regra histórica.

A conclusão explícita foi:

> Se a regra está no Ativo Digital, ela deve estar no Ativo Digital, evitando uma segunda regra equivalente em camadas posteriores.

Isso não significa que todas as regras já possam ser migradas. A própria reunião reconhece que ainda existem funcionalidades sem cobertura completa no Ativo Digital.

## 3.2. Dependência do transacional para cálculo e operação

O desenho anterior parece depender de dados, regras e cálculos armazenados no transacional. Isso limita:

- a independência operacional;
- a capacidade de realizar simulações;
- a reutilização de lógica;
- a consistência entre canais;
- a agilidade de evolução de produto.

A solução busca deslocar o cálculo e as regras de oferta comercial para uma camada externa ao transacional, mantendo a persistência e certas funções legadas no fluxo posterior.

## 3.3. Personalizações específicas de negócio

Foi discutido o caso de regras gerais de produto que precisam ser substituídas ou especializadas para situações particulares, tais como:

- uma apólice;
- uma apólice coletiva;
- contrato;
- subcontrato;
- grupo;
- cliente;
- canal comercial;
- estrutura comercial;
- agente;
- data ou vigência.

Na terminologia usada em Espanha, essas customizações foram chamadas de **“trajes a medida”**. Em outros contextos da reunião, aparecem como preferências ou regras específicas.

O problema é que essas personalizações não podem ser tratadas como simples regras genéricas sem prioridade. É necessário um mecanismo para determinar qual regra prevalece em cada situação.

## 3.4. Falta de clareza do fluxo para participantes em treinamento

Diversas perguntas não foram sobre falhas da arquitetura, mas sobre compreensão operacional:

- em qual ponto são executados controles técnicos;
- quando ocorre a validação de atributos;
- quando módulos são chamados;
- quando o RTE calcula;
- como o front-end deve reagir a atributos invisíveis, bloqueados ou obrigatórios;
- qual componente decide as consequências de uma regra.

Isso revela uma necessidade reconhecida pelos próprios participantes: transformar uma visão de componentes isolados em uma compreensão end-to-end do fluxo de emissão.

## 3.5. Limitação de cobertura funcional atual

A reunião reconhece que:

- nem todas as capacidades do sistema legado já estão comprovadamente implementadas no novo modelo;
- certos fluxos precisam ser testados;
- há comportamentos que ainda não foram certificados em produto real;
- alguns mecanismos, como o “multi-user control”, não estavam confirmados como funcionais;
- determinadas validações ou comportamentos específicos ainda podem depender da base antiga ou de controles técnicos remanescentes.

---

## 4. Solução apresentada: o Ativo Digital

O Ativo Digital foi apresentado como uma camada que reúne capacidades para operar regras e cálculos relacionados ao processo de seguro, especialmente à oferta comercial, risco, coberturas, capitais, prêmios e validações.

Uma reconstrução conceitual do que foi descrito é:

```text
Canal / Front-end / Processo batch / API externa
                    ↓
            APIs de emissão e integração
                    ↓
     Preparação dos dados e recuperação de contexto
                    ↓
            Orquestrador do Ativo Digital
                    ↓
 ┌───────────────────────────────────────────────────┐
 │ Seleção de Riscos                                  │
 │ - controles técnicos                               │
 │ - validações                                       │
 │ - regras sobre atributos                           │
 │ - formulários e documentação                       │
 │ - comportamento de campos                          │
 ├───────────────────────────────────────────────────┤
 │ Módulos                                            │
 │ - coberturas                                       │
 │ - obrigatoriedades                                 │
 │ - capitais mínimos/máximos                         │
 │ - dependências entre coberturas                    │
 ├───────────────────────────────────────────────────┤
 │ RTE / Tarificação                                  │
 │ - primas                                           │
 │ - capitais                                         │
 │ - desgloses                                        │
 │ - fórmulas                                         │
 │ - operações de subscrição/poupança, quando houver  │
 └───────────────────────────────────────────────────┘
                    ↓
          Resultado enriquecido em “polizón”
                    ↓
     Transacional / Base de dados / Processos BAS
```

> **Importante:** este desenho é uma consolidação analítica baseada na reunião. Não foi apresentado literalmente dessa forma.

A camada nova não elimina todo o sistema anterior. O fluxo descrito indica que:

1. uma API recebe a solicitação;
2. identifica se o ramo/produto deve passar pelo Ativo Digital;
3. complementa a entrada com dados necessários;
4. chama o Ativo Digital;
5. recebe uma estrutura de saída enriquecida;
6. segue com a persistência e com processos transacionais que continuam necessários.

---

## 5. Princípios funcionais e arquiteturais apresentados

## 5.1. Regra única por responsabilidade

A reunião enfatiza evitar regras duplicadas entre Ativo Digital e sistema transacional. A intenção é que regras migradas sejam governadas em um único ponto.

A razão é evitar incoerências, resultados contraditórios e manutenção duplicada.

## 5.2. Independência do transacional

O Ativo Digital é descrito como uma camada que deve conseguir:

- precificar;
- calcular;
- aplicar regras;
- simular operações;

sem depender, em todos os casos, da execução direta do transacional.

Isso não elimina a necessidade de persistir operações reais no core existente.

## 5.3. Configuração antes de desenvolvimento

A direção anunciada é transformar mudanças que antes exigiam desenvolvimento — por exemplo, criar colunas, ajustar tabelas ou alterar programas — em configuração de produto, regras, bases técnicas, coberturas e condições.

A reunião, porém, também afirma que certas fórmulas de alta complexidade, sobretudo em produtos de vida/poupança, ainda exigirão implementação específica em código.

## 5.4. Especialização sobre regras gerais

A lógica de prioridade apresentada parte do princípio de que regras específicas devem ser avaliadas antes das gerais.

Exemplo usado na conversa:

- uma regra geral define uma soma segurada de 10.000;
- uma regra específica para determinado contrato define 5.000;
- quando a condição do contrato é satisfeita, a regra específica deve prevalecer.

Caso a regra específica não seja aplicável porque suas condições não foram atendidas, a avaliação segue para regras mais gerais.

## 5.5. O orquestrador decide consequências

Os motores de regras identificam condições ou regras aplicáveis, mas o orquestrador determina a consequência operacional.

Exemplos de consequências citadas:

- sobrescrever um atributo;
- aplicar valor por padrão;
- rejeitar uma operação;
- gerar um controle técnico;
- solicitar formulário;
- solicitar documento;
- decidir se um formulário já atendido precisa ou não ser tratado novamente;
- disparar cálculo;
- chamar seleção de riscos, módulos ou RTE no momento adequado.

---

## 6. Regras, prioridades e “trajes a medida”

## 6.1. Conceito

“Trajes a medida” é a expressão usada para regras específicas criadas para um caso de negócio particular. Elas coexistem com regras gerais de produto.

A reunião associa esses casos a necessidades como:

- abertura de uma nova linha de venda;
- canal comercial específico;
- corretor;
- apólice coletiva;
- grupo;
- contrato;
- produto ou cobertura com exceção comercial.

## 6.2. Hierarquia de prioridades

Foi explicado que a prioridade é determinada por uma hierarquia de escopos. A transcrição não preserva uma lista completa e segura, mas menciona elementos como:

- apólice;
- cliente;
- contrato;
- grupo;
- pessoa;
- canal;
- nível comercial;
- produto;
- datas.

A lógica informada é:

```text
Regra mais específica aplicável
            ↓
Regra específica em escopo menos restrito
            ↓
Regra geral de produto
```

A transcrição menciona valores ou penalizações usados internamente pelo motor para ordenar regras. A explicação foi que valores mais próximos de zero ou uma ordenação negativa poderiam representar maior prioridade, mas o detalhe numérico foi descrito como mecanismo interno do motor, não como regra funcional que usuários devam manipular diretamente.

## 6.3. Comportamento quando uma regra não se aplica

Foi esclarecido que o simples fato de uma regra específica existir não impede a avaliação das regras gerais.

Assim:

- se a regra específica cumpre as condições, ela é aplicada;
- se não cumpre as condições, o motor tenta regras seguintes, potencialmente mais gerais;
- não foi descrito um mecanismo pelo qual a existência de uma regra específica, por si só, bloqueie toda a avaliação posterior.

## 6.4. Vigência e controles para regras específicas

Foi mencionado que regras específicas não deveriam ser colocadas com vigência retroativa indiscriminadamente, pois isso pode impactar o negócio.

Também foi discutida a necessidade de identificar corretamente a entidade à qual uma personalização se aplica, como uma apólice coletiva e seu contrato associado.

## 6.5. Limitação de certificação

A aplicação dessa filosofia em cenários como tarifação multivariável foi considerada coerente com o modelo, mas ainda precisava ser testada e certificada em produto real.

---

## 7. Seleção de riscos

## 7.1. Papel do componente

A seleção de riscos foi apresentada como o componente mais transversal do fluxo. Ela pode ser chamada em múltiplos momentos, pois lida com dados e decisões que surgem em diferentes etapas da emissão.

A reunião associa seleção de riscos a:

- atributos variáveis;
- pré-processamentos;
- validações;
- controles técnicos;
- formulários;
- documentação;
- decisões de aceitação ou rejeição;
- comportamento funcional e não funcional de dados;
- controles no início, durante e no final da operação.

## 7.2. Controles técnicos, prévias e validações

Os participantes associaram os controles técnicos e as regras de atributos ao componente de seleção de riscos.

A estrutura conceitual apresentada foi:

```text
Entrada de dados
   ↓
Pré-processamentos / valores por padrão
   ↓
Validações e controles técnicos
   ↓
Enriquecimento dos dados
   ↓
Possível rejeição ou continuidade
   ↓
Etapas seguintes do fluxo
```

A reunião sugere que a classificação da regra — por exemplo, se é prévia, validação ou controle técnico — depende da configuração feita no componente mencionado na transcrição como ACDC/ACDS. O nome exato não pôde ser confirmado.

## 7.3. Regras sobre atributos

Uma regra pode:

- atribuir ou sobrescrever valor;
- aplicar fórmula;
- definir valor por padrão;
- validar valor;
- rejeitar a operação;
- exigir informação adicional;
- alterar a forma como o campo se comporta no front-end.

## 7.4. Comportamento não funcional de atributos

Foi explicado que há mecanismos para configurar comportamentos não funcionais de atributos. Foram citados três estados principais:

| Comportamento | Significado informado |
|---|---|
| Bloqueado | campo não pode ser alterado |
| Invisível / oculto | campo não aparece para o usuário |
| Obrigatório / requerido | campo precisa ser preenchido |

A reunião também discutiu que esses comportamentos podem ser dinâmicos, condicionados por outros atributos.

Exemplo citado, com formulação aproximada:

- se determinada informação for preenchida, um campo posterior pode se tornar obrigatório;
- em um exemplo relacionado a fumante, certos dados podem precisar ser solicitados conforme a resposta.

## 7.5. Momento de validação visual

Houve dúvida sobre quando o front-end refletiria uma obrigatoriedade dinâmica.

A resposta indica que a validação pode ser disparada em momentos configurados, como ao perder o foco do campo ou ao tentar avançar/aceitar uma etapa. Contudo, foi dito que disparar validação ao sair de cada campo não é recomendado para todos os casos.

A transcrição não confirma que o front-end atual já atualize visualmente todos os indicadores no exato momento em que uma condição muda. O comportamento descrito com maior segurança é a marcação de campos obrigatórios ao tentar prosseguir sem informar o valor necessário.

## 7.6. Relação com dados de produto

A orientação reforçada foi que, para produtos novos, as regras deveriam residir no Ativo Digital, não misturadas com regras antigas de base de dados, sempre que a capacidade já estiver coberta pela nova arquitetura.

---

## 8. Módulos

## 8.1. Finalidade

Os módulos foram apresentados como mecanismos para definir e validar configurações de coberturas. Eles são especialmente relevantes na etapa em que o usuário seleciona planos, modalidades ou ofertas comerciais.

Os módulos podem definir:

- coberturas disponíveis;
- coberturas obrigatórias;
- capitais mínimos;
- capitais máximos;
- capitais por padrão;
- relação entre capitais;
- dependência entre coberturas;
- cobertura aplicável ou não aplicável;
- conjunto de coberturas que deve aparecer no front-end.

## 8.2. Dois modos de uso

Foi descrito que o serviço de módulos pode operar de duas formas:

1. **Retornar módulos possíveis**  
   O sistema recebe características de risco e devolve os módulos ou configurações que podem ser aplicados.

2. **Validar módulo previamente escolhido**  
   O sistema recebe uma configuração ou módulo selecionado e verifica se aquela combinação é válida.

## 8.3. Exemplo de comportamento

Se um produto possui vinte coberturas, mas o módulo aplicável devolve apenas cinco, o front-end deveria apresentar e tratar apenas aquelas cinco coberturas.

## 8.4. Dependências e relações entre coberturas

Foi citado o exemplo de uma cobertura cujo capital deve ser um percentual de outra cobertura, como 100% ou 200%.

Também houve menção a um caso em que, para comparar capitais, poderia ser necessário identificar o primeiro risco anterior que contenha determinado atributo. A transcrição não permite detalhar plenamente a regra, mas evidencia que há mecanismos de comparação entre riscos/coberturas.

## 8.5. Módulos como oferta comercial

A reunião associa módulos a uma espécie de oferta configurada conforme o risco. Em um exemplo de ramo de lar/hogar e outro ramo citado de forma pouco clara, o sistema poderia apresentar uma lista de modalidades, planos ou ofertas disponíveis conforme os dados informados.

Essa lista serviria para o usuário selecionar a configuração desejada.

## 8.6. Relação com seleção de riscos e RTE

A distinção reforçada foi:

| Componente | Foco principal |
|---|---|
| Seleção de riscos | atributos, controles, validações, formulários, documentação e decisões de risco |
| Módulos | coberturas, planos, capitais, obrigatoriedades e relações entre coberturas |
| RTE | cálculo de prêmio, capital, desgloses e tarifação |

---

## 9. RTE e modelo de tarifação

## 9.1. Papel do RTE

O RTE foi apresentado como o componente responsável por cálculos econômicos e tarifários, incluindo:

- prêmios;
- capitais;
- desgloses;
- cálculos por cobertura;
- fórmulas;
- possíveis acumuladores;
- utilização de dados do risco;
- utilização de bases técnicas, especialmente em produtos de poupança/subscrição.

A sigla RTE não foi expandida na transcrição. Portanto, não é possível afirmar seu nome oficial.

## 9.2. Flexibilidade de cálculo

Foi dito que o RTE pode calcular:

- um único risco;
- todos os riscos;
- apenas um risco determinado, citado como risco zero;
- coberturas selecionadas;
- valores conforme fórmulas, taxas, regras ou configuração.

## 9.3. Coberturas de risco versus coberturas de poupança

A reunião diferencia dois modelos:

| Tipo de cobertura | Tratamento descrito |
|---|---|
| Cobertura de risco | segue cálculo tarifário mais convencional, com fórmulas, taxas e configurações do produto |
| Cobertura de poupança/subscrição | possui uma marca adicional e segue um processo específico de subscrição, bases técnicas e histórico |

## 9.4. Tarifação multivariável

A transcrição indica que a tarifação multivariável pode determinar taxas conforme atributos e condições. Foram citados elementos como:

- estrutura geográfica;
- estrutura comercial;
- canais;
- apólice/grupo/contrato;
- apólice específica;
- agente;
- outras condições de risco e produto.

Foi ressaltado que a lógica de prioridade das regras também se aplica a esse tipo de configuração, mas certos cenários ainda precisavam de teste e certificação.

## 9.5. Fórmulas

Foi explicado que a fórmula utilizada por uma cobertura é definida na configuração de produto, idealmente por meio do Taller de Productos.

O fluxo descrito é:

```text
Definição no Taller de Productos
          ↓
Publicação/aceitação da atualização
          ↓
Geração ou atualização das coleções de configuração
          ↓
RTE lê a configuração da cobertura
          ↓
RTE identifica fórmula/configuração aplicável
          ↓
Cálculo de prêmio, capital e desgloses
```

A transcrição menciona fórmulas Java em alguns casos. Isso não significa que toda fórmula seja Java nem que todas as regras sejam programadas.

## 9.6. Mongo como repositório de configuração

Foi mencionado que a configuração utilizada pelo RTE é armazenada em Mongo. A reunião descreve que as coleções contêm dados de configuração por cobertura, modalidade e ramo.

Não foi detalhado:

- o modelo físico completo;
- a topologia do banco;
- mecanismos de replicação;
- segurança;
- versionamento técnico;
- estratégia de backup.

---

## 10. Subscrição e coberturas de poupança

## 10.1. Conceito apresentado

A subscrição foi descrita como relevante para produtos de poupança, nos quais é necessário preservar histórico de operações, bases técnicas, taxas de juros, gastos, aportes extraordinários e outros elementos que influenciam valores futuros.

A transcrição usa “suscripción”, que neste contexto parece se referir ao mecanismo de cálculo e histórico de coberturas de poupança, não apenas à assinatura de um serviço.

## 10.2. Informações históricas

O mecanismo foi descrito como capaz de registrar informações por operação ou por parte da cobertura, permitindo lidar com situações como:

- mudança de base técnica;
- alteração de juros;
- aportes extraordinários;
- renovações;
- resgate parcial;
- resgate total;
- mudanças de condições da apólice;
- evolução de uma cobertura ao longo do tempo.

A ideia é que o valor total possa resultar da soma de parcelas calculadas sob condições distintas em períodos diferentes.

## 10.3. Ordem de cálculo

Para coberturas marcadas como de subscrição, o fluxo apresentado é, em essência:

```text
Identificar cobertura de subscrição
        ↓
Avaliar operação aplicável
        ↓
Determinar dados e parâmetros de entrada
        ↓
Consultar histórico, apólice anterior e base técnica
        ↓
Chamar fórmula correspondente
        ↓
Obter prêmio/capital e demais resultados
        ↓
Registrar ou preparar o resultado de subscrição
        ↓
Continuar cálculos econômicos restantes
```

## 10.4. Operações e “aplanamiento”

Foi discutido que múltiplas regras ou operações podem ser candidatas em determinada alteração. O processo mencionado como “aplanamiento” parece consolidar ou decidir qual operação efetivamente deve prevalecer quando várias condições se cumprem.

A reunião não detalha o algoritmo desse mecanismo, nem as regras completas de precedência.

## 10.5. Diferença em relação a coberturas de risco

Foi esclarecido que coberturas de risco não utilizariam a tabela ou o processo de subscrição da mesma forma. Elas seguiriam o ciclo tarifário normal.

## 10.6. Implementações por país

Foi mencionado que há uma interface comum e implementações específicas por país, com referências a Espanha, coletivo, individual e Brasil.

A leitura mais segura é:

- existe uma abstração ou interface de cálculo;
- cada país pode fornecer implementação de fórmulas ou operações específicas;
- Brasil poderá precisar de uma implementação própria para suas fórmulas.

A transcrição não informa o contrato técnico dessa interface, seus métodos, nem sua nomenclatura exata.

---

## 11. Bases técnicas

## 11.1. Objetivo

As bases técnicas foram apresentadas como configurações utilizadas em cálculos, especialmente para produtos de vida/poupança. Podem conter tabelas de:

- mortalidade;
- gastos;
- juros;
- outros fatores técnicos;
- dimensões de cálculo adicionais.

## 11.2. Configuração flexível

Uma das principais mensagens foi que o novo modelo busca evitar mudanças estruturais de banco ou desenvolvimento para cada nova dimensão ou componente técnico.

Foram citadas possibilidades como:

- tabelas de três dimensões;
- tabelas de quatro dimensões;
- combinação de idade, sexo e outros fatores;
- múltiplas colunas;
- elementos como comutativos ou valores como `lx`/`ledx`, conforme pronunciado na reunião.

A grafia e a terminologia de alguns desses elementos não puderam ser confirmadas pela transcrição.

## 11.3. Seleção de tabela por condição

A reunião descreve que regras ou condições podem decidir qual tabela técnica será usada, por exemplo conforme:

- sexo do segurado;
- condição de fumante;
- data de vigência;
- código de base técnica;
- outras condições configuradas.

## 11.4. Consulta por vigência

Foi dito que, ao receber uma data, o sistema buscaria a versão ativa e aplicável da tabela técnica, desconsiderando versões futuras que ainda não estejam vigentes.

## 11.5. Carga de tabelas

A gestão de tabelas grandes, como tabelas de mortalidade, foi reconhecida como um desafio operacional. Foi mencionado que o Taller de Productos deveria suportar cargas, possivelmente via Excel, manuais ou automáticas.

Não foram informados:

- formato definitivo do arquivo;
- validações de importação;
- governança de aprovação;
- limite de volume;
- mecanismo de rollback.

---

## 12. Modelo operacional de emissão e integração

## 12.1. Estratégia de integração

A estratégia explicitamente mencionada foi:

> modificar o mínimo possível e reutilizar as chamadas já existentes.

A integração parece preservar APIs de emissão atuais, acrescentando uma etapa de decisão e preparação quando o ramo ou produto estiver configurado para passar pelo Ativo Digital.

## 12.2. Fluxo lógico reconstruído

```text
1. Canal ou processo externo monta um “polizón”
2. API de emissão recebe a operação
3. Sistema identifica ramo / produto / tipo de movimento
4. Sistema verifica flag indicando uso do Ativo Digital
5. Dados adicionais são recuperados, quando necessários
6. Entrada é enriquecida para o formato esperado pelo Ativo Digital
7. Ativo Digital executa regras, seleção de riscos, módulos e cálculos
8. Ativo devolve “polizón” enriquecido e validado
9. Camada de integração ajusta resultado ao contrato já existente
10. Processo transacional persiste e continua operações históricas necessárias
```

> **“Polizón”** parece ser o nome informal ou técnico usado para um objeto de apólice no fluxo de integração. A transcrição não permite confirmar sua grafia oficial.

## 12.3. Contexto adicional para suplementos

Em uma emissão nova, a entrada recebida pode ser suficiente.

Em um suplemento, contudo, foi explicado que pode ser necessário recuperar:

- a fotografia vigente da apólice;
- dados anteriores;
- dados modificados;
- documentos;
- formulários;
- cúmulos;
- outras informações exigidas pelo Ativo Digital.

O objetivo é permitir que o Ativo compare a situação anterior e a nova para calcular corretamente a operação.

## 12.4. Resultado do Ativo Digital

O resultado devolvido pelo Ativo pode conter:

- atributos ajustados;
- validações aplicadas;
- controles técnicos;
- capitais;
- prêmios;
- desgloses;
- requisitos de formulários;
- requisitos documentais;
- resultados de módulos;
- decisões de risco.

Esse resultado é então utilizado pelo processo posterior para continuar a emissão no sistema transacional.

## 12.5. Primas manuais

Foi explicado que determinados produtos podem ser tratados no sistema posterior como produtos de “prima manual”, porque o cálculo já foi realizado pelo Ativo Digital.

A reunião fez uma ressalva importante: isso não significa que o usuário esteja necessariamente digitando o prêmio manualmente. O termo parece representar uma forma de integração com o produto/transacional para evitar recálculo por mecanismos antigos.

## 12.6. Batch e cargas massivas

Foi mencionado um componente chamado “TMD” — nome sujeito a incerteza de transcrição — que trataria cargas massivas ou processos massivos e chamaria APIs de emissão, alteração ou renovação.

A arquitetura descrita sugere:

```text
Carga massiva / processo massivo
          ↓
Componente de tratamento e validação
          ↓
APIs de emissão / alteração / renovação
          ↓
Ativo Digital
          ↓
Processos transacionais posteriores
```

---

## 13. Simulação

## 13.1. Conceito

A simulação foi apresentada como uma funcionalidade do Ativo Digital que executa as mesmas regras, avaliações e cálculos de uma operação real, mas sem persistir a alteração no banco de dados.

## 13.2. Casos de uso citados

Foram mencionados cenários como:

- calcular valor de resgate;
- simular mudança de cobertura;
- simular alteração de capital;
- simular suplemento;
- recalcular plano de pagamento;
- entender como ficariam parcelas após mudança em cobertura ou soma segurada;
- comparar alternativas antes de efetivar uma alteração.

## 13.3. Valor de negócio

A simulação reduz a necessidade de efetivar, desfazer e repetir suplementos apenas para descobrir o impacto financeiro de uma alteração.

Em termos analíticos, isso indica uma transição de processos operacionais experimentais — nos quais se poderia criar uma operação apenas para observar seu resultado — para uma capacidade explícita de cálculo sem persistência.

## 13.4. Limitações reconhecidas

Foi mencionado que certos detalhes, como recálculo de recargos ou diferenças específicas de plano de pagamento, ainda precisavam ser estudados ou não estavam totalmente resolvidos.

Portanto, a reunião não permite concluir que todas as modalidades de simulação já estejam plenamente cobertas.

---

## 14. APIs e endpoints

## 14.1. Papel das APIs

A reunião indica que front-ends e processos externos não deveriam chamar diretamente cada microserviço especializado de RTE, módulos ou seleção de riscos.

A entrada tende a ocorrer pelo componente de orquestração do Ativo Digital, referido como ACDS/ACDC na transcrição.

## 14.2. Fluxos por fase

Foi mencionado que existem endpoints para operações específicas, úteis em fluxos que não são uma emissão completa em uma única chamada.

Exemplo conceitual citado:

```text
Front-end passo a passo
   ↓
Consulta de coberturas ou módulos
   ↓
Entrada de atributos
   ↓
Validação
   ↓
Cálculo
   ↓
Continuidade do fluxo
```

## 14.3. Listas de opções baseadas em módulos

Foi descrito um serviço que recebe dados de risco e devolve opções de módulos ou coberturas aplicáveis, permitindo que o front-end apresente listas de planos/ofertas compatíveis.

## 14.4. Segurança

Foi afirmado que a entrada pelo orquestrador garantiria aspectos de segurança. Contudo, a transcrição não detalha:

- autenticação;
- autorização;
- IAM;
- tokens;
- gestão de segredos;
- auditoria técnica;
- criptografia;
- políticas de rede.

---

## 15. Perguntas e respostas relevantes

## 15.1. Como funciona a prioridade entre regras?

### Pergunta

Participantes perguntaram se a lógica seria aplicar primeiro regras gerais ou regras específicas, especialmente em casos de apólice, contrato e canal.

### Resposta

A resposta foi que a lógica vai do específico para o geral. Uma regra específica de contrato ou apólice deve prevalecer sobre uma regra geral de produto quando ambas forem candidatas e a específica cumprir suas condições.

### O que isso esclarece

O modelo não é simplesmente uma coleção de regras independentes. Ele possui mecanismo de prioridade e ordenação por escopo.

---

## 15.2. E se a regra específica não for aplicável?

### Pergunta

Foi questionado se a existência de uma regra específica bloquearia a avaliação de regras gerais.

### Resposta

Não. Se a regra específica não cumprir as condições, o motor segue avaliando as regras seguintes, potencialmente mais gerais.

### O que isso esclarece

A especificidade define precedência entre regras aplicáveis; não cria bloqueio absoluto por mera existência.

---

## 15.3. Onde são configurados controles técnicos, prévias e validações?

### Pergunta

Participantes tiveram dificuldade em localizar, no fluxo, onde cada tipo de regra seria chamado e configurado.

### Resposta

Foi explicado que a configuração indica se uma regra atua como controle técnico, prévia ou validação. A transcrição associa essa definição ao componente ACDC/ACDS e às definições de regras de seleção de riscos.

### O que isso esclarece

O comportamento não é definido apenas pelo código do front-end. Ele depende de uma configuração que orienta o orquestrador sobre qual ação executar em cada fase.

---

## 15.4. Módulos alteram dados de risco?

### Pergunta

Foi questionado se módulos poderiam modificar dados de risco ou se atuariam somente sobre coberturas.

### Resposta

A resposta foi que módulos se concentram em coberturas e atributos associados às coberturas. Atributos gerais de risco são tratados por seleção de riscos.

### O que isso esclarece

Há separação de responsabilidade entre componentes: módulos não substituem o papel da seleção de riscos.

---

## 15.5. Quando ocorre o cálculo tarifário?

### Pergunta

Participantes buscaram confirmar em que ponto do fluxo o RTE seria executado.

### Resposta

A síntese aceita pelo grupo foi que seleção de riscos está disponível ao longo do fluxo, módulos tratam planos/coberturas e o RTE entra para calcular prêmios, capitais e desgloses.

### O que isso esclarece

O RTE não foi apresentado como controlador de todo o fluxo; é um componente especializado em cálculo.

---

## 15.6. O controle multiusuário já funciona?

### Pergunta

Foi perguntado se o mecanismo de “multi-user control”, aparentemente relacionado a múltiplos usuários em uma mesma apólice ou retomada de operação suspensa, estaria funcional no novo modelo.

### Resposta

A resposta foi que não havia confirmação de funcionamento e que o fluxo não havia sido exonerado/testado de forma conclusiva. Foi dito que os pontos de invocação foram registrados, mas isso não garantia a implementação funcional completa.

### O que isso esclarece

Mapear pontos de integração não equivale a certificar todas as funcionalidades históricas.

---

## 15.7. Quem pode retomar operação suspensa?

### Pergunta

Surgiu discussão sobre se uma operação suspensa poderia ser retomada por qualquer usuário autorizado ou apenas pelo usuário que a suspendeu.

### Resposta

Participantes mencionaram comportamentos históricos diferentes. Um deles afirmou que antes qualquer usuário com permissão poderia retomar; outro indicou que, em certo contexto, passou a ser permitido apenas ao usuário que suspendeu.

### O que isso esclarece

Não houve conclusão consolidada sobre o comportamento atual em todos os países/fluxos. Trata-se de um ponto a validar.

---

## 15.8. A fórmula fica no Mongo?

### Pergunta

Foi perguntado se o Mongo conteria diretamente a fórmula.

### Resposta

A resposta foi que o Mongo armazena configurações e referências; a fórmula estaria no Ativo Digital, sendo configurada e associada a partir do Taller de Productos.

### O que isso esclarece

Há separação entre metadados/configuração de cobertura e implementação executável de cálculo.

---

## 15.9. É necessário editar diretamente o Mongo?

### Pergunta

Participantes questionaram se precisariam inserir ou alterar coberturas diretamente no Mongo.

### Resposta

A direção apresentada é que o Taller de Productos faça essa gestão e gere/atualize as coleções. Foi reconhecido que ainda havia detalhes sendo melhorados.

### O que isso esclarece

O Mongo é apresentado como camada de persistência de configuração, não como interface operacional desejada para usuários de produto.

---

## 16. Limitações reconhecidas

| Tema | Limitação ou ressalva |
|---|---|
| Regras multivariáveis | Necessidade de testes e certificação em produto real |
| Multi-user control | Não havia confirmação de funcionamento atual |
| Funcionalidades antigas | Nem todas foram comprovadamente migradas ou cobertas |
| Simulação | Alguns impactos de plano de pagamento e recargos ainda precisavam de estudo |
| Validação visual dinâmica | Não ficou comprovado que todo comportamento visual seja atualizado imediatamente no front-end |
| Taller de Productos | Ainda em evolução; algumas operações podem não estar plenamente disponíveis |
| Fórmulas complexas | Produtos de vida/poupança ainda podem exigir desenvolvimento específico |
| Cláusulas dinâmicas | A funcionalidade está em elaboração e depende de integração com “Alveo” |
| Ambiente de prática | Houve debate sobre usar cópia/produto de exemplo versus produto real de Brasil |
| Regras fora do Ativo | Algumas funcionalidades ainda precisam permanecer em camadas históricas até que haja cobertura no novo modelo |

---

## 17. Riscos e desafios

## 17.1. Riscos explicitamente mencionados

### Incoerência entre regras

Se a mesma regra existir no Ativo Digital e também no transacional, podem ocorrer comportamentos contraditórios.

### Vigência retroativa de regras específicas

Regras específicas com datas retroativas podem impactar operações de negócio já existentes.

### Uso de produtos reais como ambiente de treinamento

Houve preocupação em não alterar indiscriminadamente um produto real e duradouro de Brasil, especialmente se ele serviria como referência operacional.

### Complexidade de produtos de poupança

Foi reforçado que cálculos de vida/poupança são mais complexos que cálculos convencionais de risco ou tarifação multivariável.

### Falta de certificação completa

A reunião reconhece que certos comportamentos ainda precisam ser testados antes de serem considerados garantidos.

## 17.2. Desafios derivados do contexto

> **Análise derivada, não declaração literal dos participantes.**

### Governança de configuração

Quanto mais regras, bases técnicas, fórmulas, módulos e condições forem configuráveis, maior será a necessidade de controles de aprovação, segregação de funções, rastreabilidade e gestão de vigência.

A reunião já aponta nessa direção ao citar dupla validação para mudanças críticas, como taxas e bases técnicas.

### Transição gradual

A arquitetura parece operar em regime híbrido: parte das regras é deslocada para o Ativo Digital, enquanto outras permanecem no transacional. Esse modelo exige disciplina para evitar duplicidade e divergência.

### Formação e modelo mental

O treinamento mostra que a arquitetura é composta por vários serviços especializados. Sem documentação de fluxos, mapas de responsabilidades e exemplos end-to-end, a curva de aprendizagem tende a ser significativa.

### Certificação por produto e país

As implementações parecem variar conforme país, ramo e produto. A validação de uma capacidade em um contexto não garante automaticamente seu comportamento em outro.

---

## 18. Cláusulas e documentação

## 18.1. Cenário citado

Foi mencionada uma necessidade ligada a cláusulas selecionadas conforme condições da apólice e a textos que podem variar conforme dados do contrato.

## 18.2. Primeira fase

A primeira etapa descrita envolve selecionar cláusulas automaticamente e retornar ao menos identificador e descrição, sem necessariamente carregar todo o conteúdo textual dinâmico.

## 18.3. Integração com Alveo

A reunião cita um componente chamado **Alveo** para composição ou transformação documental.

O fluxo descrito sugere:

```text
Dados da apólice
      ↓
Geração/composição de XML documental
      ↓
Envio a Alveo
      ↓
Interpretação de cláusulas e variáveis
      ↓
Retorno de XML atualizado
      ↓
Geração e distribuição de documentos
```

A transcrição não permite confirmar:

- o nome oficial do produto “Alveo”;
- formato completo do XML;
- regras de template;
- modelo de versionamento de cláusulas;
- integração técnica detalhada.

---

## 19. Modelo de produto e governança

## 19.1. Papel do Taller de Productos

O Taller de Productos foi apresentado como futuro ponto principal de configuração de:

- produtos;
- coberturas;
- regras;
- fórmulas;
- módulos;
- bases técnicas;
- tabelas;
- vigências;
- elementos críticos de produto.

A visão é que alterações configuráveis não precisem ser realizadas diretamente por desenvolvimento técnico.

## 19.2. Controles de governança

Foram mencionados mecanismos esperados como:

- acessos;
- validações;
- erros;
- dupla checagem para valores críticos;
- controle de datas;
- controle especial para bases técnicas e taxas.

## 19.3. Papel de negócio

A reunião aponta como objetivo que áreas de negócio possam parametrizar regras de negócio, dentro de uma governança adequada.

Isso não elimina o papel técnico. Fórmulas complexas, especialmente em vida/poupança, continuam dependendo de implementação especializada.

## 19.4. Participação futura de IA

Foi mencionada a intenção de incorporar um “agente” para auxiliar na gestão de regras e controles. A transcrição não detalha escopo, cronograma, tecnologia ou autonomia desse agente.

---

## 20. Roadmap e direcionamentos citados

## 20.1. Curto prazo do treinamento

O plano imediato mencionado foi:

1. concluir visão geral de capacidades;
2. detalhar seleção de riscos;
3. explicar configuração de seleção de riscos;
4. explicar módulos;
5. aprofundar RTE;
6. demonstrar integração por APIs;
7. trabalhar exemplos e regras;
8. permitir prática guiada em ambiente adequado.

## 20.2. Objetivo da semana

Foi declarado que o objetivo até sexta-feira seria:

- percorrer os pontos importantes do Ativo Digital;
- configurar, na maior medida possível, produtos de vida para Brasil;
- utilizar casos de uso reais como referência;
- apoiar participantes na interpretação das regras e capacidades.

## 20.3. Direção para Brasil

A reunião reforça que Brasil deve operar com Ativo Digital e que o produto está planejado como **“100% Ativo Digital”**, segundo a formulação usada.

Ao mesmo tempo, também se reconhece que capacidades ainda ausentes precisarão ser identificadas e evoluídas.

## 20.4. Redução de PL

Foi mencionada a intenção de reduzir o uso de PL, preservando-o apenas onde ainda não houver capacidade equivalente no Ativo Digital.

## 20.5. Transferência para manutenção

Foi discutido que a funcionalidade deve ser entregue como parte do processo de emissão e posteriormente entrar em modelo de manutenção/governança. O termo ou área responsável foi transcrito de forma pouco clara, impossibilitando identificar com segurança o nome da equipe destinatária.

---

## 21. Casos concretos mencionados

## 21.1. Espanha

A Espanha aparece como referência importante para:

- definição de funcionalidades;
- produtos de vida/poupança;
- cálculos de subscrição;
- resgates;
- individual e coletivo;
- cláusulas dinâmicas;
- configuração de produto;
- integração e exemplos online.

Também foi dito que parte da evolução saiu de necessidades espanholas e seria levada a outros países.

## 21.2. Brasil

Brasil é apresentado como prioridade de implementação e treinamento.

Foram citados, entre outros:

- produtos de vida;
- necessidade de configurar e testar capacidades;
- ambiente próprio de Brasil;
- necessidade de manter ou construir produtos adequados à prática;
- preocupação em não usar indiscriminadamente produto real como ambiente de experimento;
- intenção de reutilizar o que for construído.

## 21.3. América Central

A reunião menciona América Central como local onde se observaram “trajes a medida” ou regras específicas de negócio.

Também surgem referências a Honduras e Costa Rica em exemplos operacionais, especialmente ligados a emissão, suplementos, retenção e simulação.

## 21.4. Panamá

Panamá foi citado em exemplos de bases técnicas e também em um caso de cálculo envolvendo percentuais entre capitais/coberturas. A transcrição não permite reconstruir a regra completa com segurança.

## 21.5. Uruguai

Uruguai foi mencionado junto de um caso de valores mínimos e percentuais de cobertura, mas o contexto exato está degradado pela transcrição.

---

## 22. Números e indicadores citados

Os valores abaixo foram mencionados durante a conversa. Não representam dados auditados externamente.

| Indicador ou referência | Valor mencionado | Contexto |
|---|---:|---|
| Soma segurada em exemplo geral | 10.000 | exemplo de regra geral |
| Soma segurada em contrato específico | 5.000 | exemplo de regra específica |
| Produto com atributos variáveis | 300 dados | exemplo de produto complexo |
| Produto com coberturas | 20 coberturas | exemplo de configuração por módulo |
| Módulo retornando subconjunto | 5 coberturas | exemplo de visibilidade no front-end |
| Relação entre coberturas | 100% ou 200% | exemplo de dependência de capitais |
| Exemplo de valores mínimos | 200.000, 250.000 e 50% | caso citado de forma incompleta |
| Histórico de funcionamento | 15 ou 20 anos | referência a história de produtos/subscrição |
| Tabelas de mortalidade | aproximadamente 120 registros | exemplo de carga de tabelas |
| Tempo de trabalho na iniciativa | cerca de um ano e alguns meses | referência à evolução do Ativo Digital |
| Meta de treinamento | até sexta-feira | objetivo da semana, sem data absoluta |

---

## 23. O que a reunião não permite concluir

A transcrição não fornece detalhe suficiente para confirmar:

- tecnologia de cloud utilizada;
- infraestrutura de execução;
- uso ou não de Kubernetes;
- modelo de autenticação e autorização;
- modelo de IAM;
- estratégia de observabilidade;
- logs, métricas e tracing;
- política de auditoria;
- desenho de alta disponibilidade;
- disaster recovery;
- SLA ou SLO;
- estratégia de CI/CD;
- versionamento técnico de regras e configurações;
- processo de rollback de publicação;
- estrutura física de Mongo;
- modelo de dados completo das coleções;
- contrato formal das APIs;
- formato formal do objeto “polizón”;
- nomenclatura correta de todos os componentes citados;
- escopo definitivo do Taller de Productos;
- critérios de aprovação de regras;
- modelo de segregação de funções;
- custo operacional da plataforma;
- cronograma completo por país;
- status definitivo de funcionalidades como multiusuário;
- cobertura integral de todas as regras legadas;
- estratégia definitiva para cláusulas dinâmicas.

---

## 24. Leitura analítica das transformações em curso

> **Esta seção contém interpretação fundamentada no conjunto da conversa. Não representa afirmações literais de um único participante.**

## 24.1. Transformação arquitetural: de lógica distribuída para orquestração centralizada

A arquitetura apresentada indica uma migração de regras distribuídas em produto, base, programas e processos batch para uma estrutura orquestrada por capacidades especializadas.

```text
Antes, conforme o contexto apresentado:
Regras e cálculos espalhados
        ↓
Dependência de base e transacional
        ↓
Maior risco de duplicidade e menor flexibilidade

Direção proposta:
Ativo Digital orquestra capacidades
        ↓
Regras configuradas e reutilizáveis
        ↓
Integração com transacional para persistência e continuidade
```

## 24.2. Transformação de projeto para plataforma de capacidades

O Ativo Digital não foi apresentado como uma customização isolada para um único produto. Ele concentra capacidades reutilizáveis:

- regras;
- atributos;
- controles;
- módulos;
- cálculo;
- bases técnicas;
- simulação;
- APIs;
- integração documental.

Isso caracteriza, por interpretação, uma direção de plataforma de capacidades compartilhadas.

## 24.3. Transformação de desenvolvimento para configuração governada

A reunião descreve uma mudança de paradigma:

```text
Mudança técnica / nova necessidade
        ↓
Antes: alteração de programa, tabela ou estrutura
        ↓
Depois: configuração de produto, regra, condição ou base técnica
```

A mudança não é total, pois fórmulas complexas permanecem no domínio técnico. Ainda assim, a fronteira entre configuração de negócio e desenvolvimento tende a ser deslocada.

## 24.4. Transformação operacional: de emissão definitiva para simulação

A capacidade de simular operações sem gravar no transacional representa uma mudança operacional importante. Ela habilita:

- comparação de cenários;
- atendimento comercial mais ágil;
- análise de impacto antes de efetivar alterações;
- menor dependência de operações temporárias ou reversões.

## 24.5. Transformação organizacional: negócio com maior autonomia

O objetivo de permitir que negócio parametrizasse regras sugere maior autonomia funcional. No entanto, a reunião reconhece que essa autonomia deve ser acompanhada por controles de acesso, dupla validação e gestão de itens críticos.

---

## 25. Relações de causa e efeito reconstruídas

### 25.1. Regras duplicadas

```text
Regras em múltiplas camadas
        ↓
Possibilidade de resultados contraditórios
        ↓
Risco de rejeição posterior a uma validação já aceita
        ↓
Necessidade de centralização e definição de ownership
        ↓
Ativo Digital como fonte principal de regras migradas
```

### 25.2. Dependência do transacional

```text
Cálculo e regras dependentes de Oracle/transacional
        ↓
Menor autonomia e dificuldade de simular
        ↓
Dependência do fluxo de persistência para obter resultados
        ↓
Necessidade de desacoplar regras e cálculo
        ↓
Ativo Digital executa operações sem gravar quando necessário
```

### 25.3. Customizações de negócio

```text
Regra geral de produto
        ↓
Necessidades específicas por contrato/canal/apólice
        ↓
Risco de exceções manuais e regras conflitantes
        ↓
Necessidade de hierarquia de prioridade
        ↓
“Trajes a medida” com escopo e vigência controlados
```

### 25.4. Evolução de produto

```text
Novas taxas, tabelas ou dimensões técnicas
        ↓
Antes: necessidade de desenvolvimento estrutural
        ↓
Tempo e custo de mudança
        ↓
Necessidade de configurabilidade
        ↓
Bases técnicas, tabelas e condições parametrizáveis
```

---

## 26. Principais conclusões

1. O Ativo Digital é apresentado como a futura camada central para regras de negócio, seleção de riscos, módulos e cálculo tarifário no processo de emissão.

2. A arquitetura pretende reduzir a dependência do sistema transacional e da base Oracle para decisões, cálculos e simulações, embora a persistência e certas funcionalidades históricas continuem no fluxo legado.

3. Seleção de riscos, módulos e RTE possuem responsabilidades distintas e complementares:
   - seleção de riscos trata atributos, controles, validações, formulários e documentos;
   - módulos tratam coberturas, planos, capitais e dependências;
   - RTE trata prêmios, capitais, fórmulas e desgloses.

4. O orquestrador é a peça que coordena os componentes e determina o efeito operacional das regras disparadas.

5. Regras específicas devem prevalecer sobre regras gerais quando aplicáveis, mas regras gerais continuam sendo avaliadas quando as específicas não se aplicam.

6. A migração exige disciplina para evitar duplicidade de regras entre Ativo Digital e sistema transacional.

7. Produtos de vida e poupança introduzem complexidade adicional por exigirem subscrição, histórico, bases técnicas e fórmulas específicas.

8. O Taller de Productos é concebido como instrumento de configuração e governança, reduzindo a necessidade de desenvolvimento para alterações de produto que possam ser parametrizadas.

9. A funcionalidade de simulação é estratégica porque permite executar regras e cálculos sem persistir a operação.

10. Brasil é tratado como prioridade de adoção e treinamento, com expectativa de operar produtos no modelo de Ativo Digital.

11. Há capacidades ainda não certificadas ou não completamente migradas. A reunião não apresenta o Ativo Digital como solução pronta para todos os casos sem necessidade de evolução.

12. O treinamento teve como resultado explícito uma melhora na compreensão dos participantes sobre a arquitetura, o fluxo de emissão e o local onde cada tipo de regra deve ser configurado.
