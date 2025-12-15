import { PasswordStrength, PasswordGeneratorSettings } from '../types/password';

export function generatePassword(settings: PasswordGeneratorSettings): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const similar = 'il1Lo0O';
  const ambiguous = '{}[]()/\\\'"`~,;.<>';

  let charset = '';
  
  if (settings.includeUppercase) charset += uppercase;
  if (settings.includeLowercase) charset += lowercase;
  if (settings.includeNumbers) charset += numbers;
  if (settings.includeSymbols) charset += symbols;

  if (settings.excludeSimilar) {
    charset = charset.split('').filter(char => !similar.includes(char)).join('');
  }
  
  if (settings.excludeAmbiguous) {
    charset = charset.split('').filter(char => !ambiguous.includes(char)).join('');
  }

  if (charset === '') {
    throw new Error('No character types selected');
  }

  let password = '';
  for (let i = 0; i < settings.length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
}

export function analyzePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);
  const length = password.length;

  // Length scoring
  if (length < 8) {
    feedback.push('Use at least 8 characters');
  } else if (length < 12) {
    score += 1;
    feedback.push('Consider using 12+ characters for better security');
  } else if (length < 16) {
    score += 2;
  } else {
    score += 3;
  }

  // Character variety scoring
  let varietyScore = 0;
  if (hasUppercase) varietyScore++;
  if (hasLowercase) varietyScore++;
  if (hasNumbers) varietyScore++;
  if (hasSymbols) varietyScore++;

  score += varietyScore;

  // Feedback based on missing character types
  if (!hasUppercase) feedback.push('Add uppercase letters');
  if (!hasLowercase) feedback.push('Add lowercase letters');
  if (!hasNumbers) feedback.push('Add numbers');
  if (!hasSymbols) feedback.push('Add symbols');

  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters');
    score = Math.max(0, score - 1);
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    feedback.push('Avoid common patterns');
    score = Math.max(0, score - 2);
  }

  // Calculate crack time estimate
  const charset = (hasUppercase ? 26 : 0) + (hasLowercase ? 26 : 0) + 
                  (hasNumbers ? 10 : 0) + (hasSymbols ? 32 : 0);
  const combinations = Math.pow(charset, length);
  const crackTime = estimateCrackTime(combinations);

  // Ensure score is within bounds
  score = Math.min(4, Math.max(0, score));

  return {
    score,
    feedback: feedback.length === 0 ? ['Strong password!'] : feedback,
    crackTime,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
    length
  };
}

function estimateCrackTime(combinations: number): string {
  // Assuming 1 billion guesses per second
  const guessesPerSecond = 1000000000;
  const seconds = combinations / (2 * guessesPerSecond);

  if (seconds < 60) return 'Less than a minute';
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
  return 'Centuries';
}

export function checkPasswordReuse(password: string, allPasswords: string[]): boolean {
  return allPasswords.filter(p => p === password).length > 1;
}

export function isPasswordCompromised(password: string): boolean {
  // In a real application, this would check against known breached password databases
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
}

export function encryptPassword(password: string, masterKey: string): string {
  // Simple XOR encryption for demo purposes
  // In a real application, use proper encryption like AES
  let encrypted = '';
  for (let i = 0; i < password.length; i++) {
    const keyChar = masterKey.charCodeAt(i % masterKey.length);
    const passwordChar = password.charCodeAt(i);
    encrypted += String.fromCharCode(passwordChar ^ keyChar);
  }
  return btoa(encrypted);
}

export function decryptPassword(encryptedPassword: string, masterKey: string): string {
  // Simple XOR decryption for demo purposes
  try {
    const encrypted = atob(encryptedPassword);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = masterKey.charCodeAt(i % masterKey.length);
      const encryptedChar = encrypted.charCodeAt(i);
      decrypted += String.fromCharCode(encryptedChar ^ keyChar);
    }
    return decrypted;
  } catch {
    return encryptedPassword; // Return as-is if decryption fails
  }
}