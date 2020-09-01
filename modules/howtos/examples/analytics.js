"use strict";

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
    console.log(row.greeting);
  });
  // end::basic-query[]

  // tag::simple-query[]
  var result = await cluster.analyticsQuery(
    'SELECT airportname, country FROM airports WHERE country="France"'
  );
  // end::simple-query[]

  // tag::posparam-query[]
  var result = await cluster.analyticsQuery(
    "SELECT airportname, country FROM airports WHERE country = ?",
    ["France"]
  );
  // end::posparam-query[]

  // tag::namedparam-query[]
  var result = await cluster.analyticsQuery(
    "SELECT airportname, country FROM airports WHERE country = $country",
    { country: "France" }
  );
  // end::namedparam-query[]

  // tag::priority-query[]
  var result = await cluster.analyticsQuery(
    'SELECT airportname, country FROM airports WHERE country="France"',
    {
      priority: true,
      timeout: 100, // seconds
    }
  );
  // end::priority-query[]

  // tag::handle-rows[]
  var result = await cluster.analyticsQuery('SELECT "hello" AS greeting');

  result.rows.forEach((row) => {
    console.log("Greeting: %s", row.greeting);
  });
  // end::handle-rows[]

  // tag::handle-meta[]
  var result = await cluster.queryAnalytics('SELECT "hello" AS greeting');

  console.log("Elapsed time: %d", result.meta.metrics.elapsedTime);
  console.log("Execution time: %d", result.meta.metrics.executionTime);
  console.log("Result count: %d", result.meta.metrics.resultCount);
  console.log("Error count: %d", result.meta.metrics.errorCount);
  // end::handle-meta[]
}
go()
  .then((res) => console.log("DONE:", res))
  .catch((err) => console.error("ERR:", err));
