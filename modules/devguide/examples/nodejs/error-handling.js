// Require Couchbase Module
var couchbase = require("couchbase");

// Setup Cluster Connection Object
var connString = "couchbase://localhost";
const options = { username: "Administrator", password: "password" };
var cluster = new couchbase.Cluster(connString, options);

// Setup Bucket object to be reused within the code
var bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();

// Attempt to fetch a document which does not exist
const docKey = "airport_1254";

// tag::catch[]
try {
  var result = await collection.get(docKey);
} catch (e) {
  // we can handle any exceptions thrown here.
}
// end::catch[]

// tag::notfound[]
try {
  var result = await collection.get("key-which-does-not-exist");
} catch (e) {
  if (e instanceof couchbase.DocumentNotFoundError) {
    // we can decide what to do for a missing document here.
  }
}
// end::notfound[]

// tag::exists[]
try {
  var result = await collection.insert("key-which-exists", "hello");
} catch (e) {
  if (e instanceof couchbase.DocumentExistsError) {
    // we can decide what to do for a missing document here.
  }
}
// end::exists[]

// tag::query[]
try {
  var results = cluster.query("SELECT * FROM default");
} catch (e) {
  if (e instanceof couchbase.IndexFailureError) {
    // our index probably did not exist, maybe we should create them?
  }

  if (e.context instanceof couchbase.QueryErrorContext) {
    // We have a N1QL error context, we can print out some useful information:
    console.log(e.context.statement);
    console.log(e.context.first_error_code);
    console.log(e.context.first_error_message);
    console.log(e.context.client_context_id);
    console.log(e.context.http_response_code);
    console.log(e.context.http_response_body);
  }
}
// end::query[]

// tag::cas[]
for (var retryNum = 0; retryNum < 10; ++i) {
  try {
    var result = await collection.get(docKey);

    var airport = result.value;
    airport.views++;

    await collection.replace(docKey, airport, { cas: result.cas });

    // success!
    break;
  } catch (e) {
    if (e instanceof couchbase.CasMismatchError) {
      // we can simply try the cas operation again...
      continue;
    }

    // if we ran into another kind of error, let's re-throw it...
    throw e;
  }
}
// end::cas[]

// tag::insert[]
for (var retryNum = 0; retryNum < 10; ++i) {
  try {
    var result = await collection.insert(docKey, "some value", {
      durabilityLevel: couchbase.DurabilityLevel.PersistToMajority,
    });

    // success!
    break;
  } catch (e) {
    if (e instanceof couchbase.DocumentExistsError) {
      if (retryNum > 0) {
        // If this is a retry and the document now exists, we can assume it was
        // written successfully by a previously ambiguous error.
        continue;
      }
    }
    if (e instanceof couchbase.DurabilityAmbiguousError) {
      // we can simply try the durable operation again...
      continue;
    }

    // if we ran into another kind of error, let's re-throw it...
    throw e;
  }
}
// end::insert[]
