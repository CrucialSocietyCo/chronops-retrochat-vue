import { ref, onUnmounted } from 'vue'

export function useVoiceRecorder() {
    const isRecording = ref(false)
    const audioBlob = ref(null)
    const durationMs = ref(0)
    const error = ref(null)

    let mediaRecorder = null
    let chunks = []
    let startTime = 0
    let timerInterval = null

    // Configuration
    const MIME_TYPE = 'audio/webm;codecs=opus'

    const startRecording = async () => {
        error.value = null
        chunks = []
        audioBlob.value = null
        durationMs.value = 0

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Check support
            if (!MediaRecorder.isTypeSupported(MIME_TYPE)) {
                console.warn(`${MIME_TYPE} not supported, falling back to default`)
            }

            mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported(MIME_TYPE) ? MIME_TYPE : undefined
            })

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const finalBlob = new Blob(chunks, { type: 'audio/webm' })
                audioBlob.value = finalBlob

                // Cleanup tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            isRecording.value = true
            startTime = Date.now()

            // Timer for UI and auto-stop
            timerInterval = setInterval(() => {
                const elapsed = Date.now() - startTime
                durationMs.value = elapsed

                if (elapsed >= 5000) {
                    stopRecording()
                }
            }, 50)

        } catch (err) {
            console.error('Recorder Error:', err)
            error.value = 'Microphone access denied'
            isRecording.value = false
        }
    }

    const stopRecording = () => {
        if (!isRecording.value) return

        isRecording.value = false
        clearInterval(timerInterval)

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop()
        }
    }

    const cancelRecording = () => {
        if (!isRecording.value) return
        isRecording.value = false
        clearInterval(timerInterval)

        if (mediaRecorder) {
            mediaRecorder.stop()
            // Clear chunks to prevent valid blob formation if needed, 
            // though onstop will still fire. We can ignore the blob in UI.
            chunks = []
        }
    }

    onUnmounted(() => {
        clearInterval(timerInterval)
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop()
        }
    })

    return {
        isRecording,
        audioBlob,
        durationMs,
        error,
        startRecording,
        stopRecording,
        cancelRecording
    }
}
