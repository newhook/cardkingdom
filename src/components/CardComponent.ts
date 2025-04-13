import { Card, Suit, Rank } from "../models/Card";

export class CardComponent {
  private element: HTMLElement;
  private card: Card;
  private faceUp: boolean = true;

  constructor(card: Card, faceUp: boolean = true) {
    this.card = card;
    this.faceUp = faceUp;
    this.element = document.createElement("div");
    this.render();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  // Flip the card over
  flip(): void {
    this.faceUp = !this.faceUp;
    this.render();
  }

  // Get suit color (red for hearts/diamonds, black for clubs/spades)
  private getSuitColor(): string {
    return this.card.suit === Suit.HEARTS || this.card.suit === Suit.DIAMONDS
      ? "red"
      : "black";
  }

  // Get suit symbol
  private getSuitSymbol(): string {
    switch (this.card.suit) {
      case Suit.HEARTS:
        return "♥";
      case Suit.DIAMONDS:
        return "♦";
      case Suit.CLUBS:
        return "♣";
      case Suit.SPADES:
        return "♠";
      case Suit.JOKER:
        return "★";
      default:
        return "";
    }
  }

  // Render the card element
  private render(): void {
    this.element.className = "card";
    this.element.dataset.suit = this.card.suit;
    this.element.dataset.rank = this.card.rank;

    if (this.faceUp) {
      // Card is face up - show the content
      this.element.classList.add("face-up");

      // Add suit color
      const color = this.getSuitColor();
      this.element.classList.add(color);

      // Create the card structure
      const corner1 = document.createElement("div");
      corner1.className = "corner top-left";
      corner1.innerHTML = `${this.card.rank}<br/>${this.getSuitSymbol()}`;

      const corner2 = document.createElement("div");
      corner2.className = "corner bottom-right";
      corner2.innerHTML = `${this.card.rank}<br/>${this.getSuitSymbol()}`;

      const center = document.createElement("div");
      center.className = "center";

      // For face cards, add special styling
      if (
        this.card.isFaceCard() ||
        this.card.rank === Rank.ACE ||
        this.card.isJoker
      ) {
        this.element.classList.add("face-card");

        // Simulated image for face cards
        const faceImage = document.createElement("div");
        faceImage.className = "face-image";
        faceImage.textContent = this.card.isJoker ? "JOKER" : this.card.rank;
        center.appendChild(faceImage);
      } else {
        // For number cards, show the appropriate number of suit symbols
        const value = this.card.strength;
        for (let i = 0; i < value; i++) {
          const symbol = document.createElement("div");
          symbol.className = "pip";
          symbol.textContent = this.getSuitSymbol();
          center.appendChild(symbol);
        }
      }

      // Add stat display
      const stats = document.createElement("div");
      stats.className = "stats";
      stats.textContent = `${this.card.strength}/${this.card.health}`;

      // Clear and append all elements
      this.element.innerHTML = "";
      this.element.appendChild(corner1);
      this.element.appendChild(center);
      this.element.appendChild(corner2);
      this.element.appendChild(stats);
    } else {
      // Card is face down - show the back
      this.element.classList.add("face-down");
      this.element.innerHTML = '<div class="card-back">♠ ♥<br>♣ ♦</div>';
    }
  }

  // Update the card stats visual after damage
  updateStats(): void {
    if (this.faceUp) {
      const stats = this.element.querySelector(".stats");
      if (stats) {
        stats.textContent = `${this.card.strength}/${this.card.health}`;
      }
    }

    // Add visual indicator if card is almost defeated
    if (this.card.health <= this.card.strength / 2) {
      this.element.classList.add("damaged");
    } else {
      this.element.classList.remove("damaged");
    }
  }
}
