import { apiRequest } from '@/lib/apiClient';

export const seedDemoData = async () => {
	try {
		await apiRequest('/demo/seed', {
			method: 'POST',
		});
		return { success: true, message: 'Demo data seeded successfully!' };
	} catch (error) {
		return { success: false, message: error.message };
	}
};
