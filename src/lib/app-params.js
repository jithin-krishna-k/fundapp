import { getAccessToken } from "@/api/base44Client";

export function getAppParams() {
  return { appId: "local", token: getAccessToken(), functionsVersion: undefined, appBaseUrl: undefined };
}
