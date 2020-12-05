FROM node:15.3-alpine

WORKDIR /home/node/app

COPY . .

RUN yarn install --production

CMD ["node", "index"]
