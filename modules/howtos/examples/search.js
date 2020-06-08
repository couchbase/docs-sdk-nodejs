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
  var result = await cluster.searchQuery(
    "travel-sample-index-hotel-description",
    couchbase.SearchQuery.match("swanky"),
    {
      limit: 10,
    }
  );
  // end::basic-query[]

  // tag::date-query[]
  var result = await cluster.searchQuery(
    "index-name",
    couchbase.SearchQuery.dateRange().start("2019-01-01").end("2019-02-01"),
    {
      limit: 10,
    }
  );
  // end::date-query[]

  // tag::conjunct-query[]
  var result = await cluster.searchQuery(
    "index-name",
    couchbase.SearchQuery.conjuncts(
      couchbase.SearchQuery.dateRange().start("2019-01-01").end("2019-02-01"),
      couchbase.SearchQuery.match("swanky")
    )
  );
  // end::date-query[]

  // tag::handle-hits[]
  result.rows.forEach((hit) => {
    var documentId = hit.id;
    var score = hit.score;
    // ...
  });
  // end::handle-hits[]

  // tag::handle-facets[]
  result.meta.facets.forEach((facet) => {
    var name = facet.name;
    var total = facet.total;
    // ...
  });
  // end::handle-facets[]

  // tag::ryow-query[]
  var result = cluster.searchQuery(
    "travel-sample-index-hotel-description",
    couchbase.SearchQuery.match("swanky"),
    {
      consistency: couchbase.Consistency.RequestPlus,
    }
  );
  // end::ryow-query[]
}
go()
  .then((res) => console.log("DONE:", res))
  .catch((err) => console.error("ERR:", err));
