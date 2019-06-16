import { ArubaOsApiClient } from 'arubaos-api';
import { writeFileSync } from 'fs';

/**
 * Fetches all `objects` and `containers` from the API and stores them into respective files.
 * The results provide the API schema, which is useful to know what specific endpoints to
 *   query/update and also what the expect in the output.
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

    // Retrieve all API `objects`.
    const allObjectsResponse = await aosClient.apiRequest({
      requestType: 'object',
    });
    // Since the response size is giant, store the response into a file.
    writeFileSync('./allObjects.json', JSON.stringify(allObjectsResponse, null, 2), 'utf-8');

    // Retrieve all API `containers`.
    const allContainersResponse = await aosClient.apiRequest({
      requestType: 'container',
    });
    writeFileSync('./allContainers.json', JSON.stringify(allContainersResponse, null, 2), 'utf-8');
  } catch (err) {
    if (err.message) {
      err = err.message;
    }
    console.log(err);
  }
};

main();
