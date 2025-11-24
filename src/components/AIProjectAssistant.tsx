import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { Mic, Upload, Send, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_RECORDING_TIME = 120; // 2 minutos em segundos

interface AIProjectAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectExtracted: (data: any) => void;
}

export const AIProjectAssistant = ({ open, onOpenChange, onProjectExtracted }: AIProjectAssistantProps) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { messages, isProcessing, extractedData, sendMessage, transcribeAudio, reset } = useAIAssistant();

  const handleSend = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;
    
    await sendMessage(input, selectedFiles);
    setInput('');
    setSelectedFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValid) {
        toast({
          title: 'Arquivo não suportado',
          description: `${file.name} não é uma imagem ou PDF`,
          variant: 'destructive'
        });
      }
      return isValid;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Clear timers
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (autoStopTimerRef.current) {
          clearTimeout(autoStopTimerRef.current);
          autoStopTimerRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        console.log('Audio recorded, size:', audioBlob.size, 'bytes');
        
        if (audioBlob.size < 1000) {
          toast({
            title: 'Áudio muito curto',
            description: 'Grave um áudio mais longo',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Transcrevendo...',
            description: 'Aguarde enquanto processamos seu áudio'
          });
          
          const text = await transcribeAudio(audioBlob);
          if (text) {
            setInput(prev => prev + (prev ? ' ' : '') + text);
            toast({
              title: 'Áudio transcrito!',
              description: 'O texto foi adicionado ao campo de entrada'
            });
          }
        }
        
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start(1000); // Coleta chunks a cada 1 segundo
      setIsRecording(true);

      // Start timer to update recording time every second
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Show warning when approaching limit
          if (newTime === 110) {
            toast({
              title: '10 segundos restantes',
              description: 'A gravação será interrompida automaticamente',
            });
          }
          return newTime;
        });
      }, 1000);

      // Auto-stop after 2 minutes
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          toast({
            title: 'Tempo limite atingido',
            description: 'Gravação de 2 minutos concluída',
          });
        }
      }, MAX_RECORDING_TIME * 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar o microfone',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    if (extractedData) {
      onProjectExtracted(extractedData);
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">🤖 Assistente de Cadastro de Projetos</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p className="mb-2">Olá! Eu sou seu assistente de projetos.</p>
                  <p className="text-sm">Você pode:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>📝 Descrever o projeto por texto</li>
                    <li>🎤 Gravar descrição por áudio</li>
                    <li>📸 Enviar fotos do terreno</li>
                    <li>📄 Enviar documentos PDF</li>
                  </ul>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </div>
                </div>
              )}
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                    {file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <button
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-destructive hover:text-destructive/80"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <Button
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={isRecording ? "animate-pulse" : ""}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                
                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 text-destructive rounded-md text-sm font-medium">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    <span>{formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}</span>
                  </div>
                )}
              </div>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Descreva o projeto ou faça perguntas..."
                className="flex-1 min-h-[60px] max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isProcessing}
              />

              <Button
                size="icon"
                onClick={handleSend}
                disabled={isProcessing || (!input.trim() && selectedFiles.length === 0)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Extracted Data Panel */}
          {extractedData && (
            <Card className="w-80 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Dados Extraídos</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{extractedData.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Endereço:</span>
                  <p className="font-medium">{extractedData.address}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Área:</span>
                  <p className="font-medium">{extractedData.area} m²</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium capitalize">{extractedData.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Descrição:</span>
                  <p className="font-medium">{extractedData.description}</p>
                </div>
                {extractedData.confidence && (
                  <div>
                    <span className="text-muted-foreground">Confiança:</span>
                    <p className="font-medium capitalize">{extractedData.confidence}</p>
                  </div>
                )}
              </div>
              <Button onClick={handleConfirm} className="w-full mt-4">
                Confirmar e Criar Projeto
              </Button>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};