"use strict";

const couchbase = require("couchbase");

async function go() {
  const cluster = new couchbase.Cluster("couchbase://localhost", {
    username: "Administrator",
    password: "password",
  });

  // Open a bucket to allow cluster-level querying
  var bucket = cluster.bucket("travel-sample");

  var collection = bucket.defaultCollection();

  await collection.upsert("customer123", {
    email: "hello@test.com",
    addresses: {
      delivery: {
        country: "United Kingdom",
      },
      billing: {
        country: "United States",
      },
    },
    purchases: {
      pending: [],
      abandoned: [],
    },
  });

  // tag::lookup-get[]
  var result = await collection.lookupIn("customer123", [
    couchbase.LookupInSpec.get("addresses.delivery.country"),
  ]);
  var country = result.content[0].value; //'United Kingdom'
  // end::lookup-get[]

  // tag::lookup-exists[]
  var result = await collection.lookupIn("customer123", [
    couchbase.LookupInSpec.exists("purchases.pending[-1]"),
  ]);
  console.log("Path exists? ", result.content[0].value);

  // Path exists? false
  // end::lookup-exists[]

  // tag::lookup-multi[]
  var result = await collection.lookupIn("customer123", [
    couchbase.LookupInSpec.get("addresses.delivery.country"),
    couchbase.LookupInSpec.exists("purchases.pending[-1]"),
  ]);

  console.log(result.content[0].value); // United Kingdom
  console.log("Path exists?", result.content[1].value); // false
  // end::lookup-multi[]

  // tag::mutate-upsert[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.upsert("fax", "311-555-0151"),
  ]);
  // end::mutate-upsert[]

  // tag::mutate-insert[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.insert("purchases.complete", [42, true, "None"]),
  ]);
  // Success

  try {
    await collection.mutateIn("customer123", [
      couchbase.MutateInSpec.insert("purchases.complete", [42, true, "None"]),
    ]);
  } catch (e) {
    // e == SubdocPathExistsError
  }
  // end::mutate-insert[]

  // tag::mutate-multi[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.remove("addresses.billing"),
    couchbase.MutateInSpec.replace("email", "dougr96@hotmail.com"),
  ]);
  // end::mutate-multi[]

  // tag::mutate-arrayappend[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.arrayAppend("purchases.complete", 777),
  ]);

  // purchases.complete is now [339, 976, 442, 666, 777]
  // end::mutate-arrayappend[]

  // tag::mutate-arrayprepend[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.arrayPrepend("purchases.abandoned", 18),
  ]);

  // purchases.abandoned is now [18, 157, 49, 999]
  // end::mutate-arrayprepend[]

  // tag::mutate-tl-arrayappend[]
  await collection.upsert("my_array", []);
  await collection.mutateIn("my_array", [
    couchbase.MutateInSpec.arrayAppend("", "some element"),
  ]);

  // the document my_array is now ['some element']
  // end::mutate-tl-arrayappend[]

  // tag::mutate-tl-arrayappend-multi[]
  await collection.mutateIn("my_array", [
    couchbase.MutateInSpec.arrayAppend(false, "", "elem1", "elem2", "elem3"),
  ]);

  // the document my_array is now ['some_element', 'elem1', 'elem2', 'elem3']
  // end::mutate-tl-arrayappend-multi[]

  // tag::mutate-tl-arrayappend-array[]
  await collection.mutateIn("my_array", [
    couchbase.MutateInSpec.arrayAppend("", ["elem1", "elem2", "elem3"]),
  ]);

  // the document my_array is now ['some_element', ['elem1', 'elem2', 'elem3']]
  // end::mutate-tl-arrayappend-array[]

  // tag::mutate-tl-arrayappend-multibad[]
  await collection.mutateIn("my_array", [
    couchbase.MutateInSpec.arrayAppend("", "elem1"),
    couchbase.MutateInSpec.arrayAppend("", "elem2"),
    couchbase.MutateInSpec.arrayAppend("", "elem3"),
  ]);
  // end::mutate-tl-arrayappend-multibad[]

  // tag::mutate-createpaths[]
  await collection.mutateIn("some_doc", [
    couchbase.MutateInSpec.arrayAppend("some.array", "Hello", "World", {
      createPath: true,
    }),
  ]);
  // end::mutate-createpaths[]

  // tag::mutate-arrayaddunique[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.arrayAddUnique("purchases.complete", 95),
  ]);

  // => Success

  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.arrayAddUnique("purchases.complete", 95),
  ]);

  // => SubdocPathExists exception!
  // end::mutate-arrayaddunique-fail[]

  // tag::mutate-arrayinsert[]
  await collection.mutateIn("array", [
    couchbase.MutateInSpec.arrayInsert("[1]", "cruel"),
  ]);
  // end::mutate-arrayinsert[]

  // tag::mutate-increment[]
  var result = await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.increment("logins", 1),
  ]);

  console.log(result.content[0]); // 1
  // end::mutate-increment[]

  // tag::mutate-decrement[]
  await bucket.upsert("player432", {
    gold: 1000,
  });

  var result = await collection.mutateIn("player432", [
    couchbase.MutateInSpec.decrement("gold", 150),
  ]);
  // => player 432 now has 850 gold remaining
  // end::mutate-decrement[]

  // tag::mutate-upsert-parents[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.upsert(
      "level_0.level_1.foo.bar.phone",
      {
        num: "311-555-0101",
        ext: 16,
      },
      {
        createPath: true,
      }
    ),
  ]);
  // end::mutate-upsert-parents[]

  // tag::mutate-cas[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.arrayAppend("purchases.complete", {
      some_id: SOME_ID,
    }),
  ]);
  // end::mutate-cas[]

  // tag::mutate-cas-noconflict[]
  await collection.mutateIn("customer123", [
    couchbase.MutateInSpec.arrayAppend("purchases.abandoned", {
      cas: SOME_CAS,
    }),
  ]);
  // end::mutate-cas-noconflict[]

  // tag::mutate-persistto[]
  await collection.mutateIn(
    "couchbase123",
    [couchbase.MutateInSpec.insert("name", "mike")],
    {
      durabilityPersistTo: 1,
      durabilityReplicateTo: 1,
    }
  );
  // end::mutate-persistto[]

  // tag::mutate-durability[]
  await collection.mutateIn(
    "couchbase123",
    [couchbase.MutateInSpec.insert("name", "mike")],
    {
      durabilityLevel: couchbase.DurabilityLevel.Majority,
    }
  );
  // end::mutate-durability[]
}
go()
  .then((res) => console.log("DONE:", res))
  .catch((err) => console.error("ERR:", err));
