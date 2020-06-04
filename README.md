# CEX.IO Aggregator

The official Node.js client for aggregator.cex.io API (https://docs-aggregator.cex.io)

## Features

- Easy to use, requires only key-secret pair to setup
- Handle all transport work, just call required action
- Popular protocols supported, REST and WebSocket onboard

## Installation

```bash
npm install aggregator-cexio
```

## Rest client

```js
const { RestClient } = require('aggregator-cexio')
const defaultClient = new RestClient()
const authenticatedClient = new RestClient(apiKey, apiSecret, options)
```

Arguments for RestClient are optional. For private actions you need to obtain apiKey + apiSecret pair from your manager.

- `apiKey` _string_ - Api key for specific account.
- `apiSecret` _string_ - Api secret for specific account.
- `options` _object_ - Additional settings for client.

Available client options described below, they all are optional:

- `apiLimit` _integer_ - Rate limit value for apiKey, default is 300.
  Client will check requests count and prevent from spam the server.
- `timeout` _integer_ - Request timeout in milliseconds, default is 30000.
- `rejectUnauthorized` _boolean_ - This option useful when you test demo env, default: true.
- `apiUrl` _string_ - Can be changed to test your bot on dev environment.
  default is 'https://rest-aggregator.cex.io'


### Public actions

To make a public request use `async callPublic(action, params)` method.
This method return `Promise` which resolves with server response.
If some error was occured then method rejects with status code and error description.

For more details check [api refference](https://docs-aggregator.cex.io).

```js
const { RestClient } = require('aggregator-cexio')

const client = new RestClient()

client.callPublic('get_demo_order_book')
  .then(res => console.log(res))
  .catch(err => console.error(err))
```

```js
{ error: 'Bad Request', statusCode: 400 }
{ error: 'Unexpected error', statusCode: 500 }
```

### Private actions

To make private api calls use `async callPublic(action, params)`. It's similar to public method but requires `apiKey` and `apiSecret` arguments to client initialization. Each private request is signed with `HMAC sha256` so if key is incorrect or signature is wrong client will return rejected promise with error like this `{ error: 'Authorization Failed', statusCode: 401 }`

```js
const { RestClient } = require('aggregator-cexio')

const key = '_account_api_key_'
const secret = '_account_api_secret_'
const action = 'get_my_trading_conditions'
const params = {
  pairs: ['BTC-USD']
}

const client = new RestClient(key, secret)

client.callPrivate(action, params)
  .then(res => console.log(res))
  .catch(err => console.error(err))
```

Success response example:

```js
{ ok: 'ok', data: { ... } }
```

## WebSocket client

In progress