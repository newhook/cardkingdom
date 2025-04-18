import { Game, GamePhase } from '../models/Game';

// --- ActionButtons Component (defined inline) ---
interface ActionButtonsProps {
  game: Game;
  onStartBattle: () => void;
  onPrepareNextRound: () => void;
  onNewGame: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  game,
  onStartBattle,
  onPrepareNextRound,
  onNewGame,
}) => {
  const renderButtons = () => {
    switch (game.currentPhase) {
      case GamePhase.DRAFT:
        return (
          <div className="phase-info">
            Draft Phase: Acquire cards for your army
          </div>
        );
      case GamePhase.ARRANGEMENT:
        return (
          <>
            <div className="phase-info active-phase">
              Arrangement Phase: Position your cards for battle
            </div>
            <div className="arrangement-instructions main-instructions">
              <strong>Placement Phase:</strong> Drag cards from hand to battlefield.<br />
              Order matters - cards attack left to right.<br />
              Click "Ready for Battle" when done.
            </div>
            <button className="primary-button" onClick={onStartBattle}>
              Ready for Battle
            </button>
          </>
        );
      case GamePhase.DAMAGE:
        return (
          <>
            <div className="phase-info">
              Damage Phase: Battle round complete
            </div>
            <button className="primary-button" onClick={onPrepareNextRound}>
              Next Round
            </button>
          </>
        );
      case GamePhase.GAME_OVER:
        const winner = game.getWinner();
        return (
          <>
            <div className="game-over-message">
              {winner ? `Game Over! ${winner.name} wins!` : "Game Over! It's a draw!"}
            </div>
            <button className="primary-button" onClick={onNewGame}>
              New Game
            </button>
          </>
        );
      default:
        return null;
    }
  };
  return <div className="action-buttons">{renderButtons()}</div>;
};

export default ActionButtons;