# Bug To Fix

Catatan singkat untuk flaw yang masih relevan ke MVP dan belum diperbaiki di branch ini.

## Status Saat Ini

- `npm.cmd run lint` masih merah: `2 error`, `8 warning`
- Branch target: `feat/auth`

## Flaw Yang Berdampak Ke MVP

### 1. Register form async validation masih kena lint dan berisiko race/stale state

File:
- `src/pages/auth/register/components/form.tsx`

Masalah:
- `useEffect` memanggil `checkEmailAvailability()` dan `checkReferralAvailability()`
- kedua function itu langsung melakukan beberapa `setState(...)`
- ESLint `react-hooks/set-state-in-effect` masih error

Dampak ke MVP:
- feedback availability email/referral bisa stale saat user mengetik cepat
- state debounce / availability berpotensi tidak sinkron dengan input terbaru
- branch belum bisa lolos lint

Arahan fix:
- pindahkan reset state sinkron ke handler `onChange`
- pindahkan async request ke dalam masing-masing `useEffect`
- tambahkan cancel guard supaya hasil request lama tidak menimpa state baru

### 2. Missing dependency di beberapa auth page effect

File:
- `src/pages/auth/forgot-password-verification/forgot-password-verification.page.tsx`
- `src/pages/auth/login/login.page.tsx`
- `src/pages/auth/register/register.page.tsx`
- `src/pages/auth/request-forgot-password/request-forgot-password.page.tsx`

Masalah:
- beberapa `useEffect` masih belum menyertakan dependency seperti `navigate` atau `isActiveSession`

Dampak ke MVP:
- flow redirect / token check bisa jadi tidak konsisten saat nilai terkait berubah
- lint warning masih tersisa dan menutupi warning lain yang lebih penting

Arahan fix:
- lengkapi dependency array sesuai nilai yang dipakai di effect
- kalau sebuah effect mulai terlalu sensitif terhadap dependency, pecah effect berdasarkan tanggung jawab

## Bukan Bagian Branch Ini

- flaw di atas sengaja tidak diperbaiki di branch ini
- branch ini hanya mendorong update fitur/auth terbaru + dokumentasi bug singkat untuk follow-up
