'use strict'

const couchbase = require('couchbase')

async function go() {
  const cluster = new couchbase.Cluster('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  const bucket = cluster.bucket('default')
  const collection = bucket.defaultCollection()

  // tag::create-bucketmgr[]
  const bucketMgr = cluster.buckets()
  // end::create-bucketmgr[]

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

  // tag::update-bucket[]
  var settings = await bucketMgr.getBucket('hello')
  settings.flushEnabled = true

  await bucketMgr.updateBucket(settings)
  // end::update-bucket[]

  // tag::remove-bucket[]
  await bucketMgr.dropBucket('hello')
  // end::remove-bucket[]

  // tag::flush-bucket[]
  await bucketMgr.flushBucket('hello')
  // end::flush-bucket[]
}
go()
  .then((res) => console.log('DONE:', res))
  .catch((err) => console.error('ERR:', err))
