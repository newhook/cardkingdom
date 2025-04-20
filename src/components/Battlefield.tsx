import React, { useRef, useState, useEffect } from "react";
import { Player } from "../models/Player";
import { Game, GamePhase, AnimationState } from "../models/Game";
import CardComponent from "./CardComponent";

interface BattlefieldProps {
  player: Player;
  game: Game;
  isHumanPlayer: boolean;
  onPlayCard: (handIndex: number, targetPosition: number) => void;
  onReorderCard: (startIndex: number, targetIndex: number) => void;
  onSellCard: (battlefieldIndex: number) => void;
  animationState: AnimationState | null;
  playerIndex: number;
}

const Battlefield: React.FC<BattlefieldProps> = ({
  player,
  game,
  isHumanPlayer,
  onPlayCard,
  onReorderCard,
  onSellCard,
  animationState,
  playerIndex,
}) => {
  const isArrangementPhase = game.currentPhase === GamePhase.ARRANGEMENT;
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [animationStyle, setAnimationStyle] = useState<{
    [key: number]: React.CSSProperties;
  }>({});

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, player.battlefield.length);
  }, [player.battlefield.length]);

  useEffect(() => {
    if (
      game.currentPhase === GamePhase.BATTLE &&
      animationState?.attackerInfo
    ) {
      const { playerIndex: attackerPlayerIndex, cardIndex: attackerCardIndex } =
        animationState.attackerInfo;
      const defenderInfo = animationState.defenderInfo;
      const defenderPlayerIndex = defenderInfo?.playerIndex;
      const defenderCardIndex = defenderInfo?.cardIndex;

      if (attackerPlayerIndex === playerIndex && attackerCardIndex !== null) {
        const attackerElement = cardRefs.current[attackerCardIndex];

        let defenderElement: HTMLDivElement | null = null;
        if (
          defenderPlayerIndex === playerIndex &&
          typeof defenderCardIndex === "number" &&
          defenderCardIndex >= 0
        ) {
          defenderElement = cardRefs.current[defenderCardIndex];
        } else if (
          defenderPlayerIndex !== playerIndex &&
          typeof defenderCardIndex === "number" &&
          defenderCardIndex >= 0
        ) {
          const opponentSelector = `.battlefield-player-${defenderPlayerIndex}`;
          const opponentBattlefield = document.querySelector(opponentSelector);
          if (opponentBattlefield) {
            const cardSelector = ".card";
            const opponentCards =
              opponentBattlefield.querySelectorAll(cardSelector);
            if (opponentCards && defenderCardIndex < opponentCards.length) {
              defenderElement = opponentCards[
                defenderCardIndex
              ] as HTMLDivElement;
            }
          }
        } else if (
          defenderPlayerIndex !== playerIndex &&
          defenderCardIndex === null
        ) {
          const opponentSelector = `.battlefield-player-${defenderPlayerIndex}`;
          const opponentBattlefield = document.querySelector(opponentSelector);
          if (opponentBattlefield) {
            const rect = opponentBattlefield.getBoundingClientRect();
            defenderElement = {
              getBoundingClientRect: () => ({
                top: rect.top + rect.height / 2,
                left: rect.left + rect.width / 2,
                width: 0,
                height: 0,
                bottom: 0,
                right: 0,
                x: 0,
                y: 0,
                toJSON: () => ({}),
              }),
            } as HTMLDivElement;
          }
        }

        if (attackerElement && defenderElement) {
          const attackerRect = attackerElement.getBoundingClientRect();
          const defenderRect = defenderElement.getBoundingClientRect();

          const deltaX =
            defenderRect.left +
            defenderRect.width / 2 -
            (attackerRect.left + attackerRect.width / 2);
          const deltaY =
            defenderRect.top +
            defenderRect.height / 2 -
            (attackerRect.top + attackerRect.height / 2);

          const newStyle = {
            transform: `translate(${deltaX / 2}px, ${deltaY / 2}px)`,
            transition: "transform 0.2s ease-out",
            zIndex: 10,
          };
          setAnimationStyle((prev) => ({
            ...prev,
            [attackerCardIndex]: newStyle,
          }));

          const timer = setTimeout(() => {
            setAnimationStyle((prev) => ({
              ...prev,
              [attackerCardIndex]: {
                transform: "translate(0, 0)",
                transition: "transform 0.2s ease-in",
                zIndex: 1,
              },
            }));
            setTimeout(() => {
              setAnimationStyle((prev) => {
                const newState = { ...prev };
                delete newState[attackerCardIndex];
                return newState;
              });
            }, 200);
          }, 300);

          return () => clearTimeout(timer);
        }
      }
    } else if (game.currentPhase !== GamePhase.BATTLE) {
      if (Object.keys(animationStyle).length > 0) {
        setAnimationStyle({});
      }
    }
  }, [animationState, game.currentPhase, playerIndex]);

  // --- Drag Handlers for the Battlefield Container (Dropping from Hand) ---
  const handleDragOverContainer = (e: React.DragEvent<HTMLDivElement>) => {
    if (isArrangementPhase && isHumanPlayer) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      (e.currentTarget as HTMLDivElement).classList.add("drag-over");
    }
  };

  const handleDragLeaveContainer = (e: React.DragEvent<HTMLDivElement>) => {
    if (isArrangementPhase && isHumanPlayer) {
      (e.currentTarget as HTMLDivElement).classList.remove("drag-over");
    }
  };

  const handleDropContainer = (e: React.DragEvent<HTMLDivElement>) => {
    if (isArrangementPhase && isHumanPlayer) {
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).classList.remove("drag-over");
      const sourceIndex = Number(e.dataTransfer.getData("text/plain") || -1);
      const sourceType = e.dataTransfer.getData("sourceType");

      if (sourceType === "hand" && sourceIndex >= 0) {
        // Play card from hand to the end of the battlefield
        onPlayCard(sourceIndex, player.battlefield.length);
      }
    }
  };

  // --- Drag Handlers for Individual Cards on the Battlefield (Dragging and Dropping) ---
  const handleCardDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    cardIndex: number
  ) => {
    e.dataTransfer.setData("text/plain", cardIndex.toString());
    e.dataTransfer.setData("sourceType", "battlefield");
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      (e.target as HTMLDivElement).style.opacity = "0.4";
    }, 0);
  };

  const handleCardDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLDivElement).style.opacity = "";
  };

  const handleCardDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow dropping onto other cards for reordering or inserting from hand
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    (e.currentTarget as HTMLDivElement).classList.add("drop-target");
  };

  const handleCardDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).classList.remove("drop-target");
  };

  const handleCardDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number
  ) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).classList.remove("drop-target");
    const sourceIndex = Number(e.dataTransfer.getData("text/plain") || -1);
    const sourceType = e.dataTransfer.getData("sourceType");

    if (sourceIndex >= 0) {
      if (sourceType === "battlefield") {
        // Reorder cards within the battlefield
        onReorderCard(sourceIndex, targetIndex);
      } else if (sourceType === "hand") {
        // Insert card from hand at this specific position
        onPlayCard(sourceIndex, targetIndex);
      }
    }
  };

  return (
    <div
      className={`battlefield battlefield-player-${playerIndex} ${
        isArrangementPhase && isHumanPlayer ? "drop-zone" : ""
      }`}
      onDragOver={handleDragOverContainer}
      onDragLeave={handleDragLeaveContainer}
      onDrop={handleDropContainer}
    >
      <div className="cards-container">
        {player.battlefield.map((card, index) => {
          // Determine animation classes for this card
          const isAttacking =
            animationState?.attackerInfo?.playerIndex === playerIndex &&
            animationState?.attackerInfo?.cardIndex === index;
          const isDefending =
            animationState?.defenderInfo?.playerIndex === playerIndex &&
            animationState?.defenderInfo?.cardIndex === index;
          const isDefeated = isDefending && animationState?.isDefeat;
          const isTakingDamage =
            isDefending && animationState?.damageAmount !== null;

          // Add console log here
          if (isDefeated) {
            console.log(
              `[Battlefield P${playerIndex}] Card Index ${index} isDefeated=true. Applying defeated-animation class.`
            );
          }

          const cardAnimClasses = [
            isAttacking ? "attacking" : "",
            isDefending ? "defending" : "",
            isTakingDamage ? "taking-damage" : "",
            isDefeated ? "defeated-animation" : "", // Use a specific class for defeat animation
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={`${player.id}-bf-wrapper-${card.suit}-${card.rank}-${index}`}
              ref={(el: HTMLDivElement | null) => {
                cardRefs.current[index] = el;
              }}
              style={animationStyle[index] || {}}
              className={`battlefield-card-wrapper ${cardAnimClasses}`}
            >
              <CardComponent
                card={card}
                isFaceUp={true}
                draggable={isArrangementPhase && isHumanPlayer}
                onDragStart={(e: React.DragEvent<HTMLDivElement>) =>
                  handleCardDragStart(e, index)
                }
                onDragEnd={handleCardDragEnd}
                onDragOver={
                  isArrangementPhase && isHumanPlayer
                    ? handleCardDragOver
                    : undefined
                }
                onDragLeave={
                  isArrangementPhase && isHumanPlayer
                    ? handleCardDragLeave
                    : undefined
                }
                onDrop={
                  isArrangementPhase && isHumanPlayer
                    ? (e: React.DragEvent<HTMLDivElement>) =>
                        handleCardDrop(e, index)
                    : undefined
                }
                onSellClick={
                  isArrangementPhase && isHumanPlayer
                    ? () => onSellCard(index)
                    : undefined
                }
                className={`${
                  isArrangementPhase && isHumanPlayer ? "draggable" : ""
                }`.trim()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Battlefield;
