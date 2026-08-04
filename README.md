# Lottery Management System

## Project Structure

```text
LOTTERY-MANAGEMENT-SYSTEM
├── frontend
│   ├── node_modules
│   ├── public
│   └── src
│       ├── api
│       ├── assets
│       ├── components
│       ├── hooks
│       ├── layouts
│       ├── pages
│       │   ├── admin
│       │   ├── auth
│       │   ├── player
│       │   └── public
│       ├── routes
│       ├── services
│       ├── store
│       ├── types
│       └── utils
├── netlify
│   └── functions
│       ├── auth
│       ├── db
│       ├── middleware
│       ├── players
│       ├── reports
│       ├── results
│       ├── settings
│       ├── tickets
│       ├── users
│       ├── utils
│       └── wallet
├── node_modules
├── .env
├── netlify.toml
├── package.json
└── README.md
```

## Technology

Frontend:

- React 19
- TypeScript
- Vite
- Tailwind CSS

Backend:

- Netlify Functions
- Node.js

Database:

- MongoDB Atlas

## Run Project

Install:

npm install

Start:

npm run dev

npm install -g netlify-cli

netlify dev

## Deployment

Deploy using Netlify.

#Running Locally
npm install
cd frontend
npm install
cd ..
