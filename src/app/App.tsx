import { useState, useEffect, useRef, type JSX } from 'react';
import './App.css';

const BOARD_SIZE = 8;

const MOVES = [
  [-2, -1], [-2, 1],
  [-1, -2], [-1, 2],
  [1, -2], [1, 2],
  [2, -1], [2, 1]
];

type Cell = {
  zone: number;
  owner: 'green' | 'red' | null;
} | null;

const SPECIAL_ZONES: number[][][] = [
  [
    [0, 0], [0, 1], [0, 2], [1, 0], [2, 0]
  ],
  [
    [0, 7], [0, 6], [0, 5], [1, 7], [2, 7]
  ],
  [
    [7, 0], [7, 1], [7, 2], [6, 0], [5, 0]
  ],
  [
    [7, 7], [7, 6], [7, 5], [6, 7], [5, 7]
  ]
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

function getRandomPosition(excludeZones: number[][][]): [number, number] {
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * BOARD_SIZE);
    y = Math.floor(Math.random() * BOARD_SIZE);
  } while (excludeZones.some(zone => zone.some(([zx, zy]) => zx === x && zy === y)));
  return [x, y];
}

function getPossibleMoves(pos: [number, number], board: Cell[][], opponent: [number, number]): [number, number][] {
  return MOVES
    .map(([dx, dy]) => [pos[0] + dx, pos[1] + dy] as [number, number])
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
  const [currentTurn, setCurrentTurn] = useState<'green' | 'red'>('green');
  const timeoutRef = useRef<number | null>(null);

  const setCurrentYoshi = currentTurn === 'green' ? setGreenYoshi : setRedYoshi;
  const possibleMoves = currentTurn === 'green' ? getPossibleMoves(greenYoshi, board, redYoshi) : [];

  useEffect(() => {
    let gPos: [number, number], rPos: [number, number];
    do {
      gPos = getRandomPosition(SPECIAL_ZONES);
      rPos = getRandomPosition(SPECIAL_ZONES);
    } while (gPos[0] === rPos[0] && gPos[1] === rPos[1]);
    setGreenYoshi(gPos);
    setRedYoshi(rPos);
  }, []);

  useEffect(() => {
    if (currentTurn === 'red') {
      const moves = getPossibleMoves(redYoshi, board, greenYoshi);
      if (moves.length > 0) {
        const [x, y] = moves[Math.floor(Math.random() * moves.length)];
        timeoutRef.current = window.setTimeout(() => {
          moveYoshi(x, y);
        }, 700);
      }
    }
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentTurn]);

  const moveYoshi = (x: number, y: number) => {
    setCurrentYoshi([x, y]);
    const cell = board[x][y];
    if (cell && cell.owner === null) {
      const newBoard = board.map(row => row.map(c => (c ? { ...c } : null)));
      newBoard[x][y]!.owner = currentTurn;
      setBoard(newBoard);
    }
    setCurrentTurn(currentTurn === 'green' ? 'red' : 'green');
  };

  const handleCellClick = (x: number, y: number) => {
    if (currentTurn !== 'green') return;
    if (!possibleMoves.some(([px, py]) => px === x && py === y)) return;
    moveYoshi(x, y);
  };

  const renderCell = (x: number, y: number): JSX.Element => {
    const isGreen = greenYoshi[0] === x && greenYoshi[1] === y;
    const isRed = redYoshi[0] === x && redYoshi[1] === y;
    const cell = board[x][y];
    const painted = cell?.owner;
    const isPossibleMove = currentTurn === 'green' && possibleMoves.some(([px, py]) => px === x && py === y);

    return (
      <td
        key={`${x}-${y}`}
        className={`cell ${cell?.zone !== undefined ? 'zone' : ''} ${painted || ''} ${isPossibleMove ? 'highlight' : ''}`}
        onClick={() => handleCellClick(x, y)}
      >
        {isGreen && <img src="/images/yoshi-green.png" alt="Green Yoshi" style={{ width: '40px', height: 'auto', objectFit: 'contain' }} />}
        {isRed && <img src="/images/yoshi-red.png" alt="Red Yoshi" style={{ width: '40px', height: 'auto', objectFit: 'contain' }} />}
      </td>
    );
  };

  return (
    <div className="App">
      <h1 className='title'> <img src="/egg.png" alt="" width={50} /> Yoshi's Zones   <img src="/egg.png" alt="" width={50} /> </h1>
      <table className="board">
        <tbody>
          {Array.from({ length: BOARD_SIZE }, (_, x) => (
            <tr key={x}>
              {Array.from({ length: BOARD_SIZE }, (_, y) => renderCell(x, y))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
