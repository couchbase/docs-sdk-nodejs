'use strict'

const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // tag::create-bucketmgr[]
  const bucketMgr = cluster.buckets()
  // end::create-bucketmgr[]

  try {
    // tag::create-bucket[]
    await bucketMgr.createBucket({
      name: 'hello',
      flushEnabled: false,
      replicaIndex: false,
      ramQuotaMB: 200,
      numReplicas: 1,
      bucketType: couchbase.BucketType.Couchbase,
    })
    // end::create-bucket[]

    // Allow some time after creating the bucket as example code
    // runs fairly quickly. Sleeps for 5s.
    await sleep(5000)
  } catch (e) {
    if (e instanceof couchbase.BucketExistsError) {
      console.log('Bucket already exists, carrying on...')
    } else {
      throw e
    }
  }

  // tag::update-bucket[]
  var settings = await bucketMgr.getBucket('hello')
  settings.flushEnabled = true

  await bucketMgr.updateBucket(settings)
  // end::update-bucket[]

  // tag::flush-bucket[]
  await bucketMgr.flushBucket('hello')
  // end::flush-bucket[]

  // tag::remove-bucket[]
  await bucketMgr.dropBucket('hello')
  // end::remove-bucket[]
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

go()
  .then((res) => console.log('DONE:', res))
  .then(process.exit)
