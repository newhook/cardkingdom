import "./style.css";
import { Game } from "./models/Game";
import { GameView } from "./components/GameView";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Card Kingdom Auto Battler</h1>
    <div id="game-container"></div>
  </div>
`;

// Initialize the game with two players
const game = new Game(["Player", "Computer"]);

// Create the game view
const gameContainer = document.getElementById("game-container");
if (gameContainer) {
  const gameView = new GameView(game, gameContainer);
}
