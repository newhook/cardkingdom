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
  suit: Suit;
  rank: Rank;
  strength: number;
  health: number;
  isJoker: boolean;
  cost: number;

  constructor(suit: Suit, rank: Rank) {
    this.suit = suit;
    this.rank = rank;
    this.isJoker = rank === Rank.JOKER;

    // Set initial health and strength based on rank
    if (this.isJoker) {
      this.strength = 11; // Jokers are powerful but versatile
      this.health = 11;
      this.cost = 5;
    } else if (this.isFaceCard()) {
      // Face cards are stronger than number cards
      this.strength = this.getFaceCardStrength();
      this.health = this.getFaceCardHealth();
      // Set cost based on rank
      if (this.rank === Rank.KING) {
        this.cost = 4;
      } else {
        this.cost = 3; // Jack and Queen cost 3
      }
    } else if (rank === Rank.ACE) {
      // Aces are very powerful
      this.strength = 14;
      this.health = 14;
      this.cost = 5;
    } else if (rank === Rank.TEN) {
      // 10s cost 3
      this.strength = 10;
      this.health = 10;
      this.cost = 3;
    } else {
      // Number cards have strength equal to their number value
      this.strength = this.getNumberCardValue();
      this.health = this.strength;
      this.cost = 2; // Number cards 2-9 cost 2
    }
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
}
