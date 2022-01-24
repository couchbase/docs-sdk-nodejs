'use strict'

const couchbase = require('couchbase')
const fs = require('fs'); 

// tag::csv-tsv-import[]
const { parse: csvParser } = require('csv-parse');
// end::csv-tsv-import[]

// tag::json-jsonl-import[]
const stream = require('stream'); 

// for JSON
const StreamArray = require('stream-json/streamers/StreamArray')

// for JsonL
const {parser: jsonlParser} = require('stream-json/jsonl/Parser');
// end::json-jsonl-import[]


async function main() {
  // tag::connect[]
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })
  
  const bucket = cluster.bucket('travel-sample')
  const collection = bucket.scope('inventory').collection('airline')
  // end::connect[]

  // tag::upsertDocument[]
  const upsertDocument = async (doc) => {
    try {
      // Build the key
      const key = `${doc.type}_${doc.id}`
      
      // Do any processing, logging etc.
      doc.importer = "import.js"
      console.log(key, doc)
      
      // Upsert the document
      await collection.upsert(key, doc)
    }
    catch (error) {
      // Error handling, retry, logging etc.
      console.error(error)
    }
  }
  // end::upsertDocument[]
  
  // tag::importStream[]
  const importStream = async (stream) => {
    for await (const doc of stream) {
      upsertDocument(doc)
    }
  }
  // end::importStream[]
    
  // tag::csvStream[]
  const csvStream = (filename) =>
    fs.createReadStream(filename)
    .pipe(
        csvParser({columns: true}))
  // end::csvStream[]

  // tag::tsvStream[]
  const tsvStream = (filename) =>
    fs.createReadStream(filename)
      .pipe(
        csvParser({
          columns: true,
          delimiter: '\t'}))
  // end::tsvStream[]

  // tag::jsonStream[]
  const map = (f) =>
    new stream.Transform({
      objectMode: true,
      transform: (obj, _, next) => next(null, f(obj))
    })
    
  const jsonStream = (filename) =>
    fs.createReadStream(filename)
      .pipe(StreamArray.withParser())
      .pipe(map(obj => obj.value))
  // end::jsonStream[]

  // tag::jsonlStream[]  
  const jsonlStream = (filename) =>
    fs.createReadStream(filename)
      .pipe(jsonlParser())
      .pipe(map(obj => obj.value))
  // end::jsonlStream[]  

  const path_to_import_csv = `${__dirname}/import.csv`
  const path_to_import_tsv = `${__dirname}/import.tsv`
  const path_to_import_json = `${__dirname}/import.json`
  const path_to_import_jsonl = `${__dirname}/import.jsonl`
  
  await importStream(csvStream(path_to_import_csv))
  await importStream(tsvStream(path_to_import_tsv ))
  await importStream(jsonStream(path_to_import_json))
  await importStream(jsonlStream(path_to_import_jsonl))
    
}


main().then(process.exit)
