import React, { useState, useEffect } from 'react';
import { MessageSquare, Twitter, MessagesSquare, Download, RefreshCw, AlertCircle } from 'lucide-react';
import type { ConversationInput, MemeTemplate, ImgflipResponse, ImgflipMeme, ProcessedText } from '../types';
import { processConversation } from '../utils/openai';

const MemeGenerator: React.FC = () => {
  const [input, setInput] = useState<ConversationInput>({
    text: '',
    type: 'text'
  });
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [processedText, setProcessedText] = useState<ProcessedText>({
    lines: [],
    loading: false,
    error: null
  });

  useEffect(() => {
    fetchMemeTemplates();
  }, []);

  const fetchMemeTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.imgflip.com/get_memes');
      const data: ImgflipResponse = await response.json();
      
      if (data.success) {
        const processedTemplates = data.data.memes.slice(0, 9).map((meme: ImgflipMeme) => ({
          id: meme.id,
          name: meme.name,
          imageUrl: meme.url,
          textBoxes: Array.from({ length: meme.box_count }, (_, i) => ({
            x: 50,
            y: i === 0 ? 10 : i === meme.box_count - 1 ? 90 : 50,
            width: 80,
            height: 20,
            text: ''
          }))
        }));
        setTemplates(processedTemplates);
        setSelectedTemplate(processedTemplates[0]);
      }
    } catch (error) {
      console.error('Error fetching meme templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: ConversationInput['type']) => {
    setInput(prev => ({ ...prev, type }));
  };

  const generateMeme = async () => {
    if (!selectedTemplate || !input.text.trim()) return;
    
    setProcessedText(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const processedLines = await processConversation(
        input.text,
        input.type,
        selectedTemplate.textBoxes.length
      );
      
      const updatedTemplate = {
        ...selectedTemplate,
        textBoxes: selectedTemplate.textBoxes.map((box, i) => ({
          ...box,
          text: processedLines[i] || ''
        }))
      };
      
      setSelectedTemplate(updatedTemplate);
      setProcessedText(prev => ({
        ...prev,
        lines: processedLines,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process text. Please try again.';
      setProcessedText(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-700">Loading meme templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Conversation Meme Generator
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => handleTypeChange('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                input.type === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <MessageSquare size={20} />
              Text
            </button>
            <button
              onClick={() => handleTypeChange('tweet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                input.type === 'tweet' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Twitter size={20} />
              Tweet
            </button>
            <button
              onClick={() => handleTypeChange('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                input.type === 'chat' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <MessagesSquare size={20} />
              Chat
            </button>
          </div>

          <textarea
            value={input.text}
            onChange={(e) => setInput(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Paste your conversation here..."
            className="w-full h-32 p-4 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="grid grid-cols-3 gap-4 mb-6">
            {templates.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all transform hover:scale-105 ${
                  selectedTemplate?.id === template.id ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-blue-300'
                }`}
              >
                <div className="relative pb-[75%]">
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <p className="text-center py-2 bg-gray-50 text-sm font-medium truncate px-2">
                  {template.name} ({template.textBoxes.length} text boxes)
                </p>
              </div>
            ))}
          </div>

          {processedText.error?.includes('API key') && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800">OpenAI API Key Required</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Please add your OpenAI API key to the .env file to enable AI-powered meme text generation.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={generateMeme}
            disabled={processedText.loading}
            className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center gap-2
              ${processedText.loading 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            {processedText.loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing text...
              </>
            ) : (
              'Generate Meme'
            )}
          </button>

          {processedText.error && !processedText.error.includes('API key') && (
            <p className="mt-2 text-red-500 text-sm text-center">{processedText.error}</p>
          )}
        </div>

        {selectedTemplate && selectedTemplate.textBoxes.some(box => box.text) && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="relative">
              <img
                src={selectedTemplate.imageUrl}
                alt="Generated Meme"
                className="w-full rounded-lg"
              />
              {selectedTemplate.textBoxes.map((box, index) => box.text && (
                <p
                  key={index}
                  className="absolute text-white text-2xl font-bold"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
                    textAlign: 'center',
                    wordWrap: 'break-word'
                  }}
                >
                  {box.text}
                </p>
              ))}
              <div className="absolute bottom-2 right-2 text-white text-sm opacity-70 font-medium mix-blend-difference">
                yourautomeme.com
              </div>
            </div>
            <button className="mt-4 flex items-center gap-2 mx-auto px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <Download size={20} />
              Download Meme
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemeGenerator;