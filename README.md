# Node.js Chatbot Backend

A Node.js backend server that acts as an intermediary between a chatbot frontend and Google Gemini API, with message history storage in MongoDB.

## Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud instance)
- Google Gemini API key

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with the following variables:

```
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chatbot_db

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

### Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Create API key"
3. Copy your API key and paste it in `.env` file

### Setup MongoDB

**Option 1: Local MongoDB**

```bash
# Install MongoDB locally and start the service
mongod
```

**Option 2: MongoDB Atlas (Cloud)**

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Get your connection string and update `MONGODB_URI` in `.env`

## Running the Server

### Development mode (with hot reload):

```bash
npm run dev
```

### Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### 1. Health Check

```
GET /api/health
```

Returns server and service status.

### 2. Send Message to Chatbot

```
POST /api/messages

Request body:
{
  "userMessage": "Hello, how are you?",
  "sessionId": "user_session_123"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "sessionId": "user_session_123",
    "userMessage": "Hello, how are you?",
    "botMessage": "I'm doing well, thank you for asking!",
    "timestamp": "2024-03-23T10:30:00.000Z"
  }
}
```

### 3. Get Chat History

```
GET /api/messages?sessionId=user_session_123&limit=50&skip=0

Query Parameters:
- sessionId (required): The session ID to fetch messages for
- limit (optional): Number of messages to fetch (default: 50)
- skip (optional): Number of messages to skip (default: 0)

Response:
{
  "success": true,
  "data": {
    "sessionId": "user_session_123",
    "total": 10,
    "count": 10,
    "limit": 50,
    "skip": 0,
    "messages": [
      {
        "_id": "...",
        "sessionId": "user_session_123",
        "userMessage": "Hello",
        "botMessage": "Hi there!",
        "timestamp": "2024-03-23T10:30:00.000Z"
      }
    ]
  }
}
```

## Project Structure

```
src/
├── server.js                 # Main server file
├── config/
│   └── db.js                # MongoDB connection
├── models/
│   └── Message.js           # Message schema
├── routes/
│   └── messageRoutes.js      # Message API routes
└── services/
    └── geminiService.js      # Gemini API integration
.env                          # Environment variables
.gitignore                    # Git ignore file
package.json                  # Project dependencies
README.md                      # This file
```

## Technologies Used

- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Google Generative AI** - Gemini API integration
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **axios** - HTTP client
- **nodemon** - Development tool

## Example Usage

### Frontend Integration (JavaScript)

```javascript
// Send message to chatbot
async function sendMessage() {
  const userMessage = "What is the weather like?";
  const sessionId = "user_123"; // Unique session ID for each user

  try {
    const response = await fetch("http://localhost:5000/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userMessage,
        sessionId,
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log("Bot response:", data.data.botMessage);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Get chat history
async function getChatHistory() {
  const sessionId = "user_123";

  try {
    const response = await fetch(
      `http://localhost:5000/api/messages?sessionId=${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    if (data.success) {
      console.log("Chat history:", data.data.messages);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
```

## Testing the APIs

### Using cURL

**Send a message:**

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Hello", "sessionId": "test_session_1"}'
```

**Get chat history:**

```bash
curl -X GET "http://localhost:5000/api/messages?sessionId=test_session_1"
```

### Using Postman

1. Create a new POST request to `http://localhost:5000/api/messages`
2. Set Headers: `Content-Type: application/json`
3. Set Body (raw JSON):

```json
{
  "userMessage": "Hello, how are you?",
  "sessionId": "test_session_1"
}
```

4. Send the request

## License

MIT
