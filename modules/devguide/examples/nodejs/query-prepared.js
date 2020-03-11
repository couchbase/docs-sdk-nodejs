// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");

function log(result) {
    console.log("Result:", result);
    console.log(result.meta.profile.phaseCounts);
    console.log(result.meta.profile.phaseTimes);
    console.log(result.meta.profile.phaseOperators);
    console.log("Time :", result.meta.metrics.elapsedTime);
}

function microsSince(hrTime0) {
    const hrTime = process.hrtime(hrTime0);
    var micros = hrTime[0] * 1000000 + hrTime[1] / 1000;
    return micros.toLocaleString();
}

// Make a N1QL specific Query, telling Couchbase this will be a prepared statement
const query = "SELECT airportname, city, country FROM `travel-sample` WHERE type=$1 AND city=$2";
var opts = {profile: "phases", adhoc: false, parameters: ["airport", "London"]};

// Timing Variables to compare execution times
var t1, t2, t3, t4;

// QUERY 1 - PREPARE AND EXECUTE
// Issue Query with parameters passed in array, running as a prepared statement
var hrTime1 = process.hrtime()
cluster.query(query, opts, function (err, result, meta) {
    console.log("micros: " + microsSince(hrTime1));
    if (err) {
        console.log(err);
        throw err;
    }

    // Print Results
    log(result);
    t1 = result.meta.metrics.elapsedTime;

    // QUERY 2 - EXECUTE THE IDENTICAL QUERY.
    // Try a the same query, again.  It should have a shorter elapsed time.
    var hrTime2 = process.hrtime()
    cluster.query(query, opts, function (err, result, meta) {
        console.log("micros: " + microsSince(hrTime2));
        if (err) {
            console.log(err);
            throw err;
        }

        // Print Results
        log(result);
        t2 = result.meta.metrics.elapsedTime;

        // QUERY 3 - EXECUTE THE PLAN
        // Try the same query, with different parameters.  It should also be fast.
        opts = {profile: "phases", adhoc: false, parameters: ["airport", "Seattle"]};
        var hrTime3 = process.hrtime()
        cluster.query(query, opts, function (err, result, meta) {
            console.log("micros: " + microsSince(hrTime3));
            if (err) {
                console.log(err);
                throw err;
            }

            // Print Results
            log(result);
            console.log(result.meta.metrics.elapsedTime);
            t3 = result.meta.metrics.elapsedTime;

            // QUERY 4 - EXECUTE THE ORIGINAL.
            // Try the original query, again.
            opts = {profile: "phases", adhoc: false, parameters: ["airport", "London"]};
            var hrTime4 = process.hrtime()
            cluster.query(query, opts, function (err, result, meta) {
                console.log("micros: " + microsSince(hrTime4));
                if (err) {
                    console.log(err);
                    throw err;
                }

                // Print Results
                log(result);
                t4 = result.meta.metrics.elapsedTime;

                console.log("=====");
                console.log("Query 1 - prepare, execute     :", t1);
                console.log("Query 2 - execute, same params :", t2);
                console.log("Query 3 - execute, new params  :", t3);
                console.log("Query 4 - execute, orig params :", t4);
                console.log("=====");
                console.log('Example Successful - Exiting');
                process.exit(0);
            });
        });
    });
});
