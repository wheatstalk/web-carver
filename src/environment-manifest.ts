import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cloudmap from '@aws-cdk/aws-servicediscovery';
import * as ssm from '@aws-cdk/aws-ssm';
import * as cxschema from '@aws-cdk/cloud-assembly-schema';
import * as cdk from '@aws-cdk/core';
import * as semver from 'semver';
import { IEnvironment } from './environment';
import { IGateway } from './gateway';
import { EnvironmentManifestV1 } from './manifest/environment-v1';
import { IRouter } from './router';
import { FnSubRefTracker } from './util-private/fn-sub-ref-tracker';

/**
 * Props for `EnvironmentManifest`
 */
export interface EnvironmentManifestProps {
  /**
   * Create the manifest with the given name.
   */
  readonly parameterName: string;

  /**
   * The WebCarver environment to create the manifest for.
   */
  readonly environment: IEnvironment;
}

/**
 * Creates a manifest file for the environment as JSON, stored in an SSM
 * Parameter so that the environment can be imported in another CDK app.
 */
export class EnvironmentManifest extends cdk.Construct {
  /**
   * Loads a WebCarver environment from a manifest stored in SSM.
   * @param parameterName SSM parameter name. Example '/your-environment-name'
   */
  static environmentFromStringParameter(scope: cdk.Construct, id: string, parameterName: string): IEnvironment {
    // We need to perform the context query manually instead of using
    // `ssm.StringParameter.valueFromLookup()` so that we can provide a dummy
    // value that parses into a valid manifest. This dummy context value is
    // replaced by the CDK CLI once it has run the requisite queries.
    const manifestJson = cdk.ContextProvider.getValue(scope, {
      provider: cxschema.ContextProvider.SSM_PARAMETER_PROVIDER,
      props: { parameterName },
      dummyValue: JSON.stringify(DUMMY_ENVIRONMENT_MANIFEST_V1),
    }).value;

    let manifest: EnvironmentManifestV1;
    try {
      manifest = JSON.parse(manifestJson);
    } catch (e) {
      throw new Error(`Cannot load an environment from ${parameterName} - parsing error: ${e}`);
    }

    if (!semver.satisfies(manifest.version, '^1')) {
      throw new Error(`Cannot load an environment from ${parameterName} - we don't support its manifest version ${manifest.version}`);
    }

    return new EnvironmentFromManifest(scope, id, manifest);
  }

  constructor(scope: cdk.Construct, id: string, props: EnvironmentManifestProps) {
    super(scope, id);

    const crossStackDependencyExportName = cdk.Names.uniqueId(this);

    // Export a value that any consumer of the manifest can import to prevent
    // this stack from being deleted.
    new cdk.CfnOutput(this, 'Dependency', {
      value: cdk.Stack.of(this).stackName,
      exportName: crossStackDependencyExportName,
    });

    // Get an environment manifest file.
    const manifestJson = renderManifestJson(crossStackDependencyExportName, props.environment);

    // Store the environment manifest file so it can be accessed remotely.
    const parameter = new ssm.StringParameter(this, 'Manifest', {
      parameterName: props.parameterName,
      stringValue: manifestJson,
    });

    // Remind the user about where this manifest is stored in SSM.
    new cdk.CfnOutput(this, 'ManifestParameterName', {
      value: parameter.parameterName,
    });
  }
}

/**
 * @internal
 */
export class EnvironmentFromManifest extends cdk.Construct implements IEnvironment {
  readonly vpc: ec2.IVpc;
  readonly cluster: ecs.ICluster;
  readonly defaultGateway: IGateway;
  readonly defaultRouter: IRouter;
  readonly mesh: appmesh.IMesh;
  readonly namespace: cloudmap.INamespace;
  readonly securityGroup: ec2.ISecurityGroup;
  readonly connections: ec2.Connections;

  constructor(scope: cdk.Construct, id: string, manifest: EnvironmentManifestV1) {
    super(scope, id);

    // Depend on the export from the environment so that the environment can't
    // be accidentally deleted.
    if (manifest.crossStackDependencyExportName) {
      const dependencyTagName = `WebCarver-Depends-On-${manifest.crossStackDependencyExportName}`;
      const dependencyStackName = cdk.Fn.importValue(manifest.crossStackDependencyExportName);
      cdk.Tags.of(cdk.Stack.of(this)).add(dependencyTagName, dependencyStackName);
    }

    this.vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: manifest.vpcId,
    });

    this.securityGroup = ec2.SecurityGroup.fromLookup(this, 'SecurityGroup', manifest.securityGroupId);
    this.connections = new ec2.Connections({
      securityGroups: [this.securityGroup],
    });

    switch (manifest.namespaceAttributes.namespaceType) {
      case cloudmap.NamespaceType.DNS_PRIVATE:
        this.namespace = cloudmap.PrivateDnsNamespace.fromPrivateDnsNamespaceAttributes(this, 'Namespace', manifest.namespaceAttributes);
        break;
      case cloudmap.NamespaceType.DNS_PUBLIC:
        this.namespace = cloudmap.PublicDnsNamespace.fromPublicDnsNamespaceAttributes(this, 'Namespace', manifest.namespaceAttributes);
        break;
      default:
        throw new Error(`Unsupported namespace type ${manifest.namespaceAttributes.namespaceType}`);
    }

    this.cluster = ecs.Cluster.fromClusterAttributes(this, 'Cluster', {
      ...manifest.clusterAttributes,
      vpc: this.vpc,
      securityGroups: manifest.clusterAttributes.securityGroupIds
        .map((sgId, index) => ec2.SecurityGroup.fromLookup(this, `ClusterSecurityGroup${index}`, sgId)),
    });

    this.mesh = appmesh.Mesh.fromMeshArn(this, 'Mesh', manifest.meshArn);

    const defaultGateway = appmesh.VirtualGateway.fromVirtualGatewayArn(this, 'DefaultGateway', manifest.defaultGatewayAttributes.virtualGatewayArn);
    const defaultGatewaySecurityGroups = manifest.defaultGatewayAttributes.securityGroupIds
      .map((sgId, index) => ec2.SecurityGroup.fromLookup(this, `DefaultGatewaySecurityGroup${index}`, sgId));

    this.defaultGateway = {
      ...defaultGateway,
      connections: new ec2.Connections({ securityGroups: defaultGatewaySecurityGroups }),
    };

    const defaultRouter = appmesh.VirtualRouter.fromVirtualRouterArn(this, 'DefaultRouter', manifest.defaultRouterAttributes.virtualRouterArn);
    const defaultRouterSecurityGroups = manifest.defaultRouterAttributes.securityGroupIds
      .map((sgId, index) => ec2.SecurityGroup.fromLookup(this, `DefaultRouterSecurityGroup${index}`, sgId));

    const defaultRouterVirtualService = appmesh.VirtualService.fromVirtualServiceArn(this, 'VirtualService', manifest.defaultRouterAttributes.virtualServiceArn);

    this.defaultRouter = {
      ...defaultRouter,
      virtualService: defaultRouterVirtualService,
      connections: new ec2.Connections({ securityGroups: defaultRouterSecurityGroups }),
    };
  }
}

/** @internal */
export const DUMMY_ENVIRONMENT_MANIFEST_V1: EnvironmentManifestV1 = {
  version: '1.0.0',
  crossStackDependencyExportName: 'fake',
  vpcId: 'vpc-fake',
  securityGroupId: 'sg-fakefake',
  namespaceAttributes: {
    namespaceType: cloudmap.NamespaceType.DNS_PRIVATE,
    namespaceArn: 'arn:aws:servicediscovery:ca-central-1:0000000000000:namespace/fake-ns',
    namespaceId: 'fake-id',
    namespaceName: 'fake',
  },
  meshArn: 'arn:aws:appmesh:ca-central-1:0000000000000:mesh/fake-mesh',
  clusterAttributes: {
    clusterArn: 'arn:aws:ecs:ca-central-1:0000000000000:cluster/fake-cluster',
    clusterName: 'fake',
    securityGroupIds: [],
    hasEc2Capacity: false,
  },
  defaultGatewayAttributes: {
    securityGroupIds: [],
    virtualGatewayArn: 'arn:aws:appmesh:ca-central-1:0000000000000:mesh/fake-mesh/virtualGateway/fake-gateway',
  },
  defaultRouterAttributes: {
    securityGroupIds: [],
    virtualRouterArn: 'arn:aws:appmesh:ca-central-1:0000000000000:mesh/fake-mesh/virtualRouter/fake-router',
    virtualServiceArn: 'arn:aws:appmesh:ca-central-1:0000000000000:mesh/fake-mesh/virtualService/fake-service',
  },
};

function renderManifestJson(crossStackDependencyExportName: string, environment: IEnvironment) {
  const manifestRefTracker = new FnSubRefTracker();
  const manifest: EnvironmentManifestV1 = {
    version: '1.0.0',
    crossStackDependencyExportName: crossStackDependencyExportName,
    vpcId: manifestRefTracker.ref(environment.cluster.vpc.vpcId),
    securityGroupId: manifestRefTracker.ref(environment.securityGroup.securityGroupId),
    namespaceAttributes: {
      namespaceType: environment.namespace.type,
      namespaceArn: manifestRefTracker.ref(environment.namespace.namespaceArn),
      namespaceId: manifestRefTracker.ref(environment.namespace.namespaceId),
      namespaceName: manifestRefTracker.ref(environment.namespace.namespaceName),
    },
    meshArn: manifestRefTracker.ref(environment.mesh.meshArn),
    clusterAttributes: {
      clusterName: manifestRefTracker.ref(environment.cluster.clusterName),
      clusterArn: manifestRefTracker.ref(environment.cluster.clusterArn),
      hasEc2Capacity: environment.cluster.hasEc2Capacity,
      securityGroupIds: environment.cluster.connections.securityGroups
        .map(sg => manifestRefTracker.ref(sg.securityGroupId)),
    },
    defaultGatewayAttributes: {
      securityGroupIds: environment.defaultGateway.connections.securityGroups
        .map(sg => manifestRefTracker.ref(sg.securityGroupId)),
      virtualGatewayArn: manifestRefTracker.ref(environment.defaultGateway.virtualGatewayArn),
    },
    defaultRouterAttributes: {
      securityGroupIds: environment.defaultRouter.connections.securityGroups
        .map(sg => manifestRefTracker.ref(sg.securityGroupId)),
      virtualRouterArn: manifestRefTracker.ref(environment.defaultRouter.virtualRouterArn),
      virtualServiceArn: manifestRefTracker.ref(environment.defaultRouter.virtualService.virtualServiceArn),
    },
  };

  return manifestRefTracker.render(JSON.stringify(manifest, null, 2));
}
