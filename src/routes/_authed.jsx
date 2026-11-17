import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import AppLayout from "@/components/Layout";
import PendingAccess from "@/components/fund/PendingAccess";
import AppLoader from "@/components/fund/AppLoader";
import LiveSync from "@/components/fund/LiveSync";
import { FundProvider, useFund } from "@/lib/FundContext";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  beforeLoad: requireSignedIn,
  errorComponent: AuthGateError,
  pendingComponent: AppLoader,
  pendingMs: 150,
  component: AuthedShell,
});

function AuthedShell() {
  return (
    <FundProvider>
      <FundGate />
    </FundProvider>
  );
}

function FundGate() {
  const fund = useFund();
  const { t, ready } = useLang();

  // Wait for the language too, so the app never flashes in the wrong one.
  if (!fund || fund.loading || !ready) {
    return <AppLoader />;
  }

  if (fund.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-[17px] font-medium">{t("ഡാറ്റ ലോഡ് ചെയ്യാനായില്ല", "Couldn't load your fund data")}</p>
        <p className="mt-2 max-w-md text-[14px] text-muted-foreground">{fund.error}</p>
        <button
          onClick={() => fund.reload()}
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-[14px] text-primary-foreground hover:bg-primary/90"
        >
          {t("വീണ്ടും ശ്രമിക്കുക", "Try again")}
        </button>
      </div>
    );
  }

  if (fund.myMember?.status !== "active") {
    return <PendingAccess member={fund.myMember} />;
  }

  return (
    <AppLayout>
      <LiveSync onChange={fund.reload} />
      <Outlet />
    </AppLayout>
  );
}
