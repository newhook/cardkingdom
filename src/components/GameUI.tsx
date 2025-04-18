import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Game, GamePhase, Player, BattleEvent, Card, AnimationState } from '../models/Game';
import PlayerInfo from './PlayerInfo';
import PlayerHand from './PlayerHand';
import Battlefield from './Battlefield';
import DraftPool from './DraftPool';
import BattleLog from './BattleLog';
import PhaseBanner from './PhaseBanner';

// --- ActionButtons Component (defined inline) ---
interface ActionButtonsProps {
  game: Game;
  onNewGame: () => void;
  isDraftOverlayVisible: boolean;
  onShowOverlay: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  game,
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

      case GamePhase.POST_BATTLE:
        return null;

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

  // --- State for Battle Animation Replay ---
  const isAnimatingRef = useRef(false); // Use ref to track animation status
  const [animationState, setAnimationState] = useState<AnimationState | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  // --- End Animation State ---

  // --- State for Battle Log Overlay ---
  const [showBattleLogOverlay, setShowBattleLogOverlay] = useState(false);
  // --- End Battle Log Overlay State ---

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
      GamePhase.GAME_OVER,
    ];

    // Show phase banner for specific phases
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

    // Show Battle Log Overlay specifically for POST_BATTLE
    if (game.currentPhase === GamePhase.POST_BATTLE) {
      console.log("[GameUI] Phase changed to POST_BATTLE, showing Battle Log Overlay.");
      setShowBattleLogOverlay(true);
    } else {
      // Hide overlay when transitioning *away* from POST_BATTLE (e.g., game over)
      if (showBattleLogOverlay) { // Only log/set if it was previously true
        console.log(`[GameUI] Phase changed to ${game.currentPhase}, hiding Battle Log Overlay.`);
        setShowBattleLogOverlay(false);
      }
    }

    // Cleanup timeout on component unmount or phase change before timer fires
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, [game?.currentPhase]); // Rerun when game phase changes
  // --- End Banner Effect ---

  // Clear animation state when not in battle phase
  useEffect(() => {
    if (game?.currentPhase !== GamePhase.BATTLE) {
      isAnimatingRef.current = false; // Reset ref if phase changes away
      setAnimationState(null);
      if (animationTimeoutRef.current) {
         clearTimeout(animationTimeoutRef.current);
         animationTimeoutRef.current = null;
      }
    }
  }, [game?.currentPhase]);

  // --- Effect to run battle animation replay ---
  useEffect(() => {
    if (game?.currentPhase === GamePhase.BATTLE && game.battleLog && game.battleLog.length > 0 && !isAnimatingRef.current) {
      console.log("[GameUI] Starting battle animation replay...");
      isAnimatingRef.current = true; // Set ref to true
      let step = 0;
      const log = game.getBattleLog(); // Get the structured log
      const stepDuration = 750; // ms between animation steps

      const processNextStep = () => {
        if (step >= log.length) {
          console.log("[GameUI] Battle animation finished.");
          isAnimatingRef.current = false; // Reset ref
          setAnimationState(null); // Clear animation state
          
          // --- Call game logic to finalize the battle state ---
          if (game) {
             game.finishBattleAnimation(); // Signal game model to change phase
          }
          // --- End call ---

          // Note: Game state already moved to DAMAGE/GAMEOVER by executeBattle
          return;
        }

        const event = log[step];
        console.log(`[GameUI] Animation Step ${step}:`, event);

        let nextAnimState: AnimationState | null = null;

        switch(event.type) {
            case 'attack':
                const attackerCardIndex = game.players[event.attacker!.playerIndex].battlefield.findIndex(c => c === event.attacker!.card);
                const defenderCardIndex = event.defender?.card ? game.players[event.defender!.playerIndex].battlefield.findIndex(c => c === event.defender!.card) : null;
                
                // Ensure attacker card exists before setting attackerInfo
                const validAttackerInfo = event.attacker?.card && attackerCardIndex !== -1 
                    ? { ...event.attacker, card: event.attacker.card, cardIndex: attackerCardIndex } 
                    : null;

                nextAnimState = {
                    attackerInfo: validAttackerInfo, // Use validated info
                    defenderInfo: event.defender ? { ...event.defender, cardIndex: defenderCardIndex } : {playerIndex: -1, cardIndex: null, card: null},
                    damageAmount: null,
                    isDefeat: false,
                };
                break;
            case 'damage':
            case 'defeat':
                 // We mainly use the message from the log now, but could highlight defender
                 const currentDefenderCardIndex = event.defender?.card ? game.players[event.defender!.playerIndex].battlefield.findIndex(c => c === event.defender!.card) : null;
                 nextAnimState = {
                     attackerInfo: null, // Or carry over from previous attack?
                     defenderInfo: event.defender ? { ...event.defender, cardIndex: currentDefenderCardIndex } : {playerIndex: -1, cardIndex: null, card: null}, // Provide default if null
                     damageAmount: event.amount ?? null,
                     isDefeat: event.type === 'defeat',
                 };
                 break;
            // Ignore 'round' and 'info' for direct animation state for now
        }
        
        setAnimationState(nextAnimState);

        step++;
        animationTimeoutRef.current = window.setTimeout(processNextStep, stepDuration);
      };

      // Start the animation loop
      processNextStep();

      // Cleanup function
      return () => {
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
          animationTimeoutRef.current = null;
        }
        isAnimatingRef.current = false; // Ensure ref is reset on cleanup
        setAnimationState(null);
      };
    }
  }, [game?.currentPhase, game?.battleLog]); // Dependencies for starting/controlling animation

  // Callback for handling playing a card from hand
  const handlePlayCard = useCallback(
    (handIndex: number, targetPosition: number) => {
      if (!game || game.currentPhase !== GamePhase.ARRANGEMENT) return;
      const player = game.players[0]; // Assuming player 0 is human
      
      // --- Check battlefield limit --- 
      if (player.battlefield.length >= 7) {
          console.log("Cannot place card: Battlefield full (Max 7).");
          // Optionally provide user feedback (e.g., toast notification)
          return; // Stop execution
      }

      // Proceed to play card if limit not reached
      player.playCard(handIndex, targetPosition);
      forceUpdate();
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
    if (!game || game.currentPhase !== GamePhase.POST_BATTLE) {
      console.warn("Attempted to prepare next round in incorrect phase or game is null:", game?.currentPhase);
      return;
    }
    console.log("GameUI: Preparing next round (hiding overlay)..."); // Log added here
    setShowBattleLogOverlay(false); // Hide the log overlay
    game.prepareNextRound();
  }, [game]);

  const handleNewGame = useCallback(() => {
    console.log("Starting new game...");
    initializeGame();
  }, [initializeGame]);

  // --- Callbacks for Draft Overlay Toggle ---
  const handleHideDraftOverlay = useCallback(() => {
    setIsDraftOverlayVisible(false);
  }, []);

  const handleShowDraftOverlay = useCallback(() => {
    setIsDraftOverlayVisible(true);
  }, []);
  // --- End Draft Overlay Callbacks ---

  // --- Add Callback for Selling Card ---
  const handleSellCard = useCallback(
      (playerIndex: number, battlefieldIndex: number) => {
          if (!game || game.currentPhase !== GamePhase.ARRANGEMENT) return;
          // Only allow human player (index 0) to sell for now
          if (playerIndex !== 0) {
              console.warn("Tried to sell card for non-human player.");
              return;
          }
          const player = game.players[playerIndex];
          const success = player.sellCardFromBattlefield(battlefieldIndex);
          if (success) {
              forceUpdate(); // Update UI after selling
          }
      },
      [game, forceUpdate]
  );
  // --- End Sell Card Callback ---

  // Add a log to see when the overlay component itself renders
  useEffect(() => {
    console.log('[GameUI] showBattleLogOverlay state is currently:', showBattleLogOverlay);
  }, [showBattleLogOverlay]);

  // --- Add Callback for Dismissing Battle Log --- 
  const handleDismissBattleLog = useCallback(() => {
    console.log("[GameUI] Dismissing Battle Log Overlay manually.");
    setShowBattleLogOverlay(false);
  }, []);
  // --- End Dismiss Callback ---

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
    onSellCard: (index: number) => handleSellCard(0, index), // Pass seller callback for human
  };
  const opponentPlayerProps = {
    game,
    player: opponent,
    isHumanPlayer: false,
    onPlayCard: () => {},
    onReorderCard: () => {},
    onSellCard: () => {}, // No selling for opponent
  };

  const renderDividerContent = () => {
    switch (game.currentPhase) {
      case GamePhase.ARRANGEMENT:
        return (
          <div className="phase-info">
            Arrange your lanes!
          </div>
        );
      case GamePhase.BATTLE:
        return <div className="phase-info">Battle in Progress...</div>;
      case GamePhase.POST_BATTLE:
        return (
            <button className="primary-button" onClick={handlePrepareNextRound}>
              Continue
            </button>
        );
      case GamePhase.DRAFT:
      case GamePhase.GAME_OVER:
      default:
        return null; // No specific content for these phases in the divider
    }
  };

  return (
    <div className={`game-container game-phase-${game.currentPhase}`}>
      <PhaseBanner phase={bannerPhase} isVisible={showBanner} />

      {/* Opponent Info */}
      <PlayerInfo 
        player={opponent} 
        game={game} 
        isOpponent={true} 
        animationState={animationState}
        playerIndex={1}
      />
      {/* Opponent Hand */}
      <PlayerHand {...opponentPlayerProps} /> 
      {/* Opponent Battlefield - Pass dummy sell handler */}
      <Battlefield 
        {...opponentPlayerProps} 
        animationState={animationState}
        playerIndex={1}
      />

      {/* Divider / Ready Button Container */}
      <div className={`divider-container ${game.currentPhase === GamePhase.ARRANGEMENT || game.currentPhase === GamePhase.POST_BATTLE ? 'has-button' : ''}`}>
        <div className="section-divider"></div>
        {game.currentPhase === GamePhase.ARRANGEMENT && (
          <button className="primary-button ready-battle-button" onClick={handleStartBattle}>
            Ready for Battle
          </button>
        )}
        {game.currentPhase === GamePhase.POST_BATTLE && (
            <button className="primary-button continue-button" onClick={handlePrepareNextRound}>
              Continue
            </button>
        )}
      </div>

      {/* Player Battlefield - Pass real sell handler */}
      <Battlefield 
        {...humanPlayerProps} 
        animationState={animationState}
        playerIndex={0}
      />
      {/* Player Hand */}
      <PlayerHand {...humanPlayerProps} />
      {/* Player Info */}
      <PlayerInfo 
        player={player} 
        game={game} 
        isOpponent={false} 
        animationState={animationState}
        playerIndex={0}
      />
      {/* Action Buttons */}
      <ActionButtons
        game={game}
        onNewGame={handleNewGame}
        isDraftOverlayVisible={isDraftOverlayVisible}
        onShowOverlay={handleShowDraftOverlay}
      />
      {/* REMOVED Battle Log from here */}
      {/* <BattleLog log={game.getBattleLog().map(event => event.message || `Event: ${event.type}`)} /> */}

      {/* Draft Pool Overlay */}
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

      {/* ADDED: Battle Log Overlay - Render conditionally */} 
      {showBattleLogOverlay && (
        <div className="battle-log-overlay">
          <div className="battle-log-overlay-content">
            {/* ADDED: Close button for the overlay */}
            <button 
              className="close-overlay-button" 
              onClick={handleDismissBattleLog}
              aria-label="Close Battle Log"
            >
              &times; {/* Creates a visual 'X' */}
            </button>
            <h2>Battle Results</h2>
            <BattleLog log={game.getBattleLog().map(event => event.message || `Event: ${event.type}`)} />
            {/* The existing central "Continue" button will dismiss this AND advance the game */}
          </div>
        </div>
      )}

      {/* REMOVED: Lower divider container as content moved */}
      {/* <div className="divider-container">
          {renderDividerContent()}
      </div> */}
    </div>
  );
}

export default GameUI;