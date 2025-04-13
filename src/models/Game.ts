import { Card } from "./Card";
import { Deck } from "./Deck";
import { Player } from "./Player";

export enum GamePhase {
  SETUP = "setup",
  DRAFT = "draft",
  ARRANGEMENT = "arrangement",
  BATTLE = "battle",
  DAMAGE = "damage",
  GAME_OVER = "game_over",
}

export interface BattleResult {
  winnerId: string | null;
  damageTaken: Map<string, number>;
  battleLog: string[];
}

export class Game {
  players: Player[];
  deck: Deck;
  draftPool: Card[];
  currentPlayerIndex: number;
  currentPhase: GamePhase;
  turnNumber: number;
  roundNumber: number;
  battleLog: string[];
  currentDraftPoints: number;
  draftingOrder: number[]; // Track the order of players for drafting
  draftingPlayerIndex: number; // Index within draftingOrder array
  isComputerDrafting: boolean; // Flag to control AI drafting behavior

  constructor(playerNames: string[] = ["Player 1", "Player 2"]) {
    this.players = playerNames.map(
      (name, index) => new Player(index.toString(), name)
    );
    this.deck = new Deck(true); // Include jokers
    this.draftPool = [];
    this.currentPlayerIndex = 0; // Used for battle/arrangement phases
    this.draftingPlayerIndex = 0; // Used specifically for drafting
    this.draftingOrder = [];
    this.currentPhase = GamePhase.SETUP;
    this.turnNumber = 1;
    this.roundNumber = 1;
    this.battleLog = [];
    this.currentDraftPoints = 2; // Start with 2 drafting points on Turn 1
    this.isComputerDrafting = false; // Initialize AI drafting flag
  }

  // Initialize the game
  initialize(): void {
    this.deck.shuffle();
    this.currentPhase = GamePhase.DRAFT;

    // Randomly determine who drafts first on the first turn
    this.determineDraftingOrder();
    this.refillDraftPool();

    // Start AI drafting if computer goes first
    this.checkAndTriggerComputerDraft();
  }

  // Check if it's the computer's turn to draft and trigger AI drafting
  checkAndTriggerComputerDraft(): void {
    if (this.currentPhase !== GamePhase.DRAFT) return;

    // Assume player 1 (index 0) is human and player 2 (index 1) is AI
    const currentDraftingPlayer = this.getCurrentDraftingPlayer();
    const isComputerTurn = currentDraftingPlayer.id === "1"; // Player with ID "1" is the computer

    if (isComputerTurn && !this.isComputerDrafting) {
      this.isComputerDrafting = true;
      // Use setTimeout to give a small delay before the computer makes its move
      setTimeout(() => {
        this.computerDraft();
        this.isComputerDrafting = false;
      }, 1000);
    }
  }

  // Computer AI drafting logic
  computerDraft(): void {
    // Continue drafting until out of points or no cards left
    while (this.currentDraftPoints >= 2 && this.draftPool.length > 0) {
      // Simple AI strategy: pick the highest strength card
      let bestCardIndex = 0;
      let bestCardStrength = 0;

      // Find the strongest card in the draft pool
      for (let i = 0; i < this.draftPool.length; i++) {
        const card = this.draftPool[i];
        if (card.strength > bestCardStrength) {
          bestCardStrength = card.strength;
          bestCardIndex = i;
        }
      }

      // Draft the selected card
      const success = this.draftCard(bestCardIndex);

      // If drafting failed or we're out of points, stop drafting
      if (!success || this.currentDraftPoints < 2) {
        break;
      }
    }

    // Pass if no more cards can be drafted
    this.passDraft();
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
  getCurrentDraftingPlayer(): Player {
    const playerIndex = this.draftingOrder[this.draftingPlayerIndex];
    return this.players[playerIndex];
  }

  // Get the current player (used for battle/arrangement phases)
  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  // Get the current drafting points
  getCurrentDraftPoints(): number {
    return this.currentDraftPoints;
  }

  // Move to the next player in the drafting sequence
  nextDraftingPlayer(): void {
    this.draftingPlayerIndex++;

    // If we've completed a full round of drafting (all players have drafted)
    if (this.draftingPlayerIndex >= this.draftingOrder.length) {
      this.turnNumber++; // Increment turn number
      this.draftingPlayerIndex = 0; // Reset to first player

      // Check if draft phase should end
      if (this.shouldEndDraftPhase()) {
        this.currentPhase = GamePhase.ARRANGEMENT;
        this.arrangeBattlefieldForComputer(); // Arrange cards for computer player
      } else {
        // Determine new drafting order based on player health
        this.determineDraftingOrder();

        // Refill draft pool and set new draft points
        this.refillDraftPool();

        // Increase drafting points by 1 each turn
        this.currentDraftPoints = 2 + (this.turnNumber - 1);
      }
    }

    // Check if it's the computer's turn to draft
    this.checkAndTriggerComputerDraft();
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
    if (this.currentPhase !== GamePhase.DRAFT) return false;
    if (poolIndex < 0 || poolIndex >= this.draftPool.length) return false;

    const card = this.draftPool[poolIndex];
    const cardCost = 2; // Every card costs 2 points

    // Check if player has enough drafting points
    if (cardCost > this.currentDraftPoints) {
      return false; // Not enough points to draft this card
    }

    // Get the current drafting player
    const currentDraftingPlayer = this.getCurrentDraftingPlayer();

    // Remove the card from the draft pool
    const draftedCard = this.draftPool.splice(poolIndex, 1)[0];
    currentDraftingPlayer.addCardToHand(draftedCard);

    // Deduct the card's cost from drafting points
    this.currentDraftPoints -= cardCost;

    // If no more draft points or draft pool is empty, move to next player
    if (this.currentDraftPoints < 2 || this.draftPool.length === 0) {
      this.nextDraftingPlayer();
    }

    return true;
  }

  // Pass the current draft turn
  passDraft(): void {
    if (this.currentPhase === GamePhase.DRAFT) {
      this.nextDraftingPlayer();
    }
  }

  // Check if draft phase should end
  shouldEndDraftPhase(): boolean {
    // End drafting after 3 turns or when deck is empty
    return this.turnNumber > 3 || this.deck.isEmpty();
  }

  // Start the battle phase
  startBattle(): void {
    if (this.currentPhase !== GamePhase.ARRANGEMENT) return;

    this.currentPhase = GamePhase.BATTLE;
    this.battleLog = [];

    // Execute battle logic
    this.executeBattle();
  }

  // Execute battle between players
  executeBattle(): void {
    this.battleLog = [];
    const damageTaken = new Map<string, number>();

    // Initialize damage counters
    for (const player of this.players) {
      damageTaken.set(player.id, 0);
    }

    // Process battle in rounds until one side has no more cards
    let battleRound = 1;
    while (this.allPlayersHaveCards()) {
      this.battleLog.push(`Battle Round ${battleRound}:`);

      // Each player's first card attacks
      for (let i = 0; i < this.players.length; i++) {
        const attacker = this.players[i];
        const defender = this.players[(i + 1) % this.players.length];

        if (attacker.battlefield.length === 0) continue;

        const attackingCard = attacker.battlefield[0];

        if (defender.battlefield.length > 0) {
          // Attack opponent's first card
          const defendingCard = defender.battlefield[0];
          const damage = attackingCard.attack(defendingCard);

          this.battleLog.push(
            `${attacker.name}'s ${attackingCard.getDisplayName()} attacks ${
              defender.name
            }'s ${defendingCard.getDisplayName()} for ${damage} damage.`
          );

          defendingCard.health -= damage;

          if (defendingCard.health <= 0) {
            this.battleLog.push(
              `${
                defender.name
              }'s ${defendingCard.getDisplayName()} is defeated!`
            );
            defender.removeFromBattlefield(0);
          }
        } else {
          // Direct attack to player
          const damage = attackingCard.strength;
          damageTaken.set(
            defender.id,
            (damageTaken.get(defender.id) || 0) + damage
          );

          this.battleLog.push(
            `${attacker.name}'s ${attackingCard.getDisplayName()} attacks ${
              defender.name
            } directly for ${damage} damage!`
          );

          // Remove the attacking card after it attacks
          attacker.removeFromBattlefield(0);
        }
      }

      battleRound++;

      // Apply special effects based on suit synergies
      this.applySuitSynergies();
    }

    // Apply damage to players
    this.applyDamageToPlayers(damageTaken);

    // Move to next phase
    this.currentPhase = GamePhase.DAMAGE;

    // Check if game is over
    if (this.checkGameOver()) {
      this.currentPhase = GamePhase.GAME_OVER;
    } else {
      // Set up for next round
      this.prepareNextRound();
    }
  }

  // Check if all players still have cards on battlefield
  allPlayersHaveCards(): boolean {
    return this.players.some((player) => player.battlefield.length > 0);
  }

  // Apply suit synergy effects
  applySuitSynergies(): void {
    for (const player of this.players) {
      // Hearts synergy: Healing
      if (player.countSuit("hearts") >= 2) {
        const healAmount = Math.floor(player.countSuit("hearts") / 2);
        player.heal(healAmount);
        this.battleLog.push(
          `${player.name} heals ${healAmount} health from Hearts synergy.`
        );
      }

      // Clubs synergy: AoE damage
      if (player.countSuit("clubs") >= 3) {
        const opponent = this.players.find((p) => p.id !== player.id);
        if (opponent) {
          const damageAmount = Math.floor(player.countSuit("clubs") / 3);

          // Damage all opponent cards
          opponent.battlefield.forEach((card) => {
            card.health -= damageAmount;
            this.battleLog.push(
              `${player.name}'s Clubs synergy deals ${damageAmount} damage to ${
                opponent.name
              }'s ${card.getDisplayName()}.`
            );
          });

          // Remove defeated cards
          for (let i = opponent.battlefield.length - 1; i >= 0; i--) {
            if (opponent.battlefield[i].health <= 0) {
              const defeatedCard = opponent.removeFromBattlefield(i);
              if (defeatedCard) {
                this.battleLog.push(
                  `${
                    opponent.name
                  }'s ${defeatedCard.getDisplayName()} is defeated!`
                );
              }
            }
          }
        }
      }
    }
  }

  // Apply accumulated damage to players
  applyDamageToPlayers(damageTaken: Map<string, number>): void {
    for (const player of this.players) {
      const damage = damageTaken.get(player.id) || 0;
      if (damage > 0) {
        player.takeDamage(damage);
        this.battleLog.push(`${player.name} takes ${damage} damage.`);
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

  // Prepare for the next round
  prepareNextRound(): void {
    this.roundNumber++;
    this.turnNumber = 1;
    this.currentPhase = GamePhase.DRAFT;
    this.currentPlayerIndex = 0;
    this.currentDraftPoints = 2; // Reset draft points for the new round to 2
    this.determineDraftingOrder(); // Reset drafting order for the new round
    this.refillDraftPool();

    // Check if computer drafts first in the new round
    this.checkAndTriggerComputerDraft();
  }

  // Get the battle log
  getBattleLog(): string[] {
    return this.battleLog;
  }
}
