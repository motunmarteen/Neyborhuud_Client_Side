/**
 * Jobs Service
 * Handles job postings and applications
 */

import apiClient from "@/lib/api-client";
import {
  Job,
  JobApplication,
  PaginatedResponse,
  CreateJobPayload,
} from "@/types/api";

export const jobsService = {
  /**
   * Create a new job posting
   */
  async createJob(payload: CreateJobPayload) {
    return await apiClient.post<Job>("/jobs", payload);
  },

  /**
   * Get all jobs
   */
  async getJobs(
    page = 1,
    limit = 20,
    filter?: {
      type?: string;
      category?: string;
      workMode?: string;
      minSalary?: number;
      maxSalary?: number;
      employerId?: string;
    },
  ) {
    return await apiClient.get<PaginatedResponse<Job>>("/jobs", {
      params: { page, limit, ...filter },
    });
  },

  /**
   * Get nearby jobs
   */
  async getNearbyJobs(
    latitude: number,
    longitude: number,
    radius = 10,
  ) {
    return await apiClient.get<{ jobs: Job[] }>("/jobs/nearby", {
      params: { latitude, longitude, radius },
    });
  },

  /**
   * Get a single job
   */
  async getJob(jobId: string) {
    return await apiClient.get<Job>(`/jobs/${jobId}`);
  },

  /**
   * Update a job posting
   */
  async updateJob(jobId: string, data: Partial<CreateJobPayload>) {
    return await apiClient.put<Job>(`/jobs/${jobId}`, data);
  },

  /**
   * Delete a job posting
   */
  async deleteJob(jobId: string) {
    return await apiClient.delete(`/jobs/${jobId}`);
  },

  /**
   * Apply for a job
   */
  async applyForJob(jobId: string, coverLetter?: string, resume?: File) {
    if (resume) {
      return await apiClient.uploadFile<JobApplication>(
        `/jobs/${jobId}/apply`,
        resume,
        { coverLetter },
        undefined,
        "resume",
      );
    }

    return await apiClient.post<JobApplication>(`/jobs/${jobId}/apply`, {
      coverLetter,
    });
  },

  /**
   * Get my job applications
   */
  async getMyApplications(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<JobApplication>>(
      "/jobs/my/applications",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get applications for a specific job
   */
  async getJobApplications(jobId: string, page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<JobApplication>>(
      `/jobs/${jobId}/applications`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get application status
   */
  async getApplicationStatus(applicationId: string) {
    return await apiClient.get<JobApplication>(
      `/jobs/applications/${applicationId}`,
    );
  },

  /**
   * Update application status (employer)
   */
  async updateApplicationStatus(
    applicationId: string,
    status: "reviewing" | "shortlisted" | "rejected" | "accepted",
  ) {
    return await apiClient.patch<JobApplication>(
      `/jobs/applications/${applicationId}/status`,
      {
        status,
      },
    );
  },

  /**
   * Withdraw application
   */
  async withdrawApplication(applicationId: string) {
    return await apiClient.delete(`/jobs/applications/${applicationId}`);
  },

  /**
   * Save a job
   */
  async saveJob(jobId: string) {
    return await apiClient.post(`/jobs/${jobId}/save`);
  },

  /**
   * Unsave a job
   */
  async unsaveJob(jobId: string) {
    return await apiClient.delete(`/jobs/${jobId}/save`);
  },

  /**
   * Get saved jobs
   */
  async getSavedJobs(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Job>>("/jobs/my/saved", {
      params: { page, limit },
    });
  },

  /**
   * Close a job posting
   */
  async closeJob(jobId: string) {
    return await apiClient.post(`/jobs/${jobId}/close`);
  },

  /**
   * Reopen a job posting
   */
  async reopenJob(jobId: string) {
    return await apiClient.post(`/jobs/${jobId}/reopen`);
  },

  /**
   * Share a job
   */
  async shareJob(jobId: string, message?: string) {
    return await apiClient.post(`/jobs/${jobId}/share`, { message });
  },

  /**
   * Report a job
   */
  async reportJob(jobId: string, reason: string, description?: string) {
    return await apiClient.post(`/jobs/${jobId}/report`, {
      reason,
      description,
    });
  },

  /**
   * Boost a job listing with HuudCoins
   */
  async boostJob(jobId: string, days: 3 | 7) {
    return await apiClient.post<{ deducted: number; days: number; boostedUntil: string }>(
      `/jobs/${jobId}/boost`,
      { days },
    );
  },
};
