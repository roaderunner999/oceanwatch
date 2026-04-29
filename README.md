# 🌊 OceanWatch — AI Water Safety

Real-time drowning detection using Claude Vision AI. Built on the same stack as RipScan.

## Detection capabilities
- Person count in water
- Submersion duration (warning at 5s, critical at 10s)
- Face-down floating
- Arm waving / distress signals
- Water conditions & current visibility
- Risk score 0–100 with Low / Moderate / High / Extreme tiers

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY

# 3. Run
npm start          # production
npm run dev        # dev with auto-reload

# 4. Open
# http://localhost:3000
```

## cPanel / Passenger deployment
Same as RipScan — the server auto-detects Passenger and routes on both `/api` and `/oceanwatch/api`.

## Project structure
```
oceanwatch/
├── server.js               # Express entry — mirrors RipScan
├── routes/
│   ├── analyze.js          # Claude Vision + submersion timers
│   ├── health.js
│   └── stats.js
├── middleware/
│   ├── rateLimiter.js      # Global + daily scan limits
│   └── auth.js             # Optional CLIENT_SECRET gate
├── utils/
│   ├── anthropic.js        # Claude Vision wrapper + prompt
│   └── validateImage.js    # Image validation
├── public/
│   └── index.html          # Single-file frontend
└── .env.example
```

## API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/analyze` | POST | Analyze a frame |
| `/api/stats` | GET | Scan stats + history |
| `/api/debug` | GET | Key + environment info |

### POST /api/analyze body
```json
{
  "imageData": "<base64 jpeg, no data URL prefix>",
  "mediaType": "image/jpeg",
  "sessionId": "sess_abc123",
  "timestamp": 1704067200000
}
```

## iOS migration
Keep the Node.js backend as-is. Replace the HTML camera with `expo-camera` or `AVFoundation`, send the same `POST /api/analyze` request.

## Disclaimer
For assisted monitoring only. Never replaces trained lifeguards.
