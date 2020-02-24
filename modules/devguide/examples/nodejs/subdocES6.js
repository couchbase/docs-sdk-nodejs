// This is a Couchbase subdoc api example written using ES6 features.  Please
//  ensure the version of nodejs installed in your environment is using at
//  at least version
'use strict';

// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();

// Key for example
var key = "nodeDevguideExampleSubdoc";

// Run the example
verifyNodejsVersion()
    .then(storeInitial)
    .then(lookupEntireDocument)
    .then(subdocItemLookupTwoFields)
    .then(subdocArrayAdd)
    .then(lookupEntireDocument)
    .then(subdocArrayManipulation)
    .then(subDocumentItemLookup)
    .then(subdocArrayRemoveItem)
    .then(subDocumentItemLookup)
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.log("ERR:", err)
        process.exit(0);
    });

function verifyNodejsVersion() {
    return new Promise(
        (resolve, reject) => {
            if (parseInt(((process.version).split("v"))[1].split(".")[0]) < 4) {
                console.log("\n  The nodejs version is too low.  This application requires\n" +
                    "  ES6 features, specifically: \n" +
                    "    --promises \n    --arrow functions \n" +
                    "  Please upgrade the nodejs version from:\n    --Current " +
                    process.version + "\n    --Minimum:4.0.0");
                reject();
            } else resolve();
        });
}

function storeInitial() {
    return collection.upsert(key, {
        firstItem: "Some Test Field Data for firstItem",
        secondItem: "Some Test Field Data for secondItem",
        thirdItem: "Some Test Field Data for thirdItem"
    }, (err, res) => {
        if (err) throw(err);
        console.log('Initialized document, stored to bucket...');
    });
}

function lookupEntireDocument() {
    return collection.get(key, (err, resReadFullDoc) => {
        if (err) throw(err);
        console.log("Retrieve full document:", resReadFullDoc.value, "\n", "\n");
    });
}

function subDocumentItemLookup() {
    return collection.lookupIn(key, [
            couchbase.LookupInSpec.get("fourthItem")],
        (err, resSubdocOp) => {
            if (err) throw(err);
            console.log("Retrieve modified fourth item:");
            resSubdocOp.results.forEach((rr) => {
                console.log(rr.value);
            });
        });
}

function subdocItemLookupTwoFields() {
    return collection.lookupIn(key, [
            couchbase.LookupInSpec.get("secondItem"),
            couchbase.LookupInSpec.get("thirdItem")
        ],
        (err, resSubdocOp1) => {
            if (err) throw(err);
            console.log("Retrieve just second and third items:\n", resSubdocOp1, "\n", "\n");
        });
}

function subdocArrayAdd() {
    console.log("Add array to the fourth item of the document...");
    return collection.mutateIn(key,
        [couchbase.MutateInSpec.upsert("fourthItem", ["250 GT SWB", "250 GTO", "250 LM", "275 GTB"])],
        (err, resSubdocOp2) => {
            if (err) throw(err);
        });
}

function subdocArrayManipulation() {
    console.log("Add a value to a specific position, to the 'front' \n" +
        "  of the fourthItem Array, to the 'back' of the \n" +
        "  fourthItem Array, and another unique value to \n" +
        "  the back of the Array in one operation...");
    return collection.mutateIn(key, [
            couchbase.MutateInSpec.arrayInsert("fourthItem[2]", '250 GTO Series II'),
            couchbase.MutateInSpec.arrayPrepend("fourthItem", '250 GT Lusso'),
            couchbase.MutateInSpec.arrayAppend("fourthItem", '275 GTB/4'),
            couchbase.MutateInSpec.arrayAddUnique("fourthItem", '288 GTO')
        ],
        (err, resSubdocOp3) => {
            if (err) throw(err);
        });
}

function subdocArrayRemoveItem() {
    console.log("Remove item at position three in fourth item array...");
    return collection.mutateIn(key, [couchbase.MutateInSpec.remove("fourthItem[3]")],
        (err, resSubdocOp5) => {
            if (err) throw(err);
        });
}
