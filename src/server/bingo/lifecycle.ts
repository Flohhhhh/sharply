export function calculateInactivityExpiry(
  now: Date,
  inactivityDurationSeconds: number,
): Date {
  return new Date(now.getTime() + inactivityDurationSeconds * 1000);
}

function createWinningLines(gridSize: number): number[][] {
  const lines: number[][] = [];

  for (let row = 0; row < gridSize; row += 1) {
    lines.push(
      Array.from({ length: gridSize }, (_, col) => row * gridSize + col),
    );
  }

  for (let col = 0; col < gridSize; col += 1) {
    lines.push(
      Array.from({ length: gridSize }, (_, row) => row * gridSize + col),
    );
  }

  lines.push(Array.from({ length: gridSize }, (_, idx) => idx * (gridSize + 1)));
  lines.push(
    Array.from(
      { length: gridSize },
      (_, idx) => (idx + 1) * (gridSize - 1),
    ),
  );

  return lines;
}

export function hasBingoLine(
  completedPositions: readonly number[],
  gridSize = 5,
): boolean {
  if (gridSize <= 0) return false;
  if (completedPositions.length < gridSize) return false;

  const completed = new Set(completedPositions);
  const winningLines = createWinningLines(gridSize);

  return winningLines.some((line) => line.every((position) => completed.has(position)));
}

export function shouldExpireForInactivity(params: {
  now: Date;
  firstCompletedAt: Date | null;
  expiresAt: Date | null;
}): boolean {
  if (!params.firstCompletedAt || !params.expiresAt) return false;
  return params.expiresAt.getTime() <= params.now.getTime();
}
