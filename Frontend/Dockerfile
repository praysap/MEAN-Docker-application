# Stage 1: Build the React app
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Accept build-time environment variable
#ARG REACT_APP_API_BASE_URL
#ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Copy and install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy the entire app source
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Serve the build using Nginx
FROM nginx:alpine

# Remove the default Nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy build output from previous stage
#COPY --from=build /app/build /usr/share/nginx/html

COPY --from=build /app/dist/demo /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf


# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

