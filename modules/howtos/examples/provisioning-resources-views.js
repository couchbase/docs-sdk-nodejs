'use strict'

const { DesignDocument } = require('couchbase')
const couchbase = require('couchbase')

async function main() {
  // tag::creating-index-mgr[]
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })
  const bucket = cluster.bucket('travel-sample')

  const viewMgr = bucket.viewIndexes()
  // end::creating-index-mgr[]

  // tag::create-view[]
  let designDoc = new DesignDocument({
    name: 'dev_landmarks',
    views: {
      by_country: {
        map: "function (doc, meta) { if (doc.type == 'landmark') { emit([doc.country, doc.city], null); } }",
      },
      by_activity: {
        map: "function (doc, meta) { if (doc.type == 'landmark') { emit(doc.activity, null); } }",
        reduce: '_count',
      },
    },
  })

  await viewMgr.upsertDesignDocument(designDoc)
  // end::create-view[]

  // tag::get-view[]
  designDoc = await viewMgr.getDesignDocument('dev_landmarks')
  console.info(
    'Found design doc:',
    designDoc.name,
    Object.keys(designDoc.views).length
  )
  // end::get-view[]

  // tag::publish-view[]
  await viewMgr.publishDesignDocument('landmarks')
  // end::publish-view[]

  // tag::drop-view[]
  await viewMgr.dropDesignDocument('landmarks')
  // end::drop-view[]
}

main()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(process.exit)
