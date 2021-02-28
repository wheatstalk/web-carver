ARG FROM=envoyproxy/envoy:v1.17.1

FROM alpine AS build
ARG ENVOY_ADMIN_PORT=""
ARG ENVOY_CONFIG=virtual-gateway-proxy.yaml
ARG ENVOY_CONFIG_VARS=""

RUN apk add bash gettext
SHELL ["/bin/bash", "-c"]

WORKDIR /workdir
COPY . .
WORKDIR /artifact
RUN eval "\$ENVOY_CONFIG_VARS" && envsubst </workdir/${ENVOY_CONFIG} >envoy.yml

FROM $FROM

RUN apt-get update && apt-get install -y curl \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build /artifact/envoy.yml /etc/envoy/envoy.yaml