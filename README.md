# "Itanong Mo Kay Doc!" — Live Stream Overlay System

Broadcast-grade live stream overlay and operator control hub for **OBS Studio**, custom-designed to match the **"Itanong Mo Kay Doc!"** hexagonal medical shield branding. Powered by Lucide icons across the operator control hub and Stream Deck mapper.

---

## Quick Start

1. Double-click **`start.bat`** (or run `npm start` in terminal).
2. The server will start at `http://localhost:3000`.

---

## OBS Studio Setup

### 1. Landscape Stream (16:9 for Facebook / YouTube)
1. In OBS, add a **Browser** source to your Scene.
2. **URL**: `http://localhost:3000/overlay/landscape`
3. **Width**: `1920`
4. **Height**: `1080`
5. Check **"Control audio via OBS"** (or let it play via your monitor audio).
6. Check **"Shutdown source when not visible"** if desired.

### 2. Portrait Stream (9:16 for TikTok Live)
1. In your TikTok portrait canvas / vertical scene, add a **Browser** source.
2. **URL**: `http://localhost:3000/overlay/portrait`
3. **Width**: `1080`
4. **Height**: `1920`

---

## Operator Control Hub (`/admin`)

Open your browser to:
**`http://localhost:3000/admin`**

- **Live On-Air Monitor**: Real-time feedback of what's currently showing on stream with a big red emergency **Clear / Hide** button.
- **Quick-Add Form**: Add questions on the fly with submitter name, platform (Facebook/TikTok), category, and question text.
- **One-Click "SHOW ON AIR"**: Triggers the spring bounce entrance animation and broadcast chime on both landscape and portrait overlays simultaneously.
- **Mark Answered (Done)**: Keeps track of questions already addressed by Doc during the episode.
- **Lucide Icon System**: Modern, consistent vector icons across all panels, badges, controls, and Stream Deck keys.

---

## Operator Hotkeys

Control the broadcast live without touching the mouse (hotkeys are paused when typing inside form inputs):

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | **Toggle On-Air**: Broadcast focused question, or hide if active |
| <kbd>Esc</kbd> | **Emergency Clear**: Instantly hide overlay from stream |
| <kbd>N</kbd> or <kbd>→</kbd> | **Next Question**: Advance to next unanswered question |
| <kbd>P</kbd> or <kbd>←</kbd> | **Previous Question**: Step back to previous question |
| <kbd>D</kbd> | **Done & Next**: Mark active question answered and display next |
| <kbd>↓</kbd> / <kbd>↑</kbd> | **Queue Cursor**: Move focused selection up or down |
| <kbd>Enter</kbd> | **Show Selected**: Broadcast the keyboard-focused question |
| <kbd>?</kbd> | **Cheat Sheet**: Open shortcut & Stream Deck modal |

---

## Elgato Stream Deck Webhook Endpoints

In the Elgato Stream Deck software, add a **System > Website** or **API Request** action and point it to:

| Action | Endpoint URL (GET or POST) |
| :--- | :--- |
| **Next Question** | `http://localhost:3000/api/stream/next` |
| **Previous Question** | `http://localhost:3000/api/stream/prev` |
| **Done & Next** | `http://localhost:3000/api/stream/done-next` |
| **Toggle On-Air** | `http://localhost:3000/api/stream/toggle` |
| **Emergency Clear** | `http://localhost:3000/api/stream/hide` |
| **Stream Status** | `http://localhost:3000/api/stream/status` |

---

## Design System Tokens
Extracted directly from the brand shield logo:
- Primary Green: `#12C12D`
- Green Glow: `#24FF44`
- Cyan Highlight: `#52EDFF`
- Deep Teal: `#0DA7BA`
- Broadcast Blue: `#026DFE`
- Frosted Dark Backdrop: `rgba(6, 20, 26, 0.94)` with `backdrop-filter: blur(16px)`
