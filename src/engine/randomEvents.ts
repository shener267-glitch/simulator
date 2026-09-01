export interface WeightedItem<T> {
  item: T;
  weight: number;
}

/** Deterministic-friendly weighted pick using an injectable RNG (defaults to Math.random). */
export function weightedPick<T>(items: WeightedItem<T>[], rng: () => number = Math.random): T | null {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  if (total <= 0 || items.length === 0) return null;
  let roll = rng() * total;
  for (const entry of items) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return items[items.length - 1].item;
}
