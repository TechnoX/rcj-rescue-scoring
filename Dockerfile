FROM ryorobo/rcj-scoring-base:latest
MAINTAINER ryorobo <rrrobo@icloud.com>

RUN pwd
RUN ls -a
RUN mv ~/* ~/.[^\.]* /opt/rcj-scoring-system/
WORKDIR /opt/rcj-scoring-system
RUN ls -a

RUN npm run build

ENTRYPOINT ["/start.sh"]

EXPOSE 80