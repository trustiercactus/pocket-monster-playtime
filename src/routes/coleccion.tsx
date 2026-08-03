import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/Game";

export const Route = createFileRoute("/coleccion")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Colección — Criaturitas" },
      { name: "description", content: "Mira todas las criaturas que has conseguido." },
      { property: "og:title", content: "Colección — Criaturitas" },
      { property: "og:description", content: "Tu álbum de criaturas con barra de progreso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Game initialScreen="coleccion" />,
});
