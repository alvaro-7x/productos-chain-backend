
FROM node:16-alpine
WORKDIR /app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

RUN npm install -g ganache-cli
EXPOSE 8545
EXPOSE 1337

COPY run.sh /run.sh
CMD sh /run.sh
