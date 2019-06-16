# ArubaOS API for NodeJS

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/ravishivt/arubaos-api.svg)](https://greenkeeper.io/)
[![Travis](https://img.shields.io/travis/ravishivt/arubaos-api.svg)](https://travis-ci.org/ravishivt/arubaos-api)
[![Coveralls](https://img.shields.io/coveralls/ravishivt/arubaos-api.svg)](https://coveralls.io/github/ravishivt/arubaos-api)

Programmatically interact with your ArubaOS 8.x and above infrastructure using the [ArubaOS API](api-documentation).

- [ArubaOS API for NodeJS](#arubaos-api-for-nodejs)
  - [Install](#install)
  - [Use](#use)
    - [Quick-start Samples](#quick-start-samples)
      - [listAllObjectsAndContainers.ts](#listallobjectsandcontainersts)
      - [paginateFilteredSessionACLs.ts](#paginatefilteredsessionaclsts)
      - [updateNetDestWithDynamicWanIp.ts](#updatenetdestwithdynamicwanipts)
  - [Supported features](#supported-features)
  - [TODO](#todo)

## Install

`npm install arubaos-api`

## Use

Read through the ArubaOS API Guide to understand the API's main concepts, i.e. `Get`, `Set`, `Object`, `Containers`, etc..  The latest guide can be found on [Aruba Support Portal](https://asp.arubanetworks.com/downloads;productIds=UHJvZHVjdDoxNDU3YzM0MC0yZTAwLTExZTgtYTBlMy0yZjg0MDRkYzQ3YmU%3D;documentFileContentIds=RmlsZUNvbnRlbnQ6OGZhNDU5NGMtMmUyMi0xMWU4LWJhODYtNGYzZGFiNzBiMWY3).

Also read through this [library's API documentation](https://ravishivt.github.io/arubaos-api/classes/arubaosapiclient.html).

Below is an example of using this library to log into a controller, retrieve and print all configured VLANs, and then log out.

```ts
import { ArubaOsApiClient } from "arubaos-api";

const main = async () => {
  // Create a new client instance with your controller's info.
  const aosClient = new ArubaOsApiClient({
    host: "10.1.1.1",
    username: "admin",
    password: "password",
    strictSSL: false,
  });

  // Log in, which sets a session cookie for future API requests.
  await aosClient.login();

  // Make an API request.
  const responseAllVlans = await aosClient.apiRequest({
    requestType: "object",
    objectName: "vlan_id",
  });

  // Pretty-print the results.
  console.log(JSON.stringify(responseAllVlans, null, 2));

  // Log out.
  await aosClient.logout();
};

main();
```

### Quick-start Samples

A few sample scripts are provided to demonstrate how to use the API.  See the [./samples](./samples) directory.

#### [listAllObjectsAndContainers.ts](./samples/listAllObjectsAndContainers.ts)
Fetches all `objects` and `containers` from the API and stores them into respective files. The results provide the API schema, which is useful to know what specific endpoints to query/update and also what the expect in the output.

#### [paginateFilteredSessionACLs.ts](./samples/paginateFilteredSessionACLs.ts)
This sample demonstrates how to use the `getModifiers` to paginate through a long list of items and with filters applied.

The object we are querying in this example are ACLs (`acl_sess`) but could be swapped for other objects.

#### [updateNetDestWithDynamicWanIp.ts](./samples/updateNetDestWithDynamicWanIp.ts)
This sample is more task-oriented that covers a `Get` request with filters, a `Set` request to update an object, and a `write memory` request.  Specifically, this sample updates a netdestination object to your current public IP (external-facing IP), which is useful when your ISP provides dynamic IPs and you want to apply inbound/outbound network policies.

## Supported features

+ Authentication - Log in and log out using session cookies.
+ Get and Set (GET and POST) requests to retreive and modify config.
+ All GET request filters and modifiers are supported including:
  + `Object`
  + `Data`
  + `Data-Type`
  + `Count`
  + `Sort`
  + `Paginate`
+ Typing support is embedded to guide usage with IDE IntelliSense and to prevent use of invalid options/values.

## TODO

Not all ArubaOS 8.x API features are supported yet.  The remaining items to implement are:

+ Run show commands, e.g. `/configuration/showcommand?command=<SHOW_COMMAND>`.
+ Multi-part SET requests.
+ Add more samples to the project.

[api-documentation]: https://www.arubanetworks.com/techdocs/ArubaOS_84_Web_Help/content/nbapiguide/api_overview/npapi.htm