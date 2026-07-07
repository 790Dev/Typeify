# Typeify

A full-stack typing speed application built for serious practice. Test yourself in solo mode, analyze your performance with an AI coach, compete on the global leaderboard, and race friends in a live multiplayer arena.

---

## Features

### Typing Engine
- Time mode (15s / 30s / 60s / 120s) and Words mode (10 / 25 / 50 / 100 words)
- Optional punctuation and numbers for harder passages
- Real-time WPM and error tracking as you type
- Post-test results screen with a WPM chart, accuracy, raw speed, consistency score, and per-character mistake breakdown

### AI Coaching
- After every test, request an AI-generated analysis powered by Groq (Llama 3)
- The AI receives your WPM series, accuracy, error count, and most-missed characters
- Returns targeted, actionable tips specific to that session

### Accounts and Authentication
- JWT-based authentication with access and refresh token rotation
- Email verification on sign-up via Brevo SMTP
- Forgot password and reset password flows via secure tokenized email links
- Change password from the profile page
- Automatic background token refresh so sessions do not expire mid-test

### Leaderboard
- Global top scores per duration, backed by Redis for fast reads
- Displays rank, username, WPM, accuracy, and date
- Logged-in users who fall outside the top 10 see their personal rank pinned at the bottom

### Profile
- Personal stats: tests completed, best WPM, average WPM, average accuracy
- Full score history with filters
- Public profile pages — other users can view your stats by navigating to `/profile/:username`

### Multiplayer Arena
- Create a room and share the 6-character code with friends
- Guests join and wait in a lobby until the host starts
- Live race: each player's car advances on a shared track based on their real-time WPM progress
- Results screen shows final standings for all participants
- Room state is synchronized via Socket.IO and stored in Redis so it survives server restarts

### Theming
- Dark and Light mode toggle in the navbar (persisted to localStorage)

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Chart.js, Framer Motion, Socket.IO Client |
| Backend | Node.js, Express, Socket.IO |
| Auth | JSON Web Tokens (access + refresh), bcrypt |
| Database | MongoDB with Mongoose |
| Cache and Realtime State | Redis (Upstash) |
| AI | Groq API (Llama 3.1 8B) |
| Email | Brevo SMTP (Nodemailer) |

---

## Project Structure

```
Typeify/
├── backend/
│   ├── config/           # MongoDB and Redis connection setup
│   ├── controllers/      # Route handler logic
│   ├── db/               # Database initialization
│   ├── middlewares/      # JWT auth and request validation
│   ├── models/           # Mongoose schemas (User, Score)
│   ├── routes/           # Express route definitions
│   ├── scripts/          # Utility scripts (e.g. Redis backfill)
│   ├── utils/            # Mailer, Groq integration, error classes
│   ├── validators/       # Input validation schemas
│   ├── room.socket.js    # Multiplayer Socket.IO event handlers
│   └── server.js         # Application entry point
├── frontend/
│   ├── hooks/            # Typing engine, timer, word generation
│   ├── src/
│   │   ├── components/   # All UI components
│   │   ├── context/      # AuthContext, ThemeContext
│   │   ├── services/     # API client functions (auth, scores, coach)
│   │   └── utilty/       # Helper functions
│   └── index.html
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas account (free tier is sufficient)
- Upstash Redis account (free tier is sufficient)
- Groq API key (free at console.groq.com)
- A Gmail account with an App Password for email delivery

### 1. Clone the repository

```bash
git clone https://github.com/790Dev/Typeify.git
cd Typeify
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a template:

```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/typeify

ACCESS_TOKEN_SECRET=<random_secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<random_secret>
REFRESH_TOKEN_EXPIRY=10d

BREVO_SMTP_HOST=smtp.gmail.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_email@gmail.com
BREVO_SMTP_PASS=your_16_char_app_password

GROQ_API_KEY=gsk_...

REDIS_URI=rediss://default:<password>@<host>:6379
```

Start the server:

```bash
npm run dev
```

### 3. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
```

Create a `.env` file using `.env.example` as a template:

```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

All routes are prefixed with `/api/v1`.

### Authentication — `/api/v1/auth`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/signup` | No | Register a new user |
| POST | `/login` | No | Log in, returns access and refresh tokens |
| GET | `/verify-email/:token` | No | Verify email address from link |
| POST | `/forgot-password` | No | Send a password reset email |
| POST | `/reset-password/:token` | No | Reset password using the token from email |
| POST | `/refresh-token` | No | Get a new access token using refresh token |
| POST | `/logout` | Yes | Invalidate session and clear cookies |
| GET | `/me` | Yes | Get the currently authenticated user |
| POST | `/resend-verification` | Yes | Resend the verification email |
| POST | `/change-password` | Yes | Change password while logged in |

### Scores — `/api/v1/scores`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/` | Yes | Save a completed test result |
| GET | `/?duration=30` | No | Fetch leaderboard for a given duration |
| GET | `/stats` | Yes | Get aggregate stats for the logged-in user |
| GET | `/user/:username` | No | Get public stats for any user by username |

### Other

| Prefix | Description |
|---|---|
| `/api/v1/text` | Generate random word passages |
| `/api/v1/coach` | Get AI coaching analysis for a test result |
| `/api/v1/healthCheck` | Server health status |

---

## Environment and Security

- Never commit `.env` files. They are covered by `.gitignore`.
- Use strong, randomly generated values for all token secrets.
- In production, restrict MongoDB Atlas network access to your server's IP.
- Rotate all credentials immediately if they are accidentally exposed.

---

## License

ISC
