# Agenda da Diarista

Sistema web mobile-first para uma diarista organizar atendimentos, acompanhar valores previstos/recebidos/pendentes/cancelados, preparar confirmações WhatsApp e fechar balanço mensal.

## 🚀 Tecnologias

- **React 18** + **TypeScript** + **Vite**
- **Redux Toolkit** - Gerenciamento de estado
- **React Router v7** - Roteamento
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de UI
- **React Hook Form + Zod** - Formulários e validação
- **Firebase Auth + Firestore** - Autenticação e banco de dados
- **Vitest** - Testes unitários
- **Playwright** - Testes E2E

## ✨ Funcionalidades

### 📅 Agenda

- Visualização semanal (7 dias) com navegação entre semanas
- Visualização mensal (calendário) com valores por dia
- Seleção de dia para ver detalhes
- Cards de atendimento com: cliente, endereço, horário, valor, situação
- Ações: WhatsApp, Editar, Excluir

### 📊 Resumo Mensal

- Cards: Previsto, Recebido, Pendente, Cancelados, Dias Trabalhados
- Barra de progresso (Recebido vs Previsto)
- Navegação entre meses
- Formulário para novo atendimento rápido

### 💰 Fechamento Mensal

- Lista de atendimentos do mês com filtros por situação
- Ações inline: Marcar Realizado, Cancelar, Marcar Pago, Reativar, Desfazer Pagamento
- Registro de pagamento (valor + data)
- Aba Histórico completo
- Totais consistentes com Resumo

### 🔐 Autenticação

- Login com Google (Firebase Auth)
- Sessão persistente
- Logout
- Proteção de rotas

### 💾 Persistência

- Firestore com regras por usuário (`userId`)
- Sincronização em tempo real (onSnapshot)
- IDs de documento preservados nas atualizações
- Exclusão real no Firestore

## 🛠️ Setup Local

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Firebase CLI (para emuladores)
- Java 21+ (para Firebase Emulator)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Joviz/diarista-solucao.git
cd diarista-solucao

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Firebase

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente (.env)

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# Para desenvolvimento com emuladores (opcional)
VITE_USE_EMULATORS=true
```

### Firebase Emulator (Desenvolvimento)

```bash
# Instale Firebase CLI
npm install -g firebase-tools

# Inicie emuladores (Auth + Firestore)
firebase emulators:start --only auth,firestore

# Em outro terminal, inicie o app com emuladores
VITE_USE_EMULATORS=true npm run dev
```

## 📜 Scripts Disponíveis

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run preview    # Preview do build
npm run typecheck  # Verificação TypeScript
npm run lint       # ESLint
npm run test       # Testes unitários (Vitest)
npm run test:run   # Testes unitários (modo CI)
npx playwright test # Testes E2E
npm run verify     # Pipeline completo (typecheck + lint + test + build + audit + security)
```

## 🧪 Testes

### Unitários (Vitest)

```bash
npm run test:run
# 9 testes passando
```

### E2E (Playwright)

```bash
# Requer Firebase Emulator rodando
firebase emulators:start --only auth,firestore --project demo-test
npx playwright test
```

**Testes disponíveis:**

- `tests/app.spec.ts` - Tela de login
- `tests/atendimento.spec.ts` - Criação e validação de atendimentos
- `tests/persistence.spec.ts` - Fluxo completo de persistência (cancelar, reativar, pagar, desfazer, excluir)

## 🔥 Firebase Setup

### 1. Crie projeto no [Firebase Console](https://console.firebase.google.com)

### 2. Ative Authentication

- Sign-in method → Google → Habilitado
- Authorized domains → Adicione `localhost` e domínios Vercel

### 3. Crie Firestore Database

- Modo de teste (regras serão publicadas depois)
- Localização mais próxima

### 4. Publique Regras de Segurança

```bash
firebase deploy --only firestore:rules
```

**Regras (`firestore.rules`):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /atendimentos/{document} {
      allow read, delete: if request.auth != null
                          && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null
                    && request.auth.uid == resource.data.userId
                    && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. Configure Vercel

1. Conecte repositório GitHub
2. Adicione variáveis de ambiente (Preview + Production):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_USE_EMULATORS=false` (importante!)
3. Deploy automático no push para `main`

## 📱 Funcionalidades Principais

### Fluxo de Atendimento

```
Previsto → Realizado → Pago
    ↓           ↓
Cancelado ← Desfazer
```

### Estados de Situação

| Situação      | Descrição                      | Conta no Resumo                             |
| ------------- | ------------------------------ | ------------------------------------------- |
| **Previsto**  | Agendado, não realizado        | Previsto, Pendente                          |
| **Realizado** | Serviço feito, não pago        | Previsto, Pendente                          |
| **Pago**      | Serviço feito + pago           | Previsto, Recebido                          |
| **Cancelado** | Cancelado pelo cliente/usuário | Cancelados (não conta em Previsto/Recebido) |

### Confirmação WhatsApp

Gera mensagem: _"Oi [Cliente], [dia] às [hora] estarei aí para a diária. Tudo certo?"_
Abre WhatsApp Web/App para envio manual.

### Navegação

- **Bottom Navigation** (mobile): Resumo | Agenda | Fechamento
- **Header**: Título + Menu do usuário (avatar + logout)
- **Agenda**: Toggle Semana/Mês + navegação + seletor mês/ano (popover)

## 🎨 Identidade Visual

- **Base**: Branco/Off-white (`#fafafa`)
- **Primária (Ações/Recebidos)**: Verde (`#16a34a`)
- **Secundária/Destaque**: Lilás (`#a855f7`)
- **Destructive/Cancelado**: Vermelho (`#ef4444`)
- **Warning/Pendente**: Amarelo (`#f59e0b`)

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── hooks.ts          # Typed Redux hooks
│   ├── router.tsx        # Rotas + guards
│   └── store.ts          # Redux store
├── components/
│   ├── ui/               # shadcn/ui components
│   └── Layout.tsx        # Layout + navegação
├── context/
│   ├── AuthContext.tsx   # Firebase Auth
│   └── DataContext.tsx   # Firestore sync + CRUD
├── features/
│   └── atendimentos/
│       ├── atendimentosSlice.ts  # Redux slice
│       ├── schemas.ts            # Zod schemas
│       ├── selectors.ts          # Memoized selectors
│       ├── types.ts              # Types
│       └── components/
│           └── AtendimentoForm.tsx
├── lib/
│   ├── firebase.ts       # Firebase config + emulators
│   ├── emulator.ts       # Emulator config
│   └── utils.ts          # Helpers (format, dates, etc)
├── pages/
│   ├── ResumoPage.tsx
│   ├── AgendaPage.tsx
│   ├── FechamentoPage.tsx
│   └── LoginPage.tsx
└── main.tsx
```

## 🔒 Segurança

- **Firestore Rules**: Acesso apenas ao próprio usuário (`userId`)
- **Auth**: Google OAuth via Firebase Auth
- **Variáveis sensíveis**: Apenas via `.env` (não commitado)
- **CSP**: Configurado via meta tags + Vite
- **HTTPS**: Obrigatório em produção (Vercel)

## 📦 Deploy

### Vercel (Recomendado)

1. Conecte repositório GitHub na Vercel
2. Configure variáveis de ambiente (Preview + Production)
3. **Importante**: `VITE_USE_EMULATORS=false` em ambos ambientes
4. Deploy automático no push para `main`

### Variáveis Vercel

| Variável                            | Preview | Production |
| ----------------------------------- | ------- | ---------- |
| `VITE_FIREBASE_API_KEY`             | ✅      | ✅         |
| `VITE_FIREBASE_AUTH_DOMAIN`         | ✅      | ✅         |
| `VITE_FIREBASE_PROJECT_ID`          | ✅      | ✅         |
| `VITE_FIREBASE_STORAGE_BUCKET`      | ✅      | ✅         |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅      | ✅         |
| `VITE_FIREBASE_APP_ID`              | ✅      | ✅         |
| `VITE_USE_EMULATORS`                | `false` | `false`    |

## 📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido para diaristas organizarem sua agenda de forma simples, prática e visual.** 🧹✨
