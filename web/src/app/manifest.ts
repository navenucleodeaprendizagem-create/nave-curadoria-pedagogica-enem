import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NAVE | Sistema de Inteligência e Gestão da Aprendizagem",
    short_name: "NAVE",
    description:
      "Sistema NAVE para curadoria pedagógica, sequências, validação e gestão da aprendizagem.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f6",
    theme_color: "#0f766e",
    lang: "pt-BR",
  };
}
