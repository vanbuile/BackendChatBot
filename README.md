# Backend Chatbot Setup

Backend Node.js + Express cho chatbot, tích hợp Gemini API, lưu lịch sử chat vào MongoDB, hỗ trợ upload file lên Cloudinary khi gửi tin nhắn kèm tệp.

- Frontend repo: https://github.com/vanbuile/FrontendChatBot.git
- Production: https://frontend-chat-bot-phi.vercel.app/

## 1. Yêu cầu trước khi chạy

- Node.js 18+ (khuyến nghị dùng bản LTS mới)
- MongoDB local hoặc MongoDB Atlas
- Gemini API key
- Cloudinary account (chỉ bắt buộc khi gửi file)

## 2. Cài đặt project

```bash
npm install
```

## 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example` rồi cập nhật giá trị thực tế.

### Mẫu cấu hình tối thiểu

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority&appName=<app-name>

# Gemini
GEMINI_API_KEY=<your_gemini_api_key>
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_BACKUP_MODELS=gemini-3.1-flash-lite,gemini-2.5-flash-lite

# Cloudinary (bắt buộc nếu upload file)
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
```

### Lấy Gemini API key

1. Vào https://aistudio.google.com/
2. Tạo API key
3. Gán vào `GEMINI_API_KEY`

### Cấu hình MongoDB

- Local: `mongodb://localhost:27017/chatbot_db`
- Atlas: dùng connection string từ dashboard Atlas

## 4. Chạy backend

### Development (hot reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

Mặc định server chạy tại `http://localhost:5000`.

Khi chạy thành công, terminal thường có log tương tự:

```text
✓ MongoDB connected successfully
✓ Gemini AI initialized with model: ...
✓ Server running on http://localhost:5000
```

## 5. API chính

### 5.1 Kiểm tra trạng thái

- `GET /`
- `GET /api/health`

### 5.2 Gửi tin nhắn

- `POST /api/messages`
- Hỗ trợ:

1. Text only
2. Text + file
3. Chỉ file (không có text)

Lưu ý:

1. Dữ liệu lưu theo `sessionId = "default"` (hard-coded ở backend hiện tại)
2. Field text đang dùng là `content` (không phải `userMessage`)

#### Gửi text (JSON)

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Xin chao backend\"}"
```

#### Gửi kèm file (multipart/form-data)

```bash
curl -X POST http://localhost:5000/api/messages \
  -F "content=Hay tom tat file nay" \
  -F "file=@C:/path/to/your-file.pdf"
```

### 5.3 Lấy lịch sử chat

- `GET /api/messages?limit=50&skip=0`

Ví dụ:

```bash
curl "http://localhost:5000/api/messages?limit=20&skip=0"
```

## 6. Giới hạn upload hiện tại

- Tối đa `5` file/request
- Tối đa `10MB`/file
- Hỗ trợ:

1. `image/*`
2. `audio/*`
3. `video/*`
4. `application/pdf`
5. `text/plain`
6. `text/markdown`
7. `text/csv`
8. `application/json`
9. `application/xml`
10. `text/xml`
11. `text/yaml`
12. `application/x-yaml`

## 7. Troubleshooting nhanh

### Không kết nối được MongoDB

- Kiểm tra `MONGODB_URI`
- Nếu local, đảm bảo MongoDB đang chạy

### Lỗi Gemini

- Kiểm tra `GEMINI_API_KEY`
- Kiểm tra quota/rate limit của key

### Lỗi upload file lên Cloudinary

- Kiểm tra `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Đảm bảo file đúng định dạng được hỗ trợ

### Cổng 5000 đã bị chiếm

Đổi `PORT` trong `.env`, ví dụ:

```env
PORT=3000
```
