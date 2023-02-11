FROM node:19.6-alpine3.16

WORKDIR /home/node/app

COPY . .

RUN yarn install --production --non-interactive --ignore-optional && yarn cache clean --all

CMD ["node", "index"]
