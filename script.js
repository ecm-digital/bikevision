import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from "./firebase-config.js";

const angleRange = document.getElementById("angleRange");
const beamTarget = document.getElementById("beamTarget");
const carSource = document.getElementById("carSource");
const leadForm = document.getElementById("leadForm");
const leadStatus = document.getElementById("leadStatus");
const leadSubmit = document.getElementById("leadSubmit");

function setAngle(val) {
  // val is 0 to 100.
  // Map it to angles, e.g. -20deg to +20deg
  const degrees = (val - 50) * 0.4;
  
  if (beamTarget) {
    beamTarget.style.transform = `rotate(${degrees}deg)`;
    // the beam width logic is in CSS pulse-beam, but we can also set the length dynamic if needed
  }
  
  if (carSource) {
    // move the car source up and down based on angle
    const translateY = -50 + degrees * 2;
    carSource.style.transform = `translateY(${translateY}%)`;
  }
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

document.querySelectorAll(".fade-in").forEach((el) => {
  observer.observe(el);
});

// Setup Optics Demo
if (angleRange) {
  setAngle(Number(angleRange.value));
  angleRange.addEventListener("input", (event) => {
    setAngle(Number(event.target.value));
  });
}

// Setup Firebase
if (!hasFirebaseConfig(firebaseConfig)) {
  if(leadStatus) setLeadStatus("Uzupełnij firebase-config.js, aby aktywować zapis wg Firebase.", "error");
} else {
  const app = initializeApp(firebaseConfig);
  getAnalytics(app);
  const db = getFirestore(app);

  if (leadForm) {
    leadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      leadSubmit.disabled = true;
      setLeadStatus("Wysyłanie...", "");

      const formData = new FormData(leadForm);
      const payload = {
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        company: String(formData.get("company") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        gdprConsent: true,
        source: "trade-show-landing-optical",
        createdAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "leads"), payload);
        setLeadStatus("Dziękujemy za kontakt. Odezwiemy się wkrótce.", "success");
        leadForm.reset();
      } catch (error) {
        console.error("Błąd zapisu do Firestore:", error);
        setLeadStatus("Wystąpił błąd podczas wysyłania. Spróbuj powtórnie.", "error");
      } finally {
        leadSubmit.disabled = false;
      }
    });
  }
}
