export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { agreement } = req.body || {};

    if (!agreement || !agreement.trim()) {
      return res.status(400).json({ error: "Agreement text is required." });
    }

    const prompt = `
You are a contract risk analysis assistant.

Analyze the following agreement and identify:

1. Clauses that create risk for the person signing
2. Unusual or unfair terms
3. Payment risks or obligations
4. Liability issues
5. Anything that should be questioned before signing

Then provide:

- A simple summary in plain English
- A bullet list of key risks
- A final risk rating: Low, Medium, or High

Agreement:
${agreement}
    `;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You explain contract risk clearly, briefly, and in plain English."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error(data);
      return res.status(500).json({
        error: data?.error?.message || "OpenAI request failed."
      });
    }

    const result = data?.choices?.[0]?.message?.content || "No result returned.";

    return res.status(200).json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error." });
  }
}
