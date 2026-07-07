# Typeify

A full-stack typing test web app inspired by Monkeytype. Practice solo with time or word-count modes, track your stats, compete on leaderboards, and race friends in real-time multiplayer rooms.

## Features

- **Solo typing tests** — Time mode (15s / 30s / 60s / 120s) or words mode (10 / 25 / 50 / 100 words).
- **Custom text** — Optional punctuation and numbers in generated passages.
- **Live feedback** — WPM chart, accuracy, consistency, and error tracking after each test.
- **AI Coaching** — Personalized, actionable feedback on your typing sessions generated instantly using Groq (Llama 3).
- **Accounts & Security** — Sign up and log in with JWT authentication and secure email verification (Brevo).
- **Score history** — Automatically saves results when logged in.
- **Leaderboard** — Top WPM scores powered by Redis caching for high performance.
- **Profile** — Personal stats: tests completed, best WPM, averages.
- **Multiplayer** — Create or join rooms with a share code; real-time races via Socket.IO synchronized with Redis.
- **Theming** — Dynamic Light and Dark mode toggle for a customizable viewing experience.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite, Tailwind CSS, Chart.js, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO, JWT, bcrypt |
| **Database** | MongoDB (Mongoose) |
| **Cache & State** | Redis (Upstash) for leaderboards and multiplayer room state |
| **External APIs** | Groq API (AI Coaching), Brevo SMTP (Transactional Emails) |

## Project Structure

```text
Typeify/
├── backend/
│   ├── config/          # Database and Redis configurations
│   ├── controllers/     # API request handlers
│   ├── middlewares/     # JWT auth and validation middleware
│   ├── models/          # Mongoose schemas (User, Score)
│   ├── routes/          # Express API routes
│   ├── utils/           # AI integration, Mailer, Error handling
│   ├── room.socket.js   # Multiplayer Socket.IO logic
│   └── server.js        # Express + HTTP server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # UI (typing area, charts, multiplayer arena, auth)
│   │   ├── context/     # Auth and Theme global state
│   │   ├── services/    # API clients (axios)
│   │   └── utilty/      # Helper functions
│   └── hooks/           # Typing engine & timers
└── README.md
```

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- MongoDB database (MongoDB Atlas free tier works well)
- Redis instance (Upstash free tier recommended)
- Groq API Key (for AI features)
- Brevo SMTP credentials (for email verification)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Typeify.git
cd Typeify
```

### 2. Configure the backend

Create a `.env` file in the `backend` directory based on the provided `.env.example`:

```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/typeify?retryWrites=true&w=majority
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=10d
BREVO_SMTP_HOST=smtp.gmail.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_email@gmail.com
BREVO_SMTP_PASS=your_app_password
GROQ_API_KEY=your_groq_api_key_here
REDIS_URI=rediss://default:your_redis_token@your_redis_url:6379
```

Install dependencies and start the server:

```bash
cd backend
npm install
npm run dev
```

### 3. Configure and run the frontend

Create a `.env` file in the `frontend` directory based on the provided `.env.example`:

```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## API Overview

### Auth — `/api/auth`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/signup` | Register a new user |
| POST | `/login` | Log in, returns JWT |
| POST | `/verify-email` | Verify user email with OTP |

### Scores — `/api/scores`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/` | Yes | Save a completed test score |
| GET | `/?duration=30` | No | Leaderboard for duration (15/30/60/120) |
| GET | `/stats` | Yes | Logged-in user's aggregate stats |

Protected routes expect:
`Authorization: Bearer <token>`

## Multiplayer

1. Log in from the navbar.
2. Open Multiplayer.
3. Create a room or join with a room code.
4. The host starts the race; progress and results sync over WebSockets.
5. Socket authentication uses the same JWT from login.

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| frontend | `npm run dev` | Start Vite dev server |
| frontend | `npm run build` | Production build |
| backend | `npm run dev` | Start API + Socket.IO (with nodemon) |

## Environment & Security

- Never commit `.env` files — they are listed in `.gitignore`.
- Use strong, unique secrets in production.
- Restrict MongoDB and Redis network access to known IPs in production.
- Rotate database credentials if they are ever exposed.

## License

ISC
