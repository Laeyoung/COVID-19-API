FROM node:12
WORKDIR /workspace
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 80

CMD [ "node", "server.js" ]