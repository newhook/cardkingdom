import { Card } from "./Card";
import { Deck } from "./Deck";
import { Player } from "./Player";

export { Player, Card };

// --- Shared Types ---
export interface BattleEvent {
  type: 'attack' | 'damage' | 'defeat' | 'info' | 'round';
  attacker?: { playerIndex: number; card: Card | null; cardIndex?: number };
  defender?: { playerIndex: number; card: Card | null; cardIndex?: number | null };
  amount?: number;
  message?: string;
}

// Define and export AnimationState structure here
export interface AnimationState {
  attackerInfo: { playerIndex: number; cardIndex: number; card: Card } | null;
  defenderInfo: { playerIndex: number; cardIndex: number | null; card: Card | null } | null; // Allow null defenderInfo
  damageAmount: number | null;
  isDefeat: boolean;
}
// --- End Shared Types ---

export enum GamePhase {
  SETUP = "setup",
  DRAFT = "draft",
  ARRANGEMENT = "arrangement",
  BATTLE = "battle",
  GAME_OVER = "game_over",
}

export interface BattleResult {
  winnerId: string | null;
  damageTaken: Map<string, number>;
  battleLog: string[];
}

// Add a callback type for UI updates
export type GameUpdateCallback = () => void;

export class Game {
  players: Player[];
  deck: Deck;
  draftPool: Card[];
  currentPlayerIndex: number;
  currentPhase: GamePhase;
  turnNumber: number;
  roundNumber: number;
  battleLog: BattleEvent[]; // Changed from string[]
  currentDraftPoints: number;
  draftingOrder: number[]; // Track the order of players for drafting
  draftingPlayerIndex: number; // Index within draftingOrder array
  playersPassedDraftPhase: Set<number>; // Track who passed THIS phase
  isComputerDrafting: boolean; // Flag to control AI drafting behavior
  updateCallback: GameUpdateCallback | null; // Callback to notify UI of updates
  passedPlayerIndices: Set<number>; // Track players who passed in the current round
  draftingOrderPosition: number; // Index within draftingOrder array

  constructor(playerNames: string[] = ["Player 1", "Player 2"]) {
    this.players = playerNames.map(
      (name, index) => new Player(index.toString(), name)
    );
    this.deck = new Deck(true); // Include jokers
    this.draftPool = [];
    this.currentPlayerIndex = 0; // Used for battle/arrangement phases
    this.draftingPlayerIndex = -1; // Actual player index (0 or 1)
    this.draftingOrder = []; // Order of player indices
    this.draftingOrderPosition = -1; // Position in the order array
    this.currentPhase = GamePhase.SETUP;
    this.turnNumber = 1;
    this.roundNumber = 1;
    this.battleLog = []; // Initialize as empty array of BattleEvents
    this.currentDraftPoints = 2; // Start with 2 drafting points on Turn 1
    this.playersPassedDraftPhase = new Set();
    this.isComputerDrafting = false;
    this.updateCallback = null;
    this.passedPlayerIndices = new Set(); // Initialize pass tracker
  }

  // Set a callback function that will be called when the game state changes
  setUpdateCallback(callback: GameUpdateCallback | null): void {
    this.updateCallback = callback;
  }

  // Notify the UI that the game state has changed
  notifyUpdate(): void {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  // Initialize the game (Correctly sets 2 points for Round 1)
  initialize(): void {
    console.log("--- Initializing Game ---");
    this.deck.shuffle();
    this.currentPhase = GamePhase.DRAFT;

    this.roundNumber = 1;
    this.playersPassedDraftPhase.clear();
    this.players.forEach(player => {
      player.draftPoints = 2; // Start with 2 points on Round 1
      console.log(`Assigned ${player.draftPoints} draft points to ${player.name} for initial draft.`);
    });

    this.determineDraftingOrder(); // Sets draftingOrder
    this.draftingOrderPosition = -1; // Reset order position before starting
    this.refillDraftPool();
    this.switchToNextEligibleDrafter(); // Start the process
  }

  // Check if it's the computer's turn to draft and trigger AI drafting
  checkAndTriggerComputerDraft(): void {
    if (this.currentPhase !== GamePhase.DRAFT || this.draftingPlayerIndex === -1) return;
    if (this.isComputerDrafting) return;

    const currentDraftingPlayer = this.players[this.draftingPlayerIndex];
    const isComputerTurn = currentDraftingPlayer.id === "1"; // Player with ID "1" is the computer

    if (isComputerTurn) {
      this.isComputerDrafting = true;
      console.log("Computer is drafting now...");

      // Make the computer's move with a slight delay to make it visible to the user
      setTimeout(() => {
        this.computerDraft();
        this.isComputerDrafting = false;
        this.notifyUpdate(); // Update the UI after computer's move
      }, 1000);
    }
  }

  // Computer AI drafting logic - Needs update to use player points
  computerDraft(): void {
    if (this.draftingPlayerIndex === -1) return; // Should not happen
    const computerPlayer = this.players[this.draftingPlayerIndex];

    console.log(`${computerPlayer.name} (AI) drafting started. Points: ${computerPlayer.draftPoints}`);

    let draftedThisTurn = false;
    // Continue drafting while AI has points and there are cards
    while (computerPlayer.draftPoints >= 2 && this.draftPool.length > 0) {
      // Simple AI strategy: pick the highest strength card it can afford
      let bestCardIndex = -1;
      let bestCardStrength = -1; // Use -1 to ensure any card is initially better

      for (let i = 0; i < this.draftPool.length; i++) {
        const card = this.draftPool[i];
        // Basic check: can afford and is stronger than current best
        if (card.cost <= computerPlayer.draftPoints && card.strength > bestCardStrength) {
          bestCardStrength = card.strength;
          bestCardIndex = i;
        }
      }

      if (bestCardIndex !== -1) {
        console.log(
          `${computerPlayer.name} (AI) selecting card at index ${bestCardIndex} with strength ${bestCardStrength}`
        );
        const success = this.draftCard(bestCardIndex); // Draft the card
        if (success) {
           draftedThisTurn = true;
        } else {
           console.error("AI draft failed unexpectedly.");
           break; // Stop if drafting failed somehow
        }
      } else {
        // No affordable card found or no card meets criteria
        console.log(`${computerPlayer.name} (AI) found no suitable card to draft.`);
        break; // Stop drafting loop
      }
    }

    // AI passes its turn if it didn't draft or ran out of points/options
    console.log(`${computerPlayer.name} (AI) passing draft phase.`);
    this.passDraft(); // Pass to lock the AI out and trigger next player check
  }

  // Determine drafting order based on player health
  private determineDraftingOrder(): void {
    this.draftingOrder = [];

    if (this.turnNumber === 1) {
      // For turn 1, randomly choose the first player
      const firstPlayerIndex = Math.floor(Math.random() * this.players.length);

      // Set the drafting order starting with the randomly chosen player
      let nextIndex = firstPlayerIndex;
      for (let i = 0; i < this.players.length; i++) {
        this.draftingOrder.push(nextIndex);
        nextIndex = (nextIndex + 1) % this.players.length;
      }
    } else {
      // Sort players by health (least health goes first)
      const playerIndicesWithHealth = this.players.map((player, index) => ({
        index,
        health: player.health,
      }));

      // Sort by health ascending (lowest health first)
      playerIndicesWithHealth.sort((a, b) => a.health - b.health);

      // Extract just the indices for the drafting order
      this.draftingOrder = playerIndicesWithHealth.map((p) => p.index);
    }

    // Reset drafting player index to the beginning of the order
    this.draftingPlayerIndex = 0;
  }

  // Get the current player for drafting
  getCurrentDraftingPlayer(): Player | null {
    if (this.draftingPlayerIndex === -1 || this.currentPhase !== GamePhase.DRAFT) {
        return null; // No one is drafting or not in draft phase
    }
    return this.players[this.draftingPlayerIndex];
  }

  // Get the current player (used for battle/arrangement phases)
  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  // Get the current drafting points
  getCurrentDraftPoints(): number {
    return this.currentDraftPoints;
  }

  // Move to the next player in the drafting sequence and check for phase end
  nextDraftingPlayer(): void {
    this.draftingPlayerIndex++;

    // --- Check if a full round of drafting completed --- 
    if (this.draftingPlayerIndex >= this.draftingOrder.length) {
      // --- Round finished. Check if ALL players passed this round --- 
      if (this.passedPlayerIndices.size === this.players.length) {
        // All players passed consecutively -> End Draft Phase
        console.log(
          "[Game.ts] All players passed consecutively. Setting phase to ARRANGEMENT."
        );
        this.currentPhase = GamePhase.ARRANGEMENT;
        this.arrangeBattlefieldForComputer(); // Computer places its cards
        this.passedPlayerIndices.clear(); // Clear pass status for the next phase
        this.notifyUpdate();
        return; // Exit here, phase changed.
      } else {
        // Round finished, but not everyone passed. Start a new turn.
        this.turnNumber++;
        this.draftingPlayerIndex = 0;
        this.passedPlayerIndices.clear(); // Reset pass status for the new turn

        // Determine new drafting order based on player health
        this.determineDraftingOrder();

        // Refill draft pool and set new draft points
        this.refillDraftPool();
        this.currentDraftPoints = 2 + (this.turnNumber - 1); // Points increase each turn

        // Notify UI and check for computer turn
        console.log(`[Game.ts] Starting Turn ${this.turnNumber}`);
        this.notifyUpdate();
        setTimeout(() => this.checkAndTriggerComputerDraft(), 500); // Check if AI drafts first
        return; // Exit after starting new turn setup
      }
    }

    // --- Round NOT complete, move to next player in the current turn --- 
    console.log(
      `[Game.ts] Moving to next drafter (index in order: ${this.draftingPlayerIndex})`
    );
    // Check if it's the computer's turn to draft for the next turn
    this.notifyUpdate(); // Update UI for the next player's turn
    setTimeout(() => this.checkAndTriggerComputerDraft(), 500);
  }

  // Arrange battlefield cards for computer player
  arrangeBattlefieldForComputer(): void {
    // Get computer player (id: "1")
    const computerPlayer = this.players.find((player) => player.id === "1");
    if (!computerPlayer) return;

    // Move all cards from hand to battlefield
    while (computerPlayer.hand.length > 0) {
      computerPlayer.playCard(0, computerPlayer.battlefield.length);
    }
  }

  // Refill the draft pool with cards
  refillDraftPool(): void {
    const cardsToAdd = 5; // Number of cards to add to the pool
    if (this.draftPool.length < cardsToAdd) {
      const newCards = this.deck.drawMultiple(
        cardsToAdd - this.draftPool.length
      );
      this.draftPool.push(...newCards);
    }
  }

  // Draft a card from the draft pool
  draftCard(poolIndex: number): boolean {
    if (this.currentPhase !== GamePhase.DRAFT || this.draftingPlayerIndex === -1) return false;

    const currentDrafter = this.players[this.draftingPlayerIndex];
    if (!currentDrafter || this.playersPassedDraftPhase.has(this.draftingPlayerIndex)) {
      console.error("Attempted to draft for player who has passed or doesn't exist.");
      return false; // Player already passed or is invalid
    }

    if (poolIndex < 0 || poolIndex >= this.draftPool.length) return false;

    const card = this.draftPool[poolIndex];
    const cardCost = 2;

    if (cardCost > currentDrafter.draftPoints) {
      console.log(`${currentDrafter.name} cannot afford card (Cost: ${cardCost}, Points: ${currentDrafter.draftPoints})`);
      return false; // Not enough points
    }

    const draftedCard = this.draftPool.splice(poolIndex, 1)[0];
    currentDrafter.addCardToHand(draftedCard);
    currentDrafter.draftPoints -= cardCost;
    console.log(`${currentDrafter.name} drafted ${draftedCard.getDisplayName()}. Points remaining: ${currentDrafter.draftPoints}`);

    // If player runs out of points, automatically try to switch
    if (currentDrafter.draftPoints < cardCost) {
      console.log(`${currentDrafter.name} has insufficient points for next draft.`);
      this.switchToNextEligibleDrafter();
    } else {
      // Player still has points, update UI but stay on their turn
      this.notifyUpdate();
      // Re-check if computer should draft (if it's AI's turn)
      setTimeout(() => this.checkAndTriggerComputerDraft(), 500);
    }
    return true;
  }

  // Pass the current draft turn
  passDraft(): void {
    if (this.currentPhase === GamePhase.DRAFT && this.draftingPlayerIndex !== -1) {
      if (!this.playersPassedDraftPhase.has(this.draftingPlayerIndex)){
        console.log(`Player ${this.players[this.draftingPlayerIndex].name} (Index: ${this.draftingPlayerIndex}) passed the draft phase.`);
        this.playersPassedDraftPhase.add(this.draftingPlayerIndex);
      }
      this.switchToNextEligibleDrafter(); // Find next eligible player or end phase
    }
  }

  // New method to find the next player eligible to draft or end the phase
  switchToNextEligibleDrafter(): void {
    if (this.currentPhase !== GamePhase.DRAFT || this.draftingOrder.length === 0) return;

    console.log("Switching to next eligible drafter based on order:", this.draftingOrder);
    const numPlayers = this.players.length;

    // Loop through the DRAFTING ORDER, starting from the next position
    for (let i = 0; i < numPlayers; i++) {
      // Calculate the next position in the draftingOrder array, wrapping around
      this.draftingOrderPosition = (this.draftingOrderPosition + 1) % numPlayers;
      const playerIndexToCheck = this.draftingOrder[this.draftingOrderPosition]; // Get player index from order
      const playerToCheck = this.players[playerIndexToCheck];
      const hasPassed = this.playersPassedDraftPhase.has(playerIndexToCheck);
      const hasPoints = playerToCheck.draftPoints >= 2; // Assuming card cost is 2

      console.log(
        `Checking pos ${this.draftingOrderPosition} -> player ${playerIndexToCheck} (${playerToCheck.name}): Passed=${hasPassed}, HasPoints=${hasPoints}`
      );

      if (!hasPassed && hasPoints) {
        // Found the next eligible player
        console.log(`Next drafter is ${playerToCheck.name} (Index: ${playerIndexToCheck})`);
        this.draftingPlayerIndex = playerIndexToCheck; // Set the actual drafting player index
        this.notifyUpdate();
        setTimeout(() => this.checkAndTriggerComputerDraft(), 500);
        return; // Exit function, new drafter found
      }
      // If player not eligible, loop continues to check the next in draftingOrder
    }

    // --- If loop completes, no eligible player was found in the order --- 
    console.log(
      "No eligible players remaining in drafting order. Ending Draft Phase."
    );
    this.currentPhase = GamePhase.ARRANGEMENT;
    this.draftingPlayerIndex = -1; // No one is drafting
    this.draftingOrderPosition = -1;
    this.arrangeBattlefieldForComputer();
    this.notifyUpdate();
  }

  // Check if draft phase should end (REMOVED - Logic moved to nextDraftingPlayer)
  // shouldEndDraftPhase(): boolean {
  //   return this.turnNumber > 3 || this.deck.isEmpty();
  // }

  // Start the battle phase
  startBattle(): void {
    if (this.currentPhase !== GamePhase.ARRANGEMENT) return;

    this.currentPhase = GamePhase.BATTLE;
    this.battleLog = [];

    // Execute battle logic
    this.executeBattle();
  }

  // Corrected executeBattle for new rules (sequential attack per card)
  executeBattle(): void {
    this.battleLog = [];
    const damageTaken = new Map<string, number>();
    this.players.forEach(player => damageTaken.set(player.id, 0));

    // Create initial snapshots of battlefields to determine attack order
    const initialBattlefields = this.players.map(p => [...p.battlefield]);
    console.log("Initial Battlefields:", initialBattlefields.map(bf => bf.map(c => c.getDisplayName())));

    this.battleLog.push({ type: 'info', message: `Battle Starts!` });

    // Loop through each player (Player 0 then Player 1)
    for (let attackerPlayerIndex = 0; attackerPlayerIndex < this.players.length; attackerPlayerIndex++) {
      const defenderPlayerIndex = (attackerPlayerIndex + 1) % this.players.length;
      const attacker = this.players[attackerPlayerIndex];
      const defender = this.players[defenderPlayerIndex];
      const initialAttackerBattlefield = initialBattlefields[attackerPlayerIndex];

      console.log(`-- ${attacker.name}'s Turn to Attack --`);

      // Loop through the attacker's *initial* battlefield sequence
      for (let cardIndex = 0; cardIndex < initialAttackerBattlefield.length; cardIndex++) {
        const initialAttackingCard = initialAttackerBattlefield[cardIndex];

        // Find the current state of this attacking card on the *real* battlefield
        // It might have been defeated before its turn!
        const currentAttackerCard = attacker.battlefield.find(c => c === initialAttackingCard);
        
        if (!currentAttackerCard) {
           console.log(`   ${initialAttackingCard.getDisplayName()} already defeated, skipping attack.`);
           this.battleLog.push({ type: 'info', message: `${attacker.name}'s ${initialAttackingCard.getDisplayName()} was already defeated.` });
           continue; // Skip attack if card is gone
        }

        console.log(`   Attacking with: ${currentAttackerCard.getDisplayName()}`);
        const attackEventBase = { attacker: { playerIndex: attackerPlayerIndex, card: currentAttackerCard, cardIndex } }; // cardIndex relates to initial position

        // Check defender's *current* battlefield
        if (defender.battlefield.length > 0) {
          // Target the first card on the defender's current battlefield
          const defendingCard = defender.battlefield[0];
          const defendingCardIndex = 0; // Always target the first live card
          const damage = currentAttackerCard.attack(defendingCard);

          this.battleLog.push({ 
              type: 'attack', 
              ...attackEventBase,
              defender: { playerIndex: defenderPlayerIndex, card: defendingCard, cardIndex: defendingCardIndex } // Index 0 on real battlefield
          });
          this.battleLog.push({ 
              type: 'damage', 
              attacker: attackEventBase.attacker,
              defender: { playerIndex: defenderPlayerIndex, card: defendingCard, cardIndex: defendingCardIndex },
              amount: damage, 
              message: `${attacker.name}'s ${currentAttackerCard.getDisplayName()} damages ${defender.name}'s ${defendingCard.getDisplayName()} for ${damage}`
           });

          defendingCard.health -= damage;

          if (defendingCard.health <= 0) {
            console.log(`      -> ${defendingCard.getDisplayName()} defeated!`);
            this.battleLog.push({ 
                type: 'defeat', 
                attacker: attackEventBase.attacker,
                defender: { playerIndex: defenderPlayerIndex, card: defendingCard, cardIndex: defendingCardIndex },
                message: `${defender.name}'s ${defendingCard.getDisplayName()} is defeated!`
            });
            defender.removeFromBattlefield(0); // Remove from the front
          }
        } else {
          // Target the player directly
          const damage = currentAttackerCard.strength;
          damageTaken.set(defender.id, (damageTaken.get(defender.id) || 0) + damage);
          console.log(`      -> Attacking ${defender.name} directly for ${damage}`);

           this.battleLog.push({ 
               type: 'attack',
               ...attackEventBase,
               defender: { playerIndex: defenderPlayerIndex, card: null, cardIndex: null } // Target player
           });
          this.battleLog.push({ 
              type: 'damage',
              attacker: attackEventBase.attacker,
              defender: { playerIndex: defenderPlayerIndex, card: null, cardIndex: null },
              amount: damage, 
              message: `${attacker.name}'s ${currentAttackerCard.getDisplayName()} attacks ${defender.name} directly for ${damage}`
           });
        }
        // Brief pause in log generation - UI animation handles visual delay
      } // End loop through attacker's cards
    } // End loop through players

    // Apply cumulative direct player damage *after* all card attacks
    this.applyDamageToPlayers(damageTaken);

    // Battle phase logic is complete
    console.log("--- Battle Sequence Finished ---");

    // Check for game over immediately
    if (this.checkGameOver()) {
      console.log("Game Over detected.");
      this.currentPhase = GamePhase.GAME_OVER;
      this.notifyUpdate(); // Update UI to show game over state
    } else {
      // If not game over, immediately prepare the next round (Draft Phase)
      console.log("Battle finished, preparing next round.");
      // Small delay to allow final animations/state updates to show before phase change
      setTimeout(() => this.prepareNextRound(), 500); 
    }
  }

  // Check if all players still have cards on battlefield
  allPlayersHaveCards(): boolean {
    return this.players.some((player) => player.battlefield.length > 0);
  }

  // Corrected applyDamageToPlayers 
  applyDamageToPlayers(damageTaken: Map<string, number>): void {
      for (const [playerId, damage] of damageTaken.entries()) {
          if (damage > 0) {
              const player = this.players.find(p => p.id === playerId);
              if(player){
                  const playerIndex = this.players.indexOf(player);
                  player.takeDamage(damage); // Apply damage first
                  // Log the event AFTER applying damage
                  this.battleLog.push({ 
                      type: 'damage', // Changed type to 'damage' for consistency
                      defender: {playerIndex: playerIndex, card: null}, // Target is the player
                      amount: damage,
                      message: `${player.name} takes ${damage} damage.` 
                  });
              }
          }
      }
  }

  // Check if the game is over
  checkGameOver(): boolean {
    const defeatedPlayers = this.players.filter((player) =>
      player.isDefeated()
    );
    return defeatedPlayers.length > 0;
  }

  // Get the winner if any
  getWinner(): Player | null {
    if (!this.checkGameOver()) return null;

    const remainingPlayers = this.players.filter(
      (player) => !player.isDefeated()
    );
    if (remainingPlayers.length === 1) {
      return remainingPlayers[0];
    }

    // In case of a tie, the player with the most health wins
    if (remainingPlayers.length > 1) {
      return remainingPlayers.reduce((prevPlayer, currPlayer) =>
        prevPlayer.health > currPlayer.health ? prevPlayer : currPlayer
      );
    }

    return null;
  }

  // Prepare for the next round (Rounds 2+)
  prepareNextRound(): void {
    console.log("--- Preparing Next Round --- ");
    this.roundNumber++;
    this.turnNumber = 1;
    this.currentPhase = GamePhase.DRAFT;
    this.playersPassedDraftPhase.clear();
    this.battleLog = [];

    // Calculate base points for the round
    const basePointsToAssign = this.roundNumber + 1;
    console.log(`Assigning points for Round ${this.roundNumber}: Base=${basePointsToAssign}`);

    this.players.forEach(player => {
      // Add points earned from sales last round
      const totalPoints = basePointsToAssign + player.pointsEarnedFromSales;
      console.log(` - ${player.name} sales points: ${player.pointsEarnedFromSales}`);
      player.draftPoints = totalPoints;
      player.pointsEarnedFromSales = 0; // Reset sales points for the new round
      console.log(` => Total assigned: ${player.draftPoints} to ${player.name}`);
    });

    this.determineDraftingOrder();
    this.refillDraftPool();
    this.switchToNextEligibleDrafter();
  }

  // Update getBattleLog return type
  getBattleLog(): BattleEvent[] {
    return this.battleLog;
  }
}


