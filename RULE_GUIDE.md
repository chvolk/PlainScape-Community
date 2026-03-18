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

// ID generation — ALWAYS use this for new entity IDs
import { generateId } from '../utils/IdGenerator.js';
const id = generateId();  // returns unique auto-incrementing number
// NEVER call world.nextEntityId() — that method does NOT exist
```

## RuleHelpers — Convenience Imports

```typescript
import {
  killPlayer, awardSource,       // from CombatHelpers (via CombatSystem)
  moveEnemy,                     // from MovementSystem
  generateId,                    // from IdGenerator — use for new entity IDs
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
import { generateId } from '../utils/IdGenerator.js';

export class MyEntity {
  readonly id: number;
  x: number;
  y: number;
  markedForRemoval = false;

  constructor(x: number, y: number) {
    this.id = generateId();  // ALWAYS use generateId() for entity IDs
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

## Inlined Source Code — Key Classes

These are the ACTUAL source files so you do NOT need to read them.

### Entity base class (server/src/entities/Entity.ts)

```typescript
import { generateId } from '../utils/IdGenerator.js';
import type { EntityKind, Vec2 } from '@plainscape/shared';

export class Entity {
  readonly id: number;
  readonly kind: EntityKind;
  x: number;
  y: number;
  facing: number = 0;
  markedForRemoval: boolean = false;

  constructor(kind: EntityKind, x: number, y: number, id?: number) {
    this.id = id ?? generateId();  // Auto-generates ID if not provided
    this.kind = kind;
    this.x = x;
    this.y = y;
  }

  distanceTo(other: Entity | Vec2): number {
    const ox = 'x' in other ? other.x : 0;
    const oy = 'y' in other ? other.y : 0;
    return Math.hypot(this.x - ox, this.y - oy);
  }

  distanceToOrigin(): number {
    return Math.hypot(this.x, this.y);
  }
}
```

### Enemy base class (server/src/entities/Enemy.ts)

```typescript
import { Entity } from './Entity.js';
import type { EntityKind, SnapEntity } from '@plainscape/shared';

export type AIState = 'idle' | 'chase' | 'attack' | 'flee';

export class Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  aggroRange: number;
  aiState: AIState = 'idle';
  targetId: number | null = null;
  lastAttackTime: number = 0;
  spawnX: number;
  spawnY: number;
  meleeBonusDamage: number = 0;
  rangedBonusDamage: number = 0;
  stunUntil: number = 0;
  lastBuildingAttack: number = 0;
  wanderAngle: number = Math.random() * Math.PI * 2;
  wanderNextChange: number = 0;

  constructor(
    kind: EntityKind, x: number, y: number,
    hp: number, speed: number, damage: number,
    attackRange: number, attackCooldown: number, aggroRange: number,
  ) {
    super(kind, x, y);  // ID generated automatically by Entity base class
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.damage = damage;
    this.attackRange = attackRange;
    this.attackCooldown = attackCooldown;
    this.aggroRange = aggroRange;
    this.spawnX = x;
    this.spawnY = y;
  }

  toSnap(): SnapEntity {
    let anim: 'idle' | 'walk' | 'punch' | 'lunge' | undefined;
    if (this.aiState === 'chase' || this.aiState === 'flee') anim = 'walk';
    else if (this.aiState === 'attack') anim = 'punch';
    return {
      id: this.id, kind: this.kind, x: this.x, y: this.y,
      hp: this.hp, maxHp: this.maxHp, facing: this.facing, anim,
    };
  }
}
```

### Lion entity example (server/src/entities/Lion.ts)

Shows how to create a concrete enemy subclass:

```typescript
import { Enemy } from './Enemy.js';
import type { SnapEntity } from '@plainscape/shared';
import {
  LION_HP, LION_SPEED, LION_DAMAGE,
  LION_ATTACK_RANGE, LION_ATTACK_COOLDOWN, LION_AGGRO_RANGE,
} from '@plainscape/shared';

export class Lion extends Enemy {
  constructor(x: number, y: number) {
    super('lion', x, y, LION_HP, LION_SPEED, LION_DAMAGE,
      LION_ATTACK_RANGE, LION_ATTACK_COOLDOWN, LION_AGGRO_RANGE);
  }
  // Override toSnap() only if you need custom anim states
}
```

### Projectile entity (server/src/entities/Projectile.ts)

```typescript
import { Entity } from './Entity.js';
import type { SnapEntity } from '@plainscape/shared';

export type ProjectileOwnerType = 'player' | 'enemy' | 'turret';

export class Projectile extends Entity {
  vx: number; vy: number; damage: number;
  ownerId: number; ownerType: ProjectileOwnerType;
  createdAt: number; ttl: number;
  whitelist: string[] | null;

  constructor(
    x: number, y: number, vx: number, vy: number,
    damage: number, ownerId: number, ownerType: ProjectileOwnerType,
    whitelist: string[] | null = null,
  ) {
    super('projectile', x, y);  // ID auto-generated
    this.vx = vx; this.vy = vy; this.damage = damage;
    this.ownerId = ownerId; this.ownerType = ownerType;
    this.createdAt = Date.now(); this.ttl = PROJECTILE_TTL;
    this.whitelist = whitelist;
  }
}
```

### Player key properties (server/src/entities/Player.ts)

```typescript
// Player extends Entity (kind = 'player')
player.hp          // current HP (number)
player.maxHp       // max HP (number)
player.dead        // boolean — NOT "isDead"
player.source      // current unbanked Source
player.bankedSource // banked Source
player.username    // string
player.x, player.y // world position
player.respawnAt   // null or timestamp (ms)
player.shieldActive // boolean
player.partyId     // number | null
player.buildingCount // number
player.statLevels  // PlayerStatLevels object with moveSpeed, meleeCooldown, etc.
```

### World entity management methods

```typescript
// These are the ONLY methods for adding/removing entities:
world.addEnemy(enemy: Enemy): void      // adds to world.enemies Map + chunk spatial index
world.removeEnemy(enemy: Enemy): void   // removes from Map + chunk
world.addProjectile(proj: Projectile): void
world.addBuilding(building: Building): void    // also persists to DB
world.removeBuilding(building: Building): void // also deletes from DB

// Communication
world.sendEvent(player, 'kill', '+8 Source')   // sends event to one player
world.broadcastAll({ type: 'event', kind: 'phase', message: 'Something happened!' })

// There is NO world.nextEntityId() method. Use generateId() instead.
// There is NO world.addEntity() method. Use the specific add methods above.
```

### ChunkManager spatial queries

```typescript
// Get all entities near a world position (3x3 chunk neighborhood):
const nearby = world.chunks.getNearbyEntities(x, y);
// Returns: { players: Player[], enemies: Enemy[], projectiles: Projectile[], buildings: Building[] }

// Get extended radius entities (used in broadcast):
const nearby = world.chunks.getEntitiesInRadius(x, y, radius);
// Same return type as getNearbyEntities

// Check if a grid cell has a building:
const building = world.chunks.getBuildingAtCell(cellX, cellY);
// Returns: Building | null    (cellX/Y = Math.floor(worldX / CELL_SIZE))

// Check if a cell is blocked for movement:
const blocked = world.chunks.isCellBlocked(cellX, cellY, username?);
// Returns: boolean (gates are passable by owner/whitelisted)
```

### EntityKind type (packages/shared/src/types.ts)

```typescript
export type EntityKind = 'player' | 'lion' | 'ghost' | 'stag' | 'projectile' | 'building';
// When adding a new visible entity kind, add it here.
// Example: export type EntityKind = 'player' | 'lion' | 'ghost' | 'stag' | 'projectile' | 'building' | 'tar_pit';

export type DayPhase = 'day' | 'dawn' | 'dusk' | 'night';
export type AnimState = 'idle' | 'walk' | 'punch' | 'lunge' | 'shield' | 'parry' | 'shoot' | 'dead' | 'windup' | 'pounce' | 'crouch' | 'dash';
```

### Adding entities to broadcast (World.ts broadcast method)

```typescript
// In World.ts broadcast(), entities are added to entityJsonParts per player.
// The pattern for each entity type is:
for (const myEntity of nearby.myEntities) {  // or iterate world.myEntities
  if (myEntity.markedForRemoval) continue;
  const distSq = (myEntity.x - player.x) ** 2 + (myEntity.y - player.y) ** 2;
  if (distSq <= viewRadiusSq) {
    entityJsonParts.push(getSnapJson(myEntity));
  }
}
// getSnapJson() calls entity.toSnap() and caches the JSON string
```

## COMMON MISTAKES — Avoid These

```
❌ world.nextEntityId()        → ✅ generateId() from '../utils/IdGenerator.js'
❌ player.isDead               → ✅ player.dead
❌ enemy.dead                  → ✅ enemy.markedForRemoval
❌ world.addEntity(e)          → ✅ world.addEnemy(e) / world.addProjectile(e) / world.addBuilding(e)
❌ new Enemy(id, ...)          → ✅ new Enemy(kind, x, y, hp, speed, damage, ...) — ID is auto-generated
❌ import from '/app/...'      → ✅ import from relative path ('./...' or '../...')
❌ import from 'shared/...'    → ✅ import from '@plainscape/shared'
❌ new Lion(id, x, y)          → ✅ new Lion(x, y) — all stats come from constants
❌ timer += dt; if(timer>N)    → ✅ if (now - lastCheck > N) { lastCheck = now; ... }
❌ modifying moveEnemy() sig   → ✅ create a new helper function instead
```
