<div align="center">
  <img src="frontend/public/favicon.ico" alt="Typeify Logo" width="80" />
  <h1>Typeify ⌨️</h1>
  <p>A modern, minimalist, and feature-rich typing test application with real-time multiplayer racing and AI-powered coaching.</p>
</div>

---

## ✨ Features

- **Advanced Typing Metrics**: Track your WPM, Accuracy, Raw speed, and Consistency in real-time.
- **Dynamic Charts**: Beautiful, interactive charts powered by Chart.js to visualize your typing test performance over time.
- **Real-Time Multiplayer Racing 🏎️**: Create or join race rooms and compete against friends in real-time, powered by Socket.io and Redis.
- **AI Coaching 🧠**: Get personalized, actionable feedback on your typing sessions generated instantly using Groq (Llama 3).
- **Global Leaderboards 🏆**: Compete for the top spot in 15s, 30s, 60s, and 120s categories.
- **Secure Authentication**: Full JWT-based authentication system with secure email verification (via Brevo) and password reset flows.
- **Seamless Theming 🌓**: Instantly switch between an elegant Dark mode and a crisp Light mode.

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (for rapid, beautiful, and responsive styling)
- **Framer Motion** (for smooth page transitions and micro-animations)
- **Chart.js & React-Chartjs-2**
- **Socket.io-client**

### Backend
- **Node.js & Express**
- **MongoDB & Mongoose** (Database)
- **Redis & Upstash** (for fast multiplayer room synchronization)
- **Socket.io** (WebSockets)
- **Groq API** (Llama 3 for AI Coaching)
- **Brevo SMTP** (for sending transactional emails)
- **JSON Web Tokens (JWT)** (for stateless authentication)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB connection string
- Redis connection string
- Groq API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/790Dev/Typeify.git
   cd Typeify
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file based on `.env.example` and fill in your keys.*
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```
   *Create a `.env` file based on `.env.example`.*
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## 🎮 How to Play
1. **Solo Practice**: Start typing immediately on the home page. Choose between time-based or word-count-based tests.
2. **AI Coach**: Click "Get AI Coaching" after a test to receive personalized tips on how to improve.
3. **Multiplayer**: Log in, navigate to the Multiplayer tab, and share a room code with your friends to race in real-time!

---
<div align="center">
  <i>Built with ❤️ by Yash and Devender</i>
</div>
