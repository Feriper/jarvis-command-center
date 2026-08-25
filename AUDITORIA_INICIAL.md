# Auditoria inicial do Jarvis

## Repositório

- Repositório: `https://github.com/Feriper/jarvis-command-center`
- Visibilidade: pública
- Branch padrão: `main`
- Homepage atual: `https://jarvis-command-center-beige.vercel.app`
- Linguagem principal: TypeScript
- O repositório já existe e não deve ser duplicado sem pedido explícito.

## Estado de execução

O `package.json` define `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm check`, `pnpm test` e `pnpm db:push`. A documentação antiga pede MySQL e uma `OPENAI_API_KEY`, mas o backend real usa `invokeLLM` em `server/_core/llm.ts` e as variáveis de infraestrutura do template. Essa documentação precisa ser corrigida para não induzir a uma configuração falsa.

## Estado do frontend

`client/src/App.tsx` usa uma autenticação local por booleano em `Router`, exibindo `JarvisAuthGate` antes das rotas. A rota `/` usa `JarvisUltraPremium`. O componente principal chama `trpc.jarvisUnified.sendMessageWithContext` e espera `content`, `conversationId`, `confidenceScore`, `deepThinkingPerformed` e `sources`.

## Estado do backend

Existe um router completo em `server/routers.jarvis-unified.ts`, exportado como `jarvisUnifiedRouter`, com `sendMessageWithContext`, `getSecurityStatus` e `getLearnedTools`. Contudo, a entrada `server/routers.ts` não o montava no `appRouter` durante a auditoria inicial; esse é o primeiro ajuste de integração necessário.

O router unificado depende de vários motores experimentais de memória, proatividade, evolução, reflexão, objetivos, descoberta de ferramentas, Guardian e Net Sync. O caminho de chat básico em `server/routers.ts` é mais simples e já chama `invokeLLM`, mas retorna apenas `content` e `conversationId`.

## Falha encontrada

A primeira execução de `pnpm check` falhou com 67 erros TypeScript em módulos experimentais, routers e testes de integração. O primeiro erro visível era JSX inválido em `client/src/components/JarvisHUD.tsx`, onde três textos começavam diretamente com `>`. Esses três erros foram corrigidos para `&gt;`; a checagem seguinte ainda encontrou os demais contratos antigos, incluindo a ausência de `jarvisUnified` no appRouter.

## Decisão inicial

A primeira entrega deve priorizar um Jarvis local que compile e responda no chat. Deve montar o `jarvisUnifiedRouter`, corrigir o contrato do componente principal, alinhar a documentação do Windows e separar módulos experimentais que impedem o build. Não deve prometer que o projeto é literalmente a mesma IA ou a mesma memória desta sessão.
