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
var cas;

// Run the example
verifyNodejsVersion()
    .then(storeInitial)
    .then(lookupEntireDocument)
    .then(subdocItemLookupTwoFields)
    .then(subdocArrayAdd)
    .then(subdocAddXattr)
    .then(lookupEntireDocument)
    .then(subdocArrayManipulation)
    .then(subDocumentItemLookup)
    .then(subDocumentItemExpiry)
    .then(subDocumentItemCas)
    .then(subDocumentItemReplace)
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

async function storeInitial() {
    await collection.remove(key, 
    (err, res) => {
        console.log('Initialized document, removed document.');
    }).catch((e)=> console.log("removing document: "+e));

    return await collection.upsert(key, {
        firstItem: "Some Test Field Data for firstItem",
        secondItem: "Some Test Field Data for the secondItem" ,
        thirdItem: "Some Test Field Data for thirdItem"
    }, (err, res) => {
        if (err) throw(err);
        console.log('Initialized document, stored to bucket...');
    });
}

async function lookupEntireDocument() {
    return await collection.get(key, (err, resReadFullDoc) => {
        if (err) throw(err);
        console.log("Retrieve full cas: "+ resReadFullDoc.cas +" document:", resReadFullDoc.value, "\n", "\n");
    });
}

async function subDocumentItemLookup() {
    console.log("lookup fourth item");
    return await collection.lookupIn(key, [
            couchbase.LookupInSpec.get("fourthItem")],
        (err, resSubdocOp) => {
            if (err) throw(err);
            console.log("Retrieve modified fourth item:");
            cas = resSubdocOp.cas;
            console.log("cas: "+cas);
            console.log(resSubdocOp);
            resSubdocOp.results.forEach((rr) => {
                console.log(rr.value);
                console.log(rr);
            });
        });
}
async function subDocumentItemExpiry() {
    const result = await collection.touch(key,  100000);
    console.log("++++++++++++++++++++++++++++++++ lookup expiry/cas with XATTR");
    return await collection.lookupIn(key, [
            couchbase.LookupInSpec.get( '{}' /* couchbase.LookupInSpec.getExpiry() */)],
        (err, resSubdocOp) => {
            if (err) throw(err);
            console.log("Retrieve expiry/cas :"); console.log(resSubdocOp);
            resSubdocOp.results.forEach((rr) => {
                console.log(rr.value);
                console.log(rr);
            });
        });
}

async function subDocumentItemCas() {
    console.log("===================> lookup fourth item Cas");
    return await collection.mutateIn(key, [
            couchbase.MutateInSpec.upsert('fourthItem' , new couchbase.MutateInSpec.CasPlaceholder() )],
        (err, resSubdocOp) => {
            if (err) { console.log(err); console.log(err.cause) ; throw(err); }
            console.log("result from modifying fourthItem ");
            cas = resSubdocOp.cas;
            console.log(resSubdocOp);
        });
}

async function subDocumentItemReplace() {
    console.log("Update the fourth item of the document... >>>>>>> cas: "+cas);
    return await collection.mutateIn(key,
        [couchbase.MutateInSpec.replace("fourthItem", ["333 GT SWB", "333 GTO", "333 LM", "275 GTB"])],
        { cas : cas },
        (err, resSubdocOp2) => {
            if (err) throw(err);
        });
}

async function subDocumentItemReplaceThird() {
    console.log("Update the third item of the document... >>>>>>> cas: "+cas);
    return await collection.mutateIn(key,
        [couchbase.MutateInSpec.replace("thirdItem", 'replacement text for thirdItem')],
        { cas : cas },
        (err, resSubdocOp2) => {
            if (err) throw(err);
        });
}

async function subdocItemLookupTwoFields() {
    return await collection.lookupIn(key, [
            couchbase.LookupInSpec.get("secondItem"),
            couchbase.LookupInSpec.get("thirdItem")
        ],
        (err, resSubdocOp1) => {
            if (err) throw(err);
            console.log("Retrieve just second and third items:\n", resSubdocOp1, "\n", "\n");
        });
}

async function subdocArrayAdd() {
    console.log("Add array to the fourth item of the document...");
    return await collection.mutateIn(key,
        [couchbase.MutateInSpec.upsert("fourthItem", ["250 GT SWB", "250 GTO", "250 LM", "275 GTB"])],
        (err, resSubdocOp2) => {
            if (err) throw(err);
        });
}

async function subdocAddXattr() {
    console.log("Add xattr macro item of the document...");
    await collection.mutateIn(key,
        [couchbase.MutateInSpec.insert("here_17", new couchbase.MutateInSpec.CasPlaceholder())],
        (err, resSubdocOp2) => {
            if (err) throw(err);
            console.log(resSubdocOp2);
            cas = resSubdocOp2.cas;
            console.log("cas: "+cas);
        });

    console.log("lookup xattr  item  of the document...");
    await collection.lookupIn(key, [
            couchbase.LookupInSpec.get("here_17",{xattr:true})
        ],
        (err, resSubdocOp1) => {
            if (err) throw(err);
            console.log(resSubdocOp1);
        });

    await lookupEntireDocument();

    await subDocumentItemReplaceThird();

    console.log("Update xattr macro item of the document...");
    await collection.mutateIn(key,
        [couchbase.MutateInSpec.upsert("here_17", new couchbase.MutateInSpec.CasPlaceholder())],
        (err, resSubdocOp2) => {
            if (err) throw(err);
            console.log(resSubdocOp2);
            cas = resSubdocOp2.cas;
            console.log("cas: "+cas);
        });

    console.log("lookup xattr  item  of the document...");
    await collection.lookupIn(key, [
            couchbase.LookupInSpec.get("here_17",{xattr:true})
        ],
        (err, resSubdocOp1) => {
            if (err) throw(err);
            console.log(resSubdocOp1);
        });

    console.log("replace xattr  item  of the document...");
    await collection.mutateIn(key,
        [couchbase.MutateInSpec.replace("here_17", new couchbase.MutateInSpec.CasPlaceholder())],
        (err, resSubdocOp2) => {
            if (err) throw(err);
            console.log(resSubdocOp2);
            cas = resSubdocOp2.cas;
            console.log("cas: "+cas);
        });
    console.log("replace remove xattr item  of the document...");
    await collection.mutateIn(key,
        [couchbase.MutateInSpec.remove("here_17", {xattr:true}) ],
        (err, resSubdocOp2) => {
            if (err) throw(err);
            console.log(resSubdocOp2);
            cas = resSubdocOp2.cas;
            console.log("cas: "+cas);
        });
    await lookupEntireDocument();
}

async function subdocArrayManipulation() {
    console.log("Add a value to a specific position, to the 'front' \n" +
        "  of the fourthItem Array, to the 'back' of the \n" +
        "  fourthItem Array, and another unique value to \n" +
        "  the back of the Array in one operation...");
    return await collection.mutateIn(key, [
            couchbase.MutateInSpec.arrayInsert("fourthItem[2]", '250 GTO Series II', {cas: "123"}),
            couchbase.MutateInSpec.arrayPrepend("fourthItem", '250 GT Lusso'),
            couchbase.MutateInSpec.arrayAppend("fourthItem", '275 GTB/4'),
            couchbase.MutateInSpec.arrayAddUnique("fourthItem", '288 GTO')
        ],
        (err, resSubdocOp3) => {
            if (err) throw(err);
            console.log(resSubdocOp3);
        });
}

async function subdocArrayRemoveItem() {
    console.log("Remove item at position three in fourth item array...");
    return await collection.mutateIn(key, [couchbase.MutateInSpec.remove("fourthItem[3]")],
        (err, resSubdocOp5) => {
            if (err) throw(err);
        });
}
