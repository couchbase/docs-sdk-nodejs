.PHONY: build

CB_EDITION ?=couchbase/server:enterprise
CB_BUILD ?=7.0.0
LOCAL_IMAGE_NAME=cb7-sdk3-nodejs-ub20

TEST_NAME=""

NODE_SDK_VERSION ?="3.2.0"

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

# Utility script to update the couchbase versions for all code examples.
# Avoids having to manually change each package.json file in every examples directory.
update-versions:
	$(info ************ UPDATING DOC EXAMPLE VERSIONS ************)
	@./test/scripts/update-versions.sh devguide/examples/nodejs ${NODE_SDK_VERSION}
	@./test/scripts/update-versions.sh hello-world/examples ${NODE_SDK_VERSION}
	@./test/scripts/update-versions.sh howtos/examples ${NODE_SDK_VERSION}
	# no examples in project-docs yet (could change in future)
	# @./test/scripts/update-versions.sh project-docs/examples ${NODE_SDK_VERSION}
	# no examples in concept-docs yet (could change in future)
	# @./test/scripts/update-versions.sh concept-docs/examples ${NODE_SDK_VERSION}


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

# Run all tests
tests:
	@docker exec -t cb-test bin/bash -c "cd modules && npm i && bats -T ./test"

# Run a single test
# i.e make TEST_NAME="startusing.js" single-test
single-test:
	@docker exec -t cb-test bin/bash -c "cd modules && npm i && bats -T ./test -f ${TEST_NAME}"
	
# Stop the server container
cb-stop:
	@docker stop cb-test
