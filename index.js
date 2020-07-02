const { json, send, text } = require('micro')
const micro = require('micro')
const config = require('./config')
const actions = require('./actions')
const { signRequestBody } = require('./lib/crypto')

module.exports = async (req, res) => {
  if (req.headers['content-type'] !== 'application/json') {
    return send(res, 500, { body: `Update webhook to send 'application/json' format` })
  }

  try {
    var [payload, body] = await Promise.all([json(req), text(req)])
    const headers = req.headers
    const sig = headers['x-hub-signature']
    const githubEvent = headers['x-github-event']
    const id = headers['x-github-delivery']
    const calculatedSig = signRequestBody(config.github.secret, body)
    var action = payload.action
    var issueNumber

    let errMessage

    const commitMessage = payload.head_commit.message
    var re = /#[1-9]\d*\b/g;
    var matches = commitMessage.match(re)

    if (matches.length > 0) {
      action = "push"
      issueNumber = matches[0].split("#")[1]
      console.log(issueNumber)
      payload =
      {
        owner: 'naxa-developers',
        name: 'sakchyam_client',
        number: parseInt(issueNumber),
        projectName: "sakchyam_client"
      }
    }

    // { owner: 'naxa-developers',
    // [0]   name: 'sakchyam_client',
    // [0]   number: 131,
    // [0]   projectName: 'accepted' }





    if (!sig) {
      errMessage = 'No X-Hub-Signature found on request'
      return send(res, 401, {
        headers: { 'Content-Type': 'text/plain' },
        body: errMessage
      })
    }

    if (!githubEvent) {
      errMessage = 'No Github Event found on request'
      return send(res, 422, {
        headers: { 'Content-Type': 'text/plain' },
        body: errMessage
      })
    }

    if (githubEvent !== 'push') {
      errMessage = 'No Github push event found on request'
      return send(res, 200, {
        headers: { 'Content-Type': 'text/plain' },
        body: errMessage
      })
    }

    if (!id) {
      errMessage = 'No X-Github-Delivery found on request'
      return send(res, 401, {
        headers: { 'Content-Type': 'text/plain' },
        body: errMessage
      })
    }

    if (sig !== calculatedSig) {
      errMessage = 'No X-Hub-Signature doesn\'t match Github webhook secret'
      return send(res, 401, {
        headers: { 'Content-Type': 'text/plain' },
        body: errMessage
      })
    }

    if (!Object.keys(actions).includes(action)) {
      errMessage = `No handlers for action: '${action}'. Skipping ...`
      return send(res, 200, {
        headers: { 'Content-Type': 'text/plain' },
        body: errMessage
      })
    }



    console.log(action)
    // Invoke action
    actions[action](payload)
    return send(res, 200, {
      body: `Processed '${action}' for issue: '${issueNumber}'`
    })
  } catch (err) {
    console.log(err)
    send(res, 500, { body: `Error occurred: ${err}` })
  }
}
