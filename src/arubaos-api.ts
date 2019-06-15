import { get, OptionsWithUrl, post } from 'request-promise-native';

/**
 * Main entrypoint.  Create an instance of this class with a set of `ArubaOsApiOptions` options
 *   containing your local environment settings.  You can then `login()` and make
 *   `apiRequest()` calls.
 *
 * ```ts
 * const apiClient = new ArubaOsApiClient({
 *   host: '1.2.3.4',
 *   username: 'admin',
 *   password: 'abc'
 * });
 * await apiClient.login();
 * await apiClient.apiRequest({
 *   requestType: 'object',
 * });
 * ```
 */
export class ArubaOsApiClient {
  public sessionCookie?: string;
  private options: Required<ArubaOsApiOptions>;

  constructor(options: ArubaOsApiOptions) {
    this.options = { ...this.getDefaultOptions(), ...options };
  }

  /**
   * Logs into the controller with the credentials set in the `ArubaOsApiOptions`.
   * If successful, `sessionCookie` will be set and will be used for subsequent API requests.
   */
  public async login() {
    try {
      const response = await post({
        url: `${this.getBaseUrl()}/api/login`,
        headers: { 'Content-Type': 'application/json;' },
        body: `username=${this.options.username}&password=${this.options.password}`,
        strictSSL: this.options.strictSSL,
        resolveWithFullResponse: true,
      });
      const responseJSON = JSON.parse(response.body);
      this.sessionCookie = responseJSON._global_result.UIDARUBA;
      return responseJSON;
    } catch (err) {
      if (err.message) {
        err = err.message;
      }
      throw new Error('Failed to login. ' + err);
    }
  }

  /**
   * Logs out of the controller and unsets the `sessionCookie` property.
   */
  public async logout() {
    try {
      const response = await get({
        url: `${this.getBaseUrl()}/api/logout`,
        headers: { 'Content-Type': 'application/json;' },
        strictSSL: this.options.strictSSL,
        resolveWithFullResponse: true,
      });
      this.sessionCookie = undefined;
      return JSON.parse(response.body);
    } catch (err) {
      if (err.message) {
        err = err.message;
      }
      throw new Error('Failed to log out ' + err);
    }
  }

  /**
   * Generic helper method to prepare API requests with all supported
   *   options including GET and SET requests.
   *
   * If `payload` param is passed, a `POST` request is used the payload is put in the request `body`.
   *   If `payload` not passed, a `GET` with no payload is used.
   */
  public async apiRequest({
    requestType,
    configPath,
    objectName,
    payload,
    getModifiers,
  }: ArubaOsApiRequestOptions) {
    if (!this.sessionCookie) {
      throw new Error(
        'ERROR: Authentication cookie not set.  Please use the login() method before making an API request.',
      );
    }
    try {
      if (payload && getModifiers) {
        throw new Error(
          'Cannot specify GET modifiers for POST requests (requests with a payload).',
        );
      }
      const getModifierParams = this.processGetModifiers(getModifiers);
      const preparedUrl = `${this.getBaseUrl()}/configuration/${requestType}${
        objectName ? `/${objectName}` : ''
      }?${getModifierParams}UIDARUBA=${this.sessionCookie}&config_path=${encodeURIComponent(
        configPath || this.options.defaultConfigPath,
      )}`;
      if (this.options.debugEnabled) {
        console.debug('ArubaOS-API [DEBUG]: preparedUrl', preparedUrl);
      }
      const requestOptions: OptionsWithUrl = {
        url: preparedUrl,
        ...(payload ? { body: JSON.stringify(payload) } : {}),
        headers: {
          'Content-Type': 'application/json;',
          Cookie: `SESSION=${this.sessionCookie}`,
        },
        strictSSL: this.options.strictSSL,
        resolveWithFullResponse: true,
      };
      const response = await (payload ? post(requestOptions) : get(requestOptions));
      if (response.headers && response.headers['content-type'] !== 'application/json') {
        throw new Error(
          `ERROR: Content-Type received is not 'application/json', it is '${response.headers['content-type']}'.  ` +
            response.body,
        );
      }
      return JSON.parse(response.body);
    } catch (err) {
      if (err.message) {
        err = err.message;
      }
      throw new Error(
        `API request failed for "/${requestType}${objectName ? `/${objectName}` : ''}". ${err}`,
      );
    }
  }

  private processGetModifiers(getModifiers?: ArubaOsApiRequestGetModifiers) {
    if (!getModifiers) {
      return '';
    }

    let [filterParam, sortParam, countParam, dataTypeParam, paginateParams] = [
      '',
      '',
      '',
      '',
      '',
      '',
    ];
    if (getModifiers.filter) {
      filterParam = `filter=${JSON.stringify(getModifiers.filter)}&`;
    }
    if (getModifiers.sort) {
      sortParam = `sort=${getModifiers.sort.oper}${getModifiers.sort.key}&`;
    }
    if (getModifiers.count) {
      countParam = `count=${getModifiers && getModifiers.count}&`;
    }
    if (getModifiers.dataType) {
      dataTypeParam = `type=${getModifiers && getModifiers.dataType.join(',')}&`;
    }
    if (getModifiers.paginate) {
      paginateParams =
        `offset=${getModifiers.paginate.offset}&` +
        `limit=${getModifiers.paginate.limit}&` +
        (getModifiers.paginate.total ? `total=${getModifiers.paginate.total}&` : '');
    }
    return filterParam + sortParam + dataTypeParam + countParam + paginateParams;
  }

  private getBaseUrl() {
    return `https://${this.options.host}:${this.options.port}/v1`;
  }

  private getDefaultOptions(): Required<ArubaOsApiOptions> {
    return {
      port: 4343,
      strictSSL: true,
      defaultConfigPath: '/mm/mynode',
      debugEnabled: false,
    } as Required<ArubaOsApiOptions>;
  }
}

/**
 * Controls which operation should be applied to the filter value.
 */
export type FilterOperationKeys = '$eq' | '$neq' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin';

/**
 * Configuration parameters used for the lifespan of the `ArubaOsApiClient` instance.
 */
export interface ArubaOsApiOptions {
  /**
   * Management IP of the controller the API will target.
   */
  host: string;
  /**
   * Admin user on the controller.
   */
  username: string;
  /**
   * Consider using environment variable or command line argument for added security.
   */
  password: string;
  /**
   * Set if using non-default port (4343).
   */
  port?: number;
  /**
   * The default target config-node or config-path.  This can be overriden later in code.
   */
  defaultConfigPath?: string;
  /**
   * Disable if controller doesn't have a trusted certificate.
   */
  strictSSL?: boolean;
  /**
   * Enable to get additional logging.
   */
  debugEnabled?: boolean;
}

/**
 * All Get modifiers supported by the ArubaOS API.
 */
export interface ArubaOsApiRequestGetModifiers {
  /**
   * Limit which objects, sub_objects, or configuration elements should be
   *   present in the response.
   */
  filter?: Array<{
    [key: string]: {
      [key in FilterOperationKeys]?: Array<string | number | boolean> | string | number | boolean;
    };
  }>;
  /**
   * Data from the GET request can be sorted based on a single field
   */
  sort?: { oper: '+' | '-'; key: string };
  /**
   * Returns the total count of an object for multi-instance object or for
   *   multi-instance subobject rather than the actual details of the objects.
   */
  count?: number;
  /**
   * What type of data should be returned.
   */
  dataType?: Array<
    | 'non-default'
    | 'default'
    | 'local'
    | 'user'
    | 'system'
    | 'pending'
    | 'committed'
    | 'inherited'
    | 'meta-n-data'
    | 'meta-only'
  >;
  /**
   * Get results in chunks at a time.
   * See docs for more details on the `total` (aka `count`) param.
   */
  paginate?: {
    limit: number;
    offset: number;
    total?: number;
  };
}

/**
 * Control what you want to read (Get/GET) or create/update/delete (Set/POST).
 */
export interface ArubaOsApiRequestOptions {
  /**
   * Select whether you are working with `containers` (a group of `objects`) or
   *   individual `objects`.
   */
  requestType: 'object' | 'container';
  /**
   * Name of a specific API `object` or `container`.
   * Don't specify a value if you want a list of all objects or containers.
   */
  objectName?: string;
  /**
   * Data to be sent in the Set (POST) request.
   * If a value is not passed, the request will be a GET request.
   */
  payload?: { [key: string]: any };
  /**
   * Override the DEFAULT_CONFIG_PATH setting for this request.
   */
  configPath?: string;
  /**
   * Modifiers for Get (GET) queries including sorting, filtering, and/or pagination.
   */
  getModifiers?: ArubaOsApiRequestGetModifiers;
}
