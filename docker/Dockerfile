FROM node:8-alpine

RUN apk add --update python make g++\
   && rm -rf /var/cache/apk/*
   
ARG APP_DIR=app
ARG BUILDER_DIR=bulder

RUN mkdir -p ${APP_DIR}
RUN mkdir -p ${BUILDER_DIR}

WORKDIR ${BUILDER_DIR}

COPY package*.json ./

RUN npm install

COPY . .

ENTRYPOINT ["npm", "run"]