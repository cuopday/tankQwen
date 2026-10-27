# Realistic Graphics System Documentation

## Overview

The Realistic Graphics System implements physically-based rendering (PBR) techniques to create photorealistic tank visuals with dynamic lighting, weather effects, and detailed environmental rendering.

## Core Features

### 1. Dynamic Lighting System

#### LightingSystem Class
- **Point Lights**: Dynamic lights from explosions, muzzle flashes, and tanks
- **Ambient Light**: Global illumination with time-of-day support
- **Quadratic Falloff**: Realistic light attenuation over distance
- **Color Blending**: Multiple light sources blend naturally

#### Light Sources
```typescript
- Explosions: Orange/red lights (intensity based on lifetime)
- Player Tank: White light (0.3 intensity, 200px radius)
- Enemy Tanks: Red-tinted lights (0.2 intensity, 150px radius)
```

#### Real-time Updates
- Lights are recalculated every frame
- Explosion lights fade as explosions expire
- Dynamic shadow casting based on light positions

### 2. PBR-Inspired Tank Rendering

#### Multi-Layer Shadow System
1. **Contact Shadow**: Darkest, closest to tank (40% opacity)
2. **Soft Shadow**: Medium distance, blurred (25% opacity, 8px blur)
3. **Ambient Shadow**: Far, very soft (15% opacity, 15px blur)

#### Hull Rendering (PBR Techniques)

**Surface Shading**
- 6-stop metallic gradient (highlight → specular → base → shadow → deep shadow → ambient occlusion)
- Surface texture simulation (scratches, dents)
- Fresnel effect for specular highlights
- Rim lighting on edges

**Material Properties**
- Base color influenced by lighting (30% blend)
- Metalness simulation through gradient stops
- Roughness variation across surface
- Ambient occlusion in crevices

**Panel Lines & Details**
- Depth-simulated panel lines with highlights
- Tool boxes with realistic shading
- Engine vents with grill lines
- Exhaust pipes with heat glow (when moving)

#### Track System

**Individual Track Links**
- 18 links per track with grooves and pins
- Dirt accumulation in grooves (60% opacity)
- Metal shine on link edges (10% opacity)
- Realistic pin shading with shadows

**Wheel Hubs**
- 3 wheels per track with 5 bolts each
- Metallic radial gradients (4 stops)
- Hub caps with realistic shading
- Bolt shadows and highlights

#### Turret Rendering

**Barrel (Chrome Effect)**
- 9-stop gradient for realistic chrome
- 4 reinforcement rings with depth
- Muzzle brake with ventilation slots
- Muzzle hole with depth gradient

**Turret Dome**
- 6-stop PBR gradient (specular → highlight → mid → base → shadow → AO)
- Commander's hatch with handle
- Periscope with glass effect (3-stop gradient)
- Antenna with glowing tip (player-specific color)

**Rivets**
- Ambient occlusion around each rivet
- 4-stop radial gradient for 3D effect
- Specular highlights influenced by lighting

### 3. Environmental Effects

#### Damage Visualization
- **Smoke Emission**: Random particles when health < 50%
- **Spark Effects**: Bright sparks with glow when health < 30%
- **Scorch Marks**: Radial gradient decals that increase with damage
- **Dynamic Opacity**: Effects scale with damage level

#### Movement Effects
- **Dust Clouds**: Brown-tinted particles when moving
- **Exhaust Glow**: Orange/red heat effect from exhaust pipes
- **Track Wear**: Dirt accumulation simulation

### 4. Weather System

#### Rain Effect
- **100 Rain Drops**: Animated diagonal lines
- **Splash Effects**: Circular splashes on ground contact
- **Consistent Animation**: Time-based positioning
- **Subtle Opacity**: 30% global alpha for realism

#### Fog Particles
- **20 Fog Clouds**: Large atmospheric particles
- **Sine Wave Movement**: Gentle horizontal drift
- **Radial Gradients**: Soft edges for natural look
- **Depth Effect**: Creates atmospheric perspective

### 5. Enhanced Terrain

#### Height Variation
- Subtle elevation changes using sine waves
- Affects color intensity of all ground features
- Creates natural-looking terrain undulation

#### Ground Features

**Dirt Patches**
- 3-stop radial gradients
- 8 small dirt particles per patch
- Height-influenced opacity

**Grass Tufts**
- 5 blades per tile with variation
- Linear gradients for depth
- Highlight effects on blade tips
- Natural rotation angles

**Pebbles**
- Realistic 3-stop radial gradients
- Shadow casting (offset 0.5px)
- Highlight spots for specular reflection
- Varied sizes and orientations

**Puddles**
- Water accumulation in low areas
- 3-stop gradient for depth
- Reflection/shine effect
- Elliptical shape with rotation

### 6. Post-Processing Pipeline

#### Render Order
1. Background and ground
2. Ground decals (scorch marks, craters)
3. Y-sorted drawables (obstacles, tanks, bullets)
4. Particles (layered by type)
5. Fireflies
6. Explosions
7. Dynamic lighting (additive)
8. Weather effects (rain, fog)
9. Post-processing (vignette, mist, bloom)
10. Crosshair

#### Bloom Effect
- Additive blending for explosions
- Radial glow around bright areas
- 4% global alpha for subtlety
- Creates cinematic look

#### Vignette
- 4-layer progressive darkening
- Focuses attention on center
- Cinematic depth enhancement

#### Mist Overlay
- Bottom-up fog gradient
- 4 animated mist patches
- Jungle green tint
- Atmospheric perspective

## Technical Implementation

### Lighting Calculations

```typescript
// Quadratic falloff for realistic light attenuation
const falloff = 1 - (dist / radius);
const intensity = light.intensity * falloff * falloff;

// Color blending from multiple light sources
totalR += rgb.r * intensity;
totalG += rgb.g * intensity;
totalB += rgb.b * intensity;
```

### PBR Gradient Formula

```typescript
// 6-stop metallic gradient
hullGrad.addColorStop(0, lightenColor(baseColor, 60));  // Highlight
hullGrad.addColorStop(0.15, lightenColor(baseColor, 35)); // Specular
hullGrad.addColorStop(0.35, baseColor);                  // Base
hullGrad.addColorStop(0.6, darkenColor(baseColor, 15));  // Shadow
hullGrad.addColorStop(0.85, darkenColor(baseColor, 35)); // Deep shadow
hullGrad.addColorStop(1, darkenColor(baseColor, 50));    // Ambient occlusion
```

### Weather Animation

```typescript
// Rain drops with consistent animation
const x = (randomX * CANVAS_WIDTH + time * 0.5) % CANVAS_WIDTH;
const y = (randomY * CANVAS_HEIGHT + time * 2) % CANVAS_HEIGHT;

// Fog with sine wave drift
const x = (randomX * CANVAS_WIDTH + Math.sin(time * 0.0003 + i) * 50) % CANVAS_WIDTH;
```

## Performance Optimizations

### Rendering Efficiency
- **Off-screen culling**: Only render visible objects
- **Y-sorting**: Proper depth ordering without z-buffer
- **Gradient caching**: Reuse gradients where possible
- **Particle pooling**: Max 500 particles, reuse old ones

### Lighting Optimization
- **Dynamic light limit**: Only process nearby lights
- **Quadratic falloff**: Early exit for distant lights
- **Ambient light**: Single calculation for global illumination

### Terrain Optimization
- **Tile-based rendering**: 100x100px tiles
- **Visibility culling**: Only render tiles in camera view
- **Detail levels**: Reduced detail for distant tiles

## Visual Quality Metrics

### Tank Detail
- **Hull**: 16 rivets, 3 panel lines, 2 tool boxes, 2 exhaust pipes
- **Tracks**: 18 links per track, 3 wheels per track, 5 bolts per wheel
- **Turret**: 8 rivets, 4 barrel rings, 1 hatch, 1 periscope, 1 antenna
- **Total**: ~80 detail elements per tank

### Environmental Detail
- **Ground tiles**: 5 grass tufts, 2 pebbles, 1 puddle (10% chance)
- **Weather**: 100 rain drops, 20 fog particles
- **Post-processing**: 9 effect layers

### Lighting
- **Dynamic lights**: Up to 20 simultaneous lights
- **Shadow layers**: 3 per tank (contact, soft, ambient)
- **Color blending**: Real-time RGB mixing

## Color Management

### Utility Functions

**lightenColor(color, amount)**
```typescript
// Increases RGB values by amount (max 255)
const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount);
```

**darkenColor(color, amount)**
```typescript
// Decreases RGB values by amount (min 0)
const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amount);
```

**blendColors(color1, color2, blend)**
```typescript
// Linear interpolation between two colors
const r = Math.round(r1 + (r2 - r1) * blend);
```

## File Structure

```
src/game/
├── RealisticGraphics.ts    # PBR rendering system (700+ lines)
├── EnhancedGraphics.ts     # Previous detailed rendering
├── renderer.ts             # Main render pipeline (2400+ lines)
├── engine.ts               # Game logic
├── types.ts                # Type definitions
└── WeaponRegistry.ts       # Weapon definitions
```

## Key Functions

### RealisticGraphics.ts
- `drawRealisticTank()` - Main tank rendering with PBR
- `drawPBRHull()` - Hull with physically-based shading
- `drawPBRTurret()` - Turret with chrome barrel
- `drawRealisticTracks()` - Advanced track system
- `drawSurfaceTexture()` - Simulated normal mapping
- `drawRealisticRivets()` - 3D rivets with AO
- `drawRealisticDamage()` - Smoke, sparks, scorch marks

### renderer.ts
- `drawVietnamGround()` - Enhanced terrain with puddles
- `drawWeatherEffects()` - Rain and fog
- `drawBloomEffect()` - Cinematic bloom
- `drawMistOverlay()` - Atmospheric mist

## Usage Example

```typescript
// Initialize lighting system
const lightingSystem = new LightingSystem();

// Add dynamic light
lightingSystem.addLight(
  { x: 100, y: 200 },  // position
  '#ff8844',            // color
  0.8,                  // intensity
  300                   // radius
);

// Calculate lighting at position
const lighting = lightingSystem.calculateLightAt(position);

// Render tank with realistic graphics
drawRealisticTank(ctx, tank, time, lightingSystem);
```

## Future Enhancements

### Potential Additions
1. **Screen-Space Reflections**: Reflect environment on tank surfaces
2. **Normal Mapping**: True surface detail through texture maps
3. **Volumetric Lighting**: God rays through fog/smoke
4. **Depth of Field**: Blur distant objects
5. **Motion Blur**: Fast-moving object blur
6. **Dynamic Skies**: Time-of-day sky rendering
7. **Water Physics**: Realistic puddle ripples
8. **Destructible Terrain**: Height map modification
9. **Particle Collisions**: Particles interact with terrain
10. **HDR Rendering**: High dynamic range for better lighting

### Performance Targets
- **Current**: 8-12ms per frame
- **Target**: 60 FPS on mid-range hardware
- **Headroom**: ~4ms for additional effects

## Conclusion

The Realistic Graphics System transforms Steel Thunder into a visually stunning experience with:
- **Physically-based rendering** for realistic materials
- **Dynamic lighting** with multiple light sources
- **Weather effects** for atmospheric immersion
- **Detailed terrain** with height variation and puddles
- **Cinematic post-processing** for professional polish

All techniques are optimized for real-time performance while maintaining visual fidelity.
