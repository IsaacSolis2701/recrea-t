import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const numberFromEnv = (value, fallback) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
	rootDir,
	port: numberFromEnv(process.env.PORT, 4000),
	db: {
		host: process.env.DB_HOST || '127.0.0.1',
		port: numberFromEnv(process.env.DB_PORT, 3306),
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'recreat',
	},
	jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
	clientAppUrl: process.env.CLIENT_APP_URL || '',
	publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
	enableDemoMode: process.env.DEMO_MODE === 'true',
	defaultAdmin: {
		name: process.env.DEFAULT_ADMIN_NAME || 'Administrador',
		username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
		email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@recreat.local',
		password: process.env.DEFAULT_ADMIN_PASSWORD || '',
	},
	uploadRoot: path.join(rootDir, 'server', 'uploads'),
	email: {
		from: process.env.EMAIL_FROM || 'info@recrea-t.es',
		smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
		smtpPort: numberFromEnv(process.env.SMTP_PORT, 587),
		smtpSecure: process.env.SMTP_SECURE === 'true',
		smtpUser: process.env.SMTP_USER || process.env.GMAIL_USER,
		smtpPass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
	},
};
