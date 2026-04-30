# API Docs Sementara

Dokumen ini buat testing manual endpoint yang aktif di backend saat ini.

## Base URL

Default local:

```txt
http://localhost:8080
```

## Auth Ringkas

Endpoint yang butuh login memakai header:

```txt
Authorization: Bearer <access_token>
```

Endpoint refresh/logout yang pakai refresh token cookie perlu:

```txt
credentials: include
```

Role guard yang aktif saat ini:

- write event: `ORGANIZER` atau `ADMIN`
- buy ticket / create transaction: `CUSTOMER`

## Ringkasan Endpoint Aktif

- `GET /`
- `GET /api/auth/token/:token`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `POST /api/auth/verify/:token`
- `POST /api/auth/update-password`
- `POST /api/auth/request-forgot-password`
- `POST /api/auth/forgot-password/:token`
- `POST /api/auth/resend-verification-email`
- `POST /api/users/check-email`
- `GET /api/users/me`
- `GET /api/users/:id`
- `PATCH /api/users/avatar`
- `GET /api/users/referral/:referralCode`
- `GET /api/event`
- `GET /api/event/:id`
- `GET /api/event/slug/:slug`
- `POST /api/event/organizer/:id`
- `POST /api/event/:id/ticket-types`
- `PUT /api/event/:id`
- `DELETE /api/event/:id`
- `GET /api/locations/countries`
- `GET /api/locations/provinces`
- `GET /api/locations/cities`
- `GET /api/categories`
- `GET /api/tickets`
- `GET /api/tickets/attendance-stats`
- `PATCH /api/tickets/check-in`
- `POST /api/transactions`
- `GET /api/transactions/me`
- `GET /api/transactions/organizer/me`
- `GET /api/transactions/organizer/revenue`
- `GET /api/transactions/vouchers/check`
- `GET /api/transactions/coupons/me`
- `GET /api/transactions/points/me`
- `PATCH /api/transactions/:id/payment-proof`
- `PATCH /api/transactions/:id/status`

## Health

### `GET /`

Kegunaan:

- health check sederhana

Expected input:

- params: none
- query: none
- body: none

Auth:

- tidak perlu

Response sukses:

```txt
Your API is running on port: 8080
```

## Auth Endpoints

### `GET /api/auth/token/:token`

Kegunaan:

- cek token reset password

Expected input:

- params:
  - `token` string
- query: none
- body: none

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Token is valid",
  "data": 1
}
```

### `POST /api/auth/register`

Kegunaan:

- register user baru

Expected input:

- params: none
- query: none
- body:
  - `email` string email
  - `firstName` string
  - `lastName` string
  - `password` string
  - `role` enum optional: `CUSTOMER` | `ORGANIZER`
  - `referrerCode` string optional

Auth:

- tidak perlu

Contoh body:

```json
{
  "email": "organizer@mail.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "Password1!",
  "role": "ORGANIZER",
  "referrerCode": "AB1234"
}
```

Response sukses:

```json
{
  "message": "Register success"
}
```

### `POST /api/auth/login`

Kegunaan:

- login dan ambil access token

Expected input:

- params: none
- query: none
- body:
  - `email` string email
  - `password` string

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Login success",
  "data": {
    "accessToken": "JWT_ACCESS_TOKEN",
    "user": {
      "id": "USER_UUID",
      "email": "organizer@mail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANIZER",
      "avatarUrl": null,
      "isVerified": false
    }
  }
}
```

Response error yang umum:

- `400 Bad Request`

```json
{
  "message": "Email format is invalid"
}
```

```json
{
  "message": "Email is required"
}
```

```json
{
  "message": "Password is required"
}
```

- `401 Unauthorized`

```json
{
  "message": "Invalid email or password"
}
```

### `POST /api/auth/refresh-token`

Kegunaan:

- refresh access token dari cookie refresh token

Expected input:

- params: none
- query: none
- body: none

Auth:

- perlu refresh token cookie

Response sukses:

```json
{
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "JWT_ACCESS_TOKEN",
    "user": {
      "id": "USER_UUID",
      "email": "organizer@mail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANIZER",
      "avatarUrl": null,
      "isVerified": false
    }
  }
}
```

### `POST /api/auth/logout`

Kegunaan:

- revoke refresh token aktif

Expected input:

- params: none
- query: none
- body: none

Auth:

- perlu refresh token cookie

Response sukses:

```json
{
  "message": "Logout successful!"
}
```

### `POST /api/auth/verify/:token`

Kegunaan:

- verifikasi account dari email

Expected input:

- params:
  - `token` string
- query: none
- body: none

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Verify success",
  "data": {
    "accessToken": "JWT_ACCESS_TOKEN",
    "user": {
      "id": "USER_UUID",
      "email": "organizer@mail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANIZER",
      "avatarUrl": null,
      "isVerified": true
    }
  }
}
```

### `POST /api/auth/update-password`

Kegunaan:

- update password user yang sudah login

Expected input:

- params: none
- query: none
- body:
  - `oldPassword` string
  - `newPassword` string

Auth:

- bearer token wajib

Response sukses:

```json
{
  "message": "Update password successful"
}
```

### `POST /api/auth/request-forgot-password`

Kegunaan:

- kirim email reset password

Expected input:

- params: none
- query: none
- body:
  - `email` string email

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "If an account with that email exists, a reset link has been sent"
}
```

### `POST /api/auth/forgot-password/:token`

Kegunaan:

- set password baru dari token email

Expected input:

- params:
  - `token` string
- query: none
- body:
  - `newPassword` string

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Password reset successful. You can now log in with your new password"
}
```

### `POST /api/auth/resend-verification-email`

Kegunaan:

- kirim ulang email verifikasi

Expected input:

- params: none
- query: none
- body: none

Auth:

- bearer token wajib

Response sukses:

```json
{
  "message": "Verification email sent"
}
```

## User Endpoints

### `POST /api/users/check-email`

Kegunaan:

- cek email sudah dipakai atau belum

Expected input:

- params: none
- query: none
- body:
  - `email` string email

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Email is available"
}
```

### `GET /api/users/me`

Kegunaan:

- ambil profil user login

Expected input:

- params: none
- query: none
- body: none

Auth:

- bearer token wajib

Response sukses:

```json
{
  "status": "success",
  "data": {
    "id": "USER_UUID",
    "email": "organizer@mail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ORGANIZER",
    "avatarUrl": null,
    "isVerified": true,
    "referralCode": "JOAB1234"
  }
}
```

### `GET /api/users/:id`

Kegunaan:

- ambil user berdasarkan id

Expected input:

- params:
  - `id` UUID
- query: none
- body: none

Auth:

- tidak perlu

Response sukses:

```json
{
  "status": "success",
  "data": {
    "id": "USER_UUID",
    "email": "organizer@mail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ORGANIZER",
    "avatarUrl": null,
    "isVerified": true
  }
}
```

### `PATCH /api/users/avatar`

Kegunaan:

- upload avatar user login

Expected input:

- params: none
- query: none
- body content type:
  - `multipart/form-data`
- form-data:
  - `avatar` file image

Auth:

- bearer token wajib

Response sukses:

```json
{
  "message": "Avatar uploaded successfully",
  "data": {
    "user": {
      "id": "USER_UUID",
      "email": "organizer@mail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANIZER",
      "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
      "isVerified": true
    }
  }
}
```

### `GET /api/users/referral/:referralCode`

Kegunaan:

- cek referral code valid atau tidak

Expected input:

- params:
  - `referralCode` string
- query: none
- body: none

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Referral code is valid"
}
```

## Event Endpoints

### `GET /api/event`

Kegunaan:

- ambil list event
- bisa juga dipakai filter list event tertentu

Expected input:

- params: none
- body: none
- query possible:
  - `id` UUID
  - `slug` string exact match
  - `slugLike` string contains search
  - `nameLike` string contains search
  - `descriptionLike` string contains search
  - `venueLike` string contains search
  - `addressLike` string contains search
  - `organizerId` UUID
  - `locationId` UUID
  - `categoryId` UUID
  - `status` enum: `DRAFT` | `PUBLISHED` | `CANCELED` | `COMPLETED`
  - `sortBy` enum: `name` | `slug` | `venue` | `address` | `startAt` | `endAt` | `createdAt` | `updatedAt`
  - `sortOrder` enum: `asc` | `desc`
  - `page` number, default `1`
  - `limit` number, default `10`, max `100`

Catatan:

- `locationId` saat ini dipetakan ke field `cityId`
- semua query opsional
- query bisa digabung
- semua field `...Like` pakai contains case-insensitive
- default sorting: `createdAt desc`

Contoh:

```txt
GET /api/event
GET /api/event?organizerId=<organizer_uuid>
GET /api/event?locationId=<city_uuid>&categoryId=<category_uuid>
GET /api/event?status=PUBLISHED
GET /api/event?nameLike=derby
GET /api/event?venueLike=stadium&sortBy=startAt&sortOrder=asc
GET /api/event?page=2&limit=10
```

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Events fetched successfully",
  "data": [
    {
      "id": "EVENT_UUID",
      "organizerId": "ORGANIZER_UUID",
      "categoryId": "CATEGORY_UUID",
      "cityId": "CITY_UUID",
      "name": "Derby Night",
      "slug": "derby-night-1234",
      "description": "Big match for weekend crowd",
      "bannerUrl": "https://res.cloudinary.com/.../banner.jpg",
      "venue": "Main Stadium",
      "address": "Jl. Stadion No. 10",
      "startAt": "2026-05-10T19:00:00.000Z",
      "endAt": "2026-05-10T22:00:00.000Z",
      "status": "DRAFT",
      "ticketTypes": [
        {
          "id": "TICKET_TYPE_UUID",
          "eventId": "EVENT_UUID",
          "name": "VIP",
          "price": 250000,
          "quota": 100,
          "createdAt": "2026-04-28T10:00:00.000Z",
          "updatedAt": "2026-04-28T10:00:00.000Z"
        }
      ],
      "createdAt": "2026-04-28T08:00:00.000Z",
      "updatedAt": "2026-04-28T08:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /api/event/:id`

Kegunaan:

- ambil detail satu event berdasarkan `id`

Expected input:

- params:
  - `id` UUID event id
- query: none
- body: none

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Event fetched successfully",
  "data": {
    "id": "EVENT_UUID",
    "organizerId": "ORGANIZER_UUID",
    "categoryId": "CATEGORY_UUID",
    "cityId": "CITY_UUID",
    "name": "Derby Night",
    "slug": "derby-night-1234",
    "description": "Big match for weekend crowd",
    "bannerUrl": "https://res.cloudinary.com/.../banner.jpg",
    "venue": "Main Stadium",
    "address": "Jl. Stadion No. 10",
    "startAt": "2026-05-10T19:00:00.000Z",
    "endAt": "2026-05-10T22:00:00.000Z",
    "status": "DRAFT",
    "ticketTypes": [
      {
        "id": "TICKET_TYPE_UUID_1",
        "eventId": "EVENT_UUID",
        "name": "VIP",
        "price": 250000,
        "quota": 100,
        "isActive": true,
        "isSoldOut": false,
        "isDeleted": false,
        "createdAt": "2026-04-28T08:00:00.000Z",
        "updatedAt": "2026-04-28T08:00:00.000Z"
      }
    ],
    "createdAt": "2026-04-28T08:00:00.000Z",
    "updatedAt": "2026-04-28T08:00:00.000Z",
    "deletedAt": null
  }
}
```

### `GET /api/event/slug/:slug`

Kegunaan:

- ambil detail satu event berdasarkan `slug`

Expected input:

- params:
  - `slug` string
- query: none
- body: none

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Event fetched successfully",
  "data": {
    "id": "EVENT_UUID",
    "organizerId": "ORGANIZER_UUID",
    "categoryId": "CATEGORY_UUID",
    "cityId": "CITY_UUID",
    "name": "Derby Night",
    "slug": "derby-night-1234",
    "description": "Big match for weekend crowd",
    "bannerUrl": "https://res.cloudinary.com/.../banner.jpg",
    "venue": "Main Stadium",
    "address": "Jl. Stadion No. 10",
    "startAt": "2026-05-10T19:00:00.000Z",
    "endAt": "2026-05-10T22:00:00.000Z",
    "status": "DRAFT",
    "ticketTypes": [
      {
        "id": "TICKET_TYPE_UUID_1",
        "eventId": "EVENT_UUID",
        "name": "VIP",
        "price": 250000,
        "quota": 100,
        "isActive": true,
        "isSoldOut": false,
        "isDeleted": false,
        "createdAt": "2026-04-28T08:00:00.000Z",
        "updatedAt": "2026-04-28T08:00:00.000Z"
      }
    ],
    "createdAt": "2026-04-28T08:00:00.000Z",
    "updatedAt": "2026-04-28T08:00:00.000Z",
    "deletedAt": null
  }
}
```

### `POST /api/event/organizer/:id`

Kegunaan:

- create event baru
- sekalian create banyak ticket type dalam satu request

Expected input:

- params:
  - `id` UUID organizer id
- query: none
- body content type:
  - `multipart/form-data`
- form-data:
  - `categoryId` UUID
  - `cityId` UUID
  - `name` string
  - `description` string
  - `venue` string
  - `address` string
  - `startAt` date string
  - `endAt` date string
  - `status` enum optional: `DRAFT` | `PUBLISHED` | `CANCELED` | `COMPLETED`
  - `ticketTypes` JSON string array wajib
  - `bannerUrl` file image wajib

Format `ticketTypes`:

```json
[
  {
    "name": "VIP",
    "price": 250000,
    "quota": 100,
    "isActive": true
  },
  {
    "name": "Regular",
    "price": 100000,
    "quota": 500,
    "isActive": true
  }
]
```

Auth:

- bearer token wajib
- role `ORGANIZER` atau `ADMIN`
- kalau role `ORGANIZER`, param `:id` harus sama dengan id di token

Contoh curl:

```bash
curl -X POST "http://localhost:8080/api/event/organizer/ORGANIZER_UUID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -F "categoryId=CATEGORY_UUID" \
  -F "cityId=CITY_UUID" \
  -F "name=Derby Night" \
  -F "description=Big match for weekend crowd" \
  -F "venue=Main Stadium" \
  -F "address=Jl. Stadion No. 10" \
  -F "startAt=2026-05-10T19:00:00.000Z" \
  -F "endAt=2026-05-10T22:00:00.000Z" \
  -F "status=DRAFT" \
  -F "ticketTypes=[{\"name\":\"VIP\",\"price\":250000,\"quota\":100,\"isActive\":true},{\"name\":\"Regular\",\"price\":100000,\"quota\":500,\"isActive\":true}]" \
  -F "bannerUrl=@C:/temp/banner.jpg"
```

Response sukses:

```json
{
  "message": "Event created successfully",
  "data": {
    "id": "EVENT_UUID",
    "organizerId": "ORGANIZER_UUID",
    "categoryId": "CATEGORY_UUID",
    "cityId": "CITY_UUID",
    "name": "Derby Night",
    "slug": "derby-night-1234",
    "description": "Big match for weekend crowd",
    "bannerUrl": "https://res.cloudinary.com/.../banner.jpg",
    "venue": "Main Stadium",
    "address": "Jl. Stadion No. 10",
    "startAt": "2026-05-10T19:00:00.000Z",
    "endAt": "2026-05-10T22:00:00.000Z",
    "status": "DRAFT",
    "ticketTypes": [
      {
        "id": "TICKET_TYPE_UUID_1",
        "eventId": "EVENT_UUID",
        "name": "VIP",
        "price": 250000,
        "quota": 100,
        "isActive": true,
        "isSoldOut": false,
        "isDeleted": false,
        "createdAt": "2026-04-28T08:00:00.000Z",
        "updatedAt": "2026-04-28T08:00:00.000Z"
      },
      {
        "id": "TICKET_TYPE_UUID_2",
        "eventId": "EVENT_UUID",
        "name": "Regular",
        "price": 100000,
        "quota": 500,
        "isActive": true,
        "isSoldOut": false,
        "isDeleted": false,
        "createdAt": "2026-04-28T08:00:00.000Z",
        "updatedAt": "2026-04-28T08:00:00.000Z"
      }
    ],
    "createdAt": "2026-04-28T08:00:00.000Z",
    "updatedAt": "2026-04-28T08:00:00.000Z",
    "deletedAt": null
  }
}
```

Response error yang umum:

- `400 Bad Request`

```json
{
  "message": "Banner image is required"
}
```

```json
{
  "message": "Organizer ID must be a valid UUID"
}
```

```json
{
  "message": "Category ID must be a valid UUID"
}
```

```json
{
  "message": "City ID must be a valid UUID"
}
```

```json
{
  "message": "End date must be after start date"
}
```

```json
{
  "message": "At least one ticket type is required"
}
```

```json
{
  "message": "Invalid file type. Only JPG, PNG, and WEBP are allowed."
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden"
}
```

```json
{
  "message": "You are not allowed to create this event"
}
```

### `POST /api/event/:id/ticket-types`

Kegunaan:

- create banyak ticket type untuk event tertentu

Expected input:

- params:
  - `id` UUID event id
- query: none
- body:
  - `ticketTypes` array of object
    - `name` string
    - `price` integer, minimum `0`
    - `quota` integer, minimum `1`
    - `isActive` boolean optional, default `true`

Auth:

- bearer token wajib
- role `ORGANIZER` atau `ADMIN`
- organizer hanya bisa create ticket type untuk event miliknya sendiri

Contoh body:

```json
{
  "ticketTypes": [
    {
      "name": "VIP",
      "price": 250000,
      "quota": 100,
      "isActive": true
    },
    {
      "name": "Regular",
      "price": 100000,
      "quota": 500,
      "isActive": true
    }
  ]
}
```

Response sukses:

```json
{
  "message": "Ticket types created successfully",
  "data": [
    {
      "id": "TICKET_TYPE_UUID_1",
      "eventId": "EVENT_UUID",
      "name": "VIP",
      "price": 250000,
      "quota": 100,
      "isActive": true,
      "isSoldOut": false,
      "isDeleted": false,
      "createdAt": "2026-04-28T10:00:00.000Z",
      "updatedAt": "2026-04-28T10:00:00.000Z"
    },
    {
      "id": "TICKET_TYPE_UUID_2",
      "eventId": "EVENT_UUID",
      "name": "Regular",
      "price": 100000,
      "quota": 500,
      "isActive": true,
      "isSoldOut": false,
      "isDeleted": false,
      "createdAt": "2026-04-28T10:00:00.000Z",
      "updatedAt": "2026-04-28T10:00:00.000Z"
    }
  ]
}
```

### `PUT /api/event/:id`

Kegunaan:

- update event
- sekalian update atau tambah ticket type dari form yang sama

Expected input:

- params:
  - `id` UUID event id
- query: none
- body content type:
  - `multipart/form-data`
- form-data:
  - `categoryId` UUID
  - `cityId` UUID
  - `name` string
  - `description` string
  - `venue` string
  - `address` string
  - `startAt` date string
  - `endAt` date string
  - `status` enum optional: `DRAFT` | `PUBLISHED` | `CANCELED` | `COMPLETED`
  - `ticketTypes` JSON string array wajib
  - `bannerUrl` file image optional

Format item `ticketTypes` saat update:

```json
[
  {
    "id": "TICKET_TYPE_UUID_1",
    "name": "VIP",
    "price": 300000,
    "quota": 80,
    "isActive": true
  },
  {
    "id": "TICKET_TYPE_UUID_2",
    "name": "Regular",
    "price": 100000,
    "quota": 500,
    "isActive": false
  },
  {
    "name": "Tribune",
    "price": 150000,
    "quota": 200,
    "isActive": true
  }
]
```

Catatan:

- untuk MVP, kirim semua field lagi saat update
- kalau banner baru dikirim, banner lama akan dihapus
- ticket type tidak di-delete dari flow ini
- kalau mau "hapus" dari sisi bisnis, kirim item itu dengan `isActive: false`
- item yang punya `id` akan di-update
- item tanpa `id` akan di-create sebagai ticket type baru

Auth:

- bearer token wajib
- role `ORGANIZER` atau `ADMIN`

Response sukses:

```json
{
  "message": "Event updated successfully",
  "data": {
    "id": "EVENT_UUID",
    "organizerId": "ORGANIZER_UUID",
    "categoryId": "CATEGORY_UUID",
    "cityId": "CITY_UUID",
    "name": "Derby Night Updated",
    "slug": "derby-night-updated-5678",
    "description": "Updated event description",
    "bannerUrl": "https://res.cloudinary.com/.../banner-new.jpg",
    "venue": "Main Stadium",
    "address": "Jl. Stadion No. 10",
    "startAt": "2026-05-10T19:00:00.000Z",
    "endAt": "2026-05-10T22:30:00.000Z",
    "status": "PUBLISHED",
    "ticketTypes": [
      {
        "id": "TICKET_TYPE_UUID_1",
        "eventId": "EVENT_UUID",
        "name": "VIP",
        "price": 300000,
        "quota": 80,
        "isActive": true,
        "isSoldOut": false,
        "isDeleted": false,
        "createdAt": "2026-04-28T08:00:00.000Z",
        "updatedAt": "2026-04-28T09:00:00.000Z"
      },
      {
        "id": "TICKET_TYPE_UUID_2",
        "eventId": "EVENT_UUID",
        "name": "Regular",
        "price": 100000,
        "quota": 500,
        "isActive": false,
        "isSoldOut": false,
        "isDeleted": false,
        "createdAt": "2026-04-28T08:00:00.000Z",
        "updatedAt": "2026-04-28T09:00:00.000Z"
      },
      {
        "id": "TICKET_TYPE_UUID_3",
        "eventId": "EVENT_UUID",
        "name": "Tribune",
        "price": 150000,
        "quota": 200,
        "isActive": true,
        "isSoldOut": false,
        "isDeleted": false,
        "createdAt": "2026-04-28T09:00:00.000Z",
        "updatedAt": "2026-04-28T09:00:00.000Z"
      }
    ],
    "createdAt": "2026-04-28T08:00:00.000Z",
    "updatedAt": "2026-04-28T09:00:00.000Z",
    "deletedAt": null
  }
}
```

### `DELETE /api/event/:id`

Kegunaan:

- delete event

Expected input:

- params:
  - `id` UUID event id
- query: none
- body: none

Catatan:

- delete saat ini soft delete lewat `deletedAt`

Auth:

- bearer token wajib
- role `ORGANIZER` atau `ADMIN`

Response sukses:

```json
{
  "message": "Event deleted successfully",
  "data": {
    "id": "EVENT_UUID",
    "deletedAt": "2026-04-28T10:00:00.000Z"
  }
}
```

## Location Endpoints

### `GET /api/locations/countries`

Kegunaan:

- ambil list country beserta provinces dan cities

Expected input:

- params: none
- body: none
- query possible:
  - `id` UUID
  - `code` string
  - `name` string
  - `codeLike` string contains search
  - `nameLike` string contains search
  - `sortBy` enum: `name` | `code` | `createdAt` | `updatedAt`
  - `sortOrder` enum: `asc` | `desc`

Catatan:

- semua query opsional
- `name` dan `nameLike` pakai contains case-insensitive
- `code` pakai equals case-insensitive
- `codeLike` pakai contains case-insensitive
- default sorting: `name asc`
- response include `provinces` dan nested `cities`

Contoh:

```txt
GET /api/locations/countries
GET /api/locations/countries?id=<country_uuid>
GET /api/locations/countries?name=england
GET /api/locations/countries?code=ENG
GET /api/locations/countries?nameLike=land
GET /api/locations/countries?codeLike=EN&sortBy=code&sortOrder=desc
```

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Countries fetched successfully",
  "data": [
    {
      "id": "COUNTRY_UUID",
      "name": "England",
      "code": "ENG",
      "createdAt": "2026-04-07T00:00:00.000Z",
      "updatedAt": "2026-04-07T00:00:00.000Z",
      "provinces": [
        {
          "id": "PROVINCE_UUID",
          "countryId": "COUNTRY_UUID",
          "name": "Greater London",
          "code": "LDN",
          "createdAt": "2026-04-07T00:00:00.000Z",
          "updatedAt": "2026-04-07T00:00:00.000Z",
          "cities": [
            {
              "id": "CITY_UUID",
              "provinceId": "PROVINCE_UUID",
              "name": "London",
              "code": "LON",
              "createdAt": "2026-04-07T00:00:00.000Z",
              "updatedAt": "2026-04-07T00:00:00.000Z"
            }
          ]
        }
      ]
    }
  ]
}
```

### `GET /api/locations/provinces`

Kegunaan:

- ambil list province beserta cities

Expected input:

- params: none
- body: none
- query possible:
  - `id` UUID
  - `countryId` UUID
  - `code` string
  - `name` string
  - `codeLike` string contains search
  - `nameLike` string contains search
  - `sortBy` enum: `name` | `code` | `createdAt` | `updatedAt`
  - `sortOrder` enum: `asc` | `desc`

Catatan:

- semua query opsional
- `name` dan `nameLike` pakai contains case-insensitive
- `code` pakai equals case-insensitive
- `codeLike` pakai contains case-insensitive
- default sorting: `name asc`
- response include `cities`

Contoh:

```txt
GET /api/locations/provinces
GET /api/locations/provinces?countryId=<country_uuid>
GET /api/locations/provinces?name=london
GET /api/locations/provinces?code=LDN
GET /api/locations/provinces?nameLike=london
GET /api/locations/provinces?sortBy=createdAt&sortOrder=desc
```

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Provinces fetched successfully",
  "data": [
    {
      "id": "PROVINCE_UUID",
      "countryId": "COUNTRY_UUID",
      "name": "Greater London",
      "code": "LDN",
      "createdAt": "2026-04-07T00:00:00.000Z",
      "updatedAt": "2026-04-07T00:00:00.000Z",
      "cities": [
        {
          "id": "CITY_UUID",
          "provinceId": "PROVINCE_UUID",
          "name": "London",
          "code": "LON",
          "createdAt": "2026-04-07T00:00:00.000Z",
          "updatedAt": "2026-04-07T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

### `GET /api/locations/cities`

Kegunaan:

- ambil list city untuk picker/form

Expected input:

- params: none
- body: none
- query possible:
  - `id` UUID
  - `provinceId` UUID
  - `code` string
  - `name` string
  - `codeLike` string contains search
  - `nameLike` string contains search
  - `sortBy` enum: `name` | `code` | `createdAt` | `updatedAt`
  - `sortOrder` enum: `asc` | `desc`

Catatan:

- semua query opsional
- `name` dan `nameLike` pakai contains case-insensitive
- `code` pakai equals case-insensitive
- `codeLike` pakai contains case-insensitive
- default sorting: `name asc`

Contoh:

```txt
GET /api/locations/cities
GET /api/locations/cities?provinceId=<province_uuid>
GET /api/locations/cities?name=jakarta
GET /api/locations/cities?code=JKT
GET /api/locations/cities?nameLike=kar
GET /api/locations/cities?sortBy=code&sortOrder=desc
```

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Cities fetched successfully",
  "data": [
    {
      "id": "CITY_UUID",
      "provinceId": "PROVINCE_UUID",
      "name": "Jakarta",
      "code": "JKT",
      "createdAt": "2026-04-07T00:00:00.000Z",
      "updatedAt": "2026-04-07T00:00:00.000Z"
    }
  ]
}
```

## Category Endpoints

### `GET /api/categories`

Kegunaan:

- ambil list category untuk picker/form

Expected input:

- params: none
- body: none
- query possible:
  - `id` UUID
  - `name` string
  - `nameLike` string contains search
  - `sortBy` enum: `name` | `createdAt` | `updatedAt`
  - `sortOrder` enum: `asc` | `desc`

Catatan:

- semua query opsional
- `name` dan `nameLike` pakai contains case-insensitive
- default sorting: `name asc`

Contoh:

```txt
GET /api/categories
GET /api/categories?id=<category_uuid>
GET /api/categories?name=football
GET /api/categories?nameLike=league
GET /api/categories?sortBy=updatedAt&sortOrder=desc
```

Auth:

- tidak perlu

Response sukses:

```json
{
  "message": "Categories fetched successfully",
  "data": [
    {
      "id": "CATEGORY_UUID",
      "name": "Football",
      "createdAt": "2026-04-07T00:00:00.000Z",
      "updatedAt": "2026-04-07T00:00:00.000Z",
      "deletedAt": null
    }
  ]
}
```

## Transaction Endpoints

### Ringkasan Flow Transaksi

- satu transaksi hanya untuk satu `ticketTypeId` dengan quantity tetap `1`
- satu user tidak bisa punya transaksi aktif atau transaksi selesai untuk event yang sama
- transaksi bisa pakai `voucher`, `coupon`, dan `point` secara bersamaan
- `voucher` pakai kode, `coupon` pakai `couponId`
- `voucher` wajib cocok dengan `eventId` transaksi
- `point` dipakai dengan rasio `1 point = 1 rupiah`
- `coupon` dipakai dengan rasio `1 amount = 1 rupiah`
- `voucher` dipakai dengan rasio `1 amount = 1 rupiah`
- saat transaksi dibuat, quota `ticketType` langsung dikurangi
- kalau quota sesudah transaksi jadi `0`, `isSoldOut` akan jadi `true`
- saat transaksi pertama kali dibuat dan masih `WAITING_FOR_PAYMENT`, `expiredAt` bernilai `2 jam` dari waktu create
- user hanya bisa upload bukti transfer saat status masih `WAITING_FOR_PAYMENT`
- setelah bukti transfer berhasil diupload, status transaksi jadi `WAITING_FOR_ADMIN_CONFIRMATION`
- saat masuk `WAITING_FOR_ADMIN_CONFIRMATION`, `expiredAt` akan digeser jadi `3 jam` dari waktu upload sebagai window follow-up untuk organizer
- organizer atau admin bisa review transaksi yang statusnya `WAITING_FOR_ADMIN_CONFIRMATION`
- kalau transaksi di-`REJECTED`, quota ticket, voucher, coupon, dan point akan dikembalikan lagi
- kalau transaksi di-accept, backend akan issue ticket dan kirim kode ticket lewat email
- saat transaksi expired, quota ticket, quota voucher, coupon, dan point yang kepakai akan dibalikin otomatis saat endpoint transaksi dipanggil lagi
- setelah transaksi sukses dibuat, user akan dapat email untuk cek ongoing transaction di profile

### `POST /api/transactions`

Kegunaan:

- buat transaksi baru untuk user login

Expected input:

- params: none
- query: none
- body:
  - `eventId` UUID
  - `ticketTypeId` UUID
  - `voucherCode` string optional
  - `couponId` UUID optional
  - `usePoints` boolean optional, default `false`

Catatan:

- quantity ticket selalu `1`
- user tidak bisa transaksi ulang untuk event yang sama kalau masih punya transaksi `WAITING_FOR_PAYMENT`, `WAITING_FOR_ADMIN_CONFIRMATION`, atau `DONE`
- kalau `usePoints = true`, backend akan otomatis memakai semua point available sampai batas maksimal yang bisa mengurangi tagihan
- kalau total diskon dan point menutupi semua harga tiket, transaksi akan langsung `DONE`
- kalau masih ada sisa bayar, transaksi akan `WAITING_FOR_PAYMENT` dan punya `expiredAt` 2 jam dari waktu create
- nilai `expiredAt` ini akan berubah lagi kalau user berhasil upload bukti transfer

Auth:

- bearer token wajib
- role `CUSTOMER`

Contoh body:

```json
{
  "eventId": "EVENT_UUID",
  "ticketTypeId": "TICKET_TYPE_UUID",
  "voucherCode": "EARLYBIRD10",
  "couponId": "COUPON_UUID",
  "usePoints": true
}
```

Response sukses:

```json
{
  "message": "Transaction created successfully",
  "data": {
    "id": "TRANSACTION_UUID",
    "userId": "USER_UUID",
    "eventId": "EVENT_UUID",
    "couponId": "COUPON_UUID",
    "voucherId": "VOUCHER_UUID",
    "status": "WAITING_FOR_PAYMENT",
    "totalAmount": 100000,
    "couponAmount": 10000,
    "voucherAmount": 20000,
    "pointsAmount": 15000,
    "finalAmount": 55000,
    "expiredAt": "2026-04-29T12:00:00.000Z",
    "transactionItems": [
      {
        "id": "TRANSACTION_ITEM_UUID",
        "ticketTypeId": "TICKET_TYPE_UUID",
        "quantity": 1,
        "price": 100000,
        "subtotal": 100000
      }
    ]
  }
}
```

Response error yang umum:

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden"
}
```

- `400 Bad Request`

```json
{
  "message": "Event ID must be a valid UUID"
}
```

```json
{
  "message": "Ticket type ID must be a valid UUID"
}
```

```json
{
  "message": "Coupon ID must be a valid UUID"
}
```

```json
{
  "message": "Voucher is invalid"
}
```

- `404 Not Found`

```json
{
  "message": "Event not found or not purchasable"
}
```

```json
{
  "message": "Ticket type not found"
}
```

- `409 Conflict`

```json
{
  "message": "Ticket type is sold out"
}
```

```json
{
  "message": "You already have an active or completed transaction for this event"
}
```

### `GET /api/transactions/me`

Kegunaan:

- ambil list transaksi milik user login

Expected input:

- params: none
- body: none
- query possible:
  - `status` enum: `WAITING_FOR_PAYMENT` | `WAITING_FOR_ADMIN_CONFIRMATION` | `DONE` | `REJECTED` | `EXPIRED` | `CANCELED`

Catatan:

- semua query opsional
- sebelum data diambil, sistem akan sinkronkan transaksi expired dulu

Auth:

- bearer token wajib

Contoh:

```txt
GET /api/transactions/me
GET /api/transactions/me?status=WAITING_FOR_PAYMENT
```

### `GET /api/transactions/organizer/me`

Kegunaan:

- ambil list transaksi untuk semua event milik organizer login
- cocok buat dashboard organizer untuk approval queue dan riwayat transaksi event

Expected input:

- params: none
- body: none
- query possible:
  - `id` UUID transaction id
  - `organizerId` UUID
  - `eventId` UUID
  - `userId` UUID buyer/customer id
  - `status` enum: `WAITING_FOR_PAYMENT` | `WAITING_FOR_ADMIN_CONFIRMATION` | `DONE` | `REJECTED` | `EXPIRED` | `CANCELED`
  - `eventNameLike` string contains search
  - `buyerNameLike` string contains search ke `firstName` atau `lastName`
  - `buyerEmailLike` string contains search
  - `sortBy` enum: `createdAt` | `updatedAt` | `expiredAt` | `paymentProofUploadedAt` | `adminActionAt` | `totalAmount` | `finalAmount` | `status`
  - `sortOrder` enum: `asc` | `desc`
  - `page` number, default `1`
  - `limit` number, default `10`, max `100`

Catatan:

- untuk role `ORGANIZER`, data otomatis dibatasi ke event milik organizer login
- untuk role `ADMIN`, query `organizerId` bisa dipakai untuk filter organizer tertentu
- semua query opsional
- query bisa digabung
- field `...Like` pakai contains case-insensitive
- default sorting: `createdAt desc`
- response include relasi `user`, `event`, `coupon`, `voucher`, `transactionItems`, `tickets`, dan `pointHistories`

Auth:

- bearer token wajib
- role `ORGANIZER` atau `ADMIN`

Contoh:

```txt
GET /api/transactions/organizer/me
GET /api/transactions/organizer/me?status=WAITING_FOR_ADMIN_CONFIRMATION
GET /api/transactions/organizer/me?eventId=<event_uuid>&status=DONE
GET /api/transactions/organizer/me?buyerNameLike=john
GET /api/transactions/organizer/me?buyerEmailLike=gmail.com&sortBy=paymentProofUploadedAt&sortOrder=asc
GET /api/transactions/organizer/me?page=2&limit=20
```

Response sukses:

```json
{
  "message": "Organizer transactions fetched successfully",
  "data": [
    {
      "id": "TRANSACTION_UUID",
      "userId": "USER_UUID",
      "eventId": "EVENT_UUID",
      "status": "WAITING_FOR_ADMIN_CONFIRMATION",
      "totalAmount": 100000,
      "couponAmount": 10000,
      "voucherAmount": 20000,
      "pointsAmount": 15000,
      "finalAmount": 55000,
      "paymentProofUrl": "https://res.cloudinary.com/.../payment-proof.jpg",
      "paymentProofUploadedAt": "2026-04-30T02:00:00.000Z",
      "expiredAt": "2026-04-30T05:00:00.000Z",
      "user": {
        "id": "USER_UUID",
        "email": "customer@mail.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "event": {
        "id": "EVENT_UUID",
        "name": "Derby Night",
        "organizerId": "ORGANIZER_UUID"
      },
      "transactionItems": [
        {
          "id": "TRANSACTION_ITEM_UUID",
          "ticketTypeId": "TICKET_TYPE_UUID",
          "quantity": 1,
          "price": 100000,
          "subtotal": 100000
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /api/transactions/organizer/revenue`

Kegunaan:

- ambil data revenue agregat dari semua event milik organizer
- response sudah disiapkan supaya gampang dipakai langsung di `Recharts`

Expected input:

- params: none
- body: none
- query possible:
  - `groupBy` enum: `year` | `month` | `day`, default `year`
  - `year` number
  - `month` number `1-12`
  - `organizerId` UUID

Catatan:

- untuk role `ORGANIZER`, data otomatis dibatasi ke event milik organizer login
- untuk role `ADMIN`, query `organizerId` bisa dipakai untuk filter organizer tertentu
- revenue hanya dihitung dari transaksi dengan status `DONE`
- revenue dijumlah dari `finalAmount`
- bucket waktu memakai `adminActionAt` saat ada, atau fallback ke `createdAt`
- kalau `groupBy=month`, query `year` wajib
- kalau `groupBy=day`, query `year` dan `month` wajib
- response `items` berbentuk flat array dengan field `label`, `period`, dan `revenue`
- untuk `month` dan `day`, period yang tidak punya transaksi tetap dikembalikan dengan revenue `0` supaya chart stabil

Auth:

- bearer token wajib
- role `ORGANIZER` atau `ADMIN`

Contoh:

```txt
GET /api/transactions/organizer/revenue
GET /api/transactions/organizer/revenue?groupBy=month&year=2026
GET /api/transactions/organizer/revenue?groupBy=day&year=2026&month=4
```

Response sukses per year:

```json
{
  "message": "Revenue analytics fetched successfully",
  "data": {
    "groupBy": "year",
    "year": null,
    "month": null,
    "totalRevenue": 23000000,
    "items": [
      {
        "label": "2024",
        "period": "2024",
        "revenue": 12000000
      },
      {
        "label": "2025",
        "period": "2025",
        "revenue": 11000000
      }
    ]
  }
}
```

Response sukses per month:

```json
{
  "message": "Revenue analytics fetched successfully",
  "data": {
    "groupBy": "month",
    "year": 2026,
    "month": null,
    "totalRevenue": 5400000,
    "items": [
      {
        "label": "Jan",
        "period": "2026-01",
        "revenue": 1200000
      },
      {
        "label": "Feb",
        "period": "2026-02",
        "revenue": 900000
      },
      {
        "label": "Mar",
        "period": "2026-03",
        "revenue": 0
      }
    ]
  }
}
```

### `GET /api/transactions/vouchers/check`

Kegunaan:

- cek voucher valid atau tidak untuk event tertentu
- cocok buat debounce di frontend sebelum submit transaksi

Expected input:

- params: none
- body: none
- query:
  - `eventId` UUID
  - `code` string

Catatan:

- voucher harus cocok dengan `eventId`
- voucher harus masih dalam window `startAt` dan `endAt`
- voucher harus masih punya quota

Auth:

- bearer token wajib

Contoh:

```txt
GET /api/transactions/vouchers/check?eventId=<event_uuid>&code=EARLYBIRD10
```

Response sukses:

```json
{
  "message": "Voucher is valid",
  "data": {
    "id": "VOUCHER_UUID",
    "eventId": "EVENT_UUID",
    "code": "EARLYBIRD10",
    "amount": 20000,
    "quota": 10,
    "startAt": "2026-04-20T00:00:00.000Z",
    "endAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### `GET /api/transactions/coupons/me`

Kegunaan:

- ambil coupon milik user login yang masih available
- cocok buat dropdown atau selector coupon di frontend

Expected input:

- params: none
- query: none
- body: none

Catatan:

- hanya return coupon yang belum dipakai dan belum expired
- endpoint ini dipakai frontend buat menampilkan pilihan coupon yang nanti dikirim sebagai `couponId`

Auth:

- bearer token wajib

Contoh:

```txt
GET /api/transactions/coupons/me
```

Response sukses:

```json
{
  "message": "Coupons fetched successfully",
  "data": [
    {
      "id": "COUPON_UUID",
      "userId": "USER_UUID",
      "amount": 10000,
      "source": "REFERRAL_REGISTER",
      "usedAt": null,
      "expiresAt": "2026-05-20T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/transactions/points/me`

Kegunaan:

- ambil total point available milik user login
- cocok buat toggle "use all points" di frontend

Expected input:

- params: none
- query: none
- body: none

Catatan:

- hanya menghitung point yang masih punya `pointLeft > 0`
- hanya menghitung point yang belum expired

Auth:

- bearer token wajib

Contoh:

```txt
GET /api/transactions/points/me
```

Response sukses:

```json
{
  "message": "Available points fetched successfully",
  "data": {
    "totalAvailablePoints": 20000
  }
}
```

### `PATCH /api/transactions/:id/payment-proof`

Kegunaan:

- upload bukti transfer milik user login

Expected input:

- params:
  - `id` UUID transaction id
- query: none
- body content type:
  - `multipart/form-data`
- form-data:
  - `paymentProof` file image

Catatan:

- hanya bisa dipakai oleh pemilik transaksi
- hanya bisa upload saat status `WAITING_FOR_PAYMENT`
- endpoint ini tidak bisa dipakai lagi setelah transaksi sudah masuk `WAITING_FOR_ADMIN_CONFIRMATION`
- setelah upload sukses, status transaksi menjadi `WAITING_FOR_ADMIN_CONFIRMATION`
- setelah upload sukses, `expiredAt` transaksi digeser menjadi `3 jam` dari waktu upload untuk window review organizer

Auth:

- bearer token wajib

Contoh:

```bash
curl -X PATCH "http://localhost:8080/api/transactions/TRANSACTION_UUID/payment-proof" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -F "paymentProof=@C:/temp/payment-proof.jpg"
```

Response sukses:

```json
{
  "message": "Payment proof uploaded successfully",
  "data": {
    "id": "TRANSACTION_UUID",
    "status": "WAITING_FOR_ADMIN_CONFIRMATION",
    "paymentProofUrl": "https://res.cloudinary.com/.../payment-proof.jpg",
    "paymentProofUploadedAt": "2026-04-30T02:00:00.000Z",
    "expiredAt": "2026-04-30T05:00:00.000Z"
  }
}
```

Response error yang umum:

- `400 Bad Request`

```json
{
  "message": "Transaction ID must be a valid UUID"
}
```

```json
{
  "message": "No file uploaded"
}
```

```json
{
  "message": "Invalid file type. Only JPG, PNG, and WEBP are allowed."
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `404 Not Found`

```json
{
  "message": "Transaction not found"
}
```

- `409 Conflict`

```json
{
  "message": "Transaction status can no longer be changed"
}
```

```json
{
  "message": "Transaction status has changed"
}
```

### `PATCH /api/transactions/:id/status`

Kegunaan:

- organizer atau admin review transaksi customer
- status yang diterima dari API mengikuti enum transaction yang sudah ada

Expected input:

- params:
  - `id` UUID transaction id
- query: none
- body:
  - `status` enum: `DONE` | `REJECTED`

Catatan:

- hanya organizer pemilik event atau admin yang bisa akses
- hanya transaksi dengan status `WAITING_FOR_ADMIN_CONFIRMATION` yang bisa direview
- transaksi yang sudah `DONE`, `REJECTED`, `EXPIRED`, atau `CANCELED` tidak bisa diubah lagi
- `DONE` dipakai sebagai status approve/final accepted
- `REJECTED` akan mengubah status database menjadi `REJECTED`
- saat `REJECTED`, quota ticket, voucher, coupon, dan point akan dibalikin
- saat `DONE`, ticket akan dibuat dan kode ticket dikirim lewat email
- frontend sebaiknya menampilkan `expiredAt` pada status `WAITING_FOR_ADMIN_CONFIRMATION` sebagai batas waktu follow-up organizer

Auth:

- bearer token wajib
- role `ORGANIZER` atau `ADMIN`

Contoh body:

```json
{
  "status": "DONE"
}
```

Contoh body reject:

```json
{
  "status": "REJECTED"
}
```

Response sukses approve:

```json
{
  "message": "Transaction status updated successfully",
  "data": {
    "id": "TRANSACTION_UUID",
    "status": "DONE"
  }
}
```

Response sukses rejected:

```json
{
  "message": "Transaction status updated successfully",
  "data": {
    "id": "TRANSACTION_UUID",
    "status": "REJECTED"
  }
}
```

Response error yang umum:

- `400 Bad Request`

```json
{
  "message": "Transaction ID must be a valid UUID"
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden"
}
```

```json
{
  "message": "You are not allowed to update this transaction status"
}
```

- `404 Not Found`

```json
{
  "message": "Transaction not found"
}
```

- `409 Conflict`

```json
{
  "message": "Transaction status can no longer be changed"
}
```

```json
{
  "message": "Transaction status has changed"
}
```

## Error Umum

Format error umum:

```json
{
  "message": "Unauthorized"
}
```

Message yang sering muncul:

- `Unauthorized`
- `Forbidden`
- `Route not found`
- `Event not found`
- `Banner image is required`
- `End date must be after start date`
- `Invalid file type. Only JPG, PNG, and WEBP are allowed.`
- `File too large`

## Testing Flow Cepat Buat Event

1. `POST /api/auth/login` sebagai organizer.
2. `GET /api/categories` untuk ambil category id.
3. `GET /api/locations/cities` untuk ambil city id.
4. `POST /api/event/organizer/:id` untuk create event.
5. `GET /api/event?organizerId=<organizer_id>` untuk cek event organizer.
6. `PUT /api/event/:id` untuk update event.
7. `DELETE /api/event/:id` untuk soft delete event.

## Testing Flow Cepat Buat Transaksi

1. `POST /api/auth/login` sebagai customer.
2. `GET /api/event?status=PUBLISHED` untuk ambil `eventId`.
3. `GET /api/event/:id` untuk lihat `ticketTypeId` yang mau dibeli.
4. Optional: `GET /api/transactions/vouchers/check` untuk cek voucher event.
5. Optional: `GET /api/transactions/coupons/me` untuk pilih coupon.
6. Optional: `GET /api/transactions/points/me` untuk tahu total point available.
7. `POST /api/transactions` untuk create transaksi.
8. `PATCH /api/transactions/:id/payment-proof` untuk upload bukti transfer.
9. `GET /api/transactions/me?status=WAITING_FOR_PAYMENT` atau `GET /api/transactions/me?status=WAITING_FOR_ADMIN_CONFIRMATION` untuk lihat ongoing transaction di profile beserta `expiredAt` terbarunya.

## Testing Flow Cepat Review Transaksi Organizer

1. `POST /api/auth/login` sebagai customer.
2. Buat transaksi dulu sampai status `WAITING_FOR_PAYMENT`.
3. `PATCH /api/transactions/:id/payment-proof` sebagai customer.
4. `POST /api/auth/login` sebagai organizer pemilik event.
5. `PATCH /api/transactions/:id/status` dengan body `{"status":"DONE"}` untuk approve.
6. Atau `PATCH /api/transactions/:id/status` dengan body `{"status":"REJECTED"}` untuk reject dan rollback resource.
7. `GET /api/transactions/organizer/me?status=WAITING_FOR_ADMIN_CONFIRMATION` untuk ambil inbox transaksi yang perlu direview organizer.
8. `GET /api/transactions/organizer/revenue?groupBy=month&year=2026` untuk grafik revenue organizer.

## Ticket Endpoints

### `GET /api/tickets/attendance-stats`

Kegunaan:

- ambil statistik attendance untuk satu event
- cocok buat card dashboard event seperti total tiket, total hadir, dan persentase kehadiran

Expected input:

- params: none
- body: none
- query:
  - `eventId` UUID

Catatan:

- endpoint ini lebih cocok untuk dashboard daripada disisipkan ke `meta GET /api/tickets`
- hanya bisa diakses oleh `ORGANIZER` pemilik event atau `ADMIN`
- statistik dihitung dari tabel tiket, jadi hanya tiket dari transaksi `DONE` yang akan ikut
- `attendancePercentage` dihitung dari `totalCheckedInTickets / totalTickets * 100`
- kalau `totalTickets = 0`, `attendancePercentage` akan bernilai `0`

Auth:

- bearer token wajib
- role `CUSTOMER`
- role `ORGANIZER` atau `ADMIN`

Contoh:

```txt
GET /api/tickets/attendance-stats?eventId=<event_uuid>
```

Response sukses:

```json
{
  "message": "Ticket attendance stats fetched successfully",
  "data": {
    "event": {
      "id": "EVENT_UUID",
      "name": "Derby Night",
      "venue": "Main Stadium",
      "startAt": "2026-05-10T19:00:00.000Z"
    },
    "totalTickets": 250,
    "totalCheckedInTickets": 175,
    "totalNotCheckedInTickets": 75,
    "attendancePercentage": 70
  }
}
```

### `GET /api/tickets`

Kegunaan:

- ambil list tiket dengan query yang fleksibel
- bisa dipakai untuk filter tiket yang sudah attending atau belum

Expected input:

- params: none
- body: none
- query possible:
  - `id` UUID ticket id
  - `organizerId` UUID
  - `transactionId` UUID
  - `transactionItemId` UUID
  - `eventId` UUID
  - `userId` UUID
  - `code` string exact match
  - `codeLike` string contains search
  - `eventNameLike` string contains search
  - `ticketTypeNameLike` string contains search
  - `checkedIn` boolean
  - `sortBy` enum: `code` | `checkedInAt` | `createdAt`
  - `sortOrder` enum: `asc` | `desc`
  - `page` number, default `1`
  - `limit` number, default `10`, max `100`

Catatan:

- tiket hanya akan ada kalau transaksi asalnya sudah `DONE`
- untuk role `CUSTOMER`, hasil otomatis dibatasi ke tiket milik user login
- untuk role `ORGANIZER`, hasil otomatis dibatasi ke tiket dari event milik organizer login
- untuk role `ADMIN`, semua tiket bisa diakses, dan query `organizerId` bisa dipakai untuk filter organizer tertentu
- semua query opsional
- query bisa digabung
- `codeLike`, `eventNameLike`, dan `ticketTypeNameLike` pakai contains case-insensitive
- `checkedIn=true` artinya hanya tiket yang sudah attendance
- `checkedIn=false` artinya hanya tiket yang belum attendance
- default sorting: `createdAt desc`

Auth:

- bearer token wajib

Contoh:

```txt
GET /api/tickets
GET /api/tickets?checkedIn=true
GET /api/tickets?checkedIn=false&eventId=<event_uuid>
GET /api/tickets?codeLike=TKT
GET /api/tickets?ticketTypeNameLike=vip&sortBy=checkedInAt&sortOrder=asc
GET /api/tickets?page=2&limit=20
```

Response sukses:

```json
{
  "message": "Tickets fetched successfully",
  "data": [
    {
      "id": "TICKET_UUID",
      "code": "TKTABC123456",
      "checkedInAt": null,
      "createdAt": "2026-04-30T07:00:00.000Z",
      "user": {
        "id": "USER_UUID",
        "email": "customer@mail.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "transaction": {
        "id": "TRANSACTION_UUID",
        "status": "DONE",
        "event": {
          "id": "EVENT_UUID",
          "name": "Derby Night",
          "organizerId": "ORGANIZER_UUID"
        }
      },
      "transactionItem": {
        "id": "TRANSACTION_ITEM_UUID",
        "ticketType": {
          "id": "TICKET_TYPE_UUID",
          "name": "VIP"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### `PATCH /api/tickets/check-in`

Kegunaan:

- verifikasi keaslian tiket berdasarkan `code`
- kalau tiket valid dan belum pernah dipakai, `checkedInAt` akan diisi dengan waktu sekarang

Expected input:

- params: none
- query: none
- body:
  - `code` string

Catatan:

- hanya bisa diakses oleh `ORGANIZER` atau `ADMIN`
- untuk role `ORGANIZER`, tiket hanya bisa diverifikasi kalau tiket itu berasal dari event milik organizer tersebut
- tiket harus ditemukan berdasarkan `code`
- tiket hanya bisa check-in kalau transaksi asalnya sudah `DONE`
- tiket yang sudah punya `checkedInAt` tidak bisa dipakai lagi
- pencarian kode tiket bersifat case-insensitive

Auth:

- bearer token wajib
- role `ORGANIZER` atau `ADMIN`

Contoh body:

```json
{
  "code": "TKTABC123456"
}
```

Response sukses:

```json
{
  "message": "Ticket checked in successfully",
  "data": {
    "id": "TICKET_UUID",
    "code": "TKTABC123456",
    "checkedInAt": "2026-04-30T08:15:00.000Z",
    "user": {
      "id": "USER_UUID",
      "firstName": "John",
      "lastName": "Doe",
      "email": "customer@mail.com"
    },
    "event": {
      "id": "EVENT_UUID",
      "name": "Derby Night",
      "venue": "Main Stadium",
      "startAt": "2026-05-10T19:00:00.000Z"
    },
    "ticketType": {
      "id": "TICKET_TYPE_UUID",
      "name": "VIP"
    }
  }
}
```

Response error yang umum:

- `400 Bad Request`

```json
{
  "message": "Ticket code is required"
}
```

- `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

- `403 Forbidden`

```json
{
  "message": "Forbidden"
}
```

```json
{
  "message": "You are not allowed to verify this ticket"
}
```

- `404 Not Found`

```json
{
  "message": "Ticket not found"
}
```

- `409 Conflict`

```json
{
  "message": "Ticket is not valid for check-in"
}
```

```json
{
  "message": "Ticket has already been checked in"
}
```

## File Terkait

- `src/app.ts`
- `src/modules/auth/*`
- `src/modules/user/*`
- `src/modules/event/*`
- `src/modules/location/*`
- `src/modules/category/*`
- `src/modules/transaction/*`
