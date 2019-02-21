FROM centos:7
MAINTAINER ryorobo <rrrobo@icloud.com>

COPY ./docker/nginx.repo /etc/yum.repos.d/nginx.repo
COPY ./docker/mongodb.repo /etc/yum.repos.d/mongodb.repo
COPY ./docker/nginx.conf /etc/nginx/nginx.conf

RUN set -x && \
    yum update -y && \
    yum install -y nginx mongodb-org && \
    yum install gcc-c++ make cmake git python wget -y && \
    curl -sL https://rpm.nodesource.com/setup_10.x | bash - && \
    yum install nodejs -y && \
    mkdir -p /opt/rcj-scoring-system

WORKDIR /opt/rcj-scoring-system

RUN wget https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/package.json && \
    npm install && \
    npm install bower -g && \
    npm install workbox-cli -g && \
    git clone https://github.com/rrrobo/rcj-rescue-scoring-japan /opt/rcj-scoring-system-tmp && \
    mv /opt/rcj-scoring-system-tmp/* /opt/rcj-scoring-system-tmp/.[^\.]* ./ && \
    rm -R /opt/rcj-scoring-system-tmp && \
    bower install --allow-root && \
    mkdir logs

WORKDIR /
COPY ./docker/start.sh /start.sh
RUN mkdir /data/db -p && \
    chmod +x start.sh && \
    yum remove -y cmake wget

ENTRYPOINT ["/start.sh"]

EXPOSE 80
