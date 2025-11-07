# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (frontend only)
RUN npm run build

# Install serve to serve static files
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 3001

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "3001"]
