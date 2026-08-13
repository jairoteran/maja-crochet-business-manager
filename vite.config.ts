import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function geminiApi(apiKey: string, model: string): Plugin {
  return {
    name: "maja-gemini-api",
    configureServer(server) {
      server.middlewares.use("/api/ai", async (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: "Método no permitido" }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of request) chunks.push(Buffer.from(chunk));
          const { question, context } = JSON.parse(
            Buffer.concat(chunks).toString(),
          ) as {
            question?: string;
            context?: unknown;
          };

          if (!apiKey || !question?.trim()) {
            response.statusCode = apiKey ? 400 : 503;
            response.end(
              JSON.stringify({
                error: apiKey
                  ? "Escribe una pregunta."
                  : "Gemini no está configurado.",
              }),
            );
            return;
          }

          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [
                    {
                      text: "Eres la asistente contable de Maja, un pequeño taller de tejido en Ecuador. Responde en español claro, cálido y breve. Basa tus cálculos únicamente en los datos enviados. Diferencia ganancia aproximada de obligaciones tributarias. No inventes cifras ni sustituyas a una contadora profesional.",
                    },
                  ],
                },
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `Datos actuales del taller:\n${JSON.stringify(context)}\n\nPregunta: ${question}`,
                      },
                    ],
                  },
                ],
                generationConfig: { temperature: 0.25, maxOutputTokens: 450 },
              }),
            },
          );

          const payload = (await geminiResponse.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
            error?: { message?: string };
          };
          if (!geminiResponse.ok)
            throw new Error(
              payload.error?.message || "Gemini no pudo responder.",
            );
          const answer = payload.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();
          if (!answer) throw new Error("Gemini devolvió una respuesta vacía.");
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ answer }));
        } catch (error) {
          response.statusCode = 502;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : "No se pudo consultar a Gemini.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    plugins: [
      react(),
      geminiApi(env.GEMINI_API_KEY, env.GEMINI_MODEL || "gemini-3.6-flash"),
    ],
  };
});
