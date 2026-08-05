# JARVIS Improvements Integration Guide

## 📋 Overview

Este documento descreve como integrar as melhorias profundas do JARVIS ao projeto existente. As melhorias focam em três pilares: **Memória Integrada**, **Persona Unificada** e **Proatividade Inteligente**.

---

## 🎯 Arquivos Criados

### 1. `server/jarvis-system-prompt.ts`
**Propósito**: Centralizar a persona e o tom de voz do JARVIS

**Principais Funções**:
- `generateJarvisSystemPrompt(userContext?)` - Gera prompt completo com contexto do usuário
- `generateTaskSpecificPrompt(taskType, context?)` - Gera prompt para tarefas específicas
- `buildJarvisSystemMessage(...)` - Constrói mensagem de sistema para LLM

**Como Usar**:
```typescript
import { buildJarvisSystemMessage, UserContext } from "./jarvis-system-prompt";

const userContext: UserContext = {
  userId: 123,
  userName: "Tony",
  workloadLevel: "heavy",
  currentMood: "focused",
  recentGoals: ["Increase Q4 ROI by 25%"],
};

const messages = [
  buildJarvisSystemMessage(userContext, "analysis", "Analyze campaign performance"),
  { role: "user", content: "How are our campaigns doing?" }
];

const response = await invokeLLM({ messages });
```

---

### 2. `server/jarvis-memory-manager.ts`
**Propósito**: Gerenciar memória episódica, semântica e procedural

**Principais Classes**:
- `JarvisMemoryManager` - Gerenciador de memória por conversa

**Principais Métodos**:
- `loadMemoryWindow(maxMessages?)` - Carrega contexto completo
- `extractAndSaveFactsFromMessage(userMsg, assistantMsg)` - Extrai fatos automaticamente
- `generateConversationSummary(messages)` - Cria resumo da conversa
- `formatMemoryAsContext(memoryWindow)` - Formata para incluir no prompt

**Como Usar**:
```typescript
import { createMemoryManager } from "./jarvis-memory-manager";

const memoryManager = createMemoryManager(userId, conversationId);

// Carregar contexto
const memoryWindow = await memoryManager.loadMemoryWindow(20);
const memoryContext = memoryManager.formatMemoryAsContext(memoryWindow);

// Extrair fatos
const facts = await memoryManager.extractAndSaveFactsFromMessage(
  userMessage,
  assistantResponse
);

// Gerar resumo
const summary = await memoryManager.generateConversationSummary(messages);
```

---

### 3. `server/jarvis-proactive-engine.ts`
**Propósito**: Detectar oportunidades, anomalias e comunicar proativamente

**Principais Classes**:
- `JarvisProactiveEngine` - Engine de proatividade

**Principais Métodos**:
- `analyzeAndGenerateInsights()` - Analisa contexto e gera insights
- `formatInsightsAsMessage(context)` - Formata insights para chat

**Como Usar**:
```typescript
import { createProactiveEngine } from "./jarvis-proactive-engine";

const proactiveEngine = createProactiveEngine(userId);

// Gerar insights
const context = await proactiveEngine.analyzeAndGenerateInsights();

// Formatar para chat
const message = proactiveEngine.formatInsightsAsMessage(context);
```

---

### 4. `server/routers.jarvis-unified.ts`
**Propósito**: Router unificado que integra tudo

**Principais Endpoints**:
- `sendMessageWithContext` - Enviar mensagem com contexto completo
- `loadConversationContext` - Carregar contexto de conversa
- `summarizeConversation` - Resumir conversa automaticamente
- `getProactiveInsights` - Obter insights proativos
- `getUserFacts` - Obter fatos salvos
- `updateUserPreference` - Salvar preferências

---

## 🔧 Passos de Integração

### Passo 1: Adicionar ao Router Principal

Editar `server/routers.ts`:

```typescript
import { jarvisUnifiedRouter } from "./routers.jarvis-unified";

export const appRouter = router({
  // ... routers existentes ...
  jarvisUnified: jarvisUnifiedRouter,
});
```

### Passo 2: Atualizar Chat Router (Opcional)

Você pode manter o `chat.sendMessage` existente ou substituir por:

```typescript
// Em server/routers.ts, substituir chat.sendMessage por:
sendMessage: protectedProcedure
  .input(z.object({ 
    conversationId: z.number().optional(), 
    content: z.string(),
    imageUrl: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Delegar para jarvisUnified
    const jarvisUnified = jarvisUnifiedRouter.createCaller(ctx);
    return jarvisUnified.sendMessageWithContext({
      ...input,
      includeProactiveInsights: true,
    });
  }),
```

### Passo 3: Atualizar Frontend (React)

Editar `client/src/pages/JarvisChat.tsx`:

```typescript
import { trpc } from "../lib/trpc";

export function JarvisChat() {
  const { data: context } = trpc.jarvisUnified.loadConversationContext.useQuery(
    { conversationId: currentConversationId },
    { enabled: !!currentConversationId }
  );

  const sendMessageMutation = trpc.jarvisUnified.sendMessageWithContext.useMutation({
    onSuccess: (data) => {
      // Atualizar UI com resposta e insights
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.content,
      }]);
    },
  });

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate({
      conversationId: currentConversationId,
      content,
      includeProactiveInsights: true,
    });
  };

  return (
    <div>
      {/* Mostrar contexto carregado */}
      {context?.importantFacts && (
        <div className="facts-panel">
          <h3>Important Facts</h3>
          {context.importantFacts.map(fact => (
            <div key={fact.id}>{fact.content}</div>
          ))}
        </div>
      )}
      
      {/* Chat existente */}
      {/* ... */}
    </div>
  );
}
```

### Passo 4: Testar Integração

```bash
# Testar compilação
pnpm build

# Testar tipos
pnpm type-check

# Testar em desenvolvimento
pnpm dev
```

---

## 📊 Fluxo de Dados Completo

```
Usuário envia mensagem
    ↓
jarvisUnified.sendMessageWithContext
    ↓
├─ Criar/obter conversa
├─ Salvar mensagem do usuário
├─ Carregar memória (MemoryManager)
│  ├─ Mensagens recentes
│  ├─ Fatos importantes
│  ├─ Resumo anterior
│  └─ Alertas contextuais
├─ Construir contexto do usuário
├─ Construir prompt JARVIS (SystemPrompt)
├─ Chamar LLM com contexto completo
├─ Salvar resposta da IA
├─ Extrair fatos automaticamente (MemoryManager)
├─ Gerar insights proativos (ProactiveEngine)
└─ Retornar resposta + insights ao usuário
```

---

## 🎓 Exemplos de Uso

### Exemplo 1: Chat Simples com Memória

```typescript
// Frontend
const response = await trpc.jarvisUnified.sendMessageWithContext.mutate({
  conversationId: 123,
  content: "Qual é minha meta principal?",
  includeProactiveInsights: false,
});

// Resposta inclui:
// - Resposta JARVIS com contexto de memória
// - Fatos extraídos automaticamente
// - Número de fatos carregados
```

### Exemplo 2: Chat com Insights Proativos

```typescript
const response = await trpc.jarvisUnified.sendMessageWithContext.mutate({
  conversationId: 123,
  content: "Como estão as campanhas?",
  includeProactiveInsights: true, // Ativa insights
});

// Resposta inclui:
// - Análise das campanhas
// - Alertas sobre anomalias
// - Oportunidades de crescimento
// - Ações sugeridas
```

### Exemplo 3: Carregar Contexto Antes de Chat

```typescript
// Pré-carregar contexto
const context = await trpc.jarvisUnified.loadConversationContext.query({
  conversationId: 123,
});

// Mostrar na UI
console.log("Fatos importantes:", context.importantFacts);
console.log("Alertas:", context.contextualAlerts);
console.log("Resumo anterior:", context.conversationSummary);
```

### Exemplo 4: Insights Proativos Periódicos

```typescript
// Executar a cada 5 minutos
setInterval(async () => {
  const insights = await trpc.jarvisUnified.getProactiveInsights.query();
  
  if (insights.urgentItems.length > 0) {
    showNotification("⚠️ Itens urgentes detectados");
  }
  
  if (insights.opportunityItems.length > 0) {
    showNotification("💡 Oportunidades identificadas");
  }
}, 5 * 60 * 1000);
```

---

## 🔍 Debugging

### Verificar Memória Carregada

```typescript
const memoryManager = createMemoryManager(userId, conversationId);
const window = await memoryManager.loadMemoryWindow();

console.log("Recent messages:", window.recentMessages.length);
console.log("Important facts:", window.importantFacts);
console.log("Alerts:", window.contextualAlerts);
```

### Verificar Fatos Extraídos

```typescript
const facts = await memoryManager.extractAndSaveFactsFromMessage(
  userMessage,
  assistantResponse
);

console.log("Facts extracted:", facts.map(f => f.content));
```

### Verificar Insights Proativos

```typescript
const engine = createProactiveEngine(userId);
const context = await engine.analyzeAndGenerateInsights();

console.log("Urgent items:", context.urgentItems);
console.log("Opportunities:", context.opportunityItems);
console.log("Suggested actions:", context.suggestedActions);
```

---

## 📈 Métricas de Sucesso

Após integração, monitorar:

1. **Memória**: Fatos extraídos por conversa > 2
2. **Persona**: Respostas consistentes em todos os routers
3. **Proatividade**: Insights gerados > 1 por conversa
4. **Performance**: Tempo de resposta < 3s (com contexto)
5. **Satisfação**: NPS > 8/10 em "JARVIS entende minhas necessidades"

---

## 🚀 Próximos Passos

1. **Transcrição de Voz**: Integrar `useVoiceChat` ao novo router
2. **Síntese de Voz**: Sintetizar respostas importantes automaticamente
3. **Autonomia Delegada**: Executar tarefas rotineiras sem confirmação
4. **Análise Preditiva**: Prever tendências com histórico
5. **Dashboard de Memória**: UI para visualizar e editar fatos salvos

---

## 📞 Suporte

Para dúvidas sobre integração:

1. Consulte os exemplos em `jarvis-system-prompt.ts` → `exampleUsage()`
2. Verifique tipos em `jarvis-memory-manager.ts` → `MemoryWindow`
3. Teste endpoints em `routers.jarvis-unified.ts` com Postman/Thunder Client

