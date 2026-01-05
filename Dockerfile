FROM node:24.12.0-bookworm-slim

RUN apt-get update -o Acquire::AllowInsecureRepositories=true \
  && apt-get install -y --no-install-recommends debian-archive-keyring ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

CMD ["npm", "run", "start"]


