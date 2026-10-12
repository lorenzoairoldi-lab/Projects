import amqp from 'amqplib';

let channelPromise;
const getChannel = async () => {
  if (!channelPromise) channelPromise = (async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    const channel = await connection.createChannel();
    await channel.assertExchange('risewithin.events', 'topic', { durable: true });
    return channel;
  })();
  return channelPromise;
};

export const publish = async (routingKey, payload) => {
  try {
    const channel = await getChannel();
    channel.publish('risewithin.events', routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true, contentType: 'application/json' });
  } catch (error) {
    console.warn(JSON.stringify({ level: 'warn', message: 'event_publish_failed', routingKey, error: error.message }));
  }
};

export const subscribe = async (routingKeys, handler, { queueName } = {}) => {
  const channel = await getChannel();
  const queue = await channel.assertQueue(queueName || '', queueName
    ? { durable: true }
    : { exclusive: true });
  for (const key of routingKeys) await channel.bindQueue(queue.queue, 'risewithin.events', key);
  channel.consume(queue.queue, async (message) => {
    if (!message) return;
    try { await handler(message.fields.routingKey, JSON.parse(message.content.toString())); channel.ack(message); }
    catch { channel.nack(message, false, true); }
  });
};
