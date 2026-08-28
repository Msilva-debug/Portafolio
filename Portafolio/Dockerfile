FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-portfolio-config.sh /docker-entrypoint.d/40-portfolio-config.sh
RUN chmod +x /docker-entrypoint.d/40-portfolio-config.sh
COPY --from=build /app/dist/Portafolio/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
