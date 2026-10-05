# Time de agentes — Projeto de Agenda e Valores de Servicos

Este diretorio configura um time de agentes autonomo no OpenCode, usando modelos Nemotron, para construir o projeto do inicio ao fim com a minima interrupcao possivel.

## Como funciona, resumido

Voce fala uma vez com o `orquestrador` (agente primario) descrevendo o projeto. Ele:

1. Aciona o `planejador`, que escreve o `PLAN.md` com todas as funcionalidades e as etapas.
2. Para cada etapa, aciona o especialista certo (`banco-de-dados`, `backend` ou `frontend`), depois sempre `seguranca` e `qa`, corrige o que falhar, comita e segue.
3. No final, aciona o `revisor`, que testa o projeto inteiro de ponta a ponta como um usuario real faria.
4. So entao te devolve a palavra, com um resumo do que foi entregue e pedindo a sua aprovacao final.

Voce so e interrompido durante o processo se faltar uma credencial sua, se o pedido for ambiguo a ponto de mudar o projeto inteiro, ou se uma mesma etapa falhar 3 vezes seguidas.

## Como usar

1. Copie a pasta `.opencode` e o arquivo `opencode.json` para a raiz do seu projeto (onde ja esta o `AGENTS.md`).
2. Configure a chave de acesso aos modelos Nemotron (via NVIDIA NIM, Zen da OpenCode, ou o endpoint que voce estiver usando) nas variaveis de ambiente do OpenCode.
3. No VS Code, abra o terminal integrado e rode o OpenCode no diretorio do projeto.
4. Fale com o agente `orquestrador` (ele e o padrao) e descreva o projeto, por exemplo: "Quero um sistema de agenda para um salao com um prestador, cadastro de servicos com preco e duracao, agendamento de clientes evitando horarios conflitantes e um resumo dos valores do mes."
5. Deixe o time trabalhar. Acompanhe pelas mensagens curtas de progresso por etapa, se quiser.
6. No final, o `revisor` te entrega o resumo. Teste voce mesmo e aprove ou aponte o que faltou.

## Divisao dos agentes

Planejador: transforma o pedido em plano com etapas e criterios de pronto.
Banco de dados: schema, migrations e seguranca de dados (RLS).
Backend: regras de agendamento, calculo de valores e validacao.
Frontend: telas em React, Redux Toolkit, Tailwind e shadcn/ui.
Seguranca: roda ao fim de cada etapa, nao deixa passar segredo exposto nem falha de acesso.
QA: roda ao fim de cada etapa, testa o fluxo de verdade, nao so o codigo compilando.
Revisor: faz o teste final completo e e quem aprova a entrega.
Pesquisador: consultado sob demanda para checar documentacao e existencia de pacotes.

## Ajustes que voce pode querer fazer

Trocar `nvidia/nemotron-3-super` pelo identificador exato do modelo configurado no seu provider (NIM local, Zen, etc). Ajustar `subagent_depth` ou as permissoes de `bash` em `opencode.json` conforme o quanto de autonomia quer dar. Editar os arquivos em `.opencode/prompts/` para adicionar regras especificas do seu negocio, como regras de horario de funcionamento ou tipos de desconto.
