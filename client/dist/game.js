// client/src/Connection.ts
var Connection = class {
  ws = null;
  handler;
  url;
  constructor(handler, serverUrl) {
    this.handler = handler;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    if (serverUrl) {
      this.url = `${protocol}//${serverUrl}`;
    } else {
      this.url = `${protocol}//${window.location.host}`;
    }
  }
  connect() {
    return new Promise((resolve, reject) => {
      console.log("[Connection] Connecting to", this.url);
      this.ws = new WebSocket(this.url);
      const timeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          reject(new Error("Connection timed out"));
        }
      }, 5e3);
      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log("[Connection] Connected");
        resolve();
      };
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handler(msg);
        } catch {
        }
      };
      this.ws.onerror = (e) => {
        clearTimeout(timeout);
        console.error("[Connection] Error:", e);
        reject(new Error("Connection failed"));
      };
      this.ws.onclose = (e) => {
        clearTimeout(timeout);
        console.log("[Connection] Disconnected, code:", e.code, "reason:", e.reason);
      };
    });
  }
  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
};

// packages/shared/src/constants.ts
var TICK_RATE = 15;
var TICK_MS = 1e3 / TICK_RATE;
var CELL_SIZE = 32;
var SAFE_ZONE_RADIUS = 1300;
var VIEW_RADIUS = 1600;
var PLAYER_SIZE = 20;
var INACTIVITY_TIMEOUT = 5 * 60 * 1e3;
var PUNCH_RANGE = 52;
var PUNCH_COOLDOWN = 900;
var PUNCH_ARC = Math.PI / 2;
var LUNGE_AOE_RADIUS = 48;
var LUNGE_COOLDOWN = 2e3;
var SHIELD_COOLDOWN = 12e3;
var PARRY_COOLDOWN = 3e3;
var ARROW_COOLDOWN = 1e3;
var LION_SWIPE_ARC = Math.PI / 2;
var DASH_COOLDOWN = 1800;
var PROJECTILE_SIZE = 6;
var NO_BUILD_BUFFER = 130;
var WALL_COST = 10;
var GATE_COST = 15;
var TURRET_COST = 80;
var BED_COST = 20;
var MAX_BUILDINGS_PER_PLAYER = 100;
var MAX_BUILD_RANGE = 5 * CELL_SIZE;
var BED_HEAL_RADIUS = 80;
var BANK_NPC_RANGE = 80;
var VOTE_COST = 50;
var SCRIBE_NPC_RANGE = 80;
var BANKER_POS = { x: 120, y: -60 };
var SCRIBE_POS = { x: -120, y: -60 };
var STAT_LEVEL_COST = 100;
var STAT_MAX_LEVEL = 25;
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
var STAT_DISPLAY_NAMES = {
  moveSpeed: "Move Speed",
  knockback: "Melee Knockback",
  meleeRange: "Melee Range",
  projectileSpeed: "Projectile Speed",
  projectileTtl: "Projectile Range",
  lungeAoe: "Lunge AOE",
  lungeDist: "Lunge Distance",
  shieldDuration: "Shield Duration",
  dashDist: "Dash Distance"
};
var SIGN_RANGE = 80;
var PATCH_NOTES_SIGN_POS = { x: 180, y: 126 };
var RULES_SIGN_POS = { x: -180, y: 126 };
var NOTICES_SIGN_POS = { x: 0, y: 236 };

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

// client/src/TouchController.ts
var LEFT_STICK_RADIUS = 42;
var RIGHT_STICK_RADIUS = 42;
var RIGHT_STICK_TRIGGER_RADIUS = 58;
var STICK_DEADZONE = 10;
var STICK_BG_ALPHA = 0.12;
var STICK_THUMB_ALPHA = 0.35;
var STICK_THUMB_SIZE = 18;
var AUTO_ATTACK_INTERVAL = 450;
var TouchController = class {
  canvas;
  conn;
  // Touch tracking by identifier
  leftStick = null;
  rightStick = null;
  leftTouchId = null;
  rightTouchId = null;
  // Attack state
  defaultAttack = "punch";
  autoAttackTimer = null;
  inTriggerZone = false;
  // Computed values (read by InputHandler)
  moveDx = 0;
  moveDy = 0;
  aimFacing = NaN;
  leftFacing = NaN;
  enabled = true;
  // Event listener references for cleanup
  boundTouchStart;
  boundTouchMove;
  boundTouchEnd;
  boundResize;
  // Zones — computed on resize
  leftZone = { cx: 0, cy: 0 };
  rightZone = { cx: 0, cy: 0 };
  constructor(canvas, conn2) {
    this.canvas = canvas;
    this.conn = conn2;
    this.computeZones();
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundResize = () => this.computeZones();
    canvas.addEventListener("touchstart", this.boundTouchStart, { passive: false });
    window.addEventListener("touchmove", this.boundTouchMove, { passive: false });
    window.addEventListener("touchend", this.boundTouchEnd, { passive: true });
    window.addEventListener("touchcancel", this.boundTouchEnd, { passive: true });
    window.addEventListener("resize", this.boundResize);
  }
  computeZones() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const stickY = h * 0.72;
    this.leftZone = { cx: 110, cy: stickY };
    this.rightZone = { cx: w - 110, cy: stickY };
  }
  handleTouchStart(e) {
    if (!this.enabled) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const target = t.target;
      if (target !== this.canvas) continue;
      const halfW = window.innerWidth / 2;
      if (t.clientX < halfW && this.leftTouchId === null) {
        e.preventDefault();
        this.leftTouchId = t.identifier;
        this.leftStick = {
          originX: t.clientX,
          originY: t.clientY,
          currentX: t.clientX,
          currentY: t.clientY
        };
      } else if (t.clientX >= halfW && this.rightTouchId === null) {
        e.preventDefault();
        this.rightTouchId = t.identifier;
        this.rightStick = {
          originX: t.clientX,
          originY: t.clientY,
          currentX: t.clientX,
          currentY: t.clientY
        };
        this.inTriggerZone = false;
      }
    }
  }
  handleTouchMove(e) {
    if (!this.enabled) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.leftTouchId && this.leftStick) {
        e.preventDefault();
        this.leftStick.currentX = t.clientX;
        this.leftStick.currentY = t.clientY;
        this.updateLeftStick();
      }
      if (t.identifier === this.rightTouchId && this.rightStick) {
        e.preventDefault();
        this.rightStick.currentX = t.clientX;
        this.rightStick.currentY = t.clientY;
        this.updateRightStick();
      }
    }
  }
  handleTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.leftTouchId) {
        this.leftTouchId = null;
        this.leftStick = null;
        this.moveDx = 0;
        this.moveDy = 0;
        this.leftFacing = NaN;
      }
      if (t.identifier === this.rightTouchId) {
        this.rightTouchId = null;
        this.rightStick = null;
        this.aimFacing = NaN;
        this.stopAutoAttack();
      }
    }
  }
  updateLeftStick() {
    if (!this.leftStick) return;
    const dx = this.leftStick.currentX - this.leftStick.originX;
    const dy = this.leftStick.currentY - this.leftStick.originY;
    const dist = Math.hypot(dx, dy);
    if (dist < STICK_DEADZONE) {
      this.moveDx = 0;
      this.moveDy = 0;
      this.leftFacing = NaN;
      return;
    }
    this.moveDx = Math.abs(dx) > STICK_DEADZONE ? dx > 0 ? 1 : -1 : 0;
    this.moveDy = Math.abs(dy) > STICK_DEADZONE ? dy > 0 ? 1 : -1 : 0;
    this.leftFacing = Math.atan2(dy, dx);
  }
  updateRightStick() {
    if (!this.rightStick) return;
    const dx = this.rightStick.currentX - this.rightStick.originX;
    const dy = this.rightStick.currentY - this.rightStick.originY;
    const dist = Math.hypot(dx, dy);
    if (dist < STICK_DEADZONE) {
      this.aimFacing = NaN;
      this.stopAutoAttack();
      return;
    }
    this.aimFacing = Math.atan2(dy, dx);
    if (dist > RIGHT_STICK_TRIGGER_RADIUS) {
      if (!this.inTriggerZone) {
        this.inTriggerZone = true;
        this.fireDefaultAttack(this.aimFacing);
        this.startAutoAttack();
      }
    } else {
      if (this.inTriggerZone) {
        this.inTriggerZone = false;
        this.stopAutoAttack();
      }
    }
  }
  startAutoAttack() {
    if (this.autoAttackTimer) {
      clearInterval(this.autoAttackTimer);
    }
    this.autoAttackTimer = setInterval(() => {
      if (!this.inTriggerZone || !this.rightStick) {
        this.clearAutoAttackTimer();
        return;
      }
      this.fireDefaultAttack(this.aimFacing);
    }, AUTO_ATTACK_INTERVAL);
  }
  stopAutoAttack() {
    this.inTriggerZone = false;
    this.clearAutoAttackTimer();
  }
  clearAutoAttackTimer() {
    if (this.autoAttackTimer) {
      clearInterval(this.autoAttackTimer);
      this.autoAttackTimer = null;
    }
  }
  fireDefaultAttack(facing) {
    switch (this.defaultAttack) {
      case "punch":
        this.conn.send({ type: "punch", facing });
        break;
      case "lunge":
        this.conn.send({ type: "lunge", facing });
        break;
      case "shoot":
        this.conn.send({ type: "shoot", facing });
        break;
    }
  }
  /** Fire shield directly (called from shield button) */
  fireShield() {
    this.conn.send({ type: "shield" });
  }
  /** Fire parry directly (called from parry button) */
  fireParry() {
    this.conn.send({ type: "parry" });
  }
  lastKnownFacing = 0;
  getFacing() {
    if (!isNaN(this.aimFacing)) {
      this.lastKnownFacing = this.aimFacing;
      return this.aimFacing;
    }
    if (!isNaN(this.leftFacing)) {
      this.lastKnownFacing = this.leftFacing;
      return this.leftFacing;
    }
    return this.lastKnownFacing;
  }
  draw(ctx2, _canvas) {
    if (!this.enabled) return;
    this.computeZones();
    this.drawStick(ctx2, this.leftZone.cx, this.leftZone.cy, this.leftStick, LEFT_STICK_RADIUS, "#7ec87e", false);
    this.drawStick(ctx2, this.rightZone.cx, this.rightZone.cy, this.rightStick, RIGHT_STICK_RADIUS, "#f0c040", true);
  }
  drawStick(ctx2, baseCx, baseCy, stick, radius, color, showTrigger) {
    if (showTrigger) {
      ctx2.beginPath();
      ctx2.arc(baseCx, baseCy, RIGHT_STICK_TRIGGER_RADIUS, 0, Math.PI * 2);
      ctx2.strokeStyle = this.inTriggerZone ? "rgba(255,100,50,0.6)" : "rgba(240,192,64,0.25)";
      ctx2.lineWidth = this.inTriggerZone ? 2 : 1.5;
      ctx2.setLineDash([5, 5]);
      ctx2.stroke();
      ctx2.setLineDash([]);
    }
    const attacking = this.inTriggerZone && showTrigger;
    const pulse = Math.sin(Date.now() * 8e-3) * 0.5 + 0.5;
    ctx2.beginPath();
    ctx2.arc(baseCx, baseCy, radius, 0, Math.PI * 2);
    ctx2.fillStyle = `rgba(0,0,0,${STICK_BG_ALPHA})`;
    ctx2.fill();
    if (attacking) {
      const a = 0.25 + pulse * 0.35;
      ctx2.strokeStyle = `rgba(255,50,20,${a})`;
      ctx2.lineWidth = 2.5;
    } else {
      ctx2.strokeStyle = `rgba(255,255,255,0.15)`;
      ctx2.lineWidth = 1.5;
    }
    ctx2.stroke();
    let thumbX = baseCx;
    let thumbY = baseCy;
    if (stick) {
      const dx = stick.currentX - stick.originX;
      const dy = stick.currentY - stick.originY;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, showTrigger ? RIGHT_STICK_TRIGGER_RADIUS : radius);
      if (dist > 0) {
        thumbX = baseCx + dx / dist * clamped;
        thumbY = baseCy + dy / dist * clamped;
      }
    }
    ctx2.beginPath();
    ctx2.arc(thumbX, thumbY, STICK_THUMB_SIZE, 0, Math.PI * 2);
    ctx2.fillStyle = stick ? `rgba(255,255,255,${STICK_THUMB_ALPHA})` : `rgba(255,255,255,0.15)`;
    ctx2.fill();
    if (attacking) {
      const a = 0.5 + pulse * 0.5;
      ctx2.strokeStyle = `rgba(255,50,20,${a})`;
      ctx2.lineWidth = 3;
    } else {
      ctx2.strokeStyle = color;
      ctx2.lineWidth = 2;
    }
    ctx2.stroke();
  }
  reset() {
    this.leftStick = null;
    this.rightStick = null;
    this.leftTouchId = null;
    this.rightTouchId = null;
    this.moveDx = 0;
    this.moveDy = 0;
    this.aimFacing = NaN;
    this.leftFacing = NaN;
    this.stopAutoAttack();
  }
  destroy() {
    this.stopAutoAttack();
    this.canvas.removeEventListener("touchstart", this.boundTouchStart);
    window.removeEventListener("touchmove", this.boundTouchMove);
    window.removeEventListener("touchend", this.boundTouchEnd);
    window.removeEventListener("touchcancel", this.boundTouchEnd);
    window.removeEventListener("resize", this.boundResize);
  }
};

// client/src/GamepadController.ts
var DEFAULT_BINDINGS = {
  punch: { type: "button", index: 7 },
  // R2 / RT
  shoot: { type: "button", index: 6 },
  // L2 / LT
  lunge: { type: "button", index: 5 },
  // R1 / RB
  shield: { type: "button", index: 4 },
  // L1 / LB
  parry: { type: "button", index: 2 },
  // X / Square
  dash: { type: "button", index: 1 },
  // B / Circle
  interact: { type: "button", index: 0 },
  // A / Cross
  menu: { type: "button", index: 9 },
  // Start / Options
  scores: { type: "button", index: 8 },
  // Select / Share
  autorun: { type: "button", index: 10 },
  // L3 (left stick click)
  target_lock: { type: "button", index: 11 },
  // R3 (right stick click)
  build_wall: { type: "button", index: 12 },
  // D-pad Up
  build_gate: { type: "button", index: 15 },
  // D-pad Right
  build_turret: { type: "button", index: 13 },
  // D-pad Down
  build_bed: { type: "button", index: 14 },
  // D-pad Left
  demolish: { type: "button", index: 3 }
  // Y / Triangle
};
var STICK_DEADZONE2 = 0.2;
var ACTION_LABELS = {
  punch: "Punch",
  lunge: "Lunge",
  shoot: "Shoot Arrow",
  shield: "Shield",
  parry: "Parry",
  dash: "Dash",
  interact: "Interact",
  menu: "Menu",
  scores: "Scores / Online",
  autorun: "Auto-run",
  target_lock: "Target Lock (Invite/Whitelist)",
  build_wall: "Build Wall",
  build_gate: "Build Gate",
  build_turret: "Build Turret",
  build_bed: "Build Bed",
  demolish: "Demolish"
};
var STORAGE_KEY = "plainscape_gamepad_bindings";
var GamepadController = class _GamepadController {
  bindings;
  prevButtons = [];
  gamepadIndex = null;
  // State read by InputHandler
  moveDx = 0;
  moveDy = 0;
  aimFacing = NaN;
  // Raw right stick values (for build cursor movement)
  aimRawX = 0;
  aimRawY = 0;
  lastAimFacing = 0;
  // retain last aim when stick released
  lastMoveFacing = 0;
  // retain last move direction when stick released
  enabled = true;
  connected = false;
  // Action callbacks (set by InputHandler)
  onAction = null;
  // Hold-to-repeat for attack actions
  holdTimers = /* @__PURE__ */ new Map();
  static HOLD_ACTIONS = /* @__PURE__ */ new Set(["punch", "lunge", "shoot"]);
  constructor() {
    this.bindings = this.loadBindings();
    try {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this.gamepadIndex = i;
          this.connected = true;
          console.log(`[Gamepad] Already connected: ${gamepads[i].id}`);
          break;
        }
      }
    } catch {
    }
    window.addEventListener("gamepadconnected", (e) => {
      this.gamepadIndex = e.gamepad.index;
      this.connected = true;
      console.log(`[Gamepad] Connected: ${e.gamepad.id}`);
    });
    window.addEventListener("gamepaddisconnected", (e) => {
      if (e.gamepad.index === this.gamepadIndex) {
        this.connected = false;
        this.moveDx = 0;
        this.moveDy = 0;
        this.aimFacing = NaN;
        this.stopAllHoldTimers();
        console.log("[Gamepad] Disconnected");
      }
    });
  }
  loadBindings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_BINDINGS, ...parsed };
      }
    } catch {
    }
    return { ...DEFAULT_BINDINGS };
  }
  saveBindings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bindings));
  }
  setBinding(action, binding) {
    this.bindings[action] = binding;
    this.saveBindings();
  }
  resetBindings() {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.saveBindings();
  }
  getBindings() {
    return this.bindings;
  }
  getBindingLabel(binding) {
    if (binding.type === "button") return `Button ${binding.index}`;
    return `Axis ${binding.index}`;
  }
  /** Call every frame from the game loop */
  poll() {
    if (!this.enabled) return;
    if (this.gamepadIndex === null) {
      const gamepads2 = navigator.getGamepads();
      for (let i = 0; i < gamepads2.length; i++) {
        if (gamepads2[i]) {
          this.gamepadIndex = i;
          this.connected = true;
          console.log(`[Gamepad] Detected: ${gamepads2[i].id}`);
          break;
        }
      }
      if (this.gamepadIndex === null) return;
    }
    const gamepads = navigator.getGamepads();
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return;
    if (!this.connected) {
      this.connected = true;
      console.log(`[Gamepad] Reconnected: ${gp.id}`);
    }
    const lx = gp.axes[0] ?? 0;
    const ly = gp.axes[1] ?? 0;
    this.moveDx = Math.abs(lx) > STICK_DEADZONE2 ? lx > 0 ? 1 : -1 : 0;
    this.moveDy = Math.abs(ly) > STICK_DEADZONE2 ? ly > 0 ? 1 : -1 : 0;
    if (this.moveDx !== 0 || this.moveDy !== 0) {
      this.lastMoveFacing = Math.atan2(this.moveDy, this.moveDx);
    }
    const rx = gp.axes[2] ?? 0;
    const ry = gp.axes[3] ?? 0;
    const rMag = Math.hypot(rx, ry);
    this.aimRawX = rMag > STICK_DEADZONE2 ? rx : 0;
    this.aimRawY = rMag > STICK_DEADZONE2 ? ry : 0;
    if (rMag > STICK_DEADZONE2) {
      this.aimFacing = Math.atan2(ry, rx);
      this.lastAimFacing = this.aimFacing;
    } else {
      this.aimFacing = NaN;
    }
    const buttons = gp.buttons.map((b) => b.pressed);
    for (const [action, binding] of Object.entries(this.bindings)) {
      if (binding.type !== "button") continue;
      const idx = binding.index;
      const pressed = buttons[idx] ?? false;
      const wasPressed = this.prevButtons[idx] ?? false;
      if (pressed && !wasPressed) {
        this.onAction?.(action, this.getFacing());
        if (_GamepadController.HOLD_ACTIONS.has(action)) {
          this.stopHoldTimer(idx);
          const interval = action === "lunge" ? 1500 : 500;
          this.holdTimers.set(idx, setInterval(() => {
            this.onAction?.(action, this.getFacing());
          }, interval));
        }
      } else if (!pressed && wasPressed) {
        this.stopHoldTimer(idx);
      }
    }
    this.prevButtons = buttons;
  }
  stopHoldTimer(idx) {
    const timer = this.holdTimers.get(idx);
    if (timer) {
      clearInterval(timer);
      this.holdTimers.delete(idx);
    }
  }
  stopAllHoldTimers() {
    for (const [, timer] of this.holdTimers) clearInterval(timer);
    this.holdTimers.clear();
  }
  /** Best facing: right stick > last aimed > left stick > last move > fallback */
  getFacing() {
    if (!isNaN(this.aimFacing)) return this.aimFacing;
    if (this.lastAimFacing !== 0) return this.lastAimFacing;
    if (this.moveDx !== 0 || this.moveDy !== 0) {
      return Math.atan2(this.moveDy, this.moveDx);
    }
    return this.lastMoveFacing;
  }
  /** Wait for the next button press on any connected gamepad. Returns the binding. */
  waitForButton() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const TIMEOUT = 1e4;
      let initialButtons = null;
      const check = () => {
        if (Date.now() - startTime > TIMEOUT) {
          resolve(null);
          return;
        }
        const gamepads = navigator.getGamepads();
        for (let gi = 0; gi < gamepads.length; gi++) {
          const gp = gamepads[gi];
          if (!gp) continue;
          const buttons = gp.buttons.map((b) => b.pressed);
          if (!initialButtons) {
            initialButtons = buttons;
            requestAnimationFrame(check);
            return;
          }
          for (let i = 0; i < buttons.length; i++) {
            if (buttons[i] && !initialButtons[i]) {
              resolve({ type: "button", index: i });
              return;
            }
          }
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }
};

// client/src/ui/GamepadMenuNav.ts
var FOCUSABLE_SELECTOR = 'button:not([disabled]):not([style*="display: none"]):not([style*="display:none"]), input:not([disabled]), select:not([disabled]), .sugg-vote-btn:not([disabled]), [tabindex]:not([tabindex="-1"])';
var NAV_REPEAT_DELAY = 220;
var GamepadMenuNav = class {
  container = null;
  closeFn = null;
  focusIndex = 0;
  items = [];
  // Stick repeat tracking
  lastNavTime = 0;
  lastStickDy = 0;
  get active() {
    return this.container !== null;
  }
  activate(container, onClose) {
    this.deactivate();
    this.container = container;
    this.closeFn = onClose;
    this.rescan();
    this.focusIndex = 0;
    this.highlight();
  }
  deactivate() {
    this.clearHighlight();
    this.container = null;
    this.closeFn = null;
    this.items = [];
    this.focusIndex = 0;
    this.lastNavTime = 0;
    this.lastStickDy = 0;
  }
  /** Re-scan focusable elements (call after dynamic DOM changes) */
  rescan() {
    if (!this.container) return;
    const els = this.container.querySelectorAll(FOCUSABLE_SELECTOR);
    this.items = Array.from(els).filter((el) => {
      if (el.offsetParent !== null) return true;
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    if (this.focusIndex >= this.items.length) {
      this.focusIndex = Math.max(0, this.items.length - 1);
    }
    this.highlight();
  }
  /** Handle a gamepad button action. Returns true if consumed. */
  handleAction(action) {
    if (!this.container) return false;
    switch (action) {
      case "interact": {
        const el = this.items[this.focusIndex];
        if (!el) break;
        if (el.tagName === "INPUT") {
          const inp = el;
          if (inp.type === "checkbox") {
            inp.checked = !inp.checked;
            inp.dispatchEvent(new Event("change", { bubbles: true }));
          } else {
            inp.focus();
          }
        } else {
          el.click();
        }
        setTimeout(() => this.rescan(), 50);
        return true;
      }
      case "dash": {
        if (this.closeFn) this.closeFn();
        return true;
      }
      default:
        break;
    }
    return false;
  }
  /** Handle D-pad navigation. Returns true if consumed. */
  handleDpad(direction) {
    if (!this.container || this.items.length === 0) return false;
    if (direction === "left" || direction === "right") {
      const el = this.items[this.focusIndex];
      if (el && el.tagName === "INPUT" && el.type === "range") {
        const inp = el;
        const step = Number(inp.step) || 5;
        const delta = direction === "right" ? step : -step;
        inp.value = String(Math.max(Number(inp.min), Math.min(Number(inp.max), Number(inp.value) + delta)));
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }
    }
    this.move(direction === "up" || direction === "left" ? -1 : 1);
    return true;
  }
  /** Handle analog stick for menu scrolling (call every frame from sendInput). */
  handleStick(dy) {
    if (!this.container || this.items.length === 0) return;
    const now = performance.now();
    const threshold = 0.5;
    if (Math.abs(dy) < threshold) {
      this.lastStickDy = 0;
      this.lastNavTime = 0;
      return;
    }
    const dir = dy > 0 ? 1 : -1;
    if (this.lastStickDy !== dir) {
      this.lastStickDy = dir;
      this.lastNavTime = now;
      this.move(dir);
      return;
    }
    if (now - this.lastNavTime >= NAV_REPEAT_DELAY) {
      this.lastNavTime = now;
      this.move(dir);
    }
  }
  move(delta) {
    if (this.items.length === 0) return;
    this.clearHighlight();
    this.focusIndex += delta;
    if (this.focusIndex < 0) this.focusIndex = 0;
    if (this.focusIndex >= this.items.length) this.focusIndex = this.items.length - 1;
    this.highlight();
  }
  highlight() {
    const el = this.items[this.focusIndex];
    if (!el) return;
    el.classList.add("gp-focus");
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  clearHighlight() {
    if (this.container) {
      this.container.querySelectorAll(".gp-focus").forEach((el) => el.classList.remove("gp-focus"));
    }
  }
};

// client/src/InputHandler.ts
var InputHandler = class {
  keys = /* @__PURE__ */ new Set();
  mouseX = 0;
  mouseY = 0;
  canvas;
  conn;
  autorun = false;
  buildMode = null;
  demolishMode = false;
  // Mobile two-tap build: preview cell before confirming
  mobileBuildPreview = null;
  // Gamepad build cursor: offset from player position (world units)
  gamepadBuildOffsetX = 0;
  gamepadBuildOffsetY = -CELL_SIZE;
  // start one tile above player
  menuOpen = false;
  chatOpen = false;
  modalOpen = false;
  statsOpen = false;
  // Mobile touch controller
  touch = null;
  isMobile;
  // Gamepad controller
  gamepad;
  menuNav = new GamepadMenuNav();
  // Input state tracking for change detection
  lastDx = 0;
  lastDy = 0;
  lastAutorun = false;
  lastFacing = 0;
  seq = 0;
  // Shield tracking (Q key)
  shieldHeld = false;
  // Dash tracking (Space key)
  dashHeld = false;
  // Mouse hold tracking for auto-attack
  mouseHeld = false;
  mouseShift = false;
  autoAttackInterval = null;
  // Right-click hold for auto-shoot
  rightHeld = false;
  autoShootInterval = null;
  // Callbacks
  onPunch = null;
  onLunge = null;
  onBuild = null;
  onCtrlClick = null;
  onTargetLock = null;
  onDemolish = null;
  onLogout = null;
  constructor(canvas, conn2, existingGamepad) {
    this.canvas = canvas;
    this.conn = conn2;
    this.isMobile = navigator.maxTouchPoints > 0;
    if (this.isMobile) {
      this.touch = new TouchController(canvas, conn2);
    }
    this.gamepad = existingGamepad ?? new GamepadController();
    this.gamepad.onAction = (action, facing) => this.handleGamepadAction(action, facing);
    this.setupListeners();
  }
  setupListeners() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.modalOpen || this.chatOpen || this.statsOpen) return;
        if (this.demolishMode) {
          this.setDemolishMode(false);
        } else if (this.buildMode) {
          this.setBuildMode(null);
        } else {
          this.toggleMenu();
        }
        return;
      }
      if (this.menuOpen || this.chatOpen || this.modalOpen || this.statsOpen) return;
      this.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "r") {
        this.autorun = !this.autorun;
      }
      if (e.key === " " && !this.dashHeld) {
        this.dashHeld = true;
        this.conn.send({ type: "dash" });
        e.preventDefault();
      }
      if (e.key.toLowerCase() === "q" && !this.shieldHeld) {
        this.shieldHeld = true;
        this.conn.send({ type: "shield" });
      }
      if (e.key.toLowerCase() === "f") {
        this.conn.send({ type: "parry" });
      }
      const buildKeys = {
        "1": "wall",
        "2": "gate",
        "3": "turret",
        "4": "bed"
      };
      if (buildKeys[e.key]) {
        this.setBuildMode(this.buildMode === buildKeys[e.key] ? null : buildKeys[e.key]);
      }
      if (e.key === "5") {
        this.setDemolishMode(!this.demolishMode);
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
      if (e.key === " ") this.dashHeld = false;
      if (e.key.toLowerCase() === "q") this.shieldHeld = false;
    });
    this.canvas.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    this.canvas.addEventListener("mousedown", (e) => {
      if (this.menuOpen || this.statsOpen) return;
      const facing = this.getFacing();
      if (e.button === 2) {
        this.conn.send({ type: "shoot", facing });
        this.rightHeld = true;
        this.startAutoShoot();
        return;
      }
      if (e.button !== 0) return;
      if (e.ctrlKey) {
        if (this.onCtrlClick) {
          this.onCtrlClick(this.mouseX, this.mouseY);
        }
        return;
      }
      if (this.demolishMode) {
        if (this.onDemolish) {
          this.onDemolish(this.mouseX, this.mouseY);
        }
        return;
      }
      if (this.buildMode) {
        if (this.onBuild) {
          this.onBuild(this.buildMode, this.mouseX, this.mouseY);
        }
        return;
      }
      this.fireAttack(e.shiftKey);
      this.mouseHeld = true;
      this.mouseShift = e.shiftKey;
      this.startAutoAttack();
    });
    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.mouseHeld = false;
        this.stopAutoAttack();
      }
      if (e.button === 2) {
        this.rightHeld = false;
        this.stopAutoShoot();
      }
    });
    window.addEventListener("blur", () => {
      this.clearKeys();
      this.mouseHeld = false;
      this.rightHeld = false;
      this.stopAutoAttack();
      this.stopAutoShoot();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clearKeys();
        this.mouseHeld = false;
        this.rightHeld = false;
        this.stopAutoAttack();
        this.stopAutoShoot();
        this.touch?.reset();
      }
    });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    document.querySelectorAll(".build-btn[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const btype = btn.dataset.type;
        this.setBuildMode(this.buildMode === btype ? null : btype);
      });
    });
    const cancelBtn = document.getElementById("cancel-build");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.setBuildMode(null);
        this.setDemolishMode(false);
      });
    }
    const demolishBtn = document.getElementById("demolish-btn");
    if (demolishBtn) {
      demolishBtn.addEventListener("click", () => {
        this.setDemolishMode(!this.demolishMode);
      });
    }
    const closeMenu = document.getElementById("close-menu");
    if (closeMenu) {
      closeMenu.addEventListener("click", () => this.toggleMenu());
    }
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (this.onLogout) this.onLogout();
      });
    }
  }
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    const menu = document.getElementById("esc-menu");
    if (menu) {
      menu.style.display = this.menuOpen ? "flex" : "none";
      if (this.menuOpen && this.gamepad.enabled && this.gamepad.connected) {
        const panel = menu.querySelector(".menu-panel") || menu;
        this.menuNav.activate(panel, () => this.toggleMenu());
      } else {
        this.menuNav.deactivate();
      }
    }
  }
  setBuildMode(mode) {
    this.buildMode = mode;
    this.mobileBuildPreview = null;
    this.gamepadBuildOffsetX = 0;
    this.gamepadBuildOffsetY = -CELL_SIZE;
    if (mode) {
      this.demolishMode = false;
      const demolishBtn = document.getElementById("demolish-btn");
      if (demolishBtn) demolishBtn.classList.remove("active");
    }
    document.querySelectorAll(".build-btn[data-type]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === mode);
    });
    const cancelBtn = document.getElementById("cancel-build");
    if (cancelBtn) {
      cancelBtn.style.display = mode ? "block" : "none";
    }
    const buildLabel = document.getElementById("mobile-build-label");
    if (buildLabel) {
      const touchVisible = this.isMobile && (!this.gamepad.enabled || !this.gamepad.connected || (this.touch?.enabled ?? true));
      if (mode && touchVisible) {
        const names = { wall: "Wall", gate: "Gate", turret: "Turret", bed: "Bed" };
        buildLabel.textContent = `Tap to preview ${names[mode] || mode}, tap again to place`;
        buildLabel.style.display = "block";
      } else {
        buildLabel.style.display = "none";
      }
    }
    this.canvas.style.cursor = mode ? "cell" : this.demolishMode ? "crosshair" : "crosshair";
  }
  setDemolishMode(active) {
    this.demolishMode = active;
    if (active) {
      this.setBuildMode(null);
      this.gamepadBuildOffsetX = 0;
      this.gamepadBuildOffsetY = -CELL_SIZE;
    }
    const demolishBtn = document.getElementById("demolish-btn");
    if (demolishBtn) demolishBtn.classList.toggle("active", active);
    const cancelBtn = document.getElementById("cancel-build");
    if (cancelBtn) cancelBtn.style.display = active ? "block" : this.buildMode ? "block" : "none";
    this.canvas.style.cursor = active ? "crosshair" : this.buildMode ? "cell" : "crosshair";
  }
  fireAttack(shift) {
    const facing = this.getFacing();
    if (shift) {
      if (this.onLunge) this.onLunge(facing);
      this.conn.send({ type: "lunge", facing });
    } else {
      if (this.onPunch) this.onPunch(facing);
      this.conn.send({ type: "punch", facing });
    }
  }
  startAutoAttack() {
    this.stopAutoAttack();
    const interval = this.mouseShift ? 1500 : 500;
    this.autoAttackInterval = setInterval(() => {
      if (!this.mouseHeld || this.menuOpen || this.statsOpen || this.chatOpen || this.modalOpen) {
        this.stopAutoAttack();
        return;
      }
      this.fireAttack(this.mouseShift);
    }, interval);
  }
  stopAutoAttack() {
    if (this.autoAttackInterval) {
      clearInterval(this.autoAttackInterval);
      this.autoAttackInterval = null;
    }
  }
  startAutoShoot() {
    this.stopAutoShoot();
    this.autoShootInterval = setInterval(() => {
      if (!this.rightHeld || this.menuOpen || this.statsOpen || this.chatOpen || this.modalOpen) {
        this.stopAutoShoot();
        return;
      }
      this.conn.send({ type: "shoot", facing: this.getFacing() });
    }, 500);
  }
  stopAutoShoot() {
    if (this.autoShootInterval) {
      clearInterval(this.autoShootInterval);
      this.autoShootInterval = null;
    }
  }
  getFacing() {
    if (this.gamepad.connected && this.gamepad.enabled) {
      return this.gamepad.getFacing();
    }
    if (this.touch?.enabled) {
      const tf = this.touch.getFacing();
      if (!isNaN(tf)) return tf;
    }
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    return Math.atan2(this.mouseY - cy, this.mouseX - cx);
  }
  getDx() {
    if (this.gamepad.connected && this.gamepad.moveDx !== 0) return this.gamepad.moveDx;
    if (this.touch?.enabled && this.touch.moveDx !== 0) return this.touch.moveDx;
    let dx = 0;
    if (this.keys.has("a") || this.keys.has("arrowleft")) dx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) dx += 1;
    return dx;
  }
  getDy() {
    if (this.gamepad.connected && this.gamepad.moveDy !== 0) return this.gamepad.moveDy;
    if (this.touch?.enabled && this.touch.moveDy !== 0) return this.touch.moveDy;
    let dy = 0;
    if (this.keys.has("w") || this.keys.has("arrowup")) dy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) dy += 1;
    return dy;
  }
  handleGamepadAction(action, facing) {
    if (this.menuOpen || this.chatOpen || this.modalOpen || this.statsOpen) {
      if (this.menuNav.active) {
        if (action === "interact" || action === "dash") {
          this.menuNav.handleAction(action);
          return;
        }
        if (action === "build_wall") {
          this.menuNav.handleDpad("up");
          return;
        }
        if (action === "build_turret") {
          this.menuNav.handleDpad("down");
          return;
        }
      }
      if (action === "menu") {
        if (this.menuOpen) {
          this.toggleMenu();
        } else if (this.menuNav.active) {
          this.menuNav.handleAction("dash");
        }
      }
      return;
    }
    const buildActions = {
      build_wall: "wall",
      build_gate: "gate",
      build_turret: "turret",
      build_bed: "bed"
    };
    switch (action) {
      case "punch":
        this.conn.send({ type: "punch", facing });
        if (this.onPunch) this.onPunch(facing);
        break;
      case "lunge":
        this.conn.send({ type: "lunge", facing });
        if (this.onLunge) this.onLunge(facing);
        break;
      case "shoot":
        this.conn.send({ type: "shoot", facing });
        break;
      case "shield":
        this.conn.send({ type: "shield" });
        break;
      case "parry":
        this.conn.send({ type: "parry" });
        break;
      case "dash":
        this.conn.send({ type: "dash" });
        break;
      case "interact":
        if (this.buildMode) {
          if (this.onBuild) {
            const cx = window.innerWidth / 2 + this.gamepadBuildOffsetX;
            const cy = window.innerHeight / 2 + this.gamepadBuildOffsetY;
            this.onBuild(this.buildMode, cx, cy);
          }
        } else if (this.demolishMode) {
          if (this.onDemolish) {
            const cx = window.innerWidth / 2 + this.gamepadBuildOffsetX;
            const cy = window.innerHeight / 2 + this.gamepadBuildOffsetY;
            this.onDemolish(cx, cy);
          }
        } else {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", bubbles: true }));
        }
        break;
      case "menu":
        this.toggleMenu();
        break;
      case "scores":
        const lbPanel = document.getElementById("mobile-lb-panel") || document.getElementById("leaderboard");
        if (lbPanel) lbPanel.classList.toggle("open");
        break;
      case "autorun":
        this.autorun = !this.autorun;
        break;
      case "target_lock":
        if (this.onTargetLock) {
          this.onTargetLock(facing);
        }
        break;
      case "demolish":
        this.setDemolishMode(!this.demolishMode);
        break;
      default:
        if (buildActions[action]) {
          const btype = buildActions[action];
          this.setBuildMode(this.buildMode === btype ? null : btype);
        }
        break;
    }
  }
  clearKeys() {
    this.keys.clear();
    this.dashHeld = false;
    this.shieldHeld = false;
  }
  sendInput() {
    this.gamepad.poll();
    if ((this.buildMode || this.demolishMode) && this.gamepad.enabled && this.gamepad.connected) {
      const speed = CELL_SIZE * 4;
      const dt = 1 / 60;
      this.gamepadBuildOffsetX += this.gamepad.aimRawX * speed * dt;
      this.gamepadBuildOffsetY += this.gamepad.aimRawY * speed * dt;
    }
    if (this.menuNav.active && this.gamepad.enabled && this.gamepad.connected) {
      this.menuNav.handleStick(this.gamepad.moveDy);
    }
    if (this.menuOpen || this.chatOpen || this.modalOpen || this.statsOpen) {
      if (this.lastDx !== 0 || this.lastDy !== 0 || this.lastAutorun) {
        this.lastDx = 0;
        this.lastDy = 0;
        this.lastAutorun = false;
        this.seq++;
        this.conn.send({ type: "input", seq: this.seq, dx: 0, dy: 0, autorun: false, facing: this.lastFacing });
      }
      if (this.keys.size > 0) this.clearKeys();
      return;
    }
    const dx = this.getDx();
    const dy = this.getDy();
    const facing = this.getFacing();
    const facingChanged = Math.abs(facing - this.lastFacing) > 0.05;
    if (dx === this.lastDx && dy === this.lastDy && this.autorun === this.lastAutorun && !facingChanged) {
      return;
    }
    this.lastDx = dx;
    this.lastDy = dy;
    this.lastAutorun = this.autorun;
    this.lastFacing = facing;
    this.seq++;
    this.conn.send({
      type: "input",
      seq: this.seq,
      dx,
      dy,
      autorun: this.autorun,
      facing
    });
  }
  getMouseScreenPos() {
    return { x: this.mouseX, y: this.mouseY };
  }
};

// client/src/GameState.ts
var GameState = class {
  myId = 0;
  selfHp = 10;
  selfMaxHp = 10;
  selfSource = 0;
  selfPos = { x: 0, y: 0 };
  selfDead = false;
  selfRespawnAt = null;
  readyToRespawn = false;
  selfColors = null;
  selfUsername = "";
  // Server info (from welcome message)
  serverName = "PlainScape";
  serverDescription = "Survive the plains.";
  selfFacing = 0;
  selfAnim = "idle";
  selfShieldActive = false;
  selfShieldCooldownUntil = 0;
  selfParryActive = false;
  selfParryCooldownUntil = 0;
  selfPunchCooldownUntil = 0;
  selfLungeCooldownUntil = 0;
  selfArrowCooldownUntil = 0;
  selfDashCooldownUntil = 0;
  dayPhase = "day";
  // Leaderboard and rules
  leaderboard = [];
  rules = [];
  // Stat levels
  selfStatLevels = defaultStatLevels();
  // Banking
  selfBankedSource = 0;
  // Buildings
  selfBuildingCount = 0;
  // Suggestions
  suggestions = [];
  onSuggestionsUpdate = null;
  // Party
  partyMembers = [];
  partyMemberInfo = [];
  // Sign data
  patchNotes = [];
  adminNotices = [];
  // Clock offset: serverTime - clientTime
  clockOffset = 0;
  // Current entities from latest snapshot
  entities = /* @__PURE__ */ new Map();
  // Interpolation: store last two snapshots
  prevSnapshot = null;
  currSnapshot = null;
  snapshotTime = 0;
  // Camera
  cameraX = 0;
  cameraY = 0;
  // Server target position for per-frame smoothing
  selfTargetPos = { x: 0, y: 0 };
  applySnapshot(serverTime, entities, selfHp, selfMaxHp, selfSource, selfPos, selfDead, selfRespawnAt, dayPhase, selfFacing, selfAnim, selfShieldActive, selfShieldCooldownUntil, selfParryActive, selfParryCooldownUntil, selfPunchCooldownUntil, selfLungeCooldownUntil, selfArrowCooldownUntil, selfDashCooldownUntil, selfStatLevels, selfBankedSource, selfBuildingCount) {
    this.selfHp = selfHp;
    this.selfMaxHp = selfMaxHp;
    this.selfSource = selfSource;
    this.selfDead = selfDead;
    this.dayPhase = dayPhase;
    this.clockOffset = serverTime - Date.now();
    this.selfRespawnAt = selfRespawnAt !== null ? selfRespawnAt - this.clockOffset : null;
    this.selfShieldActive = selfShieldActive;
    this.selfShieldCooldownUntil = selfShieldCooldownUntil - this.clockOffset;
    this.selfParryActive = selfParryActive;
    this.selfParryCooldownUntil = selfParryCooldownUntil - this.clockOffset;
    this.selfPunchCooldownUntil = selfPunchCooldownUntil - this.clockOffset;
    this.selfLungeCooldownUntil = selfLungeCooldownUntil - this.clockOffset;
    this.selfArrowCooldownUntil = selfArrowCooldownUntil - this.clockOffset;
    this.selfDashCooldownUntil = selfDashCooldownUntil - this.clockOffset;
    this.selfFacing = selfFacing;
    this.selfAnim = selfAnim;
    this.selfStatLevels = selfStatLevels;
    this.selfBankedSource = selfBankedSource;
    this.selfBuildingCount = selfBuildingCount;
    this.selfTargetPos.x = selfPos.x;
    this.selfTargetPos.y = selfPos.y;
    this.prevSnapshot = this.currSnapshot;
    const entityMap = /* @__PURE__ */ new Map();
    for (const e of entities) {
      entityMap.set(e.id, e);
    }
    this.currSnapshot = {
      time: serverTime,
      entities: entityMap,
      selfPos: { ...selfPos }
    };
    this.snapshotTime = Date.now();
    this.entities = entityMap;
  }
  /** Get interpolated position for an entity */
  getInterpolatedPos(id) {
    if (!this.prevSnapshot || !this.currSnapshot) {
      const entity = this.entities.get(id);
      return entity ? { x: entity.x, y: entity.y } : null;
    }
    const prev = this.prevSnapshot.entities.get(id);
    const curr = this.currSnapshot.entities.get(id);
    if (!curr) return null;
    if (!prev) return { x: curr.x, y: curr.y };
    const dt = this.currSnapshot.time - this.prevSnapshot.time;
    if (dt <= 0) return { x: curr.x, y: curr.y };
    const elapsed = Date.now() - this.snapshotTime;
    const t = Math.min(elapsed / dt, 1.1);
    return {
      x: prev.x + (curr.x - prev.x) * t,
      y: prev.y + (curr.y - prev.y) * t
    };
  }
  lastCameraTime = 0;
  updateCamera() {
    const now = performance.now();
    const dt = this.lastCameraTime > 0 ? Math.min((now - this.lastCameraTime) / 1e3, 0.05) : 1 / 60;
    this.lastCameraTime = now;
    const posSmooth = 1 - Math.exp(-12 * dt);
    const camSmooth = 1 - Math.exp(-10 * dt);
    this.selfPos.x += (this.selfTargetPos.x - this.selfPos.x) * posSmooth;
    this.selfPos.y += (this.selfTargetPos.y - this.selfPos.y) * posSmooth;
    this.cameraX += (this.selfPos.x - this.cameraX) * camSmooth;
    this.cameraY += (this.selfPos.y - this.cameraY) * camSmooth;
  }
};

// client/src/rendering/atmosphere/DayCycle.ts
var CYCLE_MS = 60 * 60 * 1e3;
var DAWN_END = 10 * 60 * 1e3;
var DAY_END = 30 * 60 * 1e3;
var DUSK_END = 40 * 60 * 1e3;
var PHASE_ORDER = ["dawn", "day", "dusk", "night"];
var PHASE_LENGTHS = {
  dawn: DAWN_END,
  day: DAY_END - DAWN_END,
  dusk: DUSK_END - DAY_END,
  night: CYCLE_MS - DUSK_END
};
var TRANSITION_MS = 3e3;
var serverPhase = "day";
var prevPhase = "day";
var transitionStart = 0;
var phaseStartTime = 0;
var initialized = false;
function setServerPhase(phase) {
  if (!initialized) {
    initialized = true;
    serverPhase = phase;
    prevPhase = phase;
    phaseStartTime = performance.now();
    return;
  }
  if (phase !== serverPhase) {
    prevPhase = serverPhase;
    transitionStart = performance.now();
    phaseStartTime = performance.now();
    serverPhase = phase;
  }
}
function getPhaseBlend() {
  const idx = PHASE_ORDER.indexOf(serverPhase);
  const nextPhase = PHASE_ORDER[(idx + 1) % 4];
  const elapsed = performance.now() - transitionStart;
  if (prevPhase !== serverPhase && elapsed < TRANSITION_MS) {
    const t = elapsed / TRANSITION_MS;
    const blend = 1 - (1 - t) * (1 - t);
    return { phase: prevPhase, progress: 1, blend, nextPhase: serverPhase };
  }
  if (prevPhase !== serverPhase) {
    prevPhase = serverPhase;
  }
  const len = PHASE_LENGTHS[serverPhase];
  const sincePhaseStart = performance.now() - phaseStartTime;
  const progress = Math.max(0, Math.min(1, sincePhaseStart / len));
  return { phase: serverPhase, progress, blend: 0, nextPhase };
}

// client/src/rendering/atmosphere/SeededRandom.ts
var SeededRandom = class _SeededRandom {
  state;
  constructor(seed) {
    this.state = seed | 0;
  }
  next() {
    this.state |= 0;
    this.state = this.state + 1831565813 | 0;
    let t = Math.imul(this.state ^ this.state >>> 15, 1 | this.state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  static fromChunk(cx, cy) {
    return new _SeededRandom(cx * 73856093 ^ cy * 19349663 ^ 3735928559);
  }
};

// client/src/rendering/atmosphere/GrassSystem.ts
var GRASS_CHUNK = 256;
var PATCHES_PER_CHUNK = 12;
var PALETTES = {
  day: ["#2e6e30", "#42903e", "#5cb850"],
  dawn: ["#367040", "#4a8848", "#60a858"],
  dusk: ["#38583a", "#4a6a44", "#5c7a4c"],
  night: ["#1c3820", "#264a28", "#305a30"]
};
function lerpColor(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}
function getBlendedPalette(pb) {
  const cur = PALETTES[pb.phase];
  if (pb.blend <= 0) return cur;
  const next = PALETTES[pb.nextPhase];
  return [lerpColor(cur[0], next[0], pb.blend), lerpColor(cur[1], next[1], pb.blend), lerpColor(cur[2], next[2], pb.blend)];
}
function generateChunk(cx, cy) {
  const rng = SeededRandom.fromChunk(cx, cy);
  const patches = [];
  const baseX = cx * GRASS_CHUNK;
  const baseY = cy * GRASS_CHUNK;
  for (let i = 0; i < PATCHES_PER_CHUNK; i++) {
    patches.push({
      x: baseX + rng.next() * GRASS_CHUNK,
      y: baseY + rng.next() * GRASS_CHUNK,
      variant: Math.floor(rng.next() * 4),
      scale: 0.6 + rng.next() * 0.6,
      windOffset: rng.next() * Math.PI * 2
    });
  }
  return patches;
}
var chunkCache = /* @__PURE__ */ new Map();
var MAX_CACHE = 200;
function getChunk(cx, cy) {
  const key = `${cx},${cy}`;
  let patches = chunkCache.get(key);
  if (patches) return patches;
  if (chunkCache.size >= MAX_CACHE) {
    const first = chunkCache.keys().next().value;
    chunkCache.delete(first);
  }
  patches = generateChunk(cx, cy);
  chunkCache.set(key, patches);
  return patches;
}
function drawBlade(ctx2, baseX, baseY, tipX, tipY, color, width) {
  ctx2.strokeStyle = color;
  ctx2.lineWidth = width;
  ctx2.lineCap = "round";
  ctx2.beginPath();
  ctx2.moveTo(baseX, baseY);
  ctx2.quadraticCurveTo((baseX + tipX) * 0.5, (baseY + tipY) * 0.5 - 2, tipX, tipY);
  ctx2.stroke();
}
function drawGrassTuft(ctx2, variant, scale, palette, windSkew) {
  ctx2.save();
  ctx2.scale(scale, scale);
  const s = windSkew;
  switch (variant) {
    case 0:
      drawBlade(ctx2, -3, 0, -4 + s * 12, -14, palette[0], 2);
      drawBlade(ctx2, 0, 0, s * 16, -18, palette[1], 2.5);
      drawBlade(ctx2, 3, 0, 4 + s * 12, -14, palette[2], 2);
      break;
    case 1:
      drawBlade(ctx2, -4, 0, -5 + s * 6, -8, palette[0], 1.5);
      drawBlade(ctx2, -2, 0, -1 + s * 8, -10, palette[1], 1.8);
      drawBlade(ctx2, 0, 0, 1 + s * 8, -9, palette[2], 1.6);
      drawBlade(ctx2, 2, 0, 3 + s * 7, -8, palette[0], 1.5);
      drawBlade(ctx2, 4, 0, 5 + s * 5, -6, palette[1], 1.3);
      break;
    case 2:
      drawBlade(ctx2, 0, 0, s * 18, -20, palette[1], 3);
      break;
    case 3:
      drawBlade(ctx2, -2, 0, -6 + s * 14, -16, palette[0], 2.2);
      drawBlade(ctx2, 2, 0, 6 + s * 14, -16, palette[2], 2.2);
      break;
  }
  ctx2.restore();
}
function getVisibleGrassPositions(camX, camY, screenW, screenH) {
  const pad = 20;
  const left = camX - screenW / 2 - pad;
  const top = camY - screenH / 2 - pad;
  const right = camX + screenW / 2 + pad;
  const bottom = camY + screenH / 2 + pad;
  const cx0 = Math.floor(left / GRASS_CHUNK);
  const cy0 = Math.floor(top / GRASS_CHUNK);
  const cx1 = Math.floor(right / GRASS_CHUNK);
  const cy1 = Math.floor(bottom / GRASS_CHUNK);
  const positions = [];
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cy = cy0; cy <= cy1; cy++) {
      const patches = getChunk(cx, cy);
      for (const p of patches) {
        if (p.x >= left && p.x <= right && p.y >= top && p.y <= bottom) {
          positions.push({ x: p.x, y: p.y });
        }
      }
    }
  }
  return positions;
}
function drawGrass(ctx2, camX, camY, screenW, screenH, phaseBlend) {
  const palette = getBlendedPalette(phaseBlend);
  const now = performance.now() / 1e3;
  const globalWind = Math.sin(now * 0.7) * 0.14;
  const pad = 40;
  const left = camX - screenW / 2 - pad;
  const top = camY - screenH / 2 - pad;
  const right = camX + screenW / 2 + pad;
  const bottom = camY + screenH / 2 + pad;
  const cx0 = Math.floor(left / GRASS_CHUNK);
  const cy0 = Math.floor(top / GRASS_CHUNK);
  const cx1 = Math.floor(right / GRASS_CHUNK);
  const cy1 = Math.floor(bottom / GRASS_CHUNK);
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cy = cy0; cy <= cy1; cy++) {
      const patches = getChunk(cx, cy);
      for (const patch of patches) {
        if (patch.x < left || patch.x > right || patch.y < top || patch.y > bottom) continue;
        const windSkew = globalWind + Math.sin(now * 1.1 + patch.windOffset) * 0.08;
        ctx2.save();
        ctx2.translate(patch.x, patch.y);
        drawGrassTuft(ctx2, patch.variant, patch.scale, palette, windSkew);
        ctx2.restore();
      }
    }
  }
}

// client/src/rendering/WorldRenderer.ts
var GRASS_COLORS = {
  day: "#3f6e43",
  dawn: "#3a5c34",
  dusk: "#3d5a4e",
  night: "#263f2b"
};
var GRID_ALPHAS = {
  day: 0.08,
  dawn: 0.1,
  dusk: 0.06,
  night: 0.12
};
function lerpHex(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  return `#${Math.round(ar + (br - ar) * t).toString(16).padStart(2, "0")}${Math.round(ag + (bg - ag) * t).toString(16).padStart(2, "0")}${Math.round(ab + (bb - ab) * t).toString(16).padStart(2, "0")}`;
}
function drawWorld(ctx2, cam, screenW, screenH, phase) {
  const left = cam.x - screenW / 2;
  const top = cam.y - screenH / 2;
  const right = cam.x + screenW / 2;
  const bottom = cam.y + screenH / 2;
  const pb = getPhaseBlend();
  const grassColor = lerpHex(GRASS_COLORS[pb.phase], GRASS_COLORS[pb.nextPhase], pb.blend);
  ctx2.fillStyle = grassColor;
  ctx2.fillRect(left, top, screenW, screenH);
  drawGrass(ctx2, cam.x, cam.y, screenW, screenH, pb);
  const gridAlpha = GRID_ALPHAS[pb.phase] + (GRID_ALPHAS[pb.nextPhase] - GRID_ALPHAS[pb.phase]) * pb.blend;
  ctx2.strokeStyle = `rgba(0,0,0,${gridAlpha.toFixed(3)})`;
  ctx2.lineWidth = 1;
  const startX = Math.floor(left / CELL_SIZE) * CELL_SIZE;
  const startY = Math.floor(top / CELL_SIZE) * CELL_SIZE;
  ctx2.beginPath();
  for (let x = startX; x <= right; x += CELL_SIZE) {
    ctx2.moveTo(x, top);
    ctx2.lineTo(x, bottom);
  }
  for (let y = startY; y <= bottom; y += CELL_SIZE) {
    ctx2.moveTo(left, y);
    ctx2.lineTo(right, y);
  }
  ctx2.stroke();
}

// client/src/rendering/RenderUtils.ts
function stepFrame(time, fps, frameCount) {
  return Math.floor(time * fps % frameCount);
}
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}
function keyLerp(frames, frame, subT) {
  const next = (frame + 1) % frames.length;
  const eased = easeOutQuart(subT);
  return frames[frame] + (frames[next] - frames[frame]) * eased;
}
function getFrameInfo(time, fps, frameCount) {
  const raw = time * fps % frameCount;
  const frame = Math.floor(raw);
  const sub = raw - frame;
  return { frame, sub };
}
function drawHpBar(ctx2, x, y, hp, maxHp) {
  const w = 24;
  const h = 3;
  const ratio = Math.max(0, hp / maxHp);
  ctx2.fillStyle = "rgba(0,0,0,0.5)";
  ctx2.fillRect(x - w / 2, y, w, h);
  ctx2.fillStyle = ratio > 0.5 ? "#4caf50" : ratio > 0.25 ? "#ff9800" : "#f44336";
  ctx2.fillRect(x - w / 2, y, w * ratio, h);
}
var darkenCache = /* @__PURE__ */ new Map();
function darkenColor(hex, factor) {
  const key = hex + factor;
  let result = darkenCache.get(key);
  if (result) return result;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  result = `rgb(${Math.floor(r * (1 - factor))},${Math.floor(g * (1 - factor))},${Math.floor(b * (1 - factor))})`;
  darkenCache.set(key, result);
  return result;
}
var LION_GALLOP = {
  bodyStretchX: [0.92, 0.96, 1.08, 1.06, 1.02, 0.95],
  bodyStretchY: [1.08, 1.02, 0.94, 0.96, 1, 1.06],
  bodyBob: [2, 0, -3, -2, 0, 2],
  frontLegAngle: [0.4, 0.1, -0.6, -0.3, 0, 0.3],
  backLegAngle: [-0.3, 0.2, 0.5, 0.3, -0.1, -0.3],
  headBob: [1, 0, -1, -0.5, 0, 1],
  tailAngle: [0.3, -0.1, -0.4, -0.2, 0.1, 0.3]
};
var GHOST_FLOAT = {
  bob: [0, -4, -2, 2],
  bodyScale: [1, 1.03, 0.98, 1.01],
  tendrilW: [0, 3, -2, 1],
  eyeSquint: [1, 0.9, 1.05, 0.95]
};
var STAG_STRIDE = {
  bodyBob: [2, 0, -2, 0],
  bodyStretchX: [0.96, 1, 1.04, 1],
  bodyStretchY: [1.04, 1, 0.96, 1],
  frontLegFwd: [-3, 2, 6, 0],
  backLegFwd: [3, -2, -6, 0],
  headDip: [1, 0, -1, 0],
  flamePulse: [1.2, 0.9, 1.4, 1]
};
var PLAYER_WALK = {
  bodyBob: [-1, 0.5, -1, 0.5],
  leftLegY: [5, 0, -5, 0],
  rightLegY: [-5, 0, 5, 0],
  leftArmY: [-3, 0, 3, 0],
  rightArmY: [3, 0, -3, 0],
  torsoTilt: [0.02, 0, -0.02, 0]
};

// client/src/rendering/LionRenderer.ts
function drawLionSpawn(ctx2, x, y, entity, progress) {
  const eased = easeOutQuart(progress);
  ctx2.save();
  ctx2.translate(x, y);
  const dustAlpha = 1 - eased;
  ctx2.globalAlpha = dustAlpha * 0.6;
  ctx2.fillStyle = "#aa8844";
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2;
    const dist = 15 * (1 - eased * 0.5);
    const size = 8 - eased * 4;
    ctx2.beginPath();
    ctx2.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, size, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = eased;
  ctx2.save();
  const scale = 0.3 + eased * 0.7;
  ctx2.scale(scale, scale);
  ctx2.translate(-x, -y);
  ctx2.restore();
  ctx2.restore();
  ctx2.save();
  ctx2.globalAlpha = eased;
  drawLion(ctx2, x, y, entity);
  ctx2.restore();
}
function drawLionDeath(ctx2, x, y, progress) {
  const eased = easeOutQuart(progress);
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.globalAlpha = (1 - eased) * 0.7;
  ctx2.fillStyle = "#aa8844";
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2 + i * 0.3;
    const dist = eased * 25;
    const size = 4 * (1 - eased);
    ctx2.beginPath();
    ctx2.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, size, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = (1 - eased) * 0.5;
  ctx2.fillStyle = "#c4873a";
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * Math.PI * 2;
    const dist = eased * 15;
    ctx2.beginPath();
    ctx2.arc(Math.cos(angle) * dist, Math.sin(angle) * dist - eased * 10, 3 * (1 - eased), 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = Math.max(0, (progress - 0.3) / 0.7) * (1 - eased);
  ctx2.fillStyle = "#ffdd44";
  for (let i = 0; i < 3; i++) {
    const yOff = -eased * 20 - i * 5;
    ctx2.beginPath();
    ctx2.arc((i - 1) * 6, yOff, 2 * (1 - eased), 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.restore();
}
function drawLion(ctx2, x, y, entity) {
  const time = Date.now() / 1e3;
  const facing = entity.facing ?? 0;
  const facingRight = Math.cos(facing) >= 0;
  const anim = entity.anim;
  const isWindup = anim === "windup";
  const isPounce = anim === "pounce";
  const isSwipe = anim === "punch";
  const isCrouch = anim === "crouch";
  const gallopFps = 10;
  const { frame: gFrame, sub: gSub } = getFrameInfo(time, gallopFps, 6);
  let bob, fLegY, bLegY, headBob, tailY;
  if (isWindup) {
    const pulse = Math.sin(time * 12) * 0.3;
    bob = 4 + pulse;
    fLegY = 2;
    bLegY = 2;
    headBob = 3;
    tailY = -3;
  } else if (isPounce) {
    bob = -5;
    fLegY = -4;
    bLegY = 3;
    headBob = -4;
    tailY = 4;
  } else if (isSwipe) {
    bob = 1;
    fLegY = -2;
    bLegY = 1;
    headBob = -1;
    tailY = 2;
  } else if (isCrouch) {
    const breathe = Math.sin(time * 3) * 0.5;
    bob = 5 + breathe;
    fLegY = 3;
    bLegY = 3;
    headBob = 4;
    tailY = -2;
  } else {
    bob = keyLerp(LION_GALLOP.bodyBob, gFrame, gSub);
    fLegY = keyLerp(LION_GALLOP.frontLegAngle, gFrame, gSub) * 4;
    bLegY = keyLerp(LION_GALLOP.backLegAngle, gFrame, gSub) * 4;
    headBob = keyLerp(LION_GALLOP.headBob, gFrame, gSub);
    tailY = keyLerp(LION_GALLOP.tailAngle, gFrame, gSub) * 6;
  }
  const O = "#1a1008";
  const BODY = "#d4a030";
  const BODY_HI = "#e8c050";
  const BODY_SH = "#b08020";
  const MANE = "#7a3c14";
  const MANE_D = "#4c2408";
  const isChase = entity.sub === "chase";
  ctx2.save();
  ctx2.translate(x, y);
  if (!facingRight) ctx2.scale(-1, 1);
  ctx2.fillStyle = "rgba(0,0,0,0.12)";
  ctx2.beginPath();
  ctx2.ellipse(0, 12 + bob * 0.3, 12, 3, 0, 0, Math.PI * 2);
  ctx2.fill();
  if (isWindup) {
    const pulse = 0.5 + Math.sin(time * 14) * 0.3;
    ctx2.fillStyle = `rgba(255, 80, 20, ${pulse * 0.3})`;
    ctx2.beginPath();
    ctx2.ellipse(0, 10, 16 + pulse * 3, 6, 0, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = `rgba(255, 120, 40, ${pulse * 0.5})`;
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.ellipse(0, 10, 16 + pulse * 3, 6, 0, 0, Math.PI * 2);
    ctx2.stroke();
  }
  if (isPounce) {
    ctx2.strokeStyle = "rgba(200, 160, 60, 0.4)";
    ctx2.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const lx = -14 - i * 6;
      const ly = -2 + i * 4;
      ctx2.beginPath();
      ctx2.moveTo(lx, ly);
      ctx2.lineTo(lx - 8, ly + 1);
      ctx2.stroke();
    }
  }
  if (isSwipe) {
    const swipeT = time * 1e3 % 250 / 250;
    const sweep = Math.min(1, swipeT * 1.8);
    const fade = 1 - Math.max(0, (swipeT - 0.5) / 0.5);
    ctx2.lineCap = "round";
    for (let i = -1; i <= 1; i++) {
      const baseX = 14;
      const baseY = -7 + i * 7;
      const scratchLen = 14 * sweep;
      ctx2.strokeStyle = `rgba(220, 60, 10, ${0.6 * fade})`;
      ctx2.lineWidth = 5;
      ctx2.beginPath();
      ctx2.moveTo(baseX, baseY);
      ctx2.lineTo(baseX + scratchLen, baseY + scratchLen * 0.5);
      ctx2.stroke();
      ctx2.strokeStyle = `rgba(255, 250, 200, ${0.9 * fade})`;
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.moveTo(baseX, baseY);
      ctx2.lineTo(baseX + scratchLen, baseY + scratchLen * 0.5);
      ctx2.stroke();
    }
  }
  const tailBaseX = -9;
  const tailTipX = tailBaseX - 10;
  const tailTipY = bob - 4 + tailY;
  ctx2.strokeStyle = O;
  ctx2.lineWidth = 3;
  ctx2.lineCap = "round";
  ctx2.beginPath();
  ctx2.moveTo(tailBaseX, bob + 1);
  ctx2.lineTo(tailTipX, tailTipY);
  ctx2.stroke();
  ctx2.strokeStyle = BODY;
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.moveTo(tailBaseX, bob + 1);
  ctx2.lineTo(tailTipX, tailTipY);
  ctx2.stroke();
  ctx2.fillStyle = isChase ? BODY_SH : MANE_D;
  ctx2.fillRect(tailTipX - 2, tailTipY - 2, 4, 4);
  const legW = 4;
  const legH = 7;
  ctx2.fillStyle = BODY_SH;
  ctx2.fillRect(-8, 3 + bob + bLegY * 0.3, legW, legH - bLegY * 0.15);
  ctx2.fillRect(4, 3 + bob + fLegY * 0.3, legW, legH - fLegY * 0.15);
  ctx2.fillStyle = O;
  ctx2.fillRect(-8, 3 + bob + legH + bLegY * 0.15, legW, 2);
  ctx2.fillRect(4, 3 + bob + legH + fLegY * 0.15, legW, 2);
  ctx2.save();
  ctx2.translate(0, bob);
  ctx2.fillStyle = O;
  ctx2.beginPath();
  ctx2.roundRect(-11, -6, 22, 14, 3);
  ctx2.fill();
  ctx2.fillStyle = BODY;
  ctx2.beginPath();
  ctx2.roundRect(-10, -5, 20, 12, 2);
  ctx2.fill();
  ctx2.fillStyle = BODY_HI;
  ctx2.fillRect(-8, -4, 16, 4);
  ctx2.fillStyle = BODY_SH;
  ctx2.fillRect(-8, 3, 16, 3);
  ctx2.restore();
  ctx2.fillStyle = BODY;
  ctx2.fillRect(-6, 3 + bob + bLegY * 0.3, legW, legH - bLegY * 0.15);
  ctx2.fillRect(6, 3 + bob + fLegY * 0.3, legW, legH - fLegY * 0.15);
  ctx2.fillStyle = O;
  ctx2.fillRect(-6, 3 + bob + legH + bLegY * 0.15, legW, 2);
  ctx2.fillRect(6, 3 + bob + legH + fLegY * 0.15, legW, 2);
  const mX = 7;
  const mY = -5 + bob + headBob;
  if (isChase) {
    ctx2.fillStyle = O;
    ctx2.fillRect(mX - 4, mY - 6, 10, 5);
    ctx2.fillStyle = BODY_SH;
    ctx2.fillRect(mX - 3, mY - 5, 8, 4);
    ctx2.fillStyle = BODY;
    ctx2.fillRect(mX - 2, mY - 4, 6, 3);
  } else {
    ctx2.fillStyle = O;
    ctx2.beginPath();
    ctx2.roundRect(mX - 9, mY - 8, 18, 17, 4);
    ctx2.fill();
    ctx2.fillStyle = MANE_D;
    ctx2.beginPath();
    ctx2.roundRect(mX - 8, mY - 7, 16, 15, 3);
    ctx2.fill();
    ctx2.fillStyle = MANE;
    ctx2.beginPath();
    ctx2.roundRect(mX - 6, mY - 5, 12, 11, 2);
    ctx2.fill();
  }
  const hX = 11;
  const hY = -3 + bob + headBob;
  ctx2.fillStyle = O;
  ctx2.beginPath();
  ctx2.roundRect(hX - 6, hY - 5, 12, 11, 3);
  ctx2.fill();
  ctx2.fillStyle = BODY;
  ctx2.beginPath();
  ctx2.roundRect(hX - 5, hY - 4, 10, 9, 2);
  ctx2.fill();
  ctx2.fillStyle = BODY_HI;
  ctx2.fillRect(hX - 4, hY - 3, 8, 3);
  ctx2.fillStyle = O;
  ctx2.fillRect(hX - 4, hY - 8, 4, 4);
  ctx2.fillStyle = isChase ? BODY_SH : MANE;
  ctx2.fillRect(hX - 3, hY - 7, 2, 2);
  ctx2.fillStyle = "#d4977a";
  ctx2.fillRect(hX - 3, hY - 6, 1, 1);
  ctx2.fillStyle = BODY_HI;
  ctx2.beginPath();
  ctx2.roundRect(hX + 4, hY - 1, 5, 4, 1);
  ctx2.fill();
  ctx2.fillStyle = "#cc7788";
  ctx2.fillRect(hX + 7, hY - 1, 2, 2);
  ctx2.fillStyle = O;
  ctx2.fillRect(hX + 7, hY - 1, 2, 1);
  ctx2.fillStyle = O;
  ctx2.fillRect(hX + 5, hY + 3, 3, 1);
  ctx2.fillStyle = "#f0efe8";
  ctx2.fillRect(hX + 6, hY + 3, 1, 2);
  const eyeW = isWindup ? 4 : isPounce || isSwipe ? 3 : isCrouch ? 3 : 3;
  const eyeH = isWindup ? 3 : isPounce ? 1 : isSwipe ? 1 : isCrouch ? 1 : 2;
  ctx2.fillStyle = "#f8f4e0";
  ctx2.fillRect(hX + 1, hY - 3, eyeW, eyeH);
  ctx2.fillStyle = "#c08820";
  ctx2.fillRect(hX + 2, hY - 3, 2, eyeH);
  ctx2.fillStyle = O;
  ctx2.fillRect(hX + 3, hY - 3, 1, eyeH);
  ctx2.fillStyle = O;
  ctx2.fillRect(hX, hY - 4, eyeW + 1, 1);
  ctx2.restore();
  ctx2.save();
  ctx2.translate(x, y);
  if (entity.hp !== void 0 && entity.maxHp !== void 0) {
    drawHpBar(ctx2, 0, -18, entity.hp, entity.maxHp);
  }
  ctx2.restore();
}

// client/src/rendering/GhostRenderer.ts
function drawGhostSpawn(ctx2, x, y, entity, progress) {
  const eased = easeOutQuart(progress);
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.globalAlpha = (1 - eased) * 0.5;
  ctx2.strokeStyle = "#8899cc";
  ctx2.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const angle = i / 4 * Math.PI * 2 + progress * Math.PI * 4;
    const dist = 20 * (1 - eased);
    ctx2.beginPath();
    ctx2.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 5 * (1 - eased), 0, Math.PI * 2);
    ctx2.stroke();
  }
  ctx2.globalAlpha = eased * 0.3;
  ctx2.fillStyle = "#aabbee";
  ctx2.beginPath();
  ctx2.arc(0, 0, 20 * (1 - eased * 0.5), 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  ctx2.save();
  ctx2.globalAlpha = eased;
  const yOffset = 15 * (1 - eased);
  drawGhost(ctx2, x, y + yOffset, entity);
  ctx2.restore();
}
function drawGhostDeath(ctx2, x, y, progress) {
  const eased = easeOutQuart(progress);
  ctx2.save();
  ctx2.translate(x, y);
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2 + progress * Math.PI;
    const dist = eased * 30;
    const size = 5 * (1 - eased);
    ctx2.globalAlpha = (1 - eased) * 0.4;
    ctx2.fillStyle = "#d0daf0";
    ctx2.beginPath();
    ctx2.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, size, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = (1 - eased) * 0.6;
  ctx2.fillStyle = "#d0daf0";
  const shrink = 1 - eased;
  ctx2.beginPath();
  ctx2.arc(0, 0, 10 * shrink, 0, Math.PI * 2);
  ctx2.fill();
  if (progress < 0.7) {
    const eyeAlpha = (0.7 - progress) / 0.7;
    ctx2.globalAlpha = eyeAlpha * 0.9;
    ctx2.fillStyle = "#3344aa";
    ctx2.beginPath();
    ctx2.arc(-4.5, -4, 3 * shrink, 0, Math.PI * 2);
    ctx2.arc(4.5, -4, 3 * shrink, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = (1 - eased) * 0.3;
  ctx2.fillStyle = "#8899cc";
  for (let i = 0; i < 3; i++) {
    const dropX = (i - 1) * 7;
    const dropY = eased * 25 + i * 3;
    ctx2.beginPath();
    ctx2.ellipse(dropX, dropY, 2 * (1 - eased), 4 * (1 - eased), 0, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.restore();
}
function drawGhost(ctx2, x, y, entity) {
  const time = Date.now() / 1e3;
  const facing = entity.facing ?? 0;
  const anim = entity.anim;
  const isWindup = anim === "windup";
  const isFiring = anim === "shoot";
  const isPhased = anim === "shield";
  const floatFps = 3;
  const { frame: fFrame, sub: fSub } = getFrameInfo(time, floatFps, 4);
  const bob = keyLerp(GHOST_FLOAT.bob, fFrame, fSub);
  const bodyScale = keyLerp(GHOST_FLOAT.bodyScale, fFrame, fSub);
  const tendrilW = keyLerp(GHOST_FLOAT.tendrilW, fFrame, fSub);
  const eyeScale = keyLerp(GHOST_FLOAT.eyeSquint, fFrame, fSub);
  ctx2.save();
  if (isPhased) {
    ctx2.globalAlpha = 0.18 + Math.sin(time * 10) * 0.08;
  }
  const shakeX = isWindup ? Math.sin(time * 60) * 3 : isPhased ? Math.sin(time * 12) * 2 : 0;
  const shakeY = isWindup ? Math.cos(time * 45) * 2 : isPhased ? Math.cos(time * 9) * 1.5 : 0;
  ctx2.translate(x + shakeX, y + bob + shakeY);
  if (isPhased) {
    ctx2.save();
    ctx2.globalAlpha = 0.12 + Math.sin(time * 4) * 0.06;
    ctx2.fillStyle = "#8899cc";
    ctx2.beginPath();
    ctx2.ellipse(0, -2, 18 + Math.sin(time * 3) * 3, 22 + Math.cos(time * 2.5) * 3, 0, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.restore();
  }
  const wispDirX = -Math.cos(facing);
  const wispDirY = -Math.sin(facing);
  ctx2.fillStyle = "#8899cc";
  for (let i = 0; i < 5; i++) {
    const wispFrame = stepFrame(time + i * 0.3, 4, 3);
    const baseX = wispDirX * (8 + i * 4) + (wispFrame - 1) * 2;
    const baseY = 12 + i * 3 + wispDirY * (4 + i * 2) + wispFrame * 1.5;
    const wSize = 3.5 - i * 0.4;
    ctx2.globalAlpha = 0.15 - i * 0.02;
    ctx2.beginPath();
    ctx2.arc(baseX, baseY, wSize, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = 0.06 + (fFrame === 1 ? 0.04 : 0);
  ctx2.fillStyle = "#aabbee";
  ctx2.beginPath();
  ctx2.arc(0, 0, 20, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.globalAlpha = 0.55 + fFrame % 2 * 0.1;
  ctx2.fillStyle = "#d0daf0";
  ctx2.save();
  ctx2.scale(1 / bodyScale, bodyScale);
  ctx2.beginPath();
  ctx2.moveTo(0, -14);
  ctx2.bezierCurveTo(-13, -8, -11, 8, -9, 12);
  const t1 = tendrilW;
  const t2 = -tendrilW * 0.8;
  const t3 = tendrilW * 0.6;
  ctx2.lineTo(-7, 14 + t1);
  ctx2.lineTo(-4, 10 + t2);
  ctx2.lineTo(-1, 16 + t3);
  ctx2.lineTo(2, 10 + t1);
  ctx2.lineTo(5, 14 + t2);
  ctx2.lineTo(8, 11 + t3);
  ctx2.lineTo(9, 12);
  ctx2.bezierCurveTo(11, 8, 13, -8, 0, -14);
  ctx2.fill();
  ctx2.restore();
  ctx2.globalAlpha = 0.15 + (fFrame === 0 ? 0.1 : 0);
  ctx2.fillStyle = "#eef2ff";
  ctx2.beginPath();
  ctx2.ellipse(0, -2, 7, 9, 0, 0, Math.PI * 2);
  ctx2.fill();
  if (isPhased) {
    ctx2.save();
    ctx2.globalAlpha = 0.3 + Math.sin(time * 5) * 0.15;
    ctx2.strokeStyle = "#6666cc";
    ctx2.lineWidth = 1.5;
    ctx2.setLineDash([3, 5]);
    ctx2.beginPath();
    const ringRadius = 16 + Math.sin(time * 3) * 3;
    ctx2.arc(0, -3, ringRadius, 0, Math.PI * 2);
    ctx2.stroke();
    ctx2.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const angle = time * 2 + i * Math.PI / 2;
      const dist = 12 + Math.sin(time * 4 + i) * 5;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist - 3;
      ctx2.globalAlpha = 0.2 + Math.sin(time * 6 + i * 2) * 0.15;
      ctx2.fillStyle = "#aabbff";
      ctx2.beginPath();
      ctx2.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  }
  const eyeDirX = Math.cos(facing) * 3.5;
  const eyeDirY = Math.sin(facing) * 2.5;
  const scary = isWindup || isFiring;
  ctx2.globalAlpha = isPhased ? 0.4 : 0.9;
  ctx2.fillStyle = scary ? "#2a0808" : "#1a2244";
  const socketScale = scary ? 1.3 : 1;
  ctx2.beginPath();
  ctx2.ellipse(-4.5, -4, 4 * socketScale, 4.5 * eyeScale * socketScale, -0.1, 0, Math.PI * 2);
  ctx2.ellipse(4.5, -4, 4 * socketScale, 4.5 * eyeScale * socketScale, 0.1, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = scary ? "#cc2200" : "#3344aa";
  ctx2.beginPath();
  ctx2.ellipse(-4.5 + eyeDirX * 0.3, -4 + eyeDirY * 0.3, 3.5 * socketScale, 4 * eyeScale * socketScale, -0.1, 0, Math.PI * 2);
  ctx2.ellipse(4.5 + eyeDirX * 0.3, -4 + eyeDirY * 0.3, 3.5 * socketScale, 4 * eyeScale * socketScale, 0.1, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = scary ? "#ff4400" : "#112266";
  ctx2.beginPath();
  ctx2.arc(-4.5 + eyeDirX, -3.5 + eyeDirY, scary ? 2.5 : 2, 0, Math.PI * 2);
  ctx2.arc(4.5 + eyeDirX, -3.5 + eyeDirY, scary ? 2.5 : 2, 0, Math.PI * 2);
  ctx2.fill();
  if (scary) {
    ctx2.fillStyle = "#1a0808";
    ctx2.globalAlpha = 0.8;
    ctx2.beginPath();
    ctx2.ellipse(0, 4, 5, 3 + Math.sin(time * 20) * 1, 0, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.fillStyle = scary ? "#ff8866" : "#eef4ff";
  ctx2.globalAlpha = 0.95;
  ctx2.beginPath();
  ctx2.arc(-4.5 + eyeDirX * 0.8, -4.5 + eyeDirY * 0.6, 1.5, 0, Math.PI * 2);
  ctx2.arc(4.5 + eyeDirX * 0.8, -4.5 + eyeDirY * 0.6, 1.5, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.globalAlpha = 1;
  if (entity.hp !== void 0 && entity.maxHp !== void 0) {
    drawHpBar(ctx2, 0, -20 - bob, entity.hp, entity.maxHp);
  }
  ctx2.restore();
}

// client/src/rendering/StagRenderer.ts
function drawStag(ctx2, x, y, entity) {
  ctx2.save();
  ctx2.translate(x, y);
  const facing = entity.facing ?? 0;
  const time = Date.now() / 1e3;
  ctx2.rotate(facing);
  const strideFps = 6;
  const { frame: sFrame, sub: sSub } = getFrameInfo(time, strideFps, 4);
  const sBob = keyLerp(STAG_STRIDE.bodyBob, sFrame, sSub);
  const sStretchX = keyLerp(STAG_STRIDE.bodyStretchX, sFrame, sSub);
  const sStretchY = keyLerp(STAG_STRIDE.bodyStretchY, sFrame, sSub);
  const sFLeg = keyLerp(STAG_STRIDE.frontLegFwd, sFrame, sSub);
  const sBLeg = keyLerp(STAG_STRIDE.backLegFwd, sFrame, sSub);
  const sHead = keyLerp(STAG_STRIDE.headDip, sFrame, sSub);
  const sFlame = keyLerp(STAG_STRIDE.flamePulse, sFrame, sSub);
  const contactPulse = sFrame === 0 || sFrame === 2 ? 0.06 : 0;
  ctx2.globalAlpha = 0.1 + contactPulse;
  ctx2.fillStyle = "#ff4400";
  ctx2.beginPath();
  ctx2.arc(0, 0, 32, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.globalAlpha = 0.05 + contactPulse * 0.5;
  ctx2.fillStyle = "#ff6600";
  ctx2.beginPath();
  ctx2.arc(0, 0, 38, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.globalAlpha = 1;
  ctx2.fillStyle = "#ff4400";
  for (let i = 0; i < 5; i++) {
    const eFrame = stepFrame(time + i * 0.4, 3, 4);
    const angles = [0.3, 1.1, 2.2, 3.5, 4.8];
    const ex = Math.cos(angles[i] + eFrame * 0.5) * 20;
    const ey = Math.sin(angles[i] + eFrame * 0.7) * 14;
    ctx2.globalAlpha = eFrame === 0 ? 0.5 : 0.2;
    ctx2.beginPath();
    ctx2.arc(ex, ey, 1.5, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = 1;
  ctx2.strokeStyle = "#5c2f0f";
  ctx2.lineWidth = 2.5;
  ctx2.lineCap = "round";
  const fKneeX = 8 + sFLeg * 0.5;
  const fFootX = 6 + sFLeg;
  ctx2.beginPath();
  ctx2.moveTo(6, 10);
  ctx2.lineTo(fKneeX, 14 + sBob * 0.5);
  ctx2.lineTo(fFootX, 18 + sBob);
  ctx2.moveTo(12, 10);
  ctx2.lineTo(fKneeX + 5, 14 - sBob * 0.3);
  ctx2.lineTo(fFootX + 5, 18 - sBob * 0.5);
  ctx2.stroke();
  const bKneeX = -8 + sBLeg * 0.5;
  const bFootX = -10 + sBLeg;
  ctx2.beginPath();
  ctx2.moveTo(-4, 11);
  ctx2.lineTo(bKneeX, 14 - sBob * 0.5);
  ctx2.lineTo(bFootX, 18 - sBob);
  ctx2.moveTo(-10, 10);
  ctx2.lineTo(bKneeX - 5, 14 + sBob * 0.3);
  ctx2.lineTo(bFootX - 5, 18 + sBob * 0.5);
  ctx2.stroke();
  ctx2.fillStyle = "#3a1a08";
  ctx2.beginPath();
  ctx2.arc(fFootX, 18 + sBob, 2, 0, Math.PI * 2);
  ctx2.arc(fFootX + 5, 18 - sBob * 0.5, 2, 0, Math.PI * 2);
  ctx2.arc(bFootX, 18 - sBob, 2, 0, Math.PI * 2);
  ctx2.arc(bFootX - 5, 18 + sBob * 0.5, 2, 0, Math.PI * 2);
  ctx2.fill();
  if (sFrame === 0 || sFrame === 2) {
    ctx2.globalAlpha = 0.15;
    ctx2.fillStyle = "#aa7744";
    const dustX = sFrame === 0 ? fFootX : bFootX;
    ctx2.beginPath();
    ctx2.arc(dustX, 20 + sBob, 4, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.globalAlpha = 1;
  }
  ctx2.save();
  ctx2.translate(0, sBob);
  ctx2.scale(sStretchX, sStretchY);
  ctx2.fillStyle = "#6b3410";
  ctx2.beginPath();
  ctx2.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.strokeStyle = "#ff440044";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.moveTo(-6, -4);
  ctx2.lineTo(-2, 2);
  ctx2.lineTo(4, -1);
  ctx2.moveTo(2, 3);
  ctx2.lineTo(8, 5);
  ctx2.stroke();
  ctx2.fillStyle = "#7a3c14";
  ctx2.beginPath();
  ctx2.ellipse(2, -3, 10, 5, 0.2, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  const neckY = sBob + sHead;
  ctx2.fillStyle = "#7a3c14";
  ctx2.beginPath();
  ctx2.ellipse(14 * sStretchX, -2 + neckY, 7, 6, -0.3, 0, 0, Math.PI * 2);
  ctx2.fill();
  const headX = 22 * sStretchX;
  const headY = -2 + neckY + sHead;
  ctx2.fillStyle = "#8b4513";
  ctx2.beginPath();
  ctx2.ellipse(headX, headY, 6, 5, 0, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = "#6b3410";
  ctx2.beginPath();
  ctx2.ellipse(headX + 5, headY + 1, 3, 3, 0, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = "#3a1a08";
  ctx2.beginPath();
  ctx2.arc(headX + 6.5, headY, 1, 0, Math.PI * 2);
  ctx2.arc(headX + 6.5, headY + 2, 1, 0, Math.PI * 2);
  ctx2.fill();
  const smokeFrame = stepFrame(time, 5, 3);
  ctx2.globalAlpha = 0.25 - smokeFrame * 0.06;
  ctx2.strokeStyle = "#aa4400";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.moveTo(headX + 8, headY);
  ctx2.lineTo(headX + 10 + smokeFrame * 3, headY - 2 - smokeFrame * 2);
  ctx2.stroke();
  ctx2.globalAlpha = 1;
  ctx2.strokeStyle = "#d4a055";
  ctx2.lineWidth = 2.5;
  ctx2.lineCap = "round";
  const antlerBaseX = headX - 3;
  const antlerBaseY = headY;
  ctx2.beginPath();
  ctx2.moveTo(antlerBaseX, antlerBaseY - 4);
  ctx2.lineTo(antlerBaseX - 5, antlerBaseY - 18);
  ctx2.lineTo(antlerBaseX - 9, antlerBaseY - 26);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(antlerBaseX - 5, antlerBaseY - 18);
  ctx2.lineTo(antlerBaseX - 1, antlerBaseY - 24);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(antlerBaseX - 3, antlerBaseY - 12);
  ctx2.lineTo(antlerBaseX - 9, antlerBaseY - 16);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(antlerBaseX, antlerBaseY + 4);
  ctx2.lineTo(antlerBaseX - 5, antlerBaseY + 18);
  ctx2.lineTo(antlerBaseX - 9, antlerBaseY + 26);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(antlerBaseX - 5, antlerBaseY + 18);
  ctx2.lineTo(antlerBaseX - 1, antlerBaseY + 24);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(antlerBaseX - 3, antlerBaseY + 12);
  ctx2.lineTo(antlerBaseX - 9, antlerBaseY + 16);
  ctx2.stroke();
  const tipGlow = sFrame % 2 === 0 ? 0.5 : 0.3;
  ctx2.globalAlpha = tipGlow;
  ctx2.fillStyle = "#ff6600";
  ctx2.beginPath();
  ctx2.arc(antlerBaseX - 9, antlerBaseY - 26, 2.5, 0, Math.PI * 2);
  ctx2.arc(antlerBaseX - 9, antlerBaseY + 26, 2.5, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.globalAlpha = 1;
  ctx2.fillStyle = "#ff6600";
  ctx2.shadowColor = "#ff4400";
  ctx2.shadowBlur = 8;
  ctx2.beginPath();
  ctx2.arc(headX + 1, headY - 3, 2.2, 0, Math.PI * 2);
  ctx2.arc(headX + 1, headY + 3, 2.2, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.shadowBlur = 0;
  ctx2.fillStyle = "#ffcc00";
  ctx2.beginPath();
  ctx2.arc(headX + 1.5, headY - 3, 1, 0, Math.PI * 2);
  ctx2.arc(headX + 1.5, headY + 3, 1, 0, Math.PI * 2);
  ctx2.fill();
  const flameScale = sFlame;
  ctx2.save();
  ctx2.translate(-18 * sStretchX, sBob);
  ctx2.scale(flameScale, flameScale);
  const flameFrame = stepFrame(time, 8, 3);
  const flameOffsets = [[0, -2, 3], [1, -3, 1], [-1, -1, 2]][flameFrame];
  ctx2.fillStyle = "#ff4400";
  ctx2.globalAlpha = 0.8;
  ctx2.beginPath();
  ctx2.moveTo(0, -2);
  ctx2.lineTo(-8 + flameOffsets[0], -4 + flameOffsets[1]);
  ctx2.lineTo(-5, 0 + flameOffsets[2]);
  ctx2.lineTo(-9 + flameOffsets[0], 3 + flameOffsets[1]);
  ctx2.lineTo(0, 2);
  ctx2.fill();
  ctx2.fillStyle = "#ffaa22";
  ctx2.globalAlpha = 0.7;
  ctx2.beginPath();
  ctx2.moveTo(0, -1);
  ctx2.lineTo(-4 + flameOffsets[0], -2 + flameOffsets[2] * 0.5);
  ctx2.lineTo(-2, 0);
  ctx2.lineTo(-4 + flameOffsets[0], 1 + flameOffsets[1] * 0.5);
  ctx2.lineTo(0, 1);
  ctx2.fill();
  ctx2.globalAlpha = 1;
  ctx2.restore();
  ctx2.restore();
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.fillStyle = "#ff4400";
  ctx2.font = "bold 12px sans-serif";
  ctx2.textAlign = "center";
  ctx2.fillText("BOSS", 0, -34);
  if (entity.hp !== void 0 && entity.maxHp !== void 0) {
    const w = 44;
    const h = 4;
    const ratio = Math.max(0, entity.hp / entity.maxHp);
    ctx2.fillStyle = "rgba(0,0,0,0.7)";
    ctx2.fillRect(-w / 2, -30, w, h);
    ctx2.fillStyle = ratio > 0.5 ? "#ff6600" : ratio > 0.25 ? "#ff3300" : "#ff0000";
    ctx2.fillRect(-w / 2, -30, w * ratio, h);
  }
  ctx2.restore();
}

// client/src/audio/SoundEngine.ts
var ctx = null;
var masterGain = null;
var muted = false;
var volume = 0.3;
function getCtx() {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function out() {
  getCtx();
  return masterGain;
}
function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = volume;
}
function setMuted(m) {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : volume;
}
function initAudio() {
  getCtx();
}
var noiseBuffer = null;
function getNoise() {
  const c = getCtx();
  if (!c) return new AudioBuffer({ length: 1, sampleRate: 44100 });
  if (noiseBuffer) return noiseBuffer;
  const len = c.sampleRate * 0.5;
  noiseBuffer = c.createBuffer(1, len, c.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}
function playPunch() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(4e3, t);
  hp.frequency.exponentialRampToValueAtTime(6e3, t + 0.04);
  hp.frequency.exponentialRampToValueAtTime(2e3, t + 0.12);
  hp.Q.value = 0.8;
  const gn = c.createGain();
  gn.gain.setValueAtTime(0.3, t);
  gn.gain.exponentialRampToValueAtTime(1e-3, t + 0.14);
  noise.connect(hp).connect(gn).connect(o);
  noise.start(t);
  noise.stop(t + 0.15);
  for (const [freq, vol, delay] of [[2637, 0.08, 0], [4185, 0.06, 5e-3], [5588, 0.04, 0.01]]) {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + delay);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + delay + 0.1);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + delay + 5e-3);
    g.gain.exponentialRampToValueAtTime(1e-3, t + delay + 0.12);
    osc.connect(g).connect(o);
    osc.start(t);
    osc.stop(t + delay + 0.13);
  }
}
function playArrowShoot() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(2e3, t);
  filter.frequency.exponentialRampToValueAtTime(4e3, t + 0.06);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.08);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.08);
}
function playLunge() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
  filter.frequency.exponentialRampToValueAtTime(300, t + 0.2);
  filter.Q.value = 1;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.25);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.25);
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, t + 0.1);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0, t);
  g2.gain.setValueAtTime(0.35, t + 0.1);
  g2.gain.exponentialRampToValueAtTime(1e-3, t + 0.3);
  osc.connect(g2).connect(o);
  osc.start(t);
  osc.stop(t + 0.3);
}
function playShield() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.15);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.2);
  osc.connect(gain).connect(o);
  osc.start(t);
  osc.stop(t + 0.2);
}
function playParry() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc1 = c.createOscillator();
  osc1.type = "square";
  osc1.frequency.setValueAtTime(1200, t);
  const osc2 = c.createOscillator();
  osc2.type = "square";
  osc2.frequency.setValueAtTime(1500, t);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.15);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(o);
  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 0.15);
  osc2.stop(t + 0.15);
}
function playDash() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(1e3, t);
  filter.frequency.exponentialRampToValueAtTime(3e3, t + 0.1);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.12);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.12);
}
function playBuildPlace() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.06);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.08);
  osc.connect(gain).connect(o);
  osc.start(t);
  osc.stop(t + 0.08);
}
function playBuildDestroy() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2e3, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.2);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.2);
}
function playDeath() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.4);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.5);
  osc.connect(gain).connect(o);
  osc.start(t);
  osc.stop(t + 0.5);
}
function playKill() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const freqs = [600, 800, 1e3];
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, t + i * 0.06);
    gain.gain.setValueAtTime(0.12, t + i * 0.06 + 0.01);
    gain.gain.exponentialRampToValueAtTime(1e-3, t + i * 0.06 + 0.15);
    osc.connect(gain).connect(o);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.15);
  });
}
function playSourceEarn() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.setValueAtTime(1600, t + 0.03);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.1);
  osc.connect(gain).connect(o);
  osc.start(t);
  osc.stop(t + 0.1);
}
function playGhostWindup() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.linearRampToValueAtTime(400, t + 0.25);
  osc.frequency.linearRampToValueAtTime(220, t + 0.5);
  const lfo = c.createOscillator();
  lfo.frequency.value = 6;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 20;
  lfo.connect(lfoGain).connect(osc.frequency);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.2);
  gain.gain.linearRampToValueAtTime(0.08, t + 0.4);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.5);
  osc.connect(gain).connect(o);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.5);
  lfo.stop(t + 0.5);
}
function playGhostProjectile() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, t);
  const lfo = c.createOscillator();
  lfo.frequency.value = 8;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 50;
  lfo.connect(lfoGain).connect(osc.frequency);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.3);
  osc.connect(gain).connect(o);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.3);
  lfo.stop(t + 0.3);
}
function playLionPounce() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(500, t);
  filter.Q.value = 5;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.2);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.2);
}
function playExplosion() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1e3, t);
  filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.4);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.4);
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.3, t);
  g2.gain.exponentialRampToValueAtTime(1e-3, t + 0.35);
  osc.connect(g2).connect(o);
  osc.start(t);
  osc.stop(t + 0.35);
}
function playLionScratch() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1500, t);
  filter.frequency.exponentialRampToValueAtTime(600, t + 0.06);
  filter.Q.value = 3;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.08);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.08);
}
function playStagFireBreath() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(600, t);
  filter.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
  filter.frequency.exponentialRampToValueAtTime(400, t + 0.4);
  filter.Q.value = 1.5;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.setValueAtTime(0.3, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.5);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.5);
}
function playStagCharge() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(60, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.4);
  const g1 = c.createGain();
  g1.gain.setValueAtTime(0.2, t);
  g1.gain.exponentialRampToValueAtTime(1e-3, t + 0.4);
  osc.connect(g1).connect(o);
  osc.start(t);
  osc.stop(t + 0.4);
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(800, t + 0.2);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.15, t);
  g2.gain.exponentialRampToValueAtTime(1e-3, t + 0.35);
  noise.connect(filter).connect(g2).connect(o);
  noise.start(t);
  noise.stop(t + 0.35);
}
function playStagMelee() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.15);
  osc.connect(gain).connect(o);
  osc.start(t);
  osc.stop(t + 0.15);
}
function playPlayerHurt() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = getNoise();
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + 0.1);
  filter.Q.value = 5;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.12);
  noise.connect(filter).connect(gain).connect(o);
  noise.start(t);
  noise.stop(t + 0.12);
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.15, t);
  g2.gain.exponentialRampToValueAtTime(1e-3, t + 0.12);
  osc.connect(g2).connect(o);
  osc.start(t);
  osc.stop(t + 0.12);
}
function playDenied() {
  const c = getCtx();
  const o = out();
  if (!c || !o) return;
  const t = c.currentTime;
  const osc1 = c.createOscillator();
  osc1.type = "square";
  osc1.frequency.setValueAtTime(200, t);
  osc1.frequency.exponentialRampToValueAtTime(80, t + 0.1);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.15);
  osc1.connect(gain).connect(o);
  osc1.start(t);
  osc1.stop(t + 0.15);
  const osc2 = c.createOscillator();
  osc2.type = "square";
  osc2.frequency.setValueAtTime(120, t + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(50, t + 0.15);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0, t);
  g2.gain.setValueAtTime(0.25, t + 0.05);
  g2.gain.exponentialRampToValueAtTime(1e-3, t + 0.2);
  osc2.connect(g2).connect(o);
  osc2.start(t);
  osc2.stop(t + 0.2);
}

// client/src/rendering/EntityRenderer.ts
var animTimers = /* @__PURE__ */ new Map();
var lastAnim = /* @__PURE__ */ new Map();
var lastEnemyAnim = /* @__PURE__ */ new Map();
var lastDashAnim = /* @__PURE__ */ new Map();
var dashTrails = [];
var DASH_TRAIL_DURATION = 300;
var spawnTimers = /* @__PURE__ */ new Map();
var deathTimers = /* @__PURE__ */ new Map();
var knownEntities = /* @__PURE__ */ new Set();
var firstDrawTime = 0;
var healParticles = [];
var lastSelfHp = -1;
var SPAWN_DURATION = 500;
var DEATH_DURATION = 600;
function drawEntities(ctx2, state2, camX, camY, screenW, screenH) {
  const now = Date.now();
  if (firstDrawTime === 0) firstDrawTime = now;
  const pastGracePeriod = now - firstDrawTime > 1500;
  const currentIds = /* @__PURE__ */ new Set();
  const margin = 80;
  const hasViewport = camX !== void 0 && camY !== void 0 && screenW !== void 0 && screenH !== void 0;
  const viewLeft = hasViewport ? camX - screenW / 2 - margin : -Infinity;
  const viewRight = hasViewport ? camX + screenW / 2 + margin : Infinity;
  const viewTop = hasViewport ? camY - screenH / 2 - margin : -Infinity;
  const viewBottom = hasViewport ? camY + screenH / 2 + margin : Infinity;
  for (const [id, entity] of state2.entities) {
    if (entity.kind === "building" || entity.kind === "projectile") continue;
    currentIds.add(id);
    if (!knownEntities.has(id) && (entity.kind === "lion" || entity.kind === "ghost") && pastGracePeriod) {
      spawnTimers.set(id, now);
    }
    knownEntities.add(id);
    const pos = state2.getInterpolatedPos(id) ?? { x: entity.x, y: entity.y };
    if (hasViewport && (pos.x < viewLeft || pos.x > viewRight || pos.y < viewTop || pos.y > viewBottom)) {
      continue;
    }
    if (entity.kind === "player" && entity.anim === "dash") {
      const prev = lastDashAnim.get(id);
      if (prev !== "dash") {
        dashTrails.push({
          startX: pos.x,
          startY: pos.y,
          endX: pos.x,
          endY: pos.y,
          facing: entity.facing ?? 0,
          start: now
        });
      }
      const trail = dashTrails[dashTrails.length - 1];
      if (trail && now - trail.start < 150) {
        trail.endX = pos.x;
        trail.endY = pos.y;
      }
    }
    if (entity.kind === "player") lastDashAnim.set(id, entity.anim ?? "");
    if (entity.kind === "player") {
      drawPlayer(ctx2, pos.x, pos.y, entity, state2.partyMembers);
    } else if (entity.kind === "lion") {
      const spawnStart = spawnTimers.get(id);
      if (spawnStart) {
        const elapsed = now - spawnStart;
        if (elapsed < SPAWN_DURATION) {
          drawLionSpawn(ctx2, pos.x, pos.y, entity, elapsed / SPAWN_DURATION);
          continue;
        } else {
          spawnTimers.delete(id);
        }
      }
      drawLion(ctx2, pos.x, pos.y, entity);
      const lionAnim = entity.anim ?? "idle";
      const prevLionAnim = lastEnemyAnim.get(id) ?? "idle";
      if (lionAnim === "pounce" && prevLionAnim !== "pounce") playLionPounce();
      else if (lionAnim === "punch" && prevLionAnim !== "punch") playLionScratch();
      lastEnemyAnim.set(id, lionAnim);
    } else if (entity.kind === "ghost") {
      const spawnStart = spawnTimers.get(id);
      if (spawnStart) {
        const elapsed = now - spawnStart;
        if (elapsed < SPAWN_DURATION) {
          drawGhostSpawn(ctx2, pos.x, pos.y, entity, elapsed / SPAWN_DURATION);
          continue;
        } else {
          spawnTimers.delete(id);
        }
      }
      drawGhost(ctx2, pos.x, pos.y, entity);
      const ghostAnim = entity.anim ?? "idle";
      const prevGhostAnim = lastEnemyAnim.get(id) ?? "idle";
      if (ghostAnim === "windup" && prevGhostAnim !== "windup") playGhostWindup();
      else if (ghostAnim === "shoot" && prevGhostAnim !== "shoot") playGhostProjectile();
      lastEnemyAnim.set(id, ghostAnim);
    } else if (entity.kind === "stag") {
      drawStag(ctx2, pos.x, pos.y, entity);
      const stagAnim = entity.anim ?? "idle";
      const prevStagAnim = lastEnemyAnim.get(id) ?? "idle";
      if (stagAnim === "dash" && prevStagAnim !== "dash") playStagCharge();
      else if (stagAnim === "shoot" && prevStagAnim !== "shoot") playStagFireBreath();
      else if (stagAnim === "punch" && prevStagAnim !== "punch") playStagMelee();
      lastEnemyAnim.set(id, stagAnim);
    }
  }
  for (const id of knownEntities) {
    if (!currentIds.has(id) && !deathTimers.has(id)) {
      knownEntities.delete(id);
      spawnTimers.delete(id);
    }
  }
  for (const [id, death] of deathTimers) {
    const elapsed = now - death.start;
    if (elapsed > DEATH_DURATION) {
      deathTimers.delete(id);
      continue;
    }
    const progress = elapsed / DEATH_DURATION;
    if (death.kind === "lion") {
      drawLionDeath(ctx2, death.x, death.y, progress);
    } else if (death.kind === "ghost") {
      drawGhostDeath(ctx2, death.x, death.y, progress);
    }
  }
  for (let i = dashTrails.length - 1; i >= 0; i--) {
    const trail = dashTrails[i];
    const elapsed = now - trail.start;
    if (elapsed > DASH_TRAIL_DURATION) {
      dashTrails.splice(i, 1);
      continue;
    }
    const t = elapsed / DASH_TRAIL_DURATION;
    const alpha = 1 - t;
    ctx2.save();
    ctx2.globalAlpha = alpha * 0.6;
    if (t < 0.5) {
      const sparkAlpha = (0.5 - t) * 2;
      ctx2.globalAlpha = sparkAlpha * 0.8;
      for (let s = 0; s < 6; s++) {
        const angle = s / 6 * Math.PI * 2 + t * 4;
        const dist = 4 + t * 20;
        const sx = trail.startX + Math.cos(angle) * dist;
        const sy = trail.startY + Math.sin(angle) * dist;
        ctx2.fillStyle = "#fff";
        ctx2.beginPath();
        ctx2.arc(sx, sy, 1.5 * (1 - t), 0, Math.PI * 2);
        ctx2.fill();
      }
    }
    const dx = trail.endX - trail.startX;
    const dy = trail.endY - trail.startY;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      const nx = dx / len;
      const ny = dy / len;
      ctx2.globalAlpha = alpha * 0.5;
      ctx2.strokeStyle = "#fff";
      ctx2.lineWidth = 1.5;
      for (let line = 0; line < 3; line++) {
        const offset = (line - 1) * 6;
        const perpX = -ny * offset;
        const perpY = nx * offset;
        const startFade = t * 0.6;
        const lx1 = trail.startX + perpX + dx * startFade;
        const ly1 = trail.startY + perpY + dy * startFade;
        const lx2 = trail.startX + perpX + dx * Math.min(1, startFade + 0.4);
        const ly2 = trail.startY + perpY + dy * Math.min(1, startFade + 0.4);
        ctx2.beginPath();
        ctx2.moveTo(lx1, ly1);
        ctx2.lineTo(lx2, ly2);
        ctx2.stroke();
      }
    }
    ctx2.restore();
  }
  drawSelf(ctx2, state2);
}
function triggerDeathAnimation(x, y, kind) {
  const id = -(Date.now() + Math.random() * 1e3);
  deathTimers.set(id, { start: Date.now(), x, y, kind });
}
function drawSelf(ctx2, state2) {
  if (state2.selfDead) {
    lastSelfHp = -1;
    return;
  }
  if (!state2.selfColors) return;
  if (lastSelfHp >= 0 && state2.selfHp > lastSelfHp && state2.selfHp < state2.selfMaxHp) {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      healParticles.push({
        x: state2.selfPos.x + (Math.random() - 0.5) * 16,
        y: state2.selfPos.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * (0.3 + Math.random() * 0.5),
        vy: -0.5 - Math.random() * 0.8,
        life: 600 + Math.random() * 400,
        maxLife: 600 + Math.random() * 400,
        size: 1.5 + Math.random() * 2
      });
    }
  }
  if (state2.selfHp > lastSelfHp && state2.selfHp >= state2.selfMaxHp && lastSelfHp > 0 && lastSelfHp < state2.selfMaxHp) {
    for (let i = 0; i < 2; i++) {
      healParticles.push({
        x: state2.selfPos.x + (Math.random() - 0.5) * 16,
        y: state2.selfPos.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.6 - Math.random() * 0.6,
        life: 500 + Math.random() * 300,
        maxLife: 500 + Math.random() * 300,
        size: 1.5 + Math.random() * 1.5
      });
    }
  }
  lastSelfHp = state2.selfHp;
  for (let i = healParticles.length - 1; i >= 0; i--) {
    const p = healParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 16;
    if (p.life <= 0) {
      healParticles.splice(i, 1);
      continue;
    }
    const alpha = p.life / p.maxLife * 0.7;
    ctx2.save();
    ctx2.globalAlpha = alpha;
    ctx2.fillStyle = "#7ec87e";
    ctx2.shadowColor = "#7ec87e";
    ctx2.shadowBlur = 4;
    ctx2.beginPath();
    ctx2.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.restore();
  }
  const selfEntity = {
    id: state2.myId,
    kind: "player",
    x: state2.selfPos.x,
    y: state2.selfPos.y,
    hp: state2.selfHp,
    maxHp: state2.selfMaxHp,
    colors: state2.selfColors,
    username: state2.selfUsername,
    facing: state2.selfFacing,
    anim: state2.selfAnim
  };
  const selfDashPrev = lastDashAnim.get(state2.myId);
  if (state2.selfAnim === "dash" && selfDashPrev !== "dash") {
    dashTrails.push({
      startX: state2.selfPos.x,
      startY: state2.selfPos.y,
      endX: state2.selfPos.x,
      endY: state2.selfPos.y,
      facing: state2.selfFacing,
      start: Date.now()
    });
  }
  if (state2.selfAnim === "dash") {
    const trail = dashTrails[dashTrails.length - 1];
    if (trail && Date.now() - trail.start < 150) {
      trail.endX = state2.selfPos.x;
      trail.endY = state2.selfPos.y;
    }
  }
  lastDashAnim.set(state2.myId, state2.selfAnim);
  drawPlayer(ctx2, state2.selfPos.x, state2.selfPos.y, selfEntity, state2.partyMembers);
  if (state2.selfShieldActive) {
    drawShield(ctx2, state2.selfPos.x, state2.selfPos.y);
  }
  if (state2.selfParryActive) {
    drawParryEffect(ctx2, state2.selfPos.x, state2.selfPos.y, state2.selfFacing);
  }
  drawAttackEffect(ctx2, state2.selfPos.x, state2.selfPos.y, state2.selfAnim, state2.selfFacing, state2.myId);
}
function drawPlayer(ctx2, x, y, entity, partyMembers = []) {
  const colors2 = entity.colors || { skin: "#e0ac69", shirt: "#3b82f6", pants: "#1e3a5f" };
  const size = PLAYER_SIZE;
  const half = size / 2;
  const time = Date.now() / 1e3;
  const facing = entity.facing ?? 0;
  const isWalking = entity.anim === "walk";
  ctx2.save();
  ctx2.translate(x, y);
  if (entity.anim === "dead") {
    ctx2.globalAlpha = 0.3;
  }
  const walkFps = 8;
  const { frame: wFrame, sub: wSub } = getFrameInfo(time, walkFps, 4);
  const bodyBob = isWalking ? keyLerp(PLAYER_WALK.bodyBob, wFrame, wSub) : 0;
  const leftLegOff = isWalking ? keyLerp(PLAYER_WALK.leftLegY, wFrame, wSub) : 0;
  const rightLegOff = isWalking ? keyLerp(PLAYER_WALK.rightLegY, wFrame, wSub) : 0;
  const leftArmOff = isWalking ? keyLerp(PLAYER_WALK.leftArmY, wFrame, wSub) : 0;
  const rightArmOff = isWalking ? keyLerp(PLAYER_WALK.rightArmY, wFrame, wSub) : 0;
  const tilt = isWalking ? keyLerp(PLAYER_WALK.torsoTilt, wFrame, wSub) : 0;
  const idleFrame = stepFrame(time, 2, 2);
  const breathe = isWalking ? 0 : idleFrame === 0 ? 0 : -0.5;
  ctx2.fillStyle = "rgba(0,0,0,0.12)";
  ctx2.beginPath();
  ctx2.ellipse(0, half + 2 + bodyBob * 0.3, 10 + (isWalking ? 1 : 0), 4, 0, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = colors2.pants;
  const legW = 6;
  const legH = half - 2;
  ctx2.fillRect(-half + 2, 2 + leftLegOff * 0.4 + bodyBob, legW, legH - leftLegOff * 0.2);
  ctx2.fillRect(half - legW - 2, 2 + rightLegOff * 0.4 + bodyBob, legW, legH - rightLegOff * 0.2);
  ctx2.fillStyle = darkenColor(colors2.pants, 0.3);
  ctx2.fillRect(-half + 2, legH + leftLegOff * 0.2 + bodyBob, legW, 3);
  ctx2.fillRect(half - legW - 2, legH + rightLegOff * 0.2 + bodyBob, legW, 3);
  ctx2.save();
  ctx2.rotate(tilt);
  ctx2.translate(0, bodyBob + breathe);
  ctx2.fillStyle = colors2.shirt;
  ctx2.beginPath();
  ctx2.roundRect(-half, -half, size, half + 4, 2);
  ctx2.fill();
  ctx2.fillStyle = darkenColor(colors2.shirt, 0.15);
  ctx2.beginPath();
  ctx2.roundRect(-half, -half, size / 2, half + 4, [2, 0, 0, 2]);
  ctx2.fill();
  ctx2.strokeStyle = darkenColor(colors2.shirt, 0.2);
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.moveTo(-3, -half);
  ctx2.lineTo(0, -half + 4);
  ctx2.lineTo(3, -half);
  ctx2.stroke();
  ctx2.fillStyle = colors2.skin;
  ctx2.beginPath();
  ctx2.arc(0, -half - 5, 7, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = darkenColor(colors2.skin, 0.35);
  ctx2.beginPath();
  ctx2.arc(0, -half - 9, 5, Math.PI, 0);
  ctx2.fill();
  const eyeOffX = Math.cos(facing) * 2;
  const eyeOffY = Math.sin(facing) * 1.5;
  ctx2.fillStyle = "#f0f0f0";
  ctx2.beginPath();
  ctx2.ellipse(-2.5 + eyeOffX * 0.3, -half - 5 + eyeOffY * 0.3, 2.2, 2, 0, 0, Math.PI * 2);
  ctx2.ellipse(2.5 + eyeOffX * 0.3, -half - 5 + eyeOffY * 0.3, 2.2, 2, 0, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = "#1a1a2e";
  ctx2.beginPath();
  ctx2.arc(-2.5 + eyeOffX, -half - 5 + eyeOffY, 1.2, 0, Math.PI * 2);
  ctx2.arc(2.5 + eyeOffX, -half - 5 + eyeOffY, 1.2, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  const shootTimer = animTimers.get(entity.id);
  const hideSword = shootTimer?.type === "shoot" && Date.now() - shootTimer.start < 500;
  if (entity.facing !== void 0 && !hideSword) {
    const gripDist = 3;
    const gripX = Math.cos(entity.facing) * gripDist;
    const gripY = Math.sin(entity.facing) * gripDist;
    const shoulderY = bodyBob + breathe - 2;
    const leftShoulderX = -half - 2;
    const rightShoulderX = half + 2;
    ctx2.strokeStyle = colors2.shirt;
    ctx2.lineWidth = 4;
    ctx2.lineCap = "round";
    ctx2.beginPath();
    ctx2.moveTo(leftShoulderX, shoulderY);
    ctx2.lineTo(gripX - 1, gripY);
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.moveTo(rightShoulderX, shoulderY);
    ctx2.lineTo(gripX + 1, gripY);
    ctx2.stroke();
    ctx2.fillStyle = colors2.skin;
    ctx2.beginPath();
    ctx2.arc(gripX - 1, gripY, 2.5, 0, Math.PI * 2);
    ctx2.arc(gripX + 1, gripY + 1, 2.5, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.save();
    ctx2.rotate(entity.facing);
    ctx2.fillStyle = "#8b7333";
    ctx2.beginPath();
    ctx2.arc(-2, 0, 2.5, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = "#5c4033";
    ctx2.fillRect(-1, -2, 6, 4);
    ctx2.strokeStyle = "#4a3328";
    ctx2.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      ctx2.beginPath();
      ctx2.moveTo(1 + i * 2, -2);
      ctx2.lineTo(1 + i * 2, 2);
      ctx2.stroke();
    }
    ctx2.fillStyle = "#8b7333";
    ctx2.beginPath();
    ctx2.moveTo(4, -5);
    ctx2.lineTo(6, -4);
    ctx2.lineTo(6, 4);
    ctx2.lineTo(4, 5);
    ctx2.lineTo(5, 0);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = "#c0c8d8";
    ctx2.beginPath();
    ctx2.moveTo(6, -2.5);
    ctx2.lineTo(14, -2);
    ctx2.lineTo(19, -1);
    ctx2.lineTo(21, 0);
    ctx2.lineTo(19, 1);
    ctx2.lineTo(14, 2);
    ctx2.lineTo(6, 2.5);
    ctx2.closePath();
    ctx2.fill();
    ctx2.strokeStyle = "rgba(150, 160, 180, 0.6)";
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(7, 0);
    ctx2.lineTo(17, 0);
    ctx2.stroke();
    ctx2.strokeStyle = "rgba(255,255,255,0.5)";
    ctx2.lineWidth = 0.5;
    ctx2.beginPath();
    ctx2.moveTo(8, -1.5);
    ctx2.lineTo(20, 0);
    ctx2.stroke();
    ctx2.restore();
  }
  ctx2.globalAlpha = 1;
  if (entity.anim === "shield") {
    drawShield(ctx2, 0, 0);
  }
  if (entity.anim === "parry") {
    drawParryEffect(ctx2, 0, 0, entity.facing);
  }
  if (entity.username) {
    const isPartyMember = partyMembers.length > 0 && partyMembers.includes(entity.username);
    ctx2.fillStyle = isPartyMember ? "#4488ff" : "#fff";
    ctx2.font = "11px sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText(entity.username, 0, -half - 16);
  }
  if (entity.hp !== void 0 && entity.maxHp !== void 0 && entity.hp < entity.maxHp) {
    drawHpBar(ctx2, 0, -half - 26, entity.hp, entity.maxHp);
  }
  ctx2.restore();
  drawAttackEffect(ctx2, x, y, entity.anim ?? "idle", entity.facing ?? 0, entity.id);
}
function drawShield(ctx2, x, y) {
  ctx2.save();
  ctx2.translate(x, y);
  const time = Date.now() / 300;
  const pulse = 1 + Math.sin(time) * 0.08;
  ctx2.globalAlpha = 0.25;
  ctx2.strokeStyle = "#66bbff";
  ctx2.lineWidth = 3;
  ctx2.beginPath();
  ctx2.arc(0, 0, 22 * pulse, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.globalAlpha = 0.1;
  ctx2.fillStyle = "#88ccff";
  ctx2.beginPath();
  ctx2.arc(0, 0, 22 * pulse, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.globalAlpha = 0.15;
  ctx2.strokeStyle = "#aaddff";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.arc(0, 0, 16 * pulse, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.globalAlpha = 1;
  ctx2.restore();
}
function drawParryEffect(ctx2, x, y, facing) {
  ctx2.save();
  ctx2.translate(x, y);
  const time = Date.now();
  const spinT = time % 200 / 200;
  const spinAngle = spinT * Math.PI * 2;
  const radius = 20;
  ctx2.globalAlpha = 0.3;
  ctx2.strokeStyle = "#ffdd44";
  ctx2.lineWidth = 4;
  ctx2.shadowColor = "#ffaa00";
  ctx2.shadowBlur = 8;
  ctx2.beginPath();
  ctx2.arc(0, 0, radius, spinAngle - Math.PI * 1.2, spinAngle);
  ctx2.stroke();
  ctx2.globalAlpha = 0.5;
  ctx2.strokeStyle = "#ffe888";
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.arc(0, 0, radius - 4, spinAngle - Math.PI * 0.8, spinAngle);
  ctx2.stroke();
  ctx2.save();
  ctx2.rotate(spinAngle);
  ctx2.globalAlpha = 0.85;
  ctx2.fillStyle = "#d0d8e8";
  ctx2.shadowBlur = 4;
  ctx2.shadowColor = "#ffffff";
  ctx2.beginPath();
  ctx2.moveTo(12, -3);
  ctx2.lineTo(22, -1);
  ctx2.lineTo(22, 1);
  ctx2.lineTo(12, 3);
  ctx2.closePath();
  ctx2.fill();
  ctx2.strokeStyle = "#ffffff";
  ctx2.lineWidth = 1;
  ctx2.globalAlpha = 0.7;
  ctx2.beginPath();
  ctx2.moveTo(14, -2);
  ctx2.lineTo(22, 0);
  ctx2.lineTo(14, 2);
  ctx2.stroke();
  ctx2.restore();
  ctx2.globalAlpha = 0.5;
  ctx2.fillStyle = "#ffe066";
  ctx2.shadowColor = "#ffaa00";
  ctx2.shadowBlur = 4;
  for (let i = 0; i < 6; i++) {
    const sparkAngle = spinAngle - i * 0.4;
    const sparkR = radius + 2 - i * 0.5;
    const sparkAlpha = 0.6 - i * 0.08;
    ctx2.globalAlpha = sparkAlpha;
    ctx2.beginPath();
    ctx2.arc(Math.cos(sparkAngle) * sparkR, Math.sin(sparkAngle) * sparkR, 1.5 - i * 0.1, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.shadowBlur = 0;
  ctx2.globalAlpha = 1;
  ctx2.restore();
}
function drawAttackEffect(ctx2, x, y, anim, facing, entityId) {
  const prev = lastAnim.get(entityId);
  if ((anim === "punch" || anim === "lunge" || anim === "shoot" || anim === "parry") && prev !== anim) {
    animTimers.set(entityId, { start: Date.now(), type: anim, facing });
  }
  lastAnim.set(entityId, anim);
  const timer = animTimers.get(entityId);
  if (!timer) return;
  const elapsed = Date.now() - timer.start;
  const animFacing = timer.facing;
  ctx2.save();
  ctx2.translate(x, y);
  if (timer.type === "punch") {
    const duration = 250;
    if (elapsed > duration) {
      animTimers.delete(entityId);
      ctx2.restore();
      return;
    }
    const progress = easeOutQuart(elapsed / duration);
    const alpha = 0.8 * (1 - progress);
    const swingAngle = animFacing - PUNCH_ARC / 2 + progress * PUNCH_ARC;
    const bladeLen = PUNCH_RANGE * (0.5 + progress * 0.5);
    ctx2.globalAlpha = alpha;
    ctx2.fillStyle = "rgba(220, 220, 255, 0.3)";
    ctx2.beginPath();
    ctx2.moveTo(0, 0);
    ctx2.arc(0, 0, bladeLen, animFacing - PUNCH_ARC / 2, swingAngle);
    ctx2.closePath();
    ctx2.fill();
    ctx2.save();
    ctx2.rotate(swingAngle);
    ctx2.fillStyle = "#c0c8d8";
    ctx2.beginPath();
    ctx2.moveTo(8, -2.5);
    ctx2.lineTo(bladeLen - 4, -3);
    ctx2.lineTo(bladeLen, 0);
    ctx2.lineTo(bladeLen - 4, 3);
    ctx2.lineTo(8, 2.5);
    ctx2.closePath();
    ctx2.fill();
    ctx2.strokeStyle = "rgba(150,160,180,0.6)";
    ctx2.lineWidth = 0.8;
    ctx2.beginPath();
    ctx2.moveTo(10, 0);
    ctx2.lineTo(bladeLen - 5, 0);
    ctx2.stroke();
    ctx2.strokeStyle = "rgba(255,255,255,0.7)";
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(10, -1.5);
    ctx2.lineTo(bladeLen - 2, 0);
    ctx2.stroke();
    ctx2.fillStyle = "#8b7333";
    ctx2.fillRect(6, -5, 3, 10);
    ctx2.fillRect(1, -2, 6, 4);
    ctx2.restore();
    ctx2.strokeStyle = "rgba(255, 255, 220, 0.8)";
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.arc(0, 0, bladeLen, swingAngle - 0.1, swingAngle + 0.1);
    ctx2.stroke();
  } else if (timer.type === "lunge") {
    const duration = 400;
    if (elapsed > duration) {
      animTimers.delete(entityId);
      ctx2.restore();
      return;
    }
    const progress = elapsed / duration;
    if (progress < 0.4) {
      const dashT = progress / 0.4;
      ctx2.globalAlpha = 0.5 * (1 - dashT);
      ctx2.strokeStyle = "rgba(255, 180, 80, 0.6)";
      ctx2.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const trailDist = 8 + i * 6;
        const spread = (i + 1) * 2;
        ctx2.beginPath();
        ctx2.moveTo(
          -Math.cos(animFacing) * trailDist - Math.sin(animFacing) * spread,
          -Math.sin(animFacing) * trailDist + Math.cos(animFacing) * spread
        );
        ctx2.lineTo(
          -Math.cos(animFacing) * trailDist + Math.sin(animFacing) * spread,
          -Math.sin(animFacing) * trailDist - Math.cos(animFacing) * spread
        );
        ctx2.stroke();
      }
    }
    if (progress >= 0.4) {
      const impactT = (progress - 0.4) / 0.6;
      const eased = easeOutQuart(impactT);
      const alpha = 0.7 * (1 - eased);
      const radius = LUNGE_AOE_RADIUS * (0.2 + eased * 0.8);
      ctx2.globalAlpha = alpha;
      ctx2.strokeStyle = "rgba(255, 120, 60, 0.9)";
      ctx2.lineWidth = 4 * (1 - eased);
      ctx2.beginPath();
      ctx2.arc(0, 0, radius, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.globalAlpha = alpha * 0.3;
      ctx2.fillStyle = "rgba(255, 160, 80, 0.5)";
      ctx2.beginPath();
      ctx2.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.globalAlpha = alpha * 0.6;
      ctx2.strokeStyle = "rgba(255, 200, 100, 0.6)";
      ctx2.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        ctx2.beginPath();
        ctx2.moveTo(Math.cos(a) * radius * 0.3, Math.sin(a) * radius * 0.3);
        ctx2.lineTo(Math.cos(a) * radius * 0.7, Math.sin(a) * radius * 0.7);
        ctx2.stroke();
      }
    }
  } else if (timer.type === "shoot") {
    const duration = 500;
    if (elapsed > duration) {
      animTimers.delete(entityId);
      ctx2.restore();
      return;
    }
    const progress = elapsed / duration;
    ctx2.save();
    ctx2.rotate(animFacing);
    if (progress < 0.3) {
      const drawT = progress / 0.3;
      const eased = easeOutQuart(drawT);
      ctx2.globalAlpha = eased * 0.8;
      ctx2.strokeStyle = "#8B6914";
      ctx2.lineWidth = 2.5;
      ctx2.beginPath();
      ctx2.arc(8, 0, 12, -0.8, 0.8);
      ctx2.stroke();
      const stringPull = eased * 6;
      ctx2.strokeStyle = "#ccccaa";
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(8 + Math.cos(-0.8) * 12, Math.sin(-0.8) * 12);
      ctx2.lineTo(8 - stringPull, 0);
      ctx2.lineTo(8 + Math.cos(0.8) * 12, Math.sin(0.8) * 12);
      ctx2.stroke();
      ctx2.fillStyle = "#8B6914";
      ctx2.fillRect(8 - stringPull, -0.5, 14 + stringPull, 1);
      ctx2.fillStyle = "#aab0c0";
      ctx2.beginPath();
      ctx2.moveTo(22, -2);
      ctx2.lineTo(25, 0);
      ctx2.lineTo(22, 2);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = "#cc4444";
      ctx2.beginPath();
      ctx2.moveTo(8 - stringPull + 2, -1.5);
      ctx2.lineTo(8 - stringPull, 0);
      ctx2.lineTo(8 - stringPull + 2, 1.5);
      ctx2.closePath();
      ctx2.fill();
    } else if (progress < 0.5) {
      const releaseT = (progress - 0.3) / 0.2;
      const eased = easeOutQuart(releaseT);
      ctx2.globalAlpha = 0.8;
      ctx2.strokeStyle = "#8B6914";
      ctx2.lineWidth = 2.5;
      ctx2.beginPath();
      ctx2.arc(8, 0, 12, -0.8, 0.8);
      ctx2.stroke();
      const vibrate = Math.sin(releaseT * Math.PI * 6) * 2 * (1 - eased);
      ctx2.strokeStyle = "#ccccaa";
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(8 + Math.cos(-0.8) * 12, Math.sin(-0.8) * 12);
      ctx2.lineTo(8 + vibrate, 0);
      ctx2.lineTo(8 + Math.cos(0.8) * 12, Math.sin(0.8) * 12);
      ctx2.stroke();
      ctx2.globalAlpha = (1 - eased) * 0.6;
      ctx2.fillStyle = "#ffeeaa";
      ctx2.beginPath();
      ctx2.arc(22, 0, 4 * (1 - eased), 0, Math.PI * 2);
      ctx2.fill();
    } else {
      const stowT = (progress - 0.5) / 0.5;
      const eased = easeOutQuart(stowT);
      ctx2.globalAlpha = (1 - eased) * 0.7;
      ctx2.strokeStyle = "#8B6914";
      ctx2.lineWidth = 2.5 * (1 - eased);
      ctx2.beginPath();
      ctx2.arc(8, 0, 12 * (1 - eased * 0.3), -0.8, 0.8);
      ctx2.stroke();
      ctx2.strokeStyle = "#ccccaa";
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(8 + Math.cos(-0.8) * 12 * (1 - eased * 0.3), Math.sin(-0.8) * 12 * (1 - eased * 0.3));
      ctx2.lineTo(8, 0);
      ctx2.lineTo(8 + Math.cos(0.8) * 12 * (1 - eased * 0.3), Math.sin(0.8) * 12 * (1 - eased * 0.3));
      ctx2.stroke();
    }
    ctx2.restore();
  } else if (timer.type === "parry") {
    const duration = 300;
    if (elapsed > duration) {
      animTimers.delete(entityId);
      ctx2.restore();
      return;
    }
  }
  ctx2.globalAlpha = 1;
  ctx2.restore();
}

// client/src/rendering/BuildingRenderer.ts
var BUILDING_COLORS = {
  wall: "#888888",
  gate: "#8B6914",
  turret: "#444466",
  bed: "#4466aa"
};
var hoveredBuildingOwner = null;
var hoveredBuildingX = 0;
var hoveredBuildingY = 0;
function drawBuildings(ctx2, state2, mouseWorldX, mouseWorldY) {
  hoveredBuildingOwner = null;
  for (const [id, entity] of state2.entities) {
    if (entity.kind !== "building" || !entity.btype) continue;
    const x = entity.x;
    const y = entity.y;
    const half = CELL_SIZE / 2;
    if (mouseWorldX !== void 0 && mouseWorldY !== void 0 && entity.ownerName) {
      if (Math.abs(mouseWorldX - x) <= half && Math.abs(mouseWorldY - y) <= half) {
        hoveredBuildingOwner = entity.ownerName;
        hoveredBuildingX = x;
        hoveredBuildingY = y;
      }
    }
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.fillStyle = BUILDING_COLORS[entity.btype];
    switch (entity.btype) {
      case "wall":
        ctx2.fillRect(-half, -half, CELL_SIZE, CELL_SIZE);
        ctx2.strokeStyle = "rgba(0,0,0,0.2)";
        ctx2.lineWidth = 1;
        ctx2.strokeRect(-half, -half, CELL_SIZE, CELL_SIZE);
        ctx2.beginPath();
        ctx2.moveTo(-half, 0);
        ctx2.lineTo(half, 0);
        ctx2.moveTo(0, -half);
        ctx2.lineTo(0, 0);
        ctx2.moveTo(-half + 8, 0);
        ctx2.lineTo(-half + 8, half);
        ctx2.stroke();
        break;
      case "gate":
        if (entity.open) {
          ctx2.strokeStyle = BUILDING_COLORS.gate;
          ctx2.lineWidth = 2;
          ctx2.setLineDash([4, 4]);
          ctx2.strokeRect(-half, -half, CELL_SIZE, CELL_SIZE);
          ctx2.setLineDash([]);
        } else {
          ctx2.fillRect(-half, -half, CELL_SIZE, CELL_SIZE);
          ctx2.strokeStyle = "#5a4010";
          ctx2.lineWidth = 2;
          for (let i = -half + 6; i < half; i += 8) {
            ctx2.beginPath();
            ctx2.moveTo(i, -half);
            ctx2.lineTo(i, half);
            ctx2.stroke();
          }
        }
        break;
      case "turret": {
        const turretShirt = entity.colors?.shirt || "#556677";
        const turretPants = entity.colors?.pants || "#334455";
        ctx2.fillStyle = turretPants;
        ctx2.fillRect(-half, -half, CELL_SIZE, CELL_SIZE);
        ctx2.fillStyle = turretShirt;
        ctx2.fillRect(-half + 3, -half + 3, CELL_SIZE - 6, CELL_SIZE - 6);
        const facing = entity.facing ?? 0;
        ctx2.save();
        ctx2.rotate(facing);
        const barrelLen = half + 4;
        const barrelW = 7;
        const muzzleW = 5;
        ctx2.fillStyle = "#111";
        ctx2.beginPath();
        ctx2.moveTo(-1, -barrelW - 1);
        ctx2.lineTo(barrelLen + 1, -muzzleW - 1);
        ctx2.lineTo(barrelLen + 1, muzzleW + 1);
        ctx2.lineTo(-1, barrelW + 1);
        ctx2.closePath();
        ctx2.fill();
        ctx2.fillStyle = "#888";
        ctx2.beginPath();
        ctx2.moveTo(0, -barrelW);
        ctx2.lineTo(barrelLen, -muzzleW);
        ctx2.lineTo(barrelLen, muzzleW);
        ctx2.lineTo(0, barrelW);
        ctx2.closePath();
        ctx2.fill();
        ctx2.restore();
        ctx2.fillStyle = "#111";
        ctx2.beginPath();
        ctx2.arc(0, 0, 7, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.fillStyle = "#ff4444";
        ctx2.beginPath();
        ctx2.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx2.fill();
        break;
      }
      case "bed": {
        const sheetColor = entity.colors?.shirt || "#4466aa";
        const blanketColor = entity.colors?.pants || "#3355aa";
        ctx2.fillStyle = "#5a3a1a";
        ctx2.fillRect(-half, -half, CELL_SIZE, CELL_SIZE);
        ctx2.fillStyle = "#7a5a2a";
        ctx2.fillRect(-half + 1, -half + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        ctx2.fillStyle = "#d8cfc0";
        ctx2.fillRect(-half + 3, -half + 3, CELL_SIZE - 6, CELL_SIZE - 6);
        ctx2.fillStyle = sheetColor;
        ctx2.fillRect(-half + 3, -half + 8, CELL_SIZE - 6, CELL_SIZE - 14);
        ctx2.fillStyle = blanketColor;
        ctx2.fillRect(-half + 3, -half + 16, CELL_SIZE - 6, CELL_SIZE - 20);
        ctx2.strokeStyle = "rgba(0,0,0,0.15)";
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.moveTo(-half + 4, -half + 16);
        ctx2.lineTo(half - 4, -half + 16);
        ctx2.stroke();
        ctx2.fillStyle = "#f0ebe0";
        ctx2.fillRect(-half + 5, -half + 4, CELL_SIZE - 10, 6);
        ctx2.fillStyle = "rgba(0,0,0,0.06)";
        ctx2.fillRect(-half + 5, -half + 8, CELL_SIZE - 10, 2);
        ctx2.fillStyle = "#4a2a10";
        ctx2.fillRect(-half + 1, -half + 1, CELL_SIZE - 2, 3);
        ctx2.fillStyle = "#4a2a10";
        ctx2.fillRect(-half + 1, half - 4, CELL_SIZE - 2, 3);
        let bedAoeColor = "rgba(200, 200, 200, 0.2)";
        if (entity.ownerId === state2.myId) {
          bedAoeColor = "rgba(100, 200, 100, 0.3)";
        } else if (entity.ownerId !== void 0) {
          const myEntity = state2.entities.get(state2.myId);
          const ownerEntity = state2.entities.get(entity.ownerId);
          if (myEntity?.partyId && ownerEntity?.partyId && myEntity.partyId === ownerEntity.partyId) {
            bedAoeColor = "rgba(80, 140, 255, 0.3)";
          }
        }
        ctx2.beginPath();
        ctx2.arc(0, 0, BED_HEAL_RADIUS, 0, Math.PI * 2);
        ctx2.strokeStyle = bedAoeColor;
        ctx2.lineWidth = 1;
        ctx2.setLineDash([4, 4]);
        ctx2.stroke();
        ctx2.setLineDash([]);
        break;
      }
    }
    ctx2.restore();
  }
  for (const [id, entity] of state2.entities) {
    if (entity.kind !== "building" || !entity.btype) continue;
    if (entity.hp === void 0 || entity.maxHp === void 0 || entity.hp >= entity.maxHp) continue;
    const half = CELL_SIZE / 2;
    const barW = CELL_SIZE - 4;
    const ratio = Math.max(0, entity.hp / entity.maxHp);
    ctx2.save();
    ctx2.translate(entity.x, entity.y);
    ctx2.fillStyle = "rgba(0,0,0,0.5)";
    ctx2.fillRect(-barW / 2, -half - 6, barW, 3);
    ctx2.fillStyle = ratio > 0.5 ? "#4caf50" : "#f44336";
    ctx2.fillRect(-barW / 2, -half - 6, barW * ratio, 3);
    ctx2.restore();
  }
  if (hoveredBuildingOwner) {
    ctx2.save();
    ctx2.translate(hoveredBuildingX, hoveredBuildingY);
    const text = hoveredBuildingOwner;
    ctx2.font = "bold 10px sans-serif";
    ctx2.textAlign = "center";
    const tw = ctx2.measureText(text).width;
    const px = 4, py = 2;
    ctx2.fillStyle = "rgba(0,0,0,0.7)";
    ctx2.fillRect(-tw / 2 - px, CELL_SIZE / 2 + 2, tw + px * 2, 12 + py * 2);
    ctx2.fillStyle = "#fff";
    ctx2.fillText(text, 0, CELL_SIZE / 2 + 12);
    ctx2.restore();
  }
}

// client/src/rendering/ProjectileRenderer.ts
function drawProjectiles(ctx2, state2, camX, camY, screenW, screenH) {
  const margin = 40;
  const hasVp = camX !== void 0;
  const vl = hasVp ? camX - screenW / 2 - margin : -Infinity;
  const vr = hasVp ? camX + screenW / 2 + margin : Infinity;
  const vt = hasVp ? camY - screenH / 2 - margin : -Infinity;
  const vb = hasVp ? camY + screenH / 2 + margin : Infinity;
  for (const [id, entity] of state2.entities) {
    if (entity.kind !== "projectile") continue;
    const pos = state2.getInterpolatedPos(id) ?? { x: entity.x, y: entity.y };
    if (hasVp && (pos.x < vl || pos.x > vr || pos.y < vt || pos.y > vb)) continue;
    ctx2.save();
    ctx2.translate(pos.x, pos.y);
    if (entity.parried) {
      const t = Date.now() / 150;
      ctx2.shadowColor = "#ffd700";
      ctx2.shadowBlur = 10 + Math.sin(t) * 4;
      ctx2.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(t) * 0.2})`;
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.arc(0, 0, 8, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.shadowBlur = 0;
    }
    if (entity.projSource === "stag") {
      drawFireBreath(ctx2, entity);
    } else if (entity.projSource === "enemy") {
      drawGhostProjectile(ctx2, entity);
    } else if (entity.projSource === "player") {
      drawArrow(ctx2, entity);
    } else {
      drawTurretProjectile(ctx2, entity);
    }
    ctx2.restore();
  }
}
function drawArrow(ctx2, entity) {
  const facing = entity.facing ?? 0;
  ctx2.save();
  ctx2.rotate(facing);
  ctx2.strokeStyle = "#8B6914";
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.moveTo(-10, 0);
  ctx2.lineTo(6, 0);
  ctx2.stroke();
  ctx2.fillStyle = "#ccc";
  ctx2.beginPath();
  ctx2.moveTo(10, 0);
  ctx2.lineTo(5, -3);
  ctx2.lineTo(5, 3);
  ctx2.closePath();
  ctx2.fill();
  ctx2.strokeStyle = "#cc4444";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.moveTo(-10, 0);
  ctx2.lineTo(-13, -3);
  ctx2.moveTo(-10, 0);
  ctx2.lineTo(-13, 3);
  ctx2.stroke();
  ctx2.restore();
}
function drawGhostProjectile(ctx2, entity) {
  const time = Date.now() / 200;
  ctx2.globalAlpha = 0.5 + Math.sin(time) * 0.2;
  ctx2.shadowColor = "#8888ff";
  ctx2.shadowBlur = 12;
  const gradient = ctx2.createRadialGradient(0, 0, 0, 0, 0, 8);
  gradient.addColorStop(0, "rgba(200, 210, 255, 0.9)");
  gradient.addColorStop(0.5, "rgba(120, 140, 220, 0.5)");
  gradient.addColorStop(1, "rgba(80, 80, 180, 0)");
  ctx2.fillStyle = gradient;
  ctx2.beginPath();
  ctx2.arc(0, 0, 8, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.shadowBlur = 0;
  ctx2.globalAlpha = 0.8;
  ctx2.fillStyle = "#dde8ff";
  ctx2.beginPath();
  ctx2.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx2.fill();
  if (entity.facing !== void 0) {
    ctx2.globalAlpha = 0.25;
    ctx2.strokeStyle = "#aabbff";
    ctx2.lineWidth = 3;
    ctx2.beginPath();
    const tx = -Math.cos(entity.facing);
    const ty = -Math.sin(entity.facing);
    ctx2.moveTo(0, 0);
    const wave = Math.sin(time * 2) * 3;
    ctx2.quadraticCurveTo(tx * 8 + wave, ty * 8 - wave, tx * 18, ty * 18);
    ctx2.stroke();
  }
  ctx2.globalAlpha = 1;
}
function drawFireBreath(ctx2, entity) {
  const facing = entity.facing ?? 0;
  const time = Date.now();
  ctx2.save();
  ctx2.rotate(facing);
  const flicker = Math.sin(time / 60) * 2;
  const flicker2 = Math.cos(time / 80) * 1.5;
  ctx2.shadowColor = "#ff4400";
  ctx2.shadowBlur = 14;
  ctx2.globalAlpha = 0.7 + Math.sin(time / 100) * 0.15;
  const grad = ctx2.createRadialGradient(0, 0, 0, 0, 0, 12);
  grad.addColorStop(0, "#ffee44");
  grad.addColorStop(0.3, "#ff8800");
  grad.addColorStop(0.7, "#ff3300");
  grad.addColorStop(1, "rgba(200, 20, 0, 0)");
  ctx2.fillStyle = grad;
  ctx2.beginPath();
  ctx2.moveTo(10, 0);
  ctx2.quadraticCurveTo(6, -6 + flicker, -8, -4 + flicker2);
  ctx2.quadraticCurveTo(-12, 0, -8, 4 - flicker2);
  ctx2.quadraticCurveTo(6, 6 - flicker, 10, 0);
  ctx2.fill();
  ctx2.shadowBlur = 0;
  ctx2.globalAlpha = 0.9;
  ctx2.fillStyle = "#ffee88";
  ctx2.beginPath();
  ctx2.ellipse(2, 0, 4, 2.5, 0, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.globalAlpha = 0.6;
  ctx2.fillStyle = "#ff6600";
  for (let i = 0; i < 3; i++) {
    const sx = -6 - i * 4 + Math.sin(time / 70 + i) * 2;
    const sy = Math.sin(time / 90 + i * 2) * 3;
    ctx2.beginPath();
    ctx2.arc(sx, sy, 1 + Math.random() * 0.5, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = 1;
  ctx2.restore();
}
function drawTurretProjectile(ctx2, entity) {
  ctx2.shadowColor = "#ffcc44";
  ctx2.shadowBlur = 8;
  ctx2.fillStyle = "#ffdd66";
  ctx2.beginPath();
  ctx2.arc(0, 0, PROJECTILE_SIZE / 2, 0, Math.PI * 2);
  ctx2.fill();
  if (entity.facing !== void 0) {
    ctx2.shadowBlur = 0;
    ctx2.strokeStyle = "rgba(255, 220, 100, 0.4)";
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(0, 0);
    const tx = -Math.cos(entity.facing) * 12;
    const ty = -Math.sin(entity.facing) * 12;
    ctx2.lineTo(tx, ty);
    ctx2.stroke();
  }
}

// client/src/ui/HudRenderer.ts
function drawHud(ctx2, state2, screenW, screenH) {
  const hpBar = document.getElementById("hp-bar");
  const sourceDisplay = document.getElementById("source-display");
  const phaseDisplay = document.getElementById("phase-display");
  const coordsDisplay = document.getElementById("coords-display");
  const deathOverlay = document.getElementById("death-overlay");
  const deathTimer = document.getElementById("death-timer");
  if (hpBar) {
    const ratio = Math.max(0, state2.selfHp / state2.selfMaxHp) * 100;
    hpBar.style.width = `${ratio}%`;
    if (ratio > 50) hpBar.style.background = "#4caf50";
    else if (ratio > 25) hpBar.style.background = "#ff9800";
    else hpBar.style.background = "#f44336";
  }
  if (sourceDisplay) {
    sourceDisplay.textContent = `Source: ${state2.selfSource} (Bank: ${state2.selfBankedSource})`;
  }
  const buildCounter = document.getElementById("build-counter");
  if (buildCounter) {
    buildCounter.textContent = `${state2.selfBuildingCount}/${MAX_BUILDINGS_PER_PLAYER}`;
  }
  const costs = { wall: WALL_COST, gate: GATE_COST, turret: TURRET_COST, bed: BED_COST };
  document.querySelectorAll(".build-btn[data-type]").forEach((btn) => {
    const cost = costs[btn.dataset.type] ?? 0;
    btn.classList.toggle("unaffordable", state2.selfSource < cost);
  });
  if (phaseDisplay) {
    const labels = { day: "Day", night: "Night", dawn: "Dawn", dusk: "Dusk" };
    const icons = { day: "\u2600", night: "\u{1F319}", dawn: "\u{1F305}", dusk: "\u{1F307}" };
    phaseDisplay.textContent = `${icons[state2.dayPhase]} ${labels[state2.dayPhase]}`;
  }
  if (coordsDisplay) {
    coordsDisplay.textContent = `${Math.round(state2.selfPos.x)}, ${Math.round(state2.selfPos.y)}`;
  }
  if (deathOverlay) {
    if (state2.selfDead) {
      deathOverlay.style.display = "flex";
      if (deathTimer) {
        if (state2.selfRespawnAt) {
          const remaining = Math.max(0, Math.ceil((state2.selfRespawnAt - Date.now()) / 1e3));
          deathTimer.textContent = `Respawning in ${remaining}s`;
        } else {
          deathTimer.textContent = "";
        }
      }
    } else {
      deathOverlay.style.display = "none";
    }
  }
  drawMinimap(ctx2, state2, screenW, screenH);
  drawCooldownBars(ctx2, state2, screenW, screenH);
}
function drawMinimap(ctx2, state2, screenW, screenH) {
  const isMobile = document.body.classList.contains("mobile");
  const size = isMobile ? 80 : 140;
  const padding = isMobile ? 8 : 16;
  const mapX = screenW - size - padding;
  const mapY = isMobile ? 38 : screenH - size - padding;
  const worldRadius = VIEW_RADIUS * 1.5;
  const scale = size / 2 / worldRadius;
  const cx = mapX + size / 2;
  const cy = mapY + size / 2;
  ctx2.save();
  ctx2.beginPath();
  ctx2.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx2.clip();
  ctx2.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx2.fillRect(mapX, mapY, size, size);
  const szMx = cx - state2.selfPos.x * scale;
  const szMy = cy - state2.selfPos.y * scale;
  const szRadius = SAFE_ZONE_RADIUS * scale;
  ctx2.beginPath();
  ctx2.arc(szMx, szMy, szRadius, 0, Math.PI * 2);
  ctx2.strokeStyle = "rgba(126, 200, 126, 0.5)";
  ctx2.lineWidth = 1.5;
  ctx2.stroke();
  ctx2.fillStyle = "rgba(126, 200, 126, 0.08)";
  ctx2.fill();
  const bufferRadius = (SAFE_ZONE_RADIUS + NO_BUILD_BUFFER) * scale;
  ctx2.beginPath();
  ctx2.arc(szMx, szMy, bufferRadius, 0, Math.PI * 2);
  ctx2.strokeStyle = "rgba(240, 200, 60, 0.4)";
  ctx2.lineWidth = 1;
  ctx2.stroke();
  const halfSize = size / 2 - 1;
  const halfSizeSq = halfSize * halfSize;
  for (const [id, entity] of state2.entities) {
    if (entity.kind === "projectile") continue;
    const dx = entity.x - state2.selfPos.x;
    const dy = entity.y - state2.selfPos.y;
    const mx = cx + dx * scale;
    const my = cy + dy * scale;
    const mdx = mx - cx, mdy = my - cy;
    if (mdx * mdx + mdy * mdy > halfSizeSq) continue;
    if (entity.kind === "building") {
      ctx2.fillStyle = "rgba(160, 160, 160, 0.6)";
      const bs = Math.max(2, 32 * scale);
      ctx2.fillRect(mx - bs / 2, my - bs / 2, bs, bs);
    } else if (entity.kind === "player") {
      const isPartyMember = state2.partyMembers.length > 0 && entity.username && state2.partyMembers.includes(entity.username);
      ctx2.fillStyle = isPartyMember ? "#4488ff" : "#ff4444";
      ctx2.beginPath();
      ctx2.arc(mx, my, 3, 0, Math.PI * 2);
      ctx2.fill();
    } else if (entity.kind === "stag") {
      ctx2.save();
      ctx2.translate(mx, my);
      ctx2.fillStyle = "#ff4400";
      ctx2.beginPath();
      ctx2.arc(0, -1, 4, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillRect(-2.5, 1, 5, 3);
      ctx2.fillStyle = "#000";
      ctx2.fillRect(-2, -2, 1.5, 1.5);
      ctx2.fillRect(0.5, -2, 1.5, 1.5);
      ctx2.restore();
    } else if (entity.kind === "lion" || entity.kind === "ghost") {
      ctx2.fillStyle = "#f0c040";
      ctx2.beginPath();
      ctx2.arc(mx, my, 2, 0, Math.PI * 2);
      ctx2.fill();
    }
  }
  ctx2.fillStyle = "#fff";
  ctx2.beginPath();
  ctx2.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  ctx2.strokeStyle = "rgba(255,255,255,0.25)";
  ctx2.lineWidth = 1.5;
  ctx2.beginPath();
  ctx2.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx2.stroke();
  const distToSafe = Math.hypot(state2.selfPos.x, state2.selfPos.y);
  if (distToSafe > worldRadius * 0.8) {
    const angle = Math.atan2(-state2.selfPos.y, -state2.selfPos.x);
    const arrowDist = size / 2 + 10;
    const ax = cx + Math.cos(angle) * arrowDist;
    const ay = cy + Math.sin(angle) * arrowDist;
    ctx2.save();
    ctx2.translate(ax, ay);
    ctx2.rotate(angle);
    ctx2.fillStyle = "rgba(126, 200, 126, 0.7)";
    ctx2.beginPath();
    ctx2.moveTo(6, 0);
    ctx2.lineTo(-4, -4);
    ctx2.lineTo(-4, 4);
    ctx2.closePath();
    ctx2.fill();
    ctx2.restore();
  }
}
var ABILITY_SLOTS = [
  { label: "PUNCH", key: "LMB", color: "#ff6b6b", getCooldownUntil: (s) => s.selfPunchCooldownUntil, maxCooldown: PUNCH_COOLDOWN },
  { label: "LUNGE", key: "Shift", color: "#ff9544", getCooldownUntil: (s) => s.selfLungeCooldownUntil, maxCooldown: LUNGE_COOLDOWN },
  { label: "SHOOT", key: "RMB", color: "#c77dff", getCooldownUntil: (s) => s.selfArrowCooldownUntil, maxCooldown: ARROW_COOLDOWN },
  { label: "PARRY", key: "F", color: "#ffd740", getCooldownUntil: (s) => s.selfParryCooldownUntil, maxCooldown: PARRY_COOLDOWN },
  { label: "SHIELD", key: "Space", color: "#6496ff", getCooldownUntil: (s) => s.selfShieldCooldownUntil, maxCooldown: SHIELD_COOLDOWN },
  { label: "DASH", key: "Q", color: "#7ec87e", getCooldownUntil: (s) => s.selfDashCooldownUntil, maxCooldown: DASH_COOLDOWN }
];
function drawCooldownBars(ctx2, state2, screenW, screenH) {
  if (state2.selfDead) return;
  const now = Date.now();
  const slotW = 40;
  const slotH = 6;
  const gap = 3;
  const totalW = ABILITY_SLOTS.length * slotW + (ABILITY_SLOTS.length - 1) * gap;
  const barY = screenH - 100;
  const startX = (screenW - totalW) / 2;
  ctx2.save();
  for (let i = 0; i < ABILITY_SLOTS.length; i++) {
    const slot = ABILITY_SLOTS[i];
    const x = startX + i * (slotW + gap);
    const cdUntil = slot.getCooldownUntil(state2);
    const remaining = cdUntil - now;
    const onCooldown = remaining > 0;
    const ratio = onCooldown ? Math.min(1, remaining / slot.maxCooldown) : 0;
    ctx2.fillStyle = "rgba(0,0,0,0.5)";
    ctx2.fillRect(x, barY, slotW, slotH);
    if (onCooldown) {
      ctx2.fillStyle = "rgba(40,40,40,0.6)";
      ctx2.fillRect(x, barY, slotW, slotH);
      const readyW = slotW * (1 - ratio);
      ctx2.fillStyle = slot.color;
      ctx2.globalAlpha = 0.7;
      ctx2.fillRect(x, barY, readyW, slotH);
      ctx2.globalAlpha = 1;
    } else {
      ctx2.fillStyle = slot.color;
      ctx2.globalAlpha = 0.8;
      ctx2.fillRect(x, barY, slotW, slotH);
      ctx2.globalAlpha = 1;
    }
    ctx2.strokeStyle = onCooldown ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.25)";
    ctx2.lineWidth = 1;
    ctx2.strokeRect(x, barY, slotW, slotH);
    ctx2.font = "bold 8px sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillStyle = onCooldown ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)";
    ctx2.fillText(slot.label, x + slotW / 2, barY - 3);
  }
  ctx2.restore();
}

// client/src/ui/BuildMenu.ts
var BUILD_COSTS = { wall: WALL_COST, gate: GATE_COST, turret: TURRET_COST, bed: BED_COST };
function drawBuildPreview(ctx2, btype, worldX, worldY, playerX, playerY, playerSource) {
  const cellX = Math.floor(worldX / CELL_SIZE);
  const cellY = Math.floor(worldY / CELL_SIZE);
  const snapX = cellX * CELL_SIZE;
  const snapY = cellY * CELL_SIZE;
  const centerX = snapX + CELL_SIZE / 2;
  const centerY = snapY + CELL_SIZE / 2;
  const distFromPlayer = Math.hypot(centerX - playerX, centerY - playerY);
  const distFromOrigin = Math.hypot(centerX, centerY);
  const inRange = distFromPlayer <= MAX_BUILD_RANGE;
  const outsideSafeZone = distFromOrigin >= SAFE_ZONE_RADIUS + NO_BUILD_BUFFER;
  const canAfford = playerSource >= BUILD_COSTS[btype];
  const canBuild = inRange && outsideSafeZone && canAfford;
  if (canBuild) {
    ctx2.fillStyle = "rgba(126, 200, 126, 0.3)";
  } else {
    ctx2.fillStyle = "rgba(255, 60, 60, 0.3)";
  }
  ctx2.fillRect(snapX, snapY, CELL_SIZE, CELL_SIZE);
  ctx2.strokeStyle = canBuild ? "rgba(126, 200, 126, 0.8)" : "rgba(255, 60, 60, 0.8)";
  ctx2.lineWidth = 2;
  ctx2.strokeRect(snapX, snapY, CELL_SIZE, CELL_SIZE);
  ctx2.fillStyle = canBuild ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 100, 100, 0.9)";
  ctx2.font = "10px sans-serif";
  ctx2.textAlign = "center";
  ctx2.fillText(btype, centerX, centerY + 4);
}
function drawDemolishPreview(ctx2, worldX, worldY, entities, selfUsername) {
  const cellX = Math.floor(worldX / CELL_SIZE);
  const cellY = Math.floor(worldY / CELL_SIZE);
  const snapX = cellX * CELL_SIZE;
  const snapY = cellY * CELL_SIZE;
  const centerX = snapX + CELL_SIZE / 2;
  const centerY = snapY + CELL_SIZE / 2;
  let hasOwned = false;
  for (const [, e] of entities) {
    if (e.kind !== "building" || e.ownerName !== selfUsername) continue;
    if (Math.abs(e.x - centerX) < CELL_SIZE / 2 && Math.abs(e.y - centerY) < CELL_SIZE / 2) {
      hasOwned = true;
      break;
    }
  }
  ctx2.fillStyle = hasOwned ? "rgba(255, 60, 60, 0.4)" : "rgba(255, 60, 60, 0.15)";
  ctx2.fillRect(snapX, snapY, CELL_SIZE, CELL_SIZE);
  ctx2.strokeStyle = hasOwned ? "rgba(255, 60, 60, 0.9)" : "rgba(255, 60, 60, 0.4)";
  ctx2.lineWidth = 2;
  ctx2.strokeRect(snapX, snapY, CELL_SIZE, CELL_SIZE);
  ctx2.fillStyle = hasOwned ? "rgba(255, 100, 100, 1)" : "rgba(255, 100, 100, 0.6)";
  ctx2.font = "bold 10px sans-serif";
  ctx2.textAlign = "center";
  ctx2.fillText("Demolish", centerX, centerY + 4);
}

// client/src/rendering/atmosphere/WeatherSystem.ts
var MAX_WIND_LINES = 40;
var windLines = [];
var currentWavy = false;
function spawnWindLine(camX, camY, screenW, screenH) {
  return {
    wx: camX - screenW / 2 - 50,
    wy: camY - screenH / 2 + Math.random() * screenH,
    speed: 100 + Math.random() * 80,
    length: currentWavy ? 40 + Math.random() * 60 : 30 + Math.random() * 50,
    opacity: 0.04 + Math.random() * 0.06,
    wavy: currentWavy,
    waveAmp: 3 + Math.random() * 5,
    wavePhase: Math.random() * Math.PI * 2
  };
}
function updateWindLines(dt, camX, camY, screenW, screenH, intensity, wavy) {
  currentWavy = wavy;
  const target = Math.floor(MAX_WIND_LINES * intensity);
  while (windLines.length < target) windLines.push(spawnWindLine(camX, camY, screenW, screenH));
  const rightEdge = camX + screenW / 2 + 60;
  for (let i = windLines.length - 1; i >= 0; i--) {
    windLines[i].wx += windLines[i].speed * dt;
    if (windLines[i].wx > rightEdge) {
      if (i < target) windLines[i] = spawnWindLine(camX, camY, screenW, screenH);
      else windLines.splice(i, 1);
    }
  }
}
function drawWindLines(ctx2, camX, camY, screenW, screenH) {
  for (const l of windLines) {
    const sx = l.wx - camX + screenW / 2;
    const sy = l.wy - camY + screenH / 2;
    ctx2.strokeStyle = `rgba(255,255,255,${l.opacity})`;
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(sx, sy);
    if (l.wavy) {
      const segs = 4;
      const segLen = l.length / segs;
      for (let s = 0; s < segs; s++) {
        const dir = s % 2 === 0 ? -1 : 1;
        ctx2.quadraticCurveTo(
          sx + segLen * (s + 0.5),
          sy + dir * l.waveAmp,
          sx + segLen * (s + 1),
          sy
        );
      }
    } else {
      ctx2.lineTo(sx + l.length, sy - 2);
    }
    ctx2.stroke();
  }
}
var FIREFLY_CHUNK = 512;
var FIREFLIES_PER_CHUNK = 1;
function drawFirefliesWorldSpace(ctx2, camX, camY, screenW, screenH, intensity, time) {
  const pad = 30;
  const left = camX - screenW / 2 - pad;
  const top = camY - screenH / 2 - pad;
  const right = camX + screenW / 2 + pad;
  const bottom = camY + screenH / 2 + pad;
  const cx0 = Math.floor(left / FIREFLY_CHUNK);
  const cy0 = Math.floor(top / FIREFLY_CHUNK);
  const cx1 = Math.floor(right / FIREFLY_CHUNK);
  const cy1 = Math.floor(bottom / FIREFLY_CHUNK);
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cy = cy0; cy <= cy1; cy++) {
      const rng = SeededRandom.fromChunk(cx * 31 + 5, cy * 37 + 11);
      for (let i = 0; i < FIREFLIES_PER_CHUNK; i++) {
        const fx = cx * FIREFLY_CHUNK + rng.next() * FIREFLY_CHUNK;
        const fy = cy * FIREFLY_CHUNK + rng.next() * FIREFLY_CHUNK;
        if (fx < left || fx > right || fy < top || fy > bottom) continue;
        const pulsePhase = rng.next() * Math.PI * 2;
        const driftX = rng.next() * Math.PI * 2;
        const driftY = rng.next() * Math.PI * 2;
        const size = 1.5 + rng.next() * 1.5;
        const dx = Math.sin(time * 0.6 + driftX) * 8;
        const dy = Math.sin(time * 0.45 + driftY) * 6;
        const sx = fx + dx - camX + screenW / 2;
        const sy = fy + dy - camY + screenH / 2;
        const pulse = (Math.sin(time * 2.5 + pulsePhase) + 1) * 0.5;
        const alpha = (0.2 + pulse * 0.6) * intensity;
        const r = size + pulse * 1.5;
        ctx2.beginPath();
        ctx2.arc(sx, sy, r * 3, 0, Math.PI * 2);
        ctx2.fillStyle = `rgba(255,230,100,${(alpha * 0.12).toFixed(3)})`;
        ctx2.fill();
        ctx2.beginPath();
        ctx2.arc(sx, sy, r, 0, Math.PI * 2);
        ctx2.fillStyle = `rgba(255,240,140,${alpha.toFixed(3)})`;
        ctx2.fill();
      }
    }
  }
}
var MAX_RAIN = 100;
var raindrops = [];
var splashes = [];
function spawnRaindrop(w, h) {
  return {
    x: Math.random() * (w + 100) - 50,
    y: -10 - Math.random() * 60,
    speed: 400 + Math.random() * 200,
    length: 8 + Math.random() * 12
  };
}
function updateRain(dt, w, h, intensity) {
  const target = Math.floor(MAX_RAIN * intensity);
  while (raindrops.length < target) raindrops.push(spawnRaindrop(w, h));
  for (let i = raindrops.length - 1; i >= 0; i--) {
    raindrops[i].y += raindrops[i].speed * dt;
    raindrops[i].x += 40 * dt;
    if (raindrops[i].y > h + 10) {
      if (splashes.length < 20) {
        splashes.push({ x: raindrops[i].x, y: h - 5 + Math.random() * 10, life: 0.2, size: 1 + Math.random() * 1.5 });
      }
      if (i < target) raindrops[i] = spawnRaindrop(w, h);
      else raindrops.splice(i, 1);
    }
  }
  for (let i = splashes.length - 1; i >= 0; i--) {
    splashes[i].life -= dt;
    if (splashes[i].life <= 0) splashes.splice(i, 1);
  }
}
function drawRain(ctx2) {
  ctx2.strokeStyle = "rgba(160,180,210,0.25)";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  for (const d of raindrops) {
    ctx2.moveTo(d.x, d.y);
    ctx2.lineTo(d.x + d.length * 0.32, d.y + d.length);
  }
  ctx2.stroke();
  for (const s of splashes) {
    const a = s.life / 0.2;
    ctx2.fillStyle = `rgba(180,200,230,${(a * 0.3).toFixed(3)})`;
    ctx2.beginPath();
    ctx2.arc(s.x, s.y, s.size * (1 - a * 0.3), 0, Math.PI * 2);
    ctx2.fill();
  }
}
var DEW_CYCLE = 4;
function drawDewDrops(ctx2, camX, camY, screenW, screenH, intensity, time) {
  const grassPositions = getVisibleGrassPositions(camX, camY, screenW, screenH);
  for (const gp of grassPositions) {
    const hash = (gp.x * 73856093 ^ gp.y * 19349663) >>> 0;
    if (hash % 3 !== 0) continue;
    const sx = gp.x - camX + screenW / 2;
    const sy = gp.y - camY + screenH / 2;
    const phaseOffset = hash % 1e3 / 1e3 * DEW_CYCLE;
    const cycleT = (time + phaseOffset) % DEW_CYCLE / DEW_CYCLE;
    if (cycleT < 0.6) {
      const formT = cycleT / 0.6;
      const r = 1 + formT * 1;
      const alpha = (0.2 + formT * 0.4) * intensity;
      ctx2.beginPath();
      ctx2.arc(sx, sy, r * 2, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(200,230,255,${(alpha * 0.15).toFixed(3)})`;
      ctx2.fill();
      ctx2.beginPath();
      ctx2.arc(sx, sy, r, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(220,240,255,${alpha.toFixed(3)})`;
      ctx2.fill();
    } else if (cycleT < 0.7) {
      const fallT = (cycleT - 0.6) / 0.1;
      const dropY = sy + fallT * 4;
      const r = 2 * (1 - fallT * 0.5);
      const alpha = 0.5 * (1 - fallT) * intensity;
      ctx2.beginPath();
      ctx2.arc(sx, dropY, r, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(220,240,255,${alpha.toFixed(3)})`;
      ctx2.fill();
    } else {
      const splashT = (cycleT - 0.7) / 0.3;
      const ringR = 2 + splashT * 6;
      const alpha = 0.4 * (1 - splashT) * intensity;
      ctx2.beginPath();
      ctx2.arc(sx, sy + 4, ringR, 0, Math.PI * 2);
      ctx2.strokeStyle = `rgba(200,230,255,${alpha.toFixed(3)})`;
      ctx2.lineWidth = 0.8;
      ctx2.stroke();
      if (splashT < 0.5) {
        const dotAlpha = 0.3 * (1 - splashT * 2) * intensity;
        const spread = 2 + splashT * 5;
        ctx2.fillStyle = `rgba(220,240,255,${dotAlpha.toFixed(3)})`;
        ctx2.beginPath();
        ctx2.arc(sx - spread, sy + 3, 0.8, 0, Math.PI * 2);
        ctx2.arc(sx + spread, sy + 3, 0.8, 0, Math.PI * 2);
        ctx2.fill();
      }
    }
  }
}
var lastTime = 0;
function drawWeather(ctx2, screenW, screenH, phaseBlend, camX, camY) {
  const now = performance.now() / 1e3;
  const dt = lastTime > 0 ? Math.min(now - lastTime, 0.05) : 1 / 60;
  lastTime = now;
  let windIntensity = 0;
  let fireflyIntensity = 0;
  let rainIntensity = 0;
  let dewIntensity = 0;
  switch (phaseBlend.phase) {
    case "day":
      windIntensity = 1;
      if (phaseBlend.blend > 0) {
        windIntensity = 1 - phaseBlend.blend * 0.7;
        fireflyIntensity = phaseBlend.blend;
      }
      break;
    case "dusk":
      fireflyIntensity = 1;
      windIntensity = 0.3;
      if (phaseBlend.blend > 0) {
        fireflyIntensity = 1 - phaseBlend.blend;
        rainIntensity = phaseBlend.blend;
        windIntensity = 0.3 + phaseBlend.blend * 0.4;
      }
      break;
    case "night":
      rainIntensity = 1;
      windIntensity = 0.5;
      if (phaseBlend.blend > 0) {
        rainIntensity = 1 - phaseBlend.blend;
        dewIntensity = phaseBlend.blend;
        windIntensity = 0.5 - phaseBlend.blend * 0.3;
      }
      break;
    case "dawn":
      dewIntensity = 1 - phaseBlend.progress;
      windIntensity = 0.2 + phaseBlend.progress * 0.5;
      if (phaseBlend.blend > 0) {
        dewIntensity *= 1 - phaseBlend.blend;
        windIntensity = 0.7 + phaseBlend.blend * 0.3;
      }
      break;
  }
  if (windIntensity > 0.01) {
    const isDay = phaseBlend.phase === "day" || phaseBlend.phase === "dawn" && phaseBlend.blend > 0.5;
    updateWindLines(dt, camX, camY, screenW, screenH, windIntensity, isDay);
    drawWindLines(ctx2, camX, camY, screenW, screenH);
  }
  if (fireflyIntensity > 0.01) {
    drawFirefliesWorldSpace(ctx2, camX, camY, screenW, screenH, fireflyIntensity, now);
  }
  if (rainIntensity > 0.01) {
    updateRain(dt, screenW, screenH, rainIntensity);
    drawRain(ctx2);
  }
  if (dewIntensity > 0.01) {
    drawDewDrops(ctx2, camX, camY, screenW, screenH, dewIntensity, now);
  }
}

// client/src/rendering/Renderer.ts
var Renderer = class {
  canvas;
  ctx;
  state;
  input;
  particles = [];
  logicalW = 0;
  logicalH = 0;
  constructor(canvas, state2, input2) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.state = state2;
    this.input = input2;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.logicalW = w;
    this.logicalH = h;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  render() {
    const { ctx: ctx2, state: state2 } = this;
    const W = this.logicalW;
    const H = this.logicalH;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state2.myId > 0) setServerPhase(state2.dayPhase);
    state2.updateCamera();
    const cam = { x: state2.cameraX, y: state2.cameraY };
    ctx2.clearRect(0, 0, W, H);
    ctx2.save();
    ctx2.translate(W / 2 - cam.x, H / 2 - cam.y);
    drawWorld(ctx2, cam, W, H, state2.dayPhase);
    this.drawSafeZone(ctx2);
    const mouse = this.input.getMouseScreenPos();
    const mouseWorldX = mouse.x - W / 2 + cam.x;
    const mouseWorldY = mouse.y - H / 2 + cam.y;
    drawBuildings(ctx2, state2, mouseWorldX, mouseWorldY);
    if (this.input.buildMode) {
      const isGamepad = this.input.gamepad.enabled && this.input.gamepad.connected;
      if (this.input.isMobile && !isGamepad) {
        this.drawBuildRangeOverlay(ctx2, state2.selfPos.x, state2.selfPos.y, W, H, cam);
        const preview = this.input.mobileBuildPreview;
        if (preview) {
          const previewWorldX = preview.cellX * CELL_SIZE + CELL_SIZE / 2;
          const previewWorldY = preview.cellY * CELL_SIZE + CELL_SIZE / 2;
          drawBuildPreview(ctx2, this.input.buildMode, previewWorldX, previewWorldY, state2.selfPos.x, state2.selfPos.y, state2.selfSource);
        }
      } else if (isGamepad) {
        this.drawBuildRangeOverlay(ctx2, state2.selfPos.x, state2.selfPos.y, W, H, cam);
        const gpWorldX = state2.selfPos.x + this.input.gamepadBuildOffsetX;
        const gpWorldY = state2.selfPos.y + this.input.gamepadBuildOffsetY;
        drawBuildPreview(ctx2, this.input.buildMode, gpWorldX, gpWorldY, state2.selfPos.x, state2.selfPos.y, state2.selfSource);
      } else {
        drawBuildPreview(ctx2, this.input.buildMode, mouseWorldX, mouseWorldY, state2.selfPos.x, state2.selfPos.y, state2.selfSource);
      }
    }
    if (this.input.demolishMode) {
      const isGamepad = this.input.gamepad.enabled && this.input.gamepad.connected;
      if (isGamepad) {
        this.drawBuildRangeOverlay(ctx2, state2.selfPos.x, state2.selfPos.y, W, H, cam);
        const gpWorldX = state2.selfPos.x + this.input.gamepadBuildOffsetX;
        const gpWorldY = state2.selfPos.y + this.input.gamepadBuildOffsetY;
        drawDemolishPreview(ctx2, gpWorldX, gpWorldY, state2.entities, state2.selfUsername);
      }
    }
    this.drawNPCs(ctx2);
    drawProjectiles(ctx2, state2, cam.x, cam.y, W, H);
    drawEntities(ctx2, state2, cam.x, cam.y, W, H);
    this.updateAndDrawParticles(ctx2);
    ctx2.restore();
    drawHud(ctx2, state2, W, H);
    this.drawNightOverlay(ctx2);
    const pb = getPhaseBlend();
    drawWeather(ctx2, W, H, pb, cam.x, cam.y);
    if (this.input.touch?.enabled) {
      this.input.touch.draw(ctx2, this.canvas);
    }
  }
  drawSafeZone(ctx2) {
    ctx2.beginPath();
    ctx2.arc(0, 0, SAFE_ZONE_RADIUS, 0, Math.PI * 2);
    ctx2.strokeStyle = "rgba(126, 200, 126, 0.4)";
    ctx2.lineWidth = 3;
    ctx2.setLineDash([10, 10]);
    ctx2.stroke();
    ctx2.setLineDash([]);
    ctx2.fillStyle = "rgba(126, 200, 126, 0.15)";
    ctx2.fill();
    ctx2.beginPath();
    ctx2.arc(0, 0, SAFE_ZONE_RADIUS + NO_BUILD_BUFFER, 0, Math.PI * 2);
    ctx2.strokeStyle = "rgba(240, 200, 60, 0.35)";
    ctx2.lineWidth = 2;
    ctx2.setLineDash([8, 8]);
    ctx2.stroke();
    ctx2.setLineDash([]);
    ctx2.fillStyle = "rgba(126, 200, 126, 0.3)";
    ctx2.fillRect(-4, -4, 8, 8);
  }
  drawNPCs(ctx2) {
    this.drawBanker(ctx2, BANKER_POS.x, BANKER_POS.y);
    this.drawScribe(ctx2, SCRIBE_POS.x, SCRIBE_POS.y);
    const gamepadActive = document.body.classList.contains("gamepad-active");
    const showTextPrompts = !this.input.isMobile || gamepadActive;
    const interactKey = gamepadActive ? "[A]" : "Press E to";
    if (showTextPrompts) {
      const dist2Banker = Math.hypot(this.state.selfPos.x - BANKER_POS.x, this.state.selfPos.y - BANKER_POS.y);
      if (dist2Banker < BANK_NPC_RANGE) {
        ctx2.fillStyle = "#f0c040";
        ctx2.font = "bold 11px sans-serif";
        ctx2.textAlign = "center";
        ctx2.fillText(`${interactKey} Bank`, BANKER_POS.x, BANKER_POS.y - 38);
      }
      const dist2Scribe = Math.hypot(this.state.selfPos.x - SCRIBE_POS.x, this.state.selfPos.y - SCRIBE_POS.y);
      if (dist2Scribe < SCRIBE_NPC_RANGE) {
        ctx2.fillStyle = "#f0c040";
        ctx2.font = "bold 11px sans-serif";
        ctx2.textAlign = "center";
        ctx2.fillText(`${interactKey} Suggest Rules`, SCRIBE_POS.x, SCRIBE_POS.y - 48);
      }
    }
    this.drawSign(ctx2, PATCH_NOTES_SIGN_POS.x, PATCH_NOTES_SIGN_POS.y, "Updates", "#d4a040", "#8b6914");
    this.drawSign(ctx2, RULES_SIGN_POS.x, RULES_SIGN_POS.y, "Rules", "#c0392b", "#8b1a1a");
    this.drawSign(ctx2, NOTICES_SIGN_POS.x, NOTICES_SIGN_POS.y, "Notices", "#3a7bd5", "#1a4a8b");
    if (showTextPrompts) {
      const signPositions = [
        { pos: PATCH_NOTES_SIGN_POS, label: `${interactKey} Read` },
        { pos: RULES_SIGN_POS, label: `${interactKey} Read` },
        { pos: NOTICES_SIGN_POS, label: `${interactKey} Read` }
      ];
      for (const s of signPositions) {
        const dist = Math.hypot(this.state.selfPos.x - s.pos.x, this.state.selfPos.y - s.pos.y);
        if (dist < SIGN_RANGE) {
          ctx2.fillStyle = "#f0c040";
          ctx2.font = "bold 11px sans-serif";
          ctx2.textAlign = "center";
          ctx2.fillText(s.label, s.pos.x, s.pos.y - 36);
        }
      }
    }
  }
  drawBanker(ctx2, x, y) {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.fillStyle = "rgba(0,0,0,0.15)";
    ctx2.beginPath();
    ctx2.ellipse(0, 16, 12, 4, 0, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = "#1a1a2e";
    ctx2.fillRect(-6, 6, 5, 10);
    ctx2.fillRect(1, 6, 5, 10);
    ctx2.fillStyle = "#2c3e50";
    ctx2.fillRect(-10, -10, 20, 18);
    ctx2.strokeStyle = "#34495e";
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(-4, -10);
    ctx2.lineTo(0, -2);
    ctx2.lineTo(4, -10);
    ctx2.stroke();
    ctx2.fillStyle = "#c0392b";
    ctx2.beginPath();
    ctx2.moveTo(0, -8);
    ctx2.lineTo(-2, 2);
    ctx2.lineTo(0, 4);
    ctx2.lineTo(2, 2);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = "#e0ac69";
    ctx2.beginPath();
    ctx2.arc(0, -16, 7, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = "#000";
    ctx2.fillRect(-3, -17, 2, 2);
    ctx2.fillRect(1, -17, 2, 2);
    ctx2.fillStyle = "#8b4513";
    ctx2.fillRect(12, -2, 10, 8);
    ctx2.strokeStyle = "#654321";
    ctx2.lineWidth = 1;
    ctx2.strokeRect(12, -2, 10, 8);
    ctx2.beginPath();
    ctx2.arc(17, -2, 3, Math.PI, 0);
    ctx2.stroke();
    ctx2.fillStyle = "#f0c040";
    ctx2.fillRect(16, 1, 2, 2);
    ctx2.fillStyle = "#f0c040";
    ctx2.font = "bold 11px sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText("Banker", 0, -28);
    ctx2.restore();
  }
  drawScribe(ctx2, x, y) {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.fillStyle = "rgba(0,0,0,0.15)";
    ctx2.beginPath();
    ctx2.ellipse(0, 16, 12, 4, 0, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = "#f5f0e8";
    ctx2.beginPath();
    ctx2.moveTo(-10, -8);
    ctx2.lineTo(-12, 14);
    ctx2.lineTo(12, 14);
    ctx2.lineTo(10, -8);
    ctx2.closePath();
    ctx2.fill();
    ctx2.strokeStyle = "#f0c040";
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(-12, 14);
    ctx2.lineTo(12, 14);
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.moveTo(0, -6);
    ctx2.lineTo(0, 14);
    ctx2.stroke();
    ctx2.fillStyle = "#c0392b";
    ctx2.beginPath();
    ctx2.moveTo(-8, -8);
    ctx2.lineTo(-5, 8);
    ctx2.lineTo(-2, 8);
    ctx2.lineTo(-4, -8);
    ctx2.closePath();
    ctx2.fill();
    ctx2.beginPath();
    ctx2.moveTo(8, -8);
    ctx2.lineTo(5, 8);
    ctx2.lineTo(2, 8);
    ctx2.lineTo(4, -8);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = "#e0ac69";
    ctx2.beginPath();
    ctx2.arc(0, -14, 7, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = "#f5f0e8";
    ctx2.beginPath();
    ctx2.moveTo(-6, -18);
    ctx2.lineTo(-7, -26);
    ctx2.lineTo(0, -32);
    ctx2.lineTo(7, -26);
    ctx2.lineTo(6, -18);
    ctx2.closePath();
    ctx2.fill();
    ctx2.strokeStyle = "#f0c040";
    ctx2.lineWidth = 1.5;
    ctx2.beginPath();
    ctx2.moveTo(0, -30);
    ctx2.lineTo(0, -22);
    ctx2.moveTo(-3, -26);
    ctx2.lineTo(3, -26);
    ctx2.stroke();
    ctx2.fillStyle = "#000";
    ctx2.fillRect(-3, -15, 2, 2);
    ctx2.fillRect(1, -15, 2, 2);
    ctx2.fillStyle = "#f5deb3";
    ctx2.fillRect(-16, -4, 6, 12);
    ctx2.fillStyle = "#d4a574";
    ctx2.beginPath();
    ctx2.arc(-16, -4, 3, Math.PI / 2, Math.PI * 1.5);
    ctx2.fill();
    ctx2.beginPath();
    ctx2.arc(-16, 8, 3, Math.PI / 2, Math.PI * 1.5);
    ctx2.fill();
    ctx2.fillStyle = "#f0c040";
    ctx2.font = "bold 11px sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText("Scribe", 0, -36);
    ctx2.restore();
  }
  drawSign(ctx2, x, y, label, borderColor, postColor) {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.fillStyle = "rgba(0,0,0,0.15)";
    ctx2.beginPath();
    ctx2.ellipse(0, 18, 10, 3, 0, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = postColor;
    ctx2.fillRect(-3, -8, 6, 26);
    ctx2.fillStyle = "#2a2a3a";
    ctx2.fillRect(-22, -26, 44, 22);
    ctx2.strokeStyle = borderColor;
    ctx2.lineWidth = 2;
    ctx2.strokeRect(-22, -26, 44, 22);
    ctx2.fillStyle = borderColor;
    ctx2.fillRect(-22, -26, 4, 4);
    ctx2.fillRect(18, -26, 4, 4);
    ctx2.fillRect(-22, -8, 4, 4);
    ctx2.fillRect(18, -8, 4, 4);
    ctx2.fillStyle = borderColor;
    ctx2.font = "bold 8px sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText(label, 0, -12);
    ctx2.restore();
  }
  addExplosion(x, y, kind) {
    const colors2 = kind === "lion" ? ["#c4873a", "#ff6633", "#ffaa44", "#ffe066", "#fff"] : kind === "turret" ? ["#ff4400", "#ff6622", "#ffaa33", "#ffcc44", "#fff"] : ["#aabbff", "#7799ee", "#55aaff", "#ddeeff", "#fff"];
    const count = kind === "turret" ? 12 : 20;
    const maxSpeed = kind === "turret" ? 80 : 120;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * maxSpeed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.4,
        size: 2 + Math.random() * 4,
        color: colors2[Math.floor(Math.random() * colors2.length)]
      });
    }
  }
  updateAndDrawParticles(ctx2) {
    const dt = 1 / 60;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      const t = p.life / p.maxLife;
      ctx2.globalAlpha = 1 - t;
      ctx2.fillStyle = p.color;
      ctx2.beginPath();
      ctx2.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.globalAlpha = 1;
  }
  drawBuildRangeOverlay(ctx2, px, py, canvasW, canvasH, cam) {
    const radius = MAX_BUILD_RANGE;
    ctx2.save();
    ctx2.beginPath();
    ctx2.rect(cam.x - canvasW, cam.y - canvasH, canvasW * 2, canvasH * 2);
    ctx2.arc(px, py, radius, 0, Math.PI * 2, true);
    ctx2.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx2.fill();
    ctx2.beginPath();
    ctx2.arc(px, py, radius, 0, Math.PI * 2);
    ctx2.strokeStyle = "rgba(240, 200, 60, 0.6)";
    ctx2.lineWidth = 2;
    ctx2.setLineDash([6, 4]);
    ctx2.stroke();
    ctx2.setLineDash([]);
    ctx2.beginPath();
    ctx2.arc(px, py, radius, 0, Math.PI * 2);
    ctx2.fillStyle = "rgba(240, 200, 60, 0.04)";
    ctx2.fill();
    ctx2.restore();
  }
  drawNightOverlay(ctx2) {
    const pb = getPhaseBlend();
    const tints = {
      day: [0, 0, 0, 0],
      dawn: [30, 20, 50, 0.2],
      dusk: [40, 10, 50, 0.15],
      night: [10, 10, 40, 0.35]
    };
    const cur = tints[pb.phase];
    const next = tints[pb.nextPhase];
    const r = cur[0] + (next[0] - cur[0]) * pb.blend;
    const g = cur[1] + (next[1] - cur[1]) * pb.blend;
    const b = cur[2] + (next[2] - cur[2]) * pb.blend;
    const a = cur[3] + (next[3] - cur[3]) * pb.blend;
    if (a > 5e-3) {
      ctx2.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(3)})`;
      ctx2.fillRect(0, 0, this.logicalW, this.logicalH);
    }
  }
};

// client/src/audio/MusicSystem.ts
var FADE_DURATION = 3e3;
var DEFAULT_TRACKS = {
  dawn: "/music/dawn.mp3",
  day: "/music/day.mp3",
  dusk: "/music/dusk.mp3",
  night: "/music/night.mp3"
};
var TRACKS = { ...DEFAULT_TRACKS };
var audioElements = {};
var currentPhase = null;
var musicEnabled = true;
var musicVolume = 0.25;
var fadeIntervals = /* @__PURE__ */ new Map();
function getOrCreateAudio(phase) {
  if (!audioElements[phase]) {
    const audio = new Audio(TRACKS[phase]);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
    audioElements[phase] = audio;
  }
  return audioElements[phase];
}
function fadeIn(audio, phase) {
  const existing = fadeIntervals.get(phase);
  if (existing) clearInterval(existing);
  const step = musicVolume / (FADE_DURATION / 50);
  audio.play().catch(() => {
  });
  const interval = setInterval(() => {
    if (audio.volume < musicVolume - step) {
      audio.volume = Math.min(musicVolume, audio.volume + step);
    } else {
      audio.volume = musicVolume;
      clearInterval(interval);
      fadeIntervals.delete(phase);
    }
  }, 50);
  fadeIntervals.set(phase, interval);
}
function fadeOut(audio, phase) {
  const existing = fadeIntervals.get(phase);
  if (existing) clearInterval(existing);
  const step = musicVolume / (FADE_DURATION / 50);
  const interval = setInterval(() => {
    if (audio.volume > step) {
      audio.volume = Math.max(0, audio.volume - step);
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(interval);
      fadeIntervals.delete(phase);
    }
  }, 50);
  fadeIntervals.set(phase, interval);
}
function updateMusic(phase) {
  if (!musicEnabled) return;
  if (phase === currentPhase) return;
  const oldPhase = currentPhase;
  currentPhase = phase;
  if (oldPhase) {
    const oldAudio = audioElements[oldPhase];
    if (oldAudio) fadeOut(oldAudio, oldPhase);
  }
  const newAudio = getOrCreateAudio(phase);
  fadeIn(newAudio, phase);
}
function setMusicEnabled(enabled) {
  musicEnabled = enabled;
  if (!enabled) {
    for (const [phase, audio] of Object.entries(audioElements)) {
      const existing = fadeIntervals.get(phase);
      if (existing) {
        clearInterval(existing);
        fadeIntervals.delete(phase);
      }
      audio.volume = 0;
      audio.pause();
    }
    currentPhase = null;
  } else if (currentPhase) {
    const phase = currentPhase;
    currentPhase = null;
    updateMusic(phase);
  }
}
function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
  for (const audio of Object.values(audioElements)) {
    if (audio.volume > 0) audio.volume = musicVolume;
  }
}
function setMusicTracks(tracks) {
  let changed = false;
  for (const phase of ["dawn", "day", "dusk", "night"]) {
    if (tracks[phase] && tracks[phase] !== TRACKS[phase]) {
      TRACKS[phase] = tracks[phase];
      if (audioElements[phase]) {
        audioElements[phase].pause();
        delete audioElements[phase];
      }
      changed = true;
    }
  }
  if (changed && currentPhase && musicEnabled) {
    const phase = currentPhase;
    currentPhase = null;
    updateMusic(phase);
  }
}

// client/src/ui/ColorPicker.ts
var PRESETS = [
  // Skin tones
  "#f5d0a9",
  "#e0ac69",
  "#c68642",
  "#8d5524",
  "#613318",
  "#3b1e08",
  // Warm colors
  "#e74c3c",
  "#c0392b",
  "#e67e22",
  "#d35400",
  "#f1c40f",
  "#f39c12",
  // Cool colors
  "#3498db",
  "#2980b9",
  "#1abc9c",
  "#16a085",
  "#2ecc71",
  "#27ae60",
  // Purples & pinks
  "#9b59b6",
  "#8e44ad",
  "#e84393",
  "#fd79a8",
  "#a29bfe",
  "#6c5ce7",
  // Neutrals
  "#ecf0f1",
  "#bdc3c7",
  "#95a5a6",
  "#7f8c8d",
  "#34495e",
  "#2c3e50"
];
var HUE_STEPS = 24;
var activeOverlay = null;
var savedMenuNav = null;
function openColorPicker(anchorEl, currentColor, onConfirm, menuNav) {
  closeColorPicker();
  let selectedColor = currentColor;
  const overlay = document.createElement("div");
  overlay.className = "color-picker-overlay";
  activeOverlay = overlay;
  const panel = document.createElement("div");
  panel.className = "color-picker-panel";
  const preview = document.createElement("div");
  preview.className = "color-picker-preview";
  preview.style.background = selectedColor;
  panel.appendChild(preview);
  const grid = document.createElement("div");
  grid.className = "color-picker-grid";
  for (const color of PRESETS) {
    const swatch = document.createElement("button");
    swatch.className = "color-swatch";
    swatch.style.background = color;
    if (color.toLowerCase() === selectedColor.toLowerCase()) {
      swatch.classList.add("color-swatch-selected");
    }
    swatch.addEventListener("click", () => {
      selectedColor = color;
      preview.style.background = color;
      grid.querySelectorAll(".color-swatch-selected").forEach((el) => el.classList.remove("color-swatch-selected"));
      swatch.classList.add("color-swatch-selected");
    });
    grid.appendChild(swatch);
  }
  panel.appendChild(grid);
  const hueRow = document.createElement("div");
  hueRow.className = "color-picker-hue-row";
  for (let i = 0; i < HUE_STEPS; i++) {
    const hue = Math.round(i / HUE_STEPS * 360);
    const color = `hsl(${hue}, 70%, 50%)`;
    const swatch = document.createElement("button");
    swatch.className = "color-swatch color-swatch-hue";
    swatch.style.background = color;
    swatch.addEventListener("click", () => {
      selectedColor = hslToHex(hue, 70, 50);
      preview.style.background = selectedColor;
      grid.querySelectorAll(".color-swatch-selected").forEach((el) => el.classList.remove("color-swatch-selected"));
    });
    hueRow.appendChild(swatch);
  }
  panel.appendChild(hueRow);
  const btnRow = document.createElement("div");
  btnRow.className = "color-picker-btns";
  const okBtn = document.createElement("button");
  okBtn.className = "color-picker-ok";
  okBtn.textContent = "OK";
  okBtn.addEventListener("click", () => {
    onConfirm(selectedColor);
    closeColorPicker();
  });
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "color-picker-cancel";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", closeColorPicker);
  btnRow.appendChild(okBtn);
  btnRow.appendChild(cancelBtn);
  panel.appendChild(btnRow);
  overlay.appendChild(panel);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeColorPicker();
  });
  document.body.appendChild(overlay);
  if (menuNav) {
    savedMenuNav = menuNav;
    menuNav.activate(panel, closeColorPicker);
  }
}
function closeColorPicker() {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
  if (savedMenuNav) {
    savedMenuNav.deactivate();
    savedMenuNav = null;
  }
}
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// client/src/ui/LobbyScreen.ts
var colors = { skin: "#e0ac69", shirt: "#3b82f6", pants: "#1e3a5f" };
function setupLobby(onJoin, serverUrl, menuNav) {
  const serverHost = serverUrl || window.location.host;
  const tokenKey = `plainscape_token_${serverHost}`;
  const joinScreen = document.getElementById("join-screen");
  const usernameInput = document.getElementById("username");
  const skinBtn = document.getElementById("skin-color-btn");
  const shirtBtn = document.getElementById("shirt-color-btn");
  const pantsBtn = document.getElementById("pants-color-btn");
  const playBtn = document.getElementById("play-btn");
  const passwordInput = document.getElementById("server-password");
  const errorMsg = document.getElementById("error-msg");
  const preview = document.getElementById("char-preview");
  function setColor(part, hex) {
    colors[part] = hex;
    const btn = part === "skin" ? skinBtn : part === "shirt" ? shirtBtn : pantsBtn;
    btn.style.background = hex;
    drawPreview();
  }
  let mouseAngle = -Math.PI * 0.35;
  document.addEventListener("mousemove", (e) => {
    const rect = preview.getBoundingClientRect();
    const headScreenX = rect.left + rect.width / 2;
    const headScreenY = rect.top + rect.height * 0.35;
    mouseAngle = Math.atan2(e.clientY - headScreenY, e.clientX - headScreenX);
  });
  let previewAnimId = 0;
  function drawPreview() {
    cancelAnimationFrame(previewAnimId);
    const ctx2 = preview.getContext("2d");
    const W = preview.width;
    const H = preview.height;
    const scale = 2.5;
    const half = PLAYER_SIZE / 2;
    const swordAngle = -Math.PI * 0.35;
    function frame() {
      ctx2.clearRect(0, 0, W, H);
      ctx2.save();
      ctx2.translate(W / 2, H / 2 + 8);
      ctx2.scale(scale, scale);
      const time = Date.now() / 1e3;
      const idleFrame = stepFrame(time, 2, 2);
      const breathe = idleFrame === 0 ? 0 : -0.5;
      ctx2.fillStyle = "rgba(0,0,0,0.12)";
      ctx2.beginPath();
      ctx2.ellipse(0, half + 2, 10, 4, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = colors.pants;
      const legW = 6;
      const legH = half - 2;
      ctx2.fillRect(-half + 2, 2, legW, legH);
      ctx2.fillRect(half - legW - 2, 2, legW, legH);
      ctx2.fillStyle = darkenColor(colors.pants, 0.3);
      ctx2.fillRect(-half + 2, legH, legW, 3);
      ctx2.fillRect(half - legW - 2, legH, legW, 3);
      ctx2.save();
      ctx2.translate(0, breathe);
      ctx2.fillStyle = colors.shirt;
      ctx2.beginPath();
      ctx2.roundRect(-half, -half, PLAYER_SIZE, half + 4, 2);
      ctx2.fill();
      ctx2.fillStyle = darkenColor(colors.shirt, 0.15);
      ctx2.beginPath();
      ctx2.roundRect(-half, -half, PLAYER_SIZE / 2, half + 4, [2, 0, 0, 2]);
      ctx2.fill();
      ctx2.strokeStyle = darkenColor(colors.shirt, 0.2);
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(-3, -half);
      ctx2.lineTo(0, -half + 4);
      ctx2.lineTo(3, -half);
      ctx2.stroke();
      ctx2.fillStyle = colors.skin;
      ctx2.beginPath();
      ctx2.arc(0, -half - 5, 7, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = darkenColor(colors.skin, 0.35);
      ctx2.beginPath();
      ctx2.arc(0, -half - 9, 5, Math.PI, 0);
      ctx2.fill();
      const eyeOffX = Math.cos(mouseAngle) * 2;
      const eyeOffY = Math.sin(mouseAngle) * 1.5;
      ctx2.fillStyle = "#f0f0f0";
      ctx2.beginPath();
      ctx2.ellipse(-2.5 + eyeOffX * 0.3, -half - 5 + eyeOffY * 0.3, 2.2, 2, 0, 0, Math.PI * 2);
      ctx2.ellipse(2.5 + eyeOffX * 0.3, -half - 5 + eyeOffY * 0.3, 2.2, 2, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = "#1a1a2e";
      ctx2.beginPath();
      ctx2.arc(-2.5 + eyeOffX, -half - 5 + eyeOffY, 1.2, 0, Math.PI * 2);
      ctx2.arc(2.5 + eyeOffX, -half - 5 + eyeOffY, 1.2, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
      const gripDist = 3;
      const gripX = Math.cos(swordAngle) * gripDist;
      const gripY = Math.sin(swordAngle) * gripDist;
      const shoulderY = breathe - 2;
      ctx2.strokeStyle = colors.shirt;
      ctx2.lineWidth = 4;
      ctx2.lineCap = "round";
      ctx2.beginPath();
      ctx2.moveTo(-half - 2, shoulderY);
      ctx2.lineTo(gripX - 1, gripY);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(half + 2, shoulderY);
      ctx2.lineTo(gripX + 1, gripY);
      ctx2.stroke();
      ctx2.fillStyle = colors.skin;
      ctx2.beginPath();
      ctx2.arc(gripX - 1, gripY, 2.5, 0, Math.PI * 2);
      ctx2.arc(gripX + 1, gripY + 1, 2.5, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.save();
      ctx2.rotate(swordAngle);
      ctx2.fillStyle = "#8b7333";
      ctx2.beginPath();
      ctx2.arc(-2, 0, 2.5, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = "#5c4033";
      ctx2.fillRect(-1, -2, 6, 4);
      ctx2.strokeStyle = "#4a3328";
      ctx2.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx2.beginPath();
        ctx2.moveTo(1 + i * 2, -2);
        ctx2.lineTo(1 + i * 2, 2);
        ctx2.stroke();
      }
      ctx2.fillStyle = "#8b7333";
      ctx2.beginPath();
      ctx2.moveTo(4, -5);
      ctx2.lineTo(6, -4);
      ctx2.lineTo(6, 4);
      ctx2.lineTo(4, 5);
      ctx2.lineTo(5, 0);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = "#c0c8d8";
      ctx2.beginPath();
      ctx2.moveTo(6, -2.5);
      ctx2.lineTo(14, -2);
      ctx2.lineTo(19, -1);
      ctx2.lineTo(21, 0);
      ctx2.lineTo(19, 1);
      ctx2.lineTo(14, 2);
      ctx2.lineTo(6, 2.5);
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = "rgba(150, 160, 180, 0.6)";
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(7, 0);
      ctx2.lineTo(17, 0);
      ctx2.stroke();
      ctx2.strokeStyle = "rgba(255,255,255,0.5)";
      ctx2.lineWidth = 0.5;
      ctx2.beginPath();
      ctx2.moveTo(8, -1.5);
      ctx2.lineTo(20, 0);
      ctx2.stroke();
      ctx2.restore();
      ctx2.restore();
      previewAnimId = requestAnimationFrame(frame);
    }
    frame();
  }
  const savedUsername = localStorage.getItem("plainscape_username");
  const savedSkin = localStorage.getItem("plainscape_skin");
  const savedShirt = localStorage.getItem("plainscape_shirt");
  const savedPants = localStorage.getItem("plainscape_pants");
  if (savedUsername) {
    usernameInput.value = savedUsername;
    if (savedSkin) colors.skin = savedSkin;
    if (savedShirt) colors.shirt = savedShirt;
    if (savedPants) colors.pants = savedPants;
  } else {
    const randHex = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    colors.skin = randHex();
    colors.shirt = randHex();
    colors.pants = randHex();
  }
  skinBtn.style.background = colors.skin;
  shirtBtn.style.background = colors.shirt;
  pantsBtn.style.background = colors.pants;
  drawPreview();
  const openPicker = (part, btn) => {
    openColorPicker(btn, colors[part], (hex) => {
      setColor(part, hex);
      if (menuNav) {
        const form = joinScreen.querySelector(".join-form");
        if (form) menuNav.activate(form, () => {
        });
      }
    }, menuNav);
  };
  skinBtn.addEventListener("click", () => openPicker("skin", skinBtn));
  shirtBtn.addEventListener("click", () => openPicker("shirt", shirtBtn));
  pantsBtn.addEventListener("click", () => openPicker("pants", pantsBtn));
  const randomizeBtn = document.getElementById("randomize-btn");
  if (randomizeBtn) {
    randomizeBtn.addEventListener("click", () => {
      const randHex = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
      setColor("skin", randHex());
      setColor("shirt", randHex());
      setColor("pants", randHex());
    });
  }
  function doJoin() {
    const username = usernameInput.value.trim();
    if (!username) {
      errorMsg.textContent = "Enter a username";
      return;
    }
    playBtn.disabled = true;
    errorMsg.textContent = "";
    let token = localStorage.getItem(tokenKey);
    if (!token) {
      if (typeof crypto.randomUUID === "function") {
        token = crypto.randomUUID();
      } else {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      }
      localStorage.setItem(tokenKey, token);
    }
    localStorage.setItem("plainscape_username", username);
    localStorage.setItem("plainscape_skin", colors.skin);
    localStorage.setItem("plainscape_shirt", colors.shirt);
    localStorage.setItem("plainscape_pants", colors.pants);
    const pw = passwordInput?.value || void 0;
    onJoin({
      token,
      username,
      colors: {
        skin: colors.skin,
        shirt: colors.shirt,
        pants: colors.pants
      },
      password: pw
    });
  }
  playBtn.addEventListener("click", doJoin);
  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doJoin();
  });
  usernameInput.addEventListener("touchend", (e) => {
    e.stopPropagation();
    usernameInput.focus();
  });
}
function showError(msg) {
  const errorEl = document.getElementById("error-msg");
  const playBtn = document.getElementById("play-btn");
  if (errorEl) errorEl.textContent = msg;
  if (playBtn) playBtn.disabled = false;
}
function hideJoinScreen() {
  const joinScreen = document.getElementById("join-screen");
  const gameScreen = document.getElementById("game-screen");
  const hud = document.getElementById("hud");
  if (joinScreen) joinScreen.style.display = "none";
  if (gameScreen) gameScreen.style.display = "block";
  if (hud) hud.style.display = "block";
  document.body.classList.add("in-game");
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
}

// client/src/ui/Leaderboard.ts
var PHOENIX_UTC_OFFSET = -7;
var DUSK_HOUR = 18;
function getNextDuskMs() {
  const now = /* @__PURE__ */ new Date();
  const phoenixMs = now.getTime() + PHOENIX_UTC_OFFSET * 36e5;
  const phoenix = new Date(phoenixMs);
  const target = new Date(phoenix);
  target.setUTCHours(DUSK_HOUR, 0, 0, 0);
  if (phoenix >= target) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return target.getTime() - PHOENIX_UTC_OFFSET * 36e5;
}
var timerInterval = null;
function startChampionTimer() {
  const el = document.getElementById("champion-timer");
  if (!el || timerInterval) return;
  function update() {
    const remaining = getNextDuskMs() - Date.now();
    if (remaining <= 0) {
      el.textContent = "Champion selection now!";
      return;
    }
    const hrs = Math.floor(remaining / 36e5);
    const mins = Math.floor(remaining % 36e5 / 6e4);
    const secs = Math.floor(remaining % 6e4 / 1e3);
    const pad = (n) => String(n).padStart(2, "0");
    el.textContent = `Next champion: ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  update();
  timerInterval = setInterval(update, 1e3);
}
function updateLeaderboard(entries, selfUsername) {
  const container = document.getElementById("lb-entries");
  if (!container) return;
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "lb-entry";
    empty.style.color = "#666";
    empty.style.fontStyle = "italic";
    empty.textContent = "No data yet";
    container.appendChild(empty);
    return;
  }
  for (const entry of entries) {
    const div = document.createElement("div");
    div.className = "lb-entry" + (entry.username === selfUsername ? " lb-self" : "");
    const rank = document.createElement("span");
    rank.className = "lb-rank";
    rank.textContent = `${entry.rank}.`;
    const name = document.createElement("span");
    name.className = "lb-name";
    name.textContent = entry.username;
    const score = document.createElement("span");
    score.className = "lb-score";
    score.textContent = String(entry.totalSource);
    div.appendChild(rank);
    div.appendChild(name);
    div.appendChild(score);
    container.appendChild(div);
  }
}
function updateChampionInfo(username, ruleText) {
  let el = document.getElementById("champion-info");
  if (!el) {
    const timer = document.getElementById("champion-timer");
    if (!timer) return;
    el = document.createElement("div");
    el.id = "champion-info";
    timer.insertAdjacentElement("afterend", el);
  }
  const status = ruleText ? "Rule added" : "Choosing rule...";
  el.textContent = `Champion: ${username} \u2014 ${status}`;
  el.title = ruleText ?? "Waiting for rule selection";
}

// client/src/ui/EscMenu.ts
function updateRules(rules) {
  const list = document.getElementById("rules-list");
  if (!list) return;
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  if (rules.length === 0) {
    const li = document.createElement("li");
    li.className = "no-rules";
    li.textContent = "No active rules this week.";
    list.appendChild(li);
    return;
  }
  for (const rule of rules) {
    const li = document.createElement("li");
    const parts = rule.text.split(/(\*\*.+?\*\*)/g);
    for (const part of parts) {
      if (part.startsWith("**") && part.endsWith("**")) {
        const strong = document.createElement("strong");
        strong.textContent = part.slice(2, -2);
        li.appendChild(strong);
      } else {
        li.appendChild(document.createTextNode(part));
      }
    }
    li.appendChild(document.createTextNode(" "));
    const author = document.createElement("span");
    author.className = "rule-author";
    author.textContent = `\u2014 added by ${rule.createdBy} `;
    const badge = document.createElement("span");
    if (rule.status === "success") {
      badge.textContent = "\u2713";
      badge.style.color = "#4caf50";
    } else if (rule.status === "failed") {
      badge.textContent = "\u2717";
      badge.style.color = "#e74c3c";
    } else {
      badge.textContent = "\u23F3";
      badge.style.color = "#f0c040";
    }
    author.appendChild(badge);
    li.appendChild(author);
    list.appendChild(li);
  }
  list.classList.remove("rule-alert");
  void list.offsetWidth;
  list.classList.add("rule-alert");
}

// client/src/ui/WinnerModal.ts
var inputRef = null;
function initWinnerModal(input2) {
  inputRef = input2;
}
function showWinnerModal(winnerName, topSuggestion, onSubmit) {
  const modal = document.getElementById("winner-modal");
  const ruleInput = document.getElementById("rule-input");
  const submitBtn = document.getElementById("submit-rule");
  const status = document.getElementById("winner-status");
  const suggBox = document.getElementById("suggestion-option");
  if (!modal || !ruleInput || !submitBtn) return;
  modal.style.display = "flex";
  ruleInput.value = "";
  ruleInput.focus();
  if (submitBtn) submitBtn.disabled = false;
  if (status) status.textContent = "";
  if (suggBox) {
    if (topSuggestion) {
      suggBox.style.display = "block";
      const suggText = suggBox.querySelector(".sugg-text");
      const suggVotes = suggBox.querySelector(".sugg-votes");
      const pickBtn = suggBox.querySelector("#pick-suggestion");
      if (suggText) suggText.textContent = `"${topSuggestion.text}"`;
      if (suggVotes) suggVotes.textContent = `${topSuggestion.votes} vote${topSuggestion.votes !== 1 ? "s" : ""} - by ${topSuggestion.createdBy}`;
      if (pickBtn) {
        const newPickBtn = pickBtn.cloneNode(true);
        pickBtn.parentNode.replaceChild(newPickBtn, pickBtn);
        newPickBtn.addEventListener("click", () => {
          newPickBtn.disabled = true;
          if (status) status.textContent = "Adopting community suggestion...";
          onSubmit(`__PICK_SUGGESTION_${topSuggestion.id}__`);
        });
      }
    } else {
      suggBox.style.display = "none";
    }
  }
  if (inputRef) {
    inputRef.modalOpen = true;
    if (inputRef.gamepad.enabled && inputRef.gamepad.connected) {
      const inner = modal.querySelector(".winner-inner") || modal;
      inputRef.menuNav.activate(inner, () => {
      });
    }
  }
  const newBtn = submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newBtn, submitBtn);
  newBtn.addEventListener("click", () => {
    const text = ruleInput.value.trim();
    if (!text) {
      if (status) status.textContent = "Please enter a rule.";
      return;
    }
    if (text.length > 500) {
      if (status) status.textContent = "Rule must be under 500 characters.";
      return;
    }
    newBtn.disabled = true;
    if (status) status.textContent = "Submitting to the game master... (you will be sacrificed)";
    onSubmit(text);
  });
}
function hideWinnerModal() {
  const modal = document.getElementById("winner-modal");
  if (modal) modal.style.display = "none";
  if (inputRef) {
    inputRef.modalOpen = false;
    inputRef.menuNav.deactivate();
  }
}

// client/src/ui/Chat.ts
var PROFANITY_LIST = [
  "fuck",
  "shit",
  "ass",
  "bitch",
  "dick",
  "cock",
  "pussy",
  "cunt",
  "damn",
  "bastard",
  "whore",
  "slut",
  "fag",
  "nigger",
  "nigga",
  "retard",
  "rape"
];
var PROFANITY_REGEX = new RegExp(
  "\\b(" + PROFANITY_LIST.join("|") + ")\\w*\\b",
  "gi"
);
var censorEnabled = true;
var HISTORY_SIZE = 20;
var messageHistory = [];
function applyCensorFilter(text) {
  if (!censorEnabled) return text;
  return text.replace(PROFANITY_REGEX, (match) => "*".repeat(match.length));
}
function addChatMessage(username, text, whisper) {
  messageHistory.push({ username, text });
  if (messageHistory.length > HISTORY_SIZE) {
    messageHistory.shift();
  }
  const container = document.getElementById("chat-messages");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "chat-msg";
  if (whisper) div.classList.add("chat-whisper");
  const nameSpan = document.createElement("span");
  nameSpan.className = "chat-name";
  nameSpan.textContent = (whisper ? "[Whisper] " : "") + username + ": ";
  div.appendChild(nameSpan);
  div.appendChild(document.createTextNode(text));
  container.appendChild(div);
  while (container.children.length > 50) {
    container.removeChild(container.firstChild);
  }
  container.scrollTop = container.scrollHeight;
}
function setupChat(conn2, input2) {
  const chatInput = document.getElementById("chat-input");
  const chatWrapper = document.getElementById("chat-input-wrapper");
  const chatContainer = document.getElementById("chat-messages");
  if (!chatInput || !chatWrapper || !chatContainer) return;
  let chatOpen = false;
  const censorToggle = document.getElementById("censor-toggle");
  if (censorToggle) {
    censorToggle.checked = censorEnabled;
    censorToggle.addEventListener("change", () => {
      censorEnabled = censorToggle.checked;
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (chatOpen) {
        const text = chatInput.value.trim();
        if (text) {
          conn2.send({ type: "chat", text });
        }
        chatInput.value = "";
        chatWrapper.style.display = "none";
        chatOpen = false;
        input2.chatOpen = false;
        e.preventDefault();
      } else if (!input2.menuOpen && !input2.modalOpen) {
        chatWrapper.style.display = "block";
        chatInput.focus();
        chatOpen = true;
        input2.chatOpen = true;
        e.preventDefault();
      }
    } else if (e.key === "Escape" && chatOpen) {
      chatInput.value = "";
      chatWrapper.style.display = "none";
      chatOpen = false;
      input2.chatOpen = false;
      hideHistory();
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

// client/src/ui/StatsPanel.ts
var panelOpen = false;
function setupStatsPanel(conn2, input2, state2) {
  const btn = document.getElementById("stats-btn");
  const panel = document.getElementById("stats-panel");
  const closeBtn = document.getElementById("close-stats");
  const rowsContainer = document.getElementById("stats-rows");
  const sourceEl = document.getElementById("stats-source");
  const rowElements = /* @__PURE__ */ new Map();
  btn.addEventListener("click", () => {
    if (panelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });
  closeBtn.addEventListener("click", closePanel);
  panel.addEventListener("click", (e) => {
    if (e.target === panel) closePanel();
  });
  function openPanel() {
    panelOpen = true;
    input2.statsOpen = true;
    panel.style.display = "flex";
    buildRows();
    if (input2.gamepad.enabled && input2.gamepad.connected) {
      const inner = panel.querySelector(".stats-inner") || panel;
      input2.menuNav.activate(inner, closePanel);
    }
  }
  function closePanel() {
    panelOpen = false;
    input2.statsOpen = false;
    panel.style.display = "none";
    input2.menuNav.deactivate();
  }
  function buildRows() {
    rowsContainer.textContent = "";
    rowElements.clear();
    for (const stat of STAT_NAMES) {
      const row = document.createElement("div");
      row.className = "stat-row";
      const nameEl = document.createElement("span");
      nameEl.className = "stat-name";
      nameEl.textContent = STAT_DISPLAY_NAMES[stat];
      const levelEl = document.createElement("span");
      levelEl.className = "stat-level";
      const upgradeBtn = document.createElement("button");
      upgradeBtn.className = "stat-upgrade";
      upgradeBtn.textContent = "+1";
      upgradeBtn.addEventListener("click", () => {
        conn2.send({ type: "level_up", stat });
      });
      row.appendChild(nameEl);
      row.appendChild(levelEl);
      row.appendChild(upgradeBtn);
      rowsContainer.appendChild(row);
      rowElements.set(stat, { levelEl, upgradeBtn });
    }
    updateRows();
  }
  function updateRows() {
    for (const stat of STAT_NAMES) {
      const els = rowElements.get(stat);
      if (!els) continue;
      const level = state2.selfStatLevels[stat];
      const canUpgrade = state2.selfSource >= STAT_LEVEL_COST && level < STAT_MAX_LEVEL;
      els.levelEl.textContent = `${level}/${STAT_MAX_LEVEL}`;
      els.upgradeBtn.disabled = !canUpgrade;
    }
    sourceEl.textContent = `Available: ${state2.selfSource} Source`;
  }
  function updatePulse() {
    const hasAnyUpgradeable = state2.selfSource >= STAT_LEVEL_COST && STAT_NAMES.some((s) => state2.selfStatLevels[s] < STAT_MAX_LEVEL);
    btn.classList.toggle("can-upgrade", hasAnyUpgradeable);
  }
  const origApply = state2.applySnapshot.bind(state2);
  const patchedApply = (...args) => {
    origApply(...args);
    updatePulse();
    if (panelOpen) updateRows();
  };
  state2.applySnapshot = patchedApply;
}

// client/src/ui/NpcPanels.ts
function activateMenuNav(input2, panel, closeFn) {
  if (input2.gamepad.enabled && input2.gamepad.connected) {
    const inner = panel.querySelector(".npc-inner, .sign-inner") || panel;
    input2.menuNav.activate(inner, closeFn);
  }
}
var bankOpen = false;
var scribeOpen = false;
var signOpen = false;
function setupNpcPanels(conn2, input2, state2) {
  const bankPanel = document.getElementById("bank-panel");
  const scribePanel = document.getElementById("scribe-panel");
  const signPanel = document.getElementById("sign-panel");
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "e") return;
    if (input2.menuOpen || input2.chatOpen || input2.modalOpen || input2.statsOpen) return;
    if (state2.selfDead) return;
    if (state2.myId === 0) return;
    if (bankOpen) {
      closeBankPanel();
      return;
    }
    if (scribeOpen) {
      closeScribePanel();
      return;
    }
    if (signOpen) {
      closeSignPanel();
      return;
    }
    const dist2Banker = Math.hypot(state2.selfPos.x - BANKER_POS.x, state2.selfPos.y - BANKER_POS.y);
    const dist2Scribe = Math.hypot(state2.selfPos.x - SCRIBE_POS.x, state2.selfPos.y - SCRIBE_POS.y);
    const dist2PatchNotes = Math.hypot(state2.selfPos.x - PATCH_NOTES_SIGN_POS.x, state2.selfPos.y - PATCH_NOTES_SIGN_POS.y);
    const dist2Rules = Math.hypot(state2.selfPos.x - RULES_SIGN_POS.x, state2.selfPos.y - RULES_SIGN_POS.y);
    const dist2Notices = Math.hypot(state2.selfPos.x - NOTICES_SIGN_POS.x, state2.selfPos.y - NOTICES_SIGN_POS.y);
    if (dist2Banker < BANK_NPC_RANGE) {
      openBankPanel();
    } else if (dist2Scribe < SCRIBE_NPC_RANGE) {
      openScribePanel();
    } else if (dist2PatchNotes < SIGN_RANGE) {
      openSignPanel("patch_notes");
    } else if (dist2Rules < SIGN_RANGE) {
      openSignPanel("rules");
    } else if (dist2Notices < SIGN_RANGE) {
      openSignPanel("notices");
    }
  });
  function openBankPanel() {
    bankOpen = true;
    input2.statsOpen = true;
    bankPanel.style.display = "flex";
    renderBank();
    activateMenuNav(input2, bankPanel, closeBankPanel);
  }
  function closeBankPanel() {
    bankOpen = false;
    input2.statsOpen = false;
    bankPanel.style.display = "none";
    input2.menuNav.deactivate();
  }
  function openScribePanel() {
    scribeOpen = true;
    input2.statsOpen = true;
    scribePanel.style.display = "flex";
    renderScribe();
    activateMenuNav(input2, scribePanel, closeScribePanel);
  }
  function closeScribePanel() {
    scribeOpen = false;
    input2.statsOpen = false;
    scribePanel.style.display = "none";
    input2.menuNav.deactivate();
  }
  function openSignPanel(kind) {
    signOpen = true;
    input2.statsOpen = true;
    signPanel.style.display = "flex";
    renderSign(kind);
    activateMenuNav(input2, signPanel, closeSignPanel);
  }
  function closeSignPanel() {
    signOpen = false;
    input2.statsOpen = false;
    signPanel.style.display = "none";
    input2.menuNav.deactivate();
  }
  function renderSign(kind) {
    const inner = signPanel.querySelector(".sign-inner");
    const title = signPanel.querySelector(".sign-title");
    const content = signPanel.querySelector(".sign-content");
    inner.className = "sign-inner sign-" + kind;
    if (kind === "patch_notes") {
      title.textContent = "Updates";
      content.textContent = "";
      if (state2.patchNotes.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "color:#666;font-style:italic";
        empty.textContent = "No patch notes yet.";
        content.appendChild(empty);
        return;
      }
      for (const note of state2.patchNotes) {
        const entry = document.createElement("div");
        entry.className = "sign-entry";
        const header = document.createElement("div");
        header.className = "sign-entry-header";
        header.textContent = `v${note.version} \u2014 ${note.date}`;
        entry.appendChild(header);
        for (const change of note.changes) {
          const li = document.createElement("div");
          li.className = "sign-entry-item";
          li.textContent = `\u2022 ${change}`;
          entry.appendChild(li);
        }
        content.appendChild(entry);
      }
    } else if (kind === "rules") {
      title.textContent = "Rules";
      content.textContent = "";
      if (state2.rules.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "color:#666;font-style:italic";
        empty.textContent = "No active rules.";
        content.appendChild(empty);
      } else {
        for (const rule of state2.rules) {
          const entry = document.createElement("div");
          entry.className = "sign-entry";
          const text = document.createElement("div");
          text.className = "sign-entry-item";
          const plain = rule.text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/_(.+?)_/g, "$1");
          text.textContent = `"${plain}"`;
          text.style.color = "#ddd";
          entry.appendChild(text);
          const meta = document.createElement("div");
          meta.className = "sign-entry-meta";
          meta.textContent = `\u2014 ${rule.createdBy} `;
          const badge = document.createElement("span");
          if (rule.status === "success") {
            badge.textContent = "\u2713 Implemented";
            badge.style.cssText = "color:#4caf50;font-weight:bold;font-size:11px";
          } else if (rule.status === "failed") {
            badge.textContent = "\u2717 Failed";
            badge.style.cssText = "color:#e74c3c;font-weight:bold;font-size:11px";
          } else {
            badge.textContent = "\u23F3 Pending";
            badge.style.cssText = "color:#f0c040;font-weight:bold;font-size:11px";
          }
          meta.appendChild(badge);
          entry.appendChild(meta);
          content.appendChild(entry);
        }
      }
      const promptBtn = document.createElement("button");
      promptBtn.textContent = "View AI Prompt";
      promptBtn.style.cssText = "display:block;margin:12px auto 0;background:rgba(192,57,43,0.15);border:1px solid rgba(192,57,43,0.4);color:#e74c3c;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;transition:background 0.2s";
      promptBtn.addEventListener("click", async () => {
        try {
          const res = await fetch("/api/ai-prompt");
          const text = await res.text();
          title.textContent = "AI Prompt";
          content.textContent = "";
          const pre = document.createElement("pre");
          pre.style.cssText = "white-space:pre-wrap;word-wrap:break-word;color:#ccc;font-size:12px;line-height:1.6;font-family:inherit;margin:0";
          pre.textContent = text;
          content.appendChild(pre);
          const backBtn = document.createElement("button");
          backBtn.textContent = "Back to Rules";
          backBtn.style.cssText = "display:block;margin:12px auto 0;background:rgba(192,57,43,0.15);border:1px solid rgba(192,57,43,0.4);color:#e74c3c;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;transition:background 0.2s";
          backBtn.addEventListener("click", () => {
            renderSign("rules");
            activateMenuNav(input2, signPanel, closeSignPanel);
          });
          content.appendChild(backBtn);
          if (input2.gamepad.enabled && input2.gamepad.connected) {
            input2.menuNav.rescan();
          }
        } catch {
        }
      });
      content.appendChild(promptBtn);
    } else {
      title.textContent = "Admin Notices";
      content.textContent = "";
      if (state2.adminNotices.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "color:#666;font-style:italic";
        empty.textContent = "No notices at this time.";
        content.appendChild(empty);
        return;
      }
      for (const notice of state2.adminNotices) {
        const entry = document.createElement("div");
        entry.className = "sign-entry";
        const text = document.createElement("div");
        text.className = "sign-entry-item";
        text.textContent = notice.text;
        text.style.color = "#ddd";
        entry.appendChild(text);
        const date = document.createElement("div");
        date.className = "sign-entry-meta";
        date.textContent = new Date(notice.createdAt).toLocaleDateString();
        entry.appendChild(date);
        content.appendChild(entry);
      }
    }
  }
  document.getElementById("close-bank")?.addEventListener("click", closeBankPanel);
  document.getElementById("close-scribe")?.addEventListener("click", closeScribePanel);
  document.getElementById("close-sign")?.addEventListener("click", closeSignPanel);
  bankPanel.addEventListener("click", (e) => {
    if (e.target === bankPanel) closeBankPanel();
  });
  scribePanel.addEventListener("click", (e) => {
    if (e.target === scribePanel) closeScribePanel();
  });
  signPanel.addEventListener("click", (e) => {
    if (e.target === signPanel) closeSignPanel();
  });
  document.getElementById("deposit-all")?.addEventListener("click", () => {
    if (state2.selfSource > 0) {
      conn2.send({ type: "deposit", amount: state2.selfSource });
      setTimeout(renderBank, 100);
    }
  });
  document.getElementById("withdraw-all")?.addEventListener("click", () => {
    if (state2.selfBankedSource > 0) {
      conn2.send({ type: "withdraw", amount: state2.selfBankedSource });
      setTimeout(renderBank, 100);
    }
  });
  document.getElementById("deposit-btn")?.addEventListener("click", () => {
    const input3 = document.getElementById("bank-amount");
    const amt = parseInt(input3.value, 10);
    if (amt > 0 && amt <= state2.selfSource) {
      conn2.send({ type: "deposit", amount: amt });
      input3.value = "";
      setTimeout(renderBank, 100);
    }
  });
  document.getElementById("withdraw-btn")?.addEventListener("click", () => {
    const input3 = document.getElementById("bank-amount");
    const amt = parseInt(input3.value, 10);
    if (amt > 0 && amt <= state2.selfBankedSource) {
      conn2.send({ type: "withdraw", amount: amt });
      input3.value = "";
      setTimeout(renderBank, 100);
    }
  });
  document.getElementById("submit-suggestion-btn")?.addEventListener("click", () => {
    const input3 = document.getElementById("suggestion-input");
    const text = input3.value.trim();
    if (!text) return;
    conn2.send({ type: "submit_suggestion", text });
    input3.value = "";
    setTimeout(renderScribe, 200);
  });
  function renderBank() {
    const pocket = document.getElementById("bank-pocket");
    const banked = document.getElementById("bank-banked");
    pocket.textContent = `${state2.selfSource}`;
    banked.textContent = `${state2.selfBankedSource}`;
  }
  function renderScribe() {
    const list = document.getElementById("suggestion-list");
    list.textContent = "";
    if (state2.suggestions.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "color:#666;font-style:italic;padding:8px 0";
      empty.textContent = "No suggestions yet. Be the first!";
      list.appendChild(empty);
      return;
    }
    for (const sugg of state2.suggestions) {
      const row = document.createElement("div");
      row.className = "sugg-row";
      const textEl = document.createElement("div");
      textEl.className = "sugg-row-text";
      textEl.textContent = sugg.text;
      const meta = document.createElement("div");
      meta.className = "sugg-row-meta";
      meta.textContent = `by ${sugg.createdBy} | ${sugg.votes} vote${sugg.votes !== 1 ? "s" : ""}`;
      const voteBtn = document.createElement("button");
      voteBtn.className = "sugg-vote-btn";
      if (sugg.votedByMe) {
        voteBtn.textContent = "Voted";
        voteBtn.disabled = true;
      } else {
        voteBtn.textContent = `Vote (${VOTE_COST})`;
        voteBtn.addEventListener("click", () => {
          conn2.send({ type: "vote_suggestion", suggestionId: sugg.id });
          setTimeout(renderScribe, 200);
        });
      }
      row.appendChild(textEl);
      row.appendChild(meta);
      row.appendChild(voteBtn);
      list.appendChild(row);
    }
  }
  const origApply = state2.applySnapshot.bind(state2);
  state2.applySnapshot = (...args) => {
    origApply(...args);
    if (bankOpen) renderBank();
  };
  const origOnSuggestionsUpdate = state2.onSuggestionsUpdate;
  state2.onSuggestionsUpdate = () => {
    if (origOnSuggestionsUpdate) origOnSuggestionsUpdate();
    if (scribeOpen) {
      renderScribe();
      if (input2.menuNav.active) input2.menuNav.rescan();
    }
  };
}

// client/src/ui/WhitelistPanel.ts
var SLOT_COUNT = 10;
var panelOpen2 = false;
var currentBuildingId = null;
function setupWhitelistPanel(conn2, input2) {
  const panel = document.getElementById("whitelist-panel");
  const namesDiv = document.getElementById("whitelist-names");
  const saveBtn = document.getElementById("whitelist-save");
  const titleEl = document.getElementById("whitelist-title");
  function open(buildingId, btype, whitelist, ownerName) {
    currentBuildingId = buildingId;
    panelOpen2 = true;
    input2.modalOpen = true;
    titleEl.textContent = `${btype.charAt(0).toUpperCase() + btype.slice(1)} Whitelist`;
    panel.style.display = "flex";
    renderSlots(whitelist, ownerName);
    if (input2.gamepad.enabled && input2.gamepad.connected) {
      const inner = panel.querySelector(".npc-inner") || panel;
      input2.menuNav.activate(inner, close);
    }
  }
  function close() {
    panelOpen2 = false;
    input2.modalOpen = false;
    panel.style.display = "none";
    currentBuildingId = null;
    input2.menuNav.deactivate();
  }
  function renderSlots(names, ownerName) {
    namesDiv.textContent = "";
    for (let i = 0; i < SLOT_COUNT; i++) {
      const row = document.createElement("div");
      row.className = "whitelist-entry";
      const label = document.createElement("span");
      label.className = "wl-slot-num";
      label.textContent = `${i + 1}.`;
      row.appendChild(label);
      const inp = document.createElement("input");
      inp.type = "text";
      inp.maxLength = 20;
      inp.placeholder = i === 0 ? ownerName : "";
      if (i < names.length) {
        inp.value = names[i];
      }
      if (i === 0) {
        inp.value = ownerName;
        inp.disabled = true;
        inp.style.opacity = "0.5";
      }
      row.appendChild(inp);
      namesDiv.appendChild(row);
    }
  }
  saveBtn.addEventListener("click", () => {
    if (currentBuildingId === null) return;
    const inputs = namesDiv.querySelectorAll("input");
    const usernames = [];
    inputs.forEach((inp, i) => {
      if (i === 0) return;
      const val = inp.value.trim();
      if (val && !usernames.includes(val)) {
        usernames.push(val);
      }
    });
    conn2.send({
      type: "whitelist",
      buildingId: currentBuildingId,
      usernames
    });
    close();
  });
  panel.addEventListener("click", (e) => {
    if (e.target === panel) close();
  });
  window.__openWhitelist = open;
}
function openWhitelistPanel(buildingId, btype, whitelist, ownerName) {
  const fn = window.__openWhitelist;
  if (fn) fn(buildingId, btype, whitelist, ownerName);
}

// client/src/ui/MobileHud.ts
var isMobileDevice = false;
var feedDrawerOpen = false;
var mobileUnread = 0;
function detectMobile() {
  return navigator.maxTouchPoints > 0;
}
async function enterFullscreenLandscape() {
  try {
    await document.documentElement.requestFullscreen();
    try {
      await screen.orientation.lock("landscape");
    } catch {
    }
  } catch {
  }
}
function setupMobileHud(conn2, input2, state2) {
  isMobileDevice = true;
  document.body.classList.add("mobile");
  showAs("mobile-lb-btn", "flex");
  showAs("mobile-feed-strip", "block");
  showAs("mobile-menu-btn", "flex");
  showAs("mobile-attack-btns", "flex");
  showAs("mobile-build-toggle", "block");
  showAs("mobile-shield-btn", "flex");
  showAs("mobile-parry-btn", "flex");
  showAs("mobile-dash-btn", "flex");
  showAs("mobile-parry-btn", "flex");
  enterFullscreenLandscape();
  setupLeaderboardToggle();
  setupHpBarStatsTap();
  setupFeedStrip(conn2, input2);
  setupAttackButtons(input2);
  setupShieldButton(input2);
  setupParryButton(input2);
  setupDashButton(conn2);
  setupMenuButton(input2);
  setupBuildTray(input2);
  setupInteractButton(input2, state2);
  setupCanvasTouch(input2, state2, conn2);
}
function updateMobileInteract(state2) {
  if (!isMobileDevice) return;
  const gamepadActive = document.body.classList.contains("gamepad-active");
  const btn = document.getElementById("mobile-interact-btn");
  if (!btn) return;
  const nearInteractable = isNearInteractable(state2);
  const shouldShow = nearInteractable !== null && !state2.selfDead && !gamepadActive;
  if (shouldShow) {
    btn.style.display = "flex";
    btn.textContent = nearInteractable;
  } else {
    btn.style.display = "none";
  }
}
function isNearInteractable(state2) {
  const px = state2.selfPos.x;
  const py = state2.selfPos.y;
  if (Math.hypot(px - BANKER_POS.x, py - BANKER_POS.y) < BANK_NPC_RANGE) return "BANK";
  if (Math.hypot(px - SCRIBE_POS.x, py - SCRIBE_POS.y) < SCRIBE_NPC_RANGE) return "SCRIBE";
  if (Math.hypot(px - PATCH_NOTES_SIGN_POS.x, py - PATCH_NOTES_SIGN_POS.y) < SIGN_RANGE) return "UPDATES";
  if (Math.hypot(px - RULES_SIGN_POS.x, py - RULES_SIGN_POS.y) < SIGN_RANGE) return "RULES";
  if (Math.hypot(px - NOTICES_SIGN_POS.x, py - NOTICES_SIGN_POS.y) < SIGN_RANGE) return "NOTICES";
  return null;
}
function showAs(id, display) {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
}
var MAX_STRIP_ITEMS = 3;
var STRIP_FADE_MS = 6e3;
var feedItems = [];
function addToFeed(html) {
  feedItems.push({ html, time: Date.now() });
  if (feedItems.length > 50) feedItems.shift();
  updateFeedStrip();
  const drawerMsgs = document.getElementById("mobile-feed-msgs");
  if (drawerMsgs) {
    const div = document.createElement("div");
    div.className = "mobile-feed-item";
    div.innerHTML = html;
    drawerMsgs.appendChild(div);
    while (drawerMsgs.children.length > 80) drawerMsgs.removeChild(drawerMsgs.firstChild);
    drawerMsgs.scrollTop = drawerMsgs.scrollHeight;
  }
  if (!feedDrawerOpen) {
    mobileUnread++;
    const badge = document.getElementById("mobile-feed-badge");
    if (badge) {
      badge.textContent = mobileUnread > 9 ? "9+" : String(mobileUnread);
      badge.classList.add("visible");
    }
  }
}
function updateFeedStrip() {
  const strip = document.getElementById("mobile-feed-strip-items");
  if (!strip) return;
  const now = Date.now();
  const recent = feedItems.filter((f) => now - f.time < STRIP_FADE_MS).slice(-MAX_STRIP_ITEMS);
  strip.innerHTML = "";
  for (const item of recent) {
    const age = (now - item.time) / STRIP_FADE_MS;
    const div = document.createElement("div");
    div.className = "mobile-feed-strip-msg";
    div.style.opacity = String(Math.max(0.3, 1 - age));
    div.innerHTML = item.html;
    strip.appendChild(div);
  }
}
setInterval(updateFeedStrip, 1e3);
function addMobileChatMessage(username, text, whisper) {
  if (!isMobileDevice) return;
  const prefix = whisper ? '<span class="chat-whisper-label">[Whisper] </span>' : "";
  addToFeed(`${prefix}<span class="chat-name">${escapeHtml(username)}:</span> ${escapeHtml(text)}`);
}
function addMobileNotification(text, cssClass) {
  if (!isMobileDevice) return;
  const cls = cssClass ? ` ${cssClass}` : "";
  addToFeed(`<span class="mobile-feed-notif${cls}">${escapeHtml(text)}</span>`);
}
function updateMobileLb(entries, selfUsername, onlineUsernames) {
  if (!isMobileDevice) return;
  const lbEl = document.getElementById("mobile-lb-entries");
  if (lbEl) {
    lbEl.textContent = "";
    entries.slice(0, 10).forEach((e, i) => {
      const row = document.createElement("div");
      row.className = "lb-entry" + (e.username === selfUsername ? " lb-self" : "");
      row.innerHTML = `<span class="lb-rank">${i + 1}</span><span class="lb-name">${escapeHtml(e.username)}</span><span class="lb-score">${e.totalSource}</span>`;
      lbEl.appendChild(row);
    });
  }
  const olEl = document.getElementById("mobile-online-list");
  if (olEl) {
    olEl.textContent = "";
    onlineUsernames.slice(0, 20).forEach((name) => {
      const el = document.createElement("div");
      el.className = "online-name" + (name === selfUsername ? " online-self" : "");
      el.textContent = name;
      olEl.appendChild(el);
    });
  }
  const label = document.getElementById("mobile-lb-label");
  if (label) label.textContent = `${onlineUsernames.length}`;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function setupLeaderboardToggle() {
  const btn = document.getElementById("mobile-lb-btn");
  const panel = document.getElementById("mobile-lb-panel");
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    panel.classList.toggle("open");
  }, { passive: false });
  document.addEventListener("touchstart", (e) => {
    if (panel.classList.contains("open") && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.remove("open");
    }
  }, { passive: true });
}
function setupHpBarStatsTap() {
  const hpOuter = document.querySelector(".hp-bar-outer");
  if (!hpOuter) return;
  hpOuter.addEventListener("touchstart", (e) => {
    e.preventDefault();
    document.getElementById("stats-btn")?.click();
  }, { passive: false });
}
function setupFeedStrip(conn2, input2) {
  const strip = document.getElementById("mobile-feed-strip");
  const drawer = document.getElementById("mobile-feed-drawer");
  const closeBtn = document.getElementById("mobile-feed-drawer-close");
  const sendBtn = document.getElementById("mobile-feed-send");
  const chatInput = document.getElementById("mobile-feed-input");
  const badge = document.getElementById("mobile-feed-badge");
  strip.addEventListener("touchstart", (e) => {
    if (e.target.closest(".mobile-feed-strip-msg, #mobile-feed-badge, #mobile-feed-strip")) {
      e.preventDefault();
      openDrawer();
    }
  }, { passive: false });
  function openDrawer() {
    feedDrawerOpen = true;
    mobileUnread = 0;
    if (badge) {
      badge.classList.remove("visible");
      badge.textContent = "0";
    }
    drawer.classList.add("open");
    input2.chatOpen = true;
    const msgs = document.getElementById("mobile-feed-msgs");
    msgs.scrollTop = msgs.scrollHeight;
  }
  closeBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    feedDrawerOpen = false;
    drawer.classList.remove("open");
    input2.chatOpen = false;
    chatInput.blur();
  }, { passive: false });
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    conn2.send({ type: "chat", text });
    chatInput.value = "";
  }
  sendBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    sendMessage();
  }, { passive: false });
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}
function setupAttackButtons(input2) {
  document.querySelectorAll(".mobile-atk-btn").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mode = btn.dataset.atk;
      if (!input2.touch) return;
      input2.touch.defaultAttack = mode;
      document.querySelectorAll(".mobile-atk-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }, { passive: false });
  });
}
function setupShieldButton(input2) {
  const btn = document.getElementById("mobile-shield-btn");
  if (!btn || !input2.touch) return;
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    input2.touch.fireShield();
    btn.classList.add("held");
  }, { passive: false });
  btn.addEventListener("touchend", () => {
    btn.classList.remove("held");
  }, { passive: true });
  btn.addEventListener("touchcancel", () => {
    btn.classList.remove("held");
  }, { passive: true });
}
function setupParryButton(input2) {
  const btn = document.getElementById("mobile-parry-btn");
  if (!btn || !input2.touch) return;
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    input2.touch.fireParry();
    btn.classList.add("held");
  }, { passive: false });
  btn.addEventListener("touchend", () => {
    btn.classList.remove("held");
  }, { passive: true });
  btn.addEventListener("touchcancel", () => {
    btn.classList.remove("held");
  }, { passive: true });
}
function setupInteractButton(input2, state2) {
  const btn = document.getElementById("mobile-interact-btn");
  if (!btn) return;
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", bubbles: true }));
  }, { passive: false });
}
function setupDashButton(conn2) {
  const btn = document.getElementById("mobile-dash-btn");
  if (!btn) return;
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    conn2.send({ type: "dash" });
  }, { passive: false });
}
function setupMenuButton(input2) {
  const btn = document.getElementById("mobile-menu-btn");
  if (!btn) return;
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    input2.toggleMenu();
  }, { passive: false });
}
function setupBuildTray(input2) {
  const toggle = document.getElementById("mobile-build-toggle");
  const tray = document.getElementById("mobile-build-tray");
  let trayOpen = false;
  toggle.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (input2.buildMode || input2.demolishMode) {
      input2.buildMode = null;
      input2.demolishMode = false;
      trayOpen = false;
      tray.classList.remove("open");
      toggle.classList.remove("active");
      toggle.textContent = "BUILD";
      document.querySelectorAll(".build-btn[data-type]").forEach((b) => b.classList.remove("active"));
      const cancelBtn = document.getElementById("cancel-build");
      if (cancelBtn) cancelBtn.style.display = "none";
      const demolishBtn2 = document.getElementById("demolish-btn");
      if (demolishBtn2) demolishBtn2.classList.remove("active");
      return;
    }
    trayOpen = !trayOpen;
    tray.classList.toggle("open", trayOpen);
    toggle.classList.toggle("active", trayOpen);
  }, { passive: false });
  tray.querySelectorAll(".build-btn[data-type]").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const btype = btn.dataset.type;
      const isSame = input2.buildMode === btype;
      input2.demolishMode = false;
      if (isSame) {
        input2.buildMode = null;
        toggle.textContent = "BUILD";
        toggle.classList.remove("active");
      } else {
        input2.buildMode = btype;
        toggle.textContent = `${btype.toUpperCase()} \u2713`;
        toggle.classList.add("active");
      }
      tray.querySelectorAll(".build-btn").forEach((b) => b.classList.remove("active"));
      if (!isSame) btn.classList.add("active");
      trayOpen = false;
      tray.classList.remove("open");
    }, { passive: false });
  });
  const demolishBtn = tray.querySelector('[data-action="demolish"]');
  if (demolishBtn) {
    demolishBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const wasActive = input2.demolishMode;
      input2.buildMode = null;
      input2.demolishMode = !wasActive;
      tray.querySelectorAll(".build-btn").forEach((b) => b.classList.remove("active"));
      if (!wasActive) {
        demolishBtn.classList.add("active");
        toggle.textContent = "DEMOLISH \u2713";
        toggle.classList.add("active");
      } else {
        toggle.textContent = "BUILD";
        toggle.classList.remove("active");
      }
      trayOpen = false;
      tray.classList.remove("open");
    }, { passive: false });
  }
}
function setupCanvasTouch(input2, state2, conn2) {
  const canvas = document.getElementById("game-canvas");
  let longPressTimer = null;
  let longPressX = 0;
  let longPressY = 0;
  const LONG_PRESS_MS = 800;
  const LONG_PRESS_MOVE_THRESHOLD = 15;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    if (input2.buildMode || input2.demolishMode) {
      const margin2 = 120;
      if (t.clientX < margin2 || t.clientX > window.innerWidth - margin2) return;
      e.preventDefault();
      if (input2.demolishMode && input2.onDemolish) {
        input2.onDemolish(t.clientX, t.clientY);
        return;
      }
      if (input2.buildMode) {
        const worldX = t.clientX - window.innerWidth / 2 + state2.cameraX;
        const worldY = t.clientY - window.innerHeight / 2 + state2.cameraY;
        const cellX = Math.floor(worldX / CELL_SIZE);
        const cellY = Math.floor(worldY / CELL_SIZE);
        const prev = input2.mobileBuildPreview;
        if (prev && prev.cellX === cellX && prev.cellY === cellY) {
          if (input2.onBuild) {
            input2.onBuild(input2.buildMode, t.clientX, t.clientY);
          }
          input2.mobileBuildPreview = null;
        } else {
          input2.mobileBuildPreview = { cellX, cellY };
        }
      }
      return;
    }
    const margin = 140;
    if (t.clientX > margin && t.clientX < window.innerWidth - margin) {
      longPressX = t.clientX;
      longPressY = t.clientY;
      longPressTimer = setTimeout(() => {
        const worldX = longPressX - window.innerWidth / 2 + state2.cameraX;
        const worldY = longPressY - window.innerHeight / 2 + state2.cameraY;
        let bestDist = 60;
        let bestEntity = null;
        for (const [, ent] of state2.entities) {
          if (ent.kind !== "player" || ent.id === state2.myId) continue;
          const pos = state2.getInterpolatedPos(ent.id);
          if (!pos) continue;
          const dist = Math.hypot(pos.x - worldX, pos.y - worldY);
          if (dist < bestDist) {
            bestDist = dist;
            bestEntity = ent;
          }
        }
        if (bestEntity && bestEntity.username) {
          conn2.send({ type: "party_invite", targetUsername: bestEntity.username });
          addToFeed(`<span class="mobile-feed-notif notif-party">Invited ${escapeHtml(bestEntity.username)} to party</span>`);
        }
        longPressTimer = null;
      }, LONG_PRESS_MS);
    }
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    if (!longPressTimer) return;
    const t = e.changedTouches[0];
    if (Math.hypot(t.clientX - longPressX, t.clientY - longPressY) > LONG_PRESS_MOVE_THRESHOLD) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });
  canvas.addEventListener("touchend", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });
  canvas.addEventListener("touchcancel", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });
}

// client/src/ui/ServerBrowser.ts
var onSelect = null;
var refreshInterval = null;
var preGameNavRef = null;
var PAGE_SIZE = 6;
var currentPage = 0;
var searchQuery = "";
var allServers = [];
function setupServerBrowser(onServerSelected, preGameNav2) {
  preGameNavRef = preGameNav2 ?? null;
  onSelect = onServerSelected;
  const playBtn = document.getElementById("play-main-btn");
  const directBtn = document.getElementById("direct-connect-btn");
  const directInput = document.getElementById("direct-ip");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      onSelect?.(null);
    });
  }
  if (directBtn && directInput) {
    const doDirectConnect = () => {
      const value = directInput.value.trim();
      if (!value) return;
      const url = value.startsWith("http://") || value.startsWith("https://") ? value : `http://${value}`;
      openCommunityServer(url);
    };
    directBtn.addEventListener("click", doDirectConnect);
    directInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doDirectConnect();
    });
  }
  const refreshBtn = document.getElementById("refresh-servers-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", fetchServers);
  }
  const searchInput = document.getElementById("server-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      currentPage = 0;
      renderServerList(allServers);
    });
  }
  document.getElementById("servers-prev")?.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      renderServerList(allServers);
    }
  });
  document.getElementById("servers-next")?.addEventListener("click", () => {
    const filtered = getFilteredServers(allServers);
    if ((currentPage + 1) * PAGE_SIZE < filtered.length) {
      currentPage++;
      renderServerList(allServers);
    }
  });
  fetchServers();
  refreshInterval = setInterval(fetchServers, 1e4);
}
var REGISTRY_URL = "https://plainscape.world";
async function fetchServers() {
  const refreshBtn = document.getElementById("refresh-servers-btn");
  if (refreshBtn) {
    refreshBtn.classList.add("spinning");
  }
  try {
    const url = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "/api/servers" : `${REGISTRY_URL}/api/servers`;
    const res = await fetch(url);
    if (!res.ok) return;
    const servers = await res.json();
    allServers = servers;
    renderServerList(servers);
  } catch {
  } finally {
    if (refreshBtn) {
      setTimeout(() => refreshBtn.classList.remove("spinning"), 600);
    }
  }
}
function openCommunityServer(url) {
  window.location.href = url;
}
function isMainServer(server) {
  return server.host === window.location.hostname || server.host === "localhost" || server.host === "127.0.0.1" || server.name.includes("Official");
}
function getFilteredServers(servers) {
  if (!searchQuery) return servers;
  return servers.filter(
    (s) => s.name.toLowerCase().includes(searchQuery) || s.description.toLowerCase().includes(searchQuery)
  );
}
function renderServerList(servers) {
  const tbody = document.getElementById("server-rows");
  if (!tbody) return;
  tbody.textContent = "";
  const filtered = getFilteredServers(servers);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  const start = currentPage * PAGE_SIZE;
  const page = filtered.slice(start, start + PAGE_SIZE);
  for (const server of page) {
    const row = document.createElement("tr");
    row.className = "server-row";
    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "button");
    if (server.host === window.location.hostname) {
      row.classList.add("server-main");
    }
    const nameCell = document.createElement("td");
    nameCell.textContent = server.name;
    row.appendChild(nameCell);
    const playersCell = document.createElement("td");
    playersCell.textContent = `${server.playerCount}/${server.maxPlayers}`;
    row.appendChild(playersCell);
    const pwCell = document.createElement("td");
    pwCell.style.textAlign = "center";
    pwCell.textContent = server.hasPassword ? "\u{1F512}" : "";
    row.appendChild(pwCell);
    const modCell = document.createElement("td");
    modCell.style.textAlign = "center";
    if (server.isModded) {
      const badge = document.createElement("span");
      badge.textContent = "Modded";
      badge.style.cssText = "font-size:11px;color:#c9a84c;background:rgba(201,168,76,0.12);padding:2px 6px;border-radius:4px;";
      modCell.appendChild(badge);
    }
    row.appendChild(modCell);
    const descCell = document.createElement("td");
    descCell.textContent = server.description;
    row.appendChild(descCell);
    row.addEventListener("click", () => {
      if (isMainServer(server)) {
        onSelect?.(null);
      } else {
        openCommunityServer(`http://${server.host}:${server.port}`);
      }
    });
    tbody.appendChild(row);
  }
  const pageInfo = document.getElementById("servers-page-info");
  const prevBtn = document.getElementById("servers-prev");
  const nextBtn = document.getElementById("servers-next");
  const pagination = document.getElementById("servers-pagination");
  if (pagination) {
    pagination.style.display = filtered.length > PAGE_SIZE ? "flex" : "none";
  }
  if (pageInfo) {
    pageInfo.textContent = `${currentPage + 1} / ${totalPages}`;
  }
  if (prevBtn) {
    prevBtn.disabled = currentPage === 0;
  }
  if (nextBtn) {
    nextBtn.disabled = (currentPage + 1) * PAGE_SIZE >= filtered.length;
  }
  if (preGameNavRef) {
    preGameNavRef.rescan();
  }
}

// client/src/ui/PreGameNav.ts
var PreGameNav = class {
  gamepad;
  menuNav;
  animFrameId = 0;
  active = false;
  constructor() {
    this.gamepad = new GamepadController();
    this.menuNav = new GamepadMenuNav();
    this.gamepad.enabled = localStorage.getItem("plainscape_gamepad_enabled") !== "false";
    this.startPolling();
  }
  /** Activate menu navigation on a container */
  activate(container, onClose) {
    this.active = true;
    this.menuNav.activate(container, onClose ?? (() => {
    }));
  }
  /** Deactivate navigation (when transitioning screens) */
  deactivate() {
    this.active = false;
    this.menuNav.deactivate();
  }
  /** Stop the polling loop entirely (when game starts) */
  destroy() {
    this.deactivate();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }
  /** Restart the polling loop (e.g. after logout back to lobby) */
  restart() {
    if (this.animFrameId) return;
    this.gamepad.enabled = localStorage.getItem("plainscape_gamepad_enabled") !== "false";
    this.startPolling();
  }
  /** Rescan focusable elements (call after DOM updates like server list refresh) */
  rescan() {
    if (this.active) {
      this.menuNav.rescan();
    }
  }
  startPolling() {
    const poll = () => {
      this.animFrameId = requestAnimationFrame(poll);
      if (!this.gamepad.enabled) return;
      if (!this.active) return;
      const prevHandler = this.gamepad.onAction;
      this.gamepad.onAction = (action) => this.handleAction(action);
      this.gamepad.poll();
      this.gamepad.onAction = prevHandler;
      this.menuNav.handleStick(this.gamepad.moveDy);
    };
    this.animFrameId = requestAnimationFrame(poll);
  }
  handleAction(action) {
    switch (action) {
      case "interact":
        this.menuNav.handleAction("interact");
        break;
      case "dash":
        this.menuNav.handleAction("dash");
        break;
      case "build_wall":
        this.menuNav.handleDpad("up");
        break;
      case "build_turret":
        this.menuNav.handleDpad("down");
        break;
      case "build_bed":
        this.menuNav.handleDpad("left");
        break;
      case "build_gate":
        this.menuNav.handleDpad("right");
        break;
    }
  }
};

// client/src/main.ts
var state = new GameState();
var renderer;
var input;
var conn;
var running = false;
var preGameNav = new PreGameNav();
var prevSelfAnim = "idle";
var animSoundMap = {
  punch: playPunch,
  lunge: playLunge,
  shoot: playArrowShoot,
  shield: playShield,
  parry: playParry,
  dash: playDash
};
function generateFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx2 = canvas.getContext("2d");
    if (ctx2) {
      ctx2.textBaseline = "top";
      ctx2.font = "14px Arial";
      ctx2.fillStyle = "#f60";
      ctx2.fillRect(10, 1, 62, 20);
      ctx2.fillStyle = "#069";
      ctx2.fillText("PlainScape:fp", 2, 15);
    }
    const canvasData = canvas.toDataURL();
    const raw = canvasData + "|" + screen.width + "x" + screen.height + "|" + navigator.userAgent + "|" + navigator.language + "|" + (/* @__PURE__ */ new Date()).getTimezoneOffset();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const c = raw.charCodeAt(i);
      hash = (hash << 5) - hash + c;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return "";
  }
}
function updatePartyButton() {
  const btn = document.getElementById("party-btn");
  if (btn) btn.style.display = state.partyMembers.length > 0 ? "block" : "none";
  if (state.partyMembers.length === 0) {
    const modal = document.getElementById("party-modal");
    if (modal) modal.classList.remove("open");
  }
}
function handleMessage(msg) {
  switch (msg.type) {
    case "welcome": {
      state.myId = msg.yourId;
      if (msg.serverName) state.serverName = msg.serverName;
      if (msg.serverDescription) state.serverDescription = msg.serverDescription;
      if (msg.musicTracks) setMusicTracks(msg.musicTracks);
      const menuTitle = document.querySelector("#esc-menu .menu-panel h2");
      if (menuTitle) menuTitle.textContent = state.serverName;
      hideJoinScreen();
      startGameLoop();
      startChampionTimer();
      break;
    }
    case "snapshot": {
      const snap = msg;
      state.applySnapshot(
        snap.serverTime,
        snap.entities,
        snap.selfHp,
        snap.selfMaxHp,
        snap.selfSource,
        snap.selfPos,
        snap.selfDead,
        snap.selfRespawnAt,
        snap.dayPhase,
        snap.selfFacing,
        snap.selfAnim,
        snap.selfShieldActive,
        snap.selfShieldCooldownUntil,
        snap.selfParryActive,
        snap.selfParryCooldownUntil,
        snap.selfPunchCooldownUntil,
        snap.selfLungeCooldownUntil,
        snap.selfArrowCooldownUntil,
        snap.selfDashCooldownUntil,
        snap.selfStatLevels,
        snap.selfBankedSource,
        snap.selfBuildingCount
      );
      if (snap.selfAnim !== prevSelfAnim) {
        const soundFn = animSoundMap[snap.selfAnim];
        if (soundFn) soundFn();
        prevSelfAnim = snap.selfAnim;
      }
      if (!snap.selfDead && state.readyToRespawn) {
        state.readyToRespawn = false;
        const btn = document.getElementById("respawn-btn");
        if (btn) btn.style.display = "none";
        input?.menuNav.deactivate();
      }
      break;
    }
    case "event": {
      const fxMatch = msg.message.match(/^__fx_explode_(-?\d+)_(-?\d+)_(\w+)__$/);
      if (fxMatch) {
        renderer.addExplosion(parseInt(fxMatch[1]), parseInt(fxMatch[2]), fxMatch[3]);
        triggerDeathAnimation(parseInt(fxMatch[1]), parseInt(fxMatch[2]), fxMatch[3]);
        playExplosion();
      } else {
        addEventMessage(msg.message, msg.kind);
        if (msg.kind === "kill") playKill();
        else if (msg.message.includes("You died") || msg.message.includes("was murdered") || msg.message.includes("was killed")) playDeath();
        else if (msg.message.includes("cannot") || msg.message.includes("Too far") || msg.message.includes("Not enough")) playDenied();
        else if (msg.message.includes("+") && msg.message.includes("Source")) playSourceEarn();
        else if (msg.message.includes("Destroyed")) playBuildDestroy();
        let evtClass = "";
        if (msg.kind === "phase") evtClass = "notif-phase";
        else if (msg.kind === "party") evtClass = "notif-party";
        else if (msg.message.includes("+") && msg.message.includes("Source")) evtClass = "notif-source";
        else if (msg.message.includes("killed") || msg.message.includes("Destroyed")) evtClass = "notif-kill";
        addMobileNotification(msg.message, evtClass);
      }
      break;
    }
    case "error": {
      showError(msg.message);
      playDenied();
      break;
    }
    case "leaderboard": {
      state.leaderboard = msg.entries;
      updateLeaderboard(msg.entries, state.selfUsername);
      updateMobileLb(msg.entries, state.selfUsername, lastOnlineList);
      break;
    }
    case "champion_info": {
      updateChampionInfo(msg.username, msg.ruleText);
      break;
    }
    case "winner_prompt": {
      showWinnerModal(msg.winnerName, msg.topSuggestion, (text) => {
        conn.send({ type: "submit_rule", text });
      });
      break;
    }
    case "suggestions_update": {
      state.suggestions = msg.suggestions;
      state.onSuggestionsUpdate?.();
      break;
    }
    case "rules_update": {
      state.rules = msg.rules;
      updateRules(msg.rules);
      if (msg.isAlert) {
        addEventMessage("A new rule has been added! Check the ESC menu.");
        hideWinnerModal();
      }
      break;
    }
    case "chat_broadcast": {
      const filtered = applyCensorFilter(msg.text);
      addChatMessage(msg.username, filtered, msg.whisper);
      addMobileChatMessage(msg.username, filtered, msg.whisper);
      break;
    }
    case "notification": {
      addNotification(msg.text);
      let notifClass = "";
      if (msg.text.includes("rule") || msg.text.includes("Rule")) notifClass = "notif-rule";
      else if (msg.text.includes("murdered") || msg.text.includes("betrayed") || msg.text.includes("killed") || msg.text.includes("eaten") || msg.text.includes("claimed") || msg.text.includes("turret")) notifClass = "notif-death";
      addMobileNotification(msg.text, notifClass);
      break;
    }
    case "online_list": {
      updateOnlineList(msg.usernames, msg.admins);
      break;
    }
    case "rule_status": {
      const indicator = document.getElementById("rule-status");
      if (indicator) indicator.style.display = msg.implementing ? "flex" : "none";
      break;
    }
    case "party_invite_received": {
      showPartyInvite(msg.fromUsername, (accept) => {
        conn.send({ type: "party_respond", fromUsername: msg.fromUsername, accept });
      });
      break;
    }
    case "party_update": {
      state.partyMembers = msg.members;
      state.partyMemberInfo = msg.memberInfo || [];
      updatePartyButton();
      break;
    }
    case "sign_data": {
      state.patchNotes = msg.patchNotes;
      state.adminNotices = msg.notices;
      break;
    }
    case "ready_to_respawn": {
      state.readyToRespawn = true;
      const btn = document.getElementById("respawn-btn");
      if (btn) btn.style.display = "block";
      if (input) {
        const overlay = document.getElementById("death-overlay");
        input.menuNav.activate(overlay, () => {
        });
      }
      break;
    }
    case "kicked": {
      state.readyToRespawn = false;
      const respBtn = document.getElementById("respawn-btn");
      if (respBtn) respBtn.style.display = "none";
      input?.menuNav.deactivate();
      if (input?.onLogout) input.onLogout();
      setTimeout(() => showError(msg.reason), 50);
      break;
    }
  }
}
function showPartyInvite(fromUsername, respond) {
  const container = document.getElementById("chat-messages");
  if (!container) return;
  const el = document.createElement("div");
  el.className = "chat-msg party-invite-card";
  const text = document.createElement("span");
  text.textContent = `${fromUsername} invited you to a party `;
  el.appendChild(text);
  const acceptBtn = document.createElement("button");
  acceptBtn.textContent = "Accept";
  acceptBtn.className = "party-invite-btn party-invite-accept";
  acceptBtn.addEventListener("click", () => {
    respond(true);
    el.remove();
  });
  el.appendChild(acceptBtn);
  const denyBtn = document.createElement("button");
  denyBtn.textContent = "Deny";
  denyBtn.className = "party-invite-btn party-invite-deny";
  denyBtn.addEventListener("click", () => {
    respond(false);
    el.remove();
  });
  el.appendChild(denyBtn);
  container.appendChild(el);
}
function addNotification(text) {
  const feed = document.getElementById("notification-feed");
  if (!feed) return;
  const el = document.createElement("div");
  el.className = "notif-msg";
  if (text.includes("rule") || text.includes("Rule") || text.includes("implementing") || text.includes("implemented")) {
    el.classList.add("notif-rule");
  } else if (text.includes("murdered") || text.includes("betrayed") || text.includes("killed") || text.includes("eaten") || text.includes("claimed") || text.includes("turret")) {
    el.classList.add("notif-death");
  } else if (text.includes("joined")) {
    el.classList.add("notif-join");
  } else if (text.includes("petition") || text.includes("Scribe")) {
    el.classList.add("notif-petition");
  }
  el.textContent = text;
  feed.appendChild(el);
  while (feed.children.length > 8) {
    feed.removeChild(feed.firstChild);
  }
  feed.scrollTop = feed.scrollHeight;
}
function addEventMessage(text, kind) {
  const feed = document.getElementById("notification-feed");
  if (!feed) return;
  const el = document.createElement("div");
  el.className = "notif-msg";
  if (kind === "phase") {
    el.classList.add("notif-phase");
  } else if (kind === "party") {
    el.classList.add("notif-party");
  } else if (text.includes("+") && text.includes("Source")) {
    el.classList.add("notif-source");
  } else if (text.includes("killed") || text.includes("Destroyed")) {
    el.classList.add("notif-kill");
  } else {
    el.classList.add("notif-local");
  }
  el.textContent = text;
  feed.appendChild(el);
  while (feed.children.length > 5) {
    feed.removeChild(feed.firstChild);
  }
  feed.scrollTop = feed.scrollHeight;
}
var onlineExpanded = false;
var lastOnlineList = [];
var lastAdminList = [];
function updateOnlineList(usernames, admins) {
  lastOnlineList = usernames;
  if (admins) lastAdminList = admins;
  updateMobileLb(state.leaderboard, state.selfUsername, usernames);
  const list = document.getElementById("online-list");
  const count = document.getElementById("online-count");
  if (!list) return;
  if (count) count.textContent = `(${usernames.length})`;
  while (list.firstChild) list.removeChild(list.firstChild);
  const limit = onlineExpanded ? usernames.length : 10;
  const visible = usernames.slice(0, limit);
  const adminSet = new Set(lastAdminList);
  for (const name of visible) {
    const el = document.createElement("div");
    el.className = "online-name";
    if (name === state?.selfUsername) el.classList.add("online-self");
    el.textContent = name;
    if (adminSet.has(name)) {
      const badge = document.createElement("span");
      badge.className = "online-admin";
      badge.textContent = " (Admin)";
      el.appendChild(badge);
    }
    list.appendChild(el);
  }
  if (usernames.length > 10) {
    const toggle = document.createElement("div");
    toggle.className = "online-overflow";
    toggle.textContent = onlineExpanded ? "Show less" : `+${usernames.length - 10} more`;
    toggle.addEventListener("click", () => {
      onlineExpanded = !onlineExpanded;
      updateOnlineList(lastOnlineList);
    });
    list.appendChild(toggle);
  }
}
function startGameLoop() {
  if (running) return;
  running = true;
  const canvas = document.getElementById("game-canvas");
  preGameNav.destroy();
  input = new InputHandler(canvas, conn, preGameNav.gamepad);
  renderer = new Renderer(canvas, state, input);
  initWinnerModal(input);
  setupChat(conn, input);
  setupStatsPanel(conn, input, state);
  setupNpcPanels(conn, input, state);
  setupWhitelistPanel(conn, input);
  setupGlobalWhitelist(conn, input);
  if (detectMobile()) {
    setupMobileHud(conn, input, state);
  }
  setupControllerConfig(input);
  {
    let applyAudioSettings2 = function() {
      const master = masterToggle.checked;
      const vol = parseInt(masterSlider.value, 10) / 100;
      const sfx = sfxToggle.checked;
      const music = musicToggle.checked;
      setMuted(!master || !sfx);
      setVolume(vol);
      setMusicEnabled(master && music);
      setMusicVolume(vol);
    }, closeSettings2 = function() {
      settingsModal.classList.remove("open");
      input.modalOpen = false;
      input.menuNav.deactivate();
      if (input.menuOpen && input.gamepad.enabled && input.gamepad.connected) {
        const escMenu = document.getElementById("esc-menu");
        if (escMenu) {
          const panel = escMenu.querySelector(".menu-panel") || escMenu;
          input.menuNav.activate(panel, () => input.toggleMenu());
        }
      }
    };
    var applyAudioSettings = applyAudioSettings2, closeSettings = closeSettings2;
    const settingsModal = document.getElementById("settings-modal");
    const openBtn = document.getElementById("open-settings");
    const closeBtn = document.getElementById("settings-close");
    const masterToggle = document.getElementById("setting-master-audio");
    const masterSlider = document.getElementById("setting-master-volume");
    const sfxToggle = document.getElementById("setting-sfx");
    const musicToggle = document.getElementById("setting-music");
    const fsToggle = document.getElementById("setting-fullscreen");
    const savedMaster = localStorage.getItem("ps_master_audio") !== "off";
    const savedVol = parseInt(localStorage.getItem("ps_master_volume") || "30", 10);
    const savedSfx = localStorage.getItem("ps_sfx") !== "off";
    const savedMusic = localStorage.getItem("ps_music") !== "off";
    masterToggle.checked = savedMaster;
    masterSlider.value = String(savedVol);
    sfxToggle.checked = savedSfx;
    musicToggle.checked = savedMusic;
    applyAudioSettings2();
    masterToggle.addEventListener("change", () => {
      localStorage.setItem("ps_master_audio", masterToggle.checked ? "on" : "off");
      applyAudioSettings2();
    });
    masterSlider.addEventListener("input", () => {
      localStorage.setItem("ps_master_volume", masterSlider.value);
      applyAudioSettings2();
    });
    sfxToggle.addEventListener("change", () => {
      localStorage.setItem("ps_sfx", sfxToggle.checked ? "on" : "off");
      applyAudioSettings2();
    });
    musicToggle.addEventListener("change", () => {
      localStorage.setItem("ps_music", musicToggle.checked ? "on" : "off");
      applyAudioSettings2();
    });
    fsToggle.addEventListener("change", () => {
      if (fsToggle.checked) {
        document.documentElement.requestFullscreen().catch(() => {
        });
      } else {
        document.exitFullscreen().catch(() => {
        });
      }
    });
    document.addEventListener("fullscreenchange", () => {
      fsToggle.checked = !!document.fullscreenElement;
    });
    if (!document.documentElement.requestFullscreen) {
      const fsSetting = document.getElementById("fullscreen-setting");
      if (fsSetting) fsSetting.style.display = "none";
    }
    openBtn.addEventListener("click", () => {
      settingsModal.classList.add("open");
      input.modalOpen = true;
      if (input.gamepad.enabled && input.gamepad.connected) {
        const inner = settingsModal.querySelector(".settings-inner") || settingsModal;
        input.menuNav.activate(inner, closeSettings2);
      }
    });
    closeBtn.addEventListener("click", closeSettings2);
  }
  {
    let closeHtp2 = function() {
      htpModal.classList.remove("open");
      input.modalOpen = false;
      input.menuNav.deactivate();
      if (input.menuOpen && input.gamepad.enabled && input.gamepad.connected) {
        const escMenu = document.getElementById("esc-menu");
        if (escMenu) {
          const panel = escMenu.querySelector(".menu-panel") || escMenu;
          input.menuNav.activate(panel, () => input.toggleMenu());
        }
      }
    };
    var closeHtp = closeHtp2;
    const htpModal = document.getElementById("htp-modal");
    const htpOpenBtns = document.querySelectorAll(".htp-btn");
    const htpCloseBtn = htpModal.querySelector(".htp-close");
    for (const btn of htpOpenBtns) {
      btn.addEventListener("click", () => {
        input.modalOpen = true;
        if (input.gamepad.enabled && input.gamepad.connected) {
          const panel = htpModal.querySelector(".htp-panel") || htpModal;
          input.menuNav.activate(panel, closeHtp2);
        }
      });
    }
    if (htpCloseBtn) {
      htpCloseBtn.addEventListener("click", closeHtp2);
    }
  }
  document.getElementById("chat-toggle").addEventListener("click", () => {
    const container = document.getElementById("chat-container");
    const icon = document.getElementById("chat-toggle-icon");
    container.classList.toggle("collapsed");
    icon.textContent = container.classList.contains("collapsed") ? "\u25B6" : "\u25BC";
  });
  document.getElementById("notif-toggle").addEventListener("click", () => {
    const container = document.getElementById("notif-container");
    const icon = document.getElementById("notif-toggle-icon");
    container.classList.toggle("collapsed");
    icon.textContent = container.classList.contains("collapsed") ? "\u25B6" : "\u25BC";
  });
  document.getElementById("online-toggle").addEventListener("click", () => {
    const container = document.getElementById("online-container");
    const icon = document.getElementById("online-toggle-icon");
    container.classList.toggle("collapsed");
    icon.textContent = container.classList.contains("collapsed") ? "\u25B6" : "\u25BC";
  });
  document.getElementById("lb-toggle").addEventListener("click", () => {
    const container = document.getElementById("leaderboard");
    const icon = document.getElementById("lb-toggle-icon");
    container.classList.toggle("collapsed");
    icon.textContent = container.classList.contains("collapsed") ? "\u25B6" : "\u25BC";
  });
  input.onCtrlClick = (screenX, screenY) => {
    const worldX = screenX - window.innerWidth / 2 + state.cameraX;
    const worldY = screenY - window.innerHeight / 2 + state.cameraY;
    let bestDist = 60;
    let bestEntity = null;
    for (const [, e] of state.entities) {
      const pos = state.getInterpolatedPos(e.id);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - worldX, pos.y - worldY);
      if (dist < bestDist) {
        bestDist = dist;
        bestEntity = e;
      }
    }
    if (!bestEntity) return;
    if (bestEntity.kind === "building" && (bestEntity.btype === "gate" || bestEntity.btype === "turret") && bestEntity.ownerName === state.selfUsername) {
      openWhitelistPanel(
        bestEntity.id,
        bestEntity.btype,
        bestEntity.whitelist || [],
        bestEntity.ownerName || ""
      );
    }
    if (bestEntity.kind === "player" && bestEntity.id !== state.myId && bestEntity.username) {
      conn.send({ type: "party_invite", targetUsername: bestEntity.username });
    }
  };
  input.onTargetLock = (facing) => {
    const px = state.selfPos.x;
    const py = state.selfPos.y;
    const maxDist = CELL_SIZE * 2;
    const coneHalf = Math.PI / 4;
    let bestDist = maxDist;
    let bestEntity = null;
    for (const [, e] of state.entities) {
      if (e.id === state.myId) continue;
      const pos = state.getInterpolatedPos(e.id);
      if (!pos) continue;
      const dx = pos.x - px;
      const dy = pos.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist || dist < 1) continue;
      const angle = Math.atan2(dy, dx);
      let diff = angle - facing;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      if (Math.abs(diff) > coneHalf) continue;
      if (dist < bestDist) {
        bestDist = dist;
        bestEntity = e;
      }
    }
    if (!bestEntity) return;
    if (bestEntity.kind === "building" && (bestEntity.btype === "gate" || bestEntity.btype === "turret") && bestEntity.ownerName === state.selfUsername) {
      openWhitelistPanel(
        bestEntity.id,
        bestEntity.btype,
        bestEntity.whitelist || [],
        bestEntity.ownerName || ""
      );
    }
    if (bestEntity.kind === "player" && bestEntity.username) {
      conn.send({ type: "party_invite", targetUsername: bestEntity.username });
    }
  };
  input.onBuild = (btype, screenX, screenY) => {
    const worldX = screenX - window.innerWidth / 2 + state.cameraX;
    const worldY = screenY - window.innerHeight / 2 + state.cameraY;
    const cellX = Math.floor(worldX / CELL_SIZE);
    const cellY = Math.floor(worldY / CELL_SIZE);
    playBuildPlace();
    conn.send({
      type: "place",
      btype,
      cellX,
      cellY
    });
  };
  input.onDemolish = (screenX, screenY) => {
    const worldX = screenX - window.innerWidth / 2 + state.cameraX;
    const worldY = screenY - window.innerHeight / 2 + state.cameraY;
    let bestDist = 48;
    let bestId = null;
    for (const [, e] of state.entities) {
      if (e.kind !== "building" || e.ownerName !== state.selfUsername) continue;
      const pos = state.getInterpolatedPos(e.id);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - worldX, pos.y - worldY);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = e.id;
      }
    }
    if (bestId !== null) {
      conn.send({ type: "destroy", targetId: bestId });
    }
  };
  input.onLogout = () => {
    running = false;
    clearHiddenTimer();
    setMusicEnabled(false);
    conn.disconnect();
    const joinScreen = document.getElementById("join-screen");
    const gameScreen = document.getElementById("game-screen");
    const hud = document.getElementById("hud");
    const escMenu = document.getElementById("esc-menu");
    const playBtn = document.getElementById("play-btn");
    if (joinScreen) joinScreen.style.display = "flex";
    if (gameScreen) gameScreen.style.display = "none";
    if (hud) hud.style.display = "none";
    if (escMenu) escMenu.style.display = "none";
    if (playBtn) playBtn.disabled = false;
    input.menuOpen = false;
    preGameNav.restart();
    const joinForm = document.querySelector("#join-screen .join-form");
    if (joinForm) preGameNav.activate(joinForm);
  };
  const partyBtn = document.getElementById("party-btn");
  const partyModal = document.getElementById("party-modal");
  partyBtn.addEventListener("click", () => {
    partyModal.classList.toggle("open");
    if (partyModal.classList.contains("open")) updatePartyModal();
  });
  document.getElementById("party-close").addEventListener("click", () => {
    partyModal.classList.remove("open");
  });
  document.getElementById("party-leave").addEventListener("click", () => {
    conn.send({ type: "party_leave" });
    partyModal.classList.remove("open");
  });
  partyModal.addEventListener("click", (e) => {
    if (e.target === partyModal) partyModal.classList.remove("open");
  });
  function updatePartyModal() {
    const membersDiv = document.getElementById("party-members");
    membersDiv.textContent = "";
    for (const info of state.partyMemberInfo) {
      const row = document.createElement("div");
      row.className = "party-member";
      const isSelf = info.username === state.selfUsername;
      let memberPos = null;
      if (isSelf) {
        memberPos = state.selfPos;
      } else {
        for (const [, e] of state.entities) {
          if (e.kind === "player" && e.username === info.username) {
            memberPos = { x: e.x, y: e.y };
            break;
          }
        }
      }
      const arrowCanvas = document.createElement("canvas");
      arrowCanvas.className = "pm-arrow";
      arrowCanvas.width = 18;
      arrowCanvas.height = 18;
      const actx = arrowCanvas.getContext("2d");
      if (!isSelf && memberPos) {
        const angle = Math.atan2(memberPos.y - state.selfPos.y, memberPos.x - state.selfPos.x);
        const dist = Math.hypot(memberPos.x - state.selfPos.x, memberPos.y - state.selfPos.y);
        actx.save();
        actx.translate(9, 9);
        actx.rotate(angle);
        actx.fillStyle = "#4488ff";
        actx.globalAlpha = Math.min(1, 0.4 + dist / 500);
        actx.beginPath();
        actx.moveTo(7, 0);
        actx.lineTo(-4, -5);
        actx.lineTo(-2, 0);
        actx.lineTo(-4, 5);
        actx.closePath();
        actx.fill();
        actx.restore();
      } else if (isSelf) {
        actx.fillStyle = "#4488ff";
        actx.beginPath();
        actx.arc(9, 9, 3, 0, Math.PI * 2);
        actx.fill();
      }
      row.appendChild(arrowCanvas);
      const nameSpan = document.createElement("span");
      nameSpan.className = "pm-name";
      nameSpan.textContent = info.username;
      row.appendChild(nameSpan);
      const coords = memberPos ? `(${Math.round(memberPos.x)}, ${Math.round(memberPos.y)})` : "";
      const coordsSpan = document.createElement("span");
      coordsSpan.className = "pm-coords";
      coordsSpan.textContent = coords;
      row.appendChild(coordsSpan);
      const sourceSpan = document.createElement("span");
      sourceSpan.className = "pm-source";
      sourceSpan.textContent = `+${info.sourceEarned}`;
      row.appendChild(sourceSpan);
      membersDiv.appendChild(row);
    }
  }
  const respawnBtn = document.getElementById("respawn-btn");
  if (respawnBtn) {
    respawnBtn.addEventListener("click", () => {
      conn.send({ type: "respawn" });
      respawnBtn.style.display = "none";
      state.readyToRespawn = false;
      input.menuNav.deactivate();
    });
  }
  let hiddenTimer = null;
  const CLIENT_INACTIVITY_MS = 6e4;
  function startHiddenTimer() {
    if (hiddenTimer) return;
    hiddenTimer = setTimeout(() => {
      if (input.onLogout) input.onLogout();
    }, CLIENT_INACTIVITY_MS);
  }
  function clearHiddenTimer() {
    if (hiddenTimer) {
      clearTimeout(hiddenTimer);
      hiddenTimer = null;
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) startHiddenTimer();
    else clearHiddenTimer();
  });
  window.addEventListener("blur", startHiddenTimer);
  window.addEventListener("focus", clearHiddenTimer);
  let wasDead = false;
  let lastHp = state.selfHp;
  function loop() {
    if (!running) {
      setMusicEnabled(false);
      return;
    }
    if (state.selfDead && !wasDead) input.clearKeys();
    wasDead = state.selfDead;
    if (state.selfHp < lastHp && state.selfHp > 0) playPlayerHurt();
    lastHp = state.selfHp;
    input.sendInput();
    renderer.render();
    updateMusic(state.dayPhase);
    updateMobileInteract(state);
    if (partyModal.classList.contains("open")) updatePartyModal();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
function setupControllerConfig(inputHandler) {
  const openBtn = document.getElementById("open-controller-config");
  const modal = document.getElementById("controller-modal");
  const closeBtn = document.getElementById("controller-close");
  const resetBtn = document.getElementById("controller-reset");
  const statusEl = document.getElementById("controller-status");
  const bindingsDiv = document.getElementById("controller-bindings");
  const enabledCheckbox = document.getElementById("controller-enabled");
  const hideTouchCheckbox = document.getElementById("controller-hide-touch");
  const touchToggleLabel = document.getElementById("controller-touch-toggle");
  const gp = inputHandler.gamepad;
  if (inputHandler.isMobile) {
    touchToggleLabel.style.display = "";
  }
  enabledCheckbox.checked = localStorage.getItem("plainscape_gamepad_enabled") !== "false";
  hideTouchCheckbox.checked = localStorage.getItem("plainscape_hide_touch") === "true";
  gp.enabled = enabledCheckbox.checked;
  if (inputHandler.touch) {
    inputHandler.touch.enabled = !hideTouchCheckbox.checked;
  }
  if (hideTouchCheckbox.checked) {
    setTouchControlsVisible(false);
  }
  enabledCheckbox.addEventListener("change", () => {
    gp.enabled = enabledCheckbox.checked;
    localStorage.setItem("plainscape_gamepad_enabled", String(enabledCheckbox.checked));
  });
  hideTouchCheckbox.addEventListener("change", () => {
    const hide = hideTouchCheckbox.checked;
    localStorage.setItem("plainscape_hide_touch", String(hide));
    if (inputHandler.touch) {
      inputHandler.touch.enabled = !hide;
    }
    setTouchControlsVisible(!hide);
  });
  function setTouchControlsVisible(visible) {
    const els = ["mobile-attack-btns", "mobile-shield-btn", "mobile-parry-btn", "mobile-dash-btn", "mobile-build-toggle", "mobile-interact-btn"];
    for (const id of els) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (visible) {
        el.style.display = id === "mobile-build-toggle" ? "block" : "flex";
      } else {
        el.style.display = "none";
      }
    }
    const tray = document.getElementById("mobile-build-tray");
    if (tray && !visible) tray.classList.remove("open");
    document.body.classList.toggle("gamepad-active", !visible);
  }
  function renderBindings() {
    bindingsDiv.textContent = "";
    const bindings = gp.getBindings();
    if (gp.connected) {
      statusEl.textContent = "Controller connected";
      statusEl.className = "controller-status connected";
    } else {
      statusEl.textContent = "No controller detected \u2014 connect one and press a button";
      statusEl.className = "controller-status";
    }
    for (const [action, label] of Object.entries(ACTION_LABELS)) {
      const row = document.createElement("div");
      row.className = "controller-row";
      const nameSpan = document.createElement("span");
      nameSpan.className = "controller-action";
      nameSpan.textContent = label;
      row.appendChild(nameSpan);
      const bindBtn = document.createElement("button");
      bindBtn.className = "controller-bind-btn";
      bindBtn.textContent = gp.getBindingLabel(bindings[action]);
      row.appendChild(bindBtn);
      bindBtn.addEventListener("click", async () => {
        bindBtn.textContent = "Press button...";
        bindBtn.classList.add("listening");
        gp.enabled = false;
        const result = await gp.waitForButton();
        gp.enabled = true;
        if (result) {
          gp.setBinding(action, result);
        }
        renderBindings();
      });
      bindingsDiv.appendChild(row);
    }
  }
  function openControllerModal() {
    modal.classList.add("open");
    inputHandler.modalOpen = true;
    renderBindings();
    if (gp.enabled && gp.connected) {
      const inner = modal.querySelector(".controller-inner") || modal;
      inputHandler.menuNav.activate(inner, closeControllerModal);
    }
  }
  function closeControllerModal() {
    modal.classList.remove("open");
    inputHandler.modalOpen = false;
    inputHandler.menuNav.deactivate();
    if (inputHandler.menuOpen && gp.enabled && gp.connected) {
      const escMenu = document.getElementById("esc-menu");
      if (escMenu) {
        const panel = escMenu.querySelector(".menu-panel") || escMenu;
        inputHandler.menuNav.activate(panel, () => inputHandler.toggleMenu());
      }
    }
  }
  openBtn.addEventListener("click", openControllerModal);
  closeBtn.addEventListener("click", closeControllerModal);
  resetBtn.addEventListener("click", () => {
    gp.resetBindings();
    renderBindings();
    if (inputHandler.menuNav.active) {
      setTimeout(() => inputHandler.menuNav.rescan(), 50);
    }
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeControllerModal();
  });
}
var GWL_SLOTS = 10;
var globalWhitelistNames = [];
function setupGlobalWhitelist(connection, inputHandler) {
  const btn = document.getElementById("gwl-btn");
  const modal = document.getElementById("gwl-modal");
  const slotsDiv = document.getElementById("gwl-slots");
  const saveBtn = document.getElementById("gwl-save");
  const closeBtn = document.getElementById("gwl-close");
  function openModal() {
    modal.classList.add("open");
    inputHandler.modalOpen = true;
    renderSlots();
    if (inputHandler.gamepad.enabled && inputHandler.gamepad.connected) {
      const inner = modal.querySelector(".gwl-inner") || modal;
      inputHandler.menuNav.activate(inner, closeModal);
    }
  }
  function closeModal() {
    modal.classList.remove("open");
    inputHandler.modalOpen = false;
    inputHandler.menuNav.deactivate();
  }
  function renderSlots() {
    slotsDiv.textContent = "";
    for (let i = 0; i < GWL_SLOTS; i++) {
      const row = document.createElement("div");
      row.className = "gwl-slot";
      const label = document.createElement("span");
      label.textContent = `${i + 1}.`;
      row.appendChild(label);
      const inp = document.createElement("input");
      inp.type = "text";
      inp.maxLength = 20;
      inp.placeholder = "Username";
      if (i < globalWhitelistNames.length) inp.value = globalWhitelistNames[i];
      row.appendChild(inp);
      slotsDiv.appendChild(row);
    }
  }
  btn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  saveBtn.addEventListener("click", () => {
    const inputs = slotsDiv.querySelectorAll("input");
    const names = [];
    inputs.forEach((inp) => {
      const val = inp.value.trim();
      if (val && !names.includes(val)) names.push(val);
    });
    globalWhitelistNames = names;
    connection.send({ type: "global_whitelist", usernames: names });
    closeModal();
  });
}
if (detectMobile()) {
  document.body.classList.add("mobile");
}
var isMainServer2 = window.__PLAINSCAPE_MAIN_SERVER__ === true;
var selectedServerUrl;
function startLobbyFlow(serverUrl) {
  selectedServerUrl = serverUrl;
  conn = new Connection(handleMessage, serverUrl);
  const srvName = window.__SERVER_NAME__;
  const srvDesc = window.__SERVER_DESC__;
  const subtitleEl = document.querySelector("#join-screen .subtitle");
  if (subtitleEl && srvDesc) {
    subtitleEl.textContent = srvDesc;
  }
  if (srvName && srvName !== "PlainScape") {
    const existing = document.getElementById("server-name-label");
    if (!existing) {
      const nameEl = document.createElement("p");
      nameEl.id = "server-name-label";
      nameEl.style.cssText = "color:#f0c040;font-size:13px;margin-top:4px;";
      nameEl.textContent = srvName;
      subtitleEl?.parentElement?.appendChild(nameEl);
    }
  }
  const pwField = document.getElementById("server-password");
  if (pwField && window.__SERVER_HAS_PASSWORD__) {
    pwField.style.display = "";
  }
  const joinScreen = document.getElementById("join-screen");
  if (joinScreen) joinScreen.style.display = "flex";
  const backBtn = document.getElementById("back-to-browser");
  if (backBtn) {
    backBtn.style.display = "";
    if (isMainServer2) {
      backBtn.textContent = "Server Browser";
      backBtn.onclick = () => {
        preGameNav.deactivate();
        if (joinScreen) joinScreen.style.display = "none";
        const browserEl = document.getElementById("server-browser");
        if (browserEl) {
          browserEl.style.display = "flex";
          preGameNav.activate(browserEl);
        }
      };
    } else {
      backBtn.textContent = "Browse Servers";
      backBtn.onclick = () => {
        window.location.href = "https://plainscape.world";
      };
    }
  }
  setupLobby(async (data) => {
    preGameNav.deactivate();
    initAudio();
    try {
      await conn.connect();
      state.selfColors = data.colors;
      state.selfUsername = data.username;
      conn.send({
        type: "join",
        token: data.token,
        username: data.username,
        colors: data.colors,
        fingerprint: generateFingerprint(),
        password: data.password
      });
    } catch (err) {
      showError("Failed to connect to server");
    }
  }, serverUrl, preGameNav.menuNav);
  const joinForm = document.querySelector("#join-screen .join-form");
  if (joinForm) {
    preGameNav.activate(joinForm);
  }
}
if (isMainServer2) {
  const joinScreen = document.getElementById("join-screen");
  if (joinScreen) joinScreen.style.display = "none";
  const browserEl = document.getElementById("server-browser");
  if (browserEl) {
    browserEl.style.display = "flex";
    setupServerBrowser((serverUrl) => {
      browserEl.style.display = "none";
      preGameNav.deactivate();
      startLobbyFlow(serverUrl ?? void 0);
    }, preGameNav);
    preGameNav.activate(browserEl);
  } else {
    startLobbyFlow();
  }
} else {
  startLobbyFlow();
}
