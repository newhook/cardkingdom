import React from 'react';
import { Player } from '../models/Player';
import { Game, GamePhase } from '../models/Game';

interface PlayerInfoProps {
  player: Player;
  game: Game; // Pass the whole game state to check phase and current drafter
  isOpponent: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, game, isOpponent }) => {
  const { currentPhase } = game;
  const isCurrentPlayer = game.players[game.currentPlayerIndex]?.id === player.id;
  
  let isCurrentDraftingPlayer = false;
  if (currentPhase === GamePhase.DRAFT && game.draftingPlayerIndex !== -1) {
    isCurrentDraftingPlayer = game.players[game.draftingPlayerIndex]?.id === player.id;
  }

  // Use drafting player status only during draft phase for highlighting
  const isActive = currentPhase === GamePhase.DRAFT ? isCurrentDraftingPlayer : isCurrentPlayer;

  const classes = [
    'player-info',
    isOpponent ? 'opponent' : 'current-player',
    isActive ? 'active' : '',
    player.isDefeated() ? 'defeated' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="player-name">{player.name}</div>
      <div className="player-health">
        ❤️ {player.health}/{player.maxHealth}
      </div>
      {/* Show draft points during DRAFT phase */}
      {currentPhase === GamePhase.DRAFT && (
        <div className="draft-info">
          Draft Points: {player.draftPoints}
        </div>
      )}
    </div>
  );
};

export default PlayerInfo; 