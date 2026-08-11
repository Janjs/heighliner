FROM node:22-alpine AS dependencies
WORKDIR /website
COPY website/package.json website/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /website
COPY --from=dependencies /website/node_modules ./node_modules
COPY website ./
RUN npm run build

FROM node:22-alpine
WORKDIR /website
ENV NODE_ENV=production
COPY --from=build /website ./
EXPOSE 3000
CMD ["npm", "run", "start"]
