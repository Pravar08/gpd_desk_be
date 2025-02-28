// const { Kafka } = require('kafkajs');
// // const { query } = require('./db'); // Import PostgreSQL query function

// const kafka = new Kafka({
//     clientId: 'gps-consumer',
//     brokers: ['localhost:9092'], // Replace with your EC2 IP if needed
// });

// const consumer = kafka.consumer({ groupId: 'gps-group' });

// const BATCH_SIZE = 50;
// const buffer = [];

// (async () => {
//     await consumer.connect();
//     await consumer.subscribe({ topic: 'gps-data', fromBeginning: false });

//     console.log('✅ Kafka Consumer started');

//     await consumer.run({
//         eachMessage: async ({ message }) => {
//             try {
//                 const parsedMessage = JSON.parse(message.value.toString());
//                 buffer.push(parsedMessage);
// console.log('message seen',message)
//                 if (buffer.length >= BATCH_SIZE) {
//                     console.log(`🚀 Processing batch of ${BATCH_SIZE} messages`);

//                     const values = buffer.map(({ clientAddress, rawData, timestamp }) => 
//                         `('${clientAddress}', '${rawData}', '${timestamp}')`
//                     ).join(',');

//                     // const queryText = `INSERT INTO gps_data (client_address, raw_data, received_at) VALUES ${values}`;

//                     // await query(queryText); // Insert into PostgreSQL

//                     console.log(`✅ Batch inserted ${buffer.length} records into PostgreSQL`);
//                     buffer.length = 0; // Clear buffer
//                 }
//             } catch (error) {
//                 console.error('❌ Error processing Kafka message:', error.message);
//             }
//         },
//     });
// })();
const { Kafka } = require('kafkajs');
const { query } = require('./db'); // Import PostgreSQL query function

const kafka = new Kafka({
    clientId: 'gps-consumer',
    brokers: ['localhost:9092'], // Replace with your EC2 IP if needed
});

const consumer = kafka.consumer({ groupId: 'gps-group' });

const BATCH_SIZE = 50;
const buffer = [];

const processBatch = async () => {
    if (buffer.length === 0) return;

    try {
        console.log(`🚀 Processing batch of ${buffer.length} messages`);
        console.log('buffer see', buffer[0]);
        console.log('buffer see1', buffer[1]);

        // Ensure JSON keys match PostgreSQL table columns & Remove \u0000
        const jsonData = JSON.stringify(buffer.map(msg => ({
            rawData: msg.rawData || '',  // Ensure rawData is not null
            parseData: msg.parseData || '{}',  // Fix property name
            resData: msg.resData || ''  // Fix handling of undefined
        })));

        // Call the stored procedure
        await query('CALL insert_gps_logs_bulk($1::JSONB);', [jsonData]);

        console.log(`✅ Successfully inserted ${buffer.length} records into PostgreSQL`);
        buffer.length = 0; // Clear buffer
    } catch (error) {
        console.error('❌ Error inserting batch into PostgreSQL:', error.message);
    }
};



(async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'gps-data', fromBeginning: false });

    console.log('✅ Kafka Consumer started');

    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                const parsedMessage = JSON.parse(message.value.toString());
                console.log({
                    rawData: parsedMessage.rawData,       // Matches `data_received`
                    parseData: parsedMessage.parsedData, // Matches `parsed_data`
                    resData: parsedMessage.responseData, // Matches `response_data`
                    timestamp: parsedMessage.timestamp   // Not needed for insert
                })
                
                buffer.push({
                    rawData: parsedMessage.rawData,       // Matches `data_received`
                    parseData: parsedMessage.parsedData, // Matches `parsed_data`
                    resData: parsedMessage.responseData, // Matches `response_data`
                    timestamp: parsedMessage.timestamp   // Not needed for insert
                });

                // Process batch when it reaches the threshold
                if (buffer.length >= BATCH_SIZE) {
                    await processBatch();
                }
            } catch (error) {
                console.error('❌ Error processing Kafka message:', error.message);
            }
        },
    });

    // Process remaining messages every 5 seconds (if the batch size isn't filled)
    setInterval(processBatch, 15000); // Reduce interval to 5 seconds
})();
