// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from './AppShell';

describe('AppShell', () => {
  it('hiển thị vai trò và nội dung portal', () => {
    render(<MemoryRouter><AppShell user={{ username: 'pt-minh', fullName: 'PT Minh', role: 'PT' }}><div>Nội dung CRM</div></AppShell></MemoryRouter>);
    expect(screen.getAllByText('PT Minh')).toHaveLength(2);
    expect(screen.getByText('Nội dung CRM')).toBeInTheDocument();
  });
});
