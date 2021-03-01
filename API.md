# API Reference

**Classes**

Name|Description
----|-----------
[ApplicationLoadBalancedWebCarverGateway](#wheatstalk-web-carver-applicationloadbalancedwebcarvergateway)|*No description*
[Http2GatewayRouteExtension](#wheatstalk-web-carver-http2gatewayrouteextension)|Adds an HTTP2 route to the environment's gateway and allows-in traffic from the gateway.
[HttpGatewayRouteExtension](#wheatstalk-web-carver-httpgatewayrouteextension)|Adds an HTTP route to the environment's gateway and allows in traffic from the gateway.
[LinkedServiceExtension](#wheatstalk-web-carver-linkedserviceextension)|Links another mesh service to this service so that it can be connected to.
[WebCarverEnvironment](#wheatstalk-web-carver-webcarverenvironment)|*No description*
[WebCarverListener](#wheatstalk-web-carver-webcarverlistener)|*No description*
[WebCarverService](#wheatstalk-web-carver-webcarverservice)|*No description*
[WebCarverServiceExtension](#wheatstalk-web-carver-webcarverserviceextension)|*No description*


**Structs**

Name|Description
----|-----------
[ApplicationLoadBalancedWebCarverGatewayProps](#wheatstalk-web-carver-applicationloadbalancedwebcarvergatewayprops)|*No description*
[Http2GatewayRouteExtensionProps](#wheatstalk-web-carver-http2gatewayrouteextensionprops)|*No description*
[HttpGatewayRouteExtensionProps](#wheatstalk-web-carver-httpgatewayrouteextensionprops)|*No description*
[LinkedServiceExtensionProps](#wheatstalk-web-carver-linkedserviceextensionprops)|Props for `LinkedServiceExtension`.
[WebCarverEnvironmentProps](#wheatstalk-web-carver-webcarverenvironmentprops)|*No description*
[WebCarverListenerInfo](#wheatstalk-web-carver-webcarverlistenerinfo)|*No description*
[WebCarverServiceProps](#wheatstalk-web-carver-webcarverserviceprops)|*No description*


**Interfaces**

Name|Description
----|-----------
[IWebCarverEnvironment](#wheatstalk-web-carver-iwebcarverenvironment)|*No description*
[IWebCarverGateway](#wheatstalk-web-carver-iwebcarvergateway)|*No description*
[IWebCarverListener](#wheatstalk-web-carver-iwebcarverlistener)|*No description*
[IWebCarverService](#wheatstalk-web-carver-iwebcarverservice)|*No description*
[IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)|Extends the service with additional features.



## class ApplicationLoadBalancedWebCarverGateway  <a id="wheatstalk-web-carver-applicationloadbalancedwebcarvergateway"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IWebCarverGateway](#wheatstalk-web-carver-iwebcarvergateway), [IConnectable](#aws-cdk-aws-ec2-iconnectable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new ApplicationLoadBalancedWebCarverGateway(scope: Construct, id: string, props: ApplicationLoadBalancedWebCarverGatewayProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ApplicationLoadBalancedWebCarverGatewayProps](#wheatstalk-web-carver-applicationloadbalancedwebcarvergatewayprops)</code>)  *No description*
  * **certificates** (<code>Array<[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)></code>)  *No description* 
  * **cluster** (<code>[ICluster](#aws-cdk-aws-ecs-icluster)</code>)  *No description* 
  * **mesh** (<code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code>)  *No description* 
  * **namespace** (<code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code>)  *No description* 



### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**virtualGateway** | <code>[IVirtualGateway](#aws-cdk-aws-appmesh-ivirtualgateway)</code> | <span></span>



## class Http2GatewayRouteExtension  <a id="wheatstalk-web-carver-http2gatewayrouteextension"></a>

Adds an HTTP2 route to the environment's gateway and allows-in traffic from the gateway.

__Implements__: [IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)

### Initializer




```ts
new Http2GatewayRouteExtension(props?: Http2GatewayRouteExtensionProps)
```

* **props** (<code>[Http2GatewayRouteExtensionProps](#wheatstalk-web-carver-http2gatewayrouteextensionprops)</code>)  *No description*
  * **prefixPath** (<code>string</code>)  Specifies the path to match requests with. 


### Methods


#### extend(scope, webCarverService) <a id="wheatstalk-web-carver-http2gatewayrouteextension-extend"></a>



```ts
extend(scope: Construct, webCarverService: WebCarverService): void
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **webCarverService** (<code>[WebCarverService](#wheatstalk-web-carver-webcarverservice)</code>)  *No description*






## class HttpGatewayRouteExtension  <a id="wheatstalk-web-carver-httpgatewayrouteextension"></a>

Adds an HTTP route to the environment's gateway and allows in traffic from the gateway.

__Implements__: [IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)

### Initializer




```ts
new HttpGatewayRouteExtension(props?: HttpGatewayRouteExtensionProps)
```

* **props** (<code>[HttpGatewayRouteExtensionProps](#wheatstalk-web-carver-httpgatewayrouteextensionprops)</code>)  *No description*
  * **prefixPath** (<code>string</code>)  Specifies the path to match requests with. 


### Methods


#### extend(scope, webCarverService) <a id="wheatstalk-web-carver-httpgatewayrouteextension-extend"></a>



```ts
extend(scope: Construct, webCarverService: WebCarverService): void
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **webCarverService** (<code>[WebCarverService](#wheatstalk-web-carver-webcarverservice)</code>)  *No description*






## class LinkedServiceExtension  <a id="wheatstalk-web-carver-linkedserviceextension"></a>

Links another mesh service to this service so that it can be connected to.

__Implements__: [IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)

### Initializer




```ts
new LinkedServiceExtension(props: LinkedServiceExtensionProps)
```

* **props** (<code>[LinkedServiceExtensionProps](#wheatstalk-web-carver-linkedserviceextensionprops)</code>)  *No description*
  * **webCarverService** (<code>[WebCarverService](#wheatstalk-web-carver-webcarverservice)</code>)  *No description* 


### Methods


#### extend(_scope, service) <a id="wheatstalk-web-carver-linkedserviceextension-extend"></a>



```ts
extend(_scope: Construct, service: WebCarverService): void
```

* **_scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **service** (<code>[WebCarverService](#wheatstalk-web-carver-webcarverservice)</code>)  *No description*






## class WebCarverEnvironment  <a id="wheatstalk-web-carver-webcarverenvironment"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IWebCarverEnvironment](#wheatstalk-web-carver-iwebcarverenvironment)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new WebCarverEnvironment(scope: Construct, id: string, props?: WebCarverEnvironmentProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[WebCarverEnvironmentProps](#wheatstalk-web-carver-webcarverenvironmentprops)</code>)  *No description*
  * **certificates** (<code>Array<[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)></code>)  *No description* __*Optional*__
  * **cloudMapNamespace** (<code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code>)  *No description* __*Optional*__
  * **mesh** (<code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code>)  *No description* __*Optional*__
  * **namespace** (<code>[IPrivateDnsNamespace](#aws-cdk-aws-servicediscovery-iprivatednsnamespace) &#124; [IPublicDnsNamespace](#aws-cdk-aws-servicediscovery-ipublicdnsnamespace)</code>)  *No description* __*Optional*__
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  *No description* __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**cluster** | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | <span></span>
**defaultGateway** | <code>[IWebCarverGateway](#wheatstalk-web-carver-iwebcarvergateway)</code> | <span></span>
**mesh** | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | <span></span>
**namespace** | <code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code> | <span></span>



## class WebCarverListener  <a id="wheatstalk-web-carver-webcarverlistener"></a>




### Initializer




```ts
new WebCarverListener()
```



### Methods


#### *static* http1(containerPort) <a id="wheatstalk-web-carver-webcarverlistener-http1"></a>

Provides a listener that supports at most HTTP/1.1. This is probably a little more useful for software that doesn't support HTTP/2 at all, which can happen, but probably isn't happening to you.

```ts
static http1(containerPort: number): IWebCarverListener
```

* **containerPort** (<code>number</code>)  *No description*

__Returns__:
* <code>[IWebCarverListener](#wheatstalk-web-carver-iwebcarverlistener)</code>

#### *static* http2(containerPort) <a id="wheatstalk-web-carver-webcarverlistener-http2"></a>

Provides a listener that supports HTTP/2 and HTTP/1.1.

```ts
static http2(containerPort: number): IWebCarverListener
```

* **containerPort** (<code>number</code>)  *No description*

__Returns__:
* <code>[IWebCarverListener](#wheatstalk-web-carver-iwebcarverlistener)</code>



## class WebCarverService  <a id="wheatstalk-web-carver-webcarverservice"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IWebCarverService](#wheatstalk-web-carver-iwebcarverservice), [IConnectable](#aws-cdk-aws-ec2-iconnectable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new WebCarverService(scope: Construct, id: string, props: WebCarverServiceProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[WebCarverServiceProps](#wheatstalk-web-carver-webcarverserviceprops)</code>)  *No description*
  * **environment** (<code>[IWebCarverEnvironment](#wheatstalk-web-carver-iwebcarverenvironment)</code>)  The Web Carver environment in which to create the service. 
  * **image** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  The image of the main container. 
  * **extensions** (<code>Array<[IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)></code>)  Add extensions to your service to add features. __*Optional*__
  * **hostName** (<code>string</code>)  Suffix the service name with a host name. __*Optional*__
  * **listeners** (<code>Array<[IWebCarverListener](#wheatstalk-web-carver-iwebcarverlistener)></code>)  Description of the main traffic port of the main container. __*Optional*__
  * **useRouter** (<code>boolean</code>)  Use a router to provide connectivity to the service. __*Default*__: false



### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**environment** | <code>[IWebCarverEnvironment](#wheatstalk-web-carver-iwebcarverenvironment)</code> | <span></span>
**virtualNode** | <code>[VirtualNode](#aws-cdk-aws-appmesh-virtualnode)</code> | <span></span>
**virtualService** | <code>[VirtualService](#aws-cdk-aws-appmesh-virtualservice)</code> | <span></span>

### Methods


#### addEnvVars(env) <a id="wheatstalk-web-carver-webcarverservice-addenvvars"></a>



```ts
addEnvVars(env: Map<string, string>): void
```

* **env** (<code>Map<string, string></code>)  *No description*






## class WebCarverServiceExtension  <a id="wheatstalk-web-carver-webcarverserviceextension"></a>




### Initializer




```ts
new WebCarverServiceExtension()
```



### Methods


#### *static* envVars(env) <a id="wheatstalk-web-carver-webcarverserviceextension-envvars"></a>



```ts
static envVars(env: Map<string, string>): IWebCarverServiceExtension
```

* **env** (<code>Map<string, string></code>)  *No description*

__Returns__:
* <code>[IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)</code>

#### *static* http2GatewayRoute(props?) <a id="wheatstalk-web-carver-webcarverserviceextension-http2gatewayroute"></a>



```ts
static http2GatewayRoute(props?: Http2GatewayRouteExtensionProps): IWebCarverServiceExtension
```

* **props** (<code>[Http2GatewayRouteExtensionProps](#wheatstalk-web-carver-http2gatewayrouteextensionprops)</code>)  *No description*
  * **prefixPath** (<code>string</code>)  Specifies the path to match requests with. 

__Returns__:
* <code>[IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)</code>

#### *static* httpGatewayRoute(props?) <a id="wheatstalk-web-carver-webcarverserviceextension-httpgatewayroute"></a>



```ts
static httpGatewayRoute(props?: HttpGatewayRouteExtensionProps): IWebCarverServiceExtension
```

* **props** (<code>[HttpGatewayRouteExtensionProps](#wheatstalk-web-carver-httpgatewayrouteextensionprops)</code>)  *No description*
  * **prefixPath** (<code>string</code>)  Specifies the path to match requests with. 

__Returns__:
* <code>[IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)</code>

#### *static* linkedService(props) <a id="wheatstalk-web-carver-webcarverserviceextension-linkedservice"></a>



```ts
static linkedService(props: LinkedServiceExtensionProps): IWebCarverServiceExtension
```

* **props** (<code>[LinkedServiceExtensionProps](#wheatstalk-web-carver-linkedserviceextensionprops)</code>)  *No description*
  * **webCarverService** (<code>[WebCarverService](#wheatstalk-web-carver-webcarverservice)</code>)  *No description* 

__Returns__:
* <code>[IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)</code>



## struct ApplicationLoadBalancedWebCarverGatewayProps  <a id="wheatstalk-web-carver-applicationloadbalancedwebcarvergatewayprops"></a>






Name | Type | Description 
-----|------|-------------
**certificates** | <code>Array<[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)></code> | <span></span>
**cluster** | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | <span></span>
**mesh** | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | <span></span>
**namespace** | <code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code> | <span></span>



## struct Http2GatewayRouteExtensionProps  <a id="wheatstalk-web-carver-http2gatewayrouteextensionprops"></a>






Name | Type | Description 
-----|------|-------------
**prefixPath**🔹 | <code>string</code> | Specifies the path to match requests with.



## struct HttpGatewayRouteExtensionProps  <a id="wheatstalk-web-carver-httpgatewayrouteextensionprops"></a>






Name | Type | Description 
-----|------|-------------
**prefixPath**🔹 | <code>string</code> | Specifies the path to match requests with.



## interface IWebCarverEnvironment  <a id="wheatstalk-web-carver-iwebcarverenvironment"></a>

__Implemented by__: [WebCarverEnvironment](#wheatstalk-web-carver-webcarverenvironment)



### Properties


Name | Type | Description 
-----|------|-------------
**cluster** | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | <span></span>
**defaultGateway** | <code>[IWebCarverGateway](#wheatstalk-web-carver-iwebcarvergateway)</code> | <span></span>
**mesh** | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | <span></span>
**namespace** | <code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code> | <span></span>



## interface IWebCarverGateway  <a id="wheatstalk-web-carver-iwebcarvergateway"></a>

__Implemented by__: [ApplicationLoadBalancedWebCarverGateway](#wheatstalk-web-carver-applicationloadbalancedwebcarvergateway)



### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>
**virtualGateway** | <code>[IVirtualGateway](#aws-cdk-aws-appmesh-ivirtualgateway)</code> | <span></span>



## interface IWebCarverListener  <a id="wheatstalk-web-carver-iwebcarverlistener"></a>

__Obtainable from__: [WebCarverListener](#wheatstalk-web-carver-webcarverlistener).[http1](#wheatstalk-web-carver-webcarverlistener#wheatstalk-web-carver-webcarverlistener-http1)(), [WebCarverListener](#wheatstalk-web-carver-webcarverlistener).[http2](#wheatstalk-web-carver-webcarverlistener#wheatstalk-web-carver-webcarverlistener-http2)()


### Methods


#### bind(service) <a id="wheatstalk-web-carver-iwebcarverlistener-bind"></a>



```ts
bind(service: WebCarverService): WebCarverListenerInfo
```

* **service** (<code>[WebCarverService](#wheatstalk-web-carver-webcarverservice)</code>)  *No description*

__Returns__:
* <code>[WebCarverListenerInfo](#wheatstalk-web-carver-webcarverlistenerinfo)</code>



## interface IWebCarverService  <a id="wheatstalk-web-carver-iwebcarverservice"></a>

__Implemented by__: [WebCarverService](#wheatstalk-web-carver-webcarverservice)



### Properties


Name | Type | Description 
-----|------|-------------
**connections** | <code>[Connections](#aws-cdk-aws-ec2-connections)</code> | <span></span>



## interface IWebCarverServiceExtension  <a id="wheatstalk-web-carver-iwebcarverserviceextension"></a>

__Implemented by__: [Http2GatewayRouteExtension](#wheatstalk-web-carver-http2gatewayrouteextension), [HttpGatewayRouteExtension](#wheatstalk-web-carver-httpgatewayrouteextension), [LinkedServiceExtension](#wheatstalk-web-carver-linkedserviceextension)
__Obtainable from__: [WebCarverServiceExtension](#wheatstalk-web-carver-webcarverserviceextension).[envVars](#wheatstalk-web-carver-webcarverserviceextension#wheatstalk-web-carver-webcarverserviceextension-envvars)(), [WebCarverServiceExtension](#wheatstalk-web-carver-webcarverserviceextension).[http2GatewayRoute](#wheatstalk-web-carver-webcarverserviceextension#wheatstalk-web-carver-webcarverserviceextension-http2gatewayroute)(), [WebCarverServiceExtension](#wheatstalk-web-carver-webcarverserviceextension).[httpGatewayRoute](#wheatstalk-web-carver-webcarverserviceextension#wheatstalk-web-carver-webcarverserviceextension-httpgatewayroute)(), [WebCarverServiceExtension](#wheatstalk-web-carver-webcarverserviceextension).[linkedService](#wheatstalk-web-carver-webcarverserviceextension#wheatstalk-web-carver-webcarverserviceextension-linkedservice)()

Extends the service with additional features.
### Methods


#### extend(scope, webCarverService) <a id="wheatstalk-web-carver-iwebcarverserviceextension-extend"></a>



```ts
extend(scope: Construct, webCarverService: WebCarverService): void
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **webCarverService** (<code>[WebCarverService](#wheatstalk-web-carver-webcarverservice)</code>)  *No description*






## struct LinkedServiceExtensionProps  <a id="wheatstalk-web-carver-linkedserviceextensionprops"></a>


Props for `LinkedServiceExtension`.



Name | Type | Description 
-----|------|-------------
**webCarverService** | <code>[WebCarverService](#wheatstalk-web-carver-webcarverservice)</code> | <span></span>



## struct WebCarverEnvironmentProps  <a id="wheatstalk-web-carver-webcarverenvironmentprops"></a>






Name | Type | Description 
-----|------|-------------
**certificates**? | <code>Array<[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)></code> | __*Optional*__
**cloudMapNamespace**? | <code>[INamespace](#aws-cdk-aws-servicediscovery-inamespace)</code> | __*Optional*__
**mesh**? | <code>[IMesh](#aws-cdk-aws-appmesh-imesh)</code> | __*Optional*__
**namespace**? | <code>[IPrivateDnsNamespace](#aws-cdk-aws-servicediscovery-iprivatednsnamespace) &#124; [IPublicDnsNamespace](#aws-cdk-aws-servicediscovery-ipublicdnsnamespace)</code> | __*Optional*__
**vpc**? | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | __*Optional*__



## struct WebCarverListenerInfo  <a id="wheatstalk-web-carver-webcarverlistenerinfo"></a>






Name | Type | Description 
-----|------|-------------
**containerPort** | <code>number</code> | <span></span>
**protocol** | <code>[Protocol](#aws-cdk-aws-ecs-protocol)</code> | <span></span>
**virtualNodeListener**? | <code>[VirtualNodeListener](#aws-cdk-aws-appmesh-virtualnodelistener)</code> | __*Optional*__



## struct WebCarverServiceProps  <a id="wheatstalk-web-carver-webcarverserviceprops"></a>






Name | Type | Description 
-----|------|-------------
**environment** | <code>[IWebCarverEnvironment](#wheatstalk-web-carver-iwebcarverenvironment)</code> | The Web Carver environment in which to create the service.
**image** | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | The image of the main container.
**extensions**? | <code>Array<[IWebCarverServiceExtension](#wheatstalk-web-carver-iwebcarverserviceextension)></code> | Add extensions to your service to add features.<br/>__*Optional*__
**hostName**? | <code>string</code> | Suffix the service name with a host name.<br/>__*Optional*__
**listeners**? | <code>Array<[IWebCarverListener](#wheatstalk-web-carver-iwebcarverlistener)></code> | Description of the main traffic port of the main container.<br/>__*Optional*__
**useRouter**? | <code>boolean</code> | Use a router to provide connectivity to the service.<br/>__*Default*__: false



