import { DynamoDB } from "aws-sdk"
import { Order, OrderRepository } from "./layers/ordersLayer/nodejs/ordersRepository"
import { Product, ProductRepository } from "/opt/nodejs/productsLayer"
import * as AWSXRay from "aws-xray-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { CarrierType, OrderProductResponse, OrderRequest, OrderResponse, PaymentType, ShippingType } from "./layers/ordersLayer/nodejs/ordersApiLayer/nodejs/orderApi";

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

function convertToOrderResponse(order: Order): OrderResponse {
  const orderProducts: OrderProductResponse[] = []
  order.products.forEach(product => {
    orderProducts.push({
      code: product.code,
      price: product.price
    })
  })
  const orderResponse: OrderResponse = {
    email: order.pk,
    id: order.sk!,
    createdAt: order.createdAt!,
    products: orderProducts,
    billing: {
      payment: order.billing.payment as PaymentType,
      totalPrice: order.billing.totalPrice
    },
    shipping: {
      type: order.shipping.type as ShippingType,
      carrier: order.shipping.carrier as CarrierType
    }
  }
  return orderResponse
}
function buildOrder(orderRequest: OrderRequest, products: Product[]): Order {
  const orderProducts: OrderProductResponse[] = []
  let totalPrice = 0

  products.forEach(product => {
    totalPrice += product.price
    orderProducts.push({
      code: product.code,
      price: product.price
    })
  })

  const order: Order = {
    pk: orderRequest.email,
    billing: {
      payment: orderRequest.payment,
      totalPrice: totalPrice
    },
    shipping: {
      type: orderRequest.shipping.type,
      carrier: orderRequest.shipping.carrier
    },
    products: orderProducts
  }
  return order
}