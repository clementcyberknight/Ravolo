# Ravolo Frontend Auth and WebSocket Guide

This document explains how a frontend client should authenticate with the Ravolo backend and connect to the game WebSocket.

Ravolo uses wallet-based authentication with Solana Ed25519 signatures.

- No password
- No email
- Identity is the wallet public key
- REST is used for auth and profile
- WebSocket is used for live game state and gameplay actions

## Base URLs

Replace these with your real deployed values:

```text
HTTP API: https://api.example.com
WebSocket: wss://api.example.com/ws
```

For local development, it may look like:

```text
HTTP API: http://localhost:9001
WebSocket: ws://localhost:9001/ws
```

## Authentication Flow

The frontend auth flow is:

1. Call `GET /auth/challenge`
2. Ask the wallet to sign the exact `message`
3. Call `POST /auth/verify` with `wallet`, `signature`, and `challengeId`
4. Store `accessToken` and `refreshToken`
5. Use `accessToken` for authenticated HTTP requests and WebSocket connection
6. If the access token expires, call `POST /auth/refresh`
7. On sign out, call `POST /auth/logout`

## REST Error Format

All REST endpoints return errors in this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

Common auth error codes:

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `BAD_REQUEST` | 400 | Invalid JSON or missing required fields |
| `CHALLENGE_EXPIRED` | 400 | Challenge expired or already used |
| `INVALID_SIGNATURE` | 401 | Wallet signature verification failed |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token is invalid or expired |
| `UNAUTHORIZED` | 401 | Missing or expired access token |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL` | 500 | Unexpected server error |

## 1. Get Challenge

Request a single-use challenge message for the wallet to sign.

### Request

```bash
curl -X GET "http://localhost:9001/auth/challenge"
```

### Successful Response

```json
{
  "challengeId": "b3d2e1f0-aaaa-bbbb-cccc-000000000001",
  "message": "Sign in to Ravolo\n\nChallenge: b3d2e1f0-aaaa-bbbb-cccc-000000000001\nTime: 2026-04-01T18:30:00.000Z"
}
```

### Error Response Example

If the endpoint is spammed:

```json
{
  "error": "RATE_LIMITED",
  "message": "Too many auth requests"
}
```

### Frontend Notes

- Sign the `message` exactly as returned by the server
- Do not trim, reformat, or rebuild the string client-side
- A challenge is single-use and short-lived
- If verification fails because the challenge expired, request a new one

## 2. Verify Wallet Signature

After getting a challenge, the frontend must ask the wallet to sign the message, then send the signature to the backend.

### Request

```bash
curl -X POST "http://localhost:9001/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "signature": "3G5R4ExampleSignatureBase58ReplaceMeXk5XH5...",
    "challengeId": "b3d2e1f0-aaaa-bbbb-cccc-000000000001"
  }'
```

### Successful Response

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque-refresh-token>",
  "accessExpiresIn": "24h",
  "accessExpiresAt": 1775077800,
  "refreshExpiresInSec": 7776000,
  "profile": {
    "id": "3e56e8ee-353e-4629-a5c2-5b18f4f0b0ef",
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "username": "green-river-farmer",
    "createdAt": "2026-04-01T18:30:10.000Z",
    "achievements": ["new_player"]
  },
  "isNewUser": true
}
```

### Error Response Examples

Invalid request body:

```json
{
  "error": "BAD_REQUEST",
  "message": "wallet, signature, and challengeId are required"
}
```

Expired or already-used challenge:

```json
{
  "error": "CHALLENGE_EXPIRED",
  "message": "Challenge missing or expired; request a new one"
}
```

Invalid signature:

```json
{
  "error": "INVALID_SIGNATURE",
  "message": "Signature verification failed"
}
```

### Frontend Notes

- Store both `accessToken` and `refreshToken` securely
- Use `profile.id` as the canonical user identity in client state
- Use `profile.walletAddress` for wallet display and Web3 UX
- `isNewUser` can be used to trigger onboarding flows

## 3. Refresh Session

When the access token expires, use the refresh token to get a new token pair.

### Request

```bash
curl -X POST "http://localhost:9001/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<opaque-refresh-token>"
  }'
```

### Successful Response

```json
{
  "accessToken": "<new-jwt>",
  "refreshToken": "<new-refresh-token>",
  "accessExpiresIn": "24h",
  "accessExpiresAt": 1775164200,
  "refreshExpiresInSec": 7776000,
  "profile": {
    "id": "3e56e8ee-353e-4629-a5c2-5b18f4f0b0ef",
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "username": "green-river-farmer",
    "createdAt": "2026-04-01T18:30:10.000Z",
    "achievements": ["new_player"]
  }
}
```

### Error Response Example

```json
{
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Invalid or expired refresh token"
}
```

### Frontend Notes

- Refresh tokens are rotated
- After a successful refresh, replace both the old access token and the old refresh token
- Do not keep using the previous refresh token after refresh succeeds

## 4. Logout

Invalidate the session server-side.

### Request

```bash
curl -X POST "http://localhost:9001/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<opaque-refresh-token>"
  }'
```

### Successful Response

```json
{
  "ok": true
}
```

### Frontend Notes

- Always clear local auth state after logout
- Clear:
  - access token
  - refresh token
  - cached profile
  - any live WebSocket connection

## 5. Authenticated Profile Update Example

The backend also supports authenticated HTTP endpoints using the access token.

Example: update username.

### Request

```bash
curl -X PATCH "http://localhost:9001/profile/username" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{
    "username": "harvestqueen"
  }'
```

### Successful Response

```json
{
  "profile": {
    "id": "3e56e8ee-353e-4629-a5c2-5b18f4f0b0ef",
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "username": "harvestqueen",
    "createdAt": "2026-04-01T18:30:10.000Z",
    "achievements": ["new_player"]
  }
}
```

### Error Response Example

Missing bearer token:

```json
{
  "error": "UNAUTHORIZED",
  "message": "Missing bearer token"
}
```

Expired bearer token:

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

## Access Token Payload

The backend signs access tokens with this payload shape:

```json
{
  "sub": "uuid-user-id",
  "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "iat": 1774991400,
  "exp": 1775077800
}
```

Meaning:

- `sub`: canonical user ID
- `wallet`: Solana wallet public key
- `iat`: issued-at unix timestamp
- `exp`: expiry unix timestamp

## Connecting to the WebSocket

The game WebSocket endpoint is:

```text
/ws
```

The server accepts the access token in either of these ways:

1. `Authorization: Bearer <accessToken>`
2. Query string fallback: `?token=<accessToken>`

The query string approach is useful for environments where setting custom WebSocket headers is difficult.

### Browser or React Native Safe Option

```ts
const ws = new WebSocket(
  `wss://api.example.com/ws?token=${encodeURIComponent(accessToken)}`
);
```

### Node or Custom Client With Authorization Header

```ts
import WebSocket from "ws";

const ws = new WebSocket("wss://api.example.com/ws", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### Connection Failure Examples

No token:

```text
HTTP 401 Unauthorized
JWT required: Authorization: Bearer <token> or ?token=
```

Expired or invalid token:

```text
HTTP 401 Unauthorized
Invalid or expired token
```

## What Happens After WebSocket Connect

After a successful connection, the backend immediately sends initial state messages.

Typical first messages:

### `GAME_STATUS`

```json
{
  "type": "GAME_STATUS",
  "data": {
    "prices": {},
    "plots": {
      "starterPlots": 4,
      "starterPlotIds": [0, 1, 2, 3],
      "purchasable": true,
      "maxPlots": 32,
      "purchaseBaseGold": 300,
      "purchaseStepGold": 100,
      "pricingFormula": "base + (ownedPurchasedPlots * step)",
      "loanCollateralValueGold": 0,
      "note": "Game status metadata"
    },
    "activeEvent": null,
    "serverNowMs": 1774991400000
  }
}
```

### `GAME_STATE`

```json
{
  "type": "GAME_STATE",
  "data": {
    "inventory": {
      "seed:wheat": 2
    },
    "gold": 250,
    "plots": []
  }
}
```

## WebSocket Message Encoding

The Ravolo backend uses MessagePack binary frames for game messages.

Frontend implications:

- Incoming WebSocket messages should be decoded from MessagePack
- Outgoing gameplay messages should be encoded as MessagePack binary
- The server may reject malformed payloads

Example browser client outline:

```ts
import { encode, decode } from "@msgpack/msgpack";

const ws = new WebSocket(
  `wss://api.example.com/ws?token=${encodeURIComponent(accessToken)}`
);

ws.binaryType = "arraybuffer";

ws.onmessage = (event) => {
  const data = new Uint8Array(event.data as ArrayBuffer);
  const message = decode(data);
  console.log("ws message", message);
};

function sendPlant(plotId: number, cropId: string) {
  const payload = {
    type: "PLANT",
    payload: {
      plotId,
      cropId,
      requestId: crypto.randomUUID(),
    },
  };

  ws.send(encode(payload));
}
```

## WebSocket Error Shape

All WebSocket errors use this format:

```json
{
  "type": "ERROR",
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "details": {}
}
```

### Example WebSocket Error

Rate limit error:

```json
{
  "type": "ERROR",
  "code": "RATE_LIMITED",
  "message": "Too many actions"
}
```

Internal error:

```json
{
  "type": "ERROR",
  "code": "INTERNAL",
  "message": "Internal error"
}
```

## Frontend Integration Checklist

- Fetch challenge from `GET /auth/challenge`
- Sign the exact challenge message with the Solana wallet
- Verify with `POST /auth/verify`
- Store `accessToken` and `refreshToken`
- Attach `Authorization: Bearer <accessToken>` to protected HTTP requests
- Connect WebSocket with the access token
- Decode incoming frames using MessagePack
- Refresh tokens when needed with `POST /auth/refresh`
- Replace stored refresh token after every successful refresh
- Logout with `POST /auth/logout`
- Clear local auth state and close WebSocket on sign out

## Recommended Frontend Session Strategy

- Keep `accessToken` in memory if possible
- Store `refreshToken` in secure device storage
- Reconnect WebSocket after refresh if needed
- If WebSocket connection fails with auth errors, attempt refresh once
- If refresh fails, force a full sign-out and ask the user to sign in again
