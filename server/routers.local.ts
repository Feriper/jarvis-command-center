import os from "node:os";
import path from "node:path";
import { access } from "node:fs/promises";
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
