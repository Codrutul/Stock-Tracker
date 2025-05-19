FROM node:18

WORKDIR /usr/src/app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Run the database initialization script (make sure it's idempotent!)
# Ensure DATABASE_URL is available as an environment variable during build on Render.
RUN node scripts/init-db.js

# Make the entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 5001

# Set the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

# Default command
CMD ["node", "server.js"] 