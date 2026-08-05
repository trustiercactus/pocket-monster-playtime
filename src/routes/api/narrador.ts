import { createFileRoute } from "@tanstack/react-router";

/** Narrador de cuentos: voz neuronal cálida y muy expresiva, en español. */
const INSTRUCTIONS = [
  "Eres un narrador profesional de cuentos infantiles en español de España.",
  "Habla con voz cálida, cercana, amable y muy alegre.",
  "Ritmo pausado y claro, pensado para un niño de cuatro años.",
  "Entonación muy expresiva, con emoción real, sonrisa en la voz,",
  "respiraciones naturales y pronunciación excelente.",
  "Nunca suenes robótico ni leas de forma plana.",
].join(" ");

export const Route = createFileRoute("/api/narrador")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let text = "";
        try {
          const body = (await request.json()) as { text?: unknown };
          if (typeof body.text === "string") text = body.text.trim().slice(0, 300);
        } catch {
          text = "";
        }
        if (!text) return new Response("Falta el texto", { status: 400 });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Narrador no disponible", { status: 503 });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "coral",
            instructions: INSTRUCTIONS,
            response_format: "mp3",
            speed: 0.95,
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          console.error(`TTS failed [${res.status}]: ${detail}`);
          return new Response(detail || "Error de narrador", { status: res.status });
        }

        return new Response(res.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=604800",
          },
        });
      },
    },
  },
});
