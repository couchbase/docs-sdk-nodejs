# #!./test/libs/bats/bin/bats

load 'test/test_helper.bash'

@test "[howtos] - analytics.js" {
    runExample $HOWTOS_DIR analytics.js
    assert_success
}

@test "[howtos] - auth.js" {
    runExample $HOWTOS_DIR auth.js
    assert_success

    # Expected error for tag::alt-addresses[]
    assert_output --partial "[alt-addresses] requires an alternate address"
    # Expected error for tag::tls-cacert[]
    assert_output --partial "[tls-cacert] requires a valid certificate"
    # Expected error for tag::cert-auth[]
    assert_output --partial "[cert-auth] requires a valid certificate"
}

@test "[howtos] - collection-manager.js" {
    runExample $HOWTOS_DIR collection-manager.js
    assert_success
}

@test "[howtos] - error-handling.js" {
    runExample $HOWTOS_DIR error-handling.js
    assert_success

    # Expected error for tag::notfound[]
    assert_output --partial "the document is missing"

    # Expected error for tag::exists[]
    assert_output --partial "document unexpectedly exists"
}

@test "[howtos] - fle.js" {
    # It's unclear how to import the cbfieldcrypt V2 library because it has not been published.
    # The required files to import the library are not transpiled to JS (even when importing the master branch version).
    # Once the V2 library is published we can verify how to import the transpiled JS files correctly for this example.
    # TODO: remove skip once JSCBC-941 has been resolved.
    skip "https://issues.couchbase.com/browse/JSCBC-941, FLE V2 library not published"

    runExample $HOWTOS_DIR fle.js
    assert_success
}

@test "[howtos] - provisioning.js" {
    runExample $HOWTOS_DIR provisioning.js
    assert_success
}

@test "[howtos] - search.js" {
    runExample $HOWTOS_DIR search.js
    assert_success
    
    # Check output for search-query-match[] snippet
    assert_output --partial "[search-query-match] result count: 5"

    # Check output for search-query-matchPhrase[] snippet
    assert_output --partial "[search-query-matchPhrase] result count: 4"
    assert_output --partial "hotel_11331"
    assert_output --partial "hotel_15915"
    assert_output --partial "hotel_3606"
    assert_output --partial "hotel_28259"

    # Check output for search-query-dateRange[] snippet.
    # https://issues.couchbase.com/browse/JSCBC-942, errors thrown for consistency/consistentWith query options.
    # Commenting out this check for now. Once the issue is resolved we can test this.
    # assert_output --partial "[search-query-dateRange] result count: 1"
}

@test "[howtos] - search-conjuncts-disjuncts.js" {
    runExample $HOWTOS_DIR search-conjuncts-disjuncts.js
    assert_success

    # Check output for search-query-conjuncts[] snippet
    assert_output --partial "[search-query-conjuncts] result count: 2"

    # Check output for search-query-disjuncts[] snippet
    assert_output --partial "[search-query-disjuncts] result count: 11"
    
    # Check output for handle-hits[] snippet
    assert_output --partial "Result #1 ID: hotel_21726"

    # Check output for handle-facets[] snippet
    assert_output --partial <<-EOF
Descriptions facet: {
  field: 'description',
  total: 223,
  missing: 0,
  other: 195,
  terms: [
    { term: 'louvre', count: 7 },
    { term: 'hotel', count: 6 },
    { term: 'rooms', count: 6 },
    { term: 'eiffel', count: 5 },
    { term: 'close', count: 4 }
  ]
}
EOF
}


@test "[howtos] - subdoc.js" {
    runExample $HOWTOS_DIR subdoc.js
    assert_success

    # Check output for lookup-exists[] snippet
    assert_output --partial <<-EOF
lookup-exists
Path exists?  false
EOF

    # Check output for lookup-multi[] snippet
    assert_output --partial <<-EOF
lookup-multi
United Kingdom
Path exists? false
EOF

    # Check output for mutate-increment[] snippet
    assert_output --partial <<-EOF
mutate-increment
{ value: 1 }
EOF
}

@test "[howtos] - user-manager.js" {
    runExample $HOWTOS_DIR user-manager.js
    assert_success
}

@test "[howtos] - views.js" {
    runExample $HOWTOS_DIR views.js
    assert_success
}
