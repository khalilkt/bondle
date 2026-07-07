export type CellPosition = {
  row: number;
  col: number;
};

export type Cell = CellPosition & {
  isBlack: boolean;
  haveSolution: boolean;
};

export type SolvedAdminCell = Omit<Cell, "haveSolution"> & {
  solution: string;
};

export type Direction = "across" | "down";

export interface Clue {
  id: string;
  index: number;
  clue: string;
  direction: Direction;
}

export interface Player {
  userId: string;
  name: string;
}

export type CrosswordPuzzle = {
  grid: Cell[][];
  clues: Clue[];
  themeId: string;
  date: string;
};

export type SolvedCrosswordPuzzle = Omit<CrosswordPuzzle, "grid"> & {
  id: string;
  grid: SolvedAdminCell[][];
};

export interface ThemeInterface {
  id: string;
  title: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
}

export interface CrosswordEntry {
  position: CellPosition;
  answer: string;
  playerId: string;
  valid: boolean | null;
}

export interface CrosswordState {
  tick: number;
  tries: number;
  entries: CrosswordEntry[];
  cursorPositions: Record<string, { x: number; y: number }>;
}

export interface RawActiveGame {
  status: "lobby" | "started" | "won" | "lost";
  startedAt: number | null;
  endedAt: number | null;
  players: Player[];
  onlinePlayers: string[];
  puzzle: CrosswordPuzzle | null;
  state: CrosswordState;
}

export interface ActiveGame extends RawActiveGame {
  parsedCells: ParsedCell[];
  size: {
    width: number;
    height: number;
  };
}

export type ParsedCell = Cell & {
  entry: Omit<CrosswordEntry, "position"> | null;
  clueNumber: number | null;
};

export function scanToWordEdge(
  cells: ParsedCell[],
  position: CellPosition,
  direction: Direction,
  lookForStart: boolean,
): CellPosition {
  const { row, col } = position;
  let lastPos = { row, col };
  while (true) {
    let currentRow = lastPos.row;
    let currentCol = lastPos.col;
    if (direction === "across") {
      currentCol += lookForStart ? -1 : 1;
    } else {
      currentRow += lookForStart ? -1 : 1;
    }
    const cell = cells.find(
      (c) => c.row === currentRow && c.col === currentCol,
    );
    if (cell && !cell.isBlack && cell.haveSolution) {
      lastPos = { row: currentRow, col: currentCol };
    } else {
      break;
    }
  }
  return lastPos;
}

export function getWordAtPosition({
  cells,
  position,
  direction,
}: {
  cells: ParsedCell[];
  position: CellPosition;
  direction: Direction;
}) {
  const startEdge = scanToWordEdge(cells, position, direction, true);
  const endEdge = scanToWordEdge(cells, position, direction, false);
  if (startEdge.row === endEdge.row && startEdge.col === endEdge.col) {
    return null;
  }
  const cellsInBetween: CellPosition[] = [];
  if (direction === "across") {
    for (let col = startEdge.col; col <= endEdge.col; col++) {
      cellsInBetween.push({ row: startEdge.row, col });
    }
  } else {
    for (let row = startEdge.row; row <= endEdge.row; row++) {
      cellsInBetween.push({ row, col: startEdge.col });
    }
  }
  return cellsInBetween;
}

export function parseActiveGame(
  grid: CrosswordPuzzle["grid"] | SolvedCrosswordPuzzle["grid"],
  entries: CrosswordEntry[],
): { parsedCells: ParsedCell[]; size: { width: number; height: number } } {
  const parsedCells: ParsedCell[] = [];
  let currentClueNumber = 1;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      let entry = entries.find(
        (e) => e.position.row === row && e.position.col === col,
      );

      if ("solution" in cell && !entry) {
        entry = {
          position: { row, col },
          answer: cell.solution,
          playerId: "BOT",
          valid: true,
        };
      }

      function isActive(cell: Cell | SolvedAdminCell) {
        if (!cell) return false;
        if (cell.isBlack) return false;
        if ("haveSolution" in cell && !cell.haveSolution) return false;
        if ("solution" in cell && !cell.solution) return false;
        return true;
      }

      const leftCell = grid[row][col - 1];
      const rightCell = grid[row][col + 1];
      const topCell = grid[row - 1]?.[col];
      const bottomCell = grid[row + 1]?.[col];

      let isStartOfClue = false;
      if (isActive(cell) && isActive(rightCell) && !isActive(leftCell)) {
        isStartOfClue = true;
      } else if (isActive(cell) && isActive(bottomCell) && !isActive(topCell)) {
        isStartOfClue = true;
      }

      parsedCells.push({
        ...{
          ...cell,
          haveSolution:
            "haveSolution" in cell ? cell.haveSolution : !!cell.solution,
        },
        row,
        col,
        entry: entry ? { ...entry } : null,
        clueNumber: isStartOfClue ? currentClueNumber++ : null,
      });
    }
  }
  const size = {
    width: grid[0].length,
    height: grid.length,
  };
  return {
    parsedCells,
    size,
  };
}
