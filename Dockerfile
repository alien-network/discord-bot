FROM node:16.8.0-alpine3.14

WORKDIR /home/node/app

COPY . .

RUN yarn install --production --non-interactive --ignore-optional && yarn cache clean --all

CMD ["node", "index"]
