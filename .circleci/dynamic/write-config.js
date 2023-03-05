const CircleCI = require("@circleci/circleci-config-sdk");
const fs = require('fs');

// Node executor
const dockerNode = new CircleCI.executors.DockerExecutor(
  "cimg/node:lts"
);

// Test Job
const testJob = new CircleCI.Job("test", dockerNode);
testJob.addStep(new CircleCI.commands.Checkout());
testJob.addStep(new CircleCI.commands.Run({ command: "npm install && npm run test" }));

//Deploy Job
const deployJob = new CircleCI.Job("deploy", dockerNode);
deployJob.addStep(new CircleCI.commands.Checkout());
deployJob.addStep(new CircleCI.commands.Run({ command: "npm run deploy" }));

//Instantiate Config and Workflow
const nodeConfig = new CircleCI.Config();
const nodeWorkflow = new CircleCI.Workflow("node-test-deploy");
nodeConfig.addWorkflow(nodeWorkflow);

//Add Jobs. Add filters to deploy job
nodeWorkflow.addJob(testJob);
const wfDeployJob = new CircleCI.workflow.WorkflowJob(deployJob, {requires: ["test"], filters: {branches: {ignore: ".*"}}});
nodeWorkflow.jobs.push(wfDeployJob);

/**
* Exports a CircleCI config for a node project
*/
module.exports= function writeNodeConfig(deployTag, configPath) {
  wfDeployJob.parameters.filters.tags = {only: deployTag};
  fs.writeFile(configPath, nodeConfig.generate(), (err) => {
    if (err) {
      console.error(err);
      return
    }
  });
}