'use strict'

const couchbase = require('couchbase')

async function go() {
  const clusterAdm = new couchbase.Cluster('couchbase://localhost', {
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

  const cluster = new couchbase.Cluster('couchbase://localhost', {
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

  // Note: some parts of following examples are pending https://issues.couchbase.com/browse/JSCBC-858

  // tag::create-collection[]
  try {
    await collectionMgr.createCollection('example-collection', 'example-scope')
  } catch (e) {
    if (e instanceof couchbase.CollectionExistsError) {
      console.log('The collection already exists')
    }
    // tag::pending-JSCBC-858[]
    // else if (e instanceof couchbase.ScopeNotFoundError) {
    //   console.log("The scope does not exist");
    // }
    // end::pending-JSCBC-858[]
    else {
      throw e
    }
  }
  // end::create-collection[]

  // tag::drop-collection[]
  try {
    await collectionMgr.dropCollection('example-collection', 'example-scope')
  } catch (e) {
    // tag::pending-JSCBC-858[]
    // if (e instanceof couchbase.CollectionNotFoundError) {
    // end::pending-JSCBC-858[]
    console.log('The collection does not exist')
    // tag::pending-JSCBC-858[]
    // }
    // else if (e instanceof couchbase.ScopeNotFoundError) {
    //   console.log("The scope does not exist");
    // }
    // end::pending-JSCBC-858[]
  }
  // end::drop-collection[]

  // tag::drop-scope[]
  try {
    await collectionMgr.dropScope('example-scope')
  } catch (e) {
    // tag::pending-JSCBC-858[]
    // if (e instanceof couchbase.ScopeNotFoundError) {
    // end::pending-JSCBC-858[]
    console.log('The scope does not exist')
    // tag::pending-JSCBC-858[]
    // }
    // end::pending-JSCBC-858[]
  }
  // end::drop-scope[]
}

go()
  .then((res) => console.log('DONE:', res))
  .catch((err) => console.error('ERR:', err))
  .then(process.exit)
