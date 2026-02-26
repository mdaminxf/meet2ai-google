import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export interface Drawing {
  type?: 'rect' | 'circle' | 'ellipse' | 'line' | 'arrow' | 'text' | 'path';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
  d?: string; // For raw paths
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fontSize?: number;
}

interface WhiteboardProps {
  text: string;
  isWriting: boolean;
  onWritingComplete: () => void;
  typingSpeed: number;
  highlightText?: string;
  permanentHighlights?: string[];
  drawings?: Drawing[];
  diagrams?: Drawing[][];
  image?: string | null;
  immediateDraw?: boolean;
  syncProgress?: number;
}

interface ProcessedElement {
  d?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  length?: number;
  isText: boolean;
  text?: string;
  x?: number;
  y?: number;
  fontSize?: number;
}

export default function Whiteboard({ text, isWriting, onWritingComplete, typingSpeed, highlightText, permanentHighlights = [], drawings = [], diagrams = [], image, immediateDraw = false, syncProgress = 0 }: WhiteboardProps) {
  const [revealedChars, setRevealedChars] = useState(0);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightSpansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const permanentHighlightSpansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [penPos, setPenPos] = useState({ x: 0, y: 0 });
  const prevTextRef = useRef(text);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);
  
  const hiddenPathRef = useRef<SVGPathElement>(null);
  const [processedElements, setProcessedElements] = useState<ProcessedElement[]>([]);
  const [isDrawingCanvas, setIsDrawingCanvas] = useState(false);
  const [drawingProgress, setDrawingProgress] = useState(0);

  useEffect(() => {
    if (text.length === 0) {
      setRevealedChars(0);
    } else if (!isWriting) {
      setRevealedChars(text.length);
    } else if (isWriting) {
      if (!text.startsWith(prevTextRef.current)) {
        setRevealedChars(0);
      }
    }
    prevTextRef.current = text;
  }, [text, isWriting]);

  const [isPenMoving, setIsPenMoving] = useState(false);
  const lastRevealedCharsRef = useRef(0);

  useEffect(() => {
    if (revealedChars !== lastRevealedCharsRef.current) {
      setIsPenMoving(true);
      const timer = setTimeout(() => setIsPenMoving(false), 100);
      lastRevealedCharsRef.current = revealedChars;
      return () => clearTimeout(timer);
    }
  }, [revealedChars]);

  useEffect(() => {
    if (!isWriting) {
      return;
    }

    // Sync logic: Drive strictly by speech progress if available
    if (syncProgress > 0) {
      const targetChars = Math.floor(syncProgress * text.length);
      
      // If we are significantly behind, jump ahead
      if (revealedChars < targetChars - 5) {
        setRevealedChars(targetChars);
      } 
      // If we are slightly behind, speed up (handled by next tick)
      else if (revealedChars < targetChars) {
        // Do nothing, let the timer catch up naturally or force a small jump
        setRevealedChars(prev => Math.min(text.length, prev + 2)); 
      }
      // If we are ahead, wait (pause)
      else if (revealedChars > targetChars + 5) {
        return; 
      }
    }

    if (revealedChars >= text.length) {
      const timer = setTimeout(onWritingComplete, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setRevealedChars(prev => {
        const next = prev + 1;
        if (next === text.length) {
          setTimeout(onWritingComplete, 0);
        }
        return next;
      });
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [isWriting, revealedChars, text, typingSpeed, onWritingComplete, syncProgress]);

  // Process drawings into SVG elements
  useEffect(() => {
    if (!drawings || drawings.length === 0) {
      setProcessedElements([]);
      setIsDrawingCanvas(false);
      setDrawingProgress(0);
      return;
    }

    const newElements: ProcessedElement[] = [];
    const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    drawings.forEach(d => {
      if (d.type === 'text') {
        newElements.push({
          isText: true,
          text: d.text,
          x: d.x,
          y: d.y,
          fontSize: d.fontSize,
          fill: d.fill || 'black'
        });
        return;
      }

      const processPath = (pathString: string, stroke: string, strokeWidth: number, fill: string) => {
        tempPath.setAttribute('d', pathString);
        const length = tempPath.getTotalLength();
        newElements.push({
          isText: false,
          d: pathString,
          stroke,
          strokeWidth,
          fill,
          length
        });
      };

      if (d.d) {
        processPath(d.d, d.stroke || 'black', d.strokeWidth || 2, d.fill || 'none');
        return;
      }

      const stroke = d.stroke || 'black';
      const strokeWidth = d.strokeWidth || 2;
      const fill = d.fill || 'none';

      try {
        switch (d.type) {
          case 'rect':
            const w = d.width || 100;
            const h = d.height || 50;
            const x = d.x || 0;
            const y = d.y || 0;
            processPath(`M${x} ${y} h${w} v${h} h-${w} Z`, stroke, strokeWidth, fill);
            break;
          case 'circle':
            const cx = d.x || 0;
            const cy = d.y || 0;
            const r = (d.width || 50) / 2;
            processPath(`M ${cx} ${cy - r} a ${r} ${r} 0 1 0 0 ${r * 2} a ${r} ${r} 0 1 0 0 ${-r * 2}`, stroke, strokeWidth, fill);
            break;
          case 'ellipse':
            const ex = d.x || 0;
            const ey = d.y || 0;
            const rx = (d.width || 100) / 2;
            const ry = (d.height || 50) / 2;
            processPath(`M ${ex} ${ey - ry} a ${rx} ${ry} 0 1 0 0 ${ry * 2} a ${rx} ${ry} 0 1 0 0 ${-ry * 2}`, stroke, strokeWidth, fill);
            break;
          case 'line':
            processPath(`M${d.x || 0} ${d.y || 0} L${d.x2 || 100} ${d.y2 || 100}`, stroke, strokeWidth, fill);
            break;
          case 'arrow':
            const ax1 = d.x || 0;
            const ay1 = d.y || 0;
            const ax2 = d.x2 || 100;
            const ay2 = d.y2 || 100;
            const angle = Math.atan2(ay2 - ay1, ax2 - ax1);
            const headLen = 15;
            const p1x = ax2 - headLen * Math.cos(angle - Math.PI / 6);
            const p1y = ay2 - headLen * Math.sin(angle - Math.PI / 6);
            const p2x = ax2 - headLen * Math.cos(angle + Math.PI / 6);
            const p2y = ay2 - headLen * Math.sin(angle + Math.PI / 6);
            
            processPath(`M${ax1} ${ay1} L${ax2} ${ay2}`, stroke, strokeWidth, 'none');
            processPath(`M${ax2} ${ay2} L${p1x} ${p1y}`, stroke, strokeWidth, 'none');
            processPath(`M${ax2} ${ay2} L${p2x} ${p2y}`, stroke, strokeWidth, 'none');
            break;
        }
      } catch (e) {
        console.error("Error generating SVG path:", e);
      }
    });

    setProcessedElements(newElements);
    setIsDrawingCanvas(true);
    setDrawingProgress(0);
  }, [drawings]);

  // SVG Animation Loop
  useEffect(() => {
    if (!isDrawingCanvas || processedElements.length === 0) return;
    
    if (immediateDraw) {
      setDrawingProgress(processedElements.length);
      setIsDrawingCanvas(false);
      return;
    }

    let animationFrameId: number;
    let startTimestamp: number | null = null;
    const DURATION = 500; // ms per element

    const render = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      
      const currentElementIndex = Math.floor(elapsed / DURATION);
      const elementProgress = (elapsed % DURATION) / DURATION;
      
      const totalProgress = currentElementIndex + elementProgress;
      
      if (currentElementIndex < processedElements.length) {
        const currentEl = processedElements[currentElementIndex];
        // Update pen position
        if (!currentEl.isText && currentEl.d && currentEl.length && hiddenPathRef.current) {
          if (hiddenPathRef.current.getAttribute('d') !== currentEl.d) {
            hiddenPathRef.current.setAttribute('d', currentEl.d);
          }
          try {
            const point = hiddenPathRef.current.getPointAtLength(currentEl.length * elementProgress);
            if (containerRef.current) {
              const svgElement = document.getElementById('whiteboard-svg');
              if (svgElement) {
                const svgRect = svgElement.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();
                const scaleX = (svgRect.width / 800);
                const scaleY = (svgRect.height / 600);
                const screenX = ((point.x * scaleX) + (svgRect.left - containerRect.left)) / zoom;
                const screenY = ((point.y * scaleY) + (svgRect.top - containerRect.top)) / zoom;
                setPenPos({ x: screenX, y: screenY });
              }
            }
          } catch (e) {}
        }
      }
      
      if (totalProgress >= processedElements.length) {
        setDrawingProgress(processedElements.length);
        setIsDrawingCanvas(false);
        return;
      }

      setDrawingProgress(totalProgress);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isDrawingCanvas, processedElements, immediateDraw]);

  useEffect(() => {
    // Priority 0: Follow Canvas drawing
    if (isDrawingCanvas) {
      return; // penPos is handled by animation loop
    }

    // Priority 1: Hover over highlighted text
    if (highlightText && highlightSpansRef.current.length > 0 && containerRef.current) {
      const span = highlightSpansRef.current[0];
      if (span) {
        const spanRect = span.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Center of the highlighted word
        setPenPos({
          x: ((spanRect.left - containerRect.left) + (spanRect.width / 2)) / zoom,
          y: ((spanRect.top - containerRect.top) + (spanRect.height / 2)) / zoom
        });
        return;
      }
    }
    
    // Priority 2: Follow writing cursor
    if (isWriting && cursorRef.current && containerRef.current) {
      const cursorRect = cursorRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      setPenPos({
        x: (cursorRect.left - containerRect.left) / zoom,
        y: (cursorRect.top - containerRect.top) / zoom
      });
      
      // Smoothly scroll cursor into view if needed
      cursorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [revealedChars, isWriting, highlightText, text, isDrawingCanvas]);

  highlightSpansRef.current = [];
  permanentHighlightSpansRef.current = [];

  const revealedText = text.substring(0, revealedChars);

  const renderHighlightedText = (textPart: string) => {
    // First, split by math blocks to avoid highlighting inside math
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
    const mathParts = textPart.split(mathRegex);

    return mathParts.map((mathPart, idx) => {
      if (mathPart.startsWith('$$') && mathPart.endsWith('$$')) {
        return <BlockMath key={idx} math={mathPart.slice(2, -2)} />;
      } else if (mathPart.startsWith('$') && mathPart.endsWith('$')) {
        return <InlineMath key={idx} math={mathPart.slice(1, -1)} />;
      }

      // If it's not math, apply highlights and markdown bold
      const allHighlights = [...permanentHighlights, highlightText].filter(Boolean) as string[];
      
      const renderWithMarkdown = (str: string, keyPrefix: string) => {
        // Simple markdown bold parser **text**
        const boldRegex = /\*\*(.*?)\*\*/g;
        const boldParts = str.split(boldRegex);
        
        if (boldParts.length === 1) return str;
        
        return boldParts.map((part, i) => {
          if (i % 2 === 1) { // It's the bold part
            return <strong key={`${keyPrefix}-bold-${i}`} className="font-bold text-gray-900">{part}</strong>;
          }
          return part;
        });
      };
      
      if (allHighlights.length === 0) return <React.Fragment key={idx}>{renderWithMarkdown(mathPart, `math-${idx}`)}</React.Fragment>;
      
      try {
        const escapedHighlights = allHighlights
          .filter(h => h.trim().length > 0)
          .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        
        if (escapedHighlights.length === 0) return <React.Fragment key={idx}>{renderWithMarkdown(mathPart, `math-${idx}`)}</React.Fragment>;

        const regex = new RegExp(`(${escapedHighlights.join('|')})`, 'g');
        const parts = mathPart.split(regex);
        
        return (
          <React.Fragment key={idx}>
            {parts.map((part, i) => {
              if (part === highlightText) {
                return (
                  <span 
                    key={i} 
                    ref={el => { if (el) highlightSpansRef.current.push(el); }}
                    className="relative z-10 bg-yellow-200/50 rounded px-1"
                  >
                    {renderWithMarkdown(part, `hl-${i}`)}
                  </span>
                );
              } else if (permanentHighlights.includes(part)) {
                 return (
                  <span 
                    key={i} 
                    ref={el => { if (el) permanentHighlightSpansRef.current.push(el); }}
                    className="relative z-10 bg-green-200/30 rounded px-1 border-b-2 border-green-400/50"
                  >
                    {renderWithMarkdown(part, `phl-${i}`)}
                  </span>
                );
              }
              return renderWithMarkdown(part, `txt-${i}`);
            })}
          </React.Fragment>
        );
      } catch (e) {
        return <React.Fragment key={idx}>{renderWithMarkdown(mathPart, `err-${idx}`)}</React.Fragment>;
      }
    });
  };

  return (
    <div className="relative w-full h-full bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group/whiteboard">
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 opacity-0 group-hover/whiteboard:opacity-100 transition-opacity">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-white/80 hover:bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
          title="Zoom In"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button 
          onClick={handleResetZoom}
          className="p-2 bg-white/80 hover:bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:text-blue-600 transition-colors text-xs font-bold"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-white/80 hover:bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
          title="Zoom Out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="11" x2="14" y2="11"/><line x1="8" y1="11" x2="11" y2="11"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8" ref={scrollRef}>
        <div 
          className="relative min-h-full transition-transform duration-200 origin-top" 
          ref={containerRef} 
          id="whiteboard-content"
          style={{ transform: `scale(${zoom})` }}
        >
          
          {/* Image Content */}
          {image && (
            <div className="mb-6 flex justify-center">
              <img 
                src={image} 
                alt="User uploaded content" 
                className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm border border-gray-200"
              />
            </div>
          )}

          {/* Text Content and Diagram Interleaving */}
          {(() => {
            const parts = revealedText.split('[DIAGRAM]');
            
            // Helper to process a set of drawings into SVG elements
            const getProcessedElements = (draws: Drawing[]) => {
              const elements: ProcessedElement[] = [];
              const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              
              draws.forEach(d => {
                if (d.type === 'text') {
                  elements.push({ isText: true, text: d.text, x: d.x, y: d.y, fontSize: d.fontSize, fill: d.fill || 'black' });
                  return;
                }
                
                const processPath = (pathString: string, stroke: string, strokeWidth: number, fill: string) => {
                  tempPath.setAttribute('d', pathString);
                  const length = tempPath.getTotalLength();
                  elements.push({ isText: false, d: pathString, stroke, strokeWidth, fill, length });
                };

                if (d.d) {
                  processPath(d.d, d.stroke || 'black', d.strokeWidth || 2, d.fill || 'none');
                  return;
                }

                const stroke = d.stroke || 'black';
                const strokeWidth = d.strokeWidth || 2;
                const fill = d.fill || 'none';

                try {
                  switch (d.type) {
                    case 'rect':
                      processPath(`M${d.x || 0} ${d.y || 0} h${d.width || 100} v${d.height || 50} h-${d.width || 100} Z`, stroke, strokeWidth, fill);
                      break;
                    case 'circle':
                      const r = (d.width || 50) / 2;
                      processPath(`M ${d.x || 0} ${(d.y || 0) - r} a ${r} ${r} 0 1 0 0 ${r * 2} a ${r} ${r} 0 1 0 0 ${-r * 2}`, stroke, strokeWidth, fill);
                      break;
                    case 'ellipse':
                      const rx = (d.width || 100) / 2;
                      const ry = (d.height || 50) / 2;
                      processPath(`M ${d.x || 0} ${(d.y || 0) - ry} a ${rx} ${ry} 0 1 0 0 ${ry * 2} a ${rx} ${ry} 0 1 0 0 ${-ry * 2}`, stroke, strokeWidth, fill);
                      break;
                    case 'line':
                      processPath(`M${d.x || 0} ${d.y || 0} L${d.x2 || 100} ${d.y2 || 100}`, stroke, strokeWidth, fill);
                      break;
                    case 'arrow':
                      const ax1 = d.x || 0; const ay1 = d.y || 0; const ax2 = d.x2 || 100; const ay2 = d.y2 || 100;
                      const angle = Math.atan2(ay2 - ay1, ax2 - ax1);
                      const headLen = 15;
                      const p1x = ax2 - headLen * Math.cos(angle - Math.PI / 6);
                      const p1y = ay2 - headLen * Math.sin(angle - Math.PI / 6);
                      const p2x = ax2 - headLen * Math.cos(angle + Math.PI / 6);
                      const p2y = ay2 - headLen * Math.sin(angle + Math.PI / 6);
                      processPath(`M${ax1} ${ay1} L${ax2} ${ay2}`, stroke, strokeWidth, 'none');
                      processPath(`M${ax2} ${ay2} L${p1x} ${p1y}`, stroke, strokeWidth, 'none');
                      processPath(`M${ax2} ${ay2} L${p2x} ${p2y}`, stroke, strokeWidth, 'none');
                      break;
                  }
                } catch (e) {}
              });
              return elements;
            };

            return (
              <>
                {parts.map((part, index) => (
                  <React.Fragment key={index}>
                    <div className="relative z-10 font-handwriting text-2xl md:text-3xl lg:text-4xl text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {renderHighlightedText(part)}
                      {index === parts.length - 1 && <span ref={cursorRef} className="inline-block w-[1px] h-[1em] bg-transparent align-bottom"></span>}
                    </div>

                    {/* Render diagram if we have one for this position */}
                    {index < parts.length - 1 && (
                      <div className="relative z-10 w-full mt-4 h-[600px] md:h-[800px] flex items-center justify-center">
                        <svg 
                          viewBox="0 0 800 600"
                          className="w-full h-full object-contain"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                        >
                          {getProcessedElements(diagrams[index] || drawings).map((el, i) => (
                            el.isText ? (
                              <text key={i} x={el.x} y={el.y} fill={el.fill} fontSize={el.fontSize || 20} fontFamily="Virgil, 'Comic Sans MS', sans-serif">
                                {el.text}
                              </text>
                            ) : (
                              <path
                                key={i}
                                d={el.d}
                                stroke={el.stroke !== 'none' ? el.stroke : 'transparent'}
                                strokeWidth={el.strokeWidth || 2}
                                fill={el.fill !== 'none' ? el.fill : 'transparent'}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )
                          ))}
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                
                {/* Hidden SVG for path measurements */}
                <svg width="0" height="0" className="absolute pointer-events-none opacity-0">
                  <path ref={hiddenPathRef} />
                </svg>
              </>
            );
          })()}
          
          {/* Pen Cursor */}
          {((isWriting && revealedChars < text.length) || isDrawingCanvas) && (
            <div 
              className="absolute pointer-events-none transition-all duration-100 ease-out"
              style={{ 
                left: penPos.x,
                top: penPos.y,
                transform: `translate(-2px, -44px)`, // Adjusted to align pen tip (bottom-left) with cursor
                zIndex: 50
              }}
            >
              <div className={isPenMoving || isDrawingCanvas ? "animate-scribble" : ""}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-800 drop-shadow-md">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fillIn {
          from { fill-opacity: 0; }
          to { fill-opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scribble {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-5deg) translateY(-2px); }
          50% { transform: rotate(0deg) translateY(0); }
          75% { transform: rotate(5deg) translateY(-2px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .animate-scribble {
          animation: scribble 0.2s infinite;
        }
      `}</style>
    </div>
  );
}
