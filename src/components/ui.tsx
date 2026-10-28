import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Check, X } from "lucide-react";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const elements = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = elements[0],
          last = elements[elements.length - 1];
        if (!first) {
          e.preventDefault();
          e.currentTarget.focus();
        } else if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === e.currentTarget)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-body">
        <button
          className="icon-button close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  label = "Удалить",
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  label?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p>{description}</p>
      <div className="button-row">
        <button className="button secondary" autoFocus onClick={onClose}>
          Отмена
        </button>
        <button
          className="button danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {label}
        </button>
      </div>
    </Modal>
  );
}
export function EditModal({
  title,
  value,
  onSave,
  onClose,
}: {
  title: string;
  value: string;
  onSave: (v: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            onSave(text.trim());
            onClose();
          }
        }}
      >
        <label className="sr-only" htmlFor="edit-value">
          Текст
        </label>
        <textarea
          id="edit-value"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          rows={3}
        />
        <div className="button-row">
          <button className="button secondary" type="button" onClick={onClose}>
            Отмена
          </button>
          <button className="button primary" disabled={!text.trim()}>
            <Check size={18} />
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Empty({
  title = "Пока здесь пусто",
  text = "Добавь первое дело. Мы поможем сделать первый шаг.",
  action = "Создать задачу",
  onAction,
}: {
  title?: string;
  text?: string;
  action?: string;
  onAction: () => void;
}) {
  return (
    <div className="empty card">
      <div className="empty-symbol">
        <ArrowRight size={30} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="button primary" onClick={onAction}>
        {action}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <div className="heading-row">
        <div>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        {children}
      </div>
    </header>
  );
}
