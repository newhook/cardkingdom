import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Game, GamePhase, Player } from '../models/Game';
import PlayerInfo from './PlayerInfo';
import PlayerHand from './PlayerHand';
import Battlefield from './Battlefield';
import DraftPool from './DraftPool';
import BattleLog from './BattleLog';
import PhaseBanner from './PhaseBanner';

// --- ActionButtons Component (defined inline) ---
interface ActionButtonsProps {
  game: Game;
  onPrepareNextRound: () => void;
  onNewGame: () => void;
  isDraftOverlayVisible: boolean;
  onShowOverlay: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  game,
  onPrepareNextRound,
  onNewGame,
  isDraftOverlayVisible,
  onShowOverlay,
}) => {
  const renderButtons = () => {
    switch (game.currentPhase) {
      case GamePhase.DRAFT:
        if (!isDraftOverlayVisible) {
          return (
            <button className="primary-button" onClick={onShowOverlay}>
              Show Draft Panel
            </button>
          );
        }
        return (
          <div className="phase-info">
            Draft Phase: Acquire cards (Panel is Hidden)
          </div>
        );

      case GamePhase.ARRANGEMENT:
        return null;

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
// --- End ActionButtons Component ---

function GameUI() {
  // State to hold the game instance
  const [game, setGame] = useState<Game | null>(null);
  // State to force re-renders when the game state updates internally
  const [gameVersion, setGameVersion] = useState(0);
  const [isDraftOverlayVisible, setIsDraftOverlayVisible] = useState(true); // State for overlay visibility

  // --- State for Phase Banner ---
  const [bannerPhase, setBannerPhase] = useState<GamePhase | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const bannerTimeoutRef = useRef<number | null>(null); // Use number for browser timeout ID
  // --- End Banner State ---

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
    setIsDraftOverlayVisible(true); // Ensure overlay is visible on new game/init
  }, [forceUpdate]);

  useEffect(() => {
    initializeGame(); // Initial setup
    // Cleanup function remains the same
    return () => {
      game?.setUpdateCallback(null); // Use optional chaining on game
    };
    // Dependency array ensures this runs once on mount and if initializeGame changes (it shouldn't)
  }, [initializeGame]);

  // --- Effect to handle banner display on phase change ---
  useEffect(() => {
    if (!game) return;

    // Phases to announce with the banner
    const phasesToAnnounce: GamePhase[] = [
      GamePhase.DRAFT,
      GamePhase.ARRANGEMENT,
      GamePhase.BATTLE,
      GamePhase.DAMAGE,
      GamePhase.GAME_OVER,
    ];

    if (phasesToAnnounce.includes(game.currentPhase)) {
      console.log(`[GameUI] Phase changed to: ${game.currentPhase}, showing banner.`);
      setBannerPhase(game.currentPhase);
      setShowBanner(true);

      // Clear any existing timeout
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }

      // Set a timeout to hide the banner after a delay
      bannerTimeoutRef.current = setTimeout(() => {
        console.log("[GameUI] Hiding phase banner.");
        setShowBanner(false);
        bannerTimeoutRef.current = null;
      }, 2500); // Show banner for 2.5 seconds
    }

    // Cleanup timeout on component unmount or phase change before timer fires
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, [game?.currentPhase]); // Rerun when game phase changes
  // --- End Banner Effect ---

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

  // --- Callbacks for Draft Overlay Toggle ---
  const handleHideDraftOverlay = useCallback(() => {
    setIsDraftOverlayVisible(false);
  }, []);

  const handleShowDraftOverlay = useCallback(() => {
    setIsDraftOverlayVisible(true);
  }, []);
  // --- End Draft Overlay Callbacks ---

  // Render loading state or the main game UI
  if (!game) {
    return <div>Loading Game...</div>;
  }

  // --- Replace Placeholders with Actual Components Later ---
  const player = game.players[0]; // Assuming player 0 is human
  const opponent = game.players[1];

  const humanPlayerProps = {
    game,
    player,
    isHumanPlayer: true,
    onPlayCard: handlePlayCard,
    onReorderCard: handleReorderCard,
  };
  const opponentPlayerProps = {
    game,
    player: opponent,
    isHumanPlayer: false,
    onPlayCard: () => {},
    onReorderCard: () => {},
  };

  return (
    <div className={`game-container game-phase-${game.currentPhase}`}>
      {/* Render the banner */} 
      <PhaseBanner phase={bannerPhase} isVisible={showBanner} />

      {/* === Layout Order === */} 
      <PlayerInfo player={opponent} game={game} isOpponent={true} />
      <PlayerHand {...opponentPlayerProps} />
      <Battlefield {...opponentPlayerProps} />

      {/* === Divider / Ready Button Container === */} 
      <div 
        className={`divider-container ${game.currentPhase === GamePhase.ARRANGEMENT ? 'has-button' : ''}`}
      >
        <div className="section-divider"></div>
        {game.currentPhase === GamePhase.ARRANGEMENT && (
          <button 
            className="primary-button ready-battle-button" 
            onClick={handleStartBattle}
          >
            Ready for Battle
          </button>
        )}
      </div>

      {/* Player Battlefield */} 
      <Battlefield {...humanPlayerProps} />
      <PlayerHand {...humanPlayerProps} />
      <PlayerInfo player={player} game={game} isOpponent={false} />
      <ActionButtons
        game={game}
        onPrepareNextRound={handlePrepareNextRound}
        onNewGame={handleNewGame}
        isDraftOverlayVisible={isDraftOverlayVisible}
        onShowOverlay={handleShowDraftOverlay}
      />
      <BattleLog log={game.getBattleLog()} />

      {/* === Draft Pool Overlay (Conditional) === */}
      {game.currentPhase === GamePhase.DRAFT && isDraftOverlayVisible && (
        <div className="draft-overlay">
          <DraftPool
            game={game}
            onDraftCard={handleDraftCard}
            onPassDraft={handlePassDraft}
            onHideOverlay={handleHideDraftOverlay}
          />
        </div>
      )}

    </div>
  );
}

export default GameUI; 