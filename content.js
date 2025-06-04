// Create the floating emoji element
const floatingEmoji = document.createElement("div");
floatingEmoji.className = "floating-emoji";
floatingEmoji.innerHTML = "😊";
document.body.appendChild(floatingEmoji);

// Toggle border state
let isBorderActive = false;

// Add click event listener
floatingEmoji.addEventListener("click", () => {
  isBorderActive = !isBorderActive;
  if (isBorderActive) {
    document.body.classList.add("webpage-border");
  } else {
    document.body.classList.remove("webpage-border");
  }
});
