# Simple Dockerfile for admin app
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY admin/package.json ./
COPY admin/package-lock.json ./

# Install dependencies
RUN npm install

# Remove the csv-import-react package if it exists
RUN rm -rf ./node_modules/csv-import-react

# Create the directory structure for the csv-import-react package
RUN mkdir -p ./node_modules/csv-import-react/build

# Copy the pre-built frontend package
# Note: These files should be built locally before running docker build
COPY frontend/package.json ./node_modules/csv-import-react/
COPY frontend/build/ ./node_modules/csv-import-react/build/

# Copy admin source files (after handling node_modules)
COPY admin/ ./

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]