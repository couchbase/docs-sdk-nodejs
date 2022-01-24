const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })
  const bucket = cluster.bucket('travel-sample')
  const hotelCollection = bucket.scope('inventory').collection('hotel')

  const insert = async () => {
    console.log('[kv-insert]')
    // tag::kv-insert[]
    // Create a document object.
    const document = {
      id: 123,
      name: 'Medway Youth Hostel',
      address: 'Capstone Road, ME7 3JE',
      url: 'http://www.yha.org.uk',
      geo: {
        lat: 51.35785,
        lon: 0.55818,
        accuracy: 'RANGE_INTERPOLATED',
      },
      country: 'United Kingdom',
      city: 'Medway',
      state: null,
      reviews: [
        {
          content:
            'This was our 2nd trip here and we enjoyed it more than last year.',
          author: 'Ozella Sipes',
          date: new Date().toISOString(),
        },
      ],
      vacancy: true,
      description: '40 bed summer hostel about 3 miles from Gillingham.',
    }

    // Insert the document in the hotel collection.
    const insertResult = await hotelCollection.insert('hotel-123', document)

    // Print the result's CAS metadata to the console.
    console.log('CAS:', insertResult.cas)
    // end::kv-insert[]
  }

  const insertWithOpts = async () => {
    console.log('\n[kv-insert-with-opts]')
    // tag::kv-insert-with-opts[]
    document = {
      id: 456,
      title: 'Ardèche',
      name: 'La Pradella',
      address: 'rue du village, 07290 Preaux, France',
      phone: '+33 4 75 32 08 52',
      url: 'http://www.lapradella.fr',
      country: 'France',
      city: 'Preaux',
      state: 'Rhône-Alpes',
      vacancy: false,
    }

    // Insert the document with an expiry time option of 60 seconds.
    const insertResult = await hotelCollection.insert('hotel-456', document, {
      expiry: 60,
    })

    // Print the result's CAS metadata to the console.
    console.log('CAS:', insertResult.cas)
    // end::kv-insert-with-opts[]
  }

  const get = async () => {
    console.log('\n[kv-get]')
    // tag::kv-get[]
    const getResult = await hotelCollection.get('hotel-123')

    // Print some result metadata to the console.
    console.log('CAS:', getResult.cas)
    console.log('Data:', JSON.stringify(getResult.content, null, '  '))
    // end::kv-get[]
  }

  const getWithOpts = async () => {
    console.log('\n[kv-get-with-opts]')
    // tag::kv-get-with-opts[]
    const getResult = await hotelCollection.get('hotel-456', {
      withExpiry: true,
    })

    // Print some result metadata to the console.
    console.log('CAS:', getResult.cas)
    console.log('Data:', JSON.stringify(getResult.content, null, '  '))
    console.log('Expiry time:', getResult.expiryTime)
    // end::kv-get-with-opts[]
  }

  const getSubDoc = async () => {
    console.log('\n[kv-get-subdoc]')
    // tag::kv-get-subdoc[]
    const lookupInResult = await hotelCollection.lookupIn('hotel-123', [
      couchbase.LookupInSpec.get('geo'),
    ])
    console.log('CAS:', lookupInResult.cas)
    console.log('Geo:', lookupInResult.content[0].value)
    // end::kv-get-subdoc[]
  }

  const updateReplace = async () => {
    console.log('\n[kv-update-replace]')
    // tag::kv-update-replace[]
    // Fetch an existing hotel document.
    getResult = await hotelCollection.get('hotel-123')
    const existingDoc = getResult.content

    // Get the current CAS value.
    const currentCas = getResult.cas
    console.log('Current CAS:', currentCas)

    // Add a new review to the reviews array.
    existingDoc['reviews'].push({
      content: 'This hotel was cozy, conveniently located and clean.',
      author: "Carmella O'Keefe",
      date: new Date().toISOString(),
    })

    // Update the document with new data and pass the current CAS value.
    const replaceResult = await hotelCollection.replace(
      'hotel-123',
      existingDoc
    )

    // Print the new CAS value.
    console.log('New CAS:', replaceResult.cas)
    // end::kv-update-replace[]
  }

  const updateUpsert = async () => {
    console.log('\n[kv-update-upsert]')
    // Create a document object.
    const document = {
      id: 123,
      name: 'Medway Youth Hostel',
      address: 'Capstone Road, ME7 3JE',
      url: 'http://www.yha.org.uk',
      country: 'United Kingdom',
      city: 'Medway',
      state: null,
      vacancy: true,
      description: '40 bed summer hostel about 3 miles from Gillingham.',
    }

    // tag::kv-update-upsert[]
    // Update or create a document in the hotel collection.
    const upsertResult = await hotelCollection.upsert('hotel-123', document)

    // Print the result's CAS metadata to the console.
    console.log('CAS:', upsertResult.cas)
    // end::kv-update-upsert[]
  }

  const updateSubDoc = async () => {
    console.log('\n[kv-update-subdoc]')
    // tag::kv-update-subdoc[]
    const mutateInResult = await hotelCollection.mutateIn('hotel-123', [
      couchbase.MutateInSpec.upsert('pets_ok', true),
    ])
    console.log('CAS:', mutateInResult.cas)
    // end::kv-update-subdoc[]
  }

  const removeSubDoc = async () => {
    console.log('\n[kv-remove-subdoc]')
    // tag::kv-remove-subdoc[]
    mutateInResult = await hotelCollection.mutateIn('hotel-123', [
      couchbase.MutateInSpec.remove('url'),
    ])
    console.log('CAS:', mutateInResult.cas)
    // end::kv-remove-subdoc[]
  }

  const remove = async () => {
    console.log('\n[kv-remove]')
    // tag::kv-remove[]
    const removeResult = await hotelCollection.remove('hotel-123')
    console.log('CAS:', removeResult.cas)
    // end::kv-remove[]
  }

  await insert()
  await insertWithOpts()
  await get()
  await getWithOpts()
  await getSubDoc()
  await updateReplace()
  await updateUpsert()
  await updateSubDoc()
  await removeSubDoc()
  await remove()
}

go().then(process.exit)
