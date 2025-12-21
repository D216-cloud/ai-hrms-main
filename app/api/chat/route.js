import OpenAI from "openai";
import fs from "fs";
import path from "path";

async function gatherProjectSummary(rootDir = process.cwd()) {
  try {
    const parts = [];
    // Top-level files
    const top = await fs.promises.readdir(rootDir);
    const topFiles = top.filter(f => !f.startsWith('.') && !['node_modules','.git'].includes(f)).slice(0, 40);
    parts.push(`Top-level files/folders: ${topFiles.join(', ')}`);

    // app routes
    const appDir = path.join(rootDir, 'app');
    if (fs.existsSync(appDir)) {
      const walk = (dir, prefix = '') => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files = [];
        for (const e of entries) {
          if (e.name.startsWith('.')) continue;
          const full = path.join(dir, e.name);
          if (e.isDirectory()) {
            files.push(...walk(full, path.join(prefix, e.name)));
          } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) {
            files.push(path.join(prefix, e.name));
          }
        }
        return files;
      };
      const appFiles = walk(appDir).slice(0, 200);
      parts.push(`App routes/pages (${appFiles.length}): ${appFiles.join(', ')}`);
    }

    // components
    const compDir = path.join(rootDir, 'components');
    if (fs.existsSync(compDir)) {
      const comps = await fs.promises.readdir(compDir).catch(() => []);
      parts.push(`Components: ${comps.slice(0, 60).join(', ')}`);
    }

    const summary = parts.join('\n');
    // limit length to ~3000 chars to avoid huge prompts
    return summary.length > 3000 ? summary.slice(0, 3000) + '...[truncated]' : summary;
  } catch (e) {
    console.warn('Failed to gather project summary', e);
    return 'Project summary unavailable';
  }
}

const handler = async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const body = await req.json();
    const userMessage = (body.message || '').toString().trim();
    if (!userMessage) return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500 });

    const openai = new OpenAI({ apiKey });

    // gather project summary and include it in the system prompt so the model can answer repo-specific questions
    const projectSummary = await gatherProjectSummary();

    const systemPrompt = `You are a helpful HR assistant. Provide concise, friendly answers and use emojis/icons to highlight sections. Use the project summary below to answer questions about the repository.\n\nFormatting rules (always follow):\n1) Begin with a one-line SUMMARY sentence (include an emoji).\n2) Then provide a short BULLET LIST of key points or findings (use emoji bullets like ✅, 🔎, 📌).\n3) If actions are needed, include a clear "Steps" numbered list (use simple numbers).\n4) When showing commands or code, include them in a code block.\n5) When referencing files or paths, show them as plain paths (e.g. app/admin/interview/page.jsx).\n6) Keep answers concise and readable; avoid long paragraphs.\n7) Do NOT use any asterisk characters (*) or markdown syntax.\n8) Prefer short sentences and add small, friendly icons/emojis to improve readability.\n\nProject summary (use to answer questions about the codebase, pages, and files):\n${projectSummary}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const reply = response?.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Chat API error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Chat failed' }), { status: 500 });
  }
};

export { handler as GET, handler as POST };
