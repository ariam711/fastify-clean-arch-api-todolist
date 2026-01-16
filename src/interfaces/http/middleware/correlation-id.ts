import type { FastifyReply, FastifyRequest } from 'fastify';
import { nanoid } from 'nanoid';

export async function correlationIdHook(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const correlationId = request.headers['x-correlation-id'] ?? nanoid();
  request.headers['x-correlation-id'] = correlationId as string;
}

export async function correlationIdResponseHook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const correlationId = request.headers['x-correlation-id'];
  if (correlationId) {
    reply.header('x-correlation-id', correlationId);
  }
}
