import { verifyKey } from 'discord-interactions';

export async function verifyDiscordRequest(publicKey, signature, timestamp, body) {
  if (!signature || !timestamp || !publicKey) {
    console.error('Missing required parameters for Discord verification');
    return { isValid: false };
  }

  try {
    const isValidRequest = await verifyKey(body, signature, timestamp, publicKey);
    
    if (!isValidRequest) {
      console.error('Invalid Discord request signature');
      return { isValid: false };
    }

    const interaction = JSON.parse(new TextDecoder().decode(body));
    console.log('interaction:', interaction);
    return { isValid: true, interaction };
  } catch (error) {
    console.error('Error verifying Discord request:', error);
    return { isValid: false };
  }
}
