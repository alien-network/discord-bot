import Keyv from 'keyv';
import config from '../config.js';

// Connect to redis
const keyv = new Keyv(`redis://${config.redis.host}:${config.redis.port}`, {
  namespace: 'alien-network',
});
keyv.on('error', (e) => console.error('Keyv connection error:', e));

console.info('Keyv initialized');

export default keyv;
