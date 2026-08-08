# ⚡ PackMate – AI-Powered Smart Travel & Packing Assistant

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://packmatefrontend.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-Express-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-AI%20LLM-F05032?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20DB-purple?style=for-the-badge)](https://www.trychroma.com/)

**PackMate** is an enterprise-grade, full-stack, AI-powered travel management platform. Built as an intelligent, automated travel companion, PackMate provides weather-conscious packing list generation, **Vision AI suitcase verification**, **RAG-based travel advisory chat** powered by ChromaDB vector search & airline PDF guides, end-to-end trip journaling, photo storage, and streaming `.docx` export capabilities.

---

## 🌐 Live Demos

| Service | Host Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Application** | Vercel | [https://packmatefrontend.vercel.app/](https://packmatefrontend.vercel.app/) |
| **Express Backend API** | Render | [https://packmate-backend.onrender.com/](https://packmate-backend.onrender.com/) |
| **GenAI FastAPI Microservice** | Render | [https://packmate69.onrender.com/](https://packmate69.onrender.com/) |

---

## ✨ Key Features

- 🤖 **Context-Aware AI Packing Assistant:** Generates personalized, weather-conscious packing lists tailored to duration, destination, activities, party size, and luggage limits using Groq LLM (Llama 3).
- 👁️ **Vision AI Suitcase Scanner:** One-click image analysis of packed or unpacked suitcases using Vision LLM to automatically reconcile items against your packing list.
- 💬 **RAG Travel Advisor Chatbot:** Knowledge-base retrieval engine powered by ChromaDB vector search and local travel guide PDFs, delivering precise, hallucination-free travel advice.
- 🌦️ **Real-Time Live Weather Forecasts:** Integrates OpenCage Geocoding API to compute destination weather conditions and dynamically adjust clothing & essential suggestions.
- 🗺️ **Comprehensive Trip CRUD & Journaling:** Manage trips, itineraries, custom packing checkboxes, traveler lists, and personal travel notes.
- 📸 **Cloud Photo Storage:** Upload and manage trip photo memories seamlessly integrated with Cloudinary CDN.
- 📄 **Streaming DOCX Export:** Download interactive packing lists instantly formatted as Microsoft Word (`.docx`) files.
- 🔒 **Enterprise-Grade Security:** JWT-based user authentication featuring access/refresh token rotation, bcrypt password hashing, rate limiting, and input validation.

---

## 🧠 System Architecture & Design

PackMate uses a decoupled microservices architecture designed for high throughput, security, and real-time AI diagnostic capabilities.

<div align="center">

![PackMate System Architecture](assets/System_Design.png?raw=true)

*Comprehensive System Design Architecture Diagram illustrating React Frontend SPA, Node.js API Gateway, Python GenAI Microservice, Groq LLM Cloud Engine, ChromaDB Vector DB, and MongoDB Atlas.*

</div>

---

## 📂 Repository Structure

```
PackMate_deployed/
├── assets/                     # Application screenshots & architecture diagrams
│   ├── System_Design.png
│   ├── LandingPage.png
│   ├── Login.png
│   ├── HowItWorks.png
│   ├── Generating_PackingList.png
│   ├── AccountPage.png
│   └── Contact.png
├── backend/                    # Node.js + Express REST API Server
│   ├── config/                 # DB, Cloudinary & environment configuration
│   ├── controllers/            # Auth, Trip & AI route controllers
│   ├── middlewares/            # JWT auth, rate limiting, validation (authMiddleware.js, rateLimiterMiddleware.js, errorHandlerMiddleware.js)
│   ├── models/                 # Mongoose schemas (userModel.js, tripModel.js)
│   ├── routes/                 # Express API endpoints (authRoute.js, tripRoute.js, aiRoute.js)
│   ├── services/               # GenAI proxy integration service
│   ├── app.js                  # Express app initialization
│   ├── server.js               # Server entry point
│   └── package.json
├── frontend/                   # React.js Single Page Application
│   ├── public/
│   ├── src/                    # Components, pages, context, and styles
│   ├── package.json
│   └── vercel.json
└── genai/                      # Python FastAPI GenAI Microservice
    ├── app/                    # FastAPI routes, schemas, RAG & LLM logic
    │   ├── knowledge_base/     # ChromaDB vector database & 12 travel PDF documents
    │   ├── routes/             # FastAPI routers (chat, packing, suitcase, weather)
    │   └── services/           # Groq LLM, RAG retriever, Vision analyzer
    ├── main.py                 # Uvicorn entry point
    ├── requirements.txt        # Python dependencies
    └── Dockerfile              # Container deployment file
```

---

## 🛠️ Tech Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, React Router v6, Axios, Custom CSS3 | Interactive UI & Travel Management Client |
| **Primary Backend** | Node.js, Express.js, Mongoose ODM, Winston | Core API Gateway, Auth, Trip CRUD Operations |
| **AI Microservice** | Python 3.10+, FastAPI, Uvicorn, Groq SDK | GenAI Packing Engine, Vision AI & RAG Advisor |
| **Vector DB** | ChromaDB, HuggingFace Sentence Transformers | Vector store for travel guide PDF embeddings |
| **Database** | MongoDB / MongoDB Atlas | Persistent storage for users, trips, & tokens |
| **Security** | JWT, bcryptjs, Express Rate Limit | Token Auth, Password Encryption, API Security |
| **Cloud Services** | Cloudinary, OpenCage API | Media Cloud Storage & Real-Time Weather Geocoding |
| **Hosting & DevOps** | Vercel, Render, Docker | Continuous Deployment & Microservice Hosting |

---

## ⚙️ Environment Configuration

Before running the application locally, set up the `.env` configuration files for each component service.

### 1. Backend Configuration (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/packmate
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
GENAI_SERVICE_URL=http://127.0.0.1:8000
GENAI_API_KEY=your_shared_inter_service_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Frontend Configuration (`frontend/.env`)
```env
REACT_APP_BACKEND_URL=http://localhost:5000/api
REACT_APP_GENAI_URL=http://localhost:8000
REACT_APP_GENAI_API_KEY=your_shared_inter_service_secret
```

### 3. AI Service Configuration (`genai/.env`)
```env
PORT=8000
GROQ_API_KEY=your_groq_api_key
OPENCAGE_API_KEY=your_opencage_api_key
API_KEY=your_shared_inter_service_secret
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.10 or higher
- **MongoDB**: MongoDB Atlas URI or Local instance running on port `27017`
- **Groq API Key**: Obtainable from [Groq Console](https://console.groq.com/)
- **OpenCage API Key**: Obtainable from [OpenCage Data](https://opencagedata.com/)

---

### Step-by-Step Setup

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Onkar-Satale/Packmate.git
cd Packmate
```

#### 2️⃣ Setup & Start Express Backend
```bash
cd backend
npm install
npm start
```
> *Backend server runs at:* `http://localhost:5000`

#### 3️⃣ Setup & Start FastAPI GenAI Microservice
Open a new terminal window:
```bash
cd genai

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell / CMD):
.\venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies and ingest RAG vectors
pip install -r requirements.txt
python -m app.knowledge_base.ingest

# Start GenAI FastAPI server
uvicorn main:app --reload --port 8000
```
> *GenAI service runs at:* `http://127.0.0.1:8000`

#### 4️⃣ Setup & Start React Frontend
Open a third terminal window:
```bash
cd frontend
npm install
npm start
```
> *Frontend web app runs at:* `http://localhost:3000`

---

## 📡 API Reference Overview

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | No | Register a new user account |
| `/api/auth/login` | `POST` | No | Authenticate user and issue JWT tokens |
| `/api/auth/refresh` | `POST` | No | Obtain new access token via refresh token |
| `/api/auth/logout` | `POST` | Yes | Revoke tokens and end session |
| `/api/trips` | `GET` | Yes | Fetch all trips for authenticated user |
| `/api/trips` | `POST` | Yes | Create a new trip itinerary & packing list |
| `/api/trips/:id` | `PUT` | Yes | Update trip details or packing checkmarks |
| `/api/trips/:id` | `DELETE` | Yes | Delete a trip itinerary |
| `/api/trips/:id/photos` | `POST` | Yes | Upload trip photos to Cloudinary CDN |
| `/api/ai/prefetch-weather` | `POST` | Yes | Fetch destination weather forecast via OpenCage |
| `/api/ai/generate-packing-list` | `POST` | Yes | Generate weather-aware AI packing list via Groq LLM |
| `/api/ai/download-packing-list` | `POST` | Yes | Export packing list to downloadable `.docx` file |
| `/api/ai/analyze-suitcase` | `POST` | Yes | Vision AI scan of suitcase photo to check packed items |
| `/travel-chat` | `POST` | Yes | RAG-based travel advisory chat with ChromaDB & PDFs |

---

## 📸 Screenshots & Visual Walkthrough

<div align="center">

### 📋 AI Packing List & Workflow
| Packing List Generation | How It Works Workflow |
| :---: | :---: |
| ![Generating Packing List](assets/Generating_PackingList.png?raw=true) | ![How It Works](assets/HowItWorks.png?raw=true) |
| *AI generates a structured, weather-conscious packing list based on trip details.* | *Step-by-step interactive workflow explaining the AI packing generation lifecycle.* |

### 🔑 Authentication & Security
| Login Interface | Account Profile |
| :---: | :---: |
| ![Login Page](assets/Login.png?raw=true) | ![Account Page](assets/AccountPage.png?raw=true) |
| *Secure user login with JWT and password hashing.* | *Manage user profile, active trips, and settings.* |

### 🏠 Landing Page & Contact Support
| Landing Page | Contact Us |
| :---: | :---: |
| ![Landing Page](assets/LandingPage.png?raw=true) | ![Contact Page](assets/Contact.png?raw=true) |
| *Main landing page with light/dark theme options.* | *User feedback and support communication channel.* |

</div>

---

## 🤝 Contributing

Contributions are greatly appreciated! To contribute:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author & Maintainer

- **Onkar Satale**
- **GitHub:** [@Onkar-Satale](https://github.com/Onkar-Satale)
- **Project Repo:** [Packmate Repository](https://github.com/Onkar-Satale/Packmate)
