type GeminiPayload = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export default {
  async fetch(request: Request) {
    if (request.method !== "POST")
      return Response.json({ error: "Método no permitido." }, { status: 405 });

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    if (!apiKey)
      return Response.json(
        { error: "Gemini no está configurado en Vercel." },
        { status: 503 },
      );

    try {
      const { question, context } = (await request.json()) as {
        question?: string;
        context?: unknown;
      };
      if (!question?.trim())
        return Response.json(
          { error: "Escribe una pregunta." },
          { status: 400 },
        );

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
      const payload = (await geminiResponse.json()) as GeminiPayload;
      if (!geminiResponse.ok)
        return Response.json(
          { error: payload.error?.message || "Gemini no pudo responder." },
          { status: geminiResponse.status },
        );

      const answer = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();
      if (!answer)
        return Response.json(
          { error: "Gemini devolvió una respuesta vacía." },
          { status: 502 },
        );
      return Response.json({ answer });
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "No se pudo consultar a Gemini.",
        },
        { status: 502 },
      );
    }
  },
};
