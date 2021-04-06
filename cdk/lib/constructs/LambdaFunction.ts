import {Construct, Stack} from '@aws-cdk/core';
import {Tracing, Runtime, LayerVersion, IFunction} from '@aws-cdk/aws-lambda';
import {NodejsFunction, BundlingOptions} from '@aws-cdk/aws-lambda-nodejs'
import {ManagedPolicy} from '@aws-cdk/aws-iam';

export interface LambdaFunctionProps {
  entry: string;
  handler?: string;
  runtime?: Runtime;
  bundlingOptions?: BundlingOptions;
  environment?: {[key: string]: string};
}

export class LambdaFunction extends Construct {
  lambdaFunction: IFunction

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id)
    const lambdaInsightlayer = LayerVersion.fromLayerVersionArn(
      scope,
      'LambdaInsightsLayer',
      `arn:aws:lambda:${Stack.of(this).region}:580247275435:layer:LambdaInsightsExtension:14`,
    );

    this.lambdaFunction = new NodejsFunction(this, 'Resource', {
      entry: props.entry,
      handler: props.handler,
      runtime: props.runtime ?? Runtime.NODEJS_14_X,
      tracing: Tracing.ACTIVE,
      bundling: props.bundlingOptions,
      layers: [lambdaInsightlayer],
    })

    this.lambdaFunction.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLambdaInsightsExecutionRolePolicy'),
    );
  }
}
