import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [line, setLine] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const transcriptRef = useRef({ final: '', interim: '' });
  const recordingActiveRef = useRef(false);

  const speechSupported = useMemo(
    () => !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)),
    []
  );

  const stop = useCallback(() => {
    recordingActiveRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    setIsRecording(false);
  }, []);

  const start = useCallback(() => {
    if (!speechSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    transcriptRef.current = { final: '', interim: '' };
    setLine('');
    setError('');
    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const r = event.results[i];
        const piece = r[0]?.transcript || '';
        if (r.isFinal) transcriptRef.current.final += piece;
        else interim += piece;
      }
      transcriptRef.current.interim = interim;
      setLine((transcriptRef.current.final + transcriptRef.current.interim).trim());
    };
    rec.onerror = (e) => {
      setError(e.error || 'speech error');
      recordingActiveRef.current = false;
      setIsRecording(false);
    };
    rec.onend = () => {
      if (recordingActiveRef.current) {
        try {
          rec.start();
        } catch {
          recordingActiveRef.current = false;
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };
    recognitionRef.current = rec;
    try {
      recordingActiveRef.current = true;
      rec.start();
      setIsRecording(true);
    } catch {
      recordingActiveRef.current = false;
      setError('Could not start microphone');
      setIsRecording(false);
    }
  }, [speechSupported]);

  const commitAndStop = useCallback(() => {
    recordingActiveRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    setIsRecording(false);
    const text = (transcriptRef.current.final + transcriptRef.current.interim).trim();
    transcriptRef.current = { final: '', interim: '' };
    setLine('');
    return text;
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return { speechSupported, isRecording, line, error, start, stop, commitAndStop };
}
