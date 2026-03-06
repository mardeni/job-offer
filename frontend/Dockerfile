FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html-template

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env-replace.sh

RUN chmod +x /docker-entrypoint.d/40-env-replace.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
