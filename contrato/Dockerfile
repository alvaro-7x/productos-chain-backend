
FROM node:16-alpine
WORKDIR /app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

RUN npm install -g truffle

COPY run.sh /run.sh
CMD sh /run.sh
