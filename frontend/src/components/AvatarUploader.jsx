import { useState } from 'react';
import { Camera, UploadCloud, X } from 'lucide-react';

export default function AvatarUploader({ userId, onUpload }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !onUpload) return;

    try {
      setUploading(true);
      await onUpload(file);
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full mt-4 p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col items-center">
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
        {previewUrl ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full mb-1">
              New Photo Preview
            </span>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-indigo-500/50 p-1 bg-slate-900/50 shadow-lg">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-bold text-center mb-1">
            Choose a profile picture to upload
          </div>
        )}

        <div className="w-full flex flex-col gap-2">
          {!file ? (
            <label className="w-full">
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 bg-white/2 hover:bg-white/5 cursor-pointer text-xs font-bold text-slate-300 hover:text-white transition duration-200">
                <Camera size={14} className="text-slate-400" />
                <span>Change Profile Photo</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 transition duration-200 flex items-center justify-center gap-1.5 border-none"
              >
                <UploadCloud size={14} />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 font-bold text-xs cursor-pointer transition flex items-center justify-center"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
