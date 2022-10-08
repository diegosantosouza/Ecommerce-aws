import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cwlogs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

interface ECommerceStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJS.NodejsFunction;
  productsAdminHandler: lambdaNodeJS.NodejsFunction;
  ordersHandler: lambdaNodeJS.NodejsFunction;
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

    this.createProductsService(props, api);
    this.createOrdersService(props, api);
  }

  private createOrdersService(props: ECommerceStackProps, api: apigateway.RestApi) {
    const ordersIntegration = new apigateway.LambdaIntegration(props.ordersHandler)

    //resource - /orders
    const ordersResource = api.root.addResource('orders')

    //POST - /orders
    ordersResource.addMethod("POST", ordersIntegration);
    //GET - /orders
    //GET - /orders?email=mail@mail.com
    //GET - /orders?email=mail@mail.com&orderId=123
    ordersResource.addMethod("GET", ordersIntegration);
    //DELETE - /orders?email=mail@mail.com&orderId=123
    const orderDeletionValidator = new apigateway.RequestValidator(this, "OrderDeletionValidator", {
      restApi: api,
      requestValidatorName: "OrderDeletionValidator",
      validateRequestParameters: true,
    })
    ordersResource.addMethod("DELETE", ordersIntegration, {
      requestParameters: {
        'method.request.querystring.email': true,
        'method.request.querystring.orderId': true,
      },
      requestValidator: orderDeletionValidator
    });
  }

  private createProductsService(props: ECommerceStackProps, api: apigateway.RestApi) {
    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler);

    // "/products"
    const productsResources = api.root.addResource('products');
    productsResources.addMethod('GET', productsFetchIntegration);

    // GET /products/{id}
    const productsIdResources = productsResources.addResource('{id}');
    productsIdResources.addMethod('GET', productsFetchIntegration);

    const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler);

    // POST /products
    productsResources.addMethod('POST', productsAdminIntegration);
    // PUT /products/{id}
    productsIdResources.addMethod('PUT', productsAdminIntegration);
    // DELETE /products/{id}
    productsIdResources.addMethod('DELETE', productsAdminIntegration);
  }
}