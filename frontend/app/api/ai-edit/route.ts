import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, timeline } = await req.json();

    // Fetch API key from backend
    const keyRes = await fetch("http://localhost:8080/api/video-editor/openai-key");
    if (!keyRes.ok) {
      return NextResponse.json({ error: "Failed to fetch OpenAI key from backend" }, { status: 500 });
    }
    const keyData = await keyRes.json();
    const apiKey = keyData.apiKey;

    const payload = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI video timeline editor. The user provides a timeline JSON and a prompt. Modify the timeline JSON based on the prompt. Return ONLY valid JSON array without markdown blocks. Do not wrap in ```json." },
        { role: "user", content: `Prompt: ${prompt}\nTimeline: ${JSON.stringify(timeline)}` }
      ]
    };

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const aiData = await aiRes.json();
    if (aiData.error) {
      return NextResponse.json({ error: aiData.error.message }, { status: 400 });
    }

    let contentStr = aiData.choices[0].message.content.trim();
    if (contentStr.startsWith("```json")) contentStr = contentStr.substring(7);
    if (contentStr.startsWith("```")) contentStr = contentStr.substring(3);
    if (contentStr.endsWith("```")) contentStr = contentStr.substring(0, contentStr.length - 3);

    const newTimeline = JSON.parse(contentStr.trim());
    return NextResponse.json({ timeline: newTimeline });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
