import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import PageHeader from "@/components/fund/PageHeader";
import { useFund } from "@/lib/FundContext";
import { buildReports } from "@/lib/reports";
import { useLang } from "@/lib/LangContext";
import { downloadCsv } from "@/lib/uploads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/reports")({
  component: ReportsPage,
});

const ORDER = [
  ["weekly", "ആഴ്ച ശേഖരണം", "Weekly collection"],
  ["monthly", "മാസ ശേഖരണം", "Monthly collection"],
  ["member", "അംഗ സംഭാവന", "Member contributions"],
  ["loans", "വായ്പ", "Loans"],
  ["outstanding", "ബാക്കി തുക", "Outstanding"],
  ["interestCollection", "പലിശ ശേഖരണം", "Interest collected"],
  ["interestDistribution", "പലിശ വിതരണം", "Interest distribution"],
  ["expenses", "ചെലവുകൾ", "Expenses"],
  ["cashFlow", "ക്യാഷ് ഫ്ലോ", "Cash flow"],
  ["cycle", "സൈക്കിൾ റിപ്പോർട്ട്", "Cycle report"],
];

function ReportsPage() {
  const { t: tr, lang } = useLang();
  const fund = useFund();
  const [active, setActive] = useState("weekly");
  const reports = useMemo(() => buildReports(fund), [fund]);
  const report = reports[active];

  const exportCsv = () => {
    downloadCsv(`${active}-report.csv`, report.columns, report.rows);
  };

  return (
    <div className="page-enter space-y-5">
      <PageHeader
        ml="റിപ്പോർട്ടുകൾ"
        en="Financial reports"
        description={tr(
          "ഗ്രൂപ്പിന്റെ സാമ്പത്തിക റിപ്പോർട്ടുകൾ. CSV ആയി ഡൗൺലോഡ് ചെയ്യാം, അല്ലെങ്കിൽ പ്രിന്റ് / PDF ആയി സൂക്ഷിക്കാം.",
          "The group's financial reports. Download them as CSV, or save as print / PDF."
        )}
        action={
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-[13px] text-foreground/80"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.8} /> CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={1.8} /> PDF
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {ORDER.map(([key, label, labelEn]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mal text-[12.5px] transition-colors",
              active === key ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card text-foreground/70"
            )}
          >
            {tr(label, labelEn)}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-[1.2rem] border border-border bg-card">
        <div className="flex items-end justify-between gap-3 border-b border-border/70 px-4 py-3">
          <div>
            <h2 className="font-mal text-[15px]">{lang === "en" ? report.en : report.title}</h2>
            <p className="mt-0.5 text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {lang === "en" ? report.title : report.en}
            </p>
          </div>
          <p className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">{report.rows.length} rows</p>
        </div>

        {report.rows.length === 0 ? (
          <p className="px-4 py-10 text-center font-mal text-[13.5px] text-muted-foreground">
            {tr("ഡാറ്റ ലഭ്യമല്ല", "No data available")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-border/70">
                  {report.columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border/50 last:border-0">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="tnum whitespace-nowrap px-4 py-2.5 text-[13px]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}