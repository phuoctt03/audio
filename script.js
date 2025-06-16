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
  const progressSegments = document.getElementById("progressSegments")
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

  // Segments elements
  const addSegmentBtn = document.getElementById("addSegmentBtn")
  const addSegmentForm = document.getElementById("addSegmentForm")
  const segmentsList = document.getElementById("segmentsList")
  const segmentTimeInput = document.getElementById("segmentTime")
  const segmentTitleInput = document.getElementById("segmentTitle")
  const segmentDescriptionInput = document.getElementById("segmentDescription")
  const useCurrentTimeBtn = document.getElementById("useCurrentTimeBtn")
  const saveSegmentBtn = document.getElementById("saveSegmentBtn")
  const cancelSegmentBtn = document.getElementById("cancelSegmentBtn")

  // Thêm vào phần khai báo biến
  const exportSegmentsBtn = document.getElementById("exportSegmentsBtn")
  const importSegmentsBtn = document.getElementById("importSegmentsBtn")
  const importFileInput = document.getElementById("importFileInput")

  // Add status display for saved state
  const statusDisplay = document.createElement("div")
  statusDisplay.id = "statusDisplay"
  statusDisplay.className = "status-display"
  statusDisplay.style.display = "none"
  playerContainer.appendChild(statusDisplay)

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

  // Segments data
  let segments = []
  let currentSegmentIndex = -1
  let editingSegmentId = null

  // Variables for auto-save functionality
  let autoSaveInterval = null
  const SAVE_INTERVAL = 5000 // Save every 5 seconds
  const STORAGE_KEY_FILE = "audioPlayer_lastFile"
  const STORAGE_KEY_TIME = "audioPlayer_lastTime"
  const STORAGE_KEY_TIMESTAMP = "audioPlayer_lastTimestamp"
  const STORAGE_KEY_SEGMENTS = "audioPlayer_segments"
  const MAX_STORAGE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  // Segments functionality
  function timeToSeconds(timeStr) {
    const parts = timeStr.split(":")
    if (parts.length === 2) {
      return Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1])
    }
    return 0
  }

  function secondsToTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  function generateSegmentId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function addSegment(time, title, description = "") {
    const segment = {
      id: generateSegmentId(),
      time: time,
      title: title,
      description: description,
    }

    segments.push(segment)
    segments.sort((a, b) => a.time - b.time)
    saveSegments()
    renderSegments()
    renderSegmentMarkers()
  }

  function editSegment(id, time, title, description = "") {
    const segmentIndex = segments.findIndex((s) => s.id === id)
    if (segmentIndex !== -1) {
      segments[segmentIndex] = {
        ...segments[segmentIndex],
        time: time,
        title: title,
        description: description,
      }
      segments.sort((a, b) => a.time - b.time)
      saveSegments()
      renderSegments()
      renderSegmentMarkers()
    }
  }

  function deleteSegment(id) {
    segments = segments.filter((s) => s.id !== id)
    saveSegments()
    renderSegments()
    renderSegmentMarkers()
  }

  function saveSegments() {
    try {
      localStorage.setItem(STORAGE_KEY_SEGMENTS, JSON.stringify(segments))
    } catch (error) {
      console.error("Error saving segments:", error)
    }
  }

  function loadSegments() {
    try {
      const savedSegments = localStorage.getItem(STORAGE_KEY_SEGMENTS)
      if (savedSegments) {
        segments = JSON.parse(savedSegments)
        renderSegments()
        renderSegmentMarkers()
      }
    } catch (error) {
      console.error("Error loading segments:", error)
      segments = []
    }
  }

  function renderSegments() {
    if (segments.length === 0) {
      segmentsList.innerHTML = `
        <div class="empty-segments">
          <i class="fas fa-list-ul" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <p>Chưa có đoạn nào. Nhấn "Thêm đoạn" để bắt đầu!</p>
        </div>
      `
      return
    }

    segmentsList.innerHTML = segments
      .map(
        (segment) => `
      <div class="segment-item" data-id="${segment.id}" data-time="${segment.time}">
        <div class="segment-time">${secondsToTime(segment.time)}</div>
        <div class="segment-content">
          <div class="segment-title">${segment.title}</div>
          ${segment.description ? `<div class="segment-description">${segment.description}</div>` : ""}
        </div>
        <div class="segment-actions">
          <button class="segment-action-btn edit" title="Chỉnh sửa" data-id="${segment.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="segment-action-btn delete" title="Xóa" data-id="${segment.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `,
      )
      .join("")

    // Add event listeners
    segmentsList.querySelectorAll(".segment-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".segment-actions")) {
          const time = Number.parseFloat(item.dataset.time)
          if (audio.src) {
            audio.currentTime = time
          }
        }
      })
    })

    segmentsList.querySelectorAll(".segment-action-btn.edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const segmentId = btn.dataset.id
        const segment = segments.find((s) => s.id === segmentId)
        if (segment) {
          editingSegmentId = segmentId
          segmentTimeInput.value = secondsToTime(segment.time)
          segmentTitleInput.value = segment.title
          segmentDescriptionInput.value = segment.description || ""
          addSegmentForm.classList.add("show")
          saveSegmentBtn.textContent = "Cập nhật"
        }
      })
    })

    segmentsList.querySelectorAll(".segment-action-btn.delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const segmentId = btn.dataset.id
        const segment = segments.find((s) => s.id === segmentId)
        if (segment && confirm(`Bạn có chắc muốn xóa đoạn "${segment.title}"?`)) {
          deleteSegment(segmentId)
        }
      })
    })
  }

  function renderSegmentMarkers() {
    if (!audio.duration) return

    progressSegments.innerHTML = segments
      .map((segment) => {
        const position = (segment.time / audio.duration) * 100
        return `<div class="segment-marker" style="left: ${position}%" title="${segment.title} - ${secondsToTime(segment.time)}"></div>`
      })
      .join("")
  }

  function updateCurrentSegment() {
    if (!audio.src || segments.length === 0) return

    const currentTime = audio.currentTime
    let newCurrentSegmentIndex = -1

    for (let i = segments.length - 1; i >= 0; i--) {
      if (currentTime >= segments[i].time) {
        newCurrentSegmentIndex = i
        break
      }
    }

    if (newCurrentSegmentIndex !== currentSegmentIndex) {
      // Remove active class from all segments
      segmentsList.querySelectorAll(".segment-item").forEach((item) => {
        item.classList.remove("active")
      })

      // Add active class to current segment
      if (newCurrentSegmentIndex !== -1) {
        const currentSegmentElement = segmentsList.querySelector(`[data-id="${segments[newCurrentSegmentIndex].id}"]`)
        if (currentSegmentElement) {
          currentSegmentElement.classList.add("active")
        }
      }

      currentSegmentIndex = newCurrentSegmentIndex
    }
  }

  // Segments event listeners
  addSegmentBtn.addEventListener("click", () => {
    editingSegmentId = null
    segmentTimeInput.value = audio.src ? secondsToTime(audio.currentTime) : "00:00"
    segmentTitleInput.value = ""
    segmentDescriptionInput.value = ""
    addSegmentForm.classList.add("show")
    saveSegmentBtn.textContent = "Lưu đoạn"
    segmentTitleInput.focus()
  })

  useCurrentTimeBtn.addEventListener("click", () => {
    if (audio.src) {
      segmentTimeInput.value = secondsToTime(audio.currentTime)
    }
  })

  cancelSegmentBtn.addEventListener("click", () => {
    addSegmentForm.classList.remove("show")
    editingSegmentId = null
  })

  saveSegmentBtn.addEventListener("click", () => {
    const time = timeToSeconds(segmentTimeInput.value)
    const title = segmentTitleInput.value.trim()
    const description = segmentDescriptionInput.value.trim()

    if (!title) {
      alert("Vui lòng nhập tiêu đề đoạn!")
      segmentTitleInput.focus()
      return
    }

    if (editingSegmentId) {
      editSegment(editingSegmentId, time, title, description)
    } else {
      addSegment(time, title, description)
    }

    addSegmentForm.classList.remove("show")
    editingSegmentId = null
  })

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

  // Save current playback state
  function savePlaybackState() {
    if (currentFile && audio.src) {
      try {
        // Save file information
        const fileInfo = {
          name: currentFile.name,
          type: currentFile.type,
          size: currentFile.size,
          lastModified: currentFile.lastModified,
        }

        // Save current time and timestamp
        localStorage.setItem(STORAGE_KEY_FILE, JSON.stringify(fileInfo))
        localStorage.setItem(STORAGE_KEY_TIME, audio.currentTime.toString())
        localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString())

        // Show save status briefly
        showStatus("Đã lưu trạng thái phát")
      } catch (error) {
        console.error("Error saving playback state:", error)
      }
    }
  }

  // Show status message
  function showStatus(message) {
    if (statusDisplay) {
      statusDisplay.textContent = message
      statusDisplay.style.display = "block"

      // Hide after 2 seconds
      setTimeout(() => {
        statusDisplay.style.display = "none"
      }, 2000)
    }
  }

  // Start auto-save interval
  function startAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
    }

    autoSaveInterval = setInterval(savePlaybackState, SAVE_INTERVAL)
  }

  // Stop auto-save interval
  function stopAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
      autoSaveInterval = null
    }
  }

  // Check if saved state is too old
  function isSavedStateTooOld() {
    const timestamp = localStorage.getItem(STORAGE_KEY_TIMESTAMP)
    if (!timestamp) return true

    const savedTime = Number.parseInt(timestamp)
    const currentTime = Date.now()

    return currentTime - savedTime > MAX_STORAGE_AGE
  }

  // Try to restore previous session
  function tryRestorePreviousSession() {
    try {
      // Check if we have saved data and it's not too old
      if (isSavedStateTooOld()) {
        localStorage.removeItem(STORAGE_KEY_FILE)
        localStorage.removeItem(STORAGE_KEY_TIME)
        localStorage.removeItem(STORAGE_KEY_TIMESTAMP)
        return false
      }

      const fileInfoStr = localStorage.getItem(STORAGE_KEY_FILE)
      const savedTimeStr = localStorage.getItem(STORAGE_KEY_TIME)

      if (!fileInfoStr || !savedTimeStr) return false

      const fileInfo = JSON.parse(fileInfoStr)
      const savedTime = Number.parseFloat(savedTimeStr)

      // Show restore option to user
      if (confirm(`Bạn có muốn tiếp tục phát "${fileInfo.name}" từ ${formatTime(savedTime)}?`)) {
        // User needs to select the file again since we can't access the file directly from storage
        showStatus("Vui lòng chọn lại file để tiếp tục phát")
        return true
      } else {
        // User declined, clear saved state
        localStorage.removeItem(STORAGE_KEY_FILE)
        localStorage.removeItem(STORAGE_KEY_TIME)
        localStorage.removeItem(STORAGE_KEY_TIMESTAMP)
        return false
      }
    } catch (error) {
      console.error("Error restoring session:", error)
      return false
    }
  }

  // Check if selected file matches saved file
  function isMatchingSavedFile(file) {
    try {
      const fileInfoStr = localStorage.getItem(STORAGE_KEY_FILE)
      if (!fileInfoStr) return false

      const fileInfo = JSON.parse(fileInfoStr)

      // Compare file properties to see if it's likely the same file
      return file.name === fileInfo.name && file.size === fileInfo.size && file.type === fileInfo.type
    } catch (error) {
      return false
    }
  }

  // Restore playback position if file matches saved file
  function restorePlaybackPosition(file) {
    if (isMatchingSavedFile(file)) {
      const savedTimeStr = localStorage.getItem(STORAGE_KEY_TIME)
      if (savedTimeStr) {
        const savedTime = Number.parseFloat(savedTimeStr)

        // Set timeout to ensure audio is loaded before seeking
        setTimeout(() => {
          if (audio.readyState >= 2) {
            audio.currentTime = savedTime
            showStatus(`Đã khôi phục vị trí phát: ${formatTime(savedTime)}`)
          }
        }, 500)

        return true
      }
    }
    return false
  }

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

      // Check if we should restore playback position
      const shouldRestore = restorePlaybackPosition(file)

      audio
        .play()
        .then(() => {
          playPauseIcon.className = "fas fa-pause"
          playerContainer.classList.add("playing")

          // Initialize visualizer
          initVisualizer()

          // Start auto-save
          startAutoSave()
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

            // Restart auto-save when playing
            startAutoSave()
          })
          .catch((error) => {
            console.error("Error playing audio:", error)
          })
      }
    } else {
      audio.pause()
      playPauseIcon.className = "fas fa-play"
      playerContainer.classList.remove("playing")

      // Save state when pausing
      savePlaybackState()
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

      // Update current segment
      updateCurrentSegment()
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

      // Save final state
      savePlaybackState()

      // Stop auto-save when ended
      stopAutoSave()
    }
  })

  // Handle audio loaded metadata
  audio.addEventListener("loadedmetadata", () => {
    durationDisplay.textContent = formatTime(audio.duration)
    renderSegmentMarkers()
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
      - Thêm đoạn bằng cách nhấn "Thêm đoạn"
      - Nhấn vào đoạn để nhảy đến thời điểm đó
      - Phím tắt: Space (Phát/Dừng), ← → (Tua), ↑ ↓ (Âm lượng)
      - Trình phát tự động lưu vị trí phát và file gần nhất`)
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
            startAutoSave()
          })
        } else {
          audio.pause()
          playPauseIcon.className = "fas fa-play"
          playerContainer.classList.remove("playing")
          savePlaybackState()
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
      } else if (e.code === "KeyS") {
        // Manual save with S key
        savePlaybackState()
        showStatus("Đã lưu thủ công vị trí phát")
      }
    }
  })

  // Save state before page unload
  window.addEventListener("beforeunload", () => {
    if (currentFile && audio.src && audio.currentTime > 0) {
      savePlaybackState()
    }
  })

  // Thêm vào cuối file, trước phần "Initialize segments on load"

  // Export segments to text file
  function exportSegments() {
    if (segments.length === 0) {
      alert("Không có đoạn nào để xuất!")
      return
    }

    const fileName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "audio"

    // Create text content
    let textContent = `# Chú thích cho: ${fileName}\n`
    textContent += `# Tạo ngày: ${new Date().toLocaleString("vi-VN")}\n`
    textContent += `# Tổng số đoạn: ${segments.length}\n\n`

    segments.forEach((segment, index) => {
      textContent += `[${secondsToTime(segment.time)}] ${segment.title}\n`
      if (segment.description) {
        textContent += `${segment.description}\n`
      }
      textContent += `\n`
    })

    // Create and download file
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName}_segments.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showStatus(`Đã xuất ${segments.length} đoạn thành công!`)
  }

  // Import segments from text file
  function importSegments(fileContent) {
    const lines = fileContent.split("\n")
    const importedSegments = []
    let currentSegment = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip comments and empty lines
      if (line.startsWith("#") || line === "") continue

      // Check if line contains timestamp [MM:SS]
      const timeMatch = line.match(/^\[(\d{1,2}:\d{2})\]\s*(.+)$/)

      if (timeMatch) {
        // Save previous segment if exists
        if (currentSegment) {
          importedSegments.push(currentSegment)
        }

        // Create new segment
        const timeStr = timeMatch[1]
        const title = timeMatch[2].trim()
        const timeSeconds = timeToSeconds(timeStr)

        currentSegment = {
          id: generateSegmentId(),
          time: timeSeconds,
          title: title,
          description: "",
        }
      } else if (currentSegment && line !== "") {
        // This is description for current segment
        if (currentSegment.description) {
          currentSegment.description += "\n" + line
        } else {
          currentSegment.description = line
        }
      }
    }

    // Add last segment
    if (currentSegment) {
      importedSegments.push(currentSegment)
    }

    if (importedSegments.length === 0) {
      alert("Không tìm thấy đoạn nào trong file!\n\nĐịnh dạng đúng:\n[MM:SS] Tiêu đề\nMô tả (tùy chọn)")
      return
    }

    // Ask user if they want to replace or merge
    const action = confirm(
      `Tìm thấy ${importedSegments.length} đoạn trong file.\n\n` +
        `Nhấn OK để THAY THẾ tất cả đoạn hiện tại\n` +
        `Nhấn Cancel để HỦY IMPORT`,
    )

    if (action) {
      // Replace all segments
      segments = importedSegments
      segments.sort((a, b) => a.time - b.time)
      saveSegments()
      renderSegments()
      renderSegmentMarkers()
      showStatus(`Đã import ${importedSegments.length} đoạn thành công!`)
    }
  }

  // Handle file import
  function handleImportFile(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        importSegments(content)
      } catch (error) {
        alert("Lỗi khi đọc file: " + error.message)
      }
    }
    reader.readAsText(file, "utf-8")

    // Reset input
    event.target.value = ""
  }

  // Event listeners for export/import
  exportSegmentsBtn.addEventListener("click", exportSegments)

  importSegmentsBtn.addEventListener("click", () => {
    importFileInput.click()
  })

  importFileInput.addEventListener("change", handleImportFile)

  // Initialize segments on load
  loadSegments()

  // Check for previous session on load
  tryRestorePreviousSession()

  // Add CSS for status display
  const style = document.createElement("style")
  style.textContent = `
    .status-display {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      transition: opacity 0.3s ease;
    }
  `
  document.head.appendChild(style)
})
