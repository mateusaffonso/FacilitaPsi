# Facilita Psi — Especificação do Sistema

| | |
|---|---|
| **Versão** | 1.2 (tecnologia definida) |
| **Data** | 14/10/2026 |
| **Usuária** | Uma psicóloga infantojuvenil (dados pessoais mantidos fora do repositório) |
| **Inspiração** | Sintropia.psi (https://sintropia.app) |
| **Status** | Especificação validada; arquitetura em docs/arquitetura.md |

---

## 1. Visão geral

### 1.1 Objetivo
O Facilita Psi é um aplicativo gratuito para gerenciar um consultório de psicologia infantojuvenil. Ele substitui o caderno e a planilha de presença usados hoje. Reúne em um só lugar pacientes, agenda, presença, prontuário, escalas, documentos e controle financeiro.

### 1.2 Contexto atual
- Uma psicóloga atende **17 pacientes**, cada um **uma vez por semana** (cerca de 17 sessões por semana e 70 por mês).
- Os pacientes são **crianças e adolescentes**.
- Os atendimentos são majoritariamente **presenciais**, com alguns **online**.
- Hoje a organização é feita em **caderno**, com a presença em **Google Planilhas**.

### 1.3 Princípios do produto
1. **Custo zero.** Nada de mensalidade, API paga ou hospedagem paga.
2. **Rápido de usar durante a sessão.** Poucos toques, botões grandes e boa usabilidade no celular e no tablet.
3. **Privacidade em primeiro lugar.** Os dados clínicos são sensíveis (LGPD) e de menores de idade. Ficam sob controle da psicóloga, criptografados e exportáveis.
4. **Simplicidade.** O app deve poder ser mantido por um programador iniciante (Python, JavaScript e um pouco de React) com a ajuda do Claude.

---

## 2. Usuários e acesso

| Perfil | Descrição | Fase |
|---|---|---|
| Psicóloga (administradora) | Única usuária. Acesso total. | 1 |
| Responsáveis / pacientes | **Não têm acesso** ao app. A comunicação é feita por WhatsApp, iniciada pela psicóloga. | Fora do escopo |
| Outras psicólogas / secretária | Não previsto. | Fora do escopo |

- **RF-01** O acesso tem **duas camadas**:
  1. **Conta Google da psicóloga**, para sincronizar com o Drive. Só a conta dela é autorizada.
  2. **Senha do app**, que destrava os dados no aparelho e serve de base para a criptografia.

  No primeiro uso, o app gera uma **chave de recuperação** para ser impressa e guardada. Sem a senha e sem essa chave, os dados não podem ser recuperados.
- **RF-02** O app pode ser usado no **computador (Windows)**, no **iPhone** e no **tablet Samsung Galaxy Tab S9+ (Android)**, com interface responsiva.
- **RF-03** A sessão encerra automaticamente após um período de inatividade configurável (padrão de 30 minutos).

---

## 3. Escopo e fases

As prioridades declaradas foram: (1) confirmar a presença por paciente, (2) gerar o prontuário a partir da sessão e (3) confirmar a sessão com os responsáveis via WhatsApp.

| Fase | Módulos |
|---|---|
| **Fase 1 — MVP** | Login · Cadastro de pacientes e responsáveis · Agenda com horários fixos · Tela "Hoje" com registro de presença e faltas · Reposições · Lembretes via WhatsApp · Prontuário com ditado guiado por voz · Feriados e férias · Baixar meus dados |
| **Fase 2** | Financeiro (por sessão e mensal, créditos, pagamentos) · Controle de notas fiscais · Anamnese · Anexos no prontuário |
| **Fase 3** | Escalas e testes com gráficos de evolução · Relatório psicológico em PDF · Modo de aplicação de escalas no tablet · Ditado livre organizado por IA local |

### 3.1 Fora do escopo
- Acesso de pais ou pacientes ao app.
- Envio **automático** de mensagens de WhatsApp. O envio é sempre manual, pelo app do WhatsApp dela.
- Integração com Google Agenda.
- Gravação da sessão inteira. Será usado o **ditado pós-sessão** (seção 6).
- Emissão de nota fiscal. O app apenas registra se a nota foi emitida.
- Recibos, despesas e relatório de Carnê-Leão.
- Pagamento online (Pix com QR Code, cartão).
- Vários usuários ou clínicas.
- Timbre nos documentos.

---

## 4. Pacientes e responsáveis (Fase 1)

### 4.1 Cadastro do paciente
- **RF-10** Cadastro com os campos:

| Campo | Obrigatório | Observação |
|---|---|---|
| Nome completo | Sim | |
| Data de nascimento | Sim | A **idade é calculada automaticamente** |
| Faixa | Automático | Criança (até 11 anos) ou adolescente (12 a 18 anos), conforme o ECA |
| Escolaridade (série/ano) | Sim | |
| Nome da escola | Não | |
| Endereço | Não | |
| Data de início do tratamento | Sim | |
| Situação | Sim | Ativo · Em pausa · Alta |
| Modalidade padrão | Sim | Presencial · Online |
| Link da sessão online | Não | Para atendimentos online |
| Valor da sessão (R$) | Sim | |
| Forma de cobrança | Sim | Por sessão · Mensal antecipado (início do mês) · Mensal no fim do mês (seção 9) |
| Queixa principal | Não | Campo clínico |
| Hipótese diagnóstica / diagnóstico | Não | Campo clínico |
| Medicações em uso | Não | Campo clínico |
| Outros profissionais que acompanham | Não | Ex.: neuropediatra, fonoaudióloga, terapeuta ocupacional |
| Quem encaminhou | Não | |

- **RF-11** Pacientes com alta ou em pausa saem da agenda, mas **nunca são apagados**, por causa da guarda obrigatória do prontuário (RNF-09).
- **RF-12** A lista de pacientes tem busca por nome e filtro por situação.

### 4.2 Responsáveis
- **RF-13** Cada paciente pode ter **um ou mais responsáveis**, com os campos:
  nome, parentesco, **CPF**, **telefone/WhatsApp**, e-mail e endereço (se diferente do paciente).
- **RF-14** Um dos responsáveis é marcado como **responsável principal**. Ele recebe os lembretes de WhatsApp e é usado nas cobranças.

---

## 5. Agenda, presença e faltas (Fase 1)

### 5.1 Configuração da agenda
- **RF-20** A psicóloga configura o seu **expediente** (dias da semana e faixas de horário de atendimento) e a **duração padrão da sessão** (padrão de 50 minutos).
- **RF-21** Cada paciente ativo tem um **horário fixo semanal** (ex.: terça, 14h00). O app gera as sessões futuras automaticamente.
- **RF-22** É possível **trocar o horário fixo** de um paciente a partir de uma data, sem alterar o histórico.
- **RF-23** É possível **remarcar uma sessão avulsa** (mover só aquela ocorrência).
- **RF-24** O app avisa quando há conflito de horários.

### 5.2 Feriados e férias
- **RF-25** O app traz os **feriados nacionais** e permite cadastrar feriados locais (municipais/estaduais).
- **RF-26** A psicóloga pode cadastrar **férias ou ausências por período**. As sessões do período são marcadas automaticamente como *Suspensa (férias/feriado)*.
- **RF-27** Sessões suspensas **não são cobradas** e não entram no valor previsto do mês (seção 9).

### 5.3 Tela "Hoje"
- **RF-28** A tela inicial mostra as sessões do dia em ordem de horário, com o nome e a idade da criança, a modalidade e o status de confirmação.
- **RF-29** Cada sessão tem botões de **um toque** para registrar a presença: **Presente**, **Faltou** e **Desmarcar**. Ao escolher "Faltou" ou "Desmarcar", o app pergunta os detalhes (seção 5.4).
- **RF-30** A partir de uma sessão marcada como *Presente*, um botão leva direto ao **ditado do prontuário** (seção 6).
- **RF-31** Uma visão semanal e outra mensal mostram a agenda completa.

### 5.4 Status da sessão

| Status | Quando ocorre | Cobrança | Reposição |
|---|---|---|---|
| **Agendada** | Sessão futura gerada pelo horário fixo | — | — |
| **Presente** | Paciente compareceu | **Cobrada** | — |
| **Falta com aviso — com reposição** | Responsável avisou com **24h ou mais** de antecedência e foi marcada uma reposição | **Não cobrada** (a reposição é que será cobrada) | Sim |
| **Falta com aviso — sem reposição** | Avisou com 24h ou mais, mas não havia horário disponível ou a família não quis repor | **Não cobrada** (no mensal antecipado, vira crédito) | Não |
| **Falta sem aviso** | Não compareceu, ou avisou com **menos de 24h** | **Cobrada** | **Nunca** (sem exceção) |
| **Desmarcada pela psicóloga — com reposição** | A psicóloga cancelou e foi marcada uma reposição | A sessão **é cobrada uma única vez**, por meio da reposição realizada | Sim |
| **Desmarcada pela psicóloga — sem reposição** | A psicóloga cancelou sem reposição | **Não cobrada** (no mensal antecipado, vira crédito) | Não |
| **Suspensa (férias/feriado)** | Período bloqueado na agenda | **Não cobrada** e fora do valor previsto | Não |
| **Reposição** | Sessão extra que repõe uma falta com aviso ou uma ausência da psicóloga | **Cobrada** quando o paciente comparece | — |

**Regras:**
- **RN-01 (24 horas)** Ao registrar uma falta, a psicóloga informa **quando o aviso foi recebido**. O app calcula sozinho se foi com 24h ou mais (*com aviso*) ou com menos (*sem aviso*), e a psicóloga pode corrigir manualmente.
- **RN-01b (sem exceção)** Falta sem aviso **nunca** gera reposição. O app não oferece a opção de repor nesse caso, nem como exceção manual.
- **RN-02 (sugestão de reposição)** Em uma falta com aviso ou uma ausência da psicóloga, o app **sugere horários livres na mesma semana**, com base no expediente e nas sessões já marcadas. A psicóloga escolhe um horário ou marca "sem reposição".
- **RN-03 (vínculo)** Toda reposição fica **vinculada à sessão original**. O app mostra as **reposições pendentes** (com aviso, mas ainda sem horário marcado).
- **RN-04 (falta na reposição)** Se o paciente faltar à própria reposição, as mesmas regras de falta valem para ela.
- **RN-05 (histórico)** Mudanças de status ficam registradas com data e hora.

---

## 6. Prontuário com ditado e IA (Fase 1)

### 6.1 Fluxo do ditado pós-sessão
Em vez de gravar a sessão inteira, a psicóloga **dita um resumo curto** logo após o atendimento, usando a **digitação por voz do teclado** do aparelho.

**Ditado guiado (Fase 1):**
1. Na sessão marcada como *Presente*, ela toca em **"Registrar evolução"**.
2. Em cada campo (Objetivo, Atividades e recursos, Evolução), ela toca no **microfone do teclado** e fala:
   - **iPhone:** ditado do teclado do iOS;
   - **Tablet Android:** Gboard, com o pacote de português baixado para uso offline;
   - **Computador:** digitação por voz do Windows (tecla Windows + H) ou o teclado comum.
3. Ela **revisa, edita e confirma**. Somente depois disso o registro entra no prontuário.

**Ditado livre com IA local (Fase 3):**
1. Ela dita tudo de uma vez, num único campo, em qualquer aparelho.
2. O texto fica **"aguardando organização"**.
3. Quando ela abre o app no computador, uma **IA rodando no próprio PC** (Ollama) separa o texto nos campos do prontuário e gera um rascunho.
4. Ela revisa e confirma.

- **RF-40** A transcrição é **sem custo** e feita pelo teclado do próprio aparelho. O app não implementa reconhecimento de voz.
- **RF-41 (Fase 3)** Um ditado livre fica "aguardando organização" até ser processado pela IA local no computador. Ele também pode ser organizado manualmente a qualquer momento.
- **RF-42** O app **não grava nem armazena áudio**, o que reduz os dados sensíveis guardados.
- **RF-43** Também é possível **digitar** o registro diretamente, sem ditado.
- **RF-44** Nenhum texto produzido pela IA vai para o prontuário sem a revisão e a confirmação da psicóloga.

### 6.2 Campos do registro de sessão

| Campo | Tipo |
|---|---|
| Data e horário | Automático, a partir da sessão |
| Modalidade | Automático (presencial/online) |
| Objetivo da sessão | Texto |
| Atividades e recursos utilizados | Texto (jogos, desenhos, brinquedos, técnicas) |
| Evolução | Texto |
| Anotações livres | Texto |

### 6.3 Regras do prontuário
- **RF-45** Um registro confirmado **não pode ser apagado**. Pode ser **editado**, e cada edição fica guardada no **histórico de versões** (quem, quando, o que mudou).
- **RF-46** O prontuário de cada paciente pode ser visto em **linha do tempo**, com busca por palavra.
- **RF-47** O prontuário completo de um paciente pode ser exportado em **PDF**.
- **RF-48 (Fase 2)** Cada registro aceita **anexos**: fotos tiradas pela câmera (ex.: desenhos da criança), PDFs (laudos, relatórios escolares) e imagens. As fotos são comprimidas automaticamente para economizar espaço.

---

## 7. Lembretes e confirmação via WhatsApp (Fase 1)

### 7.1 Fluxo
1. O app mostra a lista **"Lembretes de amanhã"**, com as sessões do dia seguinte.
2. Ao tocar em **"Enviar lembrete"**, o **WhatsApp da psicóloga abre** com a conversa do **responsável principal** e a mensagem já escrita.
3. Ela só aperta **enviar** no próprio WhatsApp.
4. Quando o responsável responde, ela marca o resultado no app: **Confirmada**, **Desmarcou** (abre o registro de falta, seção 5.4) ou **Sem resposta**.

- **RF-50** Status do lembrete: *Não enviado → Enviado → Confirmada / Desmarcou / Sem resposta*. O status aparece na tela "Hoje".
- **RF-51** O texto da mensagem é **editável** nas configurações, com campos que se preenchem sozinhos. Mensagem padrão:

  > Olá, {nome_responsavel}! Passando para lembrar da sessão de {nome_paciente} amanhã, {dia_semana} ({data}), às {hora}. Você pode confirmar, por favor? Obrigada! {nome_psicologa} – Psicóloga

- **RF-52** Nas sessões online, a mensagem pode incluir o link da sessão.
- **RF-53** Custo zero: o envio usa o link oficial de abertura do WhatsApp (`wa.me`), sem API paga.

---

## 8. Anamnese (Fase 2)

- **RF-60** A anamnese é **preenchida pela psicóloga no app**, durante a entrevista com os responsáveis. Pode ser salva em partes e retomada depois.
- **RF-61** O formulário **se adapta à faixa etária**: as seções para adolescentes aparecem automaticamente a partir de 12 anos.
- **RF-62** A anamnese pode ser exportada em PDF.

### 8.1 Seções do formulário

**Comuns (criança e adolescente):**
1. **Identificação**: dados do paciente e dos responsáveis, já preenchidos a partir do cadastro; quem participou da entrevista.
2. **Motivo da consulta**: queixa principal, desde quando, quem percebeu, quem encaminhou, tratamentos anteriores.
3. **Composição e dinâmica familiar**: com quem mora, irmãos, guarda (se os pais forem separados), rotina da casa, eventos marcantes (perdas, mudanças, separações).
4. **Gestação e parto**: planejamento, intercorrências, tipo de parto, idade gestacional, condições ao nascer.
5. **Desenvolvimento neuropsicomotor**: idade em que sustentou a cabeça, sentou, engatinhou, andou, falou as primeiras palavras e frases, e fez o controle dos esfíncteres.
6. **Linguagem e comunicação**.
7. **Saúde**: doenças, internações, cirurgias, alergias, medicações e acompanhamentos (neuropediatra, fonoaudióloga, terapeuta ocupacional etc.).
8. **Sono**: qualidade, horários, onde e com quem dorme.
9. **Alimentação**: seletividade, apetite, autonomia.
10. **Escolaridade**: escola, série, adaptação, rendimento, relação com professores e colegas, queixas da escola.
11. **Socialização e brincar**: amizades, brincadeiras preferidas, brincar sozinho ou em grupo.
12. **Comportamento e emoções**: birras, medos, irritabilidade, reações à frustração, limites.
13. **Rotina e telas**: atividades extracurriculares, tempo de tela.
14. **Histórico familiar**: saúde mental e neurodesenvolvimento na família.
15. **Expectativas dos responsáveis** em relação ao atendimento.
16. **Observações da psicóloga**.

**Somente para adolescentes:**
17. **Puberdade e corpo**.
18. **Relacionamentos**: amizades, namoro, relação com a família.
19. **Redes sociais e internet**.
20. **Uso de substâncias**.
21. **Interesses e projeto de vida**.

---

## 9. Financeiro (Fase 2)

### 9.1 Formas de cobrança (por paciente)

Cada paciente tem **uma** das três formas abaixo, definida no cadastro. Ela pode ser trocada a partir de um mês.

Em todas as formas, as sessões **cobráveis** são as mesmas (seção 5.4): *Presente*, *Falta sem aviso* e *Reposição* realizada.

**1. Por sessão**
- Cada sessão cobrável gera um **valor a receber** no próprio dia.
- A psicóloga marca cada valor como pago.

**2. Mensal antecipado (paga no início do mês)**
- No primeiro dia do mês, o app calcula o **valor previsto**: *número de sessões agendadas no mês × valor da sessão − créditos do mês anterior*. Sessões suspensas por férias ou feriado já ficam de fora.
- Se no decorrer do mês houver **falta com aviso sem reposição** ou **ausência da psicóloga sem reposição**, o valor dessa sessão vira **crédito para o mês seguinte**.
- **Falta sem aviso não gera crédito**, porque é cobrada.
- O valor **não é fixo**: varia conforme o número de sessões do mês (4 ou 5 semanas).

**3. Mensal no fim do mês (paga no fim do mês)**
- No último dia do mês, o app calcula o **valor devido**: *número de sessões cobráveis realizadas no mês × valor da sessão*.
- Não há créditos: as sessões não cobradas simplesmente não entram na soma.
- Durante o mês, o app mostra uma **prévia** do valor acumulado até o momento.

### 9.2 Funcionalidades
- **RF-70** Marcar um pagamento como **pago**, com data, valor e forma de pagamento (Pix, dinheiro, transferência, cartão). Não há integração de pagamento.
- **RF-71** Painel do mês com o **total recebido**, o **total a receber** e a lista de **quem deve** (paciente, responsável principal, valor e desde quando).
- **RF-72** Histórico financeiro por paciente, com os créditos aplicados.
- **RF-73** Pagamentos parciais são permitidos (o saldo fica pendente).

### 9.3 Controle de notas fiscais
- **RF-74** Cada pagamento recebido tem a marcação **"NF emitida"** (sim/não), com o número, a data de emissão e o CPF do responsável usado na nota. A emissão em si é feita fora do app.
- **RF-75** A lista **"NF pendentes"** mostra os pagamentos recebidos ainda sem nota.

---

## 10. Escalas e testes (Fase 3)

### 10.1 Instrumentos

| Instrumento | Informante | Como funciona no app |
|---|---|---|
| **SNAP-IV** (26 itens, 0 a 3) | Pais e/ou professores | **Preenchido no app**, com correção automática: contagem de itens marcados como "bastante" ou "demais" por subescala (desatenção ≥ 6; hiperatividade/impulsividade ≥ 6; opositor-desafiador ≥ 4) |
| **SCARED** (41 itens, 0 a 2) | Criança e/ou pais | **Preenchido no app**, com correção automática: escore total (≥ 25 sugere transtorno de ansiedade) e subescalas (pânico/somático, ansiedade generalizada, ansiedade de separação, fobia social, evitação escolar) com os respectivos pontos de corte |
| **CBCL** (ASEBA) | Pais | **Apenas registro dos resultados**: escores T de Internalizantes, Externalizantes, Total e das síndromes, digitados a partir da correção oficial |
| **ETDAH-PAIS** | Pais | **Apenas registro dos resultados**, por fator, conforme o manual |
| **ETDAH-CRI** | Criança | **Apenas registro dos resultados**, por fator, conforme o manual |

> **Direitos autorais:** CBCL e ETDAH são instrumentos protegidos e comercializados por suas editoras. O app **não reproduz os itens** desses testes, apenas guarda os resultados obtidos com o material oficial. SNAP-IV e SCARED são de uso livre, e as versões em português podem ser preenchidas no app. **Os pontos de corte devem ser conferidos pela psicóloga** com as referências que ela usa, antes da implementação.

### 10.2 Funcionalidades
- **RF-80** Registrar cada aplicação com data, instrumento, informante (mãe, pai, professor, criança) e resultados.
- **RF-81** **Gráfico de evolução** por paciente, com cada subescala ao longo do tempo e a linha do ponto de corte.
- **RF-82** Comparação entre informantes (ex.: SNAP-IV respondido pela mãe e pela professora).
- **RF-83 (opcional)** **Modo de aplicação no tablet**: abre só o questionário, em tela cheia, para os pais ou a criança responderem sem ver nenhum outro dado do app.

---

## 11. Documentos (Fase 3)

- **RF-90** Geração de **Relatório Psicológico** em PDF, na estrutura da **Resolução CFP nº 06/2019**:
  1. Identificação (autora, interessado, finalidade)
  2. Descrição da demanda
  3. Procedimento
  4. Análise
  5. Conclusão
  6. Local, data, nome, **CRP** e assinatura
- **RF-91** O relatório pode ser **preenchido a partir do prontuário**: a IA sugere um rascunho com base nos registros do período, e a psicóloga revisa tudo.
- **RF-92** Os documentos não têm timbre. O cabeçalho é simples, com nome e CRP.
- **RF-93** Os documentos gerados ficam guardados no histórico do paciente.

---

## 12. Requisitos não funcionais

### 12.1 Custo
- **RNF-01** O custo mensal deve ser **R$ 0**: sem hospedagem paga, API paga ou assinatura.

### 12.2 Disponibilidade e dispositivos
- **RNF-02** O app funciona no **computador Windows** dela (Samsung Galaxy Book2, Intel i3-1215U, 12 GB de RAM, 238 GB de disco), no **iPhone** (instalado pelo Safari, na tela de início) e no **tablet Samsung Galaxy Tab S9+** (instalado pelo Chrome).
- **RNF-03** O celular e o tablet funcionam **mesmo com o computador desligado**.
- **RNF-04** O app funciona **sem internet** (registro de presença, prontuário, ditado) e **sincroniza** quando a conexão voltar.

### 12.3 Dados e armazenamento
- **RNF-05** Os dados ficam na **conta do Google Drive dela**, **criptografados** antes do envio. Nem o Google nem terceiros conseguem ler o conteúdo.
- **RNF-06** **"Baixar meus dados"**: um botão gera um arquivo ZIP com todos os dados (planilha/JSON), os prontuários em PDF e os anexos. Ele pode ser salvo **no computador ou no celular**.
- **RNF-07** O volume estimado é pequeno: cerca de 900 registros de sessão por ano, além dos anexos. Os 15 GB gratuitos do Google Drive devem bastar por muitos anos, com as fotos comprimidas.

### 12.4 Segurança, ética e conformidade
- **RNF-08 (LGPD)** Dados de saúde são **dados sensíveis**, e dados de crianças e adolescentes exigem cuidado especial (LGPD, art. 14). O app deve:
  - criptografar os dados guardados e transmitidos;
  - exigir login;
  - coletar só o necessário;
  - não gravar áudio (RF-42);
  - nunca usar serviços que treinem modelos com os dados.
- **RNF-09 (CFP — prontuário)** A guarda do registro documental deve durar **no mínimo 5 anos** (Resolução CFP nº 01/2009). Por isso nenhum registro clínico pode ser apagado definitivamente pelo app.
- **RNF-10 (sigilo)** Nenhum dado clínico aparece em notificações, na pré-visualização de mensagens ou em nomes de arquivos exportados.

### 12.5 Usabilidade
- **RNF-11** Idioma português (Brasil), datas no formato dd/mm/aaaa, fuso horário de Brasília e valores em R$.
- **RNF-12** Botões grandes (área de toque ≥ 44 px) e as ações mais frequentes em até **2 toques** a partir da tela "Hoje".
- **RNF-13** Contraste acessível (WCAG AA) em textos e botões.
- **RNF-14** Pode ser instalado na tela inicial do celular, como um app.

### 12.6 Manutenção
- **RNF-15** Código simples e documentado, com poucas dependências, em React + TypeScript (stack escolhida em `docs/arquitetura.md`).
- **RNF-16** O código-fonte é **público** no GitHub, e o app é hospedado no GitHub Pages. **Nenhum dado de paciente, senha ou chave secreta** pode ser incluído no repositório.

---

## 13. Identidade visual

Paleta derivada da logo da psicóloga (azul sereno + rosé). A logo não fica no repositório público: é mantida localmente em `assets/`, que está no `.gitignore`.

| Papel | Cor | Uso |
|---|---|---|
| Azul da logo | `#6B95C2` | Ícones, bordas, detalhes. **Não usar em texto ou botão sobre branco** (contraste de cerca de 3:1) |
| Azul profundo | `#3E6A99` | Botões principais, links, títulos (contraste de cerca de 5,6:1) |
| Rosé da logo | `#F4A9B0` | Destaques, avatares, marcações |
| Rosé névoa | `#FCE8EA` | Fundos suaves de destaque |
| Azul névoa | `#EAF2FA` | Fundos de seção |
| Grafite azulado | `#2F3B48` | Texto principal |
| Confirmada / sucesso | `#5E9F7F` | Status positivo |
| Aguardando / atenção | `#D9A441` | Pendências |
| Falta / erro | `#C8555A` | Faltas cobradas, erros (diferente do rosé) |

- Tipografia sans-serif arredondada, coerente com a logo (ex.: *Quicksand* nos títulos e *Nunito* no texto, a validar).
- Modo escuro: não é requisito da Fase 1.

---

## 14. Modelo de dados (visão conceitual)

```
Configuração (expediente, duração padrão, modelo de mensagem, dados da psicóloga)
Paciente 1───N Responsável            (um marcado como principal)
Paciente 1───N HorárioFixo            (com vigência: início/fim)
Paciente 1───N Sessão                 (status, modalidade, data/hora, aviso_recebido_em)
Sessão   1───0..1 Sessão (reposição)  (vínculo reposição → sessão original)
Sessão   1───0..1 Lembrete            (status do WhatsApp)
Sessão   1───0..1 RegistroProntuário 1───N VersãoRegistro
RegistroProntuário 1───N Anexo
RegistroProntuário 0..1─── DitadoLivre (Fase 3: texto único, status "aguardando organização")
Paciente 1───0..1 Anamnese
Paciente 1───N AplicaçãoEscala        (instrumento, informante, respostas/escores)
Paciente 1───N Documento              (relatório psicológico)
Paciente 1───N FormaCobrança          (por sessão / mensal antecipado / mensal no fim; com vigência)
Paciente 1───N Cobrança               (por sessão ou fechamento mensal) 1───N Pagamento
Pagamento 1───0..1 NotaFiscal         (emitida, número, data)
Paciente 1───N Crédito                (origem: sessão; aplicado em: cobrança)
Bloqueio (feriado/férias: período, descrição)
```

---

## 15. Premissas validadas

Pontos interpretados a partir das respostas e confirmados em 14/10/2026:

1. **Internet:** o app precisa funcionar sem internet e sincronizar depois (RNF-04).
2. **Formas de cobrança:** há três, definidas por paciente: por sessão, mensal antecipado e mensal no fim do mês. Só o mensal antecipado gera créditos (seção 9.1).
3. **Falta sem aviso:** nunca tem reposição, nem por exceção manual (RN-01b).
4. **Ausência da psicóloga:** com reposição, a sessão é cobrada uma única vez, por meio da reposição. Sem reposição, não é cobrada.
5. **Duração padrão da sessão:** 50 minutos (configurável).
6. **Nota fiscal:** uma nota por pagamento recebido.
7. **Atraso no ditado:** é aceitável que o rascunho organizado pela IA (Fase 3) só fique pronto quando o app for aberto no computador.
8. **Áudio do ditado:** superada na v1.2, porque o app não grava áudio (RF-42).
9. **Logo:** a logo da psicóloga é usada só como referência de cores e fica fora do repositório. Ela não aparece nos documentos, que não têm timbre.

---

## 16. Questões para a escolha de tecnologia

> As decisões tomadas a partir destas questões estão em [`docs/arquitetura.md`](arquitetura.md).

Requisitos que mais pesaram na decisão técnica:

| Requisito | Desafio técnico |
|---|---|
| Custo zero + Google Drive | Onde fica a "fonte da verdade" dos dados e como sincronizar entre celular e computador sem servidor pago |
| Celular funciona sem o PC e sem internet | O app precisa guardar os dados localmente em cada aparelho e sincronizar depois |
| Ditado → prontuário de graça | Transcrição no próprio aparelho (reconhecimento de voz do Android/Chrome, ou Whisper no PC) e organização do texto por IA gratuita, sem enviar dados clínicos a serviços que treinam modelos |
| Hardware modesto (i3, sem placa de vídeo dedicada) | Limita o uso de modelos de IA locais grandes no computador |
| Mantenedor iniciante (Python/JS) | Preferir uma stack simples, com poucas partes móveis |
| Instalável no celular sem loja de apps | Aplicação web instalável (PWA) é a candidata natural |

---

## 17. Histórico do documento

| Versão | Data | Descrição |
|---|---|---|
| 1.0 | 14/10/2026 | Primeira versão, a partir de 40 perguntas e respostas |
| 1.1 | 14/10/2026 | Premissas validadas: três formas de cobrança, falta sem aviso sem exceção, cobrança da ausência da psicóloga com reposição |
| 1.2 | 14/10/2026 | Ajustes da escolha de tecnologia: login em duas camadas (Google + senha do app), ditado pelo teclado sem gravação de áudio, aparelhos definidos (iPhone, Galaxy Tab S9+, Windows), código público |
