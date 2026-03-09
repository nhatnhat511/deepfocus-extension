const pauseBtn = document.getElementById("pauseBtn")
const focusInput = document.getElementById("focusTime")
const breakInput = document.getElementById("breakTime")
const soundEnabledInput = document.getElementById("soundEnabled")
const lunchEnabledInput = document.getElementById("lunchEnabled")
const lunchTimeInput = document.getElementById("lunchTime")
const dinnerEnabledInput = document.getElementById("dinnerEnabled")
const dinnerTimeInput = document.getElementById("dinnerTime")
const backBtn = document.getElementById("backBtn")
const headIcons = document.getElementById("headIcons")
const aboutBtn = document.getElementById("aboutBtn")
const shortcutsBtn = document.getElementById("shortcutsBtn")
const settingsBtn = document.getElementById("settingsBtn")
const accountBtn = document.getElementById("accountBtn")
const supportBtn = document.getElementById("supportBtn")
const mainView = document.getElementById("mainView")
const detailView = document.getElementById("detailView")
const detailTitle = document.getElementById("detailTitle")
const detailText = document.getElementById("detailText")
const detailList = document.getElementById("detailList")
const detailActionBtn = document.getElementById("detailActionBtn")
const advancedSettingsPanel = document.getElementById("advancedSettingsPanel")
const nightWorkEnabledInput = document.getElementById("nightWorkEnabled")
const nightWorkStrengthInput = document.getElementById("nightWorkStrength")
const nightWorkStrengthValue = document.getElementById("nightWorkStrengthValue")
const focusBlurEnabledInput = document.getElementById("focusBlurEnabled")
const distractionMuteEnabledInput = document.getElementById("distractionMuteEnabled")
const distractionDomainsInput = document.getElementById("distractionDomains")
const breakVisualEnabledInput = document.getElementById("breakVisualEnabled")
const breakVisualBackgroundInput = document.getElementById("breakVisualBackground")
const breakVisualBackgroundInfo = document.getElementById("breakVisualBackgroundInfo")
const breakVisualBackgroundRemoveBtn = document.getElementById("breakVisualBackgroundRemove")
const idleAutoPauseEnabledInput = document.getElementById("idleAutoPauseEnabled")
const idleAutoPauseMinutesInput = document.getElementById("idleAutoPauseMinutes")
const dailyFocusGoalInput = document.getElementById("dailyFocusGoal")
const progressReport = document.getElementById("progressReport")
const meetingAutoPauseEnabledInput = document.getElementById("meetingAutoPauseEnabled")
const accountPanel = document.getElementById("accountPanel")
const accountStatus = document.getElementById("accountStatus")
const accountEmailInput = document.getElementById("accountEmail")
const accountPasswordInput = document.getElementById("accountPassword")
const accountSubmitBtn = document.getElementById("accountSubmitBtn")
const accountSwitchPrompt = document.getElementById("accountSwitchPrompt")
const accountSwitchLink = document.getElementById("accountSwitchLink")
const accountGoogleBtn = document.getElementById("accountGoogleBtn")
const accountGoogleLabel = document.getElementById("accountGoogleLabel")
const accountAppleBtn = document.getElementById("accountAppleBtn")
const accountAppleLabel = document.getElementById("accountAppleLabel")
const accountRefreshBtn = document.getElementById("accountRefreshBtn")
const accountSignOutBtn = document.getElementById("accountSignOutBtn")
const accountMeta = document.getElementById("accountMeta")
const accountOauthLabel = document.getElementById("accountOauthLabel")
const accountProfileActions = document.getElementById("accountProfileActions")
const accountEditProfileBtn = document.getElementById("accountEditProfileBtn")
const accountTrialWrap = document.getElementById("accountTrialWrap")
const accountTrialBtn = document.getElementById("accountTrialBtn")
const accountAuthFields = document.getElementById("accountAuthFields")
const accountAuthActions = document.getElementById("accountAuthActions")
const accountSwitch = document.getElementById("accountSwitch")
const accountOAuthActions = document.getElementById("accountOAuthActions")
const accountSessionActions = document.getElementById("accountSessionActions")
let isPaused = false
let activeDetailKey = null
let soundEnabled = true
let nightWorkEnabled = false
let nightWorkStrength = 38
let focusBlurEnabled = false
let distractionMuteEnabled = true
let distractionDomains = ["youtube.com","facebook.com","reddit.com","x.com","instagram.com"]
let breakVisualEnabled = false
let idleAutoPauseEnabled = true
let idleAutoPauseMinutes = 5
let dailyFocusGoal = 6
let todayFocusSessions = 0
let streakDays = 0
let meetingAutoPauseEnabled = true
let authSession = null
let accountProfile = null
let accountFormMode = "signin"
let hasBreakVisualCustomImage = false
let breakVisualBackgroundMeta = null
let pendingTrialActivation = false

const SUPABASE_URL = "https://jpgywjxztjkayynptjrs.supabase.co"
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr"
const AUTH_STORAGE_KEY = "deepfocusSupabaseSession"
const AUTH_EMAIL_REDIRECT_URL = "https://deepfocustime.com/auth/callback"
const BREAK_VISUAL_BG_KEY = "deepfocusBreakVisualBackground"
const BREAK_VISUAL_BG_META_KEY = "deepfocusBreakVisualBackgroundMeta"
const ACCOUNT_STATUS_KEY = "deepfocusAccountStatus"
const PENDING_TRIAL_KEY = "deepfocusPendingTrialActivation"
const TRIAL_DEVICE_MARKER_KEY = "deepfocusTrialDeviceMarker"
const TRIAL_CROSS_ACCOUNT_MSG = "You have already started a trial on another account.\nTo continue using premium features, please upgrade to Premium."

function setPauseLabel(paused){
isPaused = paused
pauseBtn.textContent = paused ? "\u25B6 Resume" : "\u23F8 Pause"
}

function isPremiumActive(){
if(!accountProfile || (accountProfile.plan !== "premium" && accountProfile.plan !== "trial")) return false
if(!accountProfile.premium_until) return false
const untilTs = Date.parse(accountProfile.premium_until)
return Number.isFinite(untilTs) && untilTs > Date.now()
}

function isTrialActive(){
if(!accountProfile || accountProfile.plan !== "trial") return false
if(!accountProfile.premium_until) return false
const untilTs = Date.parse(accountProfile.premium_until)
return Number.isFinite(untilTs) && untilTs > Date.now()
}

function isPaidPremiumActive(){
if(!accountProfile || accountProfile.plan !== "premium") return false
if(!accountProfile.premium_until) return false
const untilTs = Date.parse(accountProfile.premium_until)
return Number.isFinite(untilTs) && untilTs > Date.now()
}

function getRemainingTrialLabel(){
if(!accountProfile || !accountProfile.premium_until) return ""
const ms = Date.parse(accountProfile.premium_until) - Date.now()
if(!Number.isFinite(ms) || ms <= 0) return "Trial ended"
const totalMinutes = Math.ceil(ms / 60000)
const days = Math.floor(totalMinutes / (60 * 24))
const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
if(days > 0){
return `${days}d ${hours}h remaining`
}
return `${Math.max(1, totalMinutes)}m remaining`
}

function formatFileSize(bytes){
const n = Number(bytes || 0)
if(!Number.isFinite(n) || n <= 0) return "0 B"
if(n < 1024) return `${n} B`
if(n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function renderBreakVisualBackgroundInfo(){
if(!breakVisualBackgroundInfo) return
if(!hasBreakVisualCustomImage){
breakVisualBackgroundInfo.textContent = "No custom image selected."
return
}
const name = breakVisualBackgroundMeta && breakVisualBackgroundMeta.name ? breakVisualBackgroundMeta.name : "custom-image"
const type = breakVisualBackgroundMeta && breakVisualBackgroundMeta.type ? breakVisualBackgroundMeta.type : "image"
const size = breakVisualBackgroundMeta ? formatFileSize(breakVisualBackgroundMeta.size) : "unknown size"
breakVisualBackgroundInfo.textContent = `${name} • ${type} • ${size}`
}

const detailConfig = {
about: {
title: "About DeepFocus",
text: "DeepFocus helps you stay productive with a clean focus/break timer, smart reminder popups, and a draggable on-page timer overlay.",
list: [],
actionLabel: ""
},
shortcuts: {
title: "Keyboard Shortcuts (Premium)",
text: "Use these DeepFocus shortcuts to control your work session quickly.",
list: [
"Alt+S: Start timer",
"Alt+P: Pause/Resume",
"Alt+R: Reset timer",
"Alt+B: Go back (inside popup)"
],
actionLabel: "Start 7-day Free Trial (No Card)"
},
settings: {
title: "Advanced Settings (Premium)",
text: "Advanced Premium tools to improve comfort and consistency during long sessions.",
list: [],
actionLabel: "Start 7-day Free Trial (No Card)"
},
account: {
title: "Account",
text: "Sign in to activate your Premium plan and unlock all DeepFocus features.",
list: [],
actionLabel: ""
},
support: {
title: "Support",
text: "Need help with DeepFocus Time? Contact the publisher support team:",
list: [
"Email: support@deepfocustime.com",
"Privacy: https://deepfocustime.com/privacy",
"Terms: https://deepfocustime.com/terms",
"Refund: https://deepfocustime.com/refund"
],
actionLabel: ""
}
}

function setActiveHeadIcon(btn){
[aboutBtn,shortcutsBtn,settingsBtn,accountBtn,supportBtn].forEach((b)=>b.classList.remove("active"))
if(btn) btn.classList.add("active")
}

function closeDetailView(){
activeDetailKey = null
mainView.classList.remove("hidden")
detailView.classList.remove("show")
backBtn.classList.remove("show")
headIcons.classList.remove("has-back")
advancedSettingsPanel.classList.remove("show")
accountPanel.classList.remove("show")
setActiveHeadIcon(null)
}

function openDetailView(key){
const cfg = detailConfig[key]
if(!cfg) return

activeDetailKey = key
detailTitle.textContent = cfg.title
detailText.textContent = cfg.text
detailList.innerHTML = ""
cfg.list.forEach((item)=>{
const li = document.createElement("li")
const raw = String(item || "")
const urlMatch = raw.match(/https?:\/\/\S+/i)
if(urlMatch){
const url = urlMatch[0]
const label = raw.replace(url, "").replace(/[:\s]+$/,"").trim()
if(label){
const prefix = document.createElement("span")
prefix.textContent = `${label}: `
li.appendChild(prefix)
}
const a = document.createElement("a")
a.href = url
a.textContent = url
a.target = "_blank"
a.rel = "noopener noreferrer"
li.appendChild(a)
}else if(/^email:\s*/i.test(raw)){
const email = raw.replace(/^email:\s*/i,"").trim()
const prefix = document.createElement("span")
prefix.textContent = "Email: "
li.appendChild(prefix)
const a = document.createElement("a")
a.href = `mailto:${email}`
a.textContent = email
li.appendChild(a)
}else{
li.textContent = raw
}
detailList.appendChild(li)
})
detailList.style.display = cfg.list.length ? "block" : "none"
advancedSettingsPanel.classList.toggle("show", key==="settings")
accountPanel.classList.toggle("show", key==="account")

if(cfg.actionLabel){
const premiumNeeded = (key === "shortcuts" || key === "settings")
if(premiumNeeded && isPremiumActive()){
detailActionBtn.style.display = "none"
detailActionBtn.textContent = ""
}else{
detailActionBtn.style.display = "block"
detailActionBtn.textContent = cfg.actionLabel
}
}else{
detailActionBtn.style.display = "none"
detailActionBtn.textContent = ""
}

mainView.classList.add("hidden")
detailView.classList.add("show")
backBtn.classList.add("show")
headIcons.classList.add("has-back")
setActiveHeadIcon(
key==="about" ? aboutBtn :
key==="shortcuts" ? shortcutsBtn :
key==="settings" ? settingsBtn :
key==="account" ? accountBtn : supportBtn
)

if(key==="account"){
refreshAccountView()
}
}

function updateReminderInputState(){
lunchTimeInput.disabled = !lunchEnabledInput.checked
dinnerTimeInput.disabled = !dinnerEnabledInput.checked
}

function saveReminderSettings(){
chrome.runtime.sendMessage({
type:"UPDATE_REMINDER_SETTINGS",
lunchEnabled:lunchEnabledInput.checked,
lunchTime:lunchTimeInput.value || "12:00",
dinnerEnabled:dinnerEnabledInput.checked,
dinnerTime:dinnerTimeInput.value || "19:00"
})
updateReminderInputState()
}

function saveAudioSettings(){
soundEnabled = soundEnabledInput.checked
chrome.runtime.sendMessage({
type:"UPDATE_AUDIO_SETTINGS",
soundEnabled
})
}

function updateNightWorkStrengthLabel(){
nightWorkStrengthValue.textContent = `${nightWorkStrengthInput.value}%`
}

function updateNightWorkControls(){
const enabled = !!nightWorkEnabledInput.checked
nightWorkStrengthInput.disabled = !enabled
nightWorkStrengthValue.style.opacity = enabled ? "1" : "0.45"
}

function updateBreakVisualControls(){
const enabled = !!breakVisualEnabledInput.checked
breakVisualBackgroundInput.disabled = !enabled
breakVisualBackgroundRemoveBtn.disabled = !enabled || !hasBreakVisualCustomImage
}

function setAccountMode(mode){
accountFormMode = mode === "signup" ? "signup" : "signin"
if(accountFormMode === "signup"){
accountSubmitBtn.textContent = "Sign Up"
accountSwitchPrompt.textContent = "Already have an account?"
accountSwitchLink.textContent = "Sign in"
accountGoogleLabel.textContent = "Google"
accountAppleLabel.textContent = "GitHub"
return
}

accountSubmitBtn.textContent = "Sign In"
accountSwitchPrompt.textContent = "Don't have an account?"
accountSwitchLink.textContent = "Sign up"
accountGoogleLabel.textContent = "Google"
accountAppleLabel.textContent = "GitHub"
}

function saveAdvancedSettings(){
if(!isPremiumActive()){
openDetailView("account")
setAccountStatus("Please sign in and start a trial to use Advanced Settings.", true)
return
}

nightWorkEnabled = nightWorkEnabledInput.checked
nightWorkStrength = Number(nightWorkStrengthInput.value)
focusBlurEnabled = focusBlurEnabledInput.checked
distractionMuteEnabled = distractionMuteEnabledInput.checked
distractionDomains = parseDomainList(distractionDomainsInput.value)
breakVisualEnabled = breakVisualEnabledInput.checked
idleAutoPauseEnabled = idleAutoPauseEnabledInput.checked
idleAutoPauseMinutes = Math.max(1, Math.min(60, Number(idleAutoPauseMinutesInput.value) || 5))
idleAutoPauseMinutesInput.value = String(idleAutoPauseMinutes)
dailyFocusGoal = Math.max(1, Math.min(20, Number(dailyFocusGoalInput.value) || 6))
dailyFocusGoalInput.value = String(dailyFocusGoal)
meetingAutoPauseEnabled = meetingAutoPauseEnabledInput.checked
updateNightWorkStrengthLabel()
updateNightWorkControls()
updateBreakVisualControls()
updateProgressReport()

chrome.runtime.sendMessage({
type:"UPDATE_ADVANCED_SETTINGS",
nightWorkEnabled,
nightWorkStrength,
focusBlurEnabled,
distractionMuteEnabled,
distractionDomains,
breakVisualEnabled,
idleAutoPauseEnabled,
idleAutoPauseMinutes,
dailyFocusGoal,
meetingAutoPauseEnabled
}, (res)=>{
if(chrome.runtime.lastError || !res || res.ok !== true){
setAccountStatus((res && res.error) || "Premium is required for Advanced Settings.", true)
openDetailView("account")
}
})
}

function parseDomainList(raw){
return Array.from(new Set(
String(raw || "")
.split(/[\n,]/g)
.map((d)=>d.trim().toLowerCase())
.map((d)=>d.replace(/^https?:\/\//,""))
.map((d)=>d.replace(/^www\./,""))
.map((d)=>d.split("/")[0])
.filter(Boolean)
)).slice(0,40)
}

function updateProgressReport(){
const goal = Math.max(1, dailyFocusGoal)
const pct = Math.min(100, Math.round((todayFocusSessions / goal) * 100))
const streakLabel = streakDays === 1 ? "day" : "days"
progressReport.textContent = `Today: ${todayFocusSessions}/${goal} sessions (${pct}%). Streak: ${streakDays} ${streakLabel}.`
}

function setAccountStatus(message, isError){
accountStatus.textContent = message
accountStatus.style.borderColor = isError ? "#fecaca" : "#dbe4f3"
accountStatus.style.background = isError ? "#fff1f2" : "#f8fbff"
accountStatus.style.color = isError ? "#991b1b" : "#334155"
}

function updateAccountButtonsLoading(loading){
accountSubmitBtn.disabled = loading
accountGoogleBtn.disabled = loading
accountAppleBtn.disabled = loading
accountRefreshBtn.disabled = loading
accountSignOutBtn.disabled = loading
if(accountTrialBtn) accountTrialBtn.disabled = loading
}

function syncAccountUiBySession(){
const signedIn = !!(authSession && authSession.user)
accountAuthFields.classList.toggle("hidden", signedIn)
accountAuthActions.classList.toggle("hidden", signedIn)
accountSwitch.classList.toggle("hidden", signedIn)
if(accountOauthLabel){
accountOauthLabel.classList.toggle("hidden", signedIn)
}
accountOAuthActions.classList.toggle("hidden", signedIn)
accountSessionActions.classList.toggle("hidden", !signedIn)
if(accountProfileActions){
accountProfileActions.classList.toggle("hidden", !signedIn)
}
if(signedIn){
accountPasswordInput.value = ""
}
}

function syncPremiumControls(){
const premium = isPremiumActive()
const controls = [
nightWorkEnabledInput,
nightWorkStrengthInput,
focusBlurEnabledInput,
distractionMuteEnabledInput,
distractionDomainsInput,
breakVisualEnabledInput,
breakVisualBackgroundInput,
breakVisualBackgroundRemoveBtn,
idleAutoPauseEnabledInput,
idleAutoPauseMinutesInput,
dailyFocusGoalInput,
meetingAutoPauseEnabledInput
]
controls.forEach((el)=>{
if(!el) return
el.disabled = !premium
})
if(advancedSettingsPanel){
const note = advancedSettingsPanel.querySelector(".premium-note")
if(note){
note.textContent = premium
? "Premium is active. Advanced settings are unlocked."
: "Premium required. Start the 7-day free trial to unlock these settings."
}
}
if(activeDetailKey === "shortcuts" || activeDetailKey === "settings"){
openDetailView(activeDetailKey)
}
}

function renderAccountMeta(){
if(!authSession || !authSession.user){
accountMeta.innerHTML = "<strong>Plan:</strong> Free"
if(accountTrialWrap) accountTrialWrap.classList.add("hidden")
syncPremiumControls()
syncAccountStatusToBackground()
return
}

const userEmail = authSession.user.email || "-"
const premium = isPremiumActive()
const trial = isTrialActive()
const paidPremium = isPaidPremiumActive()
const plan = trial ? "Trial" : (premium ? "Premium" : "Free")
const expiresText = premium && accountProfile && accountProfile.premium_until
? new Date(accountProfile.premium_until).toLocaleString()
: "N/A"
const remaining = premium ? getRemainingTrialLabel() : ""
accountMeta.innerHTML = premium
? (trial
? `<strong>Email:</strong> ${userEmail}<br><strong>Plan:</strong> ${plan}<br><strong>Trial Time Remaining:</strong> ${remaining}`
: `<strong>Email:</strong> ${userEmail}<br><strong>Plan:</strong> ${plan}<br><strong>Premium Until:</strong> ${expiresText}`)
: `<strong>Email:</strong> ${userEmail}<br><strong>Plan:</strong> ${plan}`
if(accountTrialWrap) accountTrialWrap.classList.toggle("hidden", premium || paidPremium)
syncPremiumControls()
syncAccountStatusToBackground()
}

async function supabaseRequest(path, options = {}, accessToken){
const headers = {
"apikey": SUPABASE_PUBLISHABLE_KEY,
"Content-Type": "application/json",
...(options.headers || {})
}
if(accessToken){
headers["Authorization"] = `Bearer ${accessToken}`
}

const res = await fetch(`${SUPABASE_URL}${path}`, {
...options,
headers
})

let payload = null
try{
payload = await res.json()
}catch(_e){
payload = null
}

if(!res.ok){
const msg = payload && (payload.msg || payload.message || payload.error_description || payload.error) ? (payload.msg || payload.message || payload.error_description || payload.error) : `Request failed (${res.status})`
throw new Error(msg)
}

return payload
}

function saveSessionToStorage(session){
return new Promise((resolve)=>{
chrome.storage.local.set({ [AUTH_STORAGE_KEY]: session }, resolve)
})
}

function loadSessionFromStorage(){
return new Promise((resolve)=>{
chrome.storage.local.get(AUTH_STORAGE_KEY, (result)=>{
resolve(result[AUTH_STORAGE_KEY] || null)
})
})
}

function loadPendingTrialFlag(){
return new Promise((resolve)=>{
chrome.storage.local.get(PENDING_TRIAL_KEY, (result)=>{
resolve(!!result[PENDING_TRIAL_KEY])
})
})
}

function savePendingTrialFlag(flag){
return new Promise((resolve)=>{
chrome.storage.local.set({ [PENDING_TRIAL_KEY]: !!flag }, resolve)
})
}

function buildDeviceFingerprint(){
const src = [
navigator.userAgent || "",
navigator.platform || "",
navigator.language || "",
String(navigator.hardwareConcurrency || ""),
String(screen && screen.width ? screen.width : ""),
String(screen && screen.height ? screen.height : "")
].join("|")
let hash = 0
for(let i = 0; i < src.length; i += 1){
hash = ((hash << 5) - hash) + src.charCodeAt(i)
hash |= 0
}
return `df-${Math.abs(hash)}`
}

function getDeviceTrialMarker(){
return new Promise((resolve)=>{
chrome.storage.local.get(TRIAL_DEVICE_MARKER_KEY, (result)=>{
resolve(result[TRIAL_DEVICE_MARKER_KEY] || null)
})
})
}

function setDeviceTrialMarker(marker){
return new Promise((resolve)=>{
chrome.storage.local.set({ [TRIAL_DEVICE_MARKER_KEY]: marker }, resolve)
})
}

function hasUsedTrialOnAccount(){
const meta = authSession && authSession.user && authSession.user.user_metadata ? authSession.user.user_metadata : null
return !!(meta && meta.deepfocus_trial_used)
}

async function markTrialUsedOnAccount(){
if(!authSession || !authSession.access_token) return
const meta = authSession && authSession.user && authSession.user.user_metadata ? authSession.user.user_metadata : {}
await supabaseRequest("/auth/v1/user", {
method: "PUT",
body: JSON.stringify({
data: {
...meta,
deepfocus_trial_used: true,
deepfocus_trial_started_at: new Date().toISOString()
}
})
}, authSession.access_token)
await fetchCurrentUser()
}

async function clearSessionStorage(){
return new Promise((resolve)=>{
chrome.storage.local.remove(AUTH_STORAGE_KEY, resolve)
})
}

async function fetchProfile(){
if(!authSession || !authSession.user || !authSession.access_token){
accountProfile = null
renderAccountMeta()
return
}

const uid = authSession.user.id
const rows = await supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=plan,premium_until,email,display_name&limit=1`, {
method: "GET",
headers: {
"Prefer": "return=representation"
}
}, authSession.access_token)

accountProfile = Array.isArray(rows) && rows.length ? rows[0] : null
if(accountProfile && (accountProfile.plan === "premium" || accountProfile.plan === "trial") && accountProfile.premium_until){
const untilTs = Date.parse(accountProfile.premium_until)
if(Number.isFinite(untilTs) && untilTs <= Date.now()){
await supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}`, {
method: "PATCH",
headers: {
"Prefer": "return=representation"
},
body: JSON.stringify({ plan: "free", premium_until: null })
}, authSession.access_token)
const expiredTrial = accountProfile.plan === "trial"
accountProfile.plan = "free"
accountProfile.premium_until = null
setAccountStatus(expiredTrial ? "Trial ended. Upgrade to continue Premium features." : "Premium subscription ended. Please upgrade to continue Premium features.", true)
}
}
renderAccountMeta()
}

function syncAccountStatusToBackground(){
const premium = isPremiumActive()
const plan = premium && accountProfile && accountProfile.plan === "trial" ? "trial" : (premium ? "premium" : "free")
const premiumUntil = premium && accountProfile && accountProfile.premium_until ? accountProfile.premium_until : ""
chrome.storage.local.set({
[ACCOUNT_STATUS_KEY]: { plan, premiumUntil }
})
chrome.runtime.sendMessage({
type: "UPDATE_ACCOUNT_STATUS",
plan,
premiumUntil
})
}

async function activateFreeTrial(source = "popup"){
if(!authSession || !authSession.user || !authSession.access_token){
openDetailView("account")
setAccountStatus("Please sign in before starting the free trial.", true)
pendingTrialActivation = true
await savePendingTrialFlag(true)
return false
}

if(isPremiumActive()){
setAccountStatus("Premium is already active.", false)
pendingTrialActivation = false
await savePendingTrialFlag(false)
return true
}

if(hasUsedTrialOnAccount()){
setAccountStatus("This account has already used its free trial. Please upgrade to Premium.", true)
pendingTrialActivation = false
await savePendingTrialFlag(false)
return false
}

const marker = await getDeviceTrialMarker()
const uid = authSession.user.id
if(marker && marker.used && marker.userId && marker.userId !== uid){
setAccountStatus(TRIAL_CROSS_ACCOUNT_MSG, true)
pendingTrialActivation = false
await savePendingTrialFlag(false)
return false
}

updateAccountButtonsLoading(true)
setAccountStatus("Activating free trial...", false)
try{
const now = new Date()
const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
const payload = {
id: uid,
email: authSession.user.email || null,
plan: "trial",
premium_until: until
}
await supabaseRequest("/rest/v1/profiles?on_conflict=id", {
method: "POST",
headers: {
"Prefer": "resolution=merge-duplicates,return=representation"
},
body: JSON.stringify(payload)
}, authSession.access_token)
await markTrialUsedOnAccount()
await setDeviceTrialMarker({
used: true,
userId: uid,
fingerprint: buildDeviceFingerprint(),
usedAt: Date.now()
})
await fetchProfile()
pendingTrialActivation = false
await savePendingTrialFlag(false)
setAccountStatus("Free trial activated. Premium unlocked.", false)
if(source === "shortcuts" || source === "settings"){
closeDetailView()
}
return true
}catch(err){
setAccountStatus(err.message || "Unable to activate trial.", true)
return false
}finally{
updateAccountButtonsLoading(false)
}
}

async function maybeAutoActivateTrial(){
if(!pendingTrialActivation) return
await activateFreeTrial("pending")
}

async function requestTrialActivation(source = "popup"){
if(!authSession || !authSession.user){
pendingTrialActivation = true
await savePendingTrialFlag(true)
openDetailView("account")
setAccountStatus("Please sign in before starting the free trial.", true)
return
}
await activateFreeTrial(source)
}

async function fetchCurrentUser(){
if(!authSession || !authSession.access_token) return null
const user = await supabaseRequest("/auth/v1/user", { method: "GET" }, authSession.access_token)
authSession.user = user
await saveSessionToStorage(authSession)
return user
}

function launchAuthFlow(url){
return new Promise((resolve, reject)=>{
if(!chrome.identity || !chrome.identity.launchWebAuthFlow){
reject(new Error("Chrome Identity API is unavailable."))
return
}

chrome.identity.launchWebAuthFlow({ url, interactive: true }, (redirectUrl)=>{
if(chrome.runtime.lastError){
reject(new Error(chrome.runtime.lastError.message || "Authentication failed."))
return
}
if(!redirectUrl){
reject(new Error("Authentication did not return a response URL."))
return
}
resolve(redirectUrl)
})
})
}

async function signInWithProvider(provider){
updateAccountButtonsLoading(true)
const actionLabel = accountFormMode === "signup" ? "sign up" : "sign in"
setAccountStatus(`Opening ${provider} ${actionLabel}...`, false)
try{
if(!chrome.identity || !chrome.identity.getRedirectURL){
throw new Error("Chrome Identity API is unavailable.")
}

const redirectUrl = chrome.identity.getRedirectURL("supabase-auth")
const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirectUrl)}`
const finalUrl = await launchAuthFlow(authUrl)
const parsed = new URL(finalUrl)
const hashParams = new URLSearchParams(parsed.hash.replace(/^#/,""))
const authError = hashParams.get("error_description") || hashParams.get("error")
if(authError){
throw new Error(authError)
}

const accessToken = hashParams.get("access_token")
if(!accessToken){
throw new Error("No access token returned.")
}

authSession = {
access_token: accessToken,
refresh_token: hashParams.get("refresh_token") || "",
token_type: hashParams.get("token_type") || "bearer",
expires_in: Number(hashParams.get("expires_in") || 0)
}
await saveSessionToStorage(authSession)
await fetchCurrentUser()
await fetchProfile()
await maybeAutoActivateTrial()
setAccountStatus("Signed in successfully.", false)
syncAccountUiBySession()
}catch(err){
setAccountStatus(err.message || "OAuth sign in failed.", true)
}finally{
updateAccountButtonsLoading(false)
}
}

function fileToDataUrl(file){
return new Promise((resolve, reject)=>{
const reader = new FileReader()
reader.onload = () => resolve(String(reader.result || ""))
reader.onerror = () => reject(new Error("Unable to read selected image."))
reader.readAsDataURL(file)
})
}

async function uploadBreakVisualBackground(){
const file = breakVisualBackgroundInput && breakVisualBackgroundInput.files && breakVisualBackgroundInput.files[0]
if(!file) return
try{
const dataUrl = await fileToDataUrl(file)
const metadata = {
name: file.name || "custom-image",
size: Number(file.size || 0),
type: file.type || "image",
updatedAt: Date.now()
}
chrome.runtime.sendMessage({
type: "UPDATE_BREAK_VISUAL_BACKGROUND",
dataUrl,
metadata
}, (res)=>{
if(chrome.runtime.lastError || !res || res.ok !== true){
console.error((res && res.error) || "Unable to save break background.")
return
}
hasBreakVisualCustomImage = true
breakVisualBackgroundMeta = metadata
updateBreakVisualControls()
renderBreakVisualBackgroundInfo()
})
}catch(err){
console.error(err.message || "Unable to upload image.")
}
}

function removeBreakVisualBackground(){
chrome.runtime.sendMessage({
type: "UPDATE_BREAK_VISUAL_BACKGROUND",
dataUrl: ""
}, (res)=>{
if(chrome.runtime.lastError || !res || res.ok !== true){
console.error((res && res.error) || "Unable to remove break background.")
return
}
hasBreakVisualCustomImage = false
breakVisualBackgroundMeta = null
if(breakVisualBackgroundInput) breakVisualBackgroundInput.value = ""
updateBreakVisualControls()
renderBreakVisualBackgroundInfo()
})
}

function syncBreakVisualBackgroundState(){
chrome.storage.local.get([BREAK_VISUAL_BG_KEY, BREAK_VISUAL_BG_META_KEY], (result)=>{
if(chrome.runtime.lastError) return
const bg = result[BREAK_VISUAL_BG_KEY]
hasBreakVisualCustomImage = typeof bg === "string" && bg.startsWith("data:image/")
breakVisualBackgroundMeta = result[BREAK_VISUAL_BG_META_KEY] || null
updateBreakVisualControls()
renderBreakVisualBackgroundInfo()
})
}

async function signInWithPassword(){
const email = (accountEmailInput.value || "").trim()
const password = accountPasswordInput.value || ""
if(!email || !password){
setAccountStatus("Please enter email and password.", true)
return
}

updateAccountButtonsLoading(true)
setAccountStatus("Signing in...", false)
try{
const session = await supabaseRequest("/auth/v1/token?grant_type=password", {
method: "POST",
body: JSON.stringify({ email, password })
})
authSession = session
await saveSessionToStorage(authSession)
await fetchCurrentUser()
await fetchProfile()
await maybeAutoActivateTrial()
setAccountStatus("Signed in successfully.", false)
syncAccountUiBySession()
}catch(err){
setAccountStatus(err.message || "Sign in failed.", true)
}finally{
updateAccountButtonsLoading(false)
}
}

async function signUpWithPassword(){
const email = (accountEmailInput.value || "").trim()
const password = accountPasswordInput.value || ""
if(!email || !password){
setAccountStatus("Please enter email and password.", true)
return
}

updateAccountButtonsLoading(true)
setAccountStatus("Creating account...", false)
try{
const signupPayload = await supabaseRequest("/auth/v1/signup", {
method: "POST",
body: JSON.stringify({
email,
password,
options: {
emailRedirectTo: AUTH_EMAIL_REDIRECT_URL
}
})
})
if(signupPayload && signupPayload.access_token){
authSession = signupPayload
await saveSessionToStorage(authSession)
await fetchCurrentUser()
await fetchProfile()
await maybeAutoActivateTrial()
setAccountStatus("Signup completed and trial activated.", false)
syncAccountUiBySession()
return
}
setAccountStatus("Signup successful. Check your email to confirm account if required.", false)
}catch(err){
setAccountStatus(err.message || "Sign up failed.", true)
}finally{
updateAccountButtonsLoading(false)
}
}

async function signOutAccount(){
updateAccountButtonsLoading(true)
try{
if(authSession && authSession.access_token){
await supabaseRequest("/auth/v1/logout", { method: "POST" }, authSession.access_token)
}
}catch(_e){
// ignore network/logout errors and continue cleanup
}finally{
authSession = null
accountProfile = null
await clearSessionStorage()
await savePendingTrialFlag(false)
pendingTrialActivation = false
setAccountStatus("Signed out.", false)
renderAccountMeta()
syncAccountUiBySession()
updateAccountButtonsLoading(false)
}
}

async function restoreAccountSession(){
pendingTrialActivation = await loadPendingTrialFlag()
authSession = await loadSessionFromStorage()
if(!authSession){
renderAccountMeta()
syncAccountUiBySession()
return
}

try{
await fetchCurrentUser()
await fetchProfile()
await maybeAutoActivateTrial()
setAccountStatus("Session restored.", false)
syncAccountUiBySession()
}catch(_e){
authSession = null
accountProfile = null
await clearSessionStorage()
await savePendingTrialFlag(false)
pendingTrialActivation = false
setAccountStatus("Session expired. Please sign in again.", true)
renderAccountMeta()
syncAccountUiBySession()
}
}

function refreshAccountView(){
if(authSession && authSession.user){
setAccountStatus("Account connected.", false)
}else{
setAccountStatus("Not signed in.", false)
}
renderAccountMeta()
syncAccountUiBySession()
}

function syncPauseButtonState(){
chrome.runtime.sendMessage({ type:"GET_TIMER_STATE" }, (state)=>{
if(chrome.runtime.lastError || !state){
setPauseLabel(false)
return
}

if(typeof state.focusMinutes === "number"){
focusInput.value = state.focusMinutes
}
if(typeof state.breakMinutes === "number"){
breakInput.value = state.breakMinutes
}
if(typeof state.soundEnabled === "boolean"){
soundEnabled = state.soundEnabled
soundEnabledInput.checked = state.soundEnabled
}
if(typeof state.nightWorkEnabled === "boolean"){
nightWorkEnabled = state.nightWorkEnabled
nightWorkEnabledInput.checked = state.nightWorkEnabled
}
if(typeof state.nightWorkStrength === "number"){
nightWorkStrength = Math.max(10, Math.min(75, Math.round(state.nightWorkStrength)))
nightWorkStrengthInput.value = String(nightWorkStrength)
}
if(typeof state.focusBlurEnabled === "boolean"){
focusBlurEnabled = state.focusBlurEnabled
focusBlurEnabledInput.checked = state.focusBlurEnabled
}
if(typeof state.distractionMuteEnabled === "boolean"){
distractionMuteEnabled = state.distractionMuteEnabled
distractionMuteEnabledInput.checked = state.distractionMuteEnabled
}
if(Array.isArray(state.distractionDomains)){
distractionDomains = state.distractionDomains
distractionDomainsInput.value = distractionDomains.join("\n")
}
if(typeof state.breakVisualEnabled === "boolean"){
breakVisualEnabled = state.breakVisualEnabled
breakVisualEnabledInput.checked = state.breakVisualEnabled
}
if(typeof state.idleAutoPauseEnabled === "boolean"){
idleAutoPauseEnabled = state.idleAutoPauseEnabled
idleAutoPauseEnabledInput.checked = state.idleAutoPauseEnabled
}
if(typeof state.idleAutoPauseMinutes === "number"){
idleAutoPauseMinutes = Math.max(1, Math.min(60, Math.round(state.idleAutoPauseMinutes)))
idleAutoPauseMinutesInput.value = String(idleAutoPauseMinutes)
}
if(typeof state.dailyFocusGoal === "number"){
dailyFocusGoal = Math.max(1, Math.min(20, Math.round(state.dailyFocusGoal)))
dailyFocusGoalInput.value = String(dailyFocusGoal)
}
if(typeof state.todayFocusSessions === "number"){
todayFocusSessions = Math.max(0, Math.round(state.todayFocusSessions))
}
if(typeof state.streakDays === "number"){
streakDays = Math.max(0, Math.round(state.streakDays))
}
if(typeof state.meetingAutoPauseEnabled === "boolean"){
meetingAutoPauseEnabled = state.meetingAutoPauseEnabled
meetingAutoPauseEnabledInput.checked = state.meetingAutoPauseEnabled
}
if(!authSession && typeof state.accountPlan === "string"){
accountProfile = {
plan: state.accountPlan,
premium_until: typeof state.premiumUntil === "string" ? state.premiumUntil : null
}
}
updateNightWorkStrengthLabel()
updateNightWorkControls()
updateBreakVisualControls()
syncPremiumControls()
updateProgressReport()
if(typeof state.lunchReminderEnabled === "boolean"){
lunchEnabledInput.checked = state.lunchReminderEnabled
}
if(typeof state.lunchReminderTime === "string" && state.lunchReminderTime){
lunchTimeInput.value = state.lunchReminderTime
}
if(typeof state.dinnerReminderEnabled === "boolean"){
dinnerEnabledInput.checked = state.dinnerReminderEnabled
}
if(typeof state.dinnerReminderTime === "string" && state.dinnerReminderTime){
dinnerTimeInput.value = state.dinnerReminderTime
}
updateReminderInputState()

if(state.type==="UPDATE" && state.isPaused){
setPauseLabel(true)
return
}

setPauseLabel(false)
})
}

document.getElementById("startBtn").onclick = () => {

let focus = Number(document.getElementById("focusTime").value)
let brk = Number(document.getElementById("breakTime").value)

// send start request to background
chrome.runtime.sendMessage({
    type:"START_TIMER",
    focus:focus,
    break:brk
})
isPaused = false
setPauseLabel(false)

}

pauseBtn.onclick = () => {

if(!isPaused){
chrome.runtime.sendMessage({
type:"PAUSE_TIMER"
})
isPaused = true
setPauseLabel(true)
return
}

chrome.runtime.sendMessage({
type:"RESUME_TIMER"
})
isPaused = false
setPauseLabel(false)

}

document.getElementById("resetBtn").onclick = () => {

chrome.runtime.sendMessage({
type:"RESET_TIMER"
})
isPaused = false
setPauseLabel(false)
focusInput.value = 25
breakInput.value = 5

}


chrome.runtime.onMessage.addListener((msg)=>{

if(msg.type==="UPDATE"){
if(typeof msg.isPaused === "boolean"){
setPauseLabel(msg.isPaused)
}

}

})

lunchEnabledInput.addEventListener("change", saveReminderSettings)
lunchTimeInput.addEventListener("change", saveReminderSettings)
dinnerEnabledInput.addEventListener("change", saveReminderSettings)
dinnerTimeInput.addEventListener("change", saveReminderSettings)
soundEnabledInput.addEventListener("change", saveAudioSettings)
nightWorkEnabledInput.addEventListener("change", saveAdvancedSettings)
nightWorkStrengthInput.addEventListener("input", ()=>{
saveAdvancedSettings()
})
focusBlurEnabledInput.addEventListener("change", saveAdvancedSettings)
distractionMuteEnabledInput.addEventListener("change", saveAdvancedSettings)
distractionDomainsInput.addEventListener("change", saveAdvancedSettings)
breakVisualEnabledInput.addEventListener("change", saveAdvancedSettings)
if(breakVisualBackgroundInput){
breakVisualBackgroundInput.addEventListener("change", uploadBreakVisualBackground)
}
if(breakVisualBackgroundRemoveBtn){
breakVisualBackgroundRemoveBtn.addEventListener("click", removeBreakVisualBackground)
}
idleAutoPauseEnabledInput.addEventListener("change", saveAdvancedSettings)
idleAutoPauseMinutesInput.addEventListener("change", saveAdvancedSettings)
dailyFocusGoalInput.addEventListener("change", saveAdvancedSettings)
meetingAutoPauseEnabledInput.addEventListener("change", saveAdvancedSettings)
accountSubmitBtn.addEventListener("click", ()=>{
if(accountFormMode === "signup"){
signUpWithPassword()
return
}
signInWithPassword()
})
accountSwitchLink.addEventListener("click", (e)=>{
e.preventDefault()
setAccountMode(accountFormMode === "signup" ? "signin" : "signup")
})
accountGoogleBtn.addEventListener("click", ()=>signInWithProvider("google"))
accountAppleBtn.addEventListener("click", ()=>signInWithProvider("github"))
if(accountTrialBtn){
accountTrialBtn.addEventListener("click", ()=>requestTrialActivation("account"))
}
if(accountEditProfileBtn){
accountEditProfileBtn.addEventListener("click", ()=>{
chrome.tabs.create({ url: "https://deepfocustime.com/" })
})
}
accountRefreshBtn.addEventListener("click", async ()=>{
updateAccountButtonsLoading(true)
setAccountStatus("Refreshing account...", false)
try{
if(!authSession){
await restoreAccountSession()
}else{
await fetchCurrentUser()
await fetchProfile()
setAccountStatus("Account refreshed.", false)
}
}catch(err){
setAccountStatus(err.message || "Refresh failed.", true)
}finally{
updateAccountButtonsLoading(false)
}
})
accountSignOutBtn.addEventListener("click", signOutAccount)

document.querySelectorAll(".preset-tag").forEach((btn)=>{
btn.addEventListener("click", ()=>{
const domain = btn.getAttribute("data-domain")
if(!domain) return
const domains = parseDomainList(distractionDomainsInput.value)
if(!domains.includes(domain)){
domains.push(domain)
distractionDomainsInput.value = domains.join("\n")
}
saveAdvancedSettings()
})
})

updateReminderInputState()
syncPauseButtonState()
updateNightWorkStrengthLabel()
updateNightWorkControls()
updateBreakVisualControls()
syncBreakVisualBackgroundState()
updateProgressReport()
setAccountMode("signin")
restoreAccountSession()

aboutBtn.addEventListener("click", ()=>openDetailView("about"))
shortcutsBtn.addEventListener("click", ()=>openDetailView("shortcuts"))
settingsBtn.addEventListener("click", ()=>openDetailView("settings"))
accountBtn.addEventListener("click", ()=>openDetailView("account"))
supportBtn.addEventListener("click", ()=>openDetailView("support"))
backBtn.addEventListener("click", closeDetailView)

detailActionBtn.addEventListener("click", ()=>{
if(activeDetailKey==="shortcuts"){
requestTrialActivation("shortcuts")
return
}
if(activeDetailKey==="settings"){
requestTrialActivation("settings")
return
}
})

document.addEventListener("keydown", (e)=>{
if(!e.altKey) return
if(e.key.toLowerCase()==="b"){
closeDetailView()
return
}
})


