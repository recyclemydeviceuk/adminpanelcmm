# CashMyMobile Admin Panel

Standalone React admin panel for CashMyMobile, connecting to the Python/Node backend.

## Setup

```bash
cd adminpanel
npm install
cp .env.example .env
npm run dev
```

The app runs on **http://localhost:3001**

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `https://backend-cmm-m609.onrender.com/api` |

## Build for Production

```bash
npm run build
```

Output goes to `dist/`.

## Routes

| Path | Description |
|---|---|
| `/admin-cashmymobile/login` | OTP Login |
| `/admin-cashmymobile` | Dashboard |
| `/admin-cashmymobile/orders` | Orders list |
| `/admin-cashmymobile/orders/:id` | Order detail |
| `/admin-cashmymobile/devices` | Devices catalogue |
| `/admin-cashmymobile/devices/new` | Add device |
| `/admin-cashmymobile/devices/edit/:id` | Edit device |
| `/admin-cashmymobile/pricing` | Pricing feed |
| `/admin-cashmymobile/utilities` | Utilities config |
| `/admin-cashmymobile/api-gateway` | API gateway logs |
| `/admin-cashmymobile/partners` | Partner management |

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- React Router DOM 6
- Axios
- Lucide React icons
