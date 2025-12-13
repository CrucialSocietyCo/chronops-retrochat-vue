import { ref, reactive } from 'vue'
import { API_BASE } from '@/config'

const isCardOpen = ref(false)
const isLoading = ref(false)
const activePersonaId = ref(null)
const cardPosition = reactive({ top: 0, left: 0 })
const cardData = ref(null)

export function useProfileCard() {

    const openCard = async (personaId) => {
        console.log(`[useProfileCard] Opening card for ${personaId}`)
        if (!personaId) return

        // Position Logic REMOVED for Side Dock Layout
        // The CSS in ProfileCard.vue will handle fixed positioning.

        activePersonaId.value = personaId
        isCardOpen.value = true
        isLoading.value = true
        cardData.value = null

        try {
            console.log(`[useProfileCard] Fetching data...`)
            const res = await fetch(`${API_BASE}/api/personas/${personaId}`)
            if (res.ok) {
                cardData.value = await res.json()
                console.log(`[useProfileCard] Data received:`, cardData.value)
            } else {
                console.error('[useProfileCard] Failed to fetch persona card')
                // Optional: show error state or close
            }
        } catch (e) {
            console.error('[useProfileCard] Fetch Error:', e)
        } finally {
            isLoading.value = false
        }
    }

    const closeCard = () => {
        isCardOpen.value = false
        activePersonaId.value = null
    }

    return {
        isCardOpen,
        isLoading,
        activePersonaId,
        cardPosition,
        cardData,
        openCard,
        closeCard
    }
}
