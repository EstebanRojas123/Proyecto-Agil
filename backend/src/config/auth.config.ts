import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  url: process.env.AUTH_URL || 'https://puclaro.ucn.cl/eross/avance',
}));

