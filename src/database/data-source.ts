import { DataSource } from 'typeorm';
import { config } from '../common/config';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource(config.getDatabaseOptions());
export default AppDataSource;
