import React, { useRef, useEffect } from 'react';

interface BattleLogProps {
  log: string[];
}

const BattleLog: React.FC<BattleLogProps> = ({ log }) => {
  const logEntriesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when log updates
  useEffect(() => {
    if (logEntriesRef.current) {
      logEntriesRef.current.scrollTop = logEntriesRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="battle-log">
      <h3>Battle Log</h3>
      <div className="log-entries" ref={logEntriesRef}>
        {log.map((entry, index) => (
          <div key={index} className="log-entry">
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattleLog; 