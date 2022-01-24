setup() {
	DEVGUIDE_DIR=../modules/devguide/examples/nodejs
	HOWTOS_DIR=../modules/howtos/examples
	PROJECT_DOCS_DIR=../modules/project-docs/examples
	HELLO_WORLD_DIR=../modules/hello-world/examples
	CONCEPT_DOCS_DIR=../modules/concept-docs/examples

	# Loads bats libraries from the Docker container `/` directory.
	load '../../node_modules/bats-support/load'
	load '../../node_modules/bats-assert/load'
}

function runExample() {
	cd $1
	run node $2
}

function runTSExample() {
	cd $1
	run ts-node $2
}
