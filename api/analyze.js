export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { agreement, adminCode } = req.body || {};
const isAdmin = adminCode === process.env.ADMIN_ACCESS_CODE;
    if (!agreement || !agreement.trim()) {
      return res.status(400).json({ error: "Agreement text is required." });
    }

    const teaserPrompt = `
You are a contract risk analysis assistant.

Analyze the agreement and return a teaser only in clean plain text.

Rules:
- Do not use markdown
- Do not use asterisks
- Do not use hash symbols
- Do not bold anything
- Keep it clear and easy to read
- Do not provide the full review
- Limit the risks section to 2 items only
- Do not include a full list of questions
- End with a short line inviting the user to unlock the full review

Use this exact structure:

Summary in Plain English
[short summary]

Top 2 Risks
- [risk 1]
- [risk 2]

Final Risk Rating
[Low, Medium, or High]

Unlock the full review for more risks and questions to raise before signing.

Agreement:
${agreement}
`;

const fullPrompt = `
You are a contract risk analysis assistant.

Analyze the agreement and return the full review in clean plain text.

Rules:
- Do not use markdown
- Do not use asterisks
- Do not use hash symbols
- Do not bold anything
- Keep it clear and easy to read
- Write in short plain-English sections

Use this exact structure:

Summary in Plain English
[short summary]

Key Risks
- [risk 1]
- [risk 2]
- [risk 3]
- [risk 4]

Questions to Raise Before Signing
- [question 1]
- [question 2]
- [question 3]

Final Risk Rating
[Low, Medium, or High]

Agreement:
${agreement}
`;

const prompt = isAdmin ? fullPrompt : teaserPrompt;

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
            content: "You explain contract risk clearly, briefly, and in plain English. Return plain text only, never markdown."
            
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
