# Use the official stable Node.js image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies first (caching layer)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy all project files into the container
COPY . .

# Set default port to 7860 (required by Hugging Face Spaces)
ENV PORT=7860
EXPOSE 7860

# Start the Express server
CMD ["node", "api/server.js"]
