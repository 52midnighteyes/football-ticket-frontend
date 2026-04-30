# Bug To Fix

Catatan hasil pengecekan terbaru yang masih perlu follow-up, tanpa perbaikan tambahan.

## Status Saat Ini

- `eslint .` bersih: tidak ada error dan tidak ada warning.
- `npm.cmd run build` berhasil.
- Masih ada 1 warning saat production build.

## Warning Yang Masih Tersisa

### 1. Bundle JS utama terlalu besar saat build produksi

File output:
- `dist/assets/index-C-bEZ1kl.js`

Detail warning:
- Vite melaporkan ada chunk yang lebih besar dari `500 kB` setelah minify.
- Output saat build menunjukkan bundle utama sekitar `538.33 kB` dengan gzip sekitar `169.68 kB`.

Dampak:
- initial load bisa lebih berat, terutama di koneksi lambat
- warning ini bisa menyulitkan pemantauan regresi ukuran bundle ke depannya

Arahan follow-up:
- cek kandidat code splitting dengan `dynamic import()`
- audit dependency yang masuk ke main bundle
- pertimbangkan pengaturan chunking di konfigurasi build bila memang perlu

## Catatan

- Tidak ada lint error/warning lain yang terdeteksi saat pengecekan ini.
- Build sempat gagal di sandbox, tetapi berhasil saat dijalankan di luar sandbox, jadi itu tidak saya catat sebagai bug proyek.
