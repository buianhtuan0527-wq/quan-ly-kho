// app.js - xử lý trang web, gọi API của server.js

let danhSach = [];

async function goiApi(url, method = 'GET', data) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  });
  if (res.status === 401) { location.href = '/login.html'; throw new Error('Chua dang nhap'); }
  const kq = await res.json();
  if (!res.ok) throw new Error(kq.loi || 'Co loi xay ra');
  return kq;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function taiSanPham() {
  danhSach = await goiApi('/api/sanpham');
  veDanhSach();
}

function veDanhSach() {
  const tu = document.getElementById('tim').value.toLowerCase();
  const tbody = document.getElementById('ds-sanpham');
  tbody.innerHTML = '';
  danhSach
    .filter(sp => sp.TenSP.toLowerCase().includes(tu))
    .forEach(sp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${sp.MaSP}</td>
        <td>${escapeHtml(sp.TenSP)}</td>
        <td>${escapeHtml(sp.DonVi)}</td>
        <td>${escapeHtml(sp.ViTri)}</td>
        <td class="${sp.SoLuongTon <= 10 ? 'sap-het' : ''}">${sp.SoLuongTon}</td>
        <td class="thaotac">
          <button class="nhap" onclick="giaoDich(${sp.MaSP}, 'NHAP')">Nhập</button>
          <button class="xuat" onclick="giaoDich(${sp.MaSP}, 'XUAT')">Xuất</button>
          <button onclick="sua(${sp.MaSP})">Sửa</button>
          <button class="xoa" onclick="xoa(${sp.MaSP})">Xóa</button>
        </td>`;
      tbody.appendChild(tr);
    });
}

async function taiGiaoDich() {
  const ds = await goiApi('/api/giaodich');
  const tbody = document.getElementById('ds-giaodich');
  tbody.innerHTML = '';
  ds.forEach(g => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(g.Ngay).toLocaleString('vi-VN')}</td>
      <td>${escapeHtml(g.TenSP)}</td>
      <td class="${g.Loai}">${g.Loai === 'NHAP' ? 'Nhập' : 'Xuất'}</td>
      <td>${g.SoLuong}</td>
      <td>${escapeHtml(g.GhiChu)}</td>`;
    tbody.appendChild(tr);
  });
}

async function taiLai() {
  try { await taiSanPham(); await taiGiaoDich(); }
  catch (e) { alert('Loi: ' + e.message); }
}

// Thêm sản phẩm
document.getElementById('form-them').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await goiApi('/api/sanpham', 'POST', {
      tenSP: document.getElementById('ten').value.trim(),
      donVi: document.getElementById('donvi').value.trim(),
      viTri: document.getElementById('vitri').value.trim(),
      soLuong: document.getElementById('soluong').value
    });
    e.target.reset();
    document.getElementById('soluong').value = 0;
    taiLai();
  } catch (err) { alert('Loi: ' + err.message); }
});

// Nhập / xuất kho
async function giaoDich(maSP, loai) {
  const sl = prompt(loai === 'NHAP' ? 'Nhập thêm bao nhiêu?' : 'Xuất bao nhiêu?');
  if (!sl) return;
  const ghiChu = prompt('Ghi chú (có thể để trống):') || '';
  try {
    await goiApi('/api/giaodich', 'POST', { maSP, loai, soLuong: sl, ghiChu });
    taiLai();
  } catch (err) { alert('Loi: ' + err.message); }
}

// Sửa sản phẩm
async function sua(id) {
  const sp = danhSach.find(x => x.MaSP === id);
  const ten = prompt('Tên sản phẩm:', sp.TenSP);
  if (!ten) return;
  const donVi = prompt('Đơn vị:', sp.DonVi || '');
  const viTri = prompt('Vị trí:', sp.ViTri || '');
  try {
    await goiApi('/api/sanpham/' + id, 'PUT', { tenSP: ten, donVi, viTri });
    taiLai();
  } catch (err) { alert('Loi: ' + err.message); }
}

// Xóa sản phẩm
async function xoa(id) {
  if (!confirm('Xóa sản phẩm này và toàn bộ lịch sử của nó?')) return;
  try { await goiApi('/api/sanpham/' + id, 'DELETE'); taiLai(); }
  catch (err) { alert('Loi: ' + err.message); }
}

document.getElementById('tim').addEventListener('input', veDanhSach);
taiLai();

// Hiện tên người dùng và nút đăng xuất
goiApi('/api/toi').then(u => {
  document.getElementById('ten-nguoi-dung').textContent = '👤 ' + u.hoTen;
}).catch(() => {});

document.getElementById('btn-dangxuat').addEventListener('click', async () => {
  await fetch('/api/dangxuat', { method: 'POST' });
  location.href = '/login.html';
});
