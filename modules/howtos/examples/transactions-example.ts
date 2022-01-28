'use strict'

// tag::ts-connect[]
import {
  Bucket,
  Cluster,
  Collection,
  connect,
  GetResult,
  MutationResult,
  TransactionDurabilityLevel,
  Transactions,
} from 'couchbase'
import { Couchbase } from 'ottoman'

async function main() {
  // tag::config[]
  const cluster: Cluster = await connect('couchbase://192.168.1.228', {
    username: 'username',
    password: 'password',
    transactions: {
      durabilityLevel: TransactionDurabilityLevel.PersistToMajority,
    },
  })
  // end::config[]

  const testDoc = 'foo'

  // tag::ts-bucket[]
  // get a reference to our bucket
  const bucket: Bucket = cluster.bucket('travel-sample')
  // end::ts-bucket[]

  // tag::ts-collection[]
  // get a reference to a collection
  const collection: Collection = bucket.scope('inventory').collection('airline')
  // end::ts-collection[]

  // tag::ts-default-collection[]
  // get a reference to the default collection, required for older Couchbase server versions
  const collection_default: Collection = bucket.defaultCollection()
  // end::ts-default-collection[]

   // Set up for what we'll do below
   try {
    await collection.remove('doc-a')
    await collection.remove('doc-b')
    await collection.remove('doc-c')
    await collection.remove(testDoc)

   } catch (error) {
     // TODO, check for doc does not exist, otherwise whine
   }

  //  await collection.upsert("doc-a", {})
   await collection.upsert("doc-b", {})
   await collection.upsert("doc-c", {})



  try { 
    await cluster.transactions().run(async (attempt) => {
      await attempt.insert(collection, testDoc, 'hello')
    })
  } catch (error) {
    console.log("failed to insert " + testDoc)
  }

  // tag::create[]
  try {
    await cluster.transactions().run(async (ctx) => {
      // 'ctx' is a TransactionAttemptContext which permits getting, inserting,
      // removing and replacing documents, performing SQL++ queries, etc.

      // … Your transction logic here …
      
      // Committing is implicit at the end of the lambda.
    })
  } catch (error) {
    // if error instanceof TransactionCommitAmbiguious // or TransactionFaild
    // TODO: examples should show both ambiguious and failure branches once added
  }
  // end::create[]

  // tag::examples[]
  const inventory = cluster.bucket('travel-sample').scope('inventory')

  try {
    await cluster.transactions().run(async (ctx) => {
      // Inserting a doc:
      await ctx.insert(collection, 'doc-a', {})

      // Getting documents:
      const docA = await ctx.get(collection, 'doc-a')

      // Replacing a doc:
      const docB = await ctx.get(collection, 'doc-b')
      const content = docB.content
      const newContent = {
        transactions: 'are awesome',
        ...content,
      }
      await ctx.replace(docB, newContent)

      // Removing a doc:
      const docC = await ctx.get(collection, "doc-c");
      await ctx.remove(docC);

      // Performing a SELECT N1QL query against a scope:
      // TODO: uncomment after picking up next client
      // const qr = await ctx.query('SELECT * FROM hotel WHERE country = $1', {
      //   scope: inventory,
      //   parameters: ['United Kingdom']
      // })
      // // ...qr.rows
      
      // await ctx.query('UPDATE route SET airlineid = $1 WHERE airline = $2', {
      //   scope: inventory,
      //   parameters: ['airline_137', 'AF']
      // })

      // // Committing (the ctx.commit() call is optional)
      // ctx.commit();
    })
  } catch (error) {
    // TODO: instanceof and branch into one of these two
    console.error("Transaction possibly committed")
    console.error("Transction did not reach commit point")
    console.log("********** error " + JSON.stringify(error))
  }
  // tag::examples[]

  //}

 
}

// tag::ts-run-main[]
// Run the main function
main()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
// end::ts-run-main[]
