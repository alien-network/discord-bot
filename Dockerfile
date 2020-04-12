FROM node:13-alpine

COPY . /home/node/app

WORKDIR /home/node/app

RUN yarn install --production

CMD ["node", "index"]