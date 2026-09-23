// DevOS Quantum Terminal & Mach-6 Jet Portfolio Engine
// Dudekula Mahammad Rafi (DRafi2006)

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");
  const currentModeLabel = document.getElementById("currentModeLabel");
  const profileSvgObject = document.getElementById("profileSvgObject");
  const scanlineToggleBtn = document.getElementById("scanlineToggleBtn");
  const scanlineOverlay = document.getElementById("scanlineOverlay");
  const copyMarkdownBtn = document.getElementById("copyMarkdownBtn");
  const copyBtnText = document.getElementById("copyBtnText");
  const markdownSnippet = document.getElementById("markdownSnippet");
  const liveClock = document.getElementById("liveClock");
  const sfxToggleBtn = document.getElementById("sfxToggleBtn");
  const sfxIcon = document.getElementById("sfxIcon");
  const sfxText = document.getElementById("sfxText");

  // 3D Tilt Wrapper
  const tiltWrapper = document.getElementById("tiltWrapper");
  const terminalWrapper = document.getElementById("svgContainer");
  const cardGlare = document.querySelector(".card-glare");

  // Customizer Modal
  const openCustomizerBtn = document.getElementById("openCustomizerBtn");
  const closeCustomizerBtn = document.getElementById("closeCustomizerBtn");
  const closeModalFooterBtn = document.getElementById("closeModalFooterBtn");
  const customizerModal = document.getElementById("customizerModal");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  // Architecture Tabs
  const archTabBtns = document.querySelectorAll(".arch-tab-btn");
  const archCanvasCards = document.querySelectorAll(".arch-canvas-card");

  // ASCII converter elements
  const dropZone = document.getElementById("dropZone");
  const photoUpload = document.getElementById("photoUpload");
  const browseFileBtn = document.getElementById("browseFileBtn");
  const asciiCanvas = document.getElementById("asciiCanvas");
  const asciiOutput = document.getElementById("asciiOutput");

  // CLI elements
  const cliInput = document.getElementById("cliInput");
  const cliOutput = document.getElementById("cliOutput");

  // Refresh heatmap button
  const refreshHeatmapBtn = document.getElementById("refreshHeatmapBtn");
  const heatmapSvgObject = document.getElementById("heatmapSvgObject");

  // ----------------------------------------------------
  // 1. Web Audio API Cyber Synth Sound Engine
  // ----------------------------------------------------
  let sfxEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  function playTone(freq = 600, type = "sine", duration = 0.08, gainVal = 0.06) {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context silently handled
    }
  }

  function playSciFiChime() {
    if (!sfxEnabled) return;
    playTone(520, "triangle", 0.06, 0.05);
    setTimeout(() => playTone(880, "sine", 0.1, 0.06), 60);
    setTimeout(() => playTone(1200, "sine", 0.14, 0.04), 120);
  }

  sfxToggleBtn.addEventListener("click", () => {
    sfxEnabled = !sfxEnabled;
    if (sfxEnabled) {
      sfxIcon.textContent = "🔊";
      sfxText.textContent = "SFX: ON";
      playSciFiChime();
    } else {
      sfxIcon.textContent = "🔇";
      sfxText.textContent = "SFX: OFF";
    }
  });

  // ----------------------------------------------------
  // 2. Real-Time UTC Clock
  // ----------------------------------------------------
  function updateLiveClock() {
    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, "0");
    const utcMinutes = String(now.getUTCMinutes()).padStart(2, "0");
    const utcSeconds = String(now.getUTCSeconds()).padStart(2, "0");
    liveClock.textContent = `${utcHours}:${utcMinutes}:${utcSeconds} UTC`;
  }
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // ----------------------------------------------------
  // 3. Matrix Digital Rain Canvas Background
  // ----------------------------------------------------
  const canvas = document.getElementById("matrixCanvas");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const matrixChars = "01010101RAFI0101LAYER5MESHERYROCKETCHATJITSIWEBRTCRAG";
  const fontSize = 13;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array.from({ length: columns }).map(() => Math.floor(Math.random() * -50));

  function drawMatrix() {
    ctx.fillStyle = "rgba(4, 8, 14, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff9d";
    ctx.font = `${fontSize}px "Fira Code", monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      if (Math.random() > 0.85) {
        ctx.fillStyle = "#00f2fe";
      } else {
        ctx.fillStyle = "#00ff9d";
      }

      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  setInterval(drawMatrix, 45);

  // ----------------------------------------------------
  // 4. 3D Holographic Perspective Tilt & Glare
  // ----------------------------------------------------
  if (tiltWrapper && terminalWrapper) {
    tiltWrapper.addEventListener("mousemove", (e) => {
      const rect = tiltWrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      terminalWrapper.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;

      if (cardGlare) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        cardGlare.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(0, 242, 254, 0.18), transparent 65%)`;
        cardGlare.style.opacity = "1";
      }
    });

    tiltWrapper.addEventListener("mouseleave", () => {
      terminalWrapper.style.transform = "rotateX(0deg) rotateY(0deg)";
      if (cardGlare) {
        cardGlare.style.opacity = "0";
      }
    });
  }

  // ----------------------------------------------------
  // 5. System Design Architecture Tabs
  // ----------------------------------------------------
  archTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      playTone(750, "triangle", 0.05);
      archTabBtns.forEach((b) => b.classList.remove("active"));
      archCanvasCards.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-arch");
      const card = document.getElementById(target);
      if (card) card.classList.add("active");
    });
  });

  // ----------------------------------------------------
  // 6. Theme Toggle Logic
  // ----------------------------------------------------
  let currentTheme = "dark";

  function setTheme(theme) {
    currentTheme = theme;
    htmlEl.setAttribute("data-theme", theme);
    playSciFiChime();

    if (theme === "dark") {
      themeIcon.textContent = "☀️";
      themeText.textContent = "Light Mode";
      currentModeLabel.textContent = "Current View: Cyber-Obsidian Mint Matrix";
      profileSvgObject.setAttribute("data", "dark.svg");
    } else {
      themeIcon.textContent = "🌙";
      themeText.textContent = "Dark Mode";
      currentModeLabel.textContent = "Current View: Clean Mint Hologram";
      profileSvgObject.setAttribute("data", "light.svg");
    }
  }

  themeToggleBtn.addEventListener("click", () => {
    setTheme(currentTheme === "light" ? "dark" : "light");
  });

  // ----------------------------------------------------
  // 7. Scanline CRT Toggle
  // ----------------------------------------------------
  let scanlineActive = true;
  scanlineToggleBtn.addEventListener("click", () => {
    scanlineActive = !scanlineActive;
    playTone(700, "square", 0.05);
    if (scanlineActive) {
      scanlineOverlay.classList.remove("disabled");
      scanlineToggleBtn.querySelector(".btn-text").textContent = "CRT: ON";
    } else {
      scanlineOverlay.classList.add("disabled");
      scanlineToggleBtn.querySelector(".btn-text").textContent = "CRT: OFF";
    }
  });

  // ----------------------------------------------------
  // 8. Copy Markdown Snippet
  // ----------------------------------------------------
  copyMarkdownBtn.addEventListener("click", async () => {
    playSciFiChime();
    try {
      const textToCopy = markdownSnippet.textContent;
      await navigator.clipboard.writeText(textToCopy);
      copyBtnText.textContent = "✓ Copied Code!";
      setTimeout(() => {
        copyBtnText.textContent = "Copy Markdown";
      }, 2500);
    } catch (err) {
      const range = document.createRange();
      range.selectNode(markdownSnippet);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      copyBtnText.textContent = "✓ Copied!";
      setTimeout(() => {
        copyBtnText.textContent = "Copy Markdown";
      }, 2500);
    }
  });

  // ----------------------------------------------------
  // 9. Customizer Modal Tabs & Open/Close
  // ----------------------------------------------------
  openCustomizerBtn.addEventListener("click", () => {
    playTone(650, "sine", 0.08);
    customizerModal.classList.add("active");
  });

  function closeModal() {
    playTone(400, "sine", 0.06);
    customizerModal.classList.remove("active");
  }

  closeCustomizerBtn.addEventListener("click", closeModal);
  closeModalFooterBtn.addEventListener("click", closeModal);
  customizerModal.addEventListener("click", (e) => {
    if (e.target === customizerModal) closeModal();
  });

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      playTone(800, "triangle", 0.04);
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      const pane = document.getElementById(target);
      if (pane) pane.classList.add("active");
    });
  });

  // ----------------------------------------------------
  // 10. Re-scan Heatmap Radar Button
  // ----------------------------------------------------
  refreshHeatmapBtn.addEventListener("click", () => {
    playSciFiChime();
    refreshHeatmapBtn.classList.add("pulse");
    const currentData = heatmapSvgObject.getAttribute("data");
    heatmapSvgObject.setAttribute("data", "");
    setTimeout(() => {
      heatmapSvgObject.setAttribute("data", `${currentData}?t=${Date.now()}`);
      refreshHeatmapBtn.classList.remove("pulse");
    }, 300);
  });

  // ----------------------------------------------------
  // 11. In-Browser Image-to-ASCII Converter
  // ----------------------------------------------------
  browseFileBtn.addEventListener("click", () => photoUpload.click());
  dropZone.addEventListener("click", (e) => {
    if (e.target !== browseFileBtn) photoUpload.click();
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhoto(e.dataTransfer.files[0]);
    }
  });

  photoUpload.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handlePhoto(e.target.files[0]);
    }
  });

  function handlePhoto(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        convertImageToAscii(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function convertImageToAscii(img, cols = 110, rows = 53) {
    playSciFiChime();
    const ctxCanvas = asciiCanvas.getContext("2d");
    asciiCanvas.width = cols;
    asciiCanvas.height = rows;

    ctxCanvas.drawImage(img, 0, 0, cols, rows);
    const imgData = ctxCanvas.getImageData(0, 0, cols, rows);
    const data = imgData.data;

    const chars = "  ..::--==++**#%%@@";
    let asciiStr = "";

    for (let y = 0; y < rows; y++) {
      let rowStr = "";
      for (let x = 0; x < cols; x++) {
        const idx = (y * cols + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a < 30) {
          rowStr += " ";
        } else {
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          const norm = 1.0 - brightness / 255.0;
          const charIdx = Math.max(1, Math.min(chars.length - 1, Math.floor(norm * (chars.length - 1))));
          rowStr += chars[charIdx];
        }
      }
      asciiStr += rowStr + "\n";
    }

    asciiOutput.value = asciiStr;
  }

  // ----------------------------------------------------
  // 12. Interactive Cyber CLI Terminal
  // ----------------------------------------------------
  const commandHistory = [];
  let historyIdx = -1;

  const cliCommands = {
    help: () => `Available routines:\n  - <span class="cmd-highlight">sysdesign</span>: Distributed architecture topology\n  - <span class="cmd-highlight">opensource</span>: Open source repositories & contributions\n  - <span class="cmd-highlight">skills</span>: Core AI & full-stack constellation\n  - <span class="cmd-highlight">projects</span>: Featured autonomous production systems\n  - <span class="cmd-highlight">ai</span>: Neural LLM & Whisper ASR telemetry\n  - <span class="cmd-highlight">bio</span>: Executive developer summary\n  - <span class="cmd-highlight">radar</span>: Status of Mach-6 contribution interceptor\n  - <span class="cmd-highlight">contact</span>: Direct communication frequencies\n  - <span class="cmd-highlight">clear</span>: Flush terminal buffer\n  - <span class="cmd-highlight">matrix</span>: Pulse quantum rain`,
    
    sysdesign: () => `<strong class="text-green">Distributed Architecture Highlights:</strong><br>1. <span class="text-cyan">Sub-300ms Offline RAG Pipeline:</span> Whisper ASR ➔ HNSW ChromaDB dense + BM25 sparse rerank ➔ Gemma 7B LLM ➔ Streaming TTS.<br>2. <span class="text-cyan">Cloud Native Service Mesh:</span> Envoy ingress proxy ➔ Microservices mesh ➔ Distributed Redis & Postgres.<br>3. <span class="text-cyan">High-Concurrency WebRTC Media SFU:</span> Selective Forwarding Unit mesh with zero-transcoding video streams.`,

    opensource: () => `<strong class="text-green">Active Open Source Ecosystem:</strong><br>• <a href="https://github.com/DRafi2006/layer5" target="_blank" class="cmd-highlight">Layer5</a>: Cloud native infrastructure & multi-mesh management<br>• <a href="https://github.com/DRafi2006/meshery.io" target="_blank" class="cmd-highlight">Meshery.io</a>: CNCF service mesh management plane<br>• <a href="https://github.com/DRafi2006/Rocket.Chat1" target="_blank" class="cmd-highlight">Rocket.Chat</a>: Scalable enterprise communications platform<br>• <a href="https://github.com/DRafi2006/jitsi-meet" target="_blank" class="cmd-highlight">Jitsi Meet</a>: High-scalability WebRTC video conferencing<br>• <a href="https://github.com/DRafi2006/Autryst_AI" target="_blank" class="cmd-highlight">Autryst_AI</a>: Autonomous AI agent workflows`,

    skills: () => `<span class="text-cyan">AI / ML:</span> Whisper ASR, Gemma LLMs, Vector RAG, PyTorch, Multi-Agent Swarms<br><span class="text-cyan">Full-Stack:</span> React 18, Next.js 14, Node.js, Express, Flask, RESTful APIs, WebSockets<br><span class="text-cyan">Languages:</span> Python, JavaScript, TypeScript, C, C++, SQL<br><span class="text-cyan">Infrastructure:</span> Docker, Playwright, Linux, PostgreSQL, SQLite, GitHub Actions`,

    projects: () => `1. <strong class="text-green">Grama Voice Buddy AI:</strong> Offline rural AI voice assistant (Whisper ASR + Gemma LLM + RAG)<br>2. <strong class="text-green">RealChat AI Android:</strong> Voice-first Android companion app (Kotlin, Jetpack Compose, Whisper)<br>3. <strong class="text-green">LinkedIn Job Automation:</strong> Autonomous applicant pipeline (Playwright + TF-IDF resonance)<br>4. <strong class="text-green">Mach-6 Jet Heatmap:</strong> Supersonic SVG contribution animation engine`,

    ai: () => `<span class="text-cyan">AI Core:</span> Agentic Architecture v3.2<br><span class="text-cyan">Speech Synthesis:</span> Whisper High-Precision ASR<br><span class="text-cyan">Reasoning:</span> Gemma Fine-Tuned Local Weight Embeddings<br><span class="text-cyan">Retrieval:</span> Hybrid Dense-Sparse Vector Context Engine`,

    bio: () => `Dudekula Mahammad Rafi is a Full-Stack & AI Systems Architect studying Computer Science at NIAT (2028). Achieved a perfect 10.0 SSC CGPA. Active open source contributor to Layer5, Meshery, Rocket.Chat, and Jitsi Meet.`,

    radar: () => `Mach-6 Recon Jet patrolling GitHub telemetry for <strong class="text-green">@DRafi2006</strong>.<br>Current Status: <span class="text-cyan">SUPERSONIC CRUISE</span> // Afterburner Plasma: ACTIVE`,

    contact: () => `Email: <a href="mailto:mahammaadrafi786@gmail.com" class="cmd-highlight">mahammaadrafi786@gmail.com</a><br>Phone: <span class="text-green">+91 8919474407</span><br>GitHub: <a href="https://github.com/DRafi2006" target="_blank" class="cmd-highlight">https://github.com/DRafi2006</a>`,

    matrix: () => {
      playSciFiChime();
      return `<span class="text-green">Matrix quantum speed boosted. Digital rain accelerated!</span>`;
    },

    easteregg: () => {
      playSciFiChime();
      return `🚀 <em>"The best way to predict the future is to architect and ship it."</em> - Dudekula Mahammad Rafi`;
    }
  };

  cliInput.addEventListener("keydown", (e) => {
    playTone(900 + Math.random() * 200, "sine", 0.02, 0.02);

    if (e.key === "Tab") {
      e.preventDefault();
      const current = cliInput.value.trim().toLowerCase();
      const matches = Object.keys(cliCommands).filter((c) => c.startsWith(current));
      if (matches.length === 1) {
        cliInput.value = matches[0];
      }
      return;
    }

    if (e.key === "Enter") {
      const rawCmd = cliInput.value.trim();
      if (!rawCmd) return;

      commandHistory.push(rawCmd);
      historyIdx = commandHistory.length;

      const cmd = rawCmd.toLowerCase();
      cliInput.value = "";

      if (cmd === "clear") {
        cliOutput.innerHTML = `<div class="cli-line intro-line">Terminal buffer cleared. Type <span class="cmd-highlight">help</span> for commands.</div>`;
        return;
      }

      const promptLine = document.createElement("div");
      promptLine.className = "cli-line prompt-line";
      promptLine.innerHTML = `<span class="cli-prompt">rafik@devos:~$</span> <span>${rawCmd}</span>`;
      cliOutput.appendChild(promptLine);

      const responseLine = document.createElement("div");
      responseLine.className = "cli-response";

      if (cliCommands[cmd]) {
        playTone(600, "triangle", 0.06);
        responseLine.innerHTML = cliCommands[cmd]();
      } else {
        playTone(300, "sawtooth", 0.08);
        responseLine.innerHTML = `zsh: command not found: <span class="text-red">${rawCmd}</span>. Type <span class="cmd-highlight">help</span> for available routines.`;
      }

      cliOutput.appendChild(responseLine);
      cliOutput.scrollTop = cliOutput.scrollHeight;
    }

    if (e.key === "ArrowUp") {
      if (commandHistory.length > 0 && historyIdx > 0) {
        historyIdx--;
        cliInput.value = commandHistory[historyIdx];
      }
    }

    if (e.key === "ArrowDown") {
      if (historyIdx < commandHistory.length - 1) {
        historyIdx++;
        cliInput.value = commandHistory[historyIdx];
      } else {
        historyIdx = commandHistory.length;
        cliInput.value = "";
      }
    }
  });
});
