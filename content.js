(function () {

if (window.deepfocusLoaded) return
window.deepfocusLoaded = true

let extensionAlive = true
let currentState = null
let renderTimer = null
let hydrated = false

let lastSecond = null
let lastMode = null
let lastInTransition = false
let lastAudioEventKey = null
let lastThemeUpdateAt = 0

const box = document.createElement("div")
box.style.position = "fixed"
box.style.top = "10px"
box.style.left = "auto"
box.style.right = "16px"
box.style.pointerEvents = "auto"
box.style.display = "flex"
box.style.alignItems = "center"
box.style.justifyContent = "center"
box.style.background = "black"
box.style.color = "white"
box.style.width = "122px"
box.style.height = "36px"
box.style.padding = "0 10px"
box.style.boxSizing = "border-box"
box.style.borderRadius = "6px"
box.style.fontSize = "14px"
box.style.lineHeight = "1"
box.style.fontFamily = "\"Segoe UI\", Tahoma, Arial, sans-serif"
box.style.fontWeight = "600"
box.style.letterSpacing = "0.2px"
box.style.zIndex = "999999"
box.style.whiteSpace = "nowrap"
box.style.opacity = "0"
box.style.transition = "opacity 0.12s ease"
box.style.cursor = "grab"
box.style.userSelect = "none"
box.textContent = ""
document.documentElement.appendChild(box)

let isDragging = false
let dragOffsetX = 0
let dragOffsetY = 0
const BOX_POS_KEY = "deepfocusBoxPosition"
const BOX_MARGIN = 16
let reminderModal = null
let nightWorkEnabled = false
let nightWorkSmart = true
let nightWorkStrength = 38
let nightWorkOverlay = null
let lastActivityPingAt = 0

function hasRuntime() {
    try {
        return extensionAlive && !!(chrome && chrome.runtime && chrome.runtime.id)
    } catch (_e) {
        return false
    }
}

function markExtensionDead() {
    extensionAlive = false
    if (renderTimer) {
        clearInterval(renderTimer)
        renderTimer = null
    }
}

function emitAudio(eventType, mode, seconds, inTransition) {
    if (!hasRuntime()) return

    const key = `${eventType}:${mode}:${seconds}:${inTransition ? 1 : 0}`
    if (key === lastAudioEventKey) return
    lastAudioEventKey = key

    try {
        chrome.runtime.sendMessage({
            type: "AUDIO_EVENT",
            eventType,
            mode,
            seconds,
            inTransition
        }, () => {
            if (!hasRuntime()) return
            if (chrome.runtime.lastError &&
                chrome.runtime.lastError.message &&
                chrome.runtime.lastError.message.includes("Extension context invalidated")) {
                markExtensionDead()
            }
        })
    } catch (_e) {
        markExtensionDead()
    }
}

function setHiddenBox() {
    box.textContent = ""
    box.style.opacity = "0"
}

function getBoxWidth() {
    return box.offsetWidth || 122
}

function getBoxHeight() {
    return box.offsetHeight || 36
}

function getViewportWidth() {
    return document.documentElement.clientWidth || window.innerWidth || 0
}

function getViewportHeight() {
    return document.documentElement.clientHeight || window.innerHeight || 0
}

function clampBoxPosition(x, y) {
    const maxX = Math.max(BOX_MARGIN, getViewportWidth() - getBoxWidth() - BOX_MARGIN)
    const maxY = Math.max(BOX_MARGIN, getViewportHeight() - getBoxHeight() - BOX_MARGIN)
    return {
        x: Math.min(Math.max(BOX_MARGIN, x), maxX),
        y: Math.min(Math.max(BOX_MARGIN, y), maxY)
    }
}

function setBoxPosition(x, y) {
    const p = clampBoxPosition(x, y)
    box.style.left = `${Math.round(p.x)}px`
    box.style.top = `${Math.round(p.y)}px`
    box.style.right = "auto"
}

function saveBoxPosition() {
    if (!hasRuntime()) return
    const left = parseFloat(box.style.left || "0")
    const top = parseFloat(box.style.top || "0")
    chrome.storage.local.set({
        [BOX_POS_KEY]: { x: left, y: top }
    })
}

function applyDefaultBoxPosition() {
    const x = Math.max(BOX_MARGIN, getViewportWidth() - getBoxWidth() - BOX_MARGIN)
    const y = BOX_MARGIN
    setBoxPosition(x, y)
}

function loadBoxPosition() {
    if (!hasRuntime()) {
        applyDefaultBoxPosition()
        return
    }

    chrome.storage.local.get(BOX_POS_KEY, (result) => {
        if (chrome.runtime.lastError) {
            applyDefaultBoxPosition()
            return
        }
        const pos = result[BOX_POS_KEY]
        if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
            setBoxPosition(pos.x, pos.y)
            return
        }
        applyDefaultBoxPosition()
    })
}

function parseColor(value) {
    if (!value) return null
    const v = value.trim().toLowerCase()

    if (v.startsWith("rgb")) {
        const nums = v.match(/[\d.]+/g)
        if (!nums || nums.length < 3) return null
        return {
            r: Number(nums[0]),
            g: Number(nums[1]),
            b: Number(nums[2]),
            a: nums[3] !== undefined ? Number(nums[3]) : 1
        }
    }

    if (v.startsWith("#")) {
        const hex = v.slice(1)
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
                a: 1
            }
        }
        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: 1
            }
        }
    }

    return null
}

function getBackgroundAtPoint(x, y) {
    let el = document.elementFromPoint(x, y)
    if (el === box) {
        const prevPointer = box.style.pointerEvents
        box.style.pointerEvents = "none"
        el = document.elementFromPoint(x, y)
        box.style.pointerEvents = prevPointer || "auto"
    }
    let node = el

    while (node && node !== document.documentElement) {
        const bg = parseColor(getComputedStyle(node).backgroundColor)
        if (bg && bg.a > 0) return bg
        node = node.parentElement
    }

    const bodyBg = parseColor(getComputedStyle(document.body || document.documentElement).backgroundColor)
    if (bodyBg && bodyBg.a > 0) return bodyBg

    const docBg = parseColor(getComputedStyle(document.documentElement).backgroundColor)
    if (docBg && docBg.a > 0) return docBg

    return { r: 255, g: 255, b: 255, a: 1 }
}

function isLightColor(c) {
    const luminance = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
    return luminance >= 150
}

function applyAdaptiveTheme() {
    const now = Date.now()
    if (now - lastThemeUpdateAt < 500) return
    lastThemeUpdateAt = now

    const rect = box.getBoundingClientRect()
    const sampleX = Math.min(getViewportWidth() - 1, Math.max(0, Math.round(rect.left + rect.width / 2)))
    const sampleY = Math.min(getViewportHeight() - 1, Math.max(0, Math.round(rect.top + rect.height / 2)))
    const bg = getBackgroundAtPoint(sampleX, sampleY)
    const light = isLightColor(bg)

    if (light) {
        box.style.background = "#111"
        box.style.color = "#fff"
        box.style.border = "1px solid rgba(255,255,255,0.2)"
    } else {
        box.style.background = "#fff"
        box.style.color = "#111"
        box.style.border = "1px solid rgba(0,0,0,0.25)"
    }
}

function startDrag(clientX, clientY) {
    const rect = box.getBoundingClientRect()
    isDragging = true
    dragOffsetX = clientX - rect.left
    dragOffsetY = clientY - rect.top
    box.style.cursor = "grabbing"
}

function dragMove(clientX, clientY) {
    if (!isDragging) return
    const x = clientX - dragOffsetX
    const y = clientY - dragOffsetY
    setBoxPosition(x, y)
    lastThemeUpdateAt = 0
    applyAdaptiveTheme()
}

function endDrag() {
    if (!isDragging) return
    isDragging = false
    box.style.cursor = "grab"
    saveBoxPosition()
}

function handleTimerMessage(msg) {
    applyAdvancedSettingsFromMessage(msg)

    if (msg.type === "HIDE_REMINDER_POPUP") {
        if (reminderModal) {
            reminderModal.remove()
            reminderModal = null
        }
        return
    }

    if (msg.type === "SHOW_REMINDER_POPUP") {
        showReminderModal(msg.title || "Break reminder", msg.message || "", msg.icon || "\u23F0")
        return
    }

    hydrated = true

    if (msg.type === "RESET") {
        currentState = null
        lastSecond = null
        lastMode = null
        lastInTransition = false
        lastAudioEventKey = null
        setHiddenBox()
        return
    }

    if (msg.type !== "UPDATE") return

    currentState = {
        mode: msg.mode,
        endTime: msg.endTime,
        inTransition: !!msg.inTransition,
        isPaused: !!msg.isPaused,
        remainingMs: msg.remainingMs ?? null
    }
}

function applyAdvancedSettingsFromMessage(msg) {
    if (!msg || typeof msg !== "object") return

    if (typeof msg.nightWorkEnabled === "boolean") {
        nightWorkEnabled = msg.nightWorkEnabled
    }
    if (typeof msg.nightWorkSmart === "boolean") {
        nightWorkSmart = msg.nightWorkSmart
    }
    if (typeof msg.nightWorkStrength === "number") {
        nightWorkStrength = Math.max(10, Math.min(75, Math.round(msg.nightWorkStrength)))
    }

    updateNightWorkOverlay()
}

function getNightWorkTimeFactor() {
    if (!nightWorkSmart) return 1

    const now = new Date()
    const minutes = now.getHours() * 60 + now.getMinutes()

    // 18:00->22:00 ramp up, 22:00->04:00 peak, 04:00->07:00 ramp down
    if (minutes >= 1080 && minutes < 1320) {
        return (minutes - 1080) / 240
    }
    if (minutes >= 1320 || minutes < 240) {
        return 1
    }
    if (minutes >= 240 && minutes < 420) {
        return 1 - (minutes - 240) / 180
    }
    return 0.6
}

function ensureNightWorkOverlay() {
    if (nightWorkOverlay && nightWorkOverlay.isConnected) return

    const overlay = document.createElement("div")
    overlay.style.position = "fixed"
    overlay.style.inset = "0"
    overlay.style.pointerEvents = "none"
    overlay.style.zIndex = "999998"
    overlay.style.opacity = "0"
    overlay.style.transition = "opacity 180ms ease"
    overlay.style.background = "rgba(12,18,32,0.25)"
    overlay.style.backdropFilter = "saturate(85%)"
    document.documentElement.appendChild(overlay)
    nightWorkOverlay = overlay
}

function updateNightWorkOverlay() {
    if (!nightWorkEnabled) {
        if (nightWorkOverlay) nightWorkOverlay.style.opacity = "0"
        return
    }

    const timeFactor = getNightWorkTimeFactor()

    ensureNightWorkOverlay()

    const bg = getBackgroundAtPoint(Math.floor(getViewportWidth() * 0.5), Math.floor(getViewportHeight() * 0.5))
    const luminance = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b
    const luminanceFactor = Math.max(0.8, Math.min(1.2, luminance / 165))

    const strength = nightWorkStrength / 100
    const base = 0.15 + strength * 0.55
    const opacity = Math.max(0.12, Math.min(0.78, base * timeFactor * luminanceFactor))
    const brightness = Math.max(0.62, 1 - opacity * 0.42)

    nightWorkOverlay.style.background = "rgba(12,18,32,1)"
    nightWorkOverlay.style.backdropFilter = `brightness(${brightness.toFixed(2)}) saturate(85%)`
    nightWorkOverlay.style.opacity = opacity.toFixed(2)
}

function reportActivity() {
    const now = Date.now()
    if (now - lastActivityPingAt < 10000) return
    lastActivityPingAt = now

    if (!hasRuntime()) return
    try {
        chrome.runtime.sendMessage({ type: "USER_ACTIVITY_PING" }, () => {
            if (!hasRuntime()) return
            if (chrome.runtime.lastError &&
                chrome.runtime.lastError.message &&
                chrome.runtime.lastError.message.includes("Extension context invalidated")) {
                markExtensionDead()
            }
        })
    } catch (_e) {
        markExtensionDead()
    }
}

function showReminderModal(title, message, icon) {
    if (reminderModal) reminderModal.remove()
    const host = document.createElement("div")
    host.style.position = "fixed"
    host.style.inset = "0"
    host.style.zIndex = "2147483646"
    host.style.pointerEvents = "auto"

    const shadow = host.attachShadow({ mode: "open" })
    shadow.innerHTML = `
        <style>
            :host { all: initial; }
            * { box-sizing: border-box; font-family: "Segoe UI", Tahoma, Arial, sans-serif; }
            .overlay {
                position: fixed;
                inset: 0;
                pointer-events: auto;
                background: rgba(15,23,42,0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(2px);
            }
            .card {
                width: min(440px, 92vw);
                background: #fff;
                color: #0f172a;
                border-radius: 14px;
                box-shadow: 0 24px 60px rgba(0,0,0,0.28);
                border: 1px solid rgba(15,23,42,0.1);
                padding: 18px 18px 16px;
                animation: deepfocusReminderIn 140ms ease-out;
            }
            .head {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            .icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #eef2ff;
                font-size: 18px;
            }
            .title {
                font-size: 19px;
                font-weight: 700;
                line-height: 1.25;
            }
            .msg {
                font-size: 14px;
                line-height: 1.45;
                margin-bottom: 16px;
                color: #334155;
            }
            .actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
            }
            .btn {
                border-radius: 9px;
                padding: 8px 14px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                line-height: 1;
            }
            .btn-end {
                border: 1px solid #d1d5db;
                background: #ffffff;
                color: #111827;
            }
            .btn-dismiss {
                border: 0;
                background: #111827;
                color: #ffffff;
            }
            @keyframes deepfocusReminderIn {
                from { transform: translateY(8px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
        <div class="overlay" id="overlay">
            <div class="card" role="dialog" aria-live="assertive">
                <div class="head">
                    <div class="icon" id="icon"></div>
                    <div class="title" id="title"></div>
                </div>
                <div class="msg" id="msg"></div>
                <div class="actions">
                    <button class="btn btn-end" id="endBtn">End Session</button>
                    <button class="btn btn-dismiss" id="dismissBtn">Dismiss</button>
                </div>
            </div>
        </div>
    `

    const overlay = shadow.getElementById("overlay")
    const iconEl = shadow.getElementById("icon")
    const titleEl = shadow.getElementById("title")
    const msgEl = shadow.getElementById("msg")
    const endBtn = shadow.getElementById("endBtn")
    const dismissBtn = shadow.getElementById("dismissBtn")

    iconEl.textContent = icon
    titleEl.textContent = title
    msgEl.textContent = message

    endBtn.onclick = () => {
        try {
            chrome.runtime.sendMessage({ type: "REMINDER_END_SESSION" })
        } catch (_e) {
            // no-op
        }
        host.remove()
        reminderModal = null
    }

    dismissBtn.onclick = () => {
        try {
            chrome.runtime.sendMessage({ type: "REMINDER_DISMISS" })
        } catch (_e) {
            // no-op
        }
        host.remove()
        reminderModal = null
    }

    overlay.addEventListener("click", (e) => {
        if (e.target !== overlay) return
        try {
            chrome.runtime.sendMessage({ type: "REMINDER_DISMISS" })
        } catch (_e) {
            // no-op
        }
        host.remove()
        reminderModal = null
    })

    document.documentElement.appendChild(host)
    reminderModal = host
}

function renderFromState() {
    if (!currentState) {
        if (hydrated) setHiddenBox()
        return
    }

    applyAdaptiveTheme()

    let seconds = 0
    if (currentState.isPaused) {
        seconds = Math.ceil((currentState.remainingMs || 0) / 1000)
    } else {
        seconds = Math.ceil((currentState.endTime - Date.now()) / 1000)
    }
    if (seconds < 0) seconds = 0

    const modeChanged = currentState.mode !== lastMode

    let displaySeconds = 0
    if (!currentState.inTransition) {
        displaySeconds = modeChanged ? 0 : seconds
    }

    const m = Math.floor(displaySeconds / 60)
    const s = displaySeconds % 60

    const modeLabel = currentState.mode === "focus" ? "\uD83C\uDFAF FOCUS" : "\u2615 BREAK"

    box.textContent =
        modeLabel +
        " " +
        m + ":" + s.toString().padStart(2, "0")

    box.style.opacity = "1"

    const transitionStarted = currentState.inTransition && !lastInTransition

    if (currentState.inTransition) {
        if (transitionStarted) {
            emitAudio("DING", currentState.mode, seconds, true)
        }
        lastSecond = null
    } else if (seconds !== lastSecond) {
        if (transitionStarted || seconds === 0) {
            emitAudio("DING", currentState.mode, seconds, false)
        }

        if ((seconds <= 10 && seconds >= 1) ||
            (lastSecond !== null && lastSecond > 10 && seconds < 10)) {
            emitAudio("TICK", currentState.mode, seconds, false)
        }

        lastSecond = seconds
    }

    lastMode = currentState.mode
    lastInTransition = currentState.inTransition
}

function syncTimerState() {
    if (!hasRuntime()) return

    try {
        chrome.runtime.sendMessage({ type: "GET_TIMER_STATE" }, (state) => {
            if (!hasRuntime()) return
            if (chrome.runtime.lastError) {
                if (chrome.runtime.lastError.message &&
                    chrome.runtime.lastError.message.includes("Extension context invalidated")) {
                    markExtensionDead()
                }
                return
            }
            if (!state) return
            handleTimerMessage(state)
            renderFromState()
        })
    } catch (_e) {
        markExtensionDead()
    }
}

chrome.runtime.onMessage.addListener((msg) => {
    if (!hasRuntime()) return
    handleTimerMessage(msg)
    renderFromState()
})

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        reportActivity()
        syncTimerState()
    }
})

window.addEventListener("focus", () => {
    reportActivity()
    syncTimerState()
})

function startRenderer() {
    if (renderTimer) return
    renderTimer = setInterval(() => {
        renderFromState()
    }, 200)
}

window.addEventListener("resize", () => {
    const left = parseFloat(box.style.left || "0")
    const top = parseFloat(box.style.top || "0")
    setBoxPosition(left, top)
    lastThemeUpdateAt = 0
    applyAdaptiveTheme()
    updateNightWorkOverlay()
})

window.addEventListener("scroll", () => {
    lastThemeUpdateAt = 0
    applyAdaptiveTheme()
    updateNightWorkOverlay()
}, { passive: true })

box.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    startDrag(e.clientX, e.clientY)
})

document.addEventListener("mousemove", (e) => {
    reportActivity()
    dragMove(e.clientX, e.clientY)
})

document.addEventListener("mouseup", () => {
    endDrag()
})

box.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return
    const t = e.touches[0]
    startDrag(t.clientX, t.clientY)
}, { passive: true })

document.addEventListener("touchmove", (e) => {
    reportActivity()
    if (!e.touches.length) return
    const t = e.touches[0]
    dragMove(t.clientX, t.clientY)
}, { passive: true })

document.addEventListener("touchend", () => {
    endDrag()
})

loadBoxPosition()
startRenderer()
syncTimerState()
setInterval(updateNightWorkOverlay, 30000)
setInterval(reportActivity, 30000)
reportActivity()

document.addEventListener("keydown", reportActivity, { passive: true })
document.addEventListener("mousedown", reportActivity, { passive: true })
document.addEventListener("scroll", reportActivity, { passive: true })

if (hasRuntime() && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return
        if (!changes[BOX_POS_KEY]) return
        if (isDragging) return

        const next = changes[BOX_POS_KEY].newValue
        if (next && typeof next.x === "number" && typeof next.y === "number") {
            setBoxPosition(next.x, next.y)
            lastThemeUpdateAt = 0
            applyAdaptiveTheme()
        }
    })
}

})();
