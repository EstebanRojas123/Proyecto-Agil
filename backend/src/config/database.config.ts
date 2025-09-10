import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'nestuser',
  password: process.env.DB_PASSWORD || 'nestpassword',
  database: process.env.DB_NAME || 'nestdb',
}));
