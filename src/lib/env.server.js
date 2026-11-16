// Server-only env: in development, load the variables `neon deploy` / `neon env pull` wrote.
// Real environment variables (production hosts) take precedence; loadEnvFile never overrides them.
import fs from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(file)) {
    try {
      process.loadEnvFile(file);
    } catch {
      /* unreadable env file: fall back to the process environment */
    }
  }
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Run \`neon env pull\` or set it in the host environment.`);
  return value;
}
