import OpenAI from 'openai';

const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

export async function processConversation(text: string, type: 'tweet' | 'text' | 'chat', numLines: number): Promise<string[]> {
  try {
    const openai = getOpenAIClient();
    
    const prompt = `
      Convert this ${type} into ${numLines} short, punchy meme-worthy lines that capture its essence.
      Make it funny and memorable, but keep each line under 50 characters.
      Format: Return only the lines, separated by newlines, no additional text.
      
      ${text}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a meme expert who excels at converting conversations into witty, memorable meme text. Be concise and impactful."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const result = response.choices[0].message.content;
    if (!result) throw new Error('No response from AI');
    
    return result.trim().split('\n').slice(0, numLines);
  } catch (error) {
    console.error('Error processing text:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
    }
    throw error;
  }
}