import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, StickyNote, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
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

const ProjectNotes = ({ notes = [], onUpdate }) => {
  const [text, setText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newNote = {
      id: Date.now().toString(),
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    onUpdate([...notes, newNote]);
    setText('');
    toast({ title: 'Nota guardada' });
  };

  const handleDelete = () => {
    onUpdate(notes.filter((n) => n.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast({ title: 'Nota eliminada' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Notas internas</h2>
        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-3 py-1 font-medium">
          Solo administrador
        </span>
      </div>

      {/* Input nueva nota */}
      <div className="space-y-2">
        <Textarea
          placeholder="Escribe aquí los cambios, modificaciones o cualquier anotación interna..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button onClick={handleAdd} disabled={!text.trim()} size="sm">
            <Send className="w-4 h-4 mr-2" />
            Guardar nota
          </Button>
        </div>
      </div>

      {/* Lista de notas */}
      {notes.length === 0 ? (
        <div className="bg-card border rounded-xl p-10 text-center">
          <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">Sin notas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Anota aquí los cambios y modificaciones de la obra.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {[...notes].reverse().map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 group relative"
              >
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => setDeleteTarget(note)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600"
                    title="Eliminar nota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectNotes;
