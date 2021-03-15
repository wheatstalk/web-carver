const pj = require('projen');

const project = new pj.AwsCdkConstructLibrary({
  author: 'Josh Kellendonk',
  authorAddress: 'joshkellendonk@gmail.com',
  cdkVersion: '1.92.0',
  defaultReleaseBranch: 'master',
  jsiiFqn: 'projen.AwsCdkConstructLibrary',
  name: '@wheatstalk/web-carver',
  description: 'A micro-framework for building and deploying Fargate tasks into an AWS App Mesh',
  repositoryUrl: 'https://github.com/wheatstalk/web-carver.git',

  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-appmesh',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-elasticloadbalancingv2',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-ssm',
    '@aws-cdk/aws-servicediscovery',
    '@aws-cdk/aws-secretsmanager',
    '@aws-cdk/aws-certificatemanager',
    '@aws-cdk/cloud-assembly-schema',
  ],

  bundledDeps: [
    'semver@^7.3',
  ],

  devDeps: [
    '@types/semver@^7.3',
    'aws-cdk',
    'ts-node',
  ],

  pullRequestTemplateContents: [''],
  dependabot: false,
  codeCov: true,

  releaseToNpm: true,
  releaseEveryCommit: true,
});

project.gitignore.exclude('cdk.context.json');

project.tasks.addTask('test:unit', {
  category: pj.tasks.TaskCategory.TEST,
  exec: 'jest --updateSnapshot --passWithNoTests --all --testPathIgnorePatterns /integ',
});

project.tasks.addTask('test:integ', {
  category: pj.tasks.TaskCategory.TEST,
  exec: 'jest --updateSnapshot --passWithNoTests --all test/**/integ.*.ts',
});

const yarnUp = project.github.addWorkflow('yarn-upgrade');

yarnUp.on({
  schedule: [{ cron: '0 4 * * *' }],
  workflow_dispatch: {},
});

yarnUp.addJobs({
  upgrade: {
    'name': 'Yarn Upgrade',
    'runs-on': 'ubuntu-latest',
    'steps': [
      { uses: 'actions/checkout@v2' },
      { run: 'yarn upgrade' },
      { run: 'git diff' },
      { run: 'CI="" npx projen' },
      { run: 'yarn build' },
      {
        name: 'Create Pull Request',
        uses: 'peter-evans/create-pull-request@v3',
        with: {
          'title': 'chore: automatic yarn upgrade',
          'commit-message': 'chore: automatic yarn upgrade',
          'token': '${{ secrets.YARN_UPGRADE_TOKEN }}',
          'labels': 'auto-merge',
        },
      },
    ],
  },
});

project.gitignore.exclude('.idea', '*.iml');
project.gitignore.exclude('cdk.out');

project.synth();
