# Dockerfile for the Fragments Microservice
# This is a text file that will define all of the Docker instructions necessary 
# for Docker Engine to build an image of the Fragments Microservice.

# Stage 0: Install alpine Linux + node + dependencies
# Use node version 20.10.0
FROM node:20.10.0-alpine3.19@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 AS dependencies

# Use /app as our working directory
WORKDIR /app

# Option 1: explicit path - Copy the package.json and package-lock.json
# files into /app. NOTE: the trailing `/` on `/app/`, which tells Docker
# that `app` is a directory and not a file.
COPY package*.json /app/

# Install node devDependencies
RUN npm ci --production

#######################################################################

# Stage 1: Build the application
FROM node:20.10.0-alpine3.19@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 AS builder 

WORKDIR /app

# Copy cached dependencies from previous stage so we don't have to download
COPY --from=dependencies /app /app

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

#######################################################################

# Stage 2: Final Image with environment variables + health check
FROM node:20.10.0-alpine3.19@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 

LABEL maintainer="Zoey Lin <zlin104@myseneca.ca>" \
description="Fragments node.js microservice"

WORKDIR /app

#copy from builder
COPY --from=builder /app /app

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# We run our service on port 8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail localhost:8080 || exit 1

# Start the container by running our server
CMD ["npm", "start"]
