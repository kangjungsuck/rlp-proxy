# Use an official Node.js runtime as a builder
FROM node:16.14.2 as builder

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm run build

# Use a smaller Node.js image for the runtime
FROM node:16.14.2-alpine

WORKDIR /app

# Copy the built app from the builder
COPY --from=builder /app .

CMD [ "npm", "run", "start" ]