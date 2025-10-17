FROM node:24-alpine

RUN apk add --no-cache git

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ./package.json ./

RUN npm install
COPY . .

CMD ["npm", "run", "start"]
