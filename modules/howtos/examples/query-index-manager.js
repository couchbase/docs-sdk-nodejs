'use strict'

const couchbase = require('couchbase')

async function main() {
  // tag::creating-index-mgr[]
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })
  const queryIndexMgr = cluster.queryIndexes()
  // end::creating-index-mgr[]

  console.info('\nExample - [primary]\n')
  // tag::primary[]
  await queryIndexMgr.createPrimaryIndex('travel-sample', {
    scopeName: 'tenant_agent_01',
    collectionName: 'users',
    // Set this is you wish to use a custom name
    // indexName: 'custom_name',
    ignoreIfExists: true,
  })
  // end::primary[]

  console.info('\nExample - [secondary]')
  // tag::secondary[]
  try {
    await queryIndexMgr.createIndex(
      'travel-sample',
      'tenant_agent_01_users_email',
      ['preferred_email'],
      { scopeName: 'tenant_agent_01', collectionName: 'users' }
    )
  } catch (IndexExistsError) {
    console.info('Index already exists')
  }
  // end::secondary[]

  console.info('\nExample - [defer-indexes]')
  // tag::defer-indexes[]
  try {
    // Create a deferred index
    await queryIndexMgr.createIndex(
      'travel-sample',
      'tenant_agent_01_users_phone',
      ['preferred_phone'],
      { scopeName: 'tenant_agent_01', collectionName: 'users', deferred: true }
    )

    // Build any deferred indexes within `travel-sample`.tenant_agent_01.users
    await queryIndexMgr.buildDeferredIndexes('travel-sample', {
      scopeName: 'tenant_agent_01',
      collectionName: 'users',
    })

    // Wait for indexes to come online
    await queryIndexMgr.watchIndexes(
      'travel-sample',
      ['tenant_agent_01_users_phone'],
      30000, // milliseconds
      { scopeName: 'tenant_agent_01', collectionName: 'users' }
    )
  } catch (IndexExistsError) {
    console.info('Index already exists')
  }
  // end::defer-indexes[]

  console.info('\nExample - [drop-primary-or-secondary-index]\n')
  // tag::drop-primary-or-secondary-index[]
  // Drop a primary index
  await queryIndexMgr.dropPrimaryIndex('travel-sample', {
    scopeName: 'tenant_agent_01',
    collectionName: 'users',
  })

  // Drop a secondary index
  await queryIndexMgr.dropIndex(
    'travel-sample',
    'tenant_agent_01_users_email',
    { scopeName: 'tenant_agent_01', collectionName: 'users' }
  )
  // end::drop-primary-or-secondary-index[]
}

main()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(process.exit)
