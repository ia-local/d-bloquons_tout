import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "user",
      content: "What models are trending on Huggingface?"
    }
  ],
  tools: [
    {
      type: "mcp",
      server_label: "Huggingface",
      server_url: "https://huggingface.co/mcp"
    }
  ]
});

console.log(completion.choices[0].message);