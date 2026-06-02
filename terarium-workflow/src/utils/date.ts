export function formatDdMmmYyyy(timestamp) {
	return new Date(timestamp).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function getElapsedTimeText(timestamp): string {
	const time = Date.now() - new Date(timestamp).getTime();
	const minutes = Math.floor(time / (1000 * 60));
	const hours = Math.floor(time / (1000 * 60 * 60));
	if (hours > 24) {
		return formatDdMmmYyyy(timestamp);
	}
	if (hours > 0 && hours < 25) {
		return `${hours} hours ago`;
	}
	return minutes > 0 ? `${minutes} minutes ago` : 'Just now';
}
