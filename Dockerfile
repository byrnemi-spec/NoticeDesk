# NoticeDesk production image (used by Railway automatically when this file exists).
# Full (non-slim) Debian image: already includes OpenSSL (required by Prisma)
# and CA certificates, so nothing extra has to be installed.
FROM node:22-bookworm

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies (postinstall runs `prisma generate`, which needs the schema).
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Build the app.
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
# Checks env vars, applies migrations, seeds demo data, then starts Next.js on $PORT.
CMD ["npm", "start"]
