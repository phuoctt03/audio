document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput")
  const audio = document.getElementById("audio")
  const filenameDisplay = document.getElementById("filename")
  const playPauseBtn = document.getElementById("playPauseBtn")
  const playPauseIcon = document.getElementById("playPauseIcon")
  const backwardBtn = document.getElementById("backwardBtn")
  const forwardBtn = document.getElementById("forwardBtn")
  const progressContainer = document.getElementById("progressContainer")
  const progressBar = document.getElementById("progressBar")
  const currentTimeDisplay = document.getElementById("currentTime")
  const durationDisplay = document.getElementById("duration")
  const playerContainer = document.getElementById("playerContainer")
  const volumeIcon = document.getElementById("volumeIcon")
  const volumeSlider = document.getElementById("volumeSlider")
  const volumeLevel = document.getElementById("volumeLevel")
  const loopBtn = document.getElementById("loopBtn")
  const downloadBtn = document.getElementById("downloadBtn")
  const jumpStartBtn = document.getElementById("jumpStartBtn")
  const jumpEndBtn = document.getElementById("jumpEndBtn")
  const themeToggle = document.getElementById("themeToggle")
  const visualizerCanvas = document.getElementById("visualizer")
  const speedBtns = document.querySelectorAll(".speed-btn")
  const eqPresetBtns = document.querySelectorAll(".eq-preset-btn")
  const bassSlider = document.getElementById("bassSlider")
  const midSlider = document.getElementById("midSlider")
  const trebleSlider = document.getElementById("trebleSlider")
  const reverbSlider = document.getElementById("reverbSlider")
  const bassValue = document.getElementById("bassValue")
  const midValue = document.getElementById("midValue")
  const trebleValue = document.getElementById("trebleValue")
  const reverbValue = document.getElementById("reverbValue")
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabPanes = document.querySelectorAll(".tab-pane")
  const shareBtn = document.getElementById("shareBtn")
  const infoBtn = document.getElementById("infoBtn")
  const helpBtn = document.getElementById("helpBtn")

  let currentFile = null
  let audioContext = null
  let analyser = null
  let source = null
  let animationId = null
  let bassFilter = null
  let midFilter = null
  let trebleFilter = null
  let convolver = null
  let convolverGain = null
  let dryGain = null
  let wetGain = null

  // Theme toggle
  themeToggle.addEventListener("click", function () {
    const html = document.documentElement
    const currentTheme = html.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"

    html.setAttribute("data-theme", newTheme)

    // Update theme toggle icon
    const themeIcon = this.querySelector("i")
    if (newTheme === "dark") {
      themeIcon.className = "fas fa-moon"
    } else {
      themeIcon.className = "fas fa-sun"
    }
  })

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab")

      // Remove active class from all buttons and panes
      tabBtns.forEach((b) => b.classList.remove("active"))
      tabPanes.forEach((p) => p.classList.remove("active"))

      // Add active class to current button and pane
      this.classList.add("active")
      document.getElementById(`${tabId}-tab`).classList.add("active")
    })
  })

  // Initialize audio context and filters
  function initAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 256

      // Create filters
      bassFilter = audioContext.createBiquadFilter()
      bassFilter.type = "lowshelf"
      bassFilter.frequency.value = 200
      bassFilter.gain.value = 0

      midFilter = audioContext.createBiquadFilter()
      midFilter.type = "peaking"
      midFilter.frequency.value = 1000
      midFilter.Q.value = 1
      midFilter.gain.value = 0

      trebleFilter = audioContext.createBiquadFilter()
      trebleFilter.type = "highshelf"
      trebleFilter.frequency.value = 3000
      trebleFilter.gain.value = 0

      // Create reverb
      convolver = audioContext.createConvolver()
      dryGain = audioContext.createGain()
      wetGain = audioContext.createGain()
      convolverGain = audioContext.createGain()

      // Set initial reverb level
      wetGain.gain.value = 0
      dryGain.gain.value = 1

      // Generate impulse response for reverb
      generateImpulseResponse()

      // Connect audio element to the audio context
      source = audioContext.createMediaElementSource(audio)

      // Connect nodes: source -> bass -> mid -> treble -> analyser -> destination
      source.connect(bassFilter)
      bassFilter.connect(midFilter)
      midFilter.connect(trebleFilter)

      // Reverb parallel path
      trebleFilter.connect(dryGain)
      trebleFilter.connect(convolver)
      convolver.connect(wetGain)

      dryGain.connect(analyser)
      wetGain.connect(analyser)

      analyser.connect(audioContext.destination)
    }
  }

  // Generate impulse response for reverb
  function generateImpulseResponse() {
    const sampleRate = audioContext.sampleRate
    const length = sampleRate * 2 // 2 seconds
    const impulse = audioContext.createBuffer(2, length, sampleRate)
    const leftChannel = impulse.getChannelData(0)
    const rightChannel = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      const n = i / length
      // Decay curve
      const decay = Math.exp(-n * 3)
      // Random noise
      leftChannel[i] = (Math.random() * 2 - 1) * decay
      rightChannel[i] = (Math.random() * 2 - 1) * decay
    }

    convolver.buffer = impulse
  }

  // Initialize visualizer
  function initVisualizer() {
    const canvas = visualizerCanvas
    const ctx = canvas.getContext("2d")

    // Set canvas dimensions
    function resizeCanvas() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Visualizer animation
    function drawVisualizer() {
      animationId = requestAnimationFrame(drawVisualizer)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue("--visualizer-color-1"))
      gradient.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue("--visualizer-color-2"))

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    // Start visualizer
    drawVisualizer()
  }

  // Update EQ values display
  function updateEQValueDisplay() {
    bassValue.textContent = `${bassSlider.value} dB`
    midValue.textContent = `${midSlider.value} dB`
    trebleValue.textContent = `${trebleSlider.value} dB`
    reverbValue.textContent = `${reverbSlider.value}%`
  }

  // Apply EQ settings
  function applyEQSettings() {
    if (bassFilter && midFilter && trebleFilter) {
      bassFilter.gain.value = Number.parseFloat(bassSlider.value)
      midFilter.gain.value = Number.parseFloat(midSlider.value)
      trebleFilter.gain.value = Number.parseFloat(trebleSlider.value)

      const reverbLevel = Number.parseFloat(reverbSlider.value) / 100
      wetGain.gain.value = reverbLevel
      dryGain.gain.value = 1 - reverbLevel * 0.5 // Reduce dry signal slightly when reverb is high
    }

    updateEQValueDisplay()
  }

  // Apply EQ preset
  function applyEQPreset(preset) {
    switch (preset) {
      case "flat":
        bassSlider.value = 0
        midSlider.value = 0
        trebleSlider.value = 0
        reverbSlider.value = 0
        break
      case "bass":
        bassSlider.value = 8
        midSlider.value = -2
        trebleSlider.value = 3
        reverbSlider.value = 10
        break
      case "vocal":
        bassSlider.value = -2
        midSlider.value = 5
        trebleSlider.value = 2
        reverbSlider.value = 20
        break
      case "electronic":
        bassSlider.value = 6
        midSlider.value = -1
        trebleSlider.value = 5
        reverbSlider.value = 30
        break
    }

    applyEQSettings()

    // Update active preset button
    eqPresetBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === preset)
    })
  }

  // EQ preset buttons
  eqPresetBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      applyEQPreset(this.dataset.preset)
    })
  })

  // EQ sliders
  bassSlider.addEventListener("input", applyEQSettings)
  midSlider.addEventListener("input", applyEQSettings)
  trebleSlider.addEventListener("input", applyEQSettings)
  reverbSlider.addEventListener("input", applyEQSettings)

  // File input handling
  fileInput.addEventListener("change", function () {
    const file = this.files[0]
    if (file && (file.type === "audio/mp4" || file.type === "audio/mpeg" || file.name.endsWith(".m4a"))) {
      currentFile = file
      const url = URL.createObjectURL(file)
      audio.src = url
      filenameDisplay.textContent = `▶️ Đang phát: ${file.name}`

      // Initialize audio context and filters
      initAudioContext()

      // Resume audio context if it's suspended (needed for Chrome)
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume()
      }

      audio
        .play()
        .then(() => {
          playPauseIcon.className = "fas fa-pause"
          playerContainer.classList.add("playing")

          // Initialize visualizer
          initVisualizer()
        })
        .catch((error) => {
          console.error("Error playing audio:", error)
        })

      // Enable download button
      downloadBtn.disabled = false
    } else {
      filenameDisplay.textContent = "❌ File không hợp lệ. Hãy chọn .m4a, .mp3 hoặc .mp4"
      playerContainer.classList.remove("playing")
    }
  })

  // Play/Pause functionality
  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      if (audio.src) {
        // Resume audio context if it's suspended
        if (audioContext && audioContext.state === "suspended") {
          audioContext.resume()
        }

        audio
          .play()
          .then(() => {
            playPauseIcon.className = "fas fa-pause"
            playerContainer.classList.add("playing")
          })
          .catch((error) => {
            console.error("Error playing audio:", error)
          })
      }
    } else {
      audio.pause()
      playPauseIcon.className = "fas fa-play"
      playerContainer.classList.remove("playing")
    }
  })

  // Skip backward 5 seconds
  backwardBtn.addEventListener("click", () => {
    if (audio.src) {
      audio.currentTime = Math.max(0, audio.currentTime - 5)
    }
  })

  // Skip forward 5 seconds
  forwardBtn.addEventListener("click", () => {
    if (audio.src) {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 5)
    }
  })

  // Update progress bar
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      const progressPercent = (audio.currentTime / audio.duration) * 100
      progressBar.style.width = `${progressPercent}%`

      // Update time displays
      currentTimeDisplay.textContent = formatTime(audio.currentTime)
      durationDisplay.textContent = formatTime(audio.duration)
    }
  })

  // Click on progress bar to seek
  progressContainer.addEventListener("click", function (e) {
    if (audio.src) {
      const width = this.clientWidth
      const clickX = e.offsetX
      const seekTime = (clickX / width) * audio.duration
      audio.currentTime = seekTime
    }
  })

  // Volume control
  volumeSlider.addEventListener("click", function (e) {
    if (audio.src) {
      const width = this.clientWidth
      const clickX = e.offsetX
      const volume = clickX / width

      audio.volume = volume
      volumeLevel.style.width = `${volume * 100}%`

      // Update volume icon
      updateVolumeIcon(volume)
    }
  })

  // Toggle mute
  volumeIcon.addEventListener("click", () => {
    if (audio.src) {
      if (audio.muted) {
        audio.muted = false
        volumeLevel.style.width = `${audio.volume * 100}%`
        updateVolumeIcon(audio.volume)
      } else {
        audio.muted = true
        volumeLevel.style.width = "0%"
        volumeIcon.className = "fas fa-volume-xmark volume-icon"
      }
    }
  })

  // Update volume icon based on level
  function updateVolumeIcon(volume) {
    if (volume === 0) {
      volumeIcon.className = "fas fa-volume-xmark volume-icon"
    } else if (volume < 0.5) {
      volumeIcon.className = "fas fa-volume-low volume-icon"
    } else {
      volumeIcon.className = "fas fa-volume-high volume-icon"
    }
  }

  // Loop button
  loopBtn.addEventListener("click", function () {
    if (audio.src) {
      audio.loop = !audio.loop
      this.classList.toggle("active")
    }
  })

  // Download button
  downloadBtn.addEventListener("click", () => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = currentFile.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  })

  // Jump to start
  jumpStartBtn.addEventListener("click", () => {
    if (audio.src) {
      audio.currentTime = 0
    }
  })

  // Jump to end
  jumpEndBtn.addEventListener("click", () => {
    if (audio.src) {
      audio.currentTime = audio.duration - 0.1
    }
  })

  // Playback speed
  speedBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (audio.src) {
        const speed = Number.parseFloat(this.getAttribute("data-speed"))
        audio.playbackRate = speed

        // Update active button
        speedBtns.forEach((b) => b.classList.remove("active"))
        this.classList.add("active")
      }
    })
  })

  // Format time in MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle audio ended event
  audio.addEventListener("ended", () => {
    if (!audio.loop) {
      playPauseIcon.className = "fas fa-play"
      playerContainer.classList.remove("playing")
    }
  })

  // Handle audio loaded metadata
  audio.addEventListener("loadedmetadata", () => {
    durationDisplay.textContent = formatTime(audio.duration)
  })

  // Clean up visualizer when audio is paused
  audio.addEventListener("pause", () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  })

  // Restart visualizer when audio is played
  audio.addEventListener("play", () => {
    if (analyser && !animationId) {
      initVisualizer()
    }
  })

  // Initialize EQ display
  updateEQValueDisplay()

  // Share button (if Web Share API is available)
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (navigator.share && currentFile) {
        navigator
          .share({
            title: "Chia sẻ âm thanh",
            text: `Đang nghe: ${currentFile.name}`,
          })
          .catch((error) => console.log("Error sharing:", error))
      } else {
        alert("Tính năng chia sẻ không được hỗ trợ trên trình duyệt này.")
      }
    })
  }

  // Info button
  if (infoBtn) {
    infoBtn.addEventListener("click", () => {
      if (currentFile) {
        alert(`Thông tin file:
        Tên: ${currentFile.name}
        Kích thước: ${(currentFile.size / 1024 / 1024).toFixed(2)} MB
        Loại: ${currentFile.type}`)
      } else {
        alert("Chưa có file âm thanh nào được chọn.")
      }
    })
  }

  // Help button
  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      alert(`Hướng dẫn sử dụng:
      - Chọn file âm thanh để phát
      - Sử dụng nút phát/tạm dừng để điều khiển
      - Điều chỉnh âm lượng bằng thanh trượt
      - Thay đổi tốc độ phát trong tab Playback
      - Điều chỉnh âm thanh trong tab Equalizer
      - Phím tắt: Space (Phát/Dừng), ← → (Tua), ↑ ↓ (Âm lượng)`)
    })
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (audio.src) {
      if (e.code === "Space") {
        e.preventDefault()
        if (audio.paused) {
          audio.play().then(() => {
            playPauseIcon.className = "fas fa-pause"
            playerContainer.classList.add("playing")
          })
        } else {
          audio.pause()
          playPauseIcon.className = "fas fa-play"
          playerContainer.classList.remove("playing")
        }
      } else if (e.code === "ArrowLeft") {
        audio.currentTime = Math.max(0, audio.currentTime - 5)
      } else if (e.code === "ArrowRight") {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5)
      } else if (e.code === "ArrowUp") {
        audio.volume = Math.min(1, audio.volume + 0.1)
        volumeLevel.style.width = `${audio.volume * 100}%`
        updateVolumeIcon(audio.volume)
      } else if (e.code === "ArrowDown") {
        audio.volume = Math.max(0, audio.volume - 0.1)
        volumeLevel.style.width = `${audio.volume * 100}%`
        updateVolumeIcon(audio.volume)
      } else if (e.code === "KeyM") {
        if (audio.muted) {
          audio.muted = false
          volumeLevel.style.width = `${audio.volume * 100}%`
          updateVolumeIcon(audio.volume)
        } else {
          audio.muted = true
          volumeLevel.style.width = "0%"
          volumeIcon.className = "fas fa-volume-xmark volume-icon"
        }
      } else if (e.code === "KeyL") {
        audio.loop = !audio.loop
        loopBtn.classList.toggle("active")
      } else if (e.code === "KeyT") {
        themeToggle.click()
      }
    }
  })
})
