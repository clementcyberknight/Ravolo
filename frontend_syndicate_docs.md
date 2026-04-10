# Frontend Documentation: Syndicate Subsystem (WebSockets)

The entire Syndicate backend is powered by a real-time WebSocket connection. There are no REST HTTP endpoints for syndicate gameplay operations; everything routes through the established game WebSocket connection.

**Base Message Structure:**
Every message sent to the server must be a JSON string (or MessagePack binary if configured) matching this shape:
```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ... }
}
```

Every successful response from the server will wrap the data in an envelope:
```json
{
  "type": "MESSAGE_TYPE_OK",
  "data": { ... }
}
```

Unsuccessful operations will return a standard WebSocket error message:
```json
{
  "type": "ERROR",
  "code": "ERROR_CODE",
  "message": "Human readable reason"
}
```

---

## 1. Discovery & Membership

### List Syndicates
Fetches a paginated list of existing syndicates.

**Request:**
```json
{
  "type": "LIST_SYNDICATE",
  "payload": {
    "cursor": "string (optional)",
    "limit": 20
  }
}
```

**Success Response:**
```json
{
  "type": "LIST_SYNDICATE_OK",
  "data": {
    "syndicates": [
      {
        "id": "syn_xxxx",
        "name": "The Farmers",
        "description": "Hardcore farming cabal",
        "memberCount": 15,
        "infamy": 1200,
        "isPublic": true,
        "createdAtMs": 1712880000000
      }
    ],
    "nextCursor": null
  }
}
```

### Create Syndicate
*(Note: Requires the player to not be in a syndicate and meet minimum level/gold requirements).*

**Request:**
```json
{
  "type": "CREATE_SYNDICATE",
  "payload": {
    "requestId": "unique-uuid-v4",
    "name": "The Farmers",
    "description": "Hardcore farming cabal",
    "isPublic": true,
    "minLevelToJoin": 5,
    "iconId": "icon_1"
  }
}
```

**Success Response:**
```json
{
  "type": "CREATE_SYNDICATE_OK",
  "data": {
    "syndicateId": "syn_xxxx"
  }
}
```

### Join a Syndicate
Request to join a specific syndicate. If `isPublic` is true, the user joins instantly. If false, it creates a pending join request for officers to approve.

**Request:**
```json
{
  "type": "REQUEST_JOIN",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "message": "Let me in!"
  }
}
```

**Success Response:**
```json
{
  "type": "REQUEST_JOIN_OK",
  "data": {
    "status": "joined" // or "pending" if it's a private syndicate
  }
}
```

### Leave Syndicate

**Request:**
```json
{
  "type": "LEAVE_SYNDICATE",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx"
  }
}
```

---

## 2. General Management & Dashboard

### Syndicate Dashboard
Fetches the core overview of the player's syndicate, including their rank, the syndicate's resources, and active war shields.

**Request:**
```json
{
  "type": "SYNDICATE_DASHBOARD",
  "payload": {
    "syndicateId": "syn_xxxx"
  }
}
```

**Success Response:**
```json
{
  "type": "SYNDICATE_DASHBOARD_OK",
  "data": {
    "id": "syn_xxxx",
    "name": "The Farmers",
    "description": "...",
    "memberCount": 15,
    "infamy": 1200,
    "bankGold": 50000,
    "bankItems": { "wheat": 500, "corn": 200 },
    "idolLevel": 3,
    "activeShield": null,
    "shieldExpiresAtMs": null,
    "myRole": "leader"
  }
}
```

### View Member List

**Request:**
```json
{
  "type": "VIEW_SYNDICATE_MEMBER",
  "payload": {
    "syndicateId": "syn_xxxx"
  }
}
```

**Success Response:**
```json
{
  "type": "VIEW_SYNDICATE_MEMBER_OK",
  "data": {
    "members": [
      {
        "userId": "usr_xxxx",
        "username": "Player1",
        "role": "leader",
        "joinedAtMs": 1712880000000
      }
    ]
  }
}
```

### Member Management (Officers/Leaders)
To promote, demote, or kick a player, send the respective command:

**Request (e.g., Promote):**
```json
{
  "type": "PROMOTE_MEMBER",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "targetUserId": "usr_yyyy"
  }
}
```
*(Available actions: `PROMOTE_MEMBER`, `DEMOTE_MEMBER`, `KICK_MEMBER`)*

---

## 3. The Bank & Operations

### Deposit to Bank
Players can donate gold or items (e.g., crops) to the syndicate bank.

**Request:**
```json
{
  "type": "DEPOSIT_BANK",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "goldAmount": 1000,
    "items": { "wheat": 50 }
  }
}
```

### Sell Bank Inventory
Officers/Leaders can sell items stored in the syndicate bank directly to the global market to raise syndicate gold.

**Request:**
```json
{
  "type": "SYNDICATE_BANK_SELL",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "itemId": "wheat",
    "quantity": 100
  }
}
```

### Idol Contributions
Contribute directly to the Idol to gain global production buffs for the syndicate.

**Request:**
```json
{
  "type": "IDOL_CONTRIBUTE",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "goldAmount": 500,
    "items": {} 
  }
}
```

---

## 4. Enhanced Chat & Help Requests

The chat system is unified, meaning Text Chats, System Alerts, and Player Help Requests all return in the same stream. Distinguish them on the frontend via the `kind` field.

### List Chat History

**Request:**
```json
{
  "type": "SYNDICATE_CHAT_LIST",
  "payload": {
    "syndicateId": "syn_xxxx"
  }
}
```

**Success Response (Note the mixed message types):**
```json
{
  "type": "SYNDICATE_CHAT_LIST_OK",
  "data": {
    "messages": [
      {
        "kind": "chat",
        "ts": 1712880000000,
        "userId": "usr_abc",
        "text": "Anyone have spare gold?"
      },
      {
        "kind": "help_request",
        "ts": 1712880100000,
        "requestId": "help_usr_abc_1712880100000",
        "userId": "usr_abc",
        "goldAmount": 5000,
        "message": "Need it for planting season!",
        "status": "open",
        "fulfilledBy": null
      },
      {
        "kind": "alert",
        "ts": 1712880200000,
        "alertType": "help_fulfilled",
        "data": {
           "helpRequestId": "help_usr_abc_1712880100000",
           "fulfillerUserId": "usr_xyz",
           "requesterUserId": "usr_abc",
           "goldAmount": 5000
        }
      }
    ]
  }
}
```

### Send a Text Message

**Request:**
```json
{
  "type": "SYNDICATE_CHAT_SEND",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "text": "Thanks usr_xyz!"
  }
}
```

### Ask for Gold (Help Request)
Allows a player to ask for gold directly in chat. Max limit: 50,000 gold. Cooldown: 5 minutes.

**Request:**
```json
{
  "type": "SYNDICATE_HELP_REQUEST",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "goldAmount": 5000,
    "message": "Need it for planting season!"
  }
}
```

### Fulfill a Help Request
Allows a *different* player to transfer gold from their personal wallet to the requester.

**Request:**
```json
{
  "type": "SYNDICATE_HELP_FULFILL",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "helpRequestId": "help_usr_abc_1712880100000"
  }
}
```

---

## 5. The War System

### View Active Wars and History

**Request (Active War):**
```json
{
  "type": "VIEW_ACTIVE_WAR",
  "payload": {
    "syndicateId": "syn_xxxx"
  }
}
```

**Success Response:**
```json
{
  "type": "VIEW_ACTIVE_WAR_OK",
  "data": {
    "warId": "war_123",
    "attackerId": "syn_xxxx",
    "defenderId": "syn_yyyy",
    "phase": "preparation", // or "active"
    "endTimeMs": 1712980000000
  }
}
```
*(Also available: `VIEW_WAR_HISTORY`)*

### Upgrade Troops (Offline Progression)
Officers can spend Syndicate Bank Gold to buff the attack power of troops globally for the syndicate. Max Level is 5.

**Request:**
```json
{
  "type": "UPGRADE_TROOP",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "troopType": "worker" 
  }
}
```
*(Valid `troopType` values: `"worker"`, `"tractor"`, `"scarecrow_breaker"`, `"crop_duster"`, `"siege_harvester"`)*

### View Troop Upgrade Levels

**Request:**
```json
{
  "type": "VIEW_TROOP_LEVELS",
  "payload": {
    "syndicateId": "syn_xxxx"
  }
}
```

**Success Response:**
```json
{
  "type": "VIEW_TROOP_LEVELS_OK",
  "data": {
    "worker": 2,
    "tractor": 1,
    "scarecrow_breaker": 4,
    "crop_duster": 1,
    "siege_harvester": 1
  }
}
```

### Declare War

**Request:**
```json
{
  "type": "DECLARE_WAR",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "targetSyndicateId": "syn_yyyy"
  }
}
```

### War Attack
When the War phase is `"active"`, players can send troops to damage the enemy syndicate.

**Request:**
```json
{
  "type": "WAR_ATTACK",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "warId": "war_123",
    "troops": {
      "worker": 50,
      "tractor": 2
    }
  }
}
```

### Buy War Shield
Officers can buy protective shields using syndicate gold to prevent or pause incoming attacks.

**Request:**
```json
{
  "type": "BUY_WAR_SHIELD",
  "payload": {
    "requestId": "unique-uuid-v4",
    "syndicateId": "syn_xxxx",
    "shieldType": "harvest_dome"
  }
}
```
*(Valid `shieldType` values: `"harvest_dome"`, `"gold_vault_lock"`, `"militia_surge"`, `"crop_decoy"`, `"ceasefire"`)*

---

## General Error Handling Reference

Whenever you receive `{ "type": "ERROR" }`, inspect the `"code"` property. Common errors include:

- `"NOT_MEMBER"`: Attempting to query/act on a syndicate the player isn't in.
- `"PERMISSION_DENIED"`: Requires officer or leader role (e.g., to upgrade troops, disband syndicate).
- `"INSUFFICIENT_GOLD"`: Not enough personal gold (for help fulfills) or syndicate bank gold (for troop upgrades/shields).
- `"HELP_REQUEST_COOLDOWN"`: The player is asking for gold too frequently (5m cooldown).
- `"HELP_SELF_FULFILL"`: You cannot click 'fulfill' on your own gold help request.
- `"HELP_REQUEST_EXPIRED"` / `"HELP_REQUEST_NOT_FOUND"`: The request is no longer open.
- `"MAX_TROOP_LEVEL"`: Tried to upgrade a troop past Level 5.
- `"NOT_IN_WAR"` / `"WAR_NOT_IN_BATTLE"`: Can only attack during the `active` phase of an declared war.
