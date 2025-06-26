export const BOARD_SIZE = 8;

export const KNIGHT_MOVES = [
  [-2, -1], [-2, 1],
  [-1, -2], [-1, 2],
  [1, -2], [1, 2],
  [2, -1], [2, 1]
];

export const SPECIAL_ZONES: number[][][] = [
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  [[0, 7], [0, 6], [0, 5], [1, 7], [2, 7]],
  [[7, 0], [7, 1], [7, 2], [6, 0], [5, 0]],
  [[7, 7], [7, 6], [7, 5], [6, 7], [5, 7]]
];

export type Cell = {
  zone: number;
  owner: "green" | "red" | null;
} | null;

export type Board = Cell[][];

export function getValidKnightMoves(
  pos: [number, number],
  board: Board,
  opponentPos: [number, number]
): [number, number][] {
  return KNIGHT_MOVES
    .map(([dx, dy]) => [pos[0] + dx, pos[1] + dy] as [number, number])
    .filter(([x, y]) => {
      // Dentro del tablero
      if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return false;
      
      // No es la posición del oponente
      if (x === opponentPos[0] && y === opponentPos[1]) return false;
      
      // Casilla vacía o zona especial no ocupada
      const cell = board[x][y];
      return cell === null || cell.owner === null;
    });
}

export function initialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => 
    Array(BOARD_SIZE).fill(null));
  
  SPECIAL_ZONES.forEach((zone, zoneIndex) => {
    zone.forEach(([x, y]) => {
      board[x][y] = { zone: zoneIndex, owner: null };
    });
  });
  
  return board;
}

export function isGameOver(board: Board): boolean {
  return SPECIAL_ZONES.every(zone => {
    const zoneCells = zone.map(([x, y]) => board[x][y]);
    return zoneCells.every(cell => cell?.owner !== null);
  });
}

export function calculateZoneControl(board: Board): {
  greenZonesWon: number;
  redZonesWon: number;
} {
  let greenZonesWon = 0;
  let redZonesWon = 0;

  SPECIAL_ZONES.forEach(zone => {
    let greenCount = 0;
    let redCount = 0;
    
    zone.forEach(([x, y]) => {
      const owner = board[x][y]?.owner;
      if (owner === 'green') greenCount++;
      else if (owner === 'red') redCount++;
    });

    if (greenCount > redCount) greenZonesWon++;
    else if (redCount > greenCount) redZonesWon++;
  });

  return { greenZonesWon, redZonesWon };
}