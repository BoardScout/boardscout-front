FROM busybox:1.37-musl

WORKDIR /www
COPY public /www

EXPOSE 4173

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:4173/index.html > /dev/null || exit 1

CMD ["httpd", "-f", "-p", "4173", "-h", "/www"]

