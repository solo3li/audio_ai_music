const fs = require('fs');

async function test() {
  fs.writeFileSync('dummy.mov', 'ID3\x03\x00\x00\x00\x00\x00\x00');
  
  const blob = new Blob([fs.readFileSync('dummy.mov')], { type: 'video/quicktime' });
  const formData = new FormData();
  formData.append('file', blob, 'dummy.mov');
  formData.append('voiceId', '1');
  formData.append('emotion', '1');

  try {
    const res = await fetch('http://localhost:8080/api/video-editor/voice-swap', {
      method: 'POST',
      body: formData
    });
    const data = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", data);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
