# Use the official Node.js image.
FROM node:18

# Set the working directory in the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json.
COPY package*.json ./

# Install the application's dependencies.
RUN npm install

# Copy the application code.
COPY . .

# Expose the port the app runs on.
EXPOSE 3000

# Command to run the application.
CMD [ "npm", "start" ]