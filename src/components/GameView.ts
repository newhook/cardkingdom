import { Game, GamePhase } from "../models/Game";
import { Card } from "../models/Card";
import { Player } from "../models/Player";
import { CardComponent } from "./CardComponent";

export class GameView {
  private game: Game;
  private container: HTMLElement;
  private draftPoolElement: HTMLElement;
  private battlefieldElements: HTMLElement[] = [];
  private handElements: HTMLElement[] = [];
  private playerInfoElements: HTMLElement[] = [];
  private logElement: HTMLElement;
  private actionButtons: HTMLElement;

  constructor(game: Game, container: HTMLElement) {
    this.game = game;
    this.container = container;

    // Create main elements
    this.container.innerHTML = "";
    this.container.classList.add("game-container");

    // Top section - opponent area
    const opponentArea = document.createElement("div");
    opponentArea.classList.add("player-area", "opponent-area");

    // Middle section - draft pool and battlefield
    const middleArea = document.createElement("div");
    middleArea.classList.add("middle-area");

    this.draftPoolElement = document.createElement("div");
    this.draftPoolElement.classList.add("draft-pool");

    // Create battlefield areas for each player
    for (let i = 0; i < this.game.players.length; i++) {
      const battlefield = document.createElement("div");
      battlefield.classList.add("battlefield");
      battlefield.dataset.playerId = this.game.players[i].id;
      this.battlefieldElements.push(battlefield);

      const playerInfo = document.createElement("div");
      playerInfo.classList.add("player-info");
      playerInfo.dataset.playerId = this.game.players[i].id;
      this.playerInfoElements.push(playerInfo);

      // Create hand area
      const hand = document.createElement("div");
      hand.classList.add("hand");
      hand.dataset.playerId = this.game.players[i].id;
      this.handElements.push(hand);
    }

    // Bottom section - player hand and actions
    const playerArea = document.createElement("div");
    playerArea.classList.add("player-area", "current-player-area");

    // Action buttons
    this.actionButtons = document.createElement("div");
    this.actionButtons.classList.add("action-buttons");

    // Battle log
    this.logElement = document.createElement("div");
    this.logElement.classList.add("battle-log");

    // Arrange elements
    middleArea.appendChild(this.draftPoolElement);

    // Add opponent info and battlefield
    opponentArea.appendChild(this.playerInfoElements[1]);
    opponentArea.appendChild(this.battlefieldElements[1]);
    opponentArea.appendChild(this.handElements[1]);

    // Add current player battlefield and info
    playerArea.appendChild(this.handElements[0]);
    playerArea.appendChild(this.battlefieldElements[0]);
    playerArea.appendChild(this.playerInfoElements[0]);

    // Add everything to container
    this.container.appendChild(opponentArea);
    this.container.appendChild(middleArea);
    this.container.appendChild(playerArea);
    this.container.appendChild(this.actionButtons);
    this.container.appendChild(this.logElement);

    // Initialize the game
    this.game.initialize();
    this.render();
  }

  // Render the entire game state
  render(): void {
    this.renderPlayerInfo();
    this.renderDraftPool();
    this.renderHands();
    this.renderBattlefields();
    this.renderActionButtons();
    this.renderBattleLog();
  }

  // Render player information (health, etc.)
  private renderPlayerInfo(): void {
    this.game.players.forEach((player, index) => {
      const info = this.playerInfoElements[index];
      info.innerHTML = "";

      const nameElement = document.createElement("div");
      nameElement.classList.add("player-name");
      nameElement.textContent = player.name;

      const healthElement = document.createElement("div");
      healthElement.classList.add("player-health");
      healthElement.innerHTML = `❤️ ${player.health}/${player.maxHealth}`;

      info.appendChild(nameElement);
      info.appendChild(healthElement);

      // Check if this player is the one currently drafting
      const isDraftingPlayer =
        this.game.currentPhase === GamePhase.DRAFT &&
        this.game.getCurrentDraftingPlayer().id === player.id;

      // Add turn and draft points info if in draft phase and this is the current drafting player
      if (isDraftingPlayer) {
        const draftInfo = document.createElement("div");
        draftInfo.classList.add("draft-info");
        draftInfo.innerHTML = `Turn ${this.game.turnNumber} - Draft Points: ${this.game.currentDraftPoints}`;
        info.appendChild(draftInfo);
      }

      // Highlight current player based on phase
      if (this.game.currentPhase === GamePhase.DRAFT) {
        // During draft, highlight the drafting player
        info.classList.toggle("active", isDraftingPlayer);
      } else {
        // In other phases, highlight based on currentPlayerIndex
        info.classList.toggle("active", this.game.currentPlayerIndex === index);
      }

      // Show defeated state
      info.classList.toggle("defeated", player.isDefeated());
    });
  }

  // Render the draft pool
  private renderDraftPool(): void {
    this.draftPoolElement.innerHTML = "";

    if (this.game.currentPhase === GamePhase.DRAFT) {
      const title = document.createElement("h3");
      title.textContent = "Draft Pool";
      this.draftPoolElement.appendChild(title);

      // Add turn and draft points info
      const draftPointsInfo = document.createElement("div");
      draftPointsInfo.classList.add("draft-points-info");

      // Get current drafting player's name
      const currentDraftingPlayer = this.game.getCurrentDraftingPlayer();
      draftPointsInfo.innerHTML = `Turn ${this.game.turnNumber} - <b>${currentDraftingPlayer.name}'s Turn</b><br>Draft Points: ${this.game.currentDraftPoints}`;
      this.draftPoolElement.appendChild(draftPointsInfo);

      // Add pass button
      const passButton = document.createElement("button");
      passButton.textContent = "Pass";
      passButton.classList.add("pass-button");
      passButton.addEventListener("click", () => {
        this.game.passDraft();
        this.render();
      });
      this.draftPoolElement.appendChild(passButton);

      this.game.draftPool.forEach((card, index) => {
        const cardComponent = new CardComponent(card, true);
        const cardElement = cardComponent.getElement();

        // Add cost indicator
        const costBadge = document.createElement("div");
        costBadge.classList.add("cost-badge");
        costBadge.textContent = `${card.cost}`;
        cardElement.appendChild(costBadge);

        // Add disabled class if not enough points
        if (card.cost > this.game.currentDraftPoints) {
          cardElement.classList.add("disabled");
        }

        // Add click handler for drafting
        cardElement.addEventListener("click", () => {
          if (
            this.game.currentPhase === GamePhase.DRAFT &&
            card.cost <= this.game.currentDraftPoints
          ) {
            this.game.draftCard(index);
            this.render();
          }
        });

        this.draftPoolElement.appendChild(cardElement);
      });
    } else {
      this.draftPoolElement.style.display = "none";
    }
  }

  // Render player hands
  private renderHands(): void {
    this.game.players.forEach((player, index) => {
      const handElement = this.handElements[index];
      handElement.innerHTML = "";

      const title = document.createElement("h3");
      title.textContent =
        index === this.game.currentPlayerIndex ? "Your Hand" : "Opponent Hand";
      handElement.appendChild(title);

      player.hand.forEach((card, cardIndex) => {
        // Show cards in the current player's hand, show backs for opponent
        const isCurrentPlayer = index === 0; // Assuming player 0 is the human player
        const cardComponent = new CardComponent(card, isCurrentPlayer);
        const cardElement = cardComponent.getElement();

        // Add drag functionality for the arrangement phase
        if (
          this.game.currentPhase === GamePhase.ARRANGEMENT &&
          isCurrentPlayer
        ) {
          cardElement.draggable = true;
          cardElement.dataset.handIndex = cardIndex.toString();

          cardElement.addEventListener("click", () => {
            // When clicking, add to the end of the battlefield
            player.playCard(cardIndex, player.battlefield.length);
            this.render();
          });
        }

        handElement.appendChild(cardElement);
      });
    });
  }

  // Render player battlefields
  private renderBattlefields(): void {
    this.game.players.forEach((player, index) => {
      const battlefield = this.battlefieldElements[index];
      battlefield.innerHTML = "";

      const title = document.createElement("h3");
      title.textContent =
        index === this.game.currentPlayerIndex
          ? "Your Battlefield"
          : "Opponent Battlefield";
      battlefield.appendChild(title);

      player.battlefield.forEach((card, cardIndex) => {
        const cardComponent = new CardComponent(card, true);
        const cardElement = cardComponent.getElement();

        cardElement.dataset.position = cardIndex.toString();

        // Add drag-and-drop functionality during arrangement phase
        if (
          this.game.currentPhase === GamePhase.ARRANGEMENT &&
          index === this.game.currentPlayerIndex
        ) {
          cardElement.draggable = true;

          // Allow reordering
          battlefield.addEventListener("dragover", (e) => {
            e.preventDefault();
          });

          battlefield.addEventListener("drop", (e) => {
            e.preventDefault();
            const sourceIndex = Number(
              e.dataTransfer?.getData("text/plain") || -1
            );

            if (sourceIndex >= 0) {
              // Reorder cards
              const cards = [...player.battlefield];
              const card = cards.splice(sourceIndex, 1)[0];
              cards.splice(cardIndex, 0, card);
              player.battlefield = cards;
              this.render();
            }
          });

          cardElement.addEventListener("dragstart", (e) => {
            e.dataTransfer?.setData("text/plain", cardIndex.toString());
          });
        }

        battlefield.appendChild(cardElement);
      });
    });
  }

  // Render action buttons based on game phase
  private renderActionButtons(): void {
    this.actionButtons.innerHTML = "";

    switch (this.game.currentPhase) {
      case GamePhase.ARRANGEMENT:
        const readyButton = document.createElement("button");
        readyButton.textContent = "Ready for Battle";
        readyButton.addEventListener("click", () => {
          this.game.startBattle();
          this.render();
        });
        this.actionButtons.appendChild(readyButton);
        break;

      case GamePhase.DAMAGE:
        const nextRoundButton = document.createElement("button");
        nextRoundButton.textContent = "Next Round";
        nextRoundButton.addEventListener("click", () => {
          this.game.prepareNextRound();
          this.render();
        });
        this.actionButtons.appendChild(nextRoundButton);
        break;

      case GamePhase.GAME_OVER:
        const winner = this.game.getWinner();
        const gameOverMessage = document.createElement("div");
        gameOverMessage.classList.add("game-over-message");
        gameOverMessage.textContent = winner
          ? `Game Over! ${winner.name} wins!`
          : "Game Over! It's a draw!";

        const newGameButton = document.createElement("button");
        newGameButton.textContent = "New Game";
        newGameButton.addEventListener("click", () => {
          // Create a new game with the same players
          this.game = new Game([
            this.game.players[0].name,
            this.game.players[1].name,
          ]);
          this.game.initialize();
          this.render();
        });

        this.actionButtons.appendChild(gameOverMessage);
        this.actionButtons.appendChild(newGameButton);
        break;
    }
  }

  // Render the battle log
  private renderBattleLog(): void {
    this.logElement.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Battle Log";
    this.logElement.appendChild(title);

    // Create a container for log entries
    const logEntries = document.createElement("div");
    logEntries.classList.add("log-entries");

    // Add each log entry
    const battleLog = this.game.getBattleLog();
    battleLog.forEach((entry) => {
      const logEntry = document.createElement("div");
      logEntry.classList.add("log-entry");
      logEntry.textContent = entry;
      logEntries.appendChild(logEntry);
    });

    this.logElement.appendChild(logEntries);

    // Auto-scroll to the bottom
    logEntries.scrollTop = logEntries.scrollHeight;
  }
}
