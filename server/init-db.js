import { closePool, initDatabase } from './db.js';

const run = async () => {
	await initDatabase();
	console.log('Base de datos y tablas inicializadas correctamente.');
};

run()
	.catch((error) => {
		console.error('No se pudo inicializar la base de datos:', error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await closePool();
	});
