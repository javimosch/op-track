# Dockerfile
FROM node:20.10.0-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the client for production
ENV NODE_ENV=production
RUN NODE_ENV=production npm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]