# Typeify

A full-stack typing test web app inspired by Monkeytype. Practice solo with time or word-count modes, track your stats, compete on leaderboards, and race friends in real-time multiplayer rooms.

## Features

- **Solo typing tests** — Time mode (15s / 30s / 60s / 120s) or words mode (10 / 25 / 50 / 100 words)
- **Custom text** — Optional punctuation and numbers in generated passages
- **Live feedback** — WPM chart, accuracy, consistency, and error tracking after each test
- **Accounts** — Sign up and log in with JWT authentication
- **Score history** — Automatically saves results when logged in
- **Leaderboard** — Top 10 best WPM per duration (15 / 30 / 60 / 120 seconds)
- **Profile** — Personal stats: tests completed, best WPM, averages
- **Multiplayer** — Create or join rooms with a share code; real-time races via Socket.IO

## Tech Stack

| Layer      | Technologies                                      |
| ---------- | ------------------------------------------------- |
| Frontend   | React 19, Vite, Tailwind CSS, Chart.js, Socket.IO |
| Backend    | Node.js, Express 5, Socket.IO, JWT, bcrypt        |
| Database   | MongoDB (Mongoose) — [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) recommended |

## Project Structure

```
Typeify/
├── backend/
│   ├── models/          # User & Score schemas
│   ├── routes/          # Auth & score API routes
│   ├── middleware/      # JWT auth middleware
│   ├── room.socket.js   # Multiplayer Socket.IO logic
│   └── server.js        # Express + HTTP server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # UI (typing area, charts, multiplayer, etc.)
│   │   ├── context/     # Auth state
│   │   ├── services/    # API clients
│   │   └── hooks/       # Typing engine & timers
│   └── hooks/           # Shared React hooks
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- npm
- A MongoDB database ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier works well)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Typeify.git
cd Typeify
```

### 2. Set up MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com).
2. Under **Database Access**, create a database user with a username and password.
3. Under **Network Access**, add your IP address (or `0.0.0.0/0` for local development only).
4. Click **Connect** on your cluster → **Drivers** → copy the connection string.

Update the URI with your credentials and a database name, for example:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/typeify?retryWrites=true&w=majority
```

If your password contains special characters (`@`, `#`, `/`, etc.), [URL-encode](https://www.mongodb.com/docs/manual/reference/connection-string/) them.

### 3. Configure the backend

Create `backend/.env`:

```env
PORT=5001
JWT_SECRET=your_long_random_secret_here
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/typeify?retryWrites=true&w=majority
```

| Variable     | Description                                      |
| ------------ | ------------------------------------------------ |
| `PORT`       | API server port (default: `5001`)                |
| `JWT_SECRET` | Secret used to sign auth tokens                  |
| `MONGO_URI`  | MongoDB connection string (Atlas or local)       |

Install dependencies and start the server:

```bash
cd backend
npm install
node server.js
```

You should see:

```
MongoDB Connected Successfully
Server running on port 5001
```

For auto-reload during development:

```bash
npx nodemon server.js
```

### 4. Configure and run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

The frontend talks to the API at `http://localhost:5001` by default. For multiplayer, Socket.IO uses the same host unless you set:

```env
# frontend/.env (optional)
VITE_SOCKET_URL=http://localhost:5001
```

## API Overview

### Auth — `/api/auth`

| Method | Endpoint   | Description        |
| ------ | ---------- | ------------------ |
| POST   | `/signup`  | Register a new user |
| POST   | `/login`   | Log in, returns JWT |

### Scores — `/api/scores`

| Method | Endpoint   | Auth | Description                          |
| ------ | ---------- | ---- | ------------------------------------ |
| POST   | `/`        | Yes  | Save a completed test score          |
| GET    | `/?duration=30` | No | Leaderboard for duration (15/30/60/120) |
| GET    | `/stats`   | Yes  | Logged-in user's aggregate stats     |

Protected routes expect:

```
Authorization: Bearer <token>
```

## Multiplayer

1. Log in from the navbar.
2. Open **Multiplayer**.
3. Create a room or join with a room code.
4. The host starts the race; progress and results sync over WebSockets.

Socket authentication uses the same JWT from login (`socket.handshake.auth.token`).

## Scripts

| Location   | Command              | Description              |
| ---------- | -------------------- | ------------------------ |
| `frontend` | `npm run dev`        | Start Vite dev server    |
| `frontend` | `npm run build`      | Production build         |
| `frontend` | `npm run preview`    | Preview production build |
| `backend`  | `node server.js`   | Start API + Socket.IO    |

## Environment & Security

- Never commit `.env` files — they are listed in `.gitignore`.
- Use a strong, unique `JWT_SECRET` in production.
- Restrict MongoDB Atlas **Network Access** to known IPs in production.
- Rotate database credentials if they are ever exposed.

## License

ISC
