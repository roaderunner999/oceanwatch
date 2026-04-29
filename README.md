# 🌊 OceanWatch — AI Water Safety

**Florida's free AI water safety app** — built by Lyons Software, Merritt Island FL.

> *"Point. Scan. Stay safe."*

Powered by Claude Vision AI. Detects drowning, rip currents, and dangerous wildlife in real time. Free forever.

---

## 🔍 What OceanWatch Detects

### 🏊 Swimmer Safety
| Detection | Description |
|-----------|-------------|
| Person submerged | Head underwater — immediate alert |
| Face-down floating | Passive face-down position — critical alert |
| Arm waving | Raised arms / flailing — distress indicator |
| Distress signal | Any visible call for help |
| Head count | Tracks every person in the water |
| Submersion timer | Alerts at 5s warning, 10s critical |
| Child detection | Identifies children in or near water |
| Passive floating | Motionless floating — monitoring alert |

### 〰 Water Hazards
| Detection | Description |
|-----------|-------------|
| Rip currents | Discolored channels, wave gaps, seaward foam — confidence rated |
| Rough surf | Wave height and choppiness assessment |
| Discolored water | Murky, sediment-filled channels indicating current |
| Shore break | Dangerous wave conditions at the shore |
| Seaward foam | Debris/foam being pulled out to sea |
| Wave height | Flat / small / medium / large classification |
| Water visibility | Clear / moderate / murky / opaque |
| Current channels | Narrow bands of seaward-moving water |

### 🐊 Florida Wildlife
| Animal | Detection Clues |
|--------|----------------|
| 🐊 Alligator | Floating log shapes, eyes at waterline, ridged tail, V-wake |
| 🐊 American Crocodile | Lighter color, narrow snout, south Florida/brackish water |
| 🦈 Shark | Dorsal fin, underwater shadows, bull sharks in fresh water |
| 🪼 Jellyfish | Translucent dome shapes near surface, blooms |
| 🪼 Portuguese Man o' War | Blue/purple float with trailing tentacles |
| 🐍 Water Moccasin | Dark swimming snake, triangular head, S-curve pattern |
| 🐟 Stingray | Flat dark shape on sandy bottom near shore |
| 🦔 Sea Urchins | Spiky shapes on rocks or bottom |
| 🐠 Barracuda | Long silver fish near swimmers in clear water |
| 🦭 Other marine animals | Any unidentified marine animal near swimmers |

### ⚡ Conditions & Alerts
| Feature | Description |
|---------|-------------|
| Lighting quality | Assesses visibility for accurate detection |
| Crowd density | Empty / sparse / moderate / crowded |
| Risk scoring | 0–100 score with Low / Moderate / High / Extreme tiers |
| Real-time alerts | Swimmer, water, and wildlife strips appear instantly |
| Photo capture | Save beach photos directly from the app |
| Video recording | Record sessions — saves to camera roll |
| Always free | No subscription, no scan limits, free forever |

---

## 🚀 Live App
```
https://lyons.software/oceanwatch
```

## 📊 Admin Dashboard
```
https://lyons.software/admin
```

---

## Tech Stack
- **Backend:** Node.js + Express
- **AI:** Anthropic Claude Vision (`claude-sonnet-4-5`)
- **Server:** DigitalOcean VPS + Nginx + PM2
- **SSL:** Let's Encrypt

---

## Quick Deploy

```bash
# Clone
git clone https://github.com/roaderunner999/oceanwatch.git
cd oceanwatch

# Install
npm install

# Configure
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Run
npm start
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health + uptime |
| `/api/analyze` | POST | Analyze a camera frame |
| `/api/stats` | GET | Scan stats + history |
| `/api/debug` | GET | Environment info |

---

## Why OceanWatch?

Two people drowned saving a child in Cocoa Beach, FL. They had no warning, no tools, and no choice but to swim into an active rip current. OceanWatch exists so that never happens again.

**Free. Forever. For everyone.**

---

## ⚠️ Disclaimer

OceanWatch is an AI-assisted monitoring tool. It does **not** replace trained lifeguards or professional water safety supervision. Always swim near a lifeguard. AI detection has limitations — use this app as an additional layer of awareness, not your only source of safety information.

---

*Built with ❤️ on Merritt Island, Florida by Lyons Software*  
*Powered by Anthropic Claude Vision AI*
