# 🧠 VoxNava: A Voice-First Accessibility Companion

**VoxNava** is a voice-first AI companion designed to help people understand information, complete tasks, and access digital services with less friction.  
It supports plain-language conversation, multilingual assistance, contextual follow-up, and hands-free interaction.

---

## 🌿 Overview

VoxNava goes beyond traditional chatbots — it’s built as an **Agentic AI System**, a network of specialized AI agents working collaboratively to enhance accessibility, context-aware guidance, and real-world task completion.

---

## ✨ Key Features

### 🗣️ Voice Access  
A natural voice interface for asking questions, getting summaries, translating content, and moving through steps without typing.

### 🌍 Multilingual Support  
The assistant can rephrase content in simpler language or translate it into another language to support low-literacy and multilingual users.

### 🧭 Contextual Guidance  
The agent keeps short conversational context so users can continue a task without repeating themselves.

### ⚡ Workflow Assistance  
Users can ask the assistant to explain an instruction, summarize a message, or identify the next step in a process.

### 🔒 Safety and Support  
The app keeps a safety layer for high-risk situations and can redirect users to human help when needed.

---

## 🤖 Agentic AI System

### What Makes VoxNava Agentic
- 🧩 **Autonomous Decision-Making:** The assistant adapts responses based on the user’s task and context.  
- 🎯 **Goal-Oriented Behavior:** The system focuses on helping users understand, decide, and act.  
- 🧠 **Multi-Agent Collaboration:** Specialized flows handle voice input, speech output, safety, and contextual responses.  
- 💬 **Proactive Engagement:** The assistant suggests the next useful step instead of only answering questions.  
- 🕊️ **Contextual Memory:** Conversation history is used to preserve continuity within an interaction.  
- 🌱 **Adaptive Responses:** The assistant can simplify wording, reframe content, or switch language when needed.

---

## 🧩 Complete AI Agent Ecosystem

| **Agent** | **Purpose** | **Key Capabilities** |
|------------|-------------|----------------------|
| **Voice Agent** | Real-time voice conversations | Vapi orchestration, speech routing, task guidance |
| **2. Chat Agent** | Text-based support | Context-aware explanations, summaries, and next-step guidance |
| **3. Safety Agent** | Handle high-risk language | Emergency guidance and human escalation |
| **4. Context Agent** | Preserve short-term memory | Qdrant-backed memory and retrieval |

### Agent Collaboration  
- ⚙️ **Action Layer:** Coordinates communication among agents  
- 🔁 **Context Sharing:** Shared memory of user interactions  
- 💖 **Unified Personality:** All agents reflect the same empathetic “VoxNava” identity  
- 🚨 **Crisis Protocol:** Any agent can trigger professional helpline suggestions  

---

## 🧠 Voice Agent Architecture
User Speech Input
↓
Vapi Web Voice Orchestration
↓
Assistant Response + Transcript Events
↓
Qdrant Memory Retrieval
↓
Context-Aware Response Generation
↓
Audio Playback / Live Voice Session
↓
User Hears Response


### 🎧 Voice Agent Features  
- Real-time bidirectional voice conversation  
- Contextual awareness and memory  
- Conversation continuity across turns  
- Vapi-powered web voice orchestration  
- Qdrant-backed semantic retrieval  
- Voice-first accessibility for users preferring speech  

---

## 🧘‍♀️ Therapeutic Design Principles

- **Plain-language first:** Avoids jargon and keeps instructions short  
- **Task-oriented:** Helps users complete a step, not just chat  
- **Context-aware:** Remembers the last few turns to reduce repetition  
- **Accessible by design:** Supports voice, text, and multilingual interaction  
- **Safety-aware:** Escalates to human help when the user may be at risk

---

## 🛠️ Tech Stack

| **Layer** | **Technology** |
|------------|----------------|
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **UI Library** | React |
| **Styling** | Tailwind CSS |
| **Components** | ShadCN UI |
| **Generative AI** | Firebase Genkit + Google’s Gemini Models |
| **Conversational AI** | Gemini 2.5 Flash (text) |
| **Voice Synthesis** | Gemini 2.5 Flash Preview TTS |
| **Voice Orchestration** | Vapi Web SDK |
| **Semantic Memory** | Qdrant |
| **Speech Recognition** | Web Speech API (SpeechRecognition / webkitSpeechRecognition) |
| **Audio Handling** | WAV encoding & HTML5 Audio API |
| **Icons** | Lucide React |
| **State Management** | React Hooks + Context API |
| **Data Persistence** | Browser session memory + Qdrant retrieval |
| **Deployment** | Firebase App Hosting |

### Environment Variables
```env
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
GOOGLE_API_KEY=your_google_ai_api_key_here
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key_here
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id_here
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION=voxnava_memory
```

### Setup Notes
- Configure the Vapi assistant in the Vapi dashboard and point it at the same accessibility-focused behavior you want in the app.
- Create or allow the app to create the Qdrant collection used for semantic memory.
- If the Vapi variables are missing, the app falls back to the built-in Gemini voice flow.


