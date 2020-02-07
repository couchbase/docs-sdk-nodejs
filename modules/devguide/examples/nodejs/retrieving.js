// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();

// Setup a Document and store in the bucket.
var key = "nodeDevguideExampleRetrieve";
collection.remove(key, function (err, res) { // remove if already exists

    collection.insert(key, {test: "Some Test Value"}, function (err, res) {
        if (err) throw err;

        console.log('Initialized Document, stored to bucket');

        // Get Document
        collection.get(key, function (err, resRead) {
            if (err) throw err;

            // Print Document Value
            console.log("Retrieved Document:", resRead.value);

            console.log('Example Successful - Exiting');
            process.exit(0);
        });
    });
});
