'use strict'

// tag::import[]
const { Ottoman, Schema, SearchConsistency } = require('ottoman')
const ottoman = new Ottoman()
// end::import[]

async function main() {
  // tag::connect[]
  var connection = await ottoman.connect({
    connectionString: 'couchbase://localhost',
    bucketName: 'travel-sample',
    username: 'Administrator',
    password: 'password',
  })
  // end::connect[]

  // tag::alt-connect[]
  connection = await ottoman.connect(
    'couchbase://localhost/travel-sample@Administrator:password'
  )
  // end::alt-connect[]

  // tag::schema[]
  const airlineSchema = new Schema({
    type: String,
    id: Number,
    name: String,
    callsign: String,
    iata: String,
    icao: String,
  })
  // end::schema[]

  // tag::model[]
  const Airline = connection.model('airline', airlineSchema, {
    scopeName: 'inventory',
  })
  // end::model[]

  // tag::start[]
  await connection.start()
  // end::start[]

  // tag::save[]
  const airlineDoc = new Airline({
    type: 'airline',
    id: 8091,
    callsign: 'CBS',
    name: 'Couchbase Airways 1',
    icao: 'CBICAO',
    iata: 'CBIATA',
  })

  // Persist the airline document we just created in the database
  await airlineDoc.save()
  console.log(`Success: airline ${airlineDoc.name} added!\n`)
  // end::save[]

  // tag::alt-save[]
  await Airline.create({
    type: 'airline',
    id: 8092,
    callsign: 'CBS2',
    name: 'Couchbase Airways 2',
    icao: 'CBICAO2',
    iata: 'CBIATA2',
  })
  // end::alt-save[]

  // tag::find[]
  const result = await Airline.find(
    { callsign: 'CBS' },
    { consistency: SearchConsistency.LOCAL }
  )
  console.log('Query Result: ', result.rows)
  // end::find[]
}

// tag::run-main[]
main()
  .catch((error) => console.log('ERR:', error))
  .finally(process.exit)
// end::run-main[]
