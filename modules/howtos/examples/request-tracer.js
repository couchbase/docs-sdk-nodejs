"use strict";

const { ThresholdLoggingTracer } = require("couchbase");
const couchbase = require("couchbase");

async function go() {
    const tracer = new ThresholdLoggingTracer({
        emitInterval: 1,
        kvThreshold: 0.1
    })
    
    const cluster = await couchbase.connect("couchbase://localhost", {
        username: "Administrator",
        password: "password",
        logFunc: (j) => { if (j.subsys == "tracer") { console.log(j) } },
        tracer
    })
    
    const collection = cluster.bucket("travel-sample").scope("inventory").collection("airline")
    
    await collection.upsert(
        "airline_11", {
            callsign: "MILE-AIR",
            iata: "Q5",
            icao: "MLA",
            id: 11,
            name: "40-Mile Air",
            type: "airline"
        }
    )
    await sleep(10)
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

go()
    .then((res) => console.log("DONE:", res))
    .catch((err) => {
        console.log("ERR:", err)
        process.exit(1)
    })
    .then(process.exit)
