import { Card } from "./Card";
import { Deck } from "./Deck";
import { Player } from "./Player";

export { Player, Card };

export interface BattleEvent {
  attacker: Player;
  defender: Player;
  attackerCard: number | null;
  defenderCard: number | null;
  amount?: number;
  message?: string;
}

// Define and export AnimationState structure here
export interface AnimationState {
  attackerInfo: { playerIndex: number; cardIndex: number; card: Card } | null;
  defenderInfo: {
    playerIndex: number;
    cardIndex: number | null;
    card: Card | null;
  } | null; // Allow null defenderInfo
  damageAmount: number | null;
  isDefeat: boolean;
}

export enum GamePhase {
  SETUP = "setup",
  DRAFT = "draft",
  ARRANGEMENT = "arrangement",
  BATTLE = "battle",
  POST_BATTLE = "post_battle",
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
    this.deck = new Deck(); // Include jokers
    this.draftPool = [];
    this.currentPlayerIndex = 0; // Used for battle/arrangement phases
    this.draftingPlayerIndex = -1; // Actual player index (0 or 1)
    this.draftingOrder = []; // Order of player indices
    this.draftingOrderPosition = -1; // Position in the order array
    this.currentPhase = GamePhase.SETUP;
    this.turnNumber = 1;
    this.roundNumber = 1;
    this.battleLog = []; // Initialize as empty array of BattleEvents
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
    this.players.forEach((player) => {
      player.draftPoints = 2; // Start with 2 points on Round 1
      console.log(
        `Assigned ${player.draftPoints} draft points to ${player.name} for initial draft.`
      );
    });

    this.determineDraftingOrder(); // Sets draftingOrder
    this.draftingOrderPosition = -1; // Reset order position before starting
    this.refillDraftPool();
    this.switchToNextEligibleDrafter(); // Start the process
  }

  // Check if it's the computer's turn to draft and trigger AI drafting
  checkAndTriggerComputerDraft(): void {
    if (
      this.currentPhase !== GamePhase.DRAFT ||
      this.draftingPlayerIndex === -1
    )
      return;
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

    console.log(
      `${computerPlayer.name} (AI) drafting started. Points: ${computerPlayer.draftPoints}`
    );

    let draftedThisTurn = false;
    // Continue drafting while AI has points and there are cards
    while (computerPlayer.draftPoints >= 2 && this.draftPool.length > 0) {
      // Simple AI strategy: pick the highest strength card it can afford
      let bestCardIndex = -1;
      let bestCardStrength = -1; // Use -1 to ensure any card is initially better

      for (let i = 0; i < this.draftPool.length; i++) {
        const card = this.draftPool[i];
        // Basic check: can afford and is stronger than current best
        if (
          card.cost <= computerPlayer.draftPoints &&
          card.strength > bestCardStrength
        ) {
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
        console.log(
          `${computerPlayer.name} (AI) found no suitable card to draft.`
        );
        break; // Stop drafting loop
      }
    }

    // --- CHANGE: Instead of forcing a pass, just switch to the next eligible player ---
    // The AI might still have points but chose not to draft, or ran out.
    // Let switchToNextEligibleDrafter handle the turn logic correctly.
    console.log(
      `${computerPlayer.name} (AI) finished drafting actions. Checking next player.`
    );
    // this.passDraft(); // REMOVED: Don't force pass here
    this.switchToNextEligibleDrafter(); // ADDED: Directly check for the next player
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

  // Get the current player (used for battle/arrangement phases)
  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
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
    if (
      this.currentPhase !== GamePhase.DRAFT ||
      this.draftingPlayerIndex === -1
    )
      return false;

    const currentDrafter = this.players[this.draftingPlayerIndex];
    if (
      !currentDrafter ||
      this.playersPassedDraftPhase.has(this.draftingPlayerIndex)
    ) {
      console.error(
        "Attempted to draft for player who has passed or doesn't exist."
      );
      return false; // Player already passed or is invalid
    }

    if (poolIndex < 0 || poolIndex >= this.draftPool.length) return false;

    const card = this.draftPool[poolIndex];
    const cardCost = 2;

    if (cardCost > currentDrafter.draftPoints) {
      console.log(
        `${currentDrafter.name} cannot afford card (Cost: ${cardCost}, Points: ${currentDrafter.draftPoints})`
      );
      return false; // Not enough points
    }

    const draftedCard = this.draftPool.splice(poolIndex, 1)[0];
    currentDrafter.addCardToHand(draftedCard);
    currentDrafter.draftPoints -= cardCost;
    console.log(
      `${
        currentDrafter.name
      } drafted ${draftedCard.getDisplayName()}. Points remaining: ${
        currentDrafter.draftPoints
      }`
    );

    // If player runs out of points, automatically try to switch
    if (currentDrafter.draftPoints < cardCost) {
      console.log(
        `${currentDrafter.name} has insufficient points for next draft.`
      );
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
    if (
      this.currentPhase === GamePhase.DRAFT &&
      this.draftingPlayerIndex !== -1
    ) {
      if (!this.playersPassedDraftPhase.has(this.draftingPlayerIndex)) {
        console.log(
          `Player ${this.players[this.draftingPlayerIndex].name} (Index: ${
            this.draftingPlayerIndex
          }) passed the draft phase.`
        );
        this.playersPassedDraftPhase.add(this.draftingPlayerIndex);
      }
      this.switchToNextEligibleDrafter(); // Find next eligible player or end phase
    }
  }

  // New method to find the next player eligible to draft or end the phase
  switchToNextEligibleDrafter(): void {
    if (
      this.currentPhase !== GamePhase.DRAFT ||
      this.draftingOrder.length === 0
    )
      return;

    console.log(
      "Switching to next eligible drafter based on order:",
      this.draftingOrder
    );
    const numPlayers = this.players.length;

    // Loop through the DRAFTING ORDER, starting from the next position
    for (let i = 0; i < numPlayers; i++) {
      // Calculate the next position in the draftingOrder array, wrapping around
      this.draftingOrderPosition =
        (this.draftingOrderPosition + 1) % numPlayers;
      const playerIndexToCheck = this.draftingOrder[this.draftingOrderPosition]; // Get player index from order
      const playerToCheck = this.players[playerIndexToCheck];
      const hasPassed = this.playersPassedDraftPhase.has(playerIndexToCheck);
      const hasPoints = playerToCheck.draftPoints >= 2; // Assuming card cost is 2

      console.log(
        `Checking pos ${this.draftingOrderPosition} -> player ${playerIndexToCheck} (${playerToCheck.name}): Passed=${hasPassed}, HasPoints=${hasPoints}`
      );

      if (!hasPassed && hasPoints) {
        // Found the next eligible player
        console.log(
          `Next drafter is ${playerToCheck.name} (Index: ${playerIndexToCheck})`
        );
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

  // Start the battle phase
  startBattle(): void {
    if (this.currentPhase !== GamePhase.ARRANGEMENT) return;

    // --- Simulate the battle to get the log ---
    console.log("[Game] Simulating battle...");
    this.battleLog = this.executeBattle(); // Get the log without changing state

    // --- Set phase to BATTLE and notify UI ---
    this.currentPhase = GamePhase.BATTLE;
    console.log("[Game] Battle phase started. Log generated. Notifying UI.");
    this.notifyUpdate(); // UI will now use the log to start animations
  }

  executeBattle(): BattleEvent[] {
    const battleLog: BattleEvent[] = []; // Local log for this simulation

    // clone the players for the simulation
    let players = this.players.map((p) => p.clone());

    const attack = (round: number, attacker: Player, defender: Player) => {
      if (round > attacker.battlefield.length - 1) {
        return;
      }
      const attackerCardIndex = round;
      const attackerCard = attacker.battlefield[attackerCardIndex];
      if (defender.battlefield.length == 0) {
        defender.takeDamage(attackerCard.strength);
        battleLog.push({
          attacker: attacker,
          defender: defender,
          attackerCard: attackerCardIndex,
          defenderCard: null,
          amount: attackerCard.strength,
          message: `${attacker.name} attacks ${defender.name} directly for ${attackerCard.strength}`,
        });
        return;
      }
      const defenderCardIndex = Math.floor(
        Math.random() * defender.battlefield.length
      );
      const defenderCard = defender.battlefield[defenderCardIndex];

      const damage = attackerCard.attack(defenderCard);
      battleLog.push({
        attacker: attacker,
        defender: defender,
        attackerCard: attackerCardIndex,
        defenderCard: defenderCardIndex,
        amount: damage,
        message: `${attacker.name}'s ${attackerCard.getDisplayName()} damages ${
          defender.name
        }'s ${defenderCard.getDisplayName()} for ${damage}`,
      });
      defender.takeDamage(damage);
      attacker.takeDamage(damage);
      if (defenderCard.health <= 0) {
        defender.battlefield.splice(defenderCardIndex, 1);
      }
      if (attackerCard.health <= 0) {
        attacker.battlefield.splice(attackerCardIndex, 1);
      }
      round++;
    };

    let attackerIndex = Math.floor(Math.random() * this.players.length);
    let round = 0;
    while (players.some((p) => round < p.battlefield.length)) {
      const defenderIndex = (attackerIndex + 1) % players.length;
      const attacker = players[attackerIndex];
      const defender = players[defenderIndex];
      attack(round, attacker, defender);
      attack(round, defender, attacker);
      round++;
      players = players.map((p) => p.clone());
    }
    return battleLog;
  }

  // --- Method to apply a single battle event to the REAL game state ---
  applyBattleEvent(event: BattleEvent): void {
    console.log(`[Game] Applying event:`, event);
    switch (event.type) {
      case "damage":
        if (!event.defender || event.amount === undefined) break;

        if (event.defender.card) {
          // --- Apply damage to a REAL card ---
          // Find the corresponding REAL card. This assumes cards are uniquely identifiable
          // or relies on the playerIndex and cardIndex matching the original state.
          // Let's assume playerIndex/cardIndex from the event are reliable for now.
          const targetPlayer = this.players[event.defender.playerIndex];
          // !! PROBLEM: cardIndex from event refers to the state *during simulation*.
          // If cards were defeated earlier *in the simulation*, the real index might differ.
          // SAFER APPROACH: Pass unique card identifiers (e.g., create IDs) or pass the
          // original card object reference within the event data if feasible.
          // TEMPORARY FIX: Let's assume the event contains the *original* card object reference or ID
          // For now, let's try finding the card by reference/identity from the event log.
          // This relies on the card objects in the log being the *cloned* ones.
          // We need to find the *original* card that corresponds to the clone.
          const targetCardClone = event.defender.card;
          const realCard = targetPlayer.battlefield.find(
            (c) =>
              c.suit === targetCardClone.suit &&
              c.rank === targetCardClone.rank &&
              !c.isDefeated
          );

          if (realCard) {
            console.log(
              `   Applying ${event.amount} damage to ${
                targetPlayer.name
              }'s ${realCard.getDisplayName()} (Health: ${realCard.health})`
            );
            realCard.health -= event.amount;
            console.log(`   New health: ${realCard.health}`);
          } else {
            console.warn(
              `   Could not find real card for damage event:`,
              event.defender
            );
          }
        } else {
          // --- Apply damage to a REAL player ---
          const targetPlayer = this.players[event.defender.playerIndex];
          console.log(
            `   Applying ${event.amount} damage to ${targetPlayer.name} (Health: ${targetPlayer.health})`
          );
          targetPlayer.takeDamage(event.amount);
          console.log(`   New health: ${targetPlayer.health}`);
        }
        break;

      case "defeat":
        if (!event.defender || !event.defender.card) break;
        // --- Mark a REAL card as defeated ---
        const defeatedPlayer = this.players[event.defender.playerIndex];
        const defeatedCardClone = event.defender.card;
        const realDefeatedCard = defeatedPlayer.battlefield.find(
          (c) =>
            c.suit === defeatedCardClone.suit &&
            c.rank === defeatedCardClone.rank &&
            !c.isDefeated
        );

        if (realDefeatedCard) {
          console.log(
            `   Marking ${
              defeatedPlayer.name
            }'s ${realDefeatedCard.getDisplayName()} as defeated.`
          );
          realDefeatedCard.isDefeated = true;
          // --- Consider removing card immediately OR keep finishBattleAnimation cleanup? ---
          // Let's keep cleanup in finishBattleAnimation for now to ensure fade-out completes.
        } else {
          console.warn(
            `   Could not find real card for defeat event:`,
            event.defender
          );
        }
        break;

      // Other event types ('attack', 'info', 'round') currently don't require state changes
      case "attack":
      case "info":
      case "round":
      default:
        break; // No state change needed for these
    }

    // Notify UI after applying the change for this step
    this.notifyUpdate();
  }
  // --- END applyBattleEvent ---

  // Called by the UI after battle animations are complete
  finishBattleAnimation(): void {
    console.log("[Game] Finishing battle animation, checking game state...");
    // Check for game over first
    if (this.checkGameOver()) {
      console.log("[Game] Game Over detected post-animation.");
      this.currentPhase = GamePhase.GAME_OVER;
    } else {
      // Transition to the post-battle pause phase
      console.log(
        "[Game] Battle finished, entering Post-Battle phase post-animation."
      );
      this.currentPhase = GamePhase.POST_BATTLE;
    }
    // Notify the UI of the phase change
    this.notifyUpdate();
  }

  // Check if all players still have cards on battlefield
  allPlayersHaveCards(): boolean {
    return this.players.some((player) => player.battlefield.length > 0);
  }

  // Corrected applyDamageToPlayers
  applyDamageToPlayers(damageTaken: Map<string, number>): void {
    for (const [playerId, damage] of damageTaken.entries()) {
      if (damage > 0) {
        const player = this.players.find((p) => p.id === playerId);
        if (player) {
          const playerIndex = this.players.indexOf(player);
          player.takeDamage(damage); // Apply damage first
          // Log the event AFTER applying damage
          this.battleLog.push({
            type: "damage", // Changed type to 'damage' for consistency
            defender: { playerIndex: playerIndex, card: null }, // Target is the player
            amount: damage,
            message: `${player.name} takes ${damage} damage.`,
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
    console.log(
      `Assigning points for Round ${this.roundNumber}: Base=${basePointsToAssign}`
    );

    this.players.forEach((player) => {
      // Add points earned from sales last round
      const totalPoints = basePointsToAssign + player.pointsEarnedFromSales;
      console.log(
        ` - ${player.name} sales points: ${player.pointsEarnedFromSales}`
      );
      player.draftPoints = totalPoints;
      player.pointsEarnedFromSales = 0; // Reset sales points for the new round
      console.log(
        ` => Total assigned: ${player.draftPoints} to ${player.name}`
      );
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
