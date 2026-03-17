# Rule Implementation Guide

Quick reference for AI agents implementing player rules in PlainScape.

## Project Structure

```
packages/shared/src/
  constants.ts       — ALL tunable game parameters (speeds, HP, costs, radii)
  types.ts           — EntityKind, DayPhase, SnapEntity, GameRule, etc.
  protocol.ts        — Client↔server message types

server/src/
  world/World.ts           — Game loop, entity maps, broadcast snapshots
  world/DayNightCycle.ts   — getDayPhase(), shouldSpawnLions/Ghosts()
  world/ChunkManager.ts    — Spatial queries (getNearbyEntities)
  systems/MovementSystem.ts  — Player & enemy movement, moveEnemy()
  systems/CombatSystem.ts    — Combat orchestrator (tickCombat)
  systems/CombatHelpers.ts   — killPlayer(), awardSource(), tickRespawns()
  systems/AISystem.ts        — AI dispatcher (tickAI)
  systems/ai/AIHelpers.ts    — Shared AI helpers (wander, findNearestPlayer, etc.)
  systems/ai/LionAI.ts      — Lion chase/pounce behavior
  systems/ai/GhostAI.ts     — Ghost kite/phase behavior
  systems/ai/StagAI.ts      — Stag boss behavior
  systems/SpawnSystem.ts     — Enemy spawning per chunk
  systems/BuildingSystem.ts  — Building placement, turret AI, regen
  systems/CurrencySystem.ts  — Walk-to-earn Source loop
  systems/RuleHelpers.ts     — Convenience re-exports (see below)
  entities/Player.ts         — Player state (hp, source, input, cooldowns)
  entities/Enemy.ts          — Base enemy class
  entities/Lion.ts           — Lion entity
  entities/Ghost.ts          — Ghost entity
  entities/Projectile.ts     — Projectile entity
  entities/Building.ts       — Building entity (wall/gate/turret/bed)

client/src/
  main.ts                          — Client entry, message dispatch
  rendering/Renderer.ts            — Render pipeline orchestrator
  rendering/EntityRenderer.ts      — Entity drawing dispatcher (players + orchestration)
  rendering/RenderUtils.ts         — Shared animation helpers & keyframe data
  rendering/LionRenderer.ts        — Lion drawing (spawn/death/main)
  rendering/GhostRenderer.ts       — Ghost drawing (spawn/death/main)
  rendering/StagRenderer.ts        — Stag boss drawing
  rendering/BuildingRenderer.ts    — Building drawing
  rendering/ProjectileRenderer.ts  — Projectile drawing
```

## World API

```typescript
// Entity collections
world.players          // Map<number, Player>  — all online players
world.enemies          // Map<number, Enemy>   — all enemies
world.projectiles      // Map<number, Projectile>
world.buildingsById    // Map<number, Building>
world.buildings        // alias for buildingsById (same map)
world.chunks           // ChunkManager — spatial queries
world.db               // GameDatabase — persistence
world.rules            // GameRule[] — active rules this cycle
world.dayPhase         // 'day' | 'night' | 'dawn' | 'dusk' (getter)
world.boss             // Enemy | null — world boss reference

// Entity management
world.addEnemy(enemy)            // adds to enemies map + chunk
world.removeEnemy(enemy)         // removes from map + chunk
world.addProjectile(proj)        // adds projectile
world.addBuilding(building)      // adds + persists to DB
world.removeBuilding(building)   // removes + deletes from DB

// Communication
world.sendEvent(player, kind, message)  // sends event to one player
world.broadcastAll(msg)                 // sends msg to all players
```

## RuleHelpers — Convenience Imports

```typescript
import {
  killPlayer, awardSource,       // from CombatHelpers (via CombatSystem)
  moveEnemy,                     // from MovementSystem
  getDayPhase, shouldSpawnLions, shouldSpawnGhosts,  // from DayNightCycle
  findNearestPlayer, wander,     // from ai/AIHelpers
  SAFE_ZONE_RADIUS, NO_BUILD_BUFFER, CELL_SIZE,      // from constants
  CHUNK_SIZE, VIEW_RADIUS, PLAYER_SPEED, PLAYER_HP,
} from './RuleHelpers.js';
```

## Common Patterns

```typescript
// Iterate living players
for (const [, player] of world.players) {
  if (player.dead) continue;
  // ...
}

// Iterate living enemies
for (const [, enemy] of world.enemies) {
  if (enemy.markedForRemoval) continue;
  // ...
}

// Spatial query — get entities near a point
const nearby = world.chunks.getNearbyEntities(x, y);
// Returns: { players: Player[], enemies: Enemy[], projectiles: Projectile[], buildings: Building[] }

// Distance check
const dist = Math.hypot(target.x - entity.x, target.y - entity.y);

// Safe zone check
const inSafeZone = Math.hypot(x, y) < SAFE_ZONE_RADIUS;
```

## CRITICAL: Timing Rules

```
delta = seconds (float, e.g., 0.066 for ~15Hz tick)
Date.now() = milliseconds

Movement: speed (units/sec) * delta (sec) = units moved this tick
Cooldowns: compare Date.now() against a stored ms timestamp

For spawn timers, ALWAYS use Date.now() comparisons:
  GOOD: if (now - this.lastSpawn > INTERVAL) { this.lastSpawn = now; spawn(); }
  BAD:  this.timer += dt; if (this.timer > INTERVAL) { ... }
```

## CRITICAL: Do NOT Change Existing Function Signatures

Adding parameters to existing functions (like `moveEnemy`, `tickMovement`)
requires updating EVERY call site. Instead:
- Access `world` directly in your new system — don't thread it through existing functions.
- Create new helper functions rather than modifying existing ones.

## Game Loop Order (World.ts tick)

```
1.  tickMovement    — player & enemy movement
2.  tickCombat      — melee attacks
3.  tickProjectiles — arrow/projectile movement & collision
3.5 Phase transitions — explode wrong-phase enemies
4.  tickAI          — enemy behavior (lion/ghost/stag)
5.  tickTurrets     — turret targeting & firing
6.  tickSpawning    — enemy spawn checks
7.  tickBuildingRegen
8.  tickCurrency    — walk-to-earn Source
9.  tickRespawns
10. cleanupDead
11. tickPersistence — flush Source to DB
12. tickPartyUpdates
13. broadcast       — send snapshots to all players
← Add new rule systems here, before step 13 (broadcast)
```

## How to Add a New System (most common rule pattern)

### Step 1: Add constants

```typescript
// packages/shared/src/constants.ts — add at the bottom
export const MY_EFFECT_RADIUS = 64;
export const MY_EFFECT_INTERVAL = 5000; // ms
```

### Step 2: Create the system

```typescript
// server/src/systems/MyRuleSystem.ts
import type { World } from '../world/World.js';
import { SAFE_ZONE_RADIUS, MY_EFFECT_RADIUS, MY_EFFECT_INTERVAL } from '@plainscape/shared';

let lastCheck = 0;

export function tickMyRule(world: World, delta: number): void {
  const now = Date.now();
  if (now - lastCheck < MY_EFFECT_INTERVAL) return;
  lastCheck = now;

  // Skip if not the right time of day
  if (world.dayPhase !== 'day') return;

  for (const [, player] of world.players) {
    if (player.dead) continue;
    if (Math.hypot(player.x, player.y) < SAFE_ZONE_RADIUS) continue;
    // Apply effect...
  }
}
```

### Step 3: Wire into World.ts

```typescript
// In World.ts — add import at top:
import { tickMyRule } from '../systems/MyRuleSystem.js';

// In tick() method — add before step 13 (broadcast):
// 12.8 My rule effect
tickMyRule(this, delta);
```

### Step 4: (If visible to client) Add to snapshots

If your rule creates visible entities, they need a `toSnap()` method and must be
added to the broadcast loop in `World.ts broadcast()` alongside existing entities.

Each entity needs:
- `id: number` — unique ID
- `toSnap(): SnapEntity` — returns snapshot data with at minimum `{ id, kind, x, y }`
- Add your new kind to `EntityKind` in `packages/shared/src/types.ts`

Then in `World.ts broadcast()`, add them to `entityJsonParts` using `getSnapJson(entity)`.

### Step 5: (If visible to client) Add rendering

In `client/src/rendering/Renderer.ts`, add a draw call in the `render()` method.
Draw using the Canvas 2D API (`ctx.fillRect`, `ctx.arc`, `ctx.fillStyle`, etc.).

Access entities from `state.entities` (a Map of interpolated SnapEntity objects).
Filter by `entity.kind === 'your_kind'`.

### Step 6: (If visible to client) Add to minimap

Any new visible entity, structure, or terrain zone should also appear on the minimap in
`client/src/ui/HudRenderer.ts`. Use a distinct color and/or small shape appropriate to
the entity type (colored dots for enemies, small shapes for structures, shaded regions
for terrain effects like zones or hazards).

### Step 7: Build

Run the build command provided in the system prompt to verify compilation.

## Template: Periodic World Effect

```typescript
// server/src/systems/EffectSystem.ts
import type { World } from '../world/World.js';
import { SAFE_ZONE_RADIUS } from '@plainscape/shared';

const INTERVAL = 5000; // ms between checks
let lastTick = 0;

export function tickEffect(world: World, delta: number): void {
  const now = Date.now();
  if (now - lastTick < INTERVAL) return;
  lastTick = now;

  for (const [, player] of world.players) {
    if (player.dead) continue;
    if (Math.hypot(player.x, player.y) < SAFE_ZONE_RADIUS) continue;
    // Your effect logic here
  }
}
```

## Template: Stat/Speed Modifier

```typescript
// To modify player speed: edit MovementSystem.ts, find the line:
//   let speed = (PLAYER_SPEED + player.statLevels.moveSpeed * ...) * delta;
// Add your modifier AFTER that line:
//   if (someCondition) speed *= 0.5; // 50% slowdown

// To modify damage: edit CombatSystem.ts similarly
// To modify enemy stats: edit the relevant AI file in systems/ai/
//   Lion: systems/ai/LionAI.ts  Ghost: systems/ai/GhostAI.ts  Stag: systems/ai/StagAI.ts
```

## Template: New Visible Entity/Zone

```typescript
// 1. Entity class (server/src/entities/MyEntity.ts)
import type { SnapEntity } from '@plainscape/shared';

export class MyEntity {
  readonly id: number;
  x: number;
  y: number;
  markedForRemoval = false;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  toSnap(): SnapEntity {
    return { id: this.id, kind: 'my_kind', x: this.x, y: this.y };
  }
}

// 2. Add 'my_kind' to EntityKind in packages/shared/src/types.ts
// 3. Add world.myEntities = new Map() in World.ts
// 4. Add to broadcast loop in World.ts
// 5. Add rendering in client/src/rendering/Renderer.ts
```
