#!/bin/bash

# exit immediately if a command fails or if there are unset vars
set -euo pipefail

EXAMPLES_DIR=$1

cd ${EXAMPLES_DIR}

echo "-- Building .js files in directory ==> ${EXAMPLES_DIR}"
for i in *.js; do
	[ -f "$i" ] || break

	echo "Building file: ${i}"
	node --check ${i}
done

echo "-- Building .ts files in directory ==> ${EXAMPLES_DIR}"
# Do not emit compiler output files (i.e transpiled JS),
# we just want to check the Typescript files can compile.
tsc --noEmit
