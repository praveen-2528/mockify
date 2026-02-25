<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Vanilla_CSS-Glassmorphism-FF6B6B?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/Build-Passing-10B981?style=for-the-badge&logo=checkmarx&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-A78BFA?style=for-the-badge" />
</p>

<h1 align="center">🎯 Mockify</h1>

<p align="center">
  <strong>A premium, dynamic mock-test platform built for serious exam preparation.</strong><br/>
  Glassmorphism UI · BYOD JSON Questions · Real-time Per-Question Analytics · Pause & Blur Anti-Cheat
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-data-format">Data Format</a> •
  <a href="#-testing--build-results">Testing</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

## ✨ Features

### 🧩 Dynamic Configuration Flow
Kickstart your test session in **3 intuitive steps**:
| Step | What You Pick | Details |
|------|--------------|---------|
| **1. Exam Type** | SSC or IBPS | Automatically validates 4 vs 5 options per question |
| **2. Test Format** | Full Mock · Subject Wise · Topic Wise | Flexible practice modes |
| **3. Data Source** | Upload `.json` or paste raw JSON | Zero backend — your data, your rules |

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

### 📱 Fully Responsive
Works beautifully on desktop, tablet, and mobile. The question palette slides in as an overlay on smaller screens.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19.2 with functional components & hooks |
| **Bundler** | Vite 7.3 — blazing fast HMR & optimized production builds |
| **Routing** | React Router DOM v7 |
| **Styling** | 100% Vanilla CSS with custom glassmorphism design system |
| **Icons** | Lucide React (tree-shakeable, lightweight) |
| **State** | React Context API (`ExamContext`) |
| **Fonts** | Outfit (headings) + JetBrains Mono (code/timers) via Google Fonts |
| **Linting** | ESLint 9 with React Hooks + React Refresh plugins |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/<your-username>/mockify.git
cd mockify

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` and start practicing! 🎉

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
✓ Client bundle built in 13.86s

Output (gzipped):
  index.css    →  14.94 kB  │  gzip:  3.87 kB
  index.js     → 248.16 kB  │  gzip: 79.27 kB
```

### Dependency Audit
```
✓ 211 packages installed
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

---

## 📁 Project Structure

```
mockify/
├── index.html                  # Entry HTML with Google Fonts
├── vite.config.js              # Vite configuration
├── eslint.config.js            # ESLint 9 flat config
├── package.json                # Dependencies & scripts
├── questions.json              # Sample question bank
├── public/
│   └── vite.svg                # Favicon
└── src/
    ├── main.jsx                # React entry point (StrictMode)
    ├── App.jsx                 # Router setup (3 routes)
    ├── App.css                 # Root layout
    ├── index.css               # Global design system & animations
    ├── context/
    │   └── ExamContext.jsx     # Global state (exam, answers, timer)
    ├── components/
    │   └── ui/
    │       ├── Button.jsx/css  # Variants: primary, outline, ghost
    │       ├── Card.jsx/css    # Glass card with gradient border
    │       └── Input.jsx/css   # Form input with error states
    └── pages/
        ├── Setup.jsx/css       # 3-step config wizard
        ├── Test.jsx/css        # Test engine with palette sidebar
        └── Results.jsx/css     # Score summary + detailed review
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
