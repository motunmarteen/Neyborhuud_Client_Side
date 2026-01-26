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
    radius = 10000,
    page = 1,
    limit = 20,
  ) {
    return await apiClient.get<PaginatedResponse<Job>>("/jobs/nearby", {
      params: { lat: latitude, lng: longitude, radius, page, limit },
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
      "/jobs/applications",
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
    return await apiClient.get<PaginatedResponse<Job>>("/jobs/saved", {
      params: { page, limit },
    });
  },

  /**
   * Close a job posting
   */
  async closeJob(jobId: string) {
    return await apiClient.patch(`/jobs/${jobId}/close`);
  },

  /**
   * Reopen a job posting
   */
  async reopenJob(jobId: string) {
    return await apiClient.patch(`/jobs/${jobId}/reopen`);
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
};
