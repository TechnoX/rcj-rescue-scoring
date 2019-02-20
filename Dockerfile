FROM ryorobo/rcj-scoring-base:latest
MAINTAINER ryorobo <rrrobo@icloud.com>

RUN mv ~/* ~/.[^\.]* ./
WORKDIR /opt/rcj-scoring-system
RUN ls -a

RUN npm run build