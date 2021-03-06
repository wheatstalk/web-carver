# API Reference

**Classes**

Name|Description
----|-----------
[ApplicationLoadBalancedFargateGateway](#wheatstalk-web-carver-applicationloadbalancedfargategateway)|Creates a gateway with an Application Load Balancer and Fargate service.
[Environment](#wheatstalk-web-carver-environment)|Creates a WebCarver environment.
[EnvironmentManifest](#wheatstalk-web-carver-environmentmanifest)|Creates a manifest file for the environment as JSON, stored in an SSM Parameter so that the environment can be imported in another CDK app.
[HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch)|Used to generate header matching methods.
[PreferencesContext](#wheatstalk-web-carver-preferencescontext)|Get or set preferences by context.
[Router](#wheatstalk-web-carver-router)|Creates a WebCarver Router.
[Service](#wheatstalk-web-carver-service)|Creates a WebCarver service.
[ServiceExtension](#wheatstalk-web-carver-serviceextension)|Used to create service extensions.
[ServiceListener](#wheatstalk-web-carver-servicelistener)|Provides service listeners.
[ServiceName](#wheatstalk-web-carver-servicename)|Provides ways to name your services and associated resources.


**Structs**

Name|Description
----|-----------
[ApplicationLoadBalancedFargateGatewayProps](#wheatstalk-web-carver-applicationloadbalancedfargategatewayprops)|Props for `ApplicationLoadBalancedFargateGateway`.
[ContainerExtensionOptions](#wheatstalk-web-carver-containerextensionoptions)|Container extension options.
[EnvironmentManifestProps](#wheatstalk-web-carver-environmentmanifestprops)|Props for `EnvironmentManifest`.
[EnvironmentProps](#wheatstalk-web-carver-environmentprops)|Props for `Environment`.
[Http2GatewayRouteExtensionOptions](#wheatstalk-web-carver-http2gatewayrouteextensionoptions)|HTTP/2 Gateway Route Extension Options.
[HttpGatewayRouteExtensionOptions](#wheatstalk-web-carver-httpgatewayrouteextensionoptions)|HTTP Gateway Route Extension Options.
[HttpRouteExtensionOptions](#wheatstalk-web-carver-httprouteextensionoptions)|Options for adding Http routes.
[HttpRouteHeaderMatchRangeOptions](#wheatstalk-web-carver-httprouteheadermatchrangeoptions)|Options for a matching HTTP headers in a range.
[LinkedServiceExtensionOptions](#wheatstalk-web-carver-linkedserviceextensionoptions)|Props for `LinkedServiceExtension`.
[OidcHttpExtensionPlainTextCredentials](#wheatstalk-web-carver-oidchttpextensionplaintextcredentials)|Plaintext credentials.
[OidcHttpProxyExtensionOptions](#wheatstalk-web-carver-oidchttpproxyextensionoptions)|Options for an OIDC HTTP Proxy.
[Preferences](#wheatstalk-web-carver-preferences)|Global preferences.
[RouterProps](#wheatstalk-web-carver-routerprops)|Props for `Router`.
[ServiceProps](#wheatstalk-web-carver-serviceprops)|Props for `Service`.
[TaskSizeExtensionOptions](#wheatstalk-web-carver-tasksizeextensionoptions)|Task size options.


**Interfaces**

Name|Description
----|-----------
[IEnvironment](#wheatstalk-web-carver-ienvironment)|A WebCarver environment.
[IGateway](#wheatstalk-web-carver-igateway)|A WebCarver gateway.
[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)|A request header matcher.
[IRouter](#wheatstalk-web-carver-irouter)|A WebCarver router.
[IService](#wheatstalk-web-carver-iservice)|A WebCarver service.
[IServiceExtension](#wheatstalk-web-carver-iserviceextension)|Extends the service with additional features.
[IServiceListener](#wheatstalk-web-carver-iservicelistener)|A service listener.
[IServiceName](#wheatstalk-web-carver-iservicename)|How to name the service.



## class ApplicationLoadBalancedFargateGateway  <a id="wheatstalk-web-carver-applicationloadbalancedfargategateway"></a>

Creates a gateway with an Application Load Balancer and Fargate service.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IVirtualGateway](#aws-cdk-aws-appmesh-ivirtualgateway), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IGateway](#wheatstalk-web-carver-igateway), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IVirtualGateway](#aws-cdk-aws-appmesh-ivirtualgateway), [IConnectable](#aws-cdk-aws-ec2-iconnectable)
__Extends__: [VirtualGateway](#aws-cdk-aws-appmesh-virtualgateway)

### Initializer




```ts
new ApplicationLoadBalancedFargateGateway(scope: Construct, id: string, props: ApplicationLoadBalancedFargateGatewayProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ApplicationLoadBalancedFargateGatewayProps](#wheatstalk-web-carver-applicationloadbalancedfargategatewayprops)</code>)  *No description*
  * **certificates** (<code>Array<[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)></code>)  *No description* 
  * **cluster** (<code>[ICluster](#aws-cdk-aws-ecs-icluster)</code>)  *No description* 
  * **mesh** (<code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code>)  *No description* 
  * **namespace** (<code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code>)  *No description* 
  * **securityGroups** (<code>Array<[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)></code>)  *No description* __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>



## class Environment  <a id="wheatstalk-web-carver-environment"></a>

Creates a WebCarver environment.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IEnvironment](#wheatstalk-web-carver-ienvironment), [IConnectable](#aws-cdk-aws-ec2-iconnectable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Environment(scope: Construct, id: string, props?: EnvironmentProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[EnvironmentProps](#wheatstalk-web-carver-environmentprops)</code>)  *No description*
  * **certificates** (<code>Array<[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)></code>)  Certificates to install on the gateway load balancer. __*Default*__: load balancer is http-only
  * **mesh** (<code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code>)  Provide an App Mesh. __*Default*__: we create one for you
  * **namespace** (<code>[IPrivateDnsNamespace](#aws-cdk-aws-servicediscovery-iprivatednsnamespace) &#124; [IPublicDnsNamespace](#aws-cdk-aws-servicediscovery-ipublicdnsnamespace)</code>)  Provide a service discovery namespace. __*Default*__: we create one for you
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  Provide a VPC. __*Default*__: we create one for you



### Properties


Name | Type | Description 
-----|------|-------------
**cluster** | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | The default ECS cluster.
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**defaultGateway** | <code>[IGateway](#wheatstalk-web-carver-igateway)</code> | The default gateway.
**defaultRouter** | <code>[IRouter](#wheatstalk-web-carver-irouter)</code> | The default router connected to the default gateway.
**mesh** | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | The environment's service mesh.
**namespace** | <code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code> | The default service discovery namespace.
**securityGroup** | <code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code> | The security group that all members of the environment are part of.
**vpc** | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | The default VPC.



## class EnvironmentManifest  <a id="wheatstalk-web-carver-environmentmanifest"></a>

Creates a manifest file for the environment as JSON, stored in an SSM Parameter so that the environment can be imported in another CDK app.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new EnvironmentManifest(scope: Construct, id: string, props: EnvironmentManifestProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[EnvironmentManifestProps](#wheatstalk-web-carver-environmentmanifestprops)</code>)  *No description*
  * **environment** (<code>[IEnvironment](#wheatstalk-web-carver-ienvironment)</code>)  The WebCarver environment to create the manifest for. 
  * **parameterName** (<code>string</code>)  Create the manifest with the given name. 


### Methods


#### *static* environmentFromStringParameter(scope, id, parameterName) <a id="wheatstalk-web-carver-environmentmanifest-environmentfromstringparameter"></a>

Loads a WebCarver environment from a manifest stored in SSM.

```ts
static environmentFromStringParameter(scope: Construct, id: string, parameterName: string): IEnvironment
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **parameterName** (<code>string</code>)  SSM parameter name.

__Returns__:
* <code>[IEnvironment](#wheatstalk-web-carver-ienvironment)</code>



## class HttpRouteHeaderMatch  <a id="wheatstalk-web-carver-httprouteheadermatch"></a>

Used to generate header matching methods.

__Implements__: [IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)

### Initializer




```ts
new HttpRouteHeaderMatch()
```



### Methods


#### *static* valueDoesNotEndWith(headerName, suffix) <a id="wheatstalk-web-carver-httprouteheadermatch-valuedoesnotendwith"></a>

The value sent by the client must not end with the specified characters.

```ts
static valueDoesNotEndWith(headerName: string, suffix: string): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **suffix** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueDoesNotMatchRegex(headerName, regex) <a id="wheatstalk-web-carver-httprouteheadermatch-valuedoesnotmatchregex"></a>

The value sent by the client must include the specified characters.

```ts
static valueDoesNotMatchRegex(headerName: string, regex: string): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **regex** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueDoesNotStartWith(headerName, prefix) <a id="wheatstalk-web-carver-httprouteheadermatch-valuedoesnotstartwith"></a>

The value sent by the client must not begin with the specified characters.

```ts
static valueDoesNotStartWith(headerName: string, prefix: string): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **prefix** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueEndsWith(headerName, suffix) <a id="wheatstalk-web-carver-httprouteheadermatch-valueendswith"></a>

The value sent by the client must end with the specified characters.

```ts
static valueEndsWith(headerName: string, suffix: string): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **suffix** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueIs(headerName, exactValue) <a id="wheatstalk-web-carver-httprouteheadermatch-valueis"></a>

The value sent by the client must match the specified value exactly.

```ts
static valueIs(headerName: string, exactValue: string): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **exactValue** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueIsInRange(headerName, range) <a id="wheatstalk-web-carver-httprouteheadermatch-valueisinrange"></a>

The value sent by the client must be in the given range.

```ts
static valueIsInRange(headerName: string, range: HttpRouteHeaderMatchRangeOptions): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **range** (<code>[HttpRouteHeaderMatchRangeOptions](#wheatstalk-web-carver-httprouteheadermatchrangeoptions)</code>)  *No description*
  * **end** (<code>number</code>)  Match on values up to but not including this value. 
  * **start** (<code>number</code>)  Match on values starting at and including this value. 

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueIsNot(headerName, exactValue) <a id="wheatstalk-web-carver-httprouteheadermatch-valueisnot"></a>

The value sent by the client must not match the specified value exactly.

```ts
static valueIsNot(headerName: string, exactValue: string): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **exactValue** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueIsNotInRange(headerName, range) <a id="wheatstalk-web-carver-httprouteheadermatch-valueisnotinrange"></a>

The value sent by the client must nto be in the given range.

```ts
static valueIsNotInRange(headerName: string, range: HttpRouteHeaderMatchRangeOptions): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **range** (<code>[HttpRouteHeaderMatchRangeOptions](#wheatstalk-web-carver-httprouteheadermatchrangeoptions)</code>)  *No description*
  * **end** (<code>number</code>)  Match on values up to but not including this value. 
  * **start** (<code>number</code>)  Match on values starting at and including this value. 

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueMatchesRegex(headerName, regex) <a id="wheatstalk-web-carver-httprouteheadermatch-valuematchesregex"></a>

The value sent by the client must include the specified characters.

```ts
static valueMatchesRegex(headerName: string, regex: string): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **regex** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>

#### *static* valueStartsWith(headerName, prefix) <a id="wheatstalk-web-carver-httprouteheadermatch-valuestartswith"></a>

The value sent by the client must begin with the specified characters.

```ts
static valueStartsWith(headerName: string, prefix: string): IHttpRouteHeaderMatch
```

* **headerName** (<code>string</code>)  *No description*
* **prefix** (<code>string</code>)  *No description*

__Returns__:
* <code>[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)</code>



## class PreferencesContext  <a id="wheatstalk-web-carver-preferencescontext"></a>

Get or set preferences by context.


### Initializer




```ts
new PreferencesContext()
```



### Methods


#### *static* get(node) <a id="wheatstalk-web-carver-preferencescontext-get"></a>

Get preferences.

```ts
static get(node: ConstructNode): Preferences
```

* **node** (<code>[ConstructNode](#aws-cdk-core-constructnode)</code>)  *No description*

__Returns__:
* <code>[Preferences](#wheatstalk-web-carver-preferences)</code>

#### *static* set(node, context) <a id="wheatstalk-web-carver-preferencescontext-set"></a>

Set the preferences.

```ts
static set(node: ConstructNode, context: Preferences): void
```

* **node** (<code>[ConstructNode](#aws-cdk-core-constructnode)</code>)  *No description*
* **context** (<code>[Preferences](#wheatstalk-web-carver-preferences)</code>)  *No description*
  * **useFargateSpot** (<code>boolean</code>)  Use spot capacity for fargate tasks. __*Default*__: false
  * **usePublicServiceNetworking** (<code>boolean</code>)  Use cheap networking. __*Default*__: false




#### *static* useFargateSpot(node) <a id="wheatstalk-web-carver-preferencescontext-usefargatespot"></a>

Get preference for using Fargate spot.

```ts
static useFargateSpot(node: ConstructNode): boolean
```

* **node** (<code>[ConstructNode](#aws-cdk-core-constructnode)</code>)  *No description*

__Returns__:
* <code>boolean</code>

#### *static* usePublicServiceNetworking(node) <a id="wheatstalk-web-carver-preferencescontext-usepublicservicenetworking"></a>

Get preference for using public service networking.

```ts
static usePublicServiceNetworking(node: ConstructNode): boolean
```

* **node** (<code>[ConstructNode](#aws-cdk-core-constructnode)</code>)  *No description*

__Returns__:
* <code>boolean</code>



## class Router  <a id="wheatstalk-web-carver-router"></a>

Creates a WebCarver Router.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IVirtualRouter](#aws-cdk-aws-appmesh-ivirtualrouter), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IRouter](#wheatstalk-web-carver-irouter), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IVirtualRouter](#aws-cdk-aws-appmesh-ivirtualrouter), [IConnectable](#aws-cdk-aws-ec2-iconnectable)
__Extends__: [VirtualRouter](#aws-cdk-aws-appmesh-virtualrouter)

### Initializer




```ts
new Router(scope: Construct, id: string, props: RouterProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[RouterProps](#wheatstalk-web-carver-routerprops)</code>)  *No description*
  * **mesh** (<code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code>)  The mesh to create the router in. 
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  The VPC to create the router's security group in. 



### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**virtualService** | <code>[IVirtualService](#aws-cdk-aws-appmesh-ivirtualservice)</code> | The virtual service for this router.



## class Service  <a id="wheatstalk-web-carver-service"></a>

Creates a WebCarver service.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IService](#wheatstalk-web-carver-iservice), [IConnectable](#aws-cdk-aws-ec2-iconnectable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Service(scope: Construct, id: string, props: ServiceProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ServiceProps](#wheatstalk-web-carver-serviceprops)</code>)  *No description*
  * **environment** (<code>[IEnvironment](#wheatstalk-web-carver-ienvironment)</code>)  The Web Carver environment in which to create the service. 
  * **extensions** (<code>Array<[IServiceExtension](#wheatstalk-web-carver-iserviceextension)></code>)  Add extensions to your service to add features. __*Optional*__
  * **name** (<code>[IServiceName](#wheatstalk-web-carver-iservicename)</code>)  Choose a service name. __*Default*__: a name is chosen for you



### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**environment** | <code>[IEnvironment](#wheatstalk-web-carver-ienvironment)</code> | <span></span>
**taskDefinition** | <code>[FargateTaskDefinition](#aws-cdk-aws-ecs-fargatetaskdefinition)</code> | <span></span>
**virtualNode** | <code>[VirtualNode](#aws-cdk-aws-appmesh-virtualnode)</code> | <span></span>
**virtualService** | <code>[IVirtualService](#aws-cdk-aws-appmesh-ivirtualservice)</code> | The virtual service representation of the WebCarver service.



## class ServiceExtension  <a id="wheatstalk-web-carver-serviceextension"></a>

Used to create service extensions.


### Initializer




```ts
new ServiceExtension()
```



### Methods


#### *static* capacityProviderStrategies(capacityProviderStrategies) <a id="wheatstalk-web-carver-serviceextension-capacityproviderstrategies"></a>

Use the given capacity provider strategies.

```ts
static capacityProviderStrategies(capacityProviderStrategies: Array<CapacityProviderStrategy>): IServiceExtension
```

* **capacityProviderStrategies** (<code>Array<[CapacityProviderStrategy](#aws-cdk-aws-ecs-capacityproviderstrategy)></code>)  *No description*

__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>

#### *static* container(props) <a id="wheatstalk-web-carver-serviceextension-container"></a>

Add a container.

```ts
static container(props: ContainerExtensionOptions): IServiceExtension
```

* **props** (<code>[ContainerExtensionOptions](#wheatstalk-web-carver-containerextensionoptions)</code>)  *No description*
  * **image** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  *No description* 
  * **environment** (<code>Map<string, string></code>)  *No description* __*Optional*__
  * **listeners** (<code>Array<[IServiceListener](#wheatstalk-web-carver-iservicelistener)></code>)  *No description* __*Optional*__
  * **name** (<code>string</code>)  Name of the container. __*Default*__: 'Main'
  * **secrets** (<code>Map<string, [Secret](#aws-cdk-aws-ecs-secret)></code>)  *No description* __*Optional*__

__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>

#### *static* envVars(env) <a id="wheatstalk-web-carver-serviceextension-envvars"></a>

Add environment variables.

```ts
static envVars(env: Map<string, string>): IServiceExtension
```

* **env** (<code>Map<string, string></code>)  *No description*

__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>

#### *static* http2GatewayRoute(options?) <a id="wheatstalk-web-carver-serviceextension-http2gatewayroute"></a>

Add an HTTP/2 gateway route.

```ts
static http2GatewayRoute(options?: Http2GatewayRouteExtensionOptions): IServiceExtension
```

* **options** (<code>[Http2GatewayRouteExtensionOptions](#wheatstalk-web-carver-http2gatewayrouteextensionoptions)</code>)  *No description*
  * **gateway** (<code>[IGateway](#wheatstalk-web-carver-igateway)</code>)  The gateway to add a route to. __*Default*__: the service's default gateway.
  * **prefixPath** (<code>string</code>)  The path prefix the gateway route should match. __*Default*__: '/'

__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>

#### *static* httpGatewayRoute(options?) <a id="wheatstalk-web-carver-serviceextension-httpgatewayroute"></a>

Add an HTTP gateway route.

```ts
static httpGatewayRoute(options?: HttpGatewayRouteExtensionOptions): IServiceExtension
```

* **options** (<code>[HttpGatewayRouteExtensionOptions](#wheatstalk-web-carver-httpgatewayrouteextensionoptions)</code>)  *No description*
  * **gateway** (<code>[IGateway](#wheatstalk-web-carver-igateway)</code>)  The gateway to add a route to. __*Default*__: the service's default gateway.
  * **prefixPath** (<code>string</code>)  The path prefix the gateway route should match. __*Default*__: '/'

__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>

#### *static* httpRoute(options) <a id="wheatstalk-web-carver-serviceextension-httproute"></a>

Add an HTTP route.

```ts
static httpRoute(options: HttpRouteExtensionOptions): IServiceExtension
```

* **options** (<code>[HttpRouteExtensionOptions](#wheatstalk-web-carver-httprouteextensionoptions)</code>)  *No description*
  * **headers** (<code>Array<[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)></code>)  Match requests with these headers. __*Default*__: not used to match requests
  * **method** (<code>string</code>)  Match based on the request's HTTP method. __*Default*__: not used to match requests
  * **prefixPath** (<code>string</code>)  Path prefix to match. __*Default*__: '/'

__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>

#### *static* linkedService(options) <a id="wheatstalk-web-carver-serviceextension-linkedservice"></a>

Link a WebCarver service.

```ts
static linkedService(options: LinkedServiceExtensionOptions): IServiceExtension
```

* **options** (<code>[LinkedServiceExtensionOptions](#wheatstalk-web-carver-linkedserviceextensionoptions)</code>)  *No description*
  * **service** (<code>[Service](#wheatstalk-web-carver-service)</code>)  The Web Carver service to link to. 
  * **name** (<code>string</code>)  Name of the linked service for environment variable choice. __*Optional*__

__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>

#### *static* spotCapacity() <a id="wheatstalk-web-carver-serviceextension-spotcapacity"></a>

Use spot capacity.

```ts
static spotCapacity(): IServiceExtension
```


__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>

#### *static* taskSize(options) <a id="wheatstalk-web-carver-serviceextension-tasksize"></a>

Choose the amount of CPU and memory to provision.

```ts
static taskSize(options: TaskSizeExtensionOptions): IServiceExtension
```

* **options** (<code>[TaskSizeExtensionOptions](#wheatstalk-web-carver-tasksizeextensionoptions)</code>)  *No description*
  * **cpu** (<code>number</code>)  Fargate CPU size. 
  * **memoryLimitMiB** (<code>number</code>)  Fargate memory size. 

__Returns__:
* <code>[IServiceExtension](#wheatstalk-web-carver-iserviceextension)</code>



## class ServiceListener  <a id="wheatstalk-web-carver-servicelistener"></a>

Provides service listeners.

__Implements__: [IServiceListener](#wheatstalk-web-carver-iservicelistener)

### Initializer




```ts
new ServiceListener()
```



### Methods


#### *static* grpc(containerPort?) <a id="wheatstalk-web-carver-servicelistener-grpc"></a>

Provides a listener that supports gRPC.

```ts
static grpc(containerPort?: number): IServiceListener
```

* **containerPort** (<code>number</code>)  *No description*

__Returns__:
* <code>[IServiceListener](#wheatstalk-web-carver-iservicelistener)</code>

#### *static* http1(containerPort?) <a id="wheatstalk-web-carver-servicelistener-http1"></a>

Provides a listener that supports at most HTTP/1.1. This is probably a little more useful for software that doesn't support HTTP/2 at all, which can happen, but probably isn't happening to you.

```ts
static http1(containerPort?: number): IServiceListener
```

* **containerPort** (<code>number</code>)  *No description*

__Returns__:
* <code>[IServiceListener](#wheatstalk-web-carver-iservicelistener)</code>

#### *static* http2(containerPort?) <a id="wheatstalk-web-carver-servicelistener-http2"></a>

Provides a listener that supports HTTP/2 and HTTP/1.1.

```ts
static http2(containerPort?: number): IServiceListener
```

* **containerPort** (<code>number</code>)  *No description*

__Returns__:
* <code>[IServiceListener](#wheatstalk-web-carver-iservicelistener)</code>

#### *static* oidcHttpProxy(options) <a id="wheatstalk-web-carver-servicelistener-oidchttpproxy"></a>

Creates an HTTP listener that is made available through a reverse proxy that first requires OIDC authentication.

```ts
static oidcHttpProxy(options: OidcHttpProxyExtensionOptions): IServiceListener
```

* **options** (<code>[OidcHttpProxyExtensionOptions](#wheatstalk-web-carver-oidchttpproxyextensionoptions)</code>)  *No description*
  * **containerPort** (<code>number</code>)  The port to forward traffic to. 
  * **oidcDiscoveryEndpoint** (<code>string</code>)  The discovery endpoint. 
  * **image** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  The container image to use as a proxy. __*Default*__: 'evry/oidc-proxy:v1.3.0'
  * **oidcPlainTextCredentials** (<code>[OidcHttpExtensionPlainTextCredentials](#wheatstalk-web-carver-oidchttpextensionplaintextcredentials)</code>)  Plaintext credentials. __*Optional*__
  * **oidcSecretCredentials** (<code>[ISecret](#aws-cdk-aws-secretsmanager-isecret)</code>)  Credentials from an SSM Secret. The secret should be JSON that looks like:. __*Optional*__

__Returns__:
* <code>[IServiceListener](#wheatstalk-web-carver-iservicelistener)</code>

#### *static* tcp(containerPort) <a id="wheatstalk-web-carver-servicelistener-tcp"></a>

Provides a listener that supports basic TCP connections.

```ts
static tcp(containerPort: number): IServiceListener
```

* **containerPort** (<code>number</code>)  *No description*

__Returns__:
* <code>[IServiceListener](#wheatstalk-web-carver-iservicelistener)</code>

#### *static* tcpPortMapping(containerPort) <a id="wheatstalk-web-carver-servicelistener-tcpportmapping"></a>

Maps a TCP port without producing a virtual node listener.

```ts
static tcpPortMapping(containerPort: number): IServiceListener
```

* **containerPort** (<code>number</code>)  *No description*

__Returns__:
* <code>[IServiceListener](#wheatstalk-web-carver-iservicelistener)</code>

#### *static* udpPortMapping(containerPort) <a id="wheatstalk-web-carver-servicelistener-udpportmapping"></a>

Maps a UDP port without producing a virtual node listener.

```ts
static udpPortMapping(containerPort: number): IServiceListener
```

* **containerPort** (<code>number</code>)  *No description*

__Returns__:
* <code>[IServiceListener](#wheatstalk-web-carver-iservicelistener)</code>



## class ServiceName  <a id="wheatstalk-web-carver-servicename"></a>

Provides ways to name your services and associated resources.

__Implements__: [IServiceName](#wheatstalk-web-carver-iservicename)

### Initializer




```ts
new ServiceName()
```



### Methods


#### *static* hostName(hostName) <a id="wheatstalk-web-carver-servicename-hostname"></a>

Provide a host name within the mesh.

```ts
static hostName(hostName: string): IServiceName
```

* **hostName** (<code>string</code>)  *No description*

__Returns__:
* <code>[IServiceName](#wheatstalk-web-carver-iservicename)</code>



## struct ApplicationLoadBalancedFargateGatewayProps  <a id="wheatstalk-web-carver-applicationloadbalancedfargategatewayprops"></a>


Props for `ApplicationLoadBalancedFargateGateway`.



Name | Type | Description 
-----|------|-------------
**certificates** | <code>Array<[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)></code> | <span></span>
**cluster** | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | <span></span>
**mesh** | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | <span></span>
**namespace** | <code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code> | <span></span>
**securityGroups**? | <code>Array<[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)></code> | __*Optional*__



## struct ContainerExtensionOptions  <a id="wheatstalk-web-carver-containerextensionoptions"></a>


Container extension options.



Name | Type | Description 
-----|------|-------------
**image** | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | <span></span>
**environment**? | <code>Map<string, string></code> | __*Optional*__
**listeners**? | <code>Array<[IServiceListener](#wheatstalk-web-carver-iservicelistener)></code> | __*Optional*__
**name**? | <code>string</code> | Name of the container.<br/>__*Default*__: 'Main'
**secrets**? | <code>Map<string, [Secret](#aws-cdk-aws-ecs-secret)></code> | __*Optional*__



## struct EnvironmentManifestProps  <a id="wheatstalk-web-carver-environmentmanifestprops"></a>


Props for `EnvironmentManifest`.



Name | Type | Description 
-----|------|-------------
**environment** | <code>[IEnvironment](#wheatstalk-web-carver-ienvironment)</code> | The WebCarver environment to create the manifest for.
**parameterName** | <code>string</code> | Create the manifest with the given name.



## struct EnvironmentProps  <a id="wheatstalk-web-carver-environmentprops"></a>


Props for `Environment`.



Name | Type | Description 
-----|------|-------------
**certificates**? | <code>Array<[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)></code> | Certificates to install on the gateway load balancer.<br/>__*Default*__: load balancer is http-only
**mesh**? | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | Provide an App Mesh.<br/>__*Default*__: we create one for you
**namespace**? | <code>[IPrivateDnsNamespace](#aws-cdk-aws-servicediscovery-iprivatednsnamespace) &#124; [IPublicDnsNamespace](#aws-cdk-aws-servicediscovery-ipublicdnsnamespace)</code> | Provide a service discovery namespace.<br/>__*Default*__: we create one for you
**vpc**? | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | Provide a VPC.<br/>__*Default*__: we create one for you



## struct Http2GatewayRouteExtensionOptions  <a id="wheatstalk-web-carver-http2gatewayrouteextensionoptions"></a>


HTTP/2 Gateway Route Extension Options.



Name | Type | Description 
-----|------|-------------
**gateway**? | <code>[IGateway](#wheatstalk-web-carver-igateway)</code> | The gateway to add a route to.<br/>__*Default*__: the service's default gateway.
**prefixPath**? | <code>string</code> | The path prefix the gateway route should match.<br/>__*Default*__: '/'



## struct HttpGatewayRouteExtensionOptions  <a id="wheatstalk-web-carver-httpgatewayrouteextensionoptions"></a>


HTTP Gateway Route Extension Options.



Name | Type | Description 
-----|------|-------------
**gateway**? | <code>[IGateway](#wheatstalk-web-carver-igateway)</code> | The gateway to add a route to.<br/>__*Default*__: the service's default gateway.
**prefixPath**? | <code>string</code> | The path prefix the gateway route should match.<br/>__*Default*__: '/'



## struct HttpRouteExtensionOptions  <a id="wheatstalk-web-carver-httprouteextensionoptions"></a>


Options for adding Http routes.



Name | Type | Description 
-----|------|-------------
**headers**? | <code>Array<[IHttpRouteHeaderMatch](#wheatstalk-web-carver-ihttprouteheadermatch)></code> | Match requests with these headers.<br/>__*Default*__: not used to match requests
**method**? | <code>string</code> | Match based on the request's HTTP method.<br/>__*Default*__: not used to match requests
**prefixPath**? | <code>string</code> | Path prefix to match.<br/>__*Default*__: '/'



## struct HttpRouteHeaderMatchRangeOptions  <a id="wheatstalk-web-carver-httprouteheadermatchrangeoptions"></a>


Options for a matching HTTP headers in a range.



Name | Type | Description 
-----|------|-------------
**end** | <code>number</code> | Match on values up to but not including this value.
**start** | <code>number</code> | Match on values starting at and including this value.



## interface IEnvironment  <a id="wheatstalk-web-carver-ienvironment"></a>

__Implemented by__: [Environment](#wheatstalk-web-carver-environment)
__Obtainable from__: [EnvironmentManifest](#wheatstalk-web-carver-environmentmanifest).[environmentFromStringParameter](#wheatstalk-web-carver-environmentmanifest#wheatstalk-web-carver-environmentmanifest-environmentfromstringparameter)()

A WebCarver environment.

### Properties


Name | Type | Description 
-----|------|-------------
**cluster** | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | The default ECS cluster.
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**defaultGateway** | <code>[IGateway](#wheatstalk-web-carver-igateway)</code> | The default gateway.
**defaultRouter** | <code>[IRouter](#wheatstalk-web-carver-irouter)</code> | The default router connected to the default gateway.
**mesh** | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | The environment's service mesh.
**namespace** | <code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code> | The default service discovery namespace.
**securityGroup** | <code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code> | The security group that all members of the environment are part of.
**vpc** | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | The default VPC.



## interface IGateway  <a id="wheatstalk-web-carver-igateway"></a>

__Implemented by__: [ApplicationLoadBalancedFargateGateway](#wheatstalk-web-carver-applicationloadbalancedfargategateway)

A WebCarver gateway.

It's basically a connectable IVirtualGateway.

### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**env** | <code>[ResourceEnvironment](#aws-cdk-core-resourceenvironment)</code> | The environment this resource belongs to.
**mesh**🔹 | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | The Mesh which the VirtualGateway belongs to.
**node** | <code>[ConstructNode](#aws-cdk-core-constructnode)</code> | The construct tree node for this construct.
**stack** | <code>[Stack](#aws-cdk-core-stack)</code> | The stack in which this resource is defined.
**virtualGatewayArn**🔹 | <code>string</code> | The Amazon Resource Name (ARN) for the VirtualGateway.
**virtualGatewayName**🔹 | <code>string</code> | Name of the VirtualGateway.

### Methods


#### addGatewayRoute(id, route)🔹 <a id="wheatstalk-web-carver-igateway-addgatewayroute"></a>

Utility method to add a new GatewayRoute to the VirtualGateway.

```ts
addGatewayRoute(id: string, route: GatewayRouteBaseProps): GatewayRoute
```

* **id** (<code>string</code>)  *No description*
* **route** (<code>[GatewayRouteBaseProps](#aws-cdk-aws-appmesh-gatewayroutebaseprops)</code>)  *No description*
  * **routeSpec** (<code>[GatewayRouteSpec](#aws-cdk-aws-appmesh-gatewayroutespec)</code>)  What protocol the route uses. 
  * **gatewayRouteName** (<code>string</code>)  The name of the GatewayRoute. __*Default*__: an automatically generated name

__Returns__:
* <code>[GatewayRoute](#aws-cdk-aws-appmesh-gatewayroute)</code>



## interface IHttpRouteHeaderMatch  <a id="wheatstalk-web-carver-ihttprouteheadermatch"></a>

__Obtainable from__: [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueDoesNotEndWith](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valuedoesnotendwith)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueDoesNotMatchRegex](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valuedoesnotmatchregex)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueDoesNotStartWith](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valuedoesnotstartwith)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueEndsWith](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valueendswith)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueIs](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valueis)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueIsInRange](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valueisinrange)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueIsNot](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valueisnot)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueIsNotInRange](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valueisnotinrange)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueMatchesRegex](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valuematchesregex)(), [HttpRouteHeaderMatch](#wheatstalk-web-carver-httprouteheadermatch).[valueStartsWith](#wheatstalk-web-carver-httprouteheadermatch#wheatstalk-web-carver-httprouteheadermatch-valuestartswith)()

A request header matcher.


## interface IRouter  <a id="wheatstalk-web-carver-irouter"></a>

__Implemented by__: [Router](#wheatstalk-web-carver-router)

A WebCarver router.

### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**env** | <code>[ResourceEnvironment](#aws-cdk-core-resourceenvironment)</code> | The environment this resource belongs to.
**mesh**🔹 | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | The Mesh which the VirtualRouter belongs to.
**node** | <code>[ConstructNode](#aws-cdk-core-constructnode)</code> | The construct tree node for this construct.
**stack** | <code>[Stack](#aws-cdk-core-stack)</code> | The stack in which this resource is defined.
**virtualRouterArn**🔹 | <code>string</code> | The Amazon Resource Name (ARN) for the VirtualRouter.
**virtualRouterName**🔹 | <code>string</code> | The name of the VirtualRouter.
**virtualService** | <code>[IVirtualService](#aws-cdk-aws-appmesh-ivirtualservice)</code> | The virtual service for this router.

### Methods


#### addRoute(id, props)🔹 <a id="wheatstalk-web-carver-irouter-addroute"></a>

Add a single route to the router.

```ts
addRoute(id: string, props: RouteBaseProps): Route
```

* **id** (<code>string</code>)  *No description*
* **props** (<code>[RouteBaseProps](#aws-cdk-aws-appmesh-routebaseprops)</code>)  *No description*
  * **routeSpec** (<code>[RouteSpec](#aws-cdk-aws-appmesh-routespec)</code>)  Protocol specific spec. 
  * **routeName** (<code>string</code>)  The name of the route. __*Default*__: An automatically generated name

__Returns__:
* <code>[Route](#aws-cdk-aws-appmesh-route)</code>



## interface IService  <a id="wheatstalk-web-carver-iservice"></a>

__Implemented by__: [Service](#wheatstalk-web-carver-service)

A WebCarver service.

### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**virtualService** | <code>[IVirtualService](#aws-cdk-aws-appmesh-ivirtualservice)</code> | The virtual service representation of the WebCarver service.



## interface IServiceExtension  <a id="wheatstalk-web-carver-iserviceextension"></a>

__Obtainable from__: [ServiceExtension](#wheatstalk-web-carver-serviceextension).[capacityProviderStrategies](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-capacityproviderstrategies)(), [ServiceExtension](#wheatstalk-web-carver-serviceextension).[container](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-container)(), [ServiceExtension](#wheatstalk-web-carver-serviceextension).[envVars](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-envvars)(), [ServiceExtension](#wheatstalk-web-carver-serviceextension).[http2GatewayRoute](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-http2gatewayroute)(), [ServiceExtension](#wheatstalk-web-carver-serviceextension).[httpGatewayRoute](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-httpgatewayroute)(), [ServiceExtension](#wheatstalk-web-carver-serviceextension).[httpRoute](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-httproute)(), [ServiceExtension](#wheatstalk-web-carver-serviceextension).[linkedService](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-linkedservice)(), [ServiceExtension](#wheatstalk-web-carver-serviceextension).[spotCapacity](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-spotcapacity)(), [ServiceExtension](#wheatstalk-web-carver-serviceextension).[taskSize](#wheatstalk-web-carver-serviceextension#wheatstalk-web-carver-serviceextension-tasksize)()

Extends the service with additional features.


## interface IServiceListener  <a id="wheatstalk-web-carver-iservicelistener"></a>

__Obtainable from__: [ServiceListener](#wheatstalk-web-carver-servicelistener).[grpc](#wheatstalk-web-carver-servicelistener#wheatstalk-web-carver-servicelistener-grpc)(), [ServiceListener](#wheatstalk-web-carver-servicelistener).[http1](#wheatstalk-web-carver-servicelistener#wheatstalk-web-carver-servicelistener-http1)(), [ServiceListener](#wheatstalk-web-carver-servicelistener).[http2](#wheatstalk-web-carver-servicelistener#wheatstalk-web-carver-servicelistener-http2)(), [ServiceListener](#wheatstalk-web-carver-servicelistener).[oidcHttpProxy](#wheatstalk-web-carver-servicelistener#wheatstalk-web-carver-servicelistener-oidchttpproxy)(), [ServiceListener](#wheatstalk-web-carver-servicelistener).[tcp](#wheatstalk-web-carver-servicelistener#wheatstalk-web-carver-servicelistener-tcp)(), [ServiceListener](#wheatstalk-web-carver-servicelistener).[tcpPortMapping](#wheatstalk-web-carver-servicelistener#wheatstalk-web-carver-servicelistener-tcpportmapping)(), [ServiceListener](#wheatstalk-web-carver-servicelistener).[udpPortMapping](#wheatstalk-web-carver-servicelistener#wheatstalk-web-carver-servicelistener-udpportmapping)()

A service listener.


## interface IServiceName  <a id="wheatstalk-web-carver-iservicename"></a>

__Obtainable from__: [ServiceName](#wheatstalk-web-carver-servicename).[hostName](#wheatstalk-web-carver-servicename#wheatstalk-web-carver-servicename-hostname)()

How to name the service.


## struct LinkedServiceExtensionOptions  <a id="wheatstalk-web-carver-linkedserviceextensionoptions"></a>


Props for `LinkedServiceExtension`.



Name | Type | Description 
-----|------|-------------
**service** | <code>[Service](#wheatstalk-web-carver-service)</code> | The Web Carver service to link to.
**name**? | <code>string</code> | Name of the linked service for environment variable choice.<br/>__*Optional*__



## struct OidcHttpExtensionPlainTextCredentials  <a id="wheatstalk-web-carver-oidchttpextensionplaintextcredentials"></a>


Plaintext credentials.



Name | Type | Description 
-----|------|-------------
**clientId** | <code>string</code> | The OIDC client ID.
**clientSecret** | <code>string</code> | The OIDC client secret.



## struct OidcHttpProxyExtensionOptions  <a id="wheatstalk-web-carver-oidchttpproxyextensionoptions"></a>


Options for an OIDC HTTP Proxy.



Name | Type | Description 
-----|------|-------------
**containerPort** | <code>number</code> | The port to forward traffic to.
**oidcDiscoveryEndpoint** | <code>string</code> | The discovery endpoint.
**image**? | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | The container image to use as a proxy.<br/>__*Default*__: 'evry/oidc-proxy:v1.3.0'
**oidcPlainTextCredentials**? | <code>[OidcHttpExtensionPlainTextCredentials](#wheatstalk-web-carver-oidchttpextensionplaintextcredentials)</code> | Plaintext credentials.<br/>__*Optional*__
**oidcSecretCredentials**? | <code>[ISecret](#aws-cdk-aws-secretsmanager-isecret)</code> | Credentials from an SSM Secret. The secret should be JSON that looks like:.<br/>__*Optional*__



## struct Preferences  <a id="wheatstalk-web-carver-preferences"></a>

__Obtainable from__: [PreferencesContext](#wheatstalk-web-carver-preferencescontext).[get](#wheatstalk-web-carver-preferencescontext#wheatstalk-web-carver-preferencescontext-get)()

Global preferences.



Name | Type | Description 
-----|------|-------------
**useFargateSpot**? | <code>boolean</code> | Use spot capacity for fargate tasks.<br/>__*Default*__: false
**usePublicServiceNetworking**? | <code>boolean</code> | Use cheap networking.<br/>__*Default*__: false



## struct RouterProps  <a id="wheatstalk-web-carver-routerprops"></a>


Props for `Router`.



Name | Type | Description 
-----|------|-------------
**mesh** | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | The mesh to create the router in.
**vpc** | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | The VPC to create the router's security group in.



## struct ServiceProps  <a id="wheatstalk-web-carver-serviceprops"></a>


Props for `Service`.



Name | Type | Description 
-----|------|-------------
**environment** | <code>[IEnvironment](#wheatstalk-web-carver-ienvironment)</code> | The Web Carver environment in which to create the service.
**extensions**? | <code>Array<[IServiceExtension](#wheatstalk-web-carver-iserviceextension)></code> | Add extensions to your service to add features.<br/>__*Optional*__
**name**? | <code>[IServiceName](#wheatstalk-web-carver-iservicename)</code> | Choose a service name.<br/>__*Default*__: a name is chosen for you



## struct TaskSizeExtensionOptions  <a id="wheatstalk-web-carver-tasksizeextensionoptions"></a>


Task size options.



Name | Type | Description 
-----|------|-------------
**cpu** | <code>number</code> | Fargate CPU size.
**memoryLimitMiB** | <code>number</code> | Fargate memory size.



