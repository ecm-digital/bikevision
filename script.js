import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";
import emailjs from "@emailjs/browser";
import { firebaseConfig } from "./firebase-config.js";
import { emailjsConfig } from "./emailjs-config.js";
import { initI18n, setLang, getLang } from "./i18n.js";
import { initChat } from "./chat-widget.js";

// Mobile menu
const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileOverlay = document.getElementById("mobileOverlay");

if (hamburgerBtn && mobileOverlay) {
  hamburgerBtn.addEventListener("click", () => {
    const isOpen = hamburgerBtn.classList.toggle("open");
    mobileOverlay.classList.toggle("open", isOpen);
    hamburgerBtn.setAttribute("aria-expanded", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  mobileOverlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      hamburgerBtn.classList.remove("open");
      mobileOverlay.classList.remove("open");
      hamburgerBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
}

// Language switcher
const langSwitch = document.getElementById("langSwitch");
if (langSwitch) {
  langSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn");
    if (btn && btn.dataset.lang) {
      setLang(btn.dataset.lang);
    }
  });
}

initI18n();

const angleRange = document.getElementById("angleRange");
const beamTarget = document.getElementById("beamTarget");
const carSource = document.getElementById("carSource");
const leadForm = document.getElementById("leadForm");
const leadStatus = document.getElementById("leadStatus");
const leadSubmit = document.getElementById("leadSubmit");
const betaForm = document.getElementById("betaForm");
const betaStatus = document.getElementById("betaStatus");
const betaSubmit = document.getElementById("betaSubmit");
const newsletterForm = document.getElementById("newsletterForm");
const newsletterStatus = document.getElementById("newsletterStatus");
const newsletterSubmit = document.getElementById("newsletterSubmit");
const orderForm = document.getElementById("orderForm");
const orderStatus = document.getElementById("orderStatus");
const orderSubmit = document.getElementById("orderSubmit");

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
  if (!leadStatus) return;
  leadStatus.className = `form-status ${level}`.trim();
  leadStatus.textContent = message;
}

function setFormStatus(element, message, level = "") {
  if (!element) return;
  element.className = `form-status ${level}`.trim();
  element.textContent = message;
}

function validateForm(form) {
  if (!form) return false;
  let valid = true;
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (!field.checkValidity()) {
      field.classList.add("touched");
      valid = false;
    }
  });
  if (!valid) {
    const first = form.querySelector(":invalid");
    if (first) first.focus();
  }
  return valid;
}

// Mark fields as touched on blur for CSS validation styling
document.querySelectorAll(".site-form input, .site-form select, .site-form textarea, .newsletter-form input").forEach((field) => {
  field.addEventListener("blur", () => field.classList.add("touched"));
});

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

// Countdown timer
const LAUNCH_DATE = new Date("2026-04-11T00:00:00").getTime();
const countDays = document.getElementById("countDays");
const countHours = document.getElementById("countHours");
const countMinutes = document.getElementById("countMinutes");
const countSeconds = document.getElementById("countSeconds");

const countdownGrid = document.getElementById("countdownGrid");
const countdownLaunched = document.getElementById("countdownLaunched");
const countdownLabel = document.querySelector(".countdown-label");
let countdownInterval = null;

function updateCountdown() {
  const diff = LAUNCH_DATE - Date.now();
  if (diff <= 0) {
    if (countdownGrid) countdownGrid.style.display = "none";
    if (countdownLabel) countdownLabel.style.display = "none";
    if (countdownLaunched) countdownLaunched.style.display = "";
    if (countdownInterval) clearInterval(countdownInterval);
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (countDays) countDays.textContent = String(d).padStart(2, "0");
  if (countHours) countHours.textContent = String(h).padStart(2, "0");
  if (countMinutes) countMinutes.textContent = String(m).padStart(2, "0");
  if (countSeconds) countSeconds.textContent = String(s).padStart(2, "0");
}

if (countDays) {
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

// Parallax hero
const heroSection = document.querySelector(".hero");
if (heroSection) {
  const heroVideo = heroSection.querySelector(".hero-video-wrap");
  const heroTitle = heroSection.querySelector(".hero-title");
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const heroH = heroSection.offsetHeight;
    if (scrollY < heroH) {
      const ratio = scrollY / heroH;
      if (heroVideo) heroVideo.style.transform = `translateY(${ratio * 40}px)`;
      if (heroTitle) heroTitle.style.transform = `translateY(${ratio * 60}px)`;
    }
  }, { passive: true });
}

// Glow tracking on cards
document.querySelectorAll(".glow-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  });
});

// Setup Optics Demo
if (angleRange) {
  setAngle(Number(angleRange.value));
  angleRange.addEventListener("input", (event) => {
    setAngle(Number(event.target.value));
  });
}

function hasEmailJSConfig(cfg) {
  if (!cfg) return false;
  return ["serviceId", "templateId", "publicKey"].every(
    (k) => typeof cfg[k] === "string" && cfg[k].length > 0 && !cfg[k].includes("YOUR_")
  );
}

if (hasEmailJSConfig(emailjsConfig)) {
  emailjs.init({ publicKey: emailjsConfig.publicKey });
}

async function sendOrderConfirmation(name, email, quantity) {
  if (!hasEmailJSConfig(emailjsConfig)) return;
  try {
    await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, {
      to_name: name,
      to_email: email,
      quantity,
      lang: getLang(),
    });
  } catch (err) {
    console.warn("EmailJS send failed:", err);
  }
}

let analytics = null;

function getConsentStatus() {
  return localStorage.getItem("cookie_consent");
}

function showCookieBanner() {
  const banner = document.getElementById("cookieBanner");
  if (!banner) return;
  banner.style.display = "flex";
  document.getElementById("cookieAccept")?.addEventListener("click", () => {
    localStorage.setItem("cookie_consent", "accepted");
    banner.style.display = "none";
    enableAnalytics();
  });
  document.getElementById("cookieReject")?.addEventListener("click", () => {
    localStorage.setItem("cookie_consent", "rejected");
    banner.style.display = "none";
  });
}

function enableAnalytics() {
  if (!analytics && window.__firebaseApp) {
    analytics = getAnalytics(window.__firebaseApp);
  }
}

// Setup Firebase
if (!hasFirebaseConfig(firebaseConfig)) {
  if(leadStatus) setLeadStatus("Uzupełnij firebase-config.js, aby aktywować zapis wg Firebase.", "error");
  setFormStatus(betaStatus, "Uzupełnij firebase-config.js, aby aktywować beta testy.", "error");
  setFormStatus(newsletterStatus, "Uzupełnij firebase-config.js, aby aktywować newsletter.", "error");
} else {
  const app = initializeApp(firebaseConfig);
  window.__firebaseApp = app;
  const consent = getConsentStatus();
  if (consent === "accepted") {
    analytics = getAnalytics(app);
  } else if (!consent) {
    showCookieBanner();
  }
  const db = getFirestore(app);
  initChat();

  (async () => {
    try {
      const counterDoc = await getDoc(doc(db, "counters", "orders"));
      if (counterDoc.exists()) {
        const count = counterDoc.data().count || 0;
        if (count > 0) {
          const el = document.getElementById("orderCounter");
          const val = document.getElementById("orderCountValue");
          if (el && val) {
            val.textContent = count;
            el.style.display = "";
          }
        }
      }
    } catch (e) {
      // counter not available — silently ignore
    }
  })();

  if (leadForm) {
    leadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(leadForm)) return;
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
        if (analytics) logEvent(analytics, "generate_lead", { source: "contact-form" });
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

  if (betaForm) {
    betaForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(betaForm)) return;
      betaSubmit.disabled = true;
      setFormStatus(betaStatus, "Wysyłanie zgłoszenia beta testera...", "");

      const formData = new FormData(betaForm);
      const payload = {
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        ridingStyle: String(formData.get("ridingStyle") || "").trim(),
        notes: String(formData.get("notes") || "").trim(),
        source: "beta-tester-form",
        createdAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "beta_testers"), payload);
        if (analytics) logEvent(analytics, "sign_up", { method: "beta-tester" });
        setFormStatus(betaStatus, "Dzięki! Zgłoszenie do beta testów zostało zapisane.", "success");
        betaForm.reset();
      } catch (error) {
        console.error("Błąd zapisu beta testera:", error);
        setFormStatus(betaStatus, "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.", "error");
      } finally {
        betaSubmit.disabled = false;
      }
    });
  }

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(newsletterForm)) return;
      newsletterSubmit.disabled = true;
      setFormStatus(newsletterStatus, "Zapisywanie do newslettera...", "");

      const formData = new FormData(newsletterForm);
      const email = String(formData.get("email") || "").trim();
      const payload = {
        email,
        source: "newsletter-form",
        createdAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "newsletter_subscribers"), payload);
        if (analytics) logEvent(analytics, "sign_up", { method: "newsletter" });
        setFormStatus(newsletterStatus, "Super! Jesteś zapisany do newslettera.", "success");
        newsletterForm.reset();
      } catch (error) {
        console.error("Błąd zapisu newsletter:", error);
        setFormStatus(newsletterStatus, "Nie udało się zapisać. Spróbuj ponownie.", "error");
      } finally {
        newsletterSubmit.disabled = false;
      }
    });
  }

  if (orderForm) {
    orderForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(orderForm)) return;
      orderSubmit.disabled = true;
      setFormStatus(orderStatus, "Składanie zamówienia...", "");

      const formData = new FormData(orderForm);
      const payload = {
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        quantity: String(formData.get("quantity") || "1"),
        notes: String(formData.get("notes") || "").trim(),
        gdprConsent: true,
        source: "preorder-form",
        status: "new",
        createdAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "orders"), payload);
        if (analytics) logEvent(analytics, "purchase", { method: "preorder" });
        sendOrderConfirmation(payload.fullName, payload.email, payload.quantity);
        setFormStatus(orderStatus, "Dziękujemy! Twoje zamówienie zostało złożone. Odezwiemy się wkrótce.", "success");
        orderForm.reset();
      } catch (error) {
        console.error("Błąd zapisu zamówienia:", error);
        setFormStatus(orderStatus, "Nie udało się złożyć zamówienia. Spróbuj ponownie.", "error");
      } finally {
        orderSubmit.disabled = false;
      }
    });
  }

  document.querySelectorAll("[data-track]").forEach((el) => {
    el.addEventListener("click", () => {
      if (analytics) logEvent(analytics, "select_content", {
        content_type: "cta",
        content_id: el.getAttribute("data-track"),
      });
    });
  });
}
