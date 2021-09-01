'use strict'

const couchbase = require('couchbase')

async function go() {
  const cluster = new couchbase.Cluster('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // Open a bucket to allow cluster-level querying
  var bucket = cluster.bucket('travel-sample')

  // tag::range-query[]
  var result = bucket.viewQuery('beers', 'by_name', {
    range: { start: 'A' },
    limit: 10,
  })
  // end::range-query[]

  // tag::key-query[]
  var result = bucket.viewQuery('landmarks', 'by_name', {
    key: 'statue-of-liberty',
  })

  // end::key-query[]
}
go()
  .then((res) => console.log('DONE:', res))
  .catch((err) => console.error('ERR:', err))
