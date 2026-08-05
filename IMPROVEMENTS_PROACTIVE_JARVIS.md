# Melhorias para JARVIS Proativo: Implementação Prática

## Visão Geral
Este documento detalha as melhorias específicas para transformar o JARVIS em um assistente verdadeiramente proativo e um parceiro estratégico. As melhorias são organizadas por módulo e incluem mudanças de código.

---

## 1. Sistema de Memória Aprimorado

### 1.1 Contexto Persistente
O JARVIS deve manter um contexto enriquecido do usuário, não apenas fatos isolados.

**Implementação:**
- Expandir a tabela `userMemory` com um campo `importance` (0-100) para priorizar fatos críticos.
- Criar um índice em `category` para buscar rápida de contexto por tipo.
- Implementar um "memory window" que carrega os 10 fatos mais importantes + os 5 mais recentes para cada conversa.

**Código de Exemplo (server/routers.ts):**

```typescript
chat: router({
  sendMessage: protectedProcedure
    .input(z.object({ 
      conversationId: z.number().optional(), 
      content: z.string(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Carregar contexto de memória do usuário
      const userContext = await db.getUserMemoryWindow(ctx.user.id, 15); // Top 15 facts
      
      const systemPrompt = `Você é o JARVIS, assistente pessoal retro-futurista.
      
CONTEXTO DO USUÁRIO:
${userContext.map(m => `- ${m.category}: ${m.value}`).join('\n')}

Responda com sofisticação britânica, reconhecendo este contexto. Seja proativo quando apropriado.`;

      const messages = [
        { role: "system", content: systemPrompt },
        // ... resto das mensagens
      ];
      
      // ... resto da lógica
    }),
})
```

---

## 2. Proatividade Baseada em Gatilhos

### 2.1 Análise Contínua de Anomalias
O JARVIS deve monitorar métricas e alertar sobre desvios significativos.

**Implementação:**
- Criar uma função `analyzeMetricsForAnomalies()` que roda a cada 15 minutos.
- Comparar métricas atuais com a média dos últimos 7 dias.
- Se houver queda > 20%, criar um alerta com sugestão de ação.

**Código de Exemplo (server/routers.ts):**

```typescript
insights: router({
  generateProactiveReport: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await db.getTasks(ctx.user.id);
    const alerts = await db.getAlerts(ctx.user.id);
    const campaigns = await db.getAdCampaigns(ctx.user.id);
    
    // Detectar anomalias
    const anomalies = [];
    for (const campaign of campaigns) {
      const metrics = await db.getAdMetrics(campaign.id);
      const avgCTR = metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length;
      const latestCTR = metrics[metrics.length - 1]?.ctr || 0;
      
      if (latestCTR < avgCTR * 0.8) {
        anomalies.push({
          type: "ad_performance",
          campaign: campaign.campaignName,
          issue: `CTR caiu ${((1 - latestCTR / avgCTR) * 100).toFixed(1)}%`,
          suggestion: "Considere testar novos criativos ou ajustar segmentação"
        });
      }
    }
    
    // Detectar tarefas vencendo
    const now = new Date();
    const urgentTasks = tasks.filter(t => 
      t.dueDate && t.dueDate < new Date(now.getTime() + 60 * 60 * 1000) && t.status !== "completed"
    );
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um executivo assistente. Crie um relatório executivo conciso e acionável."
        },
        {
          role: "user",
          content: `Analise esta situação e forneça recomendações prioritárias:

ANOMALIAS DETECTADAS:
${anomalies.map(a => `- ${a.type}: ${a.issue}\n  Sugestão: ${a.suggestion}`).join('\n')}

TAREFAS URGENTES (próxima hora):
${urgentTasks.map(t => `- ${t.title} (vence em ${Math.round((t.dueDate!.getTime() - now.getTime()) / 60000)} min)`).join('\n')}

Forneça um resumo executivo com as 3 ações mais importantes.`
        }
      ]
    });
    
    return { 
      report: response.choices[0]?.message?.content,
      anomalies,
      urgentTasks
    };
  }),
})
```

---

## 3. Modo Autônomo Inteligente

### 3.1 Delegação de Tarefas
O JARVIS deve ser capaz de executar tarefas rotineiras sem intervenção.

**Implementação:**
- Expandir o `agent.createTask` para aceitar um nível de autonomia (0-100).
- Implementar um executor de tarefas que valida resultados antes de aplicar.
- Manter um log detalhado de todas as ações autônomas.

**Código de Exemplo (server/routers.ts):**

```typescript
agent: router({
  createTask: protectedProcedure
    .input(z.object({
      objective: z.string(),
      autonomyLevel: z.number().min(0).max(100).optional(), // 0 = pedir confirmação, 100 = executar
      conversationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.createAgentTask({
        userId: ctx.user.id,
        objective: input.objective,
        status: "pending",
        conversationId: input.conversationId,
      });
      
      // Se autonomyLevel >= 80, executar imediatamente
      if ((input.autonomyLevel || 50) >= 80) {
        // Executar tarefa em background
        executeAgentTask(task.id, ctx.user.id);
      }
      
      return task;
    }),
})
```

---

## 4. Persona Sofisticada e Contextual

### 4.1 Adaptação de Tom
O JARVIS deve ajustar seu tom baseado no contexto e preferências do usuário.

**Implementação:**
- Armazenar preferências de tom na tabela `userProfiles`.
- Incluir instruções de tom no system prompt baseado na hora do dia e carga de trabalho.

**Código de Exemplo (server/routers.ts):**

```typescript
const getUserToneInstructions = async (userId: number, context: string) => {
  const profile = await db.getUserProfile(userId);
  const hour = new Date().getHours();
  
  let tone = profile.aiPersonality || "professional";
  
  // Ajustar tom baseado na hora
  if (hour >= 22 || hour < 6) {
    tone = "calm_and_brief"; // Noite: respostas breves e calmas
  } else if (hour >= 9 && hour < 12) {
    tone = "energetic_and_proactive"; // Manhã: proativo e energético
  }
  
  const toneGuides = {
    professional: "Seja formal, preciso e direto.",
    friendly: "Seja amigável, use humor ocasional, mas mantenha profissionalismo.",
    calm_and_brief: "Respostas curtas, calmas, reconhecendo que é noite.",
    energetic_and_proactive: "Seja entusiasmado, sugira ações, antecipe necessidades."
  };
  
  return toneGuides[tone] || toneGuides.professional;
};
```

---

## 5. Análise Preditiva

### 5.1 Previsões Inteligentes
O JARVIS deve prever tendências e alertar sobre riscos futuros.

**Implementação:**
- Usar dados históricos para treinar modelos simples de previsão.
- Alertar quando uma métrica está em trajetória de queda.
- Sugerir ações preventivas baseadas em padrões históricos.

**Código de Exemplo (server/routers.ts):**

```typescript
analytics: router({
  runPredictiveAnalysis: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      daysAhead: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const metrics = await db.getAdMetrics(input.campaignId);
      const daysAhead = input.daysAhead || 7;
      
      // Calcular tendência simples (regressão linear)
      const trend = calculateTrend(metrics.map(m => m.ctr));
      const projected = projectMetric(metrics.map(m => m.ctr), daysAhead);
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um analista de dados. Forneça previsões e recomendações."
          },
          {
            role: "user",
            content: `Baseado nesta tendência de CTR: ${trend.direction} ${Math.abs(trend.slope).toFixed(2)}% por dia
            
Projeção para ${daysAhead} dias: ${projected.toFixed(2)}%

Forneça:
1. Confiança da previsão (0-100%)
2. Risco identificado
3. Ação recomendada`
          }
        ],
        responseFormat: { type: "json_object" }
      });
      
      return JSON.parse(response.choices[0]?.message?.content || "{}");
    }),
})
```

---

## 6. Integração com Manus Features

### 6.1 Geração de Imagens para Posts
O JARVIS deve sugerir e gerar imagens para posts de redes sociais.

**Implementação:**
- Quando um post é agendado, oferecer geração automática de imagem.
- Usar o contexto do post para criar um prompt de imagem relevante.

**Código de Exemplo (client/src/pages/JarvisChat.tsx):**

```typescript
const handleGenerateImageForPost = async (postContent: string) => {
  const imagePrompt = await generateImagePrompt(postContent);
  
  const result = await generateImageMutation.mutateAsync({
    prompt: imagePrompt,
    style: "modern_social_media",
    size: "1080x1080",
    conversationId: conversationId || undefined,
  });
  
  return result.imageUrl;
};
```

---

## 7. Checklist de Implementação

- [ ] Expandir `userMemory` com campo `importance`
- [ ] Criar função `getUserMemoryWindow()` em db.ts
- [ ] Implementar `analyzeMetricsForAnomalies()` como cron job
- [ ] Adicionar `autonomyLevel` ao schema de `agentTasks`
- [ ] Implementar `getUserToneInstructions()` para adaptação de persona
- [ ] Criar funções de previsão (`calculateTrend`, `projectMetric`)
- [ ] Integrar geração de imagens com posts de redes sociais
- [ ] Testar proatividade em diferentes cenários

---

## 8. Próximos Passos

1. **Fase 1**: Implementar memória aprimorada e proatividade baseada em gatilhos.
2. **Fase 2**: Adicionar análise preditiva e sugestões inteligentes.
3. **Fase 3**: Refinar persona e tom adaptativo.
4. **Fase 4**: Integrar com Manus features (geração de imagens, síntese de voz).
