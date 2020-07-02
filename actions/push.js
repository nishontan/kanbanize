const { query } = require('../graphql')
const {
    graphqlClient,
    addProjectCard,
    moveProjectCard,
    baseVariables,
    moveProjectCardToInProgress
} = require('../lib/github')



module.exports = async (payload) => {
    console.log(payload)
    const variables = payload

    const [issue, project] = await Promise.all([
        graphqlClient.request(query.findIssue, variables),
        graphqlClient.request(query.findProject, variables)
    ])

    //   console.log(issue.repository.issue.projectCards.edges)
    await moveProjectCardToInProgress({ issue, variables })

    //   console.log(project)
    //   await moveProjectCard({ label, issue, variables })


}
