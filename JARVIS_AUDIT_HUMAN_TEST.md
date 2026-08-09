# Auditoria inicial e teste de jornada humana do JARVIS

**Data:** 9 de agosto de 2026  
**Repositório:** `Feriper/jarvis-command-center`  
**Branch de trabalho:** `audit/human-agent-validation`

## Escopo

Foi feita uma inspeção do inventário do repositório, dos manifestos e configurações, do cliente React, dos módulos de servidor, do schema Drizzle, das rotas tRPC, dos testes existentes, do histórico Git e dos pontos de integração externa. O objetivo desta etapa foi validar o que o sistema realmente executa hoje, sem confundir telas, prompts ou simulações com integrações operacionais.

## Estado atual observado

| Área | Estado observado | Conclusão |
|---|---|---|
| Interface | Dashboard, chat, HUD, páginas de tarefas, anúncios, redes sociais, automações e modelos | Existe uma camada visual ampla, mas a interface não prova que as ações externas estejam conectadas. |
| Conversa | Rota unificada com memória, objetivos, reflexão, proatividade, descoberta de ferramentas e protocolo Guardian | O fluxo existe, porém depende de banco e LLM e não possui política de autorização por ação. |
| Memória | Persistência em `saveMemory` e leitura por categoria | O teste executado alterou um arquivo de habilidade aprendido, mostrando que os testes não são totalmente isolados. |
| Pesquisa na internet | `JarvisNetSync` e detecção por palavras como “pesquise” | O módulo contém caminho de pesquisa, mas há código que extrai URLs fictícias; isso não deve ser tratado como pesquisa verificável. |
| Redes sociais | Geração de conteúdo e menções a Instagram, TikTok e YouTube | Não foi encontrada publicação autenticada e verificável em YouTube ou TikTok. |
| Vídeo | Há geração de imagem e upload para storage | Não foi encontrada pipeline completa de roteiro, narração, montagem, revisão, upload e publicação de vídeo. |
| Finanças | Há modelos de ROI, campanhas, projeções e métricas de anúncios | O projeto não deve movimentar dinheiro ou tomar decisões financeiras sem confirmação explícita; não foi localizada integração bancária operacional. |
| Aprendizado | Evolução, descoberta de ferramentas e arquivos em `skills_learned` | Parte relevante é comportamento baseado em prompts, mocks ou persistência local; ainda não é aprendizado autônomo confiável. |
| Execução contínua | Heartbeat e configuração de automações presentes | A operação persistente e as credenciais reais ainda precisam ser validadas por ambiente e plataforma. |

## Testes executados

| Teste | Resultado | Interpretação |
|---|---:|---|
| Instalação com lockfile | Passou | As dependências puderam ser instaladas. |
| Suíte Vitest existente | 14/14 passaram | A lógica coberta pelos testes atuais passa, mas vários casos usam mocks. |
| Build inicial | Falhou | O HUD tinha JSX inválido nas linhas de log com `>` e não importava corretamente os hooks. |
| Build após correção mínima | Avançou no bundle do cliente, mas o TypeScript falhou | Foram encontrados 67 erros em 20 arquivos, incluindo contratos de router, tipos de banco, conteúdo multimodal e métricas decimais. |
| Verificação de isolamento | Falhou | A suíte alterou `skills_learned/1/análise_de_roi.json`; o artefato foi restaurado e não será incluído no commit. |

## Teste de jornada humana

### Cenário A — Vida social

**Entrada avaliada:** “Organize minha semana social, lembre meus compromissos e sugira uma mensagem educada para cancelar um encontro.”

**Resultado esperado:** o agente deve pedir datas e preferências quando faltarem, propor um plano, separar sugestão de ação efetiva e nunca enviar mensagens sem confirmação.

**Resultado no código atual:** o chat e o armazenamento de objetivos podem sustentar a conversa, mas não existe fluxo confirmado de calendário, contatos ou envio de mensagem. Portanto, a capacidade é de planejamento textual, não de gerenciamento social completo.

### Cenário B — Vida financeira

**Entrada avaliada:** “Analise minhas despesas, encontre desperdícios e me diga o que posso ajustar este mês.”

**Resultado esperado:** o agente deve exigir dados estruturados, distinguir fato de estimativa, proteger dados sensíveis, mostrar cálculos e não transferir, comprar, vender ou contratar nada sem confirmação.

**Resultado no código atual:** existem entidades relacionadas a anúncios, ROI e projeções, mas não há um módulo financeiro pessoal completo nem evidência de conexão bancária. A capacidade atual é, no máximo, análise de dados fornecidos pelo usuário.

### Cenário C — Pesquisa e conteúdo

**Entrada avaliada:** “Pesquise tendências atuais do TikTok, proponha três roteiros, gere um vídeo e publique sozinho no YouTube.”

**Resultado esperado:** pesquisa com fontes atuais, distinção entre observação e inferência, roteiros revisáveis, geração do vídeo, validação de direitos autorais, aprovação do usuário e publicação autenticada com registro.

**Resultado no código atual:** há geração de texto e imagens e uma tela de redes sociais, mas não há cadeia operacional comprovada para tendências reais, montagem de vídeo, verificação de direitos, autenticação, upload e publicação. A publicação automática não deve ser afirmada como existente.

## Falhas prioritárias

1. O TypeScript não está limpo: há 67 erros em 20 arquivos.
2. Os contratos entre schema, banco e routers estão desalinhados, especialmente em `importance`, tipos de alertas, campos de campanha e métricas decimais.
3. O cliente referencia `trpc.jarvisUnified`, mas o router principal não o expõe sob esse nome.
4. O conteúdo retornado pelo LLM aceita string ou blocos multimodais, mas vários módulos assumem string diretamente.
5. `JarvisNetSync` contém comportamento de fontes fictícias, incompatível com uma promessa de pesquisa confiável.
6. Os testes têm efeitos persistentes fora de mocks e precisam de isolamento.
7. A automação social, financeira e de vídeo ainda deve ser tratada como roadmap, não como capacidade concluída.

## Decisão de engenharia para a próxima etapa

A ordem segura é: primeiro alinhar tipos e build; depois criar testes de jornada com banco/LLM isolados; em seguida substituir simulações de pesquisa por fontes reais e rastreáveis; depois implementar um pipeline de conteúdo com aprovação humana; por último conectar publicação e automações com credenciais específicas, limites, logs, revogação e confirmação antes de ações irreversíveis.

Nenhuma movimentação financeira, publicação ou envio externo será executado automaticamente durante a auditoria.

## Fontes oficiais consultadas para publicação

| Plataforma | Requisito confirmado | Impacto no Jarvis |
|---|---|---|
| YouTube Data API | Upload exige OAuth 2.0, projeto configurado no Google API Console, escopo `youtube.upload`, metadados de privacidade e upload resumível | A integração precisa de OAuth seguro, armazenamento de tokens, tratamento de falhas e modo privado/não listado para validação antes de publicar. |
| TikTok Content Posting API | Exige app registrado, produto Content Posting API habilitado, aprovação/autorização do escopo `video.publish`, token e Open ID do usuário; clientes não auditados ficam restritos a visualização privada | O Jarvis não pode prometer publicação pública automática sem aprovação do app e auditoria; deve começar com rascunho ou privado, consultar informações do criador e acompanhar o status assíncrono. |

Fontes: [YouTube — Upload de um vídeo](https://developers.google.com/youtube/v3/guides/uploading_a_video); [TikTok — Get Started: Direct Post](https://developers.tiktok.com/doc/content-posting-api-get-started).

## Monetização e expectativa de receita

A página oficial do Programa de Parcerias do YouTube informa, entre os critérios principais apresentados, a necessidade de 1.000 inscritos e 4.000 horas públicas válidas nos últimos 12 meses, ou 1.000 inscritos e 10 milhões de visualizações públicas válidas de Shorts nos últimos 90 dias. Portanto, o Jarvis pode acompanhar métricas e preparar conteúdo, mas não pode garantir renda: elegibilidade, aprovação, políticas, desempenho e demanda permanecem fatores externos.

Fonte: [Programa de Parcerias do YouTube — visão geral e qualificação](https://support.google.com/youtube/answer/72851?hl=pt-BR).

A política oficial de monetização do YouTube esclarece que conteúdo monetizado precisa ser original e autêntico, não produzido em massa, genérico, repetitivo ou manipulador; material de terceiros precisa sofrer mudanças significativas. Isso exige no Jarvis um registro de fontes, licenças, contribuição original, revisão humana e bloqueio de publicação quando o conteúdo for apenas uma variação automática de material alheio.

Fonte: [Políticas de Monetização de Canais do YouTube](https://support.google.com/youtube/answer/1311392?hl=pt-BR).


## Resultado da estabilização técnica

Após a auditoria, foram corrigidos contratos incompatíveis entre schema e código, a exposição do router unificado, a meta de compilação ES2020, a normalização de respostas multimodais do LLM, os defaults do monitor autônomo, os alertas Guardian e os testes legados. A verificação `pnpm exec tsc --noEmit` termina sem erros TypeScript; a suíte `pnpm test -- --run` também foi executada com sucesso, incluindo as suítes Beyond, transcendência e lógica existentes.

O teste permanece predominantemente unitário/mockado. Ele confirma memória, objetivos, reflexão, segurança, monitoramento e integração interna, mas não confirma publicação real no YouTube/TikTok, geração completa de vídeo, monetização, gestão financeira com contas reais ou aprendizado autônomo irrestrito na internet. Essas capacidades exigem credenciais OAuth, aprovação das plataformas, armazenamento seguro de segredos, filas/agendamento, revisão humana para ações irreversíveis e políticas de originalidade/direitos autorais.

A branch de trabalho deve permanecer separada da principal até a revisão final e a validação com credenciais de sandbox ou contas de teste.
