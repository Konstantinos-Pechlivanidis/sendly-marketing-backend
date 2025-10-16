import axios from 'axios';

const mitto = axios.create({
  baseURL: process.env.MITTO_API_BASE || 'https://api.mitto.ch',
  timeout: 15000,
});

mitto.interceptors.request.use((config) => {
  config.headers = {
    ...(config.headers || {}),
    'x-mitto-api-key': process.env.MITTO_API_KEY,
    'Content-Type': 'application/json',
  };
  return config;
});

/**
 * Send single SMS via Mitto
 * @param {{from:string,to:string,text:string,callback_url?:string}} payload
 * @returns {Promise<{message_id:string,status:string}|any>}
 */
export async function sendSms(payload) {
  // Adjust path if Mitto uses a different endpoint in your account (e.g. /sms or /v2/sms)
  const { data } = await mitto.post('/sms', {
    from: payload.from,
    to: payload.to,
    text: payload.text,
    // optional callbacks for DLR or inbound if Mitto supports it per message
    callback_url: payload.callback_url,
  });
  return data;
}

export default { sendSms };
