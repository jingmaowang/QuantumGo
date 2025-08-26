import { Board, BoardModel, ChessmanType } from "@/utils/types";

const getAdjacentPositions = (pos: string, model: BoardModel): string[] => {
  const [x, y] = pos.split(",").map(Number);
  const adj: string[] = [];
  if (x > 1) adj.push(`${x - 1},${y}`);
  if (x < model) adj.push(`${x + 1},${y}`);
  if (y > 1) adj.push(`${x},${y - 1}`);
  if (y < model) adj.push(`${x},${y + 1}`);
  return adj;
};

const findAllGroups = (board: Board, type: ChessmanType, model: BoardModel): Set<string>[] => {
  const visited = new Set<string>();
  const groups: Set<string>[] = [];

  for (const [pos, chessman] of board) {
    if (chessman.type === type && !visited.has(pos)) {
      const group = new Set<string>();
      const queue: string[] = [pos];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        group.add(current);
        getAdjacentPositions(current, model).forEach(neighbor => {
          const chess = board.get(neighbor);
          if (chess?.type === type && !visited.has(neighbor)) queue.push(neighbor);
        });
      }
      groups.push(group);
    }
  }
  return groups;
};

const calculateLiberty = (board: Board, group: Set<string>, model: BoardModel): number => {
  const liberties = new Set<string>();
  group.forEach(pos => {
    getAdjacentPositions(pos, model).forEach(neighbor => {
      if (!board.has(neighbor)) liberties.add(neighbor);
    });
  });
  return liberties.size;
};

export function canPutChess(board: Board, position: string, type: ChessmanType, model: BoardModel): boolean {
  if (board.has(position)) return false;
  const tempBoard = new Map(board);
  tempBoard.set(position, { position, type, brother: "" });
  const captured = getCapturedChess(tempBoard, type, model);
  const finalBoard = new Map(tempBoard);
  captured.forEach(pos => finalBoard.delete(pos));
  const currentGroup = [...findAllGroups(finalBoard, type, model)].find(g => g.has(position));
  return !!currentGroup && calculateLiberty(finalBoard, currentGroup, model) > 0;
}

export function getCapturedChess(board: Board, lastMoveType: ChessmanType, model: BoardModel): Set<string> {
  const captured = new Set<string>();
  const tempBoard = new Map(board);
  const enemyType = lastMoveType === "black" ? "white" : "black";
  findAllGroups(tempBoard, enemyType, model).forEach(group => {
    if (calculateLiberty(tempBoard, group, model) === 0) {
      group.forEach(pos => {
        captured.add(pos);
        tempBoard.delete(pos);
      });
    }
  });
  findAllGroups(tempBoard, lastMoveType, model).forEach(group => {
    if (calculateLiberty(tempBoard, group, model) === 0) {
      group.forEach(pos => captured.add(pos));
    }
  });
  return captured;
}

export function countLiberties(board: Board, model: BoardModel): { black: number, white: number } {
  const liberties = { black: 0, white: 0 };
  for (let x = 1; x <= model; x++) {
    for (let y = 1; y <= model; y++) {
      const pos = `${x},${y}`;
      if (!board.has(pos)) {
        let hasBlack = false, hasWhite = false;
        getAdjacentPositions(pos, model).forEach(neighbor => {
          const chess = board.get(neighbor);
          if (chess?.type === "black") hasBlack = true;
          if (chess?.type === "white") hasWhite = true;
        });
        if (hasBlack) liberties.black++;
        if (hasWhite) liberties.white++;
      }
    }
  }
  return liberties;
}

type GameResult = {
  winner: "black" | "white" | null;
  blackScore: number;
  whiteScore: number;
}

export function calculateWinner(board: Board, model: BoardModel): GameResult {
  const currentBoard = new Map(board);
  const { cleanedBoard, captured } = removeDeadStones(currentBoard, model);
  const blackStones = countLiveStones(cleanedBoard, "black");
  const whiteStones = countLiveStones(cleanedBoard, "white");
  const { blackArea, whiteArea } = calculateTerritory(cleanedBoard, model);
  const blackTotal = blackStones + blackArea + captured.white;
  const whiteTotal = whiteStones + whiteArea + captured.black;
  // const KOMI_RULES = { 9: 5.5, 13: 3.25, 19: 3.75 };
  const  KOMI = 7;
  const threshold = model * model / 2 + KOMI;
  return {
    winner: blackTotal > threshold ? "black" : "white",
    blackScore: blackTotal,
    whiteScore: whiteTotal
  };
}

function removeDeadStones(board: Board, model: BoardModel) {
  const captured = { black: 0, white: 0 };
  const checked = new Set<string>();
  const toRemove = new Set<string>();
  board.forEach((_, pos) => {
    if (!checked.has(pos)) {
      const group = findConnectedStones(pos, board, model);
      const liberties = calculateLiberties(group, board, model);
      if (liberties === 0) {
        group.forEach(p => {
          toRemove.add(p);
          const type = board.get(p)!.type;
          captured[type === "black" ? "white" : "black"]++;
        });
      }
      group.forEach(p => checked.add(p));
    }
  });
  const cleanedBoard = new Map(board);
  toRemove.forEach(pos => cleanedBoard.delete(pos));
  return { cleanedBoard, captured };
}

function findConnectedStones(startPos: string, board: Board, model: BoardModel): Set<string> {
  const visited = new Set<string>();
  const queue = [startPos];
  const color = board.get(startPos)!.type;
  while (queue.length > 0) {
    const pos = queue.pop()!;
    if (visited.has(pos)) continue;
    visited.add(pos);
    getNeighbors(pos, model).forEach(neighbor => {
      if (board.get(neighbor)?.type === color && !visited.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }

  return visited;
}

function calculateLiberties(group: Set<string>, board: Board, model: BoardModel): number {
  const liberties = new Set<string>();
  group.forEach(pos => {
    getNeighbors(pos, model).forEach(neighbor => {
      if (!board.has(neighbor)) liberties.add(neighbor);
    });
  });
  return liberties.size;
}

function calculateTerritory(board: Board, model: BoardModel) {
  const visited = new Set<string>();
  let blackArea = 0, whiteArea = 0;

  for (let x = 1; x <= model; x++) {
    for (let y = 1; y <= model; y++) {
      const pos = `${x},${y}`;
      if (!board.has(pos) && !visited.has(pos)) {
        const { territory, owner } = checkAreaOwner(pos, board, visited, model);
        if (owner === "black") blackArea += territory.size;
        if (owner === "white") whiteArea += territory.size;
      }
    }
  }

  return { blackArea, whiteArea };
}

function checkAreaOwner(startPos: string, board: Board, visited: Set<string>, model: BoardModel) {
  const territory = new Set<string>();
  const queue = [startPos];
  let owner: ChessmanType | null = null;
  let isNeutral = false;

  while (queue.length > 0) {
    const pos = queue.shift()!;
    if (visited.has(pos)) continue;

    visited.add(pos);
    territory.add(pos);

    getNeighbors(pos, model).forEach(neighbor => {
      if (board.has(neighbor)) {
        const stone = board.get(neighbor)!;
        if (!owner) {
          owner = stone.type;
        } else if (owner !== stone.type) {
          isNeutral = true;
        }
      } else if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }

  return { territory, owner: isNeutral ? null : owner };
}

function getNeighbors(pos: string, model: BoardModel): string[] {
  const [x, y] = pos.split(",").map(Number);
  return [
    `${x + 1},${y}`, `${x - 1},${y}`,
    `${x},${y + 1}`, `${x},${y - 1}`
  ].filter(p => isValidPosition(p, model));
}

function isValidPosition(pos: string, model: BoardModel): boolean {
  const [x, y] = pos.split(",").map(Number);
  return x >= 1 && x <= model && y >= 1 && y <= model;
}

function countLiveStones(board: Board, type: ChessmanType): number {
  return Array.from(board.values()).filter(s => s.type === type).length;
}