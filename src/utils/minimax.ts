import { DIFFICULTY_SETTINGS } from "./constants";

export type Player = "green" | "red";

export type GameNode = {
  board: (null | { zone: number; owner: Player | null })[][];
  greenYoshi: [number, number];
  redYoshi: [number, number];
  turn: Player;
};

export function getValidMoves(
  pos: [number, number],
  board: GameNode["board"],
  opponent: [number, number]
): [number, number][] {
  const MOVES = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  return MOVES.map(
    ([dx, dy]) => [pos[0] + dx, pos[1] + dy] as [number, number]
  ).filter(
    ([x, y]) =>
      x >= 0 &&
      x < 8 &&
      y >= 0 &&
      y < 8 &&
      !(x === opponent[0] && y === opponent[1]) &&
      (!board[x][y] || board[x][y]?.owner === null)
  );
}

function evaluateBoard(node: GameNode): number {
  let greenCount = 0;
  let redCount = 0;
  for (const row of node.board) {
    for (const cell of row) {
      if (cell?.owner === "green") greenCount++;
      else if (cell?.owner === "red") redCount++;
    }
  }

  const greenMoves = getValidMoves(
    node.greenYoshi,
    node.board,
    node.redYoshi
  ).length;
  const redMoves = getValidMoves(
    node.redYoshi,
    node.board,
    node.greenYoshi
  ).length;

  return (greenCount - redCount) * 100 + (greenMoves - redMoves); // heruristica
}

export function minimax(
  node: GameNode,
  depth: number,
  maximizingPlayer: boolean
): number {
  if (depth === 0) return evaluateBoard(node);

  const currentPlayer = maximizingPlayer ? "green" : "red";
  const currentPos =
    currentPlayer === "green" ? node.greenYoshi : node.redYoshi;
  const opponentPos =
    currentPlayer === "green" ? node.redYoshi : node.greenYoshi;

  const moves = getValidMoves(currentPos, node.board, opponentPos);

  if (moves.length === 0) return evaluateBoard(node);

  const scores = moves.map((move) => {
    const [x, y] = move;

    const newBoard = node.board.map((row) =>
      row.map((cell) => (cell ? { ...cell } : null))
    );
    if (newBoard[x][y]) newBoard[x][y]!.owner = currentPlayer;

    const newNode: GameNode = {
      board: newBoard,
      greenYoshi: currentPlayer === "green" ? [x, y] : node.greenYoshi,
      redYoshi: currentPlayer === "red" ? [x, y] : node.redYoshi,
      turn: currentPlayer === "green" ? "red" : "green",
    };

    return minimax(newNode, depth - 1, !maximizingPlayer);
  });

  return maximizingPlayer ? Math.max(...scores) : Math.min(...scores);
}

export function getBestMove(
  node: GameNode,
  difficulty: keyof typeof DIFFICULTY_SETTINGS
): [number, number] {
  const { depth, randomMoveChance } = DIFFICULTY_SETTINGS[difficulty];
  const moves = getValidMoves(node.greenYoshi, node.board, node.redYoshi);

  if (moves.length === 0) {
    return node.greenYoshi;
  }

  if (Math.random() < randomMoveChance) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestScore = -Infinity;
  let bestMove: [number, number] = moves[0];

  for (const move of moves) {
    const [x, y] = move;
    const newBoard = node.board.map((row) =>
      row.map((cell) => (cell ? { ...cell } : null))
    );
    if (newBoard[x][y] && newBoard[x][y]?.zone !== undefined) {
      newBoard[x][y]!.owner = "green";
    }

    const newNode: GameNode = {
      board: newBoard,
      greenYoshi: [x, y],
      redYoshi: node.redYoshi,
      turn: "red",
    };

    const score = minimax(newNode, depth - 1, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  console.log("Green evaluating moves:", moves);
  console.log("Green best move selected:", bestMove);

  return bestMove;
}
