import { PubSub } from '../../src/util-private/pub-sub';

test('basic Pubsub publishes events to all handlers', () => {
  // GIVEN
  const pubSub = PubSub.basicPubSub<number>();
  const handler1 = jest.fn();
  const handler2 = jest.fn();
  pubSub.subscribe(handler1);
  pubSub.subscribe(handler2);

  // WHEN
  pubSub.publish(1337);
  pubSub.publish(31337);

  // THEN
  expect(handler1).toBeCalledWith(1337);
  expect(handler1).toBeCalledWith(31337);
  expect(handler2).toBeCalledWith(1337);
  expect(handler2).toBeCalledWith(31337);
});

test('replaying PubSub publishes all old events to new subscribers', () => {
  // GIVEN
  const pubSub = PubSub.replayingPubSub<number>();
  const handler1 = jest.fn();
  pubSub.subscribe(handler1);
  pubSub.publish(1337);
  pubSub.publish(31337);

  const handler2 = jest.fn();

  // WHEN
  pubSub.subscribe(handler2);

  // THEN
  expect(handler2).toBeCalledWith(1337);
  expect(handler2).toBeCalledWith(31337);
});