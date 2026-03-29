'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, actions, wide }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`bg-surface-container-high text-on-surface rounded-2xl border border-outline-variant/20 p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm w-full shadow-2xl ${wide ? 'max-w-lg' : 'max-w-md'}`}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-bold font-headline">{title}</h3>
        <div className="text-sm text-on-surface-variant">{children}</div>
        {actions && (
          <div className="flex justify-end gap-3 pt-2">
            {actions}
          </div>
        )}
      </div>
    </dialog>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface text-sm font-medium hover:bg-surface-bright transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              danger
                ? 'bg-error text-on-error hover:bg-error-container'
                : 'bg-primary text-on-primary hover:bg-primary-container'
            }`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function AlertModal({ open, onClose, title, message }: AlertModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary-container transition-colors"
        >
          OK
        </button>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
