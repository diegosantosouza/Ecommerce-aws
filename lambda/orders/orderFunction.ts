import { DynamoDB } from "aws-sdk"
import { OrderRepository } from "./layers/ordersLayer/nodejs/ordersRepository"
import { ProductRepository } from "/opt/nodejs/productsLayer"
import * as AWSXRay from "aws-xray-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

AWSXRay.captureAWS(require("aws-sdk"))

const ordersDdb = process.env.ORDERS_DDB!
const productsDdb = process.env.PRODUCTS_DDB!

const ddbClient = new DynamoDB.DocumentClient()

const orderRepository = new OrderRepository(ddbClient, ordersDdb)
const productRepository = new ProductRepository(ddbClient, productsDdb)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const apiRequestId = event.requestContext.requestId;
  const lambdaRequestId = context.awsRequestId

  console.log(`API Gateway RequestId: ${apiRequestId} - LambdaRequestId : ${lambdaRequestId}`);

  if (method === 'GET') {
    if (event.queryStringParameters) {
      const email = event.queryStringParameters!.email
      const orderId = event.queryStringParameters!.orderId      
    }
  }
  if (method === 'POST') {
    console.log('POST /orders')
  }
  if (method === 'PUT') {
    console.log('PUT /orders')
  }
  if (method === 'DELETE') {
    console.log('DELETE /orders')
    const email = event.queryStringParameters!.email
    const orderId = event.queryStringParameters!.orderId
  }
  return {
    statusCode: 400,
    body: 'Bad Request'
  }
}