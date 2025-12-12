import { ref } from 'vue'
import { useAnalytics } from './useAnalytics'
import { API_BASE } from '../config'

const THROTTLE_MS = 2000
const DEBOUNCE_MS = 1000
const BURST_IDLE_THRESHOLD_MS = 10000
const BURST_END_TIMEOUT_MS = 5000

export function useTyping(authToken, clientId) {
    const isTypingVisible = ref(false)
    let lastTypedTime = 0
    let stopTypingTimer = null

    // Analytics State
    const { trackClientEvent } = useAnalytics()
    let burstStartedAt = null
    let burstEndTimer = null
    let lastKeystrokeTime = 0



    const notifyServer = async (status) => {
        try {
            await fetch(`${API_BASE}/api/chat/typing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': clientId,
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify({ status, eventName: status === 'start' ? 'typing:start' : 'typing:stop' })
            })
        } catch (e) {
            console.error('Failed to notify typing', status, e)
        }
    }

    const startTyping = () => {
        const now = Date.now()

        // --- Analytics: Burst Tracking ---
        if (burstStartedAt === null) {
            // Check if we were idle long enough to consider this a new burst
            if (now - lastKeystrokeTime > BURST_IDLE_THRESHOLD_MS) {
                burstStartedAt = now
                trackClientEvent('typing_burst_started', { input_context: 'main_room_input' }, clientId)
            }
        }

        lastKeystrokeTime = now

        // Manage Burst End Timer
        if (burstEndTimer) clearTimeout(burstEndTimer)
        burstEndTimer = setTimeout(() => {
            if (burstStartedAt !== null) {
                const duration = Date.now() - burstStartedAt
                trackClientEvent('typing_burst_ended', { burst_duration_ms: duration }, clientId)
                burstStartedAt = null // Reset
            }
        }, BURST_END_TIMEOUT_MS)


        // --- Core Typing Indicator Logic --- 

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
