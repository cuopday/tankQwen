import { useState, useCallback } from 'react';
import GameCanvas from './game/GameCanvas';
import HUD from './components/HUD';
import Menu from './components/Menu';
import { GameState } from './game/types';
import { initGameState } from './game/engine';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(initGameState());
  const [gameStarted, setGameStarted] = useState(false);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleStart = useCallback(() => {
    setGameStarted(true);
  }, []);

  const handleRestart = useCallback(() => {
    setGameState(initGameState());
    setGameStarted(true);
  }, []);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center">
      {/* Game container */}
      <div className="relative w-full h-full max-w-[1200px] max-h-[800px] aspect-[3/2] rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/5">
        {/* Canvas */}
        <GameCanvas 
          onStateChange={handleStateChange} 
          gameStarted={gameStarted}
          onRestart={handleRestart}
        />
        
        {/* HUD overlay */}
        {gameStarted && (
          <HUD state={gameState} />
        )}
        
        {/* Main menu */}
        {!gameStarted && <Menu onStart={handleStart} />}
      </div>

      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-950/20 via-transparent to-purple-950/20" />
      </div>
    </div>
  );
}
