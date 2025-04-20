import { Card, Suit, Rank } from "./Card";

export class Deck {
  cards: Card[];

  constructor() {
    // Add all standard cards
    const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
    const ranks = [
      Rank.ACE,
      Rank.KING,
      Rank.QUEEN,
      Rank.JACK,
      Rank.TEN,
      Rank.NINE,
      Rank.EIGHT,
      Rank.SEVEN,
      Rank.SIX,
      Rank.FIVE,
      Rank.FOUR,
      Rank.THREE,
      Rank.TWO,
    ];

    // Create a card for each suit-rank combination
    let id = 0;
    this.cards = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push(new Card(id, suit, rank));
        id++;
      }
    }

    // Add jokers if requested
    this.cards.push(new Card(id, Suit.JOKER, Rank.JOKER));
    id++;
    this.cards.push(new Card(id, Suit.JOKER, Rank.JOKER));
    id++;
  }

  // Shuffle the deck
  shuffle(): void {
    // Fisher-Yates shuffle algorithm
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  // Draw a card from the deck
  draw(): Card | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.cards.pop();
  }

  // Draw multiple cards from the deck
  drawMultiple(count: number): Card[] {
    const drawnCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.draw();
      if (card) {
        drawnCards.push(card);
      } else {
        break;
      }
    }
    return drawnCards;
  }

  // Check if the deck is empty
  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  // Get remaining card count
  cardCount(): number {
    return this.cards.length;
  }

  // Add a card to the bottom of the deck
  addToBottom(card: Card): void {
    this.cards.unshift(card);
  }

  // Add a card to the top of the deck
  addToTop(card: Card): void {
    this.cards.push(card);
  }
}
