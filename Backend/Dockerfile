FROM node:18
WORKDIR /Backend
COPY package*.json ./
RUN npm install --force
COPY . .
ENV NODE_ENV production
EXPOSE 3000
CMD ["node", "index.js"]
