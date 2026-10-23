// server.js - lớp trung gian giữa trang web (HTML) và SQL Server
require('dotenv').config(); // đọc file .env
const express = require('express');
const sql = require('mssql');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

// ====== THÔNG TIN KẾT NỐI LẤY TỪ FILE .env (không đưa lên GitHub) ======
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',   // hoặc localhost\\SQLEXPRESS
  database: process.env.DB_NAME || 'QuanLyKho',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
// =====================================================================
const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'chi-dung-de-test',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 } // đăng nhập giữ 8 giờ
}));

// Trang chủ chỉ cho người đã đăng nhập
app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => { console.log('Da ket noi SQL Server'); return pool; })
  .catch(err => { console.error('Loi ket noi SQL Server:', err.message); });


// ====== ĐĂNG KÝ / ĐĂNG NHẬP ======
app.post('/api/dangky', async (req, res) => {
  try {
    const tenDN = (req.body.tenDangNhap || '').trim();
    const mk = req.body.matKhau || '';
    const hoTen = (req.body.hoTen || '').trim();
    if (tenDN.length < 3) return res.status(400).json({ loi: 'Ten dang nhap it nhat 3 ky tu' });
    if (mk.length < 6) return res.status(400).json({ loi: 'Mat khau it nhat 6 ky tu' });

    const pool = await poolPromise;
    const tonTai = await pool.request().input('u', sql.NVarChar, tenDN)
      .query('SELECT 1 FROM NguoiDung WHERE TenDangNhap=@u');
    if (tonTai.recordset.length) return res.status(400).json({ loi: 'Ten dang nhap da ton tai' });

    const bam = await bcrypt.hash(mk, 10); // mã hóa mật khẩu, không lưu mật khẩu gốc
    await pool.request()
      .input('u', sql.NVarChar, tenDN)
      .input('h', sql.NVarChar, bam)
      .input('t', sql.NVarChar, hoTen || tenDN)
      .query('INSERT INTO NguoiDung (TenDangNhap, MatKhauHash, HoTen) VALUES (@u, @h, @t)');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ loi: e.message }); }
});

app.post('/api/dangnhap', async (req, res) => {
  try {
    const tenDN = (req.body.tenDangNhap || '').trim();
    const mk = req.body.matKhau || '';
    const pool = await poolPromise;
    const kq = await pool.request().input('u', sql.NVarChar, tenDN)
      .query('SELECT MaND, HoTen, MatKhauHash FROM NguoiDung WHERE TenDangNhap=@u');
    const nd = kq.recordset[0];
    if (!nd || !(await bcrypt.compare(mk, nd.MatKhauHash)))
      return res.status(401).json({ loi: 'Sai ten dang nhap hoac mat khau' });
    req.session.user = { id: nd.MaND, hoTen: nd.HoTen };
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ loi: e.message }); }
});

app.post('/api/dangxuat', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/toi', (req, res) => {
  if (!req.session.user) return res.status(401).json({ loi: 'Chua dang nhap' });
  res.json(req.session.user);
});

// Từ đây trở xuống, mọi API đều bắt buộc đăng nhập
app.use('/api', (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ loi: 'Chua dang nhap' });
  next();
});
// ====================================

// Lấy danh sách sản phẩm
app.get('/api/sanpham', async (req, res) => {
  try {
    const pool = await poolPromise;
    const kq = await pool.request().query('SELECT * FROM SanPham ORDER BY MaSP DESC');
    res.json(kq.recordset);
  } catch (e) { res.status(500).json({ loi: e.message }); }
});

// Thêm sản phẩm
app.post('/api/sanpham', async (req, res) => {
  try {
    const { tenSP, donVi, viTri, soLuong } = req.body;
    if (!tenSP) return res.status(400).json({ loi: 'Thieu ten san pham' });
    const pool = await poolPromise;
    await pool.request()
      .input('ten', sql.NVarChar, tenSP)
      .input('dv', sql.NVarChar, donVi || null)
      .input('vt', sql.NVarChar, viTri || null)
      .input('sl', sql.Int, parseInt(soLuong) || 0)
      .query('INSERT INTO SanPham (TenSP, DonVi, ViTri, SoLuongTon) VALUES (@ten, @dv, @vt, @sl)');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ loi: e.message }); }
});

// Sửa sản phẩm
app.put('/api/sanpham/:id', async (req, res) => {
  try {
    const { tenSP, donVi, viTri } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('ten', sql.NVarChar, tenSP)
      .input('dv', sql.NVarChar, donVi || null)
      .input('vt', sql.NVarChar, viTri || null)
      .query('UPDATE SanPham SET TenSP=@ten, DonVi=@dv, ViTri=@vt WHERE MaSP=@id');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ loi: e.message }); }
});

// Xóa sản phẩm (xóa luôn lịch sử giao dịch của nó)
app.delete('/api/sanpham/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM GiaoDich WHERE MaSP=@id; DELETE FROM SanPham WHERE MaSP=@id');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ loi: e.message }); }
});

// Nhập / xuất kho
app.post('/api/giaodich', async (req, res) => {
  try {
    const { maSP, loai, soLuong, ghiChu } = req.body;
    const sl = parseInt(soLuong);
    if (!maSP || !['NHAP', 'XUAT'].includes(loai) || !(sl > 0))
      return res.status(400).json({ loi: 'Du lieu khong hop le' });

    const pool = await poolPromise;
    const ton = await pool.request().input('id', sql.Int, maSP)
      .query('SELECT SoLuongTon FROM SanPham WHERE MaSP=@id');
    if (!ton.recordset.length) return res.status(404).json({ loi: 'Khong tim thay san pham' });
    if (loai === 'XUAT' && ton.recordset[0].SoLuongTon < sl)
      return res.status(400).json({ loi: 'Khong du hang trong kho' });

    const dau = loai === 'NHAP' ? '+' : '-';
    await pool.request()
      .input('id', sql.Int, maSP)
      .input('loai', sql.NVarChar, loai)
      .input('sl', sql.Int, sl)
      .input('gc', sql.NVarChar, ghiChu || null)
      .query(`INSERT INTO GiaoDich (MaSP, Loai, SoLuong, GhiChu) VALUES (@id, @loai, @sl, @gc);
              UPDATE SanPham SET SoLuongTon = SoLuongTon ${dau} @sl WHERE MaSP=@id`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ loi: e.message }); }
});

// Lịch sử giao dịch
app.get('/api/giaodich', async (req, res) => {
  try {
    const pool = await poolPromise;
    const kq = await pool.request().query(
      `SELECT TOP 50 g.MaGD, s.TenSP, g.Loai, g.SoLuong, g.GhiChu, g.Ngay
       FROM GiaoDich g JOIN SanPham s ON s.MaSP = g.MaSP
       ORDER BY g.Ngay DESC`);
    res.json(kq.recordset);
  } catch (e) { res.status(500).json({ loi: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Mo trinh duyet: http://localhost:' + PORT));
