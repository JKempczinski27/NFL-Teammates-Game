# Use official Node.js 22 image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev

# Copy application files
COPY . .

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Start the application (start.js will initialize DB and then start server)
CMD ["node", "start.js"]
