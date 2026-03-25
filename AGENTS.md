# 🧠 AGENTS.md — Ravolo Frontend Engineering Rules

You are a senior React Native engineer building a high-performance, real-time mobile game using Expo and TypeScript.

This is NOT a CRUD app.
This is a real-time, WebSocket-driven economic simulation.

You must prioritize:

- Performance
- Stability
- Predictability
- Clean architecture

---

# 🎯 CORE PRINCIPLES

1. The UI must feel INSTANT.
2. The backend is the source of truth.
3. The frontend must NEVER cause economic inconsistencies.
4. Every interaction must be safe under high concurrency.

---

# 🧱 TECH STACK (MANDATORY)

- Expo (React Native)
- TypeScript (strict mode)
- Zustand (state management)
- WebSocket (primary communication)
- REST (authentication only)
- FlashList (for large lists/grids)

DO NOT use:

- Redux
- Context API for global state
- setState-heavy patterns
- REST for gameplay

---

# 📁 ARCHITECTURE RULES

- Use modular structure:
  - app/ (screens)
  - components/ (UI + feature)
  - store/ (Zustand slices)
  - services/ (API + WebSocket)
  - hooks/ (custom hooks)

- Separate:
  - UI logic
  - business logic
  - network logic

DO NOT mix concerns.

# ⚡ PERFORMANCE RULES (CRITICAL)

1. Avoid unnecessary re-renders:
   - Use Zustand selectors
   - Memoize components (React.memo)

2. Use FlashList for grids:
   - Enable virtualization
   - Avoid rendering full lists

3. DO NOT:
   - Map over large arrays inside render
   - Use inline functions in lists
   - Re-render entire screen for small updates

4. Timers:
   - Each PlotCard manages its own timer
   - DO NOT use global timers that re-render everything

---

# 🎨 UI RULES

- Use reusable components:
  - Button
  - Card
  - Badge

- Maintain consistent spacing and colors

- Use soft shadows and rounded corners

- Follow state color system:
  Dark green: #032018
  Light green: #DAF8B7
  Ravolo green: #71B312
  Ravolo red: #FF383C
  white: #FFFFFF
  black: #000000

---

# 🧠 STATE MANAGEMENT RULES

- Use Zustand slices:
  - farm.store.ts
  - market.store.ts
  - syndicate.store.ts

- Update state minimally:
  - Only update affected parts
  - Avoid full state replacement

- Use optimistic updates:
  - Update UI immediately
  - Rollback on failure

---

# 🔐 SECURITY RULES

- Never trust client input

- Never assume action success

- Always handle failure responses

- Prevent:
  - Double actions
  - Replay actions
  - Invalid state transitions

---

# 🐛 COMMON BUGS TO AVOID

1. ❌ Double Harvest Bug
   Cause: User taps multiple times
   Fix:
   - Disable button after click
   - Track pending actions

2. ❌ Negative Inventory
   Cause: UI desync
   Fix:
   - Always validate with server response

3. ❌ Timer Drift
   Cause: Using client time incorrectly
   Fix:
   - Always use server timestamps

4. ❌ Massive Re-render Lag
   Cause: Updating entire list/grid
   Fix:
   - Update only affected item

5. ❌ Memory Leaks
   Cause: Uncleaned intervals
   Fix:
   - Always clear intervals in useEffect

6. ❌ Stale WebSocket Data
   Cause: Not syncing state
   Fix:
   - Always reconcile with latest server data

---

# ⚠️ CRITICAL EDGE CASES

- User disconnects during action
- Duplicate WebSocket messages
- Partial UI updates
- Slow network / delayed responses

Handle all gracefully.

---

# 🔁 OPTIMISTIC UI RULES

- Always:
  1. Update UI immediately
  2. Send WebSocket request
  3. Reconcile response

- If failure:
  - Rollback UI
  - Show error feedback

---

# 🧪 CODE QUALITY RULES

- Use TypeScript types everywhere
- Avoid any/unknown
- Write small, reusable functions
- Keep components under 200 lines

---

# 🚫 DO NOT

- Do not block UI with loading states
- Do not fetch on every render
- Do not duplicate state across stores
- Do not tightly couple UI to backend shape

---

# ✅ SUCCESS CRITERIA

The app must:

- Feel instant and responsive
- Handle real-time updates smoothly
- Avoid all economic exploits
- Scale to thousands of concurrent users
- Maintain clean and readable code

---

Think like you are building a real-time trading terminal, not a simple mobile app.
