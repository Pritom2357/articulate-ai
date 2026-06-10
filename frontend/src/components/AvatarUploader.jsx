import { useState } from 'react';

export default function AvatarUploader({ userId, onUpload }) {
  const [file, setFile] = useState(null);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (file && onUpload) {
          await onUpload(file);
          setFile(null);
        }
      }}
    >
      <label>
        Upload avatar
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
      <button type="submit" disabled={!file}>
        Upload
      </button>
    </form>
  );
}
