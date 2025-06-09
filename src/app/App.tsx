import { useState, useEffect, useRef, type JSX } from "react";
import "./App.css";
import { getBestMove, getValidMoves } from "../utils/minimax";
import { GameStatus } from "../components/GameStatusProps";
import { DIFFICULTY_SETTINGS } from "../utils/constants";


const BOARD_SIZE = 8;

const MOVES = [
  [-2, -1], [-2, 1],
  [-1, -2], [-1, 2],
  [1, -2], [1, 2],
  [2, -1], [2, 1]
];

type Cell = {
  zone: number;
  owner: "green" | "red" | null;
} | null;

const SPECIAL_ZONES: number[][][] = [
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  [[0, 7], [0, 6], [0, 5], [1, 7], [2, 7]],
  [[7, 0], [7, 1], [7, 2], [6, 0], [5, 0]],
  [[7, 7], [7, 6], [7, 5], [6, 7], [5, 7]]
];

const initialBoard = (): Cell[][] => {
  const board: Cell[][] = Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null));
  SPECIAL_ZONES.forEach((zone, i) => {
    zone.forEach(([x, y]) => {
      board[x][y] = { zone: i, owner: null };
    });
  });
  return board;
};

function getRandomPosition(board: Cell[][], excludeZones: number[][][]): [number, number] {
  let x: number, y: number;
  let attempts = 0;
  do {
    x = Math.floor(Math.random() * BOARD_SIZE);
    y = Math.floor(Math.random() * BOARD_SIZE);
    attempts++;
  } while ((excludeZones.some(zone => zone.some(([zx, zy]) => zx === x && zy === y)) || board[x][y] !== null) && attempts < 100);
  return [x, y];
}

function getPossibleMoves(pos: [number, number], board: Cell[][], opponent: [number, number]): [number, number][] {
  return MOVES.map(([dx, dy]) => [pos[0] + dx, pos[1] + dy] as [number, number])
    .filter(([x, y]) =>
      x >= 0 && x < BOARD_SIZE &&
      y >= 0 && y < BOARD_SIZE &&
      !(x === opponent[0] && y === opponent[1]) &&
      (!board[x][y] || board[x][y]?.owner === null)
    );
}

function App(): JSX.Element {
  const [board, setBoard] = useState<Cell[][]>(initialBoard);
  const [greenYoshi, setGreenYoshi] = useState<[number, number]>([0, 0]);
  const [redYoshi, setRedYoshi] = useState<[number, number]>([0, 1]);
  const [currentTurn, setCurrentTurn] = useState<"green" | "red">("green");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const timeoutRef = useRef<number | null>(null);

  const setCurrentYoshi = currentTurn === "green" ? setGreenYoshi : setRedYoshi;
  const possibleMoves = currentTurn === "green"
    ? getPossibleMoves(greenYoshi, board, redYoshi)
    : getPossibleMoves(redYoshi, board, greenYoshi);

  useEffect(() => {
    if (!gameStarted || difficulty === null) return;

    const newBoard = initialBoard();
    let gPos: [number, number], rPos: [number, number];
    do {
      gPos = getRandomPosition(newBoard, SPECIAL_ZONES);
      rPos = getRandomPosition(newBoard, SPECIAL_ZONES);
    } while (gPos[0] === rPos[0] && gPos[1] === rPos[1]);

    setBoard(newBoard);
    setGreenYoshi(gPos);
    setRedYoshi(rPos);
    setCurrentTurn("green");
    setGameOver(false);
  }, [gameStarted, difficulty]);

  const moveYoshi = (x: number, y: number) => {
    if (gameOver) return;
    if (currentTurn === "red") {
      console.log(`Yoshi rojo se mueve de [${redYoshi[0]}, ${redYoshi[1]}] a [${x}, ${y}]`);
    }
    setCurrentYoshi([x, y]);
    const cell = board[x][y];
    if (cell && cell.owner === null) {
      const newBoard = board.map(row => row.map(c => (c ? { ...c } : null)));
      newBoard[x][y]!.owner = currentTurn;
      setBoard(newBoard);
    }
    setCurrentTurn(currentTurn === "green" ? "red" : "green");
  };

  function makeMachineMove() {
    if (difficulty === null) return;
    const bestMove = getBestMove({ board, greenYoshi, redYoshi, turn: "green" }, difficulty);
    const validMoves = getValidMoves(greenYoshi, board, redYoshi);
    const isValid = validMoves.some(([x, y]) => x === bestMove[0] && y === bestMove[1]);
    console.log(`Yoshi verde se mueve de [${greenYoshi[0]}, ${greenYoshi[1]}] a [${bestMove[0]}, ${bestMove[1]}]`);
    if (isValid) moveYoshi(bestMove[0], bestMove[1]);
    else console.warn("Movimiento inválido de la máquina:", bestMove, "Válidos:", validMoves);
  }

  useEffect(() => {
    if (!gameStarted || difficulty === null) return;
    if (currentTurn === "green" && !gameOver) {
      timeoutRef.current = window.setTimeout(() => {
        makeMachineMove();
      }, 1000);
    }
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentTurn, gameOver, gameStarted, difficulty]);

  const handleCellClick = (x: number, y: number) => {
    if (!gameStarted || gameOver || currentTurn !== "red") return;
    if (!possibleMoves.some(([px, py]) => px === x && py === y)) return;
    moveYoshi(x, y);
  };

  const [greenZonesWon, setGreenZonesWon] = useState(0);
  const [redZonesWon, setRedZonesWon] = useState(0);

  useEffect(() => {
    const zoneControl = SPECIAL_ZONES.map((zone) => {
      let greenCount = 0;
      let redCount = 0;
      zone.forEach(([x, y]) => {
        const cell = board[x][y];
        if (cell?.owner === "green") greenCount++;
        else if (cell?.owner === "red") redCount++;
      });
      if (greenCount + redCount === 5) {
        return greenCount > redCount ? "green" : "red";
      }
      return null;
    });
    setGreenZonesWon(zoneControl.filter(z => z === "green").length);
    setRedZonesWon(zoneControl.filter(z => z === "red").length);
  }, [board]);

  useEffect(() => {
    const totalPainted = SPECIAL_ZONES.flat().filter(([x, y]) => board[x][y]?.owner !== null).length;
    if (totalPainted === 20) {
      setGameOver(true);
    }
  }, [board]);

  const renderCell = (x: number, y: number): JSX.Element => {
    const isGreen = greenYoshi[0] === x && greenYoshi[1] === y;
    const isRed = redYoshi[0] === x && redYoshi[1] === y;
    const cell = board[x][y];
    const painted = cell?.owner;
    const isPossibleMove = possibleMoves.some(([px, py]) => px === x && py === y);

    return (
      <td
        key={`${x}-${y}`}
        className={`cell ${cell?.zone !== undefined ? "zone" : ""} ${painted || ""} ${isPossibleMove ? "highlight" : ""}`}
        onClick={() => handleCellClick(x, y)}
      >
        {isGreen && <img src="/images/yoshi-green.png" alt="Green Yoshi" style={{ width: "40px", height: "auto", objectFit: "contain" }} />}
        {isRed && <img src="/images/yoshi-red.png" alt="Red Yoshi" style={{ width: "40px", height: "auto", objectFit: "contain" }} />}
      </td>
    );
  };

  return (
    <div className="App">
      <h1 className="title">
        <img src="/egg.png" alt="" width={50} /> Yoshi's Zones <img src="/egg.png" alt="" width={50} />
      </h1>

      {!gameStarted ? (
        <div className="difficulty-selector">
          <label>Selecciona dificultad: </label>
          <select onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}>
            <option value="">-- Elegir --</option>
            <option value="easy">Principiante</option>
            <option value="medium">Amateur</option>
            <option value="hard">Experto</option>
          </select>
          <button disabled={!difficulty} onClick={() => setGameStarted(true)}>Iniciar Juego</button>
        </div>
      ) : (
        <>
          <GameStatus
            greenZonesWon={greenZonesWon}
            redZonesWon={redZonesWon}
            currentTurn={currentTurn}
            gameOver={gameOver}
            totalZones={4}
          />

          <table className="board">
            <tbody>
              {Array.from({ length: BOARD_SIZE }, (_, x) => (
                <tr key={x}>
                  {Array.from({ length: BOARD_SIZE }, (_, y) => renderCell(x, y))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
