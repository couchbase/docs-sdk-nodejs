'use strict'

import {
  Bucket,
  Cluster,
  Collection,
  connect,
  GetResult,
  MutationResult,
} from 'couchbase'

async function main() {
  const cluster: Cluster = await connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // get a reference to our bucket
  const bucket: Bucket = cluster.bucket('travel-sample')

  // tag::ts-collection[]
  // get a reference to a collection
  const collection: Collection = bucket.scope('inventory').collection('airline')
  // end::ts-collection[]

  // tag::ts-default-collection[]
  // get a reference to the default collection, required for older Couchbase server versions
  const collection_default: Collection = bucket.defaultCollection()
  // end::ts-default-collection[]

  // tag::ts-test-doc[]
  interface Document {
    type: string
    id: number
    callsign: string
    iata: string
    icao: string
    name: string
  }

  const airline: Document = {
    type: 'airline',
    id: 8091,
    callsign: 'CBS',
    iata: 'IATA',
    icao: 'ICAO',
    name: 'Couchbase Airways',
  }
  // end::ts-test-doc[]

  // tag::ts-upsert-func[]
  const upsertDocument = async (doc: Document) => {
    try {
      // key will equal: "airline_8091"
      const key: string = `${doc.type}_${doc.id}`
      const result: MutationResult = await collection.upsert(key, doc)
      console.log('Upsert Result: ')
      console.log(result)
    } catch (error) {
      console.error(error)
    }
  }
  // end::ts-upsert-func[]

  // tag::ts-upsert-invoke[]
  await upsertDocument(airline)
  // end::ts-upsert-invoke[]

  // tag::ts-get-func[]
  const getAirlineByKey = async (key: string) => {
    try {
      const result: GetResult = await collection.get(key)
      console.log('Get Result: ')
      console.log(result)
    } catch (error) {
      console.error(error)
    }
  }
  // end::ts-get-func[]

  // tag::ts-get-invoke[]
  await getAirlineByKey('airline_8091')
}
// end::ts-get-invoke[]

// tag::ts-run-main[]

// Run the main function
main()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(() => process.exit(0))
// end::ts-run-main[]
