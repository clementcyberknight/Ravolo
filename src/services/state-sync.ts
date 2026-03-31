import { CropType } from "@/constants/crops";
import { useMarketStore } from "@/store/market-store";
import { useServerTimeStore } from "@/store/server-time-store";
import { useFarmStore } from "@/store/farm-store";
import { useGameStore } from "@/store/game-store";
import { useInventoryStore } from "@/store/inventory-store";

type AnyRecord = Record<string, unknown>;

function asRecord(input: unknown): AnyRecord | null {
  return input && typeof input === "object" ? (input as AnyRecord) : null;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeCropId(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  const rawValue = value.startsWith("seed:") ? value.slice("seed:".length) : value;

  switch (rawValue) {
    case "coffee":
      return "coffee_beans";
    case "tea":
      return "tea_leaves";
    case "sapling":
      return "sapling_patch";
    default:
      return rawValue;
  }
}

function toBackendSeedInventoryKey(cropId: string): string {
  switch (cropId) {
    case "coffee_beans":
      return "seed:coffee";
    case "tea_leaves":
      return "seed:tea";
    case "sapling_patch":
      return "seed:sapling";
    default:
      return `seed:${cropId}`;
  }
}

function extractEconomy(data: AnyRecord) {
  const economy = asRecord(data.economy) ?? data;
  return {
    coins: parseNumber(economy.gold) ?? parseNumber(economy.coins),
    diamonds: parseNumber(economy.diamonds) ?? parseNumber(economy.gems),
    level: parseNumber(economy.level),
    xp: parseNumber(economy.xp),
    xpToNextLevel: parseNumber(economy.xpToNextLevel),
  };
}

function extractInventory(data: AnyRecord): Record<string, number> | null {
  const inv = asRecord(data.inventory);
  if (!inv) return null;

  // Supports map style: { wheat: 2 } and array style: [{ id, qty }]
  const arrayForm = Array.isArray(data.inventory) ? (data.inventory as unknown[]) : null;
  if (arrayForm) {
    const mapped: Record<string, number> = {};
    arrayForm.forEach((entry) => {
      const record = asRecord(entry);
      if (!record) return;
      const id =
        (typeof record.id === "string" && record.id) ||
        (typeof record.itemId === "string" && record.itemId);
      const qty = parseNumber(record.quantity) ?? parseNumber(record.amount);
      if (id && typeof qty === "number") mapped[id] = qty;
    });
    return mapped;
  }

  const mapped: Record<string, number> = {};
  Object.entries(inv).forEach(([id, qty]) => {
    const parsedQty = parseNumber(qty);
    if (typeof parsedQty !== "number") return;

    // Backend may namespace inventory keys like `seed:wheat`.
    // UI/stores expect canonical crop ids like `wheat`.
    if (id.startsWith("seed:")) {
      mapped[id] = parsedQty;
      return;
    }

    const normalizedId = normalizeCropId(id) ?? id;
    mapped[normalizedId] = parsedQty;
  });
  return mapped;
}

function extractPlots(data: AnyRecord) {
  const farm = asRecord(data.farm) ?? data;
  const plotsSource = farm.plots;
  if (!Array.isArray(plotsSource)) return null;

  const plots = plotsSource
    .map((raw) => {
      const rec = asRecord(raw);
      if (!rec) return null;
      const normalizedCropId = normalizeCropId(
        typeof rec.cropId === "string"
          ? rec.cropId
          : typeof rec.crop === "string"
            ? rec.crop
            : undefined,
      );

      const plantedAt =
        parseNumber(rec.plantedAt) ??
        parseNumber(rec.planted_at) ??
        parseNumber(rec.plantedAtMs) ??
        null;

      const readyAt =
        parseNumber(rec.readyAt) ??
        parseNumber(rec.ready_at) ??
        parseNumber(rec.readyAtMs) ??
        null;

      const rawStatus =
        typeof rec.status === "string"
          ? rec.status.toLowerCase()
          : normalizedCropId && readyAt
            ? Date.now() >= readyAt
              ? "ready"
              : "planted"
            : normalizedCropId && plantedAt
              ? "planted"
              : "empty";
      const status =
        rawStatus === "ready" || rawStatus === "planted" || rawStatus === "empty"
          ? rawStatus
          : "empty";

      const plotId =
        typeof rec.plotId === "number" || typeof rec.plotId === "string"
          ? rec.plotId
          : typeof rec.id === "number" || typeof rec.id === "string"
            ? rec.id
            : null;

      if (plotId === null) return null;
      return { plotId, status, cropId: normalizedCropId, plantedAt, readyAt };
    })
    .filter(Boolean) as Array<{
    plotId: number | string;
    status: "empty" | "planted" | "ready";
    cropId?: string;
    plantedAt?: number | null;
    readyAt?: number | null;
  }>;

  const selectedCropId =
    typeof farm.selectedCropId === "string"
      ? (farm.selectedCropId as CropType)
      : undefined;

  return { plots, selectedCropId };
}

export function applyServerSync(rawData: unknown) {
  const message = asRecord(rawData);
  if (!message) return;

  const data = asRecord(message.data ?? message.payload ?? rawData);
  if (!data) return;

  const messageType = typeof message.type === "string" ? message.type : undefined;

  const economy = extractEconomy(data);
  useGameStore.getState().setEconomyFromServer(economy);

  const inventory = extractInventory(data);
  if (inventory) {
    useInventoryStore.getState().setInventoryFromServer(inventory);
  }

  const farm = extractPlots(data);
  if (farm && farm.plots.length > 0) {
    useFarmStore.getState().setFarmFromServer(farm);
  }

  if (messageType === "GAME_STATUS") {
    const prices = asRecord(data.prices);
    const normalizedPrices: Record<string, number> = {};
    if (prices) {
      Object.entries(prices).forEach(([key, value]) => {
        if (typeof value === "number") {
          normalizedPrices[key] = value;
        }
      });
    }

    const activeEvent = asRecord(data.activeEvent);
    useMarketStore.getState().setMarketStatusFromServer({
      prices: Object.keys(normalizedPrices).length > 0 ? normalizedPrices : undefined,
      activeEvent: activeEvent
        ? {
            id: typeof activeEvent.id === "string" ? activeEvent.id : undefined,
            title:
              typeof activeEvent.title === "string" ? activeEvent.title : undefined,
            description:
              typeof activeEvent.description === "string"
                ? activeEvent.description
                : undefined,
            multiplier:
              typeof activeEvent.multiplier === "number"
                ? activeEvent.multiplier
                : undefined,
            outcome:
              typeof activeEvent.outcome === "string"
                ? activeEvent.outcome
                : undefined,
            startsAtMs:
              typeof activeEvent.startsAtMs === "number"
                ? activeEvent.startsAtMs
                : undefined,
            expiresAtMs:
              typeof activeEvent.expiresAtMs === "number"
                ? activeEvent.expiresAtMs
                : undefined,
            playerTip:
              typeof activeEvent.playerTip === "string"
                ? activeEvent.playerTip
                : undefined,
            trigger:
              typeof activeEvent.trigger === "string"
                ? activeEvent.trigger
                : undefined,
            affectedItems: Array.isArray(activeEvent.affectedItems)
              ? activeEvent.affectedItems.filter(
                  (item): item is string => typeof item === "string",
                )
              : undefined,
          }
        : undefined,
    });
  }

  const serverNowMs =
    typeof data.serverNowMs === "number"
      ? data.serverNowMs
      : typeof message.serverNowMs === "number"
        ? message.serverNowMs
        : undefined;

  if (messageType === "PONG" && typeof serverNowMs === "number") {
    useServerTimeStore.getState().setServerNowMs(serverNowMs);
  }

  if (
    messageType === "PLANT_OK" &&
    (typeof data.plotId === "number" || typeof data.plotId === "string") &&
    typeof data.cropId === "string" &&
    typeof data.plantedAtMs === "number"
  ) {
    useFarmStore.getState().applyPlantResult({
      plotId: data.plotId,
      cropId: data.cropId as CropType,
      plantedAtMs: data.plantedAtMs,
      readyAtMs:
        typeof data.readyAtMs === "number" ? data.readyAtMs : undefined,
    });

    useInventoryStore
      .getState()
      .applyInventoryDelta(
        toBackendSeedInventoryKey(normalizeCropId(data.cropId) ?? String(data.cropId)),
        -1,
        "seed",
      );

    if (typeof data.goldBalance === "number") {
      useGameStore.getState().setEconomyFromServer({
        coins: data.goldBalance,
      });
    }
  }
}
