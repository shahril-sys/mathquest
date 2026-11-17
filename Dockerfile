# MathQuest Adventure: tiada kebergantungan npm, hanya Node 22+ (node:sqlite terbina dalam)
FROM node:22-alpine
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
COPY migrations ./migrations
COPY scripts ./scripts
RUN addgroup -S mq && adduser -S mq -G mq && mkdir -p /data && chown mq:mq /data
USER mq
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.js"]
