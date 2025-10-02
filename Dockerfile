FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies first
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

EXPOSE 4200

# Run Angular dev server binding to all interfaces (for Docker)
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]