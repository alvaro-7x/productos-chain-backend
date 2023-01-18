
FROM node:15-alpine
WORKDIR /app

ARG NODE_ENV development
ENV NODE_ENV $NODE_ENV

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT 4001
EXPOSE $PORT

COPY run.sh /run.sh
CMD sh /run.sh

# CMD [ "npm", "start" ]
