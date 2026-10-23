# App quản lý kho (HTML + CSS + SQL Server)

Chức năng: thêm / sửa / xóa sản phẩm, nhập kho, xuất kho (không cho xuất quá số tồn), xem lịch sử, tìm kiếm. Số tồn ≤ 10 hiện chữ đỏ.

## Cấu trúc

```
quanlykho/
├── schema.sql        <- tạo database + bảng trong SQL Server
├── server.js         <- lớp trung gian (Node.js) nối web với SQL Server
├── package.json
└── public/
    ├── index.html    <- giao diện (HTML)
    ├── style.css     <- màu sắc, bố cục (CSS)
    └── app.js        <- xử lý nút bấm, gọi server
```

Trang web (HTML/CSS/JS) không nói chuyện trực tiếp với SQL Server được, nên cần `server.js` ở giữa:

`Trình duyệt  →  server.js  →  SQL Server`

## Cách chạy

1. Cài **Node.js** (https://nodejs.org, bản LTS) và **SQL Server** + SSMS.
2. Mở `schema.sql` trong SSMS, bấm **Execute** để tạo database `QuanLyKho`.
3. Copy `.env.example` thành `.env`, điền `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `SESSION_SECRET` cho đúng máy của bạn.
   - Nếu dùng SQL Server Express thì `server: 'localhost\\SQLEXPRESS'`.
   - Cần bật đăng nhập SQL Server Authentication và bật TCP/IP trong SQL Server Configuration Manager.
4. Mở terminal trong thư mục `quanlykho`, chạy:
   ```
   npm install
   npm start
   ```
5. Mở trình duyệt: http://localhost:3000

## Muốn sửa gì thì sửa ở đâu

| Muốn sửa | File |
|---|---|
| Giao diện, thêm ô nhập, thêm cột bảng | `public/index.html` + `public/app.js` |
| Màu sắc, kích thước | `public/style.css` |
| Thêm cột trong database (ví dụ Giá) | `schema.sql` (hoặc `ALTER TABLE` trong SSMS) + `server.js` + `app.js` |
| Thêm chức năng mới | thêm API trong `server.js`, gọi nó từ `app.js` |

Ví dụ thêm cột **Giá**:
1. SSMS: `ALTER TABLE SanPham ADD Gia DECIMAL(18,0) NULL;`
2. `server.js`: thêm `Gia` vào câu INSERT/UPDATE.
3. `index.html`: thêm `<input id="gia">` và cột `<th>Giá</th>`.
4. `app.js`: gửi và hiển thị `Gia`.

## Đưa lên GitHub

```
git init
git add .
git commit -m "App quan ly kho"
git branch -M main
git remote add origin https://github.com/TEN_BAN/quanlykho.git
git push -u origin main
```

**Lưu ý:** mật khẩu nằm trong file `.env` và đã được `.gitignore` chặn, nên không bị đưa lên GitHub. GitHub chỉ lưu code, không chạy được Node.js + SQL Server, nên cô giáo sẽ cần clone về máy và chạy theo các bước trên.
