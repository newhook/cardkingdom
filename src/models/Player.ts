import { Card } from "./Card";

export class Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  hand: Card[];
  battlefield: Card[];

  constructor(id: string, name: string, initialHealth: number = 20) {
    this.id = id;
    this.name = name;
    this.maxHealth = initialHealth;
    this.health = initialHealth;
    this.hand = [];
    this.battlefield = [];
  }

  // Add a card to the player's hand
  addCardToHand(card: Card): void {
    this.hand.push(card);
  }

  // Play a card from hand to battlefield at a specific position
  playCard(handIndex: number, battlefieldPosition: number): boolean {
    if (handIndex < 0 || handIndex >= this.hand.length) {
      return false;
    }

    const card = this.hand.splice(handIndex, 1)[0];

    // Insert at specified position or append if position is beyond array length
    if (battlefieldPosition < 0) {
      battlefieldPosition = 0;
    }

    if (battlefieldPosition >= this.battlefield.length) {
      this.battlefield.push(card);
    } else {
      this.battlefield.splice(battlefieldPosition, 0, card);
    }

    return true;
  }

  // Remove a card from the battlefield
  removeFromBattlefield(index: number): Card | undefined {
    if (index < 0 || index >= this.battlefield.length) {
      return undefined;
    }

    return this.battlefield.splice(index, 1)[0];
  }

  // Take damage to health
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  // Heal the player
  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  // Check if player is defeated
  isDefeated(): boolean {
    return this.health <= 0;
  }

  // Get the number of cards in hand
  handSize(): number {
    return this.hand.length;
  }

  // Get the number of cards on battlefield
  battlefieldSize(): number {
    return this.battlefield.length;
  }

  // Rearrange cards on the battlefield
  rearrangeBattlefield(newOrder: number[]): boolean {
    // Validate new order indices
    if (newOrder.length !== this.battlefield.length) {
      return false;
    }

    // Check if all indices are valid
    const validIndices = newOrder.every(
      (index) => index >= 0 && index < this.battlefield.length
    );

    if (!validIndices) {
      return false;
    }

    // Create a new battlefield array with the new order
    const newBattlefield: Card[] = [];
    for (const index of newOrder) {
      newBattlefield.push(this.battlefield[index]);
    }

    this.battlefield = newBattlefield;
    return true;
  }

  // Check if the player has any cards of a specific suit
  hasSuit(suit: string): boolean {
    return this.battlefield.some((card) => card.suit === suit);
  }

  // Count number of cards of a specific suit
  countSuit(suit: string): number {
    return this.battlefield.filter((card) => card.suit === suit).length;
  }
}
