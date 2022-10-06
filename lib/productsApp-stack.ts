import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';

interface ProductsAppStackProps extends cdk.StackProps {
  eventsDdb: dynamodb.Table
}
export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJS.NodejsFunction
  readonly productsAdminHandler: lambdaNodeJS.NodejsFunction
  readonly productsDb: dynamodb.Table
  constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
    super(scope, id, props)

    this.productsDb = new dynamodb.Table(this, 'ProductsDb', {
      tableName: 'Products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    })

    // Products Layer
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductsLayerVersionArn');
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductsLayerVersionArn', productsLayerArn);

    const productsEventsHandler = new lambdaNodeJS.NodejsFunction(this,
      "ProductsEventsFunction", {
      functionName: "ProductsFetchFunction",
      entry: "lambda/products/productEventsFunction.ts",
      handler: "handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        EVENTS_DB: props.eventsDdb.tableName
      },
      layers: [productsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    props.eventsDdb.grantWriteData(productsEventsHandler);

    this.productsFetchHandler = new lambdaNodeJS.NodejsFunction(this,
      "ProductsFetchFunction", {
      functionName: "ProductsFetchFunction",
      entry: "lambda/products/productsFetchFunction.ts",
      handler: "handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        PRODUCTS_DB: this.productsDb.tableName
      },
      layers: [productsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    this.productsDb.grantReadData(this.productsFetchHandler)

    this.productsAdminHandler = new lambdaNodeJS.NodejsFunction(this,
      "ProductsAdminFunction", {
      functionName: "ProductsAdminFunction",
      entry: "lambda/products/productsAdminFunction.ts",
      handler: "handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        PRODUCTS_DB: this.productsDb.tableName,
        PRODUCT_EVENT_FUNCTION_NAME: productsEventsHandler.functionName
      },
      layers: [productsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
    })
    this.productsDb.grantWriteData(this.productsAdminHandler)
    productsEventsHandler.grantInvoke(this.productsAdminHandler)
  }
}