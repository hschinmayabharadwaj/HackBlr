'use client';
import { checkAndIntervene } from '@/lib/analyze-behavior';
import { useState, useRef, useEffect, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Loader2, Volume2, User, Bot, Send, Languages, ScanText, ListChecks, RadioTower } from 'lucide-react';
import { voiceAgent, textToSpeech, speechToText } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

interface Message {
  role: 'user' | 'model';
  content: string;
}

function MessageBody({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return <p className="whitespace-pre-wrap leading-7">{content}</p>;
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 12)}`} className="whitespace-pre-wrap leading-7">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function mergeTranscriptMessage(previous: Message[], nextMessage: Message) {
  const lastMessage = previous[previous.length - 1];

  if (!lastMessage || lastMessage.role !== nextMessage.role) {
    return [...previous, nextMessage];
  }

  if (lastMessage.content === nextMessage.content) {
    return previous;
  }

  const previousContent = lastMessage.content.trim();
  const nextContent = nextMessage.content.trim();

  if (nextContent.startsWith(previousContent)) {
    return [...previous.slice(0, -1), { ...lastMessage, content: nextContent }];
  }

  if (previousContent.startsWith(nextContent)) {
    return previous;
  }

  return [...previous, nextMessage];
}

function isBenignVapiTerminationError(error: unknown) {
  const errorText =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error);

  const normalized = errorText.toLowerCase();
  return normalized.includes('meeting has ended') || normalized.includes('due to ejection');
}

interface HealthState {
  status: 'loading' | 'ok' | 'degraded';
  memory?: {
    configured: boolean;
    qdrantReachable: boolean;
    collectionExists: boolean | null;
    collectionName: string;
    embeddingConfigured: boolean;
    details?: string;
  };
}

const workflowDemos = [
  {
    title: 'Form explanation',
    prompt: 'Explain this form in simple language, list the steps I need to complete, and tell me what information I should prepare.',
    description: 'Break down a form into plain steps.',
    icon: ScanText,
  },
  {
    title: 'Translation help',
    prompt: 'Translate this into Hindi, keep the meaning clear, and briefly explain anything important in plain language.',
    description: 'Make content usable in another language.',
    icon: Languages,
  },
  {
    title: 'Service navigation',
    prompt: 'I need help with this service request. Explain the next step, the documents I may need, and what I should do first.',
    description: 'Guide the user through a real process.',
    icon: ListChecks,
  },
] as const;

export default function Home() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVapiActive, setIsVapiActive] = useState(false);
  const [memoryKey, setMemoryKey] = useState('');
  const [health, setHealth] = useState<HealthState>({ status: 'loading' });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const vapiRef = useRef<Vapi | null>(null);

  const { toast } = useToast();
  const vapiEnabled = Boolean(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY && process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);

  useEffect(() => {
    audioPlayerRef.current = new Audio();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.preload = 'auto';
      audioPlayerRef.current.volume = 1.0;
    }
  }, []);

  useEffect(() => {
    const storedMemoryKey = window.localStorage.getItem('manasmitra-memory-key');
    const nextMemoryKey = storedMemoryKey || crypto.randomUUID();
    window.localStorage.setItem('manasmitra-memory-key', nextMemoryKey);
    setMemoryKey(nextMemoryKey);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isGeneratingAudio, isTranscribing, isVapiActive]);

  useEffect(() => {
    let cancelled = false;

    const loadHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();

        if (cancelled) {
          return;
        }

        setHealth({
          status: data?.status === 'ok' ? 'ok' : 'degraded',
          memory: data?.memory,
        });
      } catch (error) {
        if (!cancelled) {
          setHealth({ status: 'degraded' });
          console.warn('Health check failed:', error);
        }
      }
    };

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (!publicKey || !assistantId || !memoryKey) {
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    const handleTranscript = (message: any) => {
      if (message?.type !== 'transcript' || !message.transcript) {
        return;
      }

      if (message.final === false || message.isFinal === false || message.partial === true) {
        return;
      }

      const role = message.role === 'assistant' ? 'model' : 'user';
      const content = String(message.transcript).trim();

      if (!content) {
        return;
      }

      setMessages((prev) => mergeTranscriptMessage(prev, { role, content }));

      if (!memoryKey) {
        return;
      }

      fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'store',
          memoryKey,
          text: `${role === 'user' ? 'User' : 'Assistant'}: ${content}`,
          metadata: {
            source: 'vapi',
            role,
          },
        }),
      }).catch((error) => {
        console.warn('Failed to store Vapi transcript:', error);
      });
    };

    let isCallActive = false;

    vapi.on('call-start', () => {
      isCallActive = true;
      setIsVapiActive(true);
      setIsRecording(true);
    });
    vapi.on('call-end', () => {
      isCallActive = false;
      setIsVapiActive(false);
      setIsRecording(false);
    });
    vapi.on('error', (error: unknown) => {
      if (isBenignVapiTerminationError(error)) {
        return;
      }

      console.error('Vapi session error:', error);
    });
    vapi.on('message', handleTranscript);

    return () => {
      if (isCallActive) {
        try {
          vapi.stop();
        } catch (error) {
          if (!isBenignVapiTerminationError(error)) {
            console.warn('Vapi cleanup stop failed:', error);
          }
        }
      }
      vapiRef.current = null;
    };
  }, [memoryKey]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);
// Screen message with .pkl model
const intervention = await checkAndIntervene(text);

if (intervention.shouldIntervene) {
  // Risk detected — skip normal AI, use crisis response
  const aiMessage: Message = { role: 'model', content: intervention.crisisResponse };
  setMessages(prev => [...prev, aiMessage]);
  
  setIsGeneratingAudio(true);
  const audioResult = await textToSpeech({ text: intervention.crisisResponse });
  setIsGeneratingAudio(false);
  
  if (audioResult.audioDataUri && audioPlayerRef.current) {
    audioPlayerRef.current.src = audioResult.audioDataUri;
    audioPlayerRef.current.play().catch(console.warn);
  }
  setIsLoading(false);
  return; // Skip normal voiceAgent() flow
}
    try {
      const response = await voiceAgent({
        history: newMessages,
        currentInput: text,
        memoryKey,
      });

      const aiMessage: Message = { role: 'model', content: response.response };
      setMessages(prev => [...prev, aiMessage]);

      setIsGeneratingAudio(true);
      const audioResult = await textToSpeech({ text: response.response });
      setIsGeneratingAudio(false);

      if (audioResult.audioDataUri) {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioResult.audioDataUri;
          audioPlayerRef.current.play().catch(e => {
            console.warn('Audio playback failed:', e);
          });
        }
      }
    } catch (error) {
      console.error('Error with voice agent:', error);
      toast({
        variant: 'destructive',
        title: 'AI Agent Error',
        description: "I'm having trouble responding right now. Please try again.",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast, memoryKey]);

  const handleQuickAction = useCallback(async (prompt: string) => {
    if (isVapiActive) {
      return;
    }

    await handleSendMessage(prompt);
  }, [handleSendMessage, isVapiActive]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const blobToDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const toggleRecording = async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (publicKey && assistantId && vapiRef.current) {
      if (isVapiActive) {
        try {
          vapiRef.current.stop();
        } catch (error) {
          if (!isBenignVapiTerminationError(error)) {
            console.error('Failed to stop Vapi session:', error);
          }
        }
        return;
      }

      try {
        setIsRecording(true);
        await vapiRef.current.start(assistantId);
      } catch (error) {
        setIsRecording(false);
        console.error('Failed to start Vapi session:', error);
        toast({
          variant: 'destructive',
          title: 'Voice session unavailable',
          description: 'Falling back to the built-in voice recorder.',
        });
      }

      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 100) {
          toast({ variant: 'destructive', title: 'No audio detected', description: 'Please try speaking again.' });
          return;
        }

        // Transcribe using Gemini
        setIsTranscribing(true);
        try {
          const audioDataUri = await blobToDataUri(audioBlob);
          const result = await speechToText({ audioDataUri });
          setIsTranscribing(false);

          if (result.transcript) {
            handleSendMessage(result.transcript);
          } else {
            toast({ variant: 'destructive', title: 'Could not transcribe', description: 'No speech was detected. Please try again.' });
          }
        } catch (err) {
          setIsTranscribing(false);
          console.error('Transcription error:', err);
          toast({ variant: 'destructive', title: 'Transcription failed', description: 'Could not transcribe audio. Please use text input.' });
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access in your browser settings to use voice input.',
      });
    }
  };

  const isBusy = isLoading || isGeneratingAudio || isTranscribing || isVapiActive;
  const isVoiceSessionActive = isRecording || isVapiActive;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 p-4 md:p-8 flex justify-center items-start">
        <div className="w-full max-w-4xl space-y-6">
          <section className="overflow-hidden rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                  Voice-first accessibility
                </p>
                <h1 className="text-4xl font-bold font-headline tracking-tight md:text-5xl">
                  Speak naturally. Understand instantly. Act with less friction.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  ManasMitra helps people navigate forms, messages, instructions, and workflows through conversation. It is designed for low-literacy, multilingual, and hands-free use.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-foreground/80">
                    <RadioTower className="h-3.5 w-3.5 text-primary" />
                    {vapiEnabled ? 'Vapi orchestration ready' : 'Gemini voice fallback ready'}
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${health.status === 'ok' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
                    <span className={`h-2 w-2 rounded-full ${health.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {health.status === 'ok' ? 'Qdrant memory online' : 'Qdrant memory needs attention'}
                  </div>
                </div>
                {health.memory && (
                  <p className="text-sm text-muted-foreground">
                    {health.memory.qdrantReachable
                      ? health.memory.collectionExists
                        ? `Qdrant collection ${health.memory.collectionName} is available.`
                        : `Qdrant is reachable, but collection ${health.memory.collectionName} has not been created yet.`
                      : health.memory.details || 'Qdrant is not reachable from this app right now.'}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {workflowDemos.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.title}
                      type="button"
                      onClick={() => handleQuickAction(action.prompt)}
                      disabled={isBusy || isVoiceSessionActive}
                      className="group rounded-2xl border bg-background/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold">{action.title}</div>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <Card className="w-full max-w-4xl border-border/60 bg-card/95 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold font-headline">{t('voice.title')}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                {t('voice.subtitle')}
              </CardDescription>
            </CardHeader>

            <div className="px-6 pb-2">
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">Try a workflow demo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a scenario to see how the assistant handles forms, translation, and service navigation.
                </p>
              </div>
            </div>

            <CardContent>
              <div className="space-y-4 h-96 overflow-y-auto p-4 rounded-lg border bg-muted/50">
                {messages.length === 0 && !isBusy && (
                  <div className="flex flex-col h-full items-center justify-center text-center text-muted-foreground">
                    <Volume2 className="w-16 h-16 mb-4"/>
                    <p className="font-semibold">Your conversation will appear here.</p>
                    <p>Ask for simple explanations, translations, summaries, or next steps.</p>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';

                  return (
                    <div key={index} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[88%] items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
                          {isUser ? <User size={18} /> : <Bot size={18} />}
                        </div>

                        <div className={`rounded-2xl border px-4 py-3 shadow-sm ${isUser ? 'border-primary/20 bg-primary text-primary-foreground' : 'border-border/80 bg-background text-foreground'}`}>
                          <div className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {isUser ? 'You' : 'Assistant'}
                          </div>
                          <MessageBody content={msg.content} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTranscribing && (
                  <div className="flex w-full justify-start">
                    <div className="flex max-w-[88%] items-end gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Mic size={16}/>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background px-4 py-3 shadow-sm">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          Transcribing
                        </div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin"/>
                          <span className="text-sm text-muted-foreground">Transcribing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex w-full justify-start">
                    <div className="flex max-w-[88%] items-end gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot size={18}/>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background px-4 py-3 shadow-sm">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          Assistant
                        </div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin"/>
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isGeneratingAudio && (
                  <div className="flex w-full justify-start">
                    <div className="flex max-w-[88%] items-end gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Volume2 size={16}/>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background px-4 py-3 shadow-sm">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          Assistant
                        </div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin"/>
                          <span className="text-sm text-muted-foreground">Generating voice...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Button
                  onClick={toggleRecording}
                  size="lg"
                  className="rounded-full w-16 h-16"
                  disabled={isBusy && !isVoiceSessionActive}
                  variant={isVoiceSessionActive ? "destructive" : "default"}
                  aria-label={isVoiceSessionActive ? 'Stop voice session' : 'Start voice input'}
                >
                  {isVoiceSessionActive ? <MicOff size={24} /> : <Mic size={24} />}
                </Button>
              </div>

              <form onSubmit={handleTextSubmit} className="w-full flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1"
                  disabled={isBusy || isVoiceSessionActive}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!inputText.trim() || isBusy || isVoiceSessionActive}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                {isVapiActive ? "Vapi voice session active... tap the mic to stop" :
                 isRecording ? "Recording... tap to stop" :
                 isTranscribing ? "Transcribing your voice..." :
                 isLoading ? "Thinking..." :
                 isGeneratingAudio ? "Generating voice..." :
                 "Type a request or tap the mic to speak"}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
