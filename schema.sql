-- Chạy file này trong SQL Server Management Studio (SSMS)
CREATE DATABASE QuanLyKho;
GO
USE QuanLyKho;
GO

CREATE TABLE SanPham (
    MaSP       INT IDENTITY(1,1) PRIMARY KEY,
    TenSP      NVARCHAR(200) NOT NULL,
    DonVi      NVARCHAR(50)  NULL,      -- cái, hộp, kg...
    ViTri      NVARCHAR(100) NULL,      -- Kệ A1, Kho chính...
    SoLuongTon INT NOT NULL DEFAULT 0,
    NgayTao    DATETIME NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE GiaoDich (
    MaGD     INT IDENTITY(1,1) PRIMARY KEY,
    MaSP     INT NOT NULL REFERENCES SanPham(MaSP),
    Loai     NVARCHAR(10) NOT NULL CHECK (Loai IN (N'NHAP', N'XUAT')),
    SoLuong  INT NOT NULL CHECK (SoLuong > 0),
    GhiChu   NVARCHAR(200) NULL,
    Ngay     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE NguoiDung (
    MaND         INT IDENTITY(1,1) PRIMARY KEY,
    TenDangNhap  NVARCHAR(50)  NOT NULL UNIQUE,
    MatKhauHash  NVARCHAR(100) NOT NULL,   -- mật khẩu đã mã hóa
    HoTen        NVARCHAR(100) NULL,
    NgayTao      DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Dữ liệu mẫu
INSERT INTO SanPham (TenSP, DonVi, ViTri, SoLuongTon) VALUES
(N'Điện trở 10k', N'cái', N'Kệ A1', 500),
(N'Vít M3', N'hộp', N'Kệ B2', 40);
GO

/* NẾU BẠN ĐÃ TẠO DATABASE TỪ BẢN CŨ: chỉ cần chạy đoạn dưới (bỏ dấu comment)
USE QuanLyKho;
GO
CREATE TABLE NguoiDung (
    MaND         INT IDENTITY(1,1) PRIMARY KEY,
    TenDangNhap  NVARCHAR(50)  NOT NULL UNIQUE,
    MatKhauHash  NVARCHAR(100) NOT NULL,
    HoTen        NVARCHAR(100) NULL,
    NgayTao      DATETIME NOT NULL DEFAULT GETDATE()
);
GO
*/
