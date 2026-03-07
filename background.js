const STORAGE_KEY = "deepfocusState"
const ALARM_NAME = "deepfocusTimerAlarm"
const LUNCH_ALARM_NAME = "deepfocusLunchAlarm"
const DINNER_ALARM_NAME = "deepfocusDinnerAlarm"
const REMINDER_HEARTBEAT_ALARM = "deepfocusReminderHeartbeat"
const OFFSCREEN_URL = "offscreen.html"
const LUNCH_NOTIFICATION_ID = "deepfocusLunchNotification"
const DINNER_NOTIFICATION_ID = "deepfocusDinnerNotification"

let endTime = null
let mode = "focus"
let inTransition = false
let remainingMs = null
let isPaused = false

let focusMinutes = 25
let breakMinutes = 5
let soundEnabled = true
let nightWorkEnabled = false
let nightWorkSmart = true
let nightWorkStrength = 38
let idleAutoPauseEnabled = true
let idleAutoPauseMinutes = 5
let lastActivityAt = Date.now()
let distractionMuteEnabled = true
let distractionDomains = [
    "youtube.com",
    "facebook.com",
    "reddit.com",
    "x.com",
    "instagram.com",
    "tiktok.com"
]
let mutedByDeepFocusTabIds = {}
let breakVisualEnabled = false
let breakVisualTabId = null
let dailyFocusGoal = 6
let todayFocusSessions = 0
let streakDays = 0
let progressDateKey = ""
let meetingAutoPauseEnabled = true
let pauseReason = "manual"
let lunchReminderEnabled = false
let lunchReminderTime = "12:00"
let dinnerReminderEnabled = false
let dinnerReminderTime = "19:00"
let lastLunchReminderMinuteKey = ""
let lastDinnerReminderMinuteKey = ""
let lastAudioEventAt = 0
let lastAudioEventKey = ""
let lastTickAt = 0
let lastDingAt = 0

let stateReadyResolve
const stateReady = new Promise((resolve) => {
    stateReadyResolve = resolve
})

loadState(() => {
    checkDailyProgressRollover()
    scheduleAlarm()
    scheduleReminderAlarms()
    scheduleReminderHeartbeat()
    reinjectContentScripts()
    ensureOffscreenDocument()
    applyDistractionMuting()
    checkMeetingActivity()
    stateReadyResolve()
})

chrome.runtime.onInstalled.addListener(() => {
    scheduleReminderAlarms()
    scheduleReminderHeartbeat()
    reinjectContentScripts()
    ensureOffscreenDocument()
})

chrome.runtime.onStartup.addListener(() => {
    scheduleReminderAlarms()
    scheduleReminderHeartbeat()
    reinjectContentScripts()
    ensureOffscreenDocument()
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    stateReady.then(() => {
        if (msg.type === "START_TIMER") {
            handleStartTimer(msg.focus, msg.break)
            send("UPDATE")
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "PAUSE_TIMER") {
            handlePauseTimer()
            send("UPDATE")
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "RESUME_TIMER") {
            handleResumeTimer()
            send("UPDATE")
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "RESET_TIMER") {
            handleResetTimer(true)
            send("RESET")
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "GET_TIMER_STATE") {
            sendResponse(getStateMessage())
            return
        }

        if (msg.type === "UPDATE_REMINDER_SETTINGS") {
            lunchReminderEnabled = !!msg.lunchEnabled
            dinnerReminderEnabled = !!msg.dinnerEnabled

            if (isValidTimeString(msg.lunchTime)) {
                lunchReminderTime = msg.lunchTime
            }
            if (isValidTimeString(msg.dinnerTime)) {
                dinnerReminderTime = msg.dinnerTime
            }

            persistState()
            scheduleReminderAlarms()
            scheduleReminderHeartbeat()
            checkReminderByClock()
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "UPDATE_AUDIO_SETTINGS") {
            soundEnabled = msg.soundEnabled !== false
            persistState()
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "UPDATE_ADVANCED_SETTINGS") {
            nightWorkEnabled = !!msg.nightWorkEnabled
            nightWorkSmart = msg.nightWorkSmart !== false
            if (typeof msg.nightWorkStrength === "number") {
                nightWorkStrength = Math.max(10, Math.min(75, Math.round(msg.nightWorkStrength)))
            }
            idleAutoPauseEnabled = msg.idleAutoPauseEnabled !== false
            if (typeof msg.idleAutoPauseMinutes === "number") {
                idleAutoPauseMinutes = Math.max(1, Math.min(60, Math.round(msg.idleAutoPauseMinutes)))
            }
            distractionMuteEnabled = msg.distractionMuteEnabled !== false
            if (Array.isArray(msg.distractionDomains)) {
                distractionDomains = sanitizeDomainList(msg.distractionDomains)
            }
            breakVisualEnabled = !!msg.breakVisualEnabled
            if (typeof msg.dailyFocusGoal === "number") {
                dailyFocusGoal = Math.max(1, Math.min(20, Math.round(msg.dailyFocusGoal)))
            }
            meetingAutoPauseEnabled = msg.meetingAutoPauseEnabled !== false
            if (!breakVisualEnabled) {
                closeBreakVisualTab()
            } else if (isWorkSessionRunning() && mode === "break" && !inTransition) {
                openBreakVisualTab()
            }
            persistState()
            broadcastAdvancedSettings()
            applyDistractionMuting()
            checkMeetingActivity()
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "USER_ACTIVITY_PING") {
            lastActivityAt = Date.now()
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "AUDIO_EVENT") {
            playGlobalAudio(msg)
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "REMINDER_DISMISS") {
            broadcastToTabs({ type: "HIDE_REMINDER_POPUP" })
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "REMINDER_END_SESSION") {
            handleResetTimer(true)
            send("RESET")
            broadcastToTabs({ type: "HIDE_REMINDER_POPUP" })
            sendResponse({ ok: true })
            return
        }

        sendResponse({ ok: true })
    })

    return true
})

chrome.commands.onCommand.addListener((command) => {
    stateReady.then(() => {
        if (command === "start-timer") {
            handleStartTimer(focusMinutes, breakMinutes)
            send("UPDATE")
            return
        }

        if (command === "pause-resume") {
            if (!endTime) return
            if (isPaused) {
                handleResumeTimer()
            } else {
                handlePauseTimer()
            }
            send("UPDATE")
            return
        }

        if (command === "reset-timer") {
            handleResetTimer(true)
            send("RESET")
        }
    })
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
    stateReady.then(() => {
        checkMeetingActivity()
        applyDistractionMuting()
        const msg = getStateMessage()
        sendToTab(tabId, msg.type)
    })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== "complete") return

    stateReady.then(() => {
        checkMeetingActivity()
        applyDistractionMuting()
        const msg = getStateMessage()
        sendToTab(tabId, msg.type)
    })
})

chrome.tabs.onRemoved.addListener((tabId) => {
    if (mutedByDeepFocusTabIds[tabId]) {
        delete mutedByDeepFocusTabIds[tabId]
    }
    if (breakVisualTabId === tabId) {
        breakVisualTabId = null
    }
})

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === LUNCH_ALARM_NAME) {
        if (shouldFireReminderNow("lunch", new Date())) {
            fireReminder("lunch")
        }
        scheduleReminderAlarm("lunch")
        return
    }

    if (alarm.name === DINNER_ALARM_NAME) {
        if (shouldFireReminderNow("dinner", new Date())) {
            fireReminder("dinner")
        }
        scheduleReminderAlarm("dinner")
        return
    }

    if (alarm.name === REMINDER_HEARTBEAT_ALARM) {
        checkDailyProgressRollover()
        checkReminderByClock()
        checkIdleAutoPause()
        checkMeetingActivity()
        applyDistractionMuting()
        return
    }

    if (alarm.name !== ALARM_NAME) return

    stateReady.then(() => {
        if (!endTime || isPaused) return

        const now = Date.now()
        if (now + 20 < endTime) {
            scheduleAlarm()
            return
        }

        if (!inTransition) {
            inTransition = true
            endTime = now + 1000
        } else {
            inTransition = false
            if (mode === "focus") {
                incrementFocusProgress()
                mode = "break"
                endTime = now + breakMinutes * 60000
                openBreakVisualTab()
            } else {
                mode = "focus"
                endTime = now + focusMinutes * 60000
                closeBreakVisualTab()
            }
        }

        persistState()
        scheduleAlarm()
        applyDistractionMuting()
        send("UPDATE")
    })
})

chrome.notifications.onButtonClicked.addListener((notificationId) => {
    if (notificationId === LUNCH_NOTIFICATION_ID || notificationId === DINNER_NOTIFICATION_ID) {
        chrome.notifications.clear(notificationId)
    }
})

function send(type) {
    chrome.tabs.query({}, (tabs) => {
        if (!tabs.length) return

        tabs.forEach((tab) => {
            if (!tab.id) return
            sendToTab(tab.id, type)
        })
    })
}

function sendToTab(tabId, type) {
    chrome.tabs.sendMessage(
        tabId,
        buildPayload(type),
        () => {
            if (chrome.runtime.lastError) {
                return
            }
        }
    )
}

function buildPayload(type) {
    return {
        type,
        mode,
        endTime,
        inTransition,
        isPaused,
        pauseReason,
        remainingMs,
        focusMinutes,
        breakMinutes,
        soundEnabled,
        nightWorkEnabled,
        nightWorkSmart,
        nightWorkStrength,
        idleAutoPauseEnabled,
        idleAutoPauseMinutes,
        distractionMuteEnabled,
        distractionDomains,
        breakVisualEnabled,
        dailyFocusGoal,
        todayFocusSessions,
        streakDays,
        progressDateKey,
        meetingAutoPauseEnabled,
        lunchReminderEnabled,
        lunchReminderTime,
        dinnerReminderEnabled,
        dinnerReminderTime
    }
}

function getStateMessage() {
    if (!endTime) {
        return buildPayload("RESET")
    }

    return buildPayload("UPDATE")
}

function scheduleAlarm() {
    clearAlarm(() => {
        if (!endTime || isPaused) return

        const when = Math.max(Date.now() + 10, endTime)
        chrome.alarms.create(ALARM_NAME, { when })
    })
}

function clearAlarm(cb) {
    chrome.alarms.clear(ALARM_NAME, () => {
        if (cb) cb()
    })
}

function persistState() {
    chrome.storage.local.set({
        [STORAGE_KEY]: {
            endTime,
            mode,
            inTransition,
            remainingMs,
            isPaused,
            pauseReason,
            focusMinutes,
            breakMinutes,
            soundEnabled,
            nightWorkEnabled,
            nightWorkSmart,
            nightWorkStrength,
            idleAutoPauseEnabled,
            idleAutoPauseMinutes,
            lastActivityAt,
            distractionMuteEnabled,
            distractionDomains,
            mutedByDeepFocusTabIds,
            breakVisualEnabled,
            breakVisualTabId,
            dailyFocusGoal,
            todayFocusSessions,
            streakDays,
            progressDateKey,
            meetingAutoPauseEnabled,
            lunchReminderEnabled,
            lunchReminderTime,
            dinnerReminderEnabled,
            dinnerReminderTime,
            lastLunchReminderMinuteKey,
            lastDinnerReminderMinuteKey
        }
    })
}

function loadState(done) {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
        const state = result[STORAGE_KEY]
        if (!state) {
            done()
            return
        }

        endTime = state.endTime ?? null
        mode = state.mode ?? "focus"
        inTransition = !!state.inTransition
        remainingMs = state.remainingMs ?? null
        isPaused = !!state.isPaused
        pauseReason = typeof state.pauseReason === "string" ? state.pauseReason : "manual"
        focusMinutes = state.focusMinutes ?? 25
        breakMinutes = state.breakMinutes ?? 5
        soundEnabled = state.soundEnabled !== false
        nightWorkEnabled = !!state.nightWorkEnabled
        nightWorkSmart = state.nightWorkSmart !== false
        if (typeof state.nightWorkStrength === "number") {
            nightWorkStrength = Math.max(10, Math.min(75, Math.round(state.nightWorkStrength)))
        }
        idleAutoPauseEnabled = state.idleAutoPauseEnabled !== false
        if (typeof state.idleAutoPauseMinutes === "number") {
            idleAutoPauseMinutes = Math.max(1, Math.min(60, Math.round(state.idleAutoPauseMinutes)))
        }
        if (typeof state.lastActivityAt === "number" && state.lastActivityAt > 0) {
            lastActivityAt = state.lastActivityAt
        }
        distractionMuteEnabled = state.distractionMuteEnabled !== false
        if (Array.isArray(state.distractionDomains)) {
            distractionDomains = sanitizeDomainList(state.distractionDomains)
        }
        if (state.mutedByDeepFocusTabIds && typeof state.mutedByDeepFocusTabIds === "object") {
            mutedByDeepFocusTabIds = state.mutedByDeepFocusTabIds
        }
        breakVisualEnabled = !!state.breakVisualEnabled
        breakVisualTabId = typeof state.breakVisualTabId === "number" ? state.breakVisualTabId : null
        if (typeof state.dailyFocusGoal === "number") {
            dailyFocusGoal = Math.max(1, Math.min(20, Math.round(state.dailyFocusGoal)))
        }
        if (typeof state.todayFocusSessions === "number") {
            todayFocusSessions = Math.max(0, Math.round(state.todayFocusSessions))
        }
        if (typeof state.streakDays === "number") {
            streakDays = Math.max(0, Math.round(state.streakDays))
        }
        progressDateKey = typeof state.progressDateKey === "string" ? state.progressDateKey : ""
        meetingAutoPauseEnabled = state.meetingAutoPauseEnabled !== false
        lunchReminderEnabled = !!state.lunchReminderEnabled
        lunchReminderTime = isValidTimeString(state.lunchReminderTime) ? state.lunchReminderTime : "12:00"
        dinnerReminderEnabled = !!state.dinnerReminderEnabled
        dinnerReminderTime = isValidTimeString(state.dinnerReminderTime) ? state.dinnerReminderTime : "19:00"
        lastLunchReminderMinuteKey = typeof state.lastLunchReminderMinuteKey === "string" ? state.lastLunchReminderMinuteKey : ""
        lastDinnerReminderMinuteKey = typeof state.lastDinnerReminderMinuteKey === "string" ? state.lastDinnerReminderMinuteKey : ""

        done()
    })
}

function resetState() {
    endTime = null
    mode = "focus"
    inTransition = false
    remainingMs = null
    isPaused = false
    pauseReason = "manual"
}

function handleStartTimer(nextFocusMinutes, nextBreakMinutes) {
    if (typeof nextFocusMinutes === "number") focusMinutes = nextFocusMinutes
    if (typeof nextBreakMinutes === "number") breakMinutes = nextBreakMinutes

    mode = "focus"
    inTransition = false
    isPaused = false
    pauseReason = "manual"
    remainingMs = null
    endTime = Date.now() + focusMinutes * 60000
    lastActivityAt = Date.now()

    persistState()
    scheduleAlarm()
    scheduleReminderAlarms()
    ensureOffscreenDocument()
    checkDailyProgressRollover()
    applyDistractionMuting()
    closeBreakVisualTab()
    checkMeetingActivity()
}

function handlePauseTimer(reason = "manual") {
    if (!endTime || isPaused) return

    remainingMs = Math.max(0, endTime - Date.now())
    isPaused = true
    pauseReason = reason

    persistState()
    clearAlarm()
    scheduleReminderAlarms()
    applyDistractionMuting()
}

function handleResumeTimer() {
    if (!isPaused || remainingMs === null) return

    endTime = Date.now() + remainingMs
    remainingMs = null
    isPaused = false
    pauseReason = "manual"
    lastActivityAt = Date.now()

    persistState()
    scheduleAlarm()
    scheduleReminderAlarms()
    ensureOffscreenDocument()
    applyDistractionMuting()
}

function handleResetTimer(resetDurations) {
    resetState()
    if (resetDurations) {
        focusMinutes = 25
        breakMinutes = 5
    }
    persistState()
    clearAlarm()
    scheduleReminderAlarms()
    closeBreakVisualTab()
    applyDistractionMuting()
}

function reinjectContentScripts() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.id || !isInjectableUrl(tab.url)) return
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    files: ["content.js"]
                },
                () => {
                    if (chrome.runtime.lastError) {
                        return
                    }
                }
            )
        })
    })
}

function isInjectableUrl(url) {
    if (!url) return false
    return url.startsWith("http://") || url.startsWith("https://")
}

function isValidTimeString(value) {
    if (typeof value !== "string") return false
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

function sanitizeDomainList(list) {
    const cleaned = list
        .map((v) => String(v || "").trim().toLowerCase())
        .map((v) => v.replace(/^https?:\/\//, ""))
        .map((v) => v.replace(/^www\./, ""))
        .map((v) => v.split("/")[0])
        .map((v) => v === "twitter.com" ? "x.com" : v)
        .filter((v) => !!v)
    return Array.from(new Set(cleaned)).slice(0, 40)
}

function tabMatchesDistraction(url) {
    if (!url || !isInjectableUrl(url)) return false
    try {
        const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "")
        return distractionDomains.some((d) => host === d || host.endsWith(`.${d}`))
    } catch (_e) {
        return false
    }
}

function applyDistractionMuting() {
    const shouldMute = distractionMuteEnabled && isWorkSessionRunning() && mode === "focus" && !inTransition
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.id) return
            const isTarget = tabMatchesDistraction(tab.url)
            const managed = !!mutedByDeepFocusTabIds[tab.id]

            if (shouldMute && isTarget) {
                if (!tab.mutedInfo || !tab.mutedInfo.muted) {
                    chrome.tabs.update(tab.id, { muted: true }, () => {
                        if (chrome.runtime.lastError) return
                    })
                }
                mutedByDeepFocusTabIds[tab.id] = true
                return
            }

            if (managed) {
                chrome.tabs.update(tab.id, { muted: false }, () => {
                    if (chrome.runtime.lastError) return
                })
                delete mutedByDeepFocusTabIds[tab.id]
            }
        })
    })
}

function openBreakVisualTab() {
    if (!breakVisualEnabled) return

    if (breakVisualTabId) {
        chrome.tabs.get(breakVisualTabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                breakVisualTabId = null
                openBreakVisualTab()
                return
            }
            chrome.tabs.update(breakVisualTabId, { active: true }, () => {
                if (chrome.runtime.lastError) return
            })
        })
        return
    }

    chrome.tabs.create({ url: chrome.runtime.getURL("relax.html"), active: true }, (tab) => {
        if (chrome.runtime.lastError || !tab || !tab.id) return
        breakVisualTabId = tab.id
        persistState()
    })
}

function closeBreakVisualTab() {
    if (!breakVisualTabId) return
    const closingTabId = breakVisualTabId
    breakVisualTabId = null
    chrome.tabs.remove(closingTabId, () => {
        if (chrome.runtime.lastError) return
    })
}

function checkDailyProgressRollover() {
    const todayKey = getLocalDateKey(new Date())
    if (!progressDateKey) {
        progressDateKey = todayKey
        persistState()
        return
    }

    if (progressDateKey === todayKey) return

    if (todayFocusSessions >= dailyFocusGoal) {
        streakDays += 1
    } else {
        streakDays = 0
    }

    todayFocusSessions = 0
    progressDateKey = todayKey
    persistState()
}

function incrementFocusProgress() {
    checkDailyProgressRollover()
    todayFocusSessions += 1
    persistState()
}

function isMeetingTabUrl(url) {
    if (!url || !isInjectableUrl(url)) return false
    const u = url.toLowerCase()
    return u.includes("meet.google.com") || u.includes("zoom.us") || u.includes("teams.microsoft.com")
}

function checkMeetingActivity() {
    if (!meetingAutoPauseEnabled) {
        if (isPaused && pauseReason === "meeting") {
            handleResumeTimer()
            send("UPDATE")
        }
        return
    }

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs && tabs.length ? tabs[0] : null
        const meetingActive = !!(activeTab && isMeetingTabUrl(activeTab.url))

        if (meetingActive && isWorkSessionRunning()) {
            handlePauseTimer("meeting")
            send("UPDATE")
            return
        }

        if (!meetingActive && isPaused && pauseReason === "meeting" && endTime) {
            handleResumeTimer()
            send("UPDATE")
        }
    })
}

function getNextReminderTimestamp(timeStr) {
    const [hourStr, minuteStr] = timeStr.split(":")
    const hour = Number(hourStr)
    const minute = Number(minuteStr)
    const now = new Date()
    const next = new Date()
    next.setHours(hour, minute, 0, 0)
    if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1)
    }
    return next.getTime()
}

function scheduleReminderAlarms() {
    scheduleReminderAlarm("lunch")
    scheduleReminderAlarm("dinner")
}

function scheduleReminderAlarm(kind) {
    const isLunch = kind === "lunch"
    const enabled = isLunch ? lunchReminderEnabled : dinnerReminderEnabled
    const alarmName = isLunch ? LUNCH_ALARM_NAME : DINNER_ALARM_NAME
    const time = isLunch ? lunchReminderTime : dinnerReminderTime

    chrome.alarms.clear(alarmName, () => {
        if (!isWorkSessionRunning()) return
        if (!enabled || !isValidTimeString(time)) return
        chrome.alarms.create(alarmName, { when: getNextReminderTimestamp(time) })
    })
}

function showBreakNotification(kind) {
    const isLunch = kind === "lunch"
    const notificationId = isLunch ? LUNCH_NOTIFICATION_ID : DINNER_NOTIFICATION_ID
    const title = isLunch ? "\uD83C\uDF5C Lunch Break Reminder" : "\uD83C\uDF19 Evening Break Reminder"
    const message = isLunch
        ? "It's time to pause and take your scheduled lunch break."
        : "It's time to wrap up and take your evening break."

    chrome.notifications.create(notificationId, {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title,
        message,
        priority: 2,
        buttons: [{ title: "Dismiss" }]
    })
}

function sendBrowserReminder(kind) {
    const payload = kind === "lunch"
        ? {
            type: "SHOW_REMINDER_POPUP",
            icon: "\uD83C\uDF5C",
            title: "Lunch Break Reminder",
            message: "It's time to pause and take your scheduled lunch break."
        }
        : {
            type: "SHOW_REMINDER_POPUP",
            icon: "\uD83C\uDF19",
            title: "Evening Break Reminder",
            message: "It's time to wrap up and take your evening break."
        }

    broadcastToTabs(payload)
}

function broadcastToTabs(payload) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.id) return
            chrome.tabs.sendMessage(tab.id, payload, () => {
                if (chrome.runtime.lastError) return
            })
        })
    })
}

function broadcastAdvancedSettings() {
    broadcastToTabs({
        type: "ADVANCED_SETTINGS_UPDATED",
        nightWorkEnabled,
        nightWorkSmart,
        nightWorkStrength,
        idleAutoPauseEnabled,
        idleAutoPauseMinutes,
        distractionMuteEnabled,
        distractionDomains,
        breakVisualEnabled,
        dailyFocusGoal,
        todayFocusSessions,
        streakDays,
        meetingAutoPauseEnabled
    })
}

function checkIdleAutoPause() {
    if (!idleAutoPauseEnabled) return
    if (!isWorkSessionRunning()) return

    const thresholdMs = Math.max(1, idleAutoPauseMinutes) * 60000
    if (Date.now() - lastActivityAt < thresholdMs) return

    handlePauseTimer("idle")
    send("UPDATE")
}

function scheduleReminderHeartbeat() {
    chrome.alarms.create(REMINDER_HEARTBEAT_ALARM, {
        periodInMinutes: 1
    })
}

function getLocalDateKey(dateObj) {
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, "0")
    const d = String(dateObj.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function shouldFireReminderNow(kind, now) {
    if (!isWorkSessionRunning()) return false

    const isLunch = kind === "lunch"
    const enabled = isLunch ? lunchReminderEnabled : dinnerReminderEnabled
    const timeStr = isLunch ? lunchReminderTime : dinnerReminderTime

    if (!enabled || !isValidTimeString(timeStr)) return false

    const [hourStr, minuteStr] = timeStr.split(":")
    const hour = Number(hourStr)
    const minute = Number(minuteStr)
    if (now.getHours() !== hour || now.getMinutes() !== minute) return false

    const minuteKey = `${getLocalDateKey(now)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    if (isLunch) return lastLunchReminderMinuteKey !== minuteKey
    return lastDinnerReminderMinuteKey !== minuteKey
}

function getCurrentMinuteKey(now) {
    return `${getLocalDateKey(now)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

function fireReminder(kind) {
    const now = new Date()
    const minuteKey = getCurrentMinuteKey(now)
    if (kind === "lunch") {
        lastLunchReminderMinuteKey = minuteKey
    } else {
        lastDinnerReminderMinuteKey = minuteKey
    }
    persistState()
    showBreakNotification(kind)
    sendBrowserReminder(kind)
}

function checkReminderByClock() {
    const now = new Date()
    if (shouldFireReminderNow("lunch", now)) {
        fireReminder("lunch")
        scheduleReminderAlarm("lunch")
    }
    if (shouldFireReminderNow("dinner", now)) {
        fireReminder("dinner")
        scheduleReminderAlarm("dinner")
    }
}

function isWorkSessionRunning() {
    return !!endTime && !isPaused
}

async function ensureOffscreenDocument() {
    if (!chrome.offscreen || !chrome.offscreen.createDocument) return

    try {
        if (chrome.offscreen.hasDocument) {
            const hasDoc = await chrome.offscreen.hasDocument()
            if (hasDoc) return
        }

        await chrome.offscreen.createDocument({
            url: OFFSCREEN_URL,
            reasons: ["AUDIO_PLAYBACK"],
            justification: "Play timer sounds globally for DeepFocus."
        })
    } catch (_e) {
        return
    }
}

function playGlobalAudio(msg) {
    const eventType = msg.eventType === "DING" ? "DING" : "TICK"
    const key = `${eventType}:${msg.mode || ""}:${msg.seconds || 0}:${msg.inTransition ? 1 : 0}`
    const now = Date.now()

    if (!soundEnabled) {
        return
    }

    // hard dedupe by exact event signature across all tabs
    if (key === lastAudioEventKey && now - lastAudioEventAt < 1500) {
        return
    }

    // soft dedupe by event type to prevent overlap from near-simultaneous tabs
    if (eventType === "TICK" && now - lastTickAt < 700) {
        return
    }
    if (eventType === "DING" && now - lastDingAt < 1200) {
        return
    }

    lastAudioEventKey = key
    lastAudioEventAt = now
    if (eventType === "TICK") lastTickAt = now
    if (eventType === "DING") lastDingAt = now

    ensureOffscreenDocument().then(() => {
        chrome.runtime.sendMessage({
            type: eventType === "DING" ? "PLAY_DING" : "PLAY_TICK"
        })
    })
}
