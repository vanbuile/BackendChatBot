# Cloudinary Setup Guide

## Cài đặt lưu trữ file trên Cloudinary CDN

Thay vì lưu file local trong `/uploads`, backend giờ upload tất cả file lên Cloudinary CDN.

### Bước 1: Tạo tài khoản Cloudinary

1. Truy cập https://cloudinary.com/
2. Đăng ký tài khoản (free tier hỗ trợ tốt)
3. Xác nhận email

### Bước 2: Lấy API Credentials

1. Vào Dashboard: https://console.cloudinary.com/console
2. Tìm phần **API Keys** (hoặc **Settings**)
3. Copy 3 thông tin:
   - **Cloud Name** (e.g., `du123456`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcDEF123ghi...`)

⚠️ **QUAN TRỌNG**: Không share API Secret công khai!

### Bước 3: Cập nhật .env

```bash
# .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Bước 4: Test kết nối

```bash
# Start backend
npm run dev

# Gửi POST request với file
curl -X POST http://localhost:5000/api/messages \
  -F "content=Hello with file" \
  -F "files=@path/to/file.jpg"
```

### Response Example

```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "123...",
      "content": "Assistant response...",
      "role": "assistant",
      "timestamp": "2026-03-24T10:30:00Z",
      "attachments": []
    }
  }
}
```

Và user message sẽ có:

```json
{
  "name": "file.jpg",
  "url": "https://res.cloudinary.com/your_cloud_name/image/upload/...",
  "mimeType": "image/jpeg",
  "size": 1024,
  "cloudinaryPublicId": "chatbot/1711270200000-file"
}
```

### Features

✅ **Tự động upload** - Files tự động upload lên Cloudinary khi POST  
✅ **CDN URLs** - Ảnh & file phục vụ qua CDN nhánh (fast delivery)  
✅ **Secure URLs** - HTTPS link, không cần local `/uploads` folder  
✅ **Tracking** - `cloudinaryPublicId` để xóa file sau nếu cần  
✅ **All file types** - Images, audio, video, PDF, JSON, CSV, v.v.

### Làm sạch local uploads (optional)

```bash
# Xóa folder /uploads nếu không dùng nữa
rm -rf uploads/
```

### Xóa file từ Cloudinary (Advanced)

Nếu muốn xóa file khỏi Cloudinary:

```javascript
const cloudinary = require("cloudinary").v2;

await cloudinary.uploader.destroy(publicId, {
  resource_type: "auto",
});
```

---

**Lợi ích của Cloudinary:**

- Không chiếm dung lượng server
- CDN tự động tối ưu từng loại file
- Có thể xóa file remote dễ dàng
- Free tier: 25GB/năm
- Có dashboard để quản lý files

---

Nếu cần help, xem: https://cloudinary.com/documentation/node_integration
