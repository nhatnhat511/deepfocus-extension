const timerEl = document.getElementById("breakTimer")
const STATE_KEY = "deepfocusState"
const BREAK_BG_KEY = "deepfocusBreakVisualBackground"
let stateSnapshot = null
let breakBackgroundDataUrl = ""

function renderTimerFromState(state) {
    if (!timerEl) return
    if (!state || !state.endTime) {
        timerEl.textContent = "--:--"
        return
    }

    if (state.mode !== "break") {
        timerEl.textContent = "--:--"
        return
    }

    let seconds = 0
    if (state.isPaused) {
        seconds = Math.ceil((state.remainingMs || 0) / 1000)
    } else {
        seconds = Math.ceil((state.endTime - Date.now()) / 1000)
    }
    if (seconds < 0) seconds = 0

    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    timerEl.textContent = `${m}:${s.toString().padStart(2, "0")}`
}

function syncBreakTimerFromStorage() {
    chrome.storage.local.get([STATE_KEY, BREAK_BG_KEY], (result) => {
        if (chrome.runtime.lastError) return
        stateSnapshot = result[STATE_KEY] || null
        breakBackgroundDataUrl = typeof result[BREAK_BG_KEY] === "string" ? result[BREAK_BG_KEY] : ""
        applyBreakBackground()
        renderTimerFromState(stateSnapshot)
    })
}

function applyBreakBackground() {
    if (!document.body) return
    if (breakBackgroundDataUrl && breakBackgroundDataUrl.startsWith("data:image/")) {
        document.body.style.backgroundImage = `url("${breakBackgroundDataUrl}")`
        document.body.style.backgroundPosition = "center"
        document.body.style.backgroundRepeat = "no-repeat"
        document.body.style.backgroundSize = "cover"
        return
    }
    document.body.style.backgroundImage = ""
    document.body.style.backgroundPosition = ""
    document.body.style.backgroundRepeat = ""
    document.body.style.backgroundSize = ""
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return
    if (changes[STATE_KEY]) {
        stateSnapshot = changes[STATE_KEY].newValue || null
        renderTimerFromState(stateSnapshot)
    }
    if (changes[BREAK_BG_KEY]) {
        breakBackgroundDataUrl = typeof changes[BREAK_BG_KEY].newValue === "string" ? changes[BREAK_BG_KEY].newValue : ""
        applyBreakBackground()
    }
})

syncBreakTimerFromStorage()
setInterval(() => {
    renderTimerFromState(stateSnapshot)
}, 250)
