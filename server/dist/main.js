// server/src/main.ts
import path5 from "path";
import { readFileSync } from "fs";

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
var ARROW_TTL = 1800;
var LION_HP = 6;
var LION_SPEED = 100;
var LION_DAMAGE = 1;
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
var STAG_HP = 120;
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
var STAG_SPAWN_X = 1200;
var STAG_SPAWN_Y = 1200;
var TURRET_PROJECTILE_SPEED = 200;
var TURRET_FIRE_RATE = 2500;
var TURRET_RANGE = 300;
var TURRET_DAMAGE = 3;
var TURRET_AOE_RADIUS = 40;
var PROJECTILE_SIZE = 6;
var PROJECTILE_TTL = 3e3;
var NO_BUILD_BUFFER = 130;
var WALL_HP = 18;
var GATE_HP = 15;
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
var SOURCE_LION_KILL_AMOUNT = 7;
var SOURCE_GHOST_KILL_AMOUNT = 8;
var SOURCE_STAG_KILL_AMOUNT = 400;
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
var SPAWN_PER_PLAYER_BASE = 1.5;
var SPAWN_DISTANCE_SCALE = 5e-4;
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
  meleeCooldown: -15,
  // -15ms per level (base 500ms) — negative = faster
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
  knockback: 5
  // +5 units per level (base 20)
};
var STAT_NAMES = [
  "moveSpeed",
  "meleeCooldown",
  "meleeRange",
  "projectileSpeed",
  "projectileTtl",
  "lungeAoe",
  "lungeDist",
  "shieldDuration",
  "knockback"
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
    meleeCooldown: 0,
    meleeRange: 0,
    projectileSpeed: 0,
    projectileTtl: 0,
    lungeAoe: 0,
    lungeDist: 0,
    shieldDuration: 0,
    knockback: 0
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
var CYCLE_MS = 90 * 60 * 1e3;
var DAWN_END = 15 * 60 * 1e3;
var DAY_END = 45 * 60 * 1e3;
var DUSK_END = 60 * 60 * 1e3;
var phaseOverride = null;
function setPhaseOverride(phase) {
  phaseOverride = phase;
}
function cyclePosition() {
  return Date.now() % CYCLE_MS;
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
    if (player.anim !== "parry" && player.anim !== "shield" && player.anim !== "dash") {
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

// server/src/systems/CombatSystem.ts
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
        const steps = 8;
        const stepDist = DASH_DISTANCE / steps;
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
        world2.chunks.updateEntityChunk(player, player.x - nx * DASH_DISTANCE, player.y - ny * DASH_DISTANCE);
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
      const punchCd = Math.max(50, PUNCH_COOLDOWN + player.statLevels.meleeCooldown * STAT_INCREMENTS.meleeCooldown);
      player.punchCooldownUntil = now + punchCd;
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
    if (player.bedX !== null && player.bedY !== null && player.hp < player.maxHp) {
      const distToBed = Math.hypot(player.x - player.bedX, player.y - player.bedY);
      if (distToBed <= BED_HEAL_RADIUS && now - player.lastBedHealTime >= BED_HEAL_INTERVAL) {
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
      let killReward = SOURCE_GHOST_KILL_AMOUNT;
      if (enemy.kind === "lion") {
        killReward = SOURCE_LION_KILL_AMOUNT;
      } else if (enemy.kind === "stag") {
        killReward = SOURCE_STAG_KILL_AMOUNT;
      }
      awardSource(attacker, killReward, world2);
      world2.sendEvent(attacker, "kill", `You killed a ${enemy.kind}! +${killReward} Source`);
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
      world2.sendEvent(other, "kill", `Parried ${attacker.username}'s attack! Reflected ${reflectDmg} damage!`);
      world2.sendEvent(attacker, "death", `${other.username} parried your attack!`);
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
    if (enemy.hp <= 0) {
      enemy.markedForRemoval = true;
      world2.suppressSpawnsAt(enemy.x, enemy.y);
      world2.broadcastAll({
        type: "event",
        kind: "destroy",
        message: `__fx_explode_${Math.round(enemy.x)}_${Math.round(enemy.y)}_${enemy.kind}__`
      });
      let lungeKillReward = SOURCE_GHOST_KILL_AMOUNT;
      if (enemy.kind === "lion") {
        lungeKillReward = SOURCE_LION_KILL_AMOUNT;
      } else if (enemy.kind === "stag") {
        lungeKillReward = SOURCE_STAG_KILL_AMOUNT;
      }
      awardSource(player, lungeKillReward, world2);
      world2.sendEvent(player, "kill", `You killed a ${enemy.kind}! +${lungeKillReward} Source`);
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
      world2.sendEvent(other, "kill", `Parried ${player.username}'s lunge! Reflected ${reflectDmg} damage!`);
      world2.sendEvent(player, "death", `${other.username} parried your lunge!`);
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
function killPlayer(world2, victim, killer) {
  victim.dead = true;
  victim.hp = 0;
  victim.anim = "dead";
  victim.shieldActive = false;
  victim.respawnAt = Date.now() + RESPAWN_TIME;
  const lostSource = victim.source;
  if (killer && killer.kind === "player") {
    const killerPlayer = killer;
    const totalGain = SOURCE_PLAYER_KILL_AMOUNT + lostSource;
    awardSource(killerPlayer, totalGain, world2);
    world2.sendEvent(killerPlayer, "kill", `You killed ${victim.username}! +${totalGain} Source`);
    victim.source = 0;
    world2.sendEvent(victim, "death", `Killed by ${killerPlayer.username}! Lost ${lostSource} unbanked Source.`);
    world2.broadcastAll({
      type: "notification",
      text: `${killerPlayer.username} killed ${victim.username}`
    });
  } else {
    const lost = Math.floor(lostSource / 2);
    victim.source -= lost;
    awardSource(victim, SOURCE_DEATH_AMOUNT, world2);
    world2.sendEvent(victim, "death", `You died! Lost ${lost} Source. +${SOURCE_DEATH_AMOUNT} Source`);
    const killerKind = killer ? killer.kind : "the wilds";
    world2.broadcastAll({
      type: "notification",
      text: `${victim.username} was killed by ${killerKind}`
    });
  }
}
function tickRespawns(world2) {
  const now = Date.now();
  for (const [, player] of world2.players) {
    if (!player.dead || !player.respawnAt) continue;
    if (now < player.respawnAt) continue;
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
    player.anim = "idle";
  }
}

// server/src/systems/ProjectileSystem.ts
function applyEnemyHit(world2, proj, enemy) {
  if (enemy.intangible) {
    enemy.aggroTargetId = proj.ownerId;
    return;
  }
  const damage = proj.damage + enemy.rangedBonusDamage;
  enemy.hp -= damage;
  enemy.aggroTargetId = proj.ownerId;
  if (enemy.hp <= 0) {
    enemy.markedForRemoval = true;
    world2.suppressSpawnsAt(enemy.x, enemy.y);
    world2.broadcastAll({
      type: "event",
      kind: "destroy",
      message: `__fx_explode_${Math.round(enemy.x)}_${Math.round(enemy.y)}_${enemy.kind}__`
    });
    if (proj.ownerType === "player") {
      const owner = world2.players.get(proj.ownerId);
      if (owner) {
        let reward = SOURCE_GHOST_KILL_AMOUNT;
        if (enemy.kind === "lion") {
          reward = SOURCE_LION_KILL_AMOUNT;
        } else if (enemy.kind === "stag") {
          reward = SOURCE_STAG_KILL_AMOUNT;
        }
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
            world2.sendEvent(player, "kill", "Parried a projectile!");
            break;
          }
          player.hp -= proj.damage;
          if (player.hp <= 0) {
            const killer = proj.ownerType === "player" ? world2.players.get(proj.ownerId) : void 0;
            killPlayer(world2, player, killer);
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
        killPlayer(world2, player, void 0);
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

// server/src/entities/Lion.ts
var Lion = class extends Enemy {
  chaseStartTime = 0;
  chaseLionsSpawned = 0;
  lastChaseSpawnTime = 0;
  isReinforcement = false;
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

// server/src/entities/ScorchedStag.ts
var ScorchedStag = class extends Enemy {
  lastFireBreathTime = 0;
  lastChargeTime = 0;
  lastMeleeTime = 0;
  charging = false;
  chargeStartTime = 0;
  chargeTargetX = 0;
  chargeTargetY = 0;
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

// server/src/systems/AISystem.ts
function tickAI(world2, delta, doSeparation = true) {
  for (const [, enemy] of world2.enemies) {
    if (enemy.markedForRemoval) continue;
    if (Date.now() < enemy.stunUntil) continue;
    if (Math.hypot(enemy.x, enemy.y) < SAFE_ZONE_RADIUS) {
      enemy.markedForRemoval = true;
      world2.broadcastAll({
        type: "event",
        kind: "destroy",
        message: `__fx_explode_${Math.round(enemy.x)}_${Math.round(enemy.y)}_${enemy.kind}__`
      });
      continue;
    }
    const target = findNearestPlayer(world2, enemy);
    if (!target) {
      wander(enemy, delta, world2);
      enemy.aiState = "idle";
      if (enemy instanceof Lion) {
        enemy.speed = LION_SPEED;
        enemy.chaseStartTime = 0;
        enemy.chaseLionsSpawned = 0;
      }
      if (enemy instanceof Ghost) {
        tickGhostPhase(enemy);
      }
      continue;
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
function tickStag(world2, stag, target, dist, delta) {
  const now = Date.now();
  if (stag.charging) {
    const elapsed = now - stag.chargeStartTime;
    if (elapsed >= STAG_CHARGE_DURATION) {
      stag.charging = false;
      stag.speed = STAG_SPEED;
      const nearby = world2.chunks.getEntitiesInRadius(stag.x, stag.y, STAG_MELEE_RANGE + 20);
      for (const player of nearby.players) {
        if (player.dead || player.shieldActive) continue;
        const pDist = Math.hypot(player.x - stag.x, player.y - stag.y);
        if (pDist <= STAG_MELEE_RANGE + 20) {
          player.hp -= STAG_CHARGE_DAMAGE;
          if (player.hp <= 0) killPlayer(world2, player);
        }
      }
      stag.lastAttackTime = now;
      return;
    }
    stag.speed = STAG_CHARGE_SPEED;
    moveEnemy(stag, stag.chargeTargetX, stag.chargeTargetY, world2.chunks, delta);
    stag.aiState = "attack";
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
    const d = Math.hypot(dx, dy) || 1;
    const baseAngle = Math.atan2(dy, dx);
    const speed = 180;
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
        if (target.hp <= 0) killPlayer(world2, target);
      }
      stag.lastMeleeTime = now;
      stag.lastAttackTime = now;
    }
  }
}
var LION_RAMP_DURATION = 3e3;
var LION_MAX_SPEED_MULT = 1.18;
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
        lion.x += nx * moveAmount;
        lion.y += ny * moveAmount;
        lion.facing = Math.atan2(dy, dx);
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
            world2.sendEvent(player, "kill", `Parried a lion swipe! Reflected ${reflectDmg} damage!`);
            if (lion.hp <= 0) {
              lion.markedForRemoval = true;
              world2.suppressSpawnsAt(lion.x, lion.y);
              awardSource(player, SOURCE_LION_KILL_AMOUNT, world2);
              world2.sendEvent(player, "kill", `You killed a lion! +${SOURCE_LION_KILL_AMOUNT} Source`);
              world2.broadcastAll({
                type: "event",
                kind: "destroy",
                message: `__fx_explode_${Math.round(lion.x)}_${Math.round(lion.y)}_lion__`
              });
            }
          } else {
            player.hp -= lion.damage;
            if (player.hp <= 0) {
              killPlayer(world2, player);
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
    const maxSpeed = Math.max(PLAYER_SPEED * LION_MAX_SPEED_MULT, targetSpeed * 1.2);
    lion.speed = LION_SPEED + (maxSpeed - LION_SPEED) * rampT;
    const sincePounce = now - lion.pounceLandTime;
    if (lion.pounceLandTime > 0 && sincePounce < 1e3) {
      lion.speed = maxSpeed * 1.15;
    }
    let reinforcementsForTarget = 0;
    if (!lion.isReinforcement) {
      for (const [, e] of world2.enemies) {
        if (e instanceof Lion && e.isReinforcement && e.aggroTargetId === target.id && !e.markedForRemoval) {
          reinforcementsForTarget++;
        }
      }
    }
    const firstSpawnDelay = reinforcementsForTarget === 0 ? 500 : 2e3;
    if (!lion.isReinforcement && elapsed > firstSpawnDelay && reinforcementsForTarget < 2 && now - lion.lastChaseSpawnTime > 2e3 && world2.enemies.size < MAX_ENEMIES) {
      const awayAngle = Math.atan2(lion.y - target.y, lion.x - target.x) + (Math.random() - 0.5) * 0.8;
      const spawnDist = 150 + Math.random() * 100;
      const sx = lion.x + Math.cos(awayAngle) * spawnDist;
      const sy = lion.y + Math.sin(awayAngle) * spawnDist;
      if (Math.hypot(sx, sy) > SAFE_ZONE_RADIUS && !isInsideBuilding(sx, sy, world2)) {
        const reinforcement = new Lion(sx, sy);
        reinforcement.isReinforcement = true;
        reinforcement.aggroTargetId = target.id;
        world2.addEnemy(reinforcement);
        lion.chaseLionsSpawned++;
        lion.lastChaseSpawnTime = now;
      }
    }
    const prevX = lion.x;
    const prevY = lion.y;
    moveEnemy(lion, target.x, target.y, world2.chunks, delta);
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
            awardSource(nearPlayer, SOURCE_LION_KILL_AMOUNT, world2);
            world2.sendEvent(nearPlayer, "kill", `You killed a lion! +${SOURCE_LION_KILL_AMOUNT} Source`);
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
            killPlayer(world2, nearPlayer);
          }
        }
      }
    }
  }
}
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
var BUILDING_ATTACK_COOLDOWN = 800;
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
      building.hp -= enemy.damage;
      enemy.lastBuildingAttack = now;
      if (building.hp <= 0) {
        world2.removeBuilding(building);
      }
      return;
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
    if (building.btype === "bed") continue;
    if (building.hp >= building.maxHp) continue;
    if (now - building.lastRegenTime < BUILDING_REGEN_INTERVAL) continue;
    building.hp = Math.min(building.maxHp, building.hp + BUILDING_REGEN_RATE);
    building.lastRegenTime = now;
  }
}

// server/src/systems/SpawnSystem.ts
var lastBossTeleport = 0;
function tickSpawning(world2) {
  despawnDistantEnemies(world2);
  const now = Date.now();
  if (!world2.bossSpawned && world2.players.size > 0) {
    const savedHp = world2.db.getWorldStateValue("boss_hp");
    if (savedHp === "0") {
      world2.bossSpawned = true;
    } else {
      const target = getRandomOutdoorPlayer(world2);
      let stag;
      if (target) {
        const pos = getBossSpawnNearPlayer(target);
        stag = new ScorchedStag(pos.x, pos.y);
      } else {
        stag = new ScorchedStag(STAG_SPAWN_X, STAG_SPAWN_Y);
      }
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
      if (Math.hypot(x, y) < SAFE_ZONE_RADIUS) continue;
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
  if (isMoving && Math.random() < 0.3) {
    const dist2 = 300 + Math.random() * 200;
    const spread2 = (Math.random() - 0.5) * Math.PI * 0.3;
    const angle2 = moveAngle + spread2;
    return {
      x: player.x + Math.cos(angle2) * dist2,
      y: player.y + Math.sin(angle2) * dist2
    };
  }
  const dist = 400 + Math.random() * 300;
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
  if (Math.hypot(x, y) < SAFE_ZONE_RADIUS + 100) {
    const outAngle = Math.atan2(y, x);
    return {
      x: Math.cos(outAngle) * (SAFE_ZONE_RADIUS + 200),
      y: Math.sin(outAngle) * (SAFE_ZONE_RADIUS + 200)
    };
  }
  return { x, y };
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

// server/src/world/World.ts
var World = class {
  db;
  chunks = new ChunkManager();
  players = /* @__PURE__ */ new Map();
  playersByUsername = /* @__PURE__ */ new Map();
  enemies = /* @__PURE__ */ new Map();
  projectiles = /* @__PURE__ */ new Map();
  buildingsById = /* @__PURE__ */ new Map();
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
  /** Whether a rule is currently being implemented by AI */
  isImplementingRule = false;
  lastTick = Date.now();
  lastSpawnCheck = 0;
  lastBuildingSave = 0;
  lastLionsAllowed = shouldSpawnLions();
  lastGhostsAllowed = shouldSpawnGhosts();
  tickInterval = null;
  constructor(db2) {
    this.db = db2;
    const dbRules = db2.getRules();
    this.rules = dbRules.map((r) => ({
      id: r.id,
      text: r.text,
      createdBy: r.created_by,
      createdAt: r.created_at
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
    const delta = (now - this.lastTick) / 1e3;
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
      const json = `{"type":"snapshot","serverTime":${serverTime},"seq":${player.inputSeq},"dayPhase":"${dayPhase}","entities":[${entityJsonParts.join(",")}],"selfHp":${player.hp},"selfMaxHp":${player.maxHp},"selfSource":${player.source},"selfPos":{"x":${player.x},"y":${player.y}},"selfDead":${player.dead},"selfRespawnAt":${player.respawnAt},"selfFacing":${player.facing},"selfAnim":"${selfAnim}","selfShieldActive":${player.shieldActive},"selfShieldCooldownUntil":${player.shieldCooldownUntil},"selfParryActive":${player.parryActive},"selfParryCooldownUntil":${player.parryCooldownUntil},"selfStatLevels":${JSON.stringify(player.statLevels)},"selfBankedSource":${player.bankedSource},"selfBuildingCount":${player.buildingCount}}`;
      player.sendRaw(json);
    }
  }
};

// server/src/server.ts
import http from "http";
import fs2 from "fs";
import path3 from "path";
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
var ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
async function generateRule(winnerName, rawInput, existingRules) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set \u2014 check .env file in project root");
  }
  console.log(`[ClaudeService] Making API call with key starting: ${apiKey.slice(0, 10)}...`);
  const rulesContext = existingRules.length > 0 ? existingRules.map((r, i) => `${i + 1}. ${r.text}`).join("\n") : "None yet.";
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

Respond with ONLY the rule text \u2014 one or two sentences max, no explanation or commentary.`,
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
import path from "path";
var PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
var ANTHROPIC_API_URL2 = "https://api.anthropic.com/v1/messages";
var MAX_TURNS = 50;
var MAX_FILE_SIZE = 5e4;
var MAX_RETRIES = 5;
var RETRY_BASE_DELAY = 15e3;
var TURN_DELAY = 2e3;
var TOOLS = [
  {
    name: "read_file",
    description: "Read the contents of a file. Path is relative to the project root.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path from project root" }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Write content to a file (creates or overwrites). Path is relative to the project root.",
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
    name: "run_command",
    description: "Run a shell command in the project root. Use for building (npm run build) or listing files. Do NOT use for installing packages.",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command to run" }
      },
      required: ["command"]
    }
  }
];
var fileBackups = /* @__PURE__ */ new Map();
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
function executeTool(name, input) {
  try {
    switch (name) {
      case "read_file": {
        const normalizedPath = normalizePath(input.path);
        const filePath = path.resolve(PROJECT_ROOT, normalizedPath);
        if (!filePath.startsWith(PROJECT_ROOT)) {
          return "Error: path escapes project root";
        }
        if (!fs.existsSync(filePath)) {
          return `Error: file not found: ${normalizedPath}`;
        }
        const content = fs.readFileSync(filePath, "utf-8");
        if (content.length > MAX_FILE_SIZE) {
          return content.slice(0, MAX_FILE_SIZE) + "\n... (truncated)";
        }
        return content;
      }
      case "write_file": {
        const normalizedPath = normalizePath(input.path);
        const filePath = path.resolve(PROJECT_ROOT, normalizedPath);
        if (!filePath.startsWith(PROJECT_ROOT)) {
          return "Error: path escapes project root";
        }
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        backupFile(filePath);
        fs.writeFileSync(filePath, input.content);
        return `Successfully wrote ${normalizedPath}`;
      }
      case "run_command": {
        const cmd = input.command;
        if (cmd.includes("rm -rf") || cmd.includes("npm install") || cmd.includes("npm add")) {
          return "Error: command not allowed";
        }
        const output = execSync(cmd, {
          cwd: PROJECT_ROOT,
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
  const KEEP_RECENT = 6;
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
async function callClaude(systemPrompt, messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 16384,
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
    execSync("git status", { cwd: PROJECT_ROOT, stdio: "pipe" });
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
    fs.writeFileSync(path.join(PROJECT_ROOT, ".gitignore"), gitignore);
    execSync("git init", { cwd: PROJECT_ROOT, stdio: "pipe" });
    execSync('git config user.name "PlainScape Bot"', { cwd: PROJECT_ROOT, stdio: "pipe" });
    execSync('git config user.email "bot@plainscape.game"', { cwd: PROJECT_ROOT, stdio: "pipe" });
    execSync("git add -A", { cwd: PROJECT_ROOT, stdio: "pipe" });
    execSync('git commit -m "initial"', { cwd: PROJECT_ROOT, stdio: "pipe" });
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
      (f) => path.relative(PROJECT_ROOT, f)
    );
    for (const [filePath, original] of fileBackups) {
      if (original === null) {
        modifiedFiles.push(path.relative(PROJECT_ROOT, filePath));
      }
    }
    if (modifiedFiles.length === 0) {
      return { success: false, error: "No files to commit" };
    }
    for (const file of modifiedFiles) {
      execSync(`git add "${file}"`, { cwd: PROJECT_ROOT, stdio: "pipe" });
    }
    const commitMsg = `rule: ${ruleText.slice(0, 200)}`;
    const commitMsgFile = path.join(PROJECT_ROOT, ".commit-msg-tmp");
    fs.writeFileSync(commitMsgFile, commitMsg);
    execSync(`git commit -F "${commitMsgFile}"`, { cwd: PROJECT_ROOT, stdio: "pipe" });
    fs.unlinkSync(commitMsgFile);
    const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
    try {
      execSync(`git remote set-url origin ${remoteUrl}`, { cwd: PROJECT_ROOT, stdio: "pipe" });
    } catch {
      execSync(`git remote add origin ${remoteUrl}`, { cwd: PROJECT_ROOT, stdio: "pipe" });
    }
    const targetBranch = process.env.GIT_PUSH_BRANCH || "live";
    execSync(`git push origin HEAD:${targetBranch} --force`, { cwd: PROJECT_ROOT, stdio: "pipe" });
    console.log(`[RuleImplementer] Pushed to ${targetBranch} branch`);
    return { success: true };
  } catch (err) {
    console.error("[RuleImplementer] Git push failed:", err instanceof Error ? err.message : err);
    return { success: false, error: "Failed to push changes" };
  }
}
async function implementRule(ruleText) {
  console.log(`[RuleImplementer] Implementing rule via API: "${ruleText}"`);
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
  const systemPrompt = `You are modifying the PlainScape game codebase \u2014 a TypeScript monorepo with:
- packages/shared/src/ \u2014 constants, types, protocol (shared between server & client)
- server/src/ \u2014 Node.js game server (systems/, entities/, world/, services/)
- client/src/ \u2014 Browser client (Canvas 2D, no framework)

A new game rule has been added by a player: "${ruleText}"

Implement this rule with MINIMAL changes and MINIMAL file reads. You are rate-limited so efficiency is critical:
- Read at most 2-3 files before making changes
- Make ALL your writes in as few turns as possible
- Use parallel tool calls (multiple tool_use blocks in one response) whenever possible
- Do NOT re-read files you've already seen

IMPORTANT: All file paths are RELATIVE to the project root. Use paths like "packages/shared/src/constants.ts", NOT "/app/packages/..." or "app/packages/...".

The build command is: ${getBuildCommand()}
Do NOT use "npm run build" \u2014 use the esbuild command above instead.

Key files to consider:
- packages/shared/src/constants.ts \u2014 all game parameters
- packages/shared/src/protocol.ts \u2014 client\u2194server messages
- packages/shared/src/types.ts \u2014 shared types
- server/src/world/World.ts \u2014 game loop
- server/src/systems/CombatSystem.ts \u2014 combat logic
- server/src/systems/AISystem.ts \u2014 enemy AI
- server/src/systems/SpawnSystem.ts \u2014 enemy spawning
- server/src/systems/BuildingSystem.ts \u2014 building logic
- server/src/systems/CurrencySystem.ts \u2014 source earning
- client/src/main.ts \u2014 client entry point
- client/src/rendering/Renderer.ts \u2014 rendering pipeline
- client/index.html \u2014 HTML/CSS for UI

CONSTRAINTS \u2014 you MUST NOT:
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

When done, say "DONE" in your final message.`;
  const messages = [
    { role: "user", content: `Please implement this rule: "${ruleText}". Read the relevant files first, make changes, then build to verify.` }
  ];
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      if (turn > 0) await sleep(TURN_DELAY);
      console.log(`[RuleImplementer] Turn ${turn + 1}/${MAX_TURNS}`);
      const result = await callClaude(systemPrompt, messages);
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
      messages.push({ role: "user", content: toolResults });
    }
    if (fileBackups.size === 0) {
      return { success: false, error: "No code changes were made" };
    }
    console.log("[RuleImplementer] Final build verification...");
    const buildResult = executeTool("run_command", { command: getBuildCommand() });
    if (buildResult.startsWith("Error:")) {
      console.error("[RuleImplementer] Final build failed:", buildResult.slice(0, 500));
      rollback();
      return { success: false, error: "Build failed after implementation" };
    }
    console.log(`[RuleImplementer] Build passed (${fileBackups.size} files modified), pushing to git...`);
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
    this.addRuleAndBroadcast(author, ruleText);
    this.world.db.setWorldStateValue("champion_rule", ruleText);
    this.broadcastChampionInfo();
    this.world.broadcastAll({ type: "notification", text: `AI is implementing rule: "${ruleText}"...` });
    this.world.isImplementingRule = true;
    this.world.broadcastAll({ type: "rule_status", implementing: true });
    try {
      const result = await implementRule(ruleText);
      this.world.isImplementingRule = false;
      this.world.broadcastAll({ type: "rule_status", implementing: false });
      if (result.success) {
        console.log(`[DailyWinner] Rule implemented successfully, scheduling restart`);
        this.world.broadcastAll({
          type: "notification",
          text: `Rule "${ruleText}" has been implemented! Server restarting shortly...`
        });
        scheduleRestart();
      } else {
        console.error(`[DailyWinner] Rule implementation failed: ${result.error}`);
        this.world.broadcastAll({
          type: "notification",
          text: `Rule "${ruleText}" was added but could not be auto-implemented.`
        });
      }
    } catch (err) {
      console.error("[DailyWinner] Rule implementation error:", err);
      this.world.isImplementingRule = false;
      this.world.broadcastAll({ type: "rule_status", implementing: false });
    }
  }
  addRuleAndBroadcast(author, ruleText) {
    const dbRule = this.world.db.addRule(ruleText, author);
    const rule = {
      id: dbRule.id,
      text: dbRule.text,
      createdBy: dbRule.created_by,
      createdAt: dbRule.created_at
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
  upsert(data) {
    const key = `${data.host}:${data.port}`;
    this.servers.set(key, {
      ...data,
      lastHeartbeat: Date.now()
    });
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
      hasPassword: s.hasPassword
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
import path2 from "path";
var PROJECT_ROOT2 = path2.resolve(import.meta.dirname, "../..");
function ensureCommunityBranches(serverName) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    console.warn("[CommunityBranches] No GITHUB_TOKEN/GITHUB_REPO \u2014 cannot create branches");
    return false;
  }
  const safeName = serverName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 40);
  const liveBranch = `community/${safeName}/live`;
  const stableBranch = `community/${safeName}/stable`;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.error("[CommunityBranches] Invalid GITHUB_REPO format");
    return false;
  }
  const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
  try {
    const existingRefs = execSync2(`git ls-remote --heads ${remoteUrl} ${liveBranch} ${stableBranch}`, {
      cwd: PROJECT_ROOT2,
      stdio: "pipe",
      timeout: 1e4
    }).toString();
    if (existingRefs.includes(liveBranch)) {
      console.log(`[CommunityBranches] Branches already exist for "${safeName}"`);
      return true;
    }
    execSync2(`git fetch ${remoteUrl} stable`, { cwd: PROJECT_ROOT2, stdio: "pipe", timeout: 15e3 });
    execSync2(`git push ${remoteUrl} FETCH_HEAD:refs/heads/${liveBranch}`, {
      cwd: PROJECT_ROOT2,
      stdio: "pipe",
      timeout: 15e3
    });
    execSync2(`git push ${remoteUrl} FETCH_HEAD:refs/heads/${stableBranch}`, {
      cwd: PROJECT_ROOT2,
      stdio: "pipe",
      timeout: 15e3
    });
    console.log(`[CommunityBranches] Created branches for "${safeName}": ${liveBranch}, ${stableBranch}`);
    return true;
  } catch (err) {
    console.error(`[CommunityBranches] Failed to create branches for "${safeName}":`, err);
    return false;
  }
}
function getCommunityBranchName(serverName) {
  const safeName = serverName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 40);
  return `community/${safeName}/live`;
}

// server/src/server.ts
var PORT = parseInt(process.env.PORT || "8080", 10);
var IS_MAIN_SERVER = process.env.IS_MAIN_SERVER === "true" && !!process.env.REGISTRY_SECRET;
var adminUsers = new Set(
  (process.env.ADMIN_USERS || "").split(",").map((s) => s.trim()).filter(Boolean)
);
if (IS_MAIN_SERVER) adminUsers.add("JamesWest");
function isAdmin(username) {
  return adminUsers.has(username);
}
function loadPatchNotes() {
  try {
    const filePath = path3.resolve(import.meta.dirname, "../../patch-notes.json");
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
  world2.broadcastAll({ type: "online_list", usernames });
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
  const dailyWinner = new DailyWinnerScheduler(world2);
  setInterval(() => broadcastLeaderboard(world2), 1e4);
  const clientDir = path3.resolve(import.meta.dirname, "../../client");
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
      if (req.method === "GET" && urlPath === "/api/servers") {
        const list = registry.toPublicList();
        list.unshift({
          name: "PlainScape (Official)",
          host: req.headers.host?.split(":")[0] || "plainscape.world",
          port: PORT,
          playerCount: world2.players.size,
          maxPlayers: DEFAULT_MAX_PLAYERS,
          description: "The official PlainScape server",
          hasPassword: false
        });
        res.writeHead(200, { "Content-Type": "application/json" });
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
            registry.upsert({
              name: serverName,
              host: String(data.host),
              port: Number(data.port),
              playerCount: Number(data.playerCount) || 0,
              maxPlayers: Number(data.maxPlayers) || DEFAULT_MAX_PLAYERS,
              description: String(data.description || "").slice(0, 200),
              hasPassword: Boolean(data.hasPassword)
            });
            if (hasPatreonAccess) {
              ensureCommunityBranches(serverName);
            }
            const branchName = getCommunityBranchName(serverName);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, branch: branchName }));
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
          }
        });
        return;
      }
    }
    const staticPath = urlPath === "/" ? "/index.html" : urlPath;
    let filePath;
    if (staticPath.endsWith(".js") || staticPath.endsWith(".js.map")) {
      filePath = path3.join(clientDir, "dist", path3.basename(staticPath));
    } else {
      filePath = path3.join(clientDir, staticPath);
    }
    const resolved = path3.resolve(filePath);
    if (!resolved.startsWith(path3.resolve(clientDir))) {
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
      const ext = path3.extname(resolved);
      let content = data;
      if (IS_MAIN_SERVER && ext === ".html") {
        const html = data.toString();
        content = Buffer.from(html.replace(
          "</head>",
          "<script>window.__PLAINSCAPE_MAIN_SERVER__=true;</script></head>"
        ));
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
          player.buildingCount = buildingCount;
          if (bedId !== null) {
            player.bedBuildingId = bedId;
            player.bedX = bedFoundX;
            player.bedY = bedFoundY;
          }
          world2.addPlayer(player);
          const welcome = {
            type: "welcome",
            yourId: player.id,
            serverTime: Date.now(),
            dayPhase: getDayPhase()
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
          console.log(`[Server] ${player.username} placing ${msg.btype} at ${msg.cellX},${msg.cellY} (source:${player.source} buildings:${player.buildingCount})`);
          handlePlaceBuilding(world2, player, msg.btype, msg.cellX, msg.cellY);
          break;
        }
        case "destroy": {
          if (!player || player.dead) return;
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
          if (withdrawAmt <= 0 || withdrawAmt > player.bankedSource) return;
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
        created_at INTEGER NOT NULL
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
    try {
      this.db.exec(`ALTER TABLE players ADD COLUMN stat_levels TEXT NOT NULL DEFAULT '{}'`);
    } catch {
    }
    try {
      this.db.exec(`ALTER TABLE players ADD COLUMN banked_source INTEGER NOT NULL DEFAULT 0`);
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
      resetAllSource: this.db.prepare("UPDATE players SET total_source_generated = 0"),
      clearRules: this.db.prepare("DELETE FROM rules"),
      getLeaderboard: this.db.prepare(
        "SELECT username, total_source_generated FROM players WHERE total_source_generated > 0 ORDER BY total_source_generated DESC LIMIT ?"
      ),
      deleteByToken: this.db.prepare("DELETE FROM players WHERE token = ?"),
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
      getWorldState: this.db.prepare("SELECT value FROM world_state WHERE key = ?"),
      setWorldState: this.db.prepare("INSERT OR REPLACE INTO world_state (key, value) VALUES (?, ?)"),
      deleteWorldState: this.db.prepare("DELETE FROM world_state WHERE key = ?"),
      addNotice: this.db.prepare("INSERT INTO admin_notices (text, created_at) VALUES (?, ?)"),
      getNotices: this.db.prepare("SELECT * FROM admin_notices ORDER BY created_at DESC"),
      deleteNotice: this.db.prepare("DELETE FROM admin_notices WHERE id = ?")
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
    return { id: info.lastInsertRowid, text, created_by: createdBy, created_at: now };
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
  close() {
    this.db.close();
  }
};

// server/src/db/WeeklyResetScheduler.ts
import { execSync as execSync3 } from "child_process";
import path4 from "path";
var PHOENIX_UTC_OFFSET2 = parseInt(process.env.TIMEZONE_UTC_OFFSET || "-7", 10);
var CHECK_INTERVAL = 6e4;
var PROJECT_ROOT3 = path4.resolve(import.meta.dirname, "../..");
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
  try {
    const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
    execSync3(`git fetch ${remoteUrl} main`, { cwd: PROJECT_ROOT3, stdio: "pipe" });
    execSync3(`git push ${remoteUrl} FETCH_HEAD:live --force`, { cwd: PROJECT_ROOT3, stdio: "pipe" });
    console.log("[WeeklyReset] Reset live branch to main \u2014 Railway will redeploy");
  } catch (err) {
    console.error("[WeeklyReset] Failed to reset live branch:", err);
  }
}
function getPhoenixDayOfWeek(now) {
  const phoenixTime = new Date(now.getTime() + PHOENIX_UTC_OFFSET2 * 60 * 60 * 1e3);
  return phoenixTime.getUTCDay();
}

// server/src/registry/HeartbeatSender.ts
function startHeartbeat(world2) {
  const patreonKey = process.env.PATREON_KEY;
  const demoKey = process.env.DEMO_KEY;
  if (!patreonKey && !demoKey) {
    console.log("[Heartbeat] No PATREON_KEY or DEMO_KEY set \u2014 server will not be listed in the browser");
    return;
  }
  const registryUrl = process.env.REGISTRY_URL || DEFAULT_REGISTRY_URL;
  const serverName = process.env.SERVER_NAME || "PlainScape Server";
  const serverDesc = process.env.SERVER_DESCRIPTION || "";
  const serverHost = process.env.SERVER_HOST || "";
  const port = parseInt(process.env.PORT || "8080", 10);
  const maxPlayers = parseInt(process.env.MAX_PLAYERS || String(DEFAULT_MAX_PLAYERS), 10);
  const hasPassword = !!process.env.SERVER_PASSWORD;
  async function sendHeartbeat() {
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
      }
    } catch (err) {
      console.warn("[Heartbeat] Failed to reach registry:", err.message);
    }
  }
  sendHeartbeat();
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  console.log(`[Heartbeat] Sending heartbeats to ${registryUrl} as "${serverName}"`);
}

// server/src/main.ts
loadEnv(path5.resolve(import.meta.dirname, "../../.env"));
var dbPath = process.env.DATABASE_PATH || path5.resolve(import.meta.dirname, "../../plainscape.db");
var db = new GameDatabase(dbPath);
console.log(`[PlainScape] Database initialized at ${dbPath}`);
var world = new World(db);
world.start();
scheduleWeeklyReset(db, world);
startServer(world);
if (process.env.IS_MAIN_SERVER !== "true") {
  startHeartbeat(world);
}
console.log("[PlainScape] Server initialized");
function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
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
