import { ArubaOsApiClient } from 'arubaos-api';
import request from 'request-promise-native';

/**
 * This sample is more task-oriented that covers a `Get` request with filters,
 *   a `Set` request to update an object, and a `write memory` request.
 * Specifically, this sample updates a netdestination object to your current public
 *   IP (external-facing IP), which is useful when your ISP provides dynamic IPs and
 *   you want to apply inbound/outbound network policies.
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

    // Get the currently assigned public IP using the ipinfo.io API.
    let currentPublicIP;
    try {
      const response = await request({
        url: 'http://ipinfo.io/json',
      });
      currentPublicIP = JSON.parse(response).ip;
      console.log(`Current Public IP is "${currentPublicIP}".`);
    } catch (err) {
      if (err.message) {
        err = err.message;
      }
      throw new Error('Failed to get public IP. ' + err);
    }

    const targetNetDestinationName = 'wan-public-ip';

    // Get controller's current Net Destination value.
    const netDstResponse = await aosClient.apiRequest({
      requestType: 'object',
      objectName: 'netdst',
      getModifiers: {
        filter: [{ 'netdst.dstname': { $eq: [targetNetDestinationName] } }],
      },
    });
    const controllerNetDestIP = netDstResponse._data.netdst[0].netdst__entry[0].address;

    /**
     * Detect if the controller's Net Destination is outdated.
     * If not, update it to current public IP.
     */
    if (currentPublicIP === controllerNetDestIP) {
      console.log(
        `Controller's Net Destination "${targetNetDestinationName}" is ` +
          `up-to-date, "${currentPublicIP}".  Nothing to do.`,
      );
    } else {
      console.log(
        `Controller's Net Destination "${targetNetDestinationName}" is outdated.  Updating ` +
          `from "${controllerNetDestIP}" to "${currentPublicIP}".`,
      );
      // Update controller's Net Destination.
      const updateNetdstResponse = await aosClient.apiRequest({
        requestType: 'object',
        objectName: 'netdst',
        payload: {
          dstname: targetNetDestinationName,
          netdst__entry: [
            {
              address: controllerNetDestIP,
              hosttag: 'address',
              _action: 'delete',
              _objname: 'netdst__host',
            },
            {
              address: currentPublicIP,
              hosttag: 'address',
              _action: 'add',
              _objname: 'netdst__host',
            },
          ],
        },
      });
      // console.debug('updateNetdstResponse', updateNetdstResponse);

      // Write memory for updated netdest to take effect.
      const writeMemResponse = await aosClient.apiRequest({
        requestType: 'object',
        objectName: 'write_memory',
        payload: {},
      });
      // console.debug('writeMemResponse', writeMemResponse);
    }
  } catch (err) {
    if (err.message) {
      err = err.message;
    }
    console.log(err);
  }
};

main();
