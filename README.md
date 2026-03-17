# PlainScape Community Server

**PlainScape** is a real-time multiplayer top-down survival game that runs in your browser. Players explore an infinite world, fight AI enemies, build defenses, and compete for the daily champion title — where the winner gets to add a new rule to the game using AI.

This package lets you host your own PlainScape server for friends, communities, or LAN parties.

## What is PlainScape?

- **Survive** — Fight lions during the day and ghosts at night. Dawn and dusk are the most dangerous, with both enemy types active.
- **Build** — Place walls, gates, turrets, and beds to create bases. Turrets auto-target enemies and hostile players.
- **Compete** — Earn Source (currency) by exploring, killing enemies, and defeating other players. The player who earns the most Source each day becomes the champion.
- **Change the game** — The daily champion gets to add a new rule to the game. Rules are implemented by Claude AI and can change anything — new enemies, balance tweaks, fun mechanics.
- **Party up** — Form parties to share Source and show allies on the minimap.

## Install as App

PlainScape can be installed as a Progressive Web App (PWA) for a native app experience:

- **Desktop (Chrome/Edge)**: Click the install icon in the address bar → adds to desktop, opens fullscreen
- **Android**: Chrome menu → "Add to Home Screen" → launches like a native app
- **iOS**: Safari share → "Add to Home Screen" → app icon on home screen

When opened from the installed shortcut, the game automatically enters fullscreen mode.

## Quick Start (Hosting a Server)

### Requirements
- [Node.js 22+](https://nodejs.org/) (LTS recommended)

### Setup

1. Clone or extract this repository
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` with your settings (see [Configuration](#configuration) below)
4. Start the server:
   ```bash
   # Linux / macOS
   ./start.sh

   # Windows
   start.bat
   ```
5. Open `http://localhost:4800` in your browser
6. Share your public IP + port with friends!

### First Run

On first startup, the server will:
- Install runtime dependencies (`ws`, `better-sqlite3`)
- Create a `plainscape.db` SQLite database
- Start listening on port 4800 (or your configured port)

## Configuration

All settings are in the `.env` file. Here's what each one does:

### Server Identity

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_NAME` | `My PlainScape Server` | Name shown in the server browser |
| `SERVER_DESCRIPTION` | *(empty)* | Description shown in the server browser and on the join screen |
| `PORT` | `4800` | Port the server listens on (TCP — HTTP + WebSocket) |
| `SERVER_HOST` | *(auto-detected)* | Your public IP address. Auto-detected via ipify.org if not set. |

### Administration

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_USERS` | *(empty)* | Comma-separated usernames with admin access (e.g. `Alice,Bob`) |
| `SERVER_PASSWORD` | *(empty)* | If set, players must enter this password to join |

### Server Browser

Your server can appear in the server browser at [plainscape.world](https://plainscape.world) so players can find it.

| Variable | Default | Description |
|----------|---------|-------------|
| `PATREON_KEY` | *(empty)* | Your Patreon access token — required to be listed in the server browser |
| `DEMO_KEY` | *(empty)* | Alternative to Patreon key for testing (provided by PlainScape admins) |
| `REGISTRY_URL` | `https://plainscape.world` | Where to send heartbeats (don't change this) |

### AI Rule System

The daily champion system uses the Anthropic Claude API to implement rules. This is optional — the game works great without it.

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(empty)* | Your Anthropic API key. Without this, the rule system is disabled. |
| `CLAUDE_MAX_TURNS` | `50` | Maximum agentic turns when implementing a rule |
| `CLAUDE_MAX_TOKENS` | `16384` | Token limit per Claude API call |
| `GITHUB_TOKEN` | *(empty)* | GitHub PAT for pushing rule code changes |
| `GITHUB_REPO` | *(empty)* | GitHub repo (e.g. `yourname/plainscape-server`) for rule pushes |

### Timing

| Variable | Default | Description |
|----------|---------|-------------|
| `TIMEZONE_UTC_OFFSET` | `-7` | UTC offset for your timezone (e.g. `-5` for EST, `0` for UTC, `1` for CET) |
| `CHAMPION_HOUR` | `18` | Hour (0-23) when the daily champion is selected |
| `RESET_DAY` | `0` | Day of week for weekly reset (0=Sunday, 1=Monday, ..., 6=Saturday) |
| `RESET_HOUR` | `20` | Hour (0-23) for the weekly reset |
| `MAX_PLAYERS` | `100` | Maximum concurrent players |

## Admin Console

Your server includes a **web-based admin console** at `http://127.0.0.1:4801` (localhost only — not accessible from outside your machine).

### Features

- **Dashboard** — Live player count, uptime, and server status at a glance
- **Configuration** — Edit all server settings through a clean UI with labeled fields (no need to edit `.env` manually). Changes require a server restart.
- **Claude Rules** — Markdown editor for custom AI guardrails that constrain what game rules players can create
- **Players** — Searchable player list with the ability to grant/revoke admin and ban players
- **Bans** — View and remove bans (bans are by fingerprint + IP address)

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PORT` | `4801` | Port for the admin console (always localhost-only) |
| `ADMIN_CONSOLE_PASSWORD` | *(empty)* | Optional password to protect the admin console. If not set, anyone on your machine can access it. |

### Claude Rules File

The `claude-rules.md` file in your server root lets you add custom guardrails for the AI rule system. These rules are appended to the AI's system prompt when processing player rule submissions. Edit it via the admin console or directly in a text editor.

## Admin Commands

Players listed in `ADMIN_USERS` can use these commands in the chat (press Enter):

### General

| Command | Description |
|---------|-------------|
| `/shutdown` | Gracefully stop the server (saves all data first) |
| `/source <amount>` | Give yourself Source |
| `/notice <text>` | Post a server notice (shown on the Notices sign in the safe zone) |
| `/clearnotices` | Remove all server notices |

### Time Control

| Command | Description |
|---------|-------------|
| `/dawn` | Force dawn phase |
| `/day` | Force daytime |
| `/dusk` | Force dusk phase |
| `/night` | Force nighttime |
| `/autotime` | Return to the natural day/night cycle |

### Rules & Champions

| Command | Description |
|---------|-------------|
| `/rule` | Open the rule submission prompt (as if you were the daily champion) |
| `/grantrule <username>` | Give a specific player the rule submission prompt |
| `/clearrules` | Remove all active rules |
| `/clearsuggestions` | Remove all rule suggestions from the Scribe |

### World Boss

| Command | Description |
|---------|-------------|
| `/stag spawn` | Spawn the Scorched Stag world boss near you |
| `/stag kill` | Remove the Scorched Stag (no reward given) |

## Game Mechanics

### Controls (Keyboard + Mouse)

| Key | Action |
|-----|--------|
| WASD | Move |
| Space | Dash (quick dodge in movement direction) |
| Q (hold) | Shield (blocks all damage briefly) |
| F | Parry (reflects melee damage, deflects projectiles) |
| Left Click | Punch (melee cone attack) |
| Shift + Click | Lunge (dash forward with AOE slam) |
| Right Click | Shoot arrow |
| R | Toggle auto-run |
| 1-4 | Select building (Wall / Gate / Turret / Bed) |
| 5 | Toggle demolish mode |
| Ctrl + Click | Party invite (on player) / Edit whitelist (on your gate/turret) |
| Enter | Open chat |
| ESC | Menu / cancel build |

### Controller Support

The game supports Xbox/PlayStation controllers with configurable bindings (ESC menu → Configure Controller).

### Mobile

Mobile browsers are supported with virtual joysticks, touch attack buttons, and a compact HUD. Landscape mode recommended.

### Source (Currency)

Source is the single in-game currency. You earn it by:
- Walking (+1 every 5 seconds)
- Killing lions (+7 Source)
- Killing ghosts (+8 Source)
- Killing players (+20 Source)
- Dying (+3 Source consolation)
- Killing the Scorched Stag (+400 Source)

Spend Source on:
- **Wall** (10) — Solid barrier blocking movement and projectiles
- **Gate** (15) — Door that you and whitelisted players can pass through
- **Turret** (80) — Auto-targeting cannon with explosive AOE
- **Bed** (20) — Healing station and respawn point
- **Stat upgrades** (100 each) — Level up move speed, attack speed, projectile range, etc.
- **Bank deposits** — Store Source safely (10% withdrawal fee)

### Day/Night Cycle

The world uses real wall-clock time:
- **Dawn** (6am–8am) — Lions + Ghosts
- **Day** (8am–6pm) — Lions only
- **Dusk** (6pm–9pm) — Lions + Ghosts, daily champion selected at 6pm
- **Night** (9pm–6am) — Ghosts only

Times are based on your `TIMEZONE_UTC_OFFSET` setting.

### Enemies

**Lions** (Day) — Melee chargers that pounce. They ramp up speed the longer they chase you, and prolonged chases attract reinforcements. After pouncing, they briefly crouch (your window to counterattack). They can also perform regular melee swipes when in close range.

**Ghosts** (Night) — Ranged kiters that fire homing projectiles. They maintain distance and strafe to dodge. Periodically they shake, make a scary face, and rapid-fire two shots. While wandering, ghosts phase out and become intangible — they can't be damaged but will aggro if a projectile passes through them. Parried ghost projectiles home onto nearby enemies.

**Scorched Stag** (World Boss) — Fire-breathing stag with charge attacks. Spawns once per week, drops 400 Source on kill. HP persists across server restarts.

### The Rule System

If you have `ANTHROPIC_API_KEY` set, the daily champion system works like this:

1. Throughout the day, players earn Source by playing
2. At `CHAMPION_HOUR` (default 6pm), the player with the most total Source is selected as champion
3. The champion can either:
   - **Write their own rule** (e.g. "Add a new enemy type that teleports") — their stats are reset as a sacrifice
   - **Adopt the community's top suggestion** from the Scribe NPC — they keep their stats
4. Claude AI implements the rule by modifying the game code
5. The rule stays active until the weekly reset

Players can suggest rules at the Scribe NPC (200 Source) and vote on others' suggestions (50 Source).

### Weekly Reset

At `RESET_HOUR` on `RESET_DAY` (default Sunday 8pm):
- All Source and stats are reset to zero
- All active rules are cleared (game code reverts to **stable** branch)
- The Scorched Stag respawns
- Player name reservations persist (6-week TTL)

### Modding Your Server

Each community server gets two git branches: `live` (running code) and `stable` (your baseline). The weekly reset reverts `live` back to `stable`, so daily rules are temporary by default.

To create a **persistently modded** server:

1. Make your changes — either let AI rules accumulate, or edit the code directly
2. Open the **Admin Console** → **Modding** tab
3. Click **Promote Live → Stable** to save your current code as the new baseline
4. Enable the **Modded** flag so players can see your server is customized in the browser

Now when the weekly reset happens, it'll revert to your modded stable instead of vanilla. Your custom changes persist across resets while daily rules still get cleared.

**Requirements**: `GITHUB_TOKEN` and `GITHUB_REPO` must be set in your `.env` for branch management to work.

### Buildings

- **Wall** — Blocks everything. The backbone of any base.
- **Gate** — Passable door. Ctrl+click to manage the whitelist of who can pass.
- **Turret** — Fires explosive projectiles at enemies and non-whitelisted players. Ctrl+click to manage whitelist.
- **Bed** — Slowly heals nearby allies. You respawn here instead of the safe zone. One bed per player.

All buildings slowly regenerate HP. Enemies and players can destroy them.

### Parties

Ctrl+click another player to send a party invite. Party members:
- Appear blue on the minimap
- Have blue name tags
- Share Source (earner keeps 40%, remainder split evenly)

### The Safe Zone

The green circle at the center of the map:
- No combat or building allowed
- Players move 30% faster
- Enemies that touch it are destroyed
- Contains the **Banker** (deposit/withdraw Source) and **Scribe** (suggest/vote on rules)

## Port Forwarding

For players outside your local network to connect, you need to forward your server port in your router settings:

1. Find your router's admin page (usually `192.168.1.1`)
2. Look for Port Forwarding / NAT settings
3. Add a rule:
   - **External port**: 4800 (or your configured PORT)
   - **Internal port**: 4800
   - **Internal IP**: Your computer's local IP (e.g. `192.168.1.x`)
   - **Protocol**: TCP
4. Share your public IP + port with players (find your public IP at [whatismyip.com](https://whatismyip.com))

## Updates

Check the [PlainScape-Community releases](https://github.com/chvolk/PlainScape-Community) for the latest server builds. To update:

1. Stop your server (`/shutdown` in chat, or Ctrl+C)
2. Download the new release
3. Copy your `.env` and `plainscape.db` to the new folder
4. Start the new server

Your database and settings will carry over.

## Troubleshooting

**"Could not detect public IP"** — Set `SERVER_HOST` in your `.env` to your public IP address manually.

**Server not appearing in browser** — Make sure you have a valid `PATREON_KEY` or `DEMO_KEY` in your `.env`, and that `REGISTRY_URL` is set to `https://plainscape.world`.

**Players can't connect** — Check your port forwarding. The server port (default 4800) must be forwarded in your router for TCP traffic.

**"Rule system disabled"** — Set `ANTHROPIC_API_KEY` in your `.env` with your Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com).

**Admin console not loading** — The admin console is only accessible from `http://127.0.0.1:4801` (localhost). It cannot be accessed from other machines. If port 4801 is in use, set `ADMIN_PORT` to a different port in your `.env`.

## Links

- **Play online**: [plainscape.world](https://plainscape.world)
- **Community repo**: [github.com/chvolk/PlainScape-Community](https://github.com/chvolk/PlainScape-Community)
- **Support**: [Buy me a coffee](https://buymeacoffee.com/PlainScape)
