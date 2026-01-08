FROM node:18

WORKDIR /app

# copy workspace files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

# install dependencies
RUN npm install

# build all workspaces
RUN npm run build

# expose ports for all services
EXPOSE 3000 3003 4000

# start all services (API + frontend previews)
WORKDIR /app
CMD ["npm", "start"]

