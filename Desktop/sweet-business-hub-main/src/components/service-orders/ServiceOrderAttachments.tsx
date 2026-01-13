import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  FileText,
  X,
  ZoomIn,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useServiceOrderAttachments, 
  useUploadAttachment, 
  useDeleteAttachment,
  getAttachmentUrl,
  formatFileSize,
  type ServiceOrderAttachment
} from '@/hooks/useServiceOrderAttachments';

interface ServiceOrderAttachmentsProps {
  serviceOrderId: string;
  readOnly?: boolean;
}

const attachmentTypeLabels = {
  before: { label: 'Antes', color: 'bg-orange-100 text-orange-800' },
  after: { label: 'Depois', color: 'bg-green-100 text-green-800' },
  other: { label: 'Outro', color: 'bg-gray-100 text-gray-800' },
};

export function ServiceOrderAttachments({ serviceOrderId, readOnly = false }: ServiceOrderAttachmentsProps) {
  const { data: attachments, isLoading } = useServiceOrderAttachments(serviceOrderId);
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOrderAttachment | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<'before' | 'after' | 'other'>('before');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadModalOpen(true);
    }
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadMutation.mutateAsync({
        serviceOrderId,
        file: selectedFile,
        attachmentType,
        description: description.trim() || undefined,
      });
      toast.success('Anexo enviado com sucesso!');
      handleCloseUploadModal();
    } catch (error) {
      toast.error('Erro ao enviar anexo');
      console.error(error);
    }
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedFile(null);
    setAttachmentType('before');
    setDescription('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      await deleteMutation.mutateAsync({
        id: deleteTarget.id,
        filePath: deleteTarget.file_path,
        serviceOrderId,
      });
      toast.success('Anexo excluído com sucesso!');
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Erro ao excluir anexo');
      console.error(error);
    }
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  const beforeAttachments = attachments?.filter(a => a.attachment_type === 'before') || [];
  const afterAttachments = attachments?.filter(a => a.attachment_type === 'after') || [];
  const otherAttachments = attachments?.filter(a => a.attachment_type === 'other') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Camera className="w-4 h-4 text-muted-foreground" />
          Anexos e Fotos
        </h3>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Adicionar
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Before Section */}
      {beforeAttachments.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Antes do Reparo</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {beforeAttachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                onPreview={setPreviewImage}
                onDelete={!readOnly ? setDeleteTarget : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* After Section */}
      {afterAttachments.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Depois do Reparo</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {afterAttachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                onPreview={setPreviewImage}
                onDelete={!readOnly ? setDeleteTarget : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Section */}
      {otherAttachments.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Outros Anexos</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {otherAttachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                onPreview={setPreviewImage}
                onDelete={!readOnly ? setDeleteTarget : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {attachments?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum anexo adicionado</p>
          {!readOnly && (
            <p className="text-xs mt-1">Clique em "Adicionar" para enviar fotos</p>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={handleCloseUploadModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Anexo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tipo de Anexo</Label>
                <Select 
                  value={attachmentType} 
                  onValueChange={(v) => setAttachmentType(v as 'before' | 'after' | 'other')}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Antes do Reparo</SelectItem>
                    <SelectItem value="after">Depois do Reparo</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Arquivo</Label>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {selectedFile?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile && formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUploadModal}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploadMutation.isPending}
              className="gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] p-2">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 hover:bg-background"
          >
            <X className="w-4 h-4" />
          </button>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anexo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.file_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AttachmentCardProps {
  attachment: ServiceOrderAttachment;
  onPreview: (url: string) => void;
  onDelete?: (attachment: ServiceOrderAttachment) => void;
}

function AttachmentCard({ attachment, onPreview, onDelete }: AttachmentCardProps) {
  const url = getAttachmentUrl(attachment.file_path);
  const typeConfig = attachmentTypeLabels[attachment.attachment_type];
  
  return (
    <div className="group relative rounded-lg border overflow-hidden bg-muted/30">
      <div 
        className="aspect-square cursor-pointer"
        onClick={() => onPreview(url)}
      >
        <img
          src={url}
          alt={attachment.file_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <div className="p-2">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="secondary" className={`text-xs ${typeConfig.color}`}>
            {typeConfig.label}
          </Badge>
          {onDelete && (
            <button
              onClick={() => onDelete(attachment)}
              className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate" title={attachment.file_name}>
          {attachment.file_name}
        </p>
        {attachment.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5" title={attachment.description}>
            {attachment.description}
          </p>
        )}
      </div>
    </div>
  );
}
