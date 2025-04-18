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

    // Set up the game update callback to refresh the UI when the game state changes
    this.game.setUpdateCallback(() => this.render());

    // Initialize the game
    this.game.initialize();
    this.render();
  }

  // Render the entire game state
  render(): void {
    console.log(`[GameView.ts] Rendering for phase: ${this.game.currentPhase}`);
    this.renderPlayerInfo();
    this.renderDraftPool();
    this.renderHands();
    this.renderBattlefields();
    this.renderActionButtons();
    this.renderBattleLog();

    // Highlight the current phase in the UI
    this.container.dataset.gamePhase = this.game.currentPhase;
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
      let isDraftingPlayer = false;
      if (this.game.currentPhase === GamePhase.DRAFT) {
        const currentDraftingPlayer = this.game.getCurrentDraftingPlayer();
        isDraftingPlayer = currentDraftingPlayer.id === player.id;
      }

      // Add turn and draft points info if in draft phase and this is the current drafting player
      if (isDraftingPlayer) {
        const draftInfo = document.createElement("div");
        draftInfo.classList.add("draft-info");
        draftInfo.innerHTML = `Turn ${this.game.turnNumber} - Draft Points: ${this.game.currentDraftPoints}`;
        info.appendChild(draftInfo);
      }

      // Highlight current player based on game phase
      if (this.game.currentPhase === GamePhase.DRAFT) {
        // During draft, highlight the player whose turn it is to draft
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
      draftPointsInfo.innerHTML = `Turn ${this.game.turnNumber} - <strong>${currentDraftingPlayer.name}'s Turn</strong><br>Draft Points: ${this.game.currentDraftPoints}`;
      this.draftPoolElement.appendChild(draftPointsInfo);

      // Add explanation for drafting order
      if (this.game.turnNumber === 1) {
        const draftOrderInfo = document.createElement("div");
        draftOrderInfo.classList.add("draft-order-info");
        draftOrderInfo.textContent =
          "First turn: Random player starts drafting";
        this.draftPoolElement.appendChild(draftOrderInfo);
      } else {
        const draftOrderInfo = document.createElement("div");
        draftOrderInfo.classList.add("draft-order-info");
        draftOrderInfo.textContent =
          "Drafting order: Player with lowest health drafts first";
        this.draftPoolElement.appendChild(draftOrderInfo);
      }

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

      // Add instructions during arrangement phase for human player
      if (this.game.currentPhase === GamePhase.ARRANGEMENT && index === 0) {
        const instructions = document.createElement("div");
        instructions.classList.add("arrangement-instructions");
        instructions.textContent =
          "Drag cards to the battlefield or click to play them in order";
        handElement.appendChild(instructions);
      }

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
          cardElement.classList.add("draggable");

          cardElement.addEventListener("dragstart", (e) => {
            e.dataTransfer?.setData("text/plain", cardIndex.toString());
            e.dataTransfer?.setData("sourceType", "hand");
            // Add dragstart visual indication
            setTimeout(() => {
              cardElement.style.opacity = "0.4";
            }, 0);
          });

          cardElement.addEventListener("dragend", () => {
            // Reset visual indication
            cardElement.style.opacity = "";
          });

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

      // Add instructions during arrangement phase for human player
      if (this.game.currentPhase === GamePhase.ARRANGEMENT && index === 0) {
        const instructions = document.createElement("div");
        instructions.classList.add("arrangement-instructions");
        instructions.textContent =
          "Drag cards to reorder them. Click 'Ready for Battle' when finished.";
        battlefield.appendChild(instructions);
      }

      // Set up drop zone for battlefield during arrangement phase
      if (this.game.currentPhase === GamePhase.ARRANGEMENT && index === 0) {
        battlefield.classList.add("drop-zone");

        // Handle dragover to allow dropping
        battlefield.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer!.dropEffect = "move";
          battlefield.classList.add("drag-over");
        });

        battlefield.addEventListener("dragleave", () => {
          battlefield.classList.remove("drag-over");
        });

        // Handle drop for cards coming from hand
        battlefield.addEventListener("drop", (e) => {
          e.preventDefault();
          battlefield.classList.remove("drag-over");
          const sourceIndex = Number(
            e.dataTransfer?.getData("text/plain") || -1
          );
          const sourceType = e.dataTransfer?.getData("sourceType");

          // If from hand, play the card to the battlefield
          if (sourceType === "hand" && sourceIndex >= 0) {
            player.playCard(sourceIndex, player.battlefield.length);
            this.render();
          }
        });
      }

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
          cardElement.classList.add("draggable");

          cardElement.addEventListener("dragstart", (e) => {
            e.dataTransfer?.setData("text/plain", cardIndex.toString());
            e.dataTransfer?.setData("sourceType", "battlefield");
            // Add dragstart visual indication
            setTimeout(() => {
              cardElement.style.opacity = "0.4";
            }, 0);
          });

          cardElement.addEventListener("dragend", () => {
            // Reset visual indication
            cardElement.style.opacity = "";
          });

          // Add drop functionality to individual cards for precise reordering
          cardElement.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = "move";
            cardElement.classList.add("drop-target");
          });

          cardElement.addEventListener("dragleave", () => {
            cardElement.classList.remove("drop-target");
          });

          cardElement.addEventListener("drop", (e) => {
            e.preventDefault();
            cardElement.classList.remove("drop-target");

            const sourceIndex = Number(
              e.dataTransfer?.getData("text/plain") || -1
            );
            const sourceType = e.dataTransfer?.getData("sourceType");

            if (sourceIndex >= 0) {
              if (sourceType === "battlefield") {
                // Reorder cards within battlefield
                const cards = [...player.battlefield];
                const card = cards.splice(sourceIndex, 1)[0];
                cards.splice(cardIndex, 0, card);
                player.battlefield = cards;
              } else if (sourceType === "hand") {
                // Insert card from hand at specific position
                player.playCard(sourceIndex, cardIndex);
              }
              this.render();
            }
          });
        }

        battlefield.appendChild(cardElement);
      });
    });
  }

  // Render action buttons based on game phase
  private renderActionButtons(): void {
    this.actionButtons.innerHTML = "";

    console.log(
      "[GameView.ts] Rendering action buttons for phase: " + this.game.currentPhase
    );

    switch (this.game.currentPhase) {
      case GamePhase.DRAFT:
        // Show phase info
        const draftPhaseInfo = document.createElement("div");
        draftPhaseInfo.classList.add("phase-info");
        draftPhaseInfo.textContent = "Draft Phase: Acquire cards for your army";
        this.actionButtons.appendChild(draftPhaseInfo);
        break;

      case GamePhase.ARRANGEMENT:
        console.log(
          "[GameView.ts] Rendering action buttons for ARRANGEMENT phase."
        );
        // Show phase info with more prominent styling
        const arrangementPhaseInfo = document.createElement("div");
        arrangementPhaseInfo.classList.add("phase-info", "active-phase");
        arrangementPhaseInfo.textContent =
          "Arrangement Phase: Position your cards for battle";
        this.actionButtons.appendChild(arrangementPhaseInfo);

        // Add a more detailed instruction for the player
        const arrangementInstructions = document.createElement("div");
        arrangementInstructions.classList.add(
          "arrangement-instructions",
          "main-instructions"
        );
        arrangementInstructions.innerHTML = `
          <strong>Placement Phase:</strong> Drag cards from your hand to the battlefield.<br>
          The order matters - cards will attack in sequence from left to right.<br>
          When you're satisfied with your arrangement, click "Ready for Battle".
        `;
        this.actionButtons.appendChild(arrangementInstructions);

        const readyButton = document.createElement("button");
        readyButton.textContent = "Ready for Battle";
        readyButton.classList.add("primary-button");
        readyButton.addEventListener("click", () => {
          this.game.startBattle();
          this.render();
        });
        this.actionButtons.appendChild(readyButton);
        break;

      case GamePhase.DAMAGE:
        // Show phase info
        const damagePhaseInfo = document.createElement("div");
        damagePhaseInfo.classList.add("phase-info");
        damagePhaseInfo.textContent = "Damage Phase: Battle round complete";
        this.actionButtons.appendChild(damagePhaseInfo);

        const nextRoundButton = document.createElement("button");
        nextRoundButton.textContent = "Next Round";
        nextRoundButton.classList.add("primary-button");
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
        newGameButton.classList.add("primary-button");
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
