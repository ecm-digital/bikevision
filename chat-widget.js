import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyCsWJ1OUjWga-UeidhsXKYSnHLh0opk8eg";

const SYSTEM_PROMPT = `Jesteś asystentem 360 VISION — innowacyjnego systemu tylnej wizji dla rowerzystów.

## O produkcie
360 VISION to optyczny system soczewek montowany na kasku rowerowym. Precyzyjnie zaprojektowany układ soczewek przechwytuje obraz drogi za rowerzystą i kieruje go wprost do pola widzenia. To czysta optyka — bez elektroniki, bez baterii, bez ładowania.

## Jak działa
1. Soczewka zbierająca — tylna soczewka przechwytuje szeroki obraz drogi za rowerzystą, podobnie jak lusterko, ale bez wystających elementów.
2. Układ optyczny — światło przechodzi przez precyzyjnie ustawione soczewki wewnątrz nakładki, które kierują i korygują obraz.
3. Obraz w polu widzenia — końcowa soczewka wyświetla obraz z tyłu dyskretnie w rogu pola widzenia, widoczny jednym spojrzeniem, bez odwracania głowy.

## Przedsprzedaż
Pierwsza partia trafi do osób, które zarezerwują miejsce przed premierą. Edycja założycielska gwarantuje cenę przedpremierową, priorytetową wysyłkę i bezpośredni kontakt z zespołem.

## Beta testy
Szukamy aktywnych rowerzystów do testów prototypu. Beta testerzy dostają wczesny dostęp, bezpośrednią linię do zespołu i zniżkę na wersję premierową. Style jazdy: miasto, szosa, MTB/gravel, triathlon.

## Partnerzy
Szukamy inwestorów i partnerów dystrybucyjnych (sklepy rowerowe, sieci). Kontakt: invest@360vision.bike (inwestorzy), partner@360vision.bike (dystrybutorzy).

## Zespół
Projekt powstaje na styku inżynierii optycznej, designu produktowego i pasji do kolarstwa.

## Bezpieczeństwo rowerzystów
Odwracanie głowy podczas jazdy to utrata kontroli. Lusterka blokują widok i wypadają na nierównościach. 360 VISION rozwiązuje ten problem — widzisz co jest za Tobą bez odwracania głowy.

## Zasady odpowiedzi
- Odpowiadaj w języku, w którym pisze użytkownik (po polsku lub po angielsku).
- Bądź pomocny, konkretny i entuzjastyczny wobec produktu.
- Jeśli nie znasz odpowiedzi, zaproponuj kontakt z zespołem.
- Odpowiedzi maks 2-3 zdania, chyba że użytkownik prosi o więcej.
- Nie wymyślaj informacji, których nie ma w kontekście.
- Nie podawaj ceny, bo nie jest jeszcze ustalona — zachęcaj do rezerwacji w przedsprzedaży.`;

let chat = null;

export function initChat() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 400,
      temperature: 0.7,
    },
  });

  chat = model.startChat({ history: [] });

  const widget = document.getElementById("chatWidget");
  const toggle = document.getElementById("chatToggle");
  const close = document.getElementById("chatClose");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");

  if (!widget || !toggle || !form) return;

  toggle.addEventListener("click", () => widget.classList.toggle("open"));
  close.addEventListener("click", () => widget.classList.remove("open"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !chat) return;

    appendMsg(messages, text, "user");
    input.value = "";
    input.disabled = true;

    const typingEl = appendMsg(messages, "...", "ai typing");

    try {
      const result = await chat.sendMessage(text);
      const reply = result.response.text();
      typingEl.remove();
      appendMsg(messages, reply, "ai");
    } catch (err) {
      typingEl.remove();
      const errorText =
        document.documentElement.lang === "en"
          ? "Something went wrong. Try again."
          : "Coś poszło nie tak. Spróbuj ponownie.";
      appendMsg(messages, errorText, "ai error-msg");
      console.error("Chat error:", err);
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
}

function appendMsg(container, text, classes) {
  const div = document.createElement("div");
  const isUser = classes.includes("user");
  div.className = `chat-msg ${isUser ? "user-msg" : "ai-msg"} ${classes.includes("typing") ? "typing" : ""} ${classes.includes("error-msg") ? "error-msg" : ""}`.trim();
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}
