FROM node:14.17.6-alpine3.12

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ./package.json ./

RUN npm install
COPY . .

CMD ["node", "app.js"]
