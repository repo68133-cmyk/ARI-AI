import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(".")); // serve index.html

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

const SYSTEM_PROMPT = `
Sei ARI, assistente AI ufficiale.
Parli in italiano in modo chiaro, professionale e sintetico.
Obiettivi:
1) Rispondere a domande su servizi, processi e supporto.
2) Guidare l'utente al prossimo passo in modo pratico.
3) Se mancano dati, dirlo con trasparenza senza inventare.
Regole:
- Non fornire consigli legali o medici personalizzati.
- Mantieni risposte concise, orientate all'azione.
`;

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ari-ai-site" });
});

app.post("/chat", async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY non configurata nel file .env." });
    }

    const msg = typeof req.body.message === "string" ? req.body.message.trim() : "";
    const history = Array.isArray(req.body.history) ? req.body.history : [];

    if (!msg) {
      return res.status(400).json({ error: "Messaggio mancante." });
    }

    const safeHistory = history
      .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
      .slice(-12)
      .map((item) => ({ role: item.role, content: item.content }));

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...safeHistory,
      { role: "user", content: msg }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages
    });

    const reply = completion.choices?.[0]?.message?.content || "Non riesco a rispondere in questo momento.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    const apiError = err?.error?.message || err?.message || "Errore AI";
    res.status(500).json({ error: apiError });
  }
});

app.listen(3000, () => {
  console.log("🤖 Ari online su http://localhost:3000");
});
