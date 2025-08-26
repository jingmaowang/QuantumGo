FROM node:alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

# 复制源代码，但排除 node_modules
COPY . .
# 删除可能存在的 node_modules 目录，重新安装
RUN rm -rf node_modules && pnpm install

RUN pnpm build

FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 