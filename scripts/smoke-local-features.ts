import { extractExplicitMemories } from "../server/local-memory";
import { getLocalUser } from "../server/local-store";
import { appRouter } from "../server/routers";

const user = await getLocalUser();
const memories = extractExplicitMemories(
  "Meu nome é Felipe. Eu prefiro respostas curtas.",
  user.id,
);

const caller = appRouter.createCaller({
  user,
  req: {
    headers: { host: "127.0.0.1:3104" },
    socket: { remoteAddress: "127.0.0.1" },
  } as never,
  res: {} as never,
});

const snapshot = await caller.local.getSnapshot();
console.log(JSON.stringify({
  memoryKeys: memories.map(item => item.key),
  platform: snapshot.platformLabel,
  localMode: snapshot.localMode,
  hasDataDirectory: snapshot.dataDirectory.length > 0,
  memoryUsedPercent: snapshot.memory.usedPercent,
}, null, 2));
