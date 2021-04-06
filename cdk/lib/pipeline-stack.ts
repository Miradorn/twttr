import {Stack, StackProps, Construct, SecretValue} from '@aws-cdk/core';
import {CdkPipeline, SimpleSynthAction} from '@aws-cdk/pipelines';

import * as Codepipeline from '@aws-cdk/aws-codepipeline';
import * as CodepipelineActions from '@aws-cdk/aws-codepipeline-actions';
import * as Codebuild from '@aws-cdk/aws-codebuild';
import * as S3 from '@aws-cdk/aws-s3';

import {ApplicationStage} from './stages/application-stage'

export class PipelineStack extends Stack {
  readonly frontendDomainName = "twttr.alst.superluminar.io";
  readonly backendDomainName = "api.twttr.alst.superluminar.io";
  readonly hostedZoneName = "alst.superluminar.io";
  readonly hostedZoneId = "Z06582792RO4T9WZ06BUN";

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new Codepipeline.Artifact();
    const buildArtifact = new Codepipeline.Artifact();
    const cloudAssemblyArtifact = new Codepipeline.Artifact();

    const pipeline = new CdkPipeline(this, 'Resource', {
      pipelineName: 'TwttrPipeline',
      cloudAssemblyArtifact,

      sourceAction: new CodepipelineActions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('github-token'),
        trigger: CodepipelineActions.GitHubTrigger.POLL,
        // Replace these with your actual GitHub project info
        owner: 'Miradorn',
        repo: 'twttr',
        branch: 'main'
      }),

      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        subdirectory: 'cdk',

        // Use this if you need a build step (if you're not using ts-node
        // or if you have TypeScript Lambdas that need to be compiled).
        // buildCommand: 'npm run build',
      }),
    });

    const applicationStage = new ApplicationStage(this, 'ApplicationStage', {
      frontendDomainName: this.frontendDomainName,
      backendDomainName: this.backendDomainName,
      hostedZoneName: this.hostedZoneName,
      hostedZoneId: this.hostedZoneId,
    })
    pipeline.addApplicationStage(applicationStage)

    const buildAndDeployStage = pipeline.addStage(
      "BuildAndDeployStage"
    );

    buildAndDeployStage.addActions(
      this.buildAction(
        sourceArtifact,
        buildArtifact,
        buildAndDeployStage.nextSequentialRunOrder()
      ),
      this.deployAction(
        buildArtifact,
        this.frontendDomainName,
        buildAndDeployStage.nextSequentialRunOrder()
      )
    );
  }

  private buildAction(
    sourceArtifact: Codepipeline.Artifact,
    buildArtifact: Codepipeline.Artifact,
    runOrder: number
  ): CodepipelineActions.CodeBuildAction {
    return new CodepipelineActions.CodeBuildAction({
      input: sourceArtifact,
      outputs: [buildArtifact],
      runOrder: runOrder,
      actionName: "Build",
      project: new Codebuild.PipelineProject(this, "TwttrBuildProject", {
        projectName: "TwttrBuildProject",
        buildSpec: Codebuild.BuildSpec.fromSourceFilename(
          "cdk/buildspec.frontend.yml"
        ),
        environment: {
          buildImage: Codebuild.LinuxBuildImage.STANDARD_5_0,
        },
      }),
    });
  }

  private deployAction(
    input: Codepipeline.Artifact,
    bucketName: string,
    runOrder: number
  ): CodepipelineActions.S3DeployAction {
    const bucket = S3.Bucket.fromBucketName(this, "WebsiteBucket", bucketName);

    return new CodepipelineActions.S3DeployAction({
      actionName: "Deploy",
      runOrder: runOrder,
      input: input,
      bucket: bucket,
    });
  }
}
