import { useEffect, useRef, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeBoardProps {
  text: string;
  isWriting: boolean;
  onWritingComplete: () => void;
  expectedDuration: number;
  highlightText?: string;
  language?: string;
  immediateDraw?: boolean;
  syncProgress?: number;
}

export default function CodeBoard({ text, isWriting, onWritingComplete, expectedDuration, highlightText, language = 'typescript', immediateDraw = false, syncProgress = 0 }: CodeBoardProps) {
  const [typingState, setTypingState] = useState({
    revealedChars: 0,
    wrongChars: '',
    isBackspacing: false
  });
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();
  const decorationsRef = useRef<string[]>([]);
  const prevTextRef = useRef(text);
  const startTimeRef = useRef(Date.now());
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  useEffect(() => {
    if (immediateDraw) {
      setTypingState({ revealedChars: text.length, wrongChars: '', isBackspacing: false });
      return;
    }
    if (text.length === 0) {
      setTypingState({ revealedChars: 0, wrongChars: '', isBackspacing: false });
    } else if (!isWriting) {
      setTypingState({ revealedChars: text.length, wrongChars: '', isBackspacing: false });
    } else if (isWriting) {
      if (!text.startsWith(prevTextRef.current)) {
        setTypingState({ revealedChars: 0, wrongChars: '', isBackspacing: false });
        startTimeRef.current = Date.now();
      } else if (text.length > prevTextRef.current.length) {
        startTimeRef.current = Date.now();
      }
    }
    prevTextRef.current = text;
  }, [text, isWriting]);

  useEffect(() => {
    if (!isWriting) {
      return;
    }
    
    // Sync logic: Catch up if behind speech
    if (syncProgress > 0) {
      const targetChars = Math.floor(syncProgress * text.length);
      if (typingState.revealedChars < targetChars) {
        setTypingState(prev => ({
          ...prev,
          revealedChars: targetChars,
          wrongChars: '', // Clear typos to catch up
          isBackspacing: false
        }));
      }
    }
    
    if (typingState.revealedChars >= text.length) {
      // If text is already fully revealed, complete immediately
      // Use setTimeout to avoid render cycle issues
      const timer = setTimeout(onWritingComplete, 0);
      return () => clearTimeout(timer);
    }

    // Pause if too far ahead of speech
    if (syncProgress > 0) {
      const targetChars = Math.floor(syncProgress * text.length);
      if (typingState.revealedChars > targetChars + 15) {
        return;
      }
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remainingTime = Math.max(0, expectedDuration - elapsed);
    const remainingChars = text.length - typingState.revealedChars;
    
    // Base delay to finish exactly on time
    let delay = remainingChars > 0 ? remainingTime / remainingChars : 50;
    
    const nextChar = text[typingState.revealedChars];
    
    if (typingState.isBackspacing) {
      delay = delay * 0.5;
    } else if (typingState.wrongChars === '') {
      if (['.', ',', ';', ':', '(', ')', '{', '}'].includes(nextChar)) {
        delay *= 2;
      } else if (nextChar === ' ') {
        delay *= 1.2;
      } else if (nextChar === '\n') {
        delay *= 2.5;
      } else {
        delay *= (0.8 + Math.random() * 0.4);
      }
    }

    // Cap delay to reasonable bounds
    delay = Math.min(400, Math.max(10, delay));

    const timer = setTimeout(() => {
      setTypingState(prev => {
        if (prev.isBackspacing) {
          if (prev.wrongChars.length > 0) {
            return { ...prev, wrongChars: prev.wrongChars.slice(0, -1) };
          } else {
            return { ...prev, isBackspacing: false };
          }
        } else {
          // 2% chance to make a typo, but not on whitespace and not at the very end
          if (Math.random() < 0.02 && !/\s/.test(nextChar) && prev.revealedChars < text.length - 1 && prev.wrongChars.length === 0) {
            const keyboard = "qwertyuiopasdfghjklzxcvbnm";
            const randomChar = keyboard[Math.floor(Math.random() * keyboard.length)];
            return { ...prev, wrongChars: randomChar, isBackspacing: true };
          } else {
            const next = prev.revealedChars + 1;
            if (next === text.length) {
              setTimeout(onWritingComplete, 0);
            }
            return { ...prev, revealedChars: next };
          }
        }
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isWriting, typingState, text, expectedDuration, onWritingComplete, syncProgress]);

  const revealedText = text.substring(0, typingState.revealedChars) + typingState.wrongChars;

  useEffect(() => {
    if (editorRef.current && monaco) {
      const model = editorRef.current.getModel();
      if (model) {
        const position = model.getPositionAt(typingState.revealedChars + typingState.wrongChars.length);
        editorRef.current.setPosition(position);
        editorRef.current.revealPosition(position);
      }
    }
  }, [typingState.revealedChars, typingState.wrongChars.length, monaco]);

  useEffect(() => {
    if (!editorRef.current || !monaco) return;
    
    const editorInstance = editorRef.current;
    
    if (highlightText && typingState.revealedChars >= text.length) {
      const model = editorInstance.getModel();
      if (model) {
        const matches = model.findMatches(highlightText, false, false, false, null, true);
        if (matches.length > 0) {
          const match = matches[0];
          
          decorationsRef.current = editorInstance.deltaDecorations(decorationsRef.current, [
            {
              range: match.range,
              options: {
                isWholeLine: false,
                className: 'monaco-highlight-line',
              }
            }
          ]);
          editorInstance.revealRangeInCenter(match.range);
        } else {
          decorationsRef.current = editorInstance.deltaDecorations(decorationsRef.current, []);
        }
      }
    } else {
      decorationsRef.current = editorInstance.deltaDecorations(decorationsRef.current, []);
    }
  }, [highlightText, typingState.revealedChars, text.length, monaco]);

  const getFilename = () => {
    switch (language) {
      case 'python': return 'script.py';
      case 'javascript': return 'script.js';
      case 'typescript': return 'script.ts';
      case 'html': return 'index.html';
      case 'css': return 'style.css';
      case 'c': return 'main.c';
      case 'cpp': return 'main.cpp';
      case 'java': return 'Main.java';
      default: return `script.${language}`;
    }
  };

  return (
    <div id="codeboard-content" className="w-full h-full bg-[#1e1e1e] rounded-xl shadow-lg overflow-hidden flex flex-col border border-gray-700 group/codeboard relative">
      {/* Zoom Controls */}
      <div className="absolute top-12 left-4 z-50 flex flex-col gap-2 opacity-0 group-hover/codeboard:opacity-100 transition-opacity">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-lg shadow-sm text-gray-300 hover:text-blue-400 transition-colors"
          title="Zoom In"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button 
          onClick={handleResetZoom}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-lg shadow-sm text-gray-300 hover:text-blue-400 transition-colors text-xs font-bold"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-lg shadow-sm text-gray-300 hover:text-blue-400 transition-colors"
          title="Zoom Out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="11" x2="14" y2="11"/><line x1="8" y1="11" x2="11" y2="11"/></svg>
        </button>
      </div>

      <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="ml-2 text-xs text-gray-400 font-mono">{getFilename()}</span>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div className="w-full h-full transition-transform duration-200 origin-top-left" style={{ transform: `scale(${zoom})`, width: `${100/zoom}%`, height: `${100/zoom}%` }}>
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={revealedText}
            onMount={(editor) => { editorRef.current = editor; }}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 16,
              wordWrap: 'on',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              cursorBlinking: isWriting ? 'solid' : 'blink',
              renderLineHighlight: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
