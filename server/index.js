import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';
import { getPool, initDatabase } from './db.js';

const emailTransporter = nodemailer.createTransport({
	host: config.email.smtpHost,
	port: config.email.smtpPort,
	secure: config.email.smtpSecure,
	auth: {
		user: config.email.smtpUser,
		pass: config.email.smtpPass,
	},
});

const app = express();
const pool = getPool();

const DEFAULT_PHASES = [
	{ id: 'phase1', name: 'PreReforma', status: 'pending', date: null },
	{ id: 'phase2', name: 'Inicio de Obra', status: 'pending', date: null },
	{ id: 'phase3', name: 'Demolición', status: 'pending', date: null },
	{ id: 'phase4', name: 'Tabiquería', status: 'pending', date: null },
	{ id: 'phase5', name: 'Instalaciones', status: 'pending', date: null },
	{ id: 'phase6', name: 'Acabados', status: 'pending', date: null },
	{ id: 'phase7', name: 'Entrega', status: 'pending', date: null },
];

const ensureDirectory = (directoryPath) => {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true });
	}
};

const safeJsonParse = (value, fallback = []) => {
	if (!value) return fallback;
	if (Array.isArray(value) || typeof value === 'object') return value;

	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
};

const sanitizeUser = (user) => ({
	id: user.id,
	name: user.name,
	username: user.username,
	email: user.email,
	role: user.role,
	created_at: user.created_at,
	updated_at: user.updated_at,
});

const normalizeProjectRow = (project) => ({
	...project,
	phases: safeJsonParse(project.phases, []),
	invoices: safeJsonParse(project.invoices, []),
	budgets: safeJsonParse(project.budgets, []),
	certifications: safeJsonParse(project.certifications, []),
	gallery: safeJsonParse(project.gallery, []),
	materials: safeJsonParse(project.materials, []),
	selected_categories: safeJsonParse(project.selected_categories, []),
	project_docs: safeJsonParse(project.project_docs, []),
	notes: safeJsonParse(project.notes, []),
	spaces: safeJsonParse(project.spaces, []),
});

const buildDefaultMaterialOptions = (material) => [
	{
		id: `${material.id}-default`,
		name: material.name,
		price: material.price,
		brand: material.brand,
		format: material.format,
		description: material.description,
		imageUrl: material.image_url || material.imageUrl || null,
		status: material.status === 'approved' ? 'approved' : 'pending',
	},
];

const sanitizeClientMaterialOptions = (existingMaterial, incomingMaterial) => {
	const baseOptions =
		Array.isArray(existingMaterial.options) && existingMaterial.options.length > 0
			? existingMaterial.options
			: buildDefaultMaterialOptions(existingMaterial);
	const incomingOptions = Array.isArray(incomingMaterial?.options) ? incomingMaterial.options : [];

	return baseOptions.map((option) => {
		const nextOption = incomingOptions.find((candidate) => String(candidate.id) === String(option.id));
		const nextStatus =
			nextOption?.status === 'approved'
				? 'approved'
				: nextOption?.status === 'rejected'
					? 'rejected'
					: option.status;

		return {
			...option,
			status: nextStatus,
		};
	});
};

const buildClientSafeMaterialsUpdate = (existingMaterials, incomingMaterials) => {
	if (!Array.isArray(existingMaterials)) {
		return [];
	}

	if (!Array.isArray(incomingMaterials)) {
		return existingMaterials;
	}

	const incomingById = new Map(incomingMaterials.map((material) => [String(material.id), material]));

	return existingMaterials.map((existingMaterial) => {
		const incomingMaterial = incomingById.get(String(existingMaterial.id));

		if (!incomingMaterial) {
			return existingMaterial;
		}

		const canChangeDecision = existingMaterial.status === 'pending';
		const nextStatus =
			canChangeDecision &&
			(incomingMaterial.status === 'approved' || incomingMaterial.status === 'rejected')
				? incomingMaterial.status
				: existingMaterial.status;

		return {
			...existingMaterial,
			status: nextStatus,
			options: sanitizeClientMaterialOptions(existingMaterial, incomingMaterial),
			changeNote: nextStatus === 'rejected' ? (incomingMaterial.changeNote ?? existingMaterial.changeNote ?? null) : null,
		};
	});
};

const buildSuccessUrl = (req, status) => {
	const appUrl = config.clientAppUrl || req.headers.origin || '';
	return appUrl ? `${appUrl.replace(/\/$/, '')}/?payment=${status}` : `/?payment=${status}`;
};

const buildPublicUrl = (req, relativePath) => {
	const baseUrl = config.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
	return `${baseUrl.replace(/\/$/, '')}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
};

const toProjectPayload = (payload) => {
	const phases = Array.isArray(payload.phases) ? payload.phases : DEFAULT_PHASES;
	const certifications = Array.isArray(payload.certifications) ? payload.certifications : [];
	const invoices = Array.isArray(payload.invoices) ? payload.invoices : [];
	const budgets = Array.isArray(payload.budgets) ? payload.budgets : [];
	const gallery = Array.isArray(payload.gallery) ? payload.gallery : [];
	const materials = Array.isArray(payload.materials) ? payload.materials : [];
	const selectedCategories = Array.isArray(payload.selected_categories) ? payload.selected_categories : [];
	const projectDocs = Array.isArray(payload.project_docs) ? payload.project_docs : [];
	const notes = Array.isArray(payload.notes) ? payload.notes : [];
	const spaces = Array.isArray(payload.spaces) ? payload.spaces : [];
	const completedPhases = phases.filter((phase) => phase.status === 'completed').length;
	const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : Number(payload.progress || 0);

	return {
		id: payload.id || uuidv4(),
		name: payload.name,
		description: payload.description || '',
		location: payload.location || '',
		start_date: payload.start_date || null,
		estimated_delivery: payload.estimated_delivery || null,
		status: payload.status || 'planning',
		progress,
		client_id: payload.client_id || null,
		client_name: payload.client_name || null,
		phases: JSON.stringify(phases),
		invoices: JSON.stringify(invoices),
		budgets: JSON.stringify(budgets),
		certifications: JSON.stringify(certifications),
		gallery: JSON.stringify(gallery),
		materials: JSON.stringify(materials),
		selected_categories: JSON.stringify(selectedCategories),
		project_docs: JSON.stringify(projectDocs),
		notes: JSON.stringify(notes),
		spaces: JSON.stringify(spaces),
	};
};

const getProjectById = async (projectId) => {
	const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [projectId]);
	return rows[0] ? normalizeProjectRow(rows[0]) : null;
};

const getProjectRowForUpdate = async (connection, projectId) => {
	const [rows] = await connection.execute('SELECT * FROM projects WHERE id = ? FOR UPDATE', [projectId]);
	return rows[0] ? normalizeProjectRow(rows[0]) : null;
};

const upsertPaidCertificationRecord = async (connection, project, certification) => {
	const [payments] = await connection.execute(
		'SELECT id FROM payments WHERE project_id = ? AND certification_id = ? LIMIT 1',
		[project.id, String(certification.id)],
	);

	const amount = Number(certification.amount || 0);
	const certificationName = certification.name || certification.number || 'Certificacion';
	const transactionReference = `PAY-${crypto.randomUUID().slice(0, 8)}`;

	if (payments.length > 0) {
		await connection.execute(
			`UPDATE payments
			 SET certification_name = ?, amount = ?, status = 'paid', transaction_reference = ?, payment_date = NOW()
			 WHERE id = ?`,
			[certificationName, amount, transactionReference, payments[0].id],
		);
		return;
	}

	await connection.execute(
		`INSERT INTO payments (
			id, project_id, client_id, certification_id, certification_name, amount, status, transaction_reference
		) VALUES (?, ?, ?, ?, ?, ?, 'paid', ?)`,
		[
			uuidv4(),
			project.id,
			project.client_id,
			String(certification.id),
			certificationName,
			amount,
			transactionReference,
		],
	);
};

const removeCertificationPaymentRecord = async (connection, projectId, certificationId) => {
	await connection.execute('DELETE FROM payments WHERE project_id = ? AND certification_id = ?', [
		projectId,
		String(certificationId),
	]);
};

const syncRemindersForProject = async (connection, project) => {
	const certifications = Array.isArray(project.certifications) ? project.certifications : safeJsonParse(project.certifications, []);
	const reminders = certifications
		.filter((certification) => certification.expiryDate && !certification.isPaid)
		.map((certification) => {
			const expiryDate = new Date(certification.expiryDate);
			const reminderDate = new Date(expiryDate);
			reminderDate.setDate(reminderDate.getDate() - 7);

			return {
				id: uuidv4(),
				project_id: project.id,
				client_id: project.client_id,
				certification_id: certification.id || certification.number,
				certification_name: certification.name || certification.number || 'Certificación',
				type: 'payment',
				reminder_date: reminderDate.toISOString().slice(0, 10),
			};
		});

	await connection.execute('DELETE FROM reminders WHERE project_id = ?', [project.id]);

	if (reminders.length === 0 || !project.client_id) {
		return;
	}

	for (const reminder of reminders) {
		await connection.execute(
			`INSERT INTO reminders (
				id, project_id, client_id, certification_id, certification_name, type, reminder_date, status
			) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
			[
				reminder.id,
				reminder.project_id,
				reminder.client_id,
				reminder.certification_id,
				reminder.certification_name,
				reminder.type,
				reminder.reminder_date,
			],
		);
	}
};

const ensureDefaultAdmin = async () => {
	const [admins] = await pool.execute('SELECT id FROM app_users WHERE role = ? LIMIT 1', ['admin']);
	if (admins.length > 0) {
		return;
	}

	const generatedPassword = crypto.randomBytes(8).toString('hex');
	const initialPassword = config.defaultAdmin.password || generatedPassword;
	const passwordHash = await bcrypt.hash(initialPassword, 10);

	await pool.execute(
		`INSERT INTO app_users (id, name, username, email, password_hash, role)
		 VALUES (?, ?, ?, ?, ?, 'admin')`,
		[
			uuidv4(),
			config.defaultAdmin.name,
			config.defaultAdmin.username,
			config.defaultAdmin.email,
			passwordHash,
		],
	);

	console.warn('Se ha creado la cuenta administradora inicial.');
	console.warn(`Usuario: ${config.defaultAdmin.username}`);
	console.warn(`Password: ${initialPassword}`);

	if (!config.defaultAdmin.password) {
		console.warn('No habia DEFAULT_ADMIN_PASSWORD configurado, se ha generado una password aleatoria para el primer acceso.');
	}
};

const createToken = (user) =>
	jwt.sign(
		{
			sub: user.id,
			role: user.role,
		},
		config.jwtSecret,
		{ expiresIn: '7d' },
	);

const authMiddleware = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Sesión no válida.' });
	}

	try {
		const token = authHeader.slice('Bearer '.length);
		const payload = jwt.verify(token, config.jwtSecret);
		const [rows] = await pool.execute(
			'SELECT id, name, username, email, role, created_at, updated_at FROM app_users WHERE id = ? LIMIT 1',
			[payload.sub],
		);

		if (rows.length === 0) {
			return res.status(401).json({ message: 'Usuario no encontrado.' });
		}

		req.user = sanitizeUser(rows[0]);
		next();
	} catch {
		return res.status(401).json({ message: 'Token inválido.' });
	}
};

const requireRole = (role) => (req, res, next) => {
	if (req.user?.role !== role) {
		return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
	}

	return next();
};

const requireDemoMode = (_req, res, next) => {
	if (!config.enableDemoMode) {
		return res.status(404).json({ message: 'Las funciones demo no estan disponibles.' });
	}

	return next();
};

const storageFor = (subfolder) => {
	const folderPath = path.join(config.uploadRoot, subfolder);
	ensureDirectory(folderPath);

	return multer.diskStorage({
		destination: (_req, _file, callback) => callback(null, folderPath),
		filename: (_req, file, callback) => {
			const extension = path.extname(file.originalname);
			const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9-_]/g, '-');
			callback(null, `${Date.now()}-${baseName}${extension}`);
		},
	});
};

const imageUpload = multer({ storage: storageFor('images') });
const documentUpload = multer({ storage: storageFor('documents') });
const pdfUpload = multer({ storage: storageFor('pdfs') });

ensureDirectory(config.uploadRoot);

app.use(
	cors({
		origin: true,
		credentials: false,
	})
);
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(config.uploadRoot));

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok' });
});

app.get('/api/locations/search', authMiddleware, async (req, res) => {
	const query = String(req.query?.q || '').trim();

	if (query.length < 3) {
		return res.json({ suggestions: [] });
	}

	const url = new URL('https://nominatim.openstreetmap.org/search');
	url.searchParams.set('q', query);
	url.searchParams.set('format', 'json');
	url.searchParams.set('addressdetails', '1');
	url.searchParams.set('limit', '5');

	try {
		const response = await fetch(url, {
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'Recrea-T/1.0',
			},
		});

		if (!response.ok) {
			return res.status(502).json({ message: 'No se pudieron obtener sugerencias de ubicacion.' });
		}

		const suggestions = await response.json();
		return res.json({ suggestions });
	} catch (error) {
		return res.status(502).json({
			message: 'No se pudieron obtener sugerencias de ubicacion.',
			detail: error.message,
		});
	}
});

app.post('/api/auth/login', async (req, res) => {
	const username = String(req.body?.username || '').trim();
	const password = String(req.body?.password || '');

	if (!username || !password) {
		return res.status(400).json({ message: 'Usuario y contraseña son obligatorios.' });
	}

	const [rows] = await pool.execute(
		'SELECT * FROM app_users WHERE username = ? OR email = ? LIMIT 1',
		[username, username],
	);
	const user = rows[0];

	if (!user) {
		return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
	}

	const passwordMatches = await bcrypt.compare(password, user.password_hash);
	if (!passwordMatches) {
		return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
	}

	return res.json({
		token: createToken(user),
		user: sanitizeUser(user),
	});
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
	res.json({ user: req.user });
});

app.patch('/api/auth/profile', authMiddleware, requireRole('admin'), async (req, res) => {
	const userId = req.user.id;
	const name = String(req.body?.name || '').trim();
	const email = String(req.body?.email || '').trim();

	if (!name || !email) {
		return res.status(400).json({ message: 'Nombre y email son obligatorios.' });
	}

	try {
		await pool.execute('UPDATE app_users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);
		const [rows] = await pool.execute(
			'SELECT id, name, username, email, role, created_at, updated_at FROM app_users WHERE id = ?',
			[userId],
		);
		return res.json({ user: sanitizeUser(rows[0]) });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ message: 'El email ya está en uso.' });
		}
		throw error;
	}
});

app.post('/api/profile-change-requests', authMiddleware, async (req, res) => {
	const userId = req.user.id;
	const name = String(req.body?.name || '').trim() || null;
	const username = String(req.body?.username || '').trim() || null;
	const email = String(req.body?.email || '').trim() || null;
	const newPassword = String(req.body?.password || '').trim() || null;

	if (!name && !username && !email && !newPassword) {
		return res.status(400).json({ message: 'Debes indicar al menos un campo a cambiar.' });
	}

	if (newPassword && newPassword.length < 6) {
		return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
	}

	// Cancel any existing pending request for this user
	await pool.execute(
		"DELETE FROM profile_change_requests WHERE user_id = ? AND status = 'pending'",
		[userId],
	);

	const id = uuidv4();
	await pool.execute(
		`INSERT INTO profile_change_requests (id, user_id, requested_name, requested_username, requested_email, requested_password, status)
		 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
		[id, userId, name, username, email, newPassword],
	);

	return res.status(201).json({ message: 'Solicitud enviada. Un administrador la revisará pronto.' });
});

app.get('/api/profile-change-requests', authMiddleware, requireRole('admin'), async (_req, res) => {
	const [rows] = await pool.execute(
		`SELECT r.*, u.name AS current_name, u.email AS current_email, u.username AS current_username
		 FROM profile_change_requests r
		 LEFT JOIN app_users u ON u.id = r.user_id
		 WHERE r.status = 'pending'
		 ORDER BY r.created_at ASC`,
	);
	res.json({ requests: rows });
});

app.patch('/api/profile-change-requests/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
	const requestId = String(req.params.id || '').trim();

	const [rows] = await pool.execute(
		"SELECT * FROM profile_change_requests WHERE id = ? AND status = 'pending'",
		[requestId],
	);

	if (rows.length === 0) {
		return res.status(404).json({ message: 'Solicitud no encontrada o ya procesada.' });
	}

	const request = rows[0];
	const updates = [];
	const params = [];

	if (request.requested_name) {
		updates.push('name = ?');
		params.push(request.requested_name);
	}
	if (request.requested_username) {
		updates.push('username = ?');
		params.push(request.requested_username);
	}
	if (request.requested_email) {
		updates.push('email = ?');
		params.push(request.requested_email);
	}
	if (request.requested_password) {
		const passwordHash = await bcrypt.hash(request.requested_password, 10);
		updates.push('password_hash = ?');
		params.push(passwordHash);
	}

	if (updates.length > 0) {
		try {
			params.push(request.user_id);
			await pool.execute(`UPDATE app_users SET ${updates.join(', ')} WHERE id = ?`, params);
		} catch (error) {
			if (error.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({ message: 'El email o usuario ya está en uso por otra cuenta.' });
			}
			throw error;
		}
	}

	await pool.execute(
		"UPDATE profile_change_requests SET status = 'approved', reviewed_at = NOW() WHERE id = ?",
		[requestId],
	);

	const [userRows] = await pool.execute(
		'SELECT id, name, username, email, role FROM app_users WHERE id = ?',
		[request.user_id],
	);

	const updatedUser = sanitizeUser(userRows[0]);

	// Send confirmation email to the client
	try {
		const changesHtml = [
			request.requested_name ? `<p style="margin:0 0 6px"><strong>Nombre:</strong> ${request.requested_name}</p>` : '',
			request.requested_username ? `<p style="margin:0 0 6px"><strong>Usuario de acceso:</strong> ${request.requested_username}</p>` : '',
			request.requested_email ? `<p style="margin:0 0 6px"><strong>Email:</strong> ${request.requested_email}</p>` : '',
			request.requested_password ? `<p style="margin:0 0 6px"><strong>Contraseña:</strong> ${request.requested_password}</p>` : '',
		].filter(Boolean).join('');

		await emailTransporter.sendMail({
			from: `"ReCrea-T" <${config.email.from}>`,
			to: updatedUser.email,
			subject: 'Tus datos han sido actualizados — ReCrea-T',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
					<div style="background: #b3c1b3; padding: 24px 32px; border-radius: 12px 12px 0 0;">
						<h1 style="margin: 0; color: white; font-size: 22px;">ReCrea-T</h1>
						<p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Reforme Disfrutando</p>
					</div>
					<div style="background: white; padding: 32px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
						<p style="margin: 0 0 16px; font-size: 16px;">Hola <strong>${updatedUser.name}</strong>,</p>
						<p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
							Tu solicitud de cambio de datos ha sido <strong>aprobada</strong>. Tus nuevos datos de acceso son:
						</p>
						<div style="background: #f5f5f3; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
							<p style="margin:0 0 6px"><strong>Usuario:</strong> ${updatedUser.username}</p>
							${changesHtml}
						</div>
						<p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
							Puedes acceder a tu portal con estas credenciales. Si no has solicitado estos cambios, contacta con nosotros de inmediato.
						</p>
						<p style="margin: 0; color: #999; font-size: 12px;">
							Este mensaje ha sido enviado automáticamente por ReCrea-T. Por favor, no respondas a este correo.
						</p>
					</div>
				</div>
			`,
		});
	} catch (emailError) {
		console.error('Error sending approval email:', emailError.message);
	}

	res.json({ message: 'Solicitud aprobada.', user: updatedUser });
});

app.patch('/api/profile-change-requests/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
	const requestId = String(req.params.id || '').trim();

	const [rows] = await pool.execute(
		"SELECT * FROM profile_change_requests WHERE id = ? AND status = 'pending'",
		[requestId],
	);

	if (rows.length === 0) {
		return res.status(404).json({ message: 'Solicitud no encontrada o ya procesada.' });
	}

	const request = rows[0];

	await pool.execute(
		"UPDATE profile_change_requests SET status = 'rejected', reviewed_at = NOW() WHERE id = ?",
		[requestId],
	);

	const [userRows] = await pool.execute(
		'SELECT id, name, username, email, role FROM app_users WHERE id = ?',
		[request.user_id],
	);

	const user = sanitizeUser(userRows[0]);

	// Send rejection email to the client
	try {
		const requestedChangesHtml = [
			request.requested_name ? `<p style="margin:0 0 6px"><strong>Nombre:</strong> ${request.requested_name}</p>` : '',
			request.requested_username ? `<p style="margin:0 0 6px"><strong>Usuario de acceso:</strong> ${request.requested_username}</p>` : '',
			request.requested_email ? `<p style="margin:0 0 6px"><strong>Email:</strong> ${request.requested_email}</p>` : '',
			request.requested_password ? `<p style="margin:0 0 6px"><strong>Contraseña:</strong> (nueva contraseña solicitada)</p>` : '',
		].filter(Boolean).join('');

		await emailTransporter.sendMail({
			from: `"ReCrea-T" <${config.email.from}>`,
			to: user.email,
			subject: 'Tu solicitud de cambio de datos no ha sido aprobada — ReCrea-T',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
					<div style="background: #b3c1b3; padding: 24px 32px; border-radius: 12px 12px 0 0;">
						<h1 style="margin: 0; color: white; font-size: 22px;">ReCrea-T</h1>
						<p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Reforme Disfrutando</p>
					</div>
					<div style="background: white; padding: 32px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
						<p style="margin: 0 0 16px; font-size: 16px;">Hola <strong>${user.name}</strong>,</p>
						<p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
							Tu solicitud de cambio de datos ha sido <strong>rechazada</strong>. Tus datos de acceso actuales permanecen sin cambios:
						</p>
						<div style="background: #f5f5f3; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
							<p style="margin:0 0 6px"><strong>Usuario:</strong> ${user.username}</p>
							<p style="margin:0 0 6px"><strong>Email:</strong> ${user.email}</p>
						</div>
						${requestedChangesHtml ? `
						<p style="margin: 0 0 12px; color: #555; line-height: 1.6;">Los cambios solicitados que no fueron aprobados:</p>
						<div style="background: #fff3f3; border-left: 4px solid #e57373; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
							${requestedChangesHtml}
						</div>` : ''}
						<p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
							Si tienes alguna duda, por favor contacta con nosotros.
						</p>
						<p style="margin: 0; color: #999; font-size: 12px;">
							Este mensaje ha sido enviado automáticamente por ReCrea-T. Por favor, no respondas a este correo.
						</p>
					</div>
				</div>
			`,
		});
	} catch (emailError) {
		console.error('Error sending rejection email:', emailError.message);
	}

	res.json({ message: 'Solicitud rechazada.' });
});

app.patch('/api/auth/password', authMiddleware, async (req, res) => {
	const userId = req.user.id;
	const currentPassword = String(req.body?.currentPassword || '');
	const newPassword = String(req.body?.newPassword || '');

	if (!currentPassword || !newPassword) {
		return res.status(400).json({ message: 'Contraseña actual y nueva son obligatorias.' });
	}
	if (newPassword.length < 6) {
		return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
	}

	const [rows] = await pool.execute('SELECT password_hash FROM app_users WHERE id = ?', [userId]);
	if (rows.length === 0) {
		return res.status(404).json({ message: 'Usuario no encontrado.' });
	}

	const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
	if (!isValid) {
		return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
	}

	const passwordHash = await bcrypt.hash(newPassword, 10);
	await pool.execute('UPDATE app_users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
	return res.json({ message: 'Contraseña actualizada correctamente.' });
});

app.get('/api/users', authMiddleware, requireRole('admin'), async (_req, res) => {
	const [rows] = await pool.execute(
		'SELECT id, name, username, email, role, created_at, updated_at FROM app_users ORDER BY created_at DESC',
	);
	res.json({ users: rows.map(sanitizeUser) });
});

app.post('/api/users', authMiddleware, requireRole('admin'), async (req, res) => {
	const name = String(req.body?.name || '').trim();
	const username = String(req.body?.username || '').trim();
	const email = String(req.body?.email || '').trim();
	const password = String(req.body?.password || '');
	const role = req.body?.role === 'admin' ? 'admin' : 'client';

	if (!name || !username || !email || !password) {
		return res.status(400).json({ message: 'Nombre, usuario, email y contraseña son obligatorios.' });
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const id = uuidv4();

	try {
		await pool.execute(
			`INSERT INTO app_users (id, name, username, email, password_hash, role)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[id, name, username, email, passwordHash, role],
		);
		const [rows] = await pool.execute(
			'SELECT id, name, username, email, role, created_at, updated_at FROM app_users WHERE id = ?',
			[id],
		);
		return res.status(201).json({ user: sanitizeUser(rows[0]) });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ message: 'El usuario o el email ya existen.' });
		}

		throw error;
	}
});

app.put('/api/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
	const userId = req.params.id;
	const name = String(req.body?.name || '').trim();
	const username = String(req.body?.username || '').trim();
	const email = String(req.body?.email || '').trim();
	const password = String(req.body?.password || '').trim();
	const role = req.body?.role === 'admin' ? 'admin' : 'client';

	if (!name || !username || !email) {
		return res.status(400).json({ message: 'Nombre, usuario y email son obligatorios.' });
	}

	try {
		if (password) {
			const passwordHash = await bcrypt.hash(password, 10);
			await pool.execute(
				'UPDATE app_users SET name = ?, username = ?, email = ?, password_hash = ?, role = ? WHERE id = ?',
				[name, username, email, passwordHash, role, userId],
			);
		} else {
			await pool.execute(
				'UPDATE app_users SET name = ?, username = ?, email = ?, role = ? WHERE id = ?',
				[name, username, email, role, userId],
			);
		}

		const [rows] = await pool.execute(
			'SELECT id, name, username, email, role, created_at, updated_at FROM app_users WHERE id = ?',
			[userId],
		);

		if (rows.length === 0) {
			return res.status(404).json({ message: 'Usuario no encontrado.' });
		}

		return res.json({ user: sanitizeUser(rows[0]) });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ message: 'El usuario o el email ya existen.' });
		}

		throw error;
	}
});

app.delete('/api/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
	const userId = req.params.id;
	const [projects] = await pool.execute('SELECT id FROM projects WHERE client_id = ? LIMIT 1', [userId]);
	if (projects.length > 0) {
		return res.status(400).json({ message: 'No puedes eliminar un cliente con proyectos asignados.' });
	}

	const [users] = await pool.execute('SELECT role FROM app_users WHERE id = ? LIMIT 1', [userId]);
	if (users.length === 0) {
		return res.status(404).json({ message: 'Usuario no encontrado.' });
	}

	if (users[0].role === 'admin') {
		return res.status(400).json({ message: 'No puedes eliminar la cuenta administradora desde aquí.' });
	}

	await pool.execute('DELETE FROM app_users WHERE id = ?', [userId]);
	return res.status(204).send();
});

app.get('/api/projects', authMiddleware, async (req, res) => {
	const [rows] =
		req.user.role === 'admin'
			? await pool.execute('SELECT * FROM projects ORDER BY created_at DESC')
			: await pool.execute('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC', [req.user.id]);

	res.json({ projects: rows.map(normalizeProjectRow) });
});

app.post('/api/projects', authMiddleware, requireRole('admin'), async (req, res) => {
	const payload = toProjectPayload(req.body);
	await pool.execute(
		`INSERT INTO projects (
			id, name, description, location, start_date, estimated_delivery, status, progress,
			client_id, client_name, phases, invoices, budgets, certifications, gallery, materials, selected_categories,
			project_docs, notes, spaces
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			payload.id,
			payload.name,
			payload.description,
			payload.location,
			payload.start_date,
			payload.estimated_delivery,
			payload.status,
			payload.progress,
			payload.client_id,
			payload.client_name,
			payload.phases,
			payload.invoices,
			payload.budgets,
			payload.certifications,
			payload.gallery,
			payload.materials,
			payload.selected_categories,
			payload.project_docs,
			payload.notes,
			payload.spaces,
		],
	);

	const connection = await pool.getConnection();
	try {
		await syncRemindersForProject(connection, {
			...payload,
			certifications: safeJsonParse(payload.certifications, []),
		});
	} finally {
		connection.release();
	}

	const project = await getProjectById(payload.id);
	return res.status(201).json({ project });
});

app.put('/api/projects/:id', authMiddleware, async (req, res) => {
	const existingProject = await getProjectById(req.params.id);

	if (!existingProject) {
		return res.status(404).json({ message: 'Proyecto no encontrado.' });
	}

	if (req.user.role !== 'admin' && existingProject.client_id !== req.user.id) {
		return res.status(403).json({ message: 'No puedes modificar este proyecto.' });
	}

	const nextProjectState =
		req.user.role === 'admin'
			? {
				...existingProject,
				...req.body,
				id: req.params.id,
				client_id: req.body.client_id ?? existingProject.client_id,
				client_name: req.body.client_name ?? existingProject.client_name,
			}
			: {
				...existingProject,
				id: req.params.id,
				materials: buildClientSafeMaterialsUpdate(existingProject.materials, req.body?.materials),
			};

	const payload = toProjectPayload(nextProjectState);

	await pool.execute(
		`UPDATE projects SET
			name = ?, description = ?, location = ?, start_date = ?, estimated_delivery = ?, status = ?,
			progress = ?, client_id = ?, client_name = ?, phases = ?, invoices = ?, budgets = ?,
			certifications = ?, gallery = ?, materials = ?, selected_categories = ?,
			project_docs = ?, notes = ?, spaces = ?
		WHERE id = ?`,
		[
			payload.name,
			payload.description,
			payload.location,
			payload.start_date,
			payload.estimated_delivery,
			payload.status,
			payload.progress,
			payload.client_id,
			payload.client_name,
			payload.phases,
			payload.invoices,
			payload.budgets,
			payload.certifications,
			payload.gallery,
			payload.materials,
			payload.selected_categories,
			payload.project_docs,
			payload.notes,
			payload.spaces,
			payload.id,
		],
	);

	const connection = await pool.getConnection();
	try {
		await syncRemindersForProject(connection, {
			...payload,
			certifications: safeJsonParse(payload.certifications, []),
		});
	} finally {
		connection.release();
	}

	const project = await getProjectById(payload.id);
	return res.json({ project });
});

app.post('/api/projects/:projectId/certifications/:certificationId/payment-status', authMiddleware, requireRole('admin'), async (req, res) => {
	const projectId = String(req.params.projectId || '').trim();
	const certificationId = String(req.params.certificationId || '').trim();
	const isPaid = req.body?.isPaid === true;

	if (!projectId || !certificationId) {
		return res.status(400).json({ message: 'Proyecto y certificacion son obligatorios.' });
	}

	const connection = await pool.getConnection();

	try {
		await connection.beginTransaction();
		const project = await getProjectRowForUpdate(connection, projectId);

		if (!project) {
			await connection.rollback();
			return res.status(404).json({ message: 'Proyecto no encontrado.' });
		}

		const certifications = Array.isArray(project.certifications) ? project.certifications : [];
		const certificationIndex = certifications.findIndex((certification) => String(certification.id) === certificationId);

		if (certificationIndex === -1) {
			await connection.rollback();
			return res.status(404).json({ message: 'Certificacion no encontrada.' });
		}

		const certification = certifications[certificationIndex];

		if (Boolean(certification.isPaid) === isPaid) {
			await connection.rollback();
			return res.json({ project });
		}

		certifications[certificationIndex] = {
			...certification,
			isPaid,
		};

		await connection.execute('UPDATE projects SET certifications = ? WHERE id = ?', [JSON.stringify(certifications), projectId]);

		if (isPaid) {
			await upsertPaidCertificationRecord(connection, project, certifications[certificationIndex]);
		} else {
			await removeCertificationPaymentRecord(connection, projectId, certificationId);
		}

		await syncRemindersForProject(connection, {
			...project,
			certifications,
		});

		await connection.commit();
		const updatedProject = await getProjectById(projectId);
		return res.json({ project: updatedProject });
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
});

app.delete('/api/projects/:id', authMiddleware, requireRole('admin'), async (req, res) => {
	await pool.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
	return res.status(204).send();
});

app.get('/api/categories', authMiddleware, async (_req, res) => {
	const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name ASC');
	res.json({ categories: rows });
});

app.post('/api/categories', authMiddleware, requireRole('admin'), async (req, res) => {
	const id = uuidv4();
	const name = String(req.body?.name || '').trim();
	const description = String(req.body?.description || '').trim();

	if (!name) {
		return res.status(400).json({ message: 'El nombre es obligatorio.' });
	}

	try {
		await pool.execute('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [id, name, description || null]);
		const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
		return res.status(201).json({ category: rows[0] });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
		}
		throw error;
	}
});

app.put('/api/categories/:id', authMiddleware, requireRole('admin'), async (req, res) => {
	const name = String(req.body?.name || '').trim();
	const description = String(req.body?.description || '').trim();

	if (!name) {
		return res.status(400).json({ message: 'El nombre es obligatorio.' });
	}

	try {
		await pool.execute('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description || null, req.params.id]);
		const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
		return res.json({ category: rows[0] });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
		}
		throw error;
	}
});

app.delete('/api/categories/:id', authMiddleware, requireRole('admin'), async (req, res) => {
	await pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
	return res.status(204).send();
});

app.get('/api/materials-catalog', authMiddleware, async (_req, res) => {
	const [rows] = await pool.execute('SELECT * FROM materials_catalog ORDER BY created_at DESC');
	res.json({ materials: rows });
});

app.post('/api/materials-catalog', authMiddleware, requireRole('admin'), async (req, res) => {
	const id = uuidv4();

	// Resolve category_id from name if not provided, auto-creating the category if needed
	let categoryId = req.body?.category_id || null;
	const categoryName = req.body?.category || null;
	if (!categoryId && categoryName) {
		const [catRows] = await pool.execute('SELECT id FROM categories WHERE name = ? LIMIT 1', [categoryName]);
		if (catRows.length > 0) {
			categoryId = catRows[0].id;
		} else {
			categoryId = uuidv4();
			await pool.execute(
				'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
				[categoryId, categoryName, ''],
			);
		}
	}

	const material = {
		id,
		name: req.body?.name,
		description: req.body?.description || '',
		category_id: categoryId,
		category: categoryName,
		subcategory: req.body?.subcategory || null,
		price: Number(req.body?.price || 0),
		brand: req.body?.brand || '',
		format: req.body?.format || '',
		image_url: req.body?.image_url || null,
		ambiance_image_url: req.body?.ambiance_image_url || null,
	};

	await pool.execute(
		`INSERT INTO materials_catalog (
			id, name, description, category_id, category, subcategory, price, brand, format, image_url, ambiance_image_url
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			material.id,
			material.name,
			material.description,
			material.category_id,
			material.category,
			material.subcategory,
			material.price,
			material.brand,
			material.format,
			material.image_url,
			material.ambiance_image_url,
		],
	);

	const [rows] = await pool.execute('SELECT * FROM materials_catalog WHERE id = ?', [id]);
	return res.status(201).json({ material: rows[0] });
});

app.put('/api/materials-catalog/:id', authMiddleware, requireRole('admin'), async (req, res) => {
	// Resolve category_id from name if not provided, auto-creating the category if needed
	let categoryId = req.body?.category_id || null;
	const categoryName = req.body?.category || null;
	if (!categoryId && categoryName) {
		const [catRows] = await pool.execute('SELECT id FROM categories WHERE name = ? LIMIT 1', [categoryName]);
		if (catRows.length > 0) {
			categoryId = catRows[0].id;
		} else {
			categoryId = uuidv4();
			await pool.execute(
				'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
				[categoryId, categoryName, ''],
			);
		}
	}

	await pool.execute(
		`UPDATE materials_catalog SET
			name = ?, description = ?, category_id = ?, category = ?, subcategory = ?, price = ?, brand = ?, format = ?,
			image_url = ?, ambiance_image_url = ?
		WHERE id = ?`,
		[
			req.body?.name,
			req.body?.description || '',
			categoryId,
			categoryName,
			req.body?.subcategory || null,
			Number(req.body?.price || 0),
			req.body?.brand || '',
			req.body?.format || '',
			req.body?.image_url || null,
			req.body?.ambiance_image_url || null,
			req.params.id,
		],
	);

	const [rows] = await pool.execute('SELECT * FROM materials_catalog WHERE id = ?', [req.params.id]);
	return res.json({ material: rows[0] });
});

app.delete('/api/materials-catalog/:id', authMiddleware, requireRole('admin'), async (req, res) => {
	await pool.execute('DELETE FROM materials_catalog WHERE id = ?', [req.params.id]);
	return res.status(204).send();
});

app.get('/api/payments', authMiddleware, async (req, res) => {
	const [rows] =
		req.user.role === 'admin'
			? await pool.execute(
				`SELECT p.*, u.name AS client_name
				 FROM payments p
				 LEFT JOIN app_users u ON u.id = p.client_id
				 ORDER BY p.payment_date DESC`,
			)
			: await pool.execute(
				`SELECT p.*, u.name AS client_name
				 FROM payments p
				 LEFT JOIN app_users u ON u.id = p.client_id
				 WHERE p.client_id = ?
				 ORDER BY p.payment_date DESC`,
				[req.user.id],
			);

	const payments = rows.map((payment) => ({
		...payment,
		app_users: payment.client_name ? { name: payment.client_name } : null,
	}));

	res.json({ payments });
});

app.get('/api/certifications', authMiddleware, requireRole('admin'), async (_req, res) => {
	const [projects] = await pool.execute(
		`SELECT p.id, p.name AS project_name, p.client_id, p.certifications,
		 u.name AS client_name
		 FROM projects p
		 LEFT JOIN app_users u ON u.id = p.client_id`,
	);

	const [paymentRows] = await pool.execute(
		`SELECT project_id, certification_id, amount, payment_date, transaction_reference FROM payments`,
	);

	const paymentMap = new Map();
	for (const pay of paymentRows) {
		paymentMap.set(`${pay.project_id}__${pay.certification_id}`, pay);
	}

	const allCertifications = [];
	for (const project of projects) {
		const certs = safeJsonParse(project.certifications, []);
		for (const cert of certs) {
			const payRecord = paymentMap.get(`${project.id}__${cert.id}`);
			allCertifications.push({
				id: cert.id,
				name: cert.name || cert.number || 'Certificación',
				type: cert.type || '',
				number: cert.number || '',
				amount: cert.amount || 0,
				is_paid: !!cert.isPaid,
				expiry_date: cert.expiryDate || null,
				project_id: project.id,
				project_name: project.project_name,
				client_id: project.client_id,
				client_name: project.client_name,
				payment_date: payRecord?.payment_date || null,
				transaction_reference: payRecord?.transaction_reference || null,
			});
		}
	}

	allCertifications.sort((a, b) => {
		if (a.is_paid !== b.is_paid) return a.is_paid ? 1 : -1;
		if (a.expiry_date && b.expiry_date) return new Date(a.expiry_date) - new Date(b.expiry_date);
		return 0;
	});

	res.json({ certifications: allCertifications });
});

app.post('/api/payments/checkout-session', authMiddleware, async (req, res) => {
	const projectId = String(req.body?.project_id || '').trim();
	const certificationId = String(req.body?.certification_id || '').trim();

	if (!projectId || !certificationId) {
		return res.status(400).json({ message: 'Proyecto y certificación son obligatorios.' });
	}

	const paymentConnection = await pool.getConnection();
	try {
		await paymentConnection.beginTransaction();
		const lockedProject = await getProjectRowForUpdate(paymentConnection, projectId);

		if (!lockedProject) {
			await paymentConnection.rollback();
			return res.status(404).json({ message: 'Proyecto no encontrado.' });
		}

		if (req.user.role !== 'admin' && lockedProject.client_id !== req.user.id) {
			await paymentConnection.rollback();
			return res.status(403).json({ message: 'No puedes pagar esta certificacion.' });
		}

		const lockedCertifications = Array.isArray(lockedProject.certifications) ? lockedProject.certifications : [];
		const lockedCertificationIndex = lockedCertifications.findIndex(
			(certification) => String(certification.id) === certificationId,
		);

		if (lockedCertificationIndex === -1) {
			await paymentConnection.rollback();
			return res.status(404).json({ message: 'Certificacion no encontrada.' });
		}

		if (lockedCertifications[lockedCertificationIndex].isPaid) {
			await paymentConnection.rollback();
			return res.status(409).json({ message: 'Esta certificacion ya figura como pagada.' });
		}

		lockedCertifications[lockedCertificationIndex] = {
			...lockedCertifications[lockedCertificationIndex],
			isPaid: true,
		};

		await paymentConnection.execute('UPDATE projects SET certifications = ? WHERE id = ?', [
			JSON.stringify(lockedCertifications),
			projectId,
		]);
		await upsertPaidCertificationRecord(paymentConnection, lockedProject, lockedCertifications[lockedCertificationIndex]);
		await syncRemindersForProject(paymentConnection, {
			...lockedProject,
			certifications: lockedCertifications,
		});
		await paymentConnection.commit();

		return res.json({
			url: buildSuccessUrl(req, 'success'),
		});
	} catch (error) {
		await paymentConnection.rollback();
		throw error;
	} finally {
		paymentConnection.release();
	}

});

app.get('/api/reminders', authMiddleware, requireRole('admin'), async (_req, res) => {
	const [rows] = await pool.execute(
		`SELECT r.*, u.name AS client_name
		 FROM reminders r
		 LEFT JOIN app_users u ON u.id = r.client_id
		 ORDER BY r.reminder_date DESC`,
	);

	const reminders = rows.map((reminder) => ({
		...reminder,
		app_users: reminder.client_name ? { name: reminder.client_name } : null,
	}));

	res.json({ reminders });
});

app.post('/api/reminders/send', authMiddleware, requireRole('admin'), async (_req, res) => {
	const [pendingRows] = await pool.execute(
		`SELECT r.*, u.name AS client_name, u.email AS client_email, p.name AS project_name
		 FROM reminders r
		 LEFT JOIN app_users u ON u.id = r.client_id
		 LEFT JOIN projects p ON p.id = r.project_id
		 WHERE r.status = 'pending'`,
	);

	if (pendingRows.length === 0) {
		return res.json({ updated: 0, sent: 0 });
	}

	let sent = 0;
	const errors = [];

	for (const reminder of pendingRows) {
		if (!reminder.client_email) continue;

		const reminderDate = new Date(reminder.reminder_date + 'T12:00:00').toLocaleDateString('es-ES', {
			day: '2-digit', month: 'long', year: 'numeric',
		});

		try {
			await emailTransporter.sendMail({
				from: `"ReCrea-T" <${config.email.from}>`,
				to: reminder.client_email,
				subject: `Recordatorio de pago: ${reminder.certification_name || 'Certificación'}`,
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
						<div style="background: #b3c1b3; padding: 24px 32px; border-radius: 12px 12px 0 0;">
							<h1 style="margin: 0; color: white; font-size: 22px;">ReCrea-T</h1>
							<p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Reforme Disfrutando</p>
						</div>
						<div style="background: white; padding: 32px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
							<p style="margin: 0 0 16px; font-size: 16px;">Hola <strong>${reminder.client_name || 'cliente'}</strong>,</p>
							<p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
								Te recordamos que tienes un pago pendiente para la siguiente certificación de tu obra:
							</p>
							<div style="background: #f5f5f3; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
								<p style="margin: 0 0 8px;"><strong>Certificación:</strong> ${reminder.certification_name || reminder.certification_id}</p>
								${reminder.project_name ? `<p style="margin: 0 0 8px;"><strong>Obra:</strong> ${reminder.project_name}</p>` : ''}
								<p style="margin: 0;"><strong>Fecha recordatorio:</strong> ${reminderDate}</p>
							</div>
							<p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
								Accede a tu portal para gestionar el pago o ponerte en contacto con nosotros.
							</p>
							<p style="margin: 0; color: #999; font-size: 12px;">
								Este mensaje ha sido enviado automáticamente por ReCrea-T. Por favor, no respondas a este correo.
							</p>
						</div>
					</div>
				`,
			});
			sent++;
		} catch (err) {
			errors.push({ id: reminder.id, error: err.message });
		}
	}

	if (sent > 0) {
		await pool.execute(
			"UPDATE reminders SET status = 'sent', sent_at = NOW() WHERE status = 'pending'",
		);
	}

	res.json({ updated: pendingRows.length, sent, errors });
});

app.post('/api/reminders/:id/send', authMiddleware, requireRole('admin'), async (req, res) => {
	const reminderId = String(req.params.id || '').trim();

	const [rows] = await pool.execute(
		`SELECT r.*, u.name AS client_name, u.email AS client_email, p.name AS project_name
		 FROM reminders r
		 LEFT JOIN app_users u ON u.id = r.client_id
		 LEFT JOIN projects p ON p.id = r.project_id
		 WHERE r.id = ?`,
		[reminderId],
	);

	if (rows.length === 0) {
		return res.status(404).json({ message: 'Recordatorio no encontrado.' });
	}

	const reminder = rows[0];

	if (!reminder.client_email) {
		return res.status(400).json({ message: 'El cliente no tiene email registrado.' });
	}

	const reminderDate = new Date(reminder.reminder_date + 'T12:00:00').toLocaleDateString('es-ES', {
		day: '2-digit', month: 'long', year: 'numeric',
	});

	await emailTransporter.sendMail({
		from: `"ReCrea-T" <${config.email.from}>`,
		to: reminder.client_email,
		subject: `Recordatorio de pago: ${reminder.certification_name || 'Certificación'}`,
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
				<div style="background: #b3c1b3; padding: 24px 32px; border-radius: 12px 12px 0 0;">
					<h1 style="margin: 0; color: white; font-size: 22px;">ReCrea-T</h1>
					<p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Reforme Disfrutando</p>
				</div>
				<div style="background: white; padding: 32px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
					<p style="margin: 0 0 16px; font-size: 16px;">Hola <strong>${reminder.client_name || 'cliente'}</strong>,</p>
					<p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
						Te recordamos que tienes un pago pendiente para la siguiente certificación de tu obra:
					</p>
					<div style="background: #f5f5f3; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
						<p style="margin: 0 0 8px;"><strong>Certificación:</strong> ${reminder.certification_name || reminder.certification_id}</p>
						${reminder.project_name ? `<p style="margin: 0 0 8px;"><strong>Obra:</strong> ${reminder.project_name}</p>` : ''}
						<p style="margin: 0;"><strong>Fecha recordatorio:</strong> ${reminderDate}</p>
					</div>
					<p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
						Accede a tu portal para gestionar el pago o ponerte en contacto con nosotros.
					</p>
					<p style="margin: 0; color: #999; font-size: 12px;">
						Este mensaje ha sido enviado automáticamente por ReCrea-T. Por favor, no respondas a este correo.
					</p>
				</div>
			</div>
		`,
	});

	await pool.execute(
		"UPDATE reminders SET status = 'sent', sent_at = NOW() WHERE id = ?",
		[reminderId],
	);

	const [updatedRows] = await pool.execute(
		`SELECT r.*, u.name AS client_name FROM reminders r LEFT JOIN app_users u ON u.id = r.client_id WHERE r.id = ?`,
		[reminderId],
	);

	const updated = updatedRows[0];
	res.json({ reminder: { ...updated, app_users: updated?.client_name ? { name: updated.client_name } : null } });
});

app.get('/api/pdfs', authMiddleware, async (req, res) => {
	const [rows] =
		req.user.role === 'admin'
			? await pool.execute(
				`SELECT pdfs.*, projects.name AS project_name
				 FROM pdfs
				 LEFT JOIN projects ON projects.id = pdfs.project_id
				 ORDER BY pdfs.upload_date DESC`,
			)
			: await pool.execute(
				`SELECT pdfs.*, projects.name AS project_name
				 FROM pdfs
				 LEFT JOIN projects ON projects.id = pdfs.project_id
				 WHERE pdfs.client_id = ?
				 ORDER BY pdfs.upload_date DESC`,
				[req.user.id],
			);
	res.json({ pdfs: rows });
});

app.post('/api/pdfs', authMiddleware, requireRole('admin'), pdfUpload.single('file'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'Debes adjuntar un archivo PDF.' });
	}

	const projectId = String(req.body?.project_id || '').trim() || null;
	let clientId = null;

	if (projectId) {
		const project = await getProjectById(projectId);
		if (!project) {
			return res.status(404).json({ message: 'Proyecto no encontrado para asociar el documento.' });
		}

		clientId = project.client_id || null;
	}

	const id = uuidv4();
	const relativePath = `/uploads/pdfs/${req.file.filename}`;
	const fileUrl = buildPublicUrl(req, relativePath);

	await pool.execute(
		`INSERT INTO pdfs (
			id, project_id, client_id, filename, stored_name, file_path, file_url, mime_type, file_size, uploader_id, uploader_name
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			projectId,
			clientId,
			req.file.originalname,
			req.file.filename,
			relativePath,
			fileUrl,
			req.file.mimetype,
			req.file.size,
			req.user.id,
			req.user.name,
		],
	);

	const [rows] = await pool.execute('SELECT * FROM pdfs WHERE id = ?', [id]);
	return res.status(201).json({ pdf: rows[0] });
});

app.delete('/api/pdfs/:id', authMiddleware, requireRole('admin'), async (req, res) => {
	const [rows] = await pool.execute('SELECT * FROM pdfs WHERE id = ?', [req.params.id]);
	if (rows.length === 0) {
		return res.status(404).json({ message: 'Documento no encontrado.' });
	}

	const fileOnDisk = path.join(config.rootDir, 'server', rows[0].file_path.replace(/^\//, '').replaceAll('/', path.sep));
	if (fs.existsSync(fileOnDisk)) {
		fs.unlinkSync(fileOnDisk);
	}

	await pool.execute('DELETE FROM pdfs WHERE id = ?', [req.params.id]);
	return res.status(204).send();
});

app.post('/api/uploads/image', authMiddleware, requireRole('admin'), imageUpload.single('file'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'Debes adjuntar una imagen.' });
	}

	const relativePath = `/uploads/images/${req.file.filename}`;
	return res.status(201).json({
		fileName: req.file.originalname,
		fileUrl: buildPublicUrl(req, relativePath),
	});
});

app.post('/api/uploads/document', authMiddleware, requireRole('admin'), documentUpload.single('file'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'Debes adjuntar un documento.' });
	}

	const relativePath = `/uploads/documents/${req.file.filename}`;
	return res.status(201).json({
		fileName: req.file.originalname,
		fileUrl: buildPublicUrl(req, relativePath),
	});
});

app.post('/api/demo/restore-projects', authMiddleware, requireRole('admin'), requireDemoMode, async (_req, res) => {
	const defaultPhases = DEFAULT_PHASES;
	const oldProjects = [
		{
			id: uuidv4(),
			name: 'Reforma Integral en Chamberí',
			description: 'Renovación completa de un piso de 120m² en el corazón de Madrid.',
			location: 'Calle de Almagro, Madrid',
			start_date: '2025-11-15',
			estimated_delivery: '2026-05-20',
			status: 'in-progress',
			progress: 45,
			phases: defaultPhases.map((phase, index) => (index < 3 ? { ...phase, status: 'completed' } : phase)),
			client_id: null,
			client_name: 'Cliente Demo',
			materials: [],
			invoices: [],
			budgets: [],
			certifications: [],
			gallery: [],
		},
		{
			id: uuidv4(),
			name: 'Oficina Moderna en Distrito 22@',
			description: 'Diseño y construcción de espacio de oficinas de 300m² para startup tecnológica.',
			location: 'Carrer de Pujades, Barcelona',
			start_date: '2026-01-10',
			estimated_delivery: '2026-06-30',
			status: 'planning',
			progress: 10,
			phases: defaultPhases.map((phase, index) => (index < 1 ? { ...phase, status: 'completed' } : phase)),
			client_id: null,
			client_name: 'Tech Innovate S.L.',
			materials: [],
			invoices: [],
			budgets: [],
			certifications: [],
			gallery: [],
		},
	];

	for (const project of oldProjects) {
		const payload = toProjectPayload(project);
		await pool.execute(
			`INSERT INTO projects (
				id, name, description, location, start_date, estimated_delivery, status, progress,
				client_id, client_name, phases, invoices, budgets, certifications, gallery, materials
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				payload.id,
				payload.name,
				payload.description,
				payload.location,
				payload.start_date,
				payload.estimated_delivery,
				payload.status,
				payload.progress,
				payload.client_id,
				payload.client_name,
				payload.phases,
				payload.invoices,
				payload.budgets,
				payload.certifications,
				payload.gallery,
				payload.materials,
			],
		);
	}

	res.json({ success: true });
});

app.post('/api/demo/seed', authMiddleware, requireRole('admin'), requireDemoMode, async (_req, res) => {
	const demoUsername = 'cliente-demo';
	const demoEmail = 'demo@example.com';
	const demoPassword = 'cliente123';
	let demoUserId = null;
	let demoUserName = 'Cliente Demo';

	const [users] = await pool.execute('SELECT * FROM app_users WHERE username = ? OR email = ? LIMIT 1', [demoUsername, demoEmail]);
	if (users.length > 0) {
		demoUserId = users[0].id;
		demoUserName = users[0].name;
	} else {
		demoUserId = uuidv4();
		const passwordHash = await bcrypt.hash(demoPassword, 10);
		await pool.execute(
			`INSERT INTO app_users (id, name, username, email, password_hash, role)
			 VALUES (?, ?, ?, ?, ?, 'client')`,
			[demoUserId, demoUserName, demoUsername, demoEmail, passwordHash],
		);
	}

	const categoryId = uuidv4();
	try {
		await pool.execute('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [categoryId, 'cocina', 'Materiales de cocina']);
	} catch {}

	const materials = [
		{
			id: uuidv4(),
			name: 'Encimera de granito',
			category: 'cocina',
			price: 3500,
			brand: 'Premium Granite Co',
			description: 'Superficie de granito resistente y duradera.',
			image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
		},
		{
			id: uuidv4(),
			name: 'Mobiliario a medida',
			category: 'cocina',
			price: 12000,
			brand: 'Fine Woodworks',
			description: 'Muebles de roble hechos a medida.',
			image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
		},
	];

	for (const material of materials) {
		try {
			await pool.execute(
				`INSERT INTO materials_catalog (
					id, name, description, category, price, brand, image_url
				) VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[
					material.id,
					material.name,
					material.description,
					material.category,
					material.price,
					material.brand,
					material.image_url,
				],
			);
		} catch {}
	}

	const projectId = uuidv4();
	const certifications = [
		{ id: 'cert_1', name: 'Licencia de obra', type: 'Permiso', number: 'LIC-001', amount: 500, isPaid: true, expiryDate: '2026-04-15' },
		{ id: 'cert_2', name: 'Inspección de seguridad', type: 'Inspección', number: 'SEG-002', amount: 250, isPaid: false, expiryDate: '2026-06-30' },
	];
	const phases = [
		{ id: 'phase_1', name: 'Demolición y preparación', status: 'completed', date: '2026-02-10' },
		{ id: 'phase_2', name: 'Instalación', status: 'active', date: '2026-03-01' },
		{ id: 'phase_3', name: 'Acabados e inspección', status: 'pending', date: null },
	];
	const invoices = [
		{ id: 'inv_1', number: 'FAC-001', description: 'Señal inicial', amount: 15000, paid: true, dueDate: '2026-01-25', date: '2026-01-25' },
		{ id: 'inv_2', number: 'FAC-002', description: 'Segundo pago', amount: 15000, paid: false, dueDate: '2026-03-10', date: '2026-03-10' },
	];
	const budgets = [
		{ id: 'bud_1', title: 'Presupuesto principal', description: 'Presupuesto general de cocina', amount: 45000, status: 'approved', acceptanceDate: '2026-01-20' },
	];

	const payload = toProjectPayload({
		id: projectId,
		name: 'Reforma de cocina moderna',
		description: 'Renovación integral de cocina con materiales premium.',
		location: 'Madrid',
		start_date: '2026-02-01',
		estimated_delivery: '2026-05-15',
		status: 'in-progress',
		client_id: demoUserId,
		client_name: demoUserName,
		phases,
		certifications,
		invoices,
		budgets,
		materials: materials.map((material) => ({ ...material, category: 'cocina', status: 'pending' })),
		gallery: [],
	});

	await pool.execute(
		`INSERT INTO projects (
			id, name, description, location, start_date, estimated_delivery, status, progress,
			client_id, client_name, phases, invoices, budgets, certifications, gallery, materials
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			payload.id,
			payload.name,
			payload.description,
			payload.location,
			payload.start_date,
			payload.estimated_delivery,
			payload.status,
			payload.progress,
			payload.client_id,
			payload.client_name,
			payload.phases,
			payload.invoices,
			payload.budgets,
			payload.certifications,
			payload.gallery,
			payload.materials,
		],
	);

	await pool.execute(
		`INSERT INTO payments (
			id, project_id, client_id, certification_id, certification_name, amount, status, transaction_reference
		) VALUES (?, ?, ?, ?, ?, ?, 'paid', ?)`,
		[
			uuidv4(),
			projectId,
			demoUserId,
			'cert_1',
			'Licencia de obra',
			500,
			`PAY-${crypto.randomUUID().slice(0, 8)}`,
		],
	);

	const connection = await pool.getConnection();
	try {
		await syncRemindersForProject(connection, {
			...payload,
			certifications,
		});
	} finally {
		connection.release();
	}

	res.json({ success: true });
});

app.use((error, _req, res, _next) => {
	console.error(error);
	res.status(500).json({
		message: 'Se produjo un error interno en el servidor.',
		detail: error.message,
	});
});

const start = async () => {
	await initDatabase();
	await ensureDefaultAdmin();

	if (config.jwtSecret === 'change-this-in-production') {
		console.warn('JWT_SECRET sigue usando el valor por defecto. Cambialo antes de desplegar.');
	}

	if (config.defaultAdmin.password === 'admin123') {
		console.warn('DEFAULT_ADMIN_PASSWORD sigue usando una credencial insegura. Cambiala antes de desplegar.');
	}

	// Serve compiled frontend in production
	if (process.env.NODE_ENV === 'production') {
		const distPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../dist');
		app.use(express.static(distPath));
		app.get('/{*path}', (_req, res) => {
			res.sendFile(path.join(distPath, 'index.html'));
		});
	}

	app.listen(config.port, () => {
		console.log(`API escuchando en http://localhost:${config.port}`);
	});
};

start().catch((error) => {
	console.error('No se pudo iniciar el backend:', error);
	process.exit(1);
});
