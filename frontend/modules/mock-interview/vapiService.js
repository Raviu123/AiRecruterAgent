import Vapi from "@vapi-ai/web";

/**
 * Vapi Voice Service Module
 * The assistant configuration is built by the backend (GET /api/interviews/:id/assistant-config);
 * this module only owns the browser-side Web SDK instance.
 */

const PLACEHOLDER_KEY = /your|placeholder|xxx|changeme/i;

/**
 * True when a real-looking public key is set (template placeholders don't count).
 */
export function isVoiceConfigured() {
  const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  return Boolean(apiKey) && !PLACEHOLDER_KEY.test(apiKey);
}

/**
 * Turn a Vapi `error` event payload into a message a user can act on.
 * API failures arrive as a fetch Response with `status` and a JSON `error` body;
 * call/device failures arrive as Daily errors with `errorMsg` / `error.type`.
 */
export function describeVapiError(error) {
  const body = error?.error;
  const status = error?.status ?? body?.statusCode;
  const rawMessage =
    (typeof body === "string" ? body : body?.message ?? body?.msg) ?? error?.errorMsg ?? error?.message;
  const message = Array.isArray(rawMessage) ? rawMessage.join("; ") : rawMessage;

  if (status === 401 || status === 403) {
    return `Vapi rejected the public key (HTTP ${status}). Set a valid NEXT_PUBLIC_VAPI_PUBLIC_KEY in frontend/.env.local and restart the dev server.`;
  }
  if (status) {
    return `Vapi could not start the call (HTTP ${status})${message ? `: ${message}` : ""}.`;
  }
  if (/not.?allowed|permission|denied/i.test(`${body?.type ?? ""} ${message ?? ""}`)) {
    return "Microphone access was blocked. Allow the microphone for this site in your browser and try again.";
  }
  return message ? `Voice call error: ${message}` : "The voice call could not be started.";
}

export function createVapiInstance() {
  const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  if (!isVoiceConfigured()) {
    console.warn("Vapi Public Key (NEXT_PUBLIC_VAPI_PUBLIC_KEY) is missing or still a placeholder.");
    return null;
  }
  try {
    return new Vapi(apiKey);
  } catch (error) {
    console.error("Failed to initialize Vapi Web SDK:", error);
    return null;
  }
}

/**
 * Normalize a Vapi `conversation-update` payload into interviewer/candidate turns.
 */
export function toTranscript(conversation) {
  if (!Array.isArray(conversation)) return [];
  return conversation
    .filter((item) => item?.role === "assistant" || item?.role === "user")
    .map((item) => ({ role: item.role, content: String(item.content ?? item.message ?? "").trim() }))
    .filter((item) => item.content);
}
