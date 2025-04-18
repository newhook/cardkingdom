import React from 'react';
import { Game, GamePhase } from '../models/Game';
import CardComponent from './CardComponent';

interface DraftPoolProps {
  game: Game;
  onDraftCard: (index: number) => void;
  onPassDraft: () => void;
}

const DraftPool: React.FC<DraftPoolProps> = ({ game, onDraftCard, onPassDraft }) => {
  const { turnNumber, currentDraftPoints, draftPool } = game;
  const currentDraftingPlayer = game.getCurrentDraftingPlayer();

  const handleCardClick = (index: number) => {
    const card = draftPool[index];
    if (card.cost <= currentDraftPoints) {
      onDraftCard(index);
    }
  };

  return (
    <div className="draft-pool">
      <h3>Draft Pool</h3>

      <div className="draft-points-info">
        Turn {turnNumber} - <strong>{currentDraftingPlayer.name}'s Turn</strong><br />
        Draft Points: {currentDraftPoints}
      </div>

      {turnNumber === 1 ? (
        <div className="draft-order-info">
          First turn: Random player starts drafting
        </div>
      ) : (
        <div className="draft-order-info">
          Drafting order: Player with lowest health drafts first
        </div>
      )}

      <button className="pass-button" onClick={onPassDraft}>
        Pass
      </button>

      <div className="cards-container">
        {draftPool.map((card, index) => {
          const canAfford = card.cost <= currentDraftPoints;
          return (
            <CardComponent
              key={`draft-${card.suit}-${card.rank}-${index}`}
              card={card}
              isFaceUp={true}
              onClick={canAfford ? () => handleCardClick(index) : undefined}
              className={!canAfford ? 'disabled' : ''}
            >
              {/* Add cost badge inside the card */}
              <div className="cost-badge">{card.cost}</div>
            </CardComponent>
          );
        })}
      </div>
    </div>
  );
};

export default DraftPool; 