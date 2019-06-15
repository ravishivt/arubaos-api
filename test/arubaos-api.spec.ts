import * as request from 'request-promise-native';

import { ArubaOsApiClient, ArubaOsApiOptions } from '../src/arubaos-api';

jest.mock('request-promise-native');
const mockedRequest: jest.Mocked<typeof request> = request as any;

const testSetUp = (options?: Partial<ArubaOsApiOptions>) => {
  return new ArubaOsApiClient({
    host: '1.2.3.4',
    username: 'admin',
    password: 'abc',
    debugEnabled: false,
    ...options,
  });
};

describe(`ArubaOsApiClient`, () => {
  describe(`login`, () => {
    it(`should error if the request throws an error`, async () => {
      const aosClient = testSetUp();

      mockedRequest.post.mockImplementation(() => {
        throw new Error('timeout');
      });
      try {
        await aosClient.login();
        fail('Should have thrown an exception');
      } catch (err) {
        expect(mockedRequest.post).toHaveBeenCalledTimes(1);
        expect(err).toMatchSnapshot();
      }
    });

    it(`should successfully login with correct credentials`, async () => {
      const aosClient = testSetUp();

      mockedRequest.post.mockResolvedValue({
        body: JSON.stringify({
          _global_result: {
            UIDARUBA: 'AOS-COOKIE',
            status: '0',
            status_str: "You've logged in successfully.",
          },
        }),
      });
      const response = await aosClient.login();
      expect(response).toMatchSnapshot();
      expect(aosClient.sessionCookie).toBe('AOS-COOKIE');
      expect(mockedRequest.post).toHaveBeenCalledTimes(1);
    });
  });

  describe(`logout`, () => {
    it(`should error if the request throws an error`, async () => {
      const aosClient = testSetUp();

      mockedRequest.get.mockImplementation(() => {
        throw new Error('timeout');
      });
      try {
        await aosClient.logout();
        fail('Should have thrown an exception');
      } catch (err) {
        expect(mockedRequest.get).toHaveBeenCalledTimes(1);
        expect(err).toMatchSnapshot();
      }
    });

    it(`should successfully logout`, async () => {
      const aosClient = testSetUp();

      mockedRequest.get.mockResolvedValue({
        body: JSON.stringify({
          _global_result: {
            UIDARUBA: '(null)',
            status: '0',
            status_str: "You've been logged out successfully.",
          },
        }),
      });
      const response = await aosClient.logout();
      expect(response).toMatchSnapshot();
      expect(aosClient.sessionCookie).toBe(undefined);
      expect(mockedRequest.get).toHaveBeenCalledTimes(1);
    });
  });

  describe(`apiRequest`, () => {
    it(`should error if sessionCookie is not set`, async () => {
      const aosClient = testSetUp();

      try {
        await aosClient.apiRequest({
          requestType: 'object',
        });
        fail('Should have thrown an exception');
      } catch (err) {
        expect(mockedRequest.get).toHaveBeenCalledTimes(0);
        expect(err).toMatchSnapshot();
      }
    });

    it(`should error if the request throws an error`, async () => {
      const aosClient = testSetUp();
      aosClient.sessionCookie = 'AOS-COOKIE';

      mockedRequest.get.mockImplementation(() => {
        throw new Error('timeout');
      });
      try {
        await aosClient.apiRequest({
          requestType: 'object',
        });
        fail('Should have thrown an exception');
      } catch (err) {
        expect(mockedRequest.get).toHaveBeenCalledTimes(1);
        expect(err).toMatchSnapshot();
      }
    });

    it(`should error if "payload" and "getModifiers" are passed`, async () => {
      const aosClient = testSetUp();
      aosClient.sessionCookie = 'AOS-COOKIE';

      try {
        await aosClient.apiRequest({
          requestType: 'object',
          getModifiers: {
            count: 5,
          },
          payload: { testProp: 'newValue' },
        });
        fail('Should have thrown an exception');
      } catch (err) {
        expect(mockedRequest.get).toHaveBeenCalledTimes(0);
        expect(mockedRequest.post).toHaveBeenCalledTimes(0);
        expect(err).toMatchSnapshot();
      }
    });

    it(`should error if response "Content-Type" isn't "application/json"`, async () => {
      const aosClient = testSetUp();
      aosClient.sessionCookie = 'AOS-COOKIE';

      mockedRequest.get.mockResolvedValue({ headers: { 'content-type': 'text/html' }, body: '{}' });
      try {
        await aosClient.apiRequest({
          requestType: 'object',
        });
        fail('Should have thrown an exception');
      } catch (err) {
        expect(mockedRequest.get).toHaveBeenCalledTimes(1);
        expect(err).toMatchSnapshot();
      }
    });

    it(`should successfully make a get object request`, async () => {
      const aosClient = testSetUp();
      aosClient.sessionCookie = 'AOS-COOKIE';

      mockedRequest.get.mockResolvedValue({ body: '{}' });
      const response = await aosClient.apiRequest({
        requestType: 'object',
        objectName: 'testObject',
      });
      expect(response).toEqual({});
      expect(mockedRequest.get).toHaveBeenCalledTimes(1);
      expect(mockedRequest.post).toHaveBeenCalledTimes(0);
      expect(mockedRequest.get.mock.calls[0][0]).toMatchSnapshot();
    });

    it(
      `should successfully make a get object request and print out ` +
        `the "preparedUrl" when "debugEnabled: true"`,
      async () => {
        const aosClient = testSetUp({ debugEnabled: true });
        aosClient.sessionCookie = 'AOS-COOKIE';

        mockedRequest.get.mockResolvedValue({ body: '{}' });
        jest.spyOn(global.console, 'debug');
        const response = await aosClient.apiRequest({
          requestType: 'object',
        });
        expect(response).toEqual({});
        expect(console.debug).toHaveBeenCalledTimes(1);
        expect(mockedRequest.get).toHaveBeenCalledTimes(1);
        expect(mockedRequest.post).toHaveBeenCalledTimes(0);
        expect(mockedRequest.get.mock.calls[0][0]).toMatchSnapshot();
      },
    );

    it(`should successfully make a get object request with an empty "getModifiers"`, async () => {
      const aosClient = testSetUp();
      aosClient.sessionCookie = 'AOS-COOKIE';

      mockedRequest.get.mockResolvedValue({ body: '{}' });
      const response = await aosClient.apiRequest({
        requestType: 'object',
        getModifiers: {},
      });
      expect(response).toEqual({});
      expect(mockedRequest.get).toHaveBeenCalledTimes(1);
      expect(mockedRequest.post).toHaveBeenCalledTimes(0);
      expect(mockedRequest.get.mock.calls[0][0]).toMatchSnapshot();
    });

    it(`should successfully make a get object request with "count" only in "getModifiers"`, async () => {
      const aosClient = testSetUp();
      aosClient.sessionCookie = 'AOS-COOKIE';

      mockedRequest.get.mockResolvedValue({ body: '{}' });
      const response = await aosClient.apiRequest({
        requestType: 'object',
        objectName: 'testObject',
        getModifiers: {
          count: 5,
        },
      });
      expect(response).toEqual({});
      expect(mockedRequest.get).toHaveBeenCalledTimes(1);
      expect(mockedRequest.post).toHaveBeenCalledTimes(0);
      expect(mockedRequest.get.mock.calls[0][0]).toMatchSnapshot();
    });

    it(`should successfully make a get object request with "getModifiers"`, async () => {
      const aosClient = testSetUp();
      aosClient.sessionCookie = 'AOS-COOKIE';

      mockedRequest.get.mockResolvedValue({ body: '{}' });
      const response = await aosClient.apiRequest({
        requestType: 'object',
        objectName: 'testObject',
        getModifiers: {
          filter: [
            { 'acl_sess.accname': { $nin: ['-acl'] } },
            { OBJECT: { $eq: ['acl_sess.accname'] } },
          ],
          sort: { oper: '+', key: 'testKey' },
          count: 5,
          dataType: ['committed', 'pending'],
          paginate: { limit: 5, offset: 5, total: 5 },
        },
      });
      expect(response).toEqual({});
      expect(mockedRequest.get).toHaveBeenCalledTimes(1);
      expect(mockedRequest.post).toHaveBeenCalledTimes(0);
      expect(mockedRequest.get.mock.calls[0][0]).toMatchSnapshot();
    });

    it(`should successfully make a set object request if "payload" data is passed`, async () => {
      const aosClient = testSetUp();
      aosClient.sessionCookie = 'AOS-COOKIE';

      mockedRequest.post.mockResolvedValue({ body: '{}' });
      const response = await aosClient.apiRequest({
        requestType: 'object',
        objectName: 'testObject',
        payload: { testProp: 'newValue' },
      });
      expect(response).toEqual({});
      expect(mockedRequest.get).toHaveBeenCalledTimes(0);
      expect(mockedRequest.post).toHaveBeenCalledTimes(1);
      expect(mockedRequest.post.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
