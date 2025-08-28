class MitheralFXAPI {
  constructor() {
    this.baseURL = window.location.origin;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  logout() {
    this.setToken(null);
    // Clear all localStorage data to ensure clean logout
    localStorage.clear();
    window.location.href = '/login.html';
  }

  // User profile methods
  async getProfile() {
    return this.request('/user/profile');
  }

  async updateProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(passwordData) {
    return this.request('/user/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  // Trading methods
  async executeTrade(tradeData) {
    return this.request('/trades/execute', {
      method: 'POST',
      body: JSON.stringify(tradeData)
    });
  }

  async closeTrade(tradeId) {
    return this.request(`/trades/${tradeId}/close`, {
      method: 'POST'
    });
  }

  async getTradeHistory() {
    return this.request('/trades/history');
  }

  async getOpenTrades() {
    return this.request('/trades/open');
  }

  // Deposit methods
  async createDeposit(depositData) {
    return this.request('/deposits', {
      method: 'POST',
      body: JSON.stringify(depositData)
    });
  }

  async getDepositHistory() {
    return this.request('/deposits/history');
  }

  // Withdrawal methods
  async createWithdrawal(withdrawalData) {
    return this.request('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(withdrawalData)
    });
  }

  async getWithdrawalHistory() {
    return this.request('/withdrawals/history');
  }

  // Market data methods
  async getMarketPrices() {
    return this.request('/market/prices');
  }

  async getCurrentPrice(symbol) {
    return this.request(`/market/price/${symbol}`);
  }

  async getMarketNews() {
    return this.request('/market/news');
  }

  async getEconomicCalendar() {
    return this.request('/market/calendar');
  }

  // Notification methods
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(notificationId) {
    return this.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationId })
    });
  }
}

// Create global API instance
window.API = new MitheralFXAPI();

// Utility functions for frontend integration
window.MitheralFXUtils = {
  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Format percentage
  formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
  },

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Show toast notification
  showToast(type, message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconClass = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

    toast.innerHTML = `
      <i class="fas ${iconClass} toast-icon"></i>
      <span>${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  // Redirect to login if not authenticated
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }
};

// Mobile navigation functions
window.toggleMobileSidebar = function() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!sidebar || !overlay) return;

  sidebar.classList.toggle('show');
  overlay.classList.toggle('show');

  // Prevent body scrolling when sidebar is open
  document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
};

window.closeMobileSidebar = function() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!sidebar || !overlay) return;

  sidebar.classList.remove('show');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
};

// Initialize mobile navigation
window.initMobileNav = function() {
  // Close sidebar when clicking on nav links on mobile
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        closeMobileSidebar();
      }
    });
  });

  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      closeMobileSidebar();
    }
  });
};

window.API = new MitheralFXAPI();