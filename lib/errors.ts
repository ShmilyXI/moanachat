export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "not_configured"
  | "rate_limit"
  | "offline";

export type Surface =
  | "chat"
  | "auth"
  | "api"
  | "stream"
  | "database"
  | "history"
  | "vote"
  | "document"
  | "suggestions"
  | "activate_gateway";

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = "response" | "log" | "none";

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  activate_gateway: "response",
  api: "response",
  auth: "response",
  chat: "response",
  database: "log",
  document: "response",
  history: "response",
  stream: "response",
  suggestions: "response",
  vote: "response",
};

export class ChatbotError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string | ErrorOptions) {
    const message = getMessageByErrorCode(errorCode);
    const options = typeof cause === "string" ? undefined : cause;

    super(message, options);

    const [type, surface] = errorCode.split(":");

    this.type = type as ErrorType;
    if (typeof cause === "string") {
      this.cause = cause;
    }
    this.surface = surface as Surface;
    this.statusCode = getStatusCodeByType(this.type);
  }

  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === "log") {
      console.error({
        cause,
        code,
        message,
      });

      return Response.json(
        { code: "", message: "Something went wrong. Please try again later." },
        { status: statusCode }
      );
    }

    return Response.json({ cause, code, message }, { status: statusCode });
  }
}

type AIProviderErrorDetails = {
  statusCodes: number[];
  text: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectAIProviderErrorDetails(
  value: unknown,
  details: AIProviderErrorDetails,
  seen: Set<object>,
  depth = 0
) {
  if (depth > 4 || value === null || value === undefined) {
    return;
  }

  if (typeof value === "string") {
    details.text.push(value);
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (seen.has(value)) {
    return;
  }
  seen.add(value);

  const { errors, statusCode } = value;
  if (typeof statusCode === "number") {
    details.statusCodes.push(statusCode);
  }

  for (const key of ["message", "responseBody", "code"]) {
    const text = value[key];
    if (typeof text === "string") {
      details.text.push(text);
      if (key === "responseBody") {
        try {
          collectAIProviderErrorDetails(
            JSON.parse(text),
            details,
            seen,
            depth + 1
          );
        } catch {
          // Some providers return a plain-text error body.
        }
      }
    }
  }

  for (const key of ["data", "error", "cause", "lastError"]) {
    collectAIProviderErrorDetails(value[key], details, seen, depth + 1);
  }

  if (Array.isArray(errors)) {
    for (const nestedError of errors) {
      collectAIProviderErrorDetails(nestedError, details, seen, depth + 1);
    }
  }
}

/**
 * Maps known upstream provider failures to actionable, safe client messages.
 * Provider response bodies are inspected only for classification and are never returned.
 */
export function getAIProviderErrorMessage(error: unknown): string | undefined {
  const details: AIProviderErrorDetails = { statusCodes: [], text: [] };
  collectAIProviderErrorDetails(error, details, new Set<object>());

  const text = details.text.join("\n");
  if (
    /(insufficient[\s_-]*(user[\s_-]*)?(quota|balance)|quota[\s_-]*exceeded|余额不足|额度不足|余额不够|额度不够|请充值|充值后)/i.test(
      text
    )
  ) {
    return "The AI provider account has insufficient balance. Recharge the account or choose another enabled model.";
  }

  if (details.statusCodes.includes(401)) {
    return "The AI provider rejected the API key. Check the API URL and key in /api-dashboard.";
  }

  if (details.statusCodes.includes(429)) {
    return "The AI provider is rate limiting requests. Please wait and try again.";
  }

  if (details.statusCodes.includes(403)) {
    return "The AI provider denied this request. Check the account permissions and enabled model.";
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes("database")) {
    return "An error occurred while executing a database query.";
  }

  switch (errorCode) {
    case "bad_request:api":
      return "The request couldn't be processed. Please check your input and try again.";

    case "bad_request:activate_gateway":
      return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";

    case "unauthorized:auth":
      return "You need to sign in before continuing.";
    case "forbidden:auth":
      return "Your account does not have access to this feature.";

    case "rate_limit:chat":
      return "You've reached the message limit. Come back in 1 hour to continue chatting.";
    case "not_found:chat":
      return "The requested chat was not found. Please check the chat ID and try again.";
    case "forbidden:chat":
      return "This chat belongs to another user. Please check the chat ID and try again.";
    case "unauthorized:chat":
      return "You need to sign in to view this chat. Please sign in and try again.";
    case "not_configured:chat":
      return "No AI provider is configured. Open /api-dashboard to add your New API connection.";
    case "offline:chat":
      return "We're having trouble sending your message. Please check your internet connection and try again.";

    case "not_found:document":
      return "The requested document was not found. Please check the document ID and try again.";
    case "forbidden:document":
      return "This document belongs to another user. Please check the document ID and try again.";
    case "unauthorized:document":
      return "You need to sign in to view this document. Please sign in and try again.";
    case "bad_request:document":
      return "The request to create or update the document was invalid. Please check your input and try again.";

    default:
      return "Something went wrong. Please try again later.";
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "not_configured":
      return 503;
    case "offline":
      return 503;
    default:
      return 500;
  }
}
