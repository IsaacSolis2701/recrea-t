import React, { createContext, useContext, useEffect, useState } from 'react';
import {
	apiRequest,
	clearAuthSession,
	getStoredToken,
	getStoredUser,
	storeAuthSession,
} from '@/lib/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(getStoredUser());
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const restoreSession = async () => {
			const token = getStoredToken();

			if (!token) {
				setLoading(false);
				return;
			}

			try {
				const response = await apiRequest('/auth/me', { token });
				setUser(response.user);
				storeAuthSession({ token, user: response.user });
			} catch (error) {
				console.error('No se pudo restaurar la sesion:', error);
				clearAuthSession();
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		restoreSession();
	}, []);

	const signIn = async ({ username, password }) => {
		try {
			const response = await apiRequest('/auth/login', {
				method: 'POST',
				body: { username, password },
			});

			storeAuthSession(response);
			setUser(response.user);
			return { user: response.user, error: null };
		} catch (error) {
			return { user: null, error };
		}
	};

	const signOut = async () => {
		clearAuthSession();
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, signIn, signOut, loading }}>
			{!loading && children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
