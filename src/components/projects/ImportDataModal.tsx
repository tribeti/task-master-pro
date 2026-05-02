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

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (platform: string, token: string) => void;
}

export default function ImportDataModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportDataModalProps) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetAndClose = () => {
    setStep(1);
    setSelectedPlatform(null);
    setToken("");
    setError("");
    setIsLoading(false);
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && selectedPlatform) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError("");
      setToken("");
    }
  };

  const handleConnect = async () => {
    setError("");
    if (!token.trim()) {
      setError("Token không được để trống.");
      return;
    }

    setIsLoading(true);

    // Mock connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock validation: fail if token length <= 10
    if (token.length <= 10) {
      setError("Kết nối thất bại. Vui lòng kiểm tra lại thông tin xác thực");
      setIsLoading(false);
      return;
    }

    // Success
    setIsLoading(false);
    if (onSuccess && selectedPlatform) {
      onSuccess(selectedPlatform, token);
    }
    resetAndClose();
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
        {step === 2 && (
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
              {step === 1
                ? "Chọn nền tảng bạn muốn kết nối và đồng bộ dự án."
                : `Xác thực kết nối tới ${currentPlatformDetails?.name}`}
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

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  API Key / Access Token <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã xác thực..."
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (e.target.value.trim()) setError("");
                  }}
                  className={`w-full px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-all ${
                    isCozy
                      ? error
                        ? "border-red-500 bg-slate-900 text-white"
                        : "bg-slate-900/50 border-slate-800 text-white focus:border-indigo-500 focus:bg-slate-900"
                      : error
                      ? "border-red-400 focus:border-red-400 bg-white"
                      : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"
                  }`}
                  disabled={isLoading}
                />
                {error && (
                  <p className="text-xs font-medium text-red-400 mt-2 ml-1">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {step === 1 ? (
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
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading || !token.trim()}
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
        </div>
      </div>
    </div>
  );
}
