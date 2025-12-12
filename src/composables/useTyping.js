import { ref } from 'vue'

const THROTTLE_MS = 2000
const DEBOUNCE_MS = 1000

export function useTyping(authToken, clientId) {
    const isTypingVisible = ref(false)
    let lastTypedTime = 0
    let stopTypingTimer = null

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

    const notifyServer = async (status) => {
        try {
            await fetch(`${API_BASE}/api/chat/typing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': clientId,
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify({ status })
            })
        } catch (e) {
            console.error('Failed to notify typing', status, e)
        }
    }

    const startTyping = () => {
        const now = Date.now()

        // Clear any pending stop timer
        if (stopTypingTimer) {
            clearTimeout(stopTypingTimer)
            stopTypingTimer = null
        }

        // Throttle "start" events to server
        if (now - lastTypedTime > THROTTLE_MS) {
            lastTypedTime = now
            notifyServer('start')
        }

        // Schedule debounced stop
        stopTypingTimer = setTimeout(() => {
            notifyServer('stop')
            stopTypingTimer = null
        }, DEBOUNCE_MS)
    }

    const handleTypingUpdate = (activeUserIds) => {
        if (Array.isArray(activeUserIds)) {
            // Show only if someone ELSE is typing
            isTypingVisible.value = activeUserIds.some(id => id !== clientId)
        } else {
            // Fallback or legacy boolean
            isTypingVisible.value = !!activeUserIds
        }
    }

    return {
        isTypingVisible,
        startTyping,
        handleTypingUpdate
    }
}
