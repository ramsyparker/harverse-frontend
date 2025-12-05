// API service untuk komunikasi dengan backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    // Default admin login (hardcoded untuk sekarang)
    // Nanti bisa diintegrasikan dengan backend
    if (username === 'admin' && password === 'admin123') {
      const token = 'admin_token_' + Date.now();
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify({
        username: 'admin',
        email: 'admin@skripsick.com',
        name: 'Administrator'
      }));
      return {
        success: true,
        data: { token, user: { username: 'admin', email: 'admin@skripsick.com', name: 'Administrator' } }
      };
    }
    return { success: false, message: 'Username atau password salah' };
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('admin_token');
  }
};

// Fakultas API
export const fakultasApi = {
  getAll: () => apiClient.get('/auth/fakultas'),
  create: (data: { nama: string; kode: string }) => 
    apiClient.post('/admin/fakultas', data),
  update: (id: string, data: { nama: string; kode: string }) => 
    apiClient.put(`/admin/fakultas/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/fakultas/${id}`),
};

// Prodi API
export const prodiApi = {
  getByFakultas: (fakultasId: string) => 
    apiClient.get(`/auth/prodi/${fakultasId}`),
  getAll: () => {
    // Karena backend belum punya endpoint getAll prodi, kita ambil dari semua fakultas
    return fakultasApi.getAll().then(async (fakultasResponse) => {
      if (!fakultasResponse.success || !fakultasResponse.data) {
        return { success: false, message: 'Gagal mengambil data fakultas' };
      }
      
      const allProdi: any[] = [];
      for (const fakultas of fakultasResponse.data) {
        const prodiResponse = await apiClient.get(`/auth/prodi/${fakultas._id}`);
        if (prodiResponse.success && prodiResponse.data) {
          allProdi.push(...prodiResponse.data);
        }
      }
      
      return { success: true, data: allProdi };
    });
  },
  create: (data: { nama: string; kode: string; fakultas_id: string; jenjang_pendidikan: string }) => 
    apiClient.post('/admin/prodi', data),
  update: (id: string, data: { nama: string; kode: string; fakultas_id: string; jenjang_pendidikan: string }) => 
    apiClient.put(`/admin/prodi/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/prodi/${id}`),
};

// User Auth API (separate from admin)
class UserApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Return error response dengan errors array jika ada (untuk validation errors)
        return {
          success: false,
          message: data.message || 'Request failed',
          errors: data.errors || [],
          data: data.data
        };
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        errors: []
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const userApiClient = new UserApiClient(API_BASE_URL);

// User Authentication API
export const userAuthApi = {
  register: (data: {
    nama: string;
    email: string;
    fakultas_id: string;
    prodi_id: string;
    nomor_induk_mahasiswa: string;
    password: string;
  }) => userApiClient.post('/auth/register', data),

  requestOTP: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return { success: data.success, message: data.message, data: data.data || {} };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return { success: false, message: errorMessage, data: {} };
    }
  },

  verifyOTP: (email: string, otp_code: string) =>
    userApiClient.post('/auth/verify-otp', { email, otp_code }),

  login: async (nomor_induk_mahasiswa?: string, email?: string, password: string) => {
    try {
      const body: any = { password };
      if (nomor_induk_mahasiswa) {
        body.nomor_induk_mahasiswa = nomor_induk_mahasiswa;
      }
      if (email) {
        body.email = email;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('user_token', data.data.token);
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
        return { success: true, data: data.data };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error' };
    }
  },

  logout: () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
  },

  getProfile: () => userApiClient.get('/auth/profile'),

  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user_data');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('user_token');
  },
};

