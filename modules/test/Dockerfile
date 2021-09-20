ARG CB_EDITION=couchbase/server:enterprise
ARG CB_BUILD=7.0.0
ARG CB_IMAGE=$CB_EDITION-$CB_BUILD

# SDK related images...

FROM node AS node

FROM $CB_IMAGE

RUN apt-get update && \
	apt-get install -y \
	curl wget jq psmisc git \
	build-essential cmake libssl-dev \
	vim python3.9

RUN ln -s /usr/bin/python3.9 /usr/bin/python 

# ------------------------------------------------------

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/include/node /usr/local/include/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules

RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
	node --version && \
	npm --version

# Copy init-couchbase files into image.

RUN mkdir -p /init-couchbase
COPY test/scripts/init-couchbase /init-couchbase
RUN chmod +x /init-couchbase/*.sh

# Append to /opt/couchbase/etc/couchbase/static_config...

RUN if [ ! -d /opt/couchbase/etc/couchbase ]; then mkdir -p /opt/couchbase/etc/couchbase; fi \
	&& cat /init-couchbase/init-static-config.txt >> \
	/opt/couchbase/etc/couchbase/static_config

# Install typescript and ts-node utility to run .ts files.
RUN npm install -g typescript ts-node
