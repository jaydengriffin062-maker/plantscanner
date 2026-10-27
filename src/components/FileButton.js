'use client';

import { useRef } from 'react';

import { ACCEPT_ATTRIBUTE } from '@/lib/imageUtils';

/**
 * A button that opens the photo picker. With `capture`, phones open the
 * camera app directly instead of the gallery.
 */
export default function FileButton({ icon: Icon, label, onFile, capture, variant = 'primary', disabled, className = '' }) {
  const inputRef = useRef(null);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow picking the same photo again
    onFile(file);
  };

  return (
    <>
      <button
        type="button"
        className={`button button--${variant} ${className}`}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        {Icon && <Icon size={22} aria-hidden />}
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        capture={capture}
        onChange={handleChange}
        hidden
      />
    </>
  );
}
