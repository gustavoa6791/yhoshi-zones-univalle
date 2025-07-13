import { DIFFICULTY_SETTINGS } from "./constants";
import { getValidKnightMoves, SPECIAL_ZONES } from "./gameLogic";
import type { Board } from "./gameLogic";

export type Player = "green" | "red";

export type GameNode = {
  board: Board;
  greenYoshi: [number, number];
  redYoshi: [number, number];
  turn: Player;
};

function evaluateBoard(node: GameNode): number {
  let score = 0;
  
  // 1. Evaluar control de zonas especiales
  const zoneScores = SPECIAL_ZONES.map(zone => {
    let greenCount = 0;
    let redCount = 0;
    
    zone.forEach(([x, y]) => {
      const owner = node.board[x][y]?.owner;
      if (owner === 'green') greenCount++;
      else if (owner === 'red') redCount++;
    });
    
    return greenCount - redCount;
  });
  
  // Sumar puntuación de zonas con mayor peso
  score += zoneScores.reduce((sum, val) => sum + val, 0) * 10;
  
  // 2. Movilidad (cantidad de movimientos posibles)
  const greenMobility = getValidKnightMoves(node.greenYoshi, node.board, node.redYoshi).length;
  const redMobility = getValidKnightMoves(node.redYoshi, node.board, node.greenYoshi).length;
  score += (greenMobility - redMobility) * 2;
  
  return score;
}

export function minimax(
  node: GameNode,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): number {
  if (depth === 0) return evaluateBoard(node);

  const currentPlayer = maximizingPlayer ? 'green' : 'red';
  const currentPos = currentPlayer === 'green' ? node.greenYoshi : node.redYoshi;
  const opponentPos = currentPlayer === 'green' ? node.redYoshi : node.greenYoshi;

  const moves = getValidKnightMoves(currentPos, node.board, opponentPos);

  if (moves.length === 0) return evaluateBoard(node);

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const [x, y] = move;
      
      // Crear nuevo estado del tablero
      const newBoard = node.board.map(row => row.map(cell => cell ? {...cell} : null));
      if (newBoard[x][y]?.zone !== undefined) {
        newBoard[x][y] = {...newBoard[x][y]!, owner: currentPlayer};
      }

      const newNode: GameNode = {
        board: newBoard,
        greenYoshi: currentPlayer === 'green' ? [x, y] : node.greenYoshi,
        redYoshi: currentPlayer === 'red' ? [x, y] : node.redYoshi,
        turn: currentPlayer === 'green' ? 'red' : 'green'
      };

      const evaluation = minimax(newNode, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const [x, y] = move;
      
      // Crear nuevo estado del tablero
      const newBoard = node.board.map(row => row.map(cell => cell ? {...cell} : null));
      if (newBoard[x][y]?.zone !== undefined) {
        newBoard[x][y] = {...newBoard[x][y]!, owner: currentPlayer};
      }

      const newNode: GameNode = {
        board: newBoard,
        greenYoshi: currentPlayer === 'green' ? [x, y] : node.greenYoshi,
        redYoshi: currentPlayer === 'red' ? [x, y] : node.redYoshi,
        turn: currentPlayer === 'green' ? 'red' : 'green'
      };

      const evaluation = minimax(newNode, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(
  node: GameNode,
  difficulty: keyof typeof DIFFICULTY_SETTINGS
): [number, number] {
  const { depth, randomMoveChance } = DIFFICULTY_SETTINGS[difficulty];
  const validMoves = getValidKnightMoves(node.greenYoshi, node.board, node.redYoshi);

  if (validMoves.length === 0) {
    console.log('⚠️ No hay movimientos válidos para Yoshi Verde');
    return node.greenYoshi;
  }

  if (Math.random() < randomMoveChance) {
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    console.log(`🎲 Movimiento aleatorio (dificultad ${difficulty}): [${randomMove[0]}, ${randomMove[1]}]`);
    return randomMove;
  }

  let bestScore = -Infinity;
  let bestMove = validMoves[0];
  const moveEvaluations: {move: [number, number], score: number}[] = [];

  console.log('🤖 Analizando movimientos con Minimax...');
  console.log(`📊 Profundidad: ${depth}`);
  console.log('📝 Movimientos posibles:', validMoves);

  for (const move of validMoves) {
    const [x, y] = move;
    const newBoard = node.board.map(row => row.map(cell => cell ? {...cell} : null));
    
    if (newBoard[x][y]?.zone !== undefined) {
      newBoard[x][y]!.owner = 'green';
    }

    const newNode: GameNode = {
      board: newBoard,
      greenYoshi: [x, y],
      redYoshi: node.redYoshi,
      turn: 'red'
    };

    const score = minimax(newNode, depth - 1, -Infinity, Infinity, false);
    moveEvaluations.push({move, score});

    if (score > bestScore || (score === bestScore && Math.random() > 0.5)) {
      bestScore = score;
      bestMove = move;
    }
  }

  // Log detallado de las evaluaciones
  console.log('📈 Evaluación de movimientos:');
  moveEvaluations.forEach(({move, score}) => {
    console.log(`➡️ [${move[0]},${move[1]}]: ${score.toFixed(2)} ${
      move[0] === bestMove[0] && move[1] === bestMove[1] ? '⭐ MEJOR' : ''
    }`);
  });
  
  console.log(`🏆 Mejor movimiento seleccionado: [${bestMove[0]}, ${bestMove[1]}] con puntuación: ${bestScore.toFixed(2)}`);
  console.log('-----------------------------');

  return bestMove;
}