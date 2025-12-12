import { API_BASE } from '../config'

export function useVoiceDropsApi() {

    // Use the same environment variable as ChatHistory

    const uploadVoiceDrop = async (blob, durationMs, token) => {
        if (!blob) throw new Error('No audio blob provided')

        const filename = `${Date.now()}_${crypto.randomUUID()}.webm`

        // Use Global Supabase URL/Key from Env
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase Env Vars')
        }

        // QA Trace Logging
        console.group('[VoiceDrop] Starting Upload')
        console.log('📦 Blob Size:', blob.size, 'type:', blob.type)
        console.log('🔑 Token:', token ? `Present (${token.substring(0, 10)}...)` : 'MISSING!')
        console.log('🎯 Target Supabase:', supabaseUrl)
        console.groupEnd()

        // Initialize Client (lightweight)
        // If we have a token, we set it as the global auth for this request context
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        })

        // 1. Upload Directly to Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('audio-drops')
            .upload(filename, blob, {
                contentType: 'audio/webm',
                upsert: false
            })

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
            throw new Error('Storage Upload Failed: ' + uploadError.message)
        }

        // 2. Get Public URL
        const { data: publicData } = supabase
            .storage
            .from('audio-drops')
            .getPublicUrl(filename)

        const audioUrl = publicData.publicUrl

        // 3. Notify Backend to Broadcast (Keep the API for this only)
        // We still use the API to insert the message/broadcast to realtime
        // But the heavy lifting (file upload) is now done.

        // Note: The original /api/voice-drops expects a FILE.
        // We should hit a DIFFERENT endpoint or modify that one to accept a URL?
        // OR, we just insert the message directly via Supabase too?
        // Option B spec said "Nuxt API (Broadcast Only)".
        // Let's assume we can POST to a new/modified endpoint or just use `messages` table insert if we have permissions.
        // To be safe and quick without changing backend again:
        // We will repurpose the existing endpoint slightly or just insert the message directly from client if allowed.
        // "Admin writes require real Auth" -> We have the token.

        // Let's stick to the "Broadcast" via API pattern to ensure "System Message" type security if RLS blocks it.
        // Actually, the user is an Admin, so they can probably insert into `messages`.
        // BUT, `messages` insert might trigger other logic.

        // EASIEST PATH: POST to /api/voice-drops won't work because it expects multipart.
        // I will assume we can just INSERT into the `messages` table directly from here since we are Authenticated Admin.

        // 3. Notify Backend to Broadcast via Hybrid API
        // This accepts { audioUrl, durationMs } as JSON
        const broadcastRes = await fetch(`${API_BASE}/api/voice-drops`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                audioUrl,
                durationMs
            })
        })

        if (!broadcastRes.ok) {
            const err = await broadcastRes.json().catch(() => ({}))
            throw new Error(err.message || 'Broadcast Failed')
        }

        return { success: true }
    }

    return {
        uploadVoiceDrop
    }
}
