FROM node:12-alpine
WORKDIR /workspace
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 80

CMD [ "node", "server.js" ]