import {
  LayoutDashboard,
  HandCoins,
  Banknote,
  Siren,
  ArrowLeftRight,
  Users,
  Percent,
  ReceiptText,
  FileBarChart2,
  Scale,
  Settings2,
} from "lucide-react";

export const NAV = [
  { to: "/dashboard", ml: "ഡാഷ്ബോർഡ്", en: "Dashboard", icon: LayoutDashboard },
  { to: "/contributions", ml: "സംഭാവനകൾ", en: "Contributions", icon: HandCoins },
  { to: "/request-fund", ml: "ഫണ്ട് അഭ്യർത്ഥന", en: "Request Fund", icon: Banknote },
  { to: "/emergency", ml: "അടിയന്തിരം", en: "Emergency", icon: Siren },
  { to: "/transactions", ml: "ഇടപാടുകൾ", en: "Transactions", icon: ArrowLeftRight },
  { to: "/members", ml: "അംഗങ്ങൾ", en: "Members", icon: Users },
  { to: "/interest", ml: "പലിശ", en: "Interest", icon: Percent },
  { to: "/expenses", ml: "ചെലവുകൾ", en: "Expenses", icon: ReceiptText },
  { to: "/reports", ml: "റിപ്പോർട്ടുകൾ", en: "Reports", icon: FileBarChart2 },
  { to: "/rules", ml: "ഫണ്ട് നിയമങ്ങൾ", en: "Fund Rules", icon: Scale },
  { to: "/settings", ml: "ക്രമീകരണങ്ങൾ", en: "Settings", icon: Settings2 },
];

export const MOBILE_NAV = ["/dashboard", "/contributions", "/request-fund", "/transactions"];