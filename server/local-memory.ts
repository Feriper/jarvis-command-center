import type { InsertUserMemory } from "../drizzle/schema";

const cleanValue = (value: string): string =>
  value
    .replace(/[\s.!,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function extractExplicitMemories(
  content: string,
  userId: number
): InsertUserMemory[] {
  const patterns: Array<{
    key: string;
    category: string;
    expression: RegExp;
  }> = [
    {
      key: "user_name",
      category: "identity",
      expression: /\b(?:meu nome é|me chamo)\s+([^.!?\n]{2,80})/i,
    },
    {
      key: "user_location",
      category: "context",
      expression: /\b(?:moro em|vivo em|estou em)\s+([^.!?\n]{2,80})/i,
    },
    {
      key: "user_work",
      category: "context",
      expression: /\b(?:trabalho com|trabalho em|sou)\s+([^.!?\n]{2,100})/i,
    },
    {
      key: "user_likes",
      category: "preference",
      expression: /\b(?:eu gosto de|gosto de|adoro)\s+([^.!?\n]{2,100})/i,
    },
    {
      key: "user_dislikes",
      category: "preference",
      expression: /\b(?:eu não gosto de|não gosto de|detesto)\s+([^.!?\n]{2,100})/i,
    },
    {
      key: "user_preference",
      category: "preference",
      expression: /\b(?:eu prefiro|prefiro)\s+([^.!?\n]{2,100})/i,
    },
  ];

  return patterns.flatMap(({ key, category, expression }) => {
    const match = content.match(expression);
    if (!match?.[1]) return [];
    const value = cleanValue(match[1]);
    if (value.length < 2) return [];
    return [{ userId, key, value, category } satisfies InsertUserMemory];
  });
}
