import { describe, it, expect } from 'vitest';
import { isAllowedUpload } from '@/middleware/upload';

describe('upload allowlist (B4)', () => {
  it('accepts a genuine image with matching MIME', () => {
    expect(isAllowedUpload('photo.jpg', 'image/jpeg')).toBe(true);
    expect(isAllowedUpload('scan.PDF', 'application/pdf')).toBe(true);
  });

  it('rejects SVG (script-carrying vector)', () => {
    expect(isAllowedUpload('icon.svg', 'image/svg+xml')).toBe(false);
  });

  it('rejects a double extension (x.php.jpg is only allowed if MIME matches jpg)', () => {
    // extension resolves to .jpg — allowed ONLY with a matching image/jpeg MIME
    expect(isAllowedUpload('shell.php.jpg', 'application/x-httpd-php')).toBe(false);
  });

  it('rejects MIME spoofing (exe claiming to be jpeg by extension only)', () => {
    expect(isAllowedUpload('malware.exe', 'image/jpeg')).toBe(false);
  });

  it('rejects an executable outright', () => {
    expect(isAllowedUpload('run.sh', 'application/x-sh')).toBe(false);
  });

  it('rejects a disallowed extension even with a known MIME', () => {
    expect(isAllowedUpload('archive.zip', 'application/zip')).toBe(false);
  });
});
