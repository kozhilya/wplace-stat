# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Install webpack globally
RUN npm install -g webpack

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies and keep only production
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
