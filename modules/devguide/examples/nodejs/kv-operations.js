/*
    Sample of various KV Operations
    - install Couchbase server
    - create Couchbase travel-sample bucket from Couchbase Admin console
    - create package.json from text below.
    # npm install
    # node kv-operations.js
    # access app at http://localhost:3000

 */
/* package.json 
cat <<EOF > package.jston
{
  "name": "site2",
  "version": "1.0.0",
  "description": "Hapi.js site2",
  "main": "app.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "couchbase",
  "license": "ISC",
  "dependencies": {
    "couchbase": "3.0.0",
    "hapi": "^18.1.0",
    "joi": "^14.3.1",
    "uuid": "^3.3.3"
  },
  "devDependencies": {},
  "keywords": []
}
EOF
*/

const Hapi = require("@hapi/hapi");
const RawStringTranscoder = require("./rawstringtranscoder");
const RawBinaryTranscoder = require("./rawbinarytranscoder");

// #tag::connection[]

const couchbase = require("couchbase");

const options = { username: 'Administrator', password: 'password' };
const cluster = new couchbase.Cluster("localhost", options);
// Open a specific Couchbase bucket, `travel-sample` in this case.
const bucket = cluster.bucket("travel-sample");
// And select the default collection
const collection = bucket.defaultCollection();

// #end::connection[]


const docKey = 'airport_77';
const binValKey = 'my-counter-2';
let document;
let cas;

const templateDocument = {
    airportname: "Santa Clara",
    city: "Santa Clara",
    country: "United States",
    faa: "SCC",
    geo: { "alt": 62, "lat": -121.928407, "lon": 37.368792 },
    icao: "LFAX",
    id: 77,
    type: "airport",
    tz: "America/Los_Angeles"
};

function init() {
    // try to get the cas for later use.  If doc does not exist, create it
    // #tag::getasync[]
    collection.get(docKey, { timeout: 1000 }, (err, res) => {
        if (res) {
            cas = res.cas;
            document = res.value;
            console.log("=========== existing");
        } else {
            if (err.cause.code !== 301 /* something other than document doesn't exist */) {
                console.log(err.toString());
            } else {
                try {
                    console.log("=========== inserting");
                    collection.insert(docKey, templateDocument,
                        (err, res) => {
                            if (res)
                                cas = res.cas;
                            document = templateDocument;
                        }).catch((e) => {
                            console.log("insert failed with " + e.stack)
                        });
                } catch (e) {
                    console.log("caught in init(1): " + e);
                }
            }
        }
    }).catch((e) => {
        console.log("caught in init(2): " + e)
    });
    // #end::getasync[]
}

init();

const server = new Hapi.Server({ "host": "localhost", "port": 3000 });

// handlers for HAPI

async function getHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::get[]
        const result = await collection.get(key);
        document = result.value;
        // #end::get[]
        cas = result.cas;
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function getwithoptionsHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::getwithoptions[]
        const result = await collection.get(key, { timeout: 1000 });
        document = result.value;
        // #end::getwithoptions[]
        cas = result.cas;
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function insertHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    [document.type, document.id] = key.split("_");
    try {
        // #tag::insert[]
        const result = await collection.insert(key, document);
        // #end::insert[]
        cas = result.cas; // JSCBC-669?
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString() + " - try 'remove' first if document exists");
    }
}

async function insertwithoptionsHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    [document.type, document.id] = key.split("_");
    try {
        // #tag::insertwithoptions[]
        const result = await collection.insert(key, document,
            { timeout: 10000 } // 10 seconds
        );
        // #end::insertwithoptions[]
        cas = result.cas; // JSCBC-669?
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString() + " - try 'remove' first if document exists");
    }
}

async function replaceHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::replace[]
        const result = await collection.replace(key,
            document,
            { cas: cas, expiry: 60, timeout: 5000 }
        );
        // #end::replace[]
        cas = result.cas; // JSCBC-669?
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString() + " - try 'get' to get current cas first");
    }
}

async function durabilityHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::durability[]
        let result = await collection.upsert(key, document,
            {
                expiry: 60,
                persist_to: 1,
                replicate_to: 0, // cannot replicate on single node
                timeout: 5000
            }
        );
        // #end::durability[]
        cas = result.cas; // JSCBC-669?
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString() + " - try 'get' to get current cas first");
    }
}

async function newdurabilityHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::newdurability[]
        let result = await collection.upsert(key, document,
            {
                expiry: 60,  // 60 seconds,
                durabilityLevel: couchbase.DurabilityLevel.None, // Majority etc.
                timeout: 5000
            } // 5 seconds
        );
        // #end::newdurability[]
        cas = result.cas; // JSCBC-669?
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString() + " - try 'get' to get current cas first");
    }
}

async function removeHandler(request, h) {
    // if cas is from some other document, this will fail.
    // is failing a good example of cas?  Or should we
    // 'get' the document to get the latest cas?
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::remove[]
        const result = await collection.remove(key,
            {
                cas: cas,
                persist_to: 0,  // non-zero gives "not implemented"
                replicate_to: 0, // cannot replicate on single node
                timeout: 5000
            }
        );
        // #end::remove[]
        return h.response(result);
    } catch (e) {
        console.log(e);
        if (e.cause.code === 305)
            return h.response(e.toString() + " - try 'get' to get current cas first");
        return h.response(e.toString());
    }
}

async function touchHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::touch[]
        const result = await collection.touch(key, 100); // 100 seconds
        // #end::touch[]
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function touchwithoptionsHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::touchwithoptions[]
        const result = await collection.touch(key, 100,  // 100 seconds
            { timeout: 5000 } // 5 seconds
        );
        // #end::touchwithoptions[]
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function incrementHandler(request, h) {
    // #tag::increment[]
    // increment binary value by 1
    const result = await collection.binary().increment(binValKey, 1);
    // #end::increment[]
    return h.response(result);
}

async function incrementwithoptionsHandler(request, h) {
    try {
        // #tag::incrementwithoptions[]
        // increment binary value by 1, if binValKey doesn’t exist, seed it at 1000
        const result = await collection.binary().increment(binValKey, 1, {
            initial: 1000,
            timeout: 5000
        });
        // #end::incrementwithoptions[]
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function decrementHandler(request, h) {
    try {
        // #tag::decrement[]
        // decrement binary value by 1
        const result = await collection.binary().decrement(binValKey, 1);
        // #end::decrement[]
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function decrementwithoptionsHandler(request, h) {
    try {
        // #tag::decrementwithoptions[]
        // decrement binary value by 1, if binValKey doesn’t exist, seed it at 1000
        const result = await collection.binary().decrement(binValKey, 1,
            {
                initial: 1000,
                timeout: 5000
            },
        );
        // #end::decrementwithoptions[]
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function updatewithretryHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::updatewithretry[]
        var maxRetries = 10;
        for (var i = 0; i < maxRetries; ++i) {
            // Get the current document contents
            console.log("get " + i);
            var result = await collection.get(key);
            cas = result.cas;
            console.log("CAS:", cas.toString('utf8'));
            if (i == 0) {
                console.log("upsert");
                let result = await collection.upsert(key, document);
                console.log("CAS:", result.cas.toString('utf8'));
            }

            try {
                // Attempt to replace the document using CAS
                console.log("replace");
                await collection.replace(key, document, { cas: result.cas });
                cas = result.cas;
            } catch (e) {
                // Check if the error thrown is a cas mismatch, if it is, we retry
                if (e instanceof couchbase.CasMismatchError || e instanceof couchbase.DocumentExistsError) {
                    console.log(e.toString());
                    continue;
                }
                throw e;
            }
            // If no errors occured during the replace, we can exit our retry loop
            break;
        }
        // #end::updatewithretry[]
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
    return h.response(result);
}

async function lockupdateHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::lockupdate[]
        var result = await collection.getAndLock(key, 1000);
        document = result.value;
        cas = result.cas;
        // if we decided not to update, unlock
        //    await collection.unlock(key, result.cas);
        // else ...
        // Attempt to replace the document using CAS
        await collection.replace(key, document, { cas: result.cas });
        // #end::lockupdate[]
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
    cas = result.cas; // JSCBC-669?
    return h.response(result);
}

async function promisesHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::promises[]
        var results = await Promise.all([
            collection.get(key),
            collection.get('airport_1254')
        ]);
        // #end::promises[]
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
    cas = results[0].cas;
    return h.response(results);
}

async function callbackHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        return new Promise((resolve) => {
            // #tag::callback[]
            collection.get(key,
                (err, res) => {
                    if (err) console.log(err);
                    if (res) {
                        console.log(res);
                        resolve(res);
                    };
                }
            );
            // #end::callback[]
        });
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function batchHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::batch[]
        [res0, res1] = await Promise.all([
            collection.get(key),
            collection.get('airport_1254')
        ]);
        // #end::batch[]
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
    cas = res0.cas; // save for next call
    return h.response([res0, res1]);
}

var sampleColl;

function initCollection() {

    // #tag::opencollections[]

    try {
        // tag::userscollection[]
        const sampleOptions = { username: 'Administrator', password: 'password' };
        const sampleCluster = new couchbase.Cluster("localhost", sampleOptions);
        const sampleBucket = sampleCluster.bucket("travel-sample");
        const sampleScope = sampleBucket.scope("tenant_agent_00");
        sampleColl = sampleScope.collection("users");
        // end::userscollection[]
    } catch (e) {
        console.log("travel-sample bucket, scope or collection not set up?");
        console.log(e);
    }

    // #end::opencollections[]

}

async function getcollectiondocHandler(request, h) {

    if (!sampleColl) initCollection();

    var result;
    var user = request.query.k ? request.query.k : 'user_77';
    try { // ensure 'user_77' works.  Others specified in parameter k  will return doc not found
        var collDocument;
        collDocument = { id: '77', type: 'user', first: 'Davey', last: 'Crockett' };
        await sampleColl.upsert('user_77', collDocument)
            .catch((e) => { console.log("catch at await:"); console.log(+e); });
    } catch (e) {
        console.log("caught calling upsert:");
        console.log(e);
        return h.response(e.toString());
    }
    try {
        // #tag::getcollectiondoc[]
        result = await sampleColl.get(user);
        // #end::getcollectiondoc[]
    } catch (e) {
        if (e.cause && e.cause.code === 301) {
            return h.response('user ' + user + ' document not found in collection ' + sampleColl._name + ' (' + e + ')').code(404);
        }
        console.log('err=' + e);
        return h.response(e.toString());
    }
    return h.response(result);
}

async function upsertnamedcollectionHandler(request, h) {
    if (!sampleColl) initCollection();

    var user = request.query.k ? request.query.k : 'user-key';
    try {
        // tag::namedcollectionupsert[]
        let collDocument = { name: 'John Doe', preferred_email: 'johndoe111@test123.test' };
        result = await sampleColl.upsert(user, collDocument);
        // end::namedcollectionupsert[]
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

async function viewqueryHandler(request, h) {
    /*
    Create Development View 
    Design document = design/dev_airports   name = airport_view
    
    function (doc, meta) {
      if (doc.airportname)
        emit(meta.id, doc.airportname);
    }
    
    check that you have the map :
     curl -u Administrator:password  'http://localhost:8092/travel-sample/_design/dev_airports'
    {"views":{"airport_view":{"map":"function (doc, meta) {\n  if (doc.airportname)\n    emit(meta.id, doc.airportname);\n}"}}}
    
    */
    const key = request.query.k ? request.query.k : docKey;
    var range = {};
    if (request.query.s)
        range.start = request.query.s;
    if (request.query.e)
        range.end = request.query.e;
    const end = request.query.e ? request.query.e : 'z';
    try {
        // #tag::viewquery[]
        const result = await bucket.viewQuery(
            'dev_airports', 'airport_view', {
            range: range,
            limit: 100,
        }
        );
        document = result.value;
        // #end::viewquery[]
        cas = result.cas;
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}


async function customtranscoder_stringHandler(request, h) {

    const key = request.query.k ? request.query.k : 'string_123';
    // #tag::customtranscoder_string[]
    try {
        await collection.upsert('string_123', 'my string',
            { transcoder: new RawStringTranscoder() },
        ).catch((e) => { console.log("caught exception from upsert: "); console.log(e); console.log(e.cause) });
    } catch (e) {
        console.log("try/catch: ");
        console.log(e);
        return h.response(e.toString());
    }

    try {
        const result = await collection.get(key,
            { transcoder: new RawStringTranscoder() }
        ).catch((e) => { console.log("caught exception from get: "); console.log(e); console.log(e.cause) });
        var output = result.value;
        console.log('output : type=' + (typeof output) + ' value=' + output);
        return h.response(output);
    } catch (e) {
        console.log("get try/catch: ");
        console.log(e);
        return h.response(e.toString());
    }
    // #end::customtranscoder_string[]
}

async function customtranscoder_binaryHandler(request, h) {
    /*
    var hugeArray = [];
    for (var i = 0; i < 20000000 ; i ++) {
        hugeArray.push(Math.ceil(Math.random()*100))
    }
    var buf=Buffer.from(hugeArray);
    */

    const key = request.query.k ? request.query.k : 'binary_123';
    // #tag::customtranscoder_binary[]
    try {
        await collection.upsert('binary_123', Buffer.from('my binary'),
            { transcoder: new RawBinaryTranscoder() },
        ).catch((e) => console.log(e));
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }

    try {
        const result = await collection.get(key,
            { transcoder: new RawBinaryTranscoder() },
        )
        var output = result.value;
        return h.response(output);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
    // #end::customtranscoder_binary[]
}

async function kvRangeScanOperations() {
    let result
    // tag::range-scan-all-documents[]
    const { RangeScan } = require('couchbase/dist/rangeScan')

    result = await collection.scan(new RangeScan()) // <1>
    result.forEach((r) => {
      console.log(`Found result, ID=${r.id}, content=`, r.content)
    })
    // end::range-scan-all-documents[]
  
    // tag::range-scan-all-document-ids[]
    result = await collection.scan(new RangeScan(), {idsOnly: true})
    result.forEach((r) => {
      console.log(`Found result, ID=${r.id}`)
    })
    // end::range-scan-all-document-ids[]
  
    // tag::range-scan-prefix[]
    const { PrefixScan } = require('couchbase/dist/rangeScan')

    result = await collection.scan(new PrefixScan('alice::'))
    result.forEach((r) => {
      console.log(`Found result, ID=${r.id}, content=`, r.content)
    })
    // end::range-scan-prefix[]
  
    // tag::range-scan-sample[]
    const { SamplingScan } = require('couchbase/dist/rangeScan')

    result = await collection.scan(new SamplingScan(100))
    result.forEach((r) => {
      console.log(`Found result, ID=${r.id}, content=`, r.content)
    })
    // end::range-scan-sample[]
}

function usage(request, h) {
    return h.response(
        "<table>" +
        "<tr>" +
        "<td>" +
        "<img src=\"http://docs.couchbase.com/_/img/logo.svg\" alt=\"Couchbase\">" +
        "</td>" +
        "</tr>" +
        "<tr><td><a href='get'>/get</a></td></tr>" +
        "<tr><td><a href='getwithoptions'>/getwithoptions</a></td></tr>" +
        "<tr><td><a href='insert'>/insert</a></td></tr>" +
        "<tr><td><a href='insertwithoptions'>/insertwithoptions</a></td></tr>" +
        "<tr><td><a href='replace'>/replace</a></td></tr>" +
        "<tr><td><a href='remove'>/remove</a></td></tr>" +
        "<tr><td><a href='durability'>/durability</a></td></tr>" +
        "<tr><td><a href='newdurability'>/newdurability</a></td></tr>" +
        "<tr><td><a href='touch'>/touch</a></td></tr>" +
        "<tr><td><a href='touchwithoptions'>/touchwithoptions</a></td></tr>" +
        "<tr><td><a href='increment'>/increment</a></td></tr>" +
        "<tr><td><a href='incrementwithoptions'>/incrementwithoptions</a></td></tr>" +
        "<tr><td><a href='decrement'>/decrement</a></td></tr>" +
        "<tr><td><a href='decrementwithoptions'>/decrementwithoptions</a></td></tr>" +
        "<tr><td><a href='updatewithretry'>/updatewithretry</a></td></tr>" +
        "<tr><td><a href='lockupdate'>/lockupdate</a></td></tr>" +
        "<tr><td><a href='promises'>/promises</a></td></tr>" +
        "<tr><td><a href='callback'>/callback</a></td></tr>" +
        "<tr><td><a href='batch'>/batch</a></td></tr>" +
        "<tr><td><a href='getcollectiondoc'>/getcollectiondoc</a></td></tr>" +
        "<tr><td><a href='viewquery'>/viewquery</a></td></tr>" +
        "<tr><td><a href='customtranscoder_string'>/customtranscoder_string</a></td></tr>" +
        "<tr><td><a href='customtranscoder_binary'>/customtranscoder_binary</a></td></tr>" +
        "<tr><td><a href='upsertnamedcollection'>/upsertnamedcollection</a></td></tr>" +
        "<tr><td>&nbsp</td></tr>" +
        "<tr><td><a href='get?k=airport_1254'>/get?k=airport_1254</a></td></tr>" +

        "</table>"
    );
}

server.route({
    method: "GET",
    path: "/get",
    handler: async (request, h) => {
        return await getHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/getwithoptions",
    handler: async (request, h) => {
        return await getwithoptionsHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/insert",
    handler: async (request, h) => {
        return await insertHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/insertwithoptions",
    handler: async (request, h) => {
        return await insertwithoptionsHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/replace",
    handler: async (request, h) => {
        return await replaceHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/durability",
    handler: async (request, h) => {
        return await durabilityHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/newdurability",
    handler: async (request, h) => {
        return await newdurabilityHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/remove",
    handler: async (request, h) => {
        return await removeHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/touch",
    handler: async (request, h) => {
        return await touchHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/touchwithoptions",
    handler: async (request, h) => {
        return await touchwithoptionsHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/increment",
    handler: async (request, h) => {
        return await incrementHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/incrementwithoptions",
    handler: async (request, h) => {
        return await incrementwithoptionsHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/decrement",
    handler: async (request, h) => {
        return await decrementHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/decrementwithoptions",
    handler: async (request, h) => {
        return await decrementwithoptionsHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/updatewithretry",
    handler: async (request, h) => {
        return await updatewithretryHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/lockupdate",
    handler: async (request, h) => {
        return await lockupdateHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/promises",
    handler: async (request, h) => {
        return await promisesHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/callback",
    handler: async (request, h) => {
        return await callbackHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/batch",
    handler: async (request, h) => {
        return await batchHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/getcollectiondoc",
    handler: async (request, h) => {
        return await getcollectiondocHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/viewquery",
    handler: async (request, h) => {
        return await viewqueryHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/customtranscoder_string",
    handler: async (request, h) => {
        return await customtranscoder_stringHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/customtranscoder_binary",
    handler: async (request, h) => {
        return await customtranscoder_binaryHandler(request, h);
    }
});

server.route({
    method: "GET",
    path: "/upsertnamedcollection",
    handler: async (request, h) => {
        return await upsertnamedcollectionHandler(request, h);
    }
})

server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
        return usage(request, h);
    }
});
server.route({
    method: "GET",
    path: "/quit",
    handler: (request, h) => {
        // #tag::disconnection[]
        cluster.close();
        // #end::disconnection[]
        process.exit(0);
    }
});

// start the server

console.log("Starting at " + server.info.uri);

server.start(error => {
    if (error) {
        throw error;
    }
    console.log("Listening at " + server.info.uri);
});


