# Guia: configurar o Google Cloud (uma única vez)

Este passo libera o app para guardar os arquivos criptografados no Google Drive da psicóloga. É **gratuito** e não pede cartão de crédito.

> Faça este passo logado com a **conta Google da psicóloga** (a mesma do Drive onde os dados vão ficar).
> Os nomes dos menus podem variar um pouco. O Google muda o console com frequência.

Antes de começar, tenha à mão:
- **seu usuário do GitHub** (ex.: `seu-usuario`). O app ficará em `https://SEU-USUARIO.github.io/facilita-psi/`;
- o **e-mail Google da psicóloga**.

---

## 1. Criar o projeto

1. Acesse <https://console.cloud.google.com>.
2. No topo, clique no seletor de projetos → **Novo projeto**.
3. Nome: `Facilita Psi`. Clique em **Criar** e depois selecione o projeto criado.

## 2. Ativar a API do Google Drive

1. Menu ☰ → **APIs e serviços** → **Biblioteca**.
2. Pesquise **Google Drive API** → **Ativar**.

## 3. Configurar a tela de consentimento

1. Menu ☰ → **Google Auth Platform** (ou **APIs e serviços → Tela de consentimento OAuth**) → **Começar**.
2. **Informações do app:** nome `Facilita Psi`, e-mail de suporte = o e-mail da psicóloga.
3. **Público:** escolha **Externo**.
4. **Dados de contato:** o e-mail da psicóloga → **Criar**.

## 4. Restringir o acesso só à psicóloga

Esta etapa é a que garante que **nenhuma outra conta Google** consegue usar o app.

1. Em **Público**, confirme que o status é **"Em teste"** (*Testing*). **Não** clique em "Publicar app".
2. Em **Usuários de teste** → **Adicionar usuários** → digite o e-mail da psicóloga → **Salvar**.
   - Se você também for testar com a sua conta, adicione a sua. Depois dos testes, **remova-a**.

## 5. Declarar o escopo do Drive

1. Em **Acesso a dados** → **Adicionar ou remover escopos**.
2. Marque (ou cole em "Adicionar escopos manualmente"): `https://www.googleapis.com/auth/drive.file`.
3. **Atualizar** → **Salvar**.

Esse escopo só dá acesso aos arquivos que o próprio Facilita Psi criar. O app **não** enxerga o restante do Drive.

## 6. Criar o Client ID

1. Em **Clientes** → **Criar cliente**.
2. Tipo de aplicativo: **Aplicativo da Web**. Nome: `Facilita Psi`.
3. **Origens JavaScript autorizadas** → adicione:
   - `http://localhost:5173`
   - `https://SEU-USUARIO.github.io`
4. **URIs de redirecionamento autorizados** → adicione (com a barra no final):
   - `http://localhost:5173/`
   - `https://SEU-USUARIO.github.io/facilita-psi/`
5. **Criar** e copie o **ID do cliente** (termina em `.apps.googleusercontent.com`).

> O Client ID **não é segredo**: ele aparece no código do site de qualquer app que usa login do Google. O que protege os dados é a lista de usuários de teste (passo 4), o Drive privado e a senha do app. **Não** é preciso o "client secret", então não o copie para lugar nenhum.

## 7. Informar o Client ID ao app

**No GitHub (para o app publicado):**
1. No repositório → **Settings** → **Secrets and variables** → **Actions** → aba **Variables** → **New repository variable**.
2. Nome: `VITE_GOOGLE_CLIENT_ID`. Valor: o ID copiado.
3. Rode o deploy de novo (aba **Actions** → "Publicar no GitHub Pages" → **Run workflow**).

**No computador (para desenvolvimento):**
1. Copie `.env.example` para `.env.local`.
2. Preencha `VITE_GOOGLE_CLIENT_ID=` com o ID. O `.env.local` não vai para o Git.

---

## O que esperar no primeiro login

Como o app está em modo de teste, o Google mostra o aviso **"O Google não verificou este app"**. Isso é normal. Clique em **Avançado** → **Acessar Facilita Psi** → marque a permissão do Drive → **Continuar**.

Se aparecer **"Erro 403: access_denied"**, o e-mail usado não está na lista de usuários de teste (passo 4).
