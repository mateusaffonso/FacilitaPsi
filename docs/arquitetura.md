# Facilita Psi — Arquitetura e decisões de tecnologia

| | |
|---|---|
| **Versão** | 1.0 |
| **Data** | 14/10/2026 |
| **Base** | [`especificacao.md`](especificacao.md) v1.2 |

---

## 1. Resumo

O Facilita Psi é uma **PWA local-first**: um site que se instala como aplicativo e guarda os dados **no próprio aparelho**. A sincronização entre aparelhos usa **arquivos criptografados no Google Drive** da psicóloga.

Não existe servidor próprio. O site hospedado contém **apenas o código**, nunca os dados.

```
GitHub Pages (código público, sem dados)
        │ entrega o app
        ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   iPhone     │   │ Galaxy Tab   │   │ PC Windows   │
│ app + banco  │   │ app + banco  │   │ app + banco  │──► Ollama (IA local, Fase 3)
│ criptografado│   │ criptografado│   │ criptografado│
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       └──────────────────┼──────────────────┘
                          ▼
        Google Drive da psicóloga — pasta "Facilita Psi"
        (somente arquivos criptografados)
```

---

## 2. Decisões

| # | Decisão | Escolha | Motivo |
|---|---|---|---|
| D1 | Tipo de app | **PWA** (aplicativo web instalável) | Funciona no iPhone, no Android e no Windows com um único código. Não precisa de loja de apps e tem custo zero |
| D2 | Interface | **React 19 + TypeScript + Vite** | O mantenedor já conhece React. O TypeScript detecta erros nas regras de cobrança e de faltas antes de chegarem à usuária |
| D3 | Componentes visuais | **Mantine** (com `@mantine/dates` e `dayjs` em pt-BR) | Componentes prontos (calendário, formulários, modais), tema fácil de personalizar com a paleta da logo, boa documentação |
| D4 | Navegação | **React Router com `HashRouter`** | O GitHub Pages não reescreve URLs, e o `HashRouter` evita erro 404 ao recarregar a página |
| D5 | Banco local | **Dexie.js** (IndexedDB) + `dexie-react-hooks` | Banco no navegador que funciona offline e atualiza a tela automaticamente quando os dados mudam |
| D6 | Funcionamento offline e instalação | **vite-plugin-pwa** (Workbox) | Gera o *service worker* e o manifesto do app |
| D7 | Criptografia | **Web Crypto API** (nativa): AES-256-GCM + PBKDF2-SHA-256 | Sem biblioteca externa. O padrão é auditado e está disponível em todos os navegadores atuais |
| D8 | Sincronização | **Google Drive API v3**, permissão `drive.file`, login via **Google Identity Services** | Os dados ficam no Drive dela. A permissão `drive.file` só dá acesso aos arquivos que o próprio app criou |
| D9 | Hospedagem | **GitHub Pages**, com repositório público e deploy por GitHub Actions | Custo zero. O código não contém dados nem segredos |
| D10 | Transcrição do ditado | **Teclado do aparelho** (ditado do iOS, Gboard offline, Windows + H) | Custo zero, funciona offline e nenhum áudio passa pelo app |
| D11 | IA para organizar o ditado (Fase 3) | **Ollama** no PC, com um modelo pequeno (ex.: Gemma 3 4B) | Grátis e local: os dados não saem do computador dela |
| D12 | PDF | **pdfmake** | Gera o prontuário, a anamnese e o relatório no próprio aparelho |
| D13 | Gráficos | **Recharts** | Biblioteca de gráficos feita para React |
| D14 | Testes | **Vitest** (+ Testing Library) | Testes automáticos das regras de negócio (faltas, 24h, créditos, cobrança) |
| D15 | Feriados | **Cálculo local** (feriados fixos + móveis a partir da Páscoa) | Funciona offline. Os feriados municipais e estaduais são cadastrados pela usuária |

---

## 3. Segurança: como garantir que só ela acessa

O código fica público, mas os dados ficam protegidos por **quatro camadas**:

1. **O site não tem dados.** Quem abrir o endereço do app vê um app vazio. Mesmo que essa pessoa cadastre algo, os dados ficam só no aparelho dela.
2. **Só a conta Google dela é autorizada.** O projeto no Google Cloud fica em modo **"Teste"**, com **apenas o e-mail dela como usuária de teste**. Qualquer outra conta Google é recusada na tela de login.
3. **Os arquivos no Drive são privados** da conta dela, e o app só enxerga os arquivos que ele mesmo criou (`drive.file`).
4. **Tudo é criptografado com a senha dela.** Mesmo quem tivesse acesso ao Drive veria apenas arquivos ilegíveis.

**Proteções adicionais:**
- Uma **Content Security Policy** proíbe o app de enviar dados para qualquer endereço além do Google (`googleapis.com`, `accounts.google.com`) e, na Fase 3, do `localhost` (Ollama).
- O site tem a marcação `noindex`, para não aparecer em buscadores.
- O repositório usa `.gitignore` para exportações e backups (`*.zip`, `*.json` de dados, `exports/`), além de uma verificação no GitHub Actions que bloqueia arquivos suspeitos.
- O **Client ID do Google** é público por natureza e pode ficar no código. Não existe *client secret* no app.

### 3.1 Esquema de chaves

```
Senha do app ──PBKDF2 (600.000 iterações, sal aleatório)──► Chave da senha ─┐
                                                                            ├─ protege ─► Chave dos dados (aleatória, AES-256)
Chave de recuperação (impressa) ──────────────────────────► Chave de recuperação ─┘          │
                                                                                             ▼
                                                     criptografa os registros (local e Drive)
```

- A **chave dos dados** é sorteada uma única vez. Ela é guardada "embrulhada" (criptografada) pela chave da senha e também pela chave de recuperação.
- **Trocar a senha** só reembrulha a chave dos dados. Não é preciso recriptografar tudo.
- No banco local, ficam em texto aberto apenas os campos usados como **índice** (IDs, datas e status). Nomes, dados clínicos, financeiros e de contato ficam **criptografados**.

---

## 4. Sincronização

- **Pasta no Drive:** `Facilita Psi/`, com:
  - `chaves.json`: o cofre de chaves. Contém apenas a chave dos dados embrulhada, nada legível;
  - `estado-<aparelho>.json`: uma **fotografia completa e criptografada** de tudo o que o aparelho conhece. Cada aparelho escreve só no seu arquivo, o que evita conflitos de escrita. Com o volume previsto (poucos MB), enviar a fotografia inteira é mais simples e robusto que um log de alterações;
  - `anexos/<id>.enc`: fotos e PDFs (Fase 2).
- **Como sincroniza:** baixa o estado dos outros aparelhos, mescla localmente e envia o próprio estado (implementado em `src/sincronizacao/sincronizar.ts`).
- **Quando sincroniza:** ao abrir o app, ao confirmar um registro, a cada poucos minutos com o app aberto e pelo botão "Sincronizar agora".
- **Conflitos:** cada registro tem `atualizadoEm` e `aparelho`, e **a última edição vence**. O **prontuário nunca é sobrescrito**: cada edição gera uma nova versão (RF-45), então nada se perde.
- **Indicador na tela:** "Sincronizado há X min" ou "N alterações aguardando internet".

---

## 5. Particularidades do iPhone

| Ponto | Como tratamos |
|---|---|
| Instalação | Pelo Safari: Compartilhar → "Adicionar à Tela de Início". O app mostra um tutorial na primeira abertura |
| Armazenamento | Apps instalados na tela de início têm armazenamento próprio. O app pede `navigator.storage.persist()` e sincroniza com frequência, para que o Drive seja sempre a cópia de segurança |
| Login Google em modo app | O login por *popup* pode falhar no modo instalado do iOS. Usamos o fluxo de *redirect* como alternativa. **Isso é validado na prova de conceito** |
| Sessão do Google | O token de acesso dura cerca de 1 hora. Sem servidor, pode ser preciso tocar em "Conectar ao Google" de tempos em tempos. Os dados locais continuam acessíveis sem isso |
| Ditado | O ditado do teclado do iOS funciona em qualquer campo de texto |

---

## 6. IA local (Fase 3)

- O **Ollama** é instalado no Windows com um modelo pequeno (ex.: `gemma3:4b`). A estimativa no i3-1215U é de **1 a 2 minutos por registro**.
- O app aberto **no PC** detecta o Ollama em `http://localhost:11434` e oferece "Organizar ditados pendentes".
- A configuração `OLLAMA_ORIGINS` precisa liberar o endereço do app. O navegador pode pedir permissão para acessar a rede local. **Validar no início da Fase 3.**
- O resultado é sempre um **rascunho** que ela revisa (RF-44).

---

## 7. Estrutura do repositório (proposta)

```
facilita-psi/
├── docs/                    especificação, arquitetura, guias
├── public/                  ícones, manifesto
├── src/
│   ├── app/                 rotas, layout, tema (paleta da logo)
│   ├── modulos/
│   │   ├── pacientes/
│   │   ├── agenda/
│   │   ├── sessoes/         presença, faltas, reposições
│   │   ├── prontuario/
│   │   ├── lembretes/       WhatsApp (wa.me)
│   │   ├── financeiro/      Fase 2
│   │   ├── anamnese/        Fase 2
│   │   ├── escalas/         Fase 3
│   │   └── documentos/      Fase 3
│   ├── regras/              regras de negócio puras (24h, cobrança, créditos) + testes
│   ├── dados/               banco Dexie, modelos, migrações
│   ├── seguranca/           criptografia, chaves, senha
│   └── sincronizacao/       Google Drive
└── .github/workflows/       build + deploy no GitHub Pages
```

As **regras de negócio** ficam isoladas em `src/regras/`, como funções puras com testes. Isso facilita mexer na cobrança sem quebrar a tela.

---

## 8. Plano de execução

| Etapa | Entrega | Critério de pronto |
|---|---|---|
| **0. Prova de conceito** | App mínimo, instalável, com um formulário criptografado e sincronizado | (a) instala no iPhone e no tablet; (b) login Google funciona no iPhone em modo app; (c) um dado criado offline no iPhone aparece no tablet após a sincronização; (d) os arquivos no Drive estão ilegíveis; (e) os dados continuam lá após dias sem abrir o app |
| **1. MVP (Fase 1)** | Pacientes, agenda, tela "Hoje", faltas e reposições, WhatsApp, prontuário com ditado guiado, feriados e férias, exportação | Ela usa o app no dia a dia e deixa o caderno e a planilha de presença |
| **2. Fase 2** | Financeiro, notas fiscais, anamnese, anexos | Fechamento do mês feito pelo app |
| **3. Fase 3** | Escalas e gráficos, relatório psicológico, IA local | — |

A **prova de conceito vem primeiro** porque elimina os maiores riscos técnicos (login no iPhone e sincronização) antes de se investir nas telas.

---

## 9. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Senha e chave de recuperação perdidas | Perda total dos dados | Chave de recuperação impressa no primeiro uso, mais lembretes periódicos de "Baixar meus dados" |
| Login Google instável no iPhone em modo app | Sincronização falha no celular | Fluxo de *redirect*. Validado na Etapa 0 |
| iOS apagar os dados locais | Perda das alterações ainda não sincronizadas | `storage.persist()`, sincronização frequente e indicador de pendências |
| Mudanças nas regras do Google (ex.: modo Teste) | Pode exigir um ajuste no Google Cloud | Escopo `drive.file` (não sensível) e documentação do passo a passo de configuração |
| Modelo pequeno de IA com português fraco | Rascunhos ruins (Fase 3) | A revisão é obrigatória e o ditado guiado continua disponível |
