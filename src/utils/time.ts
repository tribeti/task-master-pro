export const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    let diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

    // Fallback for slight clock drift making time slightly future
    if (diffInSeconds < 0) diffInSeconds = 0;

    if (diffInSeconds < 60) return `Just now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return `1 ngày trước`;
    return `${diffInDays} ngày trước`;
};
