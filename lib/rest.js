const crypto = require('crypto')
const request = require('request')
const utils = require('util')

const requestAsync = utils.promisify(request)

class RestClient {
  constructor (apiKey, apiSecret, _options = {}) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.isPublicClient = false

    let options = _options
    if (arguments.length === 1) {
      options = arguments[0]
      this.isPublicClient = true
    }

    this.options = Object.assign({
      log: () => {},
      apiLimit: 300,
      timeout: 30000,
      rejectUnauthorized: true,
      apiUrl: 'https://liquidity.prime.cex.io/api/rest/',
      apiUrlPublic: 'https://liquidity.prime.cex.io/api/rest-public/'
    }, options)

    if (!this.options.apiUrl.endsWith('/')) {
      this.options.apiUrl = `${this.options.apiUrl}/`
    }
    if (!this.options.apiUrlPublic.endsWith('/')) {
      this.options.apiUrlPublic = `${this.options.apiUrlPublic}/`
    }
  }

  callPublic (action, params = {}) {
    const headers = { 'Content-type': 'application/json' }
    return this._request(action, params, headers, 'POST', true)
  }

  callPrivate (action, params = {}, method = 'POST') {
    if (this.isPublicClient) {
      throw new Error('Attempt to call private method on public client')
    }

    const timestamp = this._unixTime()
    const signatureParams = JSON.stringify(params)
    const signature = this._getSignature(action, timestamp, signatureParams)

    const headers = {
      'X-AGGR-KEY': this.apiKey,
      'X-AGGR-TIMESTAMP': timestamp,
      'X-AGGR-SIGNATURE': signature,
      'Content-Type': 'application/json'
    }

    return this._request(action, params, headers, 'POST')
  }

  _unixTime () {
    return parseInt(Date.now() / 1000)
  }

  _getSignature (action, timestamp, params) {
    const data = action + timestamp + params
    this.options.log('signature params:', data)
    return crypto.createHmac('sha256', this.apiSecret).update(data).digest('base64')
  }

  _limitReached () {
    return false
  }

  async _request (
    action,
    body = {},
    headers = {},
    method = 'GET',
    isPublicRequest = false
  ) {
    if (this._limitReached()) {
      throw new Error(
        'Internal API call rate limit reached.',
        `Limit: ${this.options.apiLimit}`
      )
    }

    const url = isPublicRequest
      ? `${this.options.apiUrlPublic}${action}`
      : `${this.options.apiUrl}${action}`

    const req = {
      url,
      method,
      headers,
      json: true,
      forever: true,
      timeout: this.options.timeout,
      rejectUnauthorized: this.options.rejectUnauthorized
    }

    if (method === 'GET') {
      req.qs = body
    } else if (method === 'POST') {
      req.body = body
    }

    this.options.log(`Request: ${method} ${url}, ${JSON.stringify(req)}`)

    try {
      const response = await requestAsync(req)

      this.options.log(
        `Response: ${req.method} ${req.url},`,
        `statusCode: ${response.statusCode},`,
        'body:', response.body
      )

      return this._parseResponse(response)
    } catch (err) {
      this.options.log(`Error: ${req.method} ${req.url}, err:`, err)
      throw err
    }
  }

  _parseResponse (response) {
    if (response.statusCode !== 200) {
      let errorObject
      const { statusCode, body } = response

      if (typeof body === 'object') {
        errorObject = body
        errorObject.statusCode = statusCode
      } else {
        errorObject = { statusCode, body }
      }

      throw errorObject
    }

    const result = response.body

    if (result.error) {
      throw result
    }

    return result
  }
}

module.exports = RestClient
