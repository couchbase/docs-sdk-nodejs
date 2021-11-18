// Require Couchbase Module
var couchbase = require("couchbase");


async function runExamples() {
  
  // Setup Cluster Connection Object
  var connString = "couchbase://localhost";
  const options = { username: "Administrator", password: "password" };
  var cluster = await couchbase.connect(connString, options);

  console.log(cluster)
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
      console.log("the document is missing")
    }
  }
  // end::notfound[]

  // tag::exists[]
  try {
    var result = await collection.insert("key-which-exists", "hello");
  } catch (e) {
    if (e instanceof couchbase.DocumentExistsError) {
      console.log("document unexpectedly exists")
    }
  }
  // end::exists[]

  // tag::query[]
  try {
    var results = cluster.query("SELECT * FROM `travel-sample`");
  } catch (e) {
    if (e instanceof couchbase.IndexFailureError) {
      console.log("index doesn't exist, do we need to create it")
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
        console.log("CAS mismatch")
        // We could now re-fetch the document and try again
        continue;
      }

      // if we ran into another kind of error, let's re-throw it...
      throw e;
    }
  }
  // end::cas[]
}

// TODO, we need to run this
async function insertExample() {
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
}

runExamples()
  .then((res) => console.log("DONE:", res))
  .then(process.exit);
