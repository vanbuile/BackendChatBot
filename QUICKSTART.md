## 🚀 Quick Start Guide

### Step 1: Get Your Gemini API Key

1. Visit: https://aistudio.google.com/
2. Click "Create API key in Google Cloud Console"
3. Copy your API key

### Step 2: Configure Environment

1. Open `.env` file in the Backend folder
2. Replace `your_gemini_api_key_here` with your actual API key:

```
GEMINI_API_KEY=sk-xxxxxxxxxxxxx
```

### Step 3: Setup MongoDB

**If you want to use local MongoDB:**

- Download from: https://www.mongodb.com/try/download/community
- Install and start the MongoDB service

**Or use MongoDB Atlas (Cloud - easiest):**

1. Visit: https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Copy connection string to `.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot_db
```

### Step 4: Start the Server

```bash
cd c:\Users\van\Workspace\chatbot_template\Backend
npm run dev
```

You should see:

```
✓ MongoDB connected successfully
✓ Gemini AI initialized
✓ Server running on http://localhost:5000
```

### Step 5: Test the API

**Using Postman or cURL:**

```bash
# Send a message
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Hello! What is AI?",
    "sessionId": "session_001"
  }'
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "sessionId": "session_001",
    "userMessage": "Hello! What is AI?",
    "botMessage": "Artificial Intelligence (AI) is...",
    "timestamp": "2024-03-23T..."
  }
}
```

### Step 6: Get Chat History

```bash
curl "http://localhost:5000/api/messages?sessionId=session_001&limit=10"
```

---

## 📋 API Summary

| Method | Endpoint                      | Description                 |
| ------ | ----------------------------- | --------------------------- |
| GET    | `/api/health`                 | Check server status         |
| POST   | `/api/messages`               | Send message & get response |
| GET    | `/api/messages?sessionId=xxx` | Get chat history            |

---

## 🔧 Troubleshooting

**MongoDB Connection Error:**

- Make sure MongoDB is running (check MongoDB service)
- Check `MONGODB_URI` in `.env`

**Gemini API Error:**

- Verify API key is correct and enabled
- Check you have free credits

**Port Already in Use:**

```bash
# Use different port
PORT=3000 npm run dev
```

---

## 📂 Project Files

```
Backend/
├── src/
│   ├── server.js           ← Main server file
│   ├── config/db.js        ← MongoDB connection
│   ├── models/Message.js   ← Message database schema
│   ├── routes/messageRoutes.js  ← API endpoints
│   └── services/geminiService.js ← Gemini integration
├── .env                    ← Configuration (update with your keys!)
├── package.json
└── README.md
```

---

Happy coding! 🎉
