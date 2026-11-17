import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, ExternalLink, Siren, X } from "lucide-react";
import PageHeader from "@/components/fund/PageHeader";
import StatusPill from "@/components/fund/StatusPill";
import EmptyState from "@/components/fund/EmptyState";
import NewEmergencyDialog from "@/components/emergency/NewEmergencyDialog";
import { useFund } from "@/lib/FundContext";
import { formatDate, inr } from "@/lib/format";
import { voteEmergency } from "@/lib/server-fns";
import { openPrivate } from "@/lib/uploads";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/emergency")({
  component: EmergencyPage,
});

const CASE_LABEL = {
  hospital: { ml: "ആശുപത്രി", en: "Hospital" },
  medical: { ml: "മെഡിക്കൽ", en: "Medical" },
  urgent: { ml: "അടിയന്തിരം", en: "Urgent" },
};

function EmergencyPage() {
  const { t } = useLang();
  const fund = useFund();
  const { emergencies, myMember } = fund;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);

  const vote = async (id, decision) => {
    setBusy(id + decision);
    try {
      await voteEmergency({ data: { id, decision } });
      toast.success(decision === "approve" ? "അനുമതി രേഖപ്പെടുത്തി" : "നിരസിച്ചു");
      fund.reload();
    } catch (error) {
      toast.error(error?.message || "നടപടി പരാജയപ്പെട്ടു");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        ml="അടിയന്തിര അഭ്യർത്ഥനകൾ"
        en="Emergency requests"
        description={t(
          "ആശുപത്രി, മെഡിക്കൽ തുടങ്ങിയ അടിയന്തിര സാഹചര്യങ്ങൾക്ക് മുൻഗണന നൽകും. എല്ലാ അംഗങ്ങളുടെയും തീരുമാനം രേഖപ്പെടുത്തണം.",
          "Hospital and medical emergencies get priority. Every member's decision must be recorded."
        )}
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground"
          >
            <Siren className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("പുതിയ അഭ്യർത്ഥന", "New request")}
          </button>
        }
      />

      {emergencies.length === 0 ? (
        <EmptyState
          icon={Siren}
          ml="അടിയന്തിര അഭ്യർത്ഥനകൾ ഇല്ല"
          en="No emergency requests"
          action={
            <button onClick={() => setOpen(true)} className="rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground">
              {t("അഭ്യർത്ഥന സമർപ്പിക്കുക", "Submit a request")}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {emergencies.map((item) => {
            const decisions = item.decisions || [];
            const approvals = decisions.filter((d) => d.decision === "approve").length;
            const required = Number(item.required_approvals) || 1;
            const mine = decisions.find((d) => d.member_id === myMember?.id);
            return (
              <article key={item.id} className="rounded-[1.3rem] border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mal text-[15px]">{item.member_name}</p>
                      <StatusPill tone="accent">
                      {t(CASE_LABEL[item.case_type]?.ml, CASE_LABEL[item.case_type]?.en)}
                    </StatusPill>
                    </div>
                    <p className="mt-1.5 font-mal text-[13px] leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="tnum font-display text-[1.25rem] leading-none">{inr(item.amount)}</p>
                    <p className="mt-1 text-[11.5px] uppercase tracking-[0.12em] text-muted-foreground">
                      {formatDate(item.created_date)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                  <StatusPill tone={item.status === "approved" ? "paid" : item.status === "rejected" ? "overdue" : "pending"}>
                    {item.status === "approved"
                      ? t("അംഗീകരിച്ചു", "Approved")
                      : item.status === "rejected"
                        ? t("നിരസിച്ചു", "Rejected")
                        : t("തീരുമാനം ബാക്കി", "Decision pending")}
                  </StatusPill>
                  <span className="font-mal text-[12.5px] text-muted-foreground">
                    {approvals}/{required} {t("അനുമതി", "approvals")}
                  </span>
                  {item.document_url && (
                    <button
                      onClick={() => openPrivate(item.document_url)}
                      className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[12px] text-muted-foreground"
                    >
                      <ExternalLink className="h-3 w-3" strokeWidth={1.8} /> {t("രേഖ", "Document")}
                    </button>
                  )}
                  <div className="ml-auto flex gap-1.5">
                    {item.status === "open" && !mine && (
                      <>
                        <button
                          onClick={() => vote(item.id, "approve")}
                          disabled={busy === item.id + "approve"}
                          className="flex items-center gap-1 rounded-full bg-emerald-600/12 px-3 py-1.5 text-[12.5px] text-emerald-800"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2} /> {t("അനുമതി", "Approve")}
                        </button>
                        <button
                          onClick={() => vote(item.id, "reject")}
                          disabled={busy === item.id + "reject"}
                          className="flex items-center gap-1 rounded-full bg-red-600/10 px-3 py-1.5 text-[12.5px] text-red-800"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} /> {t("വേണ്ട", "Reject")}
                        </button>
                      </>
                    )}
                    {item.status === "open" && mine && (
                      <span className="font-mal text-[12px] text-muted-foreground">
                        {t("നിങ്ങളുടെ തീരുമാനം", "Your decision")}:{" "}
                        {mine.decision === "approve" ? t("അനുമതി", "Approved") : t("വേണ്ട", "Rejected")}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <NewEmergencyDialog open={open} onOpenChange={setOpen} onDone={() => fund.reload()} />
    </div>
  );
}