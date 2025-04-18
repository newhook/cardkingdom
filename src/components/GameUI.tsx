import React, { useState, useEffect, useCallback } from 'react';
import { Game, GamePhase, Player } from '../models/Game';
import PlayerInfo from './PlayerInfo';
import PlayerHand from './PlayerHand';
import Battlefield from './Battlefield';
import DraftPool from './DraftPool';
import BattleLog from './BattleLog';
import ActionButtons from './ActionButtons';

// Placeholder for child components - we will create these later
// const PlayerInfoPlaceholder = ({ player }: { player: Player }) => <div>{player.name} Info</div>;
// const DraftPoolPlaceholder = ({ game }: { game: Game }) => <div>Draft Pool</div>;
// const PlayerHandPlaceholder = ({ player }: { player: Player }) => <div>{player.name} Hand</div>;
// const BattlefieldPlaceholder = ({ player }: { player: Player }) => <div>{player.name} Battlefield</div>;
// const ActionButtonsPlaceholder = ({ game }: { game: Game }) => <div>Action Buttons</div>;

function GameUI() {
  // State to hold the game instance
  const [game, setGame] = useState<Game | null>(null);
  // State to force re-renders when the game state updates internally
  const [gameVersion, setGameVersion] = useState(0);

  // Callback to force component update when game state changes
  const forceUpdate = useCallback(() => {
    setGameVersion((v) => v + 1);
    console.log('[GameUI.tsx] Game state updated, triggering re-render');
  }, []);

  // Initialize or reset the game
  const initializeGame = useCallback(() => {
    console.log('[GameUI.tsx] Initializing/Resetting Game instance');
    const newGame = new Game(["Player", "Computer"]);
    newGame.setUpdateCallback(forceUpdate);
    newGame.initialize();
    setGame(newGame);
  }, [forceUpdate]);

  useEffect(() => {
    initializeGame(); // Initial setup
    // Cleanup function remains the same
    return () => {
      game?.setUpdateCallback(null); // Use optional chaining on game
    };
    // Dependency array ensures this runs once on mount and if initializeGame changes (it shouldn't)
  }, [initializeGame]);

  // Callback for handling playing a card from hand
  const handlePlayCard = useCallback(
    (handIndex: number, targetPosition: number) => {
      if (!game || game.currentPhase !== GamePhase.ARRANGEMENT) return;
      const player = game.players[0]; // Assuming player 0 is human
      player.playCard(handIndex, targetPosition);
      forceUpdate(); // Trigger re-render after state change
    },
    [game, forceUpdate]
  );

  // Callback for handling reordering cards on the battlefield
  const handleReorderCard = useCallback(
    (startIndex: number, targetIndex: number) => {
      if (!game || game.currentPhase !== GamePhase.ARRANGEMENT) return;
      const player = game.players[0];
      // Reorder using splice as Player model has no dedicated method
      console.log(`Reordering card from ${startIndex} to ${targetIndex}`);
      const card = player.battlefield.splice(startIndex, 1)[0];
      if (card) {
        player.battlefield.splice(targetIndex, 0, card);
      }
      forceUpdate();
    },
    [game, forceUpdate]
  );

  // Callback for handling drafting a card
  const handleDraftCard = useCallback(
    (index: number) => {
      if (!game || game.currentPhase !== GamePhase.DRAFT) return;
      const success = game.draftCard(index);
      if (success) {
        console.log(`Drafted card at index ${index}`);
        forceUpdate(); // Trigger re-render after state change
      }
    },
    [game, forceUpdate]
  );

  // Callback for handling passing the draft turn
  const handlePassDraft = useCallback(() => {
    if (!game || game.currentPhase !== GamePhase.DRAFT) return;
    game.passDraft();
    console.log('Passed draft turn');
    forceUpdate(); // Trigger re-render after state change
  }, [game, forceUpdate]);

  // --- Add Callbacks for Action Buttons ---
  const handleStartBattle = useCallback(() => {
    if (!game || game.currentPhase !== GamePhase.ARRANGEMENT) return;
    game.startBattle();
    forceUpdate();
  }, [game, forceUpdate]);

  const handlePrepareNextRound = useCallback(() => {
    if (!game || game.currentPhase !== GamePhase.DAMAGE) return;
    game.prepareNextRound();
    forceUpdate();
  }, [game, forceUpdate]);

  const handleNewGame = useCallback(() => {
    initializeGame(); // Reuse the initialization logic
  }, [initializeGame]);
  // --- End Action Button Callbacks ---

  // Render loading state or the main game UI
  if (!game) {
    return <div>Loading Game...</div>;
  }

  // --- Replace Placeholders with Actual Components Later ---
  const player = game.players[0]; // Assuming player 0 is human
  const opponent = game.players[1];

  const humanBattlefieldProps = {
    game,
    player,
    isHumanPlayer: true,
    onPlayCard: handlePlayCard,
    onReorderCard: handleReorderCard,
  };
  const opponentBattlefieldProps = {
      game,
      player: opponent,
      isHumanPlayer: false,
      onPlayCard: () => {},
      onReorderCard: () => {},
  };

  return (
    <div className={`game-container game-phase-${game.currentPhase}`}>
      <div className="player-area opponent-area">
        <PlayerInfo player={opponent} game={game} isOpponent={true} />
        <Battlefield {...opponentBattlefieldProps} />
        <PlayerHand player={opponent} game={game} isHumanPlayer={false} onPlayCard={() => {}} />
      </div>

      <div className="middle-area">
        {game.currentPhase === GamePhase.DRAFT && (
          <DraftPool
            game={game}
            onDraftCard={handleDraftCard}
            onPassDraft={handlePassDraft}
          />
        )}
      </div>

      <div className="player-area current-player-area">
        <PlayerHand player={player} game={game} isHumanPlayer={true} onPlayCard={handlePlayCard} />
        <Battlefield {...humanBattlefieldProps} />
        <PlayerInfo player={player} game={game} isOpponent={false} />
      </div>

      <ActionButtons
        game={game}
        onStartBattle={handleStartBattle}
        onPrepareNextRound={handlePrepareNextRound}
        onNewGame={handleNewGame}
      />
      <BattleLog log={game.getBattleLog()} />
    </div>
  );
}

export default GameUI; 