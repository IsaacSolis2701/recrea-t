const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'recreat_auth_token';
const USER_KEY = 'recreat_auth_user';

const joinUrl = (baseUrl, path) => `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export const getApiBaseUrl = () => API_BASE_URL;

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
	const rawValue = localStorage.getItem(USER_KEY);
	if (!rawValue) {
		return null;
	}

	try {
		return JSON.parse(rawValue);
	} catch {
		return null;
	}
};

export const storeAuthSession = ({ token, user }) => {
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
};

export const apiRequest = async (path, options = {}) => {
	const token = options.token ?? getStoredToken();
	const headers = new Headers(options.headers || {});
	const requestInit = {
		method: options.method || 'GET',
		headers,
	};

	if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	if (options.body instanceof FormData) {
		requestInit.body = options.body;
	} else if (options.body !== undefined) {
		headers.set('Content-Type', 'application/json');
		requestInit.body = JSON.stringify(options.body);
	}

	const response = await fetch(joinUrl(API_BASE_URL, path), requestInit);
	const contentType = response.headers.get('content-type') || '';
	const payload = contentType.includes('application/json') ? await response.json() : null;

	if (!response.ok) {
		const message = payload?.message || 'No se pudo completar la petición.';
		throw new Error(message);
	}

	return payload;
};

export const uploadFile = async (path, file, extraFields = {}) => {
	const formData = new FormData();
	formData.append('file', file);

	for (const [key, value] of Object.entries(extraFields)) {
		if (value !== undefined && value !== null) {
			formData.append(key, value);
		}
	}

	return apiRequest(path, {
		method: 'POST',
		body: formData,
	});
};
