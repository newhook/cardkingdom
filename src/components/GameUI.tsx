import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Game,
  GamePhase,
  Player,
  BattleEvent,
  Card,
  AnimationState,
} from "../models/Game";
import PlayerInfo from "./PlayerInfo";
import PlayerHand from "./PlayerHand";
import Battlefield from "./Battlefield";
import DraftPool from "./DraftPool";
import BattleLog from "./BattleLog";
import PhaseBanner from "./PhaseBanner";

function GameUI() {
  // State to hold the game instance
  const [game, setGame] = useState<Game | null>(null);
  // State to force re-renders when the game state updates internally
  const [gameVersion, setGameVersion] = useState(0);
  const [isDraftPoolVisible, setIsDraftPoolVisible] = useState(true); // NEW state for pool visibility

  // --- State for Phase Banner ---
  const [bannerPhase, setBannerPhase] = useState<GamePhase | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const bannerTimeoutRef = useRef<number | null>(null); // Use number for browser timeout ID
  // --- End Banner State ---

  // --- State for Battle Animation Replay ---
  const isAnimatingRef = useRef(false); // Use ref to track animation status
  const [animationState, setAnimationState] = useState<AnimationState | null>(
    null
  );
  const animationTimeoutRef = useRef<number | null>(null);
  // --- End Animation State ---

  // --- State for Battle Log Overlay ---
  const [showBattleLogOverlay, setShowBattleLogOverlay] = useState(false);
  // --- End Battle Log Overlay State ---

  // Callback to force component update when game state changes
  const forceUpdate = useCallback(() => {
    setGameVersion((v) => v + 1);
    console.log("[GameUI.tsx] Game state updated, triggering re-render");
  }, []);

  // Initialize or reset the game
  const initializeGame = useCallback(() => {
    console.log("[GameUI.tsx] Initializing/Resetting Game instance");
    const newGame = new Game(["Player", "Computer"]);
    newGame.setUpdateCallback(forceUpdate);
    newGame.initialize();
    setGame(newGame);
    setIsDraftPoolVisible(true); // Ensure draft pool is visible on new game/init
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
      console.log(
        `[GameUI] Phase changed to: ${game.currentPhase}, showing banner.`
      );
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
      console.log(
        "[GameUI] Phase changed to POST_BATTLE, showing Battle Log Overlay."
      );
      setShowBattleLogOverlay(true);
    } else {
      // Hide overlay when transitioning *away* from POST_BATTLE (e.g., game over)
      if (showBattleLogOverlay) {
        // Only log/set if it was previously true
        console.log(
          `[GameUI] Phase changed to ${game.currentPhase}, hiding Battle Log Overlay.`
        );
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
    if (
      game?.currentPhase === GamePhase.BATTLE &&
      game.battleLog &&
      game.battleLog.length > 0 &&
      !isAnimatingRef.current
    ) {
      console.log("[GameUI] Starting battle animation replay...");
      isAnimatingRef.current = true; // Set ref to true
      let step = 0;
      const log = game.getBattleLog(); // Get the structured log
      const stepDuration = 750; // ms between animation steps

      const processNextStep = () => {
        const event = log[step];
        if (step == log.length - 1) {
          console.log("[GameUI] Battle animation finished.");
          isAnimatingRef.current = false; // Reset ref
          setAnimationState(null); // Clear animation state
          game.applyBattleEvent(event);

          game.finishBattleAnimation(); // Signal game model to change phase
          // Note: Game state already moved to POST_BATTLE/GAMEOVER by executeBattle
          return;
        }

        console.log(`[GameUI] Animation Step ${step}:`, event);

        let nextAnimState: AnimationState | null = null;
        // Find player indices by ID, not object reference
        const attackerPlayerIndex = game.players.findIndex(
          (p) => p.id === event.attacker.id // Compare by ID
        );
        const defenderPlayerIndex = game.players.findIndex(
          (p) => p.id === event.defender.id // Compare by ID
        );

        // --- Determine Animation Type based on BattleEvent properties ---
        // Reset animation state for each step
        nextAnimState = null;

        const attackerCardIndex = event.attackerCard;
        const defenderCardIndex = event.defenderCard;
        const damageAmount = event.amount;

        if (attackerCardIndex !== null) {
          // We have an attacker card
          const attackerCard = event.attacker.battlefield[attackerCardIndex];
          if (attackerCard) {
            if (defenderCardIndex !== null) {
              // Attacker Card vs Defender Card
              const defenderCard =
                event.defender.battlefield[defenderCardIndex];
              if (defenderCard) {
                const isDefeat = defenderCard.health <= damageAmount;
                nextAnimState = {
                  attackerInfo: {
                    playerIndex: attackerPlayerIndex,
                    cardIndex: attackerCardIndex, // Safe: checked !== null
                    card: attackerCard,
                  },
                  defenderInfo: {
                    playerIndex: defenderPlayerIndex,
                    cardIndex: defenderCardIndex, // Safe: checked !== null
                    card: defenderCard,
                  },
                  damageAmount: damageAmount,
                  isDefeat: isDefeat,
                };
              } else {
                console.warn(
                  "[GameUI] Defender card data missing for attack",
                  event
                );
              }
            } else {
              // Attacker Card vs Player Direct Attack
              nextAnimState = {
                attackerInfo: {
                  playerIndex: attackerPlayerIndex,
                  cardIndex: attackerCardIndex, // Safe: checked !== null
                  card: attackerCard,
                },
                defenderInfo: {
                  // Target is the player
                  playerIndex: defenderPlayerIndex,
                  cardIndex: null,
                  card: null,
                },
                damageAmount: damageAmount,
                isDefeat: false, // Player defeat is handled by game logic/phase change
              };
            }
          } else {
            console.warn(
              "[GameUI] Attacker card data missing for attack",
              event
            );
          }
        } else {
          // Potentially other event types (e.g., effects) could be handled here
          // For now, we assume if attackerCard is null, there's no primary animation needed
          console.log(
            "[GameUI] Skipping animation step, no attacker card index.",
            event
          );
        }

        setAnimationState(nextAnimState);
        game.applyBattleEvent(event);

        step++;
        animationTimeoutRef.current = window.setTimeout(
          processNextStep,
          stepDuration
        );
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
    console.log("Passed draft turn");
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
      console.warn(
        "Attempted to prepare next round in incorrect phase or game is null:",
        game?.currentPhase
      );
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

  // --- Callbacks for Draft Pool Toggle ---
  // Split toggle into separate show/hide handlers
  const handleShowDraftPool = useCallback(() => {
    setIsDraftPoolVisible(true);
  }, []);

  const handleHideDraftPool = useCallback(() => {
    setIsDraftPoolVisible(false);
  }, []);
  // --- End Draft Pool Toggle Callbacks ---

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
    console.log(
      "[GameUI] showBattleLogOverlay state is currently:",
      showBattleLogOverlay
    );
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
      {/* Opponent Battlefield - Needs Wrapper Div */}
      <div className="battlefield-wrapper battlefield-player-1">
        <Battlefield
          {...opponentPlayerProps}
          animationState={animationState}
          playerIndex={1}
        />
      </div>

      {/* Divider / Ready Button Container */}
      <div
        className={`divider-container ${
          (game.currentPhase === GamePhase.DRAFT && !isDraftPoolVisible) || // Show divider button area if draft is hidden
          game.currentPhase === GamePhase.ARRANGEMENT ||
          game.currentPhase === GamePhase.POST_BATTLE
            ? "has-button"
            : ""
        }`}
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
        {game.currentPhase === GamePhase.POST_BATTLE && (
          <button
            className="primary-button continue-button"
            onClick={handlePrepareNextRound}
          >
            Continue
          </button>
        )}
        {game.currentPhase === GamePhase.DRAFT && !isDraftPoolVisible && (
          <button
            className="secondary-button show-draft-button"
            onClick={handleShowDraftPool}
          >
            Show Draft
          </button>
        )}
      </div>

      {/* Player Battlefield - Needs Wrapper Div */}
      <div className="battlefield-wrapper battlefield-player-0">
        <Battlefield
          {...humanPlayerProps}
          animationState={animationState}
          playerIndex={0}
        />
      </div>
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

      {/* Draft Pool Overlay - Conditionally render the entire overlay div */}
      {game.currentPhase === GamePhase.DRAFT && isDraftPoolVisible && (
        <div className="draft-overlay visible">
          {" "}
          {/* Keep visible class when rendered */}
          <DraftPool
            game={game}
            onDraftCard={handleDraftCard}
            onPassDraft={handlePassDraft}
            onHideDraftPool={handleHideDraftPool}
          />
        </div>
      )}

      {/* ADDED: Battle Log Overlay - Render conditionally */}
      {showBattleLogOverlay && (
        <div className="battle-log-overlay">
          <div className="battle-log-overlay-content">
            <button
              className="close-overlay-button"
              onClick={handleDismissBattleLog}
              aria-label="Close Battle Log"
            >
              &times;
            </button>
            <h2>Battle Results</h2>
            <BattleLog
              log={game
                .getBattleLog()
                .map((event) => event.message || `Battle Event`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GameUI;
