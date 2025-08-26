type CellType = "black" | "white";
type Board = Map<string, { type: CellType }>;
type GoResult = {
  winner: CellType;
  blackScore: number;
  whiteScore: number;
};

export function calculateGoResult(board: Board, model: number, blackLost: number, whiteLost: number): GoResult {
  // 统计存活棋子数量
  let blackStones = 0, whiteStones = 0;
  board.forEach(cell => cell.type === "black" ? blackStones++ : whiteStones++);

  // 计算双方领地
  const counted = new Set<string>();
  let blackTerritory = 0, whiteTerritory = 0;

  const getTerritoryOwner = (x: number, y: number): CellType | null => {
    const visited = new Set<string>();
    const queue: [number, number][] = [[x, y]];
    let owner: CellType | null = null;

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      const key = `${cx},${cy}`;
      if (board.has(key) || visited.has(key)) continue;
      visited.add(key);

      // 检查相邻四个方向
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dx, dy] of directions) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= model || ny < 0 || ny >= model) continue;

        const neighbor = board.get(`${nx},${ny}`);
        if (neighbor) {
          if (!owner) owner = neighbor.type;
          else if (owner !== neighbor.type) return null;
        } else if (!visited.has(`${nx},${ny}`)) {
          queue.push([nx, ny]);
        }
      }
    }
    return owner;
  };

  // 遍历所有棋盘交叉点
  for (let x = 0; x < model; x++) {
    for (let y = 0; y < model; y++) {
      const key = `${x},${y}`;
      if (board.has(key) || counted.has(key)) continue;

      const owner = getTerritoryOwner(x, y);
      if (owner === "black") blackTerritory++;
      else if (owner === "white") whiteTerritory++;
      counted.add(key);
    }
  }

  // 计算最终结果（中国规则数子法）
  const blackScore = blackStones + blackTerritory + whiteLost;
  const whiteScore = whiteStones + whiteTerritory + blackLost;
  const winner = blackScore - whiteScore - 7 > 0 ? "black" : "white";  // 黑贴7目
  return { winner, blackScore, whiteScore } as GoResult;
}