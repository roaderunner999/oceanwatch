# 🌊 OceanWatch — AI Water Safety

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square&fontFamily=monospace)
![Status](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/platform-web%20%7C%20iOS%20%7C%20Android-lightgrey?style=flat-square)

**Florida's free AI beach safety app** — built by Lyons Software, Merritt Island FL.

> *"Point. Scan. Stay safe."*

Powered by Claude Vision AI. Detects drowning risk, rip currents, marine wildlife, and vessel hazards in real time — and instantly alerts every nearby OceanWatch user when a hazard is found. Free forever.

**Live app:** [oceanwatch.app](https://oceanwatch.app)

---

## Changelog

### v1.0.0 — May 3, 2026 *(current)*
- 🚀 Initial public release
- 🆘 Apple-style 911 swipe — calls AND auto-texts GPS coordinates to dispatcher simultaneously
- 📡 Real-time WebSocket nearby user alert network — 500m radius broadcast
- 📍 Live GPS coordinates in emergency sheet — locks on page load
- 🗺 Mission Control admin dashboard — live user map, persistent scan history, password protected
- 🤖 Ocean-focused AI — swimmer distress, rip currents, marine life (shark/jellyfish/Man o' War/stingray/barracuda), vessel emergencies, red tide, severe weather
- ⛵ Vessel safety detections — person overboard, capsized vessel, dangerous wake near swimmers
- 📸 Photo and video capture — saves to camera roll (iOS) or Downloads (Android)
- 📊 Risk scoring 0–100 with four tiers (low / moderate / high / extreme)
- 💾 Persistent scan history — survives server restarts
- 📱 Fully responsive — iPhone 13 mini through desktop

---

## What It Does

### 🏊 Swimmer Safety — 8 detections
| Detection | Description |
|-----------|-------------|
| Person submerged | Head underwater — immediate alert |
| Face-down floating | Passive face-down position — critical alert |
| Arm waving | Raised arms / flailing — distress signal |
| Distress signal | Any visible call for help |
| Head count | Tracks every person in the water |
| Submersion timer | Warning at 5s, critical at 10s |
| Child detection | Identifies children in or near water |
| Passive floating | Motionless floating — monitoring alert |

### 〰 Water Hazards — 8 detections
| Detection | Description |
|-----------|-------------|
| Rip currents | Discolored channels, wave gaps, seaward foam — confidence rated 0–100% |
| Rough surf | Wave height and choppiness assessment |
| Discolored water | Murky, sediment-filled channels |
| Shore break | Dangerous breaking wave conditions |
| Seaward foam | Debris/foam being pulled out to sea |
| Wave height | Flat / small / medium / large |
| Water visibility | Clear / moderate / murky / opaque |
| Current channels | Narrow bands of seaward-moving water |

### 🚨 Emergency Features
| Feature | Description |
|---------|-------------|
| 🆘 911 Emergency button | Lives in the controls bar — always visible |
| Apple-style swipe to call | Must drag slider 82% across to prevent accidental dials |
| Auto-text GPS to 911 | Fires SMS with exact coordinates + hazard details to 911 dispatcher simultaneously with voice call |
| Text-to-911 | Brevard County E911 SMS enabled — dispatcher receives GPS + AI risk summary |
| GPS coordinates | Locks in on page load, shows live in the emergency sheet |
| Location access instructions | Guides user through iOS settings if permission denied |

### 📡 Nearby User Alert Network
| Feature | Description |
|---------|-------------|
| WebSocket broadcast | Real-time alerts pushed to all active OceanWatch users within 500 meters |
| Location-aware | Server calculates distance using Haversine formula — only nearby users alerted |
| Red alert banner | Slides down from top of screen on other phones — shows hazard type and distance |
| Auto-dismiss | Banner clears after 12 seconds |
| Reconnection | WebSocket auto-reconnects every 5 seconds if connection drops |

### 📷 Camera & Media
| Feature | Description |
|---------|-------------|
| Photo capture | Save beach photos directly to camera roll via Web Share API |
| Video recording | Record sessions — saves to camera roll |
| Camera flip | Switch between front and rear cameras |
| Scan interval | Adjustable: 5s / 10s / 15s / 20s |

### 📊 Risk Scoring
- **0–25** = Low (green) — conditions look safe
- **26–50** = Moderate (amber) — stay alert
- **51–75** = High (orange) — check swimmers immediately
- **76–100** = Extreme (red) — act now, 911 modal auto-raises

### 🖥 Mission Control (Admin Dashboard)
- Password-protected at `/admin`
- Live WebSocket user count
- Live map showing connected users with GPS coordinates (Google Maps embed)
- Scan history log — last 200 scans with tier, score, summary, duration
- Risk level distribution bar chart
- Persistent storage — history survives server restarts
- Real-time auto-refresh every 30 seconds

---

## Tech Stack

- **Frontend:** Vanilla JS / HTML / CSS — no frameworks, works on any mobile browser
- **Backend:** Node.js + Express
- **AI:** Anthropic Claude Vision (`claude-sonnet-4-5`)
- **Real-time:** WebSocket (`ws` package) — live nearby user alerts
- **Server:** DigitalOcean VPS + Nginx + PM2
- **SSL:** Let's Encrypt
- **Persistence:** JSON file store — survives restarts

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health + uptime + memory |
| `/api/analyze` | POST | Analyze a camera frame — returns risk score, detections, alerts |
| `/api/stats` | GET | Scan stats + full history |
| `/api/clients` | GET | Live WebSocket session count + GPS locations |
| `/api/debug` | GET | Environment info + API key status |
| `/ws` | WebSocket | Real-time nearby alert broadcast |

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

# Production (PM2)
pm2 start server.js --name oceanwatch
pm2 save
```

---

## 🔭 Roadmap

### Coming Soon — Apple App Store
- **Native iOS app** (Swift + WKWebView wrapper) — App Store listing, push notifications when app is closed
- **Background scanning** — AI keeps watching while user takes photos
- **Transparent AR rip current overlay** — directional escape arrows drawn directly over the live camera feed, anchored to where the rip current is detected in the frame using ARKit

### Planned Features
- **Push notifications** — alert nearby users even when their screen is off
- **Sound alerts** — audio beep/alarm on nearby user alerts so phones wake up
- **Community safety rings** — physical throw rings at unguarded beaches
- **Wave / current forecast integration** — NOAA rip current risk data overlaid with AI detections
- **Alert history** — reviewable log of all hazards detected at a location over time

### 📷 Fixed Infrastructure Camera Network *(planned — Cocoa Beach pilot)*

A stationary camera layer that runs independently of phone users — 24/7 autonomous AI monitoring of the beach from fixed elevated positions.

**Hardware:** Reolink 180° cameras mounted on rooftop or elevated structure, connected via ethernet. Each camera streams RTSP video to the OceanWatch server.

**How it works:**
- Server pulls frames from RTSP stream every 30 seconds during daylight hours
- Each frame is analyzed by Claude Vision — same AI as the phone app
- On normal conditions: scan every 30s (~$12/day per camera at current API pricing)
- On hazard detected: automatically increases to every 10s until threat clears
- Alerts broadcast instantly to all OceanWatch phone users within 500 meters
- Timestamped incident log with frame captures saved for every detection

**Ocean Rescue Dashboard:**
- Dedicated live-feed dashboard for Brevard County Ocean Rescue dispatch
- Shows all active camera feeds with AI risk overlay
- Incident log with exact timestamps, risk scores, and frame captures
- Direct alert webhook to dispatch email and SMS
- No phone required — runs entirely server-side

**Camera Mesh — multiple nodes:**
- 3 Reolink 180° cameras = full coverage of a half-mile beach section
- Each camera is an independent node — one failure doesn't affect others
- Overlapping coverage zones ensure no blind spots
- All nodes feed into the same WebSocket broadcast network as phone users

**Physical integration (future):**
- Beach speaker system — audible alert when extreme risk detected
- Flashing warning light at beach access points triggered by AI
- QR code on camera housing links beachgoers to oceanwatch.app

**Cost estimate for 3-camera pilot:**
- Hardware: ~$300 (3x Reolink 180° cameras)
- Server: existing DigitalOcean VPS (no additional cost)
- AI scanning: ~$36/day at 30s intervals, ~$12/day at 60s intervals
- Ethernet run: one-time installation cost

### Infrastructure
- **Brevard County Ocean Rescue integration** — direct alert pipeline to dispatch
- **Email/SMS alert subscriptions** — Ocean Rescue staff receive critical alerts on their devices
- **Analytics dashboard** — heatmap of detections by beach location and time of day
- **Florida Wildlife app** — separate app for alligators, snakes, turtles, and land wildlife identification with species detail, venom status, and conservation information

---

## Why This Matters

Rip currents cause approximately 100 deaths per year in the US and are responsible for 80% of lifeguard rescues. Florida leads the nation in rip current fatalities. With lifeguard shortages across Brevard County leaving miles of beach unguarded, AI-assisted crowd monitoring is not a luxury — it is a necessity.

OceanWatch does not replace lifeguards. It multiplies awareness. Every person on the beach with the app open is another set of eyes — and now, another node in a real-time safety network.

---

## ⚠️ Disclaimer

OceanWatch is an AI-assisted monitoring tool. It does **not** replace trained lifeguards or professional water safety supervision. Always swim near a lifeguard when one is present. AI detection has limitations — use this app as an additional layer of awareness, not your only source of safety information.

---

*Lyons Software — COCOA BEACH, FL*
