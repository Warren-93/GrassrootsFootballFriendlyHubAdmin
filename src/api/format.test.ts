import { describe, expect, it } from 'vitest';
import { safeLink } from './format';

describe('safeLink', () => {
  it('keeps http and https addresses', () => {
    expect(safeLink('https://myclub.co.uk/about')).toBe('https://myclub.co.uk/about');
    expect(safeLink(' http://fulltime.thefa.com ')).toBe('http://fulltime.thefa.com/');
  });

  it('refuses addresses that would run script or open something else', () => {
    expect(safeLink('javascript:alert(1)')).toBeNull();
    expect(safeLink('JAVASCRIPT:alert(1)')).toBeNull();
    expect(safeLink('java\tscript:alert(1)')).toBeNull();
    expect(safeLink('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeLink('mailto:someone@example.com')).toBeNull();
  });

  it('treats plain text and bare domains as text', () => {
    expect(safeLink('myclub.co.uk')).toBeNull();
    expect(safeLink('Registered with the county FA')).toBeNull();
  });
});
