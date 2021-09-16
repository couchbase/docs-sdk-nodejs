.PHONY: build

CB_EDITION ?=couchbase/server:enterprise
CB_BUILD ?=7.0.0
LOCAL_IMAGE_NAME=cb7-sdk3-nodejs-ub20

TEST_NAME=""

# --------------------------
# BUILD
# --------------------------
build:
	$(info ************ BUILDING DOC EXAMPLES ************)
	@./test/scripts/build-examples.sh hello-world/examples
	@./test/scripts/build-examples.sh howtos/examples
	# no examples in project-docs yet (could change in future)
	# @./test/scripts/build-examples.sh project-docs/examples
	@./test/scripts/build-examples.sh devguide/examples/nodejs
	# no examples in concept-docs yet (could change in future)
	# @./test/scripts/build-examples.sh concept-docs/examples

# -------------------------------------------
# DOCKER
# -------------------------------------------
cb-build:
	@docker build --build-arg CB_EDITION=${CB_EDITION} --build-arg CB_BUILD=${CB_BUILD} -t ${LOCAL_IMAGE_NAME} -f test/Dockerfile .

# Run couchbase server+sdk container. Note that this runs with the `-rm` option, 
# which will ensure the container is deleted when stopped.
cb-start:
	@rm -fr node_modules
	@docker run -t --rm -v ${PWD}:/modules -d --name cb-test -p 8091-8096:8091-8096 ${LOCAL_IMAGE_NAME}
	@docker exec -t cb-test bin/bash -c "/init-couchbase/init.sh"
	@docker exec -t cb-test bin/bash -c "/init-couchbase/init-buckets.sh"

# Install npm dependencies for docker container
npm-deps:
	@docker cp ../package.json cb-test:/package.json
	@docker cp ../package-lock.json cb-test:/package-lock.json
	@docker exec -t cb-test bin/bash -c "npm i"

# Run all tests
tests: npm-deps
	@docker exec -t cb-test bin/bash -c "cd modules && bats -T ./test"

# Run a single test
# i.e make TEST_NAME="startusing.js" single-test
single-test: npm-deps
	@docker exec -t cb-test bin/bash -c "cd modules && bats -T ./test -f ${TEST_NAME}"
	
# Stop the server container
cb-stop:
	@docker stop cb-test
