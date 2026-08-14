# Jarvis: uso básico diário

Esta versão do Jarvis foi preparada para tarefas pessoais simples e seguras. Ela pode organizar tarefas, classificar prioridades, mostrar itens atrasados ou vencendo hoje, gerar um resumo diário, guardar fatos importantes na memória, pesquisar um tema quando houver um provedor de IA configurado e preparar rascunhos de conteúdo.

## Fluxo recomendado

Comece criando tarefas com título, prioridade e vencimento. Na tela de tarefas, use o resumo para identificar o que está atrasado, o que vence hoje e quais são os próximos itens. A nova consulta `tasks.overview` organiza automaticamente essas três listas sem modificar nada externamente.

O resumo diário está disponível em `proactive.generateDailySummary`. Quando uma IA estiver configurada, o Jarvis pode transformar os números em um texto mais natural. Quando não houver chave ou o provedor estiver indisponível, ele usa um resumo local determinístico; portanto, a função básica continua funcionando sem plano pago.

Para pesquisa, use `chat.researchTopic` com profundidade `quick`, `standard` ou `deep`. Sem um provedor de IA, a pesquisa inteligente fica desativada, mas tarefas, listas, rascunhos e aprovações continuam sendo recursos independentes.

## Automações permitidas no MVP

As automações básicas são de organização e leitura: classificação de tarefas, visão de vencimentos, resumo diário, detecção de atrasos e preparação de rascunhos. Elas não enviam mensagens, publicam vídeos, transferem dinheiro, fazem compras, alteram anúncios ou acessam redes sociais por conta própria.

Ações sensíveis passam pelo router `actions`. Uma ação pode ser proposta e aprovada, mas a execução externa permanece bloqueada até existir um executor explícito, testado e autorizado. Esse comportamento é intencional.

## Configuração mínima

Para usar tarefas e o resumo local, o serviço precisa apenas de um banco de produção configurado com `DATABASE_URL` e das migrações aplicadas. Para chat e pesquisa inteligentes, adicione um provedor compatível com OpenAI usando `LLM_BASE_URL` e `LLM_API_KEY`, ou as variáveis `OPENAI_BASE_URL` e `OPENAI_API_KEY`. Nunca coloque chaves no GitHub ou no chat.

## Testes realizados

A suíte atual valida o fluxo de conteúdo com revisão de direitos, aprovação sem execução financeira, lógica proativa e a nova visão de tarefas. A última execução aprovou **8 arquivos de teste e 21 testes**, além do typecheck e do build de produção.
