FROM node:24.12.0-alpine3.23

RUN apk add --no-cache git

WORKDIR /usr/src/app

COPY ./package.json ./

RUN npm install
COPY . .

CMD ["npm", "run", "start"]

