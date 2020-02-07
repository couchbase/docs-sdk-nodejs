/*
    Sample of various KV Operations

 */

const url = require("url");
const Hapi = require("hapi");
const couchbase = require("couchbase");

const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();
const docKey = 'airport_77';
const binValKey = 'my-counter-2';
let document;
let cas;

const templateDocument = {
    airportname: "San Clara",
    city: "Santa Clara",
    country: "United States",
    faa: "SCC",
    geo: {"alt": 62, "lat": -121.928407, "lon": 37.368792},
    icao: "LFAX",
    id: 77,
    type: "airport",
    tz: "America/Los_Angeles"
};

function init() {
    // try to get the cas for later use.  If doc does not exist, create it
    // #tag::getasync[]
    collection.get(docKey, {timeout: 1000}, (err, res) => {
        if (res) {
            cas = res.cas;
            document = res.value;
            console.log("=========== existing`");
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

const server = new Hapi.Server({"host": "localhost", "port": 3000});

// handlers for HAPI

async function getHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::get[]
        const result = await collection.get(key);
        // #end::get[]
        cas = result.cas;
        document = result.value;
        return h.response(result);
    } catch (e) {
        console.log(e);
        return h.response(e.toString());
    }
}

/*
 * This example returns a promise rather than waiting for the result
 *
 */
async function getwithoptionsHandler(request, h) {
    const key = request.query.k ? request.query.k : docKey;
    try {
        // #tag::getwithoptions[]
        return collection.get(key, {timeout: 1000},
            (err, res) => {
                if (res) {
                    document = res.value;
                    cas = res.cas;
                }
            }).catch((e) => {
            console.log(e);
            return h.response(e.toString() + "<pre>" + e.stack + "</pre>");
        });
        // #end::getwithoptions[]
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
        cas = result.cas;
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
        const result = await collection.insert(key, document, {
            timeout: 10000, // 10 seconds
        });
        // #end::insertwithoptions[]
        cas = result.cas;
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
            document, {
                cas: cas,
                expiration: 60, // 60 seconds
                timeout: 5000, // 5 seconds
            });
        // #end::replace[]
        cas = result.cas;
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
        let result = await collection.upsert(key, document, {
            expiration: 60, // 60 seconds
            durabilityPersistTo: 1,
            durabilityReplicateTo: 0, // anything but 0 will fail on single-node cluster
            timeout: 5000, // 5 seconds
        });
        // #end::durability[]
        cas = result.cas;
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
        let result = await collection.upsert(key, document, {
            expiration: 60, // 60 seconds,
            durabilityLevel: couchbase.DurabilityLevel.None, // Majority etc.
            timeout: 5000, // 5 seconds
        });
        // #end::newdurability[]
        cas = result.cas;
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
        const result = await collection.remove(key, {
            cas: cas,
            persistTo: 1,
            replicateTo: 1,
            timeout: 5000, // 5 seconds
        });
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
        const result = await collection.touch(key, 10000);
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
        const result = await collection.touch(key, 30000, {
            timeout: 5000, // 5 seconds
        });
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
        const result = await collection.binary().increment(binValKey, 1,
            {initial: 1000, timeout: 5000},
            (err, res) => {
                console.log("res: " + JSON.stringify(res));
            });
        // #end::incrementwithoptions[]
        return h.response(result);
    } catch (e) {
        if (e.toString() === "Error: bad initial passed")
            return (h.response("JSCBC-670 must be fixed for 'inital' to be accepted"));
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
        const result = await collection.binary().decrement(binValKey, 1, {
            initial: 1000,
            timeout: 5000
        });
        // #end::decrementwithoptions[]
        return h.response(result);
    } catch (e) {
        if (e.toString() === "Error: bad initial passed")
            return (h.response("JSCBC-670 must be fixed for 'inital' to be accepted"));
        console.log(e);
        return h.response(e.toString());
    }
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
    path: "/",
    handler: (request, h) => {
        return usage(request, h);
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


