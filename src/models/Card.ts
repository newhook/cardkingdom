// Card suits with their associated abilities
export enum Suit {
  HEARTS = "hearts", // Healing/support abilities
  DIAMONDS = "diamonds", // Economic abilities
  CLUBS = "clubs", // AoE damage
  SPADES = "spades", // Single-target high damage
  JOKER = "joker", // Special suit for jokers
}

// Card ranks with their associated roles
export enum Rank {
  ACE = "A", // Commander units
  KING = "K", // Tanks
  QUEEN = "Q", // Support units
  JACK = "J", // Assassins
  TEN = "10", // Basic units
  NINE = "9",
  EIGHT = "8",
  SEVEN = "7",
  SIX = "6",
  FIVE = "5",
  FOUR = "4",
  THREE = "3",
  TWO = "2",
  JOKER = "Joker", // Special wildcard unit
}

// Card class representing a playing card in the game
export class Card {
  public id: number;
  suit: Suit;
  rank: Rank;
  strength: number;
  health: number;
  maxHealth: number;
  cost: number;
  isDefeated: boolean;

  constructor(id: number, suit: Suit, rank: Rank) {
    this.id = id;
    this.suit = suit;
    this.rank = rank;
    this.cost = 2; // Every card costs 2 points regardless of type
    this.isDefeated = false;

    // Set initial health and strength based on rank
    let initialHealth: number;
    if (this.rank === Rank.JOKER) {
      this.strength = 11; // Jokers are powerful but versatile
      initialHealth = 11;
    } else if (this.isFaceCard()) {
      // Face cards are stronger than number cards
      this.strength = this.getFaceCardStrength();
      initialHealth = this.getFaceCardHealth();
    } else if (rank === Rank.ACE) {
      // Aces are very powerful
      this.strength = 14;
      initialHealth = 14;
    } else {
      // Number cards have strength equal to their number value
      this.strength = this.getNumberCardValue();
      initialHealth = this.strength;
    }

    this.health = initialHealth;
    this.maxHealth = initialHealth;
  }

  // Check if this is a face card (Jack, Queen, King)
  isFaceCard(): boolean {
    return (
      this.rank === Rank.JACK ||
      this.rank === Rank.QUEEN ||
      this.rank === Rank.KING
    );
  }

  // Get the strength value for face cards
  private getFaceCardStrength(): number {
    switch (this.rank) {
      case Rank.JACK:
        return 11;
      case Rank.QUEEN:
        return 12;
      case Rank.KING:
        return 13;
      default:
        return 0; // Should never happen
    }
  }

  // Get the health value for face cards
  private getFaceCardHealth(): number {
    switch (this.rank) {
      case Rank.JACK:
        return 11;
      case Rank.QUEEN:
        return 12;
      case Rank.KING:
        return 15; // Kings have extra health as tanks
      default:
        return 0; // Should never happen
    }
  }

  // Get the numeric value of number cards
  private getNumberCardValue(): number {
    switch (this.rank) {
      case Rank.TWO:
        return 2;
      case Rank.THREE:
        return 3;
      case Rank.FOUR:
        return 4;
      case Rank.FIVE:
        return 5;
      case Rank.SIX:
        return 6;
      case Rank.SEVEN:
        return 7;
      case Rank.EIGHT:
        return 8;
      case Rank.NINE:
        return 9;
      case Rank.TEN:
        return 10;
      default:
        return 0; // Should never happen
    }
  }

  // Cards perform their attacks differently based on type
  attack(target: Card): number {
    let damage = this.strength;

    // Apply special abilities based on card type
    if (this.rank === Rank.JACK) {
      // Jacks deal extra damage to high-value targets
      if (
        target.rank === Rank.KING ||
        target.rank === Rank.QUEEN ||
        target.rank === Rank.ACE
      ) {
        damage *= 1.5;
      }
    } else if (this.rank === Rank.KING) {
      // Kings deal less damage but have more health
      damage *= 0.8;
    }

    // Apply suit bonuses
    if (this.suit === Suit.SPADES) {
      // Spades deal extra single-target damage
      damage *= 1.2;
    }

    return Math.floor(damage);
  }

  // Get display name for the card
  getDisplayName(): string {
    return `${this.rank} of ${this.suit}`;
  }

  // Reset card state (e.g., health) - useful for potential future mechanics
  reset() {
    this.health = this.maxHealth;
    this.isDefeated = false;
  }

  // --- ADD CLONE METHOD ---
  clone(): Card {
    // Create a new card with the same suit and rank
    const newCard = new Card(this.id, this.suit, this.rank);
    // Copy the current state
    newCard.strength = this.strength;
    newCard.health = this.health;
    newCard.maxHealth = this.maxHealth;
    newCard.cost = this.cost;
    newCard.isDefeated = this.isDefeated;
    // isJoker is handled by constructor based on rank
    return newCard;
  }
  // --- END CLONE METHOD ---
}
