FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
