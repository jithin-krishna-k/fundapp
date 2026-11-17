import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeClient } from "@neon/realtime/client";
import { RealtimeProvider, useLiveQuery } from "@neon/realtime-react";
import { sealRecordChanges } from "@/lib/backend-fns";

// Neon Realtime: watches the record-change live query and reloads the fund data when another member's
// change commits, so every open screen stays current without a manual refresh.
// Whenever the live connection is not up (not configured, failed to start, reconnecting), a light
// poll takes over so the data still catches up on its own.
const REALTIME_URL = import.meta.env.VITE_NEON_REALTIME_URL;
const FALLBACK_POLL_MS = 15000;

// A full page load resets this; once a renewal fails as signed out, stop asking the server.
let signedOut = false;

async function renew() {
  if (signedOut) throw new Error("Signed out");
  try {
    return await sealRecordChanges();
  } catch (err) {
    if (err?.status === 401 || /unauthorized/i.test(err?.message || "")) {
      signedOut = true;
      window.location.reload();
    }
    throw err;
  }
}

export default function LiveSync({ onChange }) {
  // One client per mounted app, created in the browser (never during SSR).
  const [client] = useState(() => (REALTIME_URL ? createRealtimeClient({ url: REALTIME_URL }) : null));
  const [sealed, setSealed] = useState(null);
  const [live, setLive] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!client) return;
    let active = true;
    renew()
      .then((q) => active && setSealed(q))
      .catch((err) => console.warn("[realtime] not started:", err?.message));
    return () => {
      active = false;
    };
  }, [client]);

  // Fallback: poll while the live connection is down, only when the tab is visible.
  useEffect(() => {
    if (live) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") onChangeRef.current?.();
    }, FALLBACK_POLL_MS);
    return () => clearInterval(id);
  }, [live]);

  if (!client || !sealed) return null;
  return (
    <RealtimeProvider client={client}>
      <Watcher sealed={sealed} onChangeRef={onChangeRef} onLive={setLive} />
    </RealtimeProvider>
  );
}

function Watcher({ sealed, onChangeRef, onLive }) {
  const refreshQuery = useCallback(() => renew(), []);
  const { status, error, utils } = useLiveQuery(sealed, { refreshQuery });

  useEffect(() => {
    let timer;
    let first = true;
    const off = utils.onUpdate((update) => {
      // The first full result is just the starting point; later full results come after a
      // reconnect and may include changes missed while offline, so they reload too.
      if (update.type === "rows" && first) {
        first = false;
        return;
      }
      first = false;
      // Several transactions in quick succession → one reload.
      clearTimeout(timer);
      timer = setTimeout(() => onChangeRef.current?.(), 250);
    });
    return () => {
      clearTimeout(timer);
      off();
    };
  }, [utils, onChangeRef]);

  useEffect(() => {
    onLive(status === "live");
    if (status === "error") console.warn("[realtime] live updates stopped:", error?.message);
  }, [status, error, onLive]);

  useEffect(() => () => onLive(false), [onLive]);

  return <span hidden data-live-status={status} />;
}
