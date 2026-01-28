/**
 * Safely parses a JSON string into a typed value.
 * If parsing fails, returns the fallback value and optionally logs the error.
 * 
 * @param jsonString The JSON string to parse
 * @param fallback The value to return if parsing fails
 * @param errorLabel Optional label for the console error log
 * @returns The parsed value or the fallback
 */
export function safeJsonParse<T>(
  jsonString: string | null | undefined, 
  fallback: T, 
  errorLabel?: string
): T {
  if (!jsonString) {
    return fallback;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    if (errorLabel) {
      console.error(`Error parsing JSON (${errorLabel}):`, error);
    }
    return fallback;
  }
}

/**
 * Validates if a parsed object matches a predicate/schema.
 * If validation fails, returns the fallback.
 */
export function validateAndParse<T>(
  jsonString: string | null | undefined,
  validator: (data: any) => data is T,
  fallback: T,
  errorLabel?: string
): T {
  const parsed = safeJsonParse(jsonString, fallback, errorLabel);
  if (parsed === fallback) return fallback;
  
  if (validator(parsed)) {
    return parsed;
  }
  
  if (errorLabel) {
    console.error(`Validation failed for JSON (${errorLabel})`);
  }
  return fallback;
}
