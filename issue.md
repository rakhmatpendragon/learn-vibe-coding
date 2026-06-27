# Rencana Implementasi: Fitur Login Session v2

Dokumen ini berisi spesifikasi dan panduan langkah demi langkah untuk mengimplementasikan fitur login session v2 dengan database table `sessions` baru. Implementasi ini dapat dikerjakan oleh junior programmer atau AI agent model yang lebih hemat.

## 📋 Ringkasan Tugas
1. Membuat tabel `sessions` di database menggunakan Drizzle ORM.
2. Membuat endpoint API Login v2: `POST /api/v2/auth/login`.
3. Mengembalikan token UUID ketika login berhasil dan menyimpannya di tabel `sessions`.
4. Mengembalikan format error spesifik jika user tidak ditemukan.

---

## 🛠️ Detail Spesifikasi & Database Schema

### 1. Skema Tabel `sessions`
Tabel `sessions` menyimpan data session user yang sedang aktif. Silakan tambahkan skema ini pada file `src/db/schema.ts`.

- **Nama Tabel**: `sessions`
- **Kolom**:
  - `id`: Integer, auto increment, primary key (`serial` di Drizzle).
  - `token`: Varchar(255), not null (berisi UUID token login).
  - `userId`: Integer, foreign key ke tabel `users(id)` (`int` di Drizzle).
  - `createdAt`: Timestamp, default `current_timestamp` (`timestamp` dengan `.defaultNow()`).

**Contoh kode Drizzle ORM yang harus ditambahkan ke [schema.ts](file:///d:/Development/GITHUB/learn-vibe-coding/src/db/schema.ts):**
```typescript
import { int } from "drizzle-orm/mysql-core"; // Impor int jika belum ada

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  userId: int("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Setelah mengubah skema database, jalankan perintah migrasi berikut untuk memperbarui database:
```bash
bun db:push
```

---

## 🚦 Alur Logika Bisnis & API Endpoint

### 2. Service Layer (`src/service/users-service.ts`)
Tambahkan fungsi `loginUserV2` di dalam [users-service.ts](file:///d:/Development/GITHUB/learn-vibe-coding/src/service/users-service.ts).

**Detail Logika**:
1. Cari user di tabel `users` berdasarkan `email`. Jika tidak ditemukan, *throw* error `{ code: 404, error: "USER_NOT_FOUND", message: "User not found" }`.
2. Lakukan verifikasi `password` menggunakan `Bun.password.verify()`. Jika tidak valid, *throw* error yang sama `{ code: 404, error: "USER_NOT_FOUND", message: "User not found" }`.
3. Generate token UUID baru menggunakan `crypto.randomUUID()`.
4. Simpan session baru ke tabel `sessions` dengan menyimpan `token` dan `userId`.
5. Kembalikan string `token` (UUID tersebut).

**Contoh Implementasi Service**:
```typescript
import { sessions } from "../db/schema";
// ...

export const loginUserV2 = async (email: string, passwordInput: string) => {
  // 1. Cari user berdasarkan email
  const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (userList.length === 0) {
    throw { code: 404, error: "USER_NOT_FOUND", message: "User not found" };
  }

  const user = userList[0];

  // 2. Verifikasi password
  const isPasswordValid = await Bun.password.verify(passwordInput, user.password);
  if (!isPasswordValid) {
    throw { code: 404, error: "USER_NOT_FOUND", message: "User not found" };
  }

  // 3. Generate UUID token
  const token = crypto.randomUUID();

  // 4. Simpan ke tabel sessions
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  // 5. Kembalikan token
  return token;
};
```

---

### 3. Route Layer (`src/routes/users-route.ts`)
Gunakan Elysia JS untuk membuat endpoint v2. Kita bisa mendefinisikan instance routing baru untuk `/api/v2/auth` di dalam [users-route.ts](file:///d:/Development/GITHUB/learn-vibe-coding/src/routes/users-route.ts) atau langsung menambahkannya.

- **Endpoint**: `/api/v2/auth/login`
- **Metode**: `POST`
- **Validasi Request Body (Elysia Schema Validation `t.Object`)**:
  ```json
  {
    "email": "rakhmat@gmail.com",
    "password": "rahasia"
  }
  ```
- **Respon Sukses (HTTP 200 OK)**:
  ```json
  {
    "data": "token"
  }
  ```
- **Respon Error (HTTP 404 Not Found)**:
  ```json
  {
    "message": "User not found",
    "error": "USER_NOT_FOUND",
    "code": 404
  }
  ```

**Contoh Kode Route (`src/routes/users-route.ts`)**:
```typescript
import { loginUserV2 } from "../service/users-service";

export const usersRouteV2 = new Elysia({ prefix: "/api/v2/auth" })
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const token = await loginUserV2(body.email, body.password);
        set.status = 200;
        return {
          data: token,
        };
      } catch (error: any) {
        if (error.code === 404 && error.error === "USER_NOT_FOUND") {
          set.status = 404;
          return {
            message: error.message,
            error: error.error,
            code: 404,
          };
        }
        set.status = 500;
        return { message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  );
```

---

### 4. Menghubungkan Route di Aplikasi Utama (`src/index.ts`)
Impor `usersRouteV2` dan pasang di instance aplikasi utama Elysia di [index.ts](file:///d:/Development/GITHUB/learn-vibe-coding/src/index.ts).

```typescript
import { usersRoute } from "./routes/users-route";
import { usersRouteV2 } from "./routes/users-route"; // Jika diekspor dari file yang sama

const app = new Elysia()
  .use(usersRoute)   // v1 routes
  .use(usersRouteV2) // v2 routes
  // ...
```

---

## 🧪 Rencana Pengujian (Testing Plan)
Setelah kode diimplementasikan dan server berjalan (`bun dev`), lakukan pengujian menggunakan tool REST Client atau curl:

### Test Case 1: Login Berhasil
Kirim POST request ke `/api/v2/auth/login` dengan user yang sudah terdaftar.
- **Request**:
  ```bash
  curl -X POST http://localhost:3000/api/v2/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "rakhmat@gmail.com", "password": "rahasia"}'
  ```
- **Ekspektasi Respon (HTTP 200 OK)**:
  ```json
  {
    "data": "<UUID-TOKEN-RANDOM>"
  }
  ```
- **Verifikasi DB**: Pastikan ada baris baru di tabel `sessions` dengan token dan user ID tersebut.

### Test Case 2: Login Gagal (User / Email Tidak Terdaftar)
Kirim POST request ke `/api/v2/auth/login` dengan email tidak terdaftar.
- **Request**:
  ```bash
  curl -X POST http://localhost:3000/api/v2/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "salah@gmail.com", "password": "rahasia"}'
  ```
- **Ekspektasi Respon (HTTP 404 Not Found)**:
  ```json
  {
    "message": "User not found",
    "error": "USER_NOT_FOUND",
    "code": 404
  }
  ```
