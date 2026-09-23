import cv2
import numpy as np
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
from html import escape
from pathlib import Path
import re

def generate_ascii_portrait(image_path='drafi_avatar.png', cols=110, rows=53):
    img = Image.open(image_path)
    arr = np.array(img)
    alpha = arr[:, :, 3] if arr.shape[2] == 4 else np.ones((arr.shape[0], arr.shape[1]), dtype=np.uint8) * 255

    crop_y1 = 25
    crop_y2 = 880
    crop_h = crop_y2 - crop_y1
    crop_w = int(crop_h * 0.96)
    center_x = 585
    crop_x1 = max(0, center_x - crop_w // 2)
    crop_x2 = min(img.width, crop_x1 + crop_w)

    cropped_img = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    cropped_alpha = cropped_img.split()[3] if cropped_img.mode == 'RGBA' else None

    gray = cropped_img.convert('RGB').convert('L')
    eq = ImageOps.equalize(gray)
    blended = Image.blend(gray, eq, alpha=0.45)
    sharp1 = blended.filter(ImageFilter.UnsharpMask(radius=1.8, percent=220, threshold=1))
    sharp2 = sharp1.filter(ImageFilter.UnsharpMask(radius=3.5, percent=140, threshold=2))

    resized_gray = np.array(sharp2.resize((cols, rows), Image.Resampling.LANCZOS), dtype=float)
    if cropped_alpha:
        resized_mask = np.array(cropped_alpha.resize((cols, rows), Image.Resampling.BILINEAR), dtype=float) / 255.0
    else:
        resized_mask = np.ones((rows, cols), dtype=float)

    chars = '  ..::--==++**#%%@@'
    lines = []
    for y in range(rows):
        row_chars = []
        for x in range(cols):
            m = resized_mask[y, x]
            if m < 0.25:
                row_chars.append(' ')
            else:
                val = resized_gray[y, x]
                norm = 1.0 - (val / 255.0)
                norm = np.clip(norm * 1.15, 0.0, 1.0)
                idx = int(norm * (len(chars) - 1))
                idx = max(1, min(len(chars) - 1, idx))
                row_chars.append(chars[idx])
        lines.append(''.join(row_chars))

    return lines

def build_tspans(lines, start_x=22, start_y=68.0, step_y=8.0):
    tspans = []
    y = start_y
    for line in lines:
        escaped = escape(line)
        tspans.append(f'<tspan x="{start_x}" y="{y:.2f}" xml:space="preserve">{escaped}</tspan>')
        y += step_y
    return tspans

def generate_svg(svg_filename, tspans, is_dark=True):
    if is_dark:
        bg_fill = "url(#bgGlowDark)"
        border_stroke = "url(#borderGradDark)"
        text_color = "#E2E8F0"
        header_color = "#00FF9D"
        accent_color = "#00F2FE"
        dim_color = "#64748B"
        key_color = "#00FF9D"
        grid_fill = "url(#asciiGradDark)"
        scan_stroke = "#00FF9D"
        hud_bracket = "#00F2FE"
    else:
        bg_fill = "url(#bgGlowLight)"
        border_stroke = "url(#borderGradLight)"
        text_color = "#0F172A"
        header_color = "#059669"
        accent_color = "#0284C7"
        dim_color = "#94A3B8"
        key_color = "#059669"
        grid_fill = "url(#asciiGradLight)"
        scan_stroke = "#10B981"
        hud_bracket = "#0284C7"

    tspans_str = "\n".join(tspans)

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="620" viewBox="0 0 1180 620">
<defs>
  <!-- Background Gradients -->
  <radialGradient id="bgGlowDark" cx="25%" cy="20%" r="85%">
    <stop offset="0%" stop-color="#08141F"/>
    <stop offset="50%" stop-color="#040A10"/>
    <stop offset="100%" stop-color="#020508"/>
  </radialGradient>
  <radialGradient id="bgGlowLight" cx="25%" cy="20%" r="85%">
    <stop offset="0%" stop-color="#F8FAFC"/>
    <stop offset="50%" stop-color="#EEF2F6"/>
    <stop offset="100%" stop-color="#E2E8F0"/>
  </radialGradient>

  <!-- ASCII Art Gradients -->
  <linearGradient id="asciiGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#00FF9D">
      <animate attributeName="stop-color" values="#00FF9D;#00F2FE;#38EF7D;#00FF9D" dur="7s" repeatCount="indefinite"/>
    </stop>
    <stop offset="100%" stop-color="#00F2FE">
      <animate attributeName="stop-color" values="#00F2FE;#38EF7D;#00FF9D;#00F2FE" dur="7s" repeatCount="indefinite"/>
    </stop>
  </linearGradient>
  <linearGradient id="asciiGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#047857"/>
    <stop offset="100%" stop-color="#0284C7"/>
  </linearGradient>

  <!-- Border Gradient -->
  <linearGradient id="borderGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#00FF9D"/>
    <stop offset="50%" stop-color="#00F2FE"/>
    <stop offset="100%" stop-color="#3B82F6"/>
  </linearGradient>
  <linearGradient id="borderGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#10B981"/>
    <stop offset="50%" stop-color="#0EA5E9"/>
    <stop offset="100%" stop-color="#6366F1"/>
  </linearGradient>

  <!-- Scanline sweep -->
  <linearGradient id="scanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#00FF9D" stop-opacity="0"/>
    <stop offset="45%" stop-color="#00FF9D" stop-opacity="0.05"/>
    <stop offset="50%" stop-color="#00F2FE" stop-opacity="0.65"/>
    <stop offset="55%" stop-color="#00FF9D" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="#00FF9D" stop-opacity="0"/>
  </linearGradient>

  <!-- Line reveal clips -->
  {''.join([f'<clipPath id="lc{i}"><rect x="500" y="{30 + i*22:.2f}" width="0" height="22"><animate attributeName="width" from="0" to="670" dur="0.32s" begin="{0.6 + i*0.09:.2f}s" fill="freeze"/></rect></clipPath>' for i in range(23)])}

  <style>
    .ascii {{ font-family: 'Fira Code', 'Courier New', Consolas, monospace; font-size: 7.4px; fill: {grid_fill}; letter-spacing: -0.2px; filter: drop-shadow(0 0 1.2px rgba(0, 255, 157, 0.4)); }}
    .key {{ font-family: 'Fira Code', 'Courier New', Consolas, monospace; font-size: 14px; fill: {key_color}; font-weight: bold; }}
    .value {{ font-family: 'Fira Code', 'Courier New', Consolas, monospace; font-size: 14px; fill: {text_color}; }}
    .cc {{ font-family: 'Fira Code', 'Courier New', Consolas, monospace; font-size: 14px; fill: {dim_color}; }}
    .head {{ font-family: 'Fira Code', 'Courier New', Consolas, monospace; font-size: 16px; fill: {header_color}; font-weight: bold; }}
    .accent {{ font-family: 'Fira Code', 'Courier New', Consolas, monospace; font-size: 14px; fill: {accent_color}; font-weight: bold; }}
    .hud-text {{ font-family: 'Fira Code', 'Courier New', Consolas, monospace; font-size: 9px; fill: {accent_color}; letter-spacing: 1px; }}
    .term-title {{ font-family: 'Fira Code', 'Courier New', Consolas, monospace; font-size: 11.5px; fill: {dim_color}; letter-spacing: 0.5px; }}
    text, tspan {{ white-space: pre; }}
    .cursor-blink {{ fill: {header_color}; }}
  </style>
</defs>

<!-- Card Body & Ambient Glow -->
<rect width="1180" height="620" rx="16" fill="{bg_fill}"/>

<!-- Top Terminal Header Bar -->
<rect x="0" y="0" width="1180" height="38" rx="16" fill="#060C14" fill-opacity="0.8"/>
<line x1="0" y1="38" x2="1180" y2="38" stroke="{scan_stroke}" stroke-opacity="0.25" stroke-width="1"/>

<!-- Terminal Window Control Buttons -->
<circle cx="24" cy="19" r="5" fill="#EF4444"/>
<circle cx="42" cy="19" r="5" fill="#F59E0B"/>
<circle cx="60" cy="19" r="5" fill="#10B981"/>

<!-- Center Command Title -->
<text x="590" y="23" text-anchor="middle" class="term-title">rafik@devos ~ % ./quantum_core.sh --biometrics --sys-design --live</text>

<!-- Top Right Live Status & Animated Waveform -->
<g transform="translate(1010, 12)">
  <rect x="0" y="0" width="145" height="15" rx="3" fill="#0A1826" stroke="{accent_color}" stroke-width="0.7" stroke-opacity="0.5"/>
  <circle cx="10" cy="7.5" r="3" fill="#00FF9D">
    <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/>
  </circle>
  <text x="18" y="10.5" fill="{header_color}" font-family="'Fira Code', monospace" font-size="8.5" font-weight="bold">AGENT CORE v3.2</text>
</g>

<!-- Animated Frequency Waveform Bars in Header -->
<g transform="translate(415, 12)">
  <rect x="0" y="4" width="2.5" height="7" fill="{header_color}"><animate attributeName="height" values="4;11;3;8;4" dur="0.9s" repeatCount="indefinite"/></rect>
  <rect x="5" y="2" width="2.5" height="10" fill="{accent_color}"><animate attributeName="height" values="8;3;12;5;8" dur="0.8s" repeatCount="indefinite"/></rect>
  <rect x="10" y="5" width="2.5" height="6" fill="{header_color}"><animate attributeName="height" values="3;10;4;9;3" dur="1.1s" repeatCount="indefinite"/></rect>
  <rect x="15" y="1" width="2.5" height="12" fill="{accent_color}"><animate attributeName="height" values="10;5;2;11;10" dur="0.7s" repeatCount="indefinite"/></rect>
</g>

<!-- Left ASCII Portrait Frame & Biometric HUD Overlays -->
<g id="portrait-frame">
  <!-- Biometric HUD Targeting Corner Brackets -->
  <path d="M 16 60 L 16 48 L 28 48" fill="none" stroke="{hud_bracket}" stroke-width="1.8" opacity="0.8"/>
  <path d="M 488 48 L 500 48 L 500 60" fill="none" stroke="{hud_bracket}" stroke-width="1.8" opacity="0.8"/>
  <path d="M 16 575 L 16 587 L 28 587" fill="none" stroke="{hud_bracket}" stroke-width="1.8" opacity="0.8"/>
  <path d="M 488 587 L 500 587 L 500 575" fill="none" stroke="{hud_bracket}" stroke-width="1.8" opacity="0.8"/>

  <!-- Rotating Holographic Target Ring in corner -->
  <g transform="translate(475, 75)">
    <circle cx="0" cy="0" r="14" fill="none" stroke="{accent_color}" stroke-width="0.8" stroke-dasharray="4,3" opacity="0.6">
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>
    </circle>
    <circle cx="0" cy="0" r="7" fill="none" stroke="{header_color}" stroke-width="0.8" opacity="0.8"/>
    <circle cx="0" cy="0" r="2" fill="{accent_color}"/>
  </g>

  <!-- Biometric HUD Tag -->
  <text x="24" y="58" class="hud-text">● BIOMETRIC LOCK: [ MATCH 100% ] // ID: D. MAHAMMAD RAFI</text>

  <!-- ASCII Art Content -->
  <text x="22" y="0" class="ascii">
{tspans_str}
  </text>
</g>

<!-- Vertical Center Divider Line with circuit pulse node -->
<line x1="504" y1="48" x2="504" y2="595" stroke="{scan_stroke}" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="6,4"/>
<circle cx="504" cy="320" r="3" fill="{header_color}">
  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
</circle>

<!-- Right Telemetry Panel -->
<g id="telemetry">
  <g clip-path="url(#lc0)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="44" class="head">rafik@devos</tspan><tspan class="cc"> -——————————————————————————————————————————-—-</tspan></text></g>
  <g clip-path="url(#lc1)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="68" class="cc">. </tspan><tspan class="key">Subject</tspan><tspan class="cc">: .......................... </tspan><tspan class="value">Dudekula Mahammad Rafi</tspan></text></g>
  <g clip-path="url(#lc2)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="90" class="cc">. </tspan><tspan class="key">Role</tspan><tspan class="cc">: ............................. </tspan><tspan class="value">Full-Stack &amp; AI Systems Architect</tspan></text></g>
  <g clip-path="url(#lc3)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="112" class="cc">. </tspan><tspan class="key">Education</tspan><tspan class="cc">: ......................... </tspan><tspan class="value">B.Tech CSE (NIAT), SSC CGPA 10.0</tspan></text></g>
  <g clip-path="url(#lc4)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="134" class="cc">. </tspan><tspan class="key">Status</tspan><tspan class="cc">: ............ </tspan><tspan class="value">Architecting • Innovating • Shipping</tspan></text></g>
  <g clip-path="url(#lc5)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="156" class="cc">. </tspan></text></g>
  <g clip-path="url(#lc6)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="178" class="accent">- System Design &amp; Arch</tspan><tspan class="cc"> -————————————————————————————————-—-</tspan></text></g>
  <g clip-path="url(#lc7)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="200" class="cc">. </tspan><tspan class="key">Core</tspan><tspan class="cc">.</tspan><tspan class="key">AI_RAG</tspan><tspan class="cc">: ........ </tspan><tspan class="value">Whisper ASR, Gemma LLMs, Dense/Sparse RAG</tspan></text></g>
  <g clip-path="url(#lc8)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="222" class="cc">. </tspan><tspan class="key">Core</tspan><tspan class="cc">.</tspan><tspan class="key">Distributed</tspan><tspan class="cc">: ... </tspan><tspan class="value">Microservices, WebSockets, WebRTC, Queues</tspan></text></g>
  <g clip-path="url(#lc9)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="244" class="cc">. </tspan><tspan class="key">Core</tspan><tspan class="cc">.</tspan><tspan class="key">DataTier</tspan><tspan class="cc">: ...... </tspan><tspan class="value">PostgreSQL, SQLite, ChromaDB, Vector DBs</tspan></text></g>
  <g clip-path="url(#lc10)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="266" class="cc">. </tspan><tspan class="key">Core</tspan><tspan class="cc">.</tspan><tspan class="key">Languages</tspan><tspan class="cc">: ..... </tspan><tspan class="value">Python, JavaScript, TypeScript, C, C++, SQL</tspan></text></g>
  <g clip-path="url(#lc11)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="288" class="cc">. </tspan></text></g>
  <g clip-path="url(#lc12)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="310" class="accent">- Open Source Ecosystem</tspan><tspan class="cc"> -————————————————————————————————-—-</tspan></text></g>
  <g clip-path="url(#lc13)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="332" class="cc">. </tspan><tspan class="key">Cloud</tspan><tspan class="cc">.</tspan><tspan class="key">Native</tspan><tspan class="cc">: ....... </tspan><tspan class="value">Layer5 &amp; Meshery.io (Service Mesh Plane)</tspan></text></g>
  <g clip-path="url(#lc14)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="354" class="cc">. </tspan><tspan class="key">RealTime</tspan><tspan class="cc">.</tspan><tspan class="key">Comms</tspan><tspan class="cc">: ..... </tspan><tspan class="value">Rocket.Chat (Secure Enterprise CommsOS)</tspan></text></g>
  <g clip-path="url(#lc15)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="376" class="cc">. </tspan><tspan class="key">WebRTC</tspan><tspan class="cc">.</tspan><tspan class="key">Media</tspan><tspan class="cc">: ........ </tspan><tspan class="value">Jitsi Meet (Scalable Video Conferences)</tspan></text></g>
  <g clip-path="url(#lc16)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="398" class="cc">. </tspan><tspan class="key">GSoC</tspan><tspan class="cc">.</tspan><tspan class="key">Community</tspan><tspan class="cc">: ....... </tspan><tspan class="value">Open Source Contributor &amp; Explorer</tspan></text></g>
  <g clip-path="url(#lc17)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="420" class="cc">. </tspan></text></g>
  <g clip-path="url(#lc18)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="442" class="accent">- Communication Grid</tspan><tspan class="cc"> -—————————————————————————————————————-—-</tspan></text></g>
  <g clip-path="url(#lc19)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="464" class="cc">. </tspan><tspan class="key">Grid</tspan><tspan class="cc">.</tspan><tspan class="key">Mail</tspan><tspan class="cc">: ....................... </tspan><tspan class="value">mahammaadrafi786@gmail.com</tspan></text></g>
  <g clip-path="url(#lc20)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="486" class="cc">. </tspan><tspan class="key">Grid</tspan><tspan class="cc">.</tspan><tspan class="key">Github</tspan><tspan class="cc">: ..................... </tspan><tspan class="value">DRafi2006 (16+ Repositories)</tspan></text></g>
  <g clip-path="url(#lc21)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="508" class="cc">. </tspan><tspan class="key">Grid</tspan><tspan class="cc">.</tspan><tspan class="key">Phone</tspan><tspan class="cc">: ...................... </tspan><tspan class="value">+91 8919474407</tspan></text></g>
  <g clip-path="url(#lc22)"><text x="520" y="0" fill="{text_color}"><tspan x="520" y="530" class="cc">. </tspan><tspan class="key">Live</tspan><tspan class="cc">.</tspan><tspan class="key">Radar</tspan><tspan class="cc">: ........... </tspan><tspan class="value">Patrolling Mach-6 contribution radar below ↓</tspan></text></g>

  <!-- Blinking Terminal Cursor -->
  <rect x="522" y="535.0" width="9" height="15" class="cursor-blink" opacity="0">
    <animate attributeName="opacity" values="0;0;1;0;1;0;1;0" keyTimes="0;0.01;0.02;0.3;0.5;0.7;0.85;1" dur="1.3s" begin="3.2s" repeatCount="indefinite"/>
  </rect>
</g>

<!-- Animated Laser Scan Wave -->
<rect x="0" y="-70" width="1180" height="70" fill="url(#scanGrad)" opacity="0.65" style="mix-blend-mode:screen">
  <animateTransform attributeName="transform" type="translate" from="0 -70" to="0 690" dur="4.2s" repeatCount="indefinite"/>
</rect>

<!-- Outer Neon Cyber Shield Border -->
<rect x="3" y="3" width="1174" height="614" rx="15" fill="none" stroke="{border_stroke}" stroke-width="1.8" opacity="0.85">
  <animate attributeName="stroke-opacity" values="0.5;0.95;0.5" dur="3s" repeatCount="indefinite"/>
</rect>
</svg>'''

    Path(svg_filename).write_text(svg_content, encoding='utf-8')
    print(f"Generated {svg_filename}")

if __name__ == '__main__':
    print("Generating ASCII portrait from drafi_avatar.png...")
    lines = generate_ascii_portrait('drafi_avatar.png', cols=110, rows=53)
    tspans = build_tspans(lines, start_x=22)

    Path('portrait.txt').write_text('\n'.join(lines), encoding='utf-8')
    Path('portrait_tspan.txt').write_text('\n'.join(tspans), encoding='utf-8')
    print("Saved portrait.txt and portrait_tspan.txt")

    generate_svg('dark.svg', tspans, is_dark=True)
    generate_svg('light.svg', tspans, is_dark=False)
    print("Successfully updated SVG cards with System Design & Open Source Ecosystem details!")
