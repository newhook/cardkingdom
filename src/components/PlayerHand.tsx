import React from 'react';
import { Player } from '../models/Player';
import { Game, GamePhase } from '../models/Game';
import CardComponent from './CardComponent';

interface PlayerHandProps {
  player: Player;
  game: Game;
  isHumanPlayer: boolean;
  onPlayCard: (handIndex: number, targetPosition: number) => void;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  game,
  isHumanPlayer,
  onPlayCard,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, cardIndex: number) => {
    e.dataTransfer.setData("text/plain", cardIndex.toString());
    e.dataTransfer.setData("sourceType", "hand");
    e.dataTransfer.effectAllowed = "move";
    // Add visual feedback (optional, handled by CSS potentially)
    setTimeout(() => {
      (e.target as HTMLDivElement).style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset visual feedback
    (e.target as HTMLDivElement).style.opacity = "";
  };

  const handleCardClick = (cardIndex: number) => {
    // Play card to the end of the battlefield when clicked
    onPlayCard(cardIndex, player.battlefield.length);
  };

  const isArrangementPhase = game.currentPhase === GamePhase.ARRANGEMENT;

  return (
    <div className={`hand ${isHumanPlayer ? 'human-hand' : 'opponent-hand'}`}>
      <h3>{isHumanPlayer ? "Your Hand" : "Opponent Hand"}</h3>

      {isArrangementPhase && isHumanPlayer && (
        <div className="arrangement-instructions">
          Drag cards to the battlefield or click to play them in order.
        </div>
      )}

      <div className="cards-container">
        {player.hand.map((card, index) => (
          <CardComponent
            key={`${player.id}-hand-${card.suit}-${card.rank}-${index}`}
            card={card}
            isFaceUp={isHumanPlayer} // Show human hand, hide opponent
            draggable={isArrangementPhase && isHumanPlayer}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onClick={isArrangementPhase && isHumanPlayer ? () => handleCardClick(index) : undefined}
            className={isArrangementPhase && isHumanPlayer ? 'draggable' : ''}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand; 