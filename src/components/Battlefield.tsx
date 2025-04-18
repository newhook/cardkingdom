import React from 'react';
import { Player } from '../models/Player';
import { Game, GamePhase, AnimationState } from '../models/Game';
import CardComponent from './CardComponent';

interface BattlefieldProps {
  player: Player;
  game: Game;
  isHumanPlayer: boolean;
  onPlayCard: (handIndex: number, targetPosition: number) => void;
  onReorderCard: (startIndex: number, targetIndex: number) => void;
  onSellCard: (battlefieldIndex: number) => void;
  animationState: AnimationState | null;
  playerIndex: number;
}

const Battlefield: React.FC<BattlefieldProps> = ({
  player,
  game,
  isHumanPlayer,
  onPlayCard,
  onReorderCard,
  onSellCard,
  animationState,
  playerIndex
}) => {
  const isArrangementPhase = game.currentPhase === GamePhase.ARRANGEMENT;

  // --- Drag Handlers for the Battlefield Container (Dropping from Hand) ---
  const handleDragOverContainer = (e: React.DragEvent<HTMLDivElement>) => {
    if (isArrangementPhase && isHumanPlayer) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      (e.currentTarget as HTMLDivElement).classList.add("drag-over");
    }
  };

  const handleDragLeaveContainer = (e: React.DragEvent<HTMLDivElement>) => {
    if (isArrangementPhase && isHumanPlayer) {
      (e.currentTarget as HTMLDivElement).classList.remove("drag-over");
    }
  };

  const handleDropContainer = (e: React.DragEvent<HTMLDivElement>) => {
    if (isArrangementPhase && isHumanPlayer) {
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).classList.remove("drag-over");
      const sourceIndex = Number(e.dataTransfer.getData("text/plain") || -1);
      const sourceType = e.dataTransfer.getData("sourceType");

      if (sourceType === "hand" && sourceIndex >= 0) {
        // Play card from hand to the end of the battlefield
        onPlayCard(sourceIndex, player.battlefield.length);
      }
    }
  };

  // --- Drag Handlers for Individual Cards on the Battlefield (Dragging and Dropping) ---
  const handleCardDragStart = (e: React.DragEvent<HTMLDivElement>, cardIndex: number) => {
    e.dataTransfer.setData("text/plain", cardIndex.toString());
    e.dataTransfer.setData("sourceType", "battlefield");
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      (e.target as HTMLDivElement).style.opacity = "0.4";
    }, 0);
  };

  const handleCardDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLDivElement).style.opacity = "";
  };

  const handleCardDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow dropping onto other cards for reordering or inserting from hand
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    (e.currentTarget as HTMLDivElement).classList.add("drop-target");
  };

  const handleCardDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).classList.remove("drop-target");
  };

  const handleCardDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).classList.remove("drop-target");
    const sourceIndex = Number(e.dataTransfer.getData("text/plain") || -1);
    const sourceType = e.dataTransfer.getData("sourceType");

    if (sourceIndex >= 0) {
      if (sourceType === "battlefield") {
        // Reorder cards within the battlefield
        onReorderCard(sourceIndex, targetIndex);
      } else if (sourceType === "hand") {
        // Insert card from hand at this specific position
        onPlayCard(sourceIndex, targetIndex);
      }
    }
  };

  return (
    <div
      className={`battlefield ${isArrangementPhase && isHumanPlayer ? 'drop-zone' : ''}`}
      onDragOver={handleDragOverContainer}
      onDragLeave={handleDragLeaveContainer}
      onDrop={handleDropContainer}
    >
      <div className="cards-container">
        {player.battlefield.map((card, index) => {
          // Determine animation classes for this card
          const isAttacking = 
            animationState?.attackerInfo?.playerIndex === playerIndex && 
            animationState?.attackerInfo?.cardIndex === index;
          const isDefending = 
            animationState?.defenderInfo?.playerIndex === playerIndex && 
            animationState?.defenderInfo?.cardIndex === index;
          const isDefeated = 
            isDefending && animationState?.isDefeat;
          const isTakingDamage = 
            isDefending && animationState?.damageAmount !== null;

          const cardAnimClasses = [
             isAttacking ? 'attacking' : '',
             isDefending ? 'defending' : '',
             isTakingDamage ? 'taking-damage' : '',
             isDefeated ? 'defeated-animation' : '', // Use a specific class for defeat animation
          ].filter(Boolean).join(' ');

          return (
            <CardComponent
              key={`${player.id}-bf-${card.suit}-${card.rank}-${index}`}
              card={card}
              isFaceUp={true}
              draggable={isArrangementPhase && isHumanPlayer}
              onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleCardDragStart(e, index)}
              onDragEnd={handleCardDragEnd}
              onDragOver={isArrangementPhase && isHumanPlayer ? handleCardDragOver : undefined}
              onDragLeave={isArrangementPhase && isHumanPlayer ? handleCardDragLeave : undefined}
              onDrop={isArrangementPhase && isHumanPlayer ? (e: React.DragEvent<HTMLDivElement>) => handleCardDrop(e, index) : undefined}
              onSellClick={isArrangementPhase && isHumanPlayer ? () => onSellCard(index) : undefined}
              className={`${isArrangementPhase && isHumanPlayer ? 'draggable' : ''} ${cardAnimClasses}`.trim()}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Battlefield; 