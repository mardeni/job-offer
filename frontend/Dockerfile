FROM node:18-alpine as build

WORKDIR /app

ARG REACT_APP_API_URL=http://localhost:5000
ARG REACT_APP_REQUIRE_MOBILE=true
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_REQUIRE_MOBILE=$REACT_APP_REQUIRE_MOBILE

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
