const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'gps-server',
  brokers: process.env.KAFKA_BROKERS.split(','), 
});

const producer = kafka.producer();

(async () => {
  await producer.connect();
  console.log('Kafka Producer connected');
})();

const produceToKafka = async (topic, key, value) => {
  await producer.send({
    topic,
    messages: [{ key, value }],
  });
};

module.exports = { produceToKafka };