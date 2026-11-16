import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import AppLayout from "@/components/Layout";
import PendingAccess from "@/components/fund/PendingAccess";
import LoadingState from "@/components/fund/LoadingState";
import LiveSync from "@/components/fund/LiveSync";
import { FundProvider, useFund } from "@/lib/FundContext";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  beforeLoad: requireSignedIn,
  errorComponent: AuthGateError,
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

  if (!fund || fund.loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <LoadingState />
      </div>
    );
  }

  if (fund.error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="font-mal text-[14px]">ഡാറ്റ ലോഡ് ചെയ്യാനായില്ല</p>
        <p className="mt-2 text-[12px] text-muted-foreground">{fund.error}</p>
        <button onClick={() => fund.reload()} className="mt-5 rounded-full bg-primary px-5 py-2 text-[12px] text-primary-foreground">
          വീണ്ടും ശ്രമിക്കുക
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