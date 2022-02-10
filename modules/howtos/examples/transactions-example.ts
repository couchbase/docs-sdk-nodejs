'use strict'

import {
  Bucket,
  Cluster,
  Collection,
  connect,
  DurabilityLevel,
  QueryOptions,
  QueryProfileMode,
  QueryResult,
  Scope,
  TransactionCommitAmbiguousError,
  TransactionFailedError,
} from 'couchbase'

async function main() {
  // tag::config[]
  const cluster: Cluster = await connect('couchbase://192.168.1.103', {
    username: 'username',
    password: 'password',
    transactions: {
      durabilityLevel: DurabilityLevel.PersistToMajority,
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
  await removeOrWarn('doc-a')
  await removeOrWarn('doc-b')
  await removeOrWarn('doc-c')
  await removeOrWarn(testDoc)
  await removeOrWarn('docId')

  //  await collection.upsert("doc-a", {})
  await collection.upsert('doc-b', {})
  await collection.upsert('doc-c', {})
  await collection.upsert('doc-id', {})
  await collection.upsert('a-doc', {})

  try {
    await cluster.transactions().run(async (attempt) => {
      await attempt.insert(collection, testDoc, 'hello')
    })
  } catch (error) {
    console.log('failed to insert ' + testDoc)
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
    if (error instanceof TransactionFailedError) {
      // The operation failed. Both the monster and the player will be untouched.
      //
      // Situations that can cause this would include either the monster
      // or player not existing (as get is used), or a persistent
      // failure to be able to commit the transaction, for example on
      // prolonged node failure.
    }

    if (error instanceof TransactionCommitAmbiguousError) {
      // Indicates the state of a transaction ended as ambiguous and may or
      // may not have committed successfully.
      //
      // Situations that may cause this would include a network or node failure
      // after the transactions operations completed and committed, but before the
      // commit result was returned to the client
    }
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
      const docC = await ctx.get(collection, 'doc-c')
      await ctx.remove(docC)

      // Performing a SELECT N1QL query against a scope:
      const qr = await ctx.query('SELECT * FROM hotel WHERE country = $1', {
        scope: inventory,
        parameters: ['United Kingdom'],
      })
      // ...qr.rows
      qr.rows

      await ctx.query('UPDATE route SET airlineid = $1 WHERE airline = $2', {
        scope: inventory,
        parameters: ['airline_137', 'AF'],
      })

      // // Committing (the ctx.commit() call is optional)
      // ctx.commit();
    })
  } catch (error) {
    if (error instanceof TransactionFailedError) {
      // The operation failed. Both the monster and the player will be untouched.
      //
      // Situations that can cause this would include either the monster
      // or player not existing (as get is used), or a persistent
      // failure to be able to commit the transaction, for example on
      // prolonged node failure.
    }

    if (error instanceof TransactionCommitAmbiguousError) {
      // Indicates the state of a transaction ended as ambiguous and may or
      // may not have committed successfully.
      //
      // Situations that may cause this would include a network or node failure
      // after the transactions operations completed and committed, but before the
      // commit result was returned to the client
    }
  }
  // end::examples[]

  // execute other exmaples
  try {
    await get()
    await getReadOwnWrites()
    await replace()
    await remove()
    await insert()
    await queryExamples()
    // remove seems to not be working, verify here…
    try {
      const docCheck = await collection.get('doc-id')
      // should not get to the next line
      throw new Error(
        'Remove under transaction seems to have failed. content:' +
          JSON.stringify(docCheck.content)
      )
    } catch (error) {
      // expect to get here.  if I don't, something went wrong.
      console.log('successfully removed.')
    }
  } catch (error) {
    console.error('****** Error running examples: \n', error)
    console.trace()
  }
}

async function getCluster() {
  const exampleCluster: Cluster = await connect('couchbase://192.168.1.103', {
    username: 'username',
    password: 'password',
    transactions: {
      durabilityLevel: DurabilityLevel.None,
    },
  })
  return exampleCluster
}

async function getCollection() {
  const exampleCollection: Collection = (await getCluster()).bucket("travel-sample").scope('inventory').collection('airline')
  return exampleCollection
}

async function getScope() {
  const inventoryScope: Scope = (await getCluster()).bucket("travel-sample").scope("inventory")
  return inventoryScope
}

async function replace() {
  let cluster = await getCluster()
  let collection = await getCollection()
  // tag::replace[]
  cluster.transactions().run(async ctx => {
    const doc = await ctx.get(collection, "doc-id")
    const content = doc.content
    const newContent = {
      transactions: "are awesome",
      ...content,
    }
    await ctx.replace(doc, newContent)
  })
  // end::replace[]
}

async function remove() {
  let cluster = await getCluster()
  let collection = await getCollection()
  // tag::remove[]
  cluster.transactions().run(async ctx => {
    const doc = await ctx.get(collection, "doc-id")
    await ctx.remove(doc)
  })
  // end::remove[]
}

async function insert() {
  let cluster = await getCluster()
  let collection = await getCollection()
  // tag::insert[]
  cluster.transactions().run(async ctx => {
    await ctx.insert(collection, "docId", {})
  })
  // end::insert[]
}

async function get() {
  let cluster = await getCluster()
  let collection = await getCollection()
  // tag::get[]
  cluster.transactions().run(async ctx => {
    const aDoc = await ctx.get(collection, "a-doc")
  })
  // end::get[]
  // TODO: should this show nullable/optional in an example?
}

async function getReadOwnWrites() {
  let cluster = await getCluster()
  let collection = await getCollection()
  // tag::getReadOwnWrites[]
  cluster.transactions().run(async ctx => {
    const docId = "docId"

    ctx.insert(collection, docId, {})

    const doc = await ctx.get(collection, docId)
  })
  // end::getReadOwnWrites[]
}

async function queryExamples() {
  let cluster = await getCluster()
  let collection = await getCollection()
  let inventory = await getScope()

  // tag::queryExamplesSelect[]
  cluster.transactions().run(async (ctx) => {
    const st =
      'SELECT * FROM `travel-sample`.inventory.hotel WHERE country = $1'
    const qr = await ctx.query(st, {
      parameters: ['United Kingdom'],
    })
    for (let row in qr.rows) {
      // do something
    }
  })
  // end::queryExamplesSelect[]

  // tag::queryExamplesSelectScope[]
  cluster.transactions().run(async (ctx) => {
    const st = 'SELECT * FROM hotel WHERE country = $1'
    const qr = await ctx.query(st, {
      scope: inventory,
      parameters: ['United Kingdom'],
    })
    for (let row in qr.rows) {
      // do something
    }
  })
  // end::queryExamplesSelectScope[]

  // tag::queryExamplesUpdate[]
  const hotelChain = 'http://marriot%'
  const country = 'United States'
  cluster.transactions().run(async (ctx) => {
    const qr = await ctx.query(
      'UPDATE hotel SET price = $1 WHERE url LIKE $2 AND country = $3',
      {
        scope: inventory,
        parameters: [99.99, hotelChain, country],
      }
    )
    if (qr.meta.metrics?.mutationCount != 1) {
      throw new Error('Mutation count not the expected amount.')
    }
  })
  // end::queryExamplesUpdate[]

  // tag::queryExamplesComplex[]
  cluster.transactions().run(async (ctx) => {
    // Find all hotels of the chain
    const qr = await ctx.query(
      'SELECT reviews FROM hotel WHERE url LIKE $1 AND country = $2',
      {
        parameters: [hotelChain, country],
        scope: inventory,
      }
    )

    // This function (not provided here) will use a trained machine learning model to provide a
    // suitable price based on recent customer reviews.
    let updatedPrice = priceFromRecentReviews(qr)

    // Set the price of all hotels in the chain
    await ctx.query(
      'UPDATE hotel SET price = $1 WHERE url LIKE $2 AND country = $3',
      {
        parameters: [updatedPrice, hotelChain, country],
        scope: inventory,
      }
    )
  })
  // end::queryExamplesComplex[]
}

async function queryInsert() {
  let cluster = await getCluster()
  let collection = await getCollection()
  // tag::queryInsert[]
  cluster.transactions().run(async (ctx) => {
    ctx.query("INSERT INTO `default` VALUES ('doc', {'hello':'world'})")
    const st = "SELECT `default`.* FROM `default` WHERE META().id = 'doc'"
    const qr = await ctx.query(st)
  })
  // end::queryInsert[]
}

async function queryRyow() {
  let cluster = await getCluster()
  let collection = await getCollection()
  let inventory = await getScope()

  // const qr = await cluster.query("UPDATE inventory SET price = 99.00 WHERE name LIKE \"Marriott%\"", {scope:inventory, transactional: true})
  // if (qr.meta.metrics?.mutationCount != 1) {
  //   throw new Error("Should have modified one.");

  // }
  // tag::queryRyow[]
  cluster.transactions().run(async (ctx) => {
    const qr = await ctx.query("UPDATE inventory SET price = 99.00 WHERE name LIKE \"Marriott%\"",
      { scope: inventory }
    )
    if (qr.meta.metrics?.resultCount != 1) {
      throw new Error('Mutation count not the expected amount.')
    }
  })
// end::queryRyow[]
}


async function queryOptions() {
  let cluster = await getCluster()
  // tag::queryOptions[]
  const qo: QueryOptions = { profile: QueryProfileMode.Timings }
  cluster.transactions().run(async (ctx) => {
    ctx.query("INSERT INTO `default` VALUES ('doc', {'hello':'world'})", qo)
  })
  // end::queryOptions[]
}

async function querySingle() {
  let cluster = await getCluster()
  // tag::querySingle[]
  let bulkLoadStatement: string // a bulk-loading SQL++ statement not provided here
  try {
    cluster.transactions().run(async (ctx) => {
      ctx.query(bulkLoadStatement)
    })
  } catch (error) {
    if (error instanceof TransactionFailedError) {
      // The operation failed. Both the monster and the player will be untouched.
      //
      // Situations that can cause this would include either the monster
      // or player not existing (as get is used), or a persistent
      // failure to be able to commit the transaction, for example on
      // prolonged node failure.
    }

    if (error instanceof TransactionCommitAmbiguousError) {
      // Indicates the state of a transaction ended as ambiguous and may or
      // may not have committed successfully.
      //
      // Situations that may cause this would include a network or node failure
      // after the transactions operations completed and committed, but before the
      // commit result was returned to the client
    }
  // end::querySingle[]
}

async function querySingleScoped() {
  let cluster = await getCluster()

  const bulkLoadStatement = ""  /* your statement here */

  // String bulkLoadStatement = null /* your statement here */;

  // // tag::querySingleScoped[]
  const travelSample = cluster.bucket("travel-sample")
  const inventory = travelSample.scope("inventory")
  // TODO: enable after implementation
  // cluster.transactions().query(bulkLoadStatement, {scope: inventory})
  // end::querySingleScoped[]
  // Bucket travelSample = cluster.bucket("travel-sample");
  // Scope inventory = travelSample.scope("inventory");
  // transactions.query(inventory, bulkLoadStatement);
  // // end::querySingleScoped[]
}

async function querySingleConfigured() {
  let cluster = await getCluster()

  // TODO: fix once single statement query is available
  // // tag::querySingleConfigured[]
  // let bulkLoadStatement: string // a bulk-loading SQL++ statement not provided here
  // const inventory = travelSample.scope("inventory")
  // cluster.transactions().query(bulkLoadStatement,
  //   {
  //     scope: inventory,
  //     // Single query transactions will often want to increase the default timeout
  //     expirationTime: Duration.ofSeconds(360) //js-joda NPM????
  //   }
  // )
  // // Java here:
  // transactions.query(bulkLoadStatement, SingleQueryTransactionConfigBuilder.create()
  //     // Single query transactions will often want to increase the default timeout
  //     .expirationTime(Duration.ofSeconds(360))
  //     .build());
  // // end::querySingleConfigured[]
}


    // tag::full[]
    async function playerHitsMonster(damage: number, playerId: string, monsterId: string) {
      let cluster = await getCluster() // provide your cluster and collection reference appropriately
      let collection = await getCollection()


      try {
        cluster.transactions().run(async (ctx) => {
          let monsterDoc = (await ctx.get(collection, monsterId)).content // TODO: show parallelism
          let playerDoc = (await ctx.get(collection, playerId)).content

          let monsterHitpoints = monsterDoc.hitpoints
          let monsterNewHitpoints = monsterHitpoints - damage

          if (monsterNewHitpoints <= 0) {
            // Monster is killed. The remove is just for demoing, and a more realistic
            // example would set a "dead" flag or similar.
            ctx.remove(monsterDoc)

            // The player earns experience for killing the monster
            let experienceForKillingMonster = monsterDoc.experienceWhenKilled
            let playerExperience = playerDoc.experience
            let playerNewExperience =
              playerExperience + experienceForKillingMonster
            let playerNewLevel =
              calculateLevelForExperience(playerNewExperience)

            let playerContent = playerDoc.content

            playerContent.put('experience', playerNewExperience)
            playerContent.put('level', playerNewLevel)

            ctx.replace(playerDoc, playerContent)
          }
        })
      } catch (error) {
        if (error instanceof TransactionFailedError) {
          // The operation failed. Both the monster and the player will be untouched.
          //
          // Situations that can cause this would include either the monster
          // or player not existing (as get is used), or a persistent
          // failure to be able to commit the transaction, for example on
          // prolonged node failure.
        }

        if (error instanceof TransactionCommitAmbiguousError) {
          // Indicates the state of a transaction ended as ambiguous and may or
          // may not have committed successfully.
          //
          // Situations that may cause this would include a network or node failure
          // after the transactions operations completed and committed, but before the
          // commit result was returned to the client
        }
      }
  }
  // end::full[]

  async function rollback() {
    let cluster = await getCluster() // provide your cluster and collection reference appropriately
    let collection = await getCollection()

    const costOfItem = 10;

    // tag::rollback[]
    cluster.transactions().run(async (ctx) => {
      const customer = await ctx.get(collection, "customer-name");

        if (customer.content.balance < costOfItem) {
            throw new Error("Transaction failed, customer does not have enough funds.");

        }
        // else continue transaction
    });
    // end::rollback[]
}

async function rollbackCause() {
  let cluster = await getCluster() // provide your cluster and collection reference appropriately
  let collection = await getCollection()

  const costOfItem = 10;

  // tag::rollback-cause[]

  try {
    cluster.transactions().run(async (ctx) => {
      const customer = await ctx.get(collection, "customer-name");

          if (customer.content.balance < costOfItem) {
            throw new Error("Balance insufficient.");
          }
          // else continue transaction
      });
    } catch (error) {
      if (error instanceof TransactionCommitAmbiguousError) {
        // This exception can only be thrown at the commit point, after the
        // BalanceInsufficient logic has been passed, so there is no need to
        // check the cause property here.
      } else if (error instanceof TransactionFailedError) {
        // Re-raise the error
        // TODO: check this with Brett
        if (error.cause === "Balance insufficient." ) {
          throw new Error(error.cause)
        }

        console.error("Transction did not reach commit point", error)

      }

    }
  // end::rollback-cause[]
}

async function completeErrorHandling() {
  let cluster = await getCluster() // provide your cluster and collection reference appropriately
  let collection = await getCollection()

  // tag::full-error-handling[]
  try {
    const result = await cluster.transactions().run(async (ctx) => {
      // ... transactional code here ...
      });

      // The transaction definitely reached the commit point. Unstaging
      // the individual documents may or may not have completed

      if (!result.unstagingComplete) {
          // In rare cases, the application may require the commit to have
          // completed.  (Recall that the asynchronous cleanup process is
          // still working to complete the commit.)
          // The next step is application-dependent.
      }
    } catch (error) {
      if (error instanceof TransactionCommitAmbiguousError) {
        // The transaction may or may not have reached commit point
        console.error("Transaction returned TransactionCommitAmbiguous and may have succeeded.", error)
      } else if (error instanceof TransactionFailedError) {
        // The transaction definitely did not reach commit point
        console.error("Transaction failed with TransactionFailed", error)
      }
    }
  // end::full-error-handling[]
}


async function removeOrWarn(docId: string) {
  let cluster = await getCluster()
  let collection = await getCollection()

  try {
    await collection.remove(docId)
  } catch (error) {
    console.log("warning, failed to remove '%s'.  error: %s", docId, JSON.stringify(error))
  }

}

function priceFromRecentReviews(qr: QueryResult<any>) {
  // this would call a trained ML model to get the best price
  return 99.98
}

main()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
function calculateLevelForExperience(playerNewExperience: any) {
  throw new Error('Function not implemented.')
}
