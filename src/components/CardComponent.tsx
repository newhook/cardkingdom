import React from 'react';
import { Card } from '../models/Card';

interface CardComponentProps {
  card: Card;
  isFaceUp: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
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

  const cardClass = `card suit-${card.suit.toLowerCase()} ${className}`.trim();

  return (
    <div
      className={cardClass}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={isFaceUp ? card.getDisplayName() : 'Card'} // Tooltip
    >
      {isFaceUp ? (
        <>
          <div className="card-rank">{card.rank}</div>
          <div className="card-suit">{suitSymbols[card.suit]}</div>
          {children} {/* Render any additional elements like badges */}
        </>
      ) : (
        <div className="card-back"></div>
      )}
    </div>
  );
};

export default CardComponent; 