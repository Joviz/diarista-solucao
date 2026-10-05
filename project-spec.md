# Especificação do projeto — Agenda da Diarista

## Objetivo

Criar um site simples, prático e pensado primeiro para celular, para uma diarista organizar os atendimentos e acompanhar os valores previstos, recebidos, pendentes e cancelados.

O site deve permitir consultar a agenda semanal, cadastrar atendimentos, preparar mensagens de confirmação para o WhatsApp e fechar o balanço mensal.

## Instrução de execução

Implemente o projeto do início ao fim seguindo esta especificação. Não interrompa o trabalho para pedir confirmações, apresentar etapas para aprovação ou aguardar verificações. Quando houver uma decisão em aberto, escolha a opção mais simples e coerente com o objetivo, registre-a no projeto e continue até a entrega.

## Princípios de produto

- Priorize o uso pelo celular, com telas responsivas e controles fáceis de tocar.
- Mantenha o fluxo simples, com textos curtos e ações fáceis de encontrar.
- Use português do Brasil em toda a interface.
- Não sobrecarregue a experiência com opções que não sejam necessárias para os fluxos descritos.
- Apresente os valores de forma consistente e deixe claro a qual período se referem.

## Identidade visual

Crie uma aparência leve, limpa e acolhedora, associada a organização e cuidado:

- Branco ou quase branco como base;
- Verde para ações principais e valores recebidos;
- Lilás como cor de apoio para destaques;
- Texto escuro com bom contraste;
- Cartões simples e espaçamento generoso;
- Layout adaptável a telas pequenas, sem rolagem horizontal.

Use rótulos e ícones claros. Não dependa apenas da cor para comunicar o estado de um atendimento.

## Estrutura de navegação

Organize o site em três áreas principais:

1. **Resumo:** visão rápida do mês e dos valores;
2. **Agenda:** atendimentos organizados por semana e por dia;
3. **Fechamento:** conferência dos atendimentos e atualização de pagamentos e cancelamentos.

Inclua acesso ao histórico mensal dentro do fechamento ou em uma área simples associada a ele.

## Dados de um atendimento

Cada atendimento deve conter:

- Nome do cliente ou da casa;
- Endereço;
- Data;
- Horário;
- Duração, quando informada;
- Valor combinado;
- Situação: previsto, realizado, pago ou cancelado;
- Observação opcional;
- Data e valor recebido, quando houver pagamento.

Um atendimento cancelado deve continuar disponível no histórico. Ele não deve contar como receita recebida nem permanecer no total previsto.

## Tela de resumo mensal

Exiba o mês selecionado e apresente:

- **Total previsto:** valor dos atendimentos válidos considerados na previsão;
- **Total recebido:** pagamentos registrados no mês selecionado;
- **Total pendente:** valores ainda não recebidos de atendimentos válidos;
- **Cancelamentos:** quantidade de atendimentos cancelados;
- Um indicador visual de progresso entre o previsto e o recebido.

Exemplo de apresentação: **R$ 3.200 recebidos de R$ 5.000 previstos**.

Permita alternar entre meses e deixe evidente a qual mês os números se referem. Se o mês não tiver atendimentos, mostre uma mensagem simples e um atalho para adicionar o primeiro.

## Agenda semanal

Apresente os dias da semana e os atendimentos de cada dia. Cada atendimento deve mostrar:

- Nome do cliente ou da casa;
- Endereço;
- Data e horário;
- Valor combinado;
- Situação atual;
- Ações para abrir os detalhes ou atualizar a situação.

Permita avançar e voltar entre semanas e selecionar um dia para consultar seus atendimentos. Em dias sem serviços, mostre um estado vazio claro.

## Cadastro e edição de atendimentos

Crie um formulário curto para adicionar e editar atendimentos, com os campos definidos na seção **Dados de um atendimento**. Depois de salvar uma alteração, atualize a agenda e os totais correspondentes.

Indique campos obrigatórios, apresente mensagens úteis quando houver dados inválidos e evite apagar dados do formulário sem necessidade.

## Confirmação pelo WhatsApp

Em cada atendimento futuro, ofereça uma ação para abrir o WhatsApp com uma mensagem de confirmação preenchida, usando o horário daquele serviço. Exemplo:

> Oi, amanhã às 8h estarei aí para a diária. Tudo certo?

Deixe claro que a pessoa poderá revisar e enviar a mensagem no WhatsApp. Não indique que a mensagem foi enviada automaticamente.

## Fechamento mensal

Crie uma lista dos atendimentos do mês, com formas simples de localizar ou agrupar registros por situação. Para cada atendimento, permita:

- Marcar como realizado;
- Marcar como pago;
- Registrar o valor recebido e a data do recebimento;
- Manter como pendente;
- Marcar como cancelado.

Recalcule os valores mensais após cada alteração. Pagamentos devem ser contabilizados no mês da data em que foram recebidos. Cancelamentos não devem contar como recebimento nem continuar na previsão.

## Balanço mensal

No fechamento, apresente de forma direta:

- **Previsto:** serviços válidos considerados para o mês;
- **Recebido:** pagamentos registrados dentro do mês;
- **Pendente:** valores ainda não recebidos;
- **Cancelado:** quantidade e, se for útil, valor originalmente combinado dos serviços cancelados.

Os indicadores do fechamento devem ser consistentes com os do resumo mensal e com os registros individuais.

## Histórico

Permita consultar atendimentos anteriores por mês e situação. Mostre os dados essenciais de cada serviço e suas informações relevantes de pagamento ou cancelamento, mantendo a tela fácil de consultar.

## Estados e mensagens da interface

Preveja mensagens claras para:

- Primeiro acesso sem atendimentos;
- Dia ou semana sem serviços;
- Mês sem movimentação;
- Atendimento pendente;
- Atendimento pago;
- Atendimento cancelado;
- Formulário incompleto ou inválido;
- Ação concluída.

Use mensagens curtas em português e indique a próxima ação disponível quando fizer sentido.

## Fluxo completo esperado

A pessoa deve conseguir:

1. Abrir o resumo mensal;
2. Consultar a agenda semanal;
3. Criar ou editar um atendimento;
4. Preparar uma confirmação pelo WhatsApp;
5. Registrar a realização, o pagamento ou o cancelamento;
6. Ver os valores atualizados no resumo e no fechamento;
7. Consultar o histórico por mês.

## Conteúdo inicial

Inclua exemplos de atendimentos para demonstrar a agenda e o balanço na primeira apresentação do site. Identifique os exemplos como dados demonstrativos e mantenha-os coerentes entre as telas.

## Critério de conclusão

O projeto está concluído quando a diarista consegue percorrer o fluxo completo — da criação de um atendimento ao registro de pagamento ou cancelamento — e ver os valores correspondentes refletidos corretamente no resumo mensal e no fechamento. A entrega deve apresentar navegação clara, identidade visual consistente, conteúdo em português e prioridade para o uso pelo celular.
