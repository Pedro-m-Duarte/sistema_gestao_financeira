# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /workspace

# Install global dependencies (if needed)
RUN npm install -g npm@latest

# Copy package.json and package-lock.json for each microfrontend
COPY dashboard/package.json dashboard/package-lock.json ./dashboard/
COPY navbar/package.json navbar/package-lock.json ./navbar/
COPY orchestrator/package.json orchestrator/package-lock.json ./orchestrator/
COPY painelControl/package.json painelControl/package-lock.json ./painelControl/

COPY ./ .

# Install dependencies for each microfrontend
RUN cd dashboard && npm install
RUN cd navbar && npm install
RUN cd orchestrator && npm install
RUN cd painelControl && npm install

# Expose ports for each microfrontend
# EXPOSE 3000 3001 3002 3003

# Default command (can be overridden in compose.yaml)
CMD ["bash"]