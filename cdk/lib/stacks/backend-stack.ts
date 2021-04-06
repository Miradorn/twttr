import {Construct, Stack, StackProps, Duration} from '@aws-cdk/core';
import {HttpApi, HttpMethod, DomainName, CorsHttpMethod} from '@aws-cdk/aws-apigatewayv2'
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations'
import * as route53 from "@aws-cdk/aws-route53";
import {ApiGatewayv2Domain} from "@aws-cdk/aws-route53-targets";
import {DnsValidatedCertificate} from "@aws-cdk/aws-certificatemanager";

import {LambdaFunction} from '../constructs/LambdaFunction'

import * as path from 'path'

export interface BackendStackProps extends StackProps {
  frontendDomainName: string;
  backendDomainName: string;
  hostedZoneName: string;
  hostedZoneId: string;
}

export class BackendStack extends Stack {
  public api: HttpApi

  public domainName = 'api.twttr.alst.superluminar.io'

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)

    const zone = route53.PublicHostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      }
    );

    const certificate = new DnsValidatedCertificate(this, "FrontendCert", {
      domainName: this.domainName,
      region: "us-east-1",
      hostedZone: zone,
    });

    const apiDomainName = new DomainName(this, 'DomainName', {
      domainName: props.backendDomainName,
      certificate: certificate
    })

    this.api = new HttpApi(this, 'ApiGateway', {
      defaultDomainMapping: {
        domainName: apiDomainName,
        mappingKey: 'v1',
      },
      corsPreflight: {
        allowHeaders: ['Authorization'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.HEAD, CorsHttpMethod.OPTIONS, CorsHttpMethod.POST],
        allowOrigins: [''],
        maxAge: Duration.days(10),
      },
    })

    new route53.ARecord(this, 'ARecord', {
      zone,
      target: route53.RecordTarget.fromAlias(new ApiGatewayv2Domain(apiDomainName))
    })

    const handlerDir = path.resolve(__dirname, '..', '..', '..', 'backend', 'src', 'handlers')

    // const listPostsHandler = new LambdaFunction(this, 'ListPostsHandler', {
    //   entry: path.join(handlerDir, 'posts', 'list.ts'),
    // })

    // const listPostsIntegration = new LambdaProxyIntegration({handler: listPostsHandler.lambdaFunction})

    // this.api.addRoutes({
    //   path: '/posts',
    //   methods: [HttpMethod.GET],
    //   integration: listPostsIntegration
    // })

  }
}
