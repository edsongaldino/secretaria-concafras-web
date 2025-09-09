# Build Angular
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Nginx estático
FROM nginx:alpine
# Copie a conf em tempo de deploy (via volume), ou fixe uma default:
# COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/*/browser /usr/share/nginx/html