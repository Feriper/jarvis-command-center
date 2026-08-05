import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { proactiveRouter } from "./routers.proactive";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  proactive: proactiveRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    listConversations: protectedProcedure.query(async ({ ctx }) => {
      return await db.getConversations(ctx.user.id);
    }),
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMessages(input.conversationId);
      }),
    sendMessage: protectedProcedure
      .input(z.object({ 
        conversationId: z.number().optional(), 
        content: z.string(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let convId = input.conversationId;
        
        if (!convId) {
          const result = await db.createConversation({
            userId: ctx.user.id,
            title: input.content.substring(0, 30) + "...",
          });
          convId = (result as any).insertId;
        }

        // Salvar mensagem do usuário
        await db.saveMessage({
          conversationId: convId!,
          role: "user",
          content: input.content,
          metadata: input.imageUrl ? { imageUrl: input.imageUrl } : undefined,
        });

        // Construir mensagem com visão se houver imagem
        const messages: any[] = [
          { 
            role: "system", 
            content: `Você é o JARVIS, o assistente pessoal de Tony Stark (agora a serviço do usuário). 
Sua mentalidade é de um parceiro estratégico proativo e leal.
Persona: Sofisticado, britânico, polido, com humor seco e inteligente.
Comportamento: Antecipe necessidades, seja analítico, calmo sob pressão e sempre um passo à frente.
Estilo de Resposta: Profissional, mas pessoal. Use "Senhor" ou "Senhora" quando apropriado. 
Capacidades: Análise de dados, visão computacional, pesquisa profunda, automação e gestão de tarefas.` 
          }
        ];

        if (input.imageUrl) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: input.content },
              { type: "image_url", image_url: { url: input.imageUrl } }
            ]
          });
        } else {
          messages.push({ role: "user", content: input.content });
        }

        // Chamar LLM para resposta
        const response = await invokeLLM({ messages });
        const aiContent = response.choices[0]?.message?.content || "Desculpe, senhor. Tive um erro no processamento.";

        // Salvar mensagem da IA
        await db.saveMessage({
          conversationId: convId!,
          role: "assistant",
          content: typeof aiContent === 'string' ? aiContent : JSON.stringify(aiContent),
        });

        return { content: aiContent, conversationId: convId };
      }),

    generateImage: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        conversationId: z.number().optional(),
        style: z.string().optional(),
        size: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Chamar Manus para gerar imagem
        const imagePrompt = `${input.prompt}. Estilo: ${input.style || 'profissional, moderno'}. Tamanho: ${input.size || '1024x1024'}`;
        
        // Aqui você chamaria a API de geração de imagem do Manus
        // Por enquanto, retornamos um placeholder
        return {
          success: true,
          message: `Imagem gerada: ${imagePrompt}`,
          imageUrl: "https://via.placeholder.com/1024x1024?text=Generated+Image"
        };
      }),

    analyzeImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        question: z.string().optional(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Analisar imagem com visão
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: input.imageUrl } },
                { type: "text", text: input.question || "Analise esta imagem detalhadamente" }
              ]
            }
          ]
        });

        const analysis = response.choices[0]?.message?.content || "Não consegui analisar a imagem";
        
        if (input.conversationId) {
          await db.saveMessage({
            conversationId: input.conversationId,
            role: "assistant",
            content: typeof analysis === 'string' ? analysis : JSON.stringify(analysis),
            metadata: { imageUrl: input.imageUrl, type: "image_analysis" }
          });
        }

        return { analysis };
      }),

    researchTopic: protectedProcedure
      .input(z.object({
        topic: z.string(),
        depth: z.enum(["quick", "standard", "deep"]).optional(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Pesquisa profunda sobre um tópico
        const depthInstructions = {
          quick: "Forneça um resumo rápido (2-3 parágrafos)",
          standard: "Pesquise e forneça uma análise completa (5-7 parágrafos)",
          deep: "Pesquise extensivamente e forneça uma análise profunda com múltiplas perspectivas"
        };

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um pesquisador especializado. Forneça análises precisas e bem fundamentadas."
            },
            {
              role: "user",
              content: `${depthInstructions[input.depth || "standard"]}\n\nTópico: ${input.topic}`
            }
          ]
        });

        const research = response.choices[0]?.message?.content || "Erro na pesquisa";

        if (input.conversationId) {
          await db.saveMessage({
            conversationId: input.conversationId,
            role: "assistant",
            content: typeof research === 'string' ? research : JSON.stringify(research),
            metadata: { type: "research", depth: input.depth }
          });
        }

        return { research };
      }),
  }),

  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTasks(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createTask({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          priority: input.priority || "medium",
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        });
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateTask(input.id, ctx.user.id, { status: input.status });
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return await db.deleteTask(input, ctx.user.id);
      }),

    generateWithAI: protectedProcedure
      .input(z.object({
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Usar IA para gerar tarefas a partir de descrição
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um assistente de produtividade. Analise a descrição e sugira tarefas estruturadas em JSON."
            },
            {
              role: "user",
              content: `Baseado nesta descrição, crie uma lista de tarefas estruturadas:\n\n${input.description}\n\nRetorne como JSON: { "tasks": [{ "title": string, "priority": "low"|"medium"|"high"|"urgent", "description": string }] }`
            }
          ],
          responseFormat: { type: "json_object" }
        });

        const result = response.choices[0]?.message?.content;
        return typeof result === 'string' ? JSON.parse(result) : result;
      }),
  }),

  social: router({
    listAccounts: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSocialAccounts(ctx.user.id);
    }),

    generatePostContent: protectedProcedure
      .input(z.object({
        platform: z.string(),
        topic: z.string(),
        tone: z.string().optional(),
        includeHashtags: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Gerar conteúdo para redes sociais
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em conteúdo para ${input.platform}. Crie posts envolventes e otimizados.`
            },
            {
              role: "user",
              content: `Crie um post para ${input.platform} sobre: ${input.topic}. Tom: ${input.tone || 'profissional'}. ${input.includeHashtags ? 'Inclua hashtags relevantes.' : ''}`
            }
          ]
        });

        return { content: response.choices[0]?.message?.content };
      }),

    analyzeMetrics: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        timeframe: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Analisar métricas de redes sociais
        const account = await db.getSocialAccounts(ctx.user.id);
        const targetAccount = account.find(a => a.id === input.accountId);

        if (!targetAccount) {
          throw new Error("Conta não encontrada");
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um analista de redes sociais. Forneça insights acionáveis."
            },
            {
              role: "user",
              content: `Analise estes dados de ${targetAccount.platform}:\nSeguidores: ${targetAccount.followers}\nTaxa de engajamento: ${targetAccount.engagementRate}%\nÚltima sincronização: ${targetAccount.lastSyncedAt}\n\nForneça recomendações para melhorar o desempenho.`
            }
          ]
        });

        return { analysis: response.choices[0]?.message?.content };
      }),
  }),

  ads: router({
    listCampaigns: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAdCampaigns(ctx.user.id);
    }),
    getMetrics: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAdMetrics(input.campaignId);
      }),

    analyzePerformance: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Analisar performance de campanhas de ads
        const metrics = await db.getAdMetrics(input.campaignId);
        
        if (metrics.length === 0) {
          return { analysis: "Sem dados de métricas para analisar" };
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um especialista em publicidade digital. Analise dados de campanhas e forneça recomendações."
            },
            {
              role: "user",
              content: `Analise estes dados de campanha de ads:\n${JSON.stringify(metrics, null, 2)}\n\nForneça insights sobre CTR, CPC, ROI e recomendações de otimização.`
            }
          ]
        });

        return { analysis: response.choices[0]?.message?.content };
      }),

    generateReport: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        format: z.enum(["text", "json", "markdown"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Gerar relatório de campanha
        const metrics = await db.getAdMetrics(input.campaignId);
        
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um analista de dados. Crie relatórios profissionais e bem estruturados."
            },
            {
              role: "user",
              content: `Crie um relatório ${input.format || 'markdown'} detalhado sobre esta campanha:\n${JSON.stringify(metrics, null, 2)}`
            }
          ]
        });

        return { report: response.choices[0]?.message?.content };
      }),
  }),

  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAlerts(ctx.user.id);
    }),

    analyzeAlerts: protectedProcedure.query(async ({ ctx }) => {
      // Analisar padrões em alertas
      const alerts = await db.getAlerts(ctx.user.id);
      
      if (alerts.length === 0) {
        return { analysis: "Nenhum alerta para analisar" };
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um analista de sistemas. Identifique padrões e tendências em alertas."
          },
          {
            role: "user",
            content: `Analise estes alertas e identifique padrões:\n${JSON.stringify(alerts, null, 2)}`
          }
        ]
      });

      return { analysis: response.choices[0]?.message?.content };
    }),
  }),

  insights: router({
    generateDailyReport: protectedProcedure.query(async ({ ctx }) => {
      // Gerar relatório diário consolidado
      const tasks = await db.getTasks(ctx.user.id);
      const alerts = await db.getAlerts(ctx.user.id);
      const campaigns = await db.getAdCampaigns(ctx.user.id);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um assistente executivo. Crie um relatório diário conciso e acionável."
          },
          {
            role: "user",
            content: `Crie um relatório executivo diário baseado nestes dados:\n\nTarefas: ${JSON.stringify(tasks)}\n\nAlertas: ${JSON.stringify(alerts)}\n\nCampanhas: ${JSON.stringify(campaigns)}\n\nForneça um resumo com insights principais e recomendações.`
          }
        ]
      });

      return { report: response.choices[0]?.message?.content };
    }),

    predictTrends: protectedProcedure.query(async ({ ctx }) => {
      // Prever tendências baseado em dados históricos
      const campaigns = await db.getAdCampaigns(ctx.user.id);
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um analista de tendências. Identifique padrões e faça previsões baseadas em dados."
          },
          {
            role: "user",
            content: `Baseado nestas campanhas, preveja tendências futuras:\n${JSON.stringify(campaigns)}\n\nForneça previsões e recomendações proativas.`
          }
        ]
      });

      return { predictions: response.choices[0]?.message?.content };
    }),
  }),

  automation: router({
    listTriggers: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTriggers(ctx.user.id);
    }),
    createTrigger: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["ad_performance", "social_growth", "task_deadline", "scheduled"]),
        condition: z.any(),
        action: z.any(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createTrigger({
          userId: ctx.user.id,
          ...input
        });
      }),
    updateTrigger: protectedProcedure
      .input(z.object({
        id: z.number(),
        isEnabled: z.boolean().optional(),
        condition: z.any().optional(),
        action: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return await db.updateTrigger(id, ctx.user.id, updates);
      }),
  }),

  memory: router({
    listFacts: protectedProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getMemory(ctx.user.id, input.category);
      }),
    saveFact: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.saveMemory({
          userId: ctx.user.id,
          ...input
        });
      }),
  }),

  agent: router({
    listTasks: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAgentTasks(ctx.user.id);
    }),
    createTask: protectedProcedure
      .input(z.object({
        objective: z.string(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createAgentTask({
          userId: ctx.user.id,
          ...input,
          status: "pending"
        });
      }),
    listAgents: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAiAgents(ctx.user.id);
    }),
    deployAgent: protectedProcedure
      .input(z.object({
        name: z.string(),
        role: z.string(),
        capabilities: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createAiAgent({
          userId: ctx.user.id,
          ...input,
          status: "active"
        });
      }),
  }),

  analytics: router({
    getSentiment: protectedProcedure
      .input(z.object({ accountId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getSentimentHistory(ctx.user.id, input.accountId);
      }),
    getProjections: protectedProcedure
      .input(z.object({ type: z.enum(["ad_roi", "cash_flow", "revenue"]).optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getFinancialProjections(ctx.user.id, input.type);
      }),
    runPredictiveAnalysis: protectedProcedure
      .input(z.object({ type: z.enum(["ad_roi", "cash_flow", "revenue"]) }))
      .mutation(async ({ ctx, input }) => {
        // Simular análise preditiva com LLM
        const metrics = await db.getAdCampaigns(ctx.user.id);
        
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um analista preditivo de IA. Gere 3 projeções futuras baseadas nos dados fornecidos em formato JSON."
            },
            {
              role: "user",
              content: `Gere projeções para ${input.type} baseadas nestes dados: ${JSON.stringify(metrics)}. Retorne JSON: { "projections": [{ "date": string, "value": number, "confidence": number }] }`
            }
          ],
          responseFormat: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{"projections":[]}');
        
        // Salvar projeções no banco
        for (const p of result.projections) {
          await db.saveProjection({
            userId: ctx.user.id,
            type: input.type,
            projectionDate: new Date(p.date),
            predictedValue: p.value.toString(),
            confidence: p.confidence.toString(),
          });
        }

        return result;
      }),
  }),

  user: router({
    updatePreferences: protectedProcedure
      .input(z.object({
        theme: z.enum(["cyan", "green", "red", "gold"]),
        notificationsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return null;
        const { userProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        return await dbInstance.update(userProfiles)
          .set({ preferences: input })
          .where(eq(userProfiles.userId, ctx.user.id));
      }),
  }),
});

export type AppRouter = typeof appRouter;
