import React from 'react';
import { GamePhase } from '../models/Game';

interface PhaseBannerProps {
  phase: GamePhase | null;
  isVisible: boolean;
}

// Helper to format phase names
const formatPhaseName = (phase: GamePhase | null): string => {
  if (!phase) return '';
  switch (phase) {
    case GamePhase.DRAFT: return 'Draft Phase';
    case GamePhase.ARRANGEMENT: return 'Arrangement Phase';
    case GamePhase.BATTLE: return 'Battle Phase';
    case GamePhase.DAMAGE: return 'Damage Phase';
    case GamePhase.GAME_OVER: return 'Game Over';
    default: return '';
  }
};

const PhaseBanner: React.FC<PhaseBannerProps> = ({ phase, isVisible }) => {
  if (!isVisible || !phase) {
    return null;
  }

  // Use phase name as key to re-trigger animation on phase change
  const key = phase;

  return (
    <div key={key} className="phase-banner">
      {formatPhaseName(phase)}
    </div>
  );
};

export default PhaseBanner; 