import { createFileRoute, redirect } from "@tanstack/react-router";
import { authQuery } from "@/lib/AuthContext";
import LandingPage from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const { user } = await context.queryClient.ensureQueryData(authQuery);
    if (user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "FUND – Group savings, clearly accounted – Members Only" },
      {
        name: "description",
        content:
          "A private weekly savings and lending ledger for the FUND group. Contributions, loans, interest and repayments in one place.",
      },
    ],
  }),
  component: LandingPage,
});
