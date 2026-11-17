import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/LangContext";
import { getLangCookie } from "@/lib/backend-fns";
import appCss from "@/index.css?url";

export const Route = createRootRoute({
  // Per-page <title>/meta come from each route's head(); this is the shared base.
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FUND · Fund Group — Members Only" },
      { name: "description", content: "Private weekly savings and lending management for the FUND group." },
      { name: "theme-color", content: "#F7F9FC" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,450;0,500;0,600;0,700;1,400;1,500&family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  // The fund_lang cookie, read on the server so the first paint is in the chosen language.
  loader: async () => ({ lang: (await getLangCookie().catch(() => null)) || "ml" }),
  staleTime: Infinity,
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  const { lang } = Route.useLoaderData();
  return (
    <AuthProvider>
      <LanguageProvider initialLang={lang}>
        <Outlet />
        <Toaster />
      </LanguageProvider>
    </AuthProvider>
  );
}

// The document. There is no index.html: the server renders <html> from here.
function RootDocument({ children }) {
  const { lang } = Route.useLoaderData() ?? { lang: "ml" };
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      {/* data-react-root: the builder's preview bridge looks for #root and falls back to this. */}
      <body data-react-root="true">
        {children}
        <Scripts />
      </body>
    </html>
  );
}