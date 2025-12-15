const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(username: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.setToken(response.token);
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async getITCheckEntries() {
    return this.request('/itcheck');
  }

  async createITCheckEntry(entry: any) {
    return this.request('/itcheck', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateITCheckEntry(id: string, entry: any) {
    return this.request(`/itcheck/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  }

  async deleteITCheckEntry(id: string) {
    return this.request(`/itcheck/${id}`, {
      method: 'DELETE',
    });
  }

  async getChapmanCGEntries() {
    return this.request('/chapmancg');
  }

  async createChapmanCGEntry(entry: any) {
    return this.request('/chapmancg', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateChapmanCGEntry(id: string, entry: any) {
    return this.request(`/chapmancg/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  }

  async deleteChapmanCGEntry(id: string) {
    return this.request(`/chapmancg/${id}`, {
      method: 'DELETE',
    });
  }

  async getInternalLogEntries() {
    return this.request('/internallog');
  }

  async createInternalLogEntry(entry: any) {
    return this.request('/internallog', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateInternalLogEntry(id: string, entry: any) {
    return this.request(`/internallog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  }

  async deleteInternalLogEntry(id: string) {
    return this.request(`/internallog/${id}`, {
      method: 'DELETE',
    });
  }

  async getCreditBlocks() {
    return this.request('/credits');
  }

  async getActiveCreditBlock() {
    return this.request('/credits/active');
  }

  async createCreditBlock(block: any) {
    return this.request('/credits', {
      method: 'POST',
      body: JSON.stringify(block),
    });
  }

  async updateCreditBlock(id: string, block: any) {
    return this.request(`/credits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(block),
    });
  }

  async deleteCreditBlock(id: string) {
    return this.request(`/credits/${id}`, {
      method: 'DELETE',
    });
  }

  async getSoftwareLicenses() {
    return this.request('/licenses');
  }

  async createSoftwareLicense(license: any) {
    return this.request('/licenses', {
      method: 'POST',
      body: JSON.stringify(license),
    });
  }

  async updateSoftwareLicense(id: string, license: any) {
    return this.request(`/licenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(license),
    });
  }

  async deleteSoftwareLicense(id: string) {
    return this.request(`/licenses/${id}`, {
      method: 'DELETE',
    });
  }

  async getPasswordCategories() {
    return this.request('/passwords/categories');
  }

  async getPasswordEntries() {
    return this.request('/passwords');
  }

  async createPasswordEntry(entry: any) {
    return this.request('/passwords', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updatePasswordEntry(id: string, entry: any) {
    return this.request(`/passwords/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  }

  async deletePasswordEntry(id: string) {
    return this.request(`/passwords/${id}`, {
      method: 'DELETE',
    });
  }

  async getSecureNotes() {
    return this.request('/passwords/notes');
  }

  async createSecureNote(note: any) {
    return this.request('/passwords/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async updateSecureNote(id: string, note: any) {
    return this.request(`/passwords/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    });
  }

  async deleteSecureNote(id: string) {
    return this.request(`/passwords/notes/${id}`, {
      method: 'DELETE',
    });
  }

  async getTickets() {
    return this.request('/tickets');
  }

  async getTicket(id: string) {
    return this.request(`/tickets/${id}`);
  }

  async createTicket(ticket: any) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  async updateTicket(id: string, ticket: any) {
    return this.request(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ticket),
    });
  }

  async deleteTicket(id: string) {
    return this.request(`/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  async getTicketComments(ticketId: string) {
    return this.request(`/tickets/${ticketId}/comments`);
  }

  async addTicketComment(ticketId: string, comment: any) {
    return this.request(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }

  async getFeedbackLinks() {
    return this.request('/feedback/links');
  }

  async getFeedbackLink(linkId: string) {
    return this.request(`/feedback/links/${linkId}`);
  }

  async createFeedbackLink(link: any) {
    return this.request('/feedback/links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  }

  async submitFeedback(linkId: string, feedback: any) {
    return this.request(`/feedback/submit/${linkId}`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getFeedbackResponses(linkId: string) {
    return this.request(`/feedback/responses/${linkId}`);
  }

  async deleteFeedbackLink(id: string) {
    return this.request(`/feedback/links/${id}`, {
      method: 'DELETE',
    });
  }

  async getUsers() {
    return this.request('/users');
  }

  async createUser(user: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getActivityLogs() {
    return this.request('/activity');
  }

  async migrateData(data: any) {
    return this.request('/migrate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
