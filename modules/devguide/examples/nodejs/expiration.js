// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();

// Setup a new Document, with 2 second expiry and store in in the Bucket
//		 - note -  API uses unix epoch time in seconds
var key = "nodeDevguideExampleExpiry";
collection.insert(key, {test: "Some Test Value"}, {expiry: 2}, function (err, res) {
    if (err) throw err;

    if (res) {

        console.log('Initialized Document With Expiry');

        // Get Document before Expiry
        collection.get(key, function (err, resPre) {
            if (err) throw err;

            if (resPre) {

                console.log('Retreived Document Before Expiry:', resPre.value);

                // Wait 4 seconds, and try to retrieve Document again
                setTimeout(function () {
                    collection.get(key, function (err, resExp) {
                        if (err) {

                            // Document expired, and should throw an error of not found
                            console.log('Document Expired:', err.message)
                            console.log('Example Successful - Exiting');
                            process.exit(0);
                        }
                    });
                }, 4000);
            }
        });
    }
});
