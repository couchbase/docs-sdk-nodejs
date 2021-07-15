"use strict";

const couchbase = require("couchbase");
const crypto = require("cbfieldcrypt/dist/crypto");
const aesprovider = require("cbfieldcrypt/dist/aesprovider");
const keyring = require("cbfieldcrypt/dist/keyring");
const legacyaesdecrypter = require("cbfieldcrypt/dist/legacyaesdecrypter");

async function oldAnnotation() {
  // tag::oldannotation[]
  const mgr = new crypto.DefaultCryptoManager({
    encryptedFieldPrefix: '__crypt_'
  })
  // end::oldannotation[]

  const key = new keyring.Key("mykey", keyBuffer);
  const insecureKeyring = new keyring.InsecureKeyring(key);

  // tag::legacy[]
  const decrypter = new legacyaesdecrypter.LegacyAes256Decrypter(insecureKeyring, (publicKey) => {
    if (publicKey == "mykey") {
      return "myhmackey"
    }

    throw Error("unknown key")
  });

  mgr.registerDecrypter(decrypter);
  // end::legacy[]
}

async function go() {
  const cluster = new couchbase.Cluster("couchbase://localhost", {
    username: "Administrator",
    password: "password",
  });

  const bucket = cluster.bucket("travel-sample")
  const collection = bucket.scope("tenant_agent_00").collection("users");

  // tag::keys[]
  const keyBuffer = Buffer.from(
    '000102030405060708090a0b0c0d0e0f' +
    '101112131415161718191a1b1c1d1e1f' +
    '202122232425262728292a2b2c2d2e2f' +
    '303132333435363738393a3b3c3d3e3f',
    'hex'
  ); // output in string format: 123456789:;<=>?

  const key1 = new keyring.Key("mykey", keyBuffer);
  const key2 = new keyring.Key("myotherkey", keyBuffer);

  // Create an insecure keyring and add two keys.
  const insecureKeyring = new keyring.InsecureKeyring(key1, key2);
  // end::keys[]

  // tag::provider[]
  // Create a provider.
  // AES-256 authenticated with HMAC SHA-512. Requires a 64-byte key.
  const provider = new aesprovider.AeadAes256CbcHmacSha512Provider(insecureKeyring);

  // Create the manager and add the providers.
  const mgr = new crypto.DefaultCryptoManager();

  // We need to create and then register encrypters.
  // The key ID here is used by the encrypter to lookup the key from the store when encrypting a document.
  // The key ID returned from the store at encryption time is written into the data for the field to be encrypted.
  // The key ID that was written is then used on the decrypt side to find the corresponding key from the store.
  const keyOneEncrypter = provider.encrypterForKey(key1.id);
  const keyTwoEncrypter = provider.encrypterForKey(key2.id);

  // We register the providers for both encryption and decryption.
  // The alias used here is the value which corresponds to the "encryptionKey" field property
  // in the CryptoSchema.
  mgr.registerEncrypter('one', keyOneEncrypter);
  mgr.registerEncrypter('two', keyTwoEncrypter);

  // We don't need to add a default encryptor but if we do then any fields with an
  // empty encryption key will use this encryptor.
  mgr.defaultEncrypter(keyOneEncrypter);

  // We only set one decrypter per algorithm.
  // The crypto manager will work out which decrypter to use based on the `alg` field embedded in the field data.
  // The decrypter will use the key ID embedded in the field data to determine which key to fetch from the key store for decryption
  mgr.registerDecrypter(provider.decrypter());
  // end::provider[]

  // tag::crypto-schema[]
  // CryptoSchema is used to register which fields to apply the encryption to.
  const schema = mgr.newCryptoSchema({
    fields: {
      'password': {
        encryptionKey: 'one'
      },
      'addresses': {
        fields: {
          'houseName': {
            encryptionKey: 'one'
          },
          'street': {
            fields: {
              'secondLine': {
                encryptionKey: 'two'
              }
            }
          },
          'attributes': {
            fields: {
              'action': {
                encryptionKey: 'two'
              }
            }
          }
        },
        encryptionKey: 'two'
      },
      'phone': {
        encryptionKey: '',
      }
    }
  });
  // end::crypto-schema[]

  // tag::upsert[]
  const person = {
    firstName: 'Barry',
    lastName: 'Sheen',
    password: 'bang!',
    addresses: [
      {
        houseName: 'my house',
        street: [
          {
            firstLine: 'my street',
            secondLine: 'my second line'
          }
        ]
      },
      {
        houseName: 'my other house'
      }
    ],
    phone: '123456'
  };

  const encryptedDoc = schema.encrypt(person);
  await collection.upsert("p1", encryptedDoc);
  // end::upsert[]

  console.log("\n---- [fle] Get Result ----")
  // tag::get[]
  const result = await collection.get("p1");
  const resData = result.content;
  console.log(JSON.stringify(resData, null, "  "));
  // end::get[]

  console.log("\n---- [fle] Decrypt Result ----")
  // tag::decrypt[]
  const decryptedDoc = schema.decrypt(encryptedDoc);
  console.log(JSON.stringify(decryptedDoc, null, "  "));
  // end::decrypt[]
}

go()
  .then((res) => console.log("DONE:", res))
  .catch((err) => console.error("ERR:", err))
  .then(process.exit);
