import { ref, onUnmounted } from 'vue'

const MAX_QUEUE_LENGTH = 10
const ROTATION_MS = 2000
const HIDE_MS = 3000
const MAX_BURST_DURATION_MS = 30000
const COOLDOWN_DURATION_MS = 15000

export function useJoinBanner() {
    // State
    const joinBanner = ref(null)
    const joinQueue = [] // Simple array, not reactive to avoid overhead, we trigger updates via joinBanner
    const cooldownActive = ref(false)

    // Timers
    let rotationTimerId = null
    let hideTimerId = null
    let cooldownTimerId = null

    // Burst Tracking
    let burstStartTimestamp = null

    // --- Core Actions ---

    const handleUserJoined = (event) => {
        // 1. Construct User Object
        const newUser = {
            userId: event.user_id,
            username: event.username,
            joinedAt: event.joined_at || new Date().toISOString()
        }

        // 2. Add to Queue
        if (joinQueue.length >= MAX_QUEUE_LENGTH) {
            joinQueue.shift() // Drop oldest
        }
        joinQueue.push(newUser)

        // 3. Kick off rotation if we are idle (not cooling down, no rotation active)
        if (!cooldownActive.value && !rotationTimerId) {
            // If we were hiding, cancel it
            if (hideTimerId) {
                clearTimeout(hideTimerId)
                hideTimerId = null
            }
            startRotationLoop()
        }
    }

    const startRotationLoop = () => {
        // A) Check Cooldown
        if (cooldownActive.value) return // Should not happen if guarded, but safety first

        // B) Check Queue
        if (joinQueue.length > 0) {
            // B.1 Check Burst Limit
            const now = Date.now()
            if (burstStartTimestamp === null) {
                burstStartTimestamp = now
            } else if (now - burstStartTimestamp >= MAX_BURST_DURATION_MS) {
                enterCooldown()
                return
            }

            // B.2 Show Next User
            const nextUser = joinQueue.shift()
            joinBanner.value = nextUser

            // B.3 Clear any hide timer (just in case)
            if (hideTimerId) {
                clearTimeout(hideTimerId)
                hideTimerId = null
            }

            // B.4 Schedule next rotation
            rotationTimerId = setTimeout(() => {
                rotationTimerId = null // clear ref
                startRotationLoop()
            }, ROTATION_MS)

        } else {
            // C) Queue Empty -> Start Hide Timer
            // Do NOT clear joinBanner yet, keep last user visible
            // Stop Rotation Loop (it stopped itself by not recursing)
            startHideTimer()
        }
    }

    const startHideTimer = () => {
        if (hideTimerId) clearTimeout(hideTimerId)

        hideTimerId = setTimeout(() => {
            // Time up, clear banner
            joinBanner.value = null
            hideTimerId = null

            // Reset burst timestamp since we successfully went idle
            burstStartTimestamp = null
        }, HIDE_MS)
    }

    const enterCooldown = () => {
        cooldownActive.value = true

        // Clear rotation & hide timers
        if (rotationTimerId) {
            clearTimeout(rotationTimerId)
            rotationTimerId = null
        }
        if (hideTimerId) {
            clearTimeout(hideTimerId)
            hideTimerId = null
        }

        // Clear queue and hide banner
        joinQueue.length = 0
        joinBanner.value = null

        // Reset burst tracking
        burstStartTimestamp = null

        // Start cooldown timer
        cooldownTimerId = setTimeout(() => {
            cooldownActive.value = false
            cooldownTimerId = null
            // Next join will start fresh
        }, COOLDOWN_DURATION_MS)
    }

    // --- Cleanup ---
    onUnmounted(() => {
        if (rotationTimerId) clearTimeout(rotationTimerId)
        if (hideTimerId) clearTimeout(hideTimerId)
        if (cooldownTimerId) clearTimeout(cooldownTimerId)
        joinQueue.length = 0
    })

    return {
        joinBanner,
        handleUserJoined
    }
}
