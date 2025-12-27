# Deployment Guide

> **Testing locally?** See [LOCAL_BUILD_TESTING.md](./LOCAL_BUILD_TESTING.md) for testing production builds on your machine.

## Environment Variables

### API Server (`apps/api`)

```bash
# Required
PORT=4000              # Server port
HOST=0.0.0.0          # Bind to all interfaces (Docker/K8s)
JWT_SECRET=your-secret # Change in production!

# Optional
DATABASE_URL=file:./src/db/data.db
```

### Frontend Apps (`apps/client-portal`, `apps/internal-portal`)

**Development only:**
```bash
VITE_API_URL=http://localhost:4000  # API URL for dev proxy
```

**Production:** Frontend apps are built as static files. API calls should be proxied by your web server (nginx/apache).

## Docker Deployment

### 1. API Server (Dockerfile)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=4000
ENV JWT_SECRET=change-me-in-production

EXPOSE 4000
CMD ["npm", "start"]
```

### 2. Frontend (Dockerfile)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### 3. docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: ./apps/api
    ports:
      - "4000:4000"
    environment:
      - HOST=0.0.0.0
      - PORT=4000
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/src/db

  client-portal:
    build: ./apps/client-portal
    ports:
      - "3000:80"
    depends_on:
      - api

  internal-portal:
    build: ./apps/internal-portal
    ports:
      - "3001:80"
    depends_on:
      - api
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://api:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy uploads
    location /uploads/ {
        proxy_pass http://api:4000;
    }
}
```

## Kubernetes Deployment

### API Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: your-registry/api:latest
        ports:
        - containerPort: 4000
        env:
        - name: HOST
          value: "0.0.0.0"
        - name: PORT
          value: "4000"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
  - port: 4000
    targetPort: 4000
```

## Important Notes

1. **Never commit `.env` files** with secrets to git
2. **Change JWT_SECRET** in production
3. **Use proper secret management** (K8s secrets, AWS Secrets Manager, etc.)
4. **Frontend builds** are static - API URL is handled by reverse proxy
5. **Database** should be persistent (volume mounts, managed DB)
6. **CORS** is currently wide open - restrict in production

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| API Host | `localhost` | `0.0.0.0` |
| Frontend | Vite dev server with proxy | Built static files with nginx |
| API URL | `http://localhost:4000` | Proxied by nginx/ingress |
| Database | SQLite file | Persistent volume/managed DB |
| Secrets | `.env` file | Secret management system |
