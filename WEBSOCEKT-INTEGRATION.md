# Ravolo — Mobile Integration Guide

This document covers everything a mobile developer needs from the moment a user completes signup through all real-time game actions over the WebSocket.

---

## Base URLs

| Environment | HTTP                                               | WebSocket                                        |
| ----------- | -------------------------------------------------- | ------------------------------------------------ |
| Production  | `https://ravolo-backend-production.up.railway.app` | `wss://ravolo-backend-production.up.railway.app` |

---

## Part 1 — Authentication (HTTP)

Authentication is wallet-based (Solana Ed25519). There is no password. The flow is always two steps.

### Step 1 — Request a challenge

```
GET /auth/challenge
```

No headers required.

```bash
curl https://ravolo-backend-production.up.railway.app/auth/challenge
```

**Success — 200**

```json
{
  "challengeId": "b3d2e1f0-aaaa-bbbb-cccc-000000000001",
  "message": "Sign in to Ravolo\n\nChallenge: b3d2e1f0-aaaa-bbbb-cccc-000000000001\nTime: 2024-01-01T00:00:00.000Z"
}
```

The challenge expires in **5 minutes**. It is single-use — once verified it is deleted server-side.

---

### Step 2 — Verify signature and get tokens

The user signs `message` from Step 1 with their Solana private key using Ed25519. Submit the base58-encoded signature.

```
POST /auth/verify
Content-Type: application/json
```

```bash
curl -X POST https://ravolo-backend-production.up.railway.app/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "signature": "5KtPn1...<base58 Ed25519 signature>",
    "challengeId": "b3d2e1f0-aaaa-bbbb-cccc-000000000001"
  }'
```

**Fields**

| Field         | Type   | Description                                    |
| ------------- | ------ | ---------------------------------------------- |
| `wallet`      | string | Solana public key, base58 encoded              |
| `signature`   | string | Ed25519 signature of `message`, base58 encoded |
| `challengeId` | string | UUID from Step 1                               |

**Success — 200**

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<base64url string>",
  "accessExpiresIn": "24h",
  "accessExpiresAt": 1700086400,
  "refreshExpiresInSec": 7776000,
  "profile": {
    "id": "uuid-user-id",
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "username": "happy-tiger-42",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "achievements": ["new_player"]
  },
  "isNewUser": true
}
```

Store `accessToken` and `refreshToken` securely. For new users (`isNewUser: true`) the starter grant (250 gold, 2 wheat seeds, 4 plots) has already been applied before this response is returned.

**Error responses**

| HTTP | code                | Reason                                   |
| ---- | ------------------- | ---------------------------------------- |
| 400  | `CHALLENGE_EXPIRED` | Challenge not found or TTL elapsed       |
| 401  | `INVALID_SIGNATURE` | Signature does not verify against wallet |
| 500  | `DATABASE`          | Profile creation failed after 8 retries  |

---

### Refresh access token

The access token has a 24-hour TTL. Refresh it before it expires using the refresh token. The refresh token is single-use — a new one is issued on every refresh.

```
POST /auth/refresh
Content-Type: application/json
```

```bash
curl -X POST https://ravolo-backend-production.up.railway.app/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<your refresh token>"}'
```

**Success — 200** — same shape as `/auth/verify` response, without `isNewUser`.

**Error — 401**

```json
{
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token invalid or expired"
}
```

---

### Logout

```
POST /auth/logout
Content-Type: application/json
```

```bash
curl -X POST https://ravolo-backend-production.up.railway.app/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<your refresh token>"}'
```

**Success — 200**

```json
{ "ok": true }
```

---

### Update username

```
PATCH /profile/username
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```bash
curl -X PATCH https://ravolo-backend-production.up.railway.app/profile/username \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"username": "my_new_name"}'
```

Username rules: 3–20 characters, alphanumeric plus `_` and `-`.

**Success — 200** — returns updated `profile` object.

---

### Game catalog (prices, crops, animals, recipes)

No auth required. Fetch once on app launch and cache.

```bash
curl https://ravolo-backend-production.up.railway.app/catalog
```

Returns all static pricing data: seed costs, animal costs, tool costs, crop grow times, animal produce intervals, crafting recipes.

---

## Part 2 — WebSocket Connection

### Endpoint

```
wss://ravolo-backend-production.up.railway.app/ws
```

### Authentication

Pass the `accessToken` as a header or query parameter.

**Header (preferred):**

```
Authorization: Bearer <accessToken>
```

**Query parameter (use when headers are not supported by your WS client):**

```
wss://ravolo-backend-production.up.railway.app/ws?token=<accessToken>
```

If the token is missing or invalid the server returns `HTTP 401` during the WebSocket handshake and the connection is rejected — no WS frame is ever sent.

```bash
# Test connection with wscat
wscat -c "wss://ravolo-backend-production.up.railway.app/ws" \
  -H "Authorization: Bearer <accessToken>"
```

---

### Wire format — MessagePack binary

All frames are **MessagePack binary**. The server will also accept UTF-8 JSON text frames (useful during development/testing), but production must use binary.

Every message — both inbound (client → server) and outbound (server → client) — is a MessagePack-encoded object with this top-level shape:

**Inbound (you send):**

```
{ "type": "<ACTION_NAME>", "payload": { ... } }
```

**Outbound (you receive):**

```
{ "type": "<RESPONSE_TYPE>", "data": { ... } }
```

or for errors:

```
{ "type": "ERROR", "code": "<ERROR_CODE>", "message": "<human string>", "details": { ... } }
```

---

### On connect — GAME_STATE push

Immediately after the WebSocket handshake completes, the server pushes a full game state snapshot. You do not need to request it. This is the first frame you will receive.

```json
{
  "type": "GAME_STATE",
  "data": {
    "gold": 250,
    "syndicateId": null,
    "plots": [
      { "plotId": 0, "status": "empty" },
      { "plotId": 1, "status": "empty" },
      { "plotId": 2, "status": "empty" },
      { "plotId": 3, "status": "empty" }
    ],
    "inventory": {
      "seed:wheat": 2
    }
  }
}
```

**Plot status values**

| status      | Additional fields present                                        |
| ----------- | ---------------------------------------------------------------- |
| `"empty"`   | none                                                             |
| `"planted"` | `cropId`, `plantedAtMs`, `readyAtMs`, `outputQty`, `harvestItem` |
| `"ready"`   | `cropId`, `harvestItem`, `outputQty`                             |
| `"decayed"` | `cropId`                                                         |

---

### Idle timeout

The connection is dropped after **120 seconds** of inactivity. Send a `PING` to keep it alive.

---

### Rate limit

**20 actions per second** per user. Exceeding this returns:

```json
{ "type": "ERROR", "code": "RATE_LIMITED", "message": "Too many actions" }
```

---

### Universal error shape

Every error frame has this exact structure:

```json
{
  "type": "ERROR",
  "code": "ERR_CODE_STRING",
  "message": "Human readable description",
  "details": {}
}
```

`details` may be omitted. Always key your error handling on `code`, not `message`.

---

## Part 3 — Commands Reference

### PING / PONG

Keepalive. Send every 30–60 seconds.

**Send:**

```json
{ "type": "PING" }
```

**Receive:**

```json
{ "type": "PONG" }
```

---

### PLANT — Plant a crop on a plot

**Send:**

```json
{
  "type": "PLANT",
  "payload": {
    "plotId": 0,
    "cropId": "wheat",
    "requestId": "req-abc-12345678"
  }
}
```

| Field       | Type         | Constraints                                      |
| ----------- | ------------ | ------------------------------------------------ |
| `plotId`    | integer >= 0 | Must be a plot owned by the user                 |
| `cropId`    | string       | See crop table below                             |
| `requestId` | string       | 8–128 chars, unique per action (idempotency key) |

**Valid `cropId` values:**

`wheat`, `corn`, `rice`, `soybean`, `tomato`, `potato`, `onion`, `carrot`, `pepper`, `strawberry`, `sunflower`, `sugarcane`, `cacao`, `coffee`, `vanilla`, `tea`, `lavender`, `grapes`, `cotton`, `oat`, `saffron`, `sapling`, `mud_pit`, `chili`

**Success:**

```json
{
  "type": "PLANT_OK",
  "data": {
    "plotId": 0,
    "cropId": "wheat",
    "plantedAtMs": 1700000000000,
    "readyAtMs": 1700000060000,
    "goldBalance": 249
  }
}
```

**Error codes:**

| code                 | Meaning                                  |
| -------------------- | ---------------------------------------- |
| `ERR_PLOT_NOT_OWNED` | plotId not in user's owned plots         |
| `ERR_PLOT_OCCUPIED`  | Plot already has a crop growing          |
| `ERR_NO_SEED`        | User does not have the seed in inventory |
| `ERR_INVALID_CROP`   | cropId not recognised                    |
| `RATE_LIMITED`       | Too many actions                         |
| `INTERNAL`           | Server error                             |

---

### HARVEST — Harvest a ready plot

**Send:**

```json
{
  "type": "HARVEST",
  "payload": {
    "plotId": 0,
    "requestId": "req-abc-12345679"
  }
}
```

| Field       | Type         | Constraints       |
| ----------- | ------------ | ----------------- |
| `plotId`    | integer >= 0 | Must own the plot |
| `requestId` | string       | 8–128 chars       |

**Success:**

```json
{
  "type": "HARVEST_OK",
  "data": {
    "plotId": 0,
    "item": "wheat",
    "qty": 1,
    "inventoryField": "wheat",
    "newQty": 3
  }
}
```

**Error codes:**

| code                 | Meaning                      |
| -------------------- | ---------------------------- |
| `ERR_PLOT_NOT_OWNED` | plotId not in user's plots   |
| `ERR_PLOT_NOT_READY` | Crop still growing           |
| `ERR_PLOT_EMPTY`     | Nothing planted              |
| `ERR_PLOT_DECAYED`   | Crop decayed, clear it first |

---

### BUY — Buy items from the treasury

**Send:**

```json
{
  "type": "BUY",
  "payload": {
    "item": "seed:wheat",
    "quantity": 5,
    "requestId": "req-abc-12345680"
  }
}
```

| Field       | Type        | Constraints                          |
| ----------- | ----------- | ------------------------------------ |
| `item`      | string      | 1–64 chars — see buyable items below |
| `quantity`  | integer > 0 | How many to buy                      |
| `requestId` | string      | 8–128 chars                          |

**Buyable `item` values:**

Seeds: `seed:wheat`, `seed:corn`, `seed:rice`, `seed:soybean`, `seed:tomato`, `seed:potato`, `seed:onion`, `seed:carrot`, `seed:pepper`, `seed:strawberry`, `seed:sunflower`, `seed:sugarcane`, `seed:cacao`, `seed:coffee`, `seed:vanilla`, `seed:tea`, `seed:lavender`, `seed:grapes`, `seed:cotton`, `seed:oat`, `seed:saffron`, `seed:sapling`, `seed:mud_pit`, `seed:chili`

Animals: `animal:chicken`, `animal:cow`, `animal:sheep`, `animal:goat`, `animal:pig`, `animal:silkworm`, `animal:bee`

Tools: `tool:mill`, `tool:oil_press`, `tool:bakery`, `tool:cheese_factory`, `tool:slaughter_house`, `tool:chocolate_processor`, `tool:winery`

**Success:**

```json
{
  "type": "BUY_OK",
  "data": {
    "item": "seed:wheat",
    "quantity": 5,
    "totalCost": 5,
    "goldBalance": 245
  }
}
```

**Error codes:**

| code                    | Meaning                |
| ----------------------- | ---------------------- |
| `ERR_INSUFFICIENT_GOLD` | Not enough gold        |
| `ERR_ITEM_NOT_FOUND`    | item not in catalog    |
| `ERR_TREASURY_DEPLETED` | Treasury reserve empty |

---

### SELL — Sell items to the treasury

**Send:**

```json
{
  "type": "SELL",
  "payload": {
    "item": "wheat",
    "quantity": 3,
    "requestId": "req-abc-12345681"
  }
}
```

Same field shapes as BUY. `item` here is the inventory item name (e.g. `wheat`, `egg`, `milk`), not a `seed:` prefixed key.

**Success:**

```json
{
  "type": "SELL_OK",
  "data": {
    "item": "wheat",
    "quantity": 3,
    "totalEarned": 3,
    "goldBalance": 248
  }
}
```

**Error codes:**

| code                    | Meaning                             |
| ----------------------- | ----------------------------------- |
| `ERR_INSUFFICIENT_ITEM` | Not enough of the item in inventory |
| `ERR_ITEM_NOT_SELLABLE` | Item cannot be sold                 |

---

### ANIMAL_FEED — Feed an animal

**Send:**

```json
{
  "type": "ANIMAL_FEED",
  "payload": {
    "species": "chicken",
    "requestId": "req-abc-12345682"
  }
}
```

| Field       | Type   | Valid values                                                |
| ----------- | ------ | ----------------------------------------------------------- |
| `species`   | string | `chicken`, `cow`, `sheep`, `goat`, `pig`, `silkworm`, `bee` |
| `requestId` | string | 8–128 chars                                                 |

**Success:**

```json
{
  "type": "ANIMAL_FEED_OK",
  "data": {
    "species": "chicken",
    "fedCount": 3,
    "feedConsumed": 3,
    "nextHarvestAtMs": 1700000120000
  }
}
```

**Error codes:**

| code                    | Meaning                           |
| ----------------------- | --------------------------------- |
| `ERR_NO_ANIMAL`         | User does not own this species    |
| `ERR_INSUFFICIENT_FEED` | Not enough feed item in inventory |

---

### ANIMAL_HARVEST — Collect animal produce

**Send:**

```json
{
  "type": "ANIMAL_HARVEST",
  "payload": {
    "species": "chicken",
    "requestId": "req-abc-12345683"
  }
}
```

**Success:**

```json
{
  "type": "ANIMAL_HARVEST_OK",
  "data": {
    "species": "chicken",
    "produceItem": "egg",
    "qty": 3,
    "newInventoryQty": 3
  }
}
```

**Error codes:**

| code            | Meaning                              |
| --------------- | ------------------------------------ |
| `ERR_NO_ANIMAL` | User does not own this species       |
| `ERR_NOT_READY` | Produce interval has not elapsed yet |

---

### CRAFT_START — Begin a crafting job

**Send:**

```json
{
  "type": "CRAFT_START",
  "payload": {
    "recipeId": "cake",
    "requestId": "req-abc-12345684"
  }
}
```

| Field      | Valid values        |
| ---------- | ------------------- |
| `recipeId` | `cake`, `chocolate` |

**Recipes:**

| recipeId    | Ingredients                 | Tool required              | Output               | Craft time |
| ----------- | --------------------------- | -------------------------- | -------------------- | ---------- |
| `cake`      | 1x `wheat`, 1x `egg`        | `tool:bakery`              | 1x `craft:cake`      | 3 min      |
| `chocolate` | 1x `cocoa_pods`, 1x `sugar` | `tool:chocolate_processor` | 1x `craft:chocolate` | 5 min      |

**Success:**

```json
{
  "type": "CRAFT_START_OK",
  "data": {
    "pendingId": "uuid-pending-craft-id",
    "recipeId": "cake",
    "readyAtMs": 1700000180000
  }
}
```

**Error codes:**

| code                     | Meaning                         |
| ------------------------ | ------------------------------- |
| `ERR_MISSING_INGREDIENT` | Missing one or more ingredients |
| `ERR_MISSING_TOOL`       | Required tool not in inventory  |
| `ERR_CRAFT_IN_PROGRESS`  | Already crafting this recipe    |

---

### CRAFT_CLAIM — Claim a finished crafting job

**Send:**

```json
{
  "type": "CRAFT_CLAIM",
  "payload": {
    "pendingId": "uuid-pending-craft-id",
    "requestId": "req-abc-12345685"
  }
}
```

**Success:**

```json
{
  "type": "CRAFT_CLAIM_OK",
  "data": {
    "pendingId": "uuid-pending-craft-id",
    "outputItem": "craft:cake",
    "outputQty": 1,
    "newInventoryQty": 1
  }
}
```

**Error codes:**

| code                  | Meaning                       |
| --------------------- | ----------------------------- |
| `ERR_CRAFT_NOT_FOUND` | pendingId does not exist      |
| `ERR_CRAFT_NOT_READY` | Craft timer has not completed |

---

### LOAN_OPEN — Take out a collateral loan

**Send:**

```json
{
  "type": "LOAN_OPEN",
  "payload": {
    "principal": 100,
    "collateralInventory": [{ "item": "wheat", "quantity": 10 }],
    "collateralPlotIds": [0, 1],
    "requestId": "req-abc-12345686"
  }
}
```

| Field                 | Type        | Constraints                                            |
| --------------------- | ----------- | ------------------------------------------------------ |
| `principal`           | integer > 0 | Must not exceed 66% of collateral value                |
| `collateralInventory` | array       | Up to 24 entries of `{ item, quantity }`               |
| `collateralPlotIds`   | array       | Up to 16 plot IDs — plots are locked for loan duration |
| `requestId`           | string      | 8–128 chars                                            |

Loan terms: **5% APR, 7-day term**. Plots pledged as collateral are locked and cannot be used until the loan is repaid.

**Success:**

```json
{
  "type": "LOAN_OPEN_OK",
  "data": {
    "loanId": "uuid-loan-id",
    "principal": 100,
    "interestDue": 5,
    "totalRepayment": 105,
    "dueAtMs": 1700604800000,
    "goldBalance": 350
  }
}
```

**Error codes:**

| code                     | Meaning                                   |
| ------------------------ | ----------------------------------------- |
| `ERR_LOAN_EXISTS`        | User already has an open loan             |
| `ERR_COLLATERAL_TOO_LOW` | Collateral value below principal limit    |
| `ERR_PLOT_NOT_OWNED`     | One of the collateralPlotIds is not owned |
| `ERR_INSUFFICIENT_ITEM`  | Inventory item quantity not available     |

---

### LOAN_REPAY — Repay a loan

**Send:**

```json
{
  "type": "LOAN_REPAY",
  "payload": {
    "loanId": "uuid-loan-id",
    "requestId": "req-abc-12345687"
  }
}
```

**Success:**

```json
{
  "type": "LOAN_REPAY_OK",
  "data": {
    "loanId": "uuid-loan-id",
    "totalPaid": 105,
    "goldBalance": 245,
    "plotsUnlocked": [0, 1],
    "inventoryReturned": { "wheat": 10 }
  }
}
```

**Error codes:**

| code                    | Meaning                                          |
| ----------------------- | ------------------------------------------------ |
| `ERR_LOAN_NOT_FOUND`    | loanId does not exist or belongs to another user |
| `ERR_INSUFFICIENT_GOLD` | Not enough gold to repay                         |

---

### CREATE_SYNDICATE — Create a new syndicate

Requires user level >= 13.

**Send:**

```json
{
  "type": "CREATE_SYNDICATE",
  "payload": {
    "requestId": "req-abc-12345688",
    "name": "Iron Farmers",
    "description": "We grow the best crops.",
    "visibility": "public",
    "levelPreferenceMin": 5,
    "goldPreferenceMin": 0
  }
}
```

| Field                | Type    | Constraints               |
| -------------------- | ------- | ------------------------- |
| `requestId`          | string  | 8–128 chars               |
| `name`               | string  | 3–28 chars                |
| `description`        | string  | 0–240 chars (optional)    |
| `visibility`         | string  | `"public"` or `"private"` |
| `levelPreferenceMin` | integer | 1–100, default 1          |
| `goldPreferenceMin`  | integer | 0–1000000000, default 0   |

**Success:**

```json
{
  "type": "CREATE_SYNDICATE_OK",
  "data": {
    "syndicateId": "42",
    "name": "Iron Farmers",
    "role": "owner"
  }
}
```

**Error codes:**

| code                       | Meaning                        |
| -------------------------- | ------------------------------ |
| `ERR_ALREADY_IN_SYNDICATE` | User is already in a syndicate |
| `ERR_LEVEL_TOO_LOW`        | User level < 13                |
| `ERR_NAME_TAKEN`           | Syndicate name already exists  |
| `ERR_BAD_NAME`             | Name fails length check        |

---

### LIST_SYNDICATE — Browse syndicates

**Send:**

```json
{
  "type": "LIST_SYNDICATE",
  "payload": {
    "cursor": 0,
    "limit": 20
  }
}
```

**Success:**

```json
{
  "type": "LIST_SYNDICATE_OK",
  "data": {
    "syndicates": [
      {
        "id": "42",
        "name": "Iron Farmers",
        "memberCount": 5,
        "visibility": "public",
        "levelPreferenceMin": 5,
        "goldPreferenceMin": 0
      }
    ],
    "nextCursor": 20
  }
}
```

---

### VIEW_SYNDICATE — View syndicate details

**Send:**

```json
{
  "type": "VIEW_SYNDICATE",
  "payload": { "syndicateId": "42" }
}
```

**Success:**

```json
{
  "type": "VIEW_SYNDICATE_OK",
  "data": {
    "id": "42",
    "name": "Iron Farmers",
    "description": "We grow the best crops.",
    "visibility": "public",
    "ownerId": "uuid-owner",
    "memberCount": 5,
    "levelPreferenceMin": 5,
    "goldPreferenceMin": 0,
    "bankGold": 500,
    "shieldExpiresAt": 0,
    "idol": { "level": 1, "status": "active" }
  }
}
```

---

### REQUEST_JOIN — Request to join a syndicate

**Send:**

```json
{
  "type": "REQUEST_JOIN",
  "payload": {
    "requestId": "req-abc-12345689",
    "syndicateId": "42"
  }
}
```

For `public` syndicates the user is added immediately. For `private` syndicates the request is queued for owner/officer approval.

**Success:**

```json
{
  "type": "REQUEST_JOIN_OK",
  "data": {
    "result": "joined",
    "syndicateId": "42"
  }
}
```

`result` is either `"joined"` (public, auto-accepted) or `"pending"` (private, awaiting approval).

**Error codes:**

| code                       | Meaning                               |
| -------------------------- | ------------------------------------- |
| `ERR_ALREADY_IN_SYNDICATE` | Already a member somewhere            |
| `ERR_NO_SUCH_SYNDICATE`    | syndicateId not found                 |
| `ERR_LEVEL_TOO_LOW`        | User level below syndicate preference |
| `ERR_INSUFFICIENT_GOLD`    | Gold below syndicate preference       |
| `ERR_SYNDICATE_FULL`       | Syndicate at max capacity             |

---

### ACCEPT_REQUEST — Approve a join request (owner/officer only)

**Send:**

```json
{
  "type": "ACCEPT_REQUEST",
  "payload": {
    "requestId": "req-abc-12345690",
    "syndicateId": "42",
    "userId": "uuid-applicant-user-id"
  }
}
```

**Success:**

```json
{
  "type": "ACCEPT_REQUEST_OK",
  "data": { "userId": "uuid-applicant-user-id", "syndicateId": "42" }
}
```

**Error codes:**

| code                              | Meaning                                            |
| --------------------------------- | -------------------------------------------------- |
| `ERR_NOT_MEMBER`                  | Caller is not in this syndicate                    |
| `ERR_NOT_AUTHORIZED`              | Caller does not have owner or officer role         |
| `ERR_JOIN_REQUEST_MISSING`        | No pending request from this userId                |
| `ERR_TARGET_ALREADY_IN_SYNDICATE` | Applicant joined another syndicate in the meantime |
| `ERR_SYNDICATE_FULL`              | Syndicate full                                     |

---

### LEAVE_SYNDICATE — Leave your current syndicate

**Send:**

```json
{
  "type": "LEAVE_SYNDICATE",
  "payload": { "requestId": "req-abc-12345691" }
}
```

**Success:**

```json
{ "type": "LEAVE_SYNDICATE_OK", "data": { "ok": true } }
```

**Error codes:** `ERR_NOT_IN_SYNDICATE`, `ERR_OWNER_MUST_DISBAND`

---

### DISBAND_SYNDICATE — Disband a syndicate (owner only)

**Send:**

```json
{
  "type": "DISBAND_SYNDICATE",
  "payload": {
    "requestId": "req-abc-12345692",
    "syndicateId": "42"
  }
}
```

**Success:**

```json
{ "type": "DISBAND_SYNDICATE_OK", "data": { "ok": true } }
```

---

### DEPOSIT_BANK — Deposit gold or items into syndicate bank

**Send (gold):**

```json
{
  "type": "DEPOSIT_BANK",
  "payload": {
    "requestId": "req-abc-12345693",
    "syndicateId": "42",
    "kind": "gold",
    "amount": 100
  }
}
```

**Send (item):**

```json
{
  "type": "DEPOSIT_BANK",
  "payload": {
    "requestId": "req-abc-12345694",
    "syndicateId": "42",
    "kind": "item",
    "itemId": "wheat",
    "amount": 50
  }
}
```

**Success:**

```json
{ "type": "DEPOSIT_BANK_OK", "data": { "bankGold": 600 } }
```

---

### BUY_SHIELD — Purchase a shield for the syndicate

**Send:**

```json
{
  "type": "BUY_SHIELD",
  "payload": {
    "requestId": "req-abc-12345695",
    "syndicateId": "42",
    "goldPaid": 200
  }
}
```

**Success:**

```json
{
  "type": "BUY_SHIELD_OK",
  "data": { "shieldExpiresAt": 1700086400000 }
}
```

---

### ATTACK_SYNDICATE — Attack another syndicate

**Send:**

```json
{
  "type": "ATTACK_SYNDICATE",
  "payload": {
    "requestId": "req-abc-12345696",
    "targetSyndicateId": "99",
    "attackPower": 500,
    "lootGoldMax": 100,
    "lootItemId": "wheat",
    "lootItemMax": 50
  }
}
```

| Field               | Type         | Constraints                |
| ------------------- | ------------ | -------------------------- |
| `targetSyndicateId` | string       | 1–64 chars                 |
| `attackPower`       | integer > 0  |                            |
| `lootGoldMax`       | integer >= 0 | Max gold to loot           |
| `lootItemId`        | string       | Optional — item to loot    |
| `lootItemMax`       | integer >= 0 | Optional — max qty to loot |

**Success:**

```json
{
  "type": "ATTACK_SYNDICATE_OK",
  "data": {
    "success": true,
    "goldLooted": 80,
    "itemLooted": "wheat",
    "itemLootedQty": 30
  }
}
```

**Error codes:** `ERR_TARGET_SHIELDED`, `ERR_SAME_SYNDICATE`, `ERR_NOT_IN_SYNDICATE`

---

### IDOL_CONTRIBUTE — Contribute items to the syndicate idol

**Send:**

```json
{
  "type": "IDOL_CONTRIBUTE",
  "payload": {
    "requestId": "req-abc-12345697",
    "syndicateId": "42",
    "requestKey": "idol-req-key-001",
    "itemId": "wheat",
    "amount": 10
  }
}
```

**Success:**

```json
{
  "type": "IDOL_CONTRIBUTE_OK",
  "data": { "contributed": 10, "idolLevel": 2 }
}
```

---

### SYNDICATE_CHAT_SEND — Send a message in syndicate chat

**Send:**

```json
{
  "type": "SYNDICATE_CHAT_SEND",
  "payload": {
    "requestId": "req-abc-12345698",
    "syndicateId": "42",
    "text": "Good harvest today!"
  }
}
```

`text` must be 1–400 characters.

**Success:**

```json
{
  "type": "SYNDICATE_CHAT_SEND_OK",
  "data": { "messageId": "uuid", "sentAtMs": 1700000000000 }
}
```

---

### SYNDICATE_CHAT_LIST — Fetch syndicate chat history

**Send:**

```json
{
  "type": "SYNDICATE_CHAT_LIST",
  "payload": { "syndicateId": "42" }
}
```

**Success:**

```json
{
  "type": "SYNDICATE_CHAT_LIST_OK",
  "data": {
    "messages": [
      {
        "messageId": "uuid",
        "userId": "uuid-sender",
        "text": "Good harvest today!",
        "sentAtMs": 1700000000000
      }
    ]
  }
}
```

---

### VIEW_SYNDICATE_MEMBER — List members of a syndicate

**Send:**

```json
{
  "type": "VIEW_SYNDICATE_MEMBER",
  "payload": { "syndicateId": "42" }
}
```

**Success:**

```json
{
  "type": "VIEW_SYNDICATE_MEMBER_OK",
  "data": {
    "members": [
      { "userId": "uuid-owner", "role": "owner" },
      { "userId": "uuid-member", "role": "member" }
    ]
  }
}
```

Roles: `"owner"`, `"officer"`, `"member"`

---

### VIEW_GOLD_BANK — View syndicate gold balance

**Send:**

```json
{
  "type": "VIEW_GOLD_BANK",
  "payload": { "syndicateId": "42" }
}
```

**Success:**

```json
{ "type": "VIEW_GOLD_BANK_OK", "data": { "bankGold": 600 } }
```

---

### VIEW_COMMODITY_BANK — View syndicate item bank

**Send:**

```json
{
  "type": "VIEW_COMMODITY_BANK",
  "payload": { "syndicateId": "42" }
}
```

**Success:**

```json
{
  "type": "VIEW_COMMODITY_BANK_OK",
  "data": {
    "items": { "wheat": 50, "corn": 20 }
  }
}
```

---

### VIEW_MEMBER_CONTRIBUTION — View a member's contributions

**Send:**

```json
{
  "type": "VIEW_MEMBER_CONTRIBUTION",
  "payload": {
    "syndicateId": "42",
    "userId": "uuid-member"
  }
}
```

**Success:**

```json
{
  "type": "VIEW_MEMBER_CONTRIBUTION_OK",
  "data": {
    "userId": "uuid-member",
    "goldContributed": 100,
    "itemsContributed": { "wheat": 50 }
  }
}
```

---

### VIEW_LEADERBOARD — View rankings

**Send:**

```json
{
  "type": "VIEW_LEADERBOARD",
  "payload": {
    "category": "player_gold",
    "limit": 50
  }
}
```

| Field      | Valid values                                                                    |
| ---------- | ------------------------------------------------------------------------------- |
| `category` | `player_gold`, `player_networth`, `syndicate_gold`, `syndicate_commodity_value` |
| `limit`    | integer 1–100 (optional, default 10)                                            |

**Success:**

```json
{
  "type": "VIEW_LEADERBOARD_OK",
  "data": {
    "category": "player_gold",
    "entries": [
      {
        "rank": 1,
        "id": "uuid-or-syndicateId",
        "name": "happy-tiger-42",
        "score": 5000
      }
    ],
    "userRank": { "rank": 42, "score": 250 }
  }
}
```

---

## Part 4 — Server Push Events

These frames arrive unsolicited at any time. Handle them alongside your response handler.

### GAME_STATE

Sent immediately on connection open. Re-sent if the server needs to force a full state refresh.

```json
{
  "type": "GAME_STATE",
  "data": {
    "gold": 250,
    "syndicateId": "42",
    "plots": [ ... ],
    "inventory": { "wheat": 3, "seed:wheat": 1 }
  }
}
```

### AI_EVENT

Broadcast to all connected users. Contains game-wide AI-driven events (seasonal changes, economic shifts, etc.).

```json
{
  "type": "AI_EVENT",
  "data": { "eventType": "price_surge", "item": "wheat", "multiplier": 1.5 }
}
```

### SYNDICATE_IDOL_EVENT

Broadcast to all members of a syndicate. Fired when the syndicate idol levels up or produces a reward.

```json
{
  "type": "SYNDICATE_IDOL_EVENT",
  "data": {
    "syndicateId": "42",
    "newLevel": 3,
    "reward": "wheat",
    "rewardQty": 100
  }
}
```

---

## Part 5 — Universal Error Codes

These codes can appear on any action:

| code                | Meaning                                |
| ------------------- | -------------------------------------- |
| `RATE_LIMITED`      | Exceeded 20 actions/second             |
| `BAD_REQUEST`       | Message format invalid or unknown type |
| `INTERNAL`          | Unexpected server error                |
| `TREASURY_DEPLETED` | Server treasury reserve empty          |

---

## Part 6 — Recommended Session Flow

```
1. GET  /auth/challenge                → get challengeId + message
2. Sign message with Solana wallet
3. POST /auth/verify                   → get accessToken, refreshToken, profile
4. GET  /catalog                       → fetch and cache all game prices
5. Connect WebSocket /ws               → pass accessToken in Authorization header
6. Receive GAME_STATE frame            → initialise game UI
7. Send PING every 30s                 → keepalive
8. Send game actions as needed
9. Before accessToken expires          → POST /auth/refresh to get new tokens
```
