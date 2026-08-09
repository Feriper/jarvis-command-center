import fs from "node:fs";

const required = ["DATABASE_URL", "OAUTH_SERVER_URL", "OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET"];
const recommended = ["OPENAI_API_KEY", "PORT", "NODE_ENV"];
const missing = required.filter((name) => !process.env[name]);
const missingRecommended = recommended.filter((name) => !process.env[name]);
const migrationFiles = fs.readdirSync(new URL("../drizzle/", import.meta.url)).filter((name) => name.endsWith(".sql")).sort();

console.log(`JARVIS PREFLIGHT — ${new Date().toISOString()}`);
console.log(`Migrações versionadas: ${migrationFiles.join(", ") || "nenhuma"}`);
console.log(`Modo: ${process.env.NODE_ENV || "não definido"}`);
console.log(`Porta: ${process.env.PORT || "3000 (padrão)"}`);

if (missing.length) {
  console.error(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);
  console.error("Configure-as no ambiente do servidor; nunca as coloque no frontend ou no Git.");
  process.exitCode = 1;
} else {
  console.log("Variáveis obrigatórias presentes.");
}

if (missingRecommended.length) {
  console.warn(`Variáveis recomendadas ausentes: ${missingRecommended.join(", ")}`);
}

console.log("Publicação automática, transferências Pix e execução financeira permanecem bloqueadas por design.");
