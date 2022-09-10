import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cwlogs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

interface ECommerceStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJS.NodejsFunction
  productsAdminHandler: lambdaNodeJS.NodejsFunction
}
export class ECommerceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ECommerceStackProps) {
    super(scope, id, props)

    const logGroup = new cwlogs.LogGroup(this, 'ECommerceApiLogs')
    const api = new apigateway.RestApi(this, "ECommerceApi", {
      restApiName: "ECommerceApi",
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true,
        })
      },
      cloudWatchRole: true
    })

    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler)

    // "/products"
    const productsResources = api.root.addResource('products')
    productsResources.addMethod('GET', productsFetchIntegration)

    // GET /products/{id}
    const productsIdResources = productsResources.addResource('{id}')
    productsIdResources.addMethod('GET', productsFetchIntegration)

    const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler)

    // POST /products
    productsResources.addMethod('POST', productsAdminIntegration)
    // PUT /products/{id}
    productsIdResources.addMethod('PUT', productsAdminIntegration)
    // DELETE /products/{id}
    productsIdResources.addMethod('DELETE', productsAdminIntegration)
  }
}