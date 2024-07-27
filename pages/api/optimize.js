import axios from 'axios';

const CLOUD_RUN_URL = 'https://cardiovascular-model-fitting-avoqm4qv7q-an.a.run.app/optimize';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    try {
      const response = await axios.post(CLOUD_RUN_URL, req.body, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Cloud Run API response:', response.data);
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error from Cloud Run API:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.message,
        details: error.response?.data,
        requestBody: req.body // リクエストボディも含める
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}