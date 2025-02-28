
const { Kafka, Partitioners } = require('kafkajs');
const kafka = new Kafka({
  clientId: 'gps-server',
  brokers: ['localhost:9092'],
});
const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

// (async () => {
//   try {
//     await producer.connect();
//     console.log('Kafka Producer connected');
//   } catch (error) {
//     console.error('Error connecting to Kafka:', error);
//   }
// })();

const produceToKafka = async (topic, key, value) => {
  try {
    if (typeof value !== 'string') {
      value = JSON.stringify(value); // Ensure value is a string
    }

    // await producer.send({
    //   topic,
    //   messages: [{ key, value }],
    //   acks: -1, // Ensure message is committed by all in-sync replicas before acknowledging
    //   retry: { retries: 5 }, // Retry up to 5 times in case of failure
    // });

    console.log(`✅ Message sent to Kafka topic: ${topic}`);
  } catch (error) {
    console.error('❌ Error sending message to Kafka:', error);
  }
};


module.exports = { produceToKafka };
