import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/Game";

export const Route = createFileRoute("/jugar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Jugar — Criaturitas" },
      { name: "description", content: "Elige tu criatura, lucha por turnos y sube de nivel." },
      { property: "og:title", content: "Jugar — Criaturitas" },
      { property: "og:description", content: "Batallas por turnos con botones enormes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Game />,
});
