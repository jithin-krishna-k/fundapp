import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FUND — കൂട്ടായ്മയുടെ പണം, വ്യക്തമായ കണക്കിൽ · Members Only" },
      {
        name: "description",
        content:
          "A private weekly savings and lending ledger for the FUND group. Contributions, loans, interest and repayments in one place.",
      },
    ],
  }),
  component: LandingPage,
});
