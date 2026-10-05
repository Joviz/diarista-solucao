# AGENTS.md — Regras e Setup Padrão (React + TypeScript)

> Coloque este arquivo na raiz de todo projeto. Se usar Claude Code, renomeie ou copie como `CLAUDE.md`.
> Toda IA (e toda pessoa) que mexer no projeto deve seguir estas regras.

---

## 1. Stack oficial

| Camada                 | Escolha                                              |
| ---------------------- | ---------------------------------------------------- |
| Build                  | Vite                                                 |
| UI                     | React 18+ com componentes funcionais e hooks         |
| Linguagem              | TypeScript em modo `strict`                          |
| Estado global          | Redux Toolkit (RTK) + RTK Query                      |
| Estilo                 | Tailwind CSS                                         |
| Componentes            | shadcn/ui (Radix + Tailwind)                         |
| Formulários            | React Hook Form + Zod                                |
| Roteamento             | React Router                                         |
| Testes                 | Vitest + React Testing Library                       |
| Qualidade              | ESLint + Prettier + Husky + lint-staged + commitlint |
| Segurança              | gitleaks + npm audit + eslint-plugin-security        |
| E2E / smoke (opcional) | Playwright                                           |

Não adicione bibliotecas fora desta lista sem justificar o motivo no PR ou na conversa.

---

## 2. Setup inicial (comandos)

```bash
# 1. Projeto
npm create vite@latest meu-projeto -- --template react-ts
cd meu-projeto
npm install

# 2. Tailwind (v4 com plugin do Vite)
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node

# 3. Redux
npm install @reduxjs/toolkit react-redux

# 4. Roteamento, formulários e validação
npm install react-router-dom react-hook-form zod @hookform/resolvers

# 5. Segurança
npm install dompurify
npm install -D @types/dompurify

# 6. Qualidade
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react-hooks \
  typescript-eslint husky lint-staged

# 7. Testes
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event

# 8. shadcn/ui (depois de configurar o alias @ — veja abaixo)
npx shadcn@latest init
```

### `vite.config.ts`

```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true },
});
```

### `src/index.css`

```css
@import 'tailwindcss';
```

### `tsconfig.json` e `tsconfig.app.json` (adicionar)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Scripts do `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "audit": "npm audit --audit-level=high"
  }
}
```

---

## 3. Estrutura de pastas

Organização por **feature**, não por tipo de arquivo.

```
src/
├── app/                 # store, hooks tipados, providers, rotas
│   ├── store.ts
│   ├── hooks.ts
│   └── router.tsx
├── features/            # um diretório por funcionalidade
│   └── auth/
│       ├── components/
│       ├── authSlice.ts
│       ├── authApi.ts   # RTK Query
│       ├── schemas.ts   # Zod
│       └── types.ts
├── components/
│   └── ui/              # gerado pelo shadcn (não editar à toa)
├── lib/                 # utils (cn, formatadores, sanitize)
├── pages/               # telas ligadas às rotas
├── test/
└── main.tsx
```

Regra: uma feature não importa de dentro de outra feature. Se dois lugares precisam do mesmo código, ele sobe para `lib/` ou `components/`.

---

## 4. Regras de TypeScript

1. **Proibido `any`.** Use `unknown` e faça o narrowing, ou tipe corretamente.
2. Não use `as` para "calar" o compilador. Só use asserção quando houver garantia real (ex.: depois de validar com Zod).
3. Não use `// @ts-ignore`. Se for inevitável, use `// @ts-expect-error` com comentário explicando o porquê.
4. Tipos de dados externos (API, formulário, localStorage) vêm de **schemas Zod**: `type User = z.infer<typeof userSchema>`.
5. Prefira `type` para unions e props; `interface` quando precisar de extensão.
6. Exporte tipos explícitos nas fronteiras (funções públicas, slices, hooks).
7. Nomes: veja a seção 12 (camelCase para variáveis e funções, PascalCase para componentes e tipos).

---

## 5. Regras de React

1. Somente componentes funcionais.
2. Um componente por arquivo; se passar de ~150 linhas, divida.
3. Lógica reutilizável vai para custom hooks (`useAlgumaCoisa`).
4. Nunca use índice do array como `key` em listas dinâmicas.
5. Não use `useEffect` para derivar estado. Calcule durante o render ou use `useMemo` quando houver custo real.
6. Todo `useEffect` com subscription, timer ou fetch manual precisa de cleanup.
7. Não otimize prematuramente (`memo`, `useCallback`) sem medir.
8. Acessibilidade é obrigatória: elementos semânticos, `label` em inputs, foco visível, `alt` em imagens, navegação por teclado.
9. Trate sempre os três estados de dados: **loading, erro e vazio**.
10. Use Error Boundary nas rotas principais.

---

## 6. Regras de Redux

1. **Somente Redux Toolkit.** Nada de Redux "puro" ou `createStore`.
2. **Redux é para estado global e compartilhado** (sessão, carrinho, preferências). Estado local de UI (modal aberto, valor de input) fica em `useState`.
3. **Dados do servidor ficam no RTK Query**, não em slices escritos à mão. Nada de `createAsyncThunk` para simples GET/POST.
4. Use hooks tipados em todo lugar, nunca `useDispatch`/`useSelector` crus:

```ts
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@/features/auth/authSlice';
import { api } from '@/app/api';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```ts
// src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

5. Slices pequenos, um por feature, com `initialState` tipado.
6. Selectors ficam junto do slice e são reutilizados nos componentes.
7. **Nunca guarde no Redux** dados que não são serializáveis (funções, classes, `Date`, `File`) nem **tokens de acesso sensíveis** (veja seção de segurança).
8. Não desligue o `serializableCheck` para "resolver" um aviso. Corrija a causa.

---

## 7. Regras de Tailwind + shadcn/ui

1. **Use os componentes do shadcn primeiro** (`Button`, `Input`, `Dialog`, `Form`, `Table`...). Só crie um componente do zero se o shadcn não tiver equivalente.
2. Adicione componentes com `npx shadcn@latest add <componente>`. Não copie código de outros lugares.
3. Estilo apenas com classes do Tailwind. Nada de CSS inline, `styled-components` ou arquivos `.css` por componente.
4. Use **tokens de tema** (`bg-background`, `text-foreground`, `bg-primary`, `border-border`) em vez de cores fixas (`bg-blue-500`). Isso mantém dark mode e identidade visual consistentes.
5. Use `cn()` (de `@/lib/utils`) para combinar classes condicionais.
6. Variações de componente com `cva` (class-variance-authority), não com `if` espalhado.
7. Mobile first: escreva a base para celular e use `sm:`, `md:`, `lg:` para telas maiores.
8. Evite valores arbitrários (`w-[437px]`). Use a escala do Tailwind; se precisar repetir, vire token no tema.
9. Componentes em `components/ui/` são a "biblioteca base". Personalizações vão em wrappers, não direto no arquivo gerado.

---

## 8. Segurança (inegociável)

### Segredos e configuração

1. **Nenhum segredo no front-end.** Tudo que vai para o bundle é público. Chaves de API privadas ficam em um backend/proxy.
2. Variáveis `VITE_*` são **públicas**. Nunca coloque senha, token privado ou chave secreta nelas.
3. `.env` no `.gitignore`. Versione somente `.env.example` com valores falsos.
4. Nunca cole segredos reais em prompts de IA, issues ou logs.

### Autenticação e sessão

5. Tokens de sessão em **cookie `HttpOnly`, `Secure`, `SameSite`**, definido pelo backend. Evite `localStorage` para tokens.
6. No Redux guarde apenas dados não sensíveis do usuário (id, nome, papéis), nunca o token.
7. Autorização real acontece no servidor. Esconder um botão no front **não é** controle de acesso.
8. Em requisições que alteram estado, use proteção CSRF (token ou `SameSite` bem configurado).

### Entrada e saída de dados

9. **Valide toda entrada com Zod**, tanto formulários quanto respostas de API que você não controla.
10. **Proibido `dangerouslySetInnerHTML`** sem sanitizar com DOMPurify:

```ts
import DOMPurify from 'dompurify';
export const sanitize = (html: string) => DOMPurify.sanitize(html);
```

11. Nunca use `eval`, `new Function` ou `innerHTML` direto.
12. URLs vindas do usuário: valide o protocolo (somente `http:` e `https:`), para evitar `javascript:`.
13. Links externos com `target="_blank"` sempre com `rel="noopener noreferrer"`.
14. Não registre em log dados pessoais, tokens ou senhas.

### Headers e rede

15. Em produção, configure no servidor/CDN: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `frame-ancestors`/`X-Frame-Options`.
16. Somente HTTPS. Configure CORS com origens explícitas, nunca `*` em API autenticada.

### Dependências e supply chain

17. Commite o `package-lock.json`. Instale com `npm ci` no CI.
18. Rode `npm audit --audit-level=high` no CI e antes de cada release.
19. **Antes de instalar qualquer pacote sugerido por IA, confirme que ele existe, é mantido e tem boa reputação** (nome, downloads, repositório, última publicação). IAs podem inventar nomes de pacotes, e atacantes registram esses nomes com código malicioso.
20. Prefira poucas dependências, bem mantidas. Avalie se dá para resolver com o que já temos.
21. Ative o Dependabot ou Renovate.

---

## 9. Regras para a IA que escreve código

Estas regras valem para o Claude e qualquer outro assistente neste projeto:

1. **Leia antes de escrever.** Entenda a estrutura e os padrões existentes e siga-os.
2. **Mudanças pequenas e focadas.** Não refatore partes que não foram pedidas.
3. **Não invente APIs, props ou pacotes.** Se não tiver certeza, diga e verifique na documentação.
4. **Não afrouxe configurações** (strict, ESLint, regras de segurança) para fazer algo passar.
5. **Nunca coloque segredos reais, chaves ou dados de clientes no código ou nos exemplos.**
6. Entregue código **tipado, acessível e com os estados de loading/erro/vazio**.
7. Siga sempre o ciclo da seção 10: pré-escrita, implementação, `npm run verify`, teste de segurança e commit antes de começar a próxima etapa. Informe o resultado de cada verificação.
8. Se a tarefa for ambígua ou tocar em segurança/autenticação, **pergunte antes de assumir**.
9. Explique decisões não óbvias em comentários curtos, e diga o que ficou de fora.
10. Todo código gerado por IA passa por **revisão humana** antes do merge, com atenção redobrada em autenticação, pagamentos e acesso a dados.

---

## 10. Fluxo de trabalho por etapas (obrigatório)

Todo trabalho é dividido em **etapas pequenas**. Cada etapa segue sempre este ciclo, sem pular nenhum passo:

```
PRÉ-ESCRITA → IMPLEMENTAR → PORTÃO DE VERIFICAÇÃO → TESTE DE SEGURANÇA → COMMIT → PRÓXIMA ETAPA
```

**Regra de ouro: se qualquer verificação falhar, a próxima etapa NÃO começa.** Corrija primeiro.

### 10.1 Pré-escrita (antes de escrever qualquer código)

1. `git status` limpo e na branch correta (`feat/...`, `fix/...`). Nunca trabalhar direto na `main`.
2. Dependências em dia: `npm ci`.
3. **Linha de base verde:** rodar `npm run verify`. Se já estiver quebrado antes de começar, corrigir isso primeiro.
4. Subir o app (`npm run dev`) e confirmar que abre sem erro no terminal e no console do navegador.
5. Ler os arquivos relacionados à etapa e seguir os padrões existentes.
6. Anunciar o plano da etapa em poucas linhas (o que será feito e como será testado).

### 10.2 Portão de verificação (ao fim de cada etapa)

```bash
npm run verify
```

Que executa, em ordem: `typecheck` → `lint` → `test` → `build` → `audit` → `security`.

Além dos comandos, é obrigatório um **teste de fumaça (smoke test)**:

1. Rodar o app com `npm run build && npm run preview` e abrir a rota principal e as rotas alteradas.
2. Confirmar: sem erros no console, sem requisições falhando (4xx/5xx inesperadas), fluxo principal da etapa funcionando.
3. **Verificação online:** quando houver deploy (preview, staging ou produção), rodar o smoke test contra a URL pública:

```bash
bash scripts/smoke.sh https://seu-app.exemplo.com
```

4. Se alguma etapa envolve backend/API, testar também o endpoint real (status, formato da resposta, erros).

### 10.3 Scripts e hooks

`package.json`:

```json
{
  "scripts": {
    "test:run": "vitest run",
    "security": "bash scripts/securityCheck.sh",
    "verify": "npm run typecheck && npm run lint && npm run test:run && npm run build && npm run audit && npm run security"
  }
}
```

Hooks do Husky (`npx husky init`):

```bash
# .husky/pre-commit  — roda antes de cada commit
npx lint-staged
npm run typecheck
gitleaks protect --staged --no-banner

# .husky/commit-msg — valida a mensagem de commit
npx --no -- commitlint --edit $1

# .husky/pre-push    — roda antes de cada push
npm run verify
```

Commitlint (`npm i -D @commitlint/cli @commitlint/config-conventional`):

```js
// commitlint.config.js
export default { extends: ['@commitlint/config-conventional'] };
```

Smoke test online (`scripts/smoke.sh`):

```bash
#!/usr/bin/env bash
set -euo pipefail
url="${1:?Informe a URL. Ex.: bash scripts/smoke.sh https://meu-app.com}"

status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
[ "$status" = "200" ] || { echo "FALHOU: status $status em $url"; exit 1; }

headers=$(curl -sI "$url")
for h in "content-security-policy" "strict-transport-security" "x-content-type-options" "referrer-policy"; do
  echo "$headers" | grep -qi "^$h" || { echo "FALHOU: header ausente -> $h"; exit 1; }
done

echo "OK: $url respondeu 200 e os headers de segurança estão presentes."
```

---

## 11. Commits (a cada progresso significativo)

1. **Faça commit sempre que uma etapa passar no portão de verificação.** Nunca acumule horas de trabalho em um commit só.
2. **Nunca commite código quebrado**, com teste falhando ou com segredo.
3. Commits pequenos e atômicos: uma mudança lógica por commit.
4. Padrão **Conventional Commits**: `tipo(escopo): descrição`

| Tipo       | Quando usar                                                  |
| ---------- | ------------------------------------------------------------ |
| `feat`     | Nova funcionalidade                                          |
| `fix`      | Correção de bug                                              |
| `chore`    | Manutenção: dependências, configs, scripts, tarefas internas |
| `docs`     | Somente documentação                                         |
| `refactor` | Reorganiza o código sem mudar o comportamento                |
| `test`     | Cria ou ajusta testes                                        |
| `style`    | Formatação, sem mudança de lógica                            |
| `perf`     | Melhoria de desempenho                                       |
| `ci`       | Pipeline e automações                                        |
| `security` | Correção ou reforço de segurança                             |

5. Descrição no imperativo, em minúsculas, até 72 caracteres, sem ponto final.

```
feat(auth): add login form with zod validation
fix(cart): prevent negative quantity on update
chore(deps): update reduxjs/toolkit to latest minor
security(api): remove token from localStorage
docs(readme): add setup instructions
```

6. Nunca usar `git push --force` em branch compartilhada nem `--no-verify` para pular os hooks.

---

## 12. Clean code e convenções de nome

### Nomes (camelCase)

- **Variáveis, funções e arquivos que não são componentes:** `camelCase` (`userName`, `getUserById`, `authSlice.ts`).
- **Componentes React e tipos:** `PascalCase` (`LoginForm.tsx`, `type UserProfile`). É exigência do React para componentes.
- **Constantes globais:** `UPPER_SNAKE_CASE` (`MAX_LOGIN_ATTEMPTS`).
- **Booleanos:** prefixo `is`, `has`, `can`, `should` (`isLoading`, `hasError`).
- **Handlers:** `handleSubmit`, `handleClick`. **Hooks:** `useAuth`, `useCart`.
- Nomes completos e que revelam intenção. Nada de `x`, `tmp`, `data2`, `doStuff`.

### Princípios

1. **Funções pequenas** que fazem uma coisa só (ideal até ~20 linhas, no máximo 3 parâmetros; acima disso, use um objeto).
2. **Retorno antecipado (early return)** em vez de `if` aninhado. Evite mais de 2 níveis de indentação.
3. **Sem números ou textos mágicos:** extraia para constantes nomeadas.
4. **DRY:** não duplique lógica. Extraia quando se repetir pela terceira vez.
5. **Sem código morto:** apague código comentado, imports e variáveis não usados.
6. **Comentários explicam o "porquê"**, não o "o quê". Se precisou comentar o que o código faz, renomeie ou refatore.
7. **Tratamento de erro explícito:** nunca engula erro com `catch {}` vazio.
8. **Imutabilidade:** não altere objetos ou arrays recebidos (o RTK/Immer só vale dentro de reducers).
9. Componentes de apresentação separados da lógica (hooks/serviços).
10. Deixe o código mais limpo do que encontrou (regra do escoteiro), sem sair do escopo da tarefa.

---

## 13. Testes de segurança (sempre que possível)

O objetivo é **garantir que nada vaze**. Estes testes rodam em `npm run security`, no pre-commit e no CI.

### Ferramentas

- **gitleaks:** procura segredos no código e no histórico do git.
- **npm audit:** vulnerabilidades em dependências.
- **eslint-plugin-security:** padrões inseguros no código.
- **Testes unitários de XSS/validação:** entradas maliciosas não podem ser renderizadas nem aceitas.
- **Playwright (opcional):** smoke e2e e checagem de headers/cookies.

`npm i -D eslint-plugin-security @playwright/test` e instale o gitleaks (`brew install gitleaks` ou binário oficial).

### `scripts/securityCheck.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
fail=0

echo "→ Procurando segredos (gitleaks)..."
gitleaks detect --no-banner --redact || fail=1

echo "→ Verificando se algum .env real está versionado..."
if git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.example$'; then
  echo "ERRO: arquivo .env versionado."; fail=1
fi

echo "→ Procurando segredos no bundle de produção (dist/)..."
if [ -d dist ]; then
  if grep -rEn "(sk_live_|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |EC )?PRIVATE KEY|ghp_[A-Za-z0-9]{30,})" dist; then
    echo "ERRO: possível segredo no bundle."; fail=1
  fi
  if find dist -name "*.map" | grep -q .; then
    echo "ERRO: source maps publicados em produção."; fail=1
  fi
fi

echo "→ Procurando padrões perigosos no código..."
if grep -rEn "dangerouslySetInnerHTML|eval\(|new Function\(|\.innerHTML\s*=" src --include=*.ts --include=*.tsx \
   | grep -v "sanitize"; then
  echo "AVISO: uso de API perigosa sem sanitização. Revise."; fail=1
fi

[ "$fail" = "0" ] && echo "OK: nenhuma falha de segurança encontrada." || exit 1
```

### Configurações que o teste espera

- `vite.config.ts` com `build: { sourcemap: false }` em produção.
- ESLint com `eslint-plugin-security` ativado.
- Teste unitário para cada campo de entrada de usuário verificando que `<script>` e `javascript:` não passam.
- Tokens nunca em `localStorage`, `sessionStorage`, logs ou Redux.

### Se um teste de segurança falhar

1. **Pare tudo.** Não commite nem faça push.
2. Se vazou um segredo que já foi commitado ou publicado: **considere-o comprometido**. Revogue e gere outro imediatamente (apagar do histórico não basta).
3. Corrija a causa, rode `npm run verify` e registre com `security(...)`.

---

## 14. Checklist de novo projeto

- [ ] Vite + React + TS com `strict` ligado
- [ ] Tailwind e shadcn configurados, alias `@` funcionando
- [ ] Redux Toolkit com hooks tipados e RTK Query base
- [ ] ESLint (com `security`), Prettier, Husky, lint-staged e commitlint ativos
- [ ] Hooks: `pre-commit`, `commit-msg`, `pre-push` criados
- [ ] Scripts `verify`, `security` e `scripts/smoke.sh` criados
- [ ] gitleaks instalado
- [ ] `.env` ignorado e `.env.example` criado
- [ ] `sourcemap: false` em produção
- [ ] CI com `npm ci` → typecheck → lint → test → build → audit → security
- [ ] Smoke test automático contra a URL publicada após o deploy
- [ ] Headers de segurança configurados no deploy
- [ ] Este `AGENTS.md` na raiz
