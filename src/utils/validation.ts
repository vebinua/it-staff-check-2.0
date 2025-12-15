import { ITCheckEntry, ValidationResult } from '../types';
import { PREMIUM_DEPARTMENTS } from '../types';

export function validateEntry(entry: ITCheckEntry): ValidationResult {
  const failedFields: string[] = [];
  
  const isPremiumDepartment = PREMIUM_DEPARTMENTS.includes(entry.department);

  // Validate processor
  if (!isProcessorValid(entry, isPremiumDepartment)) {
    failedFields.push('Processor');
  }

  // Validate memory (minimum 16GB)
  if (!isMemoryValid(entry.memory)) {
    failedFields.push('Memory');
  }

  // Validate graphics
  if (!isGraphicsValid(entry, isPremiumDepartment)) {
    failedFields.push('Graphics');
  }

  // Validate storage (minimum 1TB)
  if (!isStorageValid(entry.storage, isPremiumDepartment)) {
    failedFields.push('Storage');
  }

  // Validate internet speed (average of three tests)
  if (!isInternetSpeedValid(entry)) {
    failedFields.push('Internet Speed');
  }

  // Validate operating system
  if (!isOperatingSystemValid(entry, isPremiumDepartment)) {
    failedFields.push('Operating System');
  }

  return {
    passed: failedFields.length === 0,
    failedFields,
  };
}

function isProcessorValid(entry: ITCheckEntry, isPremiumDepartment: boolean): boolean {
  if (entry.computerType === 'Mac') {
    // Apple M-series processors are all valid
    return !!entry.processor.macProcessor && entry.processor.macProcessor.startsWith('M');
  }

  if (entry.computerType === 'Windows') {
    const { brand, series, generation } = entry.processor;
    
    if (brand === 'Intel') {
      if (isPremiumDepartment) {
        // Premium departments: Intel Core i5 (11th Gen) or newer
        if (series === 'Core i3') return false;
        if (series === 'Core i5' || series === 'Core i7' || series === 'Core i9') {
          const genNumber = parseInt(generation?.replace(/\D/g, '') || '0');
          return genNumber >= 11;
        }
      } else {
        // Other departments: Intel Core i5 (11th Gen) or newer
        if (series === 'Core i3') return false;
        if (series === 'Core i5' || series === 'Core i7' || series === 'Core i9') {
          const genNumber = parseInt(generation?.replace(/\D/g, '') || '0');
          return genNumber >= 11;
        }
      }
    }
    
    if (brand === 'AMD') {
      if (isPremiumDepartment) {
        // Premium departments: AMD Ryzen 5/7/9 are valid
        return ['Ryzen 5', 'Ryzen 7', 'Ryzen 9'].includes(series || '');
      } else {
        // Other departments: AMD Ryzen 5/7/9 are valid
        return ['Ryzen 5', 'Ryzen 7', 'Ryzen 9'].includes(series || '');
      }
    }
  }

  return false;
}

function isMemoryValid(memory: string): boolean {
  // Minimum 16GB for all departments
  const memoryNumber = parseInt(memory.replace(/\D/g, ''));
  return memoryNumber >= 16;
}

function isGraphicsValid(entry: ITCheckEntry, isPremiumDepartment: boolean): boolean {
  const graphics = entry.graphics.toLowerCase();
  
  if (isPremiumDepartment) {
    // Check if this is Creative department (Video Editor requirements)
    if (entry.department === 'Creative') {
      // Creative department requires NVIDIA RTX 2050 or better for Video Editor
      if (graphics.includes('nvidia') && graphics.includes('rtx')) {
        const rtxMatch = graphics.match(/rtx\s*(\d+)/);
        if (rtxMatch) {
          const rtxNumber = parseInt(rtxMatch[1]);
          return rtxNumber >= 2050;
        }
      }
      // Also check for just RTX without NVIDIA prefix
      if (graphics.includes('rtx')) {
        const rtxMatch = graphics.match(/rtx\s*(\d+)/);
        if (rtxMatch) {
          const rtxNumber = parseInt(rtxMatch[1]);
          return rtxNumber >= 2050;
        }
      }
      return false;
    } else {
      // Other premium departments (Graphic Designer): Intel Iris XE Graphics or better
      if (graphics.includes('iris xe') || graphics.includes('iris xe graphics')) {
        return true;
      }
      // Also accept dedicated graphics cards (better than minimum)
      if (graphics.includes('rtx') || graphics.includes('gtx') || graphics.includes('radeon')) {
        return true;
      }
      // Accept NVIDIA cards
      if (graphics.includes('nvidia')) {
        return true;
      }
      // Accept M-series integrated graphics for Mac
      if (entry.computerType === 'Mac' && (graphics.includes('integrated') || graphics.includes('apple'))) {
        return true;
      }
      return false;
    }
  } else {
    // Other departments: Any graphics are acceptable (integrated sufficient)
    return true;
  }
}

function isStorageValid(storage: string, isPremiumDepartment: boolean): boolean {
  if (isPremiumDepartment) {
    // Premium departments: Minimum 1TB
    if (storage === '1TB') return true;
    
    const storageNumber = parseInt(storage.replace(/\D/g, ''));
    // Convert TB to GB for comparison
    if (storage.includes('TB')) {
      return storageNumber >= 1;
    }
    // If in GB, must be at least 1000GB (1TB)
    return storageNumber >= 1000;
  } else {
    // Other departments: Minimum 512GB
    if (storage === '1TB') return true;
    if (storage === '512GB') return true;
    
    const storageNumber = parseInt(storage.replace(/\D/g, ''));
    // Convert TB to GB for comparison
    if (storage.includes('TB')) {
      return storageNumber >= 1;
    }
    // If in GB, must be at least 512GB
    return storageNumber >= 512;
  }
}

function isInternetSpeedValid(entry: ITCheckEntry): boolean {
  if (entry.speedTests.length < 3) return false;
  
  // Calculate averages
  const avgDownload = entry.speedTests.reduce((sum, test) => sum + test.downloadSpeed, 0) / entry.speedTests.length;
  const avgUpload = entry.speedTests.reduce((sum, test) => sum + test.uploadSpeed, 0) / entry.speedTests.length;
  const avgPing = entry.speedTests.reduce((sum, test) => sum + test.ping, 0) / entry.speedTests.length;
  
  return avgDownload >= 20 && avgUpload >= 5 && avgPing <= 50;
}

function isOperatingSystemValid(entry: ITCheckEntry, isPremiumDepartment: boolean): boolean {
  if (entry.computerType === 'Windows') {
    // Both premium and other departments: Windows 11 Pro only
    return entry.operatingSystem === 'Windows 11 Pro';
  }
  
  if (entry.computerType === 'Mac') {
    // Both premium and other departments: macOS Sonoma or later
    const validMacOS = ['Sonoma', 'Sequoia'];
    return validMacOS.includes(entry.operatingSystem);
  }
  
  return false;
}