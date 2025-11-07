import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { TranslationCard } from './components/TranslationCard';
import { StartStopButton } from './components/StartStopButton';
import { Language } from './types';
import { translateText, generateSpeech, detectSignFromImage } from './services/geminiService';
import { decodeAndPlayAudio } from './utils/audioUtils';

type Translations = {
  [key in Language]: string;
};

type LoadingStates = {
  detection: boolean;
  translation: boolean;
  tts: {
    [key in Language]: boolean;
  };
};

const App: React.FC = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Translations>({
    [Language.ENGLISH]: '',
    [Language.HINDI]: '',
    [Language.GUJARATI]: '',
  });
  const [loading, setLoading] = useState<LoadingStates>({
    detection: false,
    translation: false,
    tts: {
      [Language.ENGLISH]: false,
      [Language.HINDI]: false,
      [Language.GUJARATI]: false,
    },
  });
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    isDetectingRef.current = false;
    setLoading(prev => ({ ...prev, detection: false }));
  }, []);

  const startDetection = useCallback(() => {
    stopDetection();
    detectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isDetectingRef.current) {
        return;
      }
      isDetectingRef.current = true;
      setLoading(prev => ({ ...prev, detection: true }));
      setError(null);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Image = imageDataUrl.split(',')[1];
        try {
          const sign = await detectSignFromImage(base64Image);
          if (sign && sign !== detectedSign) {
            setDetectedSign(sign);
          }
        } catch (err) {
          console.error('Detection failed:', err);
          setError('Could not analyze the image. Please try again.');
        } finally {
          isDetectingRef.current = false;
          setLoading(prev => ({ ...prev, detection: false }));
        }
      } else {
        isDetectingRef.current = false;
        setLoading(prev => ({ ...prev, detection: false }));
      }
    }, 4000);
  }, [detectedSign, stopDetection]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraOn(true);
          startDetection();
        };
      }
      streamRef.current = stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please check permissions and try again.');
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    stopDetection();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    streamRef.current = null;
    setIsCameraOn(false);
    setDetectedSign(null);
    setTranslations({
      [Language.ENGLISH]: '',
      [Language.HINDI]: '',
      [Language.GUJARATI]: '',
    });
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleTranslate = useCallback(async (text: string) => {
    if (!text) return;
    setLoading((prev) => ({ ...prev, translation: true }));
    setError(null);
    try {
      const [hindiRes, gujaratiRes] = await Promise.all([
        translateText(text, Language.HINDI),
        translateText(text, Language.GUJARATI),
      ]);
      setTranslations({
        [Language.ENGLISH]: text,
        [Language.HINDI]: hindiRes,
        [Language.GUJARATI]: gujaratiRes,
      });
    } catch (err) {
      console.error('Translation error:', err);
      setError('Failed to translate the sign. Please try again.');
      setTranslations({
        [Language.ENGLISH]: text,
        [Language.HINDI]: 'Translation failed.',
        [Language.GUJARATI]: 'Translation failed.',
      });
    } finally {
      setLoading((prev) => ({ ...prev, translation: false }));
    }
  }, []);
  
  useEffect(() => {
    if (detectedSign) {
      handleTranslate(detectedSign);
    }
  }, [detectedSign, handleTranslate]);

  const handleSpeak = async (language: Language, text: string) => {
    if (!text || loading.tts[language]) return;
    setLoading((prev) => ({ ...prev, tts: { ...prev.tts, [language]: true } }));
    setError(null);
    try {
      const audioData = await generateSpeech(text);
      await decodeAndPlayAudio(audioData);
    } catch (err) {
      console.error('TTS error:', err);
      setError('Failed to generate audio. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, tts: { ...prev.tts, [language]: false } }));
    }
  };

  return (
    <div className="min-h-screen bg-base-300 text-base-content font-sans">
      <header className="bg-base-100 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-primary">Sign Language Translator</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Camera and Controls */}
          <div className="flex flex-col space-y-6">
            <div className="bg-base-100 rounded-2xl shadow-lg p-4">
              <CameraFeed ref={videoRef} isCameraOn={isCameraOn} />
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            <div className="flex justify-center">
              <StartStopButton isCameraOn={isCameraOn} onClick={toggleCamera} />
            </div>
          </div>

          {/* Right Column: Detection and Translations */}
          <div className="flex flex-col space-y-6">
            <div className="bg-base-100 rounded-2xl shadow-lg p-6 min-h-[120px] flex items-center justify-center">
               <h2 className="text-xl font-semibold text-base-content-secondary flex items-center">
                <span>Detected Sign:</span>
                <div className="ml-3 flex items-center">
                  {loading.detection ? (
                    <>
                      <span className="text-2xl font-bold text-brand-secondary">Analyzing...</span>
                      <div className="ml-4 w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spinner-linear-spin"></div>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-brand-secondary">
                        {detectedSign || (isCameraOn ? '...' : 'Camera off')}
                      </span>
                      {loading.translation && (
                        <div className="ml-4 w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spinner-linear-spin"></div>
                      )}
                    </>
                  )}
                </div>
              </h2>
            </div>
            
            <div className="space-y-4">
              {[Language.ENGLISH, Language.HINDI, Language.GUJARATI].map((lang) => (
                <TranslationCard
                  key={lang}
                  language={lang}
                  text={translations[lang]}
                  isLoading={loading.tts[lang]}
                  onSpeak={() => handleSpeak(lang, translations[lang])}
                  isMuted={!detectedSign || loading.translation || loading.detection}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;