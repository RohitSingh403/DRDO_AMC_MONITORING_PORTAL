# AMC Desk

A personal full-stack rebuild of an AMC (Annual Maintenance Contract) monitoring desk. IT admins assign daily, weekly, and monthly checks. AMC personnel update status, time, remarks, and proof. The board turns green, orange, or red as work slips.

This is a portfolio project. It is not an official system.

## What the desk covers

Daily checks include AV, OS and Office activation, hardware, the CORONA, CIAG, DMZ, and NKN networks, cameras, UPS, server-room AC, a morning and evening biometric check, surveillance, VC setup, printers, and complaints.

Weekly checks cover the VC rooms, cables and fibre, switches, server-room disks, servers, cleaning, AVASYAM, and unauthorized devices.

Monthly checks are the firewall review and backup and restore.

Every task has a completion remark and a separate issue remark. Photos, screenshots, and PDFs can be attached. Open incidents and overdue work show as red. A finished task with an issue remark stays orange.

## Stack

- React, Vite, and Tailwind CSS
- Node.js, Express, and MongoDB (Mongoose)
- JWT auth with two roles: IT Admin and AMC Personnel

## Run it locally

MongoDB has to be listening on port 27017. With Docker:

```bash
docker compose up -d
```

Without Docker, start a local `mongod`, then:

```bash
cp server/.env.example server/.env
npm run install:all
npm run dev
```

The API listens on `http://localhost:5000`. The desk listens on `http://localhost:5173`.

`npm run dev` starts both. You can also run `npm run dev` inside `server/` and `client/` separately. `npm run seed` in the repo root reloads the demo data.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| IT Admin | admin@amc.local | Admin@123 |
| AMC Personnel | personnel@amc.local | Personnel@123 |

The login screen can sign in as either account.

## Alert rules

- **Green** — completed on time, or still inside the safe window.
- **Orange** — due soon (4 hours for daily, 24 for weekly, 72 for monthly), or completed with an issue remark.
- **Red** — overdue, completed after the due time, or tied to an unresolved incident.

Compliance on the dashboard is closed tasks divided by tasks that are already due. Work that is not due yet does not lower the percentage.

## Uploads

Proof files are stored in `server/uploads`. That folder is local disk. On Render the disk is wiped on every deploy and restart, so uploaded proof does not stick.

## Host on Render

One web service serves the desk and the API. Render does not provide MongoDB, so the database is a free MongoDB Atlas cluster. In Atlas, create a cluster, a database user, and a connection string, and allow access from anywhere (`0.0.0.0/0`).

On the New Web Service screen, use these values. Leave Root Directory empty.

| Field | Value |
| --- | --- |
| Name | `amc-desk` |
| Language | Node |
| Branch | `main` (after this hosting change is merged) |
| Region | Oregon (US West) |
| Root Directory | empty |
| Build Command | `npm ci --include=dev --prefix server && npm ci --include=dev --prefix client && npm run build --prefix client` |
| Start Command | `npm start --prefix server` |
| Health Check Path | `/api/health` (under Advanced) |
| Instance | Free, or the $7 plan if the site should stay awake |

Environment variables:

| Key | Value |
| --- | --- |
| `MONGODB_URI` | the Atlas connection string |
| `JWT_SECRET` | a long random string |
| `NODE_ENV` | `production` |
| `SEED` | `true` |

The first boot loads the demo accounts. Open the `onrender.com` URL and sign in from the login screen. The Free plan sleeps after about 15 minutes of no traffic; the first visit after that takes a little while to wake up.
