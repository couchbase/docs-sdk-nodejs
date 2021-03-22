"use strict";

// NB: To run this file you will need:
//    1) the travel-sample sample bucket loaded.
//    2) an analytics node in the cluster
//    3) a Dataset created in Analytics:
//          CREATE DATASET airports ON `travel-sample` where `type` = 'airport';
//    4) a Dataset on a collection:
//          CREATE DATASET `airports-collection` ON `travel-sample`.inventory.airport;

const couchbase = require("couchbase");

async function go() {
  const cluster = new couchbase.Cluster("couchbase://localhost", {
    username: "Administrator",
    password: "password",
  });

  // Open a bucket to allow cluster-level querying
  var bucket = cluster.bucket("travel-sample");

  // tag::basic-query[]
  var result = await cluster.analyticsQuery('SELECT "hello" AS greeting');
  result.rows.forEach((row) => {
    console.log(row);
  });
  // end::basic-query[]
  console.log();

  function logResult (result) {
    result.rows.forEach((row) => {
      console.log(row);
    });
    console.log();
  }

  // tag::simple-query[]
  var result = await cluster.analyticsQuery(
    'SELECT airportname, country FROM airports WHERE country="France" LIMIT 3'
  );
  // end::simple-query[]
  logResult(result);

  // tag::posparam-query[]
  var result = await cluster.analyticsQuery(
    "SELECT airportname, country FROM airports WHERE country = ? LIMIT 3",
    { parameters: ["France"] }
  );
  // end::posparam-query[]
  logResult(result);

  // tag::namedparam-query[]
  var result = await cluster.analyticsQuery(
    "SELECT airportname, country FROM airports WHERE country = $country LIMIT 3",
   { parameters:
      { country: "France" } }
  );
  // end::namedparam-query[]
  logResult(result);

  // tag::priority-query[]
  var result = await cluster.analyticsQuery(
    'SELECT airportname, country FROM airports WHERE country="France" LIMIT 3',
    {
      priority: true,
      timeout: 100, // seconds
    }
  );
  // end::priority-query[]
  logResult(result);

  // tag::handle-rows[]
  var result = await cluster.analyticsQuery('SELECT "hello" AS greeting');

  result.rows.forEach((row) => {
    console.log("Greeting: %s", row.greeting);
  });
  // end::handle-rows[]
  console.log();

  // tag::handle-meta[]
  var result = await cluster.analyticsQuery('SELECT "hello" AS greeting');

  console.log("Elapsed time: %d", result.meta.metrics.elapsedTime);
  console.log("Execution time: %d", result.meta.metrics.executionTime);
  console.log("Result count: %d", result.meta.metrics.resultCount);
  console.log("Error count: %d", result.meta.metrics.errorCount);
  // end::handle-meta[]

  // tag::handle-collection[]
  var result = await cluster.analyticsQuery('SELECT airportname, country FROM `airports-collection` WHERE country="France" LIMIT 3');
  // end::handle-collection[]
  logResult(result);

  // // tag::handle-scope[]
  // var scope = bucket.scope("inventory");
  // var result = await scope.analyticsQuery('SELECT airportname, country FROM `airports-collection` WHERE country="France" LIMIT 3');
  // // end::handle-scope[]
  // logResult(result);
}
go()
  .then((res) => console.log("DONE:", res))
  .catch((err) => console.error("ERR:", err))
  .then(process.exit)