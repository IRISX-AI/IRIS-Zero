# ⚡ IRIS-Zero

**IRIS-Zero ⚡ — A private local-first AI terminal that listens 🎧, thinks 🧠, and executes on your machine in real time. Run commands ⚙️, manage projects 📁, and automate your workflow with zero APIs, zero telemetry, and full device-side intelligence 🔐.**

---

## 📑 Table of Contents

- ⚡ Overview
- ✨ Features
- 🏗️ Architecture
- 💻 Tech Stack
- 🔐 Privacy & Security
- 🚀 Installation
- 🎙️ Voice Commands
- 📁 Project Structure
- 🧠 Philosophy
- 🛣️ Roadmap
- 🤝 Contributing
- 👨‍💻 Author
- 📜 License

---

# ⚡ Overview

**IRIS-Zero is not a chatbot.**

It is a fully local AI command-line runtime built for real execution.

Speak naturally.
Type naturally.
IRIS-Zero listens, reasons, and executes directly on your machine.

No cloud.
No remote inference.
No external APIs.

Everything runs on-device.

Powered by local AI models through Ollama, Whisper, and Kokoro.

Built for:

- Developers
- Hackers
- Privacy-first builders
- Local AI enthusiasts
- Offline productivity

IRIS-Zero transforms your terminal into a real-time neural execution layer.

---

# ✨ Core Features

## 🎧 Real-Time Voice Interface

- Wake and speak naturally
- Local Whisper speech-to-text
- Interrupt naturally while speaking
- Instant offline command execution
- Streaming terminal feedback

Example:

```bash
“Open my project folder”
“Create a React app here”
“Run npm install”
“Explain this error”
```

---

## 🧠 Local AI Reasoning

Powered by local LLMs via Ollama.

- Natural language understanding
- Coding assistance
- Terminal reasoning
- File-aware execution
- Project context awareness
- Works completely offline

Supported:

- Llama
- Mistral
- DeepSeek
- Gemma
- Any Ollama-supported model

---

## ⚙️ Terminal Automation

Execute directly:

- Run commands
- Install packages
- Open projects
- Git workflows
- Generate files
- Build folders
- Read logs
- Search directories
- Manage processes

Examples:

```bash
Create a Next.js project
Run the dev server
Find every TODO comment
Commit changes
Kill port 3000
```

---

## 📁 File System Control

Direct local execution:

- Read files
- Write files
- Create folders
- Rename files
- Move files
- Delete safely
- Search codebase
- Bulk file generation

---

## 🧑‍💻 Developer Workflow Agent

IRIS-Zero acts like an offline terminal copilot.

Capabilities:

- Scaffold projects
- Generate components
- Fix build errors
- Explain terminal output
- Write config files
- Search project structure
- Generate boilerplate
- Debug quickly

---

## 🔊 Local Voice Output

Powered by Kokoro TTS.

- Fast local voice synthesis
- No cloud latency
- Real-time spoken responses
- Natural system feedback

Examples:

> “Project created successfully.”
> “Port 3000 is already in use.”
> “Build completed.”

---

## 🔐 Fully Private

Everything stays on-device.

- No cloud inference
- No telemetry
- No API keys
- No tracking
- No subscriptions
- No usage limits

Your files remain yours.

Your voice remains local.

Your system remains private.

---

# 🏗️ Architecture

## Terminal Layer

Node.js CLI runtime

Handles:

- command parsing
- terminal execution
- streaming output
- workflow routing

---

## Local AI Layer

Ollama

Handles:

- reasoning
- coding assistance
- structured execution
- command generation

---

## Speech Layer

Whisper

Handles:

- speech-to-text
- wake commands
- live voice input

---

## Voice Output Layer

Kokoro.js

Handles:

- local text-to-speech
- streamed responses

---

## Execution Layer

Native OS terminal + filesystem

Handles:

- shell commands
- local process control
- file access

---

# 💻 Tech Stack

### Core

- Node.js
- TypeScript

### AI

- Ollama

### Speech

- Whisper

### Voice

- Kokoro.js

### CLI

- Commander.js / custom parser

### Terminal

- native shell execution

---

# 🔐 Privacy & Security

IRIS-Zero is fully local-first.

✔ No API calls
✔ No cloud servers
✔ No telemetry
✔ No analytics
✔ No hidden uploads
✔ Works offline

Designed for full privacy.

---

# 🚀 Installation

## Clone

```bash
git clone https://github.com/201Harsh/IRIS-Zero.git
cd IRIS-Zero
```

## Install

```bash
npm install
```

## Start Ollama

```bash
ollama serve
```

## Pull a model

```bash
ollama pull llama3
```

## Run IRIS-Zero

```bash
npm run dev
```

or

```bash
iris-zero
```

---

# 🎙️ Example Commands

```bash
Create a new Node.js project
Open VS Code here
Run npm install
Find build errors
Explain this terminal output
Generate an Express server
Kill port 3000
Commit all changes
```

Voice:

> “IRIS create a React app”
> “IRIS explain this error”
> “IRIS run tests”

---

# 📁 Project Structure

```bash
iris-zero/
├── src/
│   ├── cli/
│   ├── ai/
│   ├── whisper/
│   ├── tts/
│   ├── commands/
│   ├── utils/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

# 🧠 Philosophy

Execution > conversation

Privacy > telemetry

Local > cloud

Speed > complexity

Real workflows > demos

Build tools that execute.

---

# 🛣️ Roadmap

- [ ] Wake word mode
- [ ] Multi-command chains
- [ ] Project memory
- [ ] Local embeddings
- [ ] Plugin system
- [ ] Windows/Linux support
- [ ] Interactive terminal widgets
- [ ] Agentic code refactoring

---

# 🤝 Contributing

IRIS-Zero is open-source.

Want to help?

- Fork repo
- Build features
- Fix bugs
- Improve workflows
- Submit PRs

---

# 👨‍💻 Author

**Harsh Pandey**

AI Systems Engineer

GitHub: @201Harsh

Built with ❤️

---

# 📜 License

MIT License

---

# 🟥 Final Note

**IRIS-Zero is not a chatbot.**

It is your private local neural terminal.

No cloud.

No telemetry.

No limits.

**System Online ⚡**
