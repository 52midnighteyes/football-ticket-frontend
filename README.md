# Football Ticket Frontend

Frontend starter untuk aplikasi pemesanan tiket sepak bola. Repository ini dipakai sebagai pondasi awal UI berbasis React, dengan routing client-side, konfigurasi request API, dan state auth yang siap dikembangkan.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Zustand
- Tailwind CSS 4
- shadcn/ui

## Fitur Starter Saat Ini

- Struktur project frontend modern dengan Vite
- Routing dasar menggunakan `react-router`
- Axios instance terpusat di `src/lib/axios.ts`
- Interceptor refresh token untuk request yang kena `401`
- Auth state global menggunakan Zustand persistence
- Alias import `@/*` ke folder `src`

## Struktur Folder

```text
src/
  components/    komponen UI
  lib/           helper dan konfigurasi shared
  store/         global state aplikasi
  App.tsx        entry halaman utama
  main.tsx       bootstrap React dan router
```

## Menjalankan Project

1. Install dependency:

```bash
npm install
```

2. Siapkan environment variable:

```env
VITE_API_BASE_URL=http://localhost:3000
```

3. Jalankan development server:

```bash
npm run dev
```

## Script

- `npm run dev` menjalankan Vite dev server
- `npm run build` build production
- `npm run lint` menjalankan ESLint
- `npm run preview` preview hasil build

## Catatan

- Token akses disimpan di auth store frontend, sementara refresh token diasumsikan dikirim lewat cookie `withCredentials`.
- Branch `main` dipakai sebagai baseline/starter.
- Branch `dev` dipakai untuk pengembangan fitur lanjutan dari starter yang sama.
