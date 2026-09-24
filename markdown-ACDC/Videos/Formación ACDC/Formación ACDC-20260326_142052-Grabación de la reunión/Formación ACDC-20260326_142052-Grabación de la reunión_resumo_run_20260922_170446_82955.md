# Relatório de Análise Avançada de Transcrição

**Arquivo de origem:** `Formación ACDC-20260326_142052-Grabación de la reunión.mp4`
**Data de processamento:** 22/09/2026 17:45:39
**Modelo de transcrição:** whisper.cpp Metal (small) — idioma: es
**Modelo de interpretação IA:** axet-code (gpt-5.6-terra)
**Prompt utilizado:** análise sênior avançada (documentação funcional, arquitetura, negócio, riscos, Q&A, anti-alucinação)

---

# Análise estruturada — Motor de Rating, fórmulas atuariais e cálculo por subscrição

> **Nota de qualidade da fonte:** a transcrição contém ruído severo de reconhecimento de voz, trechos repetidos e segmentos sem significado confiável. Este documento considera apenas os trechos com contexto técnico suficientemente inteligível. Termos como **“RTE”**, **“T&N”**, **“polizón/polisón”**, nomes de tabelas e alguns identificadores foram preservados conforme registrados quando não havia evidência suficiente para corrigi-los.

## 1. Síntese executiva

A reunião tratou da implementação e da futura governança de fórmulas atuariais em um motor de cálculo identificado na transcrição como **RTE** ou **Rating**. O foco imediato foi entender como uma fórmula de subscrição é selecionada, executada e integrada à estrutura de uma apólice, especialmente para o contexto de produtos individuais no Brasil.

A discussão mostrou dois objetivos simultâneos:

1. **Viabilizar a implementação local das fórmulas de Brasil**, incluindo a configuração necessária para o motor de cálculo.
2. **Definir uma organização reutilizável e governada para fórmulas e funções menores**, distinguindo o que é específico por país ou produto do que pode ser compartilhado entre países.

O fluxo explicado parte da identificação de uma cobertura e de suas condições. Quando a cobertura possui subscrição, o mecanismo de subscrição seleciona uma fórmula aplicável para calcular a **prima pura**, registrada no **conceito de desglose 1**. Em seguida, o motor continua o cálculo dos demais conceitos — por exemplo, sobrecargas e impostos — sem recalcular o conceito já tratado pela subscrição.

A fórmula não retorna somente um valor numérico. Ela constrói objetos que representam a subscrição, os desgloses/conceitos calculados, a cobertura e informações de base técnica. Esses dados são usados para persistência, consulta, exibição e, em certos casos, impressão na apólice.

A reunião também evidenciou uma diferença relevante entre os países: para Espanha, há fórmulas e fluxos previamente existentes em COBOL, aparentemente já testados e passíveis de reprodução; para Brasil, os participantes afirmam que será necessário construir as fórmulas, pois não há uma base equivalente pronta para reaproveitamento.

---

## 2. Contexto e antecedentes

O contexto é de evolução de um motor de cálculo de seguros, com interesse específico em cálculos de vida, subscrição, cobertura, prêmio e capital. A equipe discutiu como acomodar fórmulas já existentes, novas fórmulas e funções de apoio em uma estrutura de código e configuração que possa atender mais de um país.

Há menções recorrentes a:

- **Espanha**;
- **Brasil**;
- **Uruguai**;
- possivelmente outros países, citados de forma pouco clara;
- produtos individuais e coletivos;
- coberturas de vida e cenários de não vida;
- fórmulas derivadas de lógica legada em COBOL;
- classes Java;
- banco de dados;
- Mongo/MongoDB;
- Jenkins e pipeline de integração/entrega;
- estruturas de produto, cobertura, conceitos econômicos e desgloses.

A apresentação parece ter ocorrido com compartilhamento de tela e navegação por código, estruturas de dados, configurações, telas e possivelmente coleções em banco de dados. Parte da reunião teve caráter formativo: a pessoa que conduzia a explicação buscava esclarecer o objetivo de cada objeto construído e o papel da fórmula no processo de cálculo.

---

## 3. Problemas identificados

### 3.1 Falta de uma taxonomia comum para fórmulas e funções

Os participantes discutiram onde fórmulas e funções menores deveriam ficar na estrutura. A preocupação central era evitar que cada país ou produto criasse implementações isoladas, sem uma convenção comum de nome, localização, responsabilidade e reutilização.

Foi sugerida uma organização por áreas como:

- `Rating`;
- país;
- produto;
- uma camada ou pacote denominado na transcrição como **T&N**.

A interpretação mais segura é que a estrutura pretendida deve separar:

- fórmulas específicas de um país;
- fórmulas específicas de produto;
- pequenas funções ou lógicas compartilháveis;
- elementos transversais potencialmente reutilizáveis por outros países.

A sigla **T&N** não foi definida de forma confiável na transcrição. Ela parece ser tratada como um espaço para lógica comum ou reutilizável, mas essa leitura não deve ser entendida como definição oficial.

### 3.2 Crescimento descontrolado do catálogo de “mini-funções”

A equipe reconheceu que o catálogo de funções auxiliares pode crescer muito. A preocupação foi explicitada como a necessidade de manter um catálogo “acotado” — isto é, controlado ou limitado.

O problema não é a reutilização em si, mas a ausência de critérios para decidir:

- quando uma lógica é realmente comum;
- quando deve permanecer local ao país;
- quem pode alterar uma função compartilhada;
- como assegurar compatibilidade;
- como validar impactos em todos os consumidores.

### 3.3 Risco de alteração global em lógica compartilhada

Uma função ou fórmula usada por vários países pode gerar efeitos sistêmicos quando alterada. A reunião apontou que, se uma fórmula for padrão e compartilhada, ela deve passar por:

- “triple chequeo” — expressão usada para indicar validação reforçada;
- testes de regressão;
- verificação de compatibilidade com todos os países consumidores.

Esse ponto é particularmente relevante para fórmulas como a de capital, descrita como candidata a ser padrão por servir a múltiplos contextos.

### 3.4 Brasil não dispõe da mesma base legada de Espanha

Foi dito de forma clara que, para Espanha, há lógica existente em COBOL que pode ser consultada e reproduzida. Essa lógica já teria sido testada extensivamente.

Para Brasil, a situação apresentada é diferente: “eles têm que construir as fórmulas”. Embora haja menção a possíveis fórmulas antigas em banco de dados, os participantes reforçaram que não deveriam desenvolver com base em algo não formalmente fornecido ou definido.

A consequência é que o Brasil depende de definição funcional e atuarial explícita antes de implementar suas fórmulas.

### 3.5 Incerteza sobre a modelagem de atributos exibidos em tela

Foi discutido que certos dados de subscrição parecem estar sendo transferidos como texto ou em um campo de estrutura pouco normalizada, e depois separados na interface.

A proposta discutida foi avaliar alternativas como:

- objeto estruturado;
- mapa chave-valor;
- lista de atributos.

Contudo, foi reconhecido que uma mudança desse tipo pode impactar a tela, os literais e a lógica de apresentação. Portanto, não houve uma decisão final registrada.

### 3.6 Configuração e conectividade no ambiente brasileiro

Durante a parte prática, houve dificuldades relacionadas a:

- conexão com a base de dados de Brasil;
- timeout;
- necessidade de criar ou duplicar uma configuração;
- alteração de regra/configuração associada a suplemento;
- definição de companhia;
- atualização posterior no Mongo.

Esses problemas impediram ou atrasaram a validação integral do fluxo naquele momento.

---

## 4. Solução apresentada

A solução explicada é baseada em um motor de cálculo capaz de executar fórmulas associadas a uma cobertura e a um contexto de subscrição. A fórmula deve construir os dados necessários para que o restante do fluxo possa consolidar o resultado da apólice.

A missão da fórmula foi descrita como produzir, conforme o cenário:

- dados de **subscrição**;
- conceitos de **desglose**;
- valores de **capital**;
- dados de **base técnica**;
- dados adicionais necessários para rastreabilidade, consulta ou impressão.

Em vez de a fórmula apenas devolver um único prêmio, ela monta uma estrutura de resultado que será incorporada ao objeto de apólice — referido na transcrição como “polizón” ou “polisón”, possivelmente uma deformação do nome técnico do objeto de apólice.

### Cadeia causal reconstruída

```text
Necessidade de calcular prêmios e capitais por cobertura
↓
Coberturas podem possuir subscrição e diferentes conceitos de desglose
↓
É necessário selecionar a fórmula adequada conforme condições/configuração
↓
A fórmula calcula e constrói objetos estruturados de saída
↓
O motor persiste/consolida os resultados na apólice
↓
Os dados tornam-se disponíveis para cálculo posterior, consulta e impressão
```

---

## 5. Arquitetura e funcionamento lógico

A transcrição permite reconstruir o seguinte fluxo lógico. Trata-se de uma **consolidação analítica**, não de um diagrama literal exibido na reunião.

```text
Dados da apólice / cobertura / operação
        ↓
Motor de Rating ou RTE
        ↓
Identificação de cobertura com subscrição
        ↓
Motor de subscrições
        ↓
Tabela/configuração de seleção de fórmula
        ↓
Fórmula selecionada
        ↓
Leitura de base técnica e parâmetros
        ↓
Construção de objetos de saída
  ├─ Subscrição
  ├─ Conceito de desglose 1 / prima pura
  ├─ Capital, quando aplicável
  ├─ Base técnica
  └─ Dados adicionais
        ↓
Atualização da estrutura da apólice
        ↓
Cálculo dos demais conceitos de desglose
  ├─ conceito 2, quando aplicável
  └─ conceito 3, quando aplicável
        ↓
Consulta, tela e potencial impressão em apólice
```

### 5.1 Ordem de execução explicada

O entendimento consolidado pela discussão foi:

1. O motor identifica que determinada cobertura possui subscrição.
2. O fluxo entra no motor de subscrição.
3. O motor consulta uma tabela ou regra para decidir qual fórmula deve calcular a **prima pura**, associada ao **conceito de desglose 1**.
4. A fórmula executada calcula o resultado e devolve os valores necessários.
5. O resultado é depositado no objeto de subscrição e no conceito de desglose correspondente.
6. O processo de cálculo continua para os demais conceitos da cobertura, como conceitos 2 e 3.
7. O conceito 1 não deve ser recalculado pelo fluxo posterior, pois já foi produzido no passo de subscrição.

Essa separação foi esclarecida durante perguntas feitas por participantes que inicialmente entendiam que o fluxo escolheria uma fórmula genérica para a cobertura inteira antes de tratar os conceitos. A resposta indicou que a seleção de fórmula ocorre especificamente para calcular o conceito de prima pura da subscrição.

### 5.2 Papel da fórmula

A fórmula é responsável por executar a lógica atuarial e construir a saída esperada pelo motor. No exemplo demonstrado, havia valores “queimados” ou fixos para ilustrar o fluxo; esses valores não representam a fórmula final.

A estrutura demonstrada seria, segundo os participantes, provisória ou pedagógica. O código definitivo deve conter a lógica efetiva de cálculo, derivada de definições atuariais e, quando existente, de fluxos já validados no legado.

---

## 6. Componentes mencionados

## 6.1 Motor de Rating / RTE

O componente denominado **Rating** ou **RTE** é apresentado como o núcleo do fluxo de cálculo. Ele coordena o processamento de coberturas, subscrições, capitais e prêmios.

Responsabilidades identificadas:

- receber ou processar informações de cobertura;
- identificar cobertura com subscrição;
- acionar o mecanismo de subscrição;
- consolidar prêmios e capitais;
- calcular ou encaminhar o cálculo dos demais conceitos;
- registrar resultados na estrutura da apólice.

A expansão exata da sigla RTE não foi informada na transcrição.

## 6.2 Motor de subscrições

O motor de subscrições é chamado quando uma cobertura exige subscrição. Ele não parece calcular diretamente toda a lógica atuarial; sua responsabilidade é identificar o caminho ou fórmula a ser utilizada para calcular a prima pura ligada à subscrição.

Segundo a explicação, o motor pode escolher entre fórmulas diferentes com base nos dados de entrada e na configuração aplicável:

```text
Condições e contexto da operação
↓
Consulta de regra/tabela de fórmulas
↓
Escolha da fórmula 1, 2, 3 ou 4
↓
Execução da fórmula selecionada
↓
Retorno do conceito 1 de prima pura
```

## 6.3 Fórmulas de cálculo

As fórmulas implementam a lógica atuarial. Podem calcular:

- prêmio;
- capital;
- informações da subscrição;
- dados de base técnica;
- valores necessários para os conceitos de desglose;
- informações adicionais para rastreio, consulta ou impressão.

A discussão deixa claro que a fórmula final não deve se limitar a valores estáticos. O código com valores fixos foi apresentado como exemplo ou teste temporário.

## 6.4 Catálogo de fórmulas

Foi mencionado um catálogo de fórmulas, com uma distinção entre fórmulas que existem como implementação/código e outras operações simples que estariam na base de dados.

A leitura possível é que:

- operações simples, como multiplicar e somar valores, podem ser configuradas ou armazenadas em banco;
- certas fórmulas mais complexas fazem parte de uma implementação de software e não apenas de dados parametrizáveis.

A transcrição não fornece o modelo de dados, o mecanismo de execução nem os critérios formais dessa divisão.

## 6.5 Base técnica

A base técnica é apresentada como uma estrutura central para registrar os elementos utilizados no cálculo. Entre os exemplos citados:

- tabela de mortalidade;
- gastos;
- interesse técnico;
- parâmetros e fatores técnicos;
- dados identificados como ITC, IT1, IT2 e DT, sem definição detalhada.

A fórmula deve consultar ou montar a base técnica e devolver a informação relevante para que possa ser visualizada, consultada e, em alguns casos, impressa em documentos da apólice.

## 6.6 Objeto de subscrição

O objeto de subscrição armazena os resultados associados à subscrição. A transcrição indica que ele pode conter:

- valores calculados;
- resultados anuais;
- informações técnicas;
- histórico de movimentos;
- atributos a serem exibidos em tela;
- referências a conceitos de desglose.

A estrutura exata do objeto não foi detalhada.

## 6.7 Conceitos de desglose

Os conceitos de desglose representam parcelas ou componentes do cálculo da cobertura.

O exemplo discutido contempla:

| Conceito | Papel relatado |
|---|---|
| Desglose 1 | Prima pura calculada pela subscrição |
| Desglose 2 | Pode representar sobrecarga ou componente posterior; o detalhe não foi completamente formalizado |
| Desglose 3 | Pode representar impostos ou outro componente adicional; citado como exemplo |

A reunião reforçou que a subscrição calcula o primeiro conceito, enquanto o motor segue depois para os demais conceitos aplicáveis.

## 6.8 Cobertura

A cobertura é o elemento sobre o qual incidem cálculos de capital, prêmio e conceitos econômicos. Algumas coberturas possuem subscrição; outras não.

Foi mencionado que uma cobertura de poupança pode ter:

- conceito 1 calculado por subscrição;
- conceitos 2 e 3 associados a sobrecargas ou impostos.

A transcrição não permite afirmar que essa estrutura seja universal para todas as coberturas.

## 6.9 Banco de dados e Mongo

Há referências a uma base de dados de Brasil e a Mongo/MongoDB. Foram mencionados:

- timeout de conexão;
- necessidade de aguardar atualização;
- configurações relacionadas a regras;
- coleção de dados que consolidaria informações provenientes de diversas tabelas;
- necessidade de criar ou duplicar documentos/configurações.

Não há detalhes suficientes para identificar a arquitetura de banco, estratégia de persistência, esquema das coleções ou topologia do ambiente.

## 6.10 Jenkins e pipeline

Durante uma demonstração prática, foi citado Jenkins e o início de uma pipeline. A equipe observava uma execução em andamento, associada a mudanças realizadas em uma branch.

A transcrição indica que:

- uma pipeline foi acionada ou começou a ser processada;
- houve preocupação em verificar alterações após merge de `develop` para uma branch;
- havia expectativa de que apenas um arquivo novo estivesse envolvido em parte do merge.

Não é possível determinar a política de CI/CD, os estágios executados ou o resultado final da pipeline.

---

## 7. Modelo de integração e configuração

A reunião não descreve APIs, eventos ou mensageria. Portanto, não é possível afirmar que o motor opere por microsserviços, chamadas síncronas, eventos ou filas.

O modelo de integração explicitamente observável é interno ao domínio de cálculo:

```text
Configuração de produto/cobertura
↓
Seleção de fórmula
↓
Implementação de cálculo
↓
Objeto de subscrição e conceitos de desglose
↓
Estrutura da apólice
↓
Tela e impressão
```

Também há dependência de configuração em banco de dados para:

- cobertura;
- marca de ajuste de subscrição;
- companhia;
- ramo;
- regra ou operação de suplemento;
- fórmulas/configurações associadas.

A reunião reforça que certas configurações precisam existir para o fluxo funcionar. Por exemplo, a marca de ajuste de subscrição aparentemente não é inferida automaticamente quando ausente; ela precisa ser cadastrada/configurada.

---

## 8. Modelo operacional e de desenvolvimento

## 8.1 Reutilização de fórmulas

A proposta debatida foi criar uma estrutura que permita reutilização controlada de funções pequenas e fórmulas comuns entre países.

O benefício esperado é que, ao iniciar a implementação em outro país ou produto, a equipe possa consultar um “dicionário” de funções existentes e reutilizar o que já estiver validado, em vez de recriar lógica.

## 8.2 Validação reforçada para componentes compartilhados

Quando uma fórmula ou função for comum a diversos países, foi sugerido que qualquer alteração passe por controles mais rigorosos, incluindo:

- múltiplas revisões;
- testes de regressão;
- avaliação de compatibilidade global.

A reunião não definiu processo, responsáveis, ferramentas ou critérios de aprovação formais.

## 8.3 Uso do legado como fonte de referência

Para Espanha, a orientação foi aproveitar fluxos de COBOL existentes e já testados. O objetivo não seria copiar código literalmente, mas reproduzir as lógicas e os resultados no novo modelo de implementação.

A transcrição sugere que a validação histórica das fórmulas em COBOL é vista como vantagem para reduzir risco de cálculo incorreto.

## 8.4 Brasil como implementação de fórmula nova

Para Brasil, o entendimento apresentado é que as fórmulas devem ser construídas a partir das definições corretas fornecidas pelos responsáveis de negócio/atuária.

Foi enfatizado que não se deve assumir que fórmulas de Uruguai, Espanha ou registros antigos de banco sejam automaticamente aplicáveis ao Brasil.

---

## 9. Governança proposta

A governança ainda estava em discussão. Foi dito que seria necessário alinhar o modelo com pessoas citadas como Albert/Alberto e outros envolvidos.

Os elementos de governança identificados foram:

- separar itens específicos de cada país;
- identificar fórmulas específicas de produto;
- manter um catálogo controlado de funções compartilhadas;
- garantir compatibilidade quando houver alterações em componentes comuns;
- reunir os países envolvidos para unificar critérios;
- evitar crescimento desorganizado de estruturas e fórmulas;
- definir nomenclatura e localização dos componentes.

Foi proposta uma sessão de trabalho envolvendo equipes de Espanha, Brasil e outros países que estejam trabalhando no tema. A intenção seria decidir:

- quais funções entram em catálogo compartilhado;
- quais permanecem por país;
- como nomear os itens;
- como organizar a estrutura;
- como governar mudanças e compatibilidade.

Nenhuma decisão definitiva de estrutura, processo de aprovação ou responsável formal foi confirmada na reunião.

---

## 10. Organização das equipes e papéis percebidos

A transcrição menciona nomes pessoais, entre eles Alberto, David, Freddy, Sonia, Manuel, Juan, Vinicius, Jordani, Jason e Jesús. Porém, não apresenta uma matriz formal de papéis ou responsabilidades.

É possível identificar papéis funcionais, sem associá-los definitivamente a pessoas específicas:

| Papel percebido | Atuação observada |
|---|---|
| Especialistas em cálculo/atuária | Definição de fórmulas, parâmetros, base técnica e necessidades de impressão |
| Desenvolvedores | Implementação de fórmulas, objetos, classes Java, configuração e integração |
| Pessoas de arquitetura/coordenação | Discussão sobre estrutura, nomenclatura, reutilização e governança |
| Equipes de país | Fornecimento de particularidades locais e construção de fórmulas específicas |
| Equipe de configuração/dados | Ajustes em coleções, regras, companhia, cobertura e configurações de banco |

Não foram citados Product Owners, Scrum Masters, Product Managers ou uma estrutura ágil formal.

---

## 11. Modelo de produto e transformação observada

A reunião aponta para uma transformação de um cálculo baseado em lógica legada e possivelmente mais local para uma abordagem de plataforma com componentes reutilizáveis.

### Evidências observadas

- intenção de criar catálogo/dicionário de funções;
- preocupação com compatibilidade entre países;
- separação entre lógica local e lógica comum;
- uso de objetos padronizados para subscrição e base técnica;
- necessidade de testes de regressão ao alterar componentes comuns;
- integração de cálculo, configuração, tela e impressão.

### Leitura analítica

Uma leitura possível é que o grupo está migrando de uma lógica centrada em implementações específicas — potencialmente por país e baseada em COBOL — para um ecossistema de cálculo com maior padronização, rastreabilidade e reutilização.

Essa leitura não significa que a padronização já esteja concluída. Pelo contrário: a reunião demonstra que a governança, a nomenclatura, o catálogo de funções e a fronteira entre compartilhado e específico ainda precisam ser definidos.

---

## 12. Casos concretos apresentados

## 12.1 Espanha

### Contexto

Espanha foi apresentada como referência por possuir fórmulas e fluxos já existentes em COBOL.

### Diferencial

As fórmulas históricas aparentemente já passaram por testes e produzem resultados confiáveis. A equipe afirmou que a estratégia é seguir os fluxos que já existiam no legado para preservar o comportamento de cálculo.

### Uso na nova implementação

A lógica do COBOL serviria como base para implementar as fórmulas no novo motor. Há menção a uma fórmula de produto individual de Espanha e a etapas de pré-cálculo.

### Limitações

A transcrição não esclarece:

- quais produtos de Espanha já estão migrados;
- quais fórmulas específicas existem;
- se há paridade integral entre COBOL e a nova implementação;
- quais testes de comparação foram executados;
- como a base técnica é recuperada no legado e na nova solução.

## 12.2 Brasil

### Contexto

Brasil é o foco de uma implementação de fórmulas individuais. Foi demonstrada uma estrutura de teste associada à implementação brasileira.

### Situação apresentada

A equipe afirmou que Brasil precisa construir suas próprias fórmulas. Embora possam existir elementos históricos ou dados antigos, não se deve usar como base algo que não tenha sido formalmente definido e disponibilizado.

### Necessidades identificadas

- estrutura ou pacote específico de Brasil;
- definição atuarial das fórmulas;
- configuração de cobertura e subscrição;
- acesso ao banco de Brasil;
- configuração de regra/operação de suplemento;
- ajustes de companhia;
- validação dos conceitos econômicos e de desglose.

### Limitações

A validação enfrentou dificuldades de conexão e timeout no banco de dados. Também havia dúvidas sobre configurações ausentes e sobre o comportamento do fluxo em produtos que não são de vida.

## 12.3 Uruguai

Uruguai foi citado como referência de experiência anterior. A ideia debatida foi que fórmulas pequenas ou funções auxiliares usadas em Uruguai poderiam ser reaproveitadas em outros países, desde que a compatibilidade fosse confirmada.

Não foi dito que a fórmula completa de Uruguai poderia ser copiada para Brasil. Pelo contrário, houve ressalva de que as fórmulas precisam ser definidas especificamente antes da implementação.

---

## 13. Caso de negócio: subscrições, aportes e resgates parciais

Um dos trechos mais ricos da reunião descreve como a subscrição precisa preservar histórico de valores e taxas técnicas ao longo do tempo.

### Cenário explicado

Foi citado um produto ou comportamento semelhante a uma conta/poupança, com aportes realizados em momentos diferentes e sob taxas de interesse técnico distintas.

Exemplo conceitual apresentado:

1. É realizado um aporte inicial.
2. Esse aporte passa a acumular com determinado interesse técnico.
3. Em ano posterior, ocorre outro aporte, possivelmente sob outro interesse técnico.
4. O cliente realiza um resgate parcial.
5. O sistema precisa identificar de quais aportes históricos o resgate é composto.
6. Cada parcela deve ser calculada com a taxa técnica correspondente ao período ou aporte original.
7. O resultado pode gerar mais de um registro de subscrição.

### Exemplo numérico mencionado

Foi citado, como exemplo:

- primeiro depósito: `5.000`;
- segundo depósito: mais `5.000`;
- resgate: `2.000`;
- saldo remanescente da primeira subscrição: `3.000`.

O objetivo do exemplo é mostrar que, após um resgate parcial, não basta manter apenas um total agregado. É preciso preservar o saldo e a origem histórica de cada participação/subscrição, pois taxas e condições podem ser diferentes.

### Implicação técnica

Um suplemento ou movimento pode gerar múltiplos registros de subscrição, e não apenas um. Isso ocorre porque o sistema precisa registrar a parcela afetada e manter rastreabilidade do saldo restante em cada componente histórico.

### Implicação de negócio

Esse comportamento é importante para que o cálculo respeite a taxa técnica associada a cada aporte e represente corretamente o valor remanescente depois de resgates ou alterações.

---

## 14. Perguntas e respostas relevantes

## 14.1 Por que somente o conceito de desglose 1 é calculado na subscrição?

### Pergunta

Uma participante questionou por que o fluxo estava calculando apenas um conceito de desglose, em vez de processar todos os conceitos associados à cobertura.

### Resposta

Foi explicado que a subscrição trabalha especificamente com o conceito de desglose 1, associado à prima pura. Os demais conceitos — exemplificados como 2 e 3 — são tratados depois pelo motor de cálculo.

### O que isso esclarece

A subscrição não substitui todo o processo de cálculo da cobertura. Ela executa um estágio específico, essencial para produzir a prima pura que serve de base ao restante dos cálculos.

---

## 14.2 Quando a fórmula é escolhida em função das condições da operação?

### Pergunta

Houve dúvida sobre o momento em que a tabela de fórmulas é consultada: se antes do cálculo por desglose ou durante o cálculo da subscrição.

### Resposta

A resposta foi que, ao calcular a prima pura da subscrição, o fluxo consulta a tabela/regra aplicável para decidir qual fórmula deve ser usada — por exemplo, fórmula 1, 2, 3 ou 4. A fórmula selecionada devolve então o valor do conceito correspondente.

### O que isso esclarece

A escolha da fórmula não é um passo desconectado do processo. Ela está inserida no momento em que a subscrição precisa calcular o conceito de prima pura.

---

## 14.3 O conceito 1 é calculado duas vezes?

### Pergunta

Foi levantada a preocupação de que o conceito 1 pudesse ser processado na subscrição e novamente no processamento dos conceitos econômicos da cobertura.

### Resposta

Foi explicado que o conceito 1 é calculado primeiro pela subscrição. Depois, o motor processa os demais conceitos, saltando o conceito 1 por já estar calculado.

### O que isso esclarece

O fluxo depende de uma divisão de responsabilidade: subscrição produz a prima pura; o motor continua o cálculo de demais componentes sem duplicar essa etapa.

---

## 14.4 A base técnica deveria ser um objeto genérico?

### Pergunta

Foi questionado se a estrutura de base técnica deveria ser genérica.

### Resposta

A resposta indicou que sim, pois a base técnica teria uma estrutura padronizada, embora os critérios de entrada possam variar entre produtos coletivos e individuais.

### O que isso esclarece

Existe uma intenção de normalizar a estrutura do resultado técnico, mesmo quando as regras ou fontes de dados variam por contexto.

---

## 14.5 Os atributos exibidos em tela deveriam ser normalizados?

### Pergunta

Foi sugerido substituir uma representação textual ou concatenada por uma estrutura mais formal, como objeto ou mapa chave-valor.

### Resposta

A ideia foi considerada viável, mas condicionada à análise do impacto na tela, nos literais e na lógica atual de apresentação.

### O que isso esclarece

A estrutura de dados de saída não é exclusivamente interna: ela possui dependências de interface e experiência de consulta.

---

## 14.6 O fluxo funciona quando não há dados de cobertura de vida?

### Pergunta

Foi perguntado se a cobertura e o fluxo seriam carregados corretamente quando o produto não fosse de vida e determinadas tabelas de vida não estivessem preenchidas.

### Resposta

O entendimento expresso foi que, para produtos de vida, determinadas tabelas precisam estar carregadas. Para não vida, a ausência dessas tabelas não deveria impedir o carregamento da cobertura, embora a marca de ajuste de subscrição possa não existir ou não ser aplicável.

### O que isso esclarece

O comportamento depende do ramo ou natureza do produto. O fluxo de subscrição não deve ser assumido como universal para todos os produtos.

---

## 15. Decisões e direcionamentos identificados

As seguintes decisões ou direcionamentos apareceram com razoável clareza:

1. **Criar uma estrutura específica para Brasil** dentro da organização de fórmulas.
2. **Planejar uma sessão conjunta entre países** para definir critérios comuns de organização, nomenclatura e reutilização.
3. **Evitar crescimento indiscriminado do catálogo de funções compartilhadas**.
4. **Submeter funções compartilhadas a validação e regressão mais rigorosas**.
5. **Usar o legado COBOL como referência de lógica para Espanha**, aproveitando seu histórico de testes.
6. **Não implementar fórmulas brasileiras com base em suposições**; é necessário receber a definição adequada.
7. **Registrar na base técnica todos os dados relevantes utilizados no cálculo**, sempre que possível.
8. **Tratar a estrutura demonstrada com valores fixos como exemplo temporário**, a ser substituído por cálculo real.
9. **Avaliar uma modelagem mais estruturada para atributos de subscrição exibidos em tela**.
10. **Configurar explicitamente a marca de ajuste de subscrição**, pois ela não parece ser criada automaticamente em todos os cenários.

Alguns pontos ainda estavam em debate, portanto não devem ser tratados como decisões consolidadas.

---

## 16. Limitações reconhecidas

### 16.1 Fórmulas brasileiras ainda precisam ser definidas

A reunião deixa claro que não há base suficiente para simplesmente replicar fórmulas em Brasil. A definição atuarial é uma dependência.

### 16.2 Governança ainda não está desenhada

Embora exista uma direção de padronização e catálogo compartilhado, a estrutura final, as responsabilidades e os critérios de entrada não foram definidos.

### 16.3 Valores demonstrados estavam “queimados”

Parte do código apresentado usava valores fixos para demonstrar a construção dos objetos. Portanto, a demonstração não valida uma fórmula atuarial definitiva.

### 16.4 Conectividade de banco problemática

Houve timeout e indisponibilidade de conexão com o ambiente brasileiro, impedindo parte da validação prática.

### 16.5 Configurações incompletas

Foram identificadas possíveis lacunas de configuração relacionadas a:

- companhia;
- regra de suplemento;
- marca de ajuste de subscrição;
- cobertura;
- conceito econômico;
- conceitos de desglose.

### 16.6 Impacto de interface não avaliado

A proposta de normalizar atributos precisa ser analisada contra a lógica de tela existente. Não se sabe como os dados são consumidos visualmente nem quais adaptações seriam necessárias.

---

## 17. Riscos e desafios

## 17.1 Riscos explicitamente mencionados

| Risco | Consequência potencial |
|---|---|
| Alterar fórmula comum sem compatibilidade | Impactar cálculos de múltiplos países |
| Não realizar regressão em fórmula compartilhada | Introduzir erro em cenários previamente estáveis |
| Criar catálogo amplo sem governança | Duplicidade, dispersão e manutenção difícil |
| Construir fórmula sem definição atuarial | Cálculo incorreto ou sem aderência ao negócio |
| Depender de configuração ausente | Fluxo de cálculo não executa como esperado |
| Ausência de conexão ao banco | Impossibilidade de testar e validar a implementação |
| Não manter histórico de subscrição | Erros em resgates, juros técnicos e movimentos futuros |

## 17.2 Desafios derivados do contexto

> Esta subseção contém análise, não afirmações literais dos participantes.

- **Definir fronteiras de reutilização:** o principal desafio será distinguir corretamente uma função universal de uma função aparentemente parecida, mas que possui diferenças regulatórias, atuariais ou de produto por país.
- **Garantir rastreabilidade completa:** como fórmulas usam parâmetros técnicos, a ausência de persistência desses valores dificultaria auditoria, atendimento e explicação de cálculo ao cliente.
- **Conciliar padrão e flexibilidade:** uma estrutura genérica de base técnica e subscrição precisa acomodar particularidades de coletivos, individuais, vida e não vida sem perder consistência.
- **Evitar duplicidade de cálculo:** a regra de que subscrição produz o conceito 1 e o motor calcula os seguintes precisa estar claramente implementada e testada, pois qualquer erro de orquestração pode duplicar ou omitir valores.
- **Transformar legado em comportamento verificável:** reproduzir lógica COBOL com segurança requer casos de teste e comparação de resultados, não apenas tradução de código.

---

## 18. Números e identificadores citados

Os valores abaixo foram mencionados como exemplos técnicos ou identificadores operacionais. Não devem ser tratados como métricas corporativas ou números auditados.

| Item | Valor mencionado | Contexto |
|---|---:|---|
| Conceito de desglose principal | 1 | Associado à prima pura calculada pela subscrição |
| Outros conceitos exemplificados | 2 e 3 | Possíveis sobrecargas, impostos ou componentes posteriores |
| Cobertura mencionada | 4003 | Cobertura marcada com subscrição em teste |
| Exemplo de aporte | 5.000 | Primeiro aporte citado |
| Segundo aporte | 5.000 | Segundo aporte citado |
| Exemplo de resgate | 2.000 | Resgate parcial citado |
| Saldo remanescente no exemplo | 3.000 | Saldo após resgate parcial |
| Duração de histórico exemplificada | 5, 8 e 10 anos | Períodos citados para ilustrar juros técnicos e subscrições históricas |
| Volume de código citado | “linha 200.000” | Referência informal a localização de lógica extensa; não deve ser tomada literalmente sem validação |
| Tabelas/identificadores mencionados | A1250, A102, A180, A190, A23/A23202 | Identificadores registrados com incerteza devido ao áudio |

---

## 19. Aspectos técnicos que a reunião não permite concluir

A transcrição não permite determinar com segurança:

- o significado completo de **RTE**;
- o significado oficial de **T&N**;
- o nome correto do objeto transcrito como “polizón” ou “polisón”;
- o modelo de arquitetura de aplicações;
- se o motor é monolítico, modular ou distribuído;
- quais APIs, protocolos ou contratos de integração existem;
- se Mongo é o único banco utilizado;
- quais coleções, índices, esquemas ou políticas de persistência existem;
- o mecanismo de seleção de fórmulas em detalhe;
- a estrutura completa do catálogo de fórmulas;
- a estrutura final de pacotes/classes Java;
- a tecnologia de front-end;
- o processo formal de CI/CD no Jenkins;
- os testes automatizados existentes;
- os critérios formais de aprovação atuarial;
- o modelo de segurança, autenticação e autorização;
- o mecanismo de versionamento de fórmulas e parâmetros;
- os requisitos de auditoria, retenção e trilha de mudanças;
- os SLAs de cálculo;
- o comportamento em falhas parciais;
- as regras exatas dos conceitos 2 e 3;
- se as fórmulas podem ser configuradas em banco ou somente em código;
- quais países efetivamente consumirão funções compartilhadas;
- quem possui ownership formal do catálogo compartilhado.

---

## 20. Conclusões

A reunião estabeleceu um entendimento importante sobre o fluxo de cálculo: a subscrição é responsável por calcular a prima pura no conceito de desglose 1, usando uma fórmula escolhida conforme regras e condições aplicáveis. Em seguida, o motor de Rating/RTE calcula os demais conceitos da cobertura, evitando recalcular o que já foi produzido pela subscrição.

O ponto técnico central não é apenas calcular valores: é construir uma estrutura de saída completa, composta por subscrição, desgloses, capitais quando aplicáveis, base técnica e dados adicionais. Essa estrutura sustenta a persistência, a consulta, a exibição em tela, a impressão em apólice e a rastreabilidade necessária para cenários mais complexos, como resgates parciais e diferentes taxas técnicas históricas.

No plano organizacional, a equipe identificou a necessidade de equilibrar reutilização e autonomia local. Há intenção de criar um catálogo de funções comuns e uma convenção de organização por país, produto e componentes transversais. Contudo, a governança dessa estrutura ainda precisa ser definida em conjunto entre os países envolvidos.

Para Brasil, a principal dependência é a obtenção de fórmulas e regras atuariais formalmente definidas. A reunião reforça que não é adequado inferir ou copiar automaticamente fórmulas de outros países. Já Espanha aparece como fonte de referência por possuir lógica legada em COBOL, aparentemente já validada, que pode orientar a implementação moderna.

Por fim, a demonstração prática revelou que a evolução não depende apenas de código: requer configuração consistente de cobertura, companhia, regras, marcas de subscrição e acesso estável ao banco de dados. Esses elementos são parte integrante do funcionamento do motor de cálculo.
