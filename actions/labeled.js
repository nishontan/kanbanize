const { query } = require('../graphql')
const {
  graphqlClient,
  addProjectCard,
  moveProjectCard,
  baseVariables
} = require('../lib/github')

 

module.exports = async (payload) => {
  const { issue: { number }, label: { name } } = payload
  const variables =  Object.assign({}, baseVariables, {
    number, projectName: name
  })


console.log(variables)

  const [issue, project] = await Promise.all([
      graphqlClient.request(query.findIssue, variables),
      graphqlClient.request(query.findProject, variables)
  ])

  console.log(project)

  const label = issue.repository.issue.labels.edges
    .find(label => label.node.name === name)

  console.log(label)

  const { description } = label.node

  console.log(description)
  switch(description) {
    case 'project':
      await addProjectCard({ label, project, issue, variables })
      break
    case 'status':
      await moveProjectCard({ label, issue, variables })
      break
    default:
  }
}
