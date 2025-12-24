// backend/src/modules/chatbot/llmClient.js
export async function llmChat({ baseUrl, system, user, temperature = 0.25, max_tokens = 160 }) {
  if (!baseUrl) return "";
  const url = `${String(baseUrl).replace(/\/$/, "")}/v1/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "local",
      messages: [
        { role: "system", content: system || "" },
        { role: "user", content: user || "" },
      ],
      temperature,
      max_tokens,
    }),
  });

  if (!res.ok) return "";
  const json = await res.json().catch(() => ({}));
  return (json?.choices?.[0]?.message?.content || "").trim();
}
