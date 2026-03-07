const tick = new Audio(chrome.runtime.getURL("sounds/tick.mp3"))
const ding = new Audio(chrome.runtime.getURL("sounds/ding.mp3"))

tick.preload = "auto"
ding.preload = "auto"

function play(sound) {
  try {
    sound.currentTime = 0
    const p = sound.play()
    if (p && typeof p.catch === "function") {
      p.catch(() => {})
    }
  } catch (_e) {
    // no-op
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "PLAY_TICK") {
    play(tick)
  }

  if (msg.type === "PLAY_DING") {
    play(ding)
  }
})