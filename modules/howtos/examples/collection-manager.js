"use strict";

const couchbase = require("couchbase");

async function go() {
  const cluster = new couchbase.Cluster("couchbase://localhost", {
    username: "Administrator",
    password: "password",
  });

  var bucket = cluster.bucket("travel-sample");

    // tag::create-collection-manager[]
    const collectionMgr = bucket.collections();
    // end::create-collection-manager[]

    // tag::create-scope[]
    try {
      await collectionMgr.createScope("example-scope");
    }
    catch (e) {
      if (e instanceof couchbase.ScopeExistsError) {
        console.log("The scope already exists");
      }
    }
    // end::create-scope[]

    // tag::create-collection[]
    try {
      await collectionMgr.createCollection("example-collection", "example-scope");
    }
    catch (e) {
      if (e instanceof couchbase.CollectionExistsError) {
        console.log("The collection already exists");
      }
      // else if (e instanceof couchbase.ScopeNotFoundError) {
      //   console.log("The scope does not exist");
      // }
    }
    // end::create-collection[]

    // tag::drop-collection[]
    try {
      await collectionMgr.dropCollection("example-collection", "example-scope");
    }
    catch (e) {
      // if (e instanceof couchbase.CollectionNotFoundError) {
        console.log("The collection does not exist");
      // }
      // else if (e instanceof couchbase.ScopeNotFoundError) {
      //   console.log("The scope does not exist");
      // }
    }
    // end::drop-collection[]

    // tag::drop-scope[]
    try {
      await collectionMgr.dropScope("example-scope");
    }
    catch (e) {
      // if (e instanceof couchbase.ScopeNotFoundError) {
        console.log("The scope does not exist");
      // }
    }
    // end::drop-scope[]
}

go()
  .then((res) => console.log("DONE:", res))
  .catch((err) => console.error("ERR:", err))
  .then(process.exit);
