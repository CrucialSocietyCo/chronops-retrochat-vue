import { ref } from 'vue'
import { useAnalytics } from './useAnalytics'
import { API_BASE } from '../config'

const THROTTLE_MS = 2000
const DEBOUNCE_MS = 1000
const BURST_IDLE_THRESHOLD_MS = 10000
const BURST_END_TIMEOUT_MS = 5000

export function useTyping(authToken, clientId, username) { // username added
    const isTypingVisible = ref(false)
    const activeTypers = ref([])
    // ...
    const notifyServer = async (status) => {
        try {
            const currentUsername = typeof username === 'function' ? username() : (username?.value || username)

            await fetch(`${API_BASE}/api/chat/typing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': typeof clientId === 'function' ? clientId() : (clientId?.value || clientId),
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify({
                    status,
                    eventName: status === 'start' ? 'typing:start' : 'typing:stop',
                    username: currentUsername
                })
            })
        } catch (e) {
            console.error('Failed to notify typing', status, e)
        }
    }

    const startTyping = () => {
        const now = Date.now()

        // --- Analytics: Burst Tracking ---
        if (burstStartedAt === null) {
            if (now - lastKeystrokeTime > BURST_IDLE_THRESHOLD_MS) {
                burstStartedAt = now
                const cId = typeof clientId === 'function' ? clientId() : (clientId?.value || clientId)
                trackClientEvent('typing_burst_started', { input_context: 'main_room_input' }, cId)
            }
        }

        lastKeystrokeTime = now

        if (burstEndTimer) clearTimeout(burstEndTimer)
        burstEndTimer = setTimeout(() => {
            if (burstStartedAt !== null) {
                const duration = Date.now() - burstStartedAt
                const cId = typeof clientId === 'function' ? clientId() : (clientId?.value || clientId)
                trackClientEvent('typing_burst_ended', { burst_duration_ms: duration }, cId)
                burstStartedAt = null
            }
        }, BURST_END_TIMEOUT_MS)

        // --- Core Typing Indicator Logic --- 
        if (stopTypingTimer) {
            clearTimeout(stopTypingTimer)
            stopTypingTimer = null
        }

        if (now - lastTypedTime > THROTTLE_MS) {
            lastTypedTime = now
            notifyServer('start')
        }

        stopTypingTimer = setTimeout(() => {
            notifyServer('stop')
            stopTypingTimer = null
        }, DEBOUNCE_MS)
    }

    const handleTypingUpdate = (payload) => {
        console.log('[useTyping] Update Payload:', payload)
        // The backend now sends { activeTypers: [{id, name}] }
        // But we might receive legacy triggers or raw arrays
        let typers = []

        if (payload && payload.activeTypers) {
            typers = payload.activeTypers
        } else if (Array.isArray(payload)) {
            // Fallback for ID array
            typers = payload.map(id => ({ id, name: 'Someone' }))
        }

        console.log('[useTyping] Resolved Typers:', typers)
        activeTypers.value = typers

        // Computed boolean compatibility
        const cId = typeof clientId === 'function' ? clientId() : (clientId?.value || clientId)
        isTypingVisible.value = typers.some(t => t.id !== cId)
    }

    return {
        isTypingVisible,
        activeTypers,
        startTyping,
        handleTypingUpdate
    }
}
