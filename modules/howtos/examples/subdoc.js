'use strict'

const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // Open a bucket to allow cluster-level querying
  var bucket = cluster.bucket('travel-sample')

  var collection = bucket.scope('tenant_agent_00').collection('users')

  await collection.upsert('customer123', {
    email: 'hello@test.com',
    addresses: {
      delivery: {
        country: 'United Kingdom',
      },
      billing: {
        country: 'United States',
      },
    },
    purchases: {
      pending: [],
      abandoned: [],
    },
    tags: [],
  })

  console.log('lookup-get')
  // tag::lookup-get[]
  var result = await collection.lookupIn('customer123', [
    couchbase.LookupInSpec.get('addresses.delivery.country'),
  ])
  var country = result.content[0].value //'United Kingdom'
  // end::lookup-get[]

  console.log('lookup-exists')
  // tag::lookup-exists[]
  var result = await collection.lookupIn('customer123', [
    couchbase.LookupInSpec.exists('purchases.pending[-1]'),
  ])
  console.log('Path exists? ', result.content[0].value)

  // Path exists? false
  // end::lookup-exists[]

  console.log('lookup-multi')
  // tag::lookup-multi[]
  var result = await collection.lookupIn('customer123', [
    couchbase.LookupInSpec.get('addresses.delivery.country'),
    couchbase.LookupInSpec.exists('purchases.pending[-1]'),
  ])

  console.log(result.content[0].value) // United Kingdom
  console.log('Path exists?', result.content[1].value) // false
  // end::lookup-multi[]

  console.log('mutate-upsert')
  // tag::mutate-upsert[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.upsert('fax', '311-555-0151'),
  ])
  // end::mutate-upsert[]

  console.log('mutate-insert')
  // tag::mutate-insert[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.insert('purchases.complete', [42, true, 'None']),
  ])
  // Success

  try {
    await collection.mutateIn('customer123', [
      couchbase.MutateInSpec.insert('purchases.complete', [42, true, 'None']),
    ])
  } catch (e) {
    if (e instanceof couchbase.PathExistsError) {
      console.log('Path already exists...')
    } else {
      throw e
    }
  }
  // end::mutate-insert[]

  console.log('mutate-multi')
  // tag::mutate-multi[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.remove('addresses.billing'),
    couchbase.MutateInSpec.replace('email', 'dougr96@hotmail.com'),
  ])
  // end::mutate-multi[]

  console.log('mutate-arrayappend')
  // tag::mutate-arrayappend[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.arrayAppend('purchases.complete', 777),
  ])

  // purchases.complete is now [339, 976, 442, 666, 777]
  // end::mutate-arrayappend[]

  console.log('mutate-arrayprepend')
  // tag::mutate-arrayprepend[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.arrayPrepend('purchases.abandoned', 18),
  ])

  // purchases.abandoned is now [18, 157, 49, 999]
  // end::mutate-arrayprepend[]

  console.log('mutate-tl-arrayappend')
  // tag::mutate-tl-arrayappend[]
  await collection.upsert('my_array', [])
  await collection.mutateIn('my_array', [
    couchbase.MutateInSpec.arrayAppend('', 'some element'),
  ])

  // the document my_array is now ['some element']
  // end::mutate-tl-arrayappend[]

  console.log('mutate-tl-arrayappend-multi')
  // tag::mutate-tl-arrayappend-multi[]
  await collection.mutateIn('my_array', [
    couchbase.MutateInSpec.arrayAppend('', ['elem1', 'elem2', 'elem3'], {
      multi: true,
    }),
  ])

  // the document my_array is now ['some_element', 'elem1', 'elem2', 'elem3']
  // end::mutate-tl-arrayappend-multi[]

  console.log('mutate-tl-arrayappend-array')
  // tag::mutate-tl-arrayappend-array[]
  await collection.mutateIn('my_array', [
    couchbase.MutateInSpec.arrayAppend('', ['elem1', 'elem2', 'elem3']),
  ])

  // the document my_array is now ['some_element', ['elem1', 'elem2', 'elem3']]
  // end::mutate-tl-arrayappend-array[]

  console.log('mutate-tl-arrayappend-multibad')
  // tag::mutate-tl-arrayappend-multibad[]
  await collection.mutateIn('my_array', [
    couchbase.MutateInSpec.arrayAppend('', 'elem1'),
    couchbase.MutateInSpec.arrayAppend('', 'elem2'),
    couchbase.MutateInSpec.arrayAppend('', 'elem3'),
  ])
  // end::mutate-tl-arrayappend-multibad[]

  console.log('mutate-createpaths')
  // tag::mutate-createpaths[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.arrayAppend('some.path', 'Hello World', {
      createPath: true,
    }),
  ])
  // end::mutate-createpaths[]

  console.log('mutate-arrayaddunique')
  // tag::mutate-arrayaddunique[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.arrayAddUnique('purchases.complete', 95),
  ])

  // => Success

  try {
    await collection.mutateIn('customer123', [
      couchbase.MutateInSpec.arrayAddUnique('purchases.complete', 95),
    ])
  } catch (e) {
    if (e instanceof couchbase.PathExistsError) {
      console.log('Path already exists, not adding unique value')
    } else {
      throw e
    }
  }
  // end::mutate-arrayaddunique[]

  console.log('mutate-arrayinsert')
  // tag::mutate-arrayinsert[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.arrayInsert('tags[0]', 'cruel'),
  ])
  // end::mutate-arrayinsert[]

  console.log('mutate-increment')
  // tag::mutate-increment[]
  var result = await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.increment('logins', 1),
  ])

  console.log(result.content[0]) // 1
  // end::mutate-increment[]

  console.log('mutate-decrement')
  // tag::mutate-decrement[]
  await collection.upsert('player432', {
    gold: 1000,
  })

  var result = await collection.mutateIn('player432', [
    couchbase.MutateInSpec.decrement('gold', 150),
  ])
  // => player 432 now has 850 gold remaining
  // end::mutate-decrement[]

  console.log('mutate-upsert-parents')
  // tag::mutate-upsert-parents[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.upsert(
      'level_0.level_1.foo.bar.phone',
      {
        num: '311-555-0101',
        ext: 16,
      },
      {
        createPath: true,
      }
    ),
  ])
  // end::mutate-upsert-parents[]

  console.log('mutate-cas')
  const SOME_ID = '100'
  // tag::mutate-cas[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.arrayAppend('purchases.complete', {
      some_id: SOME_ID,
    }),
  ])
  // end::mutate-cas[]

  console.log('mutate-cas-noconflict')
  const SOME_OTHER_ID = '200'
  // tag::mutate-cas-noconflict[]
  await collection.mutateIn('customer123', [
    couchbase.MutateInSpec.arrayAppend('purchases.abandoned', {
      some_other_id: SOME_OTHER_ID,
    }),
  ])
  // end::mutate-cas-noconflict[]

  console.log('cas')
  var res = await collection.get('customer123')
  var SOME_CAS = res.cas
  // tag::cas[]
  await collection.mutateIn(
    'customer123',
    [couchbase.MutateInSpec.insert('addresses.delivery.line1', '17 Olcott St')],
    {
      cas: SOME_CAS,
    }
  )
  // end::cas[]

  /* These examples currently blocked JSCBC-637
  console.log("mutate-persistto")
  // tag::mutate-persistto[]
  await collection.mutateIn(
    "customer123",
    [couchbase.MutateInSpec.insert("name", "mike")],
    {
      durabilityPersistTo: 1,
      durabilityReplicateTo: 1,
    }
  );
  // end::mutate-persistto[]

  console.log("mutate-durability")
  // tag::mutate-durability[]
  await collection.mutateIn(
    "couchbase123",
    [couchbase.MutateInSpec.insert("name", "mike")],
    {
      durabilityLevel: couchbase.DurabilityLevel.Majority,
    }
  );
  // end::mutate-durability[]
   */

  cluster.close()
}
go()
  .then((res) => console.log('DONE:', res))
  .then(process.exit)
