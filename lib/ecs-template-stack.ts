import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as elb from "@aws-cdk/aws-elasticloadbalancingv2";
import * as route53 from '@aws-cdk/aws-route53';
import * as cert from "@aws-cdk/aws-certificatemanager";

export interface EcsStackProperties extends cdk.StackProps {
  domainName: string,
  subdomain: string,
  dockerImage: string
}


export class EcsTemplateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EcsStackProperties) {
    super(scope, id, props);
   
    // It is not ideal to run production grade applications in the default public subnets but 
    // for the purpose of this demo we will go with it otherwise we would need a NAT gateway to dowload 
    // our docker image
    const vpc = ec2.Vpc.fromLookup(this, "defaultVpc", {isDefault: true});

    const cluster = new ecs.Cluster(this, "demoCluster", { vpc: vpc, clusterName: "DemoCluster" });
    const domainZone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });

    // app domain
    const appDomain = props.subdomain + "." + props.domainName

    // TLS certificate
    const certificate = new cert.DnsValidatedCertificate(
      this,
      "SiteCertificate", {
          domainName: appDomain,
          hostedZone: domainZone
      }
  );

    // Create a load-balanced Fargate service and make it public
    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "demoSite", {
      cluster: cluster, // Required
      cpu: 256, 
      desiredCount: 1, 
      taskImageOptions: { image: ecs.ContainerImage.fromRegistry(props.dockerImage) },
      memoryLimitMiB: 512, 
      publicLoadBalancer: true,
      assignPublicIp: true,
      sslPolicy: elb.SslPolicy.RECOMMENDED,
      domainName: appDomain,
      redirectHTTP: true,
      certificate: certificate,
      domainZone: domainZone
    });
  }
}
