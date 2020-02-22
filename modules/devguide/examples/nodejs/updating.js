// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();

// Setup a new Document and store in the bucket
var key = "nodeDevguideExampleReplace";
collection.remove(key, function (err, res) {// remove if already exists
    collection.insert(key, {test: "Some Test Value"}, function (err, res) {
        if (err) throw err;

        console.log('Initialized Document, stored to bucket');

        // Get Document
        collection.get(key, function (err, resRead) {
            if (err) throw err;

            // Print Document Value
            console.log("Retrieved Document:", resRead.value);

            // Add to value, and replace
            resRead.value.test2 = 'Some More Test Values';
            var updatedVal = JSON.stringify(resRead.value);
            collection.replace(key, updatedVal, function (req, resUpdated) {
                if (err) throw err;

                // Get Replaced Document Value
                collection.get(key, function (err, resReadUpdated) {
                    if (err) throw err;

                    // Print Document Value
                    console.log("Retrieved Document:", resReadUpdated.value);

                    console.log('Example Successful - Exiting');
                    process.exit(0);
                });
            });
        });
    });
});
