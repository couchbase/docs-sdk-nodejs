// Require Couchbase Module
const couchbase = require("couchbase");


async function runExamples() {

  // Setup Cluster Connection Object
  const connString = "couchbase://localhost";
  const options = { username: "Administrator", password: "password" };
  const cluster = await couchbase.connect(connString, options);

  // Setup Bucket object to be reused within the code
  const bucket = cluster.bucket("travel-sample");
  const collection = bucket.defaultCollection();

  const docKey = "airport_1254";

  // tag::catch[]
  try {
    const result = await collection.get(docKey);
  } catch (e) {
    // we can handle any exceptions thrown here.
  }
  // end::catch[]

  // tag::notfound[]
  try {
    const result = await collection.get("key-which-does-not-exist");
  } catch (e) {
    if (e instanceof couchbase.DocumentNotFoundError) {
      console.log("the document is missing");
    }
  }
  // end::notfound[]

  await collection.upsert("key-which-exists", "hello");

  // tag::exists[]
  try {
    const result = await collection.insert("key-which-exists", "hello");
  } catch (e) {
    if (e instanceof couchbase.DocumentExistsError) {
      console.log("document unexpectedly exists");
    }
  }
  // end::exists[]

  // tag::query[]
  try {
    const result = await cluster.query("SELECT * FROM `no-such-bucket`");
  } catch (e) {
    if (e instanceof couchbase.IndexFailureError) {
      console.log("index doesn't exist, do we need to create it");
    }

    if (e.context instanceof couchbase.QueryErrorContext) {
      // We have a SQL++ (N1QL) error context, we can print out some useful information:
      console.log(e.context.statement);
      console.log(e.context.client_context_id);
      console.log(e.context.last_dispatched_to);
      console.log(e.context.http_response_code);
      console.log(e.context.http_response_body);
    }
  }
  // end::query[]

  // tag::cas[]
  for (let retryNum = 0; retryNum < 10; ++retryNum) {
    try {
      const result = await collection.get(docKey);

      const airport = result.content;
      airport.views = (airport.views || 0) + 1;

      await collection.replace(docKey, airport, { cas: result.cas });

      // success!
      break;
    } catch (e) {
      if (e instanceof couchbase.CasMismatchError) {
        console.log("CAS mismatch");
        // We could now re-fetch the document and try again
        continue;
      }

      // if we ran into another kind of error, let's re-throw it...
      throw e;
    }
  }
  // end::cas[]

  await insertExample(collection, "my-key");

  // tidy up
  await collection.remove("key-which-exists");
  await collection.remove("my-key");
  await cluster.close();
}

async function insertExample(collection, docKey) {
  // tag::insert[]
  for (let retryNum = 0; retryNum < 10; ++retryNum) {
    try {
      const result = await collection.insert(docKey, "some value", {
        durabilityLevel: couchbase.DurabilityLevel.PersistToMajority,
      });

      // success!
      break;
    } catch (e) {
      if (e instanceof couchbase.DocumentExistsError && retryNum > 0) {
        // If this is a retry and the document now exists, we can assume it was
        // written successfully by a previously ambiguous error.
        break;
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
  .then(() => console.log("DONE"))
  .catch((err) => {
    console.error("ERR:", err);
    process.exit(1);
  });
