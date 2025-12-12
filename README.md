<div align="center" style="font-family: monospace; background-color: #0f1115; color: #e5e7eb; padding: 40px; border-radius: 8px; border: 1px solid #1f2937; margin-bottom: 20px;">
  <h1 style="color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin: 0; font-size: 24px;">
    CHRONOPS <span style="color: #a78bfa;">//</span> RETROCHAT
  </h1>
  <p style="color: #9ca3af; font-size: 14px; margin-top: 10px; margin-bottom: 20px;">
    Vue 3 Realtime Surface. No Auth. Pure Signal.
  </p>
  <div style="height: 1px; width: 100px; background-color: #38bdf8; margin: 0 auto;"></div>
</div>

<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #e5e7eb; line-height: 1.6;">

<!-- SECTION 1: WHAT AP -->
<h3 style="border-left: 3px solid #38bdf8; padding-left: 10px; color: #38bdf8; margin-top: 30px;">
  SYSTEM IDENTITY
</h3>
<p style="color: #d1d5db; font-size: 15px;">
  <b>chronops-retrochat-vue</b> is the specialized frontend for the ChronOps ecosystem. It delivers a single-room, realtime chat experience with a deliberate retro aesthetic. It connects directly to Supabase with zero authentication logic—users are ephemeral ghosts in the machine.
</p>

<!-- SECTION 2: RUN SEQUENCE -->
<h3 style="border-left: 3px solid #a78bfa; padding-left: 10px; color: #a78bfa; margin-top: 40px;">
  INIT SEQUENCE
</h3>

<div style="background-color: #111827; border: 1px solid #374151; border-radius: 6px; padding: 20px;">
  
  <p style="margin-top: 0; font-family: monospace; color: #38bdf8; font-size: 12px; text-transform: uppercase;">
    OPTION A :: NPM
  </p>
  <pre style="background: #0f1115; border: 1px solid #1f2937; border-radius: 4px; padding: 12px; color: #e5e7eb; font-family: monospace; font-size: 13px;">
npm install
cp .env.example .env.local
npm run dev</pre>

  <p style="margin-top: 20px; font-family: monospace; color: #a78bfa; font-size: 12px; text-transform: uppercase;">
    OPTION B :: PNPM
  </p>
  <pre style="background: #0f1115; border: 1px solid #1f2937; border-radius: 4px; padding: 12px; color: #e5e7eb; font-family: monospace; font-size: 13px;">
pnpm install
cp .env.example .env.local
pnpm dev</pre>

</div>

<!-- SECTION 3: ENV -->
<h3 style="border-left: 3px solid #38bdf8; padding-left: 10px; color: #38bdf8; margin-top: 40px;">
  ENVIRONMENT
</h3>
<div style="background-color: #111827; border: 1px solid #374151; border-radius: 6px; padding: 15px;">
  <code style="color: #38bdf8;">VITE_SUPABASE_URL</code><br>
  <code style="color: #a78bfa;">VITE_SUPABASE_ANON_KEY</code>
  <p style="color: #6b7280; font-size: 12px; margin-top: 10px; font-style: italic;">
    ⚠ These keys are exposed to the client. Do not use service roles here.
  </p>
</div>

<!-- SECTION 4: BEHAVIOR -->
<h3 style="border-left: 3px solid #e5e7eb; padding-left: 10px; color: #e5e7eb; margin-top: 40px;">
  CORE BEHAVIORS
</h3>
<ul style="color: #d1d5db; padding-left: 20px;">
  <li>Realtime message stream (Postgres + Supabase Realtime)</li>
  <li>Direct-to-client typing indicators</li>
  <li>Emoji reactions attached to message IDs</li>
  <li>System-level Join/Leave banners</li>
  <li>Client-side rate limit visualization (cooldowns)</li>
  <li>Optional "AI Rewrite" display for moderated content</li>
</ul>

<!-- SECTION 5: CONSTRAINTS -->
<h3 style="border-left: 3px solid #ef4444; padding-left: 10px; color: #ef4444; margin-top: 40px;">
  INTENTIONAL CONSTRAINTS
</h3>
<ul style="color: #d1d5db; padding-left: 20px;">
  <li><b>Single Room Only:</b> No channels, no logical partitions.</li>
  <li><b>No Chat History Persistence:</b> Clients only fetch recent history on load.</li>
  <li><b>No Auth:</b> User identity is session-based and fleeting.</li>
</ul>

<!-- SECTION 6: NOTE -->
<div style="margin-top: 50px; border-top: 1px solid #374151; padding-top: 20px; color: #6b7280; font-size: 13px; font-family: monospace;">
  <strong style="color: #9ca3af;">// NOTE TO FUTURE ME</strong><br>
  This repo is the "View" layer. Do not put business logic or heavy moderation rules here. 
  If it doesn't happen in the browser or via a subscribe event, it doesn't belong here. 
  Keep it fast, keep it dumb. 🕹️
</div>

</div>
