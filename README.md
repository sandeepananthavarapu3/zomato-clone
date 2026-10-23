# Food Delivery App — Zomato Clone

A learning project with React Native/Expo apps for customers, restaurant partners, delivery partners, and administrators, plus a Node.js/Express backend.

## Features implemented in the source

- Restaurant browsing, search, cart, checkout, and order tracking
- Axios API integration and TanStack Query for server data
- Zustand client state
- Socket.IO subscriptions for driver-location updates
- Separate customer, restaurant, delivery, and admin interfaces

## Structure

- `mobile/`: customer app
- `restaurant-mobile/`: restaurant app
- `delivery-mobile/`: delivery app
- `admin-mobile/`: administration app
- `server/`: Express, MongoDB, and Socket.IO backend

## Local setup

Install Node.js and npm, then install dependencies separately in each app you want to run.

```bash
cd server
npm ci
cp .env.example .env
# Fill in your local settings and secrets.
npm run dev
```

In another terminal:

```bash
cd mobile
npm ci
npm start
```

Use the same commands inside another mobile app directory to start that app. Client API and socket services currently use localhost:5000; replace this with your computer's reachable address when using a physical phone. Search the app source for `localhost:5000` to locate the configuration.

## Project status

This is a development/portfolio project, not an official Zomato product. Local development configuration and demo data require review before any production deployment. This repository preparation did not validate every feature end to end.

Private environment files, local database contents, dependencies, and build outputs are excluded. Use your own credentials; never commit `.env` files.
