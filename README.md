
# 📘 AURORA⁺ Emotion Therapy Chatbot

AURORA⁺ is a real-time emotional support chatbot designed to engage users with brief, empathetic conversations. It uses modern LLM infrastructure, sentiment-aware embedding verification, and personalized multimedia responses (GIFs, Spotify, Markdown, etc). Built for web, Jetson devices, and edge AI.

---

## 🚀 Features

- 🧠 **LLM-driven therapist** (e.g., `Groq` API or OpenRouter → LLaMA 3 / Mistral 7B)
- 🎵 Dynamic **Spotify track embedding** from chat context
- 😄 Emoji picker and GIF responses via **GIPHY**
- 💡 **BERT-based sentiment verification layer**
- 🔗 **LangChain** for modular prompt pipelines & memory
- ⚡ Optimized inference for **Jetson Nano/Orin** using quantized transformer models
- 🌗 Dark/light theme toggle + animated UI
- 🧩 Floating Cortana-style assistant UI (optional)

---

## 🛠 Tech Stack

| Area                     | Tool / API                              |
|--------------------------|------------------------------------------|
| Frontend UI              | React + Tailwind + Framer Motion         |
| LLM Inference            | [Groq API](https://groq.com) / OpenRouter |
| NLP Tokenization         | BERT Tokenizer via `transformers`        |
| Prompt Engineering       | LangChain + Custom Routing Layers        |
| Embedding Verification   | `bert-base-uncased` (HuggingFace)        |
| GIFs & Emojis            | Giphy API + EmojiPicker                  |
| Music Recommendations    | Spotify Web API                          |
| Edge Deployment          | Jetson Nano / Orin + ONNX Runtime        |

---

## 🧠 Architecture Overview

```
USER INPUT
   ↓
 [LangChain Router]
   ↳ Verify Emotion → BERT Tokenizer + Sentiment Model
   ↳ Enhance Prompt → Memory + Intent-aware Chains
   ↳ Select LLM → Groq / Mistral / LLaMA
   ↓
LLM RESPONSE
   ↳ Parse Markdown, Embed Spotify, Detect Image Markdown
   ↳ Search GIF via alt-text
   ↓
REACT FRONTEND
   ↳ Animate Bubble + Response
   ↳ Display Floating Chat UI
```

---

## ⚙️ Model & Pipeline

| Component              | Description |
|------------------------|-------------|
| `bert-base-uncased`    | Verifies emotional tone of user messages (negative, positive, neutral) using HuggingFace pipelines (`transformers`) |
| `Groq` + `LangChain`   | Hosts LLMs like LLaMA-3 and Mistral via super-low-latency inference with context-aware chains |
| `LangChain PromptNode` | Custom chain built with `chatWithOpenRouter()` wrapper + Spotify/Giphy hooks |

---

## 🖥 Jetson Optimization

> The project optionally runs on **Jetson Nano/Orin** using quantized ONNX versions of BERT & distilled transformer models.

Optimizations include:
- `onnxruntime-gpu` for CUDA
- Sentence embeddings via `MiniLM-L6`
- Model quantization to `int8` for edge performance

---

## 📦 Installation

```bash
git clone https://github.com/yourusername/aurora-chat.git
cd aurora-chat
pnpm install
pnpm dev
```

Or run backend BERT/Groq in `api/`:

```bash
cd api/
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🔐 Environment Variables

```env
GROQ_API_KEY=sk-...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
GIPHY_API_KEY=...
```

---

## 🎯 Future Ideas

- 🔊 Speech-to-Text via WebRTC or Whisper
- 🧠 Memory threads & avatar stateful logic
- 📲 PWA (Progressive Web App) support
- 🌐 Voice-based chat via Jetson edge microphones

---

## 📚 Jargon Explained

| Term           | Meaning |
|----------------|--------|
| **LangChain**  | A framework to build modular and prompt-based LLM pipelines |
| **BERT Tokenizer** | Tokenizes input into word pieces for sentiment analysis |
| **Groq**       | High-speed inference engine for LLMs like LLaMA 3, Mistral |
| **Jetson AI**  | NVIDIA’s edge computing devices for real-time inference |
| **Emotion Router** | A logic layer that adjusts LLM prompts based on emotion classification |

---

## 💙 AURORA⁺: AI that Listens.

Feel free to fork and extend!  
DM @yourhandle for collabs or deployment help on Jetson boards.
