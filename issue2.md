# Implementasi Fitur Swagger (API Documentation)

## Deskripsi Tugas
Tugas ini bertujuan untuk menambahkan fitur Swagger UI ke dalam project ini. Swagger akan membantu user atau developer lain untuk melihat, mengeksplorasi, dan menguji API (endpoint) yang ada di aplikasi ini dengan lebih mudah melalui antarmuka web interaktif.

Karena project ini menggunakan framework **Elysia** (Bun), kita dapat menggunakan plugin resmi `@elysiajs/swagger` yang sangat mudah diimplementasikan.

## Tahapan Implementasi

Berikut adalah langkah-langkah detail untuk mengimplementasikan fitur Swagger:

### 1. Instalasi Dependency
Pertama, kamu perlu menginstal package `@elysiajs/swagger` menggunakan package manager `bun`.
Jalankan perintah berikut di terminal:
```bash
bun add @elysiajs/swagger
```

### 2. Integrasi Swagger di Aplikasi Utama
Buka file utama aplikasi, yaitu `src/index.ts`.
1. Tambahkan import untuk plugin swagger di bagian atas file:
   ```typescript
   import { swagger } from '@elysiajs/swagger';
   ```
2. Daftarkan plugin swagger tersebut ke dalam instance Elysia.
   Contoh perubahan kode:
   ```typescript
   import { Elysia } from 'elysia';
   import { swagger } from '@elysiajs/swagger';
   // import route lain, misal dari src/routes/users-route.ts

   const app = new Elysia()
     // Daftarkan Swagger
     .use(swagger({
       path: '/swagger', // endpoint untuk mengakses UI Swagger
       documentation: {
         info: {
           title: 'API Documentation',
           version: '1.0.0',
           description: 'Dokumentasi API untuk project learn-vibe-coding'
         }
       }
     }))
     // Daftarkan route lain di sini...
     .listen(3000);
   ```

### 3. Pengujian (Testing)
Setelah kode disimpan:
1. Jalankan server di environment lokal menggunakan perintah:
   ```bash
   bun run dev
   ```
2. Buka browser dan kunjungi endpoint Swagger (contoh: `http://localhost:3000/swagger`, sesuaikan dengan port yang digunakan).
3. Pastikan halaman Swagger UI muncul dan menampilkan endpoint yang sudah ada. Cobalah melakukan test pada salah satu endpoint (misal route user) melalui antarmuka Swagger tersebut.

## Kriteria Penerimaan (Acceptance Criteria)
- Dependency `@elysiajs/swagger` terinstal dan tercatat di `package.json`.
- Aplikasi berjalan normal (tidak ada error crash).
- Halaman UI Swagger dapat diakses melalui browser pada rute `/swagger`.
- Semua endpoint API yang ada di aplikasi tampil pada halaman Swagger tersebut.
