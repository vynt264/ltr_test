# FROM node:18.12.0-alpine3.15 AS development
# WORKDIR /usr/src/app
# COPY package*.json yarn.lock ./
# RUN npm install yarn
# RUN yarn install
# RUN npm i exceljs
# COPY . .
# RUN yarn build

# FROM node:18.12.0-alpine3.15 as production
# # ARG NODE_ENV=production
# # ENV NODE_ENV=${NODE_ENV}
# # WORKDIR /usr/src/app
# # COPY package*.json ./
# # RUN npm install --only=production
# # COPY . .
# # COPY --from=development /usr/src/app/dist ./dist
# WORKDIR /usr/src/app
# COPY package*.json yarn.lock ./
# RUN npm install yarn
# RUN yarn install
# RUN npm i exceljs
# COPY . .
# RUN yarn build

# CMD ["node", "dist/main"]

FROM node:18.12.0-alpine3.15
WORKDIR /usr/src/app
COPY package*.json yarn.lock ./
RUN npm install yarn
RUN yarn install
RUN npm i exceljs
COPY . .
COPY .env.dev .env
RUN yarn build

CMD ["node", "dist/main"]