import { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';
import styles from './RichTextEditor.module.scss';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

const TOOLBAR_CONFIG = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  id,
}: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR_CONFIG,
    }),
    [],
  );

  const formats = useMemo(
    () => [
      'bold',
      'italic',
      'underline',
      'list',
      'bullet',
      'link',
    ],
    [],
  );

  if (!isClient) {
    return (
      <textarea
        id={id}
        className={styles.fallback}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }

  return (
    <div className={`${styles.wrapper} ${disabled ? styles.disabled : ''}`}>
      <ReactQuill
        id={id}
        theme="snow"
        className={styles.editor}
        value={value}
        onChange={(content) => onChange(content)}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
      />
    </div>
  );
}

