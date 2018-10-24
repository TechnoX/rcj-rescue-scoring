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
    yum install nodejs -y

RUN mkdir -p /opt/rcj-scoring-system
WORKDIR /opt/rcj-scoring-system
RUN wget https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/package.json
RUN npm install
RUN npm install bower -g

RUN git clone https://github.com/rrrobo/rcj-rescue-scoring-japan /opt/rcj-scoring-system-tmp
RUN mv /opt/rcj-scoring-system-tmp/* /opt/rcj-scoring-system-tmp/.[^\.]* ./
RUN rm -R /opt/rcj-scoring-system-tmp
RUN ls -a
RUN bower install --allow-root
RUN mkdir logs

WORKDIR /
RUN mkdir /data/db -p
COPY ./docker/start.sh /start.sh
RUN chmod +x start.sh

RUN yum remove -y cmake wget

ENTRYPOINT ["/start.sh"]

EXPOSE 80
