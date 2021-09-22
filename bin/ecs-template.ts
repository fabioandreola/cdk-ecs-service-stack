#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcsTemplateStack } from '../lib/ecs-template-stack';

const app = new cdk.App();
new EcsTemplateStack(app, 'EcsTemplateStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domainName: "fabioandreola.com",
  subdomain: "demo",
  dockerImage: "fabioandreola/demosite:green"
});