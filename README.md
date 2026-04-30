# Football Ticket Frontend

Frontend React untuk aplikasi pemesanan tiket sepak bola. Repository ini sekarang sudah berisi fondasi auth flow utama, integrasi API, state session global, dan komponen UI dasar untuk pengembangan fitur berikutnya.

## Stack

- React 19
- TypeScript
- Vite
- React Router 7
- Axios
- Zustand
- Formik
- Yup
- Tailwind CSS 4
- shadcn/ui
- Sonner

## Fitur Saat Ini

- Login user dengan penyimpanan session ke auth store
- Register user dengan pilihan role `CUSTOMER` atau `ORGANIZER`
- Validasi ketersediaan email secara async saat register
- Validasi referral code secara async saat register
- Request forgot password via email
- Halaman verifikasi reset password berbasis token route
- Logout flow yang membersihkan session lokal
- Navbar yang menyesuaikan menu berdasarkan status login dan role user
- Interceptor refresh token untuk request yang menerima `401`
- Alias import `@/*` ke folder `src`

## Route Yang Sudah Tersedia

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/forgot-password-verification/:token`

## Struktur Folder

```text
src/
  api/          integrasi request ke backend
  components/   komponen UI reusable
  hook/         custom hooks
  lib/          helper dan konfigurasi shared
  pages/        halaman fitur aplikasi
  store/        global state aplikasi
  App.tsx       definisi route utama
  main.tsx      bootstrap React app
```

## Menjalankan Project

1. Install dependency

```bash
npm install
```

2. Siapkan environment variable

```env
VITE_API_BASE_URL=http://localhost:3000
```

3. Jalankan development server

```bash
npm run dev
```

## Script

- `npm run dev` menjalankan Vite dev server
- `npm run build` build production
- `npm run lint` menjalankan ESLint
- `npm run preview` preview hasil build

## Catatan

- Access token disimpan di auth store frontend.
- Refresh token diasumsikan dikirim backend lewat cookie dan dipakai ulang oleh axios interceptor.
- Branch `dev` dipakai sebagai branch pengembangan aktif.
