const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemInstruction = 'You are the Admin AI. You have access to searchDatabase and proposeDatabaseUpdate.';
  const tools = [{
    functionDeclarations: [
      {
        name: 'searchDatabase',
        description: 'Search',
        parameters: { type: 'OBJECT', properties: { collectionName: { type: 'STRING' }, filterJson: { type: 'STRING' } }, required: ['collectionName', 'filterJson'] }
      },
      {
        name: 'proposeDatabaseUpdate',
        description: 'Propose update',
        parameters: { type: 'OBJECT', properties: { collectionName: { type: 'STRING' }, documentIds: { type: 'ARRAY', items: { type: 'STRING' } }, updateJson: { type: 'STRING' }, reasoning: { type: 'STRING' } }, required: ['collectionName', 'documentIds', 'updateJson', 'reasoning'] }
      }
    ]
  }];

async function run() {
  const chatSession = ai.chats.create({ model: 'gemini-3.1-flash-lite', config: { systemInstruction, tools, temperature: 0.1 } });
  const result = await chatSession.sendMessage({ message: 'Update product with id 123 to price 200' });
  console.log('Function calls:', JSON.stringify(result.functionCalls, null, 2));
}
run();
