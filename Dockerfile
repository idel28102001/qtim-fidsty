FROM node:16-alpine

USER node
COPY --chown=node:node package*.json /var/www/backend/
WORKDIR /var/www/backend
RUN npm ci

COPY --chown=node:node . /var/www/backend
RUN npm run build
CMD npm run start:prod
