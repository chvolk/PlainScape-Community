// server/src/main.ts
import path8 from "path";
import { readFileSync as readFileSync2 } from "fs";

// server/src/utils/IdGenerator.ts
var nextId = 1;
function generateId() {
  return nextId++;
}
function ensureIdAbove(id) {
  if (id >= nextId) {
    nextId = id + 1;
  }
}

// server/src/world/Chunk.ts
var Chunk = class {
  cx;
  cy;
  players = /* @__PURE__ */ new Set();
  enemies = /* @__PURE__ */ new Set();
  projectiles = /* @__PURE__ */ new Set();
  buildings = /* @__PURE__ */ new Map();
  // cellKey -> Building
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;
  }
  get isEmpty() {
    return this.players.size === 0 && this.enemies.size === 0 && this.projectiles.size === 0 && this.buildings.size === 0;
  }
};

// packages/shared/src/constants.ts
var TICK_RATE = 15;
var TICK_MS = 1e3 / TICK_RATE;
var CELL_SIZE = 32;
var CHUNK_SIZE = 512;
var SAFE_ZONE_RADIUS = 1300;
var VIEW_RADIUS = 1600;
var BUILDING_VIEW_RADIUS = 2400;
var PLAYER_SPEED = 150;
var PLAYER_HP = 10;
var PLAYER_SIZE = 20;
var RESPAWN_TIME = 3e3;
var INACTIVITY_TIMEOUT = 5 * 60 * 1e3;
var PUNCH_DAMAGE = 2;
var PUNCH_RANGE = 52;
var PUNCH_COOLDOWN = 900;
var PUNCH_ARC = Math.PI / 2;
var LUNGE_DAMAGE = 3;
var LUNGE_DASH_DIST = 160;
var LUNGE_AOE_RADIUS = 48;
var LUNGE_COOLDOWN = 2e3;
var LUNGE_MOVE_COOLDOWN = 800;
var LUNGE_STUN_DURATION = 1200;
var PUNCH_KNOCKBACK = 20;
var SHIELD_DURATION = 2e3;
var SHIELD_COOLDOWN = 12e3;
var PARRY_WINDOW = 200;
var PARRY_COOLDOWN = 3e3;
var PARRY_REFLECT_MULT = 1.5;
var PARRY_PROJECTILE_SPEED_MULT = 1.5;
var SAFE_ZONE_HEAL_INTERVAL = 3e3;
var SAFE_ZONE_HEAL_AMOUNT = 1;
var ARROW_DAMAGE = 2;
var ARROW_SPEED = 240;
var ARROW_COOLDOWN = 1e3;
var ARROW_TTL = 1e3;
var LION_HP = 6;
var LION_SPEED = 100;
var LION_DAMAGE = 1;
var LION_BUILDING_DAMAGE = 3;
var LION_ATTACK_RANGE = 36;
var LION_ATTACK_COOLDOWN = 3e3;
var LION_MELEE_COOLDOWN = 800;
var LION_AGGRO_RANGE = 250;
var LION_MELEE_BONUS = 0;
var LION_RANGED_BONUS = 1;
var LION_POUNCE_WINDUP = 400;
var LION_POUNCE_DURATION = 200;
var LION_POUNCE_RANGE = 180;
var LION_SWIPE_DURATION = 250;
var LION_SWIPE_RANGE = 68;
var LION_SWIPE_ARC = Math.PI / 2;
var LION_RECOVERY_DURATION = 200;
var DASH_DISTANCE = 64;
var DASH_COOLDOWN = 1800;
var DASH_DURATION = 100;
var GHOST_HP = 6;
var GHOST_SPEED = 80;
var GHOST_DAMAGE = 1;
var GHOST_ATTACK_RANGE = 280;
var GHOST_ATTACK_COOLDOWN = 1400;
var GHOST_PREFERRED_DIST = 180;
var GHOST_AGGRO_RANGE = 320;
var GHOST_MELEE_BONUS = 1;
var GHOST_RANGED_BONUS = 0;
var GHOST_PROJECTILE_SPEED = 180;
var GHOST_PROJECTILE_SPEED_SCALE = 15e-5;
var GHOST_PROJECTILE_TTL = 5e3;
var GHOST_PROJECTILE_HOMING = 0.4;
var GHOST_BUILDING_DAMAGE = 3;
var GHOST_BURST_COOLDOWN = 6e3;
var GHOST_BURST_WINDUP = 500;
var GHOST_BURST_SHOTS = 2;
var GHOST_BURST_INTERVAL = 150;
var GHOST_PHASE_DURATION = 2e3;
var GHOST_PHASE_COOLDOWN_MIN = 4e3;
var GHOST_PHASE_COOLDOWN_MAX = 7e3;
var STAG_HP = 300;
var STAG_SPEED = 90;
var STAG_MELEE_DAMAGE = 2;
var STAG_FIRE_BREATH_DAMAGE = 4;
var STAG_MELEE_RANGE = 48;
var STAG_MELEE_COOLDOWN = 1200;
var STAG_FIRE_BREATH_RANGE = 200;
var STAG_FIRE_BREATH_COOLDOWN = 2e3;
var STAG_FIRE_BREATH_AOE_RADIUS = 60;
var STAG_AGGRO_RANGE = 400;
var STAG_CHARGE_SPEED = 350;
var STAG_CHARGE_DAMAGE = 5;
var STAG_CHARGE_COOLDOWN = 5e3;
var STAG_CHARGE_RANGE = 250;
var STAG_CHARGE_DURATION = 800;
var STAG_CHARGE_AOE_RADIUS = 80;
var STAG_CHARGE_AOE_DAMAGE = 3;
var STAG_FIRE_BREATH_SPEED = 260;
var TURRET_PROJECTILE_SPEED = 200;
var TURRET_FIRE_RATE = 2500;
var TURRET_RANGE = 300;
var TURRET_DAMAGE = 3;
var TURRET_AOE_RADIUS = 40;
var PROJECTILE_SIZE = 6;
var PROJECTILE_TTL = 3e3;
var NO_BUILD_BUFFER = 130;
var WALL_HP = 18;
var GATE_HP = 9;
var TURRET_HP = 20;
var BED_HP = 10;
var BUILDING_REGEN_RATE = 1;
var BUILDING_REGEN_INTERVAL = 5e3;
var PLAYER_BUILDING_DAMAGE = 3;
var PLAYER_LUNGE_BUILDING_DAMAGE = 5;
var WALL_COST = 10;
var GATE_COST = 15;
var TURRET_COST = 80;
var BED_COST = 20;
var MAX_BUILDINGS_PER_PLAYER = 100;
var MAX_BUILD_RANGE = 5 * CELL_SIZE;
var SOURCE_WALK_INTERVAL = 5e3;
var SOURCE_WALK_AMOUNT = 1;
var SOURCE_DEATH_AMOUNT = 3;
var SOURCE_LION_KILL_AMOUNT = 4;
var SOURCE_GHOST_KILL_AMOUNT = 4;
var SOURCE_TRANSITION_BONUS = 2;
var SOURCE_PLAYER_KILL_AMOUNT = 20;
var SOURCE_BUILDING_DESTROY = 5;
var BED_HEAL_RADIUS = 80;
var BED_HEAL_INTERVAL = 2e3;
var BED_HEAL_AMOUNT = 1;
var BANK_WITHDRAW_FEE = 0.1;
var BANK_NPC_RANGE = 80;
var SUGGESTION_COST = 200;
var VOTE_COST = 50;
var SCRIBE_NPC_RANGE = 80;
var BANKER_POS = { x: 120, y: -60 };
var SCRIBE_POS = { x: -120, y: -60 };
var SPAWN_CHECK_INTERVAL = 3e3;
var SPAWN_PER_PLAYER_BASE = 2.5;
var SPAWN_DISTANCE_SCALE = 3e-4;
var MAX_ENEMIES = 300;
var MAX_LIONS_NEAR_PLAYER = 8;
var MAX_GHOSTS_NEAR_PLAYER = 8;
var ENEMY_DESPAWN_DIST = 1800;
var SPAWN_SUPPRESSION_DURATION = 3e4;
var STAT_LEVEL_COST = 100;
var STAT_MAX_LEVEL = 25;
var STAT_INCREMENTS = {
  moveSpeed: 4,
  // +4 units/sec per level (base 150)
  knockback: 5,
  // +5 units per level (base 20)
  meleeRange: 2,
  // +2 units per level (base 52)
  projectileSpeed: 6,
  // +6 units/sec per level (base 240)
  projectileTtl: 50,
  // +50ms per level (base 1800ms)
  lungeAoe: 2,
  // +2 units per level (base 48)
  lungeDist: 4,
  // +4 units per level (base 160)
  shieldDuration: 300,
  // +300ms per level (base 2000ms)
  dashDist: 3.2
  // +3.2 units per level (base 64) — +80 at max = ~2.5 tiles
};
var STAT_NAMES = [
  "moveSpeed",
  "knockback",
  "meleeRange",
  "projectileSpeed",
  "projectileTtl",
  "lungeAoe",
  "lungeDist",
  "shieldDuration",
  "dashDist"
];
var MAX_PARTY_SIZE = 10;
var USERNAME_MAX_LENGTH = 20;
var HEARTBEAT_INTERVAL = 3e4;
var HEARTBEAT_TIMEOUT = 9e4;
var DEFAULT_REGISTRY_URL = "https://plainscape.world";
var DEFAULT_MAX_PLAYERS = 100;

// packages/shared/src/types.ts
function defaultStatLevels() {
  return {
    moveSpeed: 0,
    knockback: 0,
    meleeRange: 0,
    projectileSpeed: 0,
    projectileTtl: 0,
    lungeAoe: 0,
    lungeDist: 0,
    shieldDuration: 0,
    dashDist: 0
  };
}

// packages/shared/src/utils.ts
function angleBetween(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}
function isAngleWithinArc(angle, facing, arc) {
  let diff = angle - facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= arc / 2;
}
function chunkCoords(x, y, chunkSize) {
  return {
    cx: Math.floor(x / chunkSize),
    cy: Math.floor(y / chunkSize)
  };
}
function cellKey(cellX, cellY) {
  return `${cellX},${cellY}`;
}

// server/src/world/ChunkManager.ts
var ChunkManager = class {
  chunks = /* @__PURE__ */ new Map();
  buildingGrid = /* @__PURE__ */ new Map();
  // "cellX,cellY" -> Building
  chunkKeyFor(x, y) {
    const { cx, cy } = chunkCoords(x, y, CHUNK_SIZE);
    return `${cx},${cy}`;
  }
  getOrCreateChunk(cx, cy) {
    const key = `${cx},${cy}`;
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cy);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }
  getChunkAt(x, y) {
    const { cx, cy } = chunkCoords(x, y, CHUNK_SIZE);
    return this.getOrCreateChunk(cx, cy);
  }
  addPlayer(player) {
    this.getChunkAt(player.x, player.y).players.add(player);
  }
  removePlayer(player) {
    this.getChunkAt(player.x, player.y).players.delete(player);
  }
  addEnemy(enemy) {
    this.getChunkAt(enemy.x, enemy.y).enemies.add(enemy);
  }
  removeEnemy(enemy) {
    this.getChunkAt(enemy.x, enemy.y).enemies.delete(enemy);
  }
  addProjectile(proj) {
    this.getChunkAt(proj.x, proj.y).projectiles.add(proj);
  }
  removeProjectile(proj) {
    this.getChunkAt(proj.x, proj.y).projectiles.delete(proj);
  }
  addBuilding(building) {
    const key = cellKey(building.cellX, building.cellY);
    this.buildingGrid.set(key, building);
    this.getChunkAt(building.x, building.y).buildings.set(key, building);
  }
  removeBuilding(building) {
    const key = cellKey(building.cellX, building.cellY);
    this.buildingGrid.delete(key);
    this.getChunkAt(building.x, building.y).buildings.delete(key);
  }
  getBuildingAtCell(cellX, cellY) {
    return this.buildingGrid.get(cellKey(cellX, cellY)) ?? null;
  }
  /** Transfer entity between chunks if it moved to a new one */
  updateEntityChunk(entity, oldX, oldY) {
    const oldKey = this.chunkKeyFor(oldX, oldY);
    const newKey = this.chunkKeyFor(entity.x, entity.y);
    if (oldKey === newKey) return;
    const oldChunk = this.chunks.get(oldKey);
    const newChunk = this.getChunkAt(entity.x, entity.y);
    if (oldChunk) {
      if (entity.kind === "player") oldChunk.players.delete(entity);
      else if (entity.kind === "lion" || entity.kind === "ghost" || entity.kind === "stag") oldChunk.enemies.delete(entity);
      else if (entity.kind === "projectile") oldChunk.projectiles.delete(entity);
    }
    if (entity.kind === "player") newChunk.players.add(entity);
    else if (entity.kind === "lion" || entity.kind === "ghost" || entity.kind === "stag") newChunk.enemies.add(entity);
    else if (entity.kind === "projectile") newChunk.projectiles.add(entity);
  }
  /** Get all entities within the 3x3 chunk neighborhood of a position */
  getNearbyEntities(x, y) {
    const { cx, cy } = chunkCoords(x, y, CHUNK_SIZE);
    const players = [];
    const enemies = [];
    const projectiles = [];
    const buildings = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const chunk = this.chunks.get(`${cx + dx},${cy + dy}`);
        if (!chunk) continue;
        for (const p of chunk.players) players.push(p);
        for (const e of chunk.enemies) enemies.push(e);
        for (const pr of chunk.projectiles) projectiles.push(pr);
        for (const [, b] of chunk.buildings) buildings.push(b);
      }
    }
    return { players, enemies, projectiles, buildings };
  }
  /** Get all chunks that have players nearby (5x5 neighborhood) */
  getActiveChunks() {
    const active = /* @__PURE__ */ new Set();
    for (const [, chunk] of this.chunks) {
      if (chunk.players.size === 0) continue;
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const key = `${chunk.cx + dx},${chunk.cy + dy}`;
          const c = this.chunks.get(key);
          if (c) active.add(c);
        }
      }
    }
    return active;
  }
  /** Check if a cell is blocked for movement */
  isCellBlocked(cellX, cellY, username) {
    const building = this.getBuildingAtCell(cellX, cellY);
    if (!building) return false;
    if (username && building.isPassableBy(username)) return false;
    return building.isSolid();
  }
  getEntitiesInRadius(x, y, radius) {
    const { cx, cy } = chunkCoords(x, y, CHUNK_SIZE);
    const range = Math.ceil(radius / CHUNK_SIZE);
    const players = [];
    const enemies = [];
    const projectiles = [];
    const buildings = [];
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const chunk = this.chunks.get(`${cx + dx},${cy + dy}`);
        if (!chunk) continue;
        for (const p of chunk.players) players.push(p);
        for (const e of chunk.enemies) enemies.push(e);
        for (const pr of chunk.projectiles) projectiles.push(pr);
        for (const [, b] of chunk.buildings) buildings.push(b);
      }
    }
    return { players, enemies, projectiles, buildings };
  }
  /** Clean up empty chunks that have no players nearby */
  cleanup() {
    const toDelete = [];
    for (const [key, chunk] of this.chunks) {
      if (chunk.isEmpty) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this.chunks.delete(key);
    }
  }
};

// server/src/world/DayNightCycle.ts
var CYCLE_MS = 30 * 60 * 1e3;
var DAWN_END = 5 * 60 * 1e3;
var DAY_END = 15 * 60 * 1e3;
var DUSK_END = 20 * 60 * 1e3;
var phaseOverride = null;
var cycleOffset = 0;
var offsetInitialized = false;
function initCycleOnFirstPlayer() {
  if (offsetInitialized) return;
  offsetInitialized = true;
  cycleOffset = Math.floor(Math.random() * CYCLE_MS);
}
function setPhaseOverride(phase) {
  phaseOverride = phase;
}
function cyclePosition() {
  return (Date.now() + cycleOffset) % CYCLE_MS;
}
function getDayPhase() {
  if (phaseOverride) return phaseOverride;
  const pos = cyclePosition();
  if (pos < DAWN_END) return "dawn";
  if (pos < DAY_END) return "day";
  if (pos < DUSK_END) return "dusk";
  return "night";
}
function shouldSpawnLions() {
  const phase = getDayPhase();
  return phase === "day" || phase === "dawn" || phase === "dusk";
}
function shouldSpawnGhosts() {
  const phase = getDayPhase();
  return phase === "night" || phase === "dawn" || phase === "dusk";
}

// server/src/entities/Entity.ts
var Entity = class {
  id;
  kind;
  x;
  y;
  facing = 0;
  markedForRemoval = false;
  constructor(kind, x, y, id) {
    this.id = id ?? generateId();
    this.kind = kind;
    this.x = x;
    this.y = y;
  }
  get pos() {
    return { x: this.x, y: this.y };
  }
  distanceTo(other) {
    const ox = "x" in other ? other.x : 0;
    const oy = "y" in other ? other.y : 0;
    return Math.hypot(this.x - ox, this.y - oy);
  }
  distanceToOrigin() {
    return Math.hypot(this.x, this.y);
  }
};

// server/src/entities/Building.ts
var HP_MAP = {
  wall: WALL_HP,
  gate: GATE_HP,
  turret: TURRET_HP,
  bed: BED_HP
};
var Building = class extends Entity {
  btype;
  cellX;
  cellY;
  ownerId;
  ownerName;
  hp;
  maxHp;
  whitelist;
  partyWhitelist = [];
  // temporary party-based whitelist
  open = false;
  // gates only
  lastAttackTime = 0;
  // turrets only
  lastRegenTime = Date.now();
  ownerColors = null;
  constructor(btype, cellX, cellY, ownerId, ownerName, id) {
    super("building", cellX * CELL_SIZE + CELL_SIZE / 2, cellY * CELL_SIZE + CELL_SIZE / 2, id);
    this.btype = btype;
    this.cellX = cellX;
    this.cellY = cellY;
    this.ownerId = ownerId;
    this.ownerName = ownerName;
    this.hp = HP_MAP[btype];
    this.maxHp = HP_MAP[btype];
    this.whitelist = [ownerName];
  }
  isWhitelisted(username) {
    return this.whitelist.includes(username) || this.partyWhitelist.includes(username);
  }
  isPassableBy(username) {
    if (this.btype === "gate") {
      return this.open || this.isWhitelisted(username);
    }
    if (this.btype === "bed") return true;
    return false;
  }
  isSolid() {
    return this.btype === "wall" || this.btype === "turret" || this.btype === "gate" && !this.open;
  }
  blocksProjectiles() {
    return this.isSolid();
  }
  toSnap() {
    return {
      id: this.id,
      kind: "building",
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      btype: this.btype,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      facing: this.btype === "turret" ? this.facing : void 0,
      whitelist: this.btype === "gate" || this.btype === "turret" ? this.whitelist : void 0,
      open: this.btype === "gate" ? this.open : void 0,
      colors: (this.btype === "bed" || this.btype === "turret") && this.ownerColors ? this.ownerColors : void 0
    };
  }
};

// server/src/systems/MovementSystem.ts
function tickMovement(players, enemies, chunks, delta) {
  for (const [, player] of players) {
    if (player.dead) continue;
    const now = Date.now();
    if (now < player.moveCooldownUntil || now < player.stunUntil) {
      player.isMoving = false;
      continue;
    }
    if (player.anim === "dash") player.anim = "idle";
    const mdx = player.getMoveDx();
    const mdy = player.getMoveDy();
    if (mdx === 0 && mdy === 0) {
      player.isMoving = false;
      if (player.anim === "walk" || player.anim === "punch" || player.anim === "lunge" || player.anim === "shoot") player.anim = "idle";
      continue;
    }
    const len = Math.hypot(mdx, mdy);
    const nx = mdx / len;
    const ny = mdy / len;
    let speed = (PLAYER_SPEED + player.statLevels.moveSpeed * STAT_INCREMENTS.moveSpeed) * delta;
    if (Math.hypot(player.x, player.y) < SAFE_ZONE_RADIUS) speed *= 1.3;
    const newX = player.x + nx * speed;
    const newY = player.y + ny * speed;
    const oldX = player.x;
    const oldY = player.y;
    player.x = newX;
    if (isCollidingWithBuildings(player.x, player.y, player.username, chunks)) {
      player.x = oldX;
    }
    player.y = newY;
    if (isCollidingWithBuildings(player.x, player.y, player.username, chunks)) {
      player.y = oldY;
    }
    player.isMoving = player.x !== oldX || player.y !== oldY;
    const anim = player.anim;
    if (anim !== "parry" && anim !== "shield" && anim !== "dash") {
      if (player.isMoving) {
        player.anim = "walk";
      } else {
        player.anim = "idle";
      }
    }
    chunks.updateEntityChunk(player, oldX, oldY);
  }
}
function isCollidingWithBuildings(x, y, username, chunks) {
  const half = PLAYER_SIZE / 2;
  const minCellX = Math.floor((x - half) / CELL_SIZE);
  const maxCellX = Math.floor((x + half) / CELL_SIZE);
  const minCellY = Math.floor((y - half) / CELL_SIZE);
  const maxCellY = Math.floor((y + half) / CELL_SIZE);
  for (let cx = minCellX; cx <= maxCellX; cx++) {
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      if (chunks.isCellBlocked(cx, cy, username)) {
        return true;
      }
    }
  }
  return false;
}
function moveEnemy(enemy, targetX, targetY, chunks, delta) {
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;
  const totalMove = enemy.speed * delta;
  const nx = dx / dist;
  const ny = dy / dist;
  const startX = enemy.x;
  const startY = enemy.y;
  const maxStep = CELL_SIZE * 0.5;
  const steps = Math.max(1, Math.ceil(totalMove / maxStep));
  const stepDist = totalMove / steps;
  for (let i = 0; i < steps; i++) {
    const oldX = enemy.x;
    const oldY = enemy.y;
    enemy.x += nx * stepDist;
    enemy.y += ny * stepDist;
    if (isEnemyCollidingWithBuildings(enemy.x, enemy.y, chunks)) {
      enemy.x = oldX;
      enemy.y = oldY;
      enemy.x += nx * stepDist;
      if (isEnemyCollidingWithBuildings(enemy.x, enemy.y, chunks)) {
        enemy.x = oldX;
      }
      enemy.y += ny * stepDist;
      if (isEnemyCollidingWithBuildings(enemy.x, enemy.y, chunks)) {
        enemy.y = oldY;
      }
      if (enemy.x === oldX && enemy.y === oldY) break;
    }
  }
  if (enemy.kind === "stag" && Math.hypot(enemy.x, enemy.y) < SAFE_ZONE_RADIUS) {
    enemy.x = startX;
    enemy.y = startY;
  }
  enemy.facing = Math.atan2(dy, dx);
  chunks.updateEntityChunk(enemy, startX, startY);
}
function isEnemyCollidingWithBuildings(x, y, chunks) {
  const half = 12;
  const minCellX = Math.floor((x - half) / CELL_SIZE);
  const maxCellX = Math.floor((x + half) / CELL_SIZE);
  const minCellY = Math.floor((y - half) / CELL_SIZE);
  const maxCellY = Math.floor((y + half) / CELL_SIZE);
  for (let cx = minCellX; cx <= maxCellX; cx++) {
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      const building = chunks.getBuildingAtCell(cx, cy);
      if (building && building.isSolid()) return true;
    }
  }
  return false;
}

// server/src/entities/Projectile.ts
var Projectile = class extends Entity {
  vx;
  vy;
  damage;
  ownerId;
  ownerType;
  createdAt;
  ttl;
  /** For turret projectiles: whitelist of usernames not to hit */
  whitelist;
  homingTargetId = null;
  homingRate = 0;
  aoeRadius = 0;
  /** For turret projectiles: the username of the player who owns the turret */
  turretOwnerName = "";
  /** Override visual type on client (e.g. 'stag' for fire breath) */
  visualSource = null;
  /** Set when projectile is parry-reflected */
  parried = false;
  constructor(x, y, vx, vy, damage, ownerId, ownerType, whitelist = null) {
    super("projectile", x, y);
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.ownerId = ownerId;
    this.ownerType = ownerType;
    this.createdAt = Date.now();
    this.ttl = PROJECTILE_TTL;
    this.whitelist = whitelist;
  }
  toSnap() {
    const snap = {
      id: this.id,
      kind: "projectile",
      x: this.x,
      y: this.y,
      facing: Math.atan2(this.vy, this.vx),
      projSource: this.visualSource ?? this.ownerType
    };
    if (this.parried) snap.parried = true;
    return snap;
  }
};

// server/src/entities/Enemy.ts
var Enemy = class extends Entity {
  hp;
  maxHp;
  speed;
  damage;
  attackRange;
  attackCooldown;
  aggroRange;
  aiState = "idle";
  targetId = null;
  aggroTargetId = null;
  aggroTurretId = null;
  lastAttackTime = 0;
  // Wander anchor
  spawnX;
  spawnY;
  // Bonus damage from specific attack types
  meleeBonusDamage = 0;
  rangedBonusDamage = 0;
  // Stun (from lunge hits)
  stunUntil = 0;
  // Building attack cooldown (separate from combat)
  lastBuildingAttack = 0;
  // Active wandering
  wanderAngle = Math.random() * Math.PI * 2;
  wanderNextChange = 0;
  constructor(kind, x, y, hp, speed, damage, attackRange, attackCooldown, aggroRange) {
    super(kind, x, y);
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
  /** Whether this enemy is currently intangible (takes no damage) */
  get intangible() {
    return false;
  }
  toSnap() {
    let anim;
    if (this.aiState === "chase" || this.aiState === "flee") anim = "walk";
    else if (this.aiState === "attack") anim = "punch";
    return {
      id: this.id,
      kind: this.kind,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      facing: this.facing,
      anim
    };
  }
};

// server/src/entities/ScorchedStag.ts
var ScorchedStag = class _ScorchedStag extends Enemy {
  lastFireBreathTime = 0;
  lastChargeTime = 0;
  lastMeleeTime = 0;
  charging = false;
  chargeStartTime = 0;
  chargeTargetX = 0;
  chargeTargetY = 0;
  chaseRampStart = 0;
  /** Tracks damage dealt by each player: token → { username, damage } */
  damageLog = /* @__PURE__ */ new Map();
  /** Recent damage window for aggro targeting: playerId → damage in current 4s window */
  recentDamage = /* @__PURE__ */ new Map();
  recentDamageWindowStart = Date.now();
  static AGGRO_WINDOW = 4e3;
  // 4 seconds
  logDamage(token, username, amount) {
    const entry = this.damageLog.get(token);
    if (entry) {
      entry.damage += amount;
    } else {
      this.damageLog.set(token, { username, damage: amount });
    }
  }
  /** Record damage for aggro targeting */
  logRecentDamage(playerId, amount) {
    const now = Date.now();
    if (now - this.recentDamageWindowStart > _ScorchedStag.AGGRO_WINDOW) {
      this.recentDamage.clear();
      this.recentDamageWindowStart = now;
    }
    this.recentDamage.set(playerId, (this.recentDamage.get(playerId) || 0) + amount);
  }
  /** Get the player ID that dealt the most damage in the current window, or null */
  getTopAggroPlayerId() {
    const now = Date.now();
    if (now - this.recentDamageWindowStart > _ScorchedStag.AGGRO_WINDOW) {
      this.recentDamage.clear();
      this.recentDamageWindowStart = now;
      return null;
    }
    let topId = null;
    let topDmg = 0;
    for (const [id, dmg] of this.recentDamage) {
      if (dmg > topDmg) {
        topDmg = dmg;
        topId = id;
      }
    }
    return topId;
  }
  constructor(x, y) {
    super(
      "stag",
      x,
      y,
      STAG_HP,
      STAG_SPEED,
      STAG_MELEE_DAMAGE,
      STAG_MELEE_RANGE,
      STAG_MELEE_COOLDOWN,
      STAG_AGGRO_RANGE
    );
  }
};

// server/src/systems/PartySystem.ts
var nextPartyId = 1;
var parties = /* @__PURE__ */ new Map();
var pendingInvites = /* @__PURE__ */ new Map();
function syncPartyWhitelists(world2, partyId) {
  if (partyId === null) return;
  const memberNames = parties.get(partyId);
  if (!memberNames) return;
  const nameList = Array.from(memberNames);
  for (const [, building] of world2.buildingsById) {
    if (building.btype !== "gate" && building.btype !== "turret") continue;
    if (!memberNames.has(building.ownerName)) continue;
    building.partyWhitelist = nameList.filter((n) => !building.whitelist.includes(n));
  }
}
function clearPartyWhitelists(world2, username) {
  for (const [, building] of world2.buildingsById) {
    if (building.ownerName !== username) continue;
    building.partyWhitelist = [];
  }
}
function getPartyMembers(world2, player) {
  if (player.partyId === null) return [player];
  const memberNames = parties.get(player.partyId);
  if (!memberNames) return [player];
  const members = [];
  for (const name of memberNames) {
    const p = world2.playersByUsername.get(name);
    if (p) members.push(p);
  }
  return members;
}
function handlePartyInvite(world2, sender, targetUsername) {
  if (sender.username === targetUsername) return;
  const target = world2.playersByUsername.get(targetUsername);
  if (!target) {
    sender.send({ type: "event", kind: "source", message: `Player "${targetUsername}" not found.` });
    return;
  }
  if (sender.partyId !== null && target.partyId === sender.partyId) {
    sender.send({ type: "event", kind: "source", message: `${targetUsername} is already in your party.` });
    return;
  }
  let invites = pendingInvites.get(targetUsername);
  if (!invites) {
    invites = /* @__PURE__ */ new Set();
    pendingInvites.set(targetUsername, invites);
  }
  if (invites.has(sender.username)) {
    sender.send({ type: "event", kind: "source", message: `Already sent an invite to ${targetUsername}.` });
    return;
  }
  invites.add(sender.username);
  sender.send({ type: "event", kind: "source", message: `Party invite sent to ${targetUsername}.` });
  target.send({ type: "party_invite_received", fromUsername: sender.username });
}
function handlePartyRespond(world2, player, fromUsername, accept) {
  const invites = pendingInvites.get(player.username);
  if (!invites || !invites.has(fromUsername)) return;
  invites.delete(fromUsername);
  const sender = world2.playersByUsername.get(fromUsername);
  if (!accept) {
    if (sender) {
      sender.send({ type: "event", kind: "source", message: `${player.username} declined your party invite.` });
    }
    return;
  }
  if (!sender) {
    player.send({ type: "event", kind: "source", message: `${fromUsername} is no longer online.` });
    return;
  }
  if (sender.partyId !== null) {
    const existing = parties.get(sender.partyId);
    if (existing && existing.size >= MAX_PARTY_SIZE) {
      player.send({ type: "event", kind: "source", message: "Party is full." });
      return;
    }
  }
  if (player.partyId !== null) {
    leaveParty(world2, player);
  }
  if (sender.partyId === null) {
    const pid = nextPartyId++;
    sender.partyId = pid;
    sender.partySourceEarned = 0;
    parties.set(pid, /* @__PURE__ */ new Set([sender.username]));
  }
  player.partyId = sender.partyId;
  player.partySourceEarned = 0;
  parties.get(sender.partyId).add(player.username);
  syncPartyWhitelists(world2, sender.partyId);
  world2.broadcastAll({
    type: "notification",
    text: `${player.username} joined ${sender.username}'s party`
  });
  broadcastPartyUpdate(world2, sender.partyId);
}
function leaveParty(world2, player) {
  if (player.partyId === null) return;
  const pid = player.partyId;
  const members = parties.get(pid);
  if (members) {
    members.delete(player.username);
    clearPartyWhitelists(world2, player.username);
    if (members.size <= 1) {
      for (const name of members) {
        clearPartyWhitelists(world2, name);
        const p = world2.playersByUsername.get(name);
        if (p) {
          p.partyId = null;
          p.send({ type: "party_update", members: [], memberInfo: [] });
        }
      }
      parties.delete(pid);
    } else {
      syncPartyWhitelists(world2, pid);
      broadcastPartyUpdate(world2, pid);
    }
  }
  player.partyId = null;
  player.send({ type: "party_update", members: [], memberInfo: [] });
}
function broadcastPartyUpdate(world2, partyId) {
  const members = parties.get(partyId);
  if (!members) return;
  const memberList = Array.from(members);
  const memberInfo = memberList.map((name) => {
    const p = world2.playersByUsername.get(name);
    return { username: name, sourceEarned: p ? p.partySourceEarned : 0 };
  });
  for (const name of members) {
    const p = world2.playersByUsername.get(name);
    if (p) {
      p.send({ type: "party_update", members: memberList, memberInfo });
    }
  }
}
var lastPartyUpdateTime = 0;
var PARTY_UPDATE_INTERVAL = 2e3;
function tickPartyUpdates(world2, now) {
  if (now - lastPartyUpdateTime < PARTY_UPDATE_INTERVAL) return;
  lastPartyUpdateTime = now;
  for (const [pid] of parties) {
    broadcastPartyUpdate(world2, pid);
  }
}
function onPlayerDisconnect(world2, player) {
  pendingInvites.delete(player.username);
  leaveParty(world2, player);
}

// server/src/systems/CombatHelpers.ts
var DISTANCE_BONUS_EDGE = SAFE_ZONE_RADIUS + NO_BUILD_BUFFER;
var DISTANCE_BONUS_STEP = 700;
var DISTANCE_BONUS_PER_STEP = 2;
var DISTANCE_BONUS_CAP = 25;
function distanceBonus(x, y) {
  const dist = Math.hypot(x, y) - DISTANCE_BONUS_EDGE;
  if (dist <= 0) return 0;
  return Math.min(DISTANCE_BONUS_CAP, Math.floor(dist / DISTANCE_BONUS_STEP) * DISTANCE_BONUS_PER_STEP);
}
function isAtDistanceCap(x, y) {
  const dist = Math.hypot(x, y) - DISTANCE_BONUS_EDGE;
  return dist > 0 && Math.floor(dist / DISTANCE_BONUS_STEP) * DISTANCE_BONUS_PER_STEP >= DISTANCE_BONUS_CAP;
}
function awardSource(player, amount, world2) {
  if (world2 && player.partyId !== null) {
    const members = getPartyMembers(world2, player);
    if (members.length > 1) {
      const earnerGuaranteed = Math.floor(amount * 0.4);
      const remainder = amount - earnerGuaranteed;
      const perMember = Math.floor(remainder / members.length);
      for (const m of members) {
        const share = m.id === player.id ? earnerGuaranteed + perMember : perMember;
        m.source += share;
        m.totalSourceGenerated += share;
        m.sourceFlushDirty += share;
        m.partySourceEarned += share;
      }
      return;
    }
  }
  player.source += amount;
  player.totalSourceGenerated += amount;
  player.sourceFlushDirty += amount;
  if (player.partyId !== null) player.partySourceEarned += amount;
}
function killPlayer(world2, victim, killer, opts) {
  victim.dead = true;
  victim.hp = 0;
  victim.anim = "dead";
  victim.shieldActive = false;
  victim.respawnAt = Date.now() + RESPAWN_TIME;
  const lostSource = victim.source;
  if (killer && killer.kind === "player" && !opts?.turretOwner) {
    const killerPlayer = killer;
    const totalGain = SOURCE_PLAYER_KILL_AMOUNT + lostSource;
    awardSource(killerPlayer, totalGain, world2);
    world2.sendEvent(killerPlayer, "kill", `You killed ${victim.username}! +${totalGain} Source`);
    victim.source = 0;
    world2.sendEvent(victim, "death", `Killed by ${killerPlayer.username}! Lost ${lostSource} unbanked Source.`);
    const sameParty = killerPlayer.partyId !== null && killerPlayer.partyId === victim.partyId;
    const notifText = sameParty ? `${victim.username} was betrayed by ${killerPlayer.username} and robbed of ${lostSource} Source!` : `${victim.username} was murdered by ${killerPlayer.username} and lost ${lostSource} Source!`;
    world2.broadcastAll({ type: "notification", text: notifText });
  } else if (opts?.turretOwner) {
    const ownerPlayer = killer;
    if (ownerPlayer) {
      const totalGain = SOURCE_PLAYER_KILL_AMOUNT + lostSource;
      awardSource(ownerPlayer, totalGain, world2);
      world2.sendEvent(ownerPlayer, "kill", `Your turret killed ${victim.username}! +${totalGain} Source`);
    }
    victim.source = 0;
    world2.sendEvent(victim, "death", `Killed by ${opts.turretOwner}'s turret! Lost ${lostSource} unbanked Source.`);
    world2.broadcastAll({ type: "notification", text: `${victim.username} was killed by ${opts.turretOwner}'s turret and lost ${lostSource} Source!` });
  } else {
    const lost = Math.floor(lostSource / 2);
    victim.source -= lost;
    awardSource(victim, SOURCE_DEATH_AMOUNT, world2);
    world2.sendEvent(victim, "death", `You died! Lost ${lost} Source. +${SOURCE_DEATH_AMOUNT} Source`);
    let notifText;
    if (killer) {
      switch (killer.kind) {
        case "lion":
          notifText = `${victim.username} was eaten by lions`;
          break;
        case "ghost":
          notifText = `${victim.username} was killed by ghosts`;
          break;
        case "stag":
          notifText = `The Scorched Stag claimed ${victim.username}'s soul`;
          break;
        default:
          notifText = `${victim.username} was killed by ${killer.kind}`;
      }
    } else {
      notifText = `${victim.username} was killed by the wilds`;
    }
    world2.broadcastAll({ type: "notification", text: notifText });
  }
}
function tickRespawns(world2) {
  const now = Date.now();
  for (const [, player] of world2.players) {
    if (!player.dead) continue;
    if (player.respawnAt && now >= player.respawnAt && !player.readyToRespawn) {
      player.respawnAt = null;
      player.readyToRespawn = true;
      player.send({ type: "ready_to_respawn" });
      continue;
    }
    if (player.readyToRespawn && player.pendingRespawn) {
      const oldX = player.x;
      const oldY = player.y;
      if (player.bedX !== null && player.bedY !== null) {
        player.x = player.bedX;
        player.y = player.bedY;
      } else {
        player.x = (Math.random() - 0.5) * 200;
        player.y = (Math.random() - 0.5) * 200;
      }
      world2.chunks.updateEntityChunk(player, oldX, oldY);
      player.dead = false;
      player.hp = PLAYER_HP;
      player.respawnAt = null;
      player.readyToRespawn = false;
      player.pendingRespawn = false;
      player.anim = "idle";
    }
  }
}

// server/src/systems/StagRewards.ts
function handleStagDeath(world2, stag) {
  const totalPool = STAG_HP;
  const damageLog = stag.damageLog;
  if (damageLog.size === 0) return;
  let totalDamage = 0;
  for (const entry of damageLog.values()) {
    totalDamage += entry.damage;
  }
  if (totalDamage <= 0) return;
  const heroes = [];
  for (const [token, entry] of damageLog) {
    const proportion = entry.damage / totalDamage;
    const reward = Math.max(1, Math.round(proportion * totalPool));
    heroes.push({ username: entry.username, damage: entry.damage, reward });
    const onlinePlayer = findPlayerByToken(world2, token);
    if (onlinePlayer) {
      awardSource(onlinePlayer, reward, world2);
      world2.sendEvent(onlinePlayer, "kill", `The Scorched Stag has fallen! +${reward} Source`);
    } else {
      world2.db.addTotalSource(token, reward);
    }
  }
  heroes.sort((a, b) => b.damage - a.damage);
  const lines = ["Heroes have slain the Stag!"];
  for (const hero of heroes) {
    lines.push(`${hero.username}: ${hero.damage} dmg (+${hero.reward} Source)`);
  }
  world2.db.addNotice(lines.join("\n"));
  world2.broadcastAll({
    type: "event",
    kind: "boss",
    message: "The Scorched Stag has been slain!"
  });
  world2.refreshSignData?.();
}
function findPlayerByToken(world2, token) {
  for (const [, player] of world2.players) {
    if (player.token === token) return player;
  }
  return null;
}

// server/src/systems/CombatSystem.ts
function tickCombat(world2) {
  const now = Date.now();
  for (const [, player] of world2.players) {
    if (player.dead) continue;
    if (player.parryActive && now >= player.parryUntil) {
      player.parryActive = false;
      if (player.anim === "parry") player.anim = "idle";
    }
    if (player.pendingParry && !player.parryActive && !player.shieldActive && now >= player.parryCooldownUntil) {
      player.parryActive = true;
      player.parryUntil = now + PARRY_WINDOW;
      player.parryCooldownUntil = now + PARRY_COOLDOWN;
      player.anim = "parry";
    }
    player.pendingParry = false;
    if (player.shieldActive && now >= player.shieldUntil) {
      player.shieldActive = false;
      player.anim = "idle";
    }
    if (player.pendingShield && !player.shieldActive && !player.parryActive && now >= player.shieldCooldownUntil) {
      player.shieldActive = true;
      const shieldDur = SHIELD_DURATION + player.statLevels.shieldDuration * STAT_INCREMENTS.shieldDuration;
      player.shieldUntil = now + shieldDur;
      player.shieldCooldownUntil = now + SHIELD_COOLDOWN;
      player.anim = "shield";
      player.pendingShield = false;
    }
    player.pendingShield = false;
    if (player.pendingDash && now >= player.dashCooldownUntil) {
      const mdx = player.getMoveDx();
      const mdy = player.getMoveDy();
      if (mdx !== 0 || mdy !== 0) {
        const len = Math.hypot(mdx, mdy);
        const nx = mdx / len;
        const ny = mdy / len;
        const dashDist = DASH_DISTANCE + player.statLevels.dashDist * STAT_INCREMENTS.dashDist;
        const steps = 8;
        const stepDist = dashDist / steps;
        for (let i = 0; i < steps; i++) {
          const testX = player.x + nx * stepDist;
          const testY = player.y + ny * stepDist;
          const halfSize = PLAYER_SIZE / 2;
          const minCX = Math.floor((testX - halfSize) / CELL_SIZE);
          const maxCX = Math.floor((testX + halfSize) / CELL_SIZE);
          const minCY = Math.floor((testY - halfSize) / CELL_SIZE);
          const maxCY = Math.floor((testY + halfSize) / CELL_SIZE);
          let blocked = false;
          for (let cx = minCX; cx <= maxCX && !blocked; cx++) {
            for (let cy = minCY; cy <= maxCY && !blocked; cy++) {
              if (world2.chunks.isCellBlocked(cx, cy, player.username)) {
                blocked = true;
              }
            }
          }
          if (blocked) break;
          player.x = testX;
          player.y = testY;
        }
        world2.chunks.updateEntityChunk(player, player.x - nx * dashDist, player.y - ny * dashDist);
        player.dashCooldownUntil = now + DASH_COOLDOWN;
        player.moveCooldownUntil = now + DASH_DURATION;
        player.anim = "dash";
      }
    }
    player.pendingDash = false;
    if (player.shieldActive || player.parryActive || now < player.stunUntil) {
      player.pendingPunch = null;
      player.pendingLunge = null;
      player.pendingShoot = null;
      continue;
    }
    const inSafeZone = Math.hypot(player.x, player.y) < SAFE_ZONE_RADIUS;
    if (inSafeZone) {
      if (player.pendingPunch !== null || player.pendingLunge !== null || player.pendingShoot !== null) {
        if (now - player.lastSafeZoneWarn >= 2e3) {
          world2.sendEvent(player, "source", "You cannot attack in the safe zone.");
          player.lastSafeZoneWarn = now;
        }
      }
      player.pendingPunch = null;
      player.pendingLunge = null;
      player.pendingShoot = null;
    }
    if (player.pendingPunch !== null && now >= player.punchCooldownUntil) {
      const punchRange = PUNCH_RANGE + player.statLevels.meleeRange * STAT_INCREMENTS.meleeRange;
      performConeAttack(world2, player, player.pendingPunch, PUNCH_DAMAGE, punchRange);
      player.punchCooldownUntil = now + PUNCH_COOLDOWN;
      player.anim = "punch";
      player.pendingPunch = null;
    }
    if (player.pendingLunge !== null && now >= player.lungeCooldownUntil) {
      performLunge(world2, player, player.pendingLunge);
      player.lungeCooldownUntil = now + LUNGE_COOLDOWN;
      player.moveCooldownUntil = now + LUNGE_MOVE_COOLDOWN;
      player.anim = "lunge";
      player.pendingLunge = null;
    }
    if (player.pendingShoot !== null && now >= player.arrowCooldownUntil) {
      const facing = player.pendingShoot;
      const arrowSpd = ARROW_SPEED + player.statLevels.projectileSpeed * STAT_INCREMENTS.projectileSpeed;
      const vx = Math.cos(facing) * arrowSpd;
      const vy = Math.sin(facing) * arrowSpd;
      const proj = new Projectile(player.x, player.y, vx, vy, ARROW_DAMAGE, player.id, "player");
      proj.ttl = ARROW_TTL + player.statLevels.projectileTtl * STAT_INCREMENTS.projectileTtl;
      world2.addProjectile(proj);
      player.arrowCooldownUntil = now + ARROW_COOLDOWN;
      player.anim = "shoot";
      player.pendingShoot = null;
    }
    player.pendingPunch = null;
    player.pendingLunge = null;
    player.pendingShoot = null;
    const distFromOrigin = Math.hypot(player.x, player.y);
    if (distFromOrigin < SAFE_ZONE_RADIUS && player.hp < player.maxHp) {
      if (now - player.lastHealTime >= SAFE_ZONE_HEAL_INTERVAL) {
        player.hp = Math.min(player.maxHp, player.hp + SAFE_ZONE_HEAL_AMOUNT);
        player.lastHealTime = now;
      }
    }
    if (player.hp < player.maxHp && now - player.lastBedHealTime >= BED_HEAL_INTERVAL) {
      let nearBed = false;
      if (player.bedX !== null && player.bedY !== null) {
        if (Math.hypot(player.x - player.bedX, player.y - player.bedY) <= BED_HEAL_RADIUS) {
          nearBed = true;
        }
      }
      if (!nearBed && player.partyId !== null) {
        for (const [, b] of world2.buildingsById) {
          if (b.btype !== "bed" || b.markedForRemoval) continue;
          if (b.ownerId === player.id) continue;
          const bedOwner = world2.players.get(b.ownerId);
          if (!bedOwner || bedOwner.partyId !== player.partyId) continue;
          if (Math.hypot(player.x - b.x, player.y - b.y) <= BED_HEAL_RADIUS) {
            nearBed = true;
            break;
          }
        }
      }
      if (nearBed) {
        player.hp = Math.min(player.maxHp, player.hp + BED_HEAL_AMOUNT);
        player.lastBedHealTime = now;
      }
    }
  }
}
function performConeAttack(world2, attacker, facing, damage, range) {
  const nearby = world2.chunks.getNearbyEntities(attacker.x, attacker.y);
  const knockbackDist = PUNCH_KNOCKBACK + attacker.statLevels.knockback * STAT_INCREMENTS.knockback;
  for (const enemy of nearby.enemies) {
    if (enemy.markedForRemoval || enemy.intangible) continue;
    const dist = Math.hypot(enemy.x - attacker.x, enemy.y - attacker.y);
    if (dist > range) continue;
    const angle = angleBetween(attacker.pos, enemy.pos);
    if (!isAngleWithinArc(angle, facing, PUNCH_ARC)) continue;
    const totalDamage = damage + enemy.meleeBonusDamage;
    enemy.hp -= totalDamage;
    enemy.aggroTargetId = attacker.id;
    if (enemy instanceof ScorchedStag) {
      enemy.logDamage(attacker.token, attacker.username, totalDamage);
      enemy.logRecentDamage(attacker.id, totalDamage);
    }
    const kbAngle = Math.atan2(enemy.y - attacker.y, enemy.x - attacker.x);
    enemy.x += Math.cos(kbAngle) * knockbackDist;
    enemy.y += Math.sin(kbAngle) * knockbackDist;
    if (enemy.hp <= 0) {
      enemy.markedForRemoval = true;
      world2.suppressSpawnsAt(enemy.x, enemy.y);
      world2.broadcastAll({
        type: "event",
        kind: "destroy",
        message: `__fx_explode_${Math.round(enemy.x)}_${Math.round(enemy.y)}_${enemy.kind}__`
      });
      if (enemy instanceof ScorchedStag) {
        handleStagDeath(world2, enemy);
      } else {
        const phase = getDayPhase();
        let killReward = SOURCE_GHOST_KILL_AMOUNT;
        if (enemy.kind === "lion") {
          killReward = SOURCE_LION_KILL_AMOUNT;
          if (phase === "dawn") killReward += SOURCE_TRANSITION_BONUS;
        } else if (enemy.kind === "ghost") {
          if (phase === "dusk") killReward += SOURCE_TRANSITION_BONUS;
        }
        killReward += distanceBonus(attacker.x, attacker.y);
        awardSource(attacker, killReward, world2);
        world2.sendEvent(attacker, "kill", `You killed a ${enemy.kind}! +${killReward} Source`);
      }
    }
  }
  for (const other of nearby.players) {
    if (other.id === attacker.id || other.dead) continue;
    if (other.shieldActive) continue;
    if (Math.hypot(other.x, other.y) < SAFE_ZONE_RADIUS) continue;
    const dist = Math.hypot(other.x - attacker.x, other.y - attacker.y);
    if (dist > range) continue;
    const angle = angleBetween(attacker.pos, other.pos);
    if (!isAngleWithinArc(angle, facing, PUNCH_ARC)) continue;
    if (other.parryActive) {
      const reflectDmg = Math.ceil(damage * PARRY_REFLECT_MULT);
      attacker.hp -= reflectDmg;
      if (attacker.hp <= 0) {
        killPlayer(world2, attacker, other);
      }
      continue;
    }
    other.hp -= damage;
    const kbAngle = Math.atan2(other.y - attacker.y, other.x - attacker.x);
    other.x += Math.cos(kbAngle) * knockbackDist;
    other.y += Math.sin(kbAngle) * knockbackDist;
    if (other.hp <= 0) {
      killPlayer(world2, other, attacker);
    }
  }
  for (const building of nearby.buildings) {
    if (building.markedForRemoval) continue;
    const dist = Math.hypot(building.x - attacker.x, building.y - attacker.y);
    if (dist > range) continue;
    const angle = angleBetween(attacker.pos, building.pos);
    if (!isAngleWithinArc(angle, facing, PUNCH_ARC)) continue;
    building.hp -= PLAYER_BUILDING_DAMAGE;
    if (building.hp <= 0) {
      world2.removeBuilding(building);
      if (building.ownerName !== attacker.username) {
        awardSource(attacker, SOURCE_BUILDING_DESTROY, world2);
        world2.sendEvent(attacker, "destroy", `Destroyed a ${building.btype}! +${SOURCE_BUILDING_DESTROY} Source`);
      }
    }
  }
}
function performLunge(world2, player, facing) {
  const lungeDist = LUNGE_DASH_DIST + player.statLevels.lungeDist * STAT_INCREMENTS.lungeDist;
  const oldX = player.x;
  const oldY = player.y;
  const dx = Math.cos(facing);
  const dy = Math.sin(facing);
  const stepSize = CELL_SIZE;
  const steps = Math.ceil(lungeDist / stepSize);
  let finalDist = lungeDist;
  for (let i = 1; i <= steps; i++) {
    const checkDist = Math.min(i * stepSize, lungeDist);
    const checkX = oldX + dx * checkDist;
    const checkY = oldY + dy * checkDist;
    const cellX = Math.floor(checkX / CELL_SIZE);
    const cellY = Math.floor(checkY / CELL_SIZE);
    const building = world2.chunks.getBuildingAtCell(cellX, cellY);
    if (building && !building.markedForRemoval && building.isSolid() && !building.isPassableBy(player.username)) {
      finalDist = Math.max(0, checkDist - stepSize);
      building.hp -= PLAYER_LUNGE_BUILDING_DAMAGE;
      if (building.hp <= 0) {
        world2.removeBuilding(building);
        if (building.ownerName !== player.username) {
          awardSource(player, SOURCE_BUILDING_DESTROY, world2);
          world2.sendEvent(player, "destroy", `Destroyed a ${building.btype}! +${SOURCE_BUILDING_DESTROY} Source`);
        }
      }
      break;
    }
  }
  player.x = oldX + dx * finalDist;
  player.y = oldY + dy * finalDist;
  player.facing = facing;
  world2.chunks.updateEntityChunk(player, oldX, oldY);
  const lungeAoe = LUNGE_AOE_RADIUS + player.statLevels.lungeAoe * STAT_INCREMENTS.lungeAoe;
  const nearby = world2.chunks.getNearbyEntities(player.x, player.y);
  const now = Date.now();
  for (const enemy of nearby.enemies) {
    if (enemy.markedForRemoval || enemy.intangible) continue;
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist > lungeAoe) continue;
    const totalDamage = LUNGE_DAMAGE + enemy.meleeBonusDamage;
    enemy.hp -= totalDamage;
    enemy.stunUntil = now + LUNGE_STUN_DURATION;
    enemy.aggroTargetId = player.id;
    if (enemy instanceof ScorchedStag) {
      enemy.logDamage(player.token, player.username, totalDamage);
      enemy.logRecentDamage(player.id, totalDamage);
    }
    if (enemy.hp <= 0) {
      enemy.markedForRemoval = true;
      world2.suppressSpawnsAt(enemy.x, enemy.y);
      world2.broadcastAll({
        type: "event",
        kind: "destroy",
        message: `__fx_explode_${Math.round(enemy.x)}_${Math.round(enemy.y)}_${enemy.kind}__`
      });
      if (enemy instanceof ScorchedStag) {
        handleStagDeath(world2, enemy);
      } else {
        const lungePhase = getDayPhase();
        let lungeKillReward = SOURCE_GHOST_KILL_AMOUNT;
        if (enemy.kind === "lion") {
          lungeKillReward = SOURCE_LION_KILL_AMOUNT;
          if (lungePhase === "dawn") lungeKillReward += SOURCE_TRANSITION_BONUS;
        } else if (enemy.kind === "ghost") {
          if (lungePhase === "dusk") lungeKillReward += SOURCE_TRANSITION_BONUS;
        }
        lungeKillReward += distanceBonus(player.x, player.y);
        awardSource(player, lungeKillReward, world2);
        world2.sendEvent(player, "kill", `You killed a ${enemy.kind}! +${lungeKillReward} Source`);
      }
    }
  }
  for (const other of nearby.players) {
    if (other.id === player.id || other.dead) continue;
    if (other.shieldActive) continue;
    if (Math.hypot(other.x, other.y) < SAFE_ZONE_RADIUS) continue;
    const dist = Math.hypot(other.x - player.x, other.y - player.y);
    if (dist > lungeAoe) continue;
    if (other.parryActive) {
      const reflectDmg = Math.ceil(LUNGE_DAMAGE * PARRY_REFLECT_MULT);
      player.hp -= reflectDmg;
      if (player.hp <= 0) {
        killPlayer(world2, player, other);
      }
      continue;
    }
    other.hp -= LUNGE_DAMAGE;
    other.stunUntil = now + LUNGE_STUN_DURATION;
    if (other.hp <= 0) {
      killPlayer(world2, other, player);
    }
  }
  for (const building of nearby.buildings) {
    if (building.markedForRemoval) continue;
    const dist = Math.hypot(building.x - player.x, building.y - player.y);
    if (dist > lungeAoe) continue;
    building.hp -= PLAYER_LUNGE_BUILDING_DAMAGE;
    if (building.hp <= 0) {
      world2.removeBuilding(building);
      if (building.ownerName !== player.username) {
        awardSource(player, SOURCE_BUILDING_DESTROY, world2);
        world2.sendEvent(player, "destroy", `Destroyed a ${building.btype}! +${SOURCE_BUILDING_DESTROY} Source`);
      }
    }
  }
}

// server/src/systems/ProjectileSystem.ts
function applyEnemyHit(world2, proj, enemy) {
  if (enemy.intangible) {
    if (proj.ownerType === "turret") {
      enemy.aggroTurretId = proj.ownerId;
    } else {
      enemy.aggroTargetId = proj.ownerId;
    }
    return;
  }
  const damage = proj.damage + enemy.rangedBonusDamage;
  enemy.hp -= damage;
  if (proj.ownerType === "turret") {
    enemy.aggroTurretId = proj.ownerId;
  } else {
    enemy.aggroTargetId = proj.ownerId;
  }
  if (enemy instanceof ScorchedStag && proj.ownerType === "player") {
    const owner = world2.players.get(proj.ownerId);
    if (owner) {
      enemy.logDamage(owner.token, owner.username, damage);
      enemy.logRecentDamage(proj.ownerId, damage);
    }
  }
  if (enemy.hp <= 0) {
    enemy.markedForRemoval = true;
    world2.suppressSpawnsAt(enemy.x, enemy.y);
    world2.broadcastAll({
      type: "event",
      kind: "destroy",
      message: `__fx_explode_${Math.round(enemy.x)}_${Math.round(enemy.y)}_${enemy.kind}__`
    });
    if (enemy instanceof ScorchedStag) {
      handleStagDeath(world2, enemy);
    } else if (proj.ownerType === "player") {
      const owner = world2.players.get(proj.ownerId);
      if (owner) {
        const phase = getDayPhase();
        let reward = SOURCE_GHOST_KILL_AMOUNT;
        if (enemy.kind === "lion") {
          reward = SOURCE_LION_KILL_AMOUNT;
          if (phase === "dawn") reward += SOURCE_TRANSITION_BONUS;
        } else if (enemy.kind === "ghost") {
          if (phase === "dusk") reward += SOURCE_TRANSITION_BONUS;
        }
        reward += distanceBonus(owner.x, owner.y);
        awardSource(owner, reward, world2);
        world2.sendEvent(owner, "kill", `You killed a ${enemy.kind}! +${reward} Source`);
      }
    }
  }
}
function tickProjectiles(world2, delta) {
  const now = Date.now();
  const toRemove = [];
  for (const [, proj] of world2.projectiles) {
    if (proj.markedForRemoval) continue;
    if (now - proj.createdAt > proj.ttl) {
      if (proj.ownerType === "turret" && proj.aoeRadius > 0) {
        applyTurretAoe(world2, proj);
        broadcastTurretExplosion(world2, proj);
      }
      toRemove.push(proj);
      continue;
    }
    if (proj.homingTargetId !== null && proj.homingRate > 0) {
      let tx = null;
      let ty = null;
      if (proj.parried) {
        let bestDist = 400;
        const nearby2 = world2.chunks.getNearbyEntities(proj.x, proj.y);
        for (const enemy of nearby2.enemies) {
          if (enemy.markedForRemoval || enemy.intangible) continue;
          const d = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
          if (d < bestDist) {
            bestDist = d;
            tx = enemy.x;
            ty = enemy.y;
          }
        }
      } else {
        const target = world2.players.get(proj.homingTargetId);
        if (target && !target.dead) {
          tx = target.x;
          ty = target.y;
        }
      }
      if (tx !== null && ty !== null) {
        const dx = tx - proj.x;
        const dy = ty - proj.y;
        const desiredAngle = Math.atan2(dy, dx);
        const currentAngle = Math.atan2(proj.vy, proj.vx);
        let angleDiff = desiredAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const maxTurn = proj.homingRate * delta;
        const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
        const newAngle = currentAngle + turn;
        const speed = Math.hypot(proj.vx, proj.vy);
        proj.vx = Math.cos(newAngle) * speed;
        proj.vy = Math.sin(newAngle) * speed;
      }
    }
    const oldX = proj.x;
    const oldY = proj.y;
    proj.x += proj.vx * delta;
    proj.y += proj.vy * delta;
    const wasOutside = Math.hypot(oldX, oldY) >= SAFE_ZONE_RADIUS;
    const nowInside = Math.hypot(proj.x, proj.y) < SAFE_ZONE_RADIUS;
    if (wasOutside && nowInside) {
      toRemove.push(proj);
      continue;
    }
    world2.chunks.updateEntityChunk(proj, oldX, oldY);
    const nearby = world2.chunks.getNearbyEntities(proj.x, proj.y);
    const hitRadius = PROJECTILE_SIZE + PLAYER_SIZE / 2;
    let hit = false;
    if (proj.ownerType === "player" || proj.ownerType === "turret") {
      for (const enemy of nearby.enemies) {
        if (enemy.markedForRemoval) continue;
        const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
        if (dist < hitRadius) {
          hit = true;
          applyEnemyHit(world2, proj, enemy);
          if (proj.aoeRadius > 0) {
            applyTurretAoe(world2, proj, enemy);
            broadcastTurretExplosion(world2, proj);
          }
          break;
        }
      }
    }
    if (!hit) {
      for (const player of nearby.players) {
        if (player.dead) continue;
        if (player.id === proj.ownerId) continue;
        if (player.shieldActive) continue;
        if (proj.whitelist && proj.whitelist.includes(player.username)) continue;
        if (Math.hypot(player.x, player.y) < SAFE_ZONE_RADIUS) continue;
        const dist = Math.hypot(player.x - proj.x, player.y - proj.y);
        if (dist < hitRadius) {
          if (player.parryActive) {
            proj.vx = -proj.vx * PARRY_PROJECTILE_SPEED_MULT;
            proj.vy = -proj.vy * PARRY_PROJECTILE_SPEED_MULT;
            proj.damage = Math.ceil(proj.damage * PARRY_REFLECT_MULT);
            if (!proj.visualSource) {
              proj.visualSource = proj.ownerType;
            }
            proj.ownerId = player.id;
            proj.ownerType = "player";
            proj.parried = true;
            proj.createdAt = Date.now();
            break;
          }
          player.hp -= proj.damage;
          if (player.hp <= 0) {
            if (proj.ownerType === "turret" && proj.turretOwnerName) {
              const owner = world2.playersByUsername.get(proj.turretOwnerName);
              killPlayer(world2, player, owner, { turretOwner: proj.turretOwnerName });
            } else {
              let killer;
              if (proj.ownerType === "player") {
                killer = world2.players.get(proj.ownerId);
              } else if (proj.ownerType === "enemy") {
                killer = world2.enemies.get(proj.ownerId);
              }
              killPlayer(world2, player, killer);
            }
          }
          hit = true;
          break;
        }
      }
    }
    if (!hit) {
      const travelDist = Math.hypot(proj.x - oldX, proj.y - oldY);
      const steps = Math.max(1, Math.ceil(travelDist / (CELL_SIZE * 0.5)));
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 1 : s / steps;
        const sx = oldX + (proj.x - oldX) * t;
        const sy = oldY + (proj.y - oldY) * t;
        const cellX = Math.floor(sx / CELL_SIZE);
        const cellY = Math.floor(sy / CELL_SIZE);
        const building = world2.chunks.getBuildingAtCell(cellX, cellY);
        if (building && !building.markedForRemoval && building.blocksProjectiles()) {
          if (proj.ownerType === "turret" && proj.ownerId === building.id) continue;
          const isProtected = proj.ownerType === "turret" && (building.ownerName === proj.turretOwnerName || proj.whitelist && proj.whitelist.includes(building.ownerName));
          if (!isProtected) {
            const dmg = proj.ownerType === "player" ? PLAYER_BUILDING_DAMAGE : proj.ownerType === "enemy" ? GHOST_BUILDING_DAMAGE : proj.damage;
            building.hp -= dmg;
            if (building.hp <= 0) {
              world2.removeBuilding(building);
              if (proj.ownerType === "player") {
                const owner = world2.players.get(proj.ownerId);
                if (owner && building.ownerName !== owner.username) {
                  awardSource(owner, SOURCE_BUILDING_DESTROY, world2);
                  world2.sendEvent(owner, "destroy", `Destroyed a ${building.btype}! +${SOURCE_BUILDING_DESTROY} Source`);
                }
              }
            }
          }
          if (proj.ownerType === "turret" && proj.aoeRadius > 0) {
            broadcastTurretExplosion(world2, proj);
          }
          hit = true;
          break;
        }
      }
    }
    if (hit) {
      toRemove.push(proj);
    }
  }
  for (const proj of toRemove) {
    proj.markedForRemoval = true;
    world2.chunks.removeProjectile(proj);
    world2.projectiles.delete(proj.id);
  }
}
function applyTurretAoe(world2, proj, alreadyHit) {
  const nearby = world2.chunks.getNearbyEntities(proj.x, proj.y);
  for (const enemy of nearby.enemies) {
    if (enemy === alreadyHit || enemy.markedForRemoval) continue;
    if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < proj.aoeRadius) {
      applyEnemyHit(world2, proj, enemy);
    }
  }
  for (const player of nearby.players) {
    if (player.dead || player.id === proj.ownerId || player.shieldActive) continue;
    if (proj.whitelist && proj.whitelist.includes(player.username)) continue;
    if (Math.hypot(player.x, player.y) < SAFE_ZONE_RADIUS) continue;
    if (Math.hypot(player.x - proj.x, player.y - proj.y) < proj.aoeRadius) {
      player.hp -= proj.damage;
      if (player.hp <= 0) {
        if (proj.turretOwnerName) {
          const owner = world2.playersByUsername.get(proj.turretOwnerName);
          killPlayer(world2, player, owner, { turretOwner: proj.turretOwnerName });
        } else {
          killPlayer(world2, player, void 0);
        }
      }
    }
  }
}
function broadcastTurretExplosion(world2, proj) {
  world2.broadcastAll({
    type: "event",
    kind: "destroy",
    message: `__fx_explode_${Math.round(proj.x)}_${Math.round(proj.y)}_turret__`
  });
}

// server/src/entities/Lion.ts
var Lion = class extends Enemy {
  chaseStartTime = 0;
  chaseLionsSpawned = 0;
  lastChaseSpawnTime = 0;
  isReinforcement = false;
  flankSide = 0;
  // 1 = right flank, -1 = left flank, 0 = head-on
  wanderStartTime = 0;
  // when chase lion started wandering (0 = not wandering)
  // Pounce attack state
  pouncing = false;
  pouncePhase = "windup";
  pounceStartTime = 0;
  pounceTargetX = 0;
  pounceTargetY = 0;
  pounceLandTime = 0;
  // Post-attack recovery crouch
  crouchUntil = 0;
  // Regular melee swipe (separate from pounce cooldown)
  lastMeleeTime = 0;
  constructor(x, y) {
    super(
      "lion",
      x,
      y,
      LION_HP,
      LION_SPEED,
      LION_DAMAGE,
      LION_ATTACK_RANGE,
      LION_ATTACK_COOLDOWN,
      LION_AGGRO_RANGE
    );
    this.meleeBonusDamage = LION_MELEE_BONUS;
    this.rangedBonusDamage = LION_RANGED_BONUS;
  }
  toSnap() {
    const snap = super.toSnap();
    if (this.isReinforcement) snap.sub = "chase";
    if (this.pouncing) {
      if (this.pouncePhase === "windup") snap.anim = "windup";
      else if (this.pouncePhase === "leap") snap.anim = "pounce";
      else snap.anim = "punch";
    } else if (this.crouchUntil > Date.now()) {
      snap.anim = "crouch";
    } else if (Date.now() - this.lastMeleeTime < 250) {
      snap.anim = "punch";
    }
    return snap;
  }
};

// server/src/entities/Ghost.ts
var Ghost = class extends Enemy {
  preferredDist = 180;
  // Scary face burst attack
  burstPhase = "none";
  burstStartTime = 0;
  burstShotsFired = 0;
  lastBurstTime = 0;
  // Phase-out (intangible while wandering)
  phased = false;
  phaseStartTime = 0;
  nextPhaseTime = Date.now() + 3e3 + Math.random() * 4e3;
  // first phase after 3-7s
  constructor(x, y) {
    super(
      "ghost",
      x,
      y,
      GHOST_HP,
      GHOST_SPEED,
      GHOST_DAMAGE,
      GHOST_ATTACK_RANGE,
      GHOST_ATTACK_COOLDOWN,
      GHOST_AGGRO_RANGE
    );
    this.meleeBonusDamage = GHOST_MELEE_BONUS;
    this.rangedBonusDamage = GHOST_RANGED_BONUS;
  }
  get intangible() {
    return this.phased;
  }
  toSnap() {
    const snap = super.toSnap();
    if (this.burstPhase === "windup") {
      snap.anim = "windup";
    } else if (this.burstPhase === "firing") {
      snap.anim = "shoot";
    }
    if (this.phased) {
      snap.anim = "shield";
    }
    return snap;
  }
};

// server/src/systems/ai/AIHelpers.ts
var BUILDING_ATTACK_COOLDOWN = 800;
function getBuildingDamage(enemy) {
  return enemy.kind === "lion" ? LION_BUILDING_DAMAGE : enemy.damage;
}
function isInsideBuilding(x, y, world2) {
  const half = 12;
  const minCX = Math.floor((x - half) / CELL_SIZE);
  const maxCX = Math.floor((x + half) / CELL_SIZE);
  const minCY = Math.floor((y - half) / CELL_SIZE);
  const maxCY = Math.floor((y + half) / CELL_SIZE);
  for (let cx = minCX; cx <= maxCX; cx++) {
    for (let cy = minCY; cy <= maxCY; cy++) {
      const building = world2.chunks.getBuildingAtCell(cx, cy);
      if (building && building.isSolid()) return true;
    }
  }
  return false;
}
function pushOutOfBuilding(enemy, world2) {
  const cellX = Math.floor(enemy.x / CELL_SIZE);
  const cellY = Math.floor(enemy.y / CELL_SIZE);
  for (let radius = 1; radius <= 5; radius++) {
    for (let ox = -radius; ox <= radius; ox++) {
      for (let oy = -radius; oy <= radius; oy++) {
        if (Math.abs(ox) !== radius && Math.abs(oy) !== radius) continue;
        const nx = cellX + ox;
        const ny = cellY + oy;
        const candidateX = nx * CELL_SIZE + CELL_SIZE / 2;
        const candidateY = ny * CELL_SIZE + CELL_SIZE / 2;
        if (!isInsideBuilding(candidateX, candidateY, world2)) {
          enemy.x = candidateX;
          enemy.y = candidateY;
          return;
        }
      }
    }
  }
}
function wander(enemy, delta, world2) {
  const now = Date.now();
  if (now >= enemy.wanderNextChange) {
    const distFromOrigin = Math.hypot(enemy.x, enemy.y);
    const distFromEdge = distFromOrigin - SAFE_ZONE_RADIUS;
    const awayFromOriginAngle = Math.atan2(enemy.y, enemy.x);
    if (distFromEdge < 400) {
      const urgency = 1 - Math.max(0, distFromEdge) / 400;
      const spread = (1 - urgency) * Math.PI * 0.6;
      enemy.wanderAngle = awayFromOriginAngle + (Math.random() - 0.5) * spread;
    } else {
      let angle = Math.random() * Math.PI * 2;
      const nearby = world2.chunks.getNearbyEntities(enemy.x, enemy.y);
      let nearestDist = Infinity;
      let nearestAngle = angle;
      for (const player of nearby.players) {
        if (player.dead) continue;
        const d = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (d < nearestDist && d < 800) {
          nearestDist = d;
          nearestAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        }
      }
      if (nearestDist < 800) {
        angle = nearestAngle + (Math.random() - 0.5) * Math.PI;
      }
      const dotTowardOrigin = Math.cos(angle) * (-enemy.x / distFromOrigin) + Math.sin(angle) * (-enemy.y / distFromOrigin);
      if (dotTowardOrigin > 0.3 && distFromEdge < 800) {
        angle = awayFromOriginAngle + (Math.random() - 0.5) * Math.PI * 0.8;
      }
      enemy.wanderAngle = angle;
    }
    enemy.wanderNextChange = now + 2e3 + Math.random() * 3e3;
  }
  const targetX = enemy.x + Math.cos(enemy.wanderAngle) * 200;
  const targetY = enemy.y + Math.sin(enemy.wanderAngle) * 200;
  moveEnemy(enemy, targetX, targetY, world2.chunks, delta);
}
function attackBlockingBuilding(world2, enemy, target, now) {
  if (now < enemy.lastBuildingAttack + BUILDING_ATTACK_COOLDOWN) return;
  const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
  for (let step = 1; step <= 2; step++) {
    const checkX = enemy.x + Math.cos(angle) * CELL_SIZE * step * 0.5;
    const checkY = enemy.y + Math.sin(angle) * CELL_SIZE * step * 0.5;
    const cellX = Math.floor(checkX / CELL_SIZE);
    const cellY = Math.floor(checkY / CELL_SIZE);
    const building = world2.chunks.getBuildingAtCell(cellX, cellY);
    if (building && building.isSolid()) {
      building.hp -= getBuildingDamage(enemy);
      enemy.lastBuildingAttack = now;
      if (building.hp <= 0) {
        world2.removeBuilding(building);
      }
      return;
    }
  }
}
function tickTurretAggro(world2, enemy, delta) {
  if (enemy.aggroTurretId === null) return false;
  const turret = world2.buildingsById.get(enemy.aggroTurretId);
  if (!turret || turret.btype !== "turret") {
    enemy.aggroTurretId = null;
    return false;
  }
  const dist = Math.hypot(turret.x - enemy.x, turret.y - enemy.y);
  enemy.facing = Math.atan2(turret.y - enemy.y, turret.x - enemy.x);
  if (dist > CELL_SIZE * 1.5) {
    moveEnemy(enemy, turret.x, turret.y, world2.chunks, delta);
    enemy.aiState = "chase";
    const now = Date.now();
    if (now >= enemy.lastBuildingAttack + BUILDING_ATTACK_COOLDOWN) {
      const angle = Math.atan2(turret.y - enemy.y, turret.x - enemy.x);
      for (let step = 1; step <= 2; step++) {
        const checkX = enemy.x + Math.cos(angle) * CELL_SIZE * step * 0.5;
        const checkY = enemy.y + Math.sin(angle) * CELL_SIZE * step * 0.5;
        const cellX = Math.floor(checkX / CELL_SIZE);
        const cellY = Math.floor(checkY / CELL_SIZE);
        const blocking = world2.chunks.getBuildingAtCell(cellX, cellY);
        if (blocking && blocking.isSolid() && blocking.id !== turret.id) {
          blocking.hp -= getBuildingDamage(enemy);
          enemy.lastBuildingAttack = now;
          if (blocking.hp <= 0) {
            world2.removeBuilding(blocking);
          }
          break;
        }
      }
    }
  } else {
    const now = Date.now();
    if (now >= enemy.lastBuildingAttack + BUILDING_ATTACK_COOLDOWN) {
      turret.hp -= getBuildingDamage(enemy);
      enemy.lastBuildingAttack = now;
      enemy.aiState = "attack";
      if (turret.hp <= 0) {
        world2.removeBuilding(turret);
        enemy.aggroTurretId = null;
      }
    }
  }
  return true;
}
function findNearestPlayer(world2, enemy) {
  if (enemy.aggroTargetId !== null) {
    const aggroTarget = world2.players.get(enemy.aggroTargetId);
    if (aggroTarget && !aggroTarget.dead) {
      const dist = Math.hypot(aggroTarget.x - enemy.x, aggroTarget.y - enemy.y);
      if (dist < enemy.aggroRange * 2) {
        return aggroTarget;
      }
    }
    enemy.aggroTargetId = null;
  }
  let nearest = null;
  let nearestDist = enemy.aggroRange;
  const nearby = world2.chunks.getNearbyEntities(enemy.x, enemy.y);
  for (const player of nearby.players) {
    if (player.dead) continue;
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = player;
    }
  }
  return nearest;
}

// server/src/systems/ai/LionAI.ts
var LION_RAMP_DURATION = 3e3;
var LION_MAX_SPEED_MULT = 1.18;
var CHASE_LION_MAX_SPEED_MULT = 1.4;
function tickLion(world2, lion, target, dist, delta) {
  const now = Date.now();
  if (lion.crouchUntil > now) {
    lion.speed = 0;
    lion.facing = Math.atan2(target.y - lion.y, target.x - lion.x);
    return;
  } else if (lion.crouchUntil > 0 && lion.crouchUntil <= now) {
    lion.crouchUntil = 0;
    const targetSpeed = target.getSpeed();
    lion.speed = Math.max(PLAYER_SPEED * LION_MAX_SPEED_MULT, targetSpeed * 1.2);
    lion.chaseStartTime = now - LION_RAMP_DURATION;
    lion.aiState = "chase";
  }
  if (lion.pouncing) {
    const elapsed = now - lion.pounceStartTime;
    lion.aiState = "attack";
    if (lion.pouncePhase === "windup") {
      if (elapsed >= LION_POUNCE_WINDUP) {
        lion.pouncePhase = "leap";
        lion.pounceStartTime = now;
      }
      return;
    }
    if (lion.pouncePhase === "leap") {
      const dx = lion.pounceTargetX - lion.x;
      const dy = lion.pounceTargetY - lion.y;
      const distToTarget = Math.hypot(dx, dy);
      if (distToTarget > 2 && elapsed < LION_POUNCE_DURATION) {
        const leapSpeed = LION_POUNCE_RANGE / (LION_POUNCE_DURATION / 1e3);
        const moveAmount = Math.min(leapSpeed * delta, distToTarget);
        const nx = dx / distToTarget;
        const ny = dy / distToTarget;
        lion.facing = Math.atan2(dy, dx);
        const stepSize = CELL_SIZE * 0.5;
        const steps = Math.max(1, Math.ceil(moveAmount / stepSize));
        const perStep = moveAmount / steps;
        let hitBuilding = false;
        for (let i = 0; i < steps; i++) {
          const nextX = lion.x + nx * perStep;
          const nextY = lion.y + ny * perStep;
          const cellX = Math.floor(nextX / CELL_SIZE);
          const cellY = Math.floor(nextY / CELL_SIZE);
          const building = world2.chunks.getBuildingAtCell(cellX, cellY);
          if (building && building.isSolid()) {
            building.hp -= LION_BUILDING_DAMAGE;
            if (building.hp <= 0) {
              world2.removeBuilding(building);
            }
            lion.pouncing = false;
            lion.pounceLandTime = now;
            lion.crouchUntil = now + LION_RECOVERY_DURATION;
            lion.speed = 0;
            lion.aiState = "attack";
            hitBuilding = true;
            break;
          }
          lion.x = nextX;
          lion.y = nextY;
        }
        if (hitBuilding) return;
      } else {
        lion.pouncePhase = "swipe";
        lion.pounceStartTime = now;
        lion.facing = Math.atan2(target.y - lion.y, target.x - lion.x);
      }
      return;
    }
    if (lion.pouncePhase === "swipe") {
      if (elapsed >= LION_SWIPE_DURATION / 2 && lion.lastAttackTime < lion.pounceStartTime) {
        lion.lastAttackTime = now;
        const nearby = world2.chunks.getNearbyEntities(lion.x, lion.y);
        for (const player of nearby.players) {
          if (player.dead || player.shieldActive) continue;
          const pDist = Math.hypot(player.x - lion.x, player.y - lion.y);
          if (pDist > LION_SWIPE_RANGE) continue;
          const angleToPlayer = Math.atan2(player.y - lion.y, player.x - lion.x);
          let angleDiff = angleToPlayer - lion.facing;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          if (Math.abs(angleDiff) > LION_SWIPE_ARC / 2) continue;
          if (player.parryActive) {
            const reflectDmg = Math.ceil(lion.damage * PARRY_REFLECT_MULT);
            lion.hp -= reflectDmg;
            if (lion.hp <= 0) {
              lion.markedForRemoval = true;
              world2.suppressSpawnsAt(lion.x, lion.y);
              const lionReward = SOURCE_LION_KILL_AMOUNT + (getDayPhase() === "dawn" ? SOURCE_TRANSITION_BONUS : 0) + distanceBonus(player.x, player.y);
              awardSource(player, lionReward, world2);
              world2.sendEvent(player, "kill", `You killed a lion! +${lionReward} Source`);
              world2.broadcastAll({
                type: "event",
                kind: "destroy",
                message: `__fx_explode_${Math.round(lion.x)}_${Math.round(lion.y)}_lion__`
              });
            }
          } else {
            player.hp -= lion.damage;
            if (player.hp <= 0) {
              killPlayer(world2, player, lion);
            }
          }
        }
      }
      if (elapsed >= LION_SWIPE_DURATION) {
        lion.pouncing = false;
        lion.pounceLandTime = now;
        lion.crouchUntil = now + LION_RECOVERY_DURATION;
        lion.speed = 0;
        lion.aiState = "attack";
      }
      return;
    }
  }
  const pounceInitRange = lion.attackRange + LION_POUNCE_RANGE * 0.6;
  if (dist <= pounceInitRange && now >= lion.lastAttackTime + lion.attackCooldown) {
    lion.pouncing = true;
    lion.pouncePhase = "windup";
    lion.pounceStartTime = now;
    lion.aiState = "attack";
    const leadTime = (LION_POUNCE_WINDUP + LION_POUNCE_DURATION) / 1e3;
    const targetSpeed = target.getSpeed();
    const tdx = target.getMoveDx();
    const tdy = target.getMoveDy();
    const leadX = target.x + tdx * targetSpeed * leadTime;
    const leadY = target.y + tdy * targetSpeed * leadTime;
    lion.facing = Math.atan2(leadY - lion.y, leadX - lion.x);
    lion.pounceTargetX = leadX;
    lion.pounceTargetY = leadY;
    return;
  }
  if (dist > lion.attackRange) {
    if (lion.aiState !== "chase" && lion.aiState !== "attack") {
      lion.chaseStartTime = now;
      alertNearbyLions(world2, lion, target);
    }
    lion.aiState = "chase";
    const elapsed = now - lion.chaseStartTime;
    const rampT = Math.min(1, elapsed / LION_RAMP_DURATION);
    const targetSpeed = target.getSpeed();
    const speedMult = lion.isReinforcement ? CHASE_LION_MAX_SPEED_MULT : LION_MAX_SPEED_MULT;
    const maxSpeed = Math.max(PLAYER_SPEED * speedMult, targetSpeed * 1.2);
    lion.speed = LION_SPEED + (maxSpeed - LION_SPEED) * rampT;
    const sincePounce = now - lion.pounceLandTime;
    if (lion.pounceLandTime > 0 && sincePounce < 1e3) {
      lion.speed = maxSpeed * 1.15;
    }
    let reinforcementsForTarget = 0;
    let sourceLionsForTarget = 0;
    let flankLeft = 0;
    let flankRight = 0;
    let flankHead = 0;
    if (!lion.isReinforcement) {
      for (const [, e] of world2.enemies) {
        if (!(e instanceof Lion) || e.markedForRemoval || e.aggroTargetId !== target.id) continue;
        if (e.isReinforcement) {
          reinforcementsForTarget++;
          if (e.flankSide === -1) flankLeft++;
          else if (e.flankSide === 1) flankRight++;
          else flankHead++;
        } else {
          sourceLionsForTarget++;
        }
      }
    }
    const maxReinforcements = Math.min(4, sourceLionsForTarget + 2);
    const firstSpawnDelay = reinforcementsForTarget === 0 ? 500 : 2e3;
    if (!lion.isReinforcement && elapsed > firstSpawnDelay && reinforcementsForTarget < maxReinforcements && now - lion.lastChaseSpawnTime > 2e3 && world2.enemies.size < MAX_ENEMIES) {
      const awayAngle = Math.atan2(lion.y - target.y, lion.x - target.x) + (Math.random() - 0.5) * 0.8;
      const spawnDist = 150 + Math.random() * 100;
      const sx = lion.x + Math.cos(awayAngle) * spawnDist;
      const sy = lion.y + Math.sin(awayAngle) * spawnDist;
      if (Math.hypot(sx, sy) > SAFE_ZONE_RADIUS && !isInsideBuilding(sx, sy, world2)) {
        const reinforcement = new Lion(sx, sy);
        reinforcement.isReinforcement = true;
        if (flankLeft <= flankRight && flankLeft <= flankHead) {
          reinforcement.flankSide = -1;
        } else if (flankRight <= flankLeft && flankRight <= flankHead) {
          reinforcement.flankSide = 1;
        } else {
          reinforcement.flankSide = 0;
        }
        reinforcement.aggroTargetId = target.id;
        world2.addEnemy(reinforcement);
        lion.chaseLionsSpawned++;
        lion.lastChaseSpawnTime = now;
      }
    }
    const prevX = lion.x;
    const prevY = lion.y;
    let moveToX = target.x;
    let moveToY = target.y;
    if (lion.isReinforcement && lion.flankSide !== 0 && dist > lion.attackRange + LION_POUNCE_RANGE * 0.4) {
      const angleToTarget = Math.atan2(target.y - lion.y, target.x - lion.x);
      const flankAngle = angleToTarget + lion.flankSide * (Math.PI / 3);
      const flankDist = Math.min(dist * 0.6, 120);
      moveToX = target.x + Math.cos(flankAngle + Math.PI) * flankDist;
      moveToY = target.y + Math.sin(flankAngle + Math.PI) * flankDist;
    }
    moveEnemy(lion, moveToX, moveToY, world2.chunks, delta);
    const moved = Math.hypot(lion.x - prevX, lion.y - prevY);
    const expectedMove = lion.speed * delta;
    if (moved < expectedMove * 0.5) {
      attackBlockingBuilding(world2, lion, target, now);
    }
  } else {
    lion.aiState = "attack";
    lion.facing = Math.atan2(target.y - lion.y, target.x - lion.x);
    if (now >= lion.lastMeleeTime + LION_MELEE_COOLDOWN) {
      lion.lastMeleeTime = now;
      const swipeFacing = lion.facing;
      for (const nearPlayer of world2.chunks.getNearbyEntities(lion.x, lion.y).players) {
        if (nearPlayer.dead) continue;
        const pdist = Math.hypot(nearPlayer.x - lion.x, nearPlayer.y - lion.y);
        if (pdist > LION_SWIPE_RANGE) continue;
        const angleToPlayer = Math.atan2(nearPlayer.y - lion.y, nearPlayer.x - lion.x);
        let angleDiff = Math.abs(angleToPlayer - swipeFacing);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        if (angleDiff > LION_SWIPE_ARC / 2) continue;
        if (nearPlayer.shieldActive) continue;
        if (nearPlayer.parryActive) {
          lion.hp -= lion.damage * PARRY_REFLECT_MULT;
          if (lion.hp <= 0) {
            const parryLionReward = SOURCE_LION_KILL_AMOUNT + (getDayPhase() === "dawn" ? SOURCE_TRANSITION_BONUS : 0) + distanceBonus(nearPlayer.x, nearPlayer.y);
            awardSource(nearPlayer, parryLionReward, world2);
            world2.sendEvent(nearPlayer, "kill", `You killed a lion! +${parryLionReward} Source`);
            lion.markedForRemoval = true;
            world2.broadcastAll({
              type: "event",
              kind: "kill",
              message: `__fx_explode_${Math.round(lion.x)}_${Math.round(lion.y)}_lion__`
            });
          }
        } else {
          nearPlayer.hp -= lion.damage;
          if (nearPlayer.hp <= 0) {
            killPlayer(world2, nearPlayer, lion);
          }
        }
      }
    }
  }
}
function alertNearbyLions(world2, lion, target) {
  const nearby = world2.chunks.getNearbyEntities(lion.x, lion.y);
  for (const other of nearby.enemies) {
    if (other === lion) continue;
    if (!(other instanceof Lion)) continue;
    if (other.aiState !== "idle") continue;
    const dist = Math.hypot(other.x - lion.x, other.y - lion.y);
    if (dist <= 300) {
      other.aggroTargetId = target.id;
    }
  }
}

// server/src/systems/ai/GhostAI.ts
function tickGhostPhase(ghost) {
  const now = Date.now();
  if (!ghost.phased && now >= ghost.nextPhaseTime) {
    ghost.phased = true;
    ghost.phaseStartTime = now;
  }
  if (ghost.phased && now >= ghost.phaseStartTime + GHOST_PHASE_DURATION) {
    ghost.phased = false;
    ghost.nextPhaseTime = now + GHOST_PHASE_COOLDOWN_MIN + Math.random() * (GHOST_PHASE_COOLDOWN_MAX - GHOST_PHASE_COOLDOWN_MIN);
  }
}
function tickGhost(world2, ghost, target, dist, delta) {
  const now = Date.now();
  if (dist <= ghost.aggroRange) {
    ghost.facing = Math.atan2(target.y - ghost.y, target.x - ghost.x);
  }
  if (dist > ghost.aggroRange) {
    tickGhostPhase(ghost);
    wander(ghost, delta, world2);
    ghost.aiState = "idle";
    return;
  }
  ghost.phased = false;
  if (ghost.burstPhase !== "none") {
    ghost.aiState = "attack";
    const elapsed = now - ghost.burstStartTime;
    if (ghost.burstPhase === "windup") {
      if (elapsed >= GHOST_BURST_WINDUP) {
        ghost.burstPhase = "firing";
        ghost.burstStartTime = now;
        ghost.burstShotsFired = 0;
      }
      return;
    }
    if (ghost.burstPhase === "firing") {
      if (ghost.burstShotsFired < GHOST_BURST_SHOTS && elapsed >= ghost.burstShotsFired * GHOST_BURST_INTERVAL) {
        fireGhostProjectile(world2, ghost, target);
        ghost.burstShotsFired++;
      }
      if (ghost.burstShotsFired >= GHOST_BURST_SHOTS) {
        ghost.burstPhase = "none";
        ghost.lastAttackTime = now;
        ghost.lastBurstTime = now;
      }
      return;
    }
  }
  if (now >= ghost.lastBurstTime + GHOST_BURST_COOLDOWN && dist <= ghost.attackRange) {
    ghost.burstPhase = "windup";
    ghost.burstStartTime = now;
    ghost.burstShotsFired = 0;
    return;
  }
  if (dist > GHOST_PREFERRED_DIST + 20) {
    ghost.aiState = "chase";
    const prevX = ghost.x;
    const prevY = ghost.y;
    moveEnemy(ghost, target.x, target.y, world2.chunks, delta);
    if (Math.hypot(ghost.x - prevX, ghost.y - prevY) < 0.5) {
      attackBlockingBuilding(world2, ghost, target, now);
    }
  } else if (dist < GHOST_PREFERRED_DIST - 40) {
    ghost.aiState = "flee";
    const awayX = ghost.x - (target.x - ghost.x);
    const awayY = ghost.y - (target.y - ghost.y);
    moveEnemy(ghost, awayX, awayY, world2.chunks, delta);
  } else {
    ghost.aiState = "attack";
    const angle = Math.atan2(target.y - ghost.y, target.x - ghost.x) + Math.PI / 2;
    const strafeX = ghost.x + Math.cos(angle) * 30;
    const strafeY = ghost.y + Math.sin(angle) * 30;
    moveEnemy(ghost, strafeX, strafeY, world2.chunks, delta);
  }
  if (now >= ghost.lastAttackTime + ghost.attackCooldown && dist <= ghost.attackRange) {
    fireGhostProjectile(world2, ghost, target);
    ghost.lastAttackTime = now;
  }
}
function fireGhostProjectile(world2, ghost, target) {
  const dx = target.x - ghost.x;
  const dy = target.y - ghost.y;
  const d = Math.hypot(dx, dy) || 1;
  const distFromSafe = Math.max(0, Math.hypot(ghost.x, ghost.y) - SAFE_ZONE_RADIUS);
  const speedBonus = distFromSafe * GHOST_PROJECTILE_SPEED_SCALE;
  const speed = GHOST_PROJECTILE_SPEED * (1 + speedBonus);
  const vx = dx / d * speed;
  const vy = dy / d * speed;
  const proj = new Projectile(ghost.x, ghost.y, vx, vy, GHOST_DAMAGE, ghost.id, "enemy");
  proj.ttl = GHOST_PROJECTILE_TTL;
  proj.homingTargetId = target.id;
  proj.homingRate = GHOST_PROJECTILE_HOMING;
  world2.addProjectile(proj);
}

// server/src/systems/ai/StagAI.ts
var STAG_RAMP_DURATION = 3e3;
var STAG_MAX_SPEED_MULT = 1;
var STAG_POST_CHARGE_MELEE_COOLDOWN = 2e3;
function tickStag(world2, stag, target, dist, delta) {
  const now = Date.now();
  if (stag.charging) {
    const elapsed = now - stag.chargeStartTime;
    if (elapsed >= STAG_CHARGE_DURATION) {
      stag.charging = false;
      stag.chaseRampStart = now;
      stag.speed = STAG_SPEED;
      const nearby = world2.chunks.getEntitiesInRadius(stag.x, stag.y, STAG_CHARGE_AOE_RADIUS);
      for (const player of nearby.players) {
        if (player.dead || player.shieldActive) continue;
        const pDist = Math.hypot(player.x - stag.x, player.y - stag.y);
        if (pDist <= STAG_MELEE_RANGE + 20) {
          player.hp -= STAG_CHARGE_DAMAGE;
          if (player.hp <= 0) killPlayer(world2, player, stag);
        } else if (pDist <= STAG_CHARGE_AOE_RADIUS) {
          player.hp -= STAG_CHARGE_AOE_DAMAGE;
          if (player.hp <= 0) killPlayer(world2, player, stag);
        }
      }
      stag.lastAttackTime = now;
      stag.lastMeleeTime = now + STAG_POST_CHARGE_MELEE_COOLDOWN - STAG_MELEE_COOLDOWN;
      return;
    }
    stag.speed = STAG_CHARGE_SPEED;
    moveEnemy(stag, stag.chargeTargetX, stag.chargeTargetY, world2.chunks, delta);
    stag.aiState = "attack";
    if (now >= stag.lastAttackTime + 300) {
      const hitRange = STAG_MELEE_RANGE + 10;
      const nearby = world2.chunks.getEntitiesInRadius(stag.x, stag.y, hitRange);
      for (const player of nearby.players) {
        if (player.dead || player.shieldActive) continue;
        const pDist = Math.hypot(player.x - stag.x, player.y - stag.y);
        if (pDist <= hitRange) {
          player.hp -= STAG_CHARGE_DAMAGE;
          if (player.hp <= 0) killPlayer(world2, player, stag);
          stag.lastAttackTime = now;
        }
      }
    }
    return;
  }
  if (dist >= STAG_MELEE_RANGE && dist <= STAG_CHARGE_RANGE && now >= stag.lastChargeTime + STAG_CHARGE_COOLDOWN && now >= stag.lastAttackTime + 1e3) {
    stag.charging = true;
    stag.chargeStartTime = now;
    stag.lastChargeTime = now;
    stag.chargeTargetX = target.x;
    stag.chargeTargetY = target.y;
    stag.speed = STAG_CHARGE_SPEED;
    stag.aiState = "attack";
    return;
  }
  if (dist <= STAG_FIRE_BREATH_RANGE && now >= stag.lastFireBreathTime + STAG_FIRE_BREATH_COOLDOWN && now >= stag.lastAttackTime + 1e3) {
    const dx = target.x - stag.x;
    const dy = target.y - stag.y;
    const baseAngle = Math.atan2(dy, dx);
    const speed = STAG_FIRE_BREATH_SPEED;
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * 0.15;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const proj = new Projectile(stag.x, stag.y, vx, vy, STAG_FIRE_BREATH_DAMAGE, stag.id, "enemy");
      proj.visualSource = "stag";
      proj.ttl = 1500;
      proj.aoeRadius = STAG_FIRE_BREATH_AOE_RADIUS;
      world2.addProjectile(proj);
    }
    stag.lastFireBreathTime = now;
    stag.lastAttackTime = now;
  }
  if (dist > STAG_MELEE_RANGE + 10) {
    stag.aiState = "chase";
    if (stag.chaseRampStart > 0) {
      const rampElapsed = now - stag.chaseRampStart;
      const rampT = Math.min(1, rampElapsed / STAG_RAMP_DURATION);
      const maxSpeed = PLAYER_SPEED * STAG_MAX_SPEED_MULT;
      stag.speed = STAG_SPEED + (maxSpeed - STAG_SPEED) * rampT;
    }
    const prevX = stag.x;
    const prevY = stag.y;
    moveEnemy(stag, target.x, target.y, world2.chunks, delta);
    if (Math.hypot(stag.x - prevX, stag.y - prevY) < 0.5) {
      attackBlockingBuilding(world2, stag, target, now);
    }
  } else {
    stag.aiState = "attack";
    if (now >= stag.lastMeleeTime + STAG_MELEE_COOLDOWN && now >= stag.lastAttackTime + 1e3) {
      if (!target.shieldActive) {
        const dmg = Math.max(1, Math.floor(target.hp / 2));
        target.hp -= dmg;
        if (target.hp <= 0) killPlayer(world2, target, stag);
      }
      stag.lastMeleeTime = now;
      stag.lastAttackTime = now;
    }
  }
}

// server/src/systems/AISystem.ts
function tickAI(world2, delta, doSeparation = true) {
  for (const [, enemy] of world2.enemies) {
    if (enemy.markedForRemoval) continue;
    if (Date.now() < enemy.stunUntil) continue;
    if (enemy.kind !== "stag" && Math.hypot(enemy.x, enemy.y) < SAFE_ZONE_RADIUS) {
      enemy.markedForRemoval = true;
      world2.broadcastAll({
        type: "event",
        kind: "destroy",
        message: `__fx_explode_${Math.round(enemy.x)}_${Math.round(enemy.y)}_${enemy.kind}__`
      });
      continue;
    }
    let target;
    if (enemy instanceof ScorchedStag) {
      enemy.aggroTargetId = null;
      const topAggroId = enemy.getTopAggroPlayerId();
      const aggroTarget = topAggroId !== null ? world2.players.get(topAggroId) : null;
      if (aggroTarget && !aggroTarget.dead && Math.hypot(aggroTarget.x, aggroTarget.y) >= SAFE_ZONE_RADIUS) {
        target = aggroTarget;
      } else {
        target = findNearestPlayer(world2, enemy);
      }
      if (target && Math.hypot(target.x, target.y) < SAFE_ZONE_RADIUS) {
        target = null;
      }
    } else {
      target = findNearestPlayer(world2, enemy);
    }
    if (!target) {
      if (tickTurretAggro(world2, enemy, delta)) continue;
      wander(enemy, delta, world2);
      enemy.aiState = "idle";
      if (enemy instanceof Lion) {
        enemy.speed = LION_SPEED;
        enemy.chaseStartTime = 0;
        enemy.chaseLionsSpawned = 0;
        if (enemy.isReinforcement) {
          if (enemy.wanderStartTime === 0) enemy.wanderStartTime = Date.now();
          if (Date.now() - enemy.wanderStartTime > 5e3) {
            enemy.markedForRemoval = true;
          }
        }
      }
      if (enemy instanceof Ghost) {
        tickGhostPhase(enemy);
      }
      continue;
    }
    enemy.aggroTurretId = null;
    if (enemy instanceof Lion && enemy.isReinforcement) {
      enemy.wanderStartTime = 0;
    }
    const dist = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    enemy.facing = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    if (enemy instanceof ScorchedStag) {
      tickStag(world2, enemy, target, dist, delta);
    } else if (enemy instanceof Lion) {
      tickLion(world2, enemy, target, dist, delta);
    } else if (enemy instanceof Ghost) {
      tickGhost(world2, enemy, target, dist, delta);
    }
  }
  if (doSeparation) {
    const SEPARATION_DIST = 20;
    for (const [, enemy] of world2.enemies) {
      if (enemy.markedForRemoval) continue;
      const nearby = world2.chunks.getNearbyEntities(enemy.x, enemy.y);
      for (const other of nearby.enemies) {
        if (other.id <= enemy.id || other.markedForRemoval) continue;
        const dx = other.x - enemy.x;
        const dy = other.y - enemy.y;
        const d = Math.hypot(dx, dy);
        if (d < SEPARATION_DIST && d > 0.1) {
          const push = (SEPARATION_DIST - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          const e1x = enemy.x - nx * push;
          const e1y = enemy.y - ny * push;
          if (!isInsideBuilding(e1x, e1y, world2)) {
            enemy.x = e1x;
            enemy.y = e1y;
          }
          const e2x = other.x + nx * push;
          const e2y = other.y + ny * push;
          if (!isInsideBuilding(e2x, e2y, world2)) {
            other.x = e2x;
            other.y = e2y;
          }
        }
      }
    }
  }
  for (const [, enemy] of world2.enemies) {
    if (enemy.markedForRemoval) continue;
    if (isInsideBuilding(enemy.x, enemy.y, world2)) {
      pushOutOfBuilding(enemy, world2);
    }
  }
}

// server/src/systems/BuildingSystem.ts
var COST_MAP = {
  wall: WALL_COST,
  gate: GATE_COST,
  turret: TURRET_COST,
  bed: BED_COST
};
function handlePlaceBuilding(world2, player, btype, cellX, cellY) {
  const worldX = cellX * CELL_SIZE + CELL_SIZE / 2;
  const worldY = cellY * CELL_SIZE + CELL_SIZE / 2;
  const distFromPlayer = Math.hypot(worldX - player.x, worldY - player.y);
  if (distFromPlayer > MAX_BUILD_RANGE) {
    player.send({ type: "error", message: "Too far away to build" });
    return;
  }
  const distFromOrigin = Math.hypot(worldX, worldY);
  if (distFromOrigin < SAFE_ZONE_RADIUS) {
    player.send({ type: "error", message: "Cannot build in the safe zone" });
    return;
  }
  if (distFromOrigin < SAFE_ZONE_RADIUS + NO_BUILD_BUFFER) {
    player.send({ type: "error", message: "Too close to the safe zone" });
    return;
  }
  if (world2.chunks.getBuildingAtCell(cellX, cellY)) {
    player.send({ type: "error", message: "Cell is occupied" });
    return;
  }
  const playerCellX = Math.floor(player.x / CELL_SIZE);
  const playerCellY = Math.floor(player.y / CELL_SIZE);
  if (cellX === playerCellX && cellY === playerCellY) {
    player.send({ type: "error", message: "Cannot build where you are standing" });
    return;
  }
  const cost = COST_MAP[btype];
  if (player.source < cost) {
    player.send({ type: "error", message: `Not enough Source (need ${cost})` });
    return;
  }
  if (player.buildingCount >= MAX_BUILDINGS_PER_PLAYER) {
    player.send({ type: "error", message: "Building limit reached" });
    return;
  }
  if (btype === "bed" && player.bedBuildingId !== null) {
    const oldBed = world2.buildingsById.get(player.bedBuildingId);
    if (oldBed) {
      world2.removeBuilding(oldBed);
    }
    player.bedBuildingId = null;
    player.bedX = null;
    player.bedY = null;
  }
  player.source -= cost;
  player.buildingCount++;
  const building = new Building(btype, cellX, cellY, player.id, player.username);
  if ((btype === "gate" || btype === "turret") && player.globalWhitelist.length > 0) {
    for (const name of player.globalWhitelist) {
      if (!building.whitelist.includes(name)) {
        building.whitelist.push(name);
      }
    }
  }
  world2.addBuilding(building);
  if (btype === "bed") {
    player.bedBuildingId = building.id;
    player.bedX = worldX;
    player.bedY = worldY;
  }
  if (btype === "bed" || btype === "turret") {
    building.ownerColors = player.colors;
  }
  world2.sendEvent(player, "build", `Built a ${btype} (-${cost} Source)`);
}
function tickTurrets(world2) {
  const now = Date.now();
  for (const [, building] of world2.buildingsById) {
    if (building.btype !== "turret") continue;
    if (building.markedForRemoval) continue;
    if (now - building.lastAttackTime < TURRET_FIRE_RATE) continue;
    const nearby = world2.chunks.getNearbyEntities(building.x, building.y);
    let bestTarget = null;
    let bestDist = TURRET_RANGE;
    for (const enemy of nearby.enemies) {
      if (enemy.markedForRemoval) continue;
      const dist = Math.hypot(enemy.x - building.x, enemy.y - building.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = enemy;
      }
    }
    for (const player of nearby.players) {
      if (player.dead) continue;
      if (building.isWhitelisted(player.username)) continue;
      const dist = Math.hypot(player.x - building.x, player.y - building.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = player;
      }
    }
    if (bestTarget) {
      const dx = bestTarget.x - building.x;
      const dy = bestTarget.y - building.y;
      const d = Math.hypot(dx, dy) || 1;
      const vx = dx / d * TURRET_PROJECTILE_SPEED;
      const vy = dy / d * TURRET_PROJECTILE_SPEED;
      const proj = new Projectile(
        building.x,
        building.y,
        vx,
        vy,
        TURRET_DAMAGE,
        building.id,
        "turret",
        [...building.whitelist, ...building.partyWhitelist]
      );
      proj.aoeRadius = TURRET_AOE_RADIUS;
      proj.turretOwnerName = building.ownerName;
      world2.addProjectile(proj);
      building.lastAttackTime = now;
      building.facing = Math.atan2(dy, dx);
    }
  }
}
function tickBuildingRegen(world2) {
  const now = Date.now();
  for (const [, building] of world2.buildingsById) {
    if (building.markedForRemoval) continue;
    if (building.btype !== "wall") continue;
    if (building.hp >= building.maxHp) continue;
    if (now - building.lastRegenTime < BUILDING_REGEN_INTERVAL) continue;
    building.hp = Math.min(building.maxHp, building.hp + BUILDING_REGEN_RATE);
    building.lastRegenTime = now;
  }
}

// server/src/systems/SpawnSystem.ts
var lastBossTeleport = 0;
var lastEnemyNearby = /* @__PURE__ */ new Map();
var droughtThreshold = /* @__PURE__ */ new Map();
var DROUGHT_CHECK_RADIUS = 900;
var DROUGHT_MIN = 5e3;
var DROUGHT_MAX = 15e3;
function tickSpawning(world2) {
  despawnDistantEnemies(world2);
  spawnForDroughtPlayers(world2);
  const now = Date.now();
  if (!world2.bossSpawned && world2.players.size > 0) {
    const savedHp = world2.db.getWorldStateValue("boss_hp");
    if (savedHp === "0") {
      world2.bossSpawned = true;
    } else {
      const target = getRandomOutdoorPlayer(world2);
      if (!target) return;
      const pos = getBossSpawnNearPlayer(target);
      const stag = new ScorchedStag(pos.x, pos.y);
      if (savedHp) {
        stag.hp = parseInt(savedHp, 10);
      }
      world2.addEnemy(stag);
      world2.bossSpawned = true;
      world2.broadcastAll({
        type: "event",
        kind: "boss",
        message: "The Scorched Stag has appeared!"
      });
    }
  }
  if (world2.bossSpawned) {
    let found = false;
    for (const [, enemy] of world2.enemies) {
      if (enemy.kind === "stag") {
        world2.db.setWorldStateValue("boss_hp", String(enemy.hp));
        found = true;
        break;
      }
    }
    if (!found && world2.bossSpawned) {
      world2.db.setWorldStateValue("boss_hp", "0");
    }
  }
  if (world2.bossSpawned && world2.players.size > 0 && now - lastBossTeleport >= 6e4) {
    for (const [, enemy] of world2.enemies) {
      if (enemy.kind !== "stag") continue;
      let nearAny = false;
      for (const [, player] of world2.players) {
        if (player.dead) continue;
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < ENEMY_DESPAWN_DIST) {
          nearAny = true;
          break;
        }
      }
      if (!nearAny) {
        const target = getRandomOutdoorPlayer(world2);
        if (target) {
          const pos = getBossSpawnNearPlayer(target);
          const oldX = enemy.x;
          const oldY = enemy.y;
          enemy.x = pos.x;
          enemy.y = pos.y;
          world2.chunks.updateEntityChunk(enemy, oldX, oldY);
          lastBossTeleport = now;
          world2.broadcastAll({
            type: "event",
            kind: "boss",
            message: "The Scorched Stag draws near..."
          });
        }
      }
      break;
    }
  }
  if (world2.enemies.size >= MAX_ENEMIES) return;
  const spawnLions = shouldSpawnLions();
  const spawnGhosts = shouldSpawnGhosts();
  if (!spawnLions && !spawnGhosts) return;
  const activeChunks = world2.chunks.getActiveChunks();
  for (const chunk of activeChunks) {
    if (world2.enemies.size >= MAX_ENEMIES) break;
    const chunkCenterX = (chunk.cx + 0.5) * CHUNK_SIZE;
    const chunkCenterY = (chunk.cy + 0.5) * CHUNK_SIZE;
    const distFromOrigin = Math.hypot(chunkCenterX, chunkCenterY);
    if (distFromOrigin < SAFE_ZONE_RADIUS + CHUNK_SIZE) continue;
    const chunkKey = `${chunk.cx},${chunk.cy}`;
    const lastKill = world2.spawnSuppressions.get(chunkKey);
    if (lastKill && now - lastKill < SPAWN_SUPPRESSION_DURATION) continue;
    if (lastKill && now - lastKill >= SPAWN_SUPPRESSION_DURATION) {
      world2.spawnSuppressions.delete(chunkKey);
    }
    const nearbyPlayerCount = chunk.players.size;
    if (nearbyPlayerCount === 0) continue;
    const distBeyondSafe = Math.max(0, distFromOrigin - SAFE_ZONE_RADIUS);
    const distanceBudget = distBeyondSafe * SPAWN_DISTANCE_SCALE;
    const budget = Math.floor(nearbyPlayerCount * SPAWN_PER_PLAYER_BASE + distanceBudget);
    if (budget <= 0) continue;
    const currentEnemies = chunk.enemies.size;
    const toSpawn = Math.min(budget - currentEnemies, 2);
    const ghostRatio = Math.min(0.9, 0.5 + distBeyondSafe * 2e-4);
    let representativePlayer = null;
    for (const p of chunk.players) {
      representativePlayer = p;
      break;
    }
    let nearbyLions = 0;
    let nearbyGhosts = 0;
    for (const e of chunk.enemies) {
      if (e.markedForRemoval) continue;
      if (e.kind === "lion") nearbyLions++;
      else if (e.kind === "ghost") nearbyGhosts++;
    }
    for (let i = 0; i < toSpawn; i++) {
      if (world2.enemies.size >= MAX_ENEMIES) break;
      const canSpawnLion = spawnLions && nearbyLions < MAX_LIONS_NEAR_PLAYER;
      const canSpawnGhost = spawnGhosts && nearbyGhosts < MAX_GHOSTS_NEAR_PLAYER;
      if (!canSpawnLion && !canSpawnGhost) break;
      let x;
      let y;
      if (representativePlayer) {
        const pos = getDirectionalSpawnPos(representativePlayer);
        x = pos.x;
        y = pos.y;
      } else {
        x = chunk.cx * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        y = chunk.cy * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
      }
      const distFromOriginSpawn = Math.hypot(x, y);
      if (distFromOriginSpawn < SAFE_ZONE_RADIUS + 50) {
        const outAngle = Math.atan2(y, x);
        x = Math.cos(outAngle) * (SAFE_ZONE_RADIUS + 50 + Math.random() * 100);
        y = Math.sin(outAngle) * (SAFE_ZONE_RADIUS + 50 + Math.random() * 100);
      }
      if (isCollidingWithBuildings2(x, y, world2)) continue;
      if (canSpawnLion && canSpawnGhost) {
        if (Math.random() < ghostRatio) {
          world2.addEnemy(new Ghost(x, y));
          nearbyGhosts++;
        } else {
          world2.addEnemy(new Lion(x, y));
          nearbyLions++;
        }
      } else if (canSpawnLion) {
        world2.addEnemy(new Lion(x, y));
        nearbyLions++;
      } else {
        world2.addEnemy(new Ghost(x, y));
        nearbyGhosts++;
      }
    }
  }
}
function getDirectionalSpawnPos(player) {
  const mdx = player.getMoveDx();
  const mdy = player.getMoveDy();
  const isMoving = mdx !== 0 || mdy !== 0;
  const moveAngle = isMoving ? Math.atan2(mdy, mdx) : player.facing;
  const atCap = isAtDistanceCap(player.x, player.y);
  const scale = atCap ? 0.5 : 1;
  if (isMoving && Math.random() < 0.3) {
    const dist2 = (300 + Math.random() * 200) * scale;
    const spread2 = (Math.random() - 0.5) * Math.PI * 0.3;
    const angle2 = moveAngle + spread2;
    return {
      x: player.x + Math.cos(angle2) * dist2,
      y: player.y + Math.sin(angle2) * dist2
    };
  }
  const dist = (400 + Math.random() * 300) * scale;
  const spread = (Math.random() - 0.5) * Math.PI * 0.8;
  const angle = moveAngle + spread;
  return {
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist
  };
}
function isCollidingWithBuildings2(x, y, world2) {
  const half = 12;
  const minCX = Math.floor((x - half) / CELL_SIZE);
  const maxCX = Math.floor((x + half) / CELL_SIZE);
  const minCY = Math.floor((y - half) / CELL_SIZE);
  const maxCY = Math.floor((y + half) / CELL_SIZE);
  for (let cx = minCX; cx <= maxCX; cx++) {
    for (let cy = minCY; cy <= maxCY; cy++) {
      const building = world2.chunks.getBuildingAtCell(cx, cy);
      if (building && building.isSolid()) return true;
    }
  }
  return false;
}
function getRandomOutdoorPlayer(world2) {
  const outdoor = [];
  for (const [, p] of world2.players) {
    if (p.dead) continue;
    if (Math.hypot(p.x, p.y) > SAFE_ZONE_RADIUS) outdoor.push(p);
  }
  if (outdoor.length === 0) {
    for (const [, p] of world2.players) {
      if (!p.dead) return p;
    }
    return null;
  }
  return outdoor[Math.floor(Math.random() * outdoor.length)];
}
function getBossSpawnNearPlayer(player) {
  const dist = 300 + Math.random() * 200;
  const spread = (Math.random() - 0.5) * Math.PI * 0.6;
  const angle = player.facing + spread;
  const x = player.x + Math.cos(angle) * dist;
  const y = player.y + Math.sin(angle) * dist;
  if (Math.hypot(x, y) < SAFE_ZONE_RADIUS + 200) {
    const outAngle = Math.atan2(y, x);
    return {
      x: Math.cos(outAngle) * (SAFE_ZONE_RADIUS + 400),
      y: Math.sin(outAngle) * (SAFE_ZONE_RADIUS + 400)
    };
  }
  return { x, y };
}
function spawnForDroughtPlayers(world2) {
  if (world2.enemies.size >= MAX_ENEMIES) return;
  const now = Date.now();
  const spawnLions = shouldSpawnLions();
  const spawnGhosts = shouldSpawnGhosts();
  if (!spawnLions && !spawnGhosts) return;
  for (const id of lastEnemyNearby.keys()) {
    if (!world2.players.has(id)) {
      lastEnemyNearby.delete(id);
      droughtThreshold.delete(id);
    }
  }
  for (const [id, player] of world2.players) {
    if (player.dead) continue;
    if (Math.hypot(player.x, player.y) <= SAFE_ZONE_RADIUS) continue;
    let hasNearby = false;
    const nearby = world2.chunks.getNearbyEntities(player.x, player.y);
    for (const enemy of nearby.enemies) {
      if (enemy.markedForRemoval || enemy.kind === "stag") continue;
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < DROUGHT_CHECK_RADIUS) {
        hasNearby = true;
        break;
      }
    }
    if (hasNearby) {
      lastEnemyNearby.set(id, now);
      continue;
    }
    if (!lastEnemyNearby.has(id)) {
      lastEnemyNearby.set(id, now);
      droughtThreshold.set(id, DROUGHT_MIN + Math.random() * (DROUGHT_MAX - DROUGHT_MIN));
      continue;
    }
    const threshold = droughtThreshold.get(id) ?? DROUGHT_MIN;
    if (now - lastEnemyNearby.get(id) < threshold) continue;
    const pos = getDirectionalSpawnPos(player);
    if (Math.hypot(pos.x, pos.y) < SAFE_ZONE_RADIUS + 50) continue;
    if (isCollidingWithBuildings2(pos.x, pos.y, world2)) continue;
    if (spawnLions && spawnGhosts) {
      if (Math.random() < 0.5) {
        world2.addEnemy(new Ghost(pos.x, pos.y));
      } else {
        world2.addEnemy(new Lion(pos.x, pos.y));
      }
    } else if (spawnLions) {
      world2.addEnemy(new Lion(pos.x, pos.y));
    } else {
      world2.addEnemy(new Ghost(pos.x, pos.y));
    }
    lastEnemyNearby.set(id, now);
    droughtThreshold.set(id, DROUGHT_MIN + Math.random() * (DROUGHT_MAX - DROUGHT_MIN));
  }
}
function despawnDistantEnemies(world2) {
  for (const [, enemy] of world2.enemies) {
    if (enemy.kind === "stag") continue;
    let nearPlayer = false;
    for (const [, player] of world2.players) {
      if (player.dead) continue;
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist < ENEMY_DESPAWN_DIST) {
        nearPlayer = true;
        break;
      }
    }
    if (!nearPlayer) {
      enemy.markedForRemoval = true;
    }
  }
}

// server/src/systems/CurrencySystem.ts
function tickCurrency(world2) {
  const now = Date.now();
  for (const [, player] of world2.players) {
    if (player.dead) continue;
    if (player.isMoving && now - player.lastWalkAwardTime >= SOURCE_WALK_INTERVAL) {
      awardSource(player, SOURCE_WALK_AMOUNT, world2);
      player.lastWalkAwardTime = now;
    }
  }
}

// server/src/systems/PersistenceSystem.ts
var LAST_SEEN_FLUSH_INTERVAL = 3e4;
function tickPersistence(world2) {
  const now = Date.now();
  for (const [, player] of world2.players) {
    if (player.sourceFlushDirty > 0) {
      world2.db.addTotalSource(player.token, player.sourceFlushDirty);
      player.sourceFlushDirty = 0;
    }
    if (now - player.lastSeenFlushTime >= LAST_SEEN_FLUSH_INTERVAL) {
      world2.db.updateLastSeen(player.token, now);
      player.lastSeenFlushTime = now;
    }
  }
}

// server/src/systems/InactivitySystem.ts
function tickInactivity(world2, now) {
  for (const [, player] of world2.players) {
    if (player.kicked) continue;
    if (now - player.lastActivityTime >= INACTIVITY_TIMEOUT) {
      player.kicked = true;
      player.send({ type: "kicked", reason: "Kicked for inactivity" });
      setTimeout(() => player.ws.close(), 200);
    }
  }
}

// server/src/world/World.ts
var World = class {
  db;
  chunks = new ChunkManager();
  players = /* @__PURE__ */ new Map();
  playersByUsername = /* @__PURE__ */ new Map();
  enemies = /* @__PURE__ */ new Map();
  projectiles = /* @__PURE__ */ new Map();
  buildingsById = /* @__PURE__ */ new Map();
  /** Convenience alias — AI rule implementations often use `world.buildings` */
  get buildings() {
    return this.buildingsById;
  }
  /** Current day phase — convenience getter wrapping getDayPhase() */
  get dayPhase() {
    return getDayPhase();
  }
  /** chunkKey -> timestamp of last enemy kill in that chunk */
  spawnSuppressions = /* @__PURE__ */ new Map();
  /** Whether the world boss has been spawned this session */
  bossSpawned = false;
  /** Direct reference to world boss (avoids scanning all enemies) */
  boss = null;
  /** Tick counter for throttling expensive operations */
  tickCount = 0;
  /** Active game rules (cleared on weekly reset) */
  rules = [];
  /** Username of offline player who won but hasn't submitted their rule yet */
  pendingWinnerUsername = null;
  /** Callback to refresh and broadcast sign data (set by server.ts) */
  refreshSignData = null;
  /** Whether a rule is currently being implemented by AI */
  isImplementingRule = false;
  lastTick = Date.now();
  lastSpawnCheck = 0;
  lastBuildingSave = 0;
  lastLionsAllowed = shouldSpawnLions();
  lastGhostsAllowed = shouldSpawnGhosts();
  lastDayPhase = getDayPhase();
  tickInterval = null;
  constructor(db2) {
    this.db = db2;
    const dbRules = db2.getRules();
    this.rules = dbRules.map((r) => ({
      id: r.id,
      text: r.text,
      createdBy: r.created_by,
      createdAt: r.created_at,
      status: r.status
    }));
    const dbBuildings = db2.getAllBuildings();
    const cellMap = /* @__PURE__ */ new Map();
    for (const row of dbBuildings) {
      const key = `${row.cell_x},${row.cell_y}`;
      const existing = cellMap.get(key);
      if (!existing || row.id > existing.id) {
        cellMap.set(key, row);
      }
    }
    if (cellMap.size < dbBuildings.length) {
      const keepIds = new Set([...cellMap.values()].map((r) => r.id));
      for (const row of dbBuildings) {
        if (!keepIds.has(row.id)) {
          db2.deleteBuilding(row.id);
        }
      }
      console.log(`[World] Cleaned up ${dbBuildings.length - cellMap.size} duplicate buildings from database`);
    }
    for (const row of cellMap.values()) {
      const building = new Building(
        row.btype,
        row.cell_x,
        row.cell_y,
        -1,
        // ownerId unknown (player not online), will be patched on join
        row.owner_name,
        row.id
        // preserve DB id
      );
      building.hp = row.hp;
      try {
        building.whitelist = JSON.parse(row.whitelist);
      } catch {
        building.whitelist = [row.owner_name];
      }
      this.buildingsById.set(building.id, building);
      this.chunks.addBuilding(building);
    }
    for (const row of cellMap.values()) {
      ensureIdAbove(row.id);
    }
    console.log(`[World] Loaded ${cellMap.size} buildings from database`);
  }
  start() {
    console.log(`[World] Starting game loop at ${TICK_MS}ms tick rate`);
    this.tickInterval = setInterval(() => this.tick(), TICK_MS);
  }
  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
  tick() {
    const now = Date.now();
    const rawDelta = (now - this.lastTick) / 1e3;
    const delta = Math.min(rawDelta, TICK_MS * 3 / 1e3);
    this.lastTick = now;
    this.tickCount++;
    tickMovement(this.players, this.enemies, this.chunks, delta);
    tickCombat(this);
    tickProjectiles(this, delta);
    const lionsNow = shouldSpawnLions();
    const ghostsNow = shouldSpawnGhosts();
    if (!lionsNow && this.lastLionsAllowed) {
      this.explodeEnemiesByKind("lion");
    }
    if (!ghostsNow && this.lastGhostsAllowed) {
      this.explodeEnemiesByKind("ghost");
    }
    this.lastLionsAllowed = lionsNow;
    this.lastGhostsAllowed = ghostsNow;
    const currentPhase = getDayPhase();
    if (currentPhase !== this.lastDayPhase) {
      const labels = { day: "Day", night: "Night", dawn: "Dawn", dusk: "Dusk" };
      let phaseMsg = `${labels[currentPhase]} has begun.`;
      if (currentPhase === "dawn") {
        phaseMsg += " Lions yield bonus Source!";
      } else if (currentPhase === "dusk") {
        phaseMsg += " Ghosts yield bonus Source!";
      }
      this.broadcastAll({ type: "event", kind: "phase", message: phaseMsg });
      this.lastDayPhase = currentPhase;
    }
    tickAI(this, delta, this.tickCount % 3 === 0);
    tickTurrets(this);
    if (now - this.lastSpawnCheck >= SPAWN_CHECK_INTERVAL) {
      tickSpawning(this);
      this.lastSpawnCheck = now;
    }
    tickBuildingRegen(this);
    tickCurrency(this);
    tickRespawns(this);
    this.cleanupDead();
    tickPersistence(this);
    tickPartyUpdates(this, now);
    if (this.tickCount % 10 === 0) {
      tickInactivity(this, now);
    }
    if (now - this.lastBuildingSave >= 3e4) {
      for (const [, b] of this.buildingsById) {
        this.db.saveBuilding(b.id, b.btype, b.cellX, b.cellY, b.ownerName, b.hp, b.whitelist);
      }
      this.lastBuildingSave = now;
    }
    this.broadcast();
  }
  addPlayer(player) {
    this.players.set(player.id, player);
    this.playersByUsername.set(player.username, player);
    this.chunks.addPlayer(player);
  }
  removePlayer(player) {
    if (player.sourceFlushDirty > 0) {
      this.db.addTotalSource(player.token, player.sourceFlushDirty);
      player.sourceFlushDirty = 0;
    }
    this.db.updateLastSeen(player.token, Date.now());
    if (player.pendingWinnerPrompt) {
      this.pendingWinnerUsername = player.username;
    }
    this.players.delete(player.id);
    this.playersByUsername.delete(player.username);
    this.chunks.removePlayer(player);
  }
  addEnemy(enemy) {
    this.enemies.set(enemy.id, enemy);
    this.chunks.addEnemy(enemy);
  }
  removeEnemy(enemy) {
    this.enemies.delete(enemy.id);
    this.chunks.removeEnemy(enemy);
  }
  addProjectile(proj) {
    this.projectiles.set(proj.id, proj);
    this.chunks.addProjectile(proj);
  }
  addBuilding(building) {
    this.buildingsById.set(building.id, building);
    this.chunks.addBuilding(building);
    this.db.saveBuilding(building.id, building.btype, building.cellX, building.cellY, building.ownerName, building.hp, building.whitelist);
  }
  removeBuilding(building) {
    building.markedForRemoval = true;
    this.buildingsById.delete(building.id);
    this.chunks.removeBuilding(building);
    this.db.deleteBuilding(building.id);
    const owner = this.playersByUsername.get(building.ownerName);
    if (owner && building.btype === "bed" && owner.bedBuildingId === building.id) {
      owner.bedBuildingId = null;
      owner.bedX = null;
      owner.bedY = null;
    }
    if (owner) {
      owner.buildingCount = Math.max(0, owner.buildingCount - 1);
    }
  }
  /** Mark a location as recently having a kill, suppressing spawns nearby */
  suppressSpawnsAt(x, y) {
    const { cx, cy } = chunkCoords(x, y, CHUNK_SIZE);
    this.spawnSuppressions.set(`${cx},${cy}`, Date.now());
  }
  sendEvent(player, kind, message) {
    player.send({ type: "event", kind, message });
    if (player.partyId !== null && (kind === "kill" || kind === "source" || kind === "destroy")) {
      if (message.includes("+") || message.includes("killed") || message.includes("Destroyed")) {
        const members = getPartyMembers(this, player);
        const partyMsg = `[${player.username}] ${message}`;
        for (const member of members) {
          if (member.id !== player.id) {
            member.send({ type: "event", kind: "party", message: partyMsg });
          }
        }
      }
    }
  }
  broadcastAll(msg) {
    for (const [, player] of this.players) {
      player.send(msg);
    }
  }
  explodeEnemiesByKind(kind) {
    for (const [, enemy] of this.enemies) {
      if (enemy.markedForRemoval) continue;
      if (enemy.kind !== kind) continue;
      enemy.markedForRemoval = true;
      this.broadcastAll({
        type: "event",
        kind: "destroy",
        message: `__fx_explode_${Math.round(enemy.x)}_${Math.round(enemy.y)}_${enemy.kind}__`
      });
    }
  }
  cleanupDead() {
    for (const [id, enemy] of this.enemies) {
      if (enemy.markedForRemoval) {
        this.chunks.removeEnemy(enemy);
        this.enemies.delete(id);
      }
    }
  }
  broadcast() {
    const dayPhase = getDayPhase();
    const serverTime = Date.now();
    const viewRadiusSq = VIEW_RADIUS * VIEW_RADIUS;
    const buildingViewRadiusSq = BUILDING_VIEW_RADIUS * BUILDING_VIEW_RADIUS;
    const snapJsonCache = /* @__PURE__ */ new Map();
    const getSnapJson = (entity) => {
      let json = snapJsonCache.get(entity.id);
      if (!json) {
        json = JSON.stringify(entity.toSnap());
        snapJsonCache.set(entity.id, json);
      }
      return json;
    };
    for (const [, player] of this.players) {
      const nearby = this.chunks.getEntitiesInRadius(player.x, player.y, BUILDING_VIEW_RADIUS);
      const entityJsonParts = [];
      for (const p of nearby.players) {
        if (p.id === player.id) continue;
        const distSq = (p.x - player.x) ** 2 + (p.y - player.y) ** 2;
        if (distSq <= buildingViewRadiusSq) {
          entityJsonParts.push(getSnapJson(p));
        }
      }
      for (const e of nearby.enemies) {
        if (e.markedForRemoval) continue;
        const distSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
        if (distSq <= viewRadiusSq) {
          entityJsonParts.push(getSnapJson(e));
        }
      }
      for (const p of nearby.projectiles) {
        if (p.markedForRemoval) continue;
        const distSq = (p.x - player.x) ** 2 + (p.y - player.y) ** 2;
        if (distSq <= viewRadiusSq) {
          entityJsonParts.push(getSnapJson(p));
        }
      }
      for (const b of nearby.buildings) {
        if (b.markedForRemoval) continue;
        const distSq = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
        if (distSq <= buildingViewRadiusSq) {
          entityJsonParts.push(getSnapJson(b));
        }
      }
      const selfAnim = player.dead ? "dead" : player.anim;
      const json = `{"type":"snapshot","serverTime":${serverTime},"seq":${player.inputSeq},"dayPhase":"${dayPhase}","entities":[${entityJsonParts.join(",")}],"selfHp":${player.hp},"selfMaxHp":${player.maxHp},"selfSource":${player.source},"selfPos":{"x":${player.x},"y":${player.y}},"selfDead":${player.dead},"selfRespawnAt":${player.respawnAt},"selfFacing":${player.facing},"selfAnim":"${selfAnim}","selfShieldActive":${player.shieldActive},"selfShieldCooldownUntil":${player.shieldCooldownUntil},"selfParryActive":${player.parryActive},"selfParryCooldownUntil":${player.parryCooldownUntil},"selfPunchCooldownUntil":${player.punchCooldownUntil},"selfLungeCooldownUntil":${player.lungeCooldownUntil},"selfArrowCooldownUntil":${player.arrowCooldownUntil},"selfDashCooldownUntil":${player.dashCooldownUntil},"selfStatLevels":${JSON.stringify(player.statLevels)},"selfBankedSource":${player.bankedSource},"selfBuildingCount":${player.buildingCount}}`;
      player.sendRaw(json);
    }
  }
};

// server/src/server.ts
import http from "http";
import fs2 from "fs";
import path4 from "path";
import { WebSocketServer } from "ws";

// server/src/entities/Player.ts
var Player = class extends Entity {
  token;
  username;
  colors;
  ws;
  hp = PLAYER_HP;
  maxHp = PLAYER_HP;
  source = 0;
  bankedSource = 0;
  anim = "idle";
  // Persistence tracking
  totalSourceGenerated = 0;
  sourceFlushDirty = 0;
  lastSeenFlushTime = Date.now();
  pendingWinnerPrompt = false;
  // Input state
  dx = 0;
  dy = 0;
  autorun = false;
  autorunDx = 0;
  autorunDy = 0;
  inputSeq = 0;
  // Combat cooldowns
  punchCooldownUntil = 0;
  lungeCooldownUntil = 0;
  moveCooldownUntil = 0;
  // Pending actions for this tick
  pendingPunch = null;
  // facing angle
  pendingLunge = null;
  pendingShoot = null;
  // Arrow cooldown
  arrowCooldownUntil = 0;
  // Shield
  shieldActive = false;
  shieldUntil = 0;
  shieldCooldownUntil = 0;
  pendingShield = false;
  // Parry
  parryActive = false;
  parryUntil = 0;
  parryCooldownUntil = 0;
  pendingParry = false;
  // Dash
  pendingDash = false;
  dashCooldownUntil = 0;
  // Safe zone healing
  lastHealTime = 0;
  lastBedHealTime = 0;
  // Death & respawn
  dead = false;
  respawnAt = null;
  readyToRespawn = false;
  pendingRespawn = false;
  bedX = null;
  bedY = null;
  bedBuildingId = null;
  // Source walking tracker
  lastWalkAwardTime = 0;
  isMoving = false;
  // Building count
  buildingCount = 0;
  // Chat rate limiting
  lastChatTime = 0;
  // Inactivity tracking
  lastActivityTime = Date.now();
  kicked = false;
  // Safe zone attack warning throttle
  lastSafeZoneWarn = 0;
  // Stun (from lunge hits)
  stunUntil = 0;
  // Stat levels (persisted in DB)
  statLevels = defaultStatLevels();
  /** Get the player's effective move speed (with stat bonuses) */
  getSpeed() {
    return PLAYER_SPEED + this.statLevels.moveSpeed * STAT_INCREMENTS.moveSpeed;
  }
  // Party
  partyId = null;
  partySourceEarned = 0;
  // source earned since joining current party
  // Global whitelist (applied to all new gates/turrets)
  globalWhitelist = [];
  // Last snapshot tracking for delta compression
  lastSentEntities = /* @__PURE__ */ new Map();
  constructor(token, username, colors, ws, x, y) {
    super("player", x, y);
    this.token = token;
    this.username = username;
    this.colors = colors;
    this.ws = ws;
  }
  applyInput(msg) {
    this.inputSeq = msg.seq;
    this.dx = msg.dx;
    this.dy = msg.dy;
    this.facing = msg.facing;
    if (msg.autorun) {
      if (msg.dx !== 0 || msg.dy !== 0) {
        this.autorunDx = msg.dx;
        this.autorunDy = msg.dy;
      }
      this.autorun = true;
    } else {
      this.autorun = false;
    }
  }
  getMoveDx() {
    if (this.autorun && this.dx === 0 && this.dy === 0) return this.autorunDx;
    return this.dx;
  }
  getMoveDy() {
    if (this.autorun && this.dx === 0 && this.dy === 0) return this.autorunDy;
    return this.dy;
  }
  toSnap() {
    return {
      id: this.id,
      kind: "player",
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      facing: this.facing,
      colors: this.colors,
      username: this.username,
      anim: this.dead ? "dead" : this.anim,
      partyId: this.partyId ?? void 0
    };
  }
  send(data) {
    if (this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(data));
    }
  }
  /** Send pre-stringified data (avoids double-stringify for broadcast) */
  sendRaw(json) {
    if (this.ws.readyState === 1) {
      this.ws.send(json);
    }
  }
};

// server/src/services/ClaudeService.ts
import { readFileSync } from "fs";
import path from "path";
var ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
var PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
function loadClaudeRules() {
  try {
    return readFileSync(path.resolve(PROJECT_ROOT, "claude-rules.md"), "utf-8").trim();
  } catch {
    return "";
  }
}
async function generateRule(winnerName, rawInput, existingRules) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set \u2014 check .env file in project root");
  }
  console.log(`[ClaudeService] Making API call with key starting: ${apiKey.slice(0, 10)}...`);
  const rulesContext = existingRules.length > 0 ? existingRules.map((r, i) => `${i + 1}. ${r.text}`).join("\n") : "None yet.";
  const customRules = loadClaudeRules();
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `You are a game master for PlainScape, a real-time multiplayer survival browser game. Players earn Source currency by walking, killing enemies (lions during day, ghosts at night), and killing other players. They spend Source to build walls, gates, turrets, and beds. There is a safe zone at the center where players spawn \u2014 combat and building are disabled there.

Each day, the player who generated the most Source gets to add a new rule or game element. You must take their raw input and shape it into a single clear, concise, fair game rule or element description.

GUARDRAILS \u2014 the rule MUST NOT:
- Be unrelated to gameplay \u2014 rules must directly affect the game world, mechanics, or player experience. Reject jokes, memes, meta-commentary, real-world references, or anything that isn't a concrete game change.
- Remove, shrink, or compromise the safe zone or yellow (no-build) buffer zone in any way
- Alter the Bank NPC, Scribe NPC, or their functionality in any way
- Alter player names, login flow, or prevent players from being able to join the game
- Prevent players from building any of the 4 buildable structures (wall, gate, turret, bed) or remove/disable any of their core functions
- Prevent players from earning Source (currency) or remove/disable any existing way to earn Source
- Change the daily winner mechanic \u2014 the player with the highest total Source at the end of the day ALWAYS wins and gets to submit a rule. This is non-negotiable.
- Prevent new daily rules from being added or disable the rule submission system
- Remove or significantly alter existing UI elements (HUD, minimap, build bar, leaderboard, etc.)
- Make the game unplayable or crash-prone
- Give any single player permanent godlike advantages
- Be offensive, discriminatory, or inappropriate
- Break or corrupt the game's source code

The rule CAN:
- Add new enemies, items, or environmental effects
- Modify existing game parameters (speeds, damages, costs, spawn rates)
- Add fun social mechanics or challenges
- Change the day/night cycle behavior
- Add cosmetic effects

Currently active rules:
${rulesContext}
${customRules ? `
ADDITIONAL SERVER RULES \u2014 the server admin has added these extra constraints:
${customRules}
` : ""}
Respond with ONLY the rule text \u2014 one or two sentences max, plain text only (no markdown, no bold, no asterisks), no explanation or commentary.`,
      messages: [
        {
          role: "user",
          content: `Player "${winnerName}" wants to add this rule: ${rawInput}`
        }
      ]
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Empty response from Claude API");
  }
  return text;
}

// server/src/services/RuleImplementer.ts
import { execSync } from "child_process";
import fs from "fs";
import path2 from "path";
var PROJECT_ROOT2 = path2.resolve(import.meta.dirname, "../..");
var ANTHROPIC_API_URL2 = "https://api.anthropic.com/v1/messages";
var MAX_TURNS = parseInt(process.env.CLAUDE_MAX_TURNS || "50", 10);
var MAX_READ_RESULT = 8e3;
var MAX_RETRIES = 5;
var RETRY_BASE_DELAY = 15e3;
var TURN_DELAY = 2e3;
var READ_MODEL = "claude-haiku-4-5-20251001";
var TOOLS = [
  {
    name: "read_file",
    description: "Read the contents of a file. Path is relative to the project root. Returns the full file by default, or a specific line range if start_line/end_line are provided.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path from project root" },
        start_line: { type: "number", description: "First line to return (1-based, inclusive). Omit to start from beginning." },
        end_line: { type: "number", description: "Last line to return (1-based, inclusive). Omit to read to end." }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Write content to a file (creates or overwrites). Path is relative to the project root. Use this for NEW files. For modifying existing files, prefer edit_file instead.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path from project root" },
        content: { type: "string", description: "Full file content to write" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "edit_file",
    description: "Make a targeted edit to an existing file by replacing a specific string. Much more efficient than write_file for modifying existing files \u2014 you only send the changed portion. You can make multiple edits per call by providing multiple old/new pairs.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path from project root" },
        old_string: { type: "string", description: "Exact text to find and replace (must match uniquely in the file)" },
        new_string: { type: "string", description: "Text to replace it with" }
      },
      required: ["path", "old_string", "new_string"]
    }
  },
  {
    name: "run_command",
    description: "Run a shell command in the project root. ONLY use for: building (npm run build), listing directory contents (ls), or checking build output. Do NOT use for reading files (use read_file), editing files (use edit_file), or installing packages.",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command to run" }
      },
      required: ["command"]
    }
  },
  {
    name: "smoke_test",
    description: "Run a smoke test after a successful build. Boots a fresh server instance on a separate port, connects a fake player, sends movement inputs for ~5 seconds, and checks for runtime crashes (TypeError, ReferenceError, etc.). Returns PASS or FAIL with the crash error. ALWAYS run this after a successful build to catch runtime errors that compile fine but crash the server.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  }
];
var fileBackups = /* @__PURE__ */ new Map();
var readCache = /* @__PURE__ */ new Map();
var MAX_READ_TURNS = 6;
var consecutiveReadTurns = 0;
var hasWritten = false;
function backupFile(filePath) {
  if (fileBackups.has(filePath)) return;
  if (fs.existsSync(filePath)) {
    fileBackups.set(filePath, fs.readFileSync(filePath, "utf-8"));
  } else {
    fileBackups.set(filePath, null);
  }
}
function normalizePath(p) {
  return p.replace(/^(\/app\/|app\/|\.\/)/, "");
}
var SENSITIVE_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\./,
  /\.db$/,
  /\.db-journal$/,
  /\.db-wal$/,
  /\.pem$/,
  /\.key$/,
  /\/\.git\//,
  /^\.git\//
];
function isSensitivePath(normalizedPath) {
  const basename = path2.basename(normalizedPath);
  return SENSITIVE_FILE_PATTERNS.some((p) => p.test(normalizedPath) || p.test(basename));
}
function executeTool(name, input) {
  try {
    switch (name) {
      case "read_file": {
        if (!hasWritten && consecutiveReadTurns >= MAX_READ_TURNS) {
          console.log(`[RuleImplementer] READ REFUSED (${consecutiveReadTurns} consecutive read turns)`);
          return "ERROR: READ LIMIT REACHED. You have read enough files. You MUST use write_file now to implement the changes. Stop reading and start writing code immediately.";
        }
        const normalizedPath = normalizePath(input.path);
        if (isSensitivePath(normalizedPath)) {
          return "Error: access denied \u2014 this file contains sensitive data";
        }
        const startLine = input.start_line ? parseInt(input.start_line, 10) : input.start ? parseInt(input.start, 10) : 0;
        const endLine = input.end_line ? parseInt(input.end_line, 10) : input.end ? parseInt(input.end, 10) : 0;
        const hasLineRange = startLine > 0 || endLine > 0;
        const cacheKey = hasLineRange ? `${normalizedPath}:${startLine}-${endLine}` : normalizedPath;
        const cached = readCache.get(cacheKey);
        if (cached !== void 0) {
          console.log(`[RuleImplementer] Cache hit: ${cacheKey}`);
          return cached;
        }
        const filePath = path2.resolve(PROJECT_ROOT2, normalizedPath);
        if (!filePath.startsWith(PROJECT_ROOT2 + path2.sep) && filePath !== PROJECT_ROOT2) {
          return "Error: path escapes project root";
        }
        if (!fs.existsSync(filePath)) {
          return `Error: file not found: ${normalizedPath}`;
        }
        const content = fs.readFileSync(filePath, "utf-8");
        let result;
        if (hasLineRange) {
          const lines = content.split("\n");
          const start = Math.max(1, startLine) - 1;
          const end = endLine > 0 ? Math.min(endLine, lines.length) : lines.length;
          const slice = lines.slice(start, end);
          result = slice.map((line, i) => `${start + i + 1}: ${line}`).join("\n");
          if (result.length > MAX_READ_RESULT) {
            result = result.slice(0, MAX_READ_RESULT) + `
... (truncated at ${MAX_READ_RESULT} chars)`;
          }
          result = `[Lines ${start + 1}-${end} of ${lines.length}]
${result}`;
        } else if (content.length > MAX_READ_RESULT) {
          result = content.slice(0, MAX_READ_RESULT) + `
... (truncated at ${MAX_READ_RESULT} chars \u2014 ${content.length} total)`;
        } else {
          result = content;
        }
        readCache.set(cacheKey, result);
        return result;
      }
      case "write_file": {
        const normalizedPath = normalizePath(input.path);
        if (isSensitivePath(normalizedPath)) {
          return "Error: access denied \u2014 this file contains sensitive data";
        }
        const filePath = path2.resolve(PROJECT_ROOT2, normalizedPath);
        if (!filePath.startsWith(PROJECT_ROOT2 + path2.sep) && filePath !== PROJECT_ROOT2) {
          return "Error: path escapes project root";
        }
        const dir = path2.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        if (input.content && /process\.env\.(ANTHROPIC_API_KEY|PATREON_KEY|PATREON_CLIENT_SECRET|GITHUB_TOKEN|GITHUB_PAT|ADMIN_CONSOLE_PASSWORD|REGISTRY_SECRET|DEMO_KEY)/.test(input.content)) {
          return "Error: code must not access sensitive environment variables";
        }
        backupFile(filePath);
        fs.writeFileSync(filePath, input.content);
        hasWritten = true;
        for (const key of readCache.keys()) {
          if (key === normalizedPath || key.startsWith(normalizedPath + ":")) {
            readCache.delete(key);
          }
        }
        return `Successfully wrote ${normalizedPath}`;
      }
      case "edit_file": {
        const normalizedPath = normalizePath(input.path);
        if (isSensitivePath(normalizedPath)) {
          return "Error: access denied \u2014 this file contains sensitive data";
        }
        const filePath = path2.resolve(PROJECT_ROOT2, normalizedPath);
        if (!filePath.startsWith(PROJECT_ROOT2 + path2.sep) && filePath !== PROJECT_ROOT2) {
          return "Error: path escapes project root";
        }
        if (!fs.existsSync(filePath)) {
          return `Error: file not found: ${normalizedPath}`;
        }
        const content = fs.readFileSync(filePath, "utf-8");
        const oldStr = input.old_string;
        const newStr = input.new_string;
        if (!oldStr) {
          return "Error: old_string is required";
        }
        if (newStr && /process\.env\.(ANTHROPIC_API_KEY|PATREON_KEY|PATREON_CLIENT_SECRET|GITHUB_TOKEN|GITHUB_PAT|ADMIN_CONSOLE_PASSWORD|REGISTRY_SECRET|DEMO_KEY)/.test(newStr)) {
          return "Error: code must not access sensitive environment variables";
        }
        const occurrences = content.split(oldStr).length - 1;
        if (occurrences === 0) {
          return `Error: old_string not found in ${normalizedPath}. Make sure the text matches exactly (including whitespace and newlines).`;
        }
        if (occurrences > 1) {
          return `Error: old_string found ${occurrences} times in ${normalizedPath}. It must be unique \u2014 include more surrounding context to match exactly one location.`;
        }
        backupFile(filePath);
        const updated = content.replace(oldStr, newStr);
        fs.writeFileSync(filePath, updated);
        hasWritten = true;
        for (const key of readCache.keys()) {
          if (key === normalizedPath || key.startsWith(normalizedPath + ":")) {
            readCache.delete(key);
          }
        }
        return `Successfully edited ${normalizedPath}`;
      }
      case "smoke_test": {
        console.log("[RuleImplementer] Running smoke test...");
        try {
          const result = execSync("node scripts/smoke-test.mjs", {
            cwd: PROJECT_ROOT2,
            timeout: 2e4,
            maxBuffer: 1024 * 1024,
            stdio: ["pipe", "pipe", "pipe"]
          });
          const output = result.toString().slice(-2e3);
          console.log("[RuleImplementer] Smoke test passed");
          return `SMOKE TEST PASSED

${output}`;
        } catch (err) {
          const stderr = err && typeof err === "object" && "stderr" in err ? err.stderr?.toString?.()?.slice(0, 2e3) || "" : "";
          const stdout = err && typeof err === "object" && "stdout" in err ? err.stdout?.toString?.()?.slice(0, 2e3) || "" : "";
          const combined = `${stdout}
${stderr}`.trim();
          console.error("[RuleImplementer] Smoke test FAILED");
          return `SMOKE TEST FAILED \u2014 Runtime crash detected!

${combined}

Fix the crash and rebuild, then run smoke_test again.`;
        }
      }
      case "run_command": {
        const cmd = input.command.trim();
        const ALLOWED_COMMANDS = [
          /^npx esbuild\s/,
          /^npm run build$/,
          /^node scripts\/smoke-test\.mjs$/,
          /^ls(\s|$)/,
          /^find\s/,
          /^pwd$/
        ];
        if (!ALLOWED_COMMANDS.some((r) => r.test(cmd))) {
          return "Error: command not in allowlist. Only build commands (npx esbuild, npm run build), ls, find, pwd, and node scripts/smoke-test.mjs are allowed. Use read_file/write_file/edit_file for file operations.";
        }
        const output = execSync(cmd, {
          cwd: PROJECT_ROOT2,
          timeout: 6e4,
          maxBuffer: 1024 * 1024,
          stdio: ["pipe", "pipe", "pipe"]
        });
        return output.toString().slice(0, 1e4);
      }
      default:
        return `Error: unknown tool: ${name}`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (err && typeof err === "object" && "stderr" in err) {
      const stderr = err.stderr?.toString?.()?.slice(0, 5e3) || "";
      return `Error: ${msg}
stderr: ${stderr}`;
    }
    return `Error: ${msg}`;
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function trimMessages(messages) {
  const KEEP_RECENT = 10;
  return messages.map((msg, i) => {
    if (i >= messages.length - KEEP_RECENT) return msg;
    if (msg.role !== "user" || typeof msg.content === "string") return msg;
    const trimmed = msg.content.map((block) => {
      if (block.type === "tool_result" && block.content.length > 500) {
        return { ...block, content: "(file content already read \u2014 see earlier context)" };
      }
      return block;
    });
    return { ...msg, content: trimmed };
  });
}
async function callClaude(systemPrompt, messages, modelOverride) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  const model = modelOverride || process.env.CLAUDE_RULE_MODEL || "claude-opus-4-6";
  const trimmedMessages = trimMessages(messages);
  const apiMessages = trimmedMessages.map((msg, i) => {
    if (i === trimmedMessages.length - 1 && msg.role === "user") {
      if (typeof msg.content === "string") {
        return {
          role: msg.role,
          content: [{ type: "text", text: msg.content, cache_control: { type: "ephemeral" } }]
        };
      }
    }
    return msg;
  });
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(ANTHROPIC_API_URL2, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31"
      },
      body: JSON.stringify({
        model,
        max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || "16384", 10),
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        tools: TOOLS,
        messages: apiMessages
      })
    });
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = response.headers.get("retry-after");
      const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1e3 : RETRY_BASE_DELAY * (attempt + 1);
      console.log(`[RuleImplementer] Rate limited (429), waiting ${Math.round(delayMs / 1e3)}s before retry ${attempt + 1}/${MAX_RETRIES}`);
      await sleep(delayMs);
      continue;
    }
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }
    const data = await response.json();
    if (data.usage) {
      const cached = data.usage.cache_read_input_tokens || 0;
      const created = data.usage.cache_creation_input_tokens || 0;
      const input = data.usage.input_tokens || 0;
      if (cached > 0 || created > 0) {
        console.log(`[RuleImplementer] Tokens \u2014 input: ${input}, cache_read: ${cached}, cache_created: ${created}`);
      }
    }
    return data;
  }
  throw new Error("Claude API rate limit exceeded after all retries");
}
function getBuildCommand() {
  return [
    "npx esbuild server/src/main.ts --bundle --outfile=server/dist/main.js",
    "--platform=node --format=esm --sourcemap",
    "--alias:@plainscape/shared=./packages/shared/src/index.ts",
    "--external:ws --external:better-sqlite3",
    "&&",
    "npx esbuild client/src/main.ts --bundle --outfile=client/dist/game.js --format=esm --sourcemap",
    "--alias:@plainscape/shared=./packages/shared/src/index.ts"
  ].join(" ");
}
function ensureGitRepo() {
  try {
    execSync("git status", { cwd: PROJECT_ROOT2, stdio: "pipe" });
  } catch {
    console.log("[RuleImplementer] Initializing git repo...");
    const gitignore = [
      "node_modules/",
      "dist/",
      "data/",
      "*.db",
      ".env",
      "proc/",
      "sys/",
      "dev/",
      "tmp/",
      "run/"
    ].join("\n");
    fs.writeFileSync(path2.join(PROJECT_ROOT2, ".gitignore"), gitignore);
    execSync("git init", { cwd: PROJECT_ROOT2, stdio: "pipe" });
    execSync('git config user.name "PlainScape Bot"', { cwd: PROJECT_ROOT2, stdio: "pipe" });
    execSync('git config user.email "bot@plainscape.game"', { cwd: PROJECT_ROOT2, stdio: "pipe" });
    execSync("git add -A", { cwd: PROJECT_ROOT2, stdio: "pipe" });
    execSync('git commit -m "initial"', { cwd: PROJECT_ROOT2, stdio: "pipe" });
    console.log("[RuleImplementer] Git repo initialized");
  }
}
function commitAndPush(ruleText) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    console.log("[RuleImplementer] No GITHUB_TOKEN/GITHUB_REPO \u2014 skipping git push");
    return { success: true };
  }
  try {
    const modifiedFiles = [...fileBackups.keys()].map(
      (f) => path2.relative(PROJECT_ROOT2, f)
    );
    for (const [filePath, original] of fileBackups) {
      if (original === null) {
        modifiedFiles.push(path2.relative(PROJECT_ROOT2, filePath));
      }
    }
    if (modifiedFiles.length === 0) {
      return { success: false, error: "No files to commit" };
    }
    for (const file of modifiedFiles) {
      execSync(`git add "${file}"`, { cwd: PROJECT_ROOT2, stdio: "pipe" });
    }
    const commitMsg = `rule: ${ruleText.slice(0, 200)}`;
    const commitMsgFile = path2.join(PROJECT_ROOT2, ".commit-msg-tmp");
    fs.writeFileSync(commitMsgFile, commitMsg);
    execSync(`git commit -F "${commitMsgFile}"`, { cwd: PROJECT_ROOT2, stdio: "pipe" });
    fs.unlinkSync(commitMsgFile);
    const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
    try {
      execSync(`git remote set-url origin ${remoteUrl}`, { cwd: PROJECT_ROOT2, stdio: "pipe" });
    } catch {
      execSync(`git remote add origin ${remoteUrl}`, { cwd: PROJECT_ROOT2, stdio: "pipe" });
    }
    const targetBranch = process.env.GIT_PUSH_BRANCH || "live";
    execSync(`git push origin HEAD:${targetBranch} --force`, { cwd: PROJECT_ROOT2, stdio: "pipe" });
    console.log(`[RuleImplementer] Pushed to ${targetBranch} branch`);
    return { success: true };
  } catch (err) {
    console.error("[RuleImplementer] Git push failed:", err instanceof Error ? err.message : err);
    return { success: false, error: "Failed to push changes" };
  }
}
async function implementRule(ruleText) {
  const model = process.env.CLAUDE_RULE_MODEL || "claude-opus-4-6";
  console.log(`[RuleImplementer] Implementing rule via ${model}: "${ruleText}"`);
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY not set" };
  }
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    return { success: false, error: "GITHUB_TOKEN and GITHUB_REPO required for rule deployment" };
  }
  try {
    ensureGitRepo();
  } catch (err) {
    return { success: false, error: `Git init failed: ${err instanceof Error ? err.message : err}` };
  }
  fileBackups.clear();
  readCache.clear();
  consecutiveReadTurns = 0;
  hasWritten = false;
  let ruleGuide = "";
  try {
    const guidePath = path2.resolve(PROJECT_ROOT2, "RULE_GUIDE.md");
    if (fs.existsSync(guidePath)) {
      ruleGuide = fs.readFileSync(guidePath, "utf-8");
    }
  } catch {
  }
  const systemPrompt = `You are modifying the PlainScape game codebase to implement a player-submitted rule.

RULE TO IMPLEMENT: "${ruleText}"

## TURN BUDGET: ${MAX_TURNS} turns maximum

You have a HARD LIMIT of ${MAX_TURNS} API turns to complete this rule. Each time you respond (whether with tool calls or text) uses one turn. Plan accordingly:
- Turns 1-3: Read files and plan
- Turns 4-${MAX_TURNS - 8}: Implement (batch writes together \u2014 write multiple files in a single turn)
- Last 8 turns: Reserved for build, smoke test, fix any crashes, rebuild, and say DONE

If you're running low on turns, prioritize getting a working build over perfect code.

## APPROACH \u2014 Plan First, Then Implement

1. PLAN: Before writing any code, read the RULE_GUIDE.md (provided below) and 1-2 key files. Then write out a brief plan (which files to create/modify, what each change does). Keep the plan concise \u2014 5-10 lines max.
2. IMPLEMENT: Execute your plan. Use write_file for NEW files, edit_file for modifying existing files. Batch multiple tool calls into a single turn whenever possible.
3. BUILD: Run the build command to verify compilation. Fix any errors.
4. SMOKE TEST: After a successful build, call the smoke_test tool. This boots a fresh server, connects a fake player, and checks for runtime crashes. If it fails, read the error, fix your code, rebuild, and run smoke_test again.
5. VERIFY: Check that your changes are correct and complete.

## PROJECT STRUCTURE & API REFERENCE

${ruleGuide || "Read RULE_GUIDE.md at the project root for the full API reference, templates, and patterns."}

## CRITICAL RULES \u2014 Read These Carefully

### Timing
- \`delta\` = seconds (float). \`Date.now()\` = milliseconds.
- Movement: \`speed * delta\` = units moved per tick.
- Cooldowns/intervals: compare \`Date.now()\` against stored ms timestamps.
- GOOD: \`if (now - lastCheck > INTERVAL) { lastCheck = now; ... }\`
- BAD: \`timer += dt; if (timer > INTERVAL) { ... }\` (accumulation drifts)

### Do NOT Change Existing Function Signatures
Adding parameters to \`moveEnemy\`, \`tickMovement\`, \`tickCombat\`, etc. requires updating EVERY call site and WILL break the build. Instead:
- Access \`world\` directly in your new system.
- Create NEW helper functions rather than modifying existing ones.

### Use Correct Property Names
- \`world.players\` \u2014 Map<number, Player>
- \`world.enemies\` \u2014 Map<number, Enemy>
- \`world.buildings\` or \`world.buildingsById\` \u2014 Map<number, Building> (both work)
- \`world.dayPhase\` \u2014 returns 'day' | 'night' | 'dawn' | 'dusk'
- \`player.dead\` \u2014 boolean (NOT \`player.isDead\`)
- \`enemy.markedForRemoval\` \u2014 boolean (NOT \`enemy.dead\`)

### Preferred Pattern: New System File
For most rules, create a new file \`server/src/systems/YourRuleSystem.ts\`, then wire it into World.ts tick() before the broadcast step. Use the templates in RULE_GUIDE.md.

### Import from RuleHelpers
Use \`import { killPlayer, awardSource, moveEnemy, generateId, ... } from './RuleHelpers.js'\` for common functions and constants.

### Entity ID Generation
When creating new entities, ALWAYS use \`generateId()\` from RuleHelpers or \`../utils/IdGenerator.js\`.
NEVER call \`world.nextEntityId()\` \u2014 that method does NOT exist and will crash the server.

## BUILD COMMAND

${getBuildCommand()}

Do NOT use "npm run build" \u2014 use the esbuild command above.

## FILE PATHS

All paths are RELATIVE to the project root. Use "packages/shared/src/constants.ts", NOT "/app/packages/..." or "app/packages/...".

## CONSTRAINTS \u2014 You MUST NOT:
- Implement anything unrelated to gameplay \u2014 if the rule doesn't describe a concrete game mechanic, effect, or change to the game world, respond with DONE immediately and make no changes
- Remove, shrink, or compromise the safe zone or no-build buffer zone
- Alter the Bank NPC, Scribe NPC, or their functionality
- Alter player names, login flow, or prevent players from joining
- Prevent building any of the 4 structures or remove their core functions
- Prevent players from earning Source or remove any way to earn Source
- Change the daily winner mechanic (highest Source at end of day wins)
- Prevent new daily rules from being added
- Remove or significantly alter existing UI elements
- Make the game unplayable or crash-prone
- Add npm dependencies
- Modify files outside the project
- Change existing function signatures (add new functions instead)

## KEY INSERTION POINTS (so you don't need to read these files)

### World.ts \u2014 Adding a new system to the game loop
\`\`\`typescript
// 1. Add import at top of server/src/world/World.ts (after existing system imports around line 8-17):
import { tickMySystem } from '../systems/MySystem.js';

// 2. Add call in tick() BEFORE line "this.broadcast();" (around line 220):
// 12.9 My rule system
tickMySystem(this, delta);
\`\`\`

### MovementSystem.ts \u2014 Modifying player speed
\`\`\`typescript
// Line ~39 in server/src/systems/MovementSystem.ts:
let speed = (PLAYER_SPEED + player.statLevels.moveSpeed * STAT_INCREMENTS.moveSpeed) * delta;
// Add your modifier AFTER that line:
// if (someCondition) speed *= 0.6; // 40% slowdown
\`\`\`

### MovementSystem.ts \u2014 Modifying enemy speed
\`\`\`typescript
// The moveEnemy function uses enemy.speed directly.
// To slow an enemy, modify enemy.speed before movement or multiply in your system.
\`\`\`

### World.ts \u2014 Adding entities to broadcast
\`\`\`typescript
// In broadcast() method (~line 341), entities are added to entityJsonParts.
// Add your custom entities using: entityJsonParts.push(getSnapJson(myEntity));
\`\`\`

### World.ts \u2014 Adding a tarPits/custom entity map
\`\`\`typescript
// Add as a class field (~line 35, after buildingsById):
readonly tarPits = new Map<number, TarPit>();

// Add import at top alongside other entity imports:
import { TarPit } from '../entities/TarPit.js';
\`\`\`

### HudRenderer.ts \u2014 Adding entities to the minimap (REQUIRED for visible entities)
\`\`\`typescript
// In client/src/ui/HudRenderer.ts, the drawMinimap function has an if/else chain
// for entity.kind (~line 133). Add your new kind BEFORE the lion/ghost branch:
//
//   } else if (entity.kind === 'your_kind') {
//     ctx.fillStyle = 'rgba(R, G, B, 0.5)';  // pick a distinct color
//     ctx.beginPath();
//     ctx.arc(mx, my, 3, 0, Math.PI * 2);  // or use fillRect for squares
//     ctx.fill();
//   } else if (entity.kind === 'lion' || entity.kind === 'ghost') {
//
// The variables mx, my are already computed (minimap coordinates).
// Use edit_file to insert your branch.
\`\`\`

### Renderer.ts \u2014 Adding entity rendering (REQUIRED for visible entities)
\`\`\`typescript
// In client/src/rendering/Renderer.ts, the render() method draws entities.
// Add your custom entity drawing in the render method (~line 60-100):
//
//   for (const [, entity] of state.entities) {
//     if (entity.kind === 'your_kind') {
//       // Draw using ctx (Canvas 2D API)
//       // entity.x, entity.y are world coordinates
//       // Use ctx.save/restore and translate by camera offset
//     }
//   }
//
// Or create a separate renderer file and import it.
\`\`\`

## COMMON MISTAKES \u2014 WILL CRASH THE SERVER

These are real bugs from past rule implementations. NEVER make these mistakes:

\`\`\`
\u274C world.nextEntityId()        \u2192 \u2705 generateId() from '../utils/IdGenerator.js' or './RuleHelpers.js'
\u274C player.isDead               \u2192 \u2705 player.dead
\u274C enemy.dead                  \u2192 \u2705 enemy.markedForRemoval
\u274C world.addEntity(e)          \u2192 \u2705 world.addEnemy(e) / world.addProjectile(e) / world.addBuilding(e)
\u274C new Enemy(id, ...)          \u2192 \u2705 new Enemy(kind, x, y, hp, speed, ...) \u2014 ID is auto-generated by Entity base class
\u274C import from '/app/...'      \u2192 \u2705 import from relative path ('./...' or '../...')
\u274C import from 'shared/...'    \u2192 \u2705 import from '@plainscape/shared'
\u274C timer += dt; if(timer>N)    \u2192 \u2705 if (now - lastCheck > N) { lastCheck = now; ... }
\u274C modifying existing function signatures \u2192 \u2705 create new helper functions
\`\`\`

## EFFICIENCY \u2014 CRITICAL
- The RULE_GUIDE.md above contains INLINED source code for Entity, Enemy, Lion, Player, Projectile, World methods, and ChunkManager. You do NOT need to read these files.
- You already have the insertion points above \u2014 do NOT read World.ts or MovementSystem.ts unless you need details not shown here
- Read at most 1-2 files before starting implementation \u2014 most info is already provided
- Do NOT re-read files you've already seen \u2014 you will be cut off after 6 read-only turns
- Use edit_file for surgical changes to existing files (much cheaper than write_file for large files)
- Use write_file only for creating NEW files
- Do NOT use run_command with cat, grep, sed, head, or tail \u2014 use read_file and edit_file instead
- Batch multiple tool calls (read_file, write_file, edit_file) into a SINGLE turn whenever possible
- Each turn costs an API call \u2014 minimize total turns by batching

When done, say "DONE" in your final message.`;
  const messages = [
    { role: "user", content: `Implement this player rule: "${ruleText}"

Start by reading RULE_GUIDE.md (if you haven't already from the system prompt) for templates and API reference. Then:
1. Write a brief plan (5-10 lines) of what you'll change
2. Implement the changes
3. Build and fix any errors
4. Run smoke_test to catch runtime crashes \u2014 if it fails, fix the error, rebuild, and retest
5. Say DONE when complete` }
  ];
  try {
    let lastTurnReadOnly = false;
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      if (turn > 0) await sleep(TURN_DELAY);
      const useReadModel = lastTurnReadOnly && turn > 0 && turn <= 4;
      const turnModel = useReadModel ? READ_MODEL : void 0;
      if (useReadModel) {
        console.log(`[RuleImplementer] Turn ${turn + 1}/${MAX_TURNS} (via ${READ_MODEL})`);
      } else {
        console.log(`[RuleImplementer] Turn ${turn + 1}/${MAX_TURNS}`);
      }
      const result = await callClaude(systemPrompt, messages, turnModel);
      for (const block of result.content) {
        if (block.type === "text") {
          console.log(`[RuleImplementer:claude] ${block.text.slice(0, 200)}`);
        }
      }
      messages.push({ role: "assistant", content: result.content });
      if (result.stop_reason === "end_turn") {
        console.log("[RuleImplementer] Claude finished (end_turn)");
        break;
      }
      const toolCalls = result.content.filter(
        (b) => b.type === "tool_use"
      );
      if (toolCalls.length === 0) {
        console.log("[RuleImplementer] No tool calls, finishing");
        break;
      }
      const toolResults = [];
      for (const call of toolCalls) {
        console.log(`[RuleImplementer] Tool: ${call.name}(${call.name === "write_file" ? call.input.path : JSON.stringify(call.input).slice(0, 100)})`);
        const toolOutput = executeTool(call.name, call.input);
        console.log(`[RuleImplementer] Result: ${toolOutput.slice(0, 200)}`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: call.id,
          content: toolOutput
        });
      }
      const turnsRemaining = MAX_TURNS - turn - 1;
      const isReadOnly = toolCalls.every((c) => c.name === "read_file");
      if (isReadOnly && turn >= 4) {
        messages.push({ role: "user", content: toolResults });
        messages.push({ role: "assistant", content: [{ type: "text", text: "(Understood \u2014 moving to implementation now)" }] });
        messages.push({ role: "user", content: `\u26A0\uFE0F You've spent ${turn + 1} turns reading files. STOP reading and START writing code NOW. You have enough context. Begin implementing immediately with write_file calls.` });
      } else if (turnsRemaining <= 8 && turnsRemaining > 0) {
        const warning = turnsRemaining <= 3 ? `\u26A0\uFE0F CRITICAL: Only ${turnsRemaining} turns left! Build NOW and say DONE.` : `\u26A0\uFE0F ${turnsRemaining} turns remaining. Wrap up implementation and build soon.`;
        messages.push({ role: "user", content: toolResults });
        messages.push({ role: "assistant", content: [{ type: "text", text: `(Noted: ${turnsRemaining} turns remaining)` }] });
        messages.push({ role: "user", content: warning });
      } else {
        messages.push({ role: "user", content: toolResults });
      }
      lastTurnReadOnly = toolCalls.every((c) => c.name === "read_file");
      if (lastTurnReadOnly) {
        consecutiveReadTurns++;
      } else {
        consecutiveReadTurns = 0;
      }
    }
    if (fileBackups.size === 0) {
      return { success: false, error: "No code changes were made" };
    }
    const validationErrors = [];
    for (const [filePath] of fileBackups) {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      const relPath = path2.relative(PROJECT_ROOT2, filePath);
      if (content.includes("player.isDead") && !content.includes("// isDead")) {
        validationErrors.push(`${relPath}: uses "player.isDead" \u2014 should be "player.dead"`);
      }
      if (content.includes("enemy.dead") && !content.includes("enemy.dead =")) {
        validationErrors.push(`${relPath}: uses "enemy.dead" \u2014 should be "enemy.markedForRemoval"`);
      }
      if (content.includes("'/app/") || content.includes('"/app/')) {
        validationErrors.push(`${relPath}: contains "/app/" import path \u2014 use relative paths`);
      }
      if (content.includes(".nextEntityId(") || content.includes(".nextEntityId (")) {
        validationErrors.push(`${relPath}: uses "nextEntityId()" which does NOT exist \u2014 use generateId() from utils/IdGenerator.js`);
      }
      if (content.includes(".addEntity(")) {
        validationErrors.push(`${relPath}: uses "addEntity()" which does NOT exist \u2014 use addEnemy(), addProjectile(), or addBuilding()`);
      }
    }
    if (validationErrors.length > 0) {
      console.warn(`[RuleImplementer] Validation warnings:
${validationErrors.join("\n")}`);
    }
    console.log("[RuleImplementer] Final build verification...");
    const buildResult = executeTool("run_command", { command: getBuildCommand() });
    if (buildResult.startsWith("Error:")) {
      console.error("[RuleImplementer] Final build failed:", buildResult.slice(0, 500));
      rollback();
      return { success: false, error: "Build failed after implementation" };
    }
    console.log("[RuleImplementer] Final smoke test (safety net)...");
    try {
      const smokeOutput = execSync("node scripts/smoke-test.mjs", {
        cwd: PROJECT_ROOT2,
        timeout: 2e4,
        maxBuffer: 1024 * 1024,
        stdio: ["pipe", "pipe", "pipe"]
      });
      console.log("[RuleImplementer] Smoke test passed \u2014", smokeOutput.toString().slice(-100).trim());
    } catch (err) {
      const stderr = err && typeof err === "object" && "stderr" in err ? err.stderr?.toString?.()?.slice(0, 500) || "" : "";
      const stdout = err && typeof err === "object" && "stdout" in err ? err.stdout?.toString?.()?.slice(0, 500) || "" : "";
      console.error("[RuleImplementer] Smoke test FAILED:", `${stdout}
${stderr}`.slice(0, 500));
      rollback();
      return { success: false, error: `Runtime crash detected: ${stdout}
${stderr}`.slice(0, 300) };
    }
    console.log(`[RuleImplementer] All checks passed (${fileBackups.size} files modified), pushing to git...`);
    const pushResult = commitAndPush(ruleText);
    if (!pushResult.success) {
      console.error("[RuleImplementer] Push failed, rolling back");
      rollback();
      return { success: false, error: pushResult.error || "Failed to push" };
    }
    return { success: true };
  } catch (err) {
    console.error("[RuleImplementer] Error:", err);
    rollback();
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
function rollback() {
  let restored = 0;
  for (const [filePath, original] of fileBackups) {
    try {
      if (original === null) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else {
        fs.writeFileSync(filePath, original);
      }
      restored++;
    } catch (err) {
      console.error(`[RuleImplementer] Failed to rollback ${filePath}:`, err);
    }
  }
  fileBackups.clear();
  console.log(`[RuleImplementer] Rolled back ${restored} files`);
}
function scheduleRestart() {
  console.log("[RuleImplementer] Changes pushed to git \u2014 Railway will redeploy automatically");
}

// server/src/systems/DailyWinnerScheduler.ts
var PHOENIX_UTC_OFFSET = parseInt(process.env.TIMEZONE_UTC_OFFSET || "-7", 10);
var DUSK_HOUR = parseInt(process.env.CHAMPION_HOUR || "18", 10);
var DailyWinnerScheduler = class {
  world;
  timeout = null;
  rulesEnabled;
  constructor(world2) {
    this.world = world2;
    this.rulesEnabled = !!process.env.ANTHROPIC_API_KEY;
    if (!this.rulesEnabled) {
      console.log("[DailyWinner] No ANTHROPIC_API_KEY set \u2014 rule system disabled");
      return;
    }
    if (this.missedTodaysCheck()) {
      console.log("[DailyWinner] Missed today's check \u2014 running immediately on first player join");
      this.pendingCatchUp = true;
    }
    this.scheduleNext();
  }
  pendingCatchUp = false;
  scheduleNext() {
    const ms = msUntilNextDusk();
    console.log(`[DailyWinner] Next check in ${Math.round(ms / 6e4)} minutes`);
    this.timeout = setTimeout(() => this.runCheck(), ms);
  }
  runCheck() {
    console.log("[DailyWinner] Checking for daily winner...");
    const phoenixNow = new Date(Date.now() + PHOENIX_UTC_OFFSET * 36e5);
    this.world.db.setWorldStateValue("champion_check_date", phoenixNow.toISOString().slice(0, 10));
    let winnerUsername = null;
    let highestSource = 0;
    for (const [, player] of this.world.players) {
      if (player.totalSourceGenerated > highestSource) {
        highestSource = player.totalSourceGenerated;
        winnerUsername = player.username;
      } else if (player.totalSourceGenerated === highestSource && winnerUsername) {
        if (player.username < winnerUsername) {
          winnerUsername = player.username;
        }
      }
    }
    const dbLeader = this.world.db.getLeaderboard(1);
    if (dbLeader.length > 0) {
      const dbTop = dbLeader[0];
      if (dbTop.total_source_generated > highestSource) {
        highestSource = dbTop.total_source_generated;
        winnerUsername = dbTop.username;
      } else if (dbTop.total_source_generated === highestSource && winnerUsername && dbTop.username < winnerUsername) {
        winnerUsername = dbTop.username;
      }
    }
    if (!winnerUsername || highestSource === 0) {
      console.log("[DailyWinner] No player has generated source, skipping");
      this.scheduleNext();
      return;
    }
    this.world.db.setWorldStateValue("champion_username", winnerUsername);
    this.world.db.deleteWorldStateValue("champion_rule");
    this.broadcastChampionInfo();
    const onlineWinner = this.world.playersByUsername.get(winnerUsername);
    if (onlineWinner) {
      this.processWinner(onlineWinner);
    } else {
      console.log(`[DailyWinner] Winner ${winnerUsername} is offline, saving for next login`);
      this.world.pendingWinnerUsername = winnerUsername;
      this.world.broadcastAll({
        type: "event",
        kind: "kill",
        message: `${winnerUsername} has been chosen as today's champion! They will add a rule when they return.`
      });
    }
    this.scheduleNext();
  }
  processWinner(winner) {
    console.log(`[DailyWinner] Winner: ${winner.username} with ${winner.totalSourceGenerated} source`);
    this.world.broadcastAll({
      type: "event",
      kind: "kill",
      message: `${winner.username} is today's champion! They will now choose a rule.`
    });
    winner.pendingWinnerPrompt = true;
    const topSugg = this.world.db.getTopSuggestion();
    const topSuggestion = topSugg ? {
      id: topSugg.id,
      text: topSugg.text,
      createdBy: topSugg.created_by,
      votes: topSugg.votes,
      votedByMe: false
    } : null;
    winner.send({
      type: "winner_prompt",
      winnerName: winner.username,
      topSuggestion
    });
  }
  sacrificePlayer(player) {
    player.source = 0;
    player.totalSourceGenerated = 0;
    player.sourceFlushDirty = 0;
    player.hp = player.maxHp;
    player.dead = false;
    player.respawnAt = null;
    player.shieldActive = false;
    player.statLevels = defaultStatLevels();
    this.world.db.resetPlayerStats(player.token);
    const oldX = player.x;
    const oldY = player.y;
    player.x = (Math.random() - 0.5) * 200;
    player.y = (Math.random() - 0.5) * 200;
    this.world.chunks.updateEntityChunk(player, oldX, oldY);
  }
  /** Called from server.ts on player join to check if they have a pending winner prompt */
  checkPendingPromptOnLogin(player) {
    if (this.world.pendingWinnerUsername === player.username) {
      player.pendingWinnerPrompt = true;
      this.world.pendingWinnerUsername = null;
      const topSugg = this.world.db.getTopSuggestion();
      const topSuggestion = topSugg ? {
        id: topSugg.id,
        text: topSugg.text,
        createdBy: topSugg.created_by,
        votes: topSugg.votes,
        votedByMe: false
      } : null;
      player.send({
        type: "winner_prompt",
        winnerName: player.username,
        topSuggestion
      });
    }
  }
  /** Handle rule submission from a winner */
  async handleRuleSubmission(player, text) {
    if (!this.rulesEnabled) {
      player.send({ type: "error", message: "Rule system is disabled on this server (no API key configured)." });
      return;
    }
    if (!player.pendingWinnerPrompt) return;
    player.pendingWinnerPrompt = false;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500) {
      player.send({ type: "error", message: "Rule text must be 1-500 characters." });
      player.pendingWinnerPrompt = true;
      return;
    }
    const INJECTION_PATTERNS = [
      /ignore\s+(previous|prior|above|all)\s+(instructions|prompts|rules)/i,
      /disregard\s+(previous|prior|above|all)/i,
      /you\s+are\s+(now|no\s+longer)/i,
      /system\s*prompt/i,
      /run_command/i,
      /execSync/i,
      /exec\s*\(/i,
      /child_process/i,
      /\bimport\s*\(/i,
      /require\s*\(/i,
      /\bcurl\b/i,
      /\bwget\b/i,
      /\beval\b/i,
      /process\.env/i,
      /\.env\b/i
    ];
    if (INJECTION_PATTERNS.some((p) => p.test(trimmed))) {
      player.send({ type: "error", message: "Rule text contains disallowed content. Please write a gameplay rule." });
      player.pendingWinnerPrompt = true;
      console.warn(`[DailyWinner] Rejected rule from ${player.username} \u2014 possible injection: "${trimmed.slice(0, 100)}"`);
      return;
    }
    const topSugg = this.world.db.getTopSuggestion();
    const pickedTopSuggestion = topSugg && trimmed === `__PICK_SUGGESTION_${topSugg.id}__`;
    if (pickedTopSuggestion) {
      player.source = 0;
      player.bankedSource = 0;
      player.totalSourceGenerated = 0;
      player.sourceFlushDirty = 0;
      this.world.db.resetPlayerSourceOnly(player.token);
      this.world.db.setBankedSource(player.token, 0);
      try {
        const ruleText = await generateRule(player.username, topSugg.text, this.world.rules);
        await this.implementAndApplyRule(player.username, ruleText);
        this.world.broadcastAll({
          type: "event",
          kind: "source",
          message: `${player.username} chose the community's top suggestion! They keep their levels.`
        });
      } catch (err) {
        console.error("[DailyWinner] Claude API error:", err.message || err);
        player.pendingWinnerPrompt = true;
        player.send({ type: "event", kind: "source", message: `Failed to generate rule: ${err.message || "unknown error"}` });
      }
      return;
    }
    this.sacrificePlayer(player);
    this.world.broadcastAll({
      type: "event",
      kind: "kill",
      message: `${player.username} has been SACRIFICED! They wrote their own rule.`
    });
    try {
      const ruleText = await generateRule(player.username, trimmed, this.world.rules);
      await this.implementAndApplyRule(player.username, ruleText);
      console.log(`[DailyWinner] Rule added by ${player.username}: ${ruleText}`);
    } catch (err) {
      console.error("[DailyWinner] Claude API error:", err);
      player.pendingWinnerPrompt = true;
      player.send({ type: "event", kind: "source", message: "Failed to generate rule \u2014 please try again." });
    }
  }
  async implementAndApplyRule(author, ruleText) {
    const dbRule = this.world.db.addRule(ruleText, author);
    this.world.db.setWorldStateValue("champion_rule", ruleText);
    this.broadcastChampionInfo();
    this.world.broadcastAll({ type: "notification", text: `AI is implementing rule: "${ruleText}"...` });
    this.world.broadcastAll({
      type: "event",
      kind: "source",
      message: `New rule submitted by ${author}: "${ruleText}" \u2014 implementing...`
    });
    this.world.isImplementingRule = true;
    this.world.broadcastAll({ type: "rule_status", implementing: true });
    let finalStatus = "failed";
    try {
      const result = await implementRule(ruleText);
      this.world.isImplementingRule = false;
      this.world.broadcastAll({ type: "rule_status", implementing: false });
      if (result.success) {
        finalStatus = "success";
        this.world.db.updateRuleStatus(dbRule.id, "success");
        console.log(`[DailyWinner] Rule implemented successfully, scheduling restart`);
        this.world.broadcastAll({
          type: "notification",
          text: `Rule "${ruleText}" has been implemented! Server restarting shortly...`
        });
        scheduleRestart();
      } else {
        this.world.db.updateRuleStatus(dbRule.id, "failed");
        console.error(`[DailyWinner] Rule implementation failed: ${result.error}`);
        this.world.broadcastAll({
          type: "notification",
          text: `Rule "${ruleText}" was added but could not be auto-implemented.`
        });
      }
    } catch (err) {
      this.world.db.updateRuleStatus(dbRule.id, "failed");
      console.error("[DailyWinner] Rule implementation error:", err);
      this.world.isImplementingRule = false;
      this.world.broadcastAll({ type: "rule_status", implementing: false });
    }
    const rule = {
      id: dbRule.id,
      text: dbRule.text,
      createdBy: dbRule.created_by,
      createdAt: dbRule.created_at,
      status: finalStatus
    };
    this.world.rules.push(rule);
    this.world.broadcastAll({
      type: "rules_update",
      rules: this.world.rules,
      isAlert: true
    });
  }
  addRuleAndBroadcast(author, ruleText) {
    const dbRule = this.world.db.addRule(ruleText, author);
    const rule = {
      id: dbRule.id,
      text: dbRule.text,
      createdBy: dbRule.created_by,
      createdAt: dbRule.created_at,
      status: dbRule.status
    };
    this.world.rules.push(rule);
    this.world.broadcastAll({
      type: "rules_update",
      rules: this.world.rules,
      isAlert: true
    });
    this.world.broadcastAll({
      type: "event",
      kind: "source",
      message: `New rule added by ${author}: "${ruleText}"`
    });
  }
  /** Check if today's 6pm Phoenix has passed but no champion was selected today */
  missedTodaysCheck() {
    const now = /* @__PURE__ */ new Date();
    const phoenixMs = now.getTime() + PHOENIX_UTC_OFFSET * 36e5;
    const phoenix = new Date(phoenixMs);
    const phoenixHour = phoenix.getUTCHours();
    if (phoenixHour < DUSK_HOUR) return false;
    const lastCheckDate = this.world.db.getWorldStateValue("champion_check_date");
    const todayStr = phoenix.toISOString().slice(0, 10);
    return lastCheckDate !== todayStr;
  }
  /** Called when a player joins — runs catch-up check if needed */
  checkCatchUp() {
    if (!this.pendingCatchUp) return;
    if (this.world.players.size === 0) return;
    this.pendingCatchUp = false;
    console.log("[DailyWinner] Running catch-up check now");
    this.runCheck();
  }
  /** Broadcast champion info to all players */
  broadcastChampionInfo() {
    const username = this.world.db.getWorldStateValue("champion_username");
    if (!username) return;
    const ruleText = this.world.db.getWorldStateValue("champion_rule") ?? null;
    this.world.broadcastAll({ type: "champion_info", username, ruleText });
  }
  /** Send champion info to a single player (on join) */
  sendChampionInfo(player) {
    const username = this.world.db.getWorldStateValue("champion_username");
    if (!username) return;
    const ruleText = this.world.db.getWorldStateValue("champion_rule") ?? null;
    player.send({ type: "champion_info", username, ruleText });
  }
  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
};
function msUntilNextDusk() {
  const now = /* @__PURE__ */ new Date();
  const phoenixMs = now.getTime() + PHOENIX_UTC_OFFSET * 60 * 60 * 1e3;
  const phoenix = new Date(phoenixMs);
  const target = new Date(phoenix);
  target.setUTCHours(DUSK_HOUR, 0, 0, 0);
  if (phoenix >= target) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  const targetRealMs = target.getTime() - PHOENIX_UTC_OFFSET * 60 * 60 * 1e3;
  return Math.max(1e3, targetRealMs - now.getTime());
}

// server/src/systems/LeaderboardSystem.ts
function computeLeaderboard(world2) {
  const sourceMap = /* @__PURE__ */ new Map();
  for (const [, player] of world2.players) {
    sourceMap.set(player.username, player.totalSourceGenerated);
  }
  const dbEntries = world2.db.getLeaderboard(50);
  for (const entry of dbEntries) {
    if (!sourceMap.has(entry.username)) {
      sourceMap.set(entry.username, entry.total_source_generated);
    }
  }
  const sorted = [...sourceMap.entries()].filter(([, total]) => total > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return sorted.map(([username, totalSource], i) => ({
    username,
    totalSource,
    rank: i + 1
  }));
}
function broadcastLeaderboard(world2) {
  const entries = computeLeaderboard(world2);
  const msg = {
    type: "leaderboard",
    entries
  };
  world2.broadcastAll(msg);
}

// server/src/registry/ServerRegistry.ts
var ServerRegistry = class {
  servers = /* @__PURE__ */ new Map();
  /** Generate a 6-char alphanumeric code */
  generateCode() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
  /** Get or create a unique shortcode for a server */
  getOrCreateCode(key) {
    const existing = this.servers.get(key);
    if (existing) return existing.code;
    const usedCodes = /* @__PURE__ */ new Set();
    for (const s of this.servers.values()) usedCodes.add(s.code);
    let code;
    do {
      code = this.generateCode();
    } while (usedCodes.has(code));
    return code;
  }
  upsert(data) {
    const key = `${data.host}:${data.port}`;
    const existing = this.servers.get(key);
    const code = existing?.code || this.getOrCreateCode(key);
    this.servers.set(key, {
      ...data,
      lastHeartbeat: Date.now(),
      code
    });
    return code;
  }
  prune() {
    const now = Date.now();
    for (const [key, server] of this.servers) {
      if (now - server.lastHeartbeat > HEARTBEAT_TIMEOUT) {
        this.servers.delete(key);
      }
    }
  }
  toPublicList() {
    this.prune();
    return Array.from(this.servers.values()).map((s) => ({
      name: s.name,
      host: s.host,
      port: s.port,
      playerCount: s.playerCount,
      maxPlayers: s.maxPlayers,
      description: s.description,
      hasPassword: s.hasPassword,
      isModded: s.isModded
    }));
  }
};

// server/src/registry/PatreonValidator.ts
var PATREON_API = "https://www.patreon.com/api/oauth2/v2";
async function validatePatreonKey(key) {
  if (!key || key.length < 10) return false;
  try {
    const res = await fetch(`${PATREON_API}/identity?include=memberships&fields%5Bmember%5D=patron_status`, {
      headers: {
        "Authorization": `Bearer ${key}`
      }
    });
    if (!res.ok) return false;
    const data = await res.json();
    const memberships = data.included;
    if (!memberships || !Array.isArray(memberships)) return false;
    return memberships.some(
      (m) => m.type === "member" && m.attributes?.patron_status === "active_patron"
    );
  } catch {
    return false;
  }
}

// server/src/registry/CommunityBranches.ts
import { execSync as execSync2 } from "child_process";
import path3 from "path";
var PROJECT_ROOT3 = path3.resolve(import.meta.dirname, "../..");
function ensureCommunityBranches(code) {
  const token = process.env.COMMUNITY_GITHUB_KEY;
  const repo = process.env.GITHUB_REPO;
  if (!token) {
    console.warn("[CommunityBranches] No COMMUNITY_GITHUB_KEY \u2014 cannot create branches");
    return false;
  }
  if (!repo) {
    console.warn("[CommunityBranches] No GITHUB_REPO \u2014 cannot create branches");
    return false;
  }
  if (!/^[a-z0-9]{6}$/.test(code)) {
    console.error("[CommunityBranches] Invalid shortcode format");
    return false;
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.error("[CommunityBranches] Invalid GITHUB_REPO format");
    return false;
  }
  const liveBranch = `community/${code}/live`;
  const stableBranch = `community/${code}/stable`;
  const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
  try {
    const existingRefs = execSync2(`git ls-remote --heads ${remoteUrl} ${liveBranch} ${stableBranch}`, {
      cwd: PROJECT_ROOT3,
      stdio: "pipe",
      timeout: 1e4
    }).toString();
    if (existingRefs.includes(liveBranch)) {
      console.log(`[CommunityBranches] Branches already exist for code "${code}"`);
      return true;
    }
    execSync2(`git fetch ${remoteUrl} stable`, { cwd: PROJECT_ROOT3, stdio: "pipe", timeout: 15e3 });
    execSync2(`git push ${remoteUrl} FETCH_HEAD:refs/heads/${liveBranch}`, {
      cwd: PROJECT_ROOT3,
      stdio: "pipe",
      timeout: 15e3
    });
    execSync2(`git push ${remoteUrl} FETCH_HEAD:refs/heads/${stableBranch}`, {
      cwd: PROJECT_ROOT3,
      stdio: "pipe",
      timeout: 15e3
    });
    console.log(`[CommunityBranches] Created branches for code "${code}": ${liveBranch}, ${stableBranch}`);
    return true;
  } catch (err) {
    console.error(`[CommunityBranches] Failed to create branches for code "${code}":`, err);
    return false;
  }
}
function getCommunityLiveBranch(code) {
  return `community/${code}/live`;
}

// server/src/server.ts
var PORT = parseInt(process.env.PORT || "4800", 10);
var IS_MAIN_SERVER = process.env.IS_MAIN_SERVER === "true" && !!process.env.REGISTRY_SECRET;
var adminUsers = null;
function resetAdminCache() {
  adminUsers = null;
}
function isAdmin(username) {
  if (!adminUsers) {
    const raw = (process.env.ADMIN_USERS || "").replace(/^["']|["']$/g, "");
    adminUsers = new Set(
      raw.split(",").map((s) => s.trim()).filter(Boolean)
    );
    if (IS_MAIN_SERVER) adminUsers.add("JamesWest");
    console.log(`[Server] ADMIN_USERS raw: "${process.env.ADMIN_USERS}" \u2192 parsed: [${[...adminUsers].join(", ")}]`);
  }
  return adminUsers.has(username);
}
function loadPatchNotes() {
  try {
    const filePath = path4.resolve(import.meta.dirname, "../../patch-notes.json");
    const data = fs2.readFileSync(filePath, "utf-8");
    const notes = JSON.parse(data);
    return notes.slice(0, 3);
  } catch {
    return [];
  }
}
function getSignData(world2) {
  const patchNotes = loadPatchNotes();
  const dbNotices = world2.db.getNotices();
  const notices = dbNotices.map((n) => ({
    id: n.id,
    text: n.text,
    createdAt: n.created_at
  }));
  return { patchNotes, notices };
}
function broadcastOnlineList(world2) {
  const usernames = Array.from(world2.playersByUsername.keys()).sort();
  const admins = usernames.filter((u) => isAdmin(u));
  world2.broadcastAll({ type: "online_list", usernames, admins });
}
var MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".map": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon"
};
var registry = new ServerRegistry();
function startServer(world2) {
  world2.refreshSignData = () => {
    const signData = getSignData(world2);
    world2.broadcastAll({ type: "sign_data", ...signData });
  };
  const dailyWinner = new DailyWinnerScheduler(world2);
  setInterval(() => broadcastLeaderboard(world2), 1e4);
  const clientDir = path4.resolve(import.meta.dirname, "../../client");
  const httpServer = http.createServer(async (req, res) => {
    const urlPath = req.url?.split("?")[0] || "/";
    if (IS_MAIN_SERVER) {
      if (urlPath.startsWith("/api/")) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }
      }
      if (req.method === "GET" && urlPath === "/api/patreon/authorize") {
        const clientId = process.env.PATREON_CLIENT_ID;
        if (!clientId) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Patreon OAuth not configured");
          return;
        }
        const redirectUri = encodeURIComponent(`https://${req.headers.host || "plainscape.world"}/api/patreon/callback`);
        const patreonUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=identity%20identity.memberships`;
        res.writeHead(302, { "Location": patreonUrl });
        res.end();
        return;
      }
      if (req.method === "GET" && urlPath === "/api/patreon/callback") {
        const clientId = process.env.PATREON_CLIENT_ID;
        const clientSecret = process.env.PATREON_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Patreon OAuth not configured");
          return;
        }
        const url = new URL(req.url || "/", `https://${req.headers.host || "plainscape.world"}`);
        const code = url.searchParams.get("code");
        if (!code) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing authorization code");
          return;
        }
        try {
          const redirectUri = `https://${req.headers.host || "plainscape.world"}/api/patreon/callback`;
          const tokenRes = await fetch("https://www.patreon.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              grant_type: "authorization_code",
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri
            }).toString()
          });
          if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error("[Patreon] Token exchange failed:", errText);
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end('<html><body style="background:#1a1a2e;color:#ff4444;font-family:sans-serif;padding:40px;text-align:center"><h2>Patreon authorization failed</h2><p>Could not verify your Patreon account. Please try again or contact support.</p></body></html>');
            return;
          }
          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;
          if (!accessToken) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end('<html><body style="background:#1a1a2e;color:#ff4444;font-family:sans-serif;padding:40px;text-align:center"><h2>No access token received</h2></body></html>');
            return;
          }
          const valid = await validatePatreonKey(accessToken);
          res.writeHead(200, { "Content-Type": "text/html" });
          if (valid) {
            res.end(`<html><body style="background:#1a1a2e;color:#ddd;font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;text-align:center">
              <h2 style="color:#7ec87e">Patreon Verified!</h2>
              <p>Your Patreon key for the server .env file:</p>
              <div style="background:#12122a;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:16px 0;word-break:break-all;font-family:monospace;font-size:13px;color:#f0c040;user-select:all">${accessToken}</div>
              <p style="color:#888;font-size:13px">Copy this token and paste it as <code style="color:#f0c040">PATREON_KEY</code> in your server's .env file or admin console Configuration tab.</p>
              <p style="color:#888;font-size:12px;margin-top:24px">You can close this page now.</p>
            </body></html>`);
          } else {
            res.end(`<html><body style="background:#1a1a2e;color:#ddd;font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;text-align:center">
              <h2 style="color:#ff4444">Not an Active Patron</h2>
              <p>Your Patreon account was verified, but you don't have an active membership.</p>
              <p style="color:#888;font-size:13px">Please subscribe to the PlainScape Patreon to get a server key.</p>
            </body></html>`);
          }
        } catch (err) {
          console.error("[Patreon] OAuth callback error:", err);
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end('<html><body style="background:#1a1a2e;color:#ff4444;font-family:sans-serif;padding:40px;text-align:center"><h2>Something went wrong</h2><p>Please try again.</p></body></html>');
        }
        return;
      }
      if (req.method === "GET" && urlPath === "/api/servers") {
        const list = registry.toPublicList();
        list.unshift({
          name: "PlainScape (Official)",
          host: req.headers.host?.split(":")[0] || "plainscape.world",
          port: PORT,
          playerCount: world2.players.size,
          maxPlayers: DEFAULT_MAX_PLAYERS,
          description: "The official PlainScape server",
          hasPassword: false,
          isModded: false
        });
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        res.end(JSON.stringify(list));
        return;
      }
      if (req.method === "POST" && urlPath === "/api/servers/heartbeat") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            if (!data.name || !data.host || !data.port) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Missing required fields" }));
              return;
            }
            const demoKey = process.env.DEMO_KEY;
            const hasDemoAccess = demoKey && data.demoKey === demoKey;
            const hasPatreonAccess = data.patreonKey && await validatePatreonKey(data.patreonKey);
            if (!hasDemoAccess && !hasPatreonAccess) {
              res.writeHead(403, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Invalid key \u2014 need a valid Patreon or demo key" }));
              return;
            }
            const serverName = String(data.name).slice(0, 50);
            const code = registry.upsert({
              name: serverName,
              host: String(data.host),
              port: Number(data.port),
              playerCount: Number(data.playerCount) || 0,
              maxPlayers: Number(data.maxPlayers) || DEFAULT_MAX_PLAYERS,
              description: String(data.description || "").slice(0, 200),
              hasPassword: Boolean(data.hasPassword),
              isModded: Boolean(data.isModded)
            });
            if (hasPatreonAccess) {
              ensureCommunityBranches(code);
            }
            const branchName = getCommunityLiveBranch(code);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, branch: branchName, code }));
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
          }
        });
        return;
      }
    }
    if (req.method === "GET" && urlPath === "/privacy") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(legalPage("Privacy Policy", privacyContent()));
      return;
    }
    if (req.method === "GET" && urlPath === "/terms") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(legalPage("Terms & Conditions", termsContent()));
      return;
    }
    if (req.method === "GET" && urlPath === "/api/ai-prompt") {
      const rulesPath = path4.resolve(import.meta.dirname, "../../claude-rules.md");
      try {
        const content = fs2.readFileSync(rulesPath, "utf-8");
        res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
        res.end(content);
      } catch {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("No AI prompt configured for this server.");
      }
      return;
    }
    const staticPath = urlPath === "/" ? "/index.html" : urlPath;
    let filePath;
    if (staticPath.endsWith(".js") || staticPath.endsWith(".js.map")) {
      filePath = path4.join(clientDir, "dist", path4.basename(staticPath));
    } else {
      filePath = path4.join(clientDir, staticPath);
    }
    const resolved = path4.resolve(filePath);
    if (!resolved.startsWith(path4.resolve(clientDir))) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs2.readFile(resolved, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path4.extname(resolved);
      let content = data;
      if (ext === ".html") {
        let html = data.toString();
        const injections = [];
        if (IS_MAIN_SERVER) injections.push("window.__PLAINSCAPE_MAIN_SERVER__=true;");
        const srvName = (process.env.SERVER_NAME || "PlainScape").replace(/'/g, "\\'");
        const srvDesc = (process.env.SERVER_DESCRIPTION || "Survive the plains.").replace(/'/g, "\\'");
        injections.push(`window.__SERVER_NAME__='${srvName}';`);
        injections.push(`window.__SERVER_DESC__='${srvDesc}';`);
        if (process.env.SERVER_PASSWORD) injections.push("window.__SERVER_HAS_PASSWORD__=true;");
        if (injections.length > 0) {
          html = html.replace("</head>", `<script>${injections.join("")}</script></head>`);
        }
        content = Buffer.from(html);
      }
      res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
      res.end(content);
    });
  });
  const wss = new WebSocketServer({ server: httpServer });
  wss.on("connection", (ws, req) => {
    console.log(`[Server] WebSocket connection from ${req.socket.remoteAddress}`);
    let player = null;
    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      switch (msg.type) {
        case "join": {
          if (player) return;
          const serverPassword = process.env.SERVER_PASSWORD;
          if (serverPassword && msg.password !== serverPassword) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid server password" }));
            return;
          }
          const token = typeof msg.token === "string" ? msg.token.trim() : "";
          if (!token) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
            return;
          }
          const clientFingerprint = typeof msg.fingerprint === "string" ? msg.fingerprint : "";
          const clientIp = req.socket.remoteAddress || "";
          if (world2.db.isBanned(clientFingerprint, clientIp)) {
            ws.send(JSON.stringify({ type: "error", message: "You have been banned from this server" }));
            ws.close();
            return;
          }
          const username = msg.username.trim().slice(0, USERNAME_MAX_LENGTH);
          if (!username) {
            ws.send(JSON.stringify({ type: "error", message: "Username required" }));
            return;
          }
          if (!/^[\w\- ]+$/.test(username)) {
            ws.send(JSON.stringify({ type: "error", message: "Username can only contain letters, numbers, spaces, hyphens, and underscores" }));
            return;
          }
          if (world2.playersByUsername.has(username)) {
            ws.send(JSON.stringify({ type: "error", message: "Username taken (player online)" }));
            return;
          }
          const result = world2.db.claimUsername(token, username, msg.colors);
          if (result === "taken") {
            ws.send(JSON.stringify({ type: "error", message: "Username taken" }));
            return;
          }
          const dbPlayer = result;
          let spawnX = (Math.random() - 0.5) * 200;
          let spawnY = (Math.random() - 0.5) * 200;
          let bedId = null;
          let bedFoundX = null;
          let bedFoundY = null;
          let buildingCount = 0;
          for (const [, b] of world2.buildingsById) {
            if (b.ownerName === username) {
              buildingCount++;
              if (b.btype === "bed") {
                bedId = b.id;
                bedFoundX = b.x;
                bedFoundY = b.y;
                spawnX = b.x;
                spawnY = b.y;
              }
              if (b.btype === "bed" || b.btype === "turret") {
                b.ownerColors = msg.colors;
              }
            }
          }
          player = new Player(token, username, msg.colors, ws, spawnX, spawnY);
          player.totalSourceGenerated = dbPlayer.total_source_generated;
          player.statLevels = world2.db.getStatLevels(token);
          player.bankedSource = world2.db.getBankedSource(token);
          player.globalWhitelist = world2.db.getGlobalWhitelist(token);
          player.buildingCount = buildingCount;
          if (bedId !== null) {
            player.bedBuildingId = bedId;
            player.bedX = bedFoundX;
            player.bedY = bedFoundY;
          }
          initCycleOnFirstPlayer();
          world2.addPlayer(player);
          if (clientFingerprint) world2.db.setFingerprint(token, clientFingerprint);
          if (clientIp) world2.db.setLastIp(token, clientIp);
          const serverName = process.env.SERVER_NAME || (IS_MAIN_SERVER ? "PlainScape" : "PlainScape Server");
          const serverDesc = process.env.SERVER_DESCRIPTION || (IS_MAIN_SERVER ? "Survive the plains." : "");
          const welcome = {
            type: "welcome",
            yourId: player.id,
            serverTime: Date.now(),
            dayPhase: getDayPhase(),
            serverName,
            serverDescription: serverDesc
          };
          ws.send(JSON.stringify(welcome));
          const leaderboard = computeLeaderboard(world2);
          player.send({ type: "leaderboard", entries: leaderboard });
          player.send({ type: "rules_update", rules: world2.rules, isAlert: false });
          if (world2.isImplementingRule) {
            player.send({ type: "rule_status", implementing: true });
          }
          player.send({ type: "suggestions_update", suggestions: getSuggestionsForPlayer(world2, token) });
          dailyWinner.sendChampionInfo(player);
          dailyWinner.checkPendingPromptOnLogin(player);
          dailyWinner.checkCatchUp();
          const signData = getSignData(world2);
          player.send({ type: "sign_data", ...signData });
          world2.broadcastAll({ type: "notification", text: `${username} joined the game` });
          broadcastOnlineList(world2);
          console.log(`[Server] ${username} joined (${world2.players.size} online)`);
          break;
        }
        case "input": {
          if (!player) return;
          player.lastActivityTime = Date.now();
          player.applyInput(msg);
          break;
        }
        case "punch": {
          if (!player || player.dead) return;
          player.pendingPunch = msg.facing;
          break;
        }
        case "lunge": {
          if (!player || player.dead) return;
          player.pendingLunge = msg.facing;
          break;
        }
        case "shoot": {
          if (!player || player.dead) return;
          player.pendingShoot = msg.facing;
          break;
        }
        case "shield": {
          if (!player || player.dead) return;
          player.pendingShield = true;
          break;
        }
        case "parry": {
          if (!player || player.dead) return;
          player.pendingParry = true;
          break;
        }
        case "dash": {
          if (!player || player.dead) return;
          player.pendingDash = true;
          break;
        }
        case "place": {
          if (!player || player.dead) return;
          player.lastActivityTime = Date.now();
          console.log(`[Server] ${player.username} placing ${msg.btype} at ${msg.cellX},${msg.cellY} (source:${player.source} buildings:${player.buildingCount})`);
          handlePlaceBuilding(world2, player, msg.btype, msg.cellX, msg.cellY);
          break;
        }
        case "destroy": {
          if (!player || player.dead) return;
          player.lastActivityTime = Date.now();
          const building = world2.buildingsById.get(msg.targetId);
          if (building) {
            world2.removeBuilding(building);
            if (building.ownerName !== player.username) {
              awardSource(player, SOURCE_BUILDING_DESTROY, world2);
              world2.sendEvent(player, "destroy", `Destroyed a ${building.btype}! +${SOURCE_BUILDING_DESTROY} Source`);
            } else {
              world2.sendEvent(player, "destroy", `Destroyed your ${building.btype}.`);
            }
          }
          break;
        }
        case "whitelist": {
          if (!player) return;
          const building = world2.buildingsById.get(msg.buildingId);
          if (!building || building.ownerName !== player.username) return;
          if (building.btype !== "gate" && building.btype !== "turret") return;
          building.whitelist = [
            player.username,
            ...msg.usernames.filter((u) => typeof u === "string" && u.length > 0 && u.length <= USERNAME_MAX_LENGTH).slice(0, 20)
          ];
          break;
        }
        case "global_whitelist": {
          if (!player) return;
          const names = (msg.usernames || []).filter((u) => typeof u === "string" && u.length > 0 && u.length <= USERNAME_MAX_LENGTH).slice(0, 20);
          player.globalWhitelist = names;
          world2.db.setGlobalWhitelist(player.token, names);
          for (const [, b] of world2.buildingsById) {
            if (b.ownerName !== player.username) continue;
            if (b.btype !== "gate" && b.btype !== "turret") continue;
            const existing = new Set(b.whitelist);
            for (const name of names) {
              if (!existing.has(name)) {
                b.whitelist.push(name);
              }
            }
          }
          break;
        }
        case "toggle_gate": {
          if (!player) return;
          const gate = world2.buildingsById.get(msg.buildingId);
          if (!gate || gate.btype !== "gate") return;
          if (gate.ownerName !== player.username) return;
          gate.open = !gate.open;
          break;
        }
        case "submit_rule": {
          if (!player || !player.pendingWinnerPrompt) return;
          const text = typeof msg.text === "string" ? msg.text : "";
          dailyWinner.handleRuleSubmission(player, text);
          break;
        }
        case "level_up": {
          if (!player || player.dead) return;
          const stat = msg.stat;
          if (!STAT_NAMES.includes(stat)) return;
          if (player.source < STAT_LEVEL_COST) {
            world2.sendEvent(player, "source", `Not enough Source (need ${STAT_LEVEL_COST})`);
            return;
          }
          if (player.statLevels[stat] >= STAT_MAX_LEVEL) {
            world2.sendEvent(player, "source", `${stat} is already at max level`);
            return;
          }
          player.source -= STAT_LEVEL_COST;
          player.statLevels[stat]++;
          world2.db.setStatLevels(player.token, player.statLevels);
          break;
        }
        case "chat": {
          if (!player) return;
          player.lastActivityTime = Date.now();
          const chatText = typeof msg.text === "string" ? msg.text.trim().slice(0, 200) : "";
          if (!chatText) return;
          const chatNow = Date.now();
          if (chatNow - player.lastChatTime < 500) return;
          player.lastChatTime = chatNow;
          if (chatText.startsWith("/source ") && isAdmin(player.username)) {
            const amount = parseInt(chatText.slice(8).trim(), 10);
            if (!isNaN(amount) && amount > 0) {
              player.source += amount;
              player.send({ type: "event", kind: "source", message: `Added ${amount} Source.` });
            }
            break;
          }
          if (chatText.startsWith("/grantrule ") && isAdmin(player.username)) {
            const targetName = chatText.slice(11).trim();
            const target = world2.playersByUsername.get(targetName);
            if (!target) {
              player.send({ type: "event", kind: "source", message: `Player "${targetName}" not found online.` });
            } else {
              target.pendingWinnerPrompt = true;
              const topSugg = world2.db.getTopSuggestion();
              const topSuggestion = topSugg ? {
                id: topSugg.id,
                text: topSugg.text,
                createdBy: topSugg.created_by,
                votes: topSugg.votes,
                votedByMe: false
              } : null;
              target.send({
                type: "winner_prompt",
                winnerName: target.username,
                topSuggestion
              });
              player.send({ type: "event", kind: "source", message: `Granted rule prompt to ${targetName}.` });
            }
            break;
          }
          if (chatText === "/clearrules" && isAdmin(player.username)) {
            world2.db.clearRules();
            world2.rules = [];
            world2.broadcastAll({ type: "rules_update", rules: [], isAlert: false });
            player.send({ type: "event", kind: "source", message: "All rules cleared." });
            break;
          }
          if (chatText === "/clearsuggestions" && isAdmin(player.username)) {
            world2.db.clearSuggestions();
            broadcastSuggestions(world2);
            player.send({ type: "event", kind: "source", message: "All suggestions cleared." });
            break;
          }
          if (chatText.startsWith("/notice ") && isAdmin(player.username)) {
            const noticeText = chatText.slice(8).trim();
            if (noticeText) {
              world2.db.addNotice(noticeText);
              const signData = getSignData(world2);
              world2.broadcastAll({ type: "sign_data", ...signData });
              player.send({ type: "event", kind: "source", message: `Notice added: "${noticeText}"` });
            }
            break;
          }
          if (chatText === "/clearnotices" && isAdmin(player.username)) {
            const notices = world2.db.getNotices();
            for (const n of notices) world2.db.deleteNotice(n.id);
            const signData = getSignData(world2);
            world2.broadcastAll({ type: "sign_data", ...signData });
            player.send({ type: "event", kind: "source", message: "All notices cleared." });
            break;
          }
          const timeCommands = ["/dawn", "/day", "/dusk", "/night", "/autotime"];
          if (timeCommands.includes(chatText) && isAdmin(player.username)) {
            const phase = chatText.slice(1);
            if (phase === "autotime") {
              setPhaseOverride(null);
              player.send({ type: "event", kind: "source", message: "Time override cleared \u2014 using natural cycle." });
            } else {
              setPhaseOverride(phase);
              player.send({ type: "event", kind: "source", message: `Time set to ${phase}.` });
            }
            break;
          }
          if (chatText.startsWith("/stag ") && isAdmin(player.username)) {
            const sub = chatText.slice(6).trim();
            if (sub === "spawn") {
              for (const [, enemy] of world2.enemies) {
                if (enemy.kind === "stag") enemy.markedForRemoval = true;
              }
              world2.db.deleteWorldStateValue("boss_hp");
              world2.bossSpawned = false;
              const stag = new ScorchedStag(player.x + 300, player.y + 300);
              world2.addEnemy(stag);
              world2.bossSpawned = true;
              world2.db.setWorldStateValue("boss_hp", String(STAG_HP));
              world2.broadcastAll({
                type: "event",
                kind: "boss",
                message: "The Scorched Stag has been reborn!"
              });
              player.send({ type: "event", kind: "source", message: `Stag spawned with ${STAG_HP} HP.` });
            } else if (sub === "kill") {
              for (const [, enemy] of world2.enemies) {
                if (enemy.kind === "stag") enemy.markedForRemoval = true;
              }
              world2.db.setWorldStateValue("boss_hp", "0");
              player.send({ type: "event", kind: "source", message: "Stag killed (no reward)." });
            } else {
              player.send({ type: "event", kind: "source", message: "Usage: /stag spawn | /stag kill" });
            }
            break;
          }
          if (chatText.startsWith("/freeuser ") && isAdmin(player.username)) {
            const targetName = chatText.slice("/freeuser ".length).trim();
            if (!targetName) {
              player.send({ type: "event", kind: "source", message: "Usage: /freeuser <username>" });
              break;
            }
            for (const [, p] of world2.players) {
              if (p.username === targetName) {
                p.send({ type: "event", kind: "source", message: "Your username has been freed by an admin. Please rejoin." });
                p.ws?.close();
                break;
              }
            }
            const freed = world2.db.freeUsername(targetName);
            const msg2 = freed ? `Username "${targetName}" has been freed.` : `Username "${targetName}" not found in database.`;
            player.send({ type: "event", kind: "source", message: msg2 });
            console.log(`[Admin] ${player.username} freed username "${targetName}" \u2014 ${freed ? "success" : "not found"}`);
            break;
          }
          if (chatText === "/weeklyreset" && isAdmin(player.username)) {
            world2.db.performWeeklyReset();
            for (const [, p] of world2.players) {
              p.totalSourceGenerated = 0;
              p.source = 0;
              p.sourceFlushDirty = 0;
              p.statLevels = defaultStatLevels();
              p.bankedSource = 0;
            }
            world2.rules.length = 0;
            world2.pendingWinnerUsername = null;
            world2.broadcastAll({ type: "rules_update", rules: [], isAlert: false });
            world2.broadcastAll({ type: "event", kind: "source", message: "Admin triggered weekly reset! All stats and rules cleared." });
            console.log(`[Admin] ${player.username} triggered weekly reset`);
            break;
          }
          if (chatText === "/freeall" && isAdmin(player.username)) {
            const count = world2.db.freeAllUsernames();
            for (const [, p] of world2.players) {
              p.ws.send(JSON.stringify({ type: "event", kind: "source", message: "Server reset \u2014 all accounts cleared. Please rejoin." }));
              p.ws.close();
            }
            player.send({ type: "event", kind: "source", message: `Freed ${count} usernames. All players kicked.` });
            console.log(`[Admin] ${player.username} freed all ${count} usernames`);
            break;
          }
          if (chatText === "/clearmap" && isAdmin(player.username)) {
            const buildings = [...world2.buildingsById.values()];
            for (const b of buildings) {
              world2.removeBuilding(b);
            }
            world2.db.deleteAllBuildings();
            for (const [, p] of world2.players) {
              p.bedX = null;
              p.bedY = null;
              p.bedBuildingId = null;
            }
            world2.broadcastAll({ type: "event", kind: "source", message: "Admin cleared all structures from the map." });
            console.log(`[Admin] ${player.username} cleared ${buildings.length} buildings from the map`);
            break;
          }
          if (chatText === "/shutdown" && isAdmin(player.username)) {
            world2.broadcastAll({ type: "event", kind: "source", message: "Server is shutting down..." });
            setTimeout(() => {
              world2.stop();
              process.exit(0);
            }, 1e3);
            break;
          }
          if (chatText === "/rule" && isAdmin(player.username)) {
            player.pendingWinnerPrompt = true;
            const topSugg = world2.db.getTopSuggestion();
            const topSuggestion = topSugg ? {
              id: topSugg.id,
              text: topSugg.text,
              createdBy: topSugg.created_by,
              votes: topSugg.votes,
              votedByMe: false
            } : null;
            player.send({
              type: "winner_prompt",
              winnerName: player.username,
              topSuggestion
            });
            break;
          }
          if (chatText === "/commands" && isAdmin(player.username)) {
            const cmds = [
              "/source <amount> \u2014 Add source to yourself",
              "/grantrule <username> \u2014 Grant rule prompt to a player",
              "/clearrules \u2014 Clear all active rules",
              "/clearsuggestions \u2014 Clear all suggestions",
              "/notice <text> \u2014 Add an admin notice",
              "/clearnotices \u2014 Remove all notices",
              "/dawn /day /dusk /night \u2014 Force time phase",
              "/autotime \u2014 Resume natural day/night cycle",
              "/stag spawn | /stag kill \u2014 Spawn or kill the Stag boss",
              "/freeuser <username> \u2014 Free a username reservation",
              "/freeall \u2014 Free all usernames and kick all players",
              "/clearmap \u2014 Remove all structures from the map",
              "/weeklyreset \u2014 Perform the weekly reset now",
              "/shutdown \u2014 Gracefully stop the server",
              "/rule \u2014 Open the rule submission prompt"
            ];
            for (const cmd of cmds) {
              player.send({ type: "event", kind: "source", message: cmd });
            }
            break;
          }
          if (chatText.startsWith("/w ") || chatText.startsWith("/whisper ")) {
            const afterCmd = chatText.startsWith("/whisper ") ? chatText.slice(9) : chatText.slice(3);
            const spaceIdx = afterCmd.indexOf(" ");
            if (spaceIdx === -1) {
              player.send({ type: "event", kind: "source", message: "Usage: /w <username> <message>" });
              break;
            }
            const targetName = afterCmd.slice(0, spaceIdx);
            const whisperText = afterCmd.slice(spaceIdx + 1).trim();
            if (!whisperText) {
              player.send({ type: "event", kind: "source", message: "Usage: /w <username> <message>" });
              break;
            }
            const target = world2.playersByUsername.get(targetName);
            if (!target) {
              player.send({ type: "event", kind: "source", message: `Player "${targetName}" is not online.` });
              break;
            }
            target.send({ type: "chat_broadcast", username: player.username, text: whisperText, whisper: true });
            player.send({ type: "chat_broadcast", username: `To ${targetName}`, text: whisperText, whisper: true });
            break;
          }
          world2.broadcastAll({
            type: "chat_broadcast",
            username: player.username,
            text: chatText
          });
          break;
        }
        case "deposit": {
          if (!player || player.dead) return;
          const depositAmt = Math.floor(msg.amount);
          if (depositAmt <= 0 || depositAmt > player.source) return;
          const distToBanker = Math.hypot(player.x - BANKER_POS.x, player.y - BANKER_POS.y);
          if (distToBanker > BANK_NPC_RANGE) {
            world2.sendEvent(player, "source", "Too far from the Banker.");
            return;
          }
          player.source -= depositAmt;
          player.bankedSource += depositAmt;
          world2.db.setBankedSource(player.token, player.bankedSource);
          world2.sendEvent(player, "source", `Deposited ${depositAmt} Source.`);
          break;
        }
        case "withdraw": {
          if (!player || player.dead) return;
          const withdrawAmt = Math.floor(msg.amount);
          if (withdrawAmt < 10 || withdrawAmt > player.bankedSource) return;
          const distToBanker2 = Math.hypot(player.x - BANKER_POS.x, player.y - BANKER_POS.y);
          if (distToBanker2 > BANK_NPC_RANGE) {
            world2.sendEvent(player, "source", "Too far from the Banker.");
            return;
          }
          const fee = Math.ceil(withdrawAmt * BANK_WITHDRAW_FEE);
          const received = withdrawAmt - fee;
          player.bankedSource -= withdrawAmt;
          player.source += received;
          world2.db.setBankedSource(player.token, player.bankedSource);
          world2.sendEvent(player, "source", `Withdrew ${received} Source (${fee} fee).`);
          break;
        }
        case "submit_suggestion": {
          if (!player || player.dead) return;
          const suggText = typeof msg.text === "string" ? msg.text.trim().slice(0, 300) : "";
          if (!suggText) return;
          const distToScribe = Math.hypot(player.x - SCRIBE_POS.x, player.y - SCRIBE_POS.y);
          if (distToScribe > SCRIBE_NPC_RANGE) {
            world2.sendEvent(player, "source", "Too far from the Scribe.");
            return;
          }
          if (player.source < SUGGESTION_COST) {
            world2.sendEvent(player, "source", `Need ${SUGGESTION_COST} Source to submit.`);
            return;
          }
          player.source -= SUGGESTION_COST;
          world2.db.addSuggestion(suggText, player.username);
          broadcastSuggestions(world2);
          world2.sendEvent(player, "source", `Suggestion submitted! (-${SUGGESTION_COST} Source)`);
          world2.broadcastAll({ type: "notification", text: `${player.username} submitted a petition to the Scribe` });
          break;
        }
        case "vote_suggestion": {
          if (!player || player.dead) return;
          const distToScribe2 = Math.hypot(player.x - SCRIBE_POS.x, player.y - SCRIBE_POS.y);
          if (distToScribe2 > SCRIBE_NPC_RANGE) {
            world2.sendEvent(player, "source", "Too far from the Scribe.");
            return;
          }
          if (player.source < VOTE_COST) {
            world2.sendEvent(player, "source", `Need ${VOTE_COST} Source to vote.`);
            return;
          }
          const voted = world2.db.voteSuggestion(msg.suggestionId, player.token);
          if (!voted) {
            world2.sendEvent(player, "source", "Already voted on this suggestion.");
            return;
          }
          player.source -= VOTE_COST;
          broadcastSuggestions(world2);
          world2.sendEvent(player, "source", `Vote cast! (-${VOTE_COST} Source)`);
          break;
        }
        case "party_invite": {
          if (!player) return;
          handlePartyInvite(world2, player, msg.targetUsername);
          break;
        }
        case "party_respond": {
          if (!player) return;
          handlePartyRespond(world2, player, msg.fromUsername, msg.accept);
          break;
        }
        case "party_leave": {
          if (!player) return;
          leaveParty(world2, player);
          break;
        }
        case "respawn": {
          if (!player || !player.dead || !player.readyToRespawn) return;
          player.lastActivityTime = Date.now();
          player.pendingRespawn = true;
          break;
        }
      }
    });
    ws.on("close", () => {
      if (player) {
        console.log(`[Server] ${player.username} left (${world2.players.size - 1} online)`);
        onPlayerDisconnect(world2, player);
        world2.removePlayer(player);
        broadcastOnlineList(world2);
        player = null;
      }
    });
    ws.on("error", (err) => {
      console.error("[Server] WebSocket error:", err.message);
      if (player) {
        world2.removePlayer(player);
        player = null;
      }
    });
  });
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] PlainScape running on http://0.0.0.0:${PORT}`);
  });
}
function getSuggestionsForPlayer(world2, token) {
  const dbSuggs = world2.db.getSuggestions();
  return dbSuggs.map((s) => ({
    id: s.id,
    text: s.text,
    createdBy: s.created_by,
    votes: s.votes,
    votedByMe: world2.db.hasVoted(s.id, token)
  }));
}
function broadcastSuggestions(world2) {
  for (const [, player] of world2.players) {
    player.send({
      type: "suggestions_update",
      suggestions: getSuggestionsForPlayer(world2, player.token)
    });
  }
}
function legalPage(title, body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} \u2014 PlainScape</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#1a1a2e;color:#ccc;font-family:'Segoe UI',system-ui,sans-serif;line-height:1.7;padding:40px 20px}
.wrap{max-width:720px;margin:0 auto}h1{color:#7ec87e;font-size:24px;margin-bottom:8px}
.updated{color:#888;font-size:12px;margin-bottom:32px}h2{color:#f0c040;font-size:16px;margin:28px 0 8px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:4px}
p,li{font-size:14px;margin-bottom:10px;color:#bbb}ul{margin-left:20px;margin-bottom:12px}
strong{color:#ddd}code{color:#f0c040;background:rgba(240,192,64,0.1);padding:1px 4px;border-radius:3px;font-size:13px}
a{color:#7ec87e}.back{display:inline-block;margin-top:32px;color:#888;font-size:13px;text-decoration:none}.back:hover{color:#ddd}</style></head>
<body><div class="wrap"><h1>${title}</h1><div class="updated">Last updated: March 19, 2026</div>${body}<a class="back" href="/">\u2190 Back to PlainScape</a></div></body></html>`;
}
function privacyContent() {
  return `
<h2>What We Collect</h2>
<p>PlainScape collects minimal data necessary to operate the game:</p>
<ul>
<li><strong>Username</strong> \u2014 chosen by you, stored locally and on the server for identification</li>
<li><strong>Player token</strong> \u2014 a random UUID stored in your browser's localStorage to identify your account across sessions</li>
<li><strong>IP address</strong> \u2014 logged for ban enforcement and abuse prevention; not shared with third parties</li>
<li><strong>Browser fingerprint</strong> \u2014 a hash used alongside IP for ban enforcement</li>
<li><strong>Game data</strong> \u2014 Source earned, stats, buildings, and other in-game state stored in a server-side SQLite database</li>
</ul>

<h2>Patreon Integration</h2>
<p>If you authenticate via Patreon to obtain a server key, we receive your Patreon membership status through the Patreon OAuth API. We do not store your Patreon credentials \u2014 only the resulting access token, which you provide to your own server.</p>

<h2>AI Rule System</h2>
<p>When the daily champion submits a rule, the rule text is sent to the Anthropic Claude API for processing and implementation. The rule text and resulting code changes are stored on the server. No personal data beyond the champion's username is included in API requests.</p>

<h2>Community Servers</h2>
<p>Community-hosted PlainScape servers are operated by third parties. Each server operator controls their own data. PlainScape (the project) is not responsible for data handling on community servers. The server browser at plainscape.world only stores the server name, IP, port, and player count submitted via heartbeat.</p>

<h2>Cookies & Local Storage</h2>
<p>PlainScape uses browser localStorage to store your player token, username, character colors, and game preferences. No tracking cookies are used. The admin console uses a session cookie for authentication.</p>

<h2>Data Retention</h2>
<p>Game data is reset weekly. Username reservations expire after 6 weeks of inactivity. Server operators can clear all data at any time via the <code>/freeall</code> command.</p>

<h2>Contact</h2>
<p>For questions about data handling, contact us via the <a href="https://github.com/chvolk/PlainScape-Community/issues" target="_blank">GitHub issues page</a>.</p>`;
}
function termsContent() {
  return `
<h2>Acceptance</h2>
<p>By playing PlainScape or hosting a PlainScape community server, you agree to these terms.</p>

<h2>The Game</h2>
<p>PlainScape is a free, open-source multiplayer game provided as-is. We make no guarantees about uptime, data persistence, or game balance. The game resets weekly \u2014 progress is temporary by design.</p>

<h2>AI Rule System \u2014 Important Disclaimer</h2>
<p><strong>The AI rule implementation system uses the Anthropic Claude API to autonomously read, modify, and execute code on the server machine.</strong> Community servers that enable this feature run AI-generated code changes with the <code>--dangerously-skip-permissions</code> flag, which grants the AI broad access to the server's file system and the ability to run shell commands.</p>
<p><strong>Neither PlainScape nor Anthropic are responsible for any damage, data loss, security issues, or other consequences resulting from the AI rule system's actions on your machine.</strong> By enabling the AI rule system on your server, you accept full responsibility for its behavior.</p>
<p>We strongly recommend:</p>
<ul>
<li>Running community servers in isolated environments (containers, VMs, or dedicated hosting)</li>
<li>Reviewing the <code>claude-rules.md</code> guardrails and adding restrictions appropriate to your setup</li>
<li>Keeping regular backups of any important data on the same machine</li>
</ul>

<h2>Community Servers</h2>
<p>Community server operators are responsible for their own servers, including compliance with applicable laws, data protection, and content moderation. PlainScape provides the software; operators provide the infrastructure and oversight.</p>

<h2>Player Conduct</h2>
<p>PlainScape is a PvP survival game \u2014 combat, raiding, and competition are core mechanics. However, real-world harassment, hate speech, and abuse through the chat system are not tolerated. Server operators may ban players at their discretion.</p>

<h2>Intellectual Property</h2>
<p>PlainScape is open source. The community server package is distributed under the terms of its repository. Player-submitted rules become part of the game code and are not individually owned.</p>

<h2>Limitation of Liability</h2>
<p>PlainScape is provided "as is" without warranties of any kind. To the maximum extent permitted by law, the creators of PlainScape shall not be liable for any damages arising from the use of the game, the AI rule system, or community server software.</p>

<h2>Changes</h2>
<p>These terms may be updated at any time. Continued use of PlainScape constitutes acceptance of the updated terms.</p>`;
}

// server/src/db/GameDatabase.ts
import { createRequire } from "module";
var require2 = createRequire(import.meta.url);
var Database = require2("better-sqlite3");
var SIX_WEEKS_MS = 6 * 7 * 24 * 60 * 60 * 1e3;
var GameDatabase = class {
  db;
  // Prepared statements
  stmts;
  constructor(dbPath2) {
    this.db = new Database(dbPath2);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.createSchema();
    this.prepareStatements();
  }
  createSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        token                  TEXT PRIMARY KEY,
        username               TEXT NOT NULL,
        color_skin             TEXT NOT NULL DEFAULT '#f5c5a3',
        color_shirt            TEXT NOT NULL DEFAULT '#4a90d9',
        color_pants            TEXT NOT NULL DEFAULT '#2c3e50',
        total_source_generated INTEGER NOT NULL DEFAULT 0,
        stat_levels            TEXT NOT NULL DEFAULT '{}',
        last_seen              INTEGER NOT NULL,
        created_at             INTEGER NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username ON players(username);

      CREATE TABLE IF NOT EXISTS rules (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        text       TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        status     TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS suggestions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        text       TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        votes      INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS suggestion_votes (
        suggestion_id INTEGER NOT NULL,
        player_token  TEXT NOT NULL,
        PRIMARY KEY (suggestion_id, player_token)
      );

      CREATE TABLE IF NOT EXISTS world_state (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_notices (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        text       TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS buildings (
        id         INTEGER PRIMARY KEY,
        btype      TEXT NOT NULL,
        cell_x     INTEGER NOT NULL,
        cell_y     INTEGER NOT NULL,
        owner_name TEXT NOT NULL,
        hp         INTEGER NOT NULL,
        whitelist  TEXT NOT NULL DEFAULT '[]'
      );
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bans (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        fingerprint TEXT,
        ip          TEXT,
        username    TEXT NOT NULL,
        reason      TEXT NOT NULL DEFAULT '',
        banned_at   INTEGER NOT NULL,
        banned_by   TEXT NOT NULL DEFAULT 'admin'
      );
    `);
    try {
      this.db.exec(`ALTER TABLE players ADD COLUMN stat_levels TEXT NOT NULL DEFAULT '{}'`);
    } catch {
    }
    try {
      this.db.exec(`ALTER TABLE players ADD COLUMN banked_source INTEGER NOT NULL DEFAULT 0`);
    } catch {
    }
    try {
      this.db.exec(`ALTER TABLE players ADD COLUMN fingerprint TEXT NOT NULL DEFAULT ''`);
    } catch {
    }
    try {
      this.db.exec(`ALTER TABLE players ADD COLUMN last_ip TEXT NOT NULL DEFAULT ''`);
    } catch {
    }
    try {
      this.db.exec(`ALTER TABLE players ADD COLUMN global_whitelist TEXT NOT NULL DEFAULT '[]'`);
    } catch {
    }
    try {
      this.db.exec(`ALTER TABLE rules ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`);
    } catch {
    }
  }
  prepareStatements() {
    this.stmts = {
      findByToken: this.db.prepare("SELECT * FROM players WHERE token = ?"),
      findByUsername: this.db.prepare("SELECT * FROM players WHERE username = ?"),
      upsertPlayer: this.db.prepare(`
        INSERT INTO players (token, username, color_skin, color_shirt, color_pants, total_source_generated, last_seen, created_at)
        VALUES (@token, @username, @colorSkin, @colorShirt, @colorPants, 0, @now, @now)
        ON CONFLICT(token) DO UPDATE SET
          username = @username,
          color_skin = @colorSkin,
          color_shirt = @colorShirt,
          color_pants = @colorPants,
          last_seen = @now
      `),
      updateLastSeen: this.db.prepare("UPDATE players SET last_seen = ? WHERE token = ?"),
      addTotalSource: this.db.prepare("UPDATE players SET total_source_generated = total_source_generated + ? WHERE token = ?"),
      getRules: this.db.prepare("SELECT * FROM rules ORDER BY created_at ASC"),
      addRule: this.db.prepare("INSERT INTO rules (text, created_by, created_at) VALUES (?, ?, ?)"),
      updateRuleStatus: this.db.prepare("UPDATE rules SET status = ? WHERE id = ?"),
      resetAllSource: this.db.prepare("UPDATE players SET total_source_generated = 0"),
      clearRules: this.db.prepare("DELETE FROM rules"),
      getLeaderboard: this.db.prepare(
        "SELECT username, total_source_generated FROM players WHERE total_source_generated > 0 ORDER BY total_source_generated DESC LIMIT ?"
      ),
      deleteByToken: this.db.prepare("DELETE FROM players WHERE token = ?"),
      deleteByUsername: this.db.prepare("DELETE FROM players WHERE username = ?"),
      expireUsernames: this.db.prepare("DELETE FROM players WHERE last_seen < ?"),
      resetPlayerStats: this.db.prepare(`UPDATE players SET total_source_generated = 0, stat_levels = '{}' WHERE token = ?`),
      resetPlayerSourceOnly: this.db.prepare("UPDATE players SET total_source_generated = 0 WHERE token = ?"),
      getStatLevels: this.db.prepare("SELECT stat_levels FROM players WHERE token = ?"),
      setStatLevels: this.db.prepare("UPDATE players SET stat_levels = ? WHERE token = ?"),
      resetAllStatLevels: this.db.prepare(`UPDATE players SET stat_levels = '{}'`),
      getBankedSource: this.db.prepare("SELECT banked_source FROM players WHERE token = ?"),
      setBankedSource: this.db.prepare("UPDATE players SET banked_source = ? WHERE token = ?"),
      resetAllBankedSource: this.db.prepare("UPDATE players SET banked_source = 0"),
      addSuggestion: this.db.prepare("INSERT INTO suggestions (text, created_by, created_at) VALUES (?, ?, ?)"),
      getSuggestions: this.db.prepare("SELECT * FROM suggestions ORDER BY votes DESC, created_at ASC"),
      hasVoted: this.db.prepare("SELECT 1 FROM suggestion_votes WHERE suggestion_id = ? AND player_token = ?"),
      addVote: this.db.prepare("INSERT INTO suggestion_votes (suggestion_id, player_token) VALUES (?, ?)"),
      incrementVotes: this.db.prepare("UPDATE suggestions SET votes = votes + 1 WHERE id = ?"),
      clearSuggestions: this.db.prepare("DELETE FROM suggestions"),
      upsertBuilding: this.db.prepare(`
        INSERT OR REPLACE INTO buildings (id, btype, cell_x, cell_y, owner_name, hp, whitelist)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      deleteBuilding: this.db.prepare("DELETE FROM buildings WHERE id = ?"),
      getAllBuildings: this.db.prepare("SELECT * FROM buildings"),
      deleteAllBuildings: this.db.prepare("DELETE FROM buildings"),
      deleteAllPlayers: this.db.prepare("DELETE FROM players"),
      getWorldState: this.db.prepare("SELECT value FROM world_state WHERE key = ?"),
      setWorldState: this.db.prepare("INSERT OR REPLACE INTO world_state (key, value) VALUES (?, ?)"),
      deleteWorldState: this.db.prepare("DELETE FROM world_state WHERE key = ?"),
      addNotice: this.db.prepare("INSERT INTO admin_notices (text, created_at) VALUES (?, ?)"),
      getNotices: this.db.prepare("SELECT * FROM admin_notices ORDER BY created_at DESC"),
      deleteNotice: this.db.prepare("DELETE FROM admin_notices WHERE id = ?"),
      // Bans
      addBan: this.db.prepare("INSERT INTO bans (fingerprint, ip, username, reason, banned_at, banned_by) VALUES (?, ?, ?, ?, ?, ?)"),
      removeBan: this.db.prepare("DELETE FROM bans WHERE id = ?"),
      getBans: this.db.prepare("SELECT * FROM bans ORDER BY banned_at DESC"),
      isBannedByFingerprint: this.db.prepare("SELECT 1 FROM bans WHERE fingerprint = ? AND fingerprint != '' LIMIT 1"),
      isBannedByIp: this.db.prepare("SELECT 1 FROM bans WHERE ip = ? AND ip != '' LIMIT 1"),
      // Player fingerprint/IP
      setFingerprint: this.db.prepare("UPDATE players SET fingerprint = ? WHERE token = ?"),
      setLastIp: this.db.prepare("UPDATE players SET last_ip = ? WHERE token = ?"),
      getAllPlayers: this.db.prepare("SELECT token, username, fingerprint, last_ip, total_source_generated, banked_source, last_seen, created_at FROM players ORDER BY last_seen DESC"),
      // Global whitelist
      getGlobalWhitelist: this.db.prepare("SELECT global_whitelist FROM players WHERE token = ?"),
      setGlobalWhitelist: this.db.prepare("UPDATE players SET global_whitelist = ? WHERE token = ?")
    };
  }
  findPlayerByToken(token) {
    return this.stmts.findByToken.get(token);
  }
  findPlayerByUsername(username) {
    return this.stmts.findByUsername.get(username);
  }
  /** Returns the DbPlayer on success, or 'taken' if the username is claimed by another non-expired player */
  claimUsername(token, username, colors) {
    const claimTxn = this.db.transaction(() => {
      const existing = this.stmts.findByUsername.get(username);
      if (existing && existing.token !== token) {
        if (Date.now() - existing.last_seen < SIX_WEEKS_MS) {
          return "taken";
        }
        this.stmts.deleteByToken.run(existing.token);
      }
      const now = Date.now();
      this.stmts.upsertPlayer.run({
        token,
        username,
        colorSkin: colors.skin,
        colorShirt: colors.shirt,
        colorPants: colors.pants,
        now
      });
      return this.stmts.findByToken.get(token);
    });
    return claimTxn();
  }
  /** Free a username reservation — deletes the player row entirely */
  freeUsername(username) {
    const result = this.stmts.deleteByUsername.run(username);
    return result.changes > 0;
  }
  freeAllUsernames() {
    const result = this.stmts.deleteAllPlayers.run();
    return result.changes;
  }
  deleteAllBuildings() {
    this.stmts.deleteAllBuildings.run();
  }
  updateLastSeen(token, now) {
    this.stmts.updateLastSeen.run(now, token);
  }
  addTotalSource(token, delta) {
    this.stmts.addTotalSource.run(delta, token);
  }
  getRules() {
    return this.stmts.getRules.all();
  }
  clearRules() {
    this.stmts.clearRules.run();
  }
  clearSuggestions() {
    this.stmts.clearSuggestions.run();
    this.db.exec("DELETE FROM suggestion_votes");
  }
  addRule(text, createdBy) {
    const now = Date.now();
    const info = this.stmts.addRule.run(text, createdBy, now);
    return { id: info.lastInsertRowid, text, created_by: createdBy, created_at: now, status: "pending" };
  }
  updateRuleStatus(id, status) {
    this.stmts.updateRuleStatus.run(status, id);
  }
  getLeaderboard(limit = 10) {
    return this.stmts.getLeaderboard.all(limit);
  }
  resetPlayerStats(token) {
    this.stmts.resetPlayerStats.run(token);
  }
  resetPlayerSourceOnly(token) {
    this.stmts.resetPlayerSourceOnly.run(token);
  }
  getStatLevels(token) {
    const row = this.stmts.getStatLevels.get(token);
    if (!row || !row.stat_levels || row.stat_levels === "{}") {
      return defaultStatLevels();
    }
    try {
      return { ...defaultStatLevels(), ...JSON.parse(row.stat_levels) };
    } catch {
      return defaultStatLevels();
    }
  }
  setStatLevels(token, levels) {
    this.stmts.setStatLevels.run(JSON.stringify(levels), token);
  }
  getBankedSource(token) {
    const row = this.stmts.getBankedSource.get(token);
    return row?.banked_source ?? 0;
  }
  setBankedSource(token, amount) {
    this.stmts.setBankedSource.run(amount, token);
  }
  addSuggestion(text, createdBy) {
    const now = Date.now();
    const info = this.stmts.addSuggestion.run(text, createdBy, now);
    return { id: info.lastInsertRowid, text, created_by: createdBy, created_at: now, votes: 0 };
  }
  getSuggestions() {
    return this.stmts.getSuggestions.all();
  }
  hasVoted(suggestionId, token) {
    return !!this.stmts.hasVoted.get(suggestionId, token);
  }
  voteSuggestion(suggestionId, token) {
    if (this.hasVoted(suggestionId, token)) return false;
    this.stmts.addVote.run(suggestionId, token);
    this.stmts.incrementVotes.run(suggestionId);
    return true;
  }
  getTopSuggestion() {
    const suggestions = this.getSuggestions();
    return suggestions.length > 0 ? suggestions[0] : void 0;
  }
  saveBuilding(id, btype, cellX, cellY, ownerName, hp, whitelist) {
    this.stmts.upsertBuilding.run(id, btype, cellX, cellY, ownerName, hp, JSON.stringify(whitelist));
  }
  deleteBuilding(id) {
    this.stmts.deleteBuilding.run(id);
  }
  getAllBuildings() {
    return this.stmts.getAllBuildings.all();
  }
  performWeeklyReset() {
    const reset = this.db.transaction(() => {
      this.stmts.resetAllSource.run();
      this.stmts.resetAllStatLevels.run();
      this.stmts.resetAllBankedSource.run();
      this.stmts.clearRules.run();
      this.stmts.clearSuggestions.run();
      this.db.exec("DELETE FROM suggestion_votes");
      this.stmts.deleteWorldState.run("boss_hp");
      this.stmts.deleteWorldState.run("champion_username");
      this.stmts.deleteWorldState.run("champion_rule");
      this.stmts.deleteWorldState.run("champion_check_date");
      this.stmts.expireUsernames.run(Date.now() - SIX_WEEKS_MS);
    });
    reset();
  }
  getWorldStateValue(key) {
    const row = this.stmts.getWorldState.get(key);
    return row?.value;
  }
  setWorldStateValue(key, value) {
    this.stmts.setWorldState.run(key, value);
  }
  deleteWorldStateValue(key) {
    this.stmts.deleteWorldState.run(key);
  }
  addNotice(text) {
    const now = Date.now();
    const info = this.stmts.addNotice.run(text, now);
    return { id: info.lastInsertRowid, text, created_at: now };
  }
  getNotices() {
    return this.stmts.getNotices.all();
  }
  deleteNotice(id) {
    this.stmts.deleteNotice.run(id);
  }
  // ── Global Whitelist ──
  getGlobalWhitelist(token) {
    const row = this.stmts.getGlobalWhitelist.get(token);
    if (!row || !row.global_whitelist || row.global_whitelist === "[]") return [];
    try {
      return JSON.parse(row.global_whitelist);
    } catch {
      return [];
    }
  }
  setGlobalWhitelist(token, whitelist) {
    this.stmts.setGlobalWhitelist.run(JSON.stringify(whitelist), token);
  }
  // ── Bans ──
  addBan(fingerprint, ip, username, reason, bannedBy) {
    this.stmts.addBan.run(fingerprint, ip, username, reason, Date.now(), bannedBy);
  }
  removeBan(id) {
    this.stmts.removeBan.run(id);
  }
  getBans() {
    return this.stmts.getBans.all();
  }
  isBanned(fingerprint, ip) {
    if (fingerprint && this.stmts.isBannedByFingerprint.get(fingerprint)) return true;
    if (ip && this.stmts.isBannedByIp.get(ip)) return true;
    return false;
  }
  // ── Player fingerprint/IP ──
  setFingerprint(token, fingerprint) {
    this.stmts.setFingerprint.run(fingerprint, token);
  }
  setLastIp(token, ip) {
    this.stmts.setLastIp.run(ip, token);
  }
  getAllPlayers() {
    return this.stmts.getAllPlayers.all();
  }
  close() {
    this.db.close();
  }
};

// server/src/db/WeeklyResetScheduler.ts
import { execSync as execSync3 } from "child_process";
import path5 from "path";
var PHOENIX_UTC_OFFSET2 = parseInt(process.env.TIMEZONE_UTC_OFFSET || "-7", 10);
var CHECK_INTERVAL = 6e4;
var PROJECT_ROOT4 = path5.resolve(import.meta.dirname, "../..");
function scheduleWeeklyReset(db2, world2) {
  let resetDoneThisWeek = false;
  setInterval(() => {
    const now = /* @__PURE__ */ new Date();
    const phoenixHour = (now.getUTCHours() + PHOENIX_UTC_OFFSET2 + 24) % 24;
    const phoenixDay = getPhoenixDayOfWeek(now);
    const resetDay = parseInt(process.env.RESET_DAY || "0", 10);
    const resetHour = parseInt(process.env.RESET_HOUR || "20", 10);
    if (phoenixDay === resetDay && phoenixHour === resetHour && !resetDoneThisWeek) {
      console.log(`[WeeklyReset] Performing weekly reset (day ${resetDay} hour ${resetHour})`);
      db2.performWeeklyReset();
      for (const [, player] of world2.players) {
        player.totalSourceGenerated = 0;
        player.source = 0;
        player.sourceFlushDirty = 0;
        player.statLevels = defaultStatLevels();
        player.bankedSource = 0;
      }
      world2.rules.length = 0;
      world2.pendingWinnerUsername = null;
      world2.broadcastAll({
        type: "event",
        kind: "source",
        message: "Weekly reset! All stats and rules have been cleared."
      });
      world2.broadcastAll({
        type: "rules_update",
        rules: [],
        isAlert: false
      });
      resetLiveBranch();
      resetDoneThisWeek = true;
      console.log("[WeeklyReset] Reset complete");
    }
    if (phoenixDay !== resetDay) {
      resetDoneThisWeek = false;
    }
  }, CHECK_INTERVAL);
}
function resetLiveBranch() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    console.log("[WeeklyReset] No GITHUB_TOKEN/GITHUB_REPO \u2014 skipping branch reset");
    return;
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.error("[WeeklyReset] Invalid GITHUB_REPO format");
    return;
  }
  const serverCode = process.env.SERVER_CODE;
  try {
    const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
    if (serverCode) {
      if (!/^[a-z0-9]{6}$/.test(serverCode)) {
        console.error("[WeeklyReset] Invalid SERVER_CODE format");
        return;
      }
      const stableBranch = `community/${serverCode}/stable`;
      const liveBranch = `community/${serverCode}/live`;
      execSync3(`git fetch ${remoteUrl} ${stableBranch}`, { cwd: PROJECT_ROOT4, stdio: "pipe" });
      execSync3(`git push ${remoteUrl} FETCH_HEAD:${liveBranch} --force`, { cwd: PROJECT_ROOT4, stdio: "pipe" });
      console.log(`[WeeklyReset] Reset ${liveBranch} to ${stableBranch}`);
    } else {
      execSync3(`git fetch ${remoteUrl} main`, { cwd: PROJECT_ROOT4, stdio: "pipe" });
      execSync3(`git push ${remoteUrl} FETCH_HEAD:live --force`, { cwd: PROJECT_ROOT4, stdio: "pipe" });
      console.log("[WeeklyReset] Reset live branch to main \u2014 Railway will redeploy");
    }
  } catch (err) {
    console.error("[WeeklyReset] Failed to reset live branch:", err);
  }
}
function getPhoenixDayOfWeek(now) {
  const phoenixTime = new Date(now.getTime() + PHOENIX_UTC_OFFSET2 * 60 * 60 * 1e3);
  return phoenixTime.getUTCDay();
}

// server/src/registry/HeartbeatSender.ts
import fs3 from "fs";
import path6 from "path";
var autoForkAttempted = false;
async function autoForkCommunityRepo(token) {
  if (autoForkAttempted) return;
  autoForkAttempted = true;
  try {
    console.log("[AutoFork] No GITHUB_REPO set \u2014 forking PlainScape-Community...");
    const forkRes = await fetch("https://api.github.com/repos/chvolk/PlainScape-Community/forks", {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "PlainScape-Server"
      }
    });
    if (!forkRes.ok) {
      const err = await forkRes.text();
      if (forkRes.status !== 202) {
        console.error("[AutoFork] Fork failed:", err);
        return;
      }
    }
    const forkData = await forkRes.json();
    const repoName = forkData.full_name;
    if (!repoName) {
      console.error("[AutoFork] No repo name in fork response");
      return;
    }
    console.log(`[AutoFork] Forked to ${repoName}`);
    process.env.GITHUB_REPO = repoName;
    const envPath = path6.resolve(import.meta.dirname, "../../.env");
    try {
      let envContent = "";
      try {
        envContent = fs3.readFileSync(envPath, "utf-8");
      } catch {
      }
      if (/^GITHUB_REPO=.*$/m.test(envContent)) {
        envContent = envContent.replace(/^GITHUB_REPO=.*$/m, `GITHUB_REPO=${repoName}`);
      } else {
        envContent += `
GITHUB_REPO=${repoName}
`;
      }
      fs3.writeFileSync(envPath, envContent, "utf-8");
      console.log(`[AutoFork] Saved GITHUB_REPO=${repoName} to .env`);
    } catch {
      console.warn("[AutoFork] Could not write to .env \u2014 set GITHUB_REPO manually");
    }
  } catch (err) {
    console.error("[AutoFork] Error:", err);
  }
}
function startHeartbeat(world2) {
  const patreonKey = process.env.PATREON_KEY;
  const demoKey = process.env.DEMO_KEY;
  if (!patreonKey && !demoKey) {
    console.log("[Heartbeat] No PATREON_KEY or DEMO_KEY set \u2014 server will not be listed in the browser");
    return;
  }
  const registryUrl = process.env.REGISTRY_URL || DEFAULT_REGISTRY_URL;
  async function sendHeartbeat() {
    const serverName = process.env.SERVER_NAME || "PlainScape Server";
    const serverDesc = process.env.SERVER_DESCRIPTION || "";
    const serverHost = process.env.SERVER_HOST || "";
    const port = parseInt(process.env.PORT || "4800", 10);
    const maxPlayers = parseInt(process.env.MAX_PLAYERS || String(DEFAULT_MAX_PLAYERS), 10);
    const hasPassword = !!process.env.SERVER_PASSWORD;
    const isModded = process.env.IS_MODDED === "true";
    let host = serverHost;
    if (!host) {
      try {
        const res = await fetch("https://api.ipify.org?format=text");
        host = await res.text();
      } catch {
        console.warn("[Heartbeat] Could not detect public IP \u2014 set SERVER_HOST env var");
        return;
      }
    }
    try {
      const res = await fetch(`${registryUrl}/api/servers/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serverName,
          host,
          port,
          playerCount: world2.players.size,
          maxPlayers,
          description: serverDesc,
          hasPassword,
          isModded,
          ...patreonKey ? { patreonKey } : {},
          ...demoKey ? { demoKey } : {}
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn(`[Heartbeat] Registry rejected: ${data.error || res.status}`);
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.branch && !process.env.GIT_PUSH_BRANCH) {
          process.env.GIT_PUSH_BRANCH = data.branch;
          console.log(`[Heartbeat] Community branch assigned: ${data.branch}`);
        }
        if (data.code && !process.env.SERVER_CODE) {
          process.env.SERVER_CODE = data.code;
          console.log(`[Heartbeat] Server code assigned: ${data.code}`);
        }
        if (process.env.GITHUB_TOKEN && !process.env.GITHUB_REPO) {
          autoForkCommunityRepo(process.env.GITHUB_TOKEN);
        }
      }
    } catch (err) {
      console.warn("[Heartbeat] Failed to reach registry:", err.message);
    }
  }
  sendHeartbeat();
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  console.log(`[Heartbeat] Sending heartbeats to ${registryUrl} as "${process.env.SERVER_NAME || "PlainScape Server"}"`);
}

// server/src/admin/AdminConsole.ts
import { execSync as execSync4, spawn } from "child_process";
import crypto from "crypto";
import http2 from "http";
import fs4 from "fs";
import path7 from "path";

// server/src/admin/adminPage.ts
function adminPageHtml(serverName, showLogin) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(serverName)} \u2014 Admin</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #141420;
  --surface: #1a1a2e;
  --surface2: #22223a;
  --border: #2e2e4a;
  --text: #d8d8e4;
  --text-dim: #7a7a96;
  --green: #7ec87e;
  --green-dim: #4a8a4a;
  --green-bg: rgba(126, 200, 126, 0.08);
  --amber: #c9a84c;
  --amber-dim: #8a7434;
  --danger: #c85454;
  --danger-dim: #7a3232;
  --danger-bg: rgba(200, 84, 84, 0.08);
  --radius: 6px;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
  min-height: 100vh;
}

/* \u2500\u2500 Sidebar layout \u2500\u2500 */
.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 20px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}
.sidebar-brand img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 8px rgba(126, 200, 126, 0.3));
}
.sidebar-brand .name {
  font-size: 14px;
  font-weight: 600;
  color: var(--green);
  line-height: 1.2;
}
.sidebar-brand .sub {
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 20px;
  font-size: 13px;
  color: var(--text-dim);
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  transition: color 0.12s, background 0.12s;
  border-left: 2px solid transparent;
}
.nav-item:hover { color: var(--text); background: rgba(255,255,255,0.02); }
.nav-item.active {
  color: var(--green);
  background: var(--green-bg);
  border-left-color: var(--green);
}
.nav-icon { font-size: 15px; width: 20px; text-align: center; }

.sidebar-footer {
  margin-top: auto;
  padding: 16px 20px 0;
  border-top: 1px solid var(--border);
}
.server-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-dim);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px rgba(126, 200, 126, 0.5);
}

/* \u2500\u2500 Main content \u2500\u2500 */
.main {
  padding: 32px 40px;
  max-width: 860px;
  overflow-y: auto;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}
.page-desc {
  font-size: 13px;
  color: var(--text-dim);
  margin-bottom: 24px;
}

.panel { display: none; }
.panel.active { display: block; }

/* \u2500\u2500 Stats \u2500\u2500 */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.stat-big {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 24px;
  flex: 1;
}
.stat-big .num {
  font-size: 32px;
  font-weight: 700;
  color: var(--green);
  line-height: 1;
}
.stat-big .lbl {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 4px;
}
.stat-checks {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-dim);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 14px;
}
.stat-check .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot-on { background: var(--green); }
.dot-off { background: var(--danger); }

/* \u2500\u2500 Buttons \u2500\u2500 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface2);
  color: var(--text);
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}
.btn:hover { background: var(--border); border-color: var(--text-dim); }
.btn-primary {
  background: var(--green-dim);
  border-color: var(--green);
  color: #fff;
}
.btn-primary:hover { background: var(--green); }
.btn-danger {
  background: var(--danger-dim);
  border-color: var(--danger);
  color: #fff;
}
.btn-danger:hover { background: var(--danger); }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.btn-ghost {
  background: none;
  border-color: transparent;
  color: var(--text-dim);
}
.btn-ghost:hover { color: var(--text); background: rgba(255,255,255,0.04); }

/* \u2500\u2500 Forms \u2500\u2500 */
textarea, input[type="text"], input[type="password"] {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  padding: 10px 12px;
  resize: vertical;
}
textarea:focus, input:focus { outline: none; border-color: var(--green); }
textarea { min-height: 200px; line-height: 1.6; }
#panel-rules.active { display: flex; flex-direction: column; height: calc(100vh - 64px); max-width: none; }
#panel-rules > .page-title, #panel-rules > .page-desc { flex-shrink: 0; }
#panel-rules > .page-desc { margin-bottom: 12px; }
.rules-split { display: flex; gap: 16px; flex: 1; min-height: 0; }
.rules-editor-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.rules-editor-col textarea { flex: 1; min-height: 0; resize: none; font-size: 14px; line-height: 1.7; padding: 16px 20px; }
.rules-active-col { flex: 1; display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.active-rules-wrap { flex: 1; overflow-y: auto; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 0; }
.active-rules-wrap .empty-state { padding: 20px; }
.rule-card { padding: 12px 14px; border-bottom: 1px solid var(--border); }
.rule-card:last-child { border-bottom: none; }
.rule-text { font-size: 13px; color: var(--text); margin-bottom: 6px; line-height: 1.5; }
.rule-meta { font-size: 11px; color: var(--text-dim); display: flex; gap: 10px; flex-wrap: wrap; }
.rule-meta .rule-by { color: var(--green); }
.rule-status { font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.rule-status-success { color: var(--green); }
.rule-status-failed { color: var(--danger); }
.rule-status-pending { color: var(--amber); }
@media (max-width: 900px) {
  .rules-split { flex-direction: column; }
  .rules-active-col { max-height: 250px; }
  .rules-editor-col textarea { min-height: 200px; }
}
.editor-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.editor-hint {
  font-size: 12px;
  color: var(--text-dim);
}

/* \u2500\u2500 Tables \u2500\u2500 */
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 10px 12px; text-align: left; }
th {
  color: var(--text-dim);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
}
td { border-bottom: 1px solid rgba(46, 46, 74, 0.5); }
tr:hover td { background: rgba(255,255,255,0.015); }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}
.badge-online { background: rgba(126, 200, 126, 0.12); color: var(--green); }
.badge-offline { background: rgba(255,255,255,0.04); color: var(--text-dim); }
.badge-admin { background: rgba(201, 168, 76, 0.12); color: var(--amber); }

.search-box {
  margin-bottom: 16px;
}
.search-box input {
  font-family: 'Segoe UI', system-ui, sans-serif;
  max-width: 300px;
}

/* \u2500\u2500 Toast \u2500\u2500 */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
}
.toast {
  padding: 10px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  animation: toast-in 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
.toast-success { border-left: 3px solid var(--green); }
.toast-error { border-left: 3px solid var(--danger); }
@keyframes toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

/* \u2500\u2500 Login \u2500\u2500 */
.login-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--bg);
}
.login-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 40px 36px 36px;
  width: 340px;
  text-align: center;
}
.login-box img {
  width: 56px;
  height: 56px;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 12px rgba(126, 200, 126, 0.3));
  margin-bottom: 16px;
}
.login-box h1 {
  font-size: 18px;
  color: var(--green);
  margin-bottom: 2px;
}
.login-box .login-sub {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 24px;
}
.login-box input {
  margin-bottom: 12px;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.login-box .btn { width: 100%; justify-content: center; }
.login-error {
  color: var(--danger);
  font-size: 12px;
  margin-bottom: 10px;
  display: none;
}

/* \u2500\u2500 Section labels \u2500\u2500 */
.section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
  margin-bottom: 10px;
}

/* \u2500\u2500 Misc \u2500\u2500 */
.mt { margin-top: 12px; }
.mb { margin-bottom: 16px; }
.empty-state {
  padding: 32px 0;
  text-align: center;
  color: var(--text-dim);
  font-size: 13px;
}

/* \u2500\u2500 Built-in rules collapsible \u2500\u2500 */
.builtin-rules {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 4px;
}
.builtin-rules summary {
  padding: 10px 14px;
  font-size: 13px;
  color: var(--text-dim);
  cursor: pointer;
  user-select: none;
}
.builtin-rules summary:hover { color: var(--text); }
.builtin-rules-content {
  padding: 0 14px 14px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-dim);
}
.builtin-rules-content ul {
  margin: 4px 0 10px 18px;
}
.builtin-rules-content p {
  margin-bottom: 2px;
  color: var(--text);
  font-weight: 500;
}

/* \u2500\u2500 Config fields (Railway-style) \u2500\u2500 */
.config-group {
  margin-bottom: 24px;
}
.config-group-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.config-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(46, 46, 74, 0.3);
}
.config-row:last-child { border-bottom: none; }
.config-label {
  font-size: 13px;
  font-weight: 500;
  padding-top: 7px;
}
.config-hint {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 1px;
  font-weight: 400;
}
.config-input {
  width: 100%;
  max-width: 400px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  padding: 7px 10px;
}
.config-input:focus { outline: none; border-color: var(--green); }
.config-input::placeholder { color: var(--text-dim); opacity: 0.6; }
.config-input[type="number"] { max-width: 120px; }
.config-input.secret { font-family: monospace; letter-spacing: 1px; }

/* \u2500\u2500 Responsive: collapse sidebar on small screens \u2500\u2500 */
@media (max-width: 700px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border);
    padding: 12px 0;
  }
  .sidebar-brand { padding: 0 16px 12px; }
  .sidebar-footer { display: none; }
  .nav-items { display: flex; overflow-x: auto; padding: 0 8px; gap: 0; }
  .nav-item { border-left: none; border-bottom: 2px solid transparent; padding: 8px 14px; white-space: nowrap; }
  .nav-item.active { border-left-color: transparent; border-bottom-color: var(--green); }
  .main { padding: 20px 16px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
</head>
<body>
${showLogin ? loginHtml(serverName) : appHtml(serverName)}
</body>
</html>`;
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function loginHtml(serverName) {
  return `
<div class="login-wrap">
  <div class="login-box">
    <img src="/logo.png" alt="Logo">
    <h1>${esc(serverName)}</h1>
    <div class="login-sub">Admin Console</div>
    <div class="login-error" id="login-error">Invalid password</div>
    <input type="password" id="login-pw" placeholder="Password" autofocus>
    <button class="btn btn-primary" id="login-btn">Sign In</button>
  </div>
</div>
<script>
(function() {
  var pw = document.getElementById('login-pw');
  var btn = document.getElementById('login-btn');
  var errEl = document.getElementById('login-error');
  function doLogin() {
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw.value })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.ok) location.reload();
      else { errEl.style.display = 'block'; }
    }).catch(function() {
      errEl.textContent = 'Connection failed';
      errEl.style.display = 'block';
    });
  }
  btn.addEventListener('click', doLogin);
  pw.addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
})();
</script>`;
}
function appHtml(serverName) {
  return `
<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img src="/logo.png" alt="Logo">
      <div>
        <div class="name">${esc(serverName)}</div>
        <div class="sub">Admin Console</div>
      </div>
    </div>
    <div class="nav-items">
      <button class="nav-item active" data-tab="dashboard">
        <span class="nav-icon">&#9632;</span> Dashboard
      </button>
      <button class="nav-item" data-tab="config">
        <span class="nav-icon">&#9881;</span> Configuration
      </button>
      <button class="nav-item" data-tab="rules">
        <span class="nav-icon">&#9998;</span> Claude Rules
      </button>
      <button class="nav-item" data-tab="players">
        <span class="nav-icon">&#9823;</span> Players
      </button>
      <button class="nav-item" data-tab="bans">
        <span class="nav-icon">&#9888;</span> Bans
      </button>
      <button class="nav-item" data-tab="modding">
        <span class="nav-icon">&#9881;</span> Modding
      </button>
      <button class="nav-item" data-tab="commands">
        <span class="nav-icon">&#9654;</span> Commands
      </button>
    </div>
    <div class="sidebar-footer">
      <div class="server-status">
        <span class="status-dot"></span>
        <span id="sidebar-player-count">\u2014</span>
      </div>
    </div>
  </aside>

  <main class="main">
    <!-- Dashboard -->
    <div class="panel active" id="panel-dashboard">
      <div class="page-title">Dashboard</div>
      <div class="page-desc">Server overview and status</div>
      <div class="stats-row" id="stats-row"></div>
      <div class="stat-checks" id="stat-checks"></div>
      <div id="version-check" style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);"></div>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:12px;">
        <button class="btn btn-danger" id="restart-btn">Restart Server</button>
      </div>
    </div>

    <!-- Configuration -->
    <div class="panel" id="panel-config">
      <div class="page-title">Configuration</div>
      <div class="page-desc">Changes require a server restart to take effect.</div>
      <div id="config-fields"></div>
      <div style="margin-top:16px;display:flex;justify-content:flex-end;">
        <button class="btn btn-primary" id="save-config-btn">Save Configuration</button>
      </div>
    </div>

    <!-- Claude Rules -->
    <div class="panel" id="panel-rules">
      <div class="page-title">Claude Rules</div>
      <div class="page-desc">Rules that constrain what the AI can do when implementing player rules. Clear the text to remove all constraints.</div>

      <div class="rules-split">
        <div class="rules-editor-col">
          <div class="editor-bar">
            <span class="editor-hint">AI Guardrails</span>
            <button class="btn btn-primary btn-sm" id="save-rules-btn">Save Rules</button>
          </div>
          <textarea id="rules-editor" spellcheck="false" placeholder="Rules must be about gameplay only. No jokes, memes, or off-topic submissions.&#10;&#10;If a rule adds a visible entity, structure, or terrain zone, it must also appear on the minimap.&#10;&#10;Example:&#10;- Players cannot build turrets within 200 units of each other&#10;- Ghosts move 50% faster during the first hour of night"></textarea>
        </div>
        <div class="rules-active-col">
          <div class="editor-bar">
            <span class="editor-hint">Active Player Rules</span>
          </div>
          <div id="active-rules-wrap" class="active-rules-wrap">
            <div class="empty-state">No active rules this cycle.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Players -->
    <div class="panel" id="panel-players">
      <div class="page-title">Players</div>
      <div class="page-desc" id="player-count-desc">All registered players</div>
      <div class="search-box">
        <input type="text" id="player-search" placeholder="Search by username...">
      </div>
      <div id="players-table-wrap"></div>
    </div>

    <!-- Bans -->
    <div class="panel" id="panel-bans">
      <div class="page-title">Bans</div>
      <div class="page-desc">Active bans by fingerprint and IP address</div>
      <div id="bans-table-wrap"></div>
    </div>

    <!-- Modding -->
    <div class="panel" id="panel-modding">
      <div class="page-title">Modding</div>
      <div class="page-desc">Mark your server as modded and manage your stable branch.</div>

      <div class="config-group">
        <div class="config-group-title">Server Status</div>
        <div class="config-row" style="align-items:center">
          <div>
            <div class="config-label">Modded Flag</div>
            <div class="config-hint">When enabled, your server shows a "Modded" badge in the server browser. Enable this if you've made custom code changes beyond daily rules.</div>
          </div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="modded-toggle" style="width:18px;height:18px;accent-color:var(--green);cursor:pointer;">
            <span id="modded-label" style="font-size:13px;color:var(--text-dim);">Off</span>
          </label>
        </div>
        <div class="config-row">
          <div>
            <div class="config-label">Server Code</div>
            <div class="config-hint">Your unique identifier assigned by the registry. Used for git branch names.</div>
          </div>
          <code id="server-code-display" style="font-size:14px;color:var(--green);letter-spacing:2px;">\u2014</code>
        </div>
      </div>

      <div class="config-group">
        <div class="config-group-title">Branch Management</div>
        <div style="padding:12px 0;color:var(--text-dim);font-size:13px;line-height:1.6;">
          <p>Your server has two branches: <strong style="color:var(--text)">live</strong> (running code, reset weekly) and <strong style="color:var(--text)">stable</strong> (your baseline).</p>
          <p style="margin-top:8px;">Weekly resets revert <strong style="color:var(--text)">live</strong> back to <strong style="color:var(--text)">stable</strong>. If you've made custom mods you want to persist across resets, promote your current live code to stable.</p>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="promote-stable-btn">Promote Live \u2192 Stable</button>
        </div>
        <div id="promote-result" style="margin-top:8px;font-size:13px;"></div>
      </div>

      <div class="config-group">
        <div class="config-group-title">Rollback</div>
        <div style="padding:12px 0;color:var(--text-dim);font-size:13px;line-height:1.6;">
          <p>Roll back your live branch to a previous state. Choose your <strong style="color:var(--text)">stable branch</strong>, <strong style="color:var(--text)">PlainScape Community main</strong> (vanilla baseline), or a specific commit from your live branch history.</p>
        </div>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <select id="rollback-select" class="config-input" style="max-width:500px;font-family:'Segoe UI',system-ui,sans-serif;cursor:pointer;">
            <option value="">Loading commits...</option>
          </select>
          <button class="btn btn-danger" id="rollback-btn" disabled>Rollback</button>
        </div>
        <div id="rollback-result" style="margin-top:8px;font-size:13px;"></div>
      </div>
    </div>

    <!-- Commands -->
    <div class="panel" id="panel-commands">
      <div class="page-title">Admin Commands</div>
      <div class="page-desc">In-game chat commands available to server admins. Type these in the chat box (Enter key).</div>

      <div class="config-group">
        <div class="config-group-title">Admin Commands</div>
        <table>
          <thead><tr><th>Command</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/source &lt;amount&gt;</td><td>Add source currency to yourself</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/grantrule &lt;username&gt;</td><td>Grant rule submission prompt to an online player</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/rule</td><td>Open the rule submission prompt for yourself</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/clearrules</td><td>Clear all active game rules</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/clearsuggestions</td><td>Clear all player-submitted rule suggestions</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/notice &lt;text&gt;</td><td>Add an admin notice to the safe zone sign</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/clearnotices</td><td>Remove all admin notices</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/dawn</td><td>Force time to dawn phase</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/day</td><td>Force time to day phase</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/dusk</td><td>Force time to dusk phase</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/night</td><td>Force time to night phase</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/autotime</td><td>Resume natural real-clock day/night cycle</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/stag spawn</td><td>Spawn the Scorched Stag world boss</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/stag kill</td><td>Remove the Scorched Stag (no reward)</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/freeuser &lt;username&gt;</td><td>Release a username reservation (kicks if online)</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/freeall</td><td>Free all usernames and kick all players</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/clearmap</td><td>Remove all structures from the map</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/weeklyreset</td><td>Perform the weekly reset immediately</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/shutdown</td><td>Gracefully stop the server</td></tr>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/commands</td><td>List all available commands in chat</td></tr>
          </tbody>
        </table>
      </div>

      <div class="config-group">
        <div class="config-group-title">All Players</div>
        <table>
          <thead><tr><th>Command</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td style="white-space:nowrap;font-family:monospace;color:var(--green)">/w &lt;username&gt; &lt;message&gt;</td><td>Send a private whisper to another player</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<div class="toast-container" id="toasts"></div>

<script>
(function() {
  // \u2500\u2500 Helpers \u2500\u2500
  function api(url, opts) {
    return fetch(url, opts)
      .then(function(r) { return r.json(); })
      .catch(function() {
        toast('Request failed \u2014 check server', 'error');
        return null;
      });
  }

  function toast(msg, type) {
    var c = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'success');
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(function() { el.remove(); }, 4000);
  }

  // \u2500\u2500 Navigation \u2500\u2500
  var navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      navItems.forEach(function(n) { n.classList.remove('active'); });
      item.classList.add('active');
      document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
      document.getElementById('panel-' + item.dataset.tab).classList.add('active');
      if (item.dataset.tab === 'dashboard') loadStatus();
      if (item.dataset.tab === 'config') loadConfig();
      if (item.dataset.tab === 'rules') loadRules();
      if (item.dataset.tab === 'players') loadPlayers();
      if (item.dataset.tab === 'bans') loadBans();
      if (item.dataset.tab === 'modding') loadModding();
    });
  });

  // \u2500\u2500 Dashboard \u2500\u2500
  function loadStatus() {
    api('/api/status').then(function(d) {
      if (!d) return;
      var row = document.getElementById('stats-row');
      var checks = document.getElementById('stat-checks');
      var upH = Math.floor(d.uptime / 3600000);
      var upM = Math.floor((d.uptime % 3600000) / 60000);

      // Big stats: players + uptime
      row.textContent = '';
      [{val: d.playerCount + ' / ' + d.maxPlayers, lbl: 'Players Online'},
       {val: upH + 'h ' + upM + 'm', lbl: 'Uptime'}].forEach(function(s) {
        var el = document.createElement('div');
        el.className = 'stat-big';
        var num = document.createElement('div');
        num.className = 'num';
        num.textContent = s.val;
        var lbl = document.createElement('div');
        lbl.className = 'lbl';
        lbl.textContent = s.lbl;
        el.appendChild(num);
        el.appendChild(lbl);
        row.appendChild(el);
      });

      // Status checks
      checks.textContent = '';
      [{on: true, lbl: 'Port ' + d.gamePort},
       {on: d.hasPassword, lbl: d.hasPassword ? 'Password protected' : 'No password'},
       {on: d.hasApiKey, lbl: d.hasApiKey ? 'AI rules enabled' : 'No API key'}].forEach(function(c) {
        var el = document.createElement('div');
        el.className = 'stat-check';
        var dot = document.createElement('span');
        dot.className = 'dot ' + (c.on ? 'dot-on' : 'dot-off');
        var txt = document.createTextNode(c.lbl);
        el.appendChild(dot);
        el.appendChild(txt);
        checks.appendChild(el);
      });

      // Sidebar player count
      document.getElementById('sidebar-player-count').textContent =
        d.playerCount + ' player' + (d.playerCount !== 1 ? 's' : '') + ' online';
    });

    // Version check
    api('/api/version-check').then(function(d) {
      var wrap = document.getElementById('version-check');
      if (!d || !d.latest) {
        wrap.textContent = '';
        var info = document.createElement('div');
        info.style.cssText = 'font-size:13px;color:var(--text-dim);';
        info.textContent = 'v' + (d && d.current || '?') + ' \u2014 could not check for updates';
        wrap.appendChild(info);
        return;
      }

      wrap.textContent = '';
      var vLine = document.createElement('div');
      vLine.style.cssText = 'font-size:13px;margin-bottom:8px;';

      if (d.updateAvailable) {
        vLine.style.color = 'var(--amber)';
        vLine.textContent = 'Update available: v' + d.current + ' \u2192 v' + d.latest;

        var changeWrap = document.createElement('details');
        changeWrap.className = 'builtin-rules';
        changeWrap.style.marginTop = '8px';
        var summary = document.createElement('summary');
        summary.textContent = 'What\\'s new in v' + d.latest;
        changeWrap.appendChild(summary);
        var changeBody = document.createElement('div');
        changeBody.className = 'builtin-rules-content';
        changeBody.style.whiteSpace = 'pre-wrap';
        changeBody.textContent = d.changelog || 'No changelog available.';
        changeWrap.appendChild(changeBody);

        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:12px;margin-top:10px;';

        var updateBtn = document.createElement('button');
        updateBtn.className = 'btn btn-primary';
        updateBtn.textContent = 'Update to v' + d.latest;
        updateBtn.addEventListener('click', function() {
          if (!confirm('Update to v' + d.latest + '? This will pull the latest PlainScape Community release to your live branch and restart.')) return;
          updateBtn.disabled = true;
          updateBtn.textContent = 'Updating...';
          api('/api/rollback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: 'community-main' })
          }).then(function(r) {
            if (r && r.ok) {
              toast('Updated to v' + d.latest + ' \u2014 restart to apply');
              updateBtn.textContent = 'Updated \u2014 restart server';
              updateBtn.disabled = false;
              updateBtn.className = 'btn btn-danger';
              updateBtn.onclick = function() { api('/api/restart', { method: 'POST' }); };
            } else {
              toast((r && r.error) || 'Update failed', 'error');
              updateBtn.textContent = 'Update failed';
            }
          });
        });

        var relLink = document.createElement('a');
        relLink.href = d.releaseUrl;
        relLink.target = '_blank';
        relLink.className = 'btn btn-ghost';
        relLink.textContent = 'View release';
        relLink.style.textDecoration = 'none';

        btnRow.appendChild(updateBtn);
        btnRow.appendChild(relLink);
        wrap.appendChild(vLine);
        wrap.appendChild(changeWrap);
        wrap.appendChild(btnRow);
      } else {
        vLine.style.color = 'var(--green)';
        vLine.textContent = 'v' + d.current + ' \u2014 up to date';
        wrap.appendChild(vLine);
      }
    });
  }

  // \u2500\u2500 Configuration \u2500\u2500
  var configFields = [];
  function loadConfig() {
    api('/api/config').then(function(d) {
      if (!d || !d.config) return;
      configFields = d.config;
      renderConfigFields(d.config);
    });
  }

  function renderConfigFields(fields) {
    var container = document.getElementById('config-fields');
    container.textContent = '';
    var groups = {};
    fields.forEach(function(f) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    Object.keys(groups).forEach(function(cat) {
      var group = document.createElement('div');
      group.className = 'config-group';
      var title = document.createElement('div');
      title.className = 'config-group-title';
      title.textContent = cat;
      group.appendChild(title);
      groups[cat].forEach(function(f) {
        var row = document.createElement('div');
        row.className = 'config-row';
        var labelWrap = document.createElement('div');
        var lbl = document.createElement('div');
        lbl.className = 'config-label';
        lbl.textContent = f.label;
        labelWrap.appendChild(lbl);
        if (f.hint) {
          var hint = document.createElement('div');
          hint.className = 'config-hint';
          hint.textContent = f.hint;
          if (f.link) {
            hint.appendChild(document.createTextNode(' '));
            var linkEl = document.createElement('a');
            linkEl.href = f.link.url;
            linkEl.target = '_blank';
            linkEl.textContent = f.link.text;
            linkEl.style.cssText = 'color:var(--green);text-decoration:underline;';
            hint.appendChild(linkEl);
          }
          labelWrap.appendChild(hint);
        }
        var input = document.createElement('input');
        input.className = 'config-input';
        if (f.type === 'secret') input.className += ' secret';
        input.type = f.type === 'secret' ? 'password' : (f.type === 'number' ? 'number' : 'text');
        input.name = f.key;
        input.value = f.value;
        input.placeholder = f.placeholder || '';
        row.appendChild(labelWrap);
        row.appendChild(input);
        group.appendChild(row);
      });
      container.appendChild(group);
    });
  }

  document.getElementById('save-config-btn').addEventListener('click', function() {
    var inputs = document.querySelectorAll('.config-input');
    var config = {};
    inputs.forEach(function(input) {
      config[input.name] = input.value;
    });
    api('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: config })
    }).then(function(d) {
      if (d) toast(d.message || 'Saved');
    });
  });

  // \u2500\u2500 Restart \u2500\u2500
  function doRestart() {
    if (!confirm('Restart the server? All connected players will be disconnected.')) return;
    api('/api/restart', { method: 'POST' }).then(function(d) {
      if (d) toast('Server restarting...', 'success');
    });
  }

  document.getElementById('restart-btn').addEventListener('click', doRestart);

  // Ctrl+S save shortcut for editors
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      var rulesEditor = document.getElementById('rules-editor');
      if (document.activeElement === rulesEditor) {
        e.preventDefault();
        document.getElementById('save-rules-btn').click();
      } else if (document.activeElement && document.activeElement.classList.contains('config-input')) {
        e.preventDefault();
        document.getElementById('save-config-btn').click();
      }
    }
  });

  // \u2500\u2500 Claude Rules \u2500\u2500
  function loadRules() {
    api('/api/claude-rules').then(function(d) {
      if (d) document.getElementById('rules-editor').value = d.content;
    });
    loadGameRules();
  }

  function loadGameRules() {
    api('/api/game-rules').then(function(d) {
      if (!d) return;
      var wrap = document.getElementById('active-rules-wrap');
      if (!d.rules || d.rules.length === 0) {
        wrap.innerHTML = '<div class="empty-state">No active rules this cycle.</div>';
        return;
      }
      wrap.innerHTML = '';
      d.rules.forEach(function(r) {
        var card = document.createElement('div');
        card.className = 'rule-card';
        var text = document.createElement('div');
        text.className = 'rule-text';
        text.textContent = r.text;
        var meta = document.createElement('div');
        meta.className = 'rule-meta';
        var by = document.createElement('span');
        by.className = 'rule-by';
        by.textContent = r.createdBy;
        var when = document.createElement('span');
        var dt = new Date(r.createdAt);
        when.textContent = dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        var status = document.createElement('span');
        status.className = 'rule-status rule-status-' + r.status;
        status.textContent = r.status === 'success' ? 'Implemented' : r.status === 'failed' ? 'Failed' : 'Pending';
        meta.appendChild(by);
        meta.appendChild(when);
        meta.appendChild(status);
        card.appendChild(text);
        card.appendChild(meta);
        wrap.appendChild(card);
      });
    });
  }

  document.getElementById('save-rules-btn').addEventListener('click', function() {
    api('/api/claude-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: document.getElementById('rules-editor').value })
    }).then(function(d) {
      if (d) toast('Claude rules saved');
    });
  });

  // \u2500\u2500 Players \u2500\u2500
  var allPlayers = [];
  function loadPlayers() {
    api('/api/players').then(function(d) {
      if (!d) return;
      allPlayers = d.players;
      var online = allPlayers.filter(function(p) { return p.online; }).length;
      document.getElementById('player-count-desc').textContent =
        allPlayers.length + ' registered, ' + online + ' online';
      renderPlayers('');
    });
  }

  document.getElementById('player-search').addEventListener('input', function() {
    renderPlayers(this.value.toLowerCase());
  });

  function renderPlayers(filter) {
    var wrap = document.getElementById('players-table-wrap');
    var list = allPlayers.filter(function(p) {
      return !filter || p.username.toLowerCase().indexOf(filter) !== -1;
    });

    if (allPlayers.length === 0) {
      wrap.textContent = '';
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No players have joined this server yet.';
      wrap.appendChild(empty);
      return;
    }

    if (list.length === 0) {
      wrap.textContent = '';
      var noMatch = document.createElement('div');
      noMatch.className = 'empty-state';
      noMatch.textContent = 'No players match that search.';
      wrap.appendChild(noMatch);
      return;
    }

    // Sort: online first, then by total source desc
    list.sort(function(a, b) {
      if (a.online !== b.online) return b.online ? 1 : -1;
      return (b.totalSource || 0) - (a.totalSource || 0);
    });

    var table = document.createElement('table');
    var thead = document.createElement('thead');
    var hrow = document.createElement('tr');
    ['Player', 'Status', 'Source', 'Role', 'Last Seen', ''].forEach(function(h) {
      var th = document.createElement('th');
      th.textContent = h;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    list.forEach(function(p) {
      var tr = document.createElement('tr');

      var tdName = document.createElement('td');
      tdName.style.fontWeight = '500';
      tdName.textContent = p.username;

      var tdStatus = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'badge ' + (p.online ? 'badge-online' : 'badge-offline');
      badge.textContent = p.online ? 'Online' : 'Offline';
      tdStatus.appendChild(badge);

      var tdSource = document.createElement('td');
      tdSource.textContent = (p.totalSource || 0).toLocaleString();
      if (p.bankedSource > 0) {
        var banked = document.createElement('span');
        banked.style.cssText = 'color:var(--text-dim);margin-left:4px;font-size:11px;';
        banked.textContent = '(' + p.bankedSource.toLocaleString() + ' banked)';
        tdSource.appendChild(banked);
      }

      var tdRole = document.createElement('td');
      if (p.isAdmin) {
        var ab = document.createElement('span');
        ab.className = 'badge badge-admin';
        ab.textContent = 'Admin';
        tdRole.appendChild(ab);
      }

      var tdSeen = document.createElement('td');
      tdSeen.style.cssText = 'font-size:12px;color:var(--text-dim);';
      if (p.online) {
        tdSeen.textContent = 'Now';
        tdSeen.style.color = 'var(--green)';
      } else {
        tdSeen.textContent = p.lastSeen ? new Date(p.lastSeen).toLocaleDateString() : '\u2014';
      }

      var tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';

      var adminBtn = document.createElement('button');
      adminBtn.className = 'btn btn-sm btn-ghost';
      adminBtn.textContent = p.isAdmin ? 'Remove Admin' : 'Make Admin';
      adminBtn.addEventListener('click', function() {
        api('/api/players/' + encodeURIComponent(p.username) + '/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin: !p.isAdmin })
        }).then(function(d) {
          if (d) {
            toast(p.isAdmin ? 'Admin removed' : 'Admin granted');
            loadPlayers();
          }
        });
      });

      var banBtn = document.createElement('button');
      banBtn.className = 'btn btn-sm btn-danger';
      banBtn.textContent = 'Ban';
      banBtn.style.marginLeft = '6px';
      banBtn.addEventListener('click', function() {
        if (!confirm('Ban ' + p.username + '? This bans by fingerprint and IP.')) return;
        var reason = prompt('Reason (optional):', '');
        api('/api/players/' + encodeURIComponent(p.username) + '/ban', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason || '' })
        }).then(function(d) {
          if (d) {
            toast(p.username + ' banned');
            loadPlayers();
          }
        });
      });

      tdActions.appendChild(adminBtn);
      tdActions.appendChild(banBtn);

      tr.appendChild(tdName);
      tr.appendChild(tdStatus);
      tr.appendChild(tdSource);
      tr.appendChild(tdRole);
      tr.appendChild(tdSeen);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.textContent = '';
    wrap.appendChild(table);
  }

  // \u2500\u2500 Bans \u2500\u2500
  function loadBans() {
    api('/api/bans').then(function(d) {
      if (!d) return;
      var wrap = document.getElementById('bans-table-wrap');
      if (!d.bans || d.bans.length === 0) {
        wrap.textContent = '';
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No active bans \u2014 all players in good standing.';
        wrap.appendChild(empty);
        return;
      }

      var table = document.createElement('table');
      var thead = document.createElement('thead');
      var hrow = document.createElement('tr');
      ['Username', 'Fingerprint', 'IP', 'Reason', 'Date', ''].forEach(function(h) {
        var th = document.createElement('th');
        th.textContent = h;
        hrow.appendChild(th);
      });
      thead.appendChild(hrow);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');
      d.bans.forEach(function(b) {
        var tr = document.createElement('tr');

        var tdUser = document.createElement('td');
        tdUser.style.fontWeight = '500';
        tdUser.textContent = b.username || '\u2014';

        var tdFp = document.createElement('td');
        tdFp.style.cssText = 'font-size:12px;color:var(--text-dim);font-family:monospace;';
        tdFp.textContent = b.fingerprint ? b.fingerprint.substring(0, 12) : '\u2014';

        var tdIp = document.createElement('td');
        tdIp.style.cssText = 'font-size:12px;color:var(--text-dim);font-family:monospace;';
        tdIp.textContent = b.ip || '\u2014';

        var tdReason = document.createElement('td');
        tdReason.textContent = b.reason || '\u2014';
        tdReason.style.color = b.reason ? 'var(--text)' : 'var(--text-dim)';

        var tdDate = document.createElement('td');
        tdDate.style.cssText = 'font-size:12px;color:var(--text-dim);';
        tdDate.textContent = b.banned_at ? new Date(b.banned_at).toLocaleDateString() : '\u2014';

        var tdAction = document.createElement('td');
        tdAction.style.textAlign = 'right';
        var unbanBtn = document.createElement('button');
        unbanBtn.className = 'btn btn-sm btn-ghost';
        unbanBtn.textContent = 'Unban';
        unbanBtn.addEventListener('click', function() {
          if (!confirm('Remove ban for ' + (b.username || 'this entry') + '?')) return;
          api('/api/bans/' + b.id + '/remove', { method: 'POST' }).then(function(d) {
            if (d) {
              toast('Ban removed');
              loadBans();
            }
          });
        });
        tdAction.appendChild(unbanBtn);

        tr.appendChild(tdUser);
        tr.appendChild(tdFp);
        tr.appendChild(tdIp);
        tr.appendChild(tdReason);
        tr.appendChild(tdDate);
        tr.appendChild(tdAction);
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      wrap.textContent = '';
      wrap.appendChild(table);
    });
  }

  // \u2500\u2500 Modding \u2500\u2500
  function loadModding() {
    api('/api/modded').then(function(d) {
      if (!d) return;
      var toggle = document.getElementById('modded-toggle');
      var label = document.getElementById('modded-label');
      var codeEl = document.getElementById('server-code-display');
      toggle.checked = d.isModded;
      label.textContent = d.isModded ? 'Modded' : 'Off';
      label.style.color = d.isModded ? 'var(--green)' : 'var(--text-dim)';
      codeEl.textContent = d.serverCode || '\u2014 (not registered yet)';
    });
    loadRollbackCommits();
  }

  document.getElementById('modded-toggle').addEventListener('change', function() {
    var isModded = this.checked;
    var label = document.getElementById('modded-label');
    api('/api/modded', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isModded: isModded })
    }).then(function(d) {
      if (d) {
        label.textContent = isModded ? 'Modded' : 'Off';
        label.style.color = isModded ? 'var(--green)' : 'var(--text-dim)';
        toast(isModded ? 'Server marked as modded' : 'Modded flag removed');
      }
    });
  });

  document.getElementById('promote-stable-btn').addEventListener('click', function() {
    if (!confirm('Promote current live code to stable? This overwrites your stable branch.')) return;
    var resultEl = document.getElementById('promote-result');
    resultEl.textContent = 'Promoting...';
    resultEl.style.color = 'var(--text-dim)';
    api('/api/promote-stable', { method: 'POST' }).then(function(d) {
      if (d && d.ok) {
        resultEl.textContent = d.message;
        resultEl.style.color = 'var(--green)';
        toast('Promoted to stable');
      } else {
        resultEl.textContent = (d && d.error) || 'Failed';
        resultEl.style.color = 'var(--danger)';
      }
    });
  });

  // \u2500\u2500 Rollback \u2500\u2500
  function loadRollbackCommits() {
    var sel = document.getElementById('rollback-select');
    var btn = document.getElementById('rollback-btn');
    // Clear with DOM methods (safe, no innerHTML with untrusted data)
    while (sel.firstChild) sel.removeChild(sel.firstChild);
    var loadingOpt = document.createElement('option');
    loadingOpt.value = '';
    loadingOpt.textContent = 'Loading commits...';
    sel.appendChild(loadingOpt);
    btn.disabled = true;

    api('/api/rollback-commits').then(function(d) {
      while (sel.firstChild) sel.removeChild(sel.firstChild);

      if (!d || d.error) {
        var errOpt = document.createElement('option');
        errOpt.value = '';
        errOpt.textContent = d ? d.error : 'Failed to load';
        sel.appendChild(errOpt);
        return;
      }

      // Own stable branch option
      if (d.ownStable) {
        var stableOpt = document.createElement('option');
        stableOpt.value = 'own-stable';
        stableOpt.textContent = 'Your stable branch \u2014 ' + d.ownStable.message;
        sel.appendChild(stableOpt);
      }

      // Community main option
      if (d.communityMain) {
        var mainOpt = document.createElement('option');
        mainOpt.value = 'community-main';
        mainOpt.textContent = 'PlainScape Community main \u2014 ' + d.communityMain.message;
        sel.appendChild(mainOpt);
      }

      // Separator + live branch commits
      if (d.commits && d.commits.length > 0) {
        var sep = document.createElement('option');
        sep.disabled = true;
        sep.textContent = '\u2500\u2500 ' + (d.liveBranch || 'live') + ' commits \u2500\u2500';
        sel.appendChild(sep);

        d.commits.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c.sha;
          var dt = new Date(c.date);
          var dateStr = dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
          opt.textContent = c.sha.substring(0, 7) + ' \u2014 ' + c.message + ' (' + dateStr + ')';
          sel.appendChild(opt);
        });
      }

      btn.disabled = false;
    });
  }

  document.getElementById('rollback-btn').addEventListener('click', function() {
    var sel = document.getElementById('rollback-select');
    var target = sel.value;
    if (!target) return;

    var label = sel.options[sel.selectedIndex].textContent;
    if (!confirm('Roll back to:\\n\\n' + label + '\\n\\nThis will force-push to your live branch. Continue?')) return;

    var resultEl = document.getElementById('rollback-result');
    resultEl.textContent = 'Rolling back...';
    resultEl.style.color = 'var(--text-dim)';

    api('/api/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: target })
    }).then(function(d) {
      if (d && d.ok) {
        resultEl.textContent = d.message;
        resultEl.style.color = 'var(--green)';
        toast('Rollback successful');
        loadRollbackCommits();
      } else {
        resultEl.textContent = (d && d.error) || 'Failed';
        resultEl.style.color = 'var(--danger)';
      }
    });
  });

  // \u2500\u2500 Initial load \u2500\u2500
  loadStatus();
})();
</script>`;
}

// server/src/admin/AdminConsole.ts
var PROJECT_ROOT5 = findProjectRoot();
function findProjectRoot() {
  const fromDir = path7.resolve(import.meta.dirname, "../../..");
  const fromDir2 = path7.resolve(import.meta.dirname, "../..");
  try {
    if (fs4.existsSync(path7.join(fromDir2, "client"))) return fromDir2;
  } catch {
  }
  try {
    if (fs4.existsSync(path7.join(fromDir, "client"))) return fromDir;
  } catch {
  }
  return fromDir2;
}
var SENSITIVE_KEYS = ["ANTHROPIC_API_KEY", "PATREON_KEY", "DEMO_KEY", "REGISTRY_SECRET", "GITHUB_TOKEN", "ADMIN_CONSOLE_PASSWORD", "PATREON_CLIENT_ID", "PATREON_CLIENT_SECRET"];
function startAdminConsole(world2) {
  const port = parseInt(process.env.ADMIN_PORT || "4801", 10);
  const password = process.env.ADMIN_CONSOLE_PASSWORD || "";
  const validSessions = /* @__PURE__ */ new Set();
  const failedAttempts = /* @__PURE__ */ new Map();
  const MAX_FAILED_ATTEMPTS = 10;
  const LOCKOUT_DURATION = 6e4;
  function generateSession() {
    const s = crypto.randomBytes(24).toString("base64url");
    validSessions.add(s);
    return s;
  }
  function isAuthed(req) {
    if (!password) return true;
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/admin_session=([a-zA-Z0-9_-]+)/);
    return match ? validSessions.has(match[1]) : false;
  }
  const envPath = path7.resolve(PROJECT_ROOT5, ".env");
  const rulesPath = path7.resolve(PROJECT_ROOT5, "claude-rules.md");
  const logoPath = path7.resolve(PROJECT_ROOT5, "client/logo.png");
  const serverStartTime = Date.now();
  function readBody(req) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });
  }
  function parseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  function json(res, data, status = 200) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
  function err(res, message, status = 400) {
    json(res, { error: message }, status);
  }
  function readCurrentSensitiveValues() {
    const values = {};
    try {
      const content = fs4.readFileSync(envPath, "utf-8");
      for (const key of SENSITIVE_KEYS) {
        const m = content.match(new RegExp(`^${key}=(.+)$`, "m"));
        if (m) values[key] = m[1];
      }
    } catch {
    }
    return values;
  }
  const server = http2.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      const method = req.method || "GET";
      const parts = url.pathname.split("/").filter(Boolean);
      res.setHeader("Access-Control-Allow-Origin", `http://127.0.0.1:${port}`);
      if (method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      if (url.pathname === "/logo.png") {
        try {
          const img = fs4.readFileSync(logoPath);
          res.writeHead(200, { "Content-Type": "image/png" });
          res.end(img);
        } catch {
          res.writeHead(404);
          res.end("Not found");
        }
        return;
      }
      if (url.pathname === "/api/auth" && method === "POST") {
        const clientIp = req.socket.remoteAddress || "unknown";
        const attempt = failedAttempts.get(clientIp);
        if (attempt && attempt.count >= MAX_FAILED_ATTEMPTS && Date.now() - attempt.lastAttempt < LOCKOUT_DURATION) {
          err(res, "Too many failed attempts \u2014 try again in 1 minute", 429);
          return;
        }
        const body = parseJson(await readBody(req));
        if (!body) {
          err(res, "Invalid JSON");
          return;
        }
        if (body.password === password) {
          failedAttempts.delete(clientIp);
          const session = generateSession();
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Set-Cookie": `admin_session=${session}; Path=/; HttpOnly; SameSite=Strict`
          });
          res.end(JSON.stringify({ ok: true }));
        } else {
          const prev = failedAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };
          if (Date.now() - prev.lastAttempt > LOCKOUT_DURATION) prev.count = 0;
          prev.count++;
          prev.lastAttempt = Date.now();
          failedAttempts.set(clientIp, prev);
          err(res, "Invalid password", 401);
        }
        return;
      }
      if (!isAuthed(req)) {
        if (url.pathname === "/" || url.pathname === "") {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(adminPageHtml(process.env.SERVER_NAME || "PlainScape Server", true));
          return;
        }
        err(res, "Unauthorized", 401);
        return;
      }
      if (url.pathname === "/" || url.pathname === "") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(adminPageHtml(process.env.SERVER_NAME || "PlainScape Server", false));
        return;
      }
      if (url.pathname === "/api/version-check" && method === "GET") {
        try {
          let currentVersion = "0.0.0";
          try {
            const pkg = JSON.parse(fs4.readFileSync(path7.resolve(PROJECT_ROOT5, "package.json"), "utf-8"));
            currentVersion = pkg.version || "0.0.0";
          } catch {
          }
          const ghRes = await fetch("https://api.github.com/repos/chvolk/PlainScape-Community/releases/latest", {
            headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "PlainScape-Admin" }
          });
          if (!ghRes.ok) {
            json(res, { current: currentVersion, latest: null, error: "Failed to check GitHub" });
            return;
          }
          const release = await ghRes.json();
          const latestVersion = (release.tag_name || "").replace(/^v/, "");
          json(res, {
            current: currentVersion,
            latest: latestVersion,
            updateAvailable: latestVersion !== currentVersion,
            changelog: release.body || "",
            releaseUrl: release.html_url || ""
          });
        } catch (e) {
          json(res, { current: "0.0.0", latest: null, error: "Version check failed" });
        }
        return;
      }
      if (url.pathname === "/api/status" && method === "GET") {
        json(res, {
          serverName: process.env.SERVER_NAME || "PlainScape Server",
          playerCount: world2.players.size,
          maxPlayers: parseInt(process.env.MAX_PLAYERS || "100", 10),
          uptime: Date.now() - serverStartTime,
          gamePort: parseInt(process.env.PORT || "4800", 10),
          hasPassword: !!process.env.SERVER_PASSWORD,
          hasApiKey: !!process.env.ANTHROPIC_API_KEY
        });
        return;
      }
      if (url.pathname === "/api/config" && method === "GET") {
        let envContent = "";
        try {
          envContent = fs4.readFileSync(envPath, "utf-8");
        } catch {
        }
        const envMap = parseEnvFile(envContent);
        const config = [
          { key: "SERVER_NAME", label: "Server Name", value: envMap["SERVER_NAME"] || "", placeholder: "My PlainScape Server", category: "Server", type: "text" },
          { key: "SERVER_DESCRIPTION", label: "Server Description", value: envMap["SERVER_DESCRIPTION"] || "", placeholder: "A community PlainScape server", category: "Server", type: "text" },
          { key: "PORT", label: "Game Port", value: envMap["PORT"] || "4800", placeholder: "4800", category: "Server", type: "number" },
          { key: "MAX_PLAYERS", label: "Max Players", value: envMap["MAX_PLAYERS"] || "100", placeholder: "100", category: "Server", type: "number" },
          { key: "SERVER_PASSWORD", label: "Server Password", value: envMap["SERVER_PASSWORD"] || "", placeholder: "Leave empty for public", category: "Server", type: "password", hint: "Players will need this password to join. Leave empty for a public server." },
          { key: "ADMIN_USERS", label: "Admin Usernames", value: envMap["ADMIN_USERS"] || "", placeholder: "User1,User2", category: "Server", type: "text", hint: "Comma-separated list of admin usernames" },
          { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", value: envMap["ANTHROPIC_API_KEY"] ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "", placeholder: "sk-ant-...", category: "AI Rules", type: "secret", hint: "Required for the daily champion rule system" },
          { key: "CLAUDE_RULE_MODEL", label: "Claude Model", value: envMap["CLAUDE_RULE_MODEL"] || "claude-opus-4-6", placeholder: "claude-opus-4-6", category: "AI Rules", type: "text", hint: "Model ID for rule implementation (e.g. claude-opus-4-6, claude-sonnet-4-6)" },
          { key: "CLAUDE_MAX_TURNS", label: "Max Turns", value: envMap["CLAUDE_MAX_TURNS"] || "50", placeholder: "50", category: "AI Rules", type: "number", hint: "Maximum agentic turns when implementing a rule" },
          { key: "CLAUDE_MAX_TOKENS", label: "Max Tokens per Turn", value: envMap["CLAUDE_MAX_TOKENS"] || "16384", placeholder: "16384", category: "AI Rules", type: "number", hint: "Token limit per Claude API call" },
          { key: "TIMEZONE_UTC_OFFSET", label: "UTC Offset", value: envMap["TIMEZONE_UTC_OFFSET"] || "-7", placeholder: "-7", category: "Timing", type: "number", hint: "Your timezone offset from UTC (e.g. -7 for Phoenix)" },
          { key: "CHAMPION_HOUR", label: "Champion Hour", value: envMap["CHAMPION_HOUR"] || "18", placeholder: "18", category: "Timing", type: "number", hint: "Hour (0-23) when the daily champion is selected" },
          { key: "RESET_DAY", label: "Weekly Reset Day", value: envMap["RESET_DAY"] || "0", placeholder: "0", category: "Timing", type: "number", hint: "0=Sun, 1=Mon, ... 6=Sat" },
          { key: "RESET_HOUR", label: "Weekly Reset Hour", value: envMap["RESET_HOUR"] || "20", placeholder: "20", category: "Timing", type: "number", hint: "Hour (0-23) for weekly reset" },
          { key: "PATREON_KEY", label: "Patreon Key", value: envMap["PATREON_KEY"] ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "", placeholder: "", category: "Registry", type: "secret", hint: "Required to appear in the server browser", link: { url: "https://plainscape.world/api/patreon/authorize", text: "Get Patreon Key" } },
          { key: "DEMO_KEY", label: "Demo Key", value: envMap["DEMO_KEY"] ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "", placeholder: "", category: "Registry", type: "secret", hint: "Alternative to Patreon key for testing" },
          { key: "SERVER_HOST", label: "Public IP", value: envMap["SERVER_HOST"] || "", placeholder: "Auto-detected", category: "Registry", type: "text", hint: "Your public IP for the server browser. Auto-detected if empty." },
          { key: "ADMIN_PORT", label: "Admin Console Port", value: envMap["ADMIN_PORT"] || "4801", placeholder: "4801", category: "Admin", type: "number" },
          { key: "GITHUB_TOKEN", label: "GitHub Token", value: envMap["GITHUB_TOKEN"] ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "", placeholder: "ghp_...", category: "Git", type: "secret", hint: "GitHub PAT for pushing rule code changes" },
          { key: "GITHUB_REPO", label: "GitHub Repo", value: envMap["GITHUB_REPO"] || "", placeholder: "owner/repo", category: "Git", type: "text", hint: "Repo for rule code pushes. Use your own fork to keep changes separate. Branches: community/{server-code}/live and /stable." }
        ];
        json(res, { config });
        return;
      }
      if (url.pathname === "/api/config" && method === "POST") {
        const body = parseJson(await readBody(req));
        if (!body || typeof body.config !== "object") {
          err(res, "Invalid JSON");
          return;
        }
        const updates = body.config;
        let envContent = "";
        try {
          envContent = fs4.readFileSync(envPath, "utf-8");
        } catch {
        }
        const envMap = parseEnvFile(envContent);
        for (const [key, value] of Object.entries(updates)) {
          if (key === "ADMIN_CONSOLE_PASSWORD") continue;
          if (value === "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022") continue;
          envMap[key] = value;
        }
        if (password && !envMap["ADMIN_CONSOLE_PASSWORD"]) {
          envMap["ADMIN_CONSOLE_PASSWORD"] = password;
        }
        const lines = [];
        const written = /* @__PURE__ */ new Set();
        for (const line of envContent.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            lines.push(line);
            continue;
          }
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx === -1) {
            lines.push(line);
            continue;
          }
          const key = trimmed.slice(0, eqIdx).trim();
          written.add(key);
          if (key in envMap) {
            lines.push(`${key}=${envMap[key]}`);
          }
        }
        for (const [key, value] of Object.entries(envMap)) {
          if (!written.has(key) && value) {
            lines.push(`${key}=${value}`);
          }
        }
        fs4.writeFileSync(envPath, lines.join("\n"), "utf-8");
        json(res, { ok: true, message: "Configuration saved. Restart server to apply changes." });
        return;
      }
      if (url.pathname === "/api/env" && method === "GET") {
        try {
          const content = fs4.readFileSync(envPath, "utf-8");
          const redacted = content.replace(
            /^(ANTHROPIC_API_KEY|PATREON_KEY|DEMO_KEY|REGISTRY_SECRET|GITHUB_TOKEN|ADMIN_CONSOLE_PASSWORD|PATREON_CLIENT_ID|PATREON_CLIENT_SECRET)=(.+)$/gm,
            (_, key, val) => `${key}=${"*".repeat(Math.min(val.length, 20))}`
          );
          json(res, { content: redacted, redacted });
        } catch {
          json(res, { content: "", redacted: "" });
        }
        return;
      }
      if (url.pathname === "/api/env" && method === "POST") {
        const body = parseJson(await readBody(req));
        if (!body) {
          err(res, "Invalid JSON");
          return;
        }
        let finalContent = typeof body.content === "string" ? body.content : "";
        const currentValues = readCurrentSensitiveValues();
        for (const key of SENSITIVE_KEYS) {
          const re = new RegExp(`^${key}=\\*+$`, "m");
          if (re.test(finalContent) && currentValues[key]) {
            finalContent = finalContent.replace(re, `${key}=${currentValues[key]}`);
          }
        }
        if (password) {
          const hasPasswordLine = /^ADMIN_CONSOLE_PASSWORD=.+$/m.test(finalContent);
          if (!hasPasswordLine) {
            finalContent += `
ADMIN_CONSOLE_PASSWORD=${password}
`;
          } else {
            finalContent = finalContent.replace(
              /^ADMIN_CONSOLE_PASSWORD=.*$/m,
              `ADMIN_CONSOLE_PASSWORD=${password}`
            );
          }
        }
        fs4.writeFileSync(envPath, finalContent, "utf-8");
        json(res, { ok: true, message: "Saved. Restart server to apply changes." });
        return;
      }
      if (url.pathname === "/api/claude-rules" && method === "GET") {
        try {
          const content = fs4.readFileSync(rulesPath, "utf-8");
          json(res, { content });
        } catch {
          json(res, { content: "" });
        }
        return;
      }
      if (url.pathname === "/api/claude-rules" && method === "POST") {
        const body = parseJson(await readBody(req));
        if (!body) {
          err(res, "Invalid JSON");
          return;
        }
        fs4.writeFileSync(rulesPath, body.content || "", "utf-8");
        json(res, { ok: true });
        return;
      }
      if (url.pathname === "/api/players" && method === "GET") {
        const dbPlayers = world2.db.getAllPlayers();
        const onlineUsernames = /* @__PURE__ */ new Set();
        for (const [, p] of world2.players) onlineUsernames.add(p.username);
        const players = dbPlayers.map((p) => ({
          username: p.username,
          fingerprint: p.fingerprint || "",
          lastIp: p.last_ip || "",
          totalSource: p.total_source_generated,
          bankedSource: p.banked_source,
          lastSeen: p.last_seen,
          createdAt: p.created_at,
          online: onlineUsernames.has(p.username),
          isAdmin: isAdminCheck(p.username)
        }));
        json(res, { players });
        return;
      }
      if (parts.length === 4 && parts[0] === "api" && parts[1] === "players" && parts[3] === "admin" && method === "POST") {
        const username = decodeURIComponent(parts[2]);
        const body = parseJson(await readBody(req));
        if (!body) {
          err(res, "Invalid JSON");
          return;
        }
        const makeAdmin = !!body.admin;
        let envContent = "";
        try {
          envContent = fs4.readFileSync(envPath, "utf-8");
        } catch {
        }
        const currentAdmins = parseAdminUsers(envContent);
        if (makeAdmin) {
          currentAdmins.add(username);
        } else {
          currentAdmins.delete(username);
        }
        const newLine = `ADMIN_USERS=${[...currentAdmins].join(",")}`;
        if (/^ADMIN_USERS=.*$/m.test(envContent)) {
          envContent = envContent.replace(/^ADMIN_USERS=.*$/m, newLine);
        } else {
          envContent += `
${newLine}
`;
        }
        fs4.writeFileSync(envPath, envContent, "utf-8");
        process.env.ADMIN_USERS = [...currentAdmins].join(",");
        resetAdminCache();
        json(res, { ok: true, message: "Admin updated." });
        return;
      }
      if (parts.length === 4 && parts[0] === "api" && parts[1] === "players" && parts[3] === "ban" && method === "POST") {
        const username = decodeURIComponent(parts[2]);
        const body = parseJson(await readBody(req));
        if (!body) {
          err(res, "Invalid JSON");
          return;
        }
        const reason = body.reason || "";
        const dbPlayer = world2.db.findPlayerByUsername(username);
        const fingerprint = dbPlayer?.fingerprint || "";
        const lastIp = dbPlayer?.last_ip || "";
        world2.db.addBan(fingerprint, lastIp, username, reason, "admin");
        for (const [, p] of world2.players) {
          if (p.username === username) {
            p.ws.send(JSON.stringify({ type: "error", message: "You have been banned from this server" }));
            p.ws.close();
            break;
          }
        }
        json(res, { ok: true });
        return;
      }
      if (parts.length === 4 && parts[0] === "api" && parts[1] === "bans" && parts[3] === "remove" && method === "POST") {
        const banId = parseInt(parts[2], 10);
        if (!isNaN(banId)) {
          world2.db.removeBan(banId);
          json(res, { ok: true });
        } else {
          err(res, "Invalid ban ID");
        }
        return;
      }
      if (url.pathname === "/api/bans" && method === "GET") {
        json(res, { bans: world2.db.getBans() });
        return;
      }
      if (url.pathname === "/api/game-rules" && method === "GET") {
        json(res, { rules: world2.rules });
        return;
      }
      if (url.pathname === "/api/modded" && method === "POST") {
        const body = parseJson(await readBody(req));
        if (!body) {
          err(res, "Invalid JSON");
          return;
        }
        const isModded = !!body.isModded;
        let envContent = "";
        try {
          envContent = fs4.readFileSync(envPath, "utf-8");
        } catch {
        }
        const newLine = `IS_MODDED=${isModded}`;
        if (/^IS_MODDED=.*$/m.test(envContent)) {
          envContent = envContent.replace(/^IS_MODDED=.*$/m, newLine);
        } else {
          envContent += `
${newLine}
`;
        }
        fs4.writeFileSync(envPath, envContent, "utf-8");
        process.env.IS_MODDED = String(isModded);
        json(res, { ok: true, isModded });
        return;
      }
      if (url.pathname === "/api/modded" && method === "GET") {
        json(res, { isModded: process.env.IS_MODDED === "true", serverCode: process.env.SERVER_CODE || "" });
        return;
      }
      if (url.pathname === "/api/promote-stable" && method === "POST") {
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO;
        const code = process.env.SERVER_CODE;
        if (!token || !repo) {
          err(res, "GITHUB_TOKEN and GITHUB_REPO required");
          return;
        }
        if (!code || !/^[a-z0-9]{6}$/.test(code)) {
          err(res, "No valid SERVER_CODE \u2014 register with the main server first");
          return;
        }
        if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
          err(res, "Invalid GITHUB_REPO format");
          return;
        }
        const liveBranch = `community/${code}/live`;
        const stableBranch = `community/${code}/stable`;
        const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
        try {
          execSync4(`git fetch ${remoteUrl} ${liveBranch}`, { cwd: PROJECT_ROOT5, stdio: "pipe", timeout: 15e3 });
          execSync4(`git push ${remoteUrl} FETCH_HEAD:${stableBranch} --force`, { cwd: PROJECT_ROOT5, stdio: "pipe", timeout: 15e3 });
          json(res, { ok: true, message: `Promoted ${liveBranch} \u2192 ${stableBranch}` });
        } catch (e) {
          console.error("[AdminConsole] Promote to stable failed:", e);
          err(res, "Failed to promote \u2014 check git credentials", 500);
        }
        return;
      }
      if (url.pathname === "/api/rollback-commits" && method === "GET") {
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || "chvolk/PlainScape-Community";
        const code = process.env.SERVER_CODE;
        if (!token) {
          err(res, "GITHUB_TOKEN required");
          return;
        }
        if (!code || !/^[a-z0-9]{6}$/.test(code)) {
          err(res, "No valid SERVER_CODE \u2014 register with the main server first");
          return;
        }
        if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
          err(res, "Invalid GITHUB_REPO format");
          return;
        }
        const liveBranch = `community/${code}/live`;
        const ghHeaders = {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "PlainScape-Admin"
        };
        try {
          const commitsRes = await fetch(
            `https://api.github.com/repos/${repo}/commits?sha=${encodeURIComponent(liveBranch)}&per_page=20`,
            { headers: ghHeaders }
          );
          const commitsData = commitsRes.ok ? await commitsRes.json() : [];
          const ownStableBranch = `community/${code}/stable`;
          const ownStableRes = await fetch(
            `https://api.github.com/repos/${repo}/commits/${encodeURIComponent(ownStableBranch)}`,
            { headers: ghHeaders }
          );
          const ownStableData = ownStableRes.ok ? await ownStableRes.json() : null;
          const communityMainRes = await fetch(
            `https://api.github.com/repos/chvolk/PlainScape-Community/commits/main`,
            { headers: ghHeaders }
          );
          const communityMainData = communityMainRes.ok ? await communityMainRes.json() : null;
          json(res, {
            commits: Array.isArray(commitsData) ? commitsData.map((c) => ({
              sha: c.sha,
              message: (c.commit?.message || "").split("\n")[0],
              date: c.commit?.author?.date || ""
            })) : [],
            ownStable: ownStableData ? {
              sha: ownStableData.sha,
              message: (ownStableData.commit?.message || "").split("\n")[0],
              date: ownStableData.commit?.author?.date || ""
            } : null,
            communityMain: communityMainData ? {
              sha: communityMainData.sha,
              message: (communityMainData.commit?.message || "").split("\n")[0],
              date: communityMainData.commit?.author?.date || ""
            } : null,
            repo,
            liveBranch
          });
        } catch (e) {
          console.error("[AdminConsole] Failed to fetch rollback commits:", e);
          err(res, "Failed to fetch commits from GitHub", 500);
        }
        return;
      }
      if (url.pathname === "/api/rollback" && method === "POST") {
        const body = parseJson(await readBody(req));
        if (!body || !body.target) {
          err(res, "Missing target");
          return;
        }
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || "chvolk/PlainScape-Community";
        const code = process.env.SERVER_CODE;
        if (!token) {
          err(res, "GITHUB_TOKEN required");
          return;
        }
        if (!code || !/^[a-z0-9]{6}$/.test(code)) {
          err(res, "No valid SERVER_CODE");
          return;
        }
        if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
          err(res, "Invalid GITHUB_REPO format");
          return;
        }
        const liveBranch = `community/${code}/live`;
        const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
        try {
          if (body.target === "own-stable") {
            const stableBranch = `community/${code}/stable`;
            execSync4(`git fetch ${remoteUrl} ${stableBranch}`, { cwd: PROJECT_ROOT5, stdio: "pipe", timeout: 3e4 });
            execSync4(`git push ${remoteUrl} FETCH_HEAD:${liveBranch} --force`, { cwd: PROJECT_ROOT5, stdio: "pipe", timeout: 15e3 });
            json(res, { ok: true, message: `Rolled back to your stable branch` });
          } else if (body.target === "community-main") {
            const communityUrl = `https://x-access-token:${token}@github.com/chvolk/PlainScape-Community.git`;
            execSync4(`git fetch ${communityUrl} main`, { cwd: PROJECT_ROOT5, stdio: "pipe", timeout: 3e4 });
            execSync4(`git push ${remoteUrl} FETCH_HEAD:${liveBranch} --force`, { cwd: PROJECT_ROOT5, stdio: "pipe", timeout: 15e3 });
            json(res, { ok: true, message: `Rolled back to PlainScape Community main` });
          } else {
            const sha = body.target;
            if (!/^[a-f0-9]{40}$/.test(sha)) {
              err(res, "Invalid commit SHA");
              return;
            }
            execSync4(`git fetch ${remoteUrl} ${liveBranch}`, { cwd: PROJECT_ROOT5, stdio: "pipe", timeout: 3e4 });
            execSync4(`git push ${remoteUrl} ${sha}:refs/heads/${liveBranch} --force`, { cwd: PROJECT_ROOT5, stdio: "pipe", timeout: 15e3 });
            json(res, { ok: true, message: `Rolled back to ${sha.substring(0, 7)}` });
          }
        } catch (e) {
          console.error("[AdminConsole] Rollback failed:", e);
          err(res, "Rollback failed \u2014 check git credentials and server code", 500);
        }
        return;
      }
      if (url.pathname === "/api/restart" && method === "POST") {
        json(res, { ok: true, message: "Server restarting..." });
        console.log("[AdminConsole] Restart requested \u2014 spawning new process");
        setTimeout(() => {
          const child = spawn(process.argv[0], process.argv.slice(1), {
            cwd: process.cwd(),
            detached: true,
            stdio: "inherit"
          });
          child.unref();
          process.exit(0);
        }, 500);
        return;
      }
      res.writeHead(404);
      res.end("Not found");
    } catch (e) {
      console.error("[AdminConsole] Error handling request:", e);
      if (!res.headersSent) err(res, "Internal server error", 500);
    }
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`[AdminConsole] Admin console available at http://127.0.0.1:${port}`);
  });
}
function parseAdminUsers(envContent) {
  const match = envContent.match(/^ADMIN_USERS=(.*)$/m);
  if (!match) return /* @__PURE__ */ new Set();
  const raw = match[1].replace(/^["']|["']$/g, "");
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}
function isAdminCheck(username) {
  const raw = (process.env.ADMIN_USERS || "").replace(/^["']|["']$/g, "");
  const admins = new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
  return admins.has(username);
}
function parseEnvFile(content) {
  const map = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

// server/src/main.ts
loadEnv(path8.resolve(import.meta.dirname, "../../.env"));
var dbPath = process.env.DATABASE_PATH || path8.resolve(import.meta.dirname, "../../plainscape.db");
var db = new GameDatabase(dbPath);
console.log(`[PlainScape] Database initialized at ${dbPath}`);
var world = new World(db);
world.start();
scheduleWeeklyReset(db, world);
startServer(world);
startAdminConsole(world);
if (process.env.IS_MAIN_SERVER !== "true") {
  startHeartbeat(world);
}
console.log("[PlainScape] Server initialized");
function shutdown() {
  console.log("[PlainScape] Shutting down \u2014 flushing state...");
  for (const [, player] of world.players) {
    if (player.sourceFlushDirty > 0) {
      db.addTotalSource(player.token, player.sourceFlushDirty);
      player.sourceFlushDirty = 0;
    }
    db.setStatLevels(player.token, player.statLevels);
    db.updateLastSeen(player.token, Date.now());
  }
  for (const [, b] of world.buildingsById) {
    db.saveBuilding(b.id, b.btype, b.cellX, b.cellY, b.ownerName, b.hp, b.whitelist);
  }
  world.stop();
  console.log("[PlainScape] Shutdown complete");
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
function loadEnv(filePath) {
  try {
    const content = readFileSync2(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
  }
}
