function normalizeWpUrl(value) {
	const url = String(value || '').trim();
	if (!url) {
		throw new Error('WP_URL environment variable is required.');
	}

	return `${/^https?:\/\//i.test(url) ? url : `https://${url}`}`.replace(/\/$/, '');
}

function getWordPressConfig() {
	const username = process.env.WP_ADMIN_USER || '';
	const applicationPassword = process.env.WP_APPLICATION_PASSWORD || '';

	if (!username || !applicationPassword) {
		throw new Error('WP_ADMIN_USER and WP_APPLICATION_PASSWORD environment variables are required.');
	}

	return {
		baseURL: normalizeWpUrl(process.env.WP_URL),
		username,
		applicationPassword,
		extraHTTPHeaders: {
			Authorization: `Basic ${Buffer.from(`${username}:${applicationPassword}`).toString('base64')}`,
		},
	};
}

module.exports = { getWordPressConfig, normalizeWpUrl };