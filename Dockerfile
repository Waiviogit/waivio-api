FROM node:24.12.0-bookworm-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

CMD ["npm", "run", "start"]


