FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S snakechess -u 1001

# Change ownership
RUN chown -R snakechess:nodejs /app
USER snakechess

EXPOSE 3000

CMD ["npm", "start"]
