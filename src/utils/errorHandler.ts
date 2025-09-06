import { Alert } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  isRetryable?: boolean;
}

export class ErrorHandler {
  /**
   * Standard error codes for the app
   */
  static readonly ERROR_CODES = {
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    NO_INTERNET: 'NO_INTERNET',
    
    // Firebase errors
    FIREBASE_AUTH_ERROR: 'FIREBASE_AUTH_ERROR',
    FIREBASE_PERMISSION_DENIED: 'FIREBASE_PERMISSION_DENIED',
    FIREBASE_UNAVAILABLE: 'FIREBASE_UNAVAILABLE',
    
    // Storage errors
    STORAGE_ERROR: 'STORAGE_ERROR',
    SYNC_FAILED: 'SYNC_FAILED',
    
    // App logic errors
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    INVALID_INPUT: 'INVALID_INPUT',
    OPERATION_FAILED: 'OPERATION_FAILED',
    
    // Ad errors
    AD_LOAD_FAILED: 'AD_LOAD_FAILED',
    AD_SHOW_FAILED: 'AD_SHOW_FAILED',
    
    // Unknown
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  } as const;

  /**
   * Create a standardized app error
   */
  static createError(
    code: string, 
    message: string, 
    details?: any, 
    isRetryable = false
  ): AppError {
    return {
      code,
      message,
      details,
      isRetryable,
    };
  }

  /**
   * Parse Firebase errors into user-friendly messages
   */
  static parseFirebaseError(error: any): AppError {
    const code = error?.code || 'unknown';
    
    switch (code) {
      case 'auth/user-not-found':
        return this.createError(
          this.ERROR_CODES.FIREBASE_AUTH_ERROR,
          'No account found with this email address.',
          error
        );
      
      case 'auth/wrong-password':
        return this.createError(
          this.ERROR_CODES.FIREBASE_AUTH_ERROR,
          'Incorrect password. Please try again.',
          error
        );
      
      case 'auth/email-already-in-use':
        return this.createError(
          this.ERROR_CODES.FIREBASE_AUTH_ERROR,
          'An account with this email already exists.',
          error
        );
      
      case 'auth/weak-password':
        return this.createError(
          this.ERROR_CODES.FIREBASE_AUTH_ERROR,
          'Password is too weak. Please choose a stronger password.',
          error
        );
      
      case 'auth/invalid-email':
        return this.createError(
          this.ERROR_CODES.FIREBASE_AUTH_ERROR,
          'Please enter a valid email address.',
          error
        );
      
      case 'auth/network-request-failed':
        return this.createError(
          this.ERROR_CODES.NETWORK_ERROR,
          'Network error. Please check your connection and try again.',
          error,
          true
        );
      
      case 'permission-denied':
        return this.createError(
          this.ERROR_CODES.FIREBASE_PERMISSION_DENIED,
          'You don\'t have permission to perform this action.',
          error
        );
      
      case 'unavailable':
        return this.createError(
          this.ERROR_CODES.FIREBASE_UNAVAILABLE,
          'Service is temporarily unavailable. Please try again later.',
          error,
          true
        );
      
      default:
        return this.createError(
          this.ERROR_CODES.FIREBASE_AUTH_ERROR,
          error.message || 'An authentication error occurred.',
          error
        );
    }
  }

  /**
   * Parse network errors
   */
  static parseNetworkError(error: any): AppError {
    if (error.message?.includes('timeout')) {
      return this.createError(
        this.ERROR_CODES.TIMEOUT,
        'Request timed out. Please check your connection and try again.',
        error,
        true
      );
    }
    
    if (error.message?.includes('Network Error')) {
      return this.createError(
        this.ERROR_CODES.NETWORK_ERROR,
        'Network error. Please check your internet connection.',
        error,
        true
      );
    }
    
    return this.createError(
      this.ERROR_CODES.NETWORK_ERROR,
      'Connection failed. Please try again.',
      error,
      true
    );
  }

  /**
   * Show user-friendly error alert
   */
  static showErrorAlert(
    error: AppError | Error | string, 
    onRetry?: () => void,
    title = 'Error'
  ): void {
    let appError: AppError;
    
    if (typeof error === 'string') {
      appError = this.createError(this.ERROR_CODES.UNKNOWN_ERROR, error);
    } else if (error instanceof Error) {
      appError = this.createError(this.ERROR_CODES.UNKNOWN_ERROR, error.message, error);
    } else {
      appError = error;
    }

    const buttons: any[] = [
      { text: 'OK', style: 'default' }
    ];

    if (appError.isRetryable && onRetry) {
      buttons.unshift({
        text: 'Retry',
        onPress: onRetry,
        style: 'default'
      });
    }

    Alert.alert(title, appError.message, buttons);
  }

  /**
   * Log error for debugging and crash reporting
   */
  static logError(error: AppError | Error, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    console.error('App Error:', errorInfo);
    
    // In production, you would send this to a crash reporting service like:
    // - Crashlytics: crashlytics().recordError(error)
    // - Sentry: Sentry.captureException(error)
    // - Bugsnag: Bugsnag.notify(error)
  }

  /**
   * Handle async operations with proper error handling
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: string,
    showAlert = true,
    onRetry?: () => void
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error: any) {
      let appError: AppError;

      // Parse specific error types
      if (error?.code?.startsWith('auth/')) {
        appError = this.parseFirebaseError(error);
      } else if (error.message?.includes('Network') || error.message?.includes('timeout')) {
        appError = this.parseNetworkError(error);
      } else {
        appError = this.createError(
          this.ERROR_CODES.UNKNOWN_ERROR,
          error.message || 'An unexpected error occurred',
          error
        );
      }

      // Log the error
      this.logError(appError, context);

      // Show alert if requested
      if (showAlert) {
        this.showErrorAlert(appError, onRetry);
      }

      return { success: false, error: appError };
    }
  }

  /**
   * Validate input and return standardized error
   */
  static validateInput(
    value: any, 
    rules: { required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp }
  ): AppError | null {
    if (rules.required && (!value || value.toString().trim() === '')) {
      return this.createError(
        this.ERROR_CODES.INVALID_INPUT,
        'This field is required.'
      );
    }

    if (rules.minLength && value.length < rules.minLength) {
      return this.createError(
        this.ERROR_CODES.INVALID_INPUT,
        `Must be at least ${rules.minLength} characters long.`
      );
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return this.createError(
        this.ERROR_CODES.INVALID_INPUT,
        `Must be no more than ${rules.maxLength} characters long.`
      );
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return this.createError(
        this.ERROR_CODES.INVALID_INPUT,
        'Please enter a valid value.'
      );
    }

    return null;
  }

  /**
   * Create a retry function wrapper
   */
  static createRetryWrapper<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): () => Promise<T> {
    return async (): Promise<T> => {
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
      
      throw lastError;
    };
  }
}

export default ErrorHandler;