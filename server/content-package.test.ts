import { describe, expect, it } from "vitest";
import { buildContentPackage } from "./content-package";

describe("buildContentPackage", () => {
  it("gera metadados, fontes, legendas e checklist sem conteúdo externo", () => {
    const result = buildContentPackage({
      title: "Como organizar sua rotina",
      description: "Dicas práticas para uma semana melhor.",
      script: "Comece com uma lista simples. Depois revise suas prioridades.",
      sourceUrls: ["https://example.com/fonte"],
      platform: "youtube",
    });

    expect(result.description).toContain("https://example.com/fonte");
    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.captions).toContain("00:00:00,000 --> 00:00:05,000");
    expect(result.thumbnailPrompt).toContain("Como organizar sua rotina");
    expect(result.productionNotes).toContain("licença");
  });
});
