// Errors are logged to the server console. Expected auth rejections (401/403) and aborted requests
// (client disconnect / navigation / proxy timeout) are not logged as failures.
const isExpected = (error) =>
  error?.status === 401 ||
  error?.status === 403 ||
  error?.name === "AbortError" ||
  error?.code === "ABORT_ERR";

export function recordFunctionError(error, meta) {
  if (isExpected(error)) return;
  console.error("[server fn error]", meta?.name || meta?.id || "", error);
}
export function recordRequestError(request, error) {
  if (isExpected(error)) return;
  console.error("[request error]", request?.url, error);
}
export function recordErrorResponse(request, response) {
  if (response instanceof Response && response.status >= 500) console.error("[5xx]", request?.url, response.status);
}
