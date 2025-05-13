FROM node:22.13.1-alpine3.20

RUN apk add --no-cache git

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ./package.json ./

RUN npm install
COPY . .

CMD ["npm", "run", "start"]
