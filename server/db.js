import mysql from 'mysql2/promise';
import { config } from './config.js';

let pool;

const escapeIdentifier = (value) => String(value).replaceAll('`', '');

export const ensureDatabaseExists = async () => {
	const connection = await mysql.createConnection({
		host: config.db.host,
		port: config.db.port,
		user: config.db.user,
		password: config.db.password,
	});

	try {
		const databaseName = escapeIdentifier(config.db.database);
		await connection.query(
			`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
		);
	} finally {
		await connection.end();
	}
};

export const getPool = () => {
	if (!pool) {
		pool = mysql.createPool({
			host: config.db.host,
			port: config.db.port,
			user: config.db.user,
			password: config.db.password,
			database: config.db.database,
			waitForConnections: true,
			connectionLimit: 10,
			namedPlaceholders: true,
			dateStrings: true,
		});
	}

	return pool;
};

const ensureColumnExists = async (db, tableName, columnName, definition) => {
	const [rows] = await db.query(
		`
			SELECT 1
			FROM information_schema.COLUMNS
			WHERE TABLE_SCHEMA = ?
				AND TABLE_NAME = ?
				AND COLUMN_NAME = ?
			LIMIT 1
		`,
		[config.db.database, tableName, columnName],
	);

	if (rows.length > 0) {
		return;
	}

	const safeTableName = escapeIdentifier(tableName);
	const safeColumnName = escapeIdentifier(columnName);
	await db.query(
		`ALTER TABLE \`${safeTableName}\` ADD COLUMN \`${safeColumnName}\` ${definition}`,
	);
};

export const initDatabase = async () => {
	await ensureDatabaseExists();
	const db = getPool();

	await db.query(`
		CREATE TABLE IF NOT EXISTS app_users (
			id CHAR(36) NOT NULL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			username VARCHAR(100) NOT NULL UNIQUE,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash VARCHAR(255) NOT NULL,
			role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS categories (
			id CHAR(36) NOT NULL PRIMARY KEY,
			name VARCHAR(255) NOT NULL UNIQUE,
			description TEXT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS materials_catalog (
			id CHAR(36) NOT NULL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT NULL,
			category_id CHAR(36) NULL,
			category VARCHAR(255) NULL,
			price DECIMAL(12,2) NOT NULL DEFAULT 0,
			brand VARCHAR(255) NULL,
			format VARCHAR(255) NULL,
			image_url TEXT NULL,
			ambiance_image_url TEXT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			CONSTRAINT fk_materials_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
		)
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS projects (
			id CHAR(36) NOT NULL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT NULL,
			location VARCHAR(255) NULL,
			start_date DATE NULL,
			estimated_delivery DATE NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'planning',
			progress INT NOT NULL DEFAULT 0,
			client_id CHAR(36) NULL,
			client_name VARCHAR(255) NULL,
			phases JSON NULL,
			invoices JSON NULL,
			budgets JSON NULL,
			certifications JSON NULL,
			gallery JSON NULL,
			materials JSON NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES app_users(id) ON DELETE SET NULL
		)
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS payments (
			id CHAR(36) NOT NULL PRIMARY KEY,
			project_id CHAR(36) NULL,
			client_id CHAR(36) NOT NULL,
			certification_id VARCHAR(100) NOT NULL,
			certification_name VARCHAR(255) NULL,
			amount DECIMAL(12,2) NOT NULL DEFAULT 0,
			status VARCHAR(50) NOT NULL DEFAULT 'paid',
			transaction_reference VARCHAR(255) NULL,
			payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			CONSTRAINT fk_payments_client FOREIGN KEY (client_id) REFERENCES app_users(id) ON DELETE CASCADE,
			CONSTRAINT fk_payments_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
		)
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS reminders (
			id CHAR(36) NOT NULL PRIMARY KEY,
			project_id CHAR(36) NOT NULL,
			client_id CHAR(36) NOT NULL,
			certification_id VARCHAR(100) NOT NULL,
			certification_name VARCHAR(255) NULL,
			type VARCHAR(100) NOT NULL DEFAULT 'payment',
			reminder_date DATE NOT NULL,
			status ENUM('pending', 'sent') NOT NULL DEFAULT 'pending',
			sent_at DATETIME NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			UNIQUE KEY uniq_reminder (project_id, certification_id, type),
			CONSTRAINT fk_reminders_client FOREIGN KEY (client_id) REFERENCES app_users(id) ON DELETE CASCADE,
			CONSTRAINT fk_reminders_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
		)
	`);

	await db.query(`
		CREATE TABLE IF NOT EXISTS pdfs (
			id CHAR(36) NOT NULL PRIMARY KEY,
			project_id CHAR(36) NULL,
			client_id CHAR(36) NULL,
			filename VARCHAR(255) NOT NULL,
			stored_name VARCHAR(255) NOT NULL,
			file_path VARCHAR(255) NOT NULL,
			file_url TEXT NOT NULL,
			mime_type VARCHAR(100) NULL,
			file_size BIGINT NOT NULL DEFAULT 0,
			uploader_id CHAR(36) NOT NULL,
			uploader_name VARCHAR(255) NULL,
			upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			CONSTRAINT fk_pdfs_uploader FOREIGN KEY (uploader_id) REFERENCES app_users(id) ON DELETE CASCADE
		)
	`);

	await ensureColumnExists(db, 'pdfs', 'project_id', 'CHAR(36) NULL');
	await ensureColumnExists(db, 'pdfs', 'client_id', 'CHAR(36) NULL');
};

export const closePool = async () => {
	if (!pool) {
		return;
	}

	await pool.end();
	pool = undefined;
};
