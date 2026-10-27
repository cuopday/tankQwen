import { useState, useCallback } from 'react';
import GameCanvas from './game/GameCanvas';
import HUD from './components/HUD';
import Menu from './components/Menu';
import LoadoutScreen from './components/LoadoutScreen';
import { GameState, Tank } from './game/types';
import { initGameState } from './game/engine';
import { TankDefinition, TANKS } from './game/TankRegistry';
import { WeaponDefinition, WEAPONS } from './game/WeaponRegistry';

type GameScreen = 'menu' | 'loadout' | 'playing';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [gameState, setGameState] = useState<GameState>(initGameState);
  const [gameSession, setGameSession] = useState(0);
  const [selectedTank, setSelectedTank] = useState<TankDefinition | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponDefinition | null>(null);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleStartFromMenu = useCallback(() => {
    setScreen('loadout');
  }, []);

  const handleLoadoutSelect = useCallback((tank: TankDefinition, weapon: WeaponDefinition) => {
    setSelectedTank(tank);
    setSelectedWeapon(weapon);
    
    // Initialize game with selected tank/weapon
    const newState = initGameState();
    newState.gameStarted = true;
    newState.player = {
      ...newState.player,
      color: tank.color,
      accentColor: tank.accentColor,
      size: tank.size,
      health: tank.health,
      maxHealth: tank.health,
      speed: tank.speed,
      rotationSpeed: tank.rotationSpeed,
    };
    
    setGameState(newState);
    setScreen('playing');
  }, []);

  const handleRestart = useCallback(() => {
    const newState = initGameState();
    newState.gameStarted = true;
    
    if (selectedTank) {
      newState.player = {
        ...newState.player,
        color: selectedTank.color,
        accentColor: selectedTank.accentColor,
        size: selectedTank.size,
        health: selectedTank.health,
        maxHealth: selectedTank.health,
        speed: selectedTank.speed,
        rotationSpeed: selectedTank.rotationSpeed,
      };
    }
    
    setGameState(newState);
    setGameSession(session => session + 1);
  }, [selectedTank]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center">
      <div className="relative w-full h-full max-w-[1200px] max-h-[800px] aspect-[3/2] rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/5">
        {/* Game Canvas - always rendered when playing */}
        {screen === 'playing' && (
          <>
            <GameCanvas
              key={gameSession}
              initialState={gameState}
              onStateChange={handleStateChange} 
              gameStarted={true}
              onRestart={handleRestart}
            />
            <HUD state={gameState} onRestart={handleRestart} />
          </>
        )}
        
        {/* Menu */}
        {screen === 'menu' && <Menu onStart={handleStartFromMenu} />}
        
        {/* Loadout Screen */}
        {screen === 'loadout' && (
          <LoadoutScreen onSelect={handleLoadoutSelect} />
        )}
      </div>

      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-950/20 via-transparent to-purple-950/20" />
      </div>
    </div>
  );
}
