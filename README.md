# Learn Vibe Coding - Backend API

Aplikasi ini adalah sebuah backend RESTful API modern yang dibangun menggunakan **Bun**, **ElysiaJS**, dan **Drizzle ORM**. Aplikasi ini dirancang untuk menangani sistem autentikasi pengguna dengan dukungan sesi tunggal (Single Active Session) serta manajemen rute yang modular.

---

## 🛠️ Technology Stack & Libraries

Berikut adalah teknologi dan *library* utama yang digunakan dalam pengembangan aplikasi ini:
- **Runtime**: [Bun](https://bun.sh/) - Runtime JavaScript yang sangat cepat.
- **Web Framework**: [ElysiaJS](https://elysiajs.com/) - Framework web yang ringan, cepat, dan *type-safe* untuk Bun.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - ORM TypeScript/JavaScript yang ringan dan *type-safe*.
- **Database**: MySQL (diakses melalui *driver* `mysql2`).
- **Bahasa**: TypeScript.
- **Testing**: Bun Test (framework pengujian bawaan dari Bun).

---

## 📂 Struktur Folder dan Arsitektur

Proyek ini menggunakan arsitektur berbasis *layer* (Route -> Service -> DB) untuk memisahkan logika bisnis dari pengaturan protokol HTTP.

```text
learn-vibe-coding/
├── src/
│   ├── index.ts              # Entry point utama aplikasi dan pendaftaran plugin/routes
│   ├── db/
│   │   ├── index.ts          # Konfigurasi koneksi MySQL
│   │   └── schema.ts         # Definisi skema tabel Drizzle ORM
│   ├── routes/
│   │   └── users-route.ts    # Definisi endpoints dan validasi input (Elysia t.Object)
│   └── service/
│       └── users-service.ts  # Logika bisnis (register, login, session management)
├── tests/                    # Berisi sekumpulan file unit test
│   ├── setup.ts              # Setup file untuk membersihkan database sebelum diuji
│   └── *.test.ts             # File pengujian spesifik per API
├── drizzle/                  # (Jika ada) Berisi file hasil generate migrasi database
├── .env                      # File variabel lingkungan (environment variables)
├── package.json              # Konfigurasi script dan dependensi
└── tsconfig.json             # Konfigurasi TypeScript
```

---

## 🗄️ Database Schema

Aplikasi ini memiliki 2 buah tabel utama di database MySQL:

### 1. Tabel `users`
Menyimpan data otentikasi pengguna.
- `id` (serial / Primary Key)
- `name` (varchar 256, Not Null)
- `email` (varchar 256, Not Null, Unique)
- `password` (varchar 256, Not Null) - *Disimpan dalam format hash bcrypt*
- `createdAt` (timestamp, Default Now)
- `updatedAt` (timestamp, On Update Now)

### 2. Tabel `sessions`
Menyimpan token sesi aktif dari pengguna (Digunakan untuk Login v2).
- `id` (serial / Primary Key)
- `token` (varchar 255, Not Null)
- `userId` (bigint, Foreign Key ke `users.id`)
- `createdAt` (timestamp, Default Now)

---

## 🚀 API Endpoint Terdaftar

### General / Health Check
- `GET /` - Mengembalikan pesan "Welcome to Bun Elysia API"
- `GET /health` - Mengembalikan status OK dan *timestamp* waktu server
- `GET /users` - Mengembalikan daftar seluruh *users* di database

### Auth V1 API (Tanpa Session Token Database)
- `POST /api/v1/auth/register` - Mendaftarkan user baru.
- `POST /api/v1/auth/login` - Melakukan proses login dan mengembalikan profil pengguna.
- `POST /api/v1/auth/logout` - Endpoint *mock* untuk proses logout (mengembalikan sukses).
- `DELETE /api/v1/auth/logout` - Melakukan logout berdasarkan `Authorization: Bearer <token>` dan menghapus sesi di database.

### Auth V2 API (Sistem Sesi / Token Database)
- `POST /api/v2/auth/login` - Melakukan login, menghapus sesi lama pengguna tersebut (*Single Active Session*), lalu men-generate token sesi (`UUID`) baru.

### Users API (Terautentikasi)
- `GET /api/v1/users/current` - Mengambil profil pengguna yang sedang masuk. Membutuhkan header `Authorization: Bearer <token>`.

---

## ⚙️ Cara Setup Project

Ikuti langkah-langkah berikut untuk mengatur proyek di mesin lokal Anda:

1. **Clone repository ini** ke komputer Anda.
2. **Install dependensi**:
   Pastikan Anda sudah meng-install [Bun](https://bun.sh/). Kemudian jalankan:
   ```bash
   bun install
   ```
3. **Siapkan Database MySQL**:
   Siapkan instansi MySQL (lokal atau melalui Docker/hosting).
4. **Konfigurasi Environment Variable**:
   Buat file bernama `.env` di *root* proyek (jika belum ada) dan isikan kredensial koneksi database:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/nama_database"
   ```
5. **Sinkronisasi Skema Database**:
   Anda bisa langsung mengirimkan perubahan skema ke database dengan perintah:
   ```bash
   bun run db:push
   ```
   *Atau jika Anda ingin men-generate file migrasi:*
   ```bash
   bun run db:generate
   ```

---

## ▶️ Cara Menjalankan Aplikasi

Untuk menjalankan server dalam mode pengembangan (*development mode* dengan auto-reload), jalankan perintah:
```bash
bun run dev
```
Server secara *default* akan berjalan pada port **3000** (atau nilai port di `.env`). Anda akan melihat tulisan `🦊 Elysia is running at localhost:3000` di konsol terminal.

---

## 🧪 Cara Melakukan Pengujian (Test)

Aplikasi ini menggunakan framework `bun test`. Seluruh skenario pengujian unit test disimpan di dalam direktori `tests/`. Karena pengujian melakukan operasi pembersihan (`delete`) pada database secara konstan di setiap skenario, maka pengujian harus dijalankan secara serial.

Untuk menjalankan pengujian, cukup eksekusi perintah:
```bash
bun run test
```
*Script tersebut akan menjalankan instruksi `bun test --concurrency 1` yang mencegah masalah tabrakan data (database contention) pada saat parallel test execution.*
