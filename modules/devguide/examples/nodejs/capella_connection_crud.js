/*
 * Copyright (c) 2026 Couchbase, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import couchbase from 'couchbase'

async function main() {
    // tag::connect[]
    const clusterConnStr = 'couchbases://cb.<your-endpoint>.cloud.couchbase.com'
    const username = 'username'
    const password = 'Password!123'
    const bucketName = 'travel-sample'

    const cluster = await couchbase.connect(clusterConnStr, {
        username: username,
        password: password,
        // Sets a pre-configured profile called "wanDevelopment" to help avoid latency issues
        // when accessing Capella from a different Wide Area Network
        // or Availability Zone (e.g. your laptop).
        configProfile: 'wanDevelopment',
    })
    // end::connect[]

    // tag::bucket[]
    const bucket = cluster.bucket(bucketName)
    // end::bucket[]

    // tag::collection[]
    const collection = bucket.scope('inventory').collection('airport')
    // end::collection[]

    // tag::json[]
    const json = {
        "status": "awesome"
    }
    // end::json[]

    // tag::upsert[]
    const docId = crypto.randomUUID()
    await collection.upsert(docId, json)
    // end::upsert[]

    // tag::get[]
    try {
        let getResult = await collection.get(docId)
        console.log('Couchbase is ' + getResult.content.status)
    } catch (e) {
        if (e instanceof couchbase.DocumentNotFoundError) {
            console.log("Document does not exist")
        } else {
            console.log(`Error: ${e}`)
        }
    }
    // end::get[]

    const newJson = {
        "status": "fast"
    }

    // tag::replace[]
    const replaceOpts = {
        expiry: 10,
        durabilityLevel: DurabilityLevel.Majority
    }
    await collection.replace(docId, newJson, replaceOpts)
    // end::replace[]

    // tag::remove[]
    await collection.remove(docId)
    // end::remove[]
}

main()
    .catch((err) => {
        console.log('ERR:', err);
        process.exit(1);
    })
    .then(() => process.exit());
