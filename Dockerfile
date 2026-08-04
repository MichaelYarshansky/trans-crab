# ---- stage 1: package the extension ----
FROM alpine:3.20 AS packager

RUN apk add --no-cache zip

WORKDIR /src
COPY manifest.json background.js content.js popup.js popup.html styles.css ./
COPY crab-icon.png crab-icon16.png ./
COPY docker/index.html /page/index.html

# Zip only the extension itself, then stamp the manifest version into the page.
RUN zip -q -r /trans-crab.zip . && \
    VERSION="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -1)" && \
    test -n "$VERSION" && \
    sed -i "s/__VERSION__/${VERSION}/g" /page/index.html && \
    echo "packaged Trans-Crab ${VERSION}"

# ---- stage 2: serve it ----
FROM nginx:alpine

LABEL org.opencontainers.image.title="Trans-Crab" \
      org.opencontainers.image.description="Chrome extension that transcribes Google Meet and Zoom calls" \
      org.opencontainers.image.source="https://github.com/MichaelYarshansky/trans-crab"

WORKDIR /usr/share/nginx/html
RUN rm -f index.html 50x.html

COPY --from=packager /page/index.html ./index.html
COPY --from=packager /trans-crab.zip ./trans-crab.zip
COPY crab-icon16.png ./crab-icon16.png

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO /dev/null http://localhost/ || exit 1
