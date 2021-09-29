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

@test "[hello-world] - start-using-ottoman.js" {
    runExample $HELLO_WORLD_DIR start-using-ottoman.js
    assert_success

    # Check output for save[] snippet
    assert_output --partial "Success: airline Couchbase Airways 1 added!"

    # Check output for find[] snippet
    assert_output --partial <<-EOF
Query Result:  [
  _Model {
    callsign: 'CBS',
    iata: 'CBIATA',
    icao: 'CBICAO',
    id: 8091,
    name: 'Couchbase Airways 1',
    type: 'airline'
  }
]
EOF
}
