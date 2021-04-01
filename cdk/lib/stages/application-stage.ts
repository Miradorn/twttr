import {Construct, Stage, StageProps} from '@aws-cdk/core';

import {BackendStack} from '../stacks/backend-stack'
import {FrontendStack} from '../stacks/frontend-stack'

export interface ApplicationStageProps extends StageProps {
  frontendDomainName: string;
  backendDomainName: string;
  hostedZoneName: string;
  hostedZoneId: string;
}

export class ApplicationStage extends Stage {
  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props)

    new BackendStack(this, 'Backend', props);

    new FrontendStack(this, 'Frontend', {
      domainName: props.frontendDomainName,
      hostedZoneId: props.hostedZoneId,
      hostedZoneName: props.hostedZoneName
    });

  }
}
