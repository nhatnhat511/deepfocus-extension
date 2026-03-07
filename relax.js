const timerEl = document.getElementById("breakTimer")
const STATE_KEY = "deepfocusState"
let stateSnapshot = null

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
    chrome.storage.local.get(STATE_KEY, (result) => {
        if (chrome.runtime.lastError) return
        stateSnapshot = result[STATE_KEY] || null
        renderTimerFromState(stateSnapshot)
    })
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return
    if (!changes[STATE_KEY]) return
    stateSnapshot = changes[STATE_KEY].newValue || null
    renderTimerFromState(stateSnapshot)
})

syncBreakTimerFromStorage()
setInterval(() => {
    renderTimerFromState(stateSnapshot)
}, 250)
