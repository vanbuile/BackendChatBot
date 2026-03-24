# Setup Unsigned Upload Preset

## Bước 1: Tạo Upload Preset

1. Vào https://console.cloudinary.com/console
2. Settings → Upload
3. Tìm **Upload Presets** (hoặc scroll down)
4. Click **Add upload preset**
5. Cấu hình:
   - **Name**: `chatbot_uploads`
   - **Signing Mode**: `Unsigned` ✅
   - **Folder**: `chatbot/`
   - Scroll xuống, click **Save**

## Bước 2: Copy preset name

Tên preset sẽ là `chatbot_uploads` (hoặc cái bạn đặt)

## Bước 3: Update .env

```env
CLOUDINARY_UPLOAD_PRESET=chatbot_uploads
```

## Bước 4: Code sẽ tự dùng unsigned upload

Không cần API secret cho unsigned uploads!

---

**Ưu điểm của Unsigned Uploads:**

- ✅ Không cần API secret
- ✅ Nhanh hơn (no auth overhead)
- ✅ Đáng tin cậy hơn
- ✅ Phù hợp cho client-side uploads

**Nhược điểm:**

- ⚠️ Ai cũng có thể upload files (dùng preset name)
- Fix: Có thể limit file types, size trong preset settings
