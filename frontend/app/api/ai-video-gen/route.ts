import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

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
        { role: "system", content: "Create a short video plan based on the prompt. Return JSON with exactly this structure: { \"title_card\": { \"text\": \"string\", \"duration\": number, \"color\": \"#hex\" }, \"sections\": [ { \"keyword\": \"string\", \"duration\": number, \"filter\": \"css string\", \"text\": \"string\", \"text_y\": number } ], \"color_grade\": \"css string\" }. Ensure the response is pure JSON without markdown blocks." },
        { role: "user", content: `Prompt: ${prompt}` }
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

    const plan = JSON.parse(contentStr.trim());
    
    // Generate placeholder mediaUrls
    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];
    
    if (plan.sections) {
      for (const sec of plan.sections) {
        mediaUrls.push(`https://source.unsplash.com/1920x1080/?${encodeURIComponent(sec.keyword)}`);
        mediaTypes.push("image");
      }
    }

    return NextResponse.json({
      plan,
      mediaUrls,
      mediaTypes,
      music: ""
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
