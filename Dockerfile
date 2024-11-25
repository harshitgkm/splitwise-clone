# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy application files
COPY package.json package-lock.json ./
COPY src ./src

# Install dependencies
RUN npm install

# Expose application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
