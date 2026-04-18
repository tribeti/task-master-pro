"use client";

import React, { useState, useEffect } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { AssigneeOption, TaskAssignee } from "@/types/project";

interface TaskAssigneesProps {
  boardId: number;
  taskId: number;
  currentAssignees: TaskAssignee[];
  isSubmitting: boolean;
  onAddAssignee: (taskId: number, assigneeId: string) => Promise<void>;
  onRemoveAssignee: (taskId: number, assigneeId: string) => Promise<void>;
  onRemoveAllAssignees: (taskId: number) => Promise<void>;
}

export function TaskAssignees({
  boardId,
  taskId,
  currentAssignees,
  isSubmitting,
  onAddAssignee,
  onRemoveAssignee,
  onRemoveAllAssignees,
}: TaskAssigneesProps) {
  const [membersLoading, setMembersLoading] = useState(false);
  const [assigneeSubmitting, setAssigneeSubmitting] = useState(false);
  const [assigneeError, setAssigneeError] = useState("");
  const [assignableMembers, setAssignableMembers] = useState<AssigneeOption[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  useEffect(() => {
    let ignore = false;

    const fetchAssignableMembers = async () => {
      try {
        setMembersLoading(true);
        setAssigneeError("");
        const res = await fetch(`/api/users?boardId=${boardId}`);
        if (!res.ok) {
          throw new Error("Failed to load users");
        }
        const data = (await res.json()) as AssigneeOption[];
        if (!ignore) {
          setAssignableMembers(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch assignee options:", error);
        if (!ignore) {
          setAssignableMembers([]);
          // Optionally suppress this error if it frequently fails on local setups 
          // without user table permissions.
          // setAssigneeError("Failed to load assignees.");
        }
      } finally {
        if (!ignore) {
          setMembersLoading(false);
        }
      }
    };

    fetchAssignableMembers();

    return () => {
      ignore = true;
    };
  }, [boardId]);

  // Reset selected assignee when task changes
  useEffect(() => {
    setSelectedAssigneeId("");
    setAssigneeError("");
  }, [taskId]);

  const assignedAssigneeIds = new Set(
    currentAssignees.map((assignee) => assignee.user_id)
  );
  const availableAssigneeOptions = assignableMembers.filter(
    (member) => !assignedAssigneeIds.has(member.user_id)
  );

  const handleAddAssigneeClick = async () => {
    if (assigneeSubmitting || !selectedAssigneeId) return;

    try {
      setAssigneeSubmitting(true);
      setAssigneeError("");
      await onAddAssignee(taskId, selectedAssigneeId);
      setSelectedAssigneeId("");
    } catch (error) {
      console.error("Failed to add assignee:", error);
      setAssigneeError("Failed to add assignee.");
    } finally {
      setAssigneeSubmitting(false);
    }
  };

  const handleRemoveAssigneeClick = async (assigneeId: string) => {
    if (assigneeSubmitting) return;

    try {
      setAssigneeSubmitting(true);
      setAssigneeError("");
      await onRemoveAssignee(taskId, assigneeId);
    } catch (error) {
      console.error("Failed to remove assignee:", error);
      setAssigneeError("Failed to remove assignee.");
    } finally {
      setAssigneeSubmitting(false);
    }
  };

  const handleUnassignAllClick = async () => {
    if (assigneeSubmitting || currentAssignees.length === 0) return;

    try {
      setAssigneeSubmitting(true);
      setAssigneeError("");
      await onRemoveAllAssignees(taskId);
      setSelectedAssigneeId("");
    } catch (error) {
      console.error("Failed to remove all assignees:", error);
      setAssigneeError("Failed to unassign all assignees.");
    } finally {
      setAssigneeSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 mt-1">
        Người thực hiện
      </h3>

      {currentAssignees.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {currentAssignees.map((taskAssignee) => (
            <div
              key={taskAssignee.user_id}
              className="inline-flex items-center justify-between w-full gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                <UserAvatar
                  avatarUrl={taskAssignee.avatar_url}
                  displayName={taskAssignee.display_name}
                  className="w-6 h-6 flex-shrink-0"
                />
                <span className="text-sm font-semibold text-slate-700 truncate">
                  {taskAssignee.display_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAssigneeClick(taskAssignee.user_id)}
                disabled={assigneeSubmitting || isSubmitting}
                className="text-slate-400 hover:text-red-500 transition-colors px-1"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleUnassignAllClick}
            disabled={assigneeSubmitting || isSubmitting}
            className="text-[10px] uppercase font-bold text-slate-400 hover:text-red-500 underline mt-1 mx-1"
          >
            Bỏ giao tất cả
          </button>
        </div>
      )}

      <div className="relative w-full">
        <select
          value={selectedAssigneeId}
          onChange={(e) => setSelectedAssigneeId(e.target.value)}
          disabled={membersLoading || assigneeSubmitting || isSubmitting}
          className="w-full appearance-none rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-colors disabled:opacity-50"
        >
          <option value="">Gán thành viên...</option>
          {availableAssigneeOptions.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.display_name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {selectedAssigneeId && (
        <button
          type="button"
          onClick={handleAddAssigneeClick}
          disabled={assigneeSubmitting || isSubmitting}
          className="w-full mt-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {assigneeSubmitting ? "Đang lưu..." : "Xác nhận thêm"}
        </button>
      )}

      {assigneeError && (
        <p className="text-xs text-red-500 font-medium mt-1">
          {assigneeError}
        </p>
      )}
    </div>
  );
}
