// Default Config
let config = {
  pricePetrol: 163,
  priceDiesel: 145,
};

// State
let currentFuel = "Petrol"; // Petrol or Diesel
let currentInput = "";
let currentMode = "amount"; // 'amount' or 'liters'

// Load config from LocalStorage if exists
if (localStorage.getItem("fuelConfig")) {
  config = JSON.parse(localStorage.getItem("fuelConfig"));
}

// UI Elements
let displayAmount;
let displayLiters;
let displayPrice;
let configModal;
let editorFrame;

function selectFuel(type) {
  currentFuel = type;
  document
    .getElementById("btnPetrol")
    .classList.toggle("active", type === "Petrol");
  document
    .getElementById("btnDiesel")
    .classList.toggle("active", type === "Diesel");

  updateDisplay();
}

function pressKey(key) {
  if (key === "C") {
    currentInput = "";
  } else {
    // Prevent multiple decimals
    if (key === "." && currentInput.includes(".")) return;
    currentInput += key;
  }
  calculate();
}

function setInputMode(mode) {
  currentMode = mode;
  currentInput = ""; // Clear input on mode switch for safety

  // Update button styles
  document
    .getElementById("btnModeAmount")
    .classList.toggle("active", mode === "amount");
  document
    .getElementById("btnModeLiters")
    .classList.toggle("active", mode === "liters");

  calculate();
}

function calculate() {
  let price =
    currentFuel === "Petrol" ? config.pricePetrol : config.priceDiesel;
  let val = parseFloat(currentInput) || 0;

  let mode = currentMode; // 'amount' or 'liters'

  let totalAmount = 0;
  let totalLiters = 0;

  if (mode === "amount") {
    totalAmount = val;
    totalLiters = val / price;
  } else {
    totalLiters = val;
    totalAmount = val * price;
  }

  if (displayAmount) displayAmount.innerText = totalAmount.toFixed(2);
  if (displayLiters) displayLiters.innerText = totalLiters.toFixed(2);
  if (displayPrice) displayPrice.innerText = price.toFixed(2);
}

// Helper to refresh UI after fuel selection
function updateDisplay() {
  calculate();
}

function printReceipt() {
  if (parseFloat(currentInput) <= 0) return alert("Enter amount first");

  let template = localStorage.getItem("receiptTemplate");
  if (!template) {
    template =
      "<h2 style='text-align:center'>FUEL STATION</h2><br>Type: {{type}}<br>Price: {{price}}<br>Liters: {{liters}}<br><b>Total: {{total}}</b><br>Payment: {{paymentMethod}}<br>Paid: {{paid}}<br>Change: {{change}}";
  }

  let finalHtml = template
    .replace(/{{type}}/g, currentFuel)
    .replace(/{{price}}/g, document.getElementById("displayPrice").innerText)
    .replace(/{{liters}}/g, document.getElementById("displayLiters").innerText)
    .replace(/{{total}}/g, document.getElementById("displayAmount").innerText)
    .replace(/{{date}}/g, new Date().toLocaleString())
    .replace(
      /{{paymentMethod}}/g,
      (document.getElementById("paymentMethod")?.value || "").toString()
    )
    .replace(
      /{{paid}}/g,
      (document.getElementById("paidAmount")?.value || "").toString()
    )
    .replace(
      /{{change}}/g,
      (() => {
        const total =
          parseFloat(document.getElementById("displayAmount").innerText) || 0;
        const paid =
          parseFloat(document.getElementById("paidAmount")?.value) || 0;
        return (paid - total).toFixed(2);
      })()
    );

  // In-Page Print Logic
  const printable = document.getElementById("printableArea");
  const savedCss = localStorage.getItem("receiptCss") || "";
  printable.innerHTML = `
        <style>
            ${savedCss}
        </style>
        <div class="receipt-paper">${finalHtml}</div>
    `;

  // Trigger Print
  window.print();

  // Reset after print
  currentInput = "";
  calculate();
}

// Listen for updates from Editor window (via localStorage event)
window.addEventListener("storage", (e) => {
  if (e.key === "fuelConfig" && localStorage.getItem("fuelConfig")) {
    config = JSON.parse(localStorage.getItem("fuelConfig"));
    calculate();
  }
});

// Wait for HTML to load completely
document.addEventListener("DOMContentLoaded", () => {
  // Assign UI element references
  displayAmount = document.getElementById("displayAmount");
  displayLiters = document.getElementById("displayLiters");
  displayPrice = document.getElementById("displayPrice");

  // Modal Elements
  configModal = document.getElementById("configModal");
  editorFrame = document.getElementById("editorFrame");
  const btnConfig = document.getElementById("btnConfig");
  const spanClose = document.getElementsByClassName("close-modal")[0];

  if (btnConfig) {
    btnConfig.addEventListener("click", () => {
      configModal.style.display = "block";
      // Reload iframe to ensure fresh config is loaded if needed, though mostly localStorage handles it
      editorFrame.src = editorFrame.src;
    });
  }

  if (spanClose) {
    spanClose.onclick = function () {
      configModal.style.display = "none";
    };
  }

  window.onclick = function (event) {
    if (event.target == configModal) {
      configModal.style.display = "none";
    }
  };

  // Payment UI handling
  const paymentMethod = document.getElementById("paymentMethod");
  const paidAmount = document.getElementById("paidAmount");
  const changeAmount = document.getElementById("changeAmount");

  function updatePaymentUI() {
    if (paymentMethod.value === "cash") {
      paidAmount.style.display = "inline";
      changeAmount.style.display = "inline";
    } else {
      paidAmount.style.display = "none";
      changeAmount.style.display = "none";
    }
    calculateChange();
  }

  paymentMethod.addEventListener("change", updatePaymentUI);
  paidAmount.addEventListener("input", calculateChange);

  function calculateChange() {
    const total = parseFloat(displayAmount.innerText) || 0;
    const paid = parseFloat(paidAmount.value) || 0;
    const change = paid - total;
    if (paymentMethod.value === "cash" && paidAmount.value) {
      changeAmount.textContent = `Change: ${change.toFixed(2)}`;
    } else {
      changeAmount.textContent = "";
    }
  }

  // Keyboard numeric input handling
  document.addEventListener("keydown", (e) => {
    const key = e.key;
    if (
      (key >= "0" && key <= "9") ||
      key === "." ||
      key === "Enter" ||
      key === "Backspace"
    ) {
      if (document.activeElement === paidAmount) {
        return; // let input handle it
      }
      if (key === "Enter") {
        printReceipt();
      } else if (key === "Backspace") {
        pressKey("C");
      } else {
        pressKey(key);
      }
      e.preventDefault();
    }
  });

  // Initialize defaults
  selectFuel("Petrol");
  setInputMode("amount");
  updatePaymentUI();
});
