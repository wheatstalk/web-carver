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
  expect(handler1).toBeCalledTimes(2);
  expect(handler1).toBeCalledWith(1337);
  expect(handler1).toBeCalledWith(31337);
  expect(handler2).toBeCalledTimes(2);
  expect(handler2).toBeCalledWith(1337);
  expect(handler2).toBeCalledWith(31337);
});

test('replaying PubSub handles mutation of the event log during replay', () => {
  const pubSub = PubSub.replayingPubSub<number>();
  const subscriber = jest.fn();

  pubSub.subscribe(subscriber);
  pubSub.publish(1);

  // WHEN
  const tracking = new Array<number>();
  pubSub.subscribe(x => {
    if (tracking.find(y => y === x)) {
      throw new Error('Test failed');
    } else {
      tracking.push(x);
    }
    if (x === 1) {
      pubSub.publish(2);
    }
  });

  // THEN
  expect(subscriber).toBeCalledTimes(2);
});