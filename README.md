# Nexy — Smart Home AI

Control your smart home with natural language. Nexy combines an AI assistant
with direct device control for **IKEA Dirigera** and **Matter / Thread** devices.

---

## Architecture

```
┌──────────────────────────────────┐
│   Frontend  (Next.js / React)    │  Mobile-first web app
│   Dashboard · Chat · Devices     │  → localhost:3000
└────────────────┬─────────────────┘
                 │ REST + WebSocket
┌────────────────▼─────────────────┐
│   Backend  (Python / FastAPI)    │  REST API + WebSocket push
│   /api/v1/devices  /api/v1/ai    │  → localhost:8000
└──────┬──────────────┬────────────┘
       │              │
┌──────▼──────┐ ┌──────▼──────────┐
│ IKEA        │ │ Matter Server   │
│ Dirigera    │ │ (Thread)        │
│ Hub         │ │                 │
└─────────────┘ └─────────────────┘
       │
  AI Layer (pluggable)
  Anthropic Claude · OpenAI · Ollama
```

---

## Quick Start

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `ACTIVE_AI_PROVIDER` | `anthropic` / `openai` / `ollama` |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `DIRIGERA_HOST` | IP of your IKEA hub (from IKEA Home Smart app) |
| `DIRIGERA_TOKEN` | Pairing token (see below) |

**Get your IKEA Dirigera token:**

1. Open the IKEA Home Smart app → Hub → note the IP address
2. Press the action button on the back of the Dirigera hub
3. Run within 30 seconds:
   ```bash
   python -c "
   from dirigera import Hub
   h = Hub(token='', ip_address='YOUR_HUB_IP')
   print(h.create_token())
   "
   ```
4. Paste the printed token into `DIRIGERA_TOKEN` in your `.env`

### 2. Configure the frontend

```bash
cd frontend
cp .env.local.example .env.local
```

### 3. Run with Docker (recommended)

```bash
docker compose up --build
```

Then open **http://localhost:3000** in your browser (or phone!).

### 3b. Run locally (development)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Features

- **Dashboard** — See all rooms and devices at a glance, toggle on/off, adjust brightness
- **Nexy AI Chat** — Natural language control: *"Dim the bedroom to 30%"*, *"Turn off all lights"*
- **Real-time updates** — WebSocket pushes device state changes to all open tabs instantly
- **Pluggable AI** — Switch between Claude, GPT-4o, or a local Ollama model by changing one env variable
- **IKEA Dirigera** — Full support for lights, blinds, plugs, and sensors
- **Matter / Thread** — Connect Matter-certified devices via python-matter-server

---

## API Documentation

When the backend is running, visit **http://localhost:8000/docs** for the
interactive Swagger UI.

---

## Project Structure

```
Nexy/
├── backend/
│   ├── app/
│   │   ├── ai/              Pluggable AI providers
│   │   ├── api/routes/      REST endpoints
│   │   ├── core/            Config, WebSocket manager
│   │   ├── integrations/    IKEA + Matter device adapters
│   │   └── models/          Pydantic data models
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             Next.js pages (Dashboard, Chat, Devices, Settings)
│   │   ├── components/      UI components
│   │   ├── hooks/           useDevices (WS + REST)
│   │   └── lib/             API client, utils
│   └── Dockerfile
└── docker-compose.yml
```
