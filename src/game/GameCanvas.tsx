import { useRef, useEffect, useCallback } from 'react';
import { GameState, InputState } from './types';
import { updateGame, CANVAS_WIDTH, CANVAS_HEIGHT } from './engine';
import { renderGame } from './renderer';

interface GameCanvasProps {
  initialState: GameState;
  onStateChange: (state: GameState) => void;
  gameStarted: boolean;
  onRestart: () => void;
}

export default function GameCanvas({ initialState, onStateChange, gameStarted, onRestart }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(initialState);
  const inputRef = useRef<InputState>({
    up: false, down: false, left: false, right: false,
    shoot: false, mouseX: CANVAS_WIDTH / 2, mouseY: CANVAS_HEIGHT / 2,
  });
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameStartedRef = useRef(false);

  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
    lastTimeRef.current = timestamp;

    // Update game state
    if (gameStartedRef.current && !gameStateRef.current.paused) {
      gameStateRef.current = updateGame(gameStateRef.current, inputRef.current, deltaTime);
      onStateChange({ ...gameStateRef.current });
    }

    // Always render
    renderGame(ctx, gameStateRef.current, timestamp);
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [onStateChange]);

  useEffect(() => {
    if (gameStarted) {
      gameStartedRef.current = true;
      gameStateRef.current.gameStarted = true;
    }
  }, [gameStarted]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      switch (key) {
        case 'w': case 'arrowup': inputRef.current.up = true; e.preventDefault(); break;
        case 's': case 'arrowdown': inputRef.current.down = true; e.preventDefault(); break;
        case 'a': case 'arrowleft': inputRef.current.left = true; e.preventDefault(); break;
        case 'd': case 'arrowright': inputRef.current.right = true; e.preventDefault(); break;
        case ' ': inputRef.current.shoot = true; e.preventDefault(); break;
        case 'p': case 'escape': 
          if (!gameStateRef.current.gameOver) {
            gameStateRef.current.paused = !gameStateRef.current.paused;
            onStateChange({ ...gameStateRef.current });
          }
          break;
        case 'r':
          if (gameStateRef.current.gameOver) {
            onRestart();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      switch (key) {
        case 'w': case 'arrowup': inputRef.current.up = false; break;
        case 's': case 'arrowdown': inputRef.current.down = false; break;
        case 'a': case 'arrowleft': inputRef.current.left = false; break;
        case 'd': case 'arrowright': inputRef.current.right = false; break;
        case ' ': inputRef.current.shoot = false; break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      inputRef.current.mouseX = (e.clientX - rect.left) * scaleX;
      inputRef.current.mouseY = (e.clientY - rect.top) * scaleY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) inputRef.current.shoot = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) inputRef.current.shoot = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onRestart, onStateChange]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full object-contain cursor-crosshair rounded-lg"
      style={{ imageRendering: 'auto' }}
    />
  );
}
