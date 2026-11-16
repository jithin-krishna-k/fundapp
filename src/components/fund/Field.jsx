import { cn } from "@/lib/utils";

export default function Field({ label, hint, children, className }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="mb-1.5 block font-mal text-[11.5px] text-muted-foreground">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[10.5px] leading-relaxed text-muted-foreground">{hint}</span>}
    </label>
  );
}