FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
COPY aichat-dist /var/www/aichat

EXPOSE 80
EXPOSE 443
