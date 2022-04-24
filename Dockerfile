FROM node:17.9-alpine3.15

WORKDIR /home/node/app

COPY . .

RUN yarn install --production --non-interactive --ignore-optional && yarn cache clean --all

CMD ["node", "index"]
