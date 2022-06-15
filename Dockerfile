FROM node:16.14.2-alpine3.15
RUN apk --no-cache add --virtual .builds-deps build-base python3

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ./package.json ./

RUN npm install && npm rebuild bcrypt --build-from-source && npm cache clean --force
COPY . .

CMD ["npm", "run", "start"]
