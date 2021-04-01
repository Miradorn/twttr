import {APIGatewayProxyHandlerV2} from 'aws-lambda'

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  console.log('Received event', event, context);

  return {
    statusCode: 200,
    body: JSON.stringify({message: 'Success'}),
  };
}
