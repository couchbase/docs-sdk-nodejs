# #!./test/libs/bats/bin/bats

load 'test/test_helper.bash'

@test "[hello-world] - start-using.js" {
    runExample $HELLO_WORLD_DIR start-using.js
    assert_success

    EXPECTED_GET_OUTPUT=$(cat <<-EOF
Upsert Result:
{
  cas: CbCas { '0': <Buffer 00 00 13 13 f4 32 10 16> },
  token: CbMutationToken {
    '0': <Buffer cc 6d 45 09 c2 ce 00 00 2c 00 00 00 00 00 00 00 a9 03 00 00 00 00 00 00 74 72 61 76 65 6c 2d 73 61 6d 70 6c 65 00 00 00 50 6b bf ef fe 7f 00 00 28 2e ... 230 more bytes>
  }
}
Get Result:
{
  cas: CbCas { '0': <Buffer 00 00 13 13 f4 32 10 16> },
  value: {
    type: 'airline',
    id: 8091,
    callsign: 'CBS',
    iata: null,
    icao: null,
    name: 'Couchbase Airways'
  }
}
EOF
)
    assert_output --partial "$EXPECTED_JSON_OUTPUT"
}
