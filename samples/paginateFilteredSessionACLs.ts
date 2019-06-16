import { ArubaOsApiClient } from 'arubaos-api';

/**
 * This sample demonstrates how to use the `getModifiers` to paginate through a
 *   long list of items and with filters applied.
 * The object we are querying in this example are ACLs (`acl_sess`) but could be
 *   swapped for other objects.
 */
const main = async () => {
  try {
    const aosClient = new ArubaOsApiClient({
      host: '10.1.1.1',
      username: 'admin',
      password: 'password',
      strictSSL: false,
    });

    await aosClient.login();

    // Retrieve 5 items at a tiem.
    const pageSize = 5;
    let totalCount = 0;
    let curIndex = 1;

    // Iterate indefinitely until we've retrieve all items.
    while (true) {
      const allObjectsResponse = await aosClient.apiRequest({
        requestType: 'object',
        objectName: 'acl_sess',
        getModifiers: {
          filter: [
            // Filter out ACLs that contain `-acl`.
            { 'acl_sess.accname': { $nin: ['-acl'] } },
            // Retrieve only the ACL's name in the response to simplify the output.
            { OBJECT: { $eq: ['acl_sess.accname'] } },
          ],
          // Pass the current iterations pagination params.
          paginate: { limit: pageSize, offset: curIndex, total: totalCount },
        },
      });

      /**
       * Store the count of objects retrieved in this response (one page of data) as well
       *   as the `totalCount` of objects that we need to iterate over.  The `totalCount` may change
       *   as we're iterating over so we can keep updating it.
       */
      const pageResultCount = allObjectsResponse._data.acl_sess.length;
      totalCount = allObjectsResponse._count.acl_sess;

      // Pretty print the results.
      console.log(
        `Page ${curIndex}-${curIndex + pageResultCount - 1} of ${totalCount} results: ` +
          JSON.stringify(
            allObjectsResponse,
            // allObjectsResponse._data.acl_sess.map(aclSess => aclSess.accname),
            null,
            2,
          ),
      );
      // Break if we've iterated over all items.
      if (curIndex >= totalCount) {
        return;
      }
      // If not finished, increment the index and continue iterating.
      curIndex += pageResultCount;
    }
  } catch (err) {
    if (err.message) {
      err = err.message;
    }
    console.log(err);
  }
};

main();
