import { useState, useEffect, useRef, type JSX, useCallback } from "react";
import "./App.css";
import { getBestMove } from "../utils/minimax";
import { GameStatus } from "../components/GameStatusProps";
import {
  initialBoard,
  getValidKnightMoves,
  isGameOver,
  calculateZoneControl,
  BOARD_SIZE,
  SPECIAL_ZONES,
  type Board,
} from "../utils/gameLogic";

const App = (): JSX.Element => {
  // Estados del juego
  const [board, setBoard] = useState<Board>(initialBoard());
  const [greenYoshi, setGreenYoshi] = useState<[number, number]>([0, 0]);
  const [redYoshi, setRedYoshi] = useState<[number, number]>([0, 1]);
  const [currentTurn, setCurrentTurn] = useState<"green" | "red">("green");
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | null
  >(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [greenZonesWon, setGreenZonesWon] = useState(0);
  const [redZonesWon, setRedZonesWon] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  // Obtener movimientos posibles
  const possibleMoves = getValidKnightMoves(
    currentTurn === "green" ? greenYoshi : redYoshi,
    board,
    currentTurn === "green" ? redYoshi : greenYoshi
  );

  // Inicializar juego
  const initializeGame = useCallback(() => {
    const newBoard = initialBoard();
    let gPos: [number, number], rPos: [number, number];

    do {
      gPos = getRandomPosition(newBoard);
      rPos = getRandomPosition(newBoard);
    } while (gPos[0] === rPos[0] && gPos[1] === rPos[1]);

    // Log de posiciones
    console.log("🚀 Posiciones iniciales:");
    console.log(`🟢 Yoshi Verde: [${gPos[0]}, ${gPos[1]}]`);
    console.log(`🔴 Yoshi Rojo: [${rPos[0]}, ${rPos[1]}]`);
    console.log("-----------------------------");

    setBoard(newBoard);
    setGreenYoshi(gPos);
    setRedYoshi(rPos);
    setCurrentTurn("green");
    setGameOver(false);
    setGreenZonesWon(0);
    setRedZonesWon(0);
  }, []);

  // Obtener posición aleatoria
  const getRandomPosition = (board: Board): [number, number] => {
    let x: number, y: number;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      x = Math.floor(Math.random() * BOARD_SIZE);
      y = Math.floor(Math.random() * BOARD_SIZE);
      attempts++;
    } while (
      SPECIAL_ZONES.some((zone) =>
        zone.some(([zx, zy]) => zx === x && zy === y)
      ) ||
      (board[x][y] !== null && attempts < maxAttempts)
    );

    return [x, y];
  };

  // Mover Yoshi
  const moveYoshi = useCallback(
    (x: number, y: number) => {
      if (gameOver) return;

      const fromPosition = currentTurn === "green" ? greenYoshi : redYoshi;

      console.log(
        `🎯 ${
          currentTurn === "green" ? "🟢 Yoshi Verde" : "🔴 Yoshi Rojo"
        } se mueve:`
      );
      console.log(`📍 Desde: [${fromPosition[0]}, ${fromPosition[1]}]`);
      console.log(`🏁 Hacia: [${x}, ${y}]`);

      const newBoard = board.map((row) =>
        row.map((cell) => (cell ? { ...cell } : null))
      );
      const cell = newBoard[x][y];

      // Actualizar posición
      if (currentTurn === "green") {
        setGreenYoshi([x, y]);
      } else {
        setRedYoshi([x, y]);
      }

      // Pintar celda si es zona especial
      if (cell && cell.owner === null) {
        newBoard[x][y] = { ...cell, owner: currentTurn };
        setBoard(newBoard);
        console.log(
          `🎨 ${
            currentTurn === "green" ? "🟢 Verde" : "🔴 Rojo"
          } pinta la casilla`
        );
      }

      // Cambiar turno
      setCurrentTurn(currentTurn === "green" ? "red" : "green");
      console.log("-----------------------------");
    },
    [board, currentTurn, gameOver]
  );

  // Movimiento de la máquina
  const makeMachineMove = useCallback(() => {
    if (difficulty === null || currentTurn !== "green") return;

    const gameNode = {
      board,
      greenYoshi,
      redYoshi,
      turn: currentTurn,
    };

    const bestMove = getBestMove(gameNode, difficulty);
    const isValid = possibleMoves.some(
      ([x, y]) => x === bestMove[0] && y === bestMove[1]
    );

    if (isValid) {
      moveYoshi(bestMove[0], bestMove[1]);
    } else if (possibleMoves.length > 0) {
      // Fallback: movimiento aleatorio válido
      const randomMove =
        possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      moveYoshi(randomMove[0], randomMove[1]);
    } else {
      // No hay movimientos válidos, pasar turno
      setCurrentTurn("red");
    }
  }, [
    board,
    currentTurn,
    difficulty,
    greenYoshi,
    possibleMoves,
    redYoshi,
    moveYoshi,
  ]);

  // Efecto para movimiento automático de la máquina
  useEffect(() => {
    if (!gameStarted || difficulty === null || gameOver) return;

    if (currentTurn === "green") {
      timeoutRef.current = window.setTimeout(() => {
        makeMachineMove();
      }, 1000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentTurn, gameOver, gameStarted, difficulty, makeMachineMove]);

  // Efecto para verificar estado del juego
  useEffect(() => {
    if (!gameStarted) return;

    const gameEnded = isGameOver(board);
    if (gameEnded) {
      setGameOver(true);
    }

    const { greenZonesWon: green, redZonesWon: red } =
      calculateZoneControl(board);
    setGreenZonesWon(green);
    setRedZonesWon(red);
  }, [board, gameStarted]);

  // Manejador de clic en celdas
  const handleCellClick = (x: number, y: number) => {
    if (!gameStarted || gameOver || currentTurn !== "red") return;
    if (!possibleMoves.some(([px, py]) => px === x && py === y)) return;
    moveYoshi(x, y);
  };

  // Renderizar celda
  const renderCell = (x: number, y: number): JSX.Element => {
    const isGreen = greenYoshi[0] === x && greenYoshi[1] === y;
    const isRed = redYoshi[0] === x && redYoshi[1] === y;
    const cell = board[x][y];
    const painted = cell?.owner;
    const isPossibleMove = possibleMoves.some(
      ([px, py]) => px === x && py === y
    );

    return (
      <td
        key={`${x}-${y}`}
        className={`cell ${cell?.zone !== undefined ? "zone" : ""} ${
          painted || ""
        } ${isPossibleMove ? "highlight" : ""}`}
        onClick={() => handleCellClick(x, y)}
      >
        {isGreen && (
          <img
            src="/images/yoshi-green.png"
            alt="Green Yoshi"
            style={{ width: "40px", height: "auto", objectFit: "contain" }}
          />
        )}
        {isRed && (
          <img
            src="/images/yoshi-red.png"
            alt="Red Yoshi"
            style={{ width: "40px", height: "auto", objectFit: "contain" }}
          />
        )}
      </td>
    );
  };

  return (
    <div className="App">
      <h1 className="title">
        <img src="/egg.png" alt="" width={50} /> Yoshi's Zones{" "}
        <img src="/egg.png" alt="" width={50} />
      </h1>

      {!gameStarted ? (
        <div className="difficulty-selector">
          <label>Selecciona dificultad: </label>
          <select
            onChange={(e) =>
              setDifficulty(e.target.value as "easy" | "medium" | "hard")
            }
            defaultValue=""
          >
            <option value="" disabled>
              -- Elegir --
            </option>
            <option value="easy">Principiante</option>
            <option value="medium">Amateur</option>
            <option value="hard">Experto</option>
          </select>
          <button
            disabled={!difficulty}
            onClick={() => {
              setGameStarted(true);
              initializeGame();
            }}
          >
            Iniciar Juego
          </button>
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
                  {Array.from({ length: BOARD_SIZE }, (_, y) =>
                    renderCell(x, y)
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {gameOver && (
            <div className="game-over-message">
              <h2>
                {greenZonesWon > redZonesWon
                  ? "¡Ganó el Yoshi Verde (Máquina)!"
                  : redZonesWon > greenZonesWon
                  ? "¡Ganó el Yoshi Rojo (Jugador)!"
                  : "¡Empate!"}
              </h2>
              <button onClick={initializeGame}>Jugar de nuevo</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
