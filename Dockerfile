# Stage 1: Build the React frontend
FROM node:18 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Express backend + React static assets
FROM node:18

# Set the working directory in the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json.
COPY package*.json ./

# Install the application's dependencies.
RUN npm install

# Copy the application code.
COPY . .

# Copy the React build output from Stage 1
COPY --from=client-build /app/client/dist ./client/dist

# Expose the port the app runs on.
EXPOSE 3000

# Command to run the application.
CMD [ "npm", "start" ]