const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  console.log('[primary]')
  // tag::primary[]
  await cluster.queryIndexes().createPrimaryIndex(
    'travel-sample',
    // Don't error if the primary index already exists.
    { ignoreIfExists: true }
  )
  // end::primary[]
  console.log('Index creation complete')

  console.log('\n[named-primary]')
  // tag::named-primary[]
  await cluster.queryIndexes().createPrimaryIndex(
    'travel-sample',
    { name: "named_primary_index" }
  )
  // end::named-primary[]
  console.log('Named primary index creation complete')

  console.log('\n[secondary]')
  // tag::secondary[]
  await cluster.queryIndexes().createIndex(
    'travel-sample', 
    'index_name', 
    ['name']
  )
  // end::secondary[]
  console.log('Index creation complete')

  console.log('\n[composite]')
  // tag::composite[]
  await cluster.queryIndexes().createIndex(
    'travel-sample',
    'index_travel_info', ['name','id','icao','iata']
  )
  // end::composite[]
  console.log('Index creation complete')

  console.log('\n[drop-primary]')
  // tag::drop-primary[]
  await cluster.queryIndexes().dropPrimaryIndex('travel-sample')
  // end::drop-primary[]
  console.log('Primary index deleted successfully')

 console.log('\n[drop-named-primary]')
 // tag::drop-named-primary[]
 await cluster
   .queryIndexes()
   .dropPrimaryIndex('travel-sample', { name: 'named_primary_index' })
 // end::drop-named-primary[]
 console.log('Named primary index deleted successfully')

  console.log('\n[drop-secondary]')
  // tag::drop-secondary[]
  await cluster.queryIndexes().dropIndex('travel-sample', 'index_name')
  // end::drop-secondary[]
  console.log('Index deleted successfully')

  console.log('\n[defer-create]')
  // tag::defer-create-primary[]
  await cluster.queryIndexes().createPrimaryIndex(
    'travel-sample',
    { name: '#primary', deferred: true }
  )
  // end::defer-create-primary[]

  // tag::defer-create-secondary[]
  await cluster.queryIndexes().createIndex(
    'travel-sample', 
    'idx_name_email', 
    ['name', 'email'], 
    { deferred: true}
  )
  // end::defer-create-secondary[]
  console.log('Created deferred indexes')

  console.log('\n[defer-build]')
  // tag::defer-build[]
  // Start building any deferred indexes which were previously created.
  await cluster.queryIndexes().buildDeferredIndexes('travel-sample')

  // Wait for the deferred indexes to be ready for use.
  // Set the maximum time to wait to 3 minutes.
  await cluster.queryIndexes().watchIndexes(
      'travel-sample', 
      ['idx_name_email'], 
      180000, // milliseconds
      { watchPrimary: true}
  )
  // end::defer-build[]
  console.log('Deferred indexes ready')
}

go().then(process.exit)
