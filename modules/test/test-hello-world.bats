# #!./test/libs/bats/bin/bats

load 'test/test_helper.bash'

@test "[hello-world] - start-using.js" {
    runExample $HELLO_WORLD_DIR start-using.js
    assert_success

    assert_output --partial <<-EOF
GetResult {
  content: {
    type: 'airline',
    id: 8091,
    callsign: 'CBS',
    iata: null,
    icao: null,
    name: 'Couchbase Airways'
  },
EOF
}
