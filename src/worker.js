// const { parentPort } = require('worker_threads');
// const { Kafka, Partitioners } = require('kafkajs');
// const kafka = new Kafka({
//   clientId: 'gps-worker',
//   brokers: ['localhost:9092'],
// });
// const producer = kafka.producer({
//   createPartitioner: Partitioners.LegacyPartitioner
// });

// (async () => {
//     try {
//         let isProducerConnected = false;
//         if (!isProducerConnected) {
//             await producer.connect();
//             console.log('✅ Worker Kafka Producer connected');
//             isProducerConnected = true;
//         }
//     } catch (error) {
//         console.error('❌ Failed to connect Kafka Producer:', error.message);
//         process.exit(1); // Exit worker if Kafka connection fails
//     }
// })();

// parentPort.on('message', async (message) => {
//     const { clientAddress, data } = message;

//     if (!clientAddress || !data) {
//         console.error('⚠️ Invalid message received by worker:', message);
//         return;
//     }

//     try {
//         console.log(`🔄 Worker processing data from ${clientAddress}`);
//     } catch (err) {
//         console.error(`❌ Error sending to Kafka [${clientAddress}]: ${err.message}`);
//     }
// });

// // Handle unexpected errors
// process.on('uncaughtException', (err) => {
//     console.error('❌ Uncaught exception in worker:', err);
// });

// process.on('unhandledRejection', (reason, promise) => {
//     console.error('❌ Unhandled promise rejection:', reason);
// });
