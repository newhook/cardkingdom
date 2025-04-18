import React from 'react';
import { Game, GamePhase } from '../models/Game';
import CardComponent from './CardComponent';

interface DraftPoolProps {
  game: Game;
  onDraftCard: (index: number) => void;
  onPassDraft: () => void;
  onHideOverlay: () => void;
}

const DraftPool: React.FC<DraftPoolProps> = ({ game, onDraftCard, onPassDraft, onHideOverlay }) => {
  const { draftPool, draftingPlayerIndex, playersPassedDraftPhase } = game;

  if (draftingPlayerIndex === -1) return null; // Should not happen if overlay is visible

  const currentDrafter = game.players[draftingPlayerIndex];
  const hasPassed = playersPassedDraftPhase.has(draftingPlayerIndex);
  const currentPoints = currentDrafter.draftPoints;

  const handleCardClick = (index: number) => {
    if (hasPassed) return; // Don't allow drafting if passed
    const card = draftPool[index];
    if (card.cost <= currentPoints) {
      onDraftCard(index);
    }
  };

  const handlePassClick = () => {
    if (hasPassed) return; // Don't allow passing again if already passed
    onPassDraft();
  }

  return (
    <div className={`draft-pool ${hasPassed ? 'player-passed' : ''}`}>
      <div className="draft-pool-header">
        <h3>Draft Pool</h3>
        <button onClick={onHideOverlay} className="hide-button" title="Hide Draft Panel">×</button>
      </div>

      <div className="draft-points-info">
        <strong>{currentDrafter.name}'s Turn</strong><br />
        Draft Points: {currentPoints}
        {hasPassed && <span style={{color: 'red', marginLeft: '10px'}}>(Passed)</span>}
      </div>

      <button 
        className="pass-button" 
        onClick={handlePassClick} 
        disabled={hasPassed}
      >
        Pass
      </button>

      <div className="cards-container">
        {draftPool.map((card, index) => {
          const canAfford = card.cost <= currentPoints;
          const isDisabled = hasPassed || !canAfford;
          return (
            <CardComponent
              key={`draft-${card.suit}-${card.rank}-${index}`}
              card={card}
              isFaceUp={true}
              onClick={!isDisabled ? () => handleCardClick(index) : undefined}
              className={isDisabled ? 'disabled' : ''}
            >
              <div className="cost-badge">{card.cost}</div>
            </CardComponent>
          );
        })}
      </div>
    </div>
  );
};

export default DraftPool; 