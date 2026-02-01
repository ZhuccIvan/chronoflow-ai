import React, { useState, useEffect, useRef } from 'react';
import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  MessageSquare,
  Edit,
  Settings,
  Play,
  RotateCcw,
  Image as ImageIcon,
  Film,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { Scene } from './components/Scene';
import { generateDiagramFromText, generateDiagramFromImage } from './services/geminiService';
import { DiagramData, AppMode, InputMode, DiagramMessage } from './types';
import { DEFAULT_DIAGRAM, DEFAULT_DIAGRAM_ZH, SAMPLE_PROMPTS, SAMPLE_PROMPTS_ZH } from './constants';

const App = () => {
  const { t, i18n } = useTranslation();

  // Get localized content based on language
  const getLocalizedDefaults = () => {
    const lang = i18n.language;
    return {
      defaultDiagram: lang === 'zh' ? DEFAULT_DIAGRAM_ZH : DEFAULT_DIAGRAM,
      samplePrompts: lang === 'zh' ? SAMPLE_PROMPTS_ZH : SAMPLE_PROMPTS
    };
  };

  // State
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [data, setData] = useState<DiagramData>(getLocalizedDefaults().defaultDiagram);
  const [mode, setMode] = useState<AppMode>(AppMode.STATIC);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.UPLOAD);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const apiKeyInputRef = useRef<HTMLInputElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputTextRef = useRef('');
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);

  // Re-render when language changes
  useEffect(() => {
    const { defaultDiagram } = getLocalizedDefaults();
    setData(defaultDiagram);
  }, [i18n.language]);

  // Manual Edit State
  const [editActors, setEditActors] = useState(DEFAULT_DIAGRAM.actors);
  const [editMessages, setEditMessages] = useState(DEFAULT_DIAGRAM.messages);

  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
      setHasKey(true);
      if (apiKeyInputRef.current) {
        apiKeyInputRef.current.value = storedKey;
      }
    }
  }, []);

  useEffect(() => {
    // Sync edit state when main data changes
    setEditActors(data.actors);
    setEditMessages(data.messages);
  }, [data]);

  useEffect(() => {
    if (inputMode === InputMode.TEXT) {
      requestAnimationFrame(() => textAreaRef.current?.focus());
    }
  }, [inputMode]);

  const saveApiKey = () => {
    const key = apiKeyInputRef.current?.value?.trim() || '';
    if (key) {
      localStorage.setItem('GEMINI_API_KEY', key);
      setApiKey(key);
      setHasKey(true);
    }
  };

  const clearAllData = () => {
    if (confirm('确定要清空所有节点和连接吗？此操作不可撤销。')) {
      setData({
        actors: [],
        messages: []
      });
      setCurrentStep(-1);
      setMode(AppMode.STATIC);
      setEditActors([]);
      setEditMessages([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setIsLoading(true);
        try {
          const key = apiKeyInputRef.current?.value?.trim() || apiKey;
          // console.log('key:', key);
          const newData = await generateDiagramFromImage(key, base64String);
          console.log('Generated Data:', newData);
          setData(newData);
          setMode(AppMode.STATIC);
          setCurrentStep(newData.messages.length);
        } catch (error) {
          console.error(error);
          alert('Failed to generate diagram. Check API Key or Image.');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextGenerate = async () => {
    const textValue = textAreaRef.current?.value ?? inputTextRef.current;
    if (!textValue.trim()) return;
    setIsLoading(true);
    try {
      const key = apiKeyInputRef.current?.value?.trim() || apiKey;
      const newData = await generateDiagramFromText(key, textValue);
      setData(newData);
      setMode(AppMode.STATIC);
      setCurrentStep(newData.messages.length);
    } catch (error) {
      console.error(error);
      alert('Failed to generate diagram. Check API Key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = () => {
    const newData = {
      actors: editActors,
      messages: editMessages.map((m, i) => ({ ...m, order: i }))
    };
    setData(newData);
  };

  const nextStep = () => {
    if (currentStep < data.messages.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const exportImage = async () => {
    const container = canvasWrapRef.current;
    if (!container) return;

    setIsExporting(true);

    // Store original font links
    const fontLinks = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
      .filter(link => link.href.includes('fonts.googleapis.com'));

    // Store original styles
    const originalStyle = {
      width: container.style.width,
      height: container.style.height,
      maxWidth: container.style.maxWidth,
      maxHeight: container.style.maxHeight,
      overflow: container.style.overflow,
      marginLeft: container.style.marginLeft,
      marginRight: container.style.marginRight
    };

    try {
      // Temporarily remove external font links to avoid CORS error
      fontLinks.forEach(link => link.remove());

      // Wait for state update (panels hidden by React)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Temporarily expand container to capture all content
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.maxWidth = 'none';
      container.style.maxHeight = 'none';
      container.style.overflow = 'visible';
      container.style.marginLeft = '0';
      container.style.marginRight = '0';

      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 150));

      // Export current container as-is (with content offset)
      const fullImageUrl = await toJpeg(container, {
        quality: 0.95,
        cacheBust: true,
        backgroundColor: '#050a14',
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          return node.dataset.exportExclude !== 'true';
        },
        pixelRatio: 2
      });

      // Load full image to analyze and crop it
      const img = new Image();
      img.src = fullImageUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Create a temporary canvas to read pixel data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(img, 0, 0);

      // Get pixel data to find content boundaries
      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const pixels = imageData.data;

      // Background color: #050a14 = rgb(5, 10, 20)
      const bgR = 5, bgG = 10, bgB = 20;
      const tolerance = 40; // Color tolerance to consider as background
      const edgeThreshold = 15; // Threshold to detect edges

      let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
      let hasContent = false;

      // Scan pixels to find content area
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          let isContent = false;

          // If pixel has any opacity and differs from background color
          if (a > 5) {
            const diffR = Math.abs(r - bgR);
            const diffG = Math.abs(g - bgG);
            const diffB = Math.abs(b - bgB);

            // If any channel differs more than tolerance, it's content
            if (diffR > tolerance || diffG > tolerance || diffB > tolerance) {
              isContent = true;
            }

            // Also check edges (difference with neighbors)
            if (!isContent && x < img.width - 1) {
              const nextR = pixels[i + 4];
              const nextG = pixels[i + 5];
              const nextB = pixels[i + 6];
              const edgeDiff = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
              if (edgeDiff > edgeThreshold) {
                isContent = true;
              }
            }

            if (!isContent && y < img.height - 1) {
              const nextI = ((y + 1) * img.width + x) * 4;
              const nextR = pixels[nextI];
              const nextG = pixels[nextI + 1];
              const nextB = pixels[nextI + 2];
              const edgeDiff = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
              if (edgeDiff > edgeThreshold) {
                isContent = true;
              }
            }

            if (isContent) {
              hasContent = true;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
      }

      // If no content found, use whole image
      if (!hasContent) {
        minX = 0;
        minY = 0;
        maxX = img.width;
        maxY = img.height;
      }

      // Add some padding around content
      const padding = 30;
      const cropX = Math.max(0, Math.floor(minX - padding));
      const cropY = Math.max(0, Math.floor(minY - padding));
      const cropWidth = Math.min(img.width - cropX, Math.floor(maxX - minX + padding * 2));
      const cropHeight = Math.min(img.height - cropY, Math.floor(maxY - minY + padding * 2));

      // Create a canvas to crop image
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const ctx = cropCanvas.getContext('2d');

      if (ctx) {
        // Fill background
        ctx.fillStyle = '#050a14';
        ctx.fillRect(0, 0, cropWidth, cropHeight);

        // Draw the cropped area
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      }

      // Export cropped image
      const croppedImageUrl = cropCanvas.toDataURL('image/jpeg', 0.95);

      const link = document.createElement('a');
      link.download = 'sequence-diagram.jpg';
      link.href = croppedImageUrl;
      link.click();
    } finally {
      // Clear inline styles to let React take control
      container.style.width = '';
      container.style.height = '';
      container.style.maxWidth = '';
      container.style.maxHeight = '';
      container.style.overflow = '';
      container.style.marginLeft = '';
      container.style.marginRight = '';

      // Restore font links
      fontLinks.forEach(link => document.head.appendChild(link));

      // Reset exporting state (panels and layout will be restored by React)
      setIsExporting(false);
    }
  };

  const captureFrame = async (container: HTMLDivElement) => {
    // Store original font links
    const fontLinks = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
      .filter(link => link.href.includes('fonts.googleapis.com'));

    try {
      // Temporarily remove external font links to avoid CORS error
      fontLinks.forEach(link => link.remove());

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 150));

      // Export current container as-is
      const fullImageUrl = await toJpeg(container, {
        quality: 0.95,
        cacheBust: true,
        backgroundColor: '#050a14',
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          return node.dataset.exportExclude !== 'true';
        },
        pixelRatio: 2
      });

      // Load full image to analyze and crop it
      const img = new Image();
      img.src = fullImageUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Create a temporary canvas to read pixel data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return null;

      tempCtx.drawImage(img, 0, 0);

      // Get pixel data to find content boundaries
      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const pixels = imageData.data;

      // Background color: #050a14 = rgb(5, 10, 20)
      const bgR = 5, bgG = 10, bgB = 20;
      const tolerance = 40;
      const edgeThreshold = 15;

      let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
      let hasContent = false;

      // Scan pixels to find content area
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          let isContent = false;

          if (a > 5) {
            const diffR = Math.abs(r - bgR);
            const diffG = Math.abs(g - bgG);
            const diffB = Math.abs(b - bgB);

            if (diffR > tolerance || diffG > tolerance || diffB > tolerance) {
              isContent = true;
            }

            if (!isContent && x < img.width - 1) {
              const nextR = pixels[i + 4];
              const nextG = pixels[i + 5];
              const nextB = pixels[i + 6];
              const edgeDiff = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
              if (edgeDiff > edgeThreshold) {
                isContent = true;
              }
            }

            if (!isContent && y < img.height - 1) {
              const nextI = ((y + 1) * img.width + x) * 4;
              const nextR = pixels[nextI];
              const nextG = pixels[nextI + 1];
              const nextB = pixels[nextI + 2];
              const edgeDiff = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
              if (edgeDiff > edgeThreshold) {
                isContent = true;
              }
            }

            if (isContent) {
              hasContent = true;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
      }

      // If no content found, use whole image
      if (!hasContent) {
        minX = 0;
        minY = 0;
        maxX = img.width;
        maxY = img.height;
      }

      // Add some padding around content
      const padding = 30;
      const cropX = Math.max(0, Math.floor(minX - padding));
      const cropY = Math.max(0, Math.floor(minY - padding));
      const cropWidth = Math.min(img.width - cropX, Math.floor(maxX - minX + padding * 2));
      const cropHeight = Math.min(img.height - cropY, Math.floor(maxY - minY + padding * 2));

      // Create a canvas to crop image
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const ctx = cropCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#050a14';
        ctx.fillRect(0, 0, cropWidth, cropHeight);
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      }

      return cropCanvas.toDataURL('image/jpeg', 0.95);
    } finally {
      // Restore font links
      fontLinks.forEach(link => document.head.appendChild(link));
    }
  };

  const exportAnimationSequence = async () => {
    const container = canvasWrapRef.current;
    if (!container) return;

    setIsExporting(true);

    // Store original mode and step
    const originalMode = mode;
    const originalStep = currentStep;

    // Store original styles
    const originalStyle = {
      width: container.style.width,
      height: container.style.height,
      maxWidth: container.style.maxWidth,
      maxHeight: container.style.maxHeight,
      overflow: container.style.overflow,
      marginLeft: container.style.marginLeft,
      marginRight: container.style.marginRight
    };

    const zip = new JSZip();
    const totalFrames = data.messages.length + 1; // -1 to messages.length

    try {
      // Switch to dynamic mode
      setMode(AppMode.DYNAMIC);

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 200));

      // Expand container to capture all content
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.maxWidth = 'none';
      container.style.maxHeight = 'none';
      container.style.overflow = 'visible';
      container.style.marginLeft = '0';
      container.style.marginRight = '0';

      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 150));

      // Export initial state (step -1, no messages visible)
      setCurrentStep(-1);
      setExportProgress({ current: 1, total: totalFrames });
      await new Promise(resolve => setTimeout(resolve, 300));

      const initialFrame = await captureFrame(container);
      if (initialFrame) {
        zip.file(`frame_00_initial.jpg`, initialFrame.split(',')[1], { base64: true });
      }

      // Export each step
      for (let i = 0; i < data.messages.length; i++) {
        setCurrentStep(i);
        setExportProgress({ current: i + 2, total: totalFrames });
        await new Promise(resolve => setTimeout(resolve, 300));

        const frameData = await captureFrame(container);
        if (frameData) {
          const frameNumber = String(i + 1).padStart(2, '0');
          const messageLabel = data.messages[i].label.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 20);
          zip.file(`frame_${frameNumber}_${messageLabel}.jpg`, frameData.split(',')[1], { base64: true });
        }
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'sequence-diagram-animation.zip';
      link.click();

      // Cleanup
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export animation sequence:', error);
      alert(t('export.failed'));
    } finally {
      // Restore original state
      setMode(originalMode);
      setCurrentStep(originalStep);

      // Clear inline styles
      container.style.width = '';
      container.style.height = '';
      container.style.maxWidth = '';
      container.style.maxHeight = '';
      container.style.overflow = '';
      container.style.marginLeft = '';
      container.style.marginRight = '';

      // Reset exporting state
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const sceneKey = `${data.actors.length}-${data.messages.length}-${data.messages[0]?.id ?? 'none'}`;

  return (
    <div className="flex flex-col h-screen bg-cyber-900 text-gray-200 font-sans overflow-hidden">
      
      {/* 1. Header Area */}
      <header className="h-[60px] bg-cyber-800 border-b border-cyber-700 flex items-center justify-between px-6 z-20 shadow-lg shadow-black/50">
        <div className="flex items-center gap-2">
          <button
            onClick={clearAllData}
            className="w-8 h-8 rounded bg-gradient-to-br from-cyber-500 to-cyber-300 flex items-center justify-center animate-pulse-fast hover:from-red-500 hover:to-red-400 transition-all cursor-pointer"
            title={t('header.clearAll')}
          >
            <RotateCcw className="text-white w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl tracking-wider text-white">{t('app.title')}</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newLang = i18n.language === 'en' ? 'zh' : 'en';
              i18n.changeLanguage(newLang);
            }}
            className="flex items-center gap-1 bg-cyber-900 border border-cyber-700 px-3 py-1.5 rounded-full text-sm text-white hover:border-cyber-400 transition-all"
            title={i18n.language === 'en' ? 'Switch to Chinese' : '切换到英文'}
          >
            <Globe size={16} />
            <span className="font-bold">{i18n.language === 'en' ? 'EN' : '中文'}</span>
          </button>
          <div className="relative">
            <input
              ref={apiKeyInputRef}
              type="password"
              placeholder={t('header.apiKeyPlaceholder')}
              className="bg-cyber-900 border border-cyber-700 rounded-full px-4 py-1.5 text-sm w-[300px] focus:outline-none focus:border-cyber-400 text-white transition-all"
              defaultValue={apiKey}
            />
            {hasKey && <CheckCircle className="absolute right-3 top-1.5 w-5 h-5 text-green-400" />}
          </div>
          <button
            onClick={saveApiKey}
            className="bg-cyber-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          >
            {t('header.save')}
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        
        {/* 2. Left Panel: Inputs */}
        {!isExporting && (
        <div data-panel="left" className={`
          absolute left-0 top-0 bottom-0 z-10 w-[320px] bg-cyber-800/90 backdrop-blur-md border-r border-cyber-700 transform transition-transform duration-300 flex flex-col
          ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex border-b border-cyber-700">
            <button
              className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${inputMode === InputMode.UPLOAD ? 'text-cyber-400 border-b-2 border-cyber-400 bg-cyber-700/50' : 'text-gray-400 hover:text-white'}`}
              type="button"
              onPointerDown={() => setInputMode(InputMode.UPLOAD)}
              onClick={() => setInputMode(InputMode.UPLOAD)}
            >
              <ImageIcon size={16} /> {t('tabs.upload')}
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${inputMode === InputMode.TEXT ? 'text-cyber-400 border-b-2 border-cyber-400 bg-cyber-700/50' : 'text-gray-400 hover:text-white'}`}
              type="button"
              onPointerDown={() => setInputMode(InputMode.TEXT)}
              onClick={() => setInputMode(InputMode.TEXT)}
            >
              <MessageSquare size={16} /> {t('tabs.text')}
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${inputMode === InputMode.MANUAL ? 'text-cyber-400 border-b-2 border-cyber-400 bg-cyber-700/50' : 'text-gray-400 hover:text-white'}`}
              type="button"
              onPointerDown={() => setInputMode(InputMode.MANUAL)}
              onClick={() => setInputMode(InputMode.MANUAL)}
            >
              <Edit size={16} /> {t('tabs.manual')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {inputMode === InputMode.UPLOAD && (
              <div className="flex flex-col h-full gap-4">
                <div className="border-2 border-dashed border-cyber-700 rounded-lg h-64 flex flex-col items-center justify-center bg-cyber-900/50 hover:border-cyber-400 transition-colors relative">
                  <Upload className="w-12 h-12 text-cyber-500 mb-2" />
                  <p className="text-sm text-gray-400">{t('upload.title')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('upload.supportedFormats')}</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <button
                  className="w-full bg-cyber-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(29,78,216,0.5)] transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : t('upload.recognize')}
                </button>
              </div>
            )}

            {inputMode === InputMode.TEXT && (
              <div className="flex flex-col h-full gap-4">
                <textarea
                  ref={textAreaRef}
                  className="w-full h-64 bg-cyber-900 border border-cyber-700 rounded-lg p-3 text-sm focus:outline-none focus:border-cyber-400 resize-none text-white placeholder-gray-600"
                  placeholder={t('text.placeholder')}
                  defaultValue=""
                  onInput={(e) => { inputTextRef.current = e.currentTarget.value; }}
                />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">{t('text.examples')}</p>
                  {getLocalizedDefaults().samplePrompts.map((p, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        inputTextRef.current = p;
                        if (textAreaRef.current) {
                          textAreaRef.current.value = p;
                          textAreaRef.current.focus();
                        }
                      }}
                      className="p-2 bg-cyber-700/30 rounded text-xs cursor-pointer hover:bg-cyber-700/60 truncate border border-cyber-800 hover:border-cyber-600"
                    >
                      {p}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleTextGenerate}
                  className="mt-auto w-full bg-cyber-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(29,78,216,0.5)] transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : t('text.generate')}
                </button>
              </div>
            )}

            {inputMode === InputMode.MANUAL && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-cyber-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                    {t('manual.nodes')}
                    <button onClick={() => setEditActors([...editActors, { id: `a${Date.now()}`, name: i18n.language === 'zh' ? '新节点' : 'New Node' }])} className="p-1 hover:bg-cyber-700 rounded"><Plus size={14}/></button>
                  </h3>
                  <div className="space-y-2">
                    {editActors.map((actor, idx) => (
                      <div key={actor.id} className="flex gap-2 items-center bg-cyber-900 p-2 rounded border border-cyber-700">
                        <input
                          value={actor.name}
                          onChange={(e) => {
                            const newActors = [...editActors];
                            newActors[idx].name = e.target.value;
                            setEditActors(newActors);
                          }}
                          className="bg-transparent text-sm w-full focus:outline-none"
                        />
                        <button onClick={() => setEditActors(editActors.filter(a => a.id !== actor.id))} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                   <h3 className="text-xs font-bold text-cyber-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                    {t('manual.connections')}
                    <button onClick={() => setEditMessages([...editMessages, { id: `m${Date.now()}`, sourceId: editActors[0]?.id, targetId: editActors[1]?.id, label: i18n.language === 'zh' ? '动作' : 'Action', order: editMessages.length }])} className="p-1 hover:bg-cyber-700 rounded"><Plus size={14}/></button>
                  </h3>
                  <div className="space-y-2">
                     {editMessages.map((msg, idx) => (
                      <div key={msg.id} className="flex flex-col gap-1 bg-cyber-900 p-2 rounded border border-cyber-700">
                        <input
                          value={msg.label}
                          onChange={(e) => {
                            const newMsgs = [...editMessages];
                            newMsgs[idx].label = e.target.value;
                            setEditMessages(newMsgs);
                          }}
                          className="bg-transparent text-sm w-full focus:outline-none border-b border-cyber-800 pb-1 mb-1"
                        />
                        <div className="flex gap-1 items-center">
                          <select
                            value={msg.sourceId}
                            onChange={(e) => {
                                const newMsgs = [...editMessages];
                                newMsgs[idx].sourceId = e.target.value;
                                setEditMessages(newMsgs);
                            }}
                            className="bg-cyber-800 text-xs rounded p-1 w-20 truncate"
                          >
                            {editActors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          <span className="text-gray-500">-&gt;</span>
                          <select
                            value={msg.targetId}
                            onChange={(e) => {
                                const newMsgs = [...editMessages];
                                newMsgs[idx].targetId = e.target.value;
                                setEditMessages(newMsgs);
                            }}
                            className="bg-cyber-800 text-xs rounded p-1 w-20 truncate"
                          >
                            {editActors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                           <button onClick={() => setEditMessages(editMessages.filter(m => m.id !== msg.id))} className="ml-auto text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleManualSave}
                  className="w-full bg-cyber-400 hover:bg-cyan-500 text-cyber-900 py-2 rounded font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {t('manual.save')}
                </button>
              </div>
            )}
          </div>

          {/* Toggle Tab */}
          <button 
            className="absolute -right-8 top-1/2 w-8 h-16 bg-cyber-800 border-y border-r border-cyber-700 rounded-r flex items-center justify-center hover:bg-cyber-700 z-50"
             onClick={() => setLeftPanelOpen(!leftPanelOpen)}
           >
              {leftPanelOpen ? <ChevronDown className="rotate-90" /> : <ChevronRight className="rotate-90" />}
           </button>
         </div>
        )}

        {/* 3. Middle: Canvas */}
         <div
           ref={canvasWrapRef}
           className="flex-1 bg-[#050a14] relative transition-all duration-300"
           style={{
             marginLeft: isExporting ? '0' : (leftPanelOpen ? '320px' : '0'),
             marginRight: isExporting ? '0' : (rightPanelOpen ? '280px' : '0')
           }}
         >
           <div
             className="absolute inset-0 pointer-events-none"
             style={{
               backgroundImage: [
                 'radial-gradient(ellipse at center, rgba(8,18,40,0.2) 0%, rgba(5,10,20,0.9) 70%)',
                 'linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px)',
                 'linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)',
                 'radial-gradient(rgba(148,163,184,0.15) 1px, transparent 1px)'
               ].join(','),
               backgroundSize: '100% 100%, 40px 40px, 40px 40px, 140px 140px',
               backgroundPosition: 'center, center, center, center',
               opacity: 1
             }}
           />
           <Scene key={sceneKey} data={data} mode={mode} currentStep={currentStep} />
            
           {/* Bottom Timeline Overlay */}
           <div data-export-exclude="true" className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cyber-900 via-cyber-900/90 to-transparent flex items-end justify-center pb-6 px-10 pointer-events-none">
              <div className="flex items-center gap-4 w-full max-w-4xl pointer-events-auto overflow-x-auto pb-2 custom-scrollbar">
                {data.messages.map((msg, idx) => (
                  <button 
                    key={msg.id}
                    onClick={() => {
                        setMode(AppMode.DYNAMIC);
                        setCurrentStep(idx);
                    }}
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative
                      ${currentStep === idx 
                        ? 'bg-cyber-400 text-black scale-125 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10' 
                        : idx < currentStep 
                            ? 'bg-cyber-500 text-white' 
                            : 'bg-cyber-800 text-gray-500 border border-cyber-700 hover:border-cyber-500'
                      }
                    `}
                  >
                    {idx + 1}
                    {currentStep === idx && (
                        <span className="absolute -top-8 bg-cyber-800 text-cyber-400 text-[10px] px-2 py-1 rounded border border-cyber-700 whitespace-nowrap">
                            {msg.label}
                        </span>
                    )}
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* 4. Right Panel: Controls */}
        {!isExporting && (
        <div data-panel="right" className={`
          absolute right-0 top-0 bottom-0 z-10 w-[280px] bg-cyber-800/90 backdrop-blur-md border-l border-cyber-700 transform transition-transform duration-300 flex flex-col p-6
          ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
           {/* Toggle Tab */}
           <button 
            className="absolute -left-8 top-1/2 w-8 h-16 bg-cyber-800 border-y border-l border-cyber-700 rounded-l flex items-center justify-center hover:bg-cyber-700"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          >
             {rightPanelOpen ? <ChevronDown className="-rotate-90" /> : <ChevronRight className="-rotate-90" />}
          </button>

          <h2 className="text-cyber-400 font-display font-bold uppercase tracking-widest mb-6">{t('mode.switch')}</h2>

          <div className="bg-cyber-900 rounded-xl p-1 border border-cyber-700 flex mb-8">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === AppMode.STATIC ? 'bg-cyber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setMode(AppMode.STATIC); setCurrentStep(data.messages.length); }}
            >
              {t('mode.static')}
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === AppMode.DYNAMIC ? 'bg-cyber-400 text-black shadow-lg shadow-cyber-400/20' : 'text-gray-400 hover:text-white'}`}
              onClick={() => { setMode(AppMode.DYNAMIC); setCurrentStep(-1); }}
            >
              {t('mode.dynamic')}
            </button>
          </div>

          {mode === AppMode.DYNAMIC && (
             <div className="mb-8 space-y-4 animate-fade-in">
               <div className="p-4 bg-cyber-900/50 border border-cyber-700 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">{t('dynamic.currentStep')}: {currentStep + 1} / {data.messages.length}</p>
                  <div className="w-full bg-cyber-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyber-400 h-full transition-all duration-300" style={{ width: `${((currentStep + 1) / data.messages.length) * 100}%` }}></div>
                  </div>
                </div>

                <button
                 onClick={nextStep}
                 className="w-full bg-cyber-700 hover:bg-cyber-600 border border-cyber-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Play size={18} fill="currentColor" /> {t('dynamic.next')}
                </button>

                <button
                 onClick={() => setCurrentStep(-1)}
                 className="w-full bg-transparent border border-cyber-700 hover:border-gray-500 text-gray-400 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <RotateCcw size={14} /> {t('dynamic.reset')}
                </button>
             </div>
          )}

          <div className="mt-auto space-y-4">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('export.title')}</h3>
             <button onClick={exportImage} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-lg flex items-center justify-between px-4 transition-all group">
                 <span className="flex items-center gap-2"><ImageIcon size={16} className="text-cyber-400"/> {t('export.staticImage')}</span>
                 <span className="text-xs bg-black/30 px-2 py-1 rounded text-gray-400 group-hover:text-white">JPEG</span>
              </button>
               <button onClick={exportAnimationSequence} disabled={isExporting} className={`w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-lg flex items-center justify-between px-4 transition-all group ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className="flex items-center gap-2"><Film size={16} className="text-purple-400"/> {t('export.animationSequence')}</span>
                  <span className="text-xs bg-black/30 px-2 py-1 rounded text-gray-400 group-hover:text-white">ZIP</span>
               </button>

               {exportProgress && (
                 <div className="bg-cyber-900/50 border border-cyber-700 rounded-lg p-3">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-xs text-gray-400">{t('export.progress')}</span>
                     <span className="text-xs text-cyber-400">{exportProgress.current} / {exportProgress.total}</span>
                   </div>
                   <div className="w-full bg-cyber-800 h-2 rounded-full overflow-hidden">
                     <div
                       className="bg-gradient-to-r from-purple-500 to-cyber-400 h-full transition-all duration-300"
                       style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                     ></div>
                   </div>
                 </div>
               )}
            </div>

         </div>
        )}

       </div>
     </div>
   );
};

export default App;

