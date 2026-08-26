import { ENV } from "./_core/env";

export type BridgeResponse<T> = T & { ok?: boolean; error?: string };

function buildUrl(path: string): string {
  const base = ENV.desktopBridgeUrl.replace(/\/$/, "");
  const separator = path.includes("?") ? "&" : "?";
  return `${base}${path}${separator}token=${encodeURIComponent(ENV.desktopBridgeToken)}`;
}

async function bridgeGet<T>(path: string): Promise<BridgeResponse<T>> {
  if (!ENV.desktopBridgeToken) {
    throw new Error("A ponte Windows ainda não está conectada: configure AUREN_DESKTOP_BRIDGE_TOKEN.");
  }

  const response = await fetch(buildUrl(path), {
    method: "GET",
    headers: { accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({ error: "Resposta inválida da ponte Windows." }));
  if (!response.ok) {
    throw new Error(payload?.error || `A ponte Windows respondeu HTTP ${response.status}.`);
  }
  if (payload?.ok === false) throw new Error(payload.error || "A ponte Windows recusou a operação.");
  return payload as BridgeResponse<T>;
}

export function getDesktopBridgeStatus() {
  return bridgeGet<{
    armed: boolean;
    stopped: boolean;
    version: string;
    root: string;
    message: string;
  }>("/api/status");
}

export function listDesktopFiles(relativePath = "") {
  return bridgeGet<{
    current: string;
    items: Array<{ name: string; rel: string; dir: boolean; size: number }>;
  }>(`/api/files?path=${encodeURIComponent(relativePath)}`);
}

export function listDesktopWindows() {
  return bridgeGet<{
    items: Array<{
      hwnd: number;
      name: string;
      className: string;
      processId: number;
      enabled: boolean;
      offscreen: boolean;
      controlType: string;
    }>;
  }>("/api/windows");
}

export function listDesktopControls(hwnd: number) {
  return bridgeGet<{
    items: Array<{
      hwnd: number;
      name: string;
      automationId: string;
      className: string;
      controlType: string;
      enabled: boolean;
      offscreen: boolean;
    }>;
  }>(`/api/ui?hwnd=${encodeURIComponent(String(hwnd))}`);
}

export function moveDesktopMouse(x: number, y: number) {
  return bridgeGet<{ x: number; y: number }>(`/api/mouse/move?x=${x}&y=${y}`);
}

export function clickDesktopMouse(button: "left" | "right" | "middle" = "left") {
  return bridgeGet<Record<string, never>>(`/api/mouse/click?button=${encodeURIComponent(button)}`);
}

export function typeDesktopText(text: string) {
  return bridgeGet<Record<string, never>>(`/api/keyboard/type?text=${encodeURIComponent(text)}`);
}

export function sendDesktopKey(key: string) {
  return bridgeGet<Record<string, never>>(`/api/keyboard/key?key=${encodeURIComponent(key)}`);
}

export async function captureDesktopScreen() {
  if (!ENV.desktopBridgeToken) {
    throw new Error("A ponte Windows ainda não está conectada.");
  }

  const response = await fetch(buildUrl("/api/screenshot"), {
    method: "GET",
    headers: { accept: "image/png,image/jpeg,application/json" },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `A ponte Windows respondeu HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/png";
  if (contentType === "application/json") {
    const payload = await response.json() as { dataUrl?: string; base64?: string; error?: string };
    if (payload.dataUrl) return { dataUrl: payload.dataUrl, capturedAt: new Date() };
    if (payload.base64) return { dataUrl: `data:image/png;base64,${payload.base64}`, capturedAt: new Date() };
    throw new Error(payload.error || "A ponte não retornou uma imagem válida.");
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    dataUrl: `data:${contentType};base64,${bytes.toString("base64")}`,
    capturedAt: new Date(),
  };
}
