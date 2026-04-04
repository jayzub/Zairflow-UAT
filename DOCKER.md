# Docker Setup

This guide explains how to run the Zairflow e-commerce platform using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start (with MongoDB Atlas)

If you use **MongoDB Atlas**, your existing `.env` is used automatically:

1. Ensure `.env` has your Atlas connection string:
   ```
   DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/yourdb?retryWrites=true&w=majority
   JWT_SECRET=your-secret
   CLOUDINARY_CLOUD_NAME=...
   # etc.
   ```

2. **Build and run** (app + Redis only; MongoDB Atlas is used for DB):
   ```bash
   docker compose up --build
   ```

3. **Access the application** at http://localhost:3001

## Quick Start (with local MongoDB)

To use the bundled MongoDB container instead of Atlas:

```bash
docker compose --profile local up --build
```

This starts app, Redis, and MongoDB.

---

Docker Compose will start:
- **App** – Node.js server on port 3001 (loads vars from `.env`)
- **Redis** – Cache on port 6379
- **MongoDB** *(optional)* – Only with `--profile local`

## Environment Variables

| Variable    | Description                         | Default                          |
|------------|-------------------------------------|----------------------------------|
| `DB_URL`   | MongoDB connection string           | `mongodb://mongo:27017/griffin`  |
| `JWT_SECRET` | Secret for JWT signing            | *(must set for production)*      |
| `REDIS_URL` | Redis connection string            | `redis://redis:6379`             |
| `API_URL`  | API base path                       | `/api`                           |

For production, set `JWT_SECRET` via your `.env` file or environment:

```bash
export JWT_SECRET=$(openssl rand -hex 32)
```

## Using MongoDB Atlas

Docker Compose loads your `.env` file. Set `DB_URL` to your Atlas connection string:

```
DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/yourdb?retryWrites=true&w=majority
```

Then run `docker compose up`—the app connects to Atlas. No local MongoDB container is started.

## Building the Image Only

```bash
docker build -t griffin .
docker run -p 3001:3001 \
  -e DB_URL=mongodb://host.docker.internal:27017/griffin \
  -e JWT_SECRET=your-secret \
  griffin
```

## Development with Docker

For local development with hot reload, you can mount the source and use nodemon:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

*(Add a `docker-compose.dev.yml` with volume mounts if needed.)*
