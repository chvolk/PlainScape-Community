# PlainScape Community Server

Host your own PlainScape game server!

## Quick Start

1. Install [Node.js 22+](https://nodejs.org/)
2. Copy `.env.example` to `.env` and edit your settings
3. Run `./start.sh` (Linux/Mac) or `start.bat` (Windows)
4. Open `http://localhost:8080` in your browser
5. To appear in the server browser at plainscape.world, add your Patreon key to `.env`

## Port Forwarding

For others to connect over the internet, forward your server port (default 8080) in your router settings.

## Admin Commands

Admin users (set via ADMIN_USERS in .env) can use these chat commands:

| Command | Description |
|---------|-------------|
| `/source <amount>` | Give yourself source |
| `/stag spawn` / `/stag kill` | Manage the world boss |
| `/dawn` `/day` `/dusk` `/night` `/autotime` | Control time of day |
| `/shutdown` | Gracefully stop the server |
| `/clearrules` | Clear all active rules |
| `/clearsuggestions` | Clear all rule suggestions |
| `/notice <text>` | Add a server notice |
| `/clearnotices` | Clear all notices |
| `/rule` | Open the rule submission prompt |

## Daily Champion & Rules

If you set `ANTHROPIC_API_KEY` in your `.env`, the daily champion system is enabled:
- The player who earns the most Source each day gets to add a rule
- Rules are implemented by Claude AI and modify the game code
- Rules reset on the weekly reset

Without an API key, the game works normally — just without the AI rule system.

## Configuration

See `.env.example` for all available settings including timezone, champion hour, reset schedule, and more.
