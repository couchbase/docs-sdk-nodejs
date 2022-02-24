'use strict'

const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // Open a bucket to allow cluster-level querying
  var bucket = cluster.bucket('travel-sample')

  // Create the necessary views/design documents
  await createViews(bucket)

  // tag::range-query[]
  var result = bucket.viewQuery('beers', 'by_name', {
    range: { start: 'A' },
    limit: 10,
  })
  // end::range-query[]

  // tag::key-query[]
  var result = await bucket.viewQuery('landmarks', 'by_name', {
    key: 'landmark_10019',
  })
  // end::key-query[]
}

async function createViews(bucket) {
  const viewMgr = await bucket.viewIndexes()

  const designDocs = [
    {
      name: 'beers',
      views: {
        by_name: {
          map: "function (doc, meta) { if (doc.type && doc.type == 'beer') { emit(meta.id, doc.name); } }",
        },
      },
    },
    {
      name: 'landmarks',
      views: {
        by_name: {
          map: "function (doc, meta) { if (doc.type && doc.type == 'landmark') { emit(meta.id, doc.name); } }",
        },
      },
    },
  ]

  // Create the design documents
  designDocs.forEach((designDoc) => {
    viewMgr.upsertDesignDocument(designDoc)
    viewMgr.upsertDesignDocument(designDoc)
  })

  // Give some time (2 seconds) for views to be created as example code
  // might run too quickly.
  await new Promise((resolve) => setTimeout(resolve, 2000))
}

go()
  .then((res) => console.log('DONE:', res))
  .then(process.exit)
