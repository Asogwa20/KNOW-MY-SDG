# SDG / Climate Learning Hub

This project is now a hostable full-stack app.

## Run Locally

```bash
npm start
```

Then open:

- SDG Hub: http://localhost:3000/SDGs/FRONT%20END/HOME/index.html
- Climate Hub: http://localhost:3000/CLIMATE/FRONT%20END/HOME/index.html

The server also redirects `/` to the SDG home page.

## Backend

The backend is `server.js`. It uses only built-in Node.js modules, so there are no packages to install.

It provides:

- signup and login with hashed passwords
- token-based sessions
- shared users and leaderboard data
- score saving for quiz, challenge, and puzzle
- avatar saving
- SDG notifications, friend challenges, teams, and learn progress
- static hosting for both frontend folders

Data is stored in `data/db.json`. That folder is ignored by git.

## Hosting

Use any Node host such as Render, Railway, Fly.io, or a VPS.

Recommended settings:

- Build command: leave blank or use `npm install`
- Start command: `npm start`
- Environment variable: set `APP_SECRET` to a long random secret

The host should provide `PORT`; the server reads it automatically.

## API Health Check

```bash
curl http://localhost:3000/api/health
```
