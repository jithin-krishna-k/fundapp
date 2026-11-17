import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/fund/PageHeader";
import EmptyState from "@/components/fund/EmptyState";
import { useFund } from "@/lib/FundContext";
import { useLang } from "@/lib/LangContext";
import { formatDateTime } from "@/lib/format";
import { notificationEnglish } from "@/lib/notification-text";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t, lang } = useLang();
  const fund = useFund();
  const { notifications } = fund;

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    fund.reload();
  };

  const markAll = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { read: true })));
    fund.reload();
  };

  return (
    <div className="page-enter space-y-5">
      <PageHeader
        ml="അറിയിപ്പുകൾ"
        en="Notifications"
        description={t(
          "സംഭാവന ഓർമ്മപ്പെടുത്തലുകൾ, അഭ്യർത്ഥനകളുടെ നില, പലിശ, സൈക്കിൾ തുടങ്ങിയ വിവരങ്ങൾ.",
          "Updates on contribution reminders, request status, interest and cycles."
        )}
        action={
          notifications.some((n) => !n.read) ? (
            <button
              onClick={markAll}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-[13px] text-foreground/80"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("എല്ലാം വായിച്ചു", "Mark all read")}
            </button>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} ml="അറിയിപ്പുകൾ ഇല്ല" en="No notifications yet" />
      ) : (
        <div className="overflow-hidden rounded-[1.2rem] border border-border bg-card">
          {notifications.map((item, index) => (
            <button
              key={item.id}
              onClick={() => !item.read && markRead(item.id)}
              className={cn(
                "block w-full px-4 py-3.5 text-left transition-colors hover:bg-secondary/40",
                index ? "border-t border-border/70" : "",
                item.read ? "" : "bg-primary/[0.04]"
              )}
            >
              <div className="flex items-start gap-2">
                {!item.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                <div className="min-w-0">
                  <p className={cn("text-[14.5px] font-medium leading-snug", lang === "en" ? "" : "font-mal")}>
                    {lang === "en" ? notificationEnglish(item).title_en : item.title}
                  </p>
                  <p className={cn("mt-1 text-[13.5px] leading-relaxed text-muted-foreground", lang === "en" ? "" : "font-mal")}>
                    {lang === "en" ? notificationEnglish(item).body_en : item.body}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground/80">{formatDateTime(item.created_date)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}