/**
 * Centralized API Client for IKODI Sponsorship & Scholarship Management System
 * Connects the frontend to the backend REST API with automatic JWT attachment
 * and resilient local-cache fallback when backend is unavailable.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;
  private currentRole: string = 'Applicant / Beneficiary';

  constructor() {
    this.token = localStorage.getItem('ikodi-jwt-token');
    const storedRole = localStorage.getItem('ikodi-role');
    if (storedRole) {
      try {
        this.currentRole = JSON.parse(storedRole);
      } catch {
        this.currentRole = storedRole;
      }
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('ikodi-jwt-token', token);
    } else {
      localStorage.removeItem('ikodi-jwt-token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setRole(role: string) {
    this.currentRole = role;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (this.currentRole) {
      headers.set('X-Demo-Role', this.currentRole);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      console.warn(`[API Client Warning] Call to ${endpoint} failed, falling back to local state:`, err.message);
      throw err;
    }
  }

  // --- 1. Authentication ---
  public async login(email: string, password?: string, role?: string) {
    const data: any = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  public async register(payload: { email: string; password: string; fullName: string; role: string; organization?: string; phone?: string }) {
    const data: any = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  public async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    this.setToken(null);
  }

  public async getMe() {
    return await this.request<any>('/auth/me');
  }

  // --- 2. Students & Beneficiaries ---
  public async getStudentProfile() {
    return await this.request<any>('/students/profile');
  }

  public async updateStudentProfile(profile: any) {
    return await this.request<any>('/students/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  }

  public async uploadResults(file: File, docType = 'Result slip') {
    const formData = new FormData();
    formData.append('resultDocument', file);
    formData.append('documentType', docType);
    return await this.request<any>('/students/upload-results', {
      method: 'POST',
      body: formData
    });
  }

  public async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    return await this.request<any>('/students/upload-photo', {
      method: 'POST',
      body: formData
    });
  }

  public async getIdCardData() {
    return await this.request<any>('/students/id-card');
  }

  public async applyOpportunity(opportunityId: number, notes?: string) {
    return await this.request<any>('/students/apply', {
      method: 'POST',
      body: JSON.stringify({ opportunityId, notes })
    });
  }

  public async getDocuments() {
    return await this.request<any>('/students/documents');
  }

  // --- 3. Sponsors & Opportunities ---
  public async getOpportunities(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await this.request<any>(`/sponsors/opportunities${qs}`);
  }

  public async createOpportunity(payload: any) {
    return await this.request<any>('/sponsors/opportunities', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async updateOpportunity(id: number, payload: any) {
    return await this.request<any>(`/sponsors/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async getOpportunityApplicants(id: number) {
    return await this.request<any>(`/sponsors/opportunities/${id}/applicants`);
  }

  public async awardBeneficiary(candidateId: number, opportunityId: number) {
    return await this.request<any>('/sponsors/beneficiaries/award', {
      method: 'POST',
      body: JSON.stringify({ candidateId, opportunityId })
    });
  }

  // --- 4. Reviewer & Committee ---
  public async getAssignedApplications(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await this.request<any>(`/reviews/assignments${qs}`);
  }

  public async evaluateCandidate(payload: {
    candidateId: number;
    academics: number;
    need: number;
    community: number;
    readiness: number;
    recommendation: string;
    notes?: string;
  }) {
    return await this.request<any>('/reviews/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- 5. Admin & Oversight ---
  public async getUsers() {
    return await this.request<any>('/admin/users');
  }

  public async updateUser(id: string, payload: any) {
    return await this.request<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async verifyOrganization(name: string, status = 'Verified') {
    return await this.request<any>('/admin/organizations/verify', {
      method: 'POST',
      body: JSON.stringify({ name, status })
    });
  }

  public async getSessionHistory() {
    return await this.request<any>('/admin/sessions');
  }

  public async getAuditLogs(type?: string, search?: string) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await this.request<any>(`/admin/audit-logs${qs}`);
  }

  public async verifyStudentIdCard(studentIdCode: string, status = 'Verified') {
    return await this.request<any>('/admin/id-card/verify', {
      method: 'POST',
      body: JSON.stringify({ studentIdCode, status })
    });
  }

  public async getReportsData() {
    return await this.request<any>('/admin/reports');
  }

  // --- 6. Messages & Communications Hub ---
  public async getMessages(channel?: string, audience?: string) {
    const params = new URLSearchParams();
    if (channel) params.set('channel', channel);
    if (audience) params.set('audience', audience);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await this.request<any>(`/messages${qs}`);
  }

  public async sendMessage(payload: {
    subject: string;
    body: string;
    audience: string;
    channel: string;
    sender?: string;
  }) {
    return await this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

export const api = new ApiClient();
export default api;
