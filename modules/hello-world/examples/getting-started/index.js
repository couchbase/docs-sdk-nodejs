"use strict";

// tag::connect[]
const couchbase = require("couchbase");

const cluster = new couchbase.Cluster("couchbase://localhost", {
  username: "Administrator",
  password: "password",
});
// end::connect[]

// tag::bucket[]
// get a reference to our bucket
const bucket = cluster.bucket("travel-sample");
// end::bucket[]

// tag::default-collection[]
// get a reference to the default collection
const collection = bucket.defaultCollection();
// end::default-collection[]

// tag::test-doc[]
const airline = {
  type: "airline",
  id: 8091,
  callsign: "CBS",
  iata: null,
  icao: null,
  name: "Couchbase Airways",
};
// end::test-doc[]

// tag::upsert-func[]
const upsertDocument = async (doc) => {
  try {
    // key will equal: "airline_8091"
    const key = `${doc.type}_${doc.id}`;
    const result = await collection.upsert(key, doc);
    console.log("Upsert Result: ");
    console.log(result);
  } catch (error) {
    console.error(error);
  }
};
// end::upsert-func[]

// tag::upsert-invoke[]
upsertDocument(airline);
// end::upsert-invoke[]

// tag::get-func[]
// get document function
const getAirlineByKey = async (key) => {
  try {
    const result = await collection.get(key);
    console.log("Get Result: ");
    console.log(result);
  } catch (error) {
    console.error(error);
  }
};
// end::get-func[]

// tag::get-invoke[]
// call get document function
getAirlineByKey("airline_8091");
// end::get-invoke[]
