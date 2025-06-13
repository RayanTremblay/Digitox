/**
 * Generate initials from first and last name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Initials string (e.g., "JD" for John Doe)
 */
export const generateInitials = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) {
    return 'U'; // Default for "User"
  }
  
  const firstInitial = firstName?.charAt(0).toUpperCase() || '';
  const lastInitial = lastName?.charAt(0).toUpperCase() || '';
  
  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`;
  } else if (firstInitial) {
    return firstInitial;
  } else if (lastInitial) {
    return lastInitial;
  }
  
  return 'U';
};

/**
 * Generate initials from display name
 * @param displayName - User's display name
 * @returns Initials string
 */
export const generateInitialsFromDisplayName = (displayName?: string): string => {
  if (!displayName) {
    return 'U';
  }
  
  const names = displayName.trim().split(' ');
  if (names.length >= 2) {
    return `${names[0].charAt(0).toUpperCase()}${names[names.length - 1].charAt(0).toUpperCase()}`;
  } else if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return 'U';
};

/**
 * Generate initials from email if no name is available
 * @param email - User's email address
 * @returns Initials string
 */
export const generateInitialsFromEmail = (email?: string): string => {
  if (!email) {
    return 'U';
  }
  
  const username = email.split('@')[0];
  return username.charAt(0).toUpperCase();
}; 