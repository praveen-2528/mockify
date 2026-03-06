<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Vanilla_CSS-Glassmorphism-FF6B6B?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/Build-Passing-10B981?style=for-the-badge&logo=checkmarx&logoColor=white" />
</p>

```text
 __  __            _    _  __       
|  \/  |          | |  (_)/ _|      
| \  / | ___   ___| | _ _| |_ _   _ 
| |\/| |/ _ \ / __| |/ / |  _| | | |
| |  | | (_) | (__|   <| | | | |_| |
|_|  |_|\___/ \___|_|\_\_|_|  \__, |
                               __/ |
                              |___/ 
```

<h1 align="center">🎯 Mockify</h1>

<p align="center">
  <strong>A premium, multiplayer-ready mock-test platform built for serious exam preparation.</strong><br/>
  Multiplayer Rooms · LAN & Internet Sharing · AI Prompt Generator · Question Bank · Glassmorphism UI
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-multiplayer-rooms">Multiplayer</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-data-format">Data Format</a> •
  <a href="#-testing--build-results">Testing</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

## ✨ Features

### 🔐 Authentication & Profiles
- **Secure Login** — Email/password auth powered by SQLite, bcrypt (10 rounds), and JWT.
- **Protected Routes** — App is locked down until you log in; dashboard and histories are tied to your account.
- **Profile Management** — Manage your details and securely change your password from the Settings page.

### 📚 Personal Question Bank
- **Your Own Database** — Stop pasting JSON every time. Upload your catalog once and it saves to your account.
- **CSV & JSON Import** — Import questions via JSON or CSV format. Paste CSV output from any AI tool and parse it instantly.
- **Management Console** — Browse, search, filter, edit, and delete your questions.
- **Instant Test Generation** — Pick a subject, type the number of questions (e.g., 25), and hit generate. Mockify instantly builds a random unique test from your bank.

### 🤖 AI Prompt Generator
- **4-Step Workflow** — Configure → Copy Prompt → Paste AI Output → Import to Question Bank.
- **Zero API Cost** — Generates a structured prompt you paste into any free AI tool (ChatGPT, Gemini, etc.).
- **CSV Output** — AI returns questions in CSV format, which Mockify parses and imports automatically.
- **Customizable** — Choose exam type, subject, topic, difficulty, and number of questions.

### 🏆 Global Leaderboard
- Compare your performance against all Mockify users!
- **Dynamic Podium** features the Top 3 players with scaling bars.
- Ranks based on **Average Score** across all tests taken.

### 🎨 Premium Glassmorphism UI
- **Deep Space Background** — Animated mesh gradient with floating red/grey geometric blobs and an SVG noise-grain overlay for tangible depth
- **Frosted Glass Panels** — All cards and navigation use `backdrop-filter: blur(16px)` translucent styling
- **Outfit + JetBrains Mono** typography pairing for a highly readable, premium feel
- **Micro-animations** — Hover glows, smooth page transitions, pulse effects on low time

### ⏱️ Advanced Test Engine
| Feature | Description |
|---------|-------------|
| **Live Per-Question Timer** | Tracks *exactly* how many seconds you spend on every question |
| **Pause & Blur** | Pause the timer anytime — the question area blurs instantly to prevent cheating |
| **Progress Check** | Check your current score mid-test without ending the session |
| **Mark for Review** | Bookmark tricky questions (highlighted in amber on the sidebar palette) |
| **Fisher-Yates Shuffle** | Questions are randomized every attempt for a fresh experience |
| **Auto-Submit** | Timer runs out? The test auto-submits gracefully |

### 📊 Comprehensive Results & Analytics
- **Score Summary** — Total, Attempted, Correct, Incorrect, Skipped at a glance
- **Time Analytics** — See exact time spent on each question (e.g., `01:42`) right next to the question
- **Color-Coded Review** — Green border for correct, red for incorrect, grey for skipped
- **Explanations** — Renders the logic/explanation from your JSON for every single question

### 💾 Save & Resume
- **Save & Exit** — Save your test mid-way and come back later
- **Auto-Save** — Progress auto-saves every 60 seconds during solo tests
- **Saved Exams Gallery** — Card grid with progress bars, dates, and one-click resume
- Stored in localStorage (up to 20 tests, auto-prunes oldest)

### 📱 Fully Responsive
Works beautifully on desktop, tablet, and mobile. The question palette slides in as an overlay on smaller screens.

---

## 🏠 Multiplayer Rooms

Create or join rooms over the internet with a **6-character room code** (like Kahoot!). Two modes:

### 🔗 Share & Invite Friends

The lobby has a built-in **Share & Invite** section with multiple ways to invite friends:

| Method | Who Can Join | How |
|--------|-------------|-----|
| **📋 Copy Invite Message** | Anyone | One-click copies a formatted message with link + room code — paste in WhatsApp/Telegram |
| **🏠 LAN Link** | Same WiFi | Visible copyable link like `http://192.168.x.x:5173/lobby?room=CODE` |
| **🌐 Internet Link** | Anyone worldwide | Click "Go Online" to create a Cloudflare tunnel — public link appears instantly |
| **🔑 Room Code** | Anyone with app access | Enter the 6-char code manually in the Join tab |

- **Auto-Join** — When friends open an invite link, they're redirected to login and then **automatically taken to the room** with the code pre-filled.
- **Powered by Cloudflare Tunnel** — No port forwarding needed. Works through NAT/firewalls.

### 🎉 Friendly Mode
| Step | What Happens |
|------|--------------|
| 1 | Everyone sees the **same question** at the same time |
| 2 | Each player picks an answer — their option **locks** |
| 3 | Spinner shows "Waiting for others... (2/3)" with live checkmarks |
| 4 | Once **all players answer** → correct answer is **revealed** |
| 5 | Shows: ✅/❌ per-option highlights, who picked what, and the explanation |
| 6 | **Host** clicks "Next Question" to advance everyone |

Perfect for study groups — learn together, discuss each answer!

### 📝 Real Exam Mode
| Step | What Happens |
|------|--------------|
| 1 | Everyone gets the **same shuffled question set** |
| 2 | Each player takes the test at their **own pace** |
| 3 | **No answers revealed** until final submission |
| 4 | After submission → **Leaderboard** ranks everyone |

Perfect for competitive practice — simulate real exam conditions!

### 🏆 Leaderboard
- **Podium** for top 3 (🥇🥈🥉) with gold/silver/bronze styling
- **Ranked table**: Score, Correct, Incorrect, Total Time
- Live refresh while waiting for others to finish
- Sort by score (desc) → time (asc) for tiebreakers

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19.2 with functional components & hooks |
| **Bundler** | Vite 7.3 — blazing fast HMR & optimized production builds |
| **Backend** | Node.js + Express + Socket.IO 4.8 (multiplayer rooms) |
| **Database** | SQLite (better-sqlite3) for user accounts, question bank, leaderboards |
| **Auth** | JWT + bcrypt — secure token-based authentication |
| **Tunneling** | Cloudflare Quick Tunnels — share rooms over the internet, no port forwarding |
| **Routing** | React Router DOM v7 (12+ routes) |
| **Styling** | 100% Vanilla CSS with custom glassmorphism design system |
| **Icons** | Lucide React (tree-shakeable, lightweight) |
| **State** | React Context API (`ExamContext` + `RoomContext` + `AuthContext`) |
| **Realtime** | Socket.IO client/server for WebSocket communication |
| **Persistence** | SQLite (server) + localStorage (client save/resume) |
| **Fonts** | Outfit (headings) + JetBrains Mono (code/timers) via Google Fonts |
| **Linting** | ESLint 9 with React Hooks + React Refresh plugins |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/praveen-2528/mockify.git
cd mockify

# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Solo mode (frontend only)
npm run dev

# Multiplayer mode (frontend + backend)
npm run dev:full
```

| Mode | URL | What It Runs |
|------|-----|--------------|
| Solo | `http://localhost:5173` | Vite dev server only |
| Multiplayer | `http://localhost:5173` + `:3001` | Vite + Socket.IO server |
| LAN Play | `http://<your-ip>:5173` | Auto-exposed to LAN (`host: true` in Vite config) |
| Internet | Click "Go Online" in lobby | Creates a Cloudflare tunnel — shareable public URL |

### Production Build

```bash
npm run build    # Outputs optimized bundle to /dist
npm run preview  # Preview the production build locally
```

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    SETUP PAGE (/)                        │
│                                                         │
│  Step 1: Pick Exam ──▶ Step 2: Pick Format              │
│                            │                            │
│                  Step 3: Upload/Paste JSON               │
│                            │                            │
│              ┌─────────────┴──────────────┐             │
│              │   JSON Validation Engine   │             │
│              │  • Parse & extract array   │             │
│              │  • Validate option count   │             │
│              │  • Map correct answers     │             │
│              │  • Fisher-Yates shuffle    │             │
│              └─────────────┬──────────────┘             │
└────────────────────────────┼────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   TEST PAGE (/test)                      │
│                                                         │
│  ┌──────────────────────┐  ┌────────────────────────┐   │
│  │   Question Area      │  │   Question Palette     │   │
│  │  • Question text     │  │  • Grid of numbered    │   │
│  │  • Option buttons    │  │    buttons              │   │
│  │  • Navigation        │  │  • Answered/Review/     │   │
│  │  • Mark for Review   │  │    Current indicators   │   │
│  │  • Per-Q timer       │  │  • Stats summary        │   │
│  └──────────────────────┘  │  • Progress Check btn   │   │
│                            │  • Submit btn            │   │
│  Timer ─ Pause/Resume      └────────────────────────┘   │
│  Blur overlay on pause                                   │
└────────────────────────────┼────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 RESULTS PAGE (/results)                   │
│                                                         │
│  ┌────────────┐  ┌──────────────────────────────────┐   │
│  │ Score Ring  │  │ Stats: Attempted · Correct ·     │   │
│  │  12/20     │  │        Incorrect · Skipped        │   │
│  │  60.0%     │  └──────────────────────────────────┘   │
│  └────────────┘                                         │
│                                                         │
│  Detailed Review: Each question with ⏱️ time,           │
│  color-coded options, and full explanations              │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Data Format

Mockify uses a **BYOD (Bring Your Own Data)** approach. Feed it any array of JSON question objects:

```json
[
  {
    "id": 1,
    "question": "What is the capital of France?",
    "options": {
      "A": "London",
      "B": "Berlin",
      "C": "Paris",
      "D": "Madrid"
    },
    "correct_option": "C",
    "subtopic": "Geography",
    "explanation": "Paris is the capital and most populous city of France."
  },
  {
    "id": "IDP058",
    "difficulty": "Easy",
    "question": "Meaning: To be very easy",
    "options": {
      "A": "A piece of cake",
      "B": "A piece of pie",
      "C": "A piece of bread",
      "D": "A piece of meat"
    },
    "correct_option": "A",
    "explanation": "Piece of cake means very easy.",
    "subtopic": "Idioms"
  }
]
```

### Flexible Parsing
The app intelligently extracts questions from multiple JSON structures:
- ✅ Direct array: `[ {...}, {...} ]`
- ✅ Object with `questions` key: `{ "questions": [...] }`
- ✅ Object with `data` key: `{ "data": [...] }`
- ✅ Object with any array value: `{ "myQuestions": [...] }`

### Validation Rules
| Exam Type | Required Options | Option Keys |
|-----------|-----------------|-------------|
| **SSC** | 4 per question | A, B, C, D |
| **IBPS** | 5 per question | A, B, C, D, E |

---

## ✅ Testing & Build Results

### Production Build
```
✓ vite v7.3.1 — build completed successfully
✓ Client bundle built in 10.97s

Output (gzipped):
  index.css    →  26.99 kB  │  gzip:  5.68 kB
  index.js     → 312.80 kB  │  gzip: 98.22 kB
```

### Dependency Audit
```
✓ 285+ packages installed (frontend) + 90 packages (server)
✓ 0 vulnerabilities found
✓ All peer dependencies satisfied
```

### Feature Testing Checklist

| # | Test Case | Status |
|---|-----------|--------|
| 1 | App launches on `localhost:5173` without errors | ✅ Pass |
| 2 | SSC exam type selection → validates 4 options per question | ✅ Pass |
| 3 | IBPS exam type selection → validates 5 options per question | ✅ Pass |
| 4 | JSON file upload (`.json`) loads data correctly | ✅ Pass |
| 5 | Raw JSON paste + validation works | ✅ Pass |
| 6 | Invalid JSON shows descriptive error messages | ✅ Pass |
| 7 | Questions are shuffled (Fisher-Yates) on every attempt | ✅ Pass |
| 8 | Timer counts down correctly (1hr SSC / 2hr IBPS) | ✅ Pass |
| 9 | Per-question time tracking updates in real-time | ✅ Pass |
| 10 | Pause freezes timer + blurs question area | ✅ Pass |
| 11 | Resume restores timer + removes blur | ✅ Pass |
| 12 | Option selection highlights and persists across navigation | ✅ Pass |
| 13 | Mark for Review toggles amber indicator on palette | ✅ Pass |
| 14 | Question palette navigation (jump to any question) | ✅ Pass |
| 15 | Progress Check shows mid-test score via alert | ✅ Pass |
| 16 | Submit Test navigates to Results page | ✅ Pass |
| 17 | Results page shows correct score, percentage, stats | ✅ Pass |
| 18 | Detailed review shows per-question time spent | ✅ Pass |
| 19 | Correct answers highlighted green, wrong answers red | ✅ Pass |
| 20 | Explanations rendered for each question | ✅ Pass |
| 21 | "New Test" resets state and returns to Setup | ✅ Pass |
| 22 | Responsive layout on mobile viewport (< 768px) | ✅ Pass |
| 23 | Palette sidebar slides in on mobile | ✅ Pass |
| 24 | Direct URL `/test` without state redirects to Setup | ✅ Pass |
| 25 | Direct URL `/results` without state redirects to Setup | ✅ Pass |
| 26 | Multiplayer: Create Room generates 6-char code | ✅ Pass |
| 27 | Multiplayer: Join Room with code + name works | ✅ Pass |
| 28 | Multiplayer: Participant list updates in real-time | ✅ Pass |
| 29 | Friendly mode: Waits for all to answer before reveal | ✅ Pass |
| 30 | Friendly mode: Correct answer + player choices shown | ✅ Pass |
| 31 | Friendly mode: Host advances, peers follow | ✅ Pass |
| 32 | Exam mode: No answers revealed till submission | ✅ Pass |
| 33 | Leaderboard: Podium + ranked table after submission | ✅ Pass |
| 34 | Save & Exit: Saves progress to localStorage | ✅ Pass |
| 35 | Saved Exams: Resume from where you left off | ✅ Pass |
| 36 | Auto-save: Silent save every 60s during solo test | ✅ Pass |

---

## 📁 Project Structure

```
mockify/
├── index.html                  # Entry HTML with Google Fonts
├── vite.config.js              # Vite config + proxy + LAN/tunnel settings
├── eslint.config.js            # ESLint 9 flat config
├── package.json                # Dependencies & scripts
├── server/
│   ├── package.json            # Server dependencies (cloudflared, socket.io, etc.)
│   ├── index.js                # Express + Socket.IO + Cloudflare Tunnel server
│   └── db.js                   # SQLite database (users, questions, scores)
├── public/
│   └── sample_template.csv     # Sample CSV template for question import
└── src/
    ├── main.jsx                # React entry point (StrictMode)
    ├── App.jsx                 # Router setup (12+ routes) with ProtectedRoute
    ├── App.css                 # Root layout
    ├── index.css               # Global design system & animations
    ├── utils/
    │   ├── storage.js          # localStorage save/resume engine
    │   ├── csvParser.js        # CSV parsing for AI-generated questions
    │   └── examTemplates.js   # Exam type templates (SSC, IBPS, etc.)
    ├── context/
    │   ├── AuthContext.jsx     # JWT auth state + smart local/remote API URL
    │   ├── ExamContext.jsx     # Exam state (questions, answers, timer)
    │   └── RoomContext.jsx     # Socket.IO + tunnel state + auto-detection
    ├── components/
    │   └── ui/
    │       ├── Button.jsx/css  # Variants: primary, outline, ghost
    │       ├── Card.jsx/css    # Glass card with gradient border
    │       └── Input.jsx/css   # Form input with error states
    └── pages/
        ├── Login.jsx/css       # Auth (login/register) + redirect-back
        ├── Setup.jsx/css       # Exam config + nav to rooms/saved
        ├── Lobby.jsx/css       # Create/Join room + Share & Invite section
        ├── Test.jsx/css        # Test engine + friendly/exam modes
        ├── Results.jsx/css     # Score summary + detailed review
        ├── Dashboard.jsx/css   # User dashboard + stats overview
        ├── QuestionBank.jsx/css # Question management console
        ├── AIGenerator.jsx/css # AI Prompt Generator (4-step wizard)
        ├── MockBuilder.jsx/css # Custom mock test builder
        ├── Settings.jsx/css    # Profile & password management
        ├── SavedExams.jsx/css  # Saved exams gallery with resume
        ├── Leaderboard.jsx/css # Room leaderboard (podium + table)
        └── GlobalLeaderboard.jsx/css # Cross-user rankings
```

---

## 🎯 Supported Exams

| Exam | Options | Timer |
|------|---------|-------|
| **SSC** (Staff Selection Commission) | 4 per question (A–D) | 60 minutes |
| **IBPS** (Institute of Banking Personnel Selection) | 5 per question (A–E) | 120 minutes |

---

## 🧑‍💻 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Built with ❤️ for exam aspirants who deserve better tools.</strong><br/>
  <sub>If you found this useful, drop a ⭐ on the repo!</sub>
</p>
