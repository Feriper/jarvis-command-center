export type ContentPackageInput = {
  title: string;
  description?: string | null;
  script: string;
  sourceUrls: string[];
  platform: "youtube" | "tiktok";
};

export type ContentPackage = {
  description: string;
  tags: string[];
  captions: string;
  thumbnailPrompt: string;
  productionNotes: string;
};

function cleanWords(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length >= 4);
}

function formatTimestamp(seconds: number) {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toFixed(3).replace(".", ",").padStart(6, "0");
  return `${hours}:${minutes}:${remaining}`;
}

export function buildContentPackage(input: ContentPackageInput): ContentPackage {
  const sentences = input.script
    .split(/(?<=[.!?])\s+|\n+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);
  const counts = new Map<string, number>();
  for (const word of cleanWords(`${input.title} ${input.script}`)) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const tags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word]) => `#${word}`);

  const captions = sentences
    .map((sentence, index) => {
      const start = index * 5;
      const end = start + 5;
      return `${index + 1}\n${formatTimestamp(start)} --> ${formatTimestamp(end)}\n${sentence}\n`;
    })
    .join("\n");

  const sourceNote = input.sourceUrls.length > 0
    ? `Fontes registradas: ${input.sourceUrls.join(", ")}`
    : "Nenhuma fonte externa registrada; confirmar que o material é original ou licenciado.";
  const description = input.description?.trim()
    ? `${input.description.trim()}\n\n${sourceNote}`
    : `${input.title}\n\n${sourceNote}`;

  return {
    description,
    tags,
    captions,
    thumbnailPrompt: `Thumbnail ${input.platform} 16:9 para “${input.title}”, composição limpa, alto contraste, texto curto e legível, sem logotipos de terceiros e sem alegações não verificadas.`,
    productionNotes: [
      "Revisar roteiro e fatos antes da publicação.",
      "Confirmar licença de imagens, áudio, música e fontes externas.",
      "Gerar ou selecionar mídia própria/licenciada; não usar material protegido sem autorização.",
      "Exportar em MP4 H.264, revisar áudio, legendas e thumbnail.",
      "Fazer upload manual como privado ou não listado antes de qualquer publicação pública.",
    ].join("\n"),
  };
}
