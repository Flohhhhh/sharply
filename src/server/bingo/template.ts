function shuffle<T>(input: T[], random: () => number): T[] {
  const values = [...input];
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j]!, values[i]!];
  }
  return values;
}

export function selectBoardLabels(params: {
  templateLabels: readonly string[];
  tileCount: number;
  freeTileIndex: number;
  freeTileLabel: string;
  random?: () => number;
}): string[] {
  const {
    templateLabels,
    tileCount,
    freeTileIndex,
    freeTileLabel,
    random = Math.random,
  } = params;

  if (tileCount <= 0) {
    throw new Error("tileCount must be greater than zero");
  }
  if (freeTileIndex < 0 || freeTileIndex >= tileCount) {
    throw new Error("freeTileIndex must be inside tile count range");
  }

  const uniquePool = Array.from(
    new Set(templateLabels.filter((label) => label !== freeTileLabel)),
  );
  const neededRandomLabels = tileCount - 1;
  if (uniquePool.length < neededRandomLabels) {
    throw new Error(
      `Not enough template labels to build board: need ${neededRandomLabels}, have ${uniquePool.length}`,
    );
  }

  const picked = shuffle(uniquePool, random).slice(0, neededRandomLabels);
  const labels: string[] = [];
  let cursor = 0;
  for (let i = 0; i < tileCount; i += 1) {
    if (i === freeTileIndex) {
      labels.push(freeTileLabel);
      continue;
    }
    labels.push(picked[cursor]!);
    cursor += 1;
  }

  return labels;
}

export function isBoardTileShapeValid(params: {
  tileCount: number;
  freeTileIndex: number;
  tiles: readonly { position: number; isFreeTile: boolean }[];
}): boolean {
  const { tileCount, freeTileIndex, tiles } = params;
  if (tiles.length !== tileCount) return false;

  const positions = new Set<number>();
  for (const tile of tiles) {
    if (tile.position < 0 || tile.position >= tileCount) return false;
    if (positions.has(tile.position)) return false;
    positions.add(tile.position);
  }

  const freeTiles = tiles.filter((tile) => tile.isFreeTile);
  if (freeTiles.length !== 1) return false;
  return freeTiles[0]!.position === freeTileIndex;
}
