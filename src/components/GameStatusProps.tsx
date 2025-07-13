interface GameStatusProps {
  greenZonesWon: number;
  redZonesWon: number;
  currentTurn: "green" | "red";
  gameOver: boolean;
  totalZones: number;
}

export const GameStatus = ({
  greenZonesWon,
  redZonesWon,
  currentTurn,
  gameOver,
  totalZones,
}: GameStatusProps) => {
  return (
    <div className="game-status">
      <div className="score">
        <span className="green-score">
          Verde: {greenZonesWon}/{totalZones}
        </span>
        <span className="red-score">
          Rojo: {redZonesWon}/{totalZones}
        </span>
      </div>

      <div className={`turn-indicator ${currentTurn}`}>
        Turno actual:{" "}
        {currentTurn === "green" ? "Verde (Máquina)" : "Rojo (Jugador)"}
      </div>

      {gameOver && (
        <div className="game-result">
          {greenZonesWon > redZonesWon && (
            <h2>¡Ganó el Yoshi Verde (Máquina)!</h2>
          )}
          {redZonesWon > greenZonesWon && (
            <h2>¡Ganó el Yoshi Rojo (Jugador)!</h2>
          )}
          {greenZonesWon === redZonesWon && <h2>¡Empate!</h2>}
        </div>
      )}
    </div>
  );
};
