FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the application
RUN npm run build

# Expose port (Vite preview is 4173, or use serve/nginx)
# For simplicity in this bonus task, we'll use vite preview
EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
