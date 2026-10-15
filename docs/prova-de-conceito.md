# Etapa 0: prova de conceito

Objetivo: validar os maiores riscos técnicos **antes** de construir as telas do MVP (ver [`arquitetura.md`](arquitetura.md), seção 8).

O app desta etapa tem apenas:
- criação do cofre (senha do app + chave de recuperação);
- desbloqueio com senha ou chave de recuperação;
- **anotações de teste** criptografadas (título e texto);
- sincronização com o Google Drive;
- um painel de **diagnóstico** (modo instalado, armazenamento persistente, método de login).

> Use apenas **dados fictícios** nesta etapa. Nenhum paciente real.

---

## 1. Rodar no computador

```bash
npm install
npm run dev
```

Abra <http://localhost:5173>. Sem o Client ID configurado, o app funciona, mas só neste aparelho.

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm test` | Testes automáticos (criptografia e mesclagem da sincronização) |
| `npm run lint` | Verificação de qualidade do código |
| `npm run build` | Gera a versão de produção em `dist/` |

## 2. Publicar no GitHub Pages

Celulares e tablets só instalam o app a partir de um endereço **https**, então os testes nos aparelhos usam a versão publicada.

1. Crie o repositório **público** `facilita-psi` no GitHub e envie o código (branch `main`).
2. No repositório → **Settings** → **Pages** → Source: **GitHub Actions**.
3. Siga o [`guia-google-cloud.md`](guia-google-cloud.md) e cadastre a variável `VITE_GOOGLE_CLIENT_ID`.
4. Cada envio à `main` publica o app automaticamente em `https://SEU-USUARIO.github.io/facilita-psi/`.
   - Antes de publicar, o deploy **bloqueia** arquivos com cara de dado ou segredo (`scripts/verificar-dados.sh`) e roda os testes.

## 3. Instalar nos aparelhos

- **iPhone:** abra o endereço no **Safari** → botão Compartilhar → **Adicionar à Tela de Início**. Depois, abra sempre pelo ícone.
- **Galaxy Tab S9+:** abra no **Chrome** → menu ⋮ → **Instalar app** (ou "Adicionar à tela inicial").
- **Computador Windows:** abra no **Chrome** ou no **Edge** → ícone de instalar na barra de endereço.

---

## 4. Roteiro de testes (critérios de pronto)

Marque cada item ao concluir. Anote o aparelho e a data.

### (a) Instala no iPhone e no tablet
- [ ] O ícone do Facilita Psi aparece na tela inicial dos dois aparelhos.
- [ ] Ao abrir pelo ícone, o Diagnóstico mostra **"Aberto como app instalado: sim"**.

### (b) Login Google funciona no iPhone em modo app
1. No iPhone (pelo ícone): **Primeiro aparelho** → crie a senha → **guarde a chave de recuperação**.
2. Toque em **Conectar ao Google** e entre com a conta da psicóloga.
- [ ] Voltou para o app com a conta conectada e **"Sincronizado"**.
- Se falhar: em Diagnóstico, troque o método de login (Popup ↔ Redirecionamento) e tente de novo. **Anote qual método funcionou.**

### (c) Um dado criado offline no iPhone aparece no tablet
1. No tablet (pelo ícone): **Já uso em outro aparelho** → Conectar ao Google → digite a mesma senha.
2. No iPhone, ative o **modo avião** e crie uma anotação. Use o **microfone do teclado** para ditar o texto.
- [ ] A anotação aparece no iPhone com o selo **"1 aguardando envio"**.
3. Desative o modo avião e aguarde (ou toque em **Sincronizar agora**).
- [ ] O selo muda para **"tudo enviado"**.
4. No tablet, toque em **Sincronizar agora**.
- [ ] A anotação aparece com "Escrita no iPhone".
5. Exclua a anotação no tablet e sincronize os dois.
- [ ] Ela some também no iPhone.

### (d) Os arquivos no Drive estão ilegíveis
1. Abra <https://drive.google.com> → pasta **Facilita Psi**.
- [ ] Existem `chaves.json` e um `estado-….json` para cada aparelho.
- [ ] Abrindo um `estado-….json`, só aparecem códigos (`"iv"`, `"ct"`), nunca o texto das anotações.

### (e) Os dados continuam lá após dias sem abrir o app
1. No iPhone, em Diagnóstico, toque em **Pedir** ao lado de "Armazenamento persistente".
2. Deixe o iPhone **10 dias** sem abrir o app.
- [ ] Ao abrir, as anotações continuam lá **antes** de sincronizar (teste com o modo avião ligado).

### Extras
- [ ] **Senha errada** é recusada, e a **chave de recuperação** abre o app.
- [ ] O **ditado pelo teclado** funciona em português no iPhone e no tablet, inclusive no modo avião. Anote a qualidade.
- [ ] A conta Google de **outra pessoa** é recusada no login (deve aparecer "acesso negado").

---

## 5. Resultado

| Critério | iPhone | Tablet | Observações |
|---|---|---|---|
| (a) Instalação | | | |
| (b) Login Google | | — | Método que funcionou: |
| (c) Sincronização offline → online | | | |
| (d) Drive ilegível | | | |
| (e) Persistência após dias | | | |

Com todos os itens aprovados, partimos para o **MVP (Fase 1)**. Se algum falhar, ajustamos a arquitetura antes de construir as telas.
