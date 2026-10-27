# Steel Thunder - Chaos Tank Battle

## 🎮 Game Overview

A 2.5D isometric tank battle game set in a Vietnam village environment with an escalating chaos system featuring 200+ interactive objects, power-ups, hazards, and chain-reaction mayhem!

## 🌟 Key Features

### 1. **Chaos Level System**
- **5 Chaos Levels** that escalate every 30 seconds
- Each level adds more explosive objects, hazards, and AI enemies
- Visual indicator shows current chaos level (1-5)
- Objects scale with chaos: more barrels, turrets, tornadoes, and black holes at higher levels

### 2. **Explosive Objects (Chain Reactions!)**
- **Explosive Barrels** - Explode when shot, triggering nearby barrels
- **TNT Crates** - Massive explosions with 80px radius
- **Chain Reactions** - Explosions damage nearby explosives, creating spectacular chain reactions
- Watch as one shot can trigger a cascade of explosions across the battlefield!

### 3. **Power-Up System**
Collect glowing power-ups scattered across the map:

- **🔥 Rapid Fire** (8 seconds) - 60% faster firing rate
- **3x Triple Shot** (6 seconds) - Fire 3 bullets in a spread pattern
- **⚡ Speed Boost** (10 seconds) - 50% faster movement
- **🛡 Shield** - Absorbs 50 damage
- **🔰 Armor Boost** (12 seconds) - Increased damage resistance
- **❤️ Health Pack** - Restores 30 HP

Power-ups respawn after 15 seconds and show active duration in the HUD.

### 4. **Environmental Hazards**
Drive through dangerous terrain that affects your tank:

- **🌋 Lava Pools** - Continuous damage + fire particles
- **🧪 Acid Lakes** - Corrodes armor over time
- **🏜️ Quicksand** - Slows movement by 50%
- **🧊 Ice Patches** - Reduced friction, tanks slide
- **🛢️ Oil Spills** - Causes random rotation/spinning

### 5. **Moving Obstacles**
- **🌪️ Tornadoes** (Chaos 2+) - Move across the map, pulling tanks inward
- **🪨 Rolling Boulders** (Chaos 3+) - Crush anything in their path
- **🤖 Attack Drones** (Chaos 4+) - Hunt and attack players

### 6. **Defensive Structures**
- **🔫 Auto Turrets** (Chaos 2+) - Automatically shoot at nearby tanks
- **🌀 Teleport Portals** (Chaos 3+) - Paired portals that teleport tanks between them
- **⚫ Black Holes** (Chaos 5) - Gravitational pull that sucks in tanks and bullets

### 7. **Vietnam Village Environment**
Authentic 2.5D isometric assets:
- Stilt houses with thatched roofs
- Bamboo groves that sway in the wind
- Rice paddies (non-collidable water)
- Buddha statues with golden glow
- Market stalls with colorful canopies
- Palm trees with coconuts
- Sampans (boats) that bob on water
- Stone lanterns with flickering lights
- Village gates (torii-style)

### 8. **Visual Effects**
- **Dynamic Lighting** - Explosions illuminate the battlefield
- **Particle Systems** - Smoke, fire, sparks, debris, dust, confetti
- **Screen Shake** - Impactful explosions and collisions
- **Chain Reaction Visuals** - Watch explosions trigger other explosions
- **Power-up Auras** - Glowing effects around active power-ups
- **Fireflies** - Atmospheric jungle ambiance
- **Jungle Mist** - Subtle fog overlay

### 9. **HUD Features**
- **Chaos Level Indicator** - 5 dots showing current chaos (1-5)
- **Active Power-ups** - Real-time display of active effects
- **Tactical Minimap** - Color-coded obstacles showing:
  - Red = Explosives
  - Green = Power-ups
  - Orange = Hazards
  - Purple = Portals
  - Blue = Speed boosts
  - Gray = Turrets/structures
- **Health Bar** - Dynamic color coding (green → yellow → red)
- **Score & Wave Counter**
- **Kill Counter**

### 10. **Controls**
- **WASD** - Move tank (auto-rotates toward movement)
- **Mouse** - Aim turret (smooth tracking)
- **Left Click / Space** - Fire
- **ESC** - Pause

## 🎯 Gameplay Loop

1. **Start** at Chaos Level 1 with basic Vietnam village environment
2. **Collect power-ups** to gain advantages
3. **Avoid hazards** like lava, acid, and quicksand
4. **Shoot explosive barrels** to trigger chain reactions
5. **Survive waves** of enemy tanks with increasing difficulty
6. **Every 30 seconds**, chaos level increases:
   - More explosive barrels appear
   - Turrets spawn and start shooting
   - Tornadoes begin roaming
   - Boulders roll across the map
   - Attack drones hunt you down
   - At Level 5: Black holes appear!
7. **Chain reactions** create spectacular moments where one shot can destroy multiple objects
8. **Power-up management** is key - time your boosts for maximum effect

## 🎨 Technical Highlights

- **2.5D Isometric Rendering** - All objects have depth with visible side faces
- **Y-Sorting** - Proper depth ordering for realistic overlap
- **Particle System** - 500+ simultaneous particles with different types
- **Chain Reaction Physics** - Explosions damage nearby objects
- **Smooth Camera** - Follows player with screen shake
- **Optimized Rendering** - Only renders visible objects
- **Responsive Controls** - Twin-stick style with smooth interpolation

## 🚀 Chaos Progression

| Level | Time | New Objects |
|-------|------|-------------|
| 1 | 0:00 | Base village + 15 barrels, 5 TNT, 8 power-ups |
| 2 | 0:30 | +20 barrels, +8 TNT, +5 hazards, +3 turrets, +2 tornadoes |
| 3 | 1:00 | +25 barrels, +9 TNT, +7 hazards, +4 turrets, +3 tornadoes, +3 boulders, 2 portals |
| 4 | 1:30 | +30 barrels, +12 TNT, +9 hazards, +5 turrets, +4 tornadoes, +4 boulders, +3 drones |
| 5 | 2:00 | +35 barrels, +15 TNT, +11 hazards, +6 turrets, +5 tornadoes, +5 boulders, +4 drones, 1 black hole |

## 💥 Chain Reaction Examples

1. **Barrel Cascade**: Shoot one barrel → explodes → damages 3 nearby barrels → they explode → damage more barrels → massive chain reaction!

2. **TNT Domino**: Hit a TNT crate → 80px explosion → triggers barrels in radius → barrels explode → trigger more TNT → battlefield-wide devastation!

3. **Tornado + Explosives**: Tornado picks up explosive barrel → carries it into enemy tank → massive explosion!

4. **Portal Surprise**: Enemy chases you through portal → appears behind black hole → gets sucked in!

## 🎮 Tips for Survival

1. **Prioritize power-ups** - Rapid Fire and Triple Shot are game-changers
2. **Use chain reactions** - Line up barrels for maximum damage
3. **Avoid hazards** - Lava and acid will kill you quickly
4. **Watch the minimap** - See incoming tornadoes and drones
5. **Use portals strategically** - Escape dangerous situations
6. **At Chaos 5** - Stay away from black holes!
7. **Keep moving** - Standing still makes you an easy target

## 🏆 Score System

- **100 points** per enemy tank destroyed
- Bonus points for chain reactions (coming soon)
- Survival time bonus (coming soon)

---

**Enjoy the chaos! 🎮💥🌪️**
