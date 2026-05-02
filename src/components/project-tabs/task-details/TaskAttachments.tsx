"use client";

import React, { useState, useRef } from "react";
import { TaskAttachment } from "@/lib/types/project";

// ─── Helpers ────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(fileType: string): boolean {
  return fileType.startsWith("image/");
}

function getFileIcon(fileType: string): React.ReactElement {
  if (fileType.includes("pdf")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-rose-500">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="10" y1="13" x2="14" y2="13" />
        <line x1="10" y1="17" x2="14" y2="17" />
        <line x1="10" y1="9" x2="12" y2="9" />
      </svg>
    );
  }
  if (fileType.includes("word") || fileType.includes("document")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-500">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }
  if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-500">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    );
  }
  if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("tar")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-500">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  // Generic file
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

// ─── Lightbox ───────────────────────────────────────────────────

interface LightboxProps {
  url: string;
  fileName: string;
  onClose: () => void;
}

function Lightbox({ url, fileName, onClose }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="w-full flex items-center justify-between px-2">
          <span className="text-white/80 text-sm font-medium truncate max-w-xs">{fileName}</span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Tải về
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-hidden rounded-2xl shadow-2xl max-h-[80vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={fileName}
            className="max-w-full max-h-[80vh] object-contain rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

interface TaskAttachmentsProps {
  taskId: number;
  attachments: TaskAttachment[];
  attachmentsLoading: boolean;
  currentUserId: string;
  isSubmitting: boolean;
  onUpload: (taskId: number, file: File) => Promise<void>;
  onDelete: (attachmentId: number, taskId: number) => Promise<void>;
}

export function TaskAttachments({
  taskId,
  attachments,
  attachmentsLoading,
  currentUserId,
  isSubmitting,
  onUpload,
  onDelete,
}: TaskAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState<string>("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      setUploading(true);
      await onUpload(taskId, file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (attachmentId: number) => {
    try {
      setDeletingId(attachmentId);
      await onDelete(attachmentId, taskId);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const images = attachments.filter((a) => isImageType(a.file_type));
  const files = attachments.filter((a) => !isImageType(a.file_type));

  return (
    <>
      {/* Lightbox */}
      {lightboxUrl && (
        <Lightbox
          url={lightboxUrl}
          fileName={lightboxName}
          onClose={() => { setLightboxUrl(null); setLightboxName(""); }}
        />
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Đính kèm
        </h3>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && !isSubmitting && fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2
            border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer
            transition-all duration-150 select-none
            ${isDraggingOver
              ? "border-[#28B8FA] bg-[#EAF7FF] scale-[1.01]"
              : "border-slate-200 hover:border-[#28B8FA] hover:bg-slate-50"
            }
            ${(uploading || isSubmitting) ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            disabled={uploading || isSubmitting}
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex items-center gap-2 text-[#28B8FA]">
              <div className="w-4 h-4 border-2 border-[#28B8FA]/30 border-t-[#28B8FA] rounded-full animate-spin" />
              <span className="text-xs font-semibold">Đang tải lên...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 font-medium text-center">
                <span className="font-bold text-[#28B8FA]">Chọn file</span> hoặc kéo thả vào đây
              </p>
              <p className="text-[10px] text-slate-400">Tối đa 25MB mỗi file</p>
            </>
          )}
        </div>

        {/* Loading skeleton */}
        {attachmentsLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Images grid */}
        {!attachmentsLoading && images.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Hình ảnh ({images.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((att) => (
                <div key={att.id} className="relative group rounded-xl overflow-hidden border border-slate-100 shadow-sm aspect-square bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.public_url}
                    alt={att.file_name}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => { setLightboxUrl(att.public_url); setLightboxName(att.file_name); }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-between p-1.5 pointer-events-none group-hover:pointer-events-auto">
                    <span className="text-[9px] text-white font-semibold truncate max-w-[70%] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                      {att.file_name}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Download */}
                      <a
                        href={att.public_url}
                        download={att.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-[#28B8FA] transition-colors shadow"
                        title="Tải về"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                      {/* Delete (only for uploader) */}
                      {att.uploaded_by === currentUserId && (
                        confirmDeleteId === att.id ? (
                          <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/90 text-slate-600 hover:text-slate-800 shadow"
                            >Hủy</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(att.id); }}
                              disabled={deletingId === att.id}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white hover:bg-red-600 shadow disabled:opacity-50"
                            >Xóa</button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(att.id); }}
                            className="p-1 rounded-lg bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shadow"
                            title="Xóa"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files list */}
        {!attachmentsLoading && files.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tài liệu ({files.length})
            </p>
            <div className="flex flex-col gap-2">
              {files.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group"
                >
                  {/* Icon */}
                  <div className="shrink-0">{getFileIcon(att.file_type)}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate" title={att.file_name}>
                      {att.file_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {formatFileSize(att.file_size)}
                      {att.uploader && (
                        <span className="ml-1.5 text-slate-300">· {att.uploader.display_name}</span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Download */}
                    <a
                      href={att.public_url}
                      download={att.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#28B8FA] hover:bg-[#EAF7FF] transition-colors"
                      title="Tải về"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </a>

                    {/* Delete */}
                    {att.uploaded_by === currentUserId && (
                      confirmDeleteId === att.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleDelete(att.id)}
                            disabled={deletingId === att.id}
                            className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded shadow-sm transition-colors disabled:opacity-50"
                          >
                            {deletingId === att.id ? "..." : "Xóa"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(att.id)}
                          disabled={isSubmitting}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Xóa file"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!attachmentsLoading && attachments.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-1">
            Chưa có file đính kèm nào.
          </p>
        )}
      </div>
    </>
  );
}
