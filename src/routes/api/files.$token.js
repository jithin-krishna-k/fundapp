import { createFileRoute } from "@tanstack/react-router";
import { verifyFileToken } from "@/lib/file-links.server";
import { query } from "@/lib/pg.server";

// Serves a private upload from Postgres for a short-lived signed link made by createFileSignedUrl.
export const Route = createFileRoute("/api/files/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = verifyFileToken(params.token);
        if (!id) return new Response("Link expired", { status: 404 });
        const { rows } = await query("SELECT name, content_type, bytes FROM app_files WHERE id = $1", [id]);
        if (!rows[0]) return new Response("Not found", { status: 404 });
        return new Response(rows[0].bytes, {
          headers: {
            "Content-Type": rows[0].content_type || "application/octet-stream",
            "Content-Disposition": `inline; filename="${encodeURIComponent(rows[0].name)}"`,
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
