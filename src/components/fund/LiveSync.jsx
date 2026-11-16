import { useCallback, useEffect, useRef, useState } from "react";
import { createRealtimeClient } from "@neon/realtime/client";
import { RealtimeProvider, useLiveQuery } from "@neon/realtime-react";
import { sealRecordChanges } from "@/lib/backend-fns";

// Neon Realtime: watches the record-change live query and reloads the fund data when another member's
// change commits, so every open dashboard stays current without polling or a manual refresh.
const REALTIME_URL = import.meta.env.VITE_NEON_REALTIME_URL;

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

  useEffect(() => {
    let active = true;
    renew()
      .then((q) => active && setSealed(q))
      .catch((err) => console.warn("[realtime] not started:", err?.message));
    return () => {
      active = false;
    };
  }, []);

  if (!client || !sealed) return null;
  return (
    <RealtimeProvider client={client}>
      <Watcher sealed={sealed} onChange={onChange} />
    </RealtimeProvider>
  );
}

function Watcher({ sealed, onChange }) {
  const refreshQuery = useCallback(() => renew(), []);
  const { status, error, utils } = useLiveQuery(sealed, { refreshQuery });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let timer;
    const off = utils.onUpdate((update) => {
      if (update.type !== "changes") return;
      // Several transactions in quick succession → one reload.
      clearTimeout(timer);
      timer = setTimeout(() => onChangeRef.current?.(), 250);
    });
    return () => {
      clearTimeout(timer);
      off();
    };
  }, [utils]);

  useEffect(() => {
    if (status === "error") console.warn("[realtime] live updates stopped:", error?.message);
  }, [status, error]);

  return <span hidden data-live-status={status} />;
}
