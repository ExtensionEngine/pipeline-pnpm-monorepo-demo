import 'dotenv/config';
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { Project, Database, next as studion } from '@studion/infra-code-blocks';
import config from './config';

const appName = 'lunar';
const stackName = pulumi.getStack();
const tags = {
  Project: appName,
  Environment: stackName,
};

const project = new Project(`${appName}-project`, {
  services: [],
});

const db = new Database(
  `${appName}-${stackName}-db`,
  {
    dbName: config.db.name,
    username: config.db.user,
    vpcId: project.vpc.vpcId,
    isolatedSubnetIds: project.vpc.isolatedSubnetIds,
    vpcCidrBlock: project.vpc.vpc.cidrBlock,
    tags,
  },
  { parent: project },
);

const ecsCluster = new aws.ecs.Cluster(
  `${appName}-${stackName}-cluster`,
  {
    name: `${stackName}Cluster`,
    tags,
  },
  { parent: project },
);

const webServer = new studion.WebServerBuilder(`${appName}-${stackName}-server`)
  .configureEcs({
    cluster: ecsCluster,
    deploymentController: 'CODE_DEPLOY',
    desiredCount: 4,
    size: 'small',
    autoscaling: { enabled: false },
    tags,
  })
  .configureWebServer(config.container.imageRef, config.container.port, {
    environment: [
      { name: 'DB_HOST', value: db.instance.address },
      { name: 'DB_PORT', value: db.instance.port.apply(port => `${port}`) },
      { name: 'DB_NAME', value: db.instance.dbName },
      { name: 'DB_USER', value: db.instance.username },
    ],
    secrets: [{ name: 'DB_PASSWORD', valueFrom: db.password.secret.arn }],
  })
  .withVpc(project.vpc)
  .withCustomHealthCheckPath('/healthz')
  .build({ parent: ecsCluster });

const greenTg = new aws.lb.TargetGroup(
  `${appName}-${stackName}-green-tg`,
  {
    namePrefix: 'green-lb-tg-',
    port: config.container.port,
    protocol: 'HTTP',
    targetType: 'ip',
    vpcId: project.vpc.vpcId,
    healthCheck: webServer.lb.targetGroup.healthCheck,
  },
  { parent: webServer },
);

const errorRateAlarm = new aws.cloudwatch.MetricAlarm(
  `${appName}-${stackName}-error-rate-alarm`,
  {
    name: `${stackName}ErrorRate`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'HTTPCode_Target_5XX_Count',
    namespace: 'AWS/ApplicationELB',
    period: 60,
    statistic: 'Sum',
    threshold: 10,
    alarmDescription: 'Monitors 5XX error rate for canary deployment',
    dimensions: {
      TargetGroup: webServer.lb.targetGroup.arnSuffix,
    },
  },
  { parent: project },
);

const responseTimeAlarm = new aws.cloudwatch.MetricAlarm(
  `${appName}-${stackName}-response-time-alarm`,
  {
    name: `${stackName}ResponseTime`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'TargetResponseTime',
    namespace: 'AWS/ApplicationELB',
    period: 60,
    statistic: 'Average',
    threshold: 2,
    alarmDescription: 'Monitors response time for canary deployment',
    dimensions: {
      TargetGroup: webServer.lb.targetGroup.arnSuffix,
    },
  },
  { parent: project },
);

const codeDeployRole = new aws.iam.Role(
  `${appName}-${stackName}-codedeploy-role`,
  {
    namePrefix: `${appName}-${stackName}-codedeploy-role-`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'codedeploy.amazonaws.com',
          },
        },
      ],
    }),
    managedPolicyArns: ['arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS'],
    tags,
  },
  { parent: project },
);

const codeDeployApp = new aws.codedeploy.Application(
  `${appName}-${stackName}-codedeploy-app`,
  {
    name: `${stackName}CodeDeployApp`,
    computePlatform: 'ECS',
    tags,
  },
  { parent: project },
);

const deploymentGroup = new aws.codedeploy.DeploymentGroup(
  `${appName}-${stackName}-deployment-group`,
  {
    appName: codeDeployApp.name,
    deploymentGroupName: `${stackName}CanaryDeploymentGroup`,
    serviceRoleArn: codeDeployRole.arn,
    deploymentConfigName: 'CodeDeployDefault.ECSCanary10Percent15Minutes',
    deploymentStyle: {
      deploymentOption: 'WITH_TRAFFIC_CONTROL',
      deploymentType: 'BLUE_GREEN',
    },
    blueGreenDeploymentConfig: {
      deploymentReadyOption: {
        actionOnTimeout: 'CONTINUE_DEPLOYMENT',
      },
      terminateBlueInstancesOnDeploymentSuccess: {
        action: 'TERMINATE',
        terminationWaitTimeInMinutes: 5,
      },
    },
    ecsService: {
      clusterName: ecsCluster.name,
      serviceName: webServer.service.name,
    },
    loadBalancerInfo: {
      targetGroupPairInfo: {
        prodTrafficRoute: {
          listenerArns: [
            (webServer.lb.tlsListener ?? webServer.lb.httpListener).arn,
          ],
        },
        targetGroups: [
          {
            name: webServer.lb.targetGroup.name,
          },
          {
            name: greenTg.name,
          },
        ],
      },
    },
    autoRollbackConfiguration: {
      enabled: true,
      events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
    },
    alarmConfiguration: {
      enabled: true,
      alarms: [errorRateAlarm.name, responseTimeAlarm.name],
    },
    tags,
  },
  { parent: project },
);

const deploymentBucket = new aws.s3.Bucket(
  `${appName}-${stackName}-deployments`,
  {
    bucket: `${appName}-${stackName}-canary-deployments`,
    versioning: {
      enabled: true,
    },
    lifecycleRules: [
      {
        enabled: true,
        id: 'cleanup-old-deployments',
        expiration: {
          days: 30,
        },
      },
    ],
    tags,
  },
  { parent: project },
);

new aws.iam.RolePolicy(
  `${appName}-${stackName}-codedeploy-s3-policy`,
  {
    role: codeDeployRole.id,
    policy: pulumi.all([deploymentBucket.arn]).apply(([bucketArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: [bucketArn, `${bucketArn}/*`],
          },
        ],
      }),
    ),
  },
  { parent: project },
);

export const vpcId = project.vpc.vpcId;
export const ecsClusterName = ecsCluster.name;
export const ecsServiceName = webServer.service.name;
export const lbDnsName = webServer.lb.lb.dnsName;
export const targetGroupArn = webServer.lb.targetGroup.arn;
export const taskDefFamily = webServer.service.taskDefinition.family;
export const taskDefArn = webServer.service.taskDefinition.arn;
export const containerName = webServer.name;
export const containerPort = config.container.port;
export const deploymentGroupName = deploymentGroup.deploymentGroupName;
export const deploymentConfigName = deploymentGroup.deploymentConfigName;
export const deploymentBucketName = deploymentBucket.bucket;
