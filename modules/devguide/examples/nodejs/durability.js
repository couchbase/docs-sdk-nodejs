// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
var cluster = new couchbase.Cluster('couchbase://127.0.0.1', options);

// Setup Bucket object to be reused within the code
var bucket = cluster.bucket('travel-sample');
const collection = bucket.defaultCollection();

// Setup a Document and store in the bucket.
var key = "nodeDevguideExampleDurability";

persistExample(function(persistComplete){
    if(persistComplete){
        replicateExample(function(replicateComplete){
            if(replicateComplete){
                replicateAndPersistExample(function(replicateAndPersistComplete){
                    if(replicateAndPersistComplete) {
                        console.log('Example Successful - Exiting');
                        process.exit(0);
                    }
                });
            }
        });
    }
});

function persistExample(done) {

    // Create a document and assign a "Persist To" value of 1 node.
    // Should Always Succeed, even on single node cluster.
    console.log("==========================================");
    console.log("  BEGIN EXAMPLE: Persist To 1 node");
    collection.upsert(key+"_1", {test: "Some Test Value 1"}, {durabilityPersistTo: 1}, function (err, res) {
        if (err) throw err;

        if (res) {
            console.log("    Initialized Document, stored to bucket");

            // Get Document
            collection.get(key+"_1", function (err, resRead) {
                if (err) throw err;

                // Print Document Value
                console.log("    Retrieved Document:", resRead.value);
                console.log("  END EXAMPLE");
                console.log("==========================================");
                done(true);
            });
        }
    });
}

function replicateExample(done) {

    // Create a document and assign a "Replicate To" value of 1 node.
    // Should Fail on a single node cluster, succeed on a multi node
    // cluster of 3 or more nodes with at least one replica enabled.
    console.log("==========================================");
    console.log("  BEGIN EXAMPLE: Replicate To 0 node");
    collection.upsert(key+"_2", {test: "Some Test Value 2"}, {durabilityReplicateTo: 0}, function (err, res) {
        if (err) throw err;

        if (res) {
            //console.log("    CALLBACK: RESULT", res);
            console.log("    Initialized Document, stored to bucket");

            // Get Document
            collection.get(key+"_2", function (err, resRead) {
                if (err) throw err;

                // Print Document Value
                console.log("    Retrieved Document:", resRead.value);
                console.log("  END EXAMPLE");
                console.log("==========================================");
                done(true);
            });
        }
    });
}

function replicateAndPersistExample(done) {

    // Create a document and assign a "Replicate To" and a "Persist TO"
    // value of 1 node. Should Fail on a single node cluster, succeed on
    // a multi node cluster of 3 or more nodes with at least one replica
    // enabled.
    console.log("==========================================");
    console.log("  BEGIN EXAMPLE: Replicate To 0 and Persist To 1 node");
    collection.upsert(key+"_3", {test: "Some Test Value 3"}, {durabilityReplicateTo: 0, durabilityPersistTo:1}, function (err, res) {
        if (err) throw err;

        if (res) {
            //console.log("    CALLBACK: RESULT", res);
            console.log("    Initialized Document, stored to bucket");

            // Get Document
            collection.get(key+"_3", function (err, resRead) {
                if (err) throw err;

                // Print Document Value
                console.log("    Retrieved Document:", resRead.value);
                console.log("  END EXAMPLE");
                console.log("==========================================");
                done(true);
            });
        }
    });
}

