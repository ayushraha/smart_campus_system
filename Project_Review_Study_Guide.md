# Smart Campus System - Technical Architecture & Study Guide
**Confidential Internal Review Document**

This document outlines the core architecture, technical logic, and feature implementation details of the Smart Campus Recruitment Platform, designed for project review and presentation purposes.

---

## 1. System Overview

The platform is a fully integrated MERN stack (MongoDB, Express.js, React.js, Node.js) application tailored exclusively for campus recruitment processes. It bridges the gap between students looking for placement opportunities and recruiters streamlining their hiring pipeline.

### Core Technologies:
- **Frontend**: React.js, React Router, CSS Variables (for responsive styling and dark mode), Lucide-React (Icons), PeerJS/WebRTC (Video calls).
- **Backend**: Node.js, Express.js, MongoDB (Mongoose ORM), Socket.io (Real-time signaling).
- **APIs & AI**: Google Gemini AI (for mock interviews & resume parsing), Web Speech API (Speech-to-Text / Text-to-Speech).

---

## 2. Core Feature: Complete Student Profile System

### **Objective**
To provide a consolidated, dynamic, and professional dashboard where candidates can manage their technical skills, project portfolios, and personal details.

### **The Logic & Workflow**
1. **Data Model (`StudentProfile` Schema):**
   - The backend structures data heavily using nested schemas: `personalInfo`, `education`, `skills` (divided into technical, tools, soft skills, languages), `projects`, `certifications`, and `workExperience`.
   - On the frontend (`StudentProfileForm.js`), a `useEffect` hook triggers on mount. It hits the `/my-profile` backend route with a standard GET request using the JWT Bearer token to populate existing user data immediately.

2. **Sectioned Form Architecture:**
   - The UI avoids overwhelming the user with a massive scrolling interface by segmenting state. 
   - We utilize an `activeSection` state variable mapped to 9 logic sections. As users type, the `calculateProgress()` function dynamically computes a percentage representing how many fields are filled, updating a live SVG "Completion Ring".

3. **Dynamic Tagging:**
   - Instead of standard text boxes for technical skills, the application uses an event listener for `onKeyDown = 'Enter'`. 
   - When triggered, it pushes the sanitized string into an array state (`setProfile(prev => {...prev, technical: [...prev, val]})`), displaying them as interactive tags in the UI.

4. **View Profile Integration (`ViewProfile.js`):**
   - Displays a read-only, aesthetically premium version of the profile. 
   - A major component is the **QR Code System**. The application uses a dynamic QR code generator on the backend. This allows recruiters or professors to quickly scan a student's card and pull up their JSON profile data directly from the server.

---

## 3. Advanced Feature: The AI Mock Interview System

### **Objective**
A zero-latency, highly conversational AI recruiter capable of adapting its technical questioning to the specific resume and background of the student, simulating a grueling real-world technical screening.

### **The Logic & Workflow**
1. **Adaptive Context Engine:**
   - The AI doesn't just ask static questions. It hits the MongoDB database to extract the student's `jobTitle`, `skills`, and `experienceLevel` before the interview even starts.
   - We implement a "Deep Dive" prompt engineering strategy. The system instruction fed into the Gemini API explicitly tells the model to: *"Act as an assertive senior recruiter. Read this candidate's background. Drill into their specific projects."*

2. **Frontend Interaction Loop (`AIMockInterview.js`):**
   - **Speech-to-Text (STT):** We use `window.SpeechRecognition` (Web Speech API). When the user clicks the microphone, the browser literally transcribes their voice into a text payload.
   - **Backend Handshake:** The transcribed text is sent via an Axios POST request to `/api/mock-interview/evaluate`.
   - **AI Evaluation Logic:** The Node backend wraps the user's answer into a strict JSON schema prompt and queries Google Gemini. Gemini acts as an evaluator—it scores the answer, generates a dynamic follow-up question based *strictly* on what the user just said, and calculates sentiment logic.
   - **Text-to-Speech (TTS):** The backend returns the new question to the frontend. The React app immediately triggers `window.speechSynthesis.speak()`, literally giving the AI an audible voice to ask the next question, creating a seamless feedback loop.

3. **Bulletproof JSON Parsing Strategy:**
   - LLMs are prone to formatting errors (e.g., wrapping JSON in \`\`\`json markdown blocks). The `/evaluate` backend route utilizes a multi-pass regex extraction function to strip markdown tags and ensure a stable `JSON.parse()`. If parsing fails totally, the backend injects a "Synthetic Fallback Payload" so the server never crashes (500 Error) and the interview continues uninterrupted.

---

## 4. Advanced Feature: Real-Time Interview Room (Recruiter & Student)

### **Objective**
To replicate platforms like Zoom or Google Meet entirely inside the recruitment browser, letting companies directly video-call students while simultaneously reviewing their profile.

### **The Logic & Workflow**
This is the most complex component of the app, heavily replying on **WebRTC** (Web Real-Time Communication) and **Socket.io**.

1. **Hardware Access:**
   - The browser prompts `navigator.mediaDevices.getUserMedia()` to hijack the camera and microphone securely, storing the `MediaStream` object into a React `useRef`.

2. **The Signaling Server (Socket.io):**
   - WebRTC requires endpoints to "discover" each other. When a recruiter connects, the Node backend triggers `socket.join(roomId)`.
   - When the student enters, they enter the same room. The server broadcasts a `user-joined` event.

3. **Peer-to-Peer Connection (RTCPeerConnection):**
   - **The Offer:** The student's browser generates an SDP (Session Description Protocol) package—a map of what video codecs it supports—and sends it via the WebSocket.
   - **The Answer:** The recruiter receives the SDP, accepts it, and replies with their own SDP.
   - **ICE Candidates:** Both browsers negotiate firewall bypasses using Google STUN servers (`stun.l.google.com:19302`).

4. **Handling React Async Race Conditions (The "Black Screen" Fix):**
   - In React, UI states update asynchronously. Because WebRTC connections establish in milliseconds, the `pc.ontrack` (the exact moment the video stream arrives) was firing *before* the remote `<video>` HTML element existed on the recruiter's DOM. 
   - **The Fix:** The code traps the incoming WebRTC video stream securely inside `remoteStreamRef.current`. A `useEffect` hook safely binds this stream to the `<video srcObject>` exactly when the component confirms it has rendered, guaranteeing visual connection.

5. **Live Scoring Architecture:**
   - The recruiter has a UI to move sliders (Technical, Communication, Confidence). Every 30 seconds, a background `setInterval` pushes a silent `axios.put` update to the database.
   - Once the call ends, the backend generates an "AI Analysis PDF Report" based on those live scores (converting numeric metrics into deep-text insights).

---

## 5. Architectural Security & Performance

- **Authentication Logic:** Standard JWT (JSON Web Token) implementation. Tokens are stored locally, heavily validating user Roles (`checkRole('recruiter' | 'student')`) middleware on Express to ensure students cannot access recruiter HR dashboards.
- **Data Persistence Strategy:** For high-volume writes (like the interview evaluating 30 times a session), we aggregate the state (`responses`, `duration`, `sentiment`) locally in the React component's array, and execute a heavy bulk database write only upon clicking "End Interview", protecting the backend from HTTP overload.

---
**Prepared For: Project Technical Review**
*Author: Core Implementation Team*
