"use client";

import React, { useState } from "react";
import {
  XIcon,
  TrelloIcon,
  JiraIcon,
  GitHubIcon,
  ImportIcon,
  ArrowLeftIcon,
} from "@/components/icons";
import { useDashboardUser } from "@/app/(dashboard)/provider";

type Platform = "trello" | "jira" | "github" | null;

export type RemoteProject = {
  id: string;
  name: string;
  description?: string;
};

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (platform: string, credentials: any, selectedProjects: RemoteProject[]) => void | Promise<any>;
}

export default function ImportDataModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportDataModalProps) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [credentials, setCredentials] = useState<{ token: string; key?: string; domain?: string; email?: string }>({ token: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remoteProjects, setRemoteProjects] = useState<RemoteProject[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const resetAndClose = () => {
    setStep(1);
    setSelectedPlatform(null);
    setCredentials({ token: "" });
    setError("");
    setIsLoading(false);
    setRemoteProjects([]);
    setSelectedProjectIds([]);
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && selectedPlatform) {
      setStep(2);
    } else if (step === 3 && selectedProjectIds.length > 0) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError("");
      setCredentials({ token: "" });
    } else if (step === 3) {
      setStep(2);
      setSelectedProjectIds([]);
      setRemoteProjects([]);
    } else if (step === 4) {
      setStep(3);
    }
  };

  const handleConnect = async () => {
    setError("");
    if (selectedPlatform === "github" && !credentials.token.trim()) {
      setError("Token không được để trống.");
      return;
    }
    if (selectedPlatform === "trello" && (!credentials.key?.trim() || !credentials.token.trim())) {
      setError("API Key và Token không được để trống.");
      return;
    }
    if (selectedPlatform === "jira" && (!credentials.domain?.trim() || !credentials.email?.trim() || !credentials.token.trim())) {
      setError("Domain, Email và Token không được để trống.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/integrations/fetch-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: selectedPlatform, credentials })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Kết nối thất bại. Vui lòng kiểm tra lại thông tin xác thực");
      }
      
      const data = await res.json();
      setRemoteProjects(data.projects || []);
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProjectSelection = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (onSuccess && selectedPlatform) {
      setIsLoading(true);
      const selectedData = remoteProjects.filter((p) => selectedProjectIds.includes(p.id));
      try {
        await onSuccess(selectedPlatform, credentials, selectedData);
        resetAndClose();
      } catch (err) {
        setIsLoading(false);
      }
    } else {
      resetAndClose();
    }
  };

  if (!isOpen) return null;

  const platforms = [
    {
      id: "trello",
      name: "Trello",
      icon: <TrelloIcon className="w-8 h-8" />,
      desc: "Nhập bảng và thẻ từ Trello",
      helpLink: "https://trello.com/app-key",
      helpText: "Lấy API Key và Token tại Trello Developer",
    },
    {
      id: "jira",
      name: "Jira",
      icon: <JiraIcon className="w-8 h-8" />,
      desc: "Đồng bộ issue từ Jira Software",
      helpLink: "https://id.atlassian.com/manage-profile/security/api-tokens",
      helpText: "Tạo API Token trong Atlassian Account",
    },
    {
      id: "github",
      name: "GitHub",
      icon: <GitHubIcon className="w-8 h-8" />,
      desc: "Nhập project và issue từ GitHub",
      helpLink: "https://github.com/settings/tokens",
      helpText: "Tạo Personal Access Token trên GitHub",
    },
  ];

  const currentPlatformDetails = platforms.find(
    (p) => p.id === selectedPlatform,
  );

  return (
    <div
      className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200 ${
        isCozy ? "bg-slate-950/60" : "bg-slate-900/40"
      }`}
      onClick={resetAndClose}
    >
      <div
        className={`rounded-[2.5rem] shadow-2xl w-full max-w-lg relative mx-4 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-500 ${
          isCozy ? "bg-[#0F172A] border border-slate-800" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Options */}
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          <button
            onClick={resetAndClose}
            disabled={isLoading}
            className={`transition-colors disabled:opacity-50 p-1 rounded-full backdrop-blur-md ${
              isCozy
                ? "bg-slate-800 text-slate-500 hover:text-white"
                : "text-slate-400 hover:text-slate-600 bg-white/80"
            }`}
          >
            <XIcon />
          </button>
        </div>
        {step > 1 && (
          <div className="absolute top-6 left-6 z-10 flex gap-2">
            <button
              onClick={handleBack}
              disabled={isLoading}
              className={`transition-colors disabled:opacity-50 p-1 rounded-full backdrop-blur-md flex items-center justify-center ${
                isCozy
                  ? "bg-slate-800 text-slate-500 hover:text-white"
                  : "text-slate-400 hover:text-slate-600 bg-slate-100"
              }`}
            >
              <ArrowLeftIcon />
            </button>
          </div>
        )}

        <div className="p-8 flex flex-col gap-6 overflow-y-auto w-full mt-4">
          <div className="text-center flex flex-col items-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isCozy ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-500"
              }`}
            >
              <ImportIcon className="w-8 h-8" />
            </div>
            <h2
              className={`text-2xl font-bold ${
                isCozy ? "text-white" : "text-slate-900"
              }`}
            >
              Import Dữ Liệu
            </h2>
            <p
              className={`text-sm font-medium mt-1 ${
                isCozy ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {step === 1 && "Chọn nền tảng bạn muốn kết nối và đồng bộ dự án."}
              {step === 2 && `Xác thực kết nối tới ${currentPlatformDetails?.name}`}
              {step === 3 && "Chọn dự án bạn muốn import dữ liệu."}
              {step === 4 && "Xác nhận và tiến hành import."}
            </p>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 mt-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id as Platform)}
                  className={`flex items-center gap-4 p-4 border rounded-2xl transition-all text-left ${
                    selectedPlatform === p.id
                      ? isCozy
                        ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500"
                        : "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                      : isCozy
                      ? "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl ${
                      isCozy ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    {p.icon}
                  </div>
                  <div>
                    <h3
                      className={`text-base font-bold ${
                        isCozy ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {p.name}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 ${
                        isCozy ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      {p.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && currentPlatformDetails && (
            <div className="flex flex-col gap-4 mt-2 animate-in slide-in-from-right-4 duration-300">
              <div
                className={`p-4 rounded-2xl flex items-start gap-3 ${
                  isCozy ? "bg-slate-900" : "bg-slate-50"
                }`}
              >
                <div className="mt-0.5">{currentPlatformDetails.icon}</div>
                <div>
                  <h4
                    className={`text-sm font-bold ${
                      isCozy ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    Làm thế nào để lấy Token?
                  </h4>
                  <p
                    className={`text-xs mt-1 mb-2 ${
                      isCozy ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {currentPlatformDetails.helpText}
                  </p>
                  <a
                    href={currentPlatformDetails.helpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    Hướng dẫn chi tiết
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {selectedPlatform === "trello" && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">API Key <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Nhập API Key..." value={credentials.key || ""} onChange={(e) => { setCredentials({ ...credentials, key: e.target.value }); setError(""); }} className={`w-full px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-all ${isCozy ? "bg-slate-900/50 border-slate-800 text-white focus:border-indigo-500" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`} disabled={isLoading} />
                  </div>
                )}
                {selectedPlatform === "jira" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Domain <span className="text-red-400">*</span></label>
                      <input type="text" placeholder="Ví dụ: your-domain.atlassian.net" value={credentials.domain || ""} onChange={(e) => { setCredentials({ ...credentials, domain: e.target.value }); setError(""); }} className={`w-full px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-all ${isCozy ? "bg-slate-900/50 border-slate-800 text-white focus:border-indigo-500" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`} disabled={isLoading} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email <span className="text-red-400">*</span></label>
                      <input type="email" placeholder="Nhập Email tài khoản Atlassian..." value={credentials.email || ""} onChange={(e) => { setCredentials({ ...credentials, email: e.target.value }); setError(""); }} className={`w-full px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-all ${isCozy ? "bg-slate-900/50 border-slate-800 text-white focus:border-indigo-500" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`} disabled={isLoading} />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    {selectedPlatform === "github" ? "Personal Access Token" : "API Token"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập mã xác thực..."
                    value={credentials.token}
                    onChange={(e) => { setCredentials({ ...credentials, token: e.target.value }); setError(""); }}
                    className={`w-full px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-all ${isCozy ? "bg-slate-900/50 border-slate-800 text-white focus:border-indigo-500" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-xs font-medium text-red-400 ml-1">{error}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3 mt-2 animate-in slide-in-from-right-4 duration-300">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Danh sách dự án ({remoteProjects.length})
              </label>
              <div className="max-h-[30vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {remoteProjects.map((proj) => {
                  const isSelected = selectedProjectIds.includes(proj.id);
                  return (
                    <label
                      key={proj.id}
                      className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? isCozy
                            ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500"
                            : "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                          : isCozy
                          ? "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProjectSelection(proj.id)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-bold ${
                            isCozy ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {proj.name}
                        </h4>
                        {proj.description && (
                          <p
                            className={`text-xs mt-1 ${
                              isCozy ? "text-slate-500" : "text-slate-500"
                            }`}
                          >
                            {proj.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
                {remoteProjects.length === 0 && (
                  <p className="text-sm text-center py-4 text-slate-500">
                    Không tìm thấy dự án nào.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4 mt-2 animate-in slide-in-from-right-4 duration-300">
              <div
                className={`p-5 rounded-2xl ${
                  isCozy ? "bg-slate-900 border border-slate-800" : "bg-slate-50 border border-slate-100"
                }`}
              >
                <h4
                  className={`text-base font-bold mb-4 flex items-center gap-2 ${
                    isCozy ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-500 text-xs">
                    i
                  </span>
                  Xác nhận import
                </h4>
                <p
                  className={`text-sm mb-4 ${
                    isCozy ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Bạn đang chuẩn bị import <strong className={isCozy ? "text-white" : "text-slate-900"}>{selectedProjectIds.length}</strong> dự án từ{" "}
                  <strong className={isCozy ? "text-white" : "text-slate-900"}>{currentPlatformDetails?.name}</strong>.
                </p>
                <div className={`space-y-2 max-h-[20vh] overflow-y-auto pr-2 ${
                  isCozy ? "text-slate-300" : "text-slate-700"
                }`}>
                  {remoteProjects
                    .filter((p) => selectedProjectIds.includes(p.id))
                    .map((proj) => (
                      <div key={proj.id} className="flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate">{proj.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {step === 1 && (
            <button
              onClick={handleNext}
              disabled={!selectedPlatform}
              className={`w-full py-3 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isCozy
                  ? "bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-900/20"
                  : "bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-200"
              }`}
            >
              Tiếp tục
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleConnect}
              disabled={isLoading || !credentials.token.trim()}
              className={`w-full py-3 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isCozy
                  ? "bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-900/20"
                  : "bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-200"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang kết nối...
                </>
              ) : (
                "Kết nối"
              )}
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleNext}
              disabled={selectedProjectIds.length === 0}
              className={`w-full py-3 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isCozy
                  ? "bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-900/20"
                  : "bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-200"
              }`}
            >
              Tiếp tục ({selectedProjectIds.length})
            </button>
          )}

          {step === 4 && (
            <button
              onClick={handleImport}
              disabled={isLoading}
              className={`w-full py-3 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isCozy
                  ? "bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-900/20"
                  : "bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-200"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận và Import"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
