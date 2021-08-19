#!/bin/bash

EXAMPLES_DIR=$1

SDK_VERSION=$2

# exit immediately if a command fails or if there are unset vars
set -euo pipefail

cd ${EXAMPLES_DIR}

# Sets couchbase version to what has been provided.
# NOTE: Does nothing if the version is the same as the default.
rm -fr node_modules
npm install couchbase@${SDK_VERSION} --save
