import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { ProcessVideoRequest } from '@/types';

// Inicializar cliente de AWS SQS
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

/**
 * Envía un trabajo de procesamiento de video a la cola
 * @param request Datos del trabajo de procesamiento
 * @returns ID del mensaje en la cola
 */
export async function enqueueVideoProcessingJob(
  request: ProcessVideoRequest
): Promise<string> {
  try {
    if (!process.env.AWS_SQS_QUEUE_URL) {
      throw new Error('URL de la cola SQS no configurada');
    }

    // Enviar mensaje a la cola SQS
    const response = await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.AWS_SQS_QUEUE_URL,
        MessageBody: JSON.stringify(request),
        MessageAttributes: {
          JobType: {
            DataType: 'String',
            StringValue: 'VideoProcessing',
          },
        },
      })
    );

    if (!response.MessageId) {
      throw new Error('No se pudo encolar el trabajo');
    }

    return response.MessageId;
  } catch (error) {
    console.error('Error al encolar trabajo de procesamiento:', error);
    throw new Error(`Error al encolar trabajo: ${(error as Error).message}`);
  }
}

/**
 * Recibe trabajos de procesamiento de video de la cola
 * @param maxMessages Número máximo de mensajes a recibir
 * @param visibilityTimeout Tiempo de visibilidad en segundos
 * @returns Lista de trabajos de procesamiento
 */
export async function receiveVideoProcessingJobs(
  maxMessages: number = 1,
  visibilityTimeout: number = 300
): Promise<{ messageId: string; body: ProcessVideoRequest; receiptHandle: string }[]> {
  try {
    if (!process.env.AWS_SQS_QUEUE_URL) {
      throw new Error('URL de la cola SQS no configurada');
    }

    // Recibir mensajes de la cola SQS
    const response = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: process.env.AWS_SQS_QUEUE_URL,
        MaxNumberOfMessages: maxMessages,
        VisibilityTimeout: visibilityTimeout,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All'],
      })
    );

    if (!response.Messages || response.Messages.length === 0) {
      return [];
    }

    // Procesar los mensajes recibidos
    return response.Messages.map((message) => {
      if (!message.Body || !message.MessageId || !message.ReceiptHandle) {
        throw new Error('Mensaje incompleto recibido de SQS');
      }

      return {
        messageId: message.MessageId,
        body: JSON.parse(message.Body) as ProcessVideoRequest,
        receiptHandle: message.ReceiptHandle,
      };
    });
  } catch (error) {
    console.error('Error al recibir trabajos de procesamiento:', error);
    throw new Error(`Error al recibir trabajos: ${(error as Error).message}`);
  }
}

/**
 * Elimina un trabajo de la cola después de procesarlo
 * @param receiptHandle Identificador de recibo del mensaje
 */
export async function deleteVideoProcessingJob(
  receiptHandle: string
): Promise<void> {
  try {
    if (!process.env.AWS_SQS_QUEUE_URL) {
      throw new Error('URL de la cola SQS no configurada');
    }

    // Eliminar mensaje de la cola SQS
    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: process.env.AWS_SQS_QUEUE_URL,
        ReceiptHandle: receiptHandle,
      })
    );
  } catch (error) {
    console.error('Error al eliminar trabajo de procesamiento:', error);
    throw new Error(`Error al eliminar trabajo: ${(error as Error).message}`);
  }
}

/**
 * Implementación simple de cola en memoria para desarrollo local
 */
export class LocalQueue {
  private static instance: LocalQueue;
  private queue: { id: string; body: any }[] = [];

  private constructor() {}

  public static getInstance(): LocalQueue {
    if (!LocalQueue.instance) {
      LocalQueue.instance = new LocalQueue();
    }
    return LocalQueue.instance;
  }

  /**
   * Añade un mensaje a la cola local
   * @param body Cuerpo del mensaje
   * @returns ID del mensaje
   */
  public enqueue(body: any): string {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.queue.push({ id, body });
    return id;
  }

  /**
   * Obtiene mensajes de la cola local
   * @param maxMessages Número máximo de mensajes a obtener
   * @returns Mensajes de la cola
   */
  public dequeue(maxMessages: number = 1): { id: string; body: any }[] {
    const messages = this.queue.slice(0, maxMessages);
    this.queue = this.queue.slice(maxMessages);
    return messages;
  }

  /**
   * Obtiene el número de mensajes en la cola
   * @returns Número de mensajes
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Limpia la cola
   */
  public clear(): void {
    this.queue = [];
  }
}