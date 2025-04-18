import React from 'react';
import { Player } from '../models/Player';
import { Game, GamePhase } from '../models/Game';

interface PlayerInfoProps {
  player: Player;
  game: Game; // Pass the whole game state to check phase and current drafter
  isOpponent: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, game, isOpponent }) => {
  const { currentPhase, turnNumber, currentDraftPoints } = game;
  const isCurrentPlayer = game.players[game.currentPlayerIndex]?.id === player.id;

  let isDraftingPlayer = false;
  if (currentPhase === GamePhase.DRAFT) {
    const currentDraftingPlayer = game.getCurrentDraftingPlayer();
    isDraftingPlayer = currentDraftingPlayer?.id === player.id;
  }

  const isActive = currentPhase === GamePhase.DRAFT ? isDraftingPlayer : isCurrentPlayer;

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
      {isDraftingPlayer && (
        <div className="draft-info">
          Turn {turnNumber} - Draft Points: {currentDraftPoints}
        </div>
      )}
    </div>
  );
};

export default PlayerInfo; 