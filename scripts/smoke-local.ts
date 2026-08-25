import { appRouter } from "../server/routers";
import { getLocalUser } from "../server/local-store";

const user = await getLocalUser();
const caller = appRouter.createCaller({
  user,
  req: {
    headers: { host: "127.0.0.1:3103" },
    socket: { remoteAddress: "127.0.0.1" },
  } as never,
  res: {} as never,
});

const response = await caller.chat.sendMessage({
  content: "Responda somente OK.",
});

console.log(JSON.stringify({
  user: { id: user.id, loginMethod: user.loginMethod, role: user.role },
  response: {
    content: response.content,
    conversationId: response.conversationId,
    deepThinkingPerformed: response.deepThinkingPerformed,
  },
}, null, 2));
