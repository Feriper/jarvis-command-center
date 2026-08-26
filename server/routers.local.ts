import os from "node:os";
import path from "node:path";
import { access, readdir, stat } from "node:fs/promises";
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ENV } from "./_core/env";
import { getLocalDataDirectory } from "./local-store";
import {
  getDesktopBridgeStatus,
  listDesktopFiles,
  listDesktopWindows,
  listDesktopControls,
  moveDesktopMouse,
  clickDesktopMouse,
  typeDesktopText,
  sendDesktopKey,
} from "./desktop-bridge-client";

async function summarizeDirectory(target: string): Promise<{ files: number; bytes: number; truncated: boolean }> {
  let files = 0;
  let bytes = 0;
  let truncated = false;
  const queue = [target];

  while (queue.length > 0) {
    const current = queue.shift()!;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (files >= 10000) {
        truncated = true;
        break;
      }
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      try {
        const metadata = await stat(fullPath);
        files += 1;
        bytes += metadata.size;
      } catch {
        // O arquivo pode desaparecer enquanto o diagnóstico é executado.
      }
    }
    if (truncated) break;
  }

  return { files, bytes, truncated };
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export const localSystemRouter = router({
  bridgeStatus: protectedProcedure.query(() => getDesktopBridgeStatus()),

  files: protectedProcedure
    .input(z.object({ path: z.string().optional() }))
    .query(({ input }) => listDesktopFiles(input.path || "")),

  windows: protectedProcedure.query(() => listDesktopWindows()),

  controls: protectedProcedure
    .input(z.object({ hwnd: z.number().int().positive() }))
    .query(({ input }) => listDesktopControls(input.hwnd)),

  moveMouse: protectedProcedure
    .input(z.object({ x: z.number().int(), y: z.number().int(), confirmed: z.literal(true) }))
    .mutation(({ input }) => moveDesktopMouse(input.x, input.y)),

  clickMouse: protectedProcedure
    .input(z.object({ button: z.enum(["left", "right", "middle"]).default("left"), confirmed: z.literal(true) }))
    .mutation(({ input }) => clickDesktopMouse(input.button)),

  typeText: protectedProcedure
    .input(z.object({ text: z.string().min(1).max(2000), confirmed: z.literal(true) }))
    .mutation(({ input }) => typeDesktopText(input.text)),

  sendKey: protectedProcedure
    .input(z.object({ key: z.string().min(1).max(30), confirmed: z.literal(true) }))
    .mutation(({ input }) => sendDesktopKey(input.key)),

  cleanupPreview: protectedProcedure.query(async () => {
    const localAppData = process.env.LOCALAPPDATA || "";
    const targets = [
      { id: "user-temp", label: "Temporários do usuário", path: os.tmpdir() },
      ...(localAppData ? [{ id: "localappdata-temp", label: "Temp do perfil local", path: path.join(localAppData, "Temp") }] : []),
    ];
    return {
      generatedAt: new Date(),
      previewOnly: true,
      targets: await Promise.all(targets.map(async target => ({
        ...target,
        exists: await exists(target.path),
        ...(await summarizeDirectory(target.path)),
      }))),
      policy: "Somente diretórios temporários allowlisted; exclusão exige confirmação separada.",
    };
  }),

  getSnapshot: protectedProcedure.query(async () => {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpus = os.cpus();
    const userTemp = os.tmpdir();
    const localAppData = process.env.LOCALAPPDATA || "";
    const cleanupCandidates = [
      userTemp,
      localAppData ? path.join(localAppData, "Temp") : "",
    ].filter(Boolean);

    return {
      capturedAt: new Date(),
      platform: process.platform,
      platformLabel: process.platform === "win32" ? "Windows" : process.platform,
      release: os.release(),
      architecture: process.arch,
      nodeVersion: process.version,
      cpuModel: cpus[0]?.model || "desconhecido",
      logicalCores: cpus.length,
      memory: {
        totalMb: Math.round(totalMemory / 1024 / 1024),
        freeMb: Math.round(freeMemory / 1024 / 1024),
        usedMb: Math.round((totalMemory - freeMemory) / 1024 / 1024),
        usedPercent: Math.round(((totalMemory - freeMemory) / totalMemory) * 100),
      },
      uptimeSeconds: Math.round(os.uptime()),
      localMode: ENV.localMode,
      dataDirectory: getLocalDataDirectory(),
      cleanupPreview: await Promise.all(
        cleanupCandidates.map(async target => ({
          target,
          exists: await exists(target),
          action: "somente prévia; nenhuma exclusão foi executada",
        }))
      ),
    };
  }),
});
