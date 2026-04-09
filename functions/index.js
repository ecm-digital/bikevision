import { onCall, HttpsError } from "firebase-functions/v2/https";
import { VertexAI } from "@google-cloud/vertexai";

const SYSTEM_PROMPT = `Jesteś asystentem 360 VISION — innowacyjnego systemu tylnej wizji dla rowerzystów.

## O produkcie
360 VISION to optyczny system soczewek montowany na kasku rowerowym. Precyzyjnie zaprojektowany układ soczewek przechwytuje obraz drogi za rowerzystą i kieruje go wprost do pola widzenia. To czysta optyka — bez elektroniki, bez baterii, bez ładowania.

## Jak działa
1. **Soczewka zbierająca** — tylna soczewka przechwytuje szeroki obraz drogi za rowerzystą, podobnie jak lusterko, ale bez wystających elementów.
2. **Układ optyczny** — światło przechodzi przez precyzyjnie ustawione soczewki wewnątrz nakładki, które kierują i korygują obraz.
3. **Obraz w polu widzenia** — końcowa soczewka wyświetla obraz z tyłu dyskretnie w rogu pola widzenia, widoczny jednym spojrzeniem, bez odwracania głowy.

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

const MAX_MESSAGES_PER_SESSION = 20;
const PROJECT_ID = "bikevision-96319";
const LOCATION = "europe-west1";

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
  generationConfig: {
    maxOutputTokens: 400,
    temperature: 0.7,
  },
});

export const chat = onCall(
  { region: "europe-west1", maxInstances: 10 },
  async (request) => {
    const { message, history } = request.data || {};

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      throw new HttpsError("invalid-argument", "Message is required.");
    }

    if (message.length > 1000) {
      throw new HttpsError("invalid-argument", "Message too long (max 1000 chars).");
    }

    const validHistory = Array.isArray(history) ? history.slice(-MAX_MESSAGES_PER_SESSION * 2) : [];

    const contents = validHistory
      .filter((h) => h.role && h.text)
      .map((h) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      }));

    contents.push({ role: "user", parts: [{ text: message.trim() }] });

    try {
      const result = await model.generateContent({ contents });
      const response = result.response;
      const text =
        response.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Przepraszam, nie mogę teraz odpowiedzieć. Spróbuj ponownie.";

      return { reply: text };
    } catch (err) {
      console.error("Vertex AI error:", err);
      throw new HttpsError("internal", "AI service unavailable. Try again later.");
    }
  }
);
