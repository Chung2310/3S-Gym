// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../src/components/Navbar';

describe('Navbar account navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'token-test');
    localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'ADMIN' }));
  });

  it('links the desktop account name to the role-aware portal entry', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Mở trang làm việc của admin' })).toHaveAttribute('href', '/portal');
  });

  it('links the mobile account name to the role-aware portal entry', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);

    fireEvent.click(screen.getByLabelText('Mở menu điều hướng'));

    const accountLinks = screen.getAllByRole('link', { name: 'Mở trang làm việc của admin' });
    expect(accountLinks).toHaveLength(2);
    expect(accountLinks[1]).toHaveAttribute('href', '/portal');
  });
});
