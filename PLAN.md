# PLAN.md — Agenda da Diarista

## Resumo do Projeto

Sistema web mobile-first para uma diarista organizar atendimentos, acompanhar valores previstos/recebidos/pendentes/cancelados, preparar confirmações WhatsApp e fechar balanço mensal. Stack: React 18 + TypeScript + Vite + Redux Toolkit + Tailwind CSS + shadcn/ui + React Router + React Hook Form + Zod + Vitest.

## Funcionalidades (checklist)

- [x] Resumo mensal com totais: previsto, recebido, pendente, cancelamentos + indicador de progresso
- [x] Agenda semanal navegável (avançar/voltar semana, selecionar dia)
- [x] Cadastro/edição de atendimentos (cliente, endereço, data, horário, duração, valor, situação, observação, data/valor recebido)
- [x] Confirmação WhatsApp com mensagem pré-preenchida
- [x] Fechamento mensal: listar atendimentos, atualizar situação (realizado, pago, pendente, cancelado), registrar valor/data recebimento
- [x] Balanço mensal consistente com resumo
- [x] Histórico por mês e situação
- [x] Estados vazios, mensagens claras em PT-BR, identidade visual (branco, verde, lilás)
- [x] Dados demonstrativos iniciais

## Fora de Escopo

- Autenticação/login
- Múltiplas diaristas/usuários
- Backend/API externo (dados em localStorage via Redux persist)
- Notificações push
- Exportação PDF/Excel
- Modo escuro (opcional, não obrigatório)

## Etapas de Execução

### Etapa 1: Setup do Projeto e Configuração Base ✅

**Especialista:** frontend  
**Critério de Pronto:** Projeto Vite + React + TS rodando, Tailwind + shadcn configurados, alias @ funcionando, ESLint/Prettier/Husky ativos, scripts verify/security/build/test funcionando, commit inicial.

### Etapa 2: Estrutura de Dados e Store (Redux) ✅

**Especialista:** frontend  
**Critério de Pronto:** Types/Interfaces definidas, Zod schemas para validação, Redux slice de atendimentos com CRUD, persistência no localStorage, seletores para totais mensais/semanais, dados demonstrativos carregados no primeiro acesso.

### Etapa 3: Roteamento e Layout Principal ✅

**Especialista:** frontend  
**Critério de Pronto:** React Router configurado com 3 rotas principais (/resumo, /agenda, /fechamento), navegação inferior (bottom nav) mobile-first, layout responsivo, header com mês atual e seletor de mês.

### Etapa 4: Tela de Resumo Mensal ✅

**Especialista:** frontend  
**Critério de Pronto:** Exibe mês selecionado, cards de total previsto/recebido/pendente/cancelados, barra de progresso previsto vs recebido, navegação entre meses, estado vazio com atalho para adicionar primeiro atendimento.

### Etapa 5: Agenda Semanal ✅

**Especialista:** frontend  
**Critério de Pronto:** Visualização de 7 dias com atendimentos do dia, navegação semana anterior/próxima, cards de atendimento com cliente, endereço, horário, valor, situação, ações (detalhes, editar, WhatsApp), estado vazio por dia.

### Etapa 6: Formulário de Cadastro/Edição de Atendimento ✅

**Especialista:** frontend  
**Critério de Pronto:** Modal/Dialog com React Hook Form + Zod, todos os campos obrigatórios/opcionais, validação em tempo real, salvar atualiza Redux e fecha modal, edição pré-preenche campos, mensagens de erro claras.

### Etapa 7: Confirmação WhatsApp ✅

**Especialista:** frontend  
**Critério de Pronto:** Botão em atendimentos futuros abre WhatsApp com mensagem formatada "Oi, [dia] às [hora] estarei aí para a diária. Tudo certo?", não indica envio automático.

### Etapa 8: Fechamento Mensal e Balanço ✅

**Especialista:** frontend  
**Critério de Pronto:** Lista atendimentos do mês com filtros por situação, ações inline para marcar realizado/pago/pendente/cancelado, registrar valor/data recebimento, recalcula totais em tempo real, balanço consistente com resumo.

### Etapa 9: Histórico ✅

**Especialista:** frontend  
**Critério de Pronto:** Consulta atendimentos anteriores por mês e situação, mostra dados essenciais + info pagamento/cancelamento, navegação simples.

### Etapa 10: Testes, Qualidade e Revisão Final ✅

**Especialista:** qa + seguranca + revisor  
**Critério de Pronto:** npm run verify passa (typecheck, lint, test, build, audit, security), smoke test manual funcionando, revisor aprova fluxo completo.

---

**Progresso:** Todas as etapas concluídas ✅
