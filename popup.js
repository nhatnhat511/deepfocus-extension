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
const nightWorkSmartInput = document.getElementById("nightWorkSmart")
const nightWorkStrengthInput = document.getElementById("nightWorkStrength")
const nightWorkStrengthValue = document.getElementById("nightWorkStrengthValue")
const distractionMuteEnabledInput = document.getElementById("distractionMuteEnabled")
const distractionDomainsInput = document.getElementById("distractionDomains")
const breakVisualEnabledInput = document.getElementById("breakVisualEnabled")
const idleAutoPauseEnabledInput = document.getElementById("idleAutoPauseEnabled")
const idleAutoPauseMinutesInput = document.getElementById("idleAutoPauseMinutes")
const dailyFocusGoalInput = document.getElementById("dailyFocusGoal")
const progressReport = document.getElementById("progressReport")
const meetingAutoPauseEnabledInput = document.getElementById("meetingAutoPauseEnabled")
const accountPanel = document.getElementById("accountPanel")
const accountStatus = document.getElementById("accountStatus")
const accountEmailInput = document.getElementById("accountEmail")
const accountPasswordInput = document.getElementById("accountPassword")
const accountSignInBtn = document.getElementById("accountSignInBtn")
const accountSignUpBtn = document.getElementById("accountSignUpBtn")
const accountRefreshBtn = document.getElementById("accountRefreshBtn")
const accountSignOutBtn = document.getElementById("accountSignOutBtn")
const accountMeta = document.getElementById("accountMeta")
const accountAuthFields = document.getElementById("accountAuthFields")
const accountAuthActions = document.getElementById("accountAuthActions")
const accountSessionActions = document.getElementById("accountSessionActions")
let isPaused = false
let activeDetailKey = null
let soundEnabled = true
let nightWorkEnabled = false
let nightWorkSmart = true
let nightWorkStrength = 38
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

const SUPABASE_URL = "https://jpgywjxztjkayynptjrs.supabase.co"
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr"
const AUTH_STORAGE_KEY = "deepfocusSupabaseSession"
const AUTH_EMAIL_REDIRECT_URL = "https://deepfocustime.com/auth/callback"

function setPauseLabel(paused){
isPaused = paused
pauseBtn.textContent = paused ? "\u25B6 Resume" : "\u23F8 Pause"
}

const detailConfig = {
about: {
title: "About DeepFocus",
text: "DeepFocus helps you stay productive with a clean focus/break timer, smart reminder popups, and a draggable on-page timer overlay.",
list: [],
actionLabel: ""
},
shortcuts: {
title: "Keyboard Shortcuts",
text: "Use these DeepFocus shortcuts to control your work session quickly. This feature is available in Premium only.",
list: [
"Alt+S: Start timer",
"Alt+P: Pause/Resume",
"Alt+R: Reset timer",
"Alt+B: Go back (inside popup)"
],
actionLabel: "Upgrade to Premium"
},
settings: {
title: "Advanced Settings (Premium)",
text: "Advanced Premium tools to improve comfort and consistency during long sessions.",
list: [
"Night Work Mode: Real-time adaptive dimming for late sessions.",
"Idle Auto-Pause: Automatically pauses after inactivity."
],
actionLabel: ""
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
"Refund: https://deepfocustime.com/refund",
"Delete Data: https://deepfocustime.com/delete-data"
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
detailActionBtn.style.display = "block"
detailActionBtn.textContent = cfg.actionLabel
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

function saveAdvancedSettings(){
nightWorkEnabled = nightWorkEnabledInput.checked
nightWorkSmart = nightWorkSmartInput.checked
nightWorkStrength = Number(nightWorkStrengthInput.value)
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
updateProgressReport()

chrome.runtime.sendMessage({
type:"UPDATE_ADVANCED_SETTINGS",
nightWorkEnabled,
nightWorkSmart,
nightWorkStrength,
distractionMuteEnabled,
distractionDomains,
breakVisualEnabled,
idleAutoPauseEnabled,
idleAutoPauseMinutes,
dailyFocusGoal,
meetingAutoPauseEnabled
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
accountSignInBtn.disabled = loading
accountSignUpBtn.disabled = loading
accountRefreshBtn.disabled = loading
accountSignOutBtn.disabled = loading
}

function syncAccountUiBySession(){
const signedIn = !!(authSession && authSession.user)
accountAuthFields.classList.toggle("hidden", signedIn)
accountAuthActions.classList.toggle("hidden", signedIn)
accountSessionActions.classList.toggle("hidden", !signedIn)
if(signedIn){
accountPasswordInput.value = ""
}
}

function renderAccountMeta(){
if(!authSession || !authSession.user){
accountMeta.innerHTML = "<strong>Plan:</strong> Free"
return
}

const userEmail = authSession.user.email || "-"
const plan = (accountProfile && accountProfile.plan) ? accountProfile.plan : "free"
const premiumUntil = accountProfile && accountProfile.premium_until ? new Date(accountProfile.premium_until).toLocaleString() : "N/A"
accountMeta.innerHTML = `<strong>Email:</strong> ${userEmail}<br><strong>Plan:</strong> ${plan}<br><strong>Premium Until:</strong> ${premiumUntil}`
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
renderAccountMeta()
}

async function fetchCurrentUser(){
if(!authSession || !authSession.access_token) return null
const user = await supabaseRequest("/auth/v1/user", { method: "GET" }, authSession.access_token)
authSession.user = user
await saveSessionToStorage(authSession)
return user
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
await supabaseRequest("/auth/v1/signup", {
method: "POST",
body: JSON.stringify({
email,
password,
options: {
emailRedirectTo: AUTH_EMAIL_REDIRECT_URL
}
})
})
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
setAccountStatus("Signed out.", false)
renderAccountMeta()
syncAccountUiBySession()
updateAccountButtonsLoading(false)
}
}

async function restoreAccountSession(){
authSession = await loadSessionFromStorage()
if(!authSession){
renderAccountMeta()
syncAccountUiBySession()
return
}

try{
await fetchCurrentUser()
await fetchProfile()
setAccountStatus("Session restored.", false)
syncAccountUiBySession()
}catch(_e){
authSession = null
accountProfile = null
await clearSessionStorage()
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
if(typeof state.nightWorkSmart === "boolean"){
nightWorkSmart = state.nightWorkSmart
nightWorkSmartInput.checked = state.nightWorkSmart
}
if(typeof state.nightWorkStrength === "number"){
nightWorkStrength = Math.max(10, Math.min(75, Math.round(state.nightWorkStrength)))
nightWorkStrengthInput.value = String(nightWorkStrength)
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
updateNightWorkStrengthLabel()
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


const tickSound = document.getElementById("tickSound")
const dingSound = document.getElementById("dingSound")

let lastSecond = null

chrome.runtime.onMessage.addListener((msg)=>{

if(msg.type==="UPDATE"){
if(typeof msg.isPaused === "boolean"){
setPauseLabel(msg.isPaused)
}

let seconds = Math.ceil((msg.endTime - Date.now())/1000)

if(seconds<0) seconds=0

if(seconds !== lastSecond){

lastSecond = seconds

// tick 10→1
if(seconds <=10 && seconds >=1){
if(soundEnabled){
tickSound.currentTime = 0
tickSound.play()
}

}

// ding 0
if(seconds === 0){
if(soundEnabled){
dingSound.currentTime = 0
dingSound.play()
}

}

}

}

})

lunchEnabledInput.addEventListener("change", saveReminderSettings)
lunchTimeInput.addEventListener("change", saveReminderSettings)
dinnerEnabledInput.addEventListener("change", saveReminderSettings)
dinnerTimeInput.addEventListener("change", saveReminderSettings)
soundEnabledInput.addEventListener("change", saveAudioSettings)
nightWorkEnabledInput.addEventListener("change", saveAdvancedSettings)
nightWorkSmartInput.addEventListener("change", saveAdvancedSettings)
nightWorkStrengthInput.addEventListener("input", ()=>{
if(!nightWorkEnabledInput.checked){
nightWorkEnabledInput.checked = true
}
saveAdvancedSettings()
})
distractionMuteEnabledInput.addEventListener("change", saveAdvancedSettings)
distractionDomainsInput.addEventListener("change", saveAdvancedSettings)
breakVisualEnabledInput.addEventListener("change", saveAdvancedSettings)
idleAutoPauseEnabledInput.addEventListener("change", saveAdvancedSettings)
idleAutoPauseMinutesInput.addEventListener("change", saveAdvancedSettings)
dailyFocusGoalInput.addEventListener("change", saveAdvancedSettings)
meetingAutoPauseEnabledInput.addEventListener("change", saveAdvancedSettings)
accountSignInBtn.addEventListener("click", signInWithPassword)
accountSignUpBtn.addEventListener("click", signUpWithPassword)
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
updateProgressReport()
restoreAccountSession()

aboutBtn.addEventListener("click", ()=>openDetailView("about"))
shortcutsBtn.addEventListener("click", ()=>openDetailView("shortcuts"))
settingsBtn.addEventListener("click", ()=>openDetailView("settings"))
accountBtn.addEventListener("click", ()=>openDetailView("account"))
supportBtn.addEventListener("click", ()=>openDetailView("support"))
backBtn.addEventListener("click", closeDetailView)

detailActionBtn.addEventListener("click", ()=>{
if(activeDetailKey==="shortcuts"){
alert("Premium shortcut upgrade flow will be connected soon.")
return
}
if(activeDetailKey==="settings"){
alert("Premium settings are available in the paid version.")
return
}
if(activeDetailKey==="account"){
alert("Account and Premium signup will be available soon.")
}
})

document.addEventListener("keydown", (e)=>{
if(!e.altKey) return
if(e.key.toLowerCase()==="b"){
closeDetailView()
return
}
})
