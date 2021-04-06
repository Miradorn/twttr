import {Construct, Stack} from '@aws-cdk/core';
import {Tracing, Runtime, LayerVersion, ILayerVersion, IFunction} from '@aws-cdk/aws-lambda';
import {NodejsFunction, BundlingOptions} from '@aws-cdk/aws-lambda-nodejs'
import {ManagedPolicy} from '@aws-cdk/aws-iam';

export interface LambdaFunctionProps {
  tsconfig: string;
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

    this.lambdaFunction = new NodejsFunction(this, 'Resource', {
      entry: props.entry,
      handler: props.handler,
      bundling: {tsconfig: props.tsconfig },
      runtime: props.runtime ?? Runtime.NODEJS_14_X,
      tracing: Tracing.ACTIVE,
      layers: [this.getOrCreateLambdaInsightsLayer()],
    })

    this.lambdaFunction.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLambdaInsightsExecutionRolePolicy'),
    );
  }

  public getOrCreateLambdaInsightsLayer() {
    const uniqueid = 'LambdaInsightsLayer';
    const stack = Stack.of(this);

    let layer = stack.node.tryFindChild(uniqueid) as ILayerVersion

    if (!layer) {
      layer = LayerVersion.fromLayerVersionArn(
        stack,
        uniqueid,
        `arn:aws:lambda:${Stack.of(this).region}:580247275435:layer:LambdaInsightsExtension:14`,
      );
    }

    return layer
  }
}
