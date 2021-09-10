'use strict'

const couchbase = require('couchbase')

async function go() {
  const clusterAdm = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // tag::scopeAdmin[]
  const userMgr = clusterAdm.users()
  const bucketAdm = clusterAdm.bucket('travel-sample')

  await userMgr.upsertUser({
    username: 'scope_admin',
    password: 'password',
    displayName: 'JS Manage Scopes [travel-sample:*]',
    roles: [
      { name: 'scope_admin', bucket: 'travel-sample' },
      { name: 'data_reader', bucket: 'travel-sample' },
    ],
  })
  // end::scopeAdmin[]

  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'scope_admin',
    password: 'password',
  })

  // tag::create-collection-manager[]
  const bucket = cluster.bucket('travel-sample')
  const collectionMgr = bucket.collections()
  // end::create-collection-manager[]

  // tag::create-scope[]
  try {
    await collectionMgr.createScope('example-scope')
  } catch (e) {
    if (e instanceof couchbase.ScopeExistsError) {
      console.log('The scope already exists')
    } else {
      throw e
    }
  }
  // end::create-scope[]

  // tag::create-collection[]
  try {
    var collectionSpec = new couchbase.CollectionSpec({
      name: 'example-collection',
      scopeName: 'example-scope',
    })

    await collectionMgr.createCollection(collectionSpec)
  } catch (e) {
    if (e instanceof couchbase.CollectionExistsError) {
      console.log('The collection already exists')
    } else if (e instanceof couchbase.ScopeNotFoundError) {
      console.log('The scope does not exist')
    } else {
      throw e
    }
  }
  // end::create-collection[]

  // tag::drop-collection[]
  try {
    await collectionMgr.dropCollection('example-collection', 'example-scope')
  } catch (e) {
    if (e instanceof couchbase.CollectionNotFoundError) {
      console.log('The collection does not exist')
    } else if (e instanceof couchbase.ScopeNotFoundError) {
      console.log('The scope does not exist')
    } else {
      throw e
    }
  }
  // end::drop-collection[]

  // tag::drop-scope[]
  try {
    await collectionMgr.dropScope('example-scope')
  } catch (e) {
    if (e instanceof couchbase.ScopeNotFoundError) {
      console.log('The scope does not exist')
    } else {
      throw e
    }
  }
  // end::drop-scope[]
}

go()
  .then((res) => console.log('DONE:', res))
  .then(process.exit)
