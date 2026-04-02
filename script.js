import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from "./firebase-config.js";

const distanceRange = document.getElementById("distanceRange");
const distanceValue = document.getElementById("distanceValue");
const statusEl = document.getElementById("status");
const car = document.getElementById("car");
const leadForm = document.getElementById("leadForm");
const leadStatus = document.getElementById("leadStatus");
const leadSubmit = document.getElementById("leadSubmit");

function setStatus(distance) {
  distanceValue.textContent = distance;

  let level = "safe";
  let label = "Status: bezpieczny dystans";

  if (distance <= 20 && distance > 10) {
    level = "warn";
    label = "Status: pojazd zbliża się";
  } else if (distance <= 10) {
    level = "danger";
    label = "Status: wysoki priorytet ostrzeżenia";
  }

  statusEl.className = `status ${level}`;
  statusEl.textContent = label;

  const scale = 0.5 + (40 - distance) * 0.03;
  const glow = 8 + (40 - distance) * 0.9;
  const bottomPx = 18 + (40 - distance) * 1.2;
  car.style.transform = `translateX(-50%) scale(${scale.toFixed(2)})`;
  car.style.boxShadow = `0 0 ${glow.toFixed(0)}px rgba(255,255,255,0.65)`;
  car.style.bottom = `${bottomPx.toFixed(0)}px`;
}

function hasFirebaseConfig(config) {
  if (!config) return false;
  const required = ["apiKey", "authDomain", "projectId", "appId"];
  return required.every((key) => {
    const value = config[key];
    return typeof value === "string" && value.length > 0 && !value.includes("YOUR_");
  });
}

function setLeadStatus(message, level = "") {
  leadStatus.className = `lead-status ${level}`.trim();
  leadStatus.textContent = message;
}

// Fade-in on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".feature-card, .tier-card, .support-card").forEach((el) => {
  el.classList.add("fade-in");
  observer.observe(el);
});

setStatus(Number(distanceRange.value));

distanceRange.addEventListener("input", (event) => {
  setStatus(Number(event.target.value));
});

if (!hasFirebaseConfig(firebaseConfig)) {
  setLeadStatus("Uzupełnij firebase-config.js, aby aktywować zapis zgłoszeń.", "error");
} else {
  const app = initializeApp(firebaseConfig);
  getAnalytics(app);
  const db = getFirestore(app);

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    leadSubmit.disabled = true;
    setLeadStatus("Wysyłanie zgłoszenia...", "");

    const formData = new FormData(leadForm);
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      gdprConsent: true,
      source: "trade-show-landing",
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "leads"), payload);
      setLeadStatus("Dziękujemy! Odezwiemy się wkrótce.", "success");
      leadForm.reset();
    } catch (error) {
      console.error("Błąd zapisu do Firestore:", error);
      setLeadStatus("Nie udało się wysłać zgłoszenia. Spróbuj ponownie.", "error");
    } finally {
      leadSubmit.disabled = false;
    }
  });
}
