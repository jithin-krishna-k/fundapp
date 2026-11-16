import { MfaNotice } from "@/components/auth/MfaParts";

// Local build: two-step verification is not supported, so enrollment is never offered.
export function MfaMethodSetup() {
  return <MfaNotice>Two-step verification is not available in this build.</MfaNotice>;
}
