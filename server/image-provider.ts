import { generateImage as generateForgeImage } from "./_core/imageGeneration";
import { ENV } from "./_core/env";

export async function createImage(options: {
  prompt: string;
  size?: string;
  style?: string;
}): Promise<{ url: string; provider: "forge" | "openai-compatible" }> {
  const prompt = options.style
    ? `${options.prompt}. Estilo: ${options.style}.`
    : options.prompt;

  if (ENV.forgeApiKey) {
    const result = await generateForgeImage({ prompt });
    if (!result.url) throw new Error("O provedor de imagens não retornou uma URL");
    return { url: result.url, provider: "forge" };
  }

  if (!ENV.openAiApiKey) {
    throw new Error(
      "O chat do Auren está funcionando localmente e sem custo. A geração de imagem ainda exige um provedor de imagem opcional; ela não é fornecida pelo Ollama de texto neste momento."
    );
  }

  const baseUrl = ENV.openAiApiUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: options.size || "1024x1024",
      n: 1,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha na geração de imagem (${response.status})${detail ? `: ${detail}` : ""}`);
  }

  const result = await response.json() as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const image = result.data?.[0];
  if (image?.url) return { url: image.url, provider: "openai-compatible" };
  if (image?.b64_json) {
    return { url: `data:image/png;base64,${image.b64_json}`, provider: "openai-compatible" };
  }
  throw new Error("O provedor de imagens não retornou dados de imagem");
}
