FROM ubuntu:18.04

ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

WORKDIR /etc/apache2

COPY . .

COPY html /var/www/html

RUN apt-get update \
      && apt-get install software-properties-common; \
    add-apt-repository ppa:ondrej/php; \
    apt-get update \
      && apt-get install -y --no-install-recommends \
          nano \
          apache2 \
          php7.2 php-gettext php-xdebug libapache2-mod-php7.2 php-sqlite3; \
    a2enmod rewrite php7.2 \
      && a2dissite 000-default \
      && a2enconf othellomap \
      && a2ensite othellomap; \
    apt-get purge -y --auto-remove $buildDeps; \
    rm -r /var/lib/apt/lists/*;

CMD apachectl -D FOREGROUND
