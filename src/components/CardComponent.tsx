import React from 'react';
import { Card } from '../models/Card';

interface CardComponentProps {
  card: Card;
  isFaceUp: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onSellClick?: () => void;
  className?: string;
  children?: React.ReactNode; // For things like cost badges
}

const CardComponent: React.FC<CardComponentProps> = ({
  card,
  isFaceUp,
  onClick,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onSellClick,
  className = '',
  children,
}) => {
  const suitSymbols: { [key: string]: string } = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
    joker: "🃏",
  };

  // Calculate health percentage for dynamic styling
  const healthPercentage = card.maxHealth > 0 ? Math.max(0, card.health) / card.maxHealth : 0;
  // Map percentage (0-1) to hue (0-120, red to green)
  const hue = healthPercentage * 120;
  // Create HSL color string
  const healthBgColor = `hsl(${hue}, 70%, 40%)`; // Adjust saturation/lightness as needed

  // Combine base classes with incoming animation className
  const cardClass = `card suit-${card.suit.toLowerCase()} ${className}`.trim();
  const canSell = !!onSellClick;

  return (
    <div
      className={cardClass}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      title={isFaceUp ? card.getDisplayName() : 'Card'} // Tooltip
    >
      {isFaceUp ? (
        <>
          <div className="card-rank">{card.rank}</div>
          <div className="card-suit">{suitSymbols[card.suit]}</div>
          <div 
            className="card-health" 
            style={{ backgroundColor: healthBgColor }}
          >
             Health: {card.health}
          </div>
          {children} {/* Render any additional elements like badges */}
          {canSell && (
            <button 
              className="sell-button" 
              onClick={(e) => { 
                e.stopPropagation(); // Prevent card click if button is clicked
                onSellClick(); 
              }}
              title="Sell Card (+1 Point Next Round)"
            >
              Sell
            </button>
          )}
        </>
      ) : (
        <div className="card-back"></div>
      )}
    </div>
  );
};

export default CardComponent; 