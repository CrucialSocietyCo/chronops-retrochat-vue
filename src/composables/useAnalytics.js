const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export function useAnalytics() {
    const trackClientEvent = async (eventName, payload = {}, clientId) => {
        // If no clientId passed, try to find one or fail silently
        // In this app, clientId is passed down props usually
        if (!clientId) return

        try {
            await fetch(`${API_BASE}/api/analytics/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': clientId
                },
                body: JSON.stringify({ eventName, payload })
            })
        } catch (e) {
            // Fail silently for analytics to not disrupt UX
            console.warn('[Analytics] Tracking failed', e)
        }
    }

    return {
        trackClientEvent
    }
}
