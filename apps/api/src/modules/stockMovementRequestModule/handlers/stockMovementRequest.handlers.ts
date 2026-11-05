import { NotifyManagersHandler } from './notifyManager.handler';
import { NotifyRequesterHandler } from './notifyRequest.handler';

export * from './notifyManager.handler';
export * from './notifyRequest.handler';

export const stockMovementRequestHandlers = [
  NotifyManagersHandler,
  NotifyRequesterHandler,
];
