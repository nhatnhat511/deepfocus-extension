const STORAGE_KEY = "deepfocusState"
const BREAK_VISUAL_BG_KEY = "deepfocusBreakVisualBackground"
const BREAK_VISUAL_BG_META_KEY = "deepfocusBreakVisualBackgroundMeta"
const ALARM_NAME = "deepfocusTimerAlarm"
const LUNCH_ALARM_NAME = "deepfocusLunchAlarm"
const DINNER_ALARM_NAME = "deepfocusDinnerAlarm"
const REMINDER_HEARTBEAT_ALARM = "deepfocusReminderHeartbeat"
const SOUND_CUE_ALARM_NAME = "deepfocusSoundCueAlarm"
const OFFSCREEN_URL = "offscreen.html"
const LUNCH_NOTIFICATION_ID = "deepfocusLunchNotification"
const DINNER_NOTIFICATION_ID = "deepfocusDinnerNotification"
const ACCOUNT_STATUS_KEY = "deepfocusAccountStatus"
const AUTH_STORAGE_KEY = "deepfocusSupabaseSession"
const ACCOUNT_PLANS = new Set(["free", "trial", "premium_monthly", "premium_yearly"])
const PREMIUM_PLANS = new Set(["trial", "premium_monthly", "premium_yearly"])

function normalizeAccountPlan(value) {
    if (typeof value !== "string") return "free"
    const plan = value.toLowerCase()
    if (plan === "premium") return "premium_monthly"
    return ACCOUNT_PLANS.has(plan) ? plan : "free"
}

function isPremiumPlan(plan) {
    return PREMIUM_PLANS.has(plan)
}

let endTime = null
let mode = "focus"
let inTransition = false
let remainingMs = null
let isPaused = false

let focusMinutes = 25
let breakMinutes = 5
let soundEnabled = true
let nightWorkEnabled = false
let nightWorkStrength = 38
let focusBlurEnabled = false
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
let breakReturnTabId = null
let dailyFocusGoal = 6
let todayFocusSessions = 0
let streakDays = 0
let progressDateKey = ""
let statsDailyHistory = {}
let statsHourBuckets = Array(24).fill(0)
let statsInterruptions = {
    idlePause: 0,
    meetingPause: 0,
    manualReset: 0
}
let statsInterruptionDaily = {}
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
let currentIdleState = "active"
let accountPlan = "free"
let premiumUntil = ""
let premiumPromptedAt = 0
let premiumVerifiedAt = 0
let premiumVerifiedOk = false
let lastPlayedTickSecond = null
let loginTabId = null
let loginExtRedirect = null

let stateReadyResolve
const stateReady = new Promise((resolve) => {
    stateReadyResolve = resolve
})

loadState(() => {
    initIdleDetection()
    checkDailyProgressRollover()
    scheduleAlarm()
    scheduleSoundCues()
    scheduleReminderAlarms()
    scheduleReminderHeartbeat()
    reinjectContentScripts()
    ensureOffscreenDocument()
    applyDistractionMuting()
    checkMeetingActivity()
    stateReadyResolve()
})

function extractAuthParams(urlString) {
    const parsed = new URL(urlString)
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""))
    const queryParams = new URLSearchParams(parsed.search)
    const merged = new URLSearchParams()
    hashParams.forEach((value, key) => {
        merged.set(key, value)
    })
    queryParams.forEach((value, key) => {
        if (!merged.has(key)) merged.set(key, value)
    })
    return merged
}

function isExtensionRedirectUrl(urlString) {
    const origin = `https://${chrome.runtime.id}.chromiumapp.org/`
    return typeof urlString === "string" && urlString.startsWith(origin)
}

function clearLoginFlow() {
    loginTabId = null
    loginExtRedirect = null
}

function finalizeLoginFromUrl(urlString) {
    const authParams = extractAuthParams(urlString)
    const authError = authParams.get("error_description") || authParams.get("error")
    if (authError) {
        chrome.runtime.sendMessage({ type: "AUTH_SESSION_UPDATED", error: authError }, () => {
            void chrome.runtime.lastError
        })
        return
    }
    const accessToken = authParams.get("access_token")
    if (!accessToken) {
        chrome.runtime.sendMessage({ type: "AUTH_SESSION_UPDATED", error: "Missing access token." }, () => {
            void chrome.runtime.lastError
        })
        return
    }
    const session = {
        access_token: accessToken,
        refresh_token: authParams.get("refresh_token") || "",
        token_type: authParams.get("token_type") || "bearer",
        expires_in: Number(authParams.get("expires_in") || 0),
        expires_at: Number(authParams.get("expires_at") || 0)
    }
    chrome.storage.local.set({ [AUTH_STORAGE_KEY]: session }, () => {
        chrome.runtime.sendMessage({ type: "AUTH_SESSION_UPDATED" }, () => {
            void chrome.runtime.lastError
        })
    })
}

function buildWebsiteSyncUrl(authParams) {
    const params = new URLSearchParams()
    ;["access_token", "refresh_token", "expires_in", "expires_at", "token_type"].forEach((key) => {
        const value = authParams.get(key)
        if (value) params.set(key, value)
    })
    return `https://deepfocustime.com/auth/extension-sync#${params.toString()}`
}

function handleLoginTabUpdate(tabId, changeInfo) {
    if (!changeInfo.url) return
    // If the service worker restarted, loginTabId may be lost. Still capture
    // extension redirects to persist the session.
    if (isExtensionRedirectUrl(changeInfo.url)) {
        const authParams = extractAuthParams(changeInfo.url)
        finalizeLoginFromUrl(changeInfo.url)
        chrome.tabs.update(tabId, { url: buildWebsiteSyncUrl(authParams) }, () => undefined)
        clearLoginFlow()
        return
    }
    if (!loginTabId || tabId !== loginTabId) return
    if (loginExtRedirect && changeInfo.url.startsWith(loginExtRedirect)) {
        const authParams = extractAuthParams(changeInfo.url)
        finalizeLoginFromUrl(changeInfo.url)
        chrome.tabs.update(tabId, { url: buildWebsiteSyncUrl(authParams) }, () => undefined)
        clearLoginFlow()
    }
}

function handleLoginTabClosed(tabId) {
    if (loginTabId && tabId === loginTabId) {
        clearLoginFlow()
    }
}

chrome.tabs.onUpdated.addListener(handleLoginTabUpdate)
chrome.tabs.onRemoved.addListener(handleLoginTabClosed)

chrome.runtime.onInstalled.addListener((details) => {
    initIdleDetection()
    scheduleSoundCues()
    scheduleReminderAlarms()
    scheduleReminderHeartbeat()
    reinjectContentScripts()
    ensureOffscreenDocument()
    if (details && details.reason === "install") {
        chrome.tabs.create({ url: "https://deepfocustime.com/blog/deepfocus-time-complete-user-guide" }, () => undefined)
    }
})

chrome.runtime.onStartup.addListener(() => {
    stateReady.then(() => {
        resetStateForBrowserStartup()
        initIdleDetection()
        scheduleSoundCues()
        scheduleReminderAlarms()
        scheduleReminderHeartbeat()
        reinjectContentScripts()
        ensureOffscreenDocument()
    })
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
            scheduleSoundCues()
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "UPDATE_ADVANCED_SETTINGS") {
            const ensurePremium = async () => {
                const maxAge = 10 * 60 * 1000
                if (isPremiumActive() && premiumVerifiedOk && Date.now() - premiumVerifiedAt < maxAge) {
                    return true
                }
                const verify = await verifyPremiumFromServer()
                return verify.ok && verify.premiumActive
            }

            ensurePremium().then((allowed) => {
                if (!allowed) {
                    sendResponse({ ok: false, error: "Premium verification required for Advanced Settings." })
                    return
                }

                nightWorkEnabled = !!msg.nightWorkEnabled
                if (typeof msg.nightWorkStrength === "number") {
                    nightWorkStrength = Math.max(10, Math.min(75, Math.round(msg.nightWorkStrength)))
                }
                focusBlurEnabled = !!msg.focusBlurEnabled
                idleAutoPauseEnabled = msg.idleAutoPauseEnabled !== false
                if (typeof msg.idleAutoPauseMinutes === "number") {
                    idleAutoPauseMinutes = Math.max(1, Math.min(60, Math.round(msg.idleAutoPauseMinutes)))
                }
                if (!idleAutoPauseEnabled && isPaused && pauseReason === "idle" && endTime) {
                    handleResumeTimer()
                }
                distractionMuteEnabled = msg.distractionMuteEnabled !== false
                if (Array.isArray(msg.distractionDomains)) {
                    distractionDomains = sanitizeDomainList(msg.distractionDomains)
                }
                breakVisualEnabled = !!msg.breakVisualEnabled
                if (typeof msg.dailyFocusGoal === "number") {
                    dailyFocusGoal = Math.max(1, Math.min(20, Math.round(msg.dailyFocusGoal)))
                    const todayKey = getLocalDateKey(new Date())
                    ensureDailyHistoryEntry(todayKey)
                    statsDailyHistory[todayKey].goal = dailyFocusGoal
                }
                meetingAutoPauseEnabled = msg.meetingAutoPauseEnabled !== false
                if (!breakVisualEnabled) {
                    closeBreakVisualTab()
                } else if (isWorkSessionRunning() && mode === "break" && !inTransition) {
                    openBreakVisualTab()
                }
                persistState()
                updateIdleDetectionInterval()
                broadcastAdvancedSettings()
                applyDistractionMuting()
                checkMeetingActivity()
                sendResponse({ ok: true })
            })
            return true
        }

        if (msg.type === "START_WEB_LOGIN") {
            const extRedirect = `https://${chrome.runtime.id}.chromiumapp.org/supabase-auth`
            const loginUrl = `https://deepfocustime.com/auth/extension-login?ext_redirect=${encodeURIComponent(extRedirect)}`
            if (loginTabId) {
                chrome.tabs.remove(loginTabId, () => undefined)
                clearLoginFlow()
            }
            chrome.tabs.create({ url: loginUrl, active: true }, (tab) => {
                if (chrome.runtime.lastError || !tab) {
                    sendResponse({ ok: false, error: "Unable to open login tab." })
                    return
                }
                loginTabId = tab.id
                loginExtRedirect = extRedirect
                sendResponse({ ok: true })
            })
            return true
        }

        if (msg.type === "VERIFY_PREMIUM") {
            verifyPremiumFromServer().then((result) => {
                sendResponse(result)
            })
            return true
        }

        if (msg.type === "UPDATE_ACCOUNT_STATUS") {
            if (typeof msg.plan === "string") {
                accountPlan = normalizeAccountPlan(msg.plan)
            }
            premiumUntil = typeof msg.premiumUntil === "string" ? msg.premiumUntil : ""
            if (!isPremiumActive()) {
                enforceFreeTierDefaults()
            }
            // Keep STORAGE_KEY and ACCOUNT_STATUS_KEY aligned so command gating
            // still works after service worker restarts.
            persistState()
            persistAccountStatus()
            scheduleSoundCues()
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "UPDATE_BREAK_VISUAL_BACKGROUND") {
            const dataUrl = typeof msg.dataUrl === "string" ? msg.dataUrl : ""
            const isValidDataUrl = !dataUrl || dataUrl.startsWith("data:image/")
            const metadata = msg.metadata && typeof msg.metadata === "object" ? msg.metadata : null
            if (!isValidDataUrl) {
                sendResponse({ ok: false, error: "Invalid image payload." })
                return
            }
            if (dataUrl.length > 3_200_000) {
                sendResponse({ ok: false, error: "Image is too large. Use a smaller file." })
                return
            }
            const safeMeta = dataUrl
                ? {
                    name: metadata && typeof metadata.name === "string" ? metadata.name.slice(0, 180) : "custom-image",
                    size: metadata && typeof metadata.size === "number" ? Math.max(0, Math.round(metadata.size)) : 0,
                    type: metadata && typeof metadata.type === "string" ? metadata.type.slice(0, 80) : "image",
                    updatedAt: Date.now()
                }
                : null
            chrome.storage.local.set({
                [BREAK_VISUAL_BG_KEY]: dataUrl,
                [BREAK_VISUAL_BG_META_KEY]: safeMeta
            }, () => {
                if (chrome.runtime.lastError) {
                    sendResponse({ ok: false, error: "Unable to save background image." })
                    return
                }
                sendResponse({ ok: true })
            })
            return
        }

        if (msg.type === "USER_ACTIVITY_PING") {
            lastActivityAt = Date.now()
            sendResponse({ ok: true })
            return
        }

        if (msg.type === "AUDIO_EVENT") {
            // Content-script audio events are ignored. Audio is emitted centrally in background.
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
    if (breakReturnTabId === tabId) {
        breakReturnTabId = null
    }
})

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SOUND_CUE_ALARM_NAME) {
        handleSoundCueAlarm()
        return
    }

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
        if (!isPremiumActive()) {
            enforceFreeTierDefaults()
        }
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
            playGlobalAudio({ eventType: "DING", mode, seconds: 0, inTransition: true })
            lastPlayedTickSecond = null
            endTime = now + 1000
        } else {
            inTransition = false
            if (mode === "focus") {
                incrementFocusProgress()
                mode = "break"
                endTime = now + breakMinutes * 60000
                lastPlayedTickSecond = null
                openBreakVisualTab()
            } else {
                mode = "focus"
                endTime = now + focusMinutes * 60000
                lastPlayedTickSecond = null
                closeBreakVisualTab()
            }
        }

        persistState()
        scheduleAlarm()
        scheduleSoundCues()
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
        nightWorkStrength,
        focusBlurEnabled,
        idleAutoPauseEnabled,
        idleAutoPauseMinutes,
        distractionMuteEnabled,
        distractionDomains,
        breakVisualEnabled,
        dailyFocusGoal,
        todayFocusSessions,
        streakDays,
        progressDateKey,
        statsDailyHistory,
        statsHourBuckets,
        statsInterruptions,
        statsInterruptionDaily,
        meetingAutoPauseEnabled,
        lunchReminderEnabled,
        lunchReminderTime,
        dinnerReminderEnabled,
        dinnerReminderTime,
        accountPlan,
        premiumUntil,
        premiumActive: isPremiumActive()
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
            nightWorkStrength,
            focusBlurEnabled,
            idleAutoPauseEnabled,
            idleAutoPauseMinutes,
            lastActivityAt,
            distractionMuteEnabled,
            distractionDomains,
            mutedByDeepFocusTabIds,
            breakVisualEnabled,
            breakVisualTabId,
            breakReturnTabId,
            dailyFocusGoal,
            todayFocusSessions,
            streakDays,
            progressDateKey,
            statsDailyHistory,
            statsHourBuckets,
            statsInterruptions,
            statsInterruptionDaily,
            meetingAutoPauseEnabled,
            lunchReminderEnabled,
            lunchReminderTime,
            dinnerReminderEnabled,
            dinnerReminderTime,
            lastLunchReminderMinuteKey,
            lastDinnerReminderMinuteKey,
            accountPlan,
            premiumUntil
        }
    })
}

function loadState(done) {
    chrome.storage.local.get([STORAGE_KEY, ACCOUNT_STATUS_KEY], (result) => {
        const state = result[STORAGE_KEY]
        const account = result[ACCOUNT_STATUS_KEY]
        const hasAccountStatusOverride = !!(account && typeof account === "object")
        if (account && typeof account === "object") {
            accountPlan = normalizeAccountPlan(account.plan)
            premiumUntil = typeof account.premiumUntil === "string" ? account.premiumUntil : ""
        }
        if (!state) {
            if (!isPremiumActive()) {
                enforceFreeTierDefaults()
            }
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
        if (typeof state.nightWorkStrength === "number") {
            nightWorkStrength = Math.max(10, Math.min(75, Math.round(state.nightWorkStrength)))
        }
        focusBlurEnabled = !!state.focusBlurEnabled
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
        breakReturnTabId = typeof state.breakReturnTabId === "number" ? state.breakReturnTabId : null
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
        if (state.statsDailyHistory && typeof state.statsDailyHistory === "object") {
            statsDailyHistory = sanitizeDailyHistory(state.statsDailyHistory)
        }
        if (Array.isArray(state.statsHourBuckets) && state.statsHourBuckets.length === 24) {
            statsHourBuckets = state.statsHourBuckets.map((v) => Math.max(0, Math.round(Number(v) || 0)))
        }
        if (state.statsInterruptions && typeof state.statsInterruptions === "object") {
            statsInterruptions = {
                idlePause: Math.max(0, Math.round(Number(state.statsInterruptions.idlePause) || 0)),
                meetingPause: Math.max(0, Math.round(Number(state.statsInterruptions.meetingPause) || 0)),
                manualReset: Math.max(0, Math.round(Number(state.statsInterruptions.manualReset) || 0))
            }
        }
        if (state.statsInterruptionDaily && typeof state.statsInterruptionDaily === "object") {
            statsInterruptionDaily = sanitizeInterruptionDaily(state.statsInterruptionDaily)
        }
        meetingAutoPauseEnabled = state.meetingAutoPauseEnabled !== false
        lunchReminderEnabled = !!state.lunchReminderEnabled
        lunchReminderTime = isValidTimeString(state.lunchReminderTime) ? state.lunchReminderTime : "12:00"
        dinnerReminderEnabled = !!state.dinnerReminderEnabled
        dinnerReminderTime = isValidTimeString(state.dinnerReminderTime) ? state.dinnerReminderTime : "19:00"
        lastLunchReminderMinuteKey = typeof state.lastLunchReminderMinuteKey === "string" ? state.lastLunchReminderMinuteKey : ""
        lastDinnerReminderMinuteKey = typeof state.lastDinnerReminderMinuteKey === "string" ? state.lastDinnerReminderMinuteKey : ""
        if (!hasAccountStatusOverride) {
            if (ACCOUNT_PLANS.has(state.accountPlan)) {
                accountPlan = state.accountPlan
            }
            if (typeof state.premiumUntil === "string") {
                premiumUntil = state.premiumUntil
            }
        }
        if (!isPremiumActive()) {
            enforceFreeTierDefaults()
        }

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
    lastPlayedTickSecond = null
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
    lastPlayedTickSecond = null
    lastActivityAt = Date.now()
    if (currentIdleState !== "active") {
        currentIdleState = "active"
    }

    persistState()
    scheduleAlarm()
    scheduleSoundCues()
    scheduleReminderAlarms()
    ensureOffscreenDocument()
    checkDailyProgressRollover()
    applyDistractionMuting()
    closeBreakVisualTab(false)
    checkMeetingActivity()
}

function handlePauseTimer(reason = "manual") {
    if (!endTime || isPaused) return

    remainingMs = Math.max(0, endTime - Date.now())
    isPaused = true
    pauseReason = reason
    if (reason === "idle" || reason === "meeting") {
        recordInterruption(reason)
    }

    persistState()
    clearAlarm()
    clearSoundCueAlarm()
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
    if (currentIdleState !== "active") {
        currentIdleState = "active"
    }

    persistState()
    scheduleAlarm()
    scheduleSoundCues()
    scheduleReminderAlarms()
    ensureOffscreenDocument()
    applyDistractionMuting()
}

function handleResetTimer(resetDurations) {
    const hadRunningSession = !!endTime
    if (hadRunningSession) {
        recordInterruption("manual-reset")
    }
    resetState()
    if (resetDurations) {
        focusMinutes = 25
        breakMinutes = 5
    }
    persistState()
    clearAlarm()
    clearSoundCueAlarm()
    scheduleReminderAlarms()
    closeBreakVisualTab(false)
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

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs && tabs.length ? tabs[0] : null
        breakReturnTabId = activeTab && activeTab.id ? activeTab.id : null

        chrome.tabs.create({ url: chrome.runtime.getURL("relax.html"), active: true }, (tab) => {
            if (chrome.runtime.lastError || !tab || !tab.id) return
            breakVisualTabId = tab.id
            persistState()
        })
    })
}

function closeBreakVisualTab(restorePreviousTab = true) {
    if (!breakVisualTabId) return
    const closingTabId = breakVisualTabId
    const returnTabId = breakReturnTabId
    breakVisualTabId = null
    breakReturnTabId = null
    chrome.tabs.remove(closingTabId, () => {
        if (chrome.runtime.lastError) return
        if (!restorePreviousTab || !returnTabId) return
        chrome.tabs.get(returnTabId, (tab) => {
            if (chrome.runtime.lastError || !tab || !tab.id) return
            chrome.tabs.update(tab.id, { active: true }, () => {
                if (chrome.runtime.lastError) return
            })
        })
    })
}

function checkDailyProgressRollover() {
    const todayKey = getLocalDateKey(new Date())
    if (!progressDateKey) {
        progressDateKey = todayKey
        ensureDailyHistoryEntry(todayKey)
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
    ensureDailyHistoryEntry(todayKey)
    persistState()
}

function incrementFocusProgress() {
    checkDailyProgressRollover()
    todayFocusSessions += 1
    const now = new Date()
    const todayKey = getLocalDateKey(now)
    ensureDailyHistoryEntry(todayKey)
    statsDailyHistory[todayKey].sessions += 1
    statsDailyHistory[todayKey].focusMinutes += Math.max(1, Math.round(focusMinutes))
    statsDailyHistory[todayKey].goal = dailyFocusGoal
    const h = now.getHours()
    if (h >= 0 && h < 24) {
        statsHourBuckets[h] = Math.max(0, Math.round(Number(statsHourBuckets[h]) || 0)) + 1
    }
    pruneStatsHistory()
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
        nightWorkStrength,
        focusBlurEnabled,
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
    if (chrome.idle && chrome.idle.onStateChanged) return
    if (!idleAutoPauseEnabled) return
    if (!isWorkSessionRunning()) return

    const thresholdMs = Math.max(1, idleAutoPauseMinutes) * 60000
    if (Date.now() - lastActivityAt < thresholdMs) return

    handlePauseTimer("idle")
    send("UPDATE")
}

function initIdleDetection() {
    if (!chrome.idle || !chrome.idle.onStateChanged) return
    updateIdleDetectionInterval()
    chrome.idle.queryState(Math.max(15, idleAutoPauseMinutes * 60), (state) => {
        if (chrome.runtime.lastError) return
        currentIdleState = state
        handleIdleStateChange(state)
    })
}

function updateIdleDetectionInterval() {
    if (!chrome.idle || !chrome.idle.setDetectionInterval) return
    chrome.idle.setDetectionInterval(Math.max(15, idleAutoPauseMinutes * 60))
}

if (chrome.idle && chrome.idle.onStateChanged) {
    chrome.idle.onStateChanged.addListener((newState) => {
        currentIdleState = newState
        stateReady.then(() => {
            handleIdleStateChange(newState)
        })
    })
}

function handleIdleStateChange(newState) {
    if (!idleAutoPauseEnabled) return

    if ((newState === "idle" || newState === "locked") && isWorkSessionRunning()) {
        handlePauseTimer("idle")
        send("UPDATE")
        return
    }

    if (newState === "active" && isPaused && pauseReason === "idle" && endTime) {
        handleResumeTimer()
        send("UPDATE")
    }
}

function resetStateForBrowserStartup() {
    resetState()
    focusMinutes = 25
    breakMinutes = 5
    soundEnabled = true
    nightWorkEnabled = false
    nightWorkStrength = 38
    focusBlurEnabled = false
    idleAutoPauseEnabled = true
    idleAutoPauseMinutes = 5
    lastActivityAt = Date.now()
    distractionMuteEnabled = true
    distractionDomains = [
        "youtube.com",
        "facebook.com",
        "reddit.com",
        "x.com",
        "instagram.com",
        "tiktok.com"
    ]
    mutedByDeepFocusTabIds = {}
    breakVisualEnabled = false
    breakReturnTabId = null
    dailyFocusGoal = 6
    todayFocusSessions = 0
    streakDays = 0
    progressDateKey = ""
    meetingAutoPauseEnabled = true
    lunchReminderEnabled = false
    lunchReminderTime = "12:00"
    dinnerReminderEnabled = false
    dinnerReminderTime = "19:00"
    lastLunchReminderMinuteKey = ""
    lastDinnerReminderMinuteKey = ""
    lastAudioEventAt = 0
    lastAudioEventKey = ""
    lastTickAt = 0
    lastDingAt = 0
    lastPlayedTickSecond = null
    premiumPromptedAt = 0
    closeBreakVisualTab(false)
    clearAlarm()
    clearSoundCueAlarm()
    if (!isPremiumActive()) {
        enforceFreeTierDefaults()
    }
    persistState()
    persistAccountStatus()
    send("RESET")
    broadcastAdvancedSettings()
    applyDistractionMuting()
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

function sanitizeDailyHistory(raw) {
    const out = {}
    Object.keys(raw || {}).forEach((key) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return
        const row = raw[key]
        if (!row || typeof row !== "object") return
        out[key] = {
            sessions: Math.max(0, Math.round(Number(row.sessions) || 0)),
            focusMinutes: Math.max(0, Math.round(Number(row.focusMinutes) || 0)),
            goal: Math.max(1, Math.min(20, Math.round(Number(row.goal) || dailyFocusGoal)))
        }
    })
    return out
}

function ensureDailyHistoryEntry(dateKey) {
    if (!statsDailyHistory[dateKey]) {
        statsDailyHistory[dateKey] = {
            sessions: 0,
            focusMinutes: 0,
            goal: dailyFocusGoal
        }
    }
}

function pruneStatsHistory() {
    const keys = Object.keys(statsDailyHistory).sort()
    const maxDays = 35
    if (keys.length <= maxDays) return
    const removeCount = keys.length - maxDays
    for (let i = 0; i < removeCount; i += 1) {
        delete statsDailyHistory[keys[i]]
    }

    const interruptionKeys = Object.keys(statsInterruptionDaily).sort()
    if (interruptionKeys.length <= maxDays) return
    const interruptionRemoveCount = interruptionKeys.length - maxDays
    for (let i = 0; i < interruptionRemoveCount; i += 1) {
        delete statsInterruptionDaily[interruptionKeys[i]]
    }
}

function recordInterruption(reason) {
    const todayKey = getLocalDateKey(new Date())
    ensureInterruptionDailyEntry(todayKey)
    if (reason === "idle") {
        statsInterruptions.idlePause += 1
        statsInterruptionDaily[todayKey].idlePause += 1
        return
    }
    if (reason === "meeting") {
        statsInterruptions.meetingPause += 1
        statsInterruptionDaily[todayKey].meetingPause += 1
        return
    }
    if (reason === "manual-reset") {
        statsInterruptions.manualReset += 1
        statsInterruptionDaily[todayKey].manualReset += 1
    }
}

function sanitizeInterruptionDaily(raw) {
    const out = {}
    Object.keys(raw || {}).forEach((key) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return
        const row = raw[key]
        if (!row || typeof row !== "object") return
        out[key] = {
            idlePause: Math.max(0, Math.round(Number(row.idlePause) || 0)),
            meetingPause: Math.max(0, Math.round(Number(row.meetingPause) || 0)),
            manualReset: Math.max(0, Math.round(Number(row.manualReset) || 0))
        }
    })
    return out
}

function ensureInterruptionDailyEntry(dateKey) {
    if (!statsInterruptionDaily[dateKey]) {
        statsInterruptionDaily[dateKey] = {
            idlePause: 0,
            meetingPause: 0,
            manualReset: 0
        }
    }
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

function clearSoundCueAlarm() {
    chrome.alarms.clear(SOUND_CUE_ALARM_NAME, () => {
        return
    })
}

function scheduleSoundCues() {
    clearSoundCueAlarm()
    if (!soundEnabled) return
    if (!isWorkSessionRunning()) return
    if (inTransition) return

    const now = Date.now()
    const msRemaining = endTime - now
    if (msRemaining <= 0) return

    const secRemaining = Math.ceil(msRemaining / 1000)
    let when = 0

    if (secRemaining > 10) {
        when = endTime - 10000 + 20
    } else if (secRemaining >= 1) {
        when = endTime - (secRemaining * 1000) + 20
    } else {
        return
    }

    chrome.alarms.create(SOUND_CUE_ALARM_NAME, {
        when: Math.max(now + 20, when)
    })
}

function handleSoundCueAlarm() {
    if (!soundEnabled) return
    if (!isWorkSessionRunning()) return
    if (inTransition) return

    const secRemaining = Math.ceil((endTime - Date.now()) / 1000)
    if (secRemaining < 1 || secRemaining > 10) {
        scheduleSoundCues()
        return
    }

    if (lastPlayedTickSecond !== secRemaining) {
        playGlobalAudio({ eventType: "TICK", mode, seconds: secRemaining, inTransition: false })
        lastPlayedTickSecond = secRemaining
    }

    const nextWhen = endTime - ((secRemaining - 1) * 1000) + 20
    if (secRemaining > 1) {
        chrome.alarms.create(SOUND_CUE_ALARM_NAME, {
            when: Math.max(Date.now() + 20, nextWhen)
        })
    }
}

function isPremiumActive() {
    if (!isPremiumPlan(accountPlan)) return false
    if (!premiumUntil) return false
    const untilTs = Date.parse(premiumUntil)
    if (!Number.isFinite(untilTs)) return false
    return untilTs > Date.now()
}

function getAuthSessionFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get([AUTH_STORAGE_KEY], (result) => {
            const session = result && result[AUTH_STORAGE_KEY]
            resolve(session && typeof session === "object" ? session : null)
        })
    })
}

async function verifyPremiumFromServer() {
    const session = await getAuthSessionFromStorage()
    if (!session || !session.access_token) {
        premiumVerifiedAt = Date.now()
        premiumVerifiedOk = false
        return { ok: false, error: "Sign in required.", premiumActive: false }
    }
    try {
        const res = await fetch("https://deepfocustime.com/api/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        })
        if (!res.ok) {
            premiumVerifiedAt = Date.now()
            premiumVerifiedOk = false
            return { ok: false, error: "Unable to verify premium.", premiumActive: false }
        }
        const payload = await res.json().catch(() => ({}))
        const entitlement = payload && payload.entitlement ? payload.entitlement : null
        if (entitlement && typeof entitlement.plan === "string") {
            accountPlan = normalizeAccountPlan(entitlement.plan)
        } else {
            accountPlan = "free"
        }
        premiumUntil = entitlement && typeof entitlement.premium_until === "string" ? entitlement.premium_until : ""
        if (!isPremiumActive()) {
            enforceFreeTierDefaults()
        }
        persistAccountStatus()
        premiumVerifiedAt = Date.now()
        premiumVerifiedOk = true
        return { ok: true, premiumActive: isPremiumActive() }
    } catch (_e) {
        premiumVerifiedAt = Date.now()
        premiumVerifiedOk = false
        return { ok: false, error: "Unable to verify premium.", premiumActive: false }
    }
}

function persistAccountStatus() {
    chrome.storage.local.set({
        [ACCOUNT_STATUS_KEY]: {
            plan: accountPlan,
            premiumUntil
        }
    })
}

function enforceFreeTierDefaults() {
    const now = Date.now()
    const expiredPremium = isPremiumPlan(accountPlan) && !isPremiumActive()
    if (expiredPremium && now - premiumPromptedAt > 6 * 60 * 60 * 1000) {
        premiumPromptedAt = now
        showUpgradeNotification()
    }
    if (expiredPremium) {
        accountPlan = "free"
        premiumUntil = ""
        persistAccountStatus()
    }

    const nextDomains = sanitizeDomainList(distractionDomains.length ? distractionDomains : [
        "youtube.com",
        "facebook.com",
        "reddit.com",
        "x.com",
        "instagram.com",
        "tiktok.com"
    ])
    const domainsChanged = JSON.stringify(nextDomains) !== JSON.stringify(distractionDomains)
    const changed =
        nightWorkEnabled ||
        focusBlurEnabled ||
        breakVisualEnabled ||
        !idleAutoPauseEnabled ||
        idleAutoPauseMinutes !== 5 ||
        dailyFocusGoal !== 6 ||
        !meetingAutoPauseEnabled ||
        domainsChanged

    nightWorkEnabled = false
    focusBlurEnabled = false
    distractionMuteEnabled = true
    distractionDomains = nextDomains
    breakVisualEnabled = false
    idleAutoPauseEnabled = true
    idleAutoPauseMinutes = 5
    dailyFocusGoal = 6
    meetingAutoPauseEnabled = true
    closeBreakVisualTab(false)
    applyDistractionMuting()
    if (changed) {
        broadcastAdvancedSettings()
        persistState()
    }
}

function showUpgradeNotification() {
    chrome.notifications.create("deepfocusPremiumExpired", {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "DeepFocus Premium trial ended",
        message: "Upgrade to keep Advanced Settings.",
        priority: 1
    })
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
