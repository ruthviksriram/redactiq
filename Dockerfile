# Stage 1: Build the client-side SPA bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies strictly from package-lock
COPY package*.json ./
RUN npm ci

# Copy source and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve using hardened, lightweight Nginx on Cloud Run port 8080
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy production nginx configuration with zero-trust headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run defaults to container port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
