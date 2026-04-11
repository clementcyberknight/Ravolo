import { BACKEND_HTTP_URL } from "@/config/backend";

type ChallengeResponse = {
  challengeId: string;
  message: string;
};

export type AuthChallengeParams =
  | { walletFamily: "solana" }
  | { walletFamily: "eip155"; chainId: number };

export type VerifyWalletBody =
  | {
      walletFamily: "solana";
      wallet: string;
      signature: string;
      challengeId: string;
    }
  | {
      walletFamily: "eip155";
      chainId: number;
      wallet: string;
      signature: string;
      challengeId: string;
    };

export type AuthProfile = {
  id: string;
  walletAddress: string;
  username: string | null;
  createdAt: string;
  achievements: unknown[];
};

export type VerifyResponse = {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  accessExpiresAt: number;
  refreshExpiresInSec: number;
  profile: AuthProfile;
  isNewUser?: boolean;
};

type RefreshResponse = Omit<VerifyResponse, "isNewUser">;

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

/** Backend codes that mean the refresh token (or session) is no longer valid — client must re-authenticate. */
export const REFRESH_SESSION_TERMINAL_CODES = new Set<string>([
  "INVALID_REFRESH_TOKEN",
  "TOKEN_REUSE_DETECTED",
  "REVOKED_REFRESH_TOKEN",
  "EXPIRED_REFRESH_TOKEN",
]);

export function isRefreshSessionTerminalError(
  error: unknown,
): error is AuthApiError {
  return (
    error instanceof AuthApiError &&
    typeof error.code === "string" &&
    REFRESH_SESSION_TERMINAL_CODES.has(error.code)
  );
}

function isAuthProfile(value: unknown): value is AuthProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Partial<AuthProfile>;
  return (
    typeof profile.id === "string" &&
    typeof profile.walletAddress === "string" &&
    (typeof profile.username === "string" || profile.username === null) &&
    typeof profile.createdAt === "string" &&
    Array.isArray(profile.achievements)
  );
}

function isRefreshResponse(value: unknown): value is RefreshResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<RefreshResponse>;
  return (
    typeof payload.accessToken === "string" &&
    typeof payload.refreshToken === "string" &&
    typeof payload.accessExpiresIn === "string" &&
    typeof payload.accessExpiresAt === "number" &&
    typeof payload.refreshExpiresInSec === "number" &&
    isAuthProfile(payload.profile)
  );
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_HTTP_URL}${path}`, init);
  const body = await response.json().catch(() => null);

  // Some environments may incorrectly return 200 with an error-shaped body.
  // Treat any `{ error: string }` payload as a failure to keep client state consistent.
  if (body && typeof body === "object" && typeof (body as any).error === "string") {
    const code = (body as any).error as string;
    const message =
      (body as any).message && typeof (body as any).message === "string"
        ? ((body as any).message as string)
        : code;
    throw new AuthApiError(message, code, response.status);
  }

  if (!response.ok) {
    const code =
      body && typeof body.error === "string" ? body.error : undefined;
    const message =
      (body && typeof body.message === "string" && body.message) ||
      code ||
      `Request failed: ${response.status}`;
    throw new AuthApiError(message, code, response.status);
  }

  return body as T;
}

function challengeQuery(params: AuthChallengeParams): string {
  if (params.walletFamily === "solana") {
    return "walletFamily=solana";
  }
  return `walletFamily=eip155&chainId=${encodeURIComponent(String(params.chainId))}`;
}

/**
 * Request a signable challenge. Backend should scope the nonce to the same
 * `walletFamily` (and `chainId` for EVM) that will be used on `/auth/verify`.
 */
export async function getAuthChallenge(
  params: AuthChallengeParams,
): Promise<ChallengeResponse> {
  const q = challengeQuery(params);
  return requestJson<ChallengeResponse>(`/auth/challenge?${q}`);
}

export async function verifyWalletSignature(
  input: VerifyWalletBody,
): Promise<VerifyResponse> {
  return requestJson<VerifyResponse>("/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function refreshAuthToken(
  refreshToken: string,
): Promise<RefreshResponse> {
  const responseBody = await requestJson<unknown>("/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  console.log("[auth-api] /auth/refresh raw response", responseBody);

  if (!isRefreshResponse(responseBody)) {
    throw new Error("Invalid refresh response payload");
  }

  return responseBody;
}

export async function logoutAuth(refreshToken: string): Promise<void> {
  await requestJson<{ ok: true }>("/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
}
